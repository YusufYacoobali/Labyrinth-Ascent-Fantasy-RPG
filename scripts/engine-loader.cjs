const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      exports: mod.exports,
      module: mod,
      require: (id) => load(path.resolve(path.dirname(filename), id + ".ts")),
      console,
    },
    { filename },
  );
  return mod.exports;
}
module.exports = {
  e: load("src/game/engine.ts"),
  w: load("src/game/world.ts"),
  story: load("src/game/story.ts"),
};
