import type { Action, Character, Game } from "./engine";
import { SKILLS } from "./combat-data";
import { ARRIVALS } from "./story";
export const fatigueMultiplier = (c: Character) =>
  1 - Math.min(100, c.exhaustion || 0) * 0.003;
export function tire(s: Game, amount: number): Game {
  return {
    ...s,
    party: s.party.map((c) =>
      c.hp > 0
        ? { ...c, exhaustion: Math.min(100, (c.exhaustion || 0) + amount) }
        : c,
    ),
  };
}
export function pathfinder(s: Game) {
  return (
    s.party.find((c) => c.hp > 0 && c.id === s.journey.leaderId) ||
    s.party.find((c) => c.hp > 0)
  );
}
export function exertForAction(
  before: Game,
  after: Game,
  action: Action,
): Game {
  const lead = pathfinder(before)?.id;
  const actor =
    action.type === "BATTLE"
      ? before.party.find((c) => c.hp > 0 && c.id === action.actor) ||
        before.party.find((c) => c.hp > 0)
      : null;
  const approach =
    action.type === "APPROACH"
      ? ARRIVALS[before.floor - 1].choices.find((c) => c.id === action.choice)
      : null;
  const scout = approach?.favoredRace
    ? before.party.find((c) => c.hp > 0 && c.race === approach.favoredRace)?.id
    : lead;
  return {
    ...after,
    party: after.party.map((c) => {
      const previous = before.party.find((p) => p.id === c.id);
      if (!previous || previous.hp <= 0 || c.hp <= 0) return c;
      let effort = c.id === lead ? 2 : 1;
      if (action.type === "APPROACH")
        effort =
          c.id === (scout || lead) ? (approach?.effect === "rush" ? 3 : 2) : 1;
      if (action.type === "BATTLE") {
        const active = c.id === actor?.id;
        const skill =
          action.skill ||
          actor?.skills.find((k) => !SKILLS.find((s) => s.name === k)?.passive);
        effort =
          action.kind === "guard"
            ? active
              ? 2
              : 0
            : action.kind === "item"
              ? active
                ? 1
                : 0
              : action.kind === "focus"
                ? active
                  ? 0
                  : 1
                : previous.ailments.paralysis > 0
                  ? 0
                  : action.kind === "burst"
                    ? 2
                    : action.kind === "skill" && active
                      ? skill === "Arcane Bolt" || skill === "Second Wind"
                        ? 3
                        : 2
                      : active
                        ? 2
                        : 1;
        if ((after.effects.targets[c.id] || 0) > 0) effort++;
      }
      return { ...c, exhaustion: Math.min(100, (c.exhaustion || 0) + effort) };
    }),
  };
}
/** Complaints happen once at each threshold, then re-arm after genuine recovery. */
export function maybeComplain(s: Game): Game {
  if (s.journey.watches >= 180) return s;
  if (!["exploration", "branch", "victory", "event"].includes(s.phase))
    return s;
  const nagged = { ...s.journey.nagged };
  for (const c of s.party) if ((c.exhaustion || 0) < 35) nagged[c.id] = 0;
  const speaker = s.party.find(
    (c) =>
      c.hp > 0 &&
      (c.exhaustion || 0) >= 50 &&
      ((c.exhaustion || 0) >= 90 ? 90 : (c.exhaustion || 0) >= 75 ? 75 : 50) >
        (nagged[c.id] || 0),
  );
  if (!speaker) return { ...s, journey: { ...s.journey, nagged } };
  const threshold =
    speaker.exhaustion >= 90 ? 90 : speaker.exhaustion >= 75 ? 75 : 50;
  const lines = {
    barbarian:
      "My arms are turning to stone. Give me a day to sleep, or the next swing will be slow.",
    human:
      "We keep moving, but nobody is watching our backs anymore. We need a sheltered rest.",
    elf: "I can barely hear the corridor over my own breathing. Let us rest before we miss something.",
    dwarf:
      "Even iron breaks if you never let it cool. Find a wall we can put our backs against.",
  };
  return {
    ...s,
    phase: "nag",
    journey: {
      ...s.journey,
      nagged: { ...nagged, [speaker.id]: threshold },
      nag: {
        speaker: speaker.id,
        quote:
          threshold === 90
            ? `“I cannot keep this pace.” ${lines[speaker.race]}`
            : lines[speaker.race],
        resume: s.phase,
      },
    },
  };
}
