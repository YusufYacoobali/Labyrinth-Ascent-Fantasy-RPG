import { generateFloor, seedFor } from "./floor-map";
import {
  advanceWalkthrough,
  newWalkthrough,
  walkthroughTip,
  type Walkthrough,
} from "./walkthrough";
import { tire, maybeComplain, exertForAction } from "./exhaustion";
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
  GEAR_KINDS,
} from "./world";
import { RECRUITS, RECIPES, type Recruit } from "./town-content";
import { ARRIVALS } from "./story";
import {
  newJourney,
  resolveExploration,
  spendWatches,
  daysRemaining,
  MISSIONS,
  missionProgress,
  chartRumour,
  currentRoom,
  backRoom,
  moveRoom,
  enterMappedRoom,
  type Journey,
  type Mission,
  type Direction,
} from "./exploration";
export { daysRemaining, MISSIONS, missionProgress } from "./exploration";
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
  | "event"
  | "mission"
  | "exploration"
  | "branch"
  | "camp"
  | "extraction"
  | "nag";
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
  exhaustion: number;
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
  runGross: number;
  contracts: Record<string, number>;
  runContracts: Record<string, number>;
  runPaid: Record<string, number>;
  knownFloors: number[];
  heardRumours: string[];
  journey: Journey;
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
  walkthrough: Walkthrough;
  introSeen: boolean;
  sound: boolean;
  haptics: boolean;
  reserve: Character[];
  arrivalChoice: string;
  arrivalOutcome: string;
  arrivalEffect: string;
  arrivalScouted: boolean;
  usedSupplies: string[];
  townProgress: { signed: string[]; trained: number; crafted: number };
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
export { RECRUITS } from "./town-content";
export function makeCharacter(
  race: Race,
  id: string,
  name: string,
  roll = 1,
): Character {
  const r = RACES.find((x) => x.id === race)!;
  const recruit = RECRUITS.find((x) => x.id === id);
  const mage = (race === "human" && roll < 0.05) || recruit?.job === "Mage";
  const stats = recruit?.stats || {
    hp: r.hp,
    mp: mage ? 95 : r.mp,
    atk: mage ? 34 : r.atk,
    def: r.def,
    speed: r.speed,
  };
  const character: Character = {
    id,
    name,
    race,
    job: recruit?.job || (mage ? "Mage" : r.job),
    portrait: recruit?.portrait ?? r.portrait,
    level: 1,
    xp: 0,
    hp: stats.hp,
    maxHp: stats.hp,
    mp: stats.mp,
    maxMp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    speed: stats.speed,
    gear: 0,
    exhaustion: 0,
    skills: recruit?.skills || [
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
  const level = recruit?.level || 1;
  return level > 1
    ? gainXp(character, (70 * level * (level - 1)) / 2)
    : character;
}
export const recruitAvailable = (s: Game, recruit: Recruit) =>
  s.bestFloor >= (recruit.floor || 0);
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
    runGross: 0,
    contracts: {},
    runContracts: {},
    runPaid: {},
    knownFloors: [],
    heardRumours: [],
    journey: newJourney(),
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
    walkthrough: newWalkthrough(),
    introSeen: false,
    sound: true,
    haptics: true,
    reserve: [],
    arrivalChoice: "",
    arrivalOutcome: "",
    arrivalEffect: "",
    arrivalScouted: false,
    usedSupplies: [],
    townProgress: { signed: [], trained: 0, crafted: 0 },
  };
}
export function normalizeSave(raw: Game): Game {
  const s = { ...initialGame(), ...raw };
  // Existing journeys do not suddenly acquire a first-play tutorial.
  s.walkthrough = raw.walkthrough
    ? {
        active: raw.walkthrough.active === true,
        minimized: raw.walkthrough.minimized === true,
        done: Array.isArray(raw.walkthrough.done)
          ? raw.walkthrough.done.filter((id) => typeof id === "string")
          : [],
      }
    : newWalkthrough();
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
  s.usedSupplies = raw.usedSupplies || [];
  s.contracts = Object.fromEntries(
    s.party
      .concat(s.reserve)
      .filter((c) => RECRUITS.some((r) => r.id === c.id))
      .map((c) => [
        c.id,
        validShare(raw.contracts?.[c.id])
          ? raw.contracts[c.id]
          : recruitShare(
              s,
              RECRUITS.find((r) => r.id === c.id)!,
            ),
      ]),
  );
  s.runContracts =
    raw.runContracts ||
    (s.phase === "town"
      ? {}
      : Object.fromEntries(
          s.party
            .filter((c) => s.contracts[c.id] !== undefined)
            .map((c) => [c.id, s.contracts[c.id]]),
        ));
  s.runPaid = raw.runPaid || {};
  s.runGross = raw.runGross ?? s.runGold;
  s.knownFloors = [
    ...new Set([
      ...(raw.knownFloors || []),
      ...FLOORS.filter((f) => f.id <= s.bestFloor).map((f) => f.id),
    ]),
  ];
  s.heardRumours = raw.heardRumours || [];
  s.journey = { ...newJourney(), ...raw.journey };
  // Old route notes reveal the corresponding graph rooms without inventing visits.
  for (const [key, chart] of Object.entries(s.journey.chart)) {
    const floor = Number(key);
    if (!Number.isInteger(floor) || floor < 1 || floor > 12 || !chart.length)
      continue;
    const map = s.journey.maps[floor] || generateFloor(floor, s.journey.seed);
    s.journey.maps = {
      ...s.journey.maps,
      [floor]: {
        ...map,
        known: [
          ...new Set([
            ...map.known,
            ...Array.from(
              { length: Math.min(6, chart.length) + 1 },
              (_, i) => `cross-${i}`,
            ).filter((id) => !map.explored.includes(id)),
          ]),
        ],
      },
    };
  }
  if (!raw.journey?.reachedPortals && s.phase !== "town")
    s.journey.reachedPortals = Array.from(
      { length: Math.max(0, s.floor - 1) },
      (_, i) => i + 1,
    );
  if (s.phase !== "town" && s.journey.startDay === null)
    s.journey.startDay = s.day;
  s.journey.watches = Math.min(180, Math.max(0, s.journey.watches));
  s.journey.step = Math.min(6, Math.max(0, s.journey.step));
  if (!raw.journey?.maps?.[s.floor]) {
    const map =
      s.journey.maps[s.floor] || generateFloor(s.floor, s.journey.seed);
    let room = ["exploration", "victory", "branch"].includes(s.phase)
      ? `cross-${s.journey.step}`
      : s.phase === "event"
        ? "aftermath"
        : "entrance";
    if (s.phase === "victory" && !s.journey.portal && s.journey.step === 0)
      room = "aftermath";
    if (s.phase === "branch") s.phase = "exploration";
    if (s.phase === "camp") {
      const resume = s.journey.campReturn;
      const parent =
        resume === "arrival" || resume === "combat"
          ? "entrance"
          : resume === "event" ||
              (resume === "victory" &&
                !s.journey.portal &&
                s.journey.step === 0)
            ? "aftermath"
            : `cross-${s.journey.step}`;
      room = `camp-${parent}`;
    }
    s.journey.room = room;
    s.journey.maps = {
      ...s.journey.maps,
      [s.floor]: { ...map, explored: [...new Set([...map.explored, room])] },
    };
    if (s.phase !== "town" && s.journey.portal)
      s.journey.reachedPortals = [
        ...new Set([...s.journey.reachedPortals, s.floor]),
      ];
  }
  s.party = s.party.map((c) => ({
    ...c,
    exhaustion: Math.min(100, Math.max(0, c.exhaustion || 0)),
  }));
  s.rapport = Object.fromEntries(
    Object.entries(s.rapport).map(([id, rp]) => [
      id,
      {
        ...rp,
        offer: validShare(rp.offer)
          ? rp.offer
          : RECRUITS.find((r) => r.id === id)?.share || 14,
      },
    ]),
  );
  s.townProgress = {
    signed: [
      ...new Set([
        ...(raw.townProgress?.signed || []),
        ...s.party
          .concat(s.reserve)
          .filter((c) => c.id !== "hero")
          .map((c) => c.id),
      ]),
    ],
    trained: raw.townProgress?.trained || 0,
    crafted: raw.townProgress?.crafted || 0,
  };
  s.momentum = Math.max(0, Math.min(3, s.momentum || 0));
  s.effects = { ...emptyEffects(), ...s.effects };
  if (s.enemy)
    s.enemy = { ...enemyFor(s.floor, s.route, s.party.length), ...s.enemy };
  return s;
}
export const daysToGate = (day: number) => (30 - (day % 30)) % 30;
export const gateOpen = (day: number) => day % 30 === 0;
const validShare = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 35;
export const recruitShare = (
  s: Game,
  r: Recruit,
  trust = s.rapport[r.id]?.trust || 0,
) =>
  Math.max(
    6,
    r.share - trust * 2 - Math.min(3, Math.floor(s.faction.guild / 10)),
  );
export const TOWN_RUMOURS = [
  {
    id: "camp-watch",
    title: "Listen to the scout",
    speaker: "A scarred scout",
    floor: 1,
    required: 0,
    body: "Goblin voices carry down the left passage. At the first camp, strangers may be plunderers. Keep a watch.",
  },
  {
    id: "stag-checkpoint",
    title: "Ask about the White Stag",
    speaker: "A caravan guard",
    floor: 3,
    required: 1,
    body: "The White Stag holds a checkpoint on the third floor. Rescue their scouts and they may show you a safer road.",
  },
  {
    id: "fourfold-gate",
    title: "Listen to the route keeper",
    speaker: "An old surveyor",
    floor: 4,
    required: 3,
    body: "The fourth floor splits into roots, ice, furnace and crypt. Each road reaches the same ascent, with different dangers.",
  },
] as const;
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
  if (id === "trusted-company")
    return Math.min(3, s.townProgress.signed.length);
  if (id === "ready-for-gate") return Math.min(3, s.townProgress.trained);
  if (id === "ironbell-apprentice") return Math.min(2, s.townProgress.crafted);
  if (id === "quartermaster")
    return Math.min(3, s.inventory["beast-core"] || 0);
  if (id === "seasoned-hunter") return Math.min(10, s.kills);
  if (id === "plunderer") return Math.min(1, s.plunderers);
  if (id === "clan-rescue") return s.scoutsRescued && s.clanAlly ? 1 : 0;
  return Math.min(QUESTS.find((q) => q.id === id)!.target, s.bestFloor);
}
export type Action =
  | { type: "CREATE"; race: Race; name: string; roll: number }
  | { type: "RECRUIT"; id: string; offer?: number }
  | { type: "RUMOUR"; id: string }
  | { type: "MISSION"; id: Mission }
  | { type: "LEAD"; id: string }
  | { type: "NAG_DECISION"; rest: boolean }
  | { type: "SEARCH_PORTAL" }
  | { type: "MOVE"; direction: Direction }
  | { type: "MOVE_BACK" }
  | { type: "AT_PORTAL" }
  | { type: "BRANCH_CHOICE"; choice: string; roll: number }
  | { type: "SEEK_SHELTER" }
  | { type: "CAMP_REST"; untilClose?: boolean }
  | { type: "LEAVE_CAMP" }
  | { type: "BENCH"; id: string }
  | {
      type: "TALK";
      id: string;
      choice: "strengths" | "honor" | "discovery" | "glory";
    }
  | { type: "REST"; skipOpening?: boolean }
  | { type: "WORK"; skipOpening?: boolean }
  | { type: "TRAIN"; skipOpening?: boolean }
  | { type: "PREPARE_CYCLE"; mode: "rest" | "work" | "train" }
  | { type: "BUY"; item: "food" | "potion" }
  | { type: "BUY_ITEM"; id: string }
  | { type: "BUY_BATCH"; items: { id: string; quantity: number }[] }
  | { type: "CRAFT"; id: string }
  | { type: "USE_SUPPLY"; id: "torch" | "camp-kit" | "labyrinth-key" }
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
  | {
      type: "WALKTHROUGH";
      kind: "skip" | "restart" | "toggle" | "ack";
      id?: string;
    }
  | { type: "INTRO_COMPLETED" }
  | { type: "SETTING"; key: "sound" | "haptics"; value: boolean };
function afterFloor(s: Game): Game {
  if (s.journey.branchFight) {
    const next = { ...s, journey: { ...s.journey, branchFight: false } };
    return enterMappedRoom(next, backRoom(s) || "cross-0");
  }
  const next = moveRoom(s, "aftermath");
  return { ...next, phase: s.eventResolved ? "victory" : "event" };
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
/** Pay contracted shares on each gold find; town earnings and trades are excluded. */
export function needsGateConfirmation(s: Game, a: Action) {
  return (
    s.phase === "town" &&
    gateOpen(s.day) &&
    (a.type === "REST" ||
      a.type === "WORK" ||
      (a.type === "TRAIN" && s.gold >= 60)) &&
    !a.skipOpening
  );
}
export function reducer(s: Game, a: Action): Game {
  if (a.type === "WALKTHROUGH") {
    if (!s.started) return s;
    if (a.kind === "restart")
      return { ...s, guideSeen: true, walkthrough: newWalkthrough(true) };
    if (a.kind === "skip")
      return {
        ...s,
        guideSeen: true,
        walkthrough: { ...s.walkthrough, active: false },
      };
    if (a.kind === "toggle")
      return {
        ...s,
        walkthrough: { ...s.walkthrough, minimized: !s.walkthrough.minimized },
      };
    const tip = walkthroughTip(s);
    if (!tip?.acknowledge || tip.id !== a.id) return s;
    return {
      ...s,
      walkthrough: {
        ...s.walkthrough,
        active: tip.id !== "complete" && tip.id !== "return",
        done: [...new Set([...s.walkthrough.done, tip.id])],
      },
    };
  }
  return advanceWalkthrough(s, resolveGameAction(s, a), a);
}
function resolveGameAction(s: Game, a: Action): Game {
  if (needsGateConfirmation(s, a))
    return note(
      s,
      "The labyrinth is open. Confirm skipping this opening before spending a day in town.",
    );
  let next = reduceGame(s, a);
  if (
    s.phase !== "town" &&
    next !== s &&
    next.journey.watches === s.journey.watches
  ) {
    const timed =
      ((a.type === "MOVE" || a.type === "MOVE_BACK") &&
        next.journey.room !== s.journey.room) ||
      (a.type === "BRANCH_CHOICE" &&
        (next.phase !== s.phase || next.journey.room !== s.journey.room)) ||
      (a.type === "BATTLE" && next.kills > s.kills) ||
      (a.type === "APPROACH" && next.arrivalChoice !== s.arrivalChoice) ||
      (a.type === "EVENT" &&
        (next.eventResolved !== s.eventResolved ||
          next.encounterExamined !== s.encounterExamined ||
          next.route !== s.route)) ||
      (a.type === "CONTINUE" && next.floor > s.floor) ||
      (a.type === "SEEK_SHELTER" && next.phase === "camp");
    if (timed)
      next = spendWatches(
        a.type === "BATTLE" ? next : exertForAction(s, next, a),
        1,
      );
  }
  if (a.type === "BATTLE" && next.effects.id !== s.effects.id)
    next = exertForAction(s, next, a);
  if (next !== s && s.phase !== "town" && a.type !== "NAG_DECISION")
    next = maybeComplain(next);
  const gross = next.gold - s.gold;
  if (s.phase === "town" || a.type === "RETURN" || gross <= 0) return next;
  const paid = Object.fromEntries(
    Object.entries(s.runContracts).map(([id, share]) => [
      id,
      Math.floor((gross * share) / 100),
    ]),
  );
  const cut = Object.values(paid).reduce((n, amount) => n + amount, 0);
  return {
    ...next,
    gold: next.gold - cut,
    runGross: s.runGross + gross,
    runGold: s.runGold + gross - cut,
    runPaid: Object.fromEntries(
      Object.entries(s.runContracts).map(([id]) => [
        id,
        (s.runPaid[id] || 0) + paid[id],
      ]),
    ),
  };
}
function reduceGame(s: Game, a: Action): Game {
  if (a.type === "LEAD") {
    if (
      ![
        "mission",
        "arrival",
        "exploration",
        "branch",
        "camp",
        "event",
        "victory",
      ].includes(s.phase) ||
      !s.party.some((c) => c.id === a.id && c.hp > 0)
    )
      return s;
    return { ...s, journey: { ...s.journey, leaderId: a.id } };
  }
  if (a.type === "NAG_DECISION" && s.phase === "nag" && s.journey.nag) {
    const resumed = {
      ...s,
      phase: s.journey.nag.resume,
      journey: { ...s.journey, nag: null },
    };
    return a.rest
      ? reducer(resumed, { type: "SEEK_SHELTER" })
      : note(
          tire(resumed, 4),
          "You promise to stop at the next safe room. The party shoulders its packs again.",
        );
  }
  const exploration = resolveExploration(s, a, (floor, partySize) =>
    enemyFor(floor, s.route, partySize),
  );
  if (exploration) return exploration;
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
    const recipe = RECIPES.find((r) => r.id === a.id);
    if (s.phase !== "town" || !recipe) return s;
    if (s.bestFloor < (recipe.floor || 0))
      return note(s, "Clear Floor " + recipe.floor + " to unlock this recipe.");
    if (
      s.gold < recipe.gold ||
      recipe.materials.some((m) => (s.inventory[m.id] || 0) < m.quantity)
    )
      return note(s, "You need the recipe’s gold and materials.");
    const inventory = { ...s.inventory, [a.id]: (s.inventory[a.id] || 0) + 1 };
    for (const m of recipe.materials) inventory[m.id] -= m.quantity;
    return note(
      {
        ...s,
        gold: s.gold - recipe.gold,
        inventory,
        townProgress: {
          ...s.townProgress,
          crafted: s.townProgress.crafted + 1,
        },
      },
      ITEMS.find((i) => i.id === a.id)!.name + " crafted.",
    );
  }
  if (a.type === "USE_SUPPLY") {
    if (!(s.inventory[a.id] > 0) || s.usedSupplies.includes(a.id))
      return note(s, "You do not have an unused supply for this floor.");
    const inventory = { ...s.inventory, [a.id]: s.inventory[a.id] - 1 };
    const usedSupplies = [...s.usedSupplies, a.id];
    if (
      a.id === "torch" &&
      s.phase === "arrival" &&
      !s.arrivalChoice &&
      s.enemy
    )
      return note(
        {
          ...s,
          inventory,
          usedSupplies,
          enemy: {
            ...s.enemy,
            atk: Math.max(1, Math.round(s.enemy.atk * 0.92)),
          },
          arrivalScouted: true,
        },
        "Torch lit. Enemy revealed; enemy ATK −8%.",
      );
    if (
      a.id === "camp-kit" &&
      ["arrival", "victory"].includes(s.phase) &&
      s.food > 0 &&
      s.party.some((c) => c.hp > 0 && (c.hp < c.maxHp || c.mp < c.maxMp))
    )
      return note(
        {
          ...s,
          inventory,
          usedSupplies,
          food: s.food - 1,
          party: s.party.map((c) =>
            c.hp > 0
              ? {
                  ...c,
                  hp: Math.min(c.maxHp, c.hp + Math.round(c.maxHp * 0.3)),
                  mp: Math.min(c.maxMp, c.mp + Math.round(c.maxMp * 0.3)),
                  ailments: { poison: 0, paralysis: 0 },
                }
              : c,
          ),
        },
        "Camp restored 30% HP and MP; consumed 1 ration. Fallen allies remain fallen.",
      );
    if (
      a.id === "labyrinth-key" &&
      s.phase === "event" &&
      !s.eventResolved &&
      [2, 10].includes(s.floor)
    ) {
      const result = resolveEvent(
        { ...s, inventory, usedSupplies },
        s.floor === 2 ? "careful" : "pick",
        1,
      );
      return note(
        {
          ...result,
          gold: result.gold + 100,
          inventory: addLoot(result.inventory, "relic-fragment"),
        },
        "The key opens an untouched compartment. Safe treasure, +100 gold and an extra relic fragment.",
      );
    }
    return note(
      s,
      a.id === "camp-kit" && !s.food
        ? "You need 1 ration to camp."
        : "You cannot use this supply here.",
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
      {
        ...initialGame(),
        started: true,
        walkthrough: newWalkthrough(true),
        introSeen: true,
        party: [hero],
        journey: {
          ...newJourney(),
          seed: seedFor(`${hero.name}:${hero.race}`),
        },
      },
      `${hero.name}, a ${hero.job}, arrived in Stormhold.`,
    );
  }
  if (a.type === "RETURN") {
    if (s.phase === "town") return s;
    if (daysRemaining(s) > 0)
      return note(
        s,
        `The return gate is sealed for ${daysRemaining(s)} more days. Find shelter if your team cannot continue.`,
      );
    const mission = MISSIONS.find((m) => m.id === s.journey.mission);
    const reward =
      mission && missionProgress(s) >= mission.target ? mission.reward : 0;
    return note(
      {
        ...s,
        day: (s.journey.startDay ?? s.day) + 31,
        gold: s.gold + reward,
        journey: { ...s.journey, startDay: null },
        phase: "town",
        enemy: null,
        lastOutcome:
          s.phase === "defeat" ? "Lost expedition" : "Returned safely",
      },
      `The return gate carried your team home.${reward ? ` Mission fulfilled: +${reward} guild gold.` : ""} Trade your spoils and prepare for the next opening.`,
    );
  }
  if (a.type === "ACCEPT") {
    if (!QUESTS.some((q) => q.id === a.id) || s.quests[a.id]) return s;
    if (a.id === "clan-rescue" && !s.clanAlly)
      return note(s, "Meet the White Stag on Floor 3 to earn its trust.");
    return note(
      { ...s, quests: { ...s.quests, [a.id]: "accepted" } },
      "Contract accepted. Its progress appears in your journal.",
    );
  }
  if (a.type === "CLAIM") {
    const id = a.id || "first-ascent";
    const q = QUESTS.find((x) => x.id === id);
    if (!q) return s;
    if (s.phase !== "town")
      return note(s, "Return to town to deliver the contract.");
    if (s.quests[id] !== "accepted" || questProgress(s, id) < q.target)
      return note(s, "This contract is not ready to turn in.");
    return note(
      {
        ...s,
        gold: s.gold + q.gold,
        gems: s.gems + q.gems,
        inventory:
          id === "quartermaster"
            ? { ...s.inventory, "beast-core": s.inventory["beast-core"] - 3 }
            : s.inventory,
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
          townProgress: {
            ...s.townProgress,
            trained: s.townProgress.trained + (a.mode === "train" ? days : 0),
          },
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
      if (
        s.party.reduce((n, p) => n + (s.contracts[p.id] || 0), 0) +
          (s.contracts[c.id] || 0) >
        75
      )
        return note(
          s,
          "Your companions’ shares cannot exceed 75%. Change the party before inviting them back.",
        );
      return note(
        {
          ...s,
          party: [...s.party, c],
          reserve: s.reserve.filter((c) => c.id !== a.id),
        },
        `${c.name} returns on the same ${s.contracts[c.id]}% loot-share agreement.`,
      );
    }
    if (a.type === "RUMOUR") {
      const rumour = TOWN_RUMOURS.find((r) => r.id === a.id);
      if (
        !rumour ||
        s.bestFloor < rumour.required ||
        s.heardRumours.includes(rumour.id)
      )
        return s;
      return note(
        {
          ...s,
          knownFloors: [...new Set([...s.knownFloors, rumour.floor])],
          journey: chartRumour(s, rumour.floor),
          heardRumours: [...s.heardRumours, rumour.id],
        },
        `${rumour.speaker}: ${rumour.body}`,
      );
    }
    if (a.type === "TALK") {
      const r = RECRUITS.find((r) => r.id === a.id);
      if (!r || !recruitAvailable(s, r)) return s;
      const old = s.rapport[a.id] || {
        trust: 0,
        asked: false,
        inspected: false,
        offer: r.share,
        reply: r.quote,
      };
      if (a.choice === "strengths") {
        if (old.inspected)
          return note(s, "You already know their visible strengths.");
        return {
          ...s,
          knownFloors: [
            ...new Set([
              ...s.knownFloors,
              Math.min(12, 1 + RECRUITS.findIndex((x) => x.id === r.id)),
            ]),
          ],
          journey: chartRumour(
            s,
            Math.min(12, 1 + RECRUITS.findIndex((x) => x.id === r.id)),
          ),
          rapport: {
            ...s.rapport,
            [a.id]: {
              ...old,
              inspected: true,
              trust: old.trust + 1,
              reply: `“I am a ${r.job || RACES.find((x) => x.id === r.race)!.job}. ${r.tagline} I can mark ${
                FLOORS[
                  Math.min(
                    11,
                    RECRUITS.findIndex((x) => x.id === r.id),
                  )
                ].name
              } on your chart.”`,
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
              : "“That is not what I am looking for. A larger share might change my mind.”",
          },
        },
      };
    }
    if (a.type === "RECRUIT") {
      const r = RECRUITS.find((r) => r.id === a.id);
      if (!r || s.party.some((c) => c.id === a.id)) return s;
      if (!recruitAvailable(s, r))
        return note(
          s,
          "Reach Floor " + r.floor + " before recruiting " + r.name + ".",
        );
      if (s.party.length >= 4)
        return note(
          s,
          "Your party holds four. Choose your companions carefully.",
        );
      const rp = s.rapport[a.id] || {
        trust: 0,
        asked: false,
        inspected: false,
        offer: r.share,
        reply: r.quote,
      };
      const minimum = recruitShare(s, r, rp.trust);
      const offer = a.offer ?? r.share;
      if (!validShare(offer))
        return note(s, "Choose a whole-number loot share between 1% and 35%.");
      if (offer < minimum)
        return {
          ...s,
          message: `${r.name} asks for at least ${minimum}% of expedition gold. Build trust or raise your offer.`,
          rapport: {
            ...s.rapport,
            [a.id]: {
              ...rp,
              offer: minimum,
              reply: `“${minimum}% of what we find, and I’ll walk with you.”`,
            },
          },
        };
      const total =
        s.party.reduce((n, c) => n + (s.contracts[c.id] || 0), 0) + offer;
      if (total > 75)
        return note(
          s,
          "Your companions’ shares cannot exceed 75%. Negotiate or change the party.",
        );
      const c = makeCharacter(r.race, r.id, r.name);
      c.traitRevealed = rp.trust >= 2;
      return note(
        {
          ...s,
          contracts: { ...s.contracts, [a.id]: offer },
          party: [...s.party, c],
          townProgress: {
            ...s.townProgress,
            signed: [...new Set([...s.townProgress.signed, c.id])],
          },
        },
        `${r.name} joined for ${offer}% of expedition gold. No upfront payment.`,
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
            exhaustion: 0,
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
          townProgress: {
            ...s.townProgress,
            trained: s.townProgress.trained + 1,
          },
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
        !(GEAR_KINDS as readonly string[]).includes(item.kind) ||
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
                  speed: p.speed - (prev?.speed || 0) + (item.speed || 0),
                  maxHp: p.maxHp - (prev?.hp || 0) + (item.hp || 0),
                  maxMp: p.maxMp - (prev?.mp || 0) + (item.mp || 0),
                  hp: Math.min(
                    p.hp,
                    p.maxHp - (prev?.hp || 0) + (item.hp || 0),
                  ),
                  mp: Math.min(
                    p.mp,
                    p.maxMp - (prev?.mp || 0) + (item.mp || 0),
                  ),
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
          phase: "mission",
          journey: {
            ...newJourney(),
            seed: s.journey.seed,
            maps: {
              ...s.journey.maps,
              1: s.journey.maps[1] || generateFloor(1, s.journey.seed),
            },
            chart: s.journey.chart,
            startDay: s.day,
          },
          enemy: enemyFor(1, null, s.party.length),
          turn: 1,
          momentum: 0,
          party: s.party.map((c) => ({ ...c, cooldowns: {} })),
          runKills: 0,
          runGold: 0,
          runGross: 0,
          runPaid: {},
          runContracts: Object.fromEntries(
            s.party
              .filter((c) => s.contracts[c.id] !== undefined)
              .map((c) => [c.id, s.contracts[c.id]]),
          ),
          route: null,
          eventResolved: false,
          sideBattle: false,
          ending: "",
          arrivalChoice: "",
          arrivalOutcome: "",
          arrivalEffect: "",
          arrivalScouted: false,
          usedSupplies: [],
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
        arrivalScouted: s.arrivalScouted || choice.effect === "observe",
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
    if (!s.journey.portal || currentRoom(s).kind !== "portal")
      return note(
        s,
        "Find the upward portal before ascending. Search the corridors.",
      );
    if (s.floor >= 12)
      return note(
        s,
        "The campaign is complete. Return with your story and the crown.",
      );
    if (s.food < 1)
      return note(
        s,
        "No rations remain. Search side passages for cave roots, or wait in shelter.",
      );
    const floor = s.floor + 1;
    return {
      ...s,
      phase: "arrival",
      journey: {
        ...s.journey,
        step: 0,
        portal: false,
        branch: null,
        branchFight: false,
        room: "entrance",
        history: [],
        maps: {
          ...s.journey.maps,
          [floor]:
            s.journey.maps[floor] || generateFloor(floor, s.journey.seed),
        },
      },
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
      usedSupplies: [],
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
    const keyed = s.usedSupplies.includes("labyrinth-key");
    const safe =
      choice === "pick" &&
      (keyed || s.party.some((c) => c.hp > 0 && c.race === "dwarf"));
    const gold = choice === "force" ? 300 : 220;
    return done(
      {
        ...s,
        gold: s.gold + gold,
        party: safe ? s.party : hurtParty(s.party, 20),
        inventory: addLoot(s.inventory, "relic-fragment", 3),
      },
      safe
        ? keyed
          ? "The key releases the vault’s locks. +220 gold and three relic fragments."
          : "The dwarf opens the vault. +220 gold and three relic fragments."
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
