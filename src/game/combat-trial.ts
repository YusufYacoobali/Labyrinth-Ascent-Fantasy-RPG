import {
  enemyFor,
  gainXp,
  initialGame,
  makeCharacter,
  reducer,
  RECRUITS,
  type Game,
  type Race,
} from "./engine";
import { FLOORS } from "./world";

export const TRIAL_CHARACTERS = [
  {
    id: "hero-barbarian",
    name: "Bjorn · Barbarian",
    race: "barbarian" as Race,
    character: "hero",
    roll: 1,
  },
  {
    id: "hero-human",
    name: "Human · Knight",
    race: "human" as Race,
    character: "hero",
    roll: 1,
  },
  {
    id: "hero-mage",
    name: "Human · Mage",
    race: "human" as Race,
    character: "hero",
    roll: 0,
  },
  {
    id: "hero-elf",
    name: "Elf · Ranger",
    race: "elf" as Race,
    character: "hero",
    roll: 1,
  },
  {
    id: "hero-dwarf",
    name: "Dwarf · Guardian",
    race: "dwarf" as Race,
    character: "hero",
    roll: 1,
  },
  ...RECRUITS.map((r) => ({
    id: r.id,
    name: r.name + " · " + r.job,
    race: r.race,
    character: r.id,
    roll: 1,
  })),
];
export const TRIAL_ENEMIES = [
  ...FLOORS.map((f) => ({
    id: String(f.id),
    name: f.id + " · " + f.enemy,
    floor: f.id,
  })),
  { id: "plunderer", name: "Side encounter · Plunderer", floor: 3 },
  { id: "bonegnaw", name: "Side encounter · Bonegnaw", floor: 2 },
];
export type TrialConfig = { party: string[]; enemy: string };
export const DEFAULT_TRIAL: TrialConfig = {
  party: ["hero-barbarian", "kael", "elowen", "mira"],
  enemy: "1",
};

/** Memory-only fixtures. Unlocks and level preparation here never touch the saved campaign. */
export function trialSave(config: TrialConfig): Game {
  const target =
    TRIAL_ENEMIES.find((e) => e.id === config.enemy) || TRIAL_ENEMIES[0];
  const level = target.floor + 2;
  const party = config.party.map((key, i) => {
    const preset =
      TRIAL_CHARACTERS.find((c) => c.id === key) || TRIAL_CHARACTERS[0];
    const name =
      preset.character === "hero"
        ? preset.id === "hero-barbarian"
          ? "Bjorn"
          : preset.name.split(" · ")[0]
        : RECRUITS.find((r) => r.id === preset.character)!.name;
    const c = makeCharacter(preset.race, preset.character, name, preset.roll);
    const xpNeeded = Math.max(
      0,
      (70 * level * (level - 1)) / 2 -
        (70 * c.level * (c.level - 1)) / 2 -
        c.xp,
    );
    const prepared = gainXp(c, xpNeeded);
    return {
      ...prepared,
      id: "trial-" + i,
      hp: prepared.maxHp,
      mp: prepared.maxMp,
    };
  });
  let s = reducer(initialGame(), {
    type: "CREATE",
    race: "barbarian",
    name: "Bjorn",
    roll: 1,
  });
  s = reducer(
    { ...s, party, day: 30, food: 24, potions: 8 },
    { type: "ENTER" },
  );
  s = reducer(s, { type: "MISSION", id: "survey" });
  const enemy = enemyFor(target.floor, null, party.length);
  if (config.enemy === "plunderer") {
    enemy.species = "plunderer";
    enemy.name = "The Plunderer";
    enemy.sprite = 6;
  }
  if (config.enemy === "bonegnaw") {
    enemy.species = "bonegnaw";
    enemy.name = "Bonegnaw Scavenger";
    enemy.sprite = 20;
  }
  return {
    ...s,
    trial: true,
    floor: target.floor,
    party,
    enemy,
    phase: "combat",
    sideBattle: config.enemy === "plunderer",
    walkthrough: { active: false, minimized: false, done: [] },
  };
}
