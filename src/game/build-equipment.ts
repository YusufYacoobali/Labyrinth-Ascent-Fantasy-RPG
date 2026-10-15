import type { Character, Enemy, Skill } from "./engine";
import type { Item, Element } from "./world";
import type { Recipe } from "./town-content";
import { skillFamily } from "./essence-powers";
export const HUNT_ITEMS: Item[] = [
  ...[
    ["runestone-plate", "Runestone plate"],
    ["venom-sac", "Broodmother venom sac"],
    ["frostfang-fang", "Frostfang fang"],
    ["ember-heart", "Ashen ember heart"],
    ["throne-sigil", "Throne sigil"],
    ["heartroot-knot", "Heartroot knot"],
    ["winter-heart", "Winter heart"],
    ["crucible-seal", "Crucible seal"],
    ["oath-clasp", "Oath clasp"],
  ].map(([id, name]) => ({
    id,
    name,
    kind: "loot" as const,
    icon: "diamond-stone",
    quality: "rare" as const,
    price: 0,
    sell: 100,
    vendor: "guild" as const,
    description: "A reliable guardian trophy used in advanced crafting.",
  })),
  {
    id: "runestone-mail",
    name: "Runestone brigandine",
    kind: "armor",
    quality: "rare",
    icon: "shield",
    price: 650,
    sell: 210,
    vendor: "emporium",
    def: 14,
    description: "+14 DEF. Guard barriers gain 8 HP.",
  },
  {
    id: "brood-veil",
    name: "Broodweave veil",
    kind: "helmet",
    quality: "rare",
    icon: "leaf",
    price: 580,
    sell: 180,
    vendor: "alchemist",
    def: 7,
    resist: { element: "venom", amount: 30 },
    description: "+7 DEF, 30% venom resistance and +12% venom skill damage.",
  },
  {
    id: "rime-talisman",
    name: "Frostfang talisman",
    kind: "charm",
    quality: "rare",
    icon: "snowflake",
    price: 650,
    sell: 210,
    vendor: "alchemist",
    resist: { element: "frost", amount: 20 },
    description:
      "20% frost resistance. +15% frost skill damage against chilled or frozen prey.",
  },
  {
    id: "ember-focus",
    name: "Ashheart focus",
    kind: "weapon",
    quality: "rare",
    icon: "fire",
    price: 850,
    sell: 260,
    vendor: "emporium",
    atk: 26,
    description: "+26 ATK. Fire skill damage +15%; fire retaliation +20%.",
  },
  {
    id: "throne-scepter",
    name: "Uncrowned scepter",
    kind: "weapon",
    quality: "legendary",
    icon: "crown",
    price: 1400,
    sell: 400,
    vendor: "emporium",
    atk: 34,
    description: "+34 ATK. Crown Pulse costs 6 less MP and gains 15% damage.",
  },
];
export const HUNT_RECIPES: Recipe[] = [
  {
    id: "runestone-mail",
    floor: 3,
    gold: 180,
    materials: [
      { id: "runestone-plate", quantity: 1 },
      { id: "ancient-ore", quantity: 2 },
    ],
  },
  {
    id: "brood-veil",
    floor: 4,
    gold: 160,
    materials: [
      { id: "venom-sac", quantity: 1 },
      { id: "night-herb", quantity: 2 },
    ],
  },
  {
    id: "rime-talisman",
    floor: 7,
    gold: 220,
    materials: [
      { id: "frostfang-fang", quantity: 1 },
      { id: "frost-shard", quantity: 3 },
    ],
  },
  {
    id: "ember-focus",
    floor: 9,
    gold: 280,
    materials: [
      { id: "ember-heart", quantity: 1 },
      { id: "ancient-ore", quantity: 3 },
    ],
  },
  {
    id: "throne-scepter",
    floor: 12,
    gold: 400,
    materials: [
      { id: "throne-sigil", quantity: 1 },
      { id: "relic-fragment", quantity: 5 },
    ],
  },
];
export function buildDamage(
  c: Character,
  skill: Skill | undefined,
  element: Element,
  enemy: Enemy,
) {
  if (!skill) return 1;
  let n = 1;
  const family = skillFamily(skill),
    has = (id: string) => c.equipment.includes(id);
  if (has("scout-dagger") && family === "Twin Strike") n += 0.12;
  if (has("spark-focus") && family === "Arcane Bolt") n += 0.15;
  if ((has("root-mantle") || has("brood-veil")) && element === "venom")
    n += 0.12;
  if (has("glacier-blade") && element === "frost") n += 0.15;
  if (
    has("rime-talisman") &&
    element === "frost" &&
    (enemy.conditions?.chilled || enemy.conditions?.frozen)
  )
    n += 0.15;
  if (has("ember-focus") && element === "fire") n += 0.15;
  if (has("throne-scepter") && skill === "Crown Pulse") n += 0.15;
  return n;
}
export const healingBuild = (c: Character) =>
  c.equipment.includes("moon-robe") ? 1.15 : 1;
export const guardBuild = (c: Character) =>
  c.equipment.includes("runestone-mail")
    ? 8
    : c.equipment.includes("hollow-ward")
      ? 6
      : 0;
export const skillCost = (c: Character, skill: Skill, cost: number) =>
  Math.max(
    0,
    cost -
      (skill === "Crown Pulse" && c.equipment.includes("throne-scepter")
        ? 6
        : 0),
  );
export const gearFloor = (item: Item) =>
  HUNT_RECIPES.find((r) => r.id === item.id)?.floor || 0;

export const GEAR_TRAITS: Record<string, string> = {
  "scout-dagger": "Twin-family skill damage +12%.",
  "iron-pike": "Sunder-family skills gain 10 break.",
  "spark-focus": "Arcane-family skill damage +15%.",
  "moon-robe": "Party healing potency +15%.",
  "root-mantle": "Venom skill damage +12%.",
  "glacier-blade": "Frost skill damage +15%.",
  "hollow-ward": "Guard grants at least a 6 HP barrier.",
};
