const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

const root = path.dirname(require.resolve("../package.json"));
const manifest = require("../assets/runtime-images.json");
const images = new Map(manifest.images.map((image) => [image.source, image]));
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const digest = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function runtimeImagePath(source) {
  return images.get(source)?.file || source;
}

function resolveRuntimeImage(moduleName, originModulePath) {
  if (!moduleName.startsWith(".") && !path.isAbsolute(moduleName))
    return moduleName;
  const source = relative(
    path.resolve(path.dirname(originModulePath), moduleName),
  );
  const image = images.get(source);
  return image ? path.join(root, image.file) : moduleName;
}

function verifyRuntimeImages() {
  for (const image of manifest.images) {
    const runtime = path.join(root, image.file);
    if (!fs.existsSync(runtime) || digest(runtime) !== image.fileSha256)
      throw Error(
        `Missing or changed runtime image: ${image.file}. Run npm run assets:pack.`,
      );
    const source = path.join(root, image.source);
    // Masters are intentionally absent from EAS uploads. Local edits must be
    // repacked before Metro can silently render an outdated compressed copy.
    if (fs.existsSync(source) && digest(source) !== image.sourceSha256)
      throw Error(
        `Image master changed: ${image.source}. Run npm run assets:pack.`,
      );
  }
}

module.exports = {
  root,
  manifest,
  runtimeImagePath,
  resolveRuntimeImage,
  verifyRuntimeImages,
};
