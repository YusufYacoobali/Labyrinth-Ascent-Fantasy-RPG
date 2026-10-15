const fs = require("node:fs");
const { campaign, simulate } = require("./campaign-sim.cjs");
if (require.main === module) {
  const result = simulate(Number(process.argv[2] || 200));
  fs.mkdirSync("verification", { recursive: true });
  fs.writeFileSync(
    "verification/campaign-simulation.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result.summary));
  if (
    result.summary.stalled ||
    result.summary.firstFloorMedian < 2 ||
    result.summary.firstFloorMedian > 4 ||
    result.summary.campaignMedian < 5 ||
    result.summary.campaignMedian > 8 ||
    result.summary.repeatedStories ||
    result.summary.genericRepeats
  )
    process.exitCode = 1;
}
module.exports = { play: campaign, campaign };
