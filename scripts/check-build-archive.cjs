const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const ignore = require("ignore");
const {
  runtimeImagePath,
  verifyRuntimeImages,
} = require("./runtime-image-assets.cjs");

const root = path.dirname(require.resolve("../package.json"));
const rules = ignore().add(
  fs.readFileSync(path.join(root, ".easignore"), "utf8"),
);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const required = new Set([
  "package.json",
  "package-lock.json",
  "app.json",
  "eas.json",
  "tsconfig.json",
  "metro.config.js",
  "scripts/runtime-image-assets.cjs",
  "assets/runtime-images.json",
  "src/app/_layout.tsx",
  "android/build.gradle",
  "android/settings.gradle",
  "android/gradle.properties",
  "android/gradlew",
  "android/gradle/wrapper/gradle-wrapper.jar",
  "android/app/build.gradle",
  "android/app/src/main/AndroidManifest.xml",
  "android/app/src/main/java/com/yacoobali/rpg/MainActivity.kt",
  "android/app/src/main/java/com/yacoobali/rpg/MainApplication.kt",
]);

function readSources(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) readSources(file);
    else if (/\.[jt]sx?$/.test(file)) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node) {
        if (ts.isStringLiteralLike(node) && node.text.startsWith(".")) {
          const asset = relative(path.resolve(path.dirname(file), node.text));
          if (asset.startsWith("assets/")) required.add(asset);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
}
readSources(path.join(root, "src"));
const nativeImages = new Set();
function readConfig(value) {
  if (typeof value === "string" && value.startsWith("./assets/")) {
    required.add(value.slice(2));
    nativeImages.add(value.slice(2));
  } else if (value && typeof value === "object")
    Object.values(value).forEach(readConfig);
}
readConfig(JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")));
verifyRuntimeImages();
for (const source of required) {
  const file = nativeImages.has(source) ? source : runtimeImagePath(source);
  assert.ok(
    fs.existsSync(path.join(root, file)),
    `Missing build input: ${file}`,
  );
  assert.ok(!rules.ignores(file), `Required build input excluded: ${file}`);
}

for (const junk of [
  ".git",
  "node_modules/expo/package.json",
  ".expo/dev/logs/export.log",
  ".npm-cache/_cacache/content",
  "public/canvaskit.wasm",
  "dist/index.html",
  "verification/capture.png",
  "android/app/build/outputs/apk/release/app-release.apk",
  "android/app/build/intermediates/native/library.so",
  "android/build/report.html",
  "android/app/.cxx/cache.bin",
  "android/.gradle/9.3/cache.bin",
  "android/.kotlin/sessions/compiler.salive",
  "android/local.properties",
  "ios/Pods/large-library.a",
  "ios/build/output",
  "mock/preview.png",
])
  assert.ok(rules.ignores(junk), `Build waste would be uploaded: ${junk}`);

let files = 0,
  bytes = 0;
function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (
      entry.isSymbolicLink() ||
      rules.ignores(relative(file) + (entry.isDirectory() ? "/" : ""))
    )
      continue;
    if (entry.isDirectory()) inventory(file);
    else {
      files++;
      bytes += fs.statSync(file).size;
    }
  }
}
inventory(root);
assert.ok(
  bytes < 2 * 1024 ** 3,
  "Source inputs exceed EAS's 2 GiB archive limit before compression",
);
console.log(
  `PASS ${required.size} native and runtime build inputs remain included.`,
);
console.log(
  "PASS dependencies, Git metadata, native build products and previews are excluded.",
);
console.log(
  `EAS source inputs: ${(bytes / 1_000_000).toFixed(1)} MB across ${files} files, before gzip.`,
);
