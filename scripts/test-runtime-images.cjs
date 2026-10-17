const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const initSkia = require("canvaskit-wasm/bin/full/canvaskit.js");
const {
  root,
  manifest,
  resolveRuntimeImage,
  verifyRuntimeImages,
} = require("./runtime-image-assets.cjs");

(async () => {
  verifyRuntimeImages();
  assert.equal(manifest.encoder.format, "webp-lossless");
  assert.equal(manifest.encoder.exact, true);
  assert.ok(manifest.images.length > 100);
  const skia = await initSkia({
    wasmBinary: fs.readFileSync(
      require.resolve("canvaskit-wasm/bin/full/canvaskit.wasm"),
    ),
  });
  let checked = 0;
  for (const image of manifest.images) {
    const source = path.join(root, image.source),
      runtime = path.join(root, image.file);
    const data = fs.readFileSync(runtime);
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WEBP");
    assert.ok(
      data.includes(Buffer.from("VP8L")),
      `Must use the lossless codec: ${image.file}`,
    );
    assert.ok(image.fileBytes < image.sourceBytes);
    const origin = path.join(root, "src/components/combat-sheets.ts");
    const request = path.relative(path.dirname(origin), source);
    assert.equal(resolveRuntimeImage(request, origin), runtime);
    const decoded = skia.MakeImageFromEncoded(data);
    assert.ok(decoded, `Skia cannot decode ${image.file}`);
    assert.equal(decoded.width(), image.width);
    assert.equal(decoded.height(), image.height);
    if (fs.existsSync(source)) {
      const original = skia.MakeImageFromEncoded(fs.readFileSync(source));
      assert.ok(original, image.source);
      const info = {
        width: image.width,
        height: image.height,
        colorType: skia.ColorType.RGBA_8888,
        alphaType: skia.AlphaType.Unpremul,
        colorSpace: skia.ColorSpace.SRGB,
      };
      const before = original.readPixels(0, 0, info);
      const after = decoded.readPixels(0, 0, info);
      assert.ok(before && after, `Unable to compare pixels: ${image.source}`);
      assert.ok(
        Buffer.from(before).equals(Buffer.from(after)),
        `Skia pixels changed: ${image.file}`,
      );
      original.delete();
    }
    decoded.delete();
    checked++;
    if (checked % 20 === 0)
      console.log(`PASS ${checked} pixel-identical Skia images`);
  }
  for (const request of ["react", "expo-image", "./missing-image.png"])
    assert.equal(
      resolveRuntimeImage(request, path.join(root, "src/app/_layout.tsx")),
      request,
    );
  console.log(
    `PASS ${checked} lossless images: identical Skia pixels and dimensions; asset aliases and hashes verified.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
