import { ITEMS, type Item } from "./world";

export type ShopCategory = "Supplies" | "Gear" | "Sell";
export const SHOP_ITEM_TYPES = [
  ["All", "all"],
  ["Weapons", "weapon"],
  ["Armour", "armor"],
  ["Helmets", "helmet"],
  ["Boots", "boots"],
  ["Charms", "charm"],
  ["Supplies", "supply"],
  ["Loot", "loot"],
] as const;
export type ShopItemType = "all" | Item["kind"];

export function shopStock(
  category: ShopCategory,
  type: ShopItemType,
  inventory: Record<string, number>,
) {
  return ITEMS.filter((item) => {
    const available =
      category === "Sell"
        ? (inventory[item.id] || 0) > 0
        : item.vendor !== "guild" &&
          item.price > 0 &&
          (category === "Supplies"
            ? item.kind === "supply"
            : item.kind !== "supply" && item.kind !== "loot");
    return available && (type === "all" || item.kind === type);
  });
}
