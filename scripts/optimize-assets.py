"""Losslessly optimize PNG image data without changing artwork or metadata.

Requires Pillow. Run `python scripts/optimize-assets.py --write` to apply.
Only IDAT chunks change: every other PNG chunk, including color profiles, stays
byte-for-byte intact. Dimensions and decoded RGBA pixels are checked before
atomically replacing a file, and a smaller result is required.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import os
from pathlib import Path
import struct

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIGNATURE = b"\x89PNG\r\n\x1a\n"


def chunks(data):
    if data[:8] != SIGNATURE:
        raise ValueError("Not a PNG")
    cursor = 8
    while cursor < len(data):
        length = struct.unpack(">I", data[cursor:cursor + 4])[0]
        end = cursor + length + 12
        if end > len(data):
            raise ValueError("Truncated PNG")
        yield data[cursor + 4:cursor + 8], data[cursor:end]
        cursor = end


def optimize(path, write):
    if not path.resolve().is_relative_to(ASSETS.resolve()):
        raise ValueError("Asset escaped project directory")
    original = path.read_bytes()
    original_chunks = list(chunks(original))
    if any(kind == b"acTL" for kind, _ in original_chunks):
        return len(original), len(original), False
    with Image.open(BytesIO(original)) as image:
        before = image.convert("RGBA").tobytes()
        size = image.size
        output = BytesIO()
        image.save(output, format="PNG", optimize=True, compress_level=9)
    optimized_chunks = list(chunks(output.getvalue()))
    # Retaining the original PNG header also retains bit depth and interlacing.
    if original_chunks[0] != optimized_chunks[0]:
        return len(original), len(original), False
    image_data = b"".join(raw for kind, raw in optimized_chunks if kind == b"IDAT")
    result = bytearray(SIGNATURE)
    inserted = False
    for kind, raw in original_chunks:
        if kind == b"IDAT":
            if not inserted:
                result.extend(image_data)
                inserted = True
        else:
            result.extend(raw)
    if len(result) >= len(original) - 1024:
        return len(original), len(original), False
    with Image.open(BytesIO(result)) as candidate:
        candidate.verify()
    with Image.open(BytesIO(result)) as candidate:
        if candidate.size != size or candidate.convert("RGBA").tobytes() != before:
            raise ValueError(f"Pixel verification failed: {path}")
    if write:
        # Never overwrite an asset edited while optimization was running.
        if path.read_bytes() != original:
            raise ValueError(f"Asset changed during optimization: {path}")
        temporary = path.with_suffix(".png.optimize.tmp")
        try:
            temporary.write_bytes(result)
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)
    return len(original), len(result), True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    paths = sorted(ASSETS.rglob("*.png"))
    total_before = total_after = changed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for index, (before, after, optimized) in enumerate(
            pool.map(lambda path: optimize(path, args.write), paths), 1
        ):
            total_before += before
            total_after += after
            changed += optimized
            if index % 10 == 0 or index == len(paths):
                print(
                    f"{index}/{len(paths)} PNGs verified; "
                    f"{changed} smaller; saved {(total_before-total_after)/1_000_000:.1f} MB",
                    flush=True,
                )
    print(
        f"{'Applied' if args.write else 'Preview'}: {changed} files; "
        f"{total_before:,} -> {total_after:,} bytes. "
        "Pixels, dimensions and metadata preserved.",
        flush=True,
    )


if __name__ == "__main__":
    main()
