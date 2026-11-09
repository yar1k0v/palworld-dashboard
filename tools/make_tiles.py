#!/usr/bin/env python3
"""One-command map setup: game install -> public/tiles and public/tiles-tree.

Reads the textures from YOUR OWN Palworld install and writes tiles on your
machine. Nothing is downloaded and nothing is redistributed.

Usage:
    python tools/make_tiles.py [--pak <path to Pal-Windows.pak>] [--oodle <oo2core dll>]
"""
import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def run(*args: str) -> None:
    subprocess.run([sys.executable, *args], cwd=ROOT, check=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--pak", help="path to Pal-Windows.pak")
    ap.add_argument("--oodle", help="path to oo2core_*_win64.dll")
    a = ap.parse_args()

    extract = [str(HERE / "extract_map_textures.py"), "--out", "build/map"]
    if a.pak:
        extract += ["--pak", a.pak]
    if a.oodle:
        extract += ["--oodle", a.oodle]
    run(*extract)

    for src, out in (("T_WorldMap", "public/tiles"), ("T_TreeMap", "public/tiles-tree")):
        run(str(HERE / "build_tiles.py"), "--src", f"build/map/{src}.png", "--out", out, "--clean")
    print("\nDone. Start the dev server or mount public/tiles* into the container.")


if __name__ == "__main__":
    main()
