"""Read-only raster validation. Requires Pillow; never modifies the source artwork."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageStat

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'assets/art-production-manifest.json').read_text(encoding='utf-8-sig'))
report = {'enemies': [], 'stories': [], 'npcs': [], 'generic': []}
hashes = set()
total_bytes = 0

for category in report:
    for asset in manifest.get(category, []):
        path = root / asset['path']
        total_bytes += path.stat().st_size
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert digest not in hashes, 'Duplicate raster: ' + asset['path']
        hashes.add(digest)
        with Image.open(path) as image:
            image.load()
            width, height = image.size
            record = {'id': asset['id'], 'width': width, 'height': height, 'bytes': path.stat().st_size, 'sha256': digest}
            if category == 'enemies':
                assert image.mode == 'RGBA', path
                assert width % 8 == 0 and height % 6 == 0 and width // 8 == height // 6, path
                assert image.getchannel('A').getextrema() == (0, 255), path
                cell = width // 8
                minimum_coverage = 1
                distinct_by_row = []
                for row in range(6):
                    frames = set()
                    for column in range(8):
                        frame = image.crop((column * cell, row * cell, (column + 1) * cell, (row + 1) * cell))
                        histogram = frame.getchannel('A').histogram()
                        visible = sum(histogram[32:]) / (cell * cell)
                        assert visible > .01, f'{path}: empty frame {row},{column}'
                        minimum_coverage = min(minimum_coverage, visible)
                        frames.add(hashlib.sha256(frame.tobytes()).hexdigest())
                    distinct_by_row.append(len(frames))
                assert min(distinct_by_row) >= 4, f'{path}: insufficient animated frames'
                record.update(minimum_frame_coverage=minimum_coverage, distinct_frames_per_row=distinct_by_row)
            elif category == 'stories':
                assert abs(width * 3 / height - 1.6) < .06, path
                panels = set()
                for panel in range(3):
                    region = image.crop((0, round(panel * height / 3), width, round((panel + 1) * height / 3)))
                    assert max(ImageStat.Stat(region.convert('RGB')).stddev) > 10, f'{path}: blank panel {panel}'
                    panels.add(hashlib.sha256(region.tobytes()).hexdigest())
                assert len(panels) == 3, path
            elif category == 'npcs':
                assert abs(width / height - .75) < .06, path
            else:
                assert 1.8 < width / height < 2.7, path
            report[category].append(record)

report['total_bytes'] = total_bytes
report['limits'] = 'Validates decoded pixels, alpha, frame coverage, differing frames and panel dimensions. Does not certify artistic quality or native playback.'
destination = root / 'verification/art-assets-check.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({key: len(value) for key, value in report.items() if isinstance(value, list)}))
print(f'PASS decoded assets; {total_bytes:,} bytes. Report: {destination}')
