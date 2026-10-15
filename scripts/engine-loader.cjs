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
  status: load("src/game/combat-status.ts"),
  commands: load("src/game/combat-commands.ts"),
  moves: load("src/game/enemy-moves.ts"),
  behavior: load("src/game/monster-behavior.ts"),
  relationships: load("src/game/relationships.ts"),
  narration: load("src/game/room-narration.ts"),
  townProgression: load("src/game/town-progression.ts"),
  skillIds: load("src/game/skill-ids.ts"),
  generic: load("src/game/generic-stories.ts"),
  genericData: load("src/game/generic-encounters.ts"),
  stories: load("src/game/stories.ts"),
  rounds: load("src/game/round-combat.ts"),
  survival: load("src/game/survival.ts"),
  progression: load("src/game/progression.ts"),
  monsters: load("src/game/monsters.ts"),
  saves: load("src/game/save-store.ts"),
  combatData: load("src/game/combat-data.ts"),
  visuals: load("src/game/combat-visuals.ts"),
  trial: load("src/game/combat-trial.ts"),
  animation: load("src/game/combat-animation.ts"),
  walkthrough: load("src/game/walkthrough.ts"),
  maps: load("src/game/floor-map.ts"),
  fatigue: load("src/game/exhaustion.ts"),
  e: load("src/game/engine.ts"),
  w: load("src/game/world.ts"),
  town: load("src/game/town-content.ts"),
  story: load("src/game/story.ts"),
  exploration: load("src/game/exploration.ts"),
};
