"""Read-only QA of the generated market expansion; Pillow is required."""
import hashlib
import json
import re
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "assets/expansion/generation-manifest.json").read_text())
bounds_source = (root / "src/game/market-icon-bounds.ts").read_text()
item_bounds = json.loads(re.sub(r",(\s*\])", r"\1", bounds_source.split(" = ", 1)[1].strip().removesuffix(";")))
frames = 0
for spec in manifest["characters"] + manifest["items"]:
    with Image.open(root / spec["file"]) as source:
        image = source.convert("RGBA")
    width, height = image.size
    columns, rows = spec["columns"], spec["rows"]
    assert abs((width / columns) / (height / rows) - 1) < .02, spec["id"]
    assert image.getchannel("A").getextrema() == (0, 255), spec["id"]
    hashes = set()
    for row in range(rows):
        for column in range(columns):
            if spec in manifest["items"]:
                tier = manifest["items"].index(spec)
                box = item_bounds[tier][row * columns + column]
                assert 0 <= box[0] < box[2] <= width, (spec["id"], column)
                assert 0 <= box[1] < box[3] <= height, (spec["id"], row)
                tile = image.crop(box)
            else:
                tile = image.crop((round(column * width / columns), round(row * height / rows),
                                   round((column + 1) * width / columns), round((row + 1) * height / rows)))
            coverage = sum(tile.getchannel("A").histogram()[40:]) / (tile.width * tile.height)
            assert coverage > .035, (spec["id"], row, column, "empty cell")
            hashes.add(hashlib.sha256(tile.tobytes()).hexdigest())
            frames += 1
    assert len(hashes) == rows * columns, (spec["id"], "duplicate cells")
print(f"PASS {frames} distinct, nonempty transparent cells: 480 animation frames and 180 item icons")
