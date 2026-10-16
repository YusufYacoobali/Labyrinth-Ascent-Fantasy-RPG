import type { Character } from "./engine";
import { BALANCE } from "./balance";
import { healthyMaxHp } from "./survival";
import { ITEMS } from "./world";

export type CharacterStat = "atk" | "def" | "speed" | "maxHp" | "maxMp";

/** Stored combat values include gear. Split them for display without changing combat. */
export function characterStat(c: Character, stat: CharacterStat) {
  const itemStat = stat === "maxHp" ? "hp" : stat === "maxMp" ? "mp" : stat;
  const equipped = c.equipment.reduce(
    (sum, id) => sum + (ITEMS.find((item) => item.id === id)?.[itemStat] || 0),
    0,
  );
  const tempered = BALANCE.tempering
    .slice(0, c.gear)
    .reduce(
      (sum, tier) =>
        sum +
        (stat === "atk" ? tier.attack : stat === "def" ? tier.defense : 0),
      0,
    );
  const total = c[stat];
  // Injuries also reduce equipment HP; preserve the engine's rounding and minimum.
  const base =
    stat === "maxHp" && c.injuries
      ? Math.max(
          1,
          Math.floor(
            (healthyMaxHp(c) - equipped) * (1 - c.injuries * BALANCE.injuryHp),
          ),
        )
      : total - equipped - tempered;
  return { base, bonus: total - base, total };
}
