#!/usr/bin/env python3
"""Slice an extracted map texture into an XYZ tile pyramid.

The source is square and power-of-two, so every level below native is an exact
LANCZOS downscale and the native level is a pure crop (verified lossless).

Usage:
    python tools/build_tiles.py --src build/map/T_WorldMap.png --out public/tiles-v2
    python tools/build_tiles.py --src build/map/T_TreeMap.png  --out public/tiles-tree
"""
from __future__ import annotations

import argparse
import os
import shutil

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
TILE = 256


def build(src_path: str, out: str, maxz: int | None, clean: bool) -> None:
    src = Image.open(src_path).convert("RGB")
    if src.width != src.height:
        raise SystemExit(f"source must be square, got {src.size}")
    native = src.width // TILE
    if native & (native - 1):
        raise SystemExit(f"source/{TILE} must be a power of two, got {native}")
    native_z = native.bit_length() - 1
    if maxz is None:
        maxz = native_z

    print(f"source : {src_path} {src.width}x{src.height}  (native z{native_z})")
    if maxz > native_z:
        print(f"warning: z{maxz} exceeds native z{native_z}; those levels are upscaled")

    if clean and os.path.isdir(out):
        shutil.rmtree(out)

    total = 0
    for z in range(maxz + 1):
        n = 2 ** z
        side = n * TILE
        level = src if side == src.width else src.resize((side, side), Image.LANCZOS)
        for x in range(n):
            d = os.path.join(out, str(z), str(x))
            os.makedirs(d, exist_ok=True)
            for y in range(n):
                level.crop((x * TILE, y * TILE, (x + 1) * TILE, (y + 1) * TILE)) \
                     .save(os.path.join(d, f"{y}.png"), optimize=True)
        total += n * n
        print(f"  z{z}: {n*n:>5} tiles at {side}px")

    size = sum(os.path.getsize(os.path.join(r, f))
               for r, _, fs in os.walk(out) for f in fs)
    print(f"total  : {total:,} tiles, {size/1e6:.1f} MB -> {out}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--maxz", type=int, default=None,
                    help="deepest zoom (default: native, i.e. no upscaling)")
    ap.add_argument("--clean", action="store_true", help="wipe --out first")
    args = ap.parse_args()
    build(args.src, args.out, args.maxz, args.clean)


if __name__ == "__main__":
    main()
