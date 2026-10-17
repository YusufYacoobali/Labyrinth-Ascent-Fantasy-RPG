"""Create pixel-identical WebP assets while retaining the PNG authoring masters.

Requires Pillow with WebP support. Run `python scripts/pack-runtime-images.py`.
Lossless WebP's quality parameter controls compression effort, not image quality.
No resizing, color reduction, frame removal or lossy encoding is permitted.
"""

from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import re

from PIL import Image, features

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
MANIFEST = ASSETS / "runtime-images.json"
ENCODER = {"format": "webp-lossless", "method": 6, "effort": 75, "exact": True}
BEGIN = "# BEGIN lossless runtime masters"
END = "# END lossless runtime masters"


def configured_images(value):
    if isinstance(value, str) and value.startswith("./assets/"):
        yield (ROOT / value).resolve()
    elif isinstance(value, dict):
        for child in value.values():
            yield from configured_images(child)
    elif isinstance(value, list):
        for child in value:
            yield from configured_images(child)


NATIVE_IMAGES = set(configured_images(json.loads((ROOT / "app.json").read_text())))


def atomic_write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    try:
        temporary.write_bytes(content)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def runtime_sources():
    sources = set()
    pattern = re.compile(r"require\s*\(\s*[\"']([^\"']+\.png)[\"']\s*\)")
    for source in (ROOT / "src").rglob("*"):
        if source.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue
        for name in pattern.findall(source.read_text(encoding="utf-8")):
            path = (source.parent / name).resolve()
            if path.is_relative_to(ASSETS):
                sources.add(path)
    return sorted(sources)


def encode(path, previous):
    # Native icon/splash tools read their configured files directly, outside Metro.
    # Keep density variants on Metro's normal resolution path as well.
    if path in NATIVE_IMAGES or any(path.parent.glob(path.stem + "@*x" + path.suffix)):
        return None
    source = path.relative_to(ROOT).as_posix()
    data = path.read_bytes()
    source_hash = sha256(data).hexdigest()
    old = previous.get(source)
    if old and old["sourceSha256"] == source_hash:
        runtime = ROOT / old["file"]
        if runtime.exists() and sha256(runtime.read_bytes()).hexdigest() == old["fileSha256"]:
            return old
    with Image.open(BytesIO(data)) as image:
        if getattr(image, "n_frames", 1) != 1:
            return None
        # Preserve PNGs whose color-space metadata cannot be represented directly.
        if any(key in image.info for key in ("gamma", "chromaticity", "srgb")):
            return None
        rgba = image.convert("RGBA")
        pixels = rgba.tobytes()
        size = image.size
        output = BytesIO()
        metadata = {key: image.info[key] for key in ("icc_profile", "exif", "xmp") if key in image.info}
        image.save(output, format="WEBP", lossless=True, exact=True, method=6, quality=75, **metadata)
        result = output.getvalue()
        if len(result) >= len(data) - 1024:
            return None
        with Image.open(BytesIO(result)) as candidate:
            if candidate.size != size or candidate.convert("RGBA").tobytes() != pixels:
                raise ValueError(f"Lossless pixel verification failed: {source}")
            if candidate.info.get("icc_profile") != image.info.get("icc_profile"):
                raise ValueError(f"Color profile changed: {source}")
        relative = path.relative_to(ASSETS).with_suffix(".webp")
        target = ASSETS / "runtime" / relative
        if path.read_bytes() != data:
            raise ValueError(f"Source changed during compression: {source}")
        atomic_write(target, result)
        return {
            "source": source,
            "file": target.relative_to(ROOT).as_posix(),
            "width": size[0],
            "height": size[1],
            "hasAlpha": rgba.getchannel("A").getextrema()[0] < 255,
            "rgbaSha256": sha256(pixels).hexdigest(),
            "sourceSha256": source_hash,
            "fileSha256": sha256(result).hexdigest(),
            "sourceBytes": len(data),
            "fileBytes": len(result),
        }


def main():
    if not features.check("webp"):
        raise RuntimeError("This Pillow installation needs WebP support")
    previous = {}
    if MANIFEST.exists():
        saved = json.loads(MANIFEST.read_text(encoding="utf-8"))
        if saved.get("encoder") == ENCODER:
            previous = {entry["source"]: entry for entry in saved["images"]}
    sources = runtime_sources()
    images = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for index, image in enumerate(pool.map(lambda path: encode(path, previous), sources), 1):
            if image:
                images.append(image)
            if index % 10 == 0 or index == len(sources):
                saved = sum(item["sourceBytes"] - item["fileBytes"] for item in images)
                print(f"{index}/{len(sources)} verified; {len(images)} smaller WebPs; saved {saved/1_000_000:.1f} MB", flush=True)
    manifest = {"version": 1, "encoder": ENCODER, "images": images}
    atomic_write(MANIFEST, (json.dumps(manifest, indent=2) + "\n").encode())
    ignore_path = ROOT / ".easignore"
    ignore = ignore_path.read_text(encoding="utf-8")
    block = BEGIN + "\n" + "\n".join("/" + image["source"] for image in images) + "\n" + END
    if BEGIN in ignore:
        ignore = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), block, ignore, flags=re.S)
    else:
        ignore = ignore.rstrip() + "\n\n# PNG originals stay local; only verified smaller WebPs ship.\n" + block + "\n"
    atomic_write(ignore_path, ignore.encode())
    before = sum(image["sourceBytes"] for image in images)
    after = sum(image["fileBytes"] for image in images)
    print(f"Complete: {len(images)} images, {before:,} -> {after:,} bytes. Identical RGBA pixels and dimensions.", flush=True)


if __name__ == "__main__":
    main()
