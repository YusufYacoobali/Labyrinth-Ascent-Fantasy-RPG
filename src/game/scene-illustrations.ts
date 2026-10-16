import { STORY_ILLUSTRATIONS } from "./story-illustrations";
import { arenaFloor } from "./visual-environments";
import type { Route } from "./world";

export interface SceneIllustration {
  sheet: string;
  panel: number;
  label: string;
  focus?: number;
  aspectRatio?: number;
}

const grid = (
  sheet: string,
  panel: number,
  label: string,
  focus = 0.5,
): SceneIllustration => ({ sheet, panel, label, focus, aspectRatio: 1.35 });

/** Encounter identity selects art; floor order and the room's biome never select event pictures. */
export const ARRIVAL_ILLUSTRATIONS: Record<string, SceneIllustration> = {
  goblin: grid("arrivalsA", 0, "A goblin waiting beyond the cave mouth"),
  roadkeeper: {
    sheet: "floodedRoad",
    panel: 0,
    label: "The bone roadkeeper following ripples beside a flooded wagon",
  },
  guardian: grid(
    "arrivalsA",
    1,
    "The runestone guardian at the White Stag checkpoint",
  ),
  broodmother: grid(
    "arrivalsA",
    2,
    "A giant spider above four webbed doorways",
  ),
  revenant: grid(
    "arrivalsA",
    3,
    "An armed reflection rising from a dark basin",
  ),
  blight: grid(
    "arrivalsA",
    4,
    "The Blight Warden among chains and alchemical vessels",
  ),
  frostfang: grid("arrivalsA", 5, "A pale wolf guarding a broken bridge"),
  sentinel: grid(
    "arrivalsB",
    0,
    "A kneeling sentinel beside the garden's sword pedestal",
  ),
  ashen: grid(
    "arrivalsB",
    1,
    "The Ashen Knight on furnace stairs beneath a burning banner",
  ),
  hunter: grid("arrivalsB", 2, "An icy hunter beside the sealed vault"),
  kingsblade: grid(
    "arrivalsB",
    3,
    "The King's Blade approaching the last lantern and its merchant",
  ),
  king: grid("arrivalsB", 4, "The Hollow King beneath a floating crown"),
};

/** Principal encounters share the same character and setting in both rendering paths. */
export const EVENT_ILLUSTRATIONS: Record<string, SceneIllustration> = {
  camp: STORY_ILLUSTRATIONS["floor.1.arrival"],
  caravan: STORY_ILLUSTRATIONS["floor.2.arrival"],
  clan: STORY_ILLUSTRATIONS["floor.3.arrival"],
  routes: STORY_ILLUSTRATIONS["floor.4.arrival"],
  shrine: STORY_ILLUSTRATIONS["floor.5.arrival"],
  distillery: STORY_ILLUSTRATIONS["floor.6.arrival"],
  bridge: STORY_ILLUSTRATIONS["floor.7.arrival"],
  relic: STORY_ILLUSTRATIONS["floor.8.arrival"],
  rescue: STORY_ILLUSTRATIONS["floor.9.arrival"],
  vault: STORY_ILLUSTRATIONS["floor.10.arrival"],
  merchant: STORY_ILLUSTRATIONS["floor.11.arrival"],
  throne: STORY_ILLUSTRATIONS["floor.12.arrival"],
};

const variants = (
  sheet: string,
  panel: number,
  first: string,
  second: string,
  focus = 0.5,
): [SceneIllustration, SceneIllustration] => [
  grid(sheet, panel, first, focus),
  grid(`${sheet}-alternate`, panel, second, focus),
];
export const GENERIC_ILLUSTRATIONS: Record<
  string,
  [SceneIllustration, SceneIllustration]
> = {
  "generic.lantern": variants(
    "generic-a",
    0,
    "Two surveyors tending a failing lantern",
    "Three porters tending a wick beside spilled oil",
    0.65,
  ),
  "generic.boot": variants(
    "generic-a",
    1,
    "A lost boot in mud beside a dry sleeping ledge",
    "A boot hanging from a nail above a flooded step",
  ),
  "generic.pulley": variants(
    "generic-a",
    2,
    "A satchel caught in a jammed cargo pulley",
    "A sealed satchel trapped behind a lifting frame's ratchet",
  ),
  "generic.soup": variants(
    "generic-a",
    3,
    "Two cooks stretching a pot of root soup",
    "A wandering cook offering thin broth",
    0.6,
  ),
  "generic.rattle": variants(
    "generic-a",
    4,
    "A displaced pressure plate and rusty trap spring",
    "A trap arm jammed against a wall niche",
    0.65,
  ),
  "generic.missing": variants(
    "generic-a",
    5,
    "A novice searching rubble for a misplaced pack",
    "A porter counting packs beside a rolled blanket",
  ),
  "generic.chalk": variants(
    "generic-b",
    0,
    "Two contradictory sets of chalk arrows",
    "A smudged chalk arrow crossing an older circle",
  ),
  "generic.messenger": variants(
    "generic-b",
    1,
    "A tired messenger with a sealed letter and sore feet",
    "A runner keeping a letter dry inside an empty boot",
    0.6,
  ),
  "generic.debtor": variants(
    "generic-b",
    2,
    "Two traders comparing ledgers and a receipt",
    "A merchant showing a porter a receipt folded around a seed",
  ),
  "generic.clock": variants(
    "generic-b",
    3,
    "A blocked water clock with brass cups",
    "A pendulum clock with a weight caught in its gears",
  ),
  "generic.flour": variants(
    "generic-b",
    4,
    "A baker guarding a dry flour box above mould",
    "A baker guarding a flour sack under her sleeping mat",
    0.6,
  ),
  "generic.echo": variants(
    "generic-b",
    5,
    "A worried novice beside a sleeping companion",
    "A surveyor's partner reassuring him about an echo",
  ),
  "generic.wires": variants(
    "generic-c",
    0,
    "Broken copper filaments around a warming power stone",
    "A severed ward circuit fed by a small power stone",
  ),
  "generic.postcard": variants(
    "generic-c",
    1,
    "A weathered postcard painting of Stormhold",
    "A water-stained postcard showing an old town tower",
  ),
  "generic.carrier": variants(
    "generic-c",
    2,
    "A courier waiting beside a sealed parcel and a crate",
    "An embarrassed courier carrying a heavy crate of cups",
    0.6,
  ),
  "generic.latch": variants(
    "generic-c",
    3,
    "A polished cupboard latch held open by a bent tool",
    "A maintenance cupboard tied open with wire",
  ),
  "generic.veterans": variants(
    "generic-c",
    4,
    "Veterans comparing day tallies",
    "A veteran comparing her slate with a companion's travel record",
  ),
  "generic.ribbon": variants(
    "generic-c",
    5,
    "A faded ribbon tied around a pillar",
    "Festival cloth hanging from a nail beside contradictory notes",
  ),
  "generic.vat": variants(
    "generic-d",
    0,
    "A provisioner selling pickled roots from a heavy vat",
    "Two porters rolling a leaking pickle barrel onto a mat",
    0.6,
  ),
  "generic.counterweight": variants(
    "generic-d",
    1,
    "A counterweight with a fragment caught under its wheel",
    "A frayed cord catching as a counterweight taps a brass plate",
  ),
  "generic.mask": variants(
    "generic-d",
    2,
    "A climber finding a child's festival mask in her pack",
    "A porter's companions searching for a paper festival mask",
  ),
  "generic.dust": variants(
    "generic-d",
    3,
    "Dust rising from a cracked air-pump vent",
    "A loose pump fitting blowing dust toward a sealed grille",
  ),
  "generic.accounts": variants(
    "generic-d",
    4,
    "An ordinary account slate beside bread, lamp oil and a shoe",
    "A household budget and three pairs of children's winter shoes",
    0.6,
  ),
  "generic.homeward": variants(
    "generic-d",
    5,
    "A company rehearsing its return with letters and a name list",
    "An expedition leader listening to companions' letters for home",
  ),
};

export function genericIllustration(id: string, variant: number) {
  return GENERIC_ILLUSTRATIONS[id]?.[variant];
}

export const NPC_ILLUSTRATIONS: Record<string, SceneIllustration> = {
  elian: grid("encounters", 0, "Elian surveying a route map with his compass"),
  tamsin: grid(
    "encounters",
    1,
    "Tamsin trading ration bundles at her travelling stall",
  ),
  sable: grid(
    "encounters",
    2,
    "Sable guarding a folded chart with her rival crew",
  ),
};
export const ROOM_ILLUSTRATIONS = {
  cache: grid(
    "encounters",
    4,
    "A closed ironbound treasure chest behind fallen stones",
    0.6,
  ),
  company: grid("rooms", 1, "A survey team offering its route chart"),
  spring: grid("rooms", 2, "Pale roots hanging above a shallow cave spring"),
  beast: grid(
    "rooms",
    3,
    "A solitary predator feeding among bones in a passage",
  ),
  sanctuary: grid(
    "rooms",
    4,
    "Bedrolls and a lantern behind a closed sanctuary door",
    0.6,
  ),
  wildCamp: grid(
    "encounters",
    3,
    "A camping kit, bedrolls and fire in an open passage",
    0.65,
  ),
  entry: grid(
    "encounters",
    5,
    "An entry lantern lighting three quiet passages",
    0.6,
  ),
  sunkenEntry: {
    sheet: "floor.2",
    panel: 0,
    label: "Water ripples around a broken wagon on the flooded road",
  },
} satisfies Record<string, SceneIllustration>;

export function environmentIllustration(
  floor: number,
  route: Route | null = null,
  label?: string,
): SceneIllustration {
  const index = arenaFloor(floor, route) - 1;
  return {
    sheet: ["environmentsA", "environmentsB", "environmentsC"][
      Math.floor(index / 4)
    ],
    panel: index % 4,
    label: label || "The surrounding passages on this floor",
    // Show the architecture and landmarks above the arena's expanse of paving.
    focus: 0.04,
  };
}

export function entryIllustration(floor: number, route: Route | null = null) {
  return floor === 1
    ? ROOM_ILLUSTRATIONS.entry
    : floor === 2
      ? ROOM_ILLUSTRATIONS.sunkenEntry
      : environmentIllustration(
          floor,
          route,
          "The quiet entrance to this floor",
        );
}

export const PATROL_ILLUSTRATIONS: Record<string, SceneIllustration> = {
  ambush: grid(
    "approaches",
    0,
    "Fresh tracks circling a blind corner in the passage",
  ),
  patrol: grid(
    "approaches",
    1,
    "Signs of a patrol beyond a lantern-lit corridor",
  ),
  elite: grid(
    "approaches",
    2,
    "Barricades and shields fortifying a patrol's chamber",
  ),
};
export const TOWN_ILLUSTRATIONS: Record<string, SceneIllustration> = {
  supper: grid(
    "approaches",
    3,
    "An extra chair and a shared meal outside the tavern",
  ),
  spar: grid(
    "approaches",
    4,
    "Wooden practice swords in Stormhold's training square",
  ),
  repair: grid(
    "approaches",
    5,
    "Hands repairing a frayed pack strap with a needle",
  ),
};
