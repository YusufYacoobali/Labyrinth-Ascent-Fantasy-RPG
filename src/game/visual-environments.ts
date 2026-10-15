import type { Route } from "./world";
/** Reuse empty authored scenery without importing occupants or discovery data. */
export function arenaFloor(floor: number, route: Route | null = null) {
  return floor >= 5 && floor <= 7 && route
    ? ({ roots: 8, frost: 10, forge: 9, crypt: 11 } as const)[route]
    : Math.max(1, Math.min(12, floor));
}
