#!/usr/bin/env python3
"""Extract Palworld world-map textures straight from the game's own pak.

Reads Pal-Windows.pak (unencrypted, index v11, Oodle-compressed), decodes the
cooked Texture2D assets the map UI uses, and writes PNG + DDS.

Requires: Pillow. Oodle decompression uses an oo2core_*.dll already present on
the machine (any game that ships one will do); pass --oodle to point at it.

Usage:
    python tools/extract_map_textures.py --out build/map
    python tools/extract_map_textures.py --list worldmap
"""
from __future__ import annotations

import argparse
import ctypes
import glob
import io
import os
import re
import struct
import sys

PAK_DEFAULT = r"C:\Games\Steam\steamapps\common\Palworld\Pal\Content\Paks\Pal-Windows.pak"
PAK_MAGIC = 0x5A6F12E1

# The textures the world-map UI actually references, via DT_WorldMapUIData.
MAP_ASSETS = [
    "Pal/Content/Pal/Texture/UI/Map/T_WorldMap",                # 8192^2 main map
    "Pal/Content/Pal/Texture/UI/Map/T_TreeMap",                 # 8192^2 World Tree region
    "Pal/Content/Pal/Texture/UI/Map/T_MainWorld5_DefaultMask",  # fog-of-war default
    "Pal/Content/Pal/Texture/UI/Map/T_WorldMap_DefaultAllMask",
    "Pal/Content/Pal/Texture/UI/Map/T_UI_Map_Skyland_Mask",
    "Pal/Content/Pal/Texture/UI/Map/T_UI_Map_Skyland_Cloud_0",
    "Pal/Content/Pal/Texture/UI/Map/T_UI_Map_Skyland_Cloud_1",
    "Pal/Content/Pal/Texture/UI/Map/T_UI_Map_Skyland_Cloud_2",
    "Pal/Content/Pal/Texture/UI/Map/T_MapMask_WorldTree_a",
    "Pal/Content/Pal/Texture/UI/Map/T_MapMask_WorldTree_b",
]


# --------------------------------------------------------------------------
# Oodle
# --------------------------------------------------------------------------

def find_oodle(explicit: str | None = None) -> str:
    if explicit:
        return explicit
    roots = [
        r"C:\Program Files (x86)\Steam\steamapps\common",
        r"C:\Games\Steam\steamapps\common",
        r"D:\Steam\steamapps\common",
        r"D:\SteamLibrary\steamapps\common",
    ]
    for root in roots:
        if not os.path.isdir(root):
            continue
        hits = []
        for pat in ("*/oo2core_*_win64.dll", "*/*/oo2core_*_win64.dll"):
            hits += glob.glob(os.path.join(root, pat))
        hits = [h for h in hits if "debug" not in os.path.basename(h).lower()]
        if hits:
            # prefer the newest core; older ones may not decode newer streams
            def ver(p):
                m = re.search(r"oo2core_(\d+)_win64", os.path.basename(p), re.I)
                return int(m.group(1)) if m else 0
            return max(hits, key=ver)
    raise SystemExit(
        "No oo2core_*_win64.dll found. Pass --oodle <path>. Any installed game\n"
        "that ships Oodle has one; decompression is version-compatible."
    )


class Oodle:
    def __init__(self, path: str):
        self.path = path
        self._fn = ctypes.WinDLL(path).OodleLZ_Decompress
        self._fn.restype = ctypes.c_size_t
        self._fn.argtypes = [
            ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t,
            ctypes.c_int, ctypes.c_int, ctypes.c_int,
            ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_void_p,
            ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int,
        ]

    def __call__(self, src: bytes, out_size: int) -> bytes:
        dst = ctypes.create_string_buffer(out_size)
        n = self._fn(src, len(src), dst, out_size, 1, 0, 0,
                     None, 0, None, None, None, 0, 3)
        if n != out_size:
            raise RuntimeError(f"Oodle returned {n}, expected {out_size}")
        return dst.raw[:out_size]


# --------------------------------------------------------------------------
# pak
# --------------------------------------------------------------------------

class _R:
    def __init__(self, b, o=0):
        self.b, self.o = b, o

    def _un(self, fmt, n):
        v = struct.unpack_from(fmt, self.b, self.o)[0]
        self.o += n
        return v

    u32 = lambda s: s._un("<I", 4)          # noqa: E731
    i32 = lambda s: s._un("<i", 4)          # noqa: E731
    i64 = lambda s: s._un("<q", 8)          # noqa: E731
    u64 = lambda s: s._un("<Q", 8)          # noqa: E731

    def raw(self, n):
        v = self.b[self.o:self.o + n]
        self.o += n
        return v

    def fstring(self):
        n = self.i32()
        if n == 0:
            return ""
        if n > 0:
            return self.raw(n).split(b"\x00")[0].decode("utf-8", "replace")
        return self.raw(-n * 2).decode("utf-16-le", "replace").split("\x00")[0]


class Pak:
    """Reader for an unencrypted UE4/UE5 pak with a full directory index."""

    def __init__(self, path: str, oodle: Oodle):
        self.path, self.oodle = path, oodle
        self.f = open(path, "rb")
        self._read_index()

    def _read_index(self):
        self.f.seek(-1024, os.SEEK_END)
        tail = self.f.read(1024)
        pos = next((i for i in range(len(tail) - 4)
                    if struct.unpack_from("<I", tail, i)[0] == PAK_MAGIC), None)
        if pos is None:
            raise RuntimeError("pak footer magic not found")

        self.version = struct.unpack_from("<I", tail, pos + 4)[0]
        index_off, index_size = struct.unpack_from("<QQ", tail, pos + 8)

        names = tail[pos + 44:]
        self.methods = ["None"]
        for i in range(0, min(len(names), 160), 32):
            n = names[i:i + 32].split(b"\x00")[0].decode("ascii", "replace")
            if n:
                self.methods.append(n)

        self.f.seek(index_off)
        r = _R(self.f.read(index_size))
        r.fstring()                                   # mount point
        n_entries = r.i32()
        r.u64()                                       # path hash seed
        if r.i32():
            r.i64(), r.i64(), r.raw(20)
        if not r.i32():
            raise RuntimeError("pak has no full directory index")
        fdi_off, fdi_size = r.i64(), r.i64()
        r.raw(20)
        self.encoded = r.raw(r.i32())

        self.f.seek(fdi_off)
        d = _R(self.f.read(fdi_size))
        self.files = {}
        for _ in range(d.i32()):
            dirname = d.fstring()
            for _ in range(d.i32()):
                # keep these on separate lines: in `d[k()] = v()` Python
                # evaluates v() first, which would reverse the read order
                fname = d.fstring()
                self.files[dirname + fname] = d.u32()
        assert len(self.files) == n_entries

    def _entry(self, path):
        r = _R(self.encoded, self.files[path])
        v = r.u32()
        off32, usize32, size32 = v & 0x80000000, v & 0x40000000, v & 0x20000000
        method = (v >> 23) & 0x3F
        encrypted = bool(v & (1 << 22))
        nblocks = (v >> 6) & 0xFFFF
        bs = v & 0x3F
        block_size = r.u32() if bs == 0x3F else bs << 11
        offset = r.u32() if off32 else r.u64()
        usize = r.u32() if usize32 else r.u64()
        size = (r.u32() if size32 else r.u64()) if method else usize

        hdr = 8 + 8 + 8 + 20 + 4 + 1 + 4
        if method:
            hdr += 4 + 16 * nblocks
        blocks = []
        if nblocks == 1 and not encrypted:
            blocks.append((hdr, hdr + size))
        elif nblocks > 0:
            align = 16 if encrypted else 1
            cur = hdr
            for _ in range(nblocks):
                n = r.u32()
                blocks.append((cur, cur + n))
                cur += -(-n // align) * align
        else:
            blocks.append((hdr, hdr + size))
        return offset, usize, size, method, encrypted, block_size, blocks

    def read(self, path: str) -> bytes:
        offset, usize, size, method, encrypted, block_size, blocks = self._entry(path)
        if encrypted:
            raise RuntimeError(f"{path} is encrypted")
        name = self.methods[method] if method < len(self.methods) else "?"
        out = bytearray()
        for start, end in blocks:
            self.f.seek(offset + start)
            chunk = self.f.read(end - start)
            if method == 0:
                out += chunk
            elif name.lower() == "oodle":
                out += self.oodle(chunk, min(block_size or usize, usize - len(out)))
            elif name.lower() == "zlib":
                import zlib
                out += zlib.decompress(chunk)
            else:
                raise RuntimeError(f"unsupported compression {name}")
        return bytes(out[:usize])


# --------------------------------------------------------------------------
# cooked Texture2D
# --------------------------------------------------------------------------

BD_PAYLOAD_AT_EOF = 0x0001
BD_SEPARATE_FILE = 0x0100
BD_SIZE_64BIT = 0x2000

FORMATS = {
    "PF_DXT1": (b"DXT1", 98), "PF_DXT3": (b"DXT3", 98), "PF_DXT5": (b"DXT5", 98),
    "PF_BC4": (b"BC4U", 80), "PF_BC5": (b"BC5U", 83), "PF_BC7": (b"DX10", 98),
    "PF_G8": (None, 0), "PF_B8G8R8A8": (None, 0),
}


def parse_texture(uexp: bytes, ubulk: bytes = b""):
    for pf in FORMATS:
        probe = struct.pack("<i", len(pf) + 1) + pf.encode() + b"\x00"
        i = uexp.find(probe)
        if i >= 0:
            break
    else:
        raise RuntimeError("no recognised PF_ pixel format in uexp")

    size_x, size_y, _packed = struct.unpack_from("<iii", uexp, i - 12)
    o = i + len(probe)
    _first, num_mips = struct.unpack_from("<ii", uexp, o)
    o += 8

    mips = []
    for _ in range(num_mips):
        flags = struct.unpack_from("<I", uexp, o)[0]
        o += 4
        if flags & BD_SIZE_64BIT:
            _count, disk = struct.unpack_from("<qq", uexp, o); o += 16
        else:
            _count, disk = struct.unpack_from("<ii", uexp, o); o += 8
        boff = struct.unpack_from("<q", uexp, o)[0]; o += 8
        if flags & (BD_SEPARATE_FILE | BD_PAYLOAD_AT_EOF):
            data = ubulk[boff:boff + disk]
        else:
            data = uexp[o:o + disk]
            o += disk
        w, h, _d = struct.unpack_from("<iii", uexp, o); o += 12
        mips.append({"w": w, "h": h, "data": data})
    return {"format": pf, "width": size_x, "height": size_y, "mips": mips}


def to_dds(tex, mip=0) -> bytes:
    fourcc, dxgi = FORMATS[tex["format"]]
    if fourcc is None:
        raise RuntimeError(f"{tex['format']} is uncompressed; DDS export not wired up")
    m = tex["mips"][mip]
    h = io.BytesIO()
    h.write(b"DDS " + struct.pack("<I", 124))
    h.write(struct.pack("<I", 0x1 | 0x2 | 0x4 | 0x1000 | 0x80000))
    h.write(struct.pack("<II", m["h"], m["w"]))
    h.write(struct.pack("<I", len(m["data"])))
    h.write(struct.pack("<II", 0, 1))
    h.write(b"\x00" * 44)
    h.write(struct.pack("<II", 32, 0x4) + fourcc + b"\x00" * 20)
    h.write(struct.pack("<I", 0x1000) + b"\x00" * 16)
    if fourcc == b"DX10":
        h.write(struct.pack("<IIIII", dxgi, 3, 0, 1, 0))
    h.write(m["data"])
    return h.getvalue()


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pak", default=PAK_DEFAULT)
    ap.add_argument("--out", default="build/map")
    ap.add_argument("--oodle", default=None, help="path to oo2core_*_win64.dll")
    ap.add_argument("--list", metavar="SUBSTRING",
                    help="list pak paths containing SUBSTRING instead of extracting")
    ap.add_argument("--asset", action="append",
                    help="extract this pak asset path (no extension); repeatable")
    ap.add_argument("--keep-dds", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.pak):
        raise SystemExit(f"pak not found: {args.pak}")

    oodle = Oodle(find_oodle(args.oodle))
    print(f"oodle : {oodle.path}")
    pak = Pak(args.pak, oodle)
    print(f"pak   : v{pak.version}, {len(pak.files):,} files, methods={pak.methods}")

    if args.list:
        needle = args.list.lower()
        for p in sorted(pak.files):
            if needle in p.lower():
                print("  " + p)
        return

    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None

    os.makedirs(args.out, exist_ok=True)
    for asset in (args.asset or MAP_ASSETS):
        name = asset.rsplit("/", 1)[-1]
        if asset + ".uexp" not in pak.files:
            print(f"  !! {name}: not in pak")
            continue
        uexp = pak.read(asset + ".uexp")
        ubulk = pak.read(asset + ".ubulk") if asset + ".ubulk" in pak.files else b""
        try:
            tex = parse_texture(uexp, ubulk)
        except Exception as exc:                       # noqa: BLE001
            print(f"  !! {name}: {exc}")
            continue

        dds = to_dds(tex, 0)
        if args.keep_dds:
            with open(os.path.join(args.out, name + ".dds"), "wb") as fh:
                fh.write(dds)
        img = Image.open(io.BytesIO(dds))
        img.load()
        png = os.path.join(args.out, f"{name}.png")
        img.convert("RGBA" if "Mask" in name or "Cloud" in name else "RGB").save(png)
        print(f"  ok {name:<30} {tex['format']:<9} "
              f"{tex['width']}x{tex['height']}  mips={len(tex['mips'])}  -> {png}")


if __name__ == "__main__":
    sys.exit(main())
