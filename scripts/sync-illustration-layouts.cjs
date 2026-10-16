// Read PNG headers only; keep native crop geometry in sync with bundled artwork.
const fs = require("node:fs");
const path = require("node:path");
const layouts = {};
for (const file of [
  "src/components/story-illustration-sheets.ts",
  "src/components/scene-art-sources.ts",
]) {
  const source = fs.readFileSync(file, "utf8");
  for (const [, quoted, plain, asset] of source.matchAll(
    /(?:"([^"]+)"|(\w+)):\s*require\("([^"]+)"\)/g,
  )) {
    const key = quoted || plain;
    const resolved = path.resolve(path.dirname(file), asset);
    const png = fs.readFileSync(resolved);
    if (png.subarray(1, 4).toString() !== "PNG")
      throw Error("Expected PNG: " + asset);
    layouts[key] = {
      file: path.basename(resolved),
      columns: key.startsWith("environments")
        ? 2
        : key === "floodedRoad" || key.includes(".")
          ? 1
          : 3,
      rows: key === "floodedRoad" ? 1 : key.includes(".") ? 3 : 2,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
    };
  }
}
fs.writeFileSync(
  "src/game/illustration-layouts.ts",
  `// Generated from PNG headers by scripts/sync-illustration-layouts.cjs.\nexport interface IllustrationLayout { file: string; columns: number; rows: number; width: number; height: number; }\nexport const ILLUSTRATION_LAYOUTS: Record<string, IllustrationLayout> = ${JSON.stringify(layouts, null, 2)};\n`,
);
console.log(`Synced ${Object.keys(layouts).length} illustration sheets.`);
