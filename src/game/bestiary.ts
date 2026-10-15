import type { Enemy, Game } from "./engine";
export interface BestiaryEntry {
  seen: number;
  defeated: number;
  moves: string[];
  weaknesses?: Enemy["weaknesses"];
  resistances?: Enemy["resistances"];
}
export type Bestiary = Record<string, BestiaryEntry>;
export function observeMonsters(
  current: Bestiary | undefined,
  foes: Enemy[],
): Bestiary {
  const next = { ...current };
  for (const foe of foes) {
    if (!foe.species) continue;
    const old = next[foe.species] || { seen: 0, defeated: 0, moves: [] };
    next[foe.species] = {
      ...old,
      seen: old.seen + 1,
      weaknesses: foe.weaknesses,
      resistances: foe.resistances,
    };
  }
  return next;
}
export function observeMove(
  s: Game,
  species: string | undefined,
  label: string,
): Game {
  if (!species) return s;
  const old = s.bestiary?.[species] || { seen: 1, defeated: 0, moves: [] };
  if (old.moves.includes(label)) return s;
  return {
    ...s,
    bestiary: {
      ...s.bestiary,
      [species]: { ...old, moves: [...old.moves, label] },
    },
  };
}
export function recordDefeats(
  current: Bestiary | undefined,
  foes: Enemy[],
): Bestiary {
  const next = { ...current };
  for (const foe of foes) {
    if (!foe.species) continue;
    const old = next[foe.species] || { seen: 1, defeated: 0, moves: [] };
    next[foe.species] = {
      ...old,
      defeated: old.defeated + 1,
      weaknesses: foe.weaknesses,
      resistances: foe.resistances,
    };
  }
  return next;
}
