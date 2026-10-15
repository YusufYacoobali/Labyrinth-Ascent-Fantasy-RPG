import type { Character, Game } from "./engine";
import { BALANCE as B } from "./balance";
export const trainingLimit = (bestFloor: number) =>
  Math.max(B.trainingInitialCap, bestFloor + B.trainingFloorAllowance);
export function trainingXp(c: Character, bestFloor: number, partyLevel = 0) {
  const cap = trainingLimit(bestFloor);
  if (c.level >= cap) return 0;
  let needed = -c.xp;
  for (let level = c.level; level < cap; level++) needed += level * 70;
  return Math.max(
    0,
    Math.min(B.trainingXp * (partyLevel - c.level >= 2 ? 2 : 1), needed),
  );
}
export function temperingOffer(s: Game, c: Character) {
  const tier = B.tempering[c.gear];
  if (!tier)
    return {
      available: false,
      reason:
        "All three tempering tiers are complete. Existing improvements are retained.",
      gold: 0,
      attack: 0,
      defense: 0,
      material: "",
      quantity: 0,
    };
  const reason =
    s.bestFloor < tier.floor
      ? `Reach Floor ${tier.floor} to unlock this tempering tier.`
      : (s.inventory[tier.material] || 0) < tier.quantity
        ? `Requires ${tier.quantity} ${tier.material}.`
        : s.gold < tier.gold
          ? `Requires ${tier.gold} gold.`
          : "";
  return { ...tier, available: !reason, reason };
}
