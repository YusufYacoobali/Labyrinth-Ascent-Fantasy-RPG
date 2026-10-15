import type { Element } from "./world";
export interface Ecology {
  floors: number[];
  biomes: string[];
  resistances: Partial<Record<Element, number>>;
  weaknesses: Element[];
  hp?: number;
  attack?: number;
  pack?: string;
}
const traits = (
  floors: number[],
  biome: string,
  element: Element,
  weakness: Element,
  hp = 1,
  attack = 1,
): Ecology => ({
  floors,
  biomes: [biome],
  resistances: { [element]: element === "physical" ? 15 : 30 },
  weaknesses: [weakness],
  hp,
  attack,
});
export const ECOLOGY: Record<string, Ecology> = {
  goblin: traits([1], "dungeon", "physical", "venom"),
  roadkeeper: traits([2, 8], "labyrinth", "physical", "fire"),
  guardian: traits([3], "labyrinth", "physical", "venom"),
  broodmother: traits([4], "forest", "venom", "fire", 0.7, 0.6),
  revenant: traits([5], "route", "physical", "fire"),
  blight: traits([6], "forest", "venom", "fire"),
  frostfang: traits([7], "frost", "frost", "fire"),
  sentinel: traits([8], "dungeon", "physical", "venom"),
  ashen: traits([9], "forge", "fire", "frost"),
  "pale-hunter": traits([10], "frost", "frost", "fire"),
  "kings-blade": traits([11], "dungeon", "physical", "venom"),
  "hollow-king": traits([12], "dungeon", "fire", "frost"),
  plunderer: traits(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "camp",
    "physical",
    "venom",
  ),
  bonegnaw: traits(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "labyrinth",
    "physical",
    "fire",
  ),
  "goblin-shieldbearer": traits([1], "dungeon", "physical", "venom"),
  "goblin-slinger": traits([1], "dungeon", "physical", "venom"),
  "skeleton-mender": traits([2], "labyrinth", "physical", "fire", 0.65, 0.65),
  "skeleton-pikeman": traits([2], "labyrinth", "physical", "fire", 0.8, 0.9),
  "runic-fragment": traits([3], "labyrinth", "physical", "venom", 0.6, 0.7),
  spiderling: traits([4], "forest", "venom", "fire", 0.6, 0.7),
  "web-spinner": traits([4], "forest", "venom", "fire", 0.8, 0.8),
  "echo-mirage": traits([5], "route", "physical", "venom", 0.55, 0.8),
  "wolf-pack": traits([5, 6, 7], "frost", "frost", "fire", 0.8, 0.85),
  "grave-acolyte": traits([8], "dungeon", "physical", "fire", 0.65, 0.65),
  "ash-squire": traits([9], "forge", "fire", "frost", 0.7, 0.8),
  "ice-wisp": traits([10], "frost", "frost", "fire", 0.7, 0.75),
  "royal-guard": traits([11, 12], "dungeon", "physical", "venom", 0.8, 0.85),
  "hollow-knight": traits([12], "dungeon", "fire", "frost", 0.8, 0.85),
  "root-sprout": traits([5, 6, 7], "forest", "venom", "fire", 0.65, 0.65),
  "frost-wisp": traits([5, 6, 7], "frost", "frost", "fire", 0.65, 0.7),
  "furnace-spark": traits([5, 6, 7], "forge", "fire", "frost", 0.65, 0.7),
  "crypt-bearer": traits([5, 6, 7], "dungeon", "physical", "venom", 0.7, 0.7),
};
for (const [route, biome, element, weakness] of [
  ["roots", "forest", "venom", "fire"],
  ["frost", "frost", "frost", "fire"],
  ["forge", "forge", "fire", "frost"],
  ["crypt", "dungeon", "physical", "venom"],
] as const)
  for (const role of ["roamer", "elite", "guardian"])
    ECOLOGY[`${route}-${role}`] = traits(
      role === "guardian" ? [6] : [5, 6, 7],
      biome,
      element,
      weakness,
    );
for (const id of ["frostfang", "wolf-pack", "frost-roamer", "frost-elite"])
  ECOLOGY[id].pack = "frostfang";
