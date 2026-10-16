import type { Action, Game } from "./engine";
import { GENERIC_ENCOUNTERS } from "./generic-encounters";
import { nextRandom } from "./monsters";
import { directedEncounter } from "./encounter-director";
import { encounterKey } from "./exploration-state";

export interface GenericRecord {
  id: string;
  variant: number;
  resolved: boolean;
  choice?: string;
  outcome?: string;
}
export function assignGeneric(s: Game, room: string): Game {
  const stored = s.expedition.generic[room];
  if (stored)
    return stored.resolved
      ? {
          ...s,
          phase: "exploration",
          message: stored.outcome || "The travellers have moved on.",
          journey: { ...s.journey, branch: null },
        }
      : s;
  const planned = directedEncounter(s)?.generic;
  if (s.expedition.director) {
    const encounter = GENERIC_ENCOUNTERS.find((c) => c.id === planned?.id);
    if (
      !encounter ||
      encounter.family === s.stories.genericFamily ||
      (s.stories.genericHistory[encounter.id] ?? -2) >= s.expedition.number - 1
    )
      return {
        ...s,
        phase: "exploration",
        journey: {
          ...s.journey,
          branch: null,
          resolvedBranches: [...new Set([...s.journey.resolvedBranches, room])],
        },
        message: "The travellers have moved on; only their old camp remains.",
      };
    return {
      ...s,
      stories: {
        ...s.stories,
        genericBag: s.stories.genericBag.filter((id) => id !== encounter.id),
        genericFamily: encounter.family,
        genericHistory: {
          ...s.stories.genericHistory,
          [encounter.id]: s.expedition.number,
        },
      },
      expedition: {
        ...s.expedition,
        generic: {
          ...s.expedition.generic,
          [room]: {
            id: encounter.id,
            variant: planned!.variant,
            resolved: false,
          },
        },
      },
    };
  }
  const eligible = GENERIC_ENCOUNTERS.filter(
    (c) =>
      s.floor >= c.minFloor &&
      s.floor <= c.maxFloor &&
      (!c.route || s.route === c.route) &&
      (!c.faction || s.faction[c.faction] >= (c.standing || 0)) &&
      (s.stories.genericHistory[c.id] ?? -2) < s.expedition.number - 1,
  );
  let seed = s.rng.encounters;
  let bag = s.stories.genericBag.filter((id) =>
    eligible.some((c) => c.id === id),
  );
  const draw = () => {
    const next = nextRandom(seed);
    seed = next.seed;
    return next.roll;
  };
  // A deferred same-family entry must not block a new eligible pool forever.
  const hasDifferentFamily = (id: string) =>
    GENERIC_ENCOUNTERS.find((c) => c.id === id)!.family !==
    s.stories.genericFamily;
  if (
    !bag.length ||
    (!bag.some(hasDifferentFamily) &&
      eligible.some((c) => c.family !== s.stories.genericFamily))
  ) {
    bag = eligible.map((c) => c.id);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(draw() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const index = bag.findIndex(
    (id) =>
      GENERIC_ENCOUNTERS.find((c) => c.id === id)!.family !==
      s.stories.genericFamily,
  );
  if (index < 0)
    return {
      ...s,
      phase: "exploration",
      message: "The chamber is quiet this month.",
      journey: {
        ...s.journey,
        branch: null,
        resolvedBranches: [...new Set([...s.journey.resolvedBranches, room])],
      },
    };
  const id = bag[index],
    encounter = GENERIC_ENCOUNTERS.find((c) => c.id === id)!;
  bag.splice(index, 1);
  const variant = Math.floor(draw() * encounter.variants.length);
  return {
    ...s,
    rng: { ...s.rng, encounters: seed },
    stories: {
      ...s.stories,
      genericBag: bag,
      genericFamily: encounter.family,
      genericHistory: {
        ...s.stories.genericHistory,
        [id]: s.expedition.number,
      },
    },
    expedition: {
      ...s.expedition,
      generic: {
        ...s.expedition.generic,
        [room]: { id, variant, resolved: false },
      },
    },
  };
}
export function resolveGenericAction(s: Game, a: Action): Game | undefined {
  if (a.type !== "GENERIC_CHOICE" && a.type !== "BRANCH_CHOICE")
    return undefined;
  const room = encounterKey(s),
    record = s.expedition.generic[room];
  if (!record || s.phase !== "branch" || s.journey.branch?.kind !== "company")
    return undefined;
  if (
    record.resolved ||
    (a.type === "GENERIC_CHOICE" && (a.room !== room || a.id !== record.id))
  )
    return s;
  const encounter = GENERIC_ENCOUNTERS.find((c) => c.id === record.id),
    choice = encounter?.choices.find((c) => c.id === a.choice);
  if (!choice || !encounter) return s;
  if (s.food < (choice.foodCost || 0) || s.gold < (choice.goldCost || 0))
    return {
      ...s,
      message:
        "You do not have the supplies required for that offer. You can still pass quietly.",
    };
  return {
    ...s,
    phase: "exploration",
    food: s.food - (choice.foodCost || 0) + (choice.food || 0),
    gold: s.gold - (choice.goldCost || 0) + (choice.gold || 0),
    inventory: choice.item
      ? { ...s.inventory, [choice.item]: (s.inventory[choice.item] || 0) + 1 }
      : s.inventory,
    expedition: {
      ...s.expedition,
      generic: {
        ...s.expedition.generic,
        [room]: {
          ...record,
          resolved: true,
          choice: choice.id,
          outcome: choice.outcome,
        },
      },
    },
    journey: {
      ...s.journey,
      branch: null,
      resolvedBranches: [...new Set([...s.journey.resolvedBranches, room])],
      met: s.journey.met + (encounter.people && choice.id !== "leave" ? 1 : 0),
    },
    message: choice.outcome,
    journal: [`${encounter.title}: ${choice.outcome}`, ...s.journal].slice(
      0,
      60,
    ),
  };
}
