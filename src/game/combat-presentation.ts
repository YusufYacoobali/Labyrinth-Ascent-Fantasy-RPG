import type { Game } from "./engine";
export type Playhead = { key: string; step: number };
export const playbackKey = (playback: Game["roundPlayback"]) =>
  playback
    ? `${playback.before.combat?.id}:${playback.before.combat?.round}`
    : "";
export const playbackStep = (head: Playhead, key: string, count: number) =>
  head.key === key
    ? Math.max(0, Math.min(head.step, Math.max(0, count - 1)))
    : 0;
export const STATUS_COLORS: Record<string, string> = {
  burning: "#f1a16c",
  venom: "#a2d97d",
  bleeding: "#d78786",
  chilled: "#a4d9ee",
  frozen: "#c7ebfa",
  entangled: "#acd282",
  weakened: "#c4abc9",
  fractured: "#d4bda2",
  exposed: "#f4d98b",
};
export function visibleStatus(unit: {
  poison?: number;
  conditions?: Record<string, { stacks: number }>;
  ailments?: {
    poison: number;
    conditions?: Record<string, { stacks: number }>;
  };
}) {
  const conditions = unit.conditions || unit.ailments?.conditions || {};
  return (
    [
      "frozen",
      "burning",
      "venom",
      "bleeding",
      "chilled",
      "entangled",
      "exposed",
      "fractured",
      "weakened",
    ].find((k) => (conditions[k]?.stacks || 0) > 0) ||
    (unit.poison || unit.ailments?.poison ? "venom" : undefined)
  );
}
