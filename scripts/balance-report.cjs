// Same starting budget, preparation, routes and rewards for both policies.
// The attack policy keeps healing and items, but ignores offensive skills and counters.
const fs = require("node:fs");
const { play } = require("./playtest.cjs");
const runs = [];
for (const race of ["barbarian", "human", "elf", "dwarf"])
  for (const route of ["roots", "frost", "forge", "crypt"])
    for (const seed of [12, 42, 102, 203])
      for (const strategy of ["tactical", "attack"])
        runs.push(play(seed, route, race, strategy));
const summaries = ["tactical", "attack"].map((strategy) => {
  const group = runs.filter((r) => r.strategy === strategy);
  return {
    strategy,
    runs: group.length,
    completed: group.filter((r) => r.floor === 12 && r.phase === "victory")
      .length,
    averageFloor: group.reduce((n, r) => n + r.floor, 0) / group.length,
    averageCombatTurns:
      group.reduce((n, r) => n + r.battleTurns, 0) / group.length,
    averagePotionsLeft: group.reduce((n, r) => n + r.potions, 0) / group.length,
  };
});
fs.mkdirSync("verification", { recursive: true });
fs.writeFileSync(
  "verification/balance-report.json",
  JSON.stringify({ summaries, runs }, null, 2),
);
for (const s of summaries) console.log(JSON.stringify(s));
if (
  summaries[0].completed < 48 ||
  summaries[1].completed >= summaries[0].completed
)
  process.exitCode = 1;
