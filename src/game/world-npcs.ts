import type { Game } from "./engine";
import { mapKey } from "./floor-map";
export const WORLD_NPCS = {
  elian: {
    name: "Elian Voss",
    role: "surveyor",
    intro:
      "Elian traces a weathered compass over a page. ‘A route is a promise. Tell me where the walls really stand.’",
    returning:
      "Elian recognizes your party and opens the pages you helped preserve.",
  },
  tamsin: {
    name: "Tamsin Reed",
    role: "merchant",
    intro:
      "Tamsin has wedged a travelling shop between two old stones. ‘A month down here makes food worth more than glitter. Two monster cores buy three party rations.’",
    returning:
      "Tamsin waves you toward the packs. ‘Back for another month? I kept the ration trade ready.’",
  },
  sable: {
    name: "Sable Dusk",
    role: "rival",
    intro:
      "A rival party led by Sable guards a carefully folded chart. ‘We can race for glory, or compare the passages that tried to kill us.’",
    returning:
      "Sable remembers your last meeting. This time the rival crew watches your companions before speaking.",
  },
} as const;
export type WorldNpcId = keyof typeof WORLD_NPCS;
export interface NpcMemory {
  visits: number;
  helped: number;
  lastExpedition: number;
  trust: number;
  decisions: string[];
}
export const npcAt = (s: Game, room = s.journey.room) =>
  Object.entries(s.expedition.director?.npcs || {}).find(
    ([, p]) => p.map === mapKey(s.floor, s.route) && p.room === room,
  )?.[0] as WorldNpcId | undefined;
export function npcDescription(s: Game, id: WorldNpcId) {
  const data = WORLD_NPCS[id];
  return `${data.name}. ${s.npcs?.[id]?.visits ? data.returning : data.intro}`;
}
