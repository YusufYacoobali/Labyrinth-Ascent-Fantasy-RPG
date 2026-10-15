import type { RoomKind, Heading } from "./floor-map";
import { seedFor } from "./floor-map";
const ATMOSPHERE: Record<string, string[]> = {
  roots: [
    "Pale roots lace the stone; drops of sap collect beneath their thorns.",
    "A warm fungal scent hangs under a canopy of living wood.",
    "Root fibres have lifted the paving into ridges around your feet.",
  ],
  frost: [
    "Blue ice blurs an older pattern in the masonry.",
    "Your breath catches the lantern light before the freezing air swallows it.",
    "Fine crystals ring underfoot, louder than the party’s voices.",
  ],
  forge: [
    "A banked furnace throws a dull red reflection across the stone.",
    "Iron dust clings to the walls around a cold maintenance channel.",
    "Heat ticks through the old pipes, stopping whenever you listen.",
  ],
  crypt: [
    "Names worn almost smooth line a low burial shelf.",
    "Your lantern exposes layers of pale cloth beneath the fallen mortar.",
    "A cold draught carries the smell of old wax between the tombs.",
  ],
  dungeon: [
    "Candle soot darkens the ceiling above a row of empty niches.",
    "Water has washed an old bootprint into the mortar.",
    "A broken lantern hook casts a long shadow over the flagstones.",
  ],
  labyrinth: [
    "A worn cart groove disappears beneath newer paving.",
    "Moisture has picked out the names on a forgotten boundary stone.",
    "Your footsteps return from several heights in the old stonework.",
  ],
  forest: [
    "Leaves settle in a beam of light without any sign of a sky.",
    "A green shoot grows through the grip of a long-abandoned tool.",
    "The air smells of rain that has never touched these stones.",
  ],
};
export function narrateRoom(input: {
  seed: number;
  floor: number;
  floorName: string;
  biome: string;
  id: string;
  kind: RoomKind;
  exits: number;
  facing: Heading;
  resolved: boolean;
  injured: boolean;
}) {
  const pool = ATMOSPHERE[input.biome] || ATMOSPHERE.labyrinth;
  const atmosphere =
    pool[seedFor(`${input.seed}:${input.floor}:${input.id}`) % pool.length];
  const detail =
    input.kind === "dead-end"
      ? "Fresh wall marks stop where the chamber closes."
      : input.kind === "landmark"
        ? "The distinctive stonework gives your chart a reliable reference."
        : input.kind === "portal"
          ? "The upward arch dominates the far wall."
          : input.resolved
            ? "The signs of your earlier encounter remain; nothing has been replenished."
            : "The light reaches the openings, while the spaces beyond remain unknown.";
  return `${input.floorName}. ${atmosphere} ${detail} ${input.exits === 1 ? "Only one passage leaves this chamber." : `${input.exits} passages meet here.`} You face ${input.facing}.${input.injured ? " The party slows to let its injured companions cross the uneven floor." : ""}`;
}
