import type { Game, Phase } from "./engine";
import type { Journey } from "./exploration";

const REST_PHASES: readonly Phase[] = [
  "arrival",
  "exploration",
  "branch",
  "event",
  "encounter",
  "story",
  "victory",
  "loot",
  "essence",
  "nag",
];

/** A location can be rested in while its interaction is still unfinished. */
export const canRestHere = (s: Game) =>
  s.journey.startDay !== null &&
  s.journey.watches < 180 &&
  !s.trial &&
  !s.fieldRest &&
  !s.roundPlayback &&
  !s.playback &&
  REST_PHASES.includes(s.phase);

export type FieldRestResume = Pick<
  Game,
  | "phase"
  | "enemy"
  | "combat"
  | "lootReceipt"
  | "discoveryReceipt"
  | "sideBattle"
  | "arrivalChoice"
  | "arrivalOutcome"
  | "arrivalEffect"
  | "arrivalScouted"
  | "effects"
  | "turn"
  | "momentum"
> & {
  journey: Pick<
    Journey,
    | "branch"
    | "branchFight"
    | "defender"
    | "portal"
    | "campReturn"
    | "wildCamp"
    | "nag"
  >;
};

export function rememberRestLocation(s: Game): FieldRestResume {
  return {
    phase: s.phase,
    enemy: s.enemy,
    combat: s.combat,
    lootReceipt: s.lootReceipt,
    discoveryReceipt: s.discoveryReceipt || null,
    sideBattle: s.sideBattle,
    arrivalChoice: s.arrivalChoice,
    arrivalOutcome: s.arrivalOutcome,
    arrivalEffect: s.arrivalEffect,
    arrivalScouted: s.arrivalScouted,
    effects: s.effects,
    turn: s.turn,
    momentum: s.momentum,
    journey: {
      branch: s.journey.branch,
      branchFight: s.journey.branchFight,
      defender: s.journey.defender,
      portal: s.journey.portal,
      campReturn: s.journey.campReturn,
      wildCamp: s.journey.wildCamp,
      nag: s.journey.nag,
    },
  };
}

export function resumeRestLocation(s: Game): Game {
  const saved = s.fieldRest;
  if (!saved) return s;
  if (s.journey.watches >= 180 || s.expedition.lost)
    return {
      ...s,
      fieldRest: null,
      phase: s.expedition.lost ? s.phase : "extraction",
    };
  return {
    ...s,
    ...saved,
    fieldRest: null,
    party: s.party.map((c) => ({
      ...c,
      battleMastery: saved.combat?.mastery[c.id] || {},
      cooldowns: {},
    })),
    journey: { ...s.journey, ...saved.journey },
  };
}
