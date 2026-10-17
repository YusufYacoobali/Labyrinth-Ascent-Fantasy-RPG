import type { Game } from "./engine";
import type { RoundEvent } from "./round-combat";
import { enemyCoreYield } from "./monsters";
export type CombatGoldDrop = { id: string; enemyId: string; amount: number };
export type Playhead = { key: string; step: number };
export const playbackKey = (playback: Game["roundPlayback"]) =>
  playback
    ? `${playback.before.combat?.id}:${playback.before.combat?.round}`
    : "";
export const playbackStep = (head: Playhead, key: string, count: number) =>
  head.key === key
    ? Math.max(0, Math.min(head.step, Math.max(0, count - 1)))
    : 0;

/** Animation time and reading time are separate; reduced motion still needs readable text. */
export function eventPacing(
  event: Pick<RoundEvent, "text"> | undefined,
  nativeDuration = 0,
  speed: Game["combatSpeed"] = "normal",
  reduced = false,
  activeDuration = nativeDuration,
) {
  const fast = speed === "fast";
  const readingMs = Math.max(
    fast ? 950 : 1400,
    Math.min(fast ? 2400 : 3400, (event?.text.length || 0) * (fast ? 12 : 18)),
  );
  const animationMs = nativeDuration
    ? reduced
      ? 200
      : Math.max(
          fast ? 900 : 1200,
          Math.round(nativeDuration * (fast ? 0.7 : 1)),
        )
    : 0;
  const originalStep = Math.max(readingMs, animationMs + (fast ? 200 : 350));
  const activeMs = nativeDuration
    ? Math.min(animationMs, (activeDuration / nativeDuration) * animationMs)
    : 0;
  return {
    animationMs,
    stepMs:
      nativeDuration && !reduced
        ? Math.round(activeMs + (originalStep - activeMs) / 4)
        : originalStep,
  };
}

/** Presentation only: victory settlement remains the sole owner of currency. */
export function defeatedGold(
  playback: Game["roundPlayback"],
  cursor: number,
  collected: string[] = [],
): CombatGoldDrop[] {
  const event = playback?.events[cursor];
  if (!playback || !event || event.kind === "consume") return [];
  const prior = cursor
    ? playback.events[cursor - 1].enemies
    : playback.before.combat?.enemies || [];
  const seen = new Set([
    ...collected,
    ...(playback.before.combat?.defeated || []).map((foe) => foe.id),
    ...playback.events
      .slice(0, cursor)
      .flatMap((step) =>
        step.enemies.filter((foe) => foe.hp <= 0).map((foe) => foe.id),
      ),
  ]);
  return event.enemies.flatMap((foe) => {
    if (
      foe.hp > 0 ||
      foe.rewardEligible === false ||
      seen.has(foe.id) ||
      !prior.some((old) => old.id === foe.id && old.hp > 0)
    )
      return [];
    const amount = enemyCoreYield(
      foe,
      playback.before.floor,
      playback.before.journey.defender,
    );
    return amount > 0
      ? [{ id: `${event.id}:${foe.id}`, enemyId: foe.id, amount }]
      : [];
  });
}

export function arrivingEnemies(
  playback: Game["roundPlayback"],
  cursor: number,
) {
  const event = playback?.events[cursor];
  if (!event || !playback) return [];
  const previous =
    cursor > 0
      ? playback.events[cursor - 1].enemies
      : playback.before.combat?.enemies || [];
  return event.enemies.filter(
    (enemy) => enemy.hp > 0 && !previous.some((old) => old.id === enemy.id),
  );
}

export function playbackSnapshot(
  playback: Game["roundPlayback"],
  cursor: number,
  landed: boolean,
) {
  const event = playback?.events[cursor];
  if (!event || !playback) return undefined;
  const previous = cursor > 0 ? playback.events[cursor - 1] : undefined;
  return landed
    ? { party: event.party, enemies: event.enemies }
    : {
        party: previous?.party || playback.before.party,
        enemies: previous?.enemies || playback.before.combat?.enemies || [],
      };
}

export function actionLead(event: RoundEvent, state: Game) {
  const name = (id: string) =>
    state.party.find((c) => c.id === id)?.name ||
    event.enemies.find((e) => e.id === id)?.name;
  const actor = name(event.actor) || "The party";
  const target = name(event.target);
  const action = event.action;
  if (event.kind === "guard" && !action)
    return target
      ? `${actor} moves to protect ${target}.`
      : `${actor} takes a defensive stance.`;
  if (event.kind === "heal" && !action)
    return `${actor} prepares to heal${target ? " → " + target : ""}.`;
  if (event.kind === "retaliate")
    return `${actor}'s ward retaliates${target ? " → " + target : ""}.`;
  if (action?.kind === "skill")
    return `${actor} uses ${action.skill}${target ? " → " + target : ""}.`;
  if (action?.kind === "item")
    return `${actor} uses an item${target ? " → " + target : ""}.`;
  if (action?.kind === "focus") return `${actor} focuses.`;
  if (action?.kind === "guard" || action?.kind === "taunt")
    return `${actor} takes a defensive stance.`;
  return `${actor} ${action?.kind === "burst" ? "unleashes Burst" : "attacks"}${target ? " → " + target : ""}.`;
}
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
