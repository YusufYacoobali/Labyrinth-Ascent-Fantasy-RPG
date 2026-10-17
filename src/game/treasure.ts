import { BALANCE as B } from "./balance";
import { nextRandom } from "./monsters";

/** A separate persisted loot draw keeps chest value independent of trap choices. */
export function rollTreasureGold(seed: number) {
  const draw = nextRandom(seed);
  return {
    seed: draw.seed,
    gold:
      B.chestGoldMin +
      Math.floor(draw.roll * (B.chestGoldMax - B.chestGoldMin + 1)),
  };
}
