import type { Character, Game } from "./engine";
import { BALANCE as B } from "./balance";
export const healthyMaxHp = (c: Character) =>
  c.uninjuredHp || Math.round(c.maxHp / (1 - (c.injuries || 0) * B.injuryHp));
export function setInjuries(c: Character, count: number): Character {
  const injuries = Math.min(2, Math.max(0, count)),
    maxHp = Math.max(
      1,
      Math.floor(healthyMaxHp(c) * (1 - injuries * B.injuryHp)),
    );
  return {
    ...c,
    injuries,
    uninjuredHp: healthyMaxHp(c),
    maxHp,
    hp: Math.min(c.hp, maxHp),
    speed: c.speed + (c.injuries || 0) - injuries,
    recoveryDays: 0,
  };
}
export function townRecovery(before: Game, after: Game, advance = true): Game {
  if (before === after) return after;
  const days = advance ? after.day - before.day : 0;
  const update = (c: Character) => {
    const old = before.party.concat(before.reserve).find((p) => p.id === c.id);
    if (!old) return c;
    if (
      (c.injuries || 0) > 0 &&
      c.injuries === old.injuries &&
      c.maxHp !== old.maxHp &&
      c.uninjuredHp === old.uninjuredHp
    )
      c = {
        ...c,
        uninjuredHp: healthyMaxHp(old) + c.maxHp - old.maxHp,
        maxHp: Math.floor(
          (healthyMaxHp(old) + c.maxHp - old.maxHp) *
            (1 - c.injuries * B.injuryHp),
        ),
      };
    if (
      before.phase !== "town" ||
      after.phase !== "town" ||
      days <= 0 ||
      !c.injuries
    )
      return {
        ...c,
        uninjuredHp: c.injuries ? c.uninjuredHp : c.maxHp,
        hp: Math.min(c.hp, c.maxHp),
      };
    const total = (c.recoveryDays || 0) + days,
      remove = Math.floor(total / B.injuryRecoveryDays);
    return {
      ...setInjuries(c, c.injuries - remove),
      recoveryDays: c.injuries > remove ? total % B.injuryRecoveryDays : 0,
    };
  };
  return {
    ...after,
    party: after.party.map(update),
    reserve: after.reserve.map(update),
  };
}
export function rescueInjuries(s: Game): Game {
  return {
    ...s,
    party: s.party.map((c) =>
      c.hp <= 0 ? setInjuries(c, (c.injuries || 0) + 1) : c,
    ),
  };
}
/** Watches are retained as save units; a campaign action spends one whole day's units. */
export function passTime(
  s: Game,
  watches: number,
  options: { rest?: boolean } = {},
): Game {
  if (s.journey.startDay === null) return s;
  const before = s.journey.watches,
    elapsed = Math.min(B.expeditionDays * B.watchesPerDay, before + watches);
  let next = {
    ...s,
    journey: { ...s.journey, watches: elapsed },
    day: s.journey.startDay + Math.floor(elapsed / B.watchesPerDay),
  };
  for (
    let day = Math.floor(before / B.watchesPerDay);
    day < Math.floor(elapsed / B.watchesPerDay);
    day++
  ) {
    const fed = next.food > 0,
      resting = options.rest ?? next.phase === "camp";
    next = {
      ...next,
      food: Math.max(0, next.food - 1),
      party: next.party.map((c) =>
        c.hp <= 0
          ? c
          : {
              ...c,
              hp: fed
                ? resting
                  ? Math.min(
                      c.maxHp,
                      c.hp + Math.round(c.maxHp * B.dailyRecovery),
                    )
                  : c.hp
                : Math.max(
                    0,
                    c.hp - Math.max(1, Math.round(c.maxHp * B.hungerDamage)),
                  ),
              mp: resting
                ? Math.min(
                    c.maxMp,
                    c.mp +
                      Math.round(
                        c.maxMp * (fed ? B.dailyRecovery : B.hungryRestMp),
                      ),
                  )
                : c.mp,
              exhaustion: Math.max(
                0,
                Math.min(
                  100,
                  (c.exhaustion || 0) +
                    (resting
                      ? -(fed ? B.fedExhaustionRecovery : B.hungryRestRecovery)
                      : fed
                        ? 0
                        : B.hungerExhaustion),
                ),
              ),
            },
      ),
      message: fed
        ? resting
          ? "A day passes. One party ration used; standing companions recover 25% HP/MP and 35 exhaustion."
          : next.message
        : resting
          ? "You sleep on empty stomachs. Standing companions recover 10% MP and 20 exhaustion, but hunger costs 10% maximum HP."
          : `${next.message} No food remains. Standing companions gain 15 exhaustion and lose 10% maximum HP.`,
    };
  }
  const fallen = next.party.length > 0 && next.party.every((c) => c.hp <= 0);
  if (fallen) next = { ...next, phase: "defeat" };
  const inBattle =
    next.phase === "combat" ||
    (next.phase === "arrival" &&
      next.journey.defender &&
      next.combat &&
      !next.combat.complete);
  // Closing pauses for an accepted battle. A victorious portal defender's loot
  // leads to its portal; stepping through unlocks the next floor before extraction.
  if (
    elapsed >= B.expeditionDays * B.watchesPerDay &&
    next.phase !== "loot" &&
    !inBattle
  )
    next = {
      ...next,
      phase: "extraction",
      message: "The labyrinth is closing. You are teleported back to town.",
    };
  return next;
}
