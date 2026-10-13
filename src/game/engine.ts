import { resolveBattle } from "./battle";
import {
  Element,
  EVENTS,
  FLOORS,
  ITEMS,
  Item,
  QUESTS,
  QuestId,
  ROUTES,
  Route,
  Vendor,
} from "./world";
import { ARRIVALS } from "./story";
export { SKILLS, resist } from "./combat-data";
export { battleIntent, battleForecast } from "./battle";
export type Race = "barbarian" | "human" | "elf" | "dwarf";
export type Phase =
  | "town"
  | "arrival"
  | "combat"
  | "loot"
  | "encounter"
  | "essence"
  | "victory"
  | "defeat"
  | "event";
export type Skill =
  | "Arcane Bolt"
  | "Shield Bash"
  | "Second Wind"
  | "Inspiring Presence"
  | "Venom Fang"
  | "Nerve Lock"
  | "Twin Strike"
  | "Ember Ward"
  | "Winter Veil"
  | "Toxic Adaptation";
export interface Ailments {
  poison: number;
  paralysis: number;
  ward?: number;
}
export interface Character {
  id: string;
  name: string;
  race: Race;
  job: string;
  portrait: number;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  gear: number;
  skills: Skill[];
  trait: string;
  traitRevealed: boolean;
  ailments: Ailments;
  equipment: string[];
  cooldowns: Partial<Record<Skill, number>>;
}
export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  boss: boolean;
  sprite: number;
  element: Element;
  intent: string;
  poison: number;
  paralysis: number;
  guard: number;
  poise: number;
  maxPoise: number;
  broken: number;
  controlWard: number;
  charged: boolean;
}
export interface Rapport {
  trust: number;
  asked: boolean;
  inspected: boolean;
  offer: number;
  reply: string;
}
export interface BattleEffect {
  id: number;
  damage: number;
  enemyDamage: number;
  critical: boolean;
  kind: string;
  target: string;
  poisonDamage: number;
  stunned: boolean;
  targets: Record<string, number>;
  broken: boolean;
}
export interface Game {
  version: 1;
  started: boolean;
  day: number;
  gold: number;
  gems: number;
  food: number;
  potions: number;
  party: Character[];
  phase: Phase;
  floor: number;
  bestFloor: number;
  kills: number;
  runKills: number;
  runGold: number;
  enemy: Enemy | null;
  turn: number;
  momentum: number;
  log: string[];
  journal: string[];
  message: string;
  essence: number;
  questClaimed: boolean;
  relic: boolean;
  encounterExamined: boolean;
  lastOutcome: string;
  inventory: Record<string, number>;
  route: Route | null;
  eventResolved: boolean;
  sideBattle: boolean;
  rapport: Record<string, Rapport>;
  faction: { guild: number; stag: number };
  quests: Partial<Record<QuestId, "accepted" | "claimed">>;
  plunderers: number;
  scoutsRescued: boolean;
  clanAlly: boolean;
  ending: string;
  effects: BattleEffect;
  guideSeen: boolean;
  introSeen: boolean;
  sound: boolean;
  haptics: boolean;
  reserve: Character[];
  arrivalChoice: string;
  arrivalOutcome: string;
  arrivalEffect: string;
  arrivalScouted: boolean;
}
export const RACES = [
  {
    id: "barbarian" as Race,
    name: "Barbarian",
    job: "Berserker",
    portrait: 3,
    description: "Starter skill: Twin Strike.",
    trait: "Blood rage · +25% attack below 40% HP",
    hp: 180,
    atk: 32,
    def: 10,
    speed: 9,
    mp: 40,
  },
  {
    id: "human" as Race,
    name: "Human",
    job: "Knight",
    portrait: 0,
    description: "Starter skill: Shield Bash. 5% chance to awaken as a Mage.",
    trait: "Last stand · +8 defense below 35% HP",
    hp: 140,
    atk: 25,
    def: 15,
    speed: 12,
    mp: 55,
  },
  {
    id: "elf" as Race,
    name: "Elf",
    job: "Ranger",
    portrait: 1,
    description: "Starter skill: Venom Fang.",
    trait: "Moon sight · attacks ignore half enemy armor",
    hp: 110,
    atk: 29,
    def: 8,
    speed: 20,
    mp: 80,
  },
  {
    id: "dwarf" as Race,
    name: "Dwarf",
    job: "Guardian",
    portrait: 2,
    description: "Starter skill: Shield Bash.",
    trait: "Iron will · immune to paralysis",
    hp: 165,
    atk: 24,
    def: 22,
    speed: 7,
    mp: 50,
  },
];
const raceTraits: Record<Race, string> = {
  barbarian: "Blood Rage",
  human: "Last Stand",
  elf: "Moon Sight",
  dwarf: "Iron Will",
};
export const RECRUITS = [
  {
    id: "kael",
    name: "Kael",
    race: "human" as Race,
    price: 500,
    tagline: "Steady. Reliable.",
    trait: "Vanguard",
    traitDetail: "Standing with the party reduces physical damage by 15%.",
    motive: "honor",
    quote:
      "I don’t need a hero. I need someone who won’t leave a companion behind.",
  },
  {
    id: "lyria",
    name: "Lyria",
    race: "elf" as Race,
    price: 600,
    tagline: "Curious. Brilliant.",
    trait: "Venom Savant",
    traitDetail: "Poison inflicted by the party deals 50% more damage.",
    motive: "discovery",
    quote:
      "The labyrinth remembers a world older than ours. I want to know its name.",
  },
  {
    id: "bram",
    name: "Bram",
    race: "dwarf" as Race,
    price: 500,
    tagline: "Loud. Loyal.",
    trait: "Stoneblood",
    traitDetail: "Born with 25% resistance to venom damage.",
    motive: "honor",
    quote: "Fair pay. Good company. And no one takes my share of the ale.",
  },
  {
    id: "ragnar",
    name: "Ragnar",
    race: "barbarian" as Race,
    price: 700,
    tagline: "Fearless. Unbroken.",
    trait: "Reckless Heart",
    traitDetail: "Below 40% HP, strikes deal 35% more damage.",
    motive: "glory",
    quote: "Gold buys supper. Glory buys a name that death can’t take.",
  },
];
export function makeCharacter(
  race: Race,
  id: string,
  name: string,
  roll = 1,
): Character {
  const r = RACES.find((x) => x.id === race)!;
  const mage = race === "human" && roll < 0.05;
  const recruit = RECRUITS.find((x) => x.id === id);
  return {
    id,
    name,
    race,
    job: mage ? "Mage" : r.job,
    portrait: r.portrait,
    level: 1,
    xp: 0,
    hp: r.hp,
    maxHp: r.hp,
    mp: mage ? 95 : r.mp,
    maxMp: mage ? 95 : r.mp,
    atk: mage ? 34 : r.atk,
    def: r.def,
    speed: r.speed,
    gear: 0,
    skills: [
      mage
        ? "Arcane Bolt"
        : race === "barbarian"
          ? "Twin Strike"
          : race === "elf"
            ? "Venom Fang"
            : "Shield Bash",
    ],
    trait: recruit?.trait || raceTraits[race],
    traitRevealed: id === "hero",
    ailments: { poison: 0, paralysis: 0 },
    equipment: [],
    cooldowns: {},
  };
}
const emptyEffects = (): BattleEffect => ({
  id: 0,
  damage: 0,
  enemyDamage: 0,
  critical: false,
  kind: "attack",
  target: "",
  poisonDamage: 0,
  stunned: false,
  targets: {},
  broken: false,
});
export function initialGame(): Game {
  return {
    version: 1,
    started: false,
    day: 24,
    gold: 2340,
    gems: 120,
    food: 6,
    potions: 3,
    party: [],
    phase: "town",
    floor: 1,
    bestFloor: 0,
    kills: 0,
    runKills: 0,
    runGold: 0,
    enemy: null,
    turn: 1,
    momentum: 0,
    log: [],
    journal: [],
    message: "",
    essence: 0,
    questClaimed: false,
    relic: false,
    encounterExamined: false,
    lastOutcome: "",
    inventory: { antidote: 1, ether: 1 },
    route: null,
    eventResolved: false,
    sideBattle: false,
    rapport: {},
    faction: { guild: 0, stag: 0 },
    quests: { "first-ascent": "accepted" },
    plunderers: 0,
    scoutsRescued: false,
    clanAlly: false,
    ending: "",
    effects: emptyEffects(),
    guideSeen: false,
    introSeen: false,
    sound: true,
    haptics: true,
    reserve: [],
    arrivalChoice: "",
    arrivalOutcome: "",
    arrivalEffect: "",
    arrivalScouted: false,
  };
}
export function normalizeSave(raw: Game): Game {
  const s = { ...initialGame(), ...raw };
  s.introSeen = raw.introSeen ?? raw.started;
  s.party = (raw.party || []).map((c) => ({
    ...makeCharacter(c.race, c.id, c.name),
    ...c,
    ailments: c.ailments || { poison: 0, paralysis: 0 },
    equipment: c.equipment || [],
    cooldowns: c.cooldowns || {},
  }));
  s.reserve = (raw.reserve || []).map((c) => ({
    ...makeCharacter(c.race, c.id, c.name),
    ...c,
    cooldowns: c.cooldowns || {},
    ailments: c.ailments || { poison: 0, paralysis: 0 },
    equipment: c.equipment || [],
  }));
  s.momentum = Math.max(0, Math.min(3, s.momentum || 0));
  s.effects = { ...emptyEffects(), ...s.effects };
  if (s.enemy)
    s.enemy = { ...enemyFor(s.floor, s.route, s.party.length), ...s.enemy };
  return s;
}
export const daysToGate = (day: number) => (30 - (day % 30)) % 30;
export const gateOpen = (day: number) => day % 30 === 0;
export const marketRush = (day: number) => day % 30 >= 27 || day % 30 === 0;
export const buyPrice = (item: Item, day: number) =>
  Math.ceil(item.price * (marketRush(day) ? 1.15 : 1));
export const sellPrice = (item: Item, vendor: Vendor) =>
  Math.round(item.sell * (item.vendor === vendor ? 1.3 : 0.85));
export function floorEnvironment(floor: number, route: Route | null): string {
  const env = FLOORS[Math.min(11, Math.max(0, floor - 1))].environment;
  return env === "route"
    ? route === "roots"
      ? "forest"
      : route === "frost"
        ? "frost"
        : route === "forge"
          ? "forge"
          : "dungeon"
    : env;
}
function enemyFor(
  floor: number,
  route: Route | null = null,
  partySize = 1,
): Enemy {
  const f = FLOORS[floor - 1];
  const boss = floor % 3 === 0;
  let element: Element = f.element;
  let sprite: number = f.sprite;
  if (floor >= 5 && floor <= 7 && route) {
    const r = ROUTES.find((x) => x.id === route)!;
    element = r.element;
    sprite =
      route === "roots"
        ? 7
        : route === "frost"
          ? 9
          : route === "forge"
            ? 10
            : 8;
  }
  const hp = Math.round(
    (boss ? 230 + floor * 50 : 100 + floor * 28) *
      (1 + 0.7 * (Math.max(1, partySize) - 1)),
  );
  return {
    name: f.enemy,
    hp,
    maxHp: hp,
    atk: (boss ? 30 : 24) + floor * 4,
    boss,
    sprite,
    element,
    intent: f.intent,
    poison: 0,
    paralysis: 0,
    guard: floor >= 8 ? 8 : floor >= 3 ? 4 : 0,
    poise: boss ? 140 : 100,
    maxPoise: boss ? 140 : 100,
    broken: 0,
    controlWard: 0,
    charged: false,
  };
}
function note(s: Game, message: string): Game {
  return {
    ...s,
    message,
    journal: [`Day ${s.day} · ${message}`, ...s.journal].slice(0, 100),
  };
}
function gainXp(c: Character, amount: number): Character {
  let n = { ...c, xp: c.xp + amount };
  while (n.xp >= n.level * 70) {
    n = {
      ...n,
      xp: n.xp - n.level * 70,
      level: n.level + 1,
      atk: n.atk + 4,
      def: n.def + 2,
      maxHp: n.maxHp + 15,
      hp: n.hp > 0 ? Math.min(n.hp + 25, n.maxHp + 15) : 0,
      maxMp: n.maxMp + 5,
      mp: Math.min(n.mp + 10, n.maxMp + 5),
    };
  }
  return n;
}
const addLoot = (inventory: Record<string, number>, id: string, n = 1) => ({
  ...inventory,
  [id]: (inventory[id] || 0) + n,
});
const hurtParty = (party: Character[], amount: number) =>
  party.map((c) => ({ ...c, hp: c.hp > 0 ? Math.max(1, c.hp - amount) : 0 }));
export function questProgress(s: Game, id: QuestId): number {
  if (id === "plunderer") return Math.min(1, s.plunderers);
  if (id === "clan-rescue") return s.scoutsRescued && s.clanAlly ? 1 : 0;
  return Math.min(QUESTS.find((q) => q.id === id)!.target, s.bestFloor);
}
export type Action =
  | { type: "CREATE"; race: Race; name: string; roll: number }
  | { type: "RECRUIT"; id: string; offer?: number }
  | { type: "BENCH"; id: string }
  | {
      type: "TALK";
      id: string;
      choice: "strengths" | "honor" | "discovery" | "glory";
    }
  | { type: "REST" }
  | { type: "WORK" }
  | { type: "TRAIN" }
  | { type: "PREPARE_CYCLE"; mode: "rest" | "work" | "train" }
  | { type: "BUY"; item: "food" | "potion" }
  | { type: "BUY_ITEM"; id: string }
  | { type: "BUY_BATCH"; items: { id: string; quantity: number }[] }
  | { type: "CRAFT"; id: "iron-blade" | "leather" }
  | { type: "RENAME"; name: string }
  | { type: "SELL"; id: string; vendor: Vendor; quantity: number }
  | { type: "EQUIP"; character: string; item: string }
  | { type: "FORGE"; id: string }
  | { type: "ENCHANT"; id: string; skill: Skill }
  | { type: "ENTER" }
  | { type: "APPROACH"; choice: string; roll: number }
  | { type: "ENGAGE" }
  | {
      type: "BATTLE";
      kind: "attack" | "skill" | "item" | "guard" | "focus" | "burst";
      roll: number;
      actor?: string;
      skill?: Skill;
      item?: string;
    }
  | { type: "COLLECT" }
  | { type: "ENCOUNTER"; choice: "take" | "examine" | "leave"; roll: number }
  | { type: "EVENT"; choice: string; roll: number }
  | { type: "LEARN"; skill: Skill; id: string }
  | { type: "CONTINUE" }
  | { type: "RETURN" }
  | { type: "CLAIM"; id?: QuestId }
  | { type: "ACCEPT"; id: QuestId }
  | { type: "DISMISS" }
  | { type: "RESET" }
  | { type: "DEFER" }
  | { type: "GUIDE"; show?: boolean }
  | { type: "INTRO_COMPLETED" }
  | { type: "SETTING"; key: "sound" | "haptics"; value: boolean };
function afterFloor(s: Game): Game {
  return { ...s, phase: s.eventResolved ? "victory" : "event" };
}
function battleWon(
  s: Game,
  party: Character[],
  enemy: Enemy,
  effects: BattleEffect,
  logs: string[],
  potions: number,
  inventory: Record<string, number>,
): Game {
  const gold = (s.sideBattle ? 95 : 45) + s.floor * 20 + (enemy.boss ? 130 : 0);
  inventory = addLoot(inventory, "beast-core", enemy.boss ? 3 : 1);
  if (s.floor >= 5 && s.floor <= 7 && s.route)
    inventory = addLoot(
      inventory,
      s.route === "roots"
        ? "night-herb"
        : s.route === "frost"
          ? "frost-shard"
          : s.route === "forge"
            ? "ancient-ore"
            : "relic-fragment",
      2,
    );
  const n = {
    ...s,
    party: party.map((c) => ({
      ...gainXp(c, 35 + s.floor * 8),
      traitRevealed: c.traitRevealed || enemy.boss,
    })),
    gold: s.gold + gold,
    runGold: s.runGold + gold,
    kills: s.kills + 1,
    runKills: s.runKills + 1,
    bestFloor: Math.max(s.bestFloor, s.floor),
    enemy,
    essence: s.essence + (enemy.boss ? 1 : 0),
    potions,
    inventory,
    effects,
    plunderers: s.plunderers + (s.sideBattle ? 1 : 0),
    log: [
      ...logs,
      `${enemy.name} defeated. +${gold} gold; monster cores recovered.`,
      ...s.log,
    ].slice(0, 8),
  };
  return note(
    enemy.boss ? { ...n, phase: "essence" } : afterFloor(n),
    enemy.boss
      ? "A guardian’s essence is yours. Bind a new skill."
      : s.sideBattle
        ? "The plunderer falls. Your party is safe."
        : `Floor ${s.floor} cleared. Recover what the labyrinth left behind.`,
  );
}
export function reducer(s: Game, a: Action): Game {
  if (a.type === "RESET") return initialGame();
  if (a.type === "DISMISS") return { ...s, message: "" };
  if (a.type === "SETTING") return { ...s, [a.key]: a.value };
  if (a.type === "GUIDE") return { ...s, guideSeen: !a.show };
  if (a.type === "INTRO_COMPLETED") return { ...s, introSeen: true };
  if (a.type === "RENAME") {
    if (s.phase !== "town" || !a.name.trim()) return s;
    return {
      ...s,
      party: s.party.map((c) =>
        c.id === "hero" ? { ...c, name: a.name.trim().slice(0, 18) } : c,
      ),
    };
  }
  if (a.type === "BUY_BATCH") {
    if (s.phase !== "town" || !a.items.length || a.items.length > ITEMS.length)
      return s;
    const valid = a.items.every(
      (entry) =>
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        entry.quantity <= 10 &&
        ITEMS.some((item) => item.id === entry.id && item.kind !== "loot"),
    );
    if (!valid) return s;
    const total = a.items.reduce(
      (sum, entry) =>
        sum +
        buyPrice(
          ITEMS.find((i) => i.id === entry.id)!,
          s.day,
        ) *
          entry.quantity,
      0,
    );
    if (s.gold < total) return note(s, "Not enough gold for this cart.");
    let result = s;
    for (const entry of a.items)
      for (let n = 0; n < entry.quantity; n++)
        result = reducer(result, { type: "BUY_ITEM", id: entry.id });
    return result;
  }
  if (a.type === "CRAFT") {
    if (s.phase !== "town" || !["iron-blade", "leather"].includes(a.id))
      return s;
    if (s.gold < 90 || (s.inventory["beast-core"] || 0) < 3)
      return note(s, "You need 3 monster cores and 90 gold.");
    return note(
      {
        ...s,
        gold: s.gold - 90,
        inventory: {
          ...s.inventory,
          "beast-core": s.inventory["beast-core"] - 3,
          [a.id]: (s.inventory[a.id] || 0) + 1,
        },
      },
      `${ITEMS.find((i) => i.id === a.id)!.name} crafted.`,
    );
  }
  if (a.type === "CREATE") {
    if (s.started) return s;
    const hero = makeCharacter(
      a.race,
      "hero",
      a.name.trim().slice(0, 18) || "Adventurer",
      a.roll,
    );
    return note(
      { ...initialGame(), started: true, introSeen: true, party: [hero] },
      `${hero.name}, a ${hero.job}, arrived in Stormhold.`,
    );
  }
  if (a.type === "RETURN") {
    if (s.phase === "town") return s;
    return note(
      {
        ...s,
        day: s.day + 1,
        phase: "town",
        enemy: null,
        lastOutcome:
          s.phase === "defeat" ? "Lost expedition" : "Returned safely",
      },
      "The gate sealed. Trade your spoils and prepare for the next opening.",
    );
  }
  if (a.type === "ACCEPT") {
    if (s.quests[a.id]) return s;
    if (a.id === "clan-rescue" && !s.clanAlly)
      return note(s, "Meet the White Stag on Floor 3 to earn its trust.");
    return note(
      { ...s, quests: { ...s.quests, [a.id]: "accepted" } },
      "Contract accepted. Its progress appears in your journal.",
    );
  }
  if (a.type === "CLAIM") {
    const id = a.id || "first-ascent";
    const q = QUESTS.find((x) => x.id === id)!;
    if (s.phase !== "town")
      return note(s, "Return to town to deliver the contract.");
    if (s.quests[id] !== "accepted" || questProgress(s, id) < q.target)
      return note(s, "This contract is not ready to turn in.");
    return note(
      {
        ...s,
        gold: s.gold + q.gold,
        gems: s.gems + q.gems,
        questClaimed: id === "first-ascent" ? true : s.questClaimed,
        quests: { ...s.quests, [id]: "claimed" },
        faction: {
          ...s.faction,
          [q.faction === "White Stag Clan" ? "stag" : "guild"]:
            s.faction[q.faction === "White Stag Clan" ? "stag" : "guild"] + 2,
        },
      },
      `${q.title} fulfilled: ${q.gold} gold and ${q.gems} crystals.`,
    );
  }
  if (a.type === "LEARN") {
    if (
      !s.party.some((c) => c.id === a.id && !c.skills.includes(a.skill)) ||
      s.essence < 1
    )
      return note(s, "Select an unlearned skill and an available essence.");
    const n = note(
      {
        ...s,
        essence: s.essence - 1,
        party: s.party.map((c) =>
          c.id === a.id ? { ...c, skills: [...c.skills, a.skill] } : c,
        ),
      },
      `${a.skill} was permanently bound to your companion.`,
    );
    return s.phase === "essence" ? afterFloor(n) : n;
  }
  if (a.type === "DEFER" && s.phase === "essence")
    return note(
      afterFloor(s),
      "Essence stored. Bind it later from Party → Skills.",
    );
  if (s.phase === "town") {
    if (a.type === "PREPARE_CYCLE") {
      const days = daysToGate(s.day);
      if (!days)
        return note(s, "The gate is open now. Your expedition awaits.");
      if (a.mode === "train" && s.gold < days * 60)
        return note(s, `A full training plan costs ${days * 60} gold.`);
      const party = s.party.map((c) =>
        a.mode === "train"
          ? gainXp(c, days * 45)
          : a.mode === "rest"
            ? {
                ...c,
                hp: c.maxHp,
                mp: c.maxMp,
                ailments: { poison: 0, paralysis: 0 },
              }
            : c,
      );
      return note(
        {
          ...s,
          day: s.day + days,
          party,
          gold:
            s.gold +
            (a.mode === "work"
              ? 125 * days
              : a.mode === "train"
                ? -60 * days
                : 0),
          faction: {
            ...s.faction,
            guild: s.faction.guild + (a.mode === "work" ? days : 0),
          },
        },
        a.mode === "train"
          ? `${days} days of training complete. The gate is open.`
          : a.mode === "work"
            ? `${days} days of contracts complete. +${125 * days} gold. The gate is open.`
            : "The party rests until the opening. All HP, MP, and ailments restored.",
      );
    }
    if (a.type === "BENCH") {
      const c = s.party.find((c) => c.id === a.id);
      if (!c || c.id === "hero")
        return note(s, "Your adventurer leads this party.");
      return note(
        {
          ...s,
          party: s.party.filter((c) => c.id !== a.id),
          reserve: [...s.reserve, c],
        },
        `${c.name} waits at the tavern. Their levels and gear are kept.`,
      );
    }
    if (a.type === "RECRUIT" && s.reserve.some((c) => c.id === a.id)) {
      if (s.party.length >= 4) return note(s, "Make room in the party first.");
      const c = s.reserve.find((c) => c.id === a.id)!;
      return note(
        {
          ...s,
          party: [...s.party, c],
          reserve: s.reserve.filter((c) => c.id !== a.id),
        },
        `${c.name} returns to the party. No second signing fee.`,
      );
    }
    if (a.type === "TALK") {
      const r = RECRUITS.find((r) => r.id === a.id);
      if (!r) return s;
      const old = s.rapport[a.id] || {
        trust: 0,
        asked: false,
        inspected: false,
        offer: r.price,
        reply: r.quote,
      };
      if (a.choice === "strengths") {
        if (old.inspected)
          return note(s, "You already know their visible strengths.");
        return {
          ...s,
          rapport: {
            ...s.rapport,
            [a.id]: {
              ...old,
              inspected: true,
              trust: old.trust + 1,
              reply: `“I am a ${RACES.find((x) => x.id === r.race)!.job}. ${r.tagline} But there’s more to me than a blade.”`,
            },
          },
        };
      }
      if (old.asked)
        return note(s, "This conversation has already shaped their opinion.");
      const match = a.choice === r.motive;
      return {
        ...s,
        rapport: {
          ...s.rapport,
          [a.id]: {
            ...old,
            asked: true,
            trust: Math.max(0, old.trust + (match ? 2 : -1)),
            reply: match
              ? `“Then we understand one another.” Hidden trait discovered: ${r.trait}. ${r.traitDetail}`
              : "“That is not what I am looking for. A better signing offer might change my mind.”",
          },
        },
      };
    }
    if (a.type === "RECRUIT") {
      const r = RECRUITS.find((r) => r.id === a.id);
      if (!r || s.party.some((c) => c.id === a.id)) return s;
      if (s.party.length >= 4)
        return note(
          s,
          "Your party holds four. Choose your companions carefully.",
        );
      const rp = s.rapport[a.id] || {
        trust: 0,
        asked: false,
        inspected: false,
        offer: r.price,
        reply: r.quote,
      };
      const minimum = Math.max(
        100,
        r.price - rp.trust * 45 - s.faction.guild * 5,
      );
      const offer = a.offer ?? r.price;
      if (!Number.isFinite(offer) || offer < 0 || s.gold < offer)
        return note(
          s,
          "Your signing offer exceeds your gold. Earn more at the guild.",
        );
      if (offer < minimum)
        return {
          ...s,
          message: `${r.name} asks for at least ${minimum} gold. Build trust or raise your offer.`,
          rapport: {
            ...s.rapport,
            [a.id]: {
              ...rp,
              offer: minimum,
              reply: `“${minimum} gold, and I’ll walk with you.”`,
            },
          },
        };
      const c = makeCharacter(r.race, r.id, r.name);
      c.traitRevealed = rp.trust >= 2;
      return note(
        { ...s, gold: s.gold - offer, party: [...s.party, c] },
        `${r.name} accepted ${offer} gold and joined your party.`,
      );
    }
    if (a.type === "REST")
      return note(
        {
          ...s,
          day: s.day + 1,
          party: s.party.map((c) => ({
            ...c,
            hp: c.maxHp,
            mp: c.maxMp,
            ailments: { poison: 0, paralysis: 0 },
          })),
        },
        "Rested at the inn. Everyone’s HP, MP, and ailments are restored.",
      );
    if (a.type === "WORK")
      return note(
        {
          ...s,
          day: s.day + 1,
          gold: s.gold + 125,
          faction: { ...s.faction, guild: s.faction.guild + 1 },
        },
        "Completed a town contract. +125 gold and +1 guild standing.",
      );
    if (a.type === "TRAIN") {
      if (s.gold < 60) return note(s, "Training costs 60 gold.");
      return note(
        {
          ...s,
          day: s.day + 1,
          gold: s.gold - 60,
          party: s.party.map((c) => gainXp(c, 45)),
        },
        "The party trained together. Everyone gained 45 XP.",
      );
    }
    if (a.type === "BUY" || a.type === "BUY_ITEM") {
      const item = ITEMS.find(
        (x) =>
          x.id ===
          (a.type === "BUY"
            ? a.item === "food"
              ? "rations"
              : "potion"
            : a.id),
      );
      if (!item || item.kind === "loot") return s;
      const price = buyPrice(item, s.day);
      if (s.gold < price)
        return note(s, `You need ${price} gold for ${item.name}.`);
      const n = {
        ...s,
        gold: s.gold - price,
        food: s.food + (item.effect === "food" ? item.quantity || 1 : 0),
        potions: s.potions + (item.effect === "potion" ? 1 : 0),
        inventory:
          item.effect === "food" || item.effect === "potion"
            ? s.inventory
            : addLoot(s.inventory, item.id),
      };
      return note(
        n,
        `Purchased ${item.name} for ${price} gold${marketRush(s.day) ? " · gate-season price" : ""}.`,
      );
    }
    if (a.type === "SELL") {
      const item = ITEMS.find((x) => x.id === a.id);
      const owned = s.inventory[a.id] || 0;
      if (
        !item ||
        !Number.isInteger(a.quantity) ||
        a.quantity < 1 ||
        owned < a.quantity
      )
        return note(s, "You do not have those expedition spoils.");
      const gold = sellPrice(item, a.vendor) * a.quantity;
      return note(
        {
          ...s,
          gold: s.gold + gold,
          inventory: { ...s.inventory, [a.id]: owned - a.quantity },
        },
        `Sold ${a.quantity} ${item.name} for ${gold} gold.`,
      );
    }
    if (a.type === "EQUIP") {
      const item = ITEMS.find((x) => x.id === a.item),
        c = s.party.find((x) => x.id === a.character);
      if (
        !item ||
        !c ||
        !["weapon", "armor", "charm"].includes(item.kind) ||
        !s.inventory[item.id]
      )
        return note(s, "Buy this equipment before equipping it.");
      const old = c.equipment.find(
        (id) => ITEMS.find((i) => i.id === id)?.kind === item.kind,
      );
      const prev = ITEMS.find((x) => x.id === old);
      const inventory = { ...s.inventory, [item.id]: s.inventory[item.id] - 1 };
      if (old) inventory[old] = (inventory[old] || 0) + 1;
      return note(
        {
          ...s,
          inventory,
          party: s.party.map((p) =>
            p.id === c.id
              ? {
                  ...p,
                  atk: p.atk - (prev?.atk || 0) + (item.atk || 0),
                  def: p.def - (prev?.def || 0) + (item.def || 0),
                  equipment: [
                    ...p.equipment.filter((id) => id !== old),
                    item.id,
                  ],
                }
              : p,
          ),
        },
        `${c.name} equipped ${item.name}.`,
      );
    }
    if (a.type === "FORGE") {
      const c = s.party.find((x) => x.id === a.id);
      if (!c) return s;
      const cost = 120 + c.gear * 80;
      if (s.gold < cost) return note(s, `Tempering costs ${cost} gold.`);
      return note(
        {
          ...s,
          gold: s.gold - cost,
          party: s.party.map((c) =>
            c.id === a.id
              ? { ...c, gear: c.gear + 1, atk: c.atk + 6, def: c.def + 2 }
              : c,
          ),
        },
        "Weapon tempered. Attack +6, defense +2.",
      );
    }
    if (a.type === "ENCHANT") {
      if (s.gems < 30 || s.gold < 100)
        return note(s, "Essence refinement costs 30 crystals and 100 gold.");
      if (!s.party.some((c) => c.id === a.id && !c.skills.includes(a.skill)))
        return s;
      return note(
        {
          ...s,
          gems: s.gems - 30,
          gold: s.gold - 100,
          party: s.party.map((c) =>
            c.id === a.id ? { ...c, skills: [...c.skills, a.skill] } : c,
          ),
        },
        `${a.skill} refined from crystals and bound to your companion.`,
      );
    }
    if (a.type === "ENTER") {
      if (!gateOpen(s.day))
        return note(s, `The labyrinth opens in ${daysToGate(s.day)} days.`);
      if (s.food < 3)
        return note(s, "You need 3 rations to enter. Visit Copper Lane.");
      if (!s.party.some((c) => c.hp > 0))
        return note(s, "Rest your party before entering.");
      return note(
        {
          ...s,
          food: s.food - 3,
          floor: 1,
          phase: "arrival",
          enemy: enemyFor(1, null, s.party.length),
          turn: 1,
          momentum: 0,
          party: s.party.map((c) => ({ ...c, cooldowns: {} })),
          runKills: 0,
          runGold: 0,
          route: null,
          eventResolved: false,
          sideBattle: false,
          ending: "",
          arrivalChoice: "",
          arrivalOutcome: "",
          arrivalEffect: "",
          arrivalScouted: false,
          effects: emptyEffects(),
          log: [FLOORS[0].intro],
        },
        "Entered the cave. Goblin voices echo beyond the bend.",
      );
    }
    return s;
  }
  if (
    a.type === "APPROACH" &&
    s.phase === "arrival" &&
    s.enemy &&
    !s.arrivalChoice
  ) {
    const choice = ARRIVALS[s.floor - 1]?.choices.find(
      (c) => c.id === a.choice,
    );
    if (!choice || !Number.isFinite(a.roll)) return s;
    if ((choice.effect === "rest" || choice.effect === "ward") && s.food < 1)
      return note(s, "You need 1 ration for this preparation.");
    let enemy = { ...s.enemy },
      party = s.party,
      food = s.food,
      effect = "",
      success = true;
    if (choice.effect === "observe") {
      enemy.atk = Math.max(1, Math.round(enemy.atk * 0.9));
      effect = "Enemy ATK −10%";
    } else if (choice.effect === "ambush") {
      success =
        (!!choice.favoredRace &&
          party.some((c) => c.hp > 0 && c.race === choice.favoredRace)) ||
        Math.max(0, Math.min(0.999999, a.roll)) < (enemy.boss ? 0.45 : 0.65);
      if (success) {
        const hit = Math.max(
          1,
          Math.round(enemy.maxHp * (enemy.boss ? 0.13 : 0.18)),
        );
        enemy.hp = Math.max(1, enemy.hp - hit);
        enemy.paralysis = enemy.boss ? 0 : 1;
        effect = `Opening hit: −${hit} enemy HP${enemy.boss ? "" : " · First attack interrupted"}`;
      } else effect = "Ambush discovered · No opening advantage";
    } else if (choice.effect === "rush") {
      const hit = Math.max(1, Math.round(enemy.maxHp * 0.15));
      const harm = 8 + s.floor * 2;
      enemy.hp = Math.max(1, enemy.hp - hit);
      party = hurtParty(party, harm);
      effect = `−${hit} enemy HP · −${harm} party HP`;
    } else if (choice.effect === "rest") {
      food--;
      party = party.map((c) =>
        c.hp > 0
          ? {
              ...c,
              hp: Math.min(c.maxHp, c.hp + 20),
              mp: Math.min(c.maxMp, c.mp + 15),
            }
          : c,
      );
      effect = "−1 ration · +20 HP and +15 MP per standing ally";
    } else if (choice.effect === "ward") {
      food--;
      enemy.atk = Math.max(1, Math.round(enemy.atk * 0.8));
      party = party.map((c) =>
        c.hp > 0 ? { ...c, ailments: { poison: 0, paralysis: 0, ward: 3 } } : c,
      );
      effect = "−1 ration · Enemy ATK −20% · Ailment ward for 3 turns";
    }
    const outcome = success ? choice.success : choice.failure || choice.success;
    return note(
      {
        ...s,
        enemy,
        party,
        food,
        arrivalChoice: choice.id,
        arrivalOutcome: outcome,
        arrivalEffect: effect,
        arrivalScouted: choice.effect === "observe",
        phase: party.some((c) => c.hp > 0) ? "arrival" : "defeat",
      },
      `${ARRIVALS[s.floor - 1].title}: ${choice.label}. ${effect}.`,
    );
  }
  if (a.type === "ENGAGE" && s.phase === "arrival" && s.arrivalChoice)
    return {
      ...s,
      phase: "combat",
      message: "",
      log: [s.arrivalOutcome, ...s.log].slice(0, 8),
    };
  if (a.type === "BATTLE" && s.phase === "combat" && s.enemy)
    return resolveBattle(s, a, battleWon);
  if (a.type === "EVENT" && s.phase === "event")
    return resolveEvent(s, a.choice, a.roll);
  if (a.type === "CONTINUE" && s.phase === "victory") {
    if (s.floor >= 12)
      return note(
        s,
        "The campaign is complete. Return with your story and the crown.",
      );
    if (s.food < 1) return note(s, "No rations remain. Return to town safely.");
    const floor = s.floor + 1;
    return {
      ...s,
      phase: "arrival",
      floor,
      food: s.food - 1,
      enemy: enemyFor(floor, s.route, s.party.length),
      momentum: 0,
      party: s.party.map((c) => ({ ...c, cooldowns: {} })),
      eventResolved: false,
      sideBattle: false,
      encounterExamined: false,
      turn: 1,
      effects: emptyEffects(),
      log: [FLOORS[floor - 1].intro, ...s.log].slice(0, 8),
      message: "",
      arrivalChoice: "",
      arrivalOutcome: "",
      arrivalEffect: "",
      arrivalScouted: false,
    };
  }
  // Compatibility for older saves at the original relic/treasure screens.
  if (a.type === "COLLECT" && s.phase === "loot")
    return note(
      { ...s, phase: "victory", gold: s.gold + 100, potions: s.potions + 1 },
      "Treasure recovered: 100 gold and a healing potion.",
    );
  if (a.type === "ENCOUNTER" && s.phase === "encounter") {
    if (a.choice === "examine")
      return note(
        { ...s, encounterExamined: true },
        "The ward is understood. The blade can be removed safely.",
      );
    const safe = s.encounterExamined || a.roll >= 0.35;
    return note(
      {
        ...s,
        phase: "victory",
        relic: s.relic || (a.choice === "take" && safe),
        party:
          a.choice === "take"
            ? safe
              ? s.party.map((c) => ({ ...c, atk: c.atk + (s.relic ? 0 : 5) }))
              : hurtParty(s.party, 30)
            : s.party,
      },
      a.choice === "take" && safe
        ? "Dawnbringer grants +5 party attack."
        : "You leave the ancient ward behind.",
    );
  }
  return s;
}
function resolveEvent(s: Game, choice: string, roll: number): Game {
  const kind = FLOORS[s.floor - 1].event;
  const allowed = EVENTS[kind].choices.some((c) => c.id === choice);
  if (!allowed) return s;
  const done = (n: Game, message: string) =>
    note({ ...n, phase: "victory", eventResolved: true }, message);
  const fight = (name: string, ambush = false) => {
    const hp = Math.round(
      (140 + s.floor * 35) * (1 + 0.7 * (s.party.length - 1)),
    );
    return note(
      {
        ...s,
        phase: "combat",
        eventResolved: true,
        sideBattle: true,
        turn: 1,
        momentum: 0,
        party: (ambush ? hurtParty(s.party, 22) : s.party).map((c) => ({
          ...c,
          cooldowns: {},
        })),
        enemy: {
          name,
          hp,
          maxHp: hp,
          atk: 19 + s.floor * 4,
          boss: false,
          sprite: 6,
          element: "physical",
          intent: "Backstab",
          poison: 0,
          paralysis: 0,
          guard: 3,
          poise: 100,
          maxPoise: 100,
          broken: 0,
          controlWard: 0,
          charged: false,
        },
        log: [
          ambush
            ? "His blade flashes. The stranger is a plunderer!"
            : "You catch his blade before it reaches your companion. The plunderer draws steel.",
        ],
        effects: emptyEffects(),
      },
      ambush
        ? "The stranger attacks the sleeping party! Everyone loses 22 HP."
        : "The stranger is a plunderer. You were right to keep watch.",
    );
  };
  if (kind === "camp") {
    if (choice === "leave") {
      if (s.gold < 40)
        return note(
          s,
          "You need 40 gold for the distraction. Keep watch instead.",
        );
      return done(
        { ...s, gold: s.gold - 40 },
        "You leave the stranger behind. A dagger glints as he watches you go.",
      );
    }
    return fight("The Smiling Plunderer", choice === "welcome");
  }
  if (kind === "caravan") {
    if (choice === "leave")
      return done(
        { ...s, faction: { ...s.faction, guild: s.faction.guild + 2 } },
        "The caravan is marked for the guild. +2 standing.",
      );
    const inventory = addLoot(
      addLoot(s.inventory, "beast-core", 2),
      "relic-fragment",
    );
    return done(
      {
        ...s,
        inventory,
        potions: s.potions + 1,
        gold: s.gold + (choice === "rush" ? 130 : 65),
        party: choice === "rush" ? hurtParty(s.party, 15) : s.party,
      },
      choice === "rush"
        ? "You recover the cargo, but its ward cuts the party for 15 HP."
        : "Tripwires disarmed. Recovered cores, a relic fragment, gold, and a potion.",
    );
  }
  if (kind === "clan") {
    if (choice === "ally")
      return done(
        {
          ...s,
          clanAlly: true,
          food: s.food + 2,
          faction: { ...s.faction, stag: s.faction.stag + 3 },
          quests: {
            ...s.quests,
            "clan-rescue":
              s.quests["clan-rescue"] === "claimed" ? "claimed" : "accepted",
          },
        },
        "You join the White Stag’s cause. +2 rations; rescue contract unlocked.",
      );
    if (choice === "trade")
      return done(
        { ...s, gold: s.gold + 120 },
        "Serin pays 120 gold for your account of the lower floors.",
      );
    return done(s, "You decline the banner. Serin respects your independence.");
  }
  if (kind === "routes")
    return done(
      { ...s, route: choice as Route },
      `You choose ${ROUTES.find((r) => r.id === choice)!.name}. Its dangers and spoils will shape the next three floors.`,
    );
  if (kind === "shrine") {
    if (choice === "meditate")
      return done(
        {
          ...s,
          party: s.party.map((c) => ({
            ...c,
            mp: c.hp > 0 ? Math.min(c.maxMp, c.mp + 25) : c.mp,
          })),
        },
        "The shrine quiets. Standing allies recover 25 MP.",
      );
    if (choice === "blood")
      return done(
        { ...s, party: hurtParty(s.party, 18), essence: s.essence + 1 },
        "The shrine takes 18 HP from standing allies. A new essence crystallizes.",
      );
    return done(s, "You turn from the reflection. It watches you leave.");
  }
  if (kind === "distillery") {
    if (choice === "antidote")
      return done(
        {
          ...s,
          inventory: addLoot(s.inventory, "antidote", 2),
          party: s.party.map((c) => ({
            ...c,
            ailments: { poison: 0, paralysis: 0 },
          })),
        },
        "The silverleaf yields two antidotes and cleanses the party.",
      );
    if (choice === "herbs")
      return done(
        { ...s, inventory: addLoot(s.inventory, "night-herb", 4) },
        "Four nightroot herbs gathered. Moonleaf pays a premium for them.",
      );
    return done(
      { ...s, inventory: addLoot(s.inventory, "ether", 2) },
      "Two moondew ethers preserved for the final ascent.",
    );
  }
  if (kind === "bridge") {
    if (choice === "fight") return fight("The Ropeway Plunderer");
    if (choice === "pay") {
      if (s.gold < 90)
        return note(
          s,
          "You cannot afford the toll. Fight or find another path.",
        );
      return done(
        { ...s, gold: s.gold - 90 },
        "You pay the toll. The plunderers let your party pass.",
      );
    }
    const elf = s.party.some((c) => c.race === "elf" && c.hp > 0);
    return done(
      { ...s, party: elf ? s.party : hurtParty(s.party, 15) },
      elf
        ? "Your elf finds a hidden crossing. No gold. No blood."
        : "The climb costs the standing party 15 HP, but you cross.",
    );
  }
  if (kind === "relic") {
    if (choice === "examine")
      return note(
        { ...s, encounterExamined: true },
        "The inscription reveals the ward. Dawnbringer is safe to remove.",
      );
    if (choice === "leave")
      return done(s, "You leave the blade in the garden.");
    const safe = s.encounterExamined || roll >= 0.35;
    return done(
      {
        ...s,
        relic: s.relic || safe,
        party: safe
          ? s.party.map((c) => ({ ...c, atk: c.atk + (s.relic ? 0 : 5) }))
          : hurtParty(s.party, 30),
        inventory: safe
          ? addLoot(s.inventory, "relic-fragment", 2)
          : s.inventory,
      },
      safe
        ? "Dawnbringer acquired. +5 attack to every companion."
        : "The ward erupts. Standing allies lose 30 HP. The blade vanishes.",
    );
  }
  if (kind === "rescue") {
    if (choice === "rescue") {
      if (s.food < 2)
        return note(s, "The scouts need two rations. Share medicine or leave.");
      return done(
        {
          ...s,
          food: s.food - 2,
          scoutsRescued: true,
          faction: { ...s.faction, stag: s.faction.stag + 5 },
        },
        "The scouts escape with your supplies. The White Stag will remember this.",
      );
    }
    if (choice === "share") {
      if (s.potions < 1) return note(s, "You need a healing potion to share.");
      return done(
        {
          ...s,
          potions: s.potions - 1,
          faction: { ...s.faction, stag: s.faction.stag + 2 },
        },
        "Your potion buys the scouts another chance. +2 clan standing.",
      );
    }
    return done(
      {
        ...s,
        gold: s.gold + 250,
        clanAlly: false,
        faction: { ...s.faction, stag: Math.max(0, s.faction.stag - 5) },
      },
      "You take 250 gold. The clan’s banner—and your alliance—are left behind.",
    );
  }
  if (kind === "vault") {
    if (choice === "leave")
      return done(
        {
          ...s,
          gold: s.gold + 80,
          inventory: addLoot(s.inventory, "ancient-ore"),
        },
        "The outer cache yields 80 gold and ancient ore.",
      );
    const safe =
      choice === "pick" && s.party.some((c) => c.hp > 0 && c.race === "dwarf");
    const gold = choice === "force" ? 300 : 220;
    return done(
      {
        ...s,
        gold: s.gold + gold,
        party: safe ? s.party : hurtParty(s.party, 20),
        inventory: addLoot(s.inventory, "relic-fragment", 3),
      },
      safe
        ? "The dwarf opens the vault. +220 gold and three relic fragments."
        : `The blades strike for 20 party HP. You recover ${gold} gold and three fragments.`,
    );
  }
  if (kind === "merchant") {
    if (choice === "leave")
      return done(s, "You pass the last lantern. Only the king remains.");
    const price = choice === "rest" ? 180 : 120;
    if (s.gold < price)
      return note(
        s,
        `The merchant asks ${price} gold. Choose another offer or leave.`,
      );
    if (choice === "rest")
      return done(
        {
          ...s,
          gold: s.gold - price,
          party: s.party.map((c) => ({
            ...c,
            hp:
              c.hp > 0
                ? Math.min(c.maxHp, c.hp + Math.round(c.maxHp * 0.5))
                : 0,
            mp: c.hp > 0 ? Math.min(c.maxMp, c.mp + 30) : c.mp,
            ailments: { poison: 0, paralysis: 0 },
          })),
        },
        "Sheltered rest restores standing allies and clears ailments.",
      );
    return done(
      {
        ...s,
        gold: s.gold - price,
        food: s.food + 3,
        potions: s.potions + 1,
        inventory: addLoot(s.inventory, "antidote"),
      },
      "Survival bundle purchased: 3 rations, a potion, and an antidote.",
    );
  }
  if (kind === "throne")
    return done(
      {
        ...s,
        ending:
          choice === "seal"
            ? "Keeper of the Gate"
            : "Bearer of the Hollow Crown",
        inventory: addLoot(s.inventory, "hollow-crown"),
        essence: s.essence + (choice === "claim" ? 1 : 0),
        faction: {
          ...s.faction,
          stag: s.faction.stag + (choice === "seal" ? 8 : 0),
        },
      },
      choice === "seal"
        ? "You seal the throne. Stormhold sees another dawn."
        : "You carry the crown home. Power follows where you walk.",
    );
  return s;
}
