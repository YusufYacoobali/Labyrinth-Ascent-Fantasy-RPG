import {
  departureSnapshot,
  expeditionReport,
  type ExpeditionReport,
} from "./expedition-report";
import { gearFloor } from "./build-equipment";
import { trainingLimit, trainingXp, temperingOffer } from "./town-progression";
import { canAutoResolve } from "./combat-commands";
import {
  factionAccess,
  factionDiscount,
  resolveFactionAction,
} from "./faction-opportunities";
import { establishExpedition } from "./encounter-director";
import { resumeRestLocation, type FieldRestResume } from "./field-rest";
import { knownPath } from "./known-travel";
import type { NpcMemory, WorldNpcId } from "./world-npcs";
import { recordDefeats, type Bestiary } from "./bestiary";
import type { Conditions } from "./combat-status";
import { deserializeSave } from "./skill-ids";
import { BALANCE as B } from "./balance";
import { resolveGenericAction } from "./generic-stories";
import { newStoryState, type StoryState } from "./story-types";
import {
  resolveStoryAction,
  storyConsequences,
  loyalty,
  principalResolved,
  principalAftermath,
  recordPrincipal,
} from "./stories";
import {
  beginCombat,
  resolveRound,
  type CombatState,
  type RoundEvent,
  type RoundRequest,
} from "./round-combat";
import {
  townRecovery,
  rescueInjuries,
  setInjuries,
  healthyMaxHp,
} from "./survival";
import {
  HEADINGS,
  relativeDirection,
  generateFloor,
  entryFacing,
  seedFor,
  mapKey,
  populateFloor,
} from "./floor-map";
import {
  MONSTERS,
  essenceId,
  monsterFor,
  monsterDrops,
  nextRandom,
} from "./monsters";
import {
  essenceBindingOptions,
  prepareSkills,
  skillSlots,
  newExpedition,
  trackSpoils,
  loseSpoils,
  type Expedition,
} from "./progression";
import {
  advanceWalkthrough,
  newWalkthrough,
  walkthroughTip,
  firstExpeditionComplete,
  type Walkthrough,
} from "./walkthrough";
import { maybeComplain, exertForAction } from "./exhaustion";
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
  recruitShare,
  recruitmentReply,
  recruitLevelRefusal,
  recruitEquipment,
  type RecruitReply,
} from "./recruitment";
import {
  newTownLife,
  resolveTownLife,
  STARTING_GOLD,
  type TownLife,
} from "./town-life";
import {
  newJourney,
  resolveExploration,
  spendWatches,
  daysRemaining,
  MISSIONS,
  missionDetails,
  missionProgress,
  chartRumour,
  currentRoom,
  floorMap,
  isFreshEntrance,
  currentMapKey,
  encounterKey,
  enterMappedRoom,
  type Journey,
  type Mission,
  type Direction,
} from "./exploration";
export { daysRemaining, MISSIONS, missionProgress } from "./exploration";
export { SKILLS, resist } from "./combat-data";
export { battleIntent, battleForecast } from "./battle";
export { recruitShare } from "./recruitment";
export type Race = "barbarian" | "human" | "elf" | "dwarf";
export type Phase =
  | "town"
  | "story"
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
export type Skill = import("./skill-ids").SkillName;
export interface Ailments {
  conditions?: Conditions;
  poison: number;
  paralysis: number;
  ward?: number;
  barrier?: number;
  candleOwner?: string;
  guardPower?: Skill;
}
export interface Character {
  formation?: "front" | "back";
  id: string;
  injuries: number;
  uninjuredHp: number;
  recoveryDays: number;
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
  learnedSkills: Skill[];
  mastery: Partial<Record<Skill, number>>;
  battleMastery: Partial<Record<Skill, number>>;
  refinements: Partial<Record<Element, boolean>>;
  trait: string;
  traitRevealed: boolean;
  ailments: Ailments;
  equipment: string[];
  starterGearIssued?: boolean;
  cooldowns: Partial<Record<Skill, number>>;
}
export interface Enemy {
  equipment?: string[];
  shield?: number;
  resistances?: Partial<Record<Element, number>>;
  weaknesses?: Element[];
  concealed?: number;
  counter?: { element: Element; power: number; turns: number };
  rewardEligible?: boolean;
  conditions?: Conditions;
  moveCooldowns?: Record<string, number>;
  level?: number;
  species?: string;
  vulnerable?: number;
  weakened?: number;
  slowed?: number;
  slowTurns?: number;
  poisonPower?: number;
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
  absorbed?: number;
  protection?: Record<string, number>;
  protectionSkill?: Record<string, Skill>;
  retaliation?: Record<string, number>;
  id: number;
  damage: number;
  enemyDamage: number;
  critical: boolean;
  kind: string;
  target: string;
  poisonDamage: number;
  stunned: boolean;
  targets: Record<string, number>;
  healing?: Record<string, number>;
  strikes?: Record<string, number>;
  broken: boolean;
}
export interface Game {
  recruitReply?: RecruitReply | null;
  townLife?: TownLife;
  lastReport?: ExpeditionReport;
  challengeCompletions?: number;
  npcs?: Partial<Record<WorldNpcId, NpcMemory>>;
  bestiary?: Bestiary;
  combatSpeed?: "normal" | "fast";
  version: 2;
  rulesVersion: 4;
  stories: StoryState;
  expedition: Expedition;
  rng: { combat: number; loot: number; encounters: number };
  lootReceipt: LootReceipt | null;
  fieldRest?: FieldRestResume | null;
  discoveryReceipt?: {
    title: string;
    gold: number;
    food: number;
    potions: number;
    gems: number;
    items: Record<string, number>;
  } | null;
  trial: boolean;
  combat: CombatState | null;
  roundPlayback: { before: Game; events: RoundEvent[] } | null;
  playback: {
    before: Game;
    action: Extract<Action, { type: "BATTLE" }>;
  } | null;
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
  factionClaims?: string[];
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
  questClaimed: boolean;
  relic: boolean;
  encounterExamined: boolean;
  lastOutcome: string;
  inventory: Record<string, number>;
  route: Route | null;
  checkpoints: number[];
  discoveredRoutes: Route[];
  startFloor: number;
  startRoute: Route | null;
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
export interface LootReceipt {
  enemies?: { id: string; species: string; name: string }[];
  id: string;
  species: string;
  name: string;
  gross: number;
  shares: Record<string, number>;
  net: number;
  items: Record<string, number>;
  xp: {
    id: string;
    name: string;
    amount: number;
    before: number;
    after: number;
  }[];
}
export const RACES = [
  {
    id: "barbarian" as Race,
    name: "Barbarian",
    job: "Berserker",
    portrait: 3,
    description:
      "First through the door. Last to admit it hurt. You solve most arguments with Twin Strike.",
    quote: "A locked door is just a door that hasn’t met me.",
    style: "Bold brawler",
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
    description:
      "A stubborn heart under battered steel. Shield Bash buys your friends breathing room. A rare few awaken as mages.",
    quote: "Someone has to get everyone home.",
    style: "Loyal protector",
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
    description:
      "Sharp eyes. Sharper wit. You find the weak spot, then let Venom Fang do the talking.",
    quote: "Try to keep up. Quietly, if possible.",
    style: "Quick, precise hunter",
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
    description:
      "Stone steady and gloriously hard to move. You lead with Shield Bash and complain about the craftsmanship.",
    quote: "I’ve seen sturdier dungeons. Built a few, too.",
    style: "Unshakeable guardian",
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
    injuries: 0,
    uninjuredHp: stats.hp,
    recoveryDays: 0,
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
    learnedSkills: [],
    mastery: {},
    battleMastery: {},
    refinements: {},
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
  const equipped = issueRecruitEquipment(
    prepareSkills(
      level > 1 ? gainXp(character, (70 * level * (level - 1)) / 2) : character,
    ),
  );
  return { ...equipped, hp: equipped.maxHp, mp: equipped.maxMp };
}
/** Issue only missing slots once; sold or replaced equipment never regenerates on reload. */
function issueRecruitEquipment(c: Character): Character {
  const recruit = RECRUITS.find((r) => r.id === c.id);
  if (!recruit || c.starterGearIssued) return c;
  const occupied = new Set(
    c.equipment.map((id) => ITEMS.find((i) => i.id === id)?.kind),
  );
  const gear = recruitEquipment(recruit)
    .map((id) => ITEMS.find((i) => i.id === id)!)
    .filter((item) => item && !occupied.has(item.kind));
  const bonus = (stat: "hp" | "mp" | "atk" | "def" | "speed") =>
    gear.reduce((sum, item) => sum + (item[stat] || 0), 0);
  const uninjuredHp = healthyMaxHp(c) + bonus("hp");
  return {
    ...c,
    starterGearIssued: true,
    equipment: [...c.equipment, ...gear.map((i) => i.id)],
    uninjuredHp,
    maxHp: Math.floor(uninjuredHp * (1 - (c.injuries || 0) * B.injuryHp)),
    maxMp: c.maxMp + bonus("mp"),
    atk: c.atk + bonus("atk"),
    def: c.def + bonus("def"),
    speed: c.speed + bonus("speed"),
  };
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
    version: 2,
    rulesVersion: 4,
    stories: newStoryState(),
    expedition: newExpedition(),
    rng: { combat: 1, loot: 2, encounters: 3 },
    lootReceipt: null,
    fieldRest: null,
    trial: false,
    combat: null,
    roundPlayback: null,
    playback: null,
    started: false,
    day: 24,
    gold: STARTING_GOLD,
    gems: 0,
    food: 1,
    potions: 0,
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
    questClaimed: false,
    relic: false,
    encounterExamined: false,
    lastOutcome: "",
    inventory: {},
    recruitReply: null,
    townLife: newTownLife(),
    route: null,
    checkpoints: [1],
    discoveredRoutes: [],
    startFloor: 1,
    startRoute: null,
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
  raw = deserializeSave(raw);
  const s = { ...initialGame(), ...raw };
  s.townLife = {
    ...newTownLife(),
    ...raw.townLife,
    introSeen: raw.townLife?.introSeen ?? raw.started,
  };
  s.rulesVersion = 4;
  s.stories = { ...newStoryState(), ...raw.stories };
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
  s.party = (raw.party || []).map((c) =>
    issueRecruitEquipment({
      ...makeCharacter(c.race, c.id, c.name),
      ...c,
      ailments: c.ailments || { poison: 0, paralysis: 0 },
      equipment: c.equipment || [],
      starterGearIssued: c.starterGearIssued,
      cooldowns: c.cooldowns || {},
    }),
  );
  s.reserve = (raw.reserve || []).map((c) =>
    issueRecruitEquipment({
      ...makeCharacter(c.race, c.id, c.name),
      ...c,
      cooldowns: c.cooldowns || {},
      ailments: c.ailments || { poison: 0, paralysis: 0 },
      equipment: c.equipment || [],
      starterGearIssued: c.starterGearIssued,
    }),
  );
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
  // Version 2 geography has compass edges; development saves are backed up by loadSave.
  s.journey.maps = Object.fromEntries(
    Object.entries(s.journey.maps).filter(([, map]) => map.version === 2),
  );
  const key = currentMapKey(s),
    map = floorMap(s);
  s.journey.maps = { ...s.journey.maps, [key]: map };
  s.journey.occupants = {
    ...s.journey.occupants,
    [key]: s.journey.occupants[key] || populateFloor(map, s.expedition.number),
  };
  if (!map.nodes[s.journey.room]) s.journey.room = map.entrance;
  s.journey.facing = s.journey.facing || "north";
  if (isFreshEntrance(s) && !s.journey.arrivalFacingSet) {
    s.journey.facing = entryFacing(map);
    s.journey.arrivalFacingSet = true;
  }
  if (s.phase !== "town" && s.journey.startDay === null)
    s.journey.startDay = s.day;
  s.journey.watches = Math.min(180, Math.max(0, s.journey.watches));
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
  s.party = s.party.map((c) => ({
    ...prepareSkills(c),
    battleMastery: c.battleMastery || {},
  }));
  s.reserve = s.reserve.map((c) => ({
    ...prepareSkills(c),
    battleMastery: c.battleMastery || {},
  }));
  s.expedition = {
    ...newExpedition(),
    ...raw.expedition,
    unsecured: { ...newExpedition().unsecured, ...raw.expedition?.unsecured },
  };
  if (firstExpeditionComplete(s)) {
    s.walkthrough = { ...s.walkthrough, active: false };
    s.guideSeen = true;
  }
  s.rng = { ...initialGame().rng, ...raw.rng };
  return s;
}
export const daysToGate = (day: number) => (30 - (day % 30)) % 30;
export const gateOpen = (day: number) => day % 30 === 0;
const validShare = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 50;
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
export const buyPrice = (item: Item, day: number, state?: Game) =>
  Math.ceil(
    item.price *
      (marketRush(day) ? 1.15 : 1) *
      (state ? 1 - factionDiscount(state, item) : 1),
  );
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
export function enemyFor(
  floor: number,
  route: Route | null = null,
  partySize = 1,
  role: "regular" | "portal" = "portal",
): Enemy {
  const f = FLOORS[floor - 1];
  const boss = role === "portal" && floor % 3 === 0;
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
  const routeSpec =
    floor >= 5 && floor <= 7 && route
      ? MONSTERS.find(
          (m) =>
            m.id ===
            `${route}-${role === "regular" ? "roamer" : floor === 6 ? "guardian" : "elite"}`,
        )
      : undefined;
  return {
    species: routeSpec?.id || MONSTERS[floor - 1].id,
    name:
      routeSpec?.name ||
      (role === "portal" && !boss ? `${f.enemy} · Portal elite` : f.enemy),
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
export function gainXp(c: Character, amount: number): Character {
  let n = { ...c, xp: c.xp + amount };
  while (n.xp >= n.level * 70) {
    n = {
      ...n,
      xp: n.xp - n.level * 70,
      level: n.level + 1,
      atk: n.atk + 4,
      def: n.def + 2,
      uninjuredHp: healthyMaxHp(n) + 15,
      maxHp: Math.floor((healthyMaxHp(n) + 15) * (1 - (n.injuries || 0) * 0.1)),
      hp:
        n.hp > 0
          ? Math.min(
              n.hp + 25,
              Math.floor(
                (healthyMaxHp(n) + 15) * (1 - (n.injuries || 0) * 0.1),
              ),
            )
          : 0,
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
  if (id === "ready-for-gate") return Math.min(2, s.townProgress.trained);
  if (id === "ironbell-apprentice") return Math.min(2, s.townProgress.crafted);
  if (id === "quartermaster")
    return Math.min(3, s.inventory["beast-core"] || 0);
  if (id === "seasoned-hunter") return Math.min(10, s.kills);
  if (id === "plunderer") return Math.min(1, s.plunderers);
  if (id === "clan-rescue") return s.scoutsRescued && s.clanAlly ? 1 : 0;
  return Math.min(QUESTS.find((q) => q.id === id)!.target, s.bestFloor);
}
export type Action =
  | { type: "QUICK_TRAVEL"; room: string }
  | { type: "UNLOCK_SHORTCUT"; id: string }
  | { type: "SET_FORMATION"; id: string; formation: "front" | "back" }
  | { type: "COMBAT_SPEED"; speed: "normal" | "fast" }
  | { type: "AUTO_COMBAT" }
  | { type: "GENERIC_CHOICE"; room: string; id: string; choice: string }
  | { type: "OPEN_STORY"; id: string }
  | { type: "CLOSE_STORY" }
  | { type: "STORY_CHOICE"; stage: string; choice: string }
  | { type: "FACTION_DELIVER"; id: string }
  | { type: "ACK_REPORT" }
  | { type: "RECONCILE"; id: string }
  | RoundRequest
  | { type: "CREATE"; race: Race; name: string; roll: number; seed?: number }
  | { type: "RECRUIT"; id: string; offer?: number }
  | { type: "ACK_RECRUIT_REPLY" }
  | { type: "ACK_OPENING" }
  | { type: "OPEN_TOWN_MOMENT"; id: string; companion: string }
  | { type: "TOWN_MOMENT_CHOICE"; choice: "join" | "leave" }
  | { type: "CLOSE_TOWN_MOMENT" }
  | { type: "ACK_TOWN_RESULT" }
  | { type: "RUMOUR"; id: string }
  | { type: "MISSION"; id: Mission }
  | { type: "LEAD"; id: string }
  | { type: "NAG_DECISION" }
  | { type: "SEARCH_PORTAL" }
  | { type: "MOVE"; direction: Direction }
  | { type: "TURN_AROUND" }
  | { type: "MOVE_BACK" }
  | { type: "AT_PORTAL" }
  | { type: "BRANCH_CHOICE"; choice: string; roll: number }
  | { type: "WILD_CAMP" }
  | { type: "REST_HERE" }
  | { type: "ACK_ASCENT" }
  | { type: "TREAT_INJURY"; id: string }
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
  | { type: "CRAFT"; id: string; essence?: boolean }
  | { type: "USE_SUPPLY"; id: "torch" | "camp-kit" | "labyrinth-key" }
  | { type: "RENAME"; name: string }
  | { type: "SELL"; id: string; vendor: Vendor; quantity: number }
  | { type: "EQUIP"; character: string; item: string }
  | { type: "FORGE"; id: string }
  | { type: "ENCHANT"; id: string; skill: Skill }
  | { type: "REFINE_GEAR"; id: string; element: Element }
  | { type: "SELECT_START"; floor: number; route?: Route }
  | { type: "ENTER"; mission?: Mission }
  | { type: "APPROACH"; choice: string; roll: number }
  | { type: "ENGAGE" }
  | {
      type: "BATTLE";
      kind: "attack" | "skill" | "item" | "guard" | "focus" | "burst";
      roll: number;
      actor?: string;
      skill?: Skill;
      item?: string;
      animate?: boolean;
    }
  | { type: "COLLECT" }
  | { type: "ACK_DISCOVERY" }
  | { type: "FINISH_PLAYBACK" }
  | { type: "ENCOUNTER"; choice: "take" | "examine" | "leave"; roll: number }
  | { type: "EVENT"; choice: string; roll: number }
  | { type: "LEARN"; skill: Skill; id: string; species?: string }
  | { type: "SLOT_SKILL"; id: string; skill: Skill; equip: boolean }
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
  if (s.fieldRest) return resumeRestLocation(s);
  if (s.journey.watches >= 180) return { ...s, phase: "extraction" };
  if (s.combat?.resume === "camp") return { ...s, phase: "camp", combat: null };
  if (s.journey.defender)
    return {
      ...s,
      phase: s.floor === 12 && !principalResolved(s) ? "event" : "victory",
      journey: { ...s.journey, portal: true, defender: false },
    };
  return enterMappedRoom(
    {
      ...s,
      sideBattle: false,
      journey: { ...s.journey, branchFight: false, branch: null },
    },
    s.journey.room,
  );
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
  const defeated = s.combat
    ? [
        ...new Map(
          [...(s.combat.defeated || []), ...s.combat.enemies]
            .filter((foe) => foe.hp <= 0 && foe.rewardEligible !== false)
            .map((foe) => [foe.id, foe]),
        ).values(),
      ]
    : [enemy];
  const spec = monsterFor(enemy, s.floor);
  let seed = s.rng.loot,
    gold = 0,
    xp = 0;
  const items: Record<string, number> = {};
  for (const foe of defeated) {
    const reward = monsterFor(foe, s.floor),
      drop = monsterDrops(reward, seed);
    seed = drop.seed;
    xp += reward.xp;
    for (const [id, qty] of Object.entries(drop.items)) {
      items[id] = (items[id] || 0) + qty;
      inventory = addLoot(inventory, id, qty);
    }
  }
  const nextParty = party.map((c) => ({
    ...gainXp(c, xp),
    traitRevealed: c.traitRevealed || defeated.some((e) => e.boss),
  }));
  const shares = Object.fromEntries(
    Object.entries(s.runContracts).map(([id, share]) => [
      id,
      Math.floor((gold * share) / 100),
    ]),
  );
  const net = gold - Object.values(shares).reduce((n, x) => n + x, 0);
  return note(
    {
      ...s,
      party: nextParty,
      bestiary: recordDefeats(s.bestiary, defeated),
      gold: s.gold + gold,
      kills: s.kills + defeated.length,
      runKills: s.runKills + defeated.length,
      bestFloor: s.journey.defender
        ? Math.max(s.bestFloor, s.floor)
        : s.bestFloor,
      checkpoints:
        s.journey.defender && [3, 6, 9].includes(s.floor)
          ? [...new Set([...s.checkpoints, s.floor + 1])]
          : s.checkpoints,
      journey: {
        ...s.journey,
        defeatedPortals: s.journey.defender
          ? [...new Set([...s.journey.defeatedPortals, currentMapKey(s)])]
          : s.journey.defeatedPortals,
        resolvedBranches: s.journey.branch
          ? [...new Set([...s.journey.resolvedBranches, s.journey.branch.id])]
          : s.journey.resolvedBranches,
      },
      enemy,
      potions,
      inventory,
      effects,
      phase: "loot",
      rng: { ...s.rng, loot: seed },
      lootReceipt: {
        id: `${s.expedition.number}:${s.kills + 1}`,
        species: spec.id,
        name: enemy.name,
        gross: gold,
        shares,
        net,
        items,
        enemies: defeated.map((foe, i) => ({
          id:
            (foe as import("./round-combat").CombatEnemy).id ||
            `${s.combat?.id || "battle"}:${i}`,
          species: foe.species || spec.id,
          name: foe.name,
        })),
        xp: nextParty.map((c, i) => ({
          id: c.id,
          name: c.name,
          amount: xp,
          before: party[i].level,
          after: c.level,
        })),
      },
      plunderers:
        s.plunderers + defeated.filter((e) => e.species === "plunderer").length,
      log: [
        ...logs,
        `${enemy.name} defeated. Rewards recorded.`,
        ...s.log,
      ].slice(0, 8),
    },
    "Victory. Your spoils are unsecured until extraction.",
  );
}
/** Reserve contracted shares on each gold find; settle them at successful extraction. */
export function needsGateConfirmation(s: Game, a: Action) {
  return (
    s.phase === "town" &&
    gateOpen(s.day) &&
    (a.type === "REST" ||
      a.type === "WORK" ||
      (a.type === "TRAIN" &&
        s.gold >= 60 &&
        s.party.some(
          (c) =>
            trainingXp(
              c,
              s.bestFloor,
              Math.max(...s.party.map((p) => p.level)),
            ) > 0,
        ))) &&
    !a.skipOpening
  );
}
export function reducer(s: Game, a: Action): Game {
  if (a.type === "ACK_RECRUIT_REPLY")
    return { ...s, recruitReply: null, message: "" };
  if (a.type === "ACK_DISCOVERY")
    return { ...s, discoveryReceipt: null, message: "" };
  if (a.type === "FINISH_PLAYBACK")
    return { ...s, playback: null, roundPlayback: null };
  if (s.playback || s.roundPlayback) return s;
  if (a.type === "QUICK_TRAVEL") {
    if (
      !["exploration", "victory", "camp"].includes(s.phase) ||
      s.journey.wildCamp
    )
      return note(s, "Finish this encounter before following a known route.");
    const path = knownPath(s, a.room);
    if (path.length < 2)
      return note(
        s,
        path.length
          ? "You are already there."
          : "Explore every passage of this route before using quick travel.",
      );
    let next: Game = { ...s, phase: "exploration" };
    for (const destination of path.slice(1)) {
      const map = next.journey.maps[currentMapKey(next)],
        heading = HEADINGS.find(
          (h) => map.nodes[next.journey.room].exits[h] === destination,
        );
      if (!heading) break;
      next = reducer(next, {
        type: "MOVE",
        direction: relativeDirection(next.journey.facing, heading),
      });
      if (
        next.phase !== "exploration" ||
        next.playback ||
        next.roundPlayback ||
        next.discoveryReceipt
      )
        break;
    }
    return next;
  }
  if (a.type === "ACK_REPORT")
    return s.lastReport
      ? { ...s, lastReport: { ...s.lastReport, reviewed: true } }
      : s;
  if (a.type === "COMBAT_SPEED") return { ...s, combatSpeed: a.speed };
  if (a.type === "SET_FORMATION") {
    if (
      !["town", "camp", "exploration", "victory"].includes(s.phase) ||
      !["front", "back"].includes(a.formation)
    )
      return s;
    const { id, formation } = a;
    const place = (c: Character) => (c.id === id ? { ...c, formation } : c);
    return {
      ...s,
      party: s.party.map(place),
      reserve: s.phase === "town" ? s.reserve.map(place) : s.reserve,
    };
  }
  if (a.type === "AUTO_COMBAT") {
    if (!canAutoResolve(s))
      return note(
        s,
        "Auto combat requires a safely outlevelled ordinary fight, a healthy party and a conservative damage margin.",
      );
    let next = s;
    for (let i = 0; i < 24 && next.phase === "combat"; i++) {
      if (
        next.party.some(
          (c) =>
            c.hp < c.maxHp * 0.75 ||
            Object.keys(c.ailments.conditions || {}).length ||
            c.ailments.poison ||
            c.ailments.paralysis,
        )
      )
        break;
      const target = next.combat!.enemies.find((e) => e.hp > 0)?.id;
      next = reducer(next, {
        type: "ROUND",
        battleId: next.combat!.id,
        round: next.combat!.round,
        actions: next.party
          .filter(
            (c) =>
              c.hp > 0 &&
              !c.ailments.paralysis &&
              !c.ailments.conditions?.frozen,
          )
          .map((c) => ({ actor: c.id, kind: "attack", target })),
      });
    }
    return next;
  }
  if (a.type === "WALKTHROUGH") {
    if (!s.started) return s;
    if (a.kind === "restart")
      return {
        ...s,
        guideSeen: true,
        walkthrough: newWalkthrough(!firstExpeditionComplete(s)),
      };
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
  let randomSeed: number | undefined;
  let stream: "combat" | "encounters" = "encounters";
  if ("roll" in a && !Number.isFinite(a.roll)) return s;
  if ("roll" in a && a.type !== "CREATE" && a.roll === -1) {
    stream = a.type === "BATTLE" ? "combat" : "encounters";
    const draw = nextRandom(s.rng[stream]);
    randomSeed = draw.seed;
    a = { ...a, roll: draw.roll };
  }
  let next = resolveGameAction(s, a);
  if (
    randomSeed !== undefined &&
    next !== s &&
    (a.type !== "BATTLE" || next.effects.id !== s.effects.id)
  )
    next = { ...next, rng: { ...next.rng, [stream]: randomSeed } };
  if (a.type === "CREATE" && next.started && !s.started)
    next = {
      ...next,
      rng: {
        combat: seedFor(`${next.journey.seed}:combat`),
        loot: seedFor(`${next.journey.seed}:loot`),
        encounters: seedFor(`${next.journey.seed}:encounters`),
      },
    };
  if (next.lootReceipt && next.kills > s.kills)
    next = {
      ...next,
      expedition: {
        ...next.expedition,
        receipts: {
          ...next.expedition.receipts,
          [next.lootReceipt.id]: next.lootReceipt,
        },
      },
    };
  if (
    s.phase !== "town" &&
    next !== s &&
    ((a.type === "BRANCH_CHOICE" &&
      a.choice !== "leave" &&
      next.journey.resolvedBranches.length >
        s.journey.resolvedBranches.length) ||
      (a.type === "EVENT" && next.eventResolved && !s.eventResolved))
  ) {
    const id = `${encounterKey(s)}:${a.type}`;
    const items = Object.fromEntries(
      [
        ...new Set([
          ...Object.keys(s.inventory),
          ...Object.keys(next.inventory),
        ]),
      ]
        .map((id) => [id, (next.inventory[id] || 0) - (s.inventory[id] || 0)])
        .filter(([, qty]) => qty !== 0),
    );
    next = {
      ...next,
      expedition: {
        ...next.expedition,
        resolutions: {
          ...next.expedition.resolutions,
          [id]: {
            action: a.type,
            outcome: next.message,
            gold: next.gold - s.gold,
            food: next.food - s.food,
            items,
          },
        },
      },
    };
  }
  if (
    (a.type === "EVENT" ||
      (a.type === "USE_SUPPLY" && a.id === "labyrinth-key")) &&
    !s.eventResolved &&
    next.eventResolved
  )
    next = recordPrincipal(s, next, a.type === "EVENT" ? a.choice : "key");
  next = townRecovery(s, next, ["REST", "WORK", "TRAIN"].includes(a.type));
  next = trackSpoils(s, next, a);
  if (
    next.phase === "defeat" ||
    (next.party.length > 0 &&
      next.phase !== "town" &&
      next.party.every((c) => c.hp <= 0))
  )
    next = loseSpoils(next);
  next = storyConsequences(s, next, a);
  if (
    a.type === "STORY_CHOICE" &&
    s.stories.active?.resume === "town" &&
    next.stories.history.length > s.stories.history.length
  ) {
    const entry = next.stories.history.at(-1)!;
    next = {
      ...next,
      townLife: {
        ...(next.townLife || newTownLife()),
        result: {
          title: entry.title,
          body: entry.outcome,
          bonds: [...next.party, ...next.reserve].flatMap((c) => {
            const change =
              (next.stories.loyalty[c.id] ?? B.loyaltyStart) -
              (s.stories.loyalty[c.id] ?? B.loyaltyStart);
            return change ? [{ name: c.name, change }] : [];
          }),
        },
      },
    };
  }
  if (
    a.type === "RETURN" &&
    s.journey.startDay !== null &&
    next.phase === "town" &&
    s.phase !== "town"
  ) {
    const report = expeditionReport(s, next);
    next = {
      ...next,
      lastReport: report,
      challengeCompletions:
        (s.challengeCompletions || 0) + (report.challenge ? 1 : 0),
    };
  }
  next = advanceWalkthrough(s, next, a);
  if (a.type === "ENTER" || a.type === "RETURN")
    next = { ...next, discoveryReceipt: null };
  // Discoveries are already awarded. This receipt only pauses the UI, so reopening
  // or dismissing it cannot reroll a chest or award the same coins twice.
  if (
    s.journey.startDay !== null &&
    !s.expedition.lost &&
    !["town", "loot", "combat"].includes(s.phase) &&
    !["town", "defeat", "combat"].includes(next.phase) &&
    [
      "BRANCH_CHOICE",
      "EVENT",
      "ENCOUNTER",
      "GENERIC_CHOICE",
      "STORY_CHOICE",
      "USE_SUPPLY",
      "MOVE",
      "MOVE_BACK",
    ].includes(a.type)
  ) {
    const items = Object.fromEntries(
      Object.entries(next.inventory)
        .map(
          ([id, quantity]) => [id, quantity - (s.inventory[id] || 0)] as const,
        )
        .filter(([, quantity]) => quantity > 0),
    );
    const found = {
      title:
        s.journey.branch?.kind === "cache"
          ? "Chest opened"
          : "Treasure collected",
      gold: Math.max(0, next.gold - s.gold),
      food: Math.max(0, next.food - s.food),
      potions: Math.max(0, next.potions - s.potions),
      gems: Math.max(0, next.gems - s.gems),
      items,
    };
    if (
      Object.keys(items).length ||
      found.gold ||
      found.food ||
      found.potions ||
      found.gems
    )
      next = { ...next, discoveryReceipt: found };
  }
  return next;
}
function resolveGameAction(s: Game, a: Action): Game {
  if (needsGateConfirmation(s, a))
    return note(
      s,
      "The labyrinth is open. Confirm skipping this opening before spending a day in town.",
    );
  let next = reduceGame(s, a);
  if (
    s.fieldRest &&
    a.type === "ROUND" &&
    a.flee &&
    next.journey.room !== s.journey.room
  )
    next = {
      ...next,
      fieldRest: null,
      stories: { ...next.stories, active: null },
    };
  if (
    a.type === "ENTER" &&
    s.phase === "town" &&
    ["mission", "arrival"].includes(next.phase) &&
    next.expedition.number === s.expedition.number + 1
  ) {
    next = establishExpedition(next);
    next = {
      ...next,
      journey: {
        ...next.journey,
        facing: entryFacing(floorMap(next)),
        arrivalFacingSet: true,
      },
      expedition: { ...next.expedition, departure: departureSnapshot(s) },
    };
    if (a.mission)
      next = spendWatches(exertForAction(next, next, a), B.watchesPerDay, {
        rest: false,
      });
  }
  if (
    !next.trial &&
    !(a.type === "COLLECT" && s.fieldRest) &&
    ((next.phase === "arrival" &&
      next.journey.defender &&
      s.journey.room !== next.journey.room) ||
      (next.phase === "arrival" &&
        next.journey.defender &&
        !s.journey.defender))
  )
    next = beginCombat(next);
  if (
    next.phase === "combat" &&
    s.phase !== "combat" &&
    !next.trial &&
    !(s.phase === "arrival" && s.combat && a.type !== "REST_HERE")
  )
    next = beginCombat(
      next,
      s.phase === "camp" ? "camp" : "exploration",
      a.type === "REST_HERE" ? `rest-${next.journey.watches}` : "roamer",
      a.type === "REST_HERE" ||
        (a.type === "CAMP_REST" && s.journey.wildCamp) ||
        (a.type === "EVENT" &&
          FLOORS[s.floor - 1].event === "camp" &&
          a.choice === "welcome"),
    );
  if (
    next.combat &&
    ((a.type === "APPROACH" && next.arrivalChoice !== s.arrivalChoice) ||
      (a.type === "USE_SUPPLY" && a.id === "torch" && next.enemy !== s.enemy))
  ) {
    const combat = {
      ...next.combat,
      enemies: next.combat.enemies.map((e, i) =>
        i === 0 ? { ...e, ...next.enemy } : e,
      ),
      preparation: {
        choice: next.arrivalChoice,
        outcome: next.arrivalOutcome,
        effect: next.arrivalEffect,
        scouted: next.arrivalScouted,
      },
    };
    next = {
      ...next,
      combat,
      expedition: {
        ...next.expedition,
        battles: { ...next.expedition.battles, [combat.id]: combat },
      },
    };
  }
  if (
    a.type === "ROUND" &&
    next.expedition.rounds > s.expedition.rounds &&
    next.combat?.complete &&
    next.phase === "combat"
  )
    next = battleWon(
      next,
      next.party,
      next.enemy!,
      next.effects,
      [],
      next.potions,
      next.inventory,
    );
  if (
    s.phase !== "town" &&
    next !== s &&
    next.journey.watches === s.journey.watches
  ) {
    const timed =
      (a.type === "UNLOCK_SHORTCUT" && next.journey.maps !== s.journey.maps) ||
      ((a.type === "MOVE" ||
        a.type === "MOVE_BACK" ||
        a.type === "LEAVE_CAMP") &&
        next.journey.room !== s.journey.room) ||
      (a.type === "BRANCH_CHOICE" &&
        (next.phase !== s.phase || next.journey.room !== s.journey.room)) ||
      (a.type === "ROUND" && next.expedition.rounds > s.expedition.rounds) ||
      (a.type === "MISSION" && next.phase === "arrival") ||
      (a.type === "APPROACH" && next.arrivalChoice !== s.arrivalChoice) ||
      (a.type === "EVENT" &&
        (next.eventResolved !== s.eventResolved ||
          next.encounterExamined !== s.encounterExamined ||
          next.route !== s.route)) ||
      (a.type === "GENERIC_CHOICE" &&
        next.journey.resolvedBranches.length >
          s.journey.resolvedBranches.length) ||
      (a.type === "STORY_CHOICE" &&
        next.stories.history.length > s.stories.history.length) ||
      (a.type === "CONTINUE" && next.floor > s.floor) ||
      (a.type === "WILD_CAMP" && next.phase === "camp") ||
      (a.type === "USE_SUPPLY" &&
        a.id === "labyrinth-key" &&
        next.eventResolved &&
        !s.eventResolved) ||
      (a.type === "ENCOUNTER" &&
        (next.phase !== s.phase ||
          next.encounterExamined !== s.encounterExamined));
    if (timed)
      next = spendWatches(
        a.type === "ROUND" ? next : exertForAction(s, next, a),
        B.watchesPerDay,
        { rest: false },
      );
  }
  if (a.type === "BATTLE" && next.effects.id !== s.effects.id)
    next = exertForAction(s, next, a);
  if (next !== s && s.phase !== "town" && a.type !== "NAG_DECISION")
    next = maybeComplain(next);
  const gross = next.gold - s.gold;
  if (
    s.journey.startDay === null ||
    s.phase === "town" ||
    a.type === "RETURN" ||
    gross <= 0
  )
    return next;
  const paid = Object.fromEntries(
    Object.entries(s.runContracts).map(([id, share]) => [
      id,
      Math.floor((gross * share) / 100),
    ]),
  );
  const cut = Object.values(paid).reduce((n, x) => n + x, 0);
  return {
    ...next,
    gold: next.gold - cut,
    message:
      next.phase === "loot"
        ? next.message
        : `${next.message} Gross ${gross} gold · contracted shares held ${cut}${
            cut
              ? ` (${Object.entries(paid)
                  .map(
                    ([id, n]) =>
                      `${next.party.find((c) => c.id === id)?.name || id}: ${n}`,
                  )
                  .join(", ")})`
              : ""
          } · net ${gross - cut} gold.`,
    runGross: s.runGross + gross,
    runGold: s.runGold + gross - cut,
    expedition: {
      ...next.expedition,
      accruedShares: Object.fromEntries(
        Object.entries(s.runContracts).map(([id]) => [
          id,
          (s.expedition.accruedShares[id] || 0) + paid[id],
        ]),
      ),
    },
  };
}
function reduceGame(s: Game, a: Action): Game {
  const townLifeAction = resolveTownLife(s, a);
  if (townLifeAction) return townLifeAction;
  const genericAction = resolveGenericAction(s, a);
  if (genericAction) return genericAction;
  const factionAction = resolveFactionAction(s, a);
  if (factionAction) return factionAction;
  const storyAction = resolveStoryAction(s, a);
  if (storyAction) return storyAction;
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
    return note(
      resumed,
      "Find a sanctuary on the map or make camp with a camping kit.",
    );
  }
  const exploration = resolveExploration(s, a, (floor, partySize) =>
    enemyFor(floor, s.route, partySize, "regular"),
  );
  if (exploration) {
    if (
      exploration.phase === "arrival" &&
      exploration.journey.defender &&
      (s.journey.room !== exploration.journey.room || !s.journey.defender)
    )
      return {
        ...exploration,
        enemy: enemyFor(s.floor, s.route, s.party.length),
        turn: 1,
        momentum: 0,
        sideBattle: false,
        arrivalChoice: "",
        arrivalOutcome: "",
        arrivalEffect: "",
        arrivalScouted: false,
        effects: emptyEffects(),
        party: exploration.party.map((c) => ({
          ...c,
          cooldowns: {},
          battleMastery: {},
        })),
      };
    return exploration;
  }
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
        ITEMS.some(
          (item) =>
            item.id === entry.id &&
            item.kind !== "loot" &&
            !factionAccess(s, item) &&
            s.bestFloor >= gearFloor(item),
        ),
    );
    if (!valid) return s;
    const total = a.items.reduce(
      (sum, entry) =>
        sum +
        buyPrice(
          ITEMS.find((i) => i.id === entry.id)!,
          s.day,
          s,
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
    if (a.essence && !recipe.essence) return s;
    const materials = a.essence
      ? [{ id: essenceId(recipe.essence!), quantity: 1 }]
      : recipe.materials;
    if (
      s.gold < recipe.gold ||
      materials.some((m) => (s.inventory[m.id] || 0) < m.quantity)
    )
      return note(s, "You need the recipe’s gold and materials.");
    const inventory = { ...s.inventory, [a.id]: (s.inventory[a.id] || 0) + 1 };
    for (const m of materials) inventory[m.id] -= m.quantity;
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
    if (a.id === "camp-kit")
      return note(
        s,
        "Use a camping kit to make a wild camp from exploration. Rest uses ordinary daily checks.",
      );
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
    return note(s, "You cannot use this supply here.");
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
          seed:
            (a.seed ??
              (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) >>>
            0,
        },
      },
      `${hero.name}, a ${hero.job}, arrived in Stormhold.`,
    );
  }
  if (a.type === "TREAT_INJURY" && s.phase === "town") {
    const c = s.party.concat(s.reserve).find((c) => c.id === a.id);
    if (!c || !c.injuries) return s;
    const cost = 100 * c.level;
    if (s.gold < cost)
      return note(
        s,
        `Treatment costs ${cost} gold. Three town days also heal an injury.`,
      );
    const heal = (p: Character) =>
      p.id === c.id ? setInjuries(p, p.injuries - 1) : p;
    return note(
      {
        ...s,
        gold: s.gold - cost,
        party: s.party.map(heal),
        reserve: s.reserve.map(heal),
      },
      `${c.name} has one injury treated.`,
    );
  }
  if (a.type === "RETURN") {
    if (s.phase === "town") return s;
    if (daysRemaining(s) > 0)
      return note(
        s,
        `The return gate is sealed for ${daysRemaining(s)} more days. Find shelter if your team cannot continue.`,
      );
    s = rescueInjuries(s);
    const mission = missionDetails(s.journey.mission);
    const reward =
      !s.expedition.lost && mission && missionProgress(s) >= mission.target
        ? mission.reward
        : 0;
    return note(
      {
        ...s,
        day: (s.journey.startDay ?? s.day) + 31,
        gold: s.gold + reward,
        runPaid: { ...s.expedition.accruedShares },
        expedition: newExpedition(s.expedition.number),
        journey: { ...s.journey, startDay: null },
        phase: "town",
        enemy: null,
        combat: null,
        roundPlayback: null,
        lastOutcome: s.expedition.lost ? "Lost expedition" : "Returned safely",
        fieldRest: null,
      },
      `The return gate carried your team home.${reward ? ` Mission fulfilled: +${reward} guild gold.` : ""} ${s.ending ? "The summit is conquered. Stormhold will remember your names." : "Regroup, grow stronger, and conquer Floor 12."}`,
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
  if (a.type === "SLOT_SKILL") {
    if (s.phase !== "town") return note(s, "Change skill loadouts in town.");
    const c = s.party.concat(s.reserve).find((c) => c.id === a.id);
    if (!c || !c.learnedSkills.includes(a.skill)) return s;
    if (
      a.equip &&
      (c.skills.includes(a.skill) || c.skills.length >= skillSlots(c.level))
    )
      return note(s, "Unequip a skill to free a slot.");
    const update = (p: Character) =>
      p.id !== a.id
        ? p
        : {
            ...p,
            skills: a.equip
              ? [...p.skills, a.skill]
              : p.skills.filter((k) => k !== a.skill),
          };
    return { ...s, party: s.party.map(update), reserve: s.reserve.map(update) };
  }
  if (a.type === "LEARN") {
    if (s.phase === "camp" && s.journey.wildCamp)
      return note(
        s,
        "Bind essences in town or an established sanctuary; a wild camp is not safe enough.",
      );
    if (!["town", "camp"].includes(s.phase))
      return note(s, "Bind essences in town or shelter.");
    const options = essenceBindingOptions(s, a.skill);
    if (!a.species && options.length > 1)
      return note(
        s,
        "Choose which species essence to bind. Each held essence is listed separately.",
      );
    const selectedSpecies = a.species || options[0]?.species;
    const spec = MONSTERS.find(
      (m) => m.skill === a.skill && m.id === selectedSpecies,
    );
    const c = s.party
      .concat(s.phase === "town" ? s.reserve : [])
      .find((c) => c.id === a.id);
    if (
      !spec ||
      !c ||
      c.hp <= 0 ||
      c.learnedSkills.includes(a.skill) ||
      !(s.inventory[essenceId(spec.id)] > 0)
    )
      return note(s, "Choose an unlearned skill and its species essence.");
    const id = essenceId(spec.id);
    const provisional =
      s.phase !== "town" && (s.expedition.unsecured.inventory[id] || 0) > 0;
    const update = (p: Character) =>
      p.id !== c.id
        ? p
        : {
            ...p,
            learnedSkills: [...p.learnedSkills, a.skill],
            skills:
              p.skills.length < skillSlots(p.level)
                ? [...p.skills, a.skill]
                : p.skills,
          };
    return note(
      {
        ...s,
        inventory: { ...s.inventory, [id]: s.inventory[id] - 1 },
        party: s.party.map(update),
        reserve: s.reserve.map(update),
        expedition: {
          ...s.expedition,
          provisionalSkills: provisional
            ? {
                ...s.expedition.provisionalSkills,
                [c.id]: [
                  ...(s.expedition.provisionalSkills[c.id] || []),
                  a.skill,
                ],
              }
            : s.expedition.provisionalSkills,
        },
      },
      `${a.skill} learned.${provisional ? " Secured on extraction; lost on defeat." : " Permanently secured."}`,
    );
  }
  if (s.phase === "town") {
    if (a.type === "PREPARE_CYCLE") {
      const days = daysToGate(s.day);
      if (!days)
        return note(s, "The gate is open now. Your expedition awaits.");
      let next = s,
        trained = 0,
        worked = 0;
      for (let i = 0; i < days; i++) {
        const eligible = next.party.some(
          (c) => trainingXp(c, next.bestFloor) > 0,
        );
        const type =
          a.mode === "rest"
            ? "REST"
            : a.mode === "work" || !eligible
              ? "WORK"
              : "TRAIN";
        if (type === "TRAIN" && next.gold < 60)
          return note(
            next,
            "Training paused: the next session costs 60 gold. Your completed days are preserved.",
          );
        next = reducer(next, { type, skipOpening: true });
        if (type === "TRAIN") trained++;
        if (type === "WORK") worked++;
      }
      return note(
        next,
        `Preparation complete: ${trained} training days, ${worked} work days${a.mode === "rest" ? `, ${days} recovery days` : ""}. The gate is open.`,
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
          journey: chartRumour(s, rumour.floor, rumour.title),
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
        const knownFloor = Math.min(
          12,
          (r.portrait || 0) >= 24
            ? r.level || 1
            : 1 + RECRUITS.findIndex((x) => x.id === r.id),
        );
        return {
          ...s,
          knownFloors: [...new Set([...s.knownFloors, knownFloor])],
          journey: chartRumour(s, knownFloor),
          rapport: {
            ...s.rapport,
            [a.id]: {
              ...old,
              inspected: true,
              trust: old.trust + 1,
              reply: `“I am a ${r.job || RACES.find((x) => x.id === r.race)!.job}. ${r.tagline} I can mark ${
                FLOORS[knownFloor - 1].name
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
      const rp = s.rapport[a.id] || {
        trust: 0,
        asked: false,
        inspected: false,
        offer: recruitShare(s, r),
        reply: r.quote,
      };
      const minimum = recruitShare(s, r, rp.trust);
      const offer = a.offer ?? minimum;
      const respond = (outcome: RecruitReply["outcome"], reason?: string) => {
        const reply = recruitmentReply(s, r, offer, outcome, reason);
        return {
          ...s,
          recruitReply: reply,
          message: "",
          rapport: {
            ...s.rapport,
            [a.id]: { ...rp, offer: minimum, reply: reply.line },
          },
        };
      };
      if (!recruitAvailable(s, r))
        return respond(
          "blocked",
          `Reach Floor ${r.floor} and come back. I need to know you can handle what’s down there.`,
        );
      const levelRefusal = recruitLevelRefusal(s, r);
      if (levelRefusal) return respond("blocked", levelRefusal);
      if (s.party.length >= 4)
        return respond(
          "blocked",
          "You’ve already got four in your company. Make room for me, and we can talk.",
        );
      if (!validShare(offer))
        return respond(
          "declined",
          `Contracts run from 10% to 50%. My asking share is ${minimum}%.`,
        );
      if (offer < minimum) return respond("declined");
      const total =
        s.party.reduce((n, c) => n + (s.contracts[c.id] || 0), 0) + offer;
      if (total > 75)
        return respond(
          "blocked",
          "That promises more than the company can pay. Keep at least 25% for yourself; change the other contracts or the line-up first.",
        );
      const c = makeCharacter(r.race, r.id, r.name);
      c.traitRevealed = rp.trust >= 2;
      return note(
        {
          ...respond("accepted"),
          contracts: { ...s.contracts, [a.id]: offer },
          party: [...s.party, c],
          townProgress: {
            ...s.townProgress,
            signed: [...new Set([...s.townProgress.signed, c.id])],
          },
        },
        `${r.name} joined for ${offer}% of expedition gold.`,
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
          faction: {
            ...s.faction,
            guild: Math.max(
              s.faction.guild,
              Math.min(B.townWorkStandingCap, s.faction.guild + 1),
            ),
          },
        },
        `Completed a town contract. +125 gold${s.faction.guild < B.townWorkStandingCap ? " and +1 Guild standing" : "; further standing comes from expeditions"}.`,
      );
    if (a.type === "TRAIN") {
      if (
        !s.party.some(
          (c) =>
            trainingXp(
              c,
              s.bestFloor,
              Math.max(...s.party.map((p) => p.level)),
            ) > 0,
        )
      )
        return note(
          s,
          `Town training prepares characters up to level ${trainingLimit(s.bestFloor)}. Explore deeper or help a weaker companion catch up.`,
        );
      if (s.gold < 60) return note(s, "Training costs 60 gold.");
      return note(
        {
          ...s,
          day: s.day + 1,
          gold: s.gold - 60,
          party: s.party.map((c) =>
            gainXp(
              c,
              trainingXp(
                c,
                s.bestFloor,
                Math.max(...s.party.map((p) => p.level)),
              ),
            ),
          ),
          townProgress: {
            ...s.townProgress,
            trained: s.townProgress.trained + 1,
          },
        },
        `The party trained. Eligible companions gained up to 45 XP, or 90 XP when at least two levels behind their party; the current training ceiling is level ${trainingLimit(s.bestFloor)}.`,
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
      if (s.bestFloor < gearFloor(item))
        return note(
          s,
          `Reach Floor ${gearFloor(item)} to unlock this equipment.`,
        );
      if (factionAccess(s, item)) return note(s, factionAccess(s, item));
      const price = buyPrice(item, s.day, s);
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
      const offer = temperingOffer(s, c);
      if (!offer.available) return note(s, offer.reason);
      return note(
        {
          ...s,
          gold: s.gold - offer.gold,
          inventory: {
            ...s.inventory,
            [offer.material]: s.inventory[offer.material] - offer.quantity,
          },
          party: s.party.map((p) =>
            p.id === a.id
              ? {
                  ...p,
                  gear: p.gear + 1,
                  atk: p.atk + offer.attack,
                  def: p.def + offer.defense,
                }
              : p,
          ),
        },
        `Tempering tier ${c.gear + 1} complete. Attack +${offer.attack}, defense +${offer.defense}.`,
      );
    }
    if (a.type === "REFINE_GEAR") {
      const c = s.party.find((p) => p.id === a.id);
      if (
        !c ||
        !["fire", "frost", "venom"].includes(a.element) ||
        c.refinements?.[a.element]
      )
        return s;
      if (!c.equipment.length)
        return note(s, "Equip gear before refining its protection.");
      if (s.gems < 30 || s.gold < 100)
        return note(s, "Equipment refinement costs 30 crystals and 100 gold.");
      return note(
        {
          ...s,
          gold: s.gold - 100,
          gems: s.gems - 30,
          party: s.party.map((p) =>
            p.id !== c.id
              ? p
              : { ...p, refinements: { ...p.refinements, [a.element]: true } },
          ),
        },
        `${c.name}'s gear protection refined: +10% ${a.element} resistance. This tempering remains with the companion.`,
      );
    }
    if (a.type === "ENCHANT")
      return note(
        s,
        "Hunt a monster and bind its essence. Crystals refine equipment, not skills.",
      );
    if (a.type === "SELECT_START") {
      if (!s.checkpoints.includes(a.floor)) return s;
      const route = a.route || s.startRoute;
      if (a.floor === 7 && (!route || !s.discoveredRoutes.includes(route)))
        return note(s, "Choose a previously discovered route for Floor 7.");
      return { ...s, startFloor: a.floor, startRoute: route || null };
    }
    if (a.type === "ENTER") {
      if (a.mission !== undefined && !MISSIONS.some((m) => m.id === a.mission))
        return note(
          s,
          "Choose climbing or treasure before entering the portal.",
        );
      if (
        s.party.some(
          (c) =>
            c.id !== "hero" && loyalty(s, c.id) < B.reconciliationThreshold,
        )
      )
        return note(
          s,
          "A companion needs reconciliation. Open Party and speak with them before entering.",
        );
      if (!gateOpen(s.day))
        return note(s, `The labyrinth opens in ${daysToGate(s.day)} days.`);

      if (!s.party.some((c) => c.hp > 0))
        return note(s, "Rest your party before entering.");
      return note(
        {
          ...s,
          food: s.food,
          combat: null,
          roundPlayback: null,
          expedition: newExpedition(s.expedition.number + 1),
          fieldRest: null,
          lootReceipt: null,
          floor: s.startFloor,
          phase: a.mission ? "arrival" : "mission",
          journey: {
            ...newJourney(),
            seed: s.journey.seed,
            maps: {
              ...s.journey.maps,
              [mapKey(s.startFloor, s.startRoute)]:
                s.journey.maps[mapKey(s.startFloor, s.startRoute)] ||
                generateFloor(
                  s.startFloor,
                  s.journey.seed,
                  s.startFloor === 7 ? s.startRoute || "roots" : "",
                ),
            },
            chart: s.journey.chart,
            startDay: s.day,
            mission: a.mission || null,
          },
          enemy: enemyFor(s.startFloor, s.startRoute, s.party.length),
          turn: 1,
          momentum: 0,
          party: s.party.map((c) => ({
            ...c,
            cooldowns: {},
            battleMastery: {},
          })),
          runKills: 0,
          runGold: 0,
          runGross: 0,
          runPaid: {},
          runContracts: Object.fromEntries(
            s.party
              .filter((c) => s.contracts[c.id] !== undefined)
              .map((c) => [c.id, s.contracts[c.id]]),
          ),
          route: s.startFloor === 7 ? s.startRoute : null,
          eventResolved: false,
          sideBattle: false,
          ending: s.ending,
          arrivalChoice: "",
          arrivalOutcome: "",
          arrivalEffect: "",
          arrivalScouted: false,
          usedSupplies: [],
          effects: emptyEffects(),
          log: [FLOORS[s.startFloor - 1].intro],
        },
        "The sealed month begins. Explore the passages and find the portal defender.",
      );
    }
    return s;
  }
  if (a.type === "ENGAGE" && s.phase === "arrival" && !s.journey.defender)
    return { ...s, phase: "exploration", message: "" };
  if (
    a.type === "APPROACH" &&
    s.phase === "arrival" &&
    s.enemy &&
    s.journey.defender &&
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
  if (a.type === "ROUND") return resolveRound(s, a);
  if (a.type === "EVENT" && s.phase === "event")
    return resolveEvent(s, a.choice, a.roll);
  if (a.type === "CONTINUE" && s.phase === "victory") {
    if (!s.journey.portal || currentRoom(s).kind !== "portal")
      return note(
        s,
        "Find the upward portal before ascending. Search the corridors.",
      );
    if (s.floor === 4 && !s.route)
      return note(
        s,
        "Return to the fourfold gate chamber and choose a route before ascending.",
      );
    if (s.floor >= 12)
      return note(
        s,
        "The campaign is complete. Return with your story and the crown.",
      );

    const floor = s.floor + 1;
    const nextMap =
      s.journey.maps[mapKey(floor, s.route)] ||
      generateFloor(
        floor,
        s.journey.seed,
        floor >= 5 && floor <= 7 ? s.route || "roots" : "",
      );
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
        facing: entryFacing(nextMap),
        arrivalFacingSet: true,
        defender: false,
        maps: {
          ...s.journey.maps,
          [mapKey(floor, s.route)]: nextMap,
        },
      },
      floor,
      food: s.food,
      combat: null,
      enemy: enemyFor(floor, s.route, s.party.length),
      momentum: 0,
      party: s.party.map((c) => ({ ...c, cooldowns: {}, battleMastery: {} })),
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
  if (a.type === "COLLECT" && s.phase === "loot" && s.lootReceipt)
    return afterFloor({ ...s, lootReceipt: null });
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
  if (principalResolved(s) && kind !== "routes")
    return note(
      {
        ...s,
        phase: s.floor === 12 ? "victory" : "exploration",
        eventResolved: true,
      },
      principalAftermath(s),
    );
  const allowed = EVENTS[kind].choices.some((c) => c.id === choice);
  if (!allowed) return s;
  const done = (n: Game, message: string) =>
    note(
      {
        ...n,
        phase: s.floor === 12 ? "victory" : "exploration",
        eventResolved: true,
      },
      message,
    );
  const fight = (name: string, ambush = false, from: Game = s) => {
    const hp = Math.round(
      (140 + from.floor * 35) * (1 + 0.7 * (from.party.length - 1)),
    );
    return note(
      {
        ...from,
        phase: "combat",
        eventResolved: true,
        sideBattle: true,
        turn: 1,
        momentum: 0,
        party: (ambush ? hurtParty(from.party, 22) : from.party).map((c) => ({
          ...c,
          cooldowns: {},
          battleMastery: {},
        })),
        enemy: {
          species: "plunderer",
          name,
          hp,
          maxHp: hp,
          atk: 19 + from.floor * 4,
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
      return done(
        s,
        "“Another time,” you tell him. His smile fades as you pass. You keep walking until the fire is out of sight.",
      );
    }
    const rested = spendWatches(s, B.watchesPerDay, { rest: true });
    if (["defeat", "extraction"].includes(rested.phase)) return rested;
    const encounter = fight(
      "The Smiling Plunderer",
      choice === "welcome",
      rested,
    );
    return { ...encounter, message: `${rested.message} ${encounter.message}` };
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
      {
        ...s,
        route: choice as Route,
        discoveredRoutes: [
          ...new Set([...s.discoveredRoutes, choice as Route]),
        ],
      },
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
        {
          ...s,
          party: hurtParty(s.party, 18),
          inventory: addLoot(s.inventory, "relic-fragment", 2),
        },
        "The shrine takes 18 HP from standing allies. Two relic fragments crystallize.",
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
        inventory: addLoot(
          addLoot(s.inventory, "hollow-crown"),
          "relic-fragment",
          choice === "claim" ? 2 : 0,
        ),

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
