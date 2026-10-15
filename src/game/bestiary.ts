import type { Enemy, Game } from "./engine";
import { MONSTERS, essenceId } from "./monsters";
export interface BestiaryEntry {
  seen: number;
  defeated: number;
  moves: string[];
  elements?: Enemy["element"][];
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
  element?: Enemy["element"],
): Game {
  if (!species) return s;
  const old = s.bestiary?.[species] || { seen: 1, defeated: 0, moves: [] };
  if (
    old.moves.includes(label) &&
    (!element || old.elements?.includes(element))
  )
    return s;
  return {
    ...s,
    bestiary: {
      ...s.bestiary,
      [species]: {
        ...old,
        moves: old.moves.includes(label) ? old.moves : [...old.moves, label],
        ...(element
          ? { elements: [...new Set([...(old.elements || []), element])] }
          : {}),
      },
    },
  };
}

/** Never use the enemy's hidden definition as a substitute for discoveries. */
export function monsterKnowledge(
  state: Pick<Game, "bestiary" | "inventory">,
  enemy: Enemy,
) {
  const species = enemy.species;
  const entry = species ? state.bestiary?.[species] : undefined;
  const studied =
    !!entry?.defeated || !!(species && state.inventory[essenceId(species)] > 0);
  return {
    seen: entry?.seen || 0,
    defeated: entry?.defeated || 0,
    moves: entry?.moves || [],
    element:
      studied || entry?.elements?.includes(enemy.element)
        ? enemy.element
        : undefined,
    weaknesses: studied
      ? entry?.weaknesses || enemy.weaknesses || []
      : undefined,
    resistances: studied
      ? entry?.resistances || enemy.resistances || {}
      : undefined,
    skill: studied ? MONSTERS.find((m) => m.id === species)?.skill : undefined,
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
