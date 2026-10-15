import { SPECIES_ART } from "./species-art";
import { MONSTERS } from "./monsters";
import type { Character, Game } from "./engine";

export type MotionStyle = "melee" | "arrow" | "magic" | "slam";
export type MotionKey =
  | "kael"
  | "barbarian"
  | "lyria"
  | "bram"
  | "elowen"
  | "mira"
  | "torren"
  | "sigrun"
  | "finn"
  | "eira"
  | "human-mage"
  | "goblin"
  | "roadkeeper"
  | "guardian"
  | "broodmother"
  | "revenant"
  | "blight"
  | "frostfang"
  | "sentinel"
  | "ashen"
  | "pale-hunter"
  | "kings-blade"
  | "hollow-king"
  | "plunderer"
  | "bonegnaw";
export type CombatVisual = {
  key: MotionKey;
  style: MotionStyle;
  color: string;
};

/** These two original sheets were authored looking right; all other foes are left-facing. */
export function mirrorEnemy(key: MotionKey) {
  "worklet";
  return key === "roadkeeper" || key === "revenant";
}

/** Hold the character's release pose while its projectile crosses the scene.
 * Some generated bow/magic cells contain only the projectile; never blink the body out. */
export function spriteFrame(key: MotionKey, row: number, frame: number) {
  "worklet";
  if (key === "eira" && (row === 2 || row === 5) && frame === 4) return 3;
  if (key === "mira" && row === 2 && frame === 5) return 4;
  if (key === "mira" && row === 5 && (frame === 3 || frame === 4)) return 2;
  if (
    ["lyria", "finn", "frostfang", "broodmother", "roadkeeper"].includes(key) &&
    row === 5 &&
    frame === 4
  )
    return 3;
  if (key === "human-mage" && (row === 2 || row === 5) && frame === 4) return 3;
  return frame;
}

const players: Record<number, CombatVisual> = {
  0: { key: "kael", style: "melee", color: "#ffd78c" },
  1: { key: "lyria", style: "arrow", color: "#86e890" },
  2: { key: "bram", style: "melee", color: "#ffd78c" },
  3: { key: "barbarian", style: "melee", color: "#ffb474" },
  12: { key: "elowen", style: "magic", color: "#8fffc0" },
  13: { key: "mira", style: "magic", color: "#bca0ff" },
  14: { key: "torren", style: "melee", color: "#ffe9b4" },
  15: { key: "sigrun", style: "melee", color: "#ff967c" },
  16: { key: "finn", style: "melee", color: "#94d9ff" },
  17: { key: "eira", style: "arrow", color: "#9deeff" },
};
export const FLOOR_VISUALS: CombatVisual[] = [
  { key: "goblin", style: "melee", color: "#ffcd79" },
  { key: "roadkeeper", style: "melee", color: "#a7caff" },
  { key: "guardian", style: "slam", color: "#7de5ff" },
  { key: "broodmother", style: "melee", color: "#9cef82" },
  { key: "revenant", style: "melee", color: "#96bfff" },
  { key: "blight", style: "magic", color: "#a0ee6f" },
  { key: "frostfang", style: "melee", color: "#b3f3ff" },
  { key: "sentinel", style: "melee", color: "#f9d38b" },
  { key: "ashen", style: "melee", color: "#ff9a63" },
  { key: "pale-hunter", style: "melee", color: "#b8eaff" },
  { key: "kings-blade", style: "melee", color: "#d6c4fa" },
  { key: "hollow-king", style: "magic", color: "#ffb55c" },
];
export function characterVisual(
  character: Pick<Character, "portrait" | "job">,
): CombatVisual {
  if (character.portrait === 0 && character.job === "Mage")
    return { key: "human-mage", style: "magic", color: "#99baff" };
  return players[character.portrait] || players[0];
}
/** Explicit species wins over reused atlas indices and the surrounding floor. */
export function enemyVisual(
  state: Pick<Game, "floor" | "enemy" | "sideBattle" | "journey">,
): CombatVisual {
  const identity =
    MONSTERS.find((m) => m.id === state.enemy?.species)?.visual ||
    state.enemy?.species;
  const art = state.enemy?.species
    ? SPECIES_ART[state.enemy.species]
    : undefined;
  if (art)
    return {
      key: identity as MotionKey,
      style: art.profile.style,
      color: art.profile.accent,
    };
  const species = FLOOR_VISUALS.find((v) => v.key === identity);
  if (species) return species;
  if (identity === "bonegnaw" || (!identity && state.enemy?.sprite === 20))
    return { key: "bonegnaw", style: "melee", color: "#ccbb89" };
  if (
    identity === "plunderer" ||
    state.sideBattle ||
    /plunderer/i.test(state.enemy?.name || "")
  )
    return { key: "plunderer", style: "melee", color: "#9bd1ff" };
  return FLOOR_VISUALS[Math.max(0, Math.min(11, state.floor - 1))];
}
