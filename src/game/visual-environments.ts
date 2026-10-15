import type { Route } from "./world";
/** Reuse empty authored scenery without importing occupants or discovery data. */
export function arenaFloor(floor: number, route: Route | null = null) {
  return floor >= 5 && floor <= 7 && route
    ? ({ roots: 8, frost: 10, forge: 9, crypt: 11 } as const)[route]
    : Math.max(1, Math.min(12, floor));
}

/** Cover the arena with one cell of the 2 × 2 scenery atlas. */
export function battleBackdropBounds(width: number, height: number, cell: number) {
  const tileWidth = Math.max(width, height / 1.5);
  const tileHeight = tileWidth * 1.5;
  return {
    x: -(cell % 2) * tileWidth - (tileWidth - width) / 2,
    y: -Math.floor(cell / 2) * tileHeight - (tileHeight - height) * 0.7,
    width: tileWidth * 2,
    height: tileHeight * 2,
  };
}
