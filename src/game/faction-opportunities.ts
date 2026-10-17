import type { Action, Game } from "./engine";
import type { Item, Route } from "./world";
export type FactionId = "guild" | "stag" | Route;
export const FACTION_OPPORTUNITIES = [
  {
    id: "guild",
    name: "Guild roadwardens",
    floor: 3,
    material: "gold",
    quantity: 400,
    item: "guild-aegis",
    title: "Fund the roadwardens' rescue supplies",
  },
  {
    id: "stag",
    name: "White Stag",
    floor: 3,
    material: "night-herb",
    quantity: 3,
    item: "stag-boots",
    title: "Replenish the White Stag rescue herbarium",
  },
  {
    id: "roots",
    name: "Rootkeepers",
    floor: 6,
    material: "night-herb",
    quantity: 3,
    item: "rootkeeper-seal",
    title: "Supply the shared spring dispensary",
  },
  {
    id: "frost",
    name: "Frostwardens",
    floor: 6,
    material: "frost-shard",
    quantity: 3,
    item: "frostwarden-hood",
    title: "Replace the thaw bell's frostglass",
  },
  {
    id: "forge",
    name: "Cinder Union",
    floor: 6,
    material: "ancient-ore",
    quantity: 3,
    item: "union-greaves",
    title: "Rebuild the workers' furnace guards",
  },
  {
    id: "crypt",
    name: "Quiet Court",
    floor: 6,
    material: "relic-fragment",
    quantity: 3,
    item: "quiet-court-focus",
    title: "Return the court's scattered memorial clasps",
  },
] as const;
export const factionStanding = (s: Game, id: FactionId) =>
  id === "guild" || id === "stag" ? s.faction[id] : s.stories.factions[id];
export const FACTION_ITEMS: Item[] = [
  {
    id: "guild-aegis",
    name: "Roadwarden aegis",
    kind: "armor",
    icon: "shield",
    quality: "rare",
    price: 650,
    sell: 210,
    vendor: "guild",
    def: 16,
    faction: "guild",
    description: "+16 DEF. Issued for recovered road evidence.",
  },
  {
    id: "stag-boots",
    name: "White Stag pathfinders",
    kind: "boots",
    icon: "shoe-print",
    quality: "rare",
    price: 550,
    sell: 180,
    vendor: "guild",
    def: 3,
    speed: 3,
    faction: "stag",
    description: "+3 DEF, +3 speed. Rescue company equipment.",
  },
  {
    id: "rootkeeper-seal",
    name: "Shared spring seal",
    kind: "charm",
    icon: "sprout",
    quality: "rare",
    price: 600,
    sell: 190,
    vendor: "alchemist",
    resist: { element: "venom", amount: 40 },
    faction: "roots",
    description: "40% venom resistance. A shared-water pledge.",
  },
  {
    id: "frostwarden-hood",
    name: "Thawkeeper hood",
    kind: "helmet",
    icon: "snowflake",
    quality: "rare",
    price: 600,
    sell: 190,
    vendor: "alchemist",
    def: 6,
    resist: { element: "frost", amount: 30 },
    faction: "frost",
    description: "+6 DEF and 30% frost resistance.",
  },
  {
    id: "union-greaves",
    name: "Union furnace greaves",
    kind: "boots",
    icon: "fire",
    quality: "rare",
    price: 600,
    sell: 190,
    vendor: "emporium",
    def: 6,
    resist: { element: "fire", amount: 30 },
    faction: "forge",
    description: "+6 DEF and 30% fire resistance.",
  },
  {
    id: "quiet-court-focus",
    name: "Memorial staff",
    kind: "weapon",
    icon: "creation",
    quality: "rare",
    price: 700,
    sell: 220,
    vendor: "emporium",
    atk: 22,
    def: 3,
    faction: "crypt",
    description: "+22 ATK and +3 DEF. Carved from returned memorial clasps.",
  },
];
export function factionAccess(s: Game, item: Item) {
  if (!item.faction) return "";
  const offer = FACTION_OPPORTUNITIES.find((o) => o.id === item.faction)!;
  return s.bestFloor < offer.floor
    ? `Reach Floor ${offer.floor}.`
    : factionStanding(s, item.faction) < 10
      ? `Requires 10 ${offer.name} standing.`
      : "";
}
export function factionDiscount(s: Game, item: Item) {
  const standing = item.faction
    ? factionStanding(s, item.faction)
    : item.vendor === "guild"
      ? s.faction.guild
      : item.vendor === "alchemist"
        ? s.faction.stag
        : Math.max(...Object.values(s.stories.factions));
  return standing >= 10 ? 0.1 : 0;
}
export function resolveFactionAction(s: Game, a: Action): Game | undefined {
  if (a.type !== "FACTION_DELIVER") return;
  const offer = FACTION_OPPORTUNITIES.find((o) => o.id === a.id);
  if (!offer || s.phase !== "town" || s.factionClaims?.includes(offer.id))
    return s;
  if (
    s.bestFloor < offer.floor ||
    factionStanding(s, offer.id) < 5 ||
    (offer.material === "gold" ? s.gold : s.inventory[offer.material] || 0) <
      offer.quantity
  )
    return {
      ...s,
      message: "This commission needs its floor, standing and listed payment.",
    };
  const message = `${offer.name} accepts ${offer.quantity} ${offer.material} and issues exclusive equipment. The delivery is recorded permanently.`;
  return {
    ...s,
    gold: s.gold - (offer.material === "gold" ? offer.quantity : 0),
    inventory: {
      ...s.inventory,
      ...(offer.material === "gold"
        ? {}
        : { [offer.material]: s.inventory[offer.material] - offer.quantity }),
      [offer.item]: (s.inventory[offer.item] || 0) + 1,
    },
    factionClaims: [...(s.factionClaims || []), offer.id],
    message,
    journal: [message, ...s.journal].slice(0, 60),
  };
}
