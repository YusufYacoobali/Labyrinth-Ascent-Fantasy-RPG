import type { Game } from "./engine";
import { BALANCE as B } from "./balance";
export const pairBond = (s: Game, a: string, b: string) =>
  s.stories.pairs[[a, b].sort().join(":")] || 0;
export function bondedProtector(s: Game, target: string, used: Set<string>) {
  return s.party.find(
    (c) =>
      c.id !== target &&
      c.hp > 0 &&
      !c.ailments.paralysis &&
      !used.has(c.id) &&
      pairBond(s, c.id, target) >= 2,
  );
}
export function factionSupplyBonus(s: Game) {
  const standing = Math.max(
    s.faction.guild,
    s.faction.stag,
    s.route ? s.stories.factions[s.route] : 0,
  );
  return standing >= B.factionSupplyStanding ? B.factionSupplyRations : 0;
}
