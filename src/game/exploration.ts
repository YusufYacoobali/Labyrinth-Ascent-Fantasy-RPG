import { factionSupplyBonus } from "./relationships";
import { gearFloor } from "./build-equipment";
import { directedEncounter, lockEncounter } from "./encounter-director";
import { openShortcut, shortcutReason } from "./shortcuts";
import { npcAt, WORLD_NPCS } from "./world-npcs";
import { narrateRoom } from "./room-narration";
import { assignGeneric } from "./generic-stories";
import { principalResolved, principalAftermath } from "./stories";
import { passTime } from "./survival";
import { canRestHere, rememberRestLocation } from "./field-rest";
import { BALANCE } from "./balance";
import { rollTreasureGold } from "./treasure";
import { nextRandom, CORE_TRADE_VALUE } from "./monsters";
import type { Action, Enemy, Game, Phase } from "./engine";
import { FLOORS, ITEMS } from "./world";
import {
  currentMapKey,
  floorMap,
  currentRoom,
  encounterKey,
  roomOccupant,
} from "./exploration-state";
import {
  generateFloor,
  reveal,
  mapKey,
  populateFloor,
  absoluteHeading,
  relativeDirection,
  HEADINGS,
  opposite,
  shortestPath,
  type Heading,
  type RelativeDirection,
  type RouteNote,
  type Occupant,
  type FloorMap,
} from "./floor-map";

export {
  currentMapKey,
  floorMap,
  currentRoom,
  encounterKey,
  roomOccupant,
} from "./exploration-state";
export type Direction = RelativeDirection;
export type Mission = "survey" | "salvage" | "survivors";
export type BranchKind = "cache" | "company" | "spring" | "beast";
export interface Journey {
  startDay: number | null;
  watches: number;
  mission: Mission | null;
  step: number;
  portal: boolean;
  chart: Record<string, RouteNote[]>;
  resolvedBranches: string[];
  branch: { id: string; kind: BranchKind; direction: Direction } | null;
  campReturn:
    "victory" | "exploration" | "combat" | "arrival" | "event" | "branch";
  met: number;
  branchFight: boolean;
  seed: number;
  maps: Record<string, FloorMap>;
  occupants: Record<string, Record<string, Occupant>>;
  facing: Heading;
  arrivalFacingSet?: boolean;
  defender: boolean;
  wildCamp: boolean;
  defeatedPortals: string[];
  room: string;
  nagged: Record<string, number>;
  nag: { speaker: string; quote: string; resume: Phase } | null;
  reachedPortals: number[];
  history: string[];
  leaderId: string;
}
export const newJourney = (): Journey => ({
  startDay: null,
  watches: 0,
  mission: null,
  step: 0,
  portal: false,
  chart: {},
  resolvedBranches: [],
  branch: null,
  campReturn: "victory",
  met: 0,
  branchFight: false,
  seed: 1,
  maps: {},
  occupants: {},
  facing: "north",
  arrivalFacingSet: false,
  defender: false,
  wildCamp: false,
  defeatedPortals: [],
  room: "entrance",
  nagged: {},
  nag: null,
  reachedPortals: [],
  history: [],
  leaderId: "hero",
});
export const exitsFor = (s: Game) =>
  HEADINGS.flatMap((heading) => {
    const to = currentRoom(s).exits[heading];
    return to
      ? [
          {
            heading,
            to,
            direction: relativeDirection(s.journey.facing, heading),
          },
        ]
      : [];
  });
export const isFreshEntrance = (s: Game) =>
  s.journey.room === floorMap(s).entrance &&
  !s.journey.history.length &&
  !s.expedition.trail?.[currentMapKey(s)]?.length;
export function backRoom(s: Game) {
  const previous = s.journey.history.at(-1);
  return previous && Object.values(currentRoom(s).exits).includes(previous)
    ? previous
    : undefined;
}
export function moveRoom(s: Game, id: string): Game {
  const map = floorMap(s),
    room = map.nodes[id];
  if (!room) return s;
  const previous = s.journey.room,
    heading = HEADINGS.find((h) => map.nodes[previous]?.exits[h] === id);
  const history = s.journey.history;
  const nextHistory =
    id === previous
      ? history
      : history.at(-1) === id
        ? history.slice(0, -1)
        : heading
          ? [...history, previous]
          : [];
  const key = currentMapKey(s),
    chart = s.journey.chart[key] || [];
  const note: RouteNote | undefined = heading
    ? {
        from: previous,
        to: id,
        heading,
        approach: s.journey.facing,
        source: "Travelled",
        confidence: "observed",
      }
    : undefined;
  return {
    ...s,
    expedition: {
      ...s.expedition,
      trail: {
        ...s.expedition.trail,
        [key]: heading
          ? [
              ...new Set([
                ...(s.expedition.trail?.[key] || []),
                [previous, id].sort().join(":"),
              ]),
            ]
          : s.expedition.trail?.[key] || [],
      },
      roomVisits: {
        ...s.expedition.roomVisits,
        [key]: [...new Set([...(s.expedition.roomVisits?.[key] || []), id])],
      },
    },
    journey: {
      ...s.journey,
      room: id,
      history: nextHistory,
      step: room.depth,
      facing: heading || s.journey.facing,
      maps: {
        ...s.journey.maps,
        [key]: {
          ...reveal(map, id),
          shortcuts: map.shortcuts?.map((d) =>
            [d.from, d.to].includes(id) ? { ...d, discovered: true } : d,
          ),
        },
      },
      occupants: {
        ...s.journey.occupants,
        [key]:
          s.journey.occupants[key] || populateFloor(map, s.expedition.number),
      },
      portal: room.kind === "portal" && s.journey.defeatedPortals.includes(key),
      reachedPortals:
        room.kind === "portal"
          ? [...new Set([...s.journey.reachedPortals, s.floor])]
          : s.journey.reachedPortals,
      chart: {
        ...s.journey.chart,
        [key]:
          note &&
          !chart.some(
            (n) =>
              n.from === previous && n.to === id && n.confidence === "observed",
          )
            ? [...chart, note]
            : chart,
      },
    },
  };
}
export function enterMappedRoom(
  s: Game,
  id: string,
  direction: Direction = "straight",
): Game {
  const next = moveRoom(lockEncounter(s, id), id),
    room = currentRoom(next),
    key = currentMapKey(next);
  if (room.kind === "camp") {
    const key = encounterKey(next, id) + ":supply-cache",
      fresh = !next.journey.resolvedBranches.includes(key);
    return {
      ...next,
      phase: "camp",
      food:
        next.food +
        (fresh ? BALANCE.sanctuaryRations + factionSupplyBonus(next) : 0),
      message: fresh
        ? `The sanctuary cache holds ${BALANCE.sanctuaryRations + factionSupplyBonus(next)} party rations${factionSupplyBonus(next) ? "; faction allies added an extra ration" : ""}. It replenishes between expeditions.`
        : "The sanctuary cache is empty this expedition.",
      journey: {
        ...next.journey,
        wildCamp: false,
        branch: null,
        campReturn: "exploration",
        resolvedBranches: fresh
          ? [...next.journey.resolvedBranches, key]
          : next.journey.resolvedBranches,
      },
    };
  }
  if (room.kind === "portal" && s.floor === 4 && !s.route)
    return {
      ...next,
      phase: "event",
      journey: { ...next.journey, defender: false },
      message:
        "Choose your onward route at the fourfold arch before facing its defender.",
    };
  if (room.kind === "portal")
    return next.journey.defeatedPortals.includes(key)
      ? {
          ...next,
          phase: "victory",
          journey: { ...next.journey, portal: true },
          message: "The defender is gone. The upward arch is open.",
        }
      : {
          ...next,
          phase: "arrival",
          journey: { ...next.journey, defender: true },
          message:
            "A defender bars the upward arch. Prepare before you engage.",
        };
  if (
    room.kind === "story" &&
    s.floor !== 12 &&
    (!principalResolved(s) || (s.floor === 4 && !s.route)) &&
    !s.eventResolved
  )
    return { ...next, phase: "event" };
  const occupant = roomOccupant(next);
  if (
    next.journey.resolvedBranches.includes(encounterKey(next, id)) ||
    occupant === "quiet" ||
    room.kind === "landmark" ||
    room.kind === "story"
  )
    return {
      ...next,
      phase: "exploration",
      message:
        room.kind === "story" && principalResolved(s)
          ? principalAftermath(s)
          : "",
      journey: { ...next.journey, branch: null },
    };
  const kind: BranchKind = occupant === "hazard" ? "cache" : occupant;
  const encounter: Game = {
    ...next,
    phase: "branch",
    journey: {
      ...next.journey,
      branch: { id: encounterKey(next, id), kind, direction },
    },
  };
  return kind === "company" && !npcAt(encounter)
    ? assignGeneric(encounter, encounterKey(next, id))
    : encounter;
}
export const MISSIONS = [
  {
    id: "survey" as Mission,
    title: "Climb to the summit",
    body: "Seek the next portal and push toward Floor 12.",
    target: 6,
    reward: 150,
  },
  {
    id: "salvage" as Mission,
    title: "Claim the labyrinth’s riches",
    body: "Search for treasure. Bring home 400 gold in cores and coins.",
    target: 400,
    reward: 200,
  },
];
// Preserve the terms of survivor missions already underway in older saves.
export const missionDetails = (id: Mission | null) =>
  MISSIONS.find((mission) => mission.id === id) ||
  (id === "survivors"
    ? {
        id,
        title: "Find other survivors",
        body: "Meet two expedition teams.",
        target: 2,
        reward: 180,
      }
    : undefined);
export const daysRemaining = (s: Game) =>
  Math.max(0, 30 - Math.floor(s.journey.watches / 6));
export function missionProgress(s: Game) {
  return s.journey.mission === "survey"
    ? (s.journey.reachedPortals || []).some((floor) => floor >= s.startFloor)
      ? 6
      : s.floor >= s.startFloor
        ? Math.min(5, s.journey.step)
        : 0
    : s.journey.mission === "salvage"
      ? s.runGross +
        (s.expedition.unsecured.inventory["beast-core"] || 0) * CORE_TRADE_VALUE
      : s.journey.met;
}
export function chartRumour(
  s: Game,
  floor: number,
  source = "Survey team",
): Journey {
  const route = floor >= 5 && floor <= 7 ? s.route || "roots" : "",
    key = mapKey(floor, route);
  const map =
    s.journey.maps[key] || generateFloor(floor, s.journey.seed, route);
  const path = shortestPath(map, map.entrance, map.portal).slice(0, 3);
  const notes: RouteNote[] = path.slice(1).map((to, i) => {
    const from = path[i],
      heading = HEADINGS.find((h) => map.nodes[from].exits[h] === to)!;
    return {
      from,
      to,
      heading,
      approach: i
        ? HEADINGS.find((h) => map.nodes[path[i - 1]].exits[h] === from)!
        : "north",
      source,
      confidence: "reported",
    };
  });
  const old = s.journey.chart[key] || [];
  return {
    ...s.journey,
    maps: {
      ...s.journey.maps,
      [key]: { ...map, known: [...new Set([...map.known, ...path])] },
    },
    chart: {
      ...s.journey.chart,
      [key]: [
        ...old,
        ...notes.filter(
          (n) => !old.some((o) => o.from === n.from && o.to === n.to),
        ),
      ],
    },
  };
}
export const spendWatches = passTime;
export const restHereRisk = (floor: number) =>
  BALANCE.restHereRisk[floor <= 4 ? 0 : floor <= 8 ? 1 : 2];
export const wildCampRisk = (floor: number) =>
  BALANCE.wildCampRisk[floor <= 4 ? 0 : floor <= 8 ? 1 : 2];
const say = (s: Game, message: string): Game => ({
  ...s,
  message,
  journal: [message, ...s.journal].slice(0, 60),
});

export function roomStory(s: Game) {
  const room = currentRoom(s),
    exits = exitsFor(s),
    count = exits.length;
  return {
    title:
      room.kind === "landmark"
        ? room.id === "entrance"
          ? "The entry lantern"
          : "The carved waystone"
        : room.kind === "dead-end"
          ? "A blind chamber"
          : room.kind === "portal"
            ? "The upward arch"
            : "Passages in the stone",
    body: narrateRoom({
      seed: s.journey.seed,
      floor: s.floor,
      floorName: FLOORS[s.floor - 1].name,
      biome:
        s.floor >= 5 && s.floor <= 7
          ? s.route || "roots"
          : FLOORS[s.floor - 1].environment,
      id: room.id,
      kind: room.kind,
      exits: count,
      facing: s.journey.facing,
      resolved: s.journey.resolvedBranches.includes(encounterKey(s)),
      injured: s.party.some((c) => c.injuries > 0),
    }),
  };
}

export function resolveExploration(
  s: Game,
  a: Action,
  enemyFor: (floor: number, partySize: number) => Enemy,
): Game | null {
  if (
    a.type === "UNLOCK_SHORTCUT" &&
    ["exploration", "camp", "victory"].includes(s.phase)
  ) {
    const map = floorMap(s),
      door = map.shortcuts?.find((d) => d.id === a.id);
    if (!door) return s;
    const reason = shortcutReason(s, map, door);
    if (reason) return say(s, reason);
    return say(
      {
        ...s,
        inventory:
          door.requirement === "key"
            ? {
                ...s.inventory,
                "labyrinth-key": s.inventory["labyrinth-key"] - 1,
              }
            : s.inventory,
        journey: {
          ...s.journey,
          maps: {
            ...s.journey.maps,
            [currentMapKey(s)]: openShortcut(map, door.id),
          },
        },
      },
      "The stone latch opens onto a permanent shortcut. Opening it takes one day; movement remains an explicit choice.",
    );
  }
  if (
    a.type === "MISSION" &&
    s.phase === "mission" &&
    MISSIONS.some((m) => m.id === a.id)
  )
    return say(
      { ...s, phase: "arrival", journey: { ...s.journey, mission: a.id } },
      "You agree on your purpose. The return gate seals behind the team for thirty days.",
    );
  if (a.type === "SEARCH_PORTAL" && s.phase === "victory") {
    return { ...s, phase: "exploration" };
  }
  if (
    a.type === "AT_PORTAL" &&
    s.phase === "exploration" &&
    currentRoom(s).kind === "portal"
  )
    return enterMappedRoom(s, s.journey.room);
  if (
    a.type === "TURN_AROUND" &&
    s.phase === "exploration" &&
    isFreshEntrance(s) &&
    currentRoom(s).exits[opposite(s.journey.facing)]
  )
    return {
      ...s,
      journey: { ...s.journey, facing: opposite(s.journey.facing) },
    };
  if (
    (a.type === "MOVE" || a.type === "MOVE_BACK") &&
    ["exploration", "branch"].includes(s.phase)
  ) {
    const direction = a.type === "MOVE_BACK" ? "back" : a.direction;
    const target =
      a.type === "MOVE_BACK"
        ? backRoom(s)
        : currentRoom(s).exits[absoluteHeading(s.journey.facing, direction)];
    if (!target) return say(s, "There is no passage in that direction.");
    return enterMappedRoom(s, target, direction);
  }
  if (a.type === "BRANCH_CHOICE" && s.phase === "branch" && s.journey.branch) {
    const b = s.journey.branch;
    if (s.journey.resolvedBranches.includes(b.id) && a.choice !== "leave")
      return s;
    const journey = {
      ...s.journey,
      resolvedBranches:
        a.choice === "leave"
          ? s.journey.resolvedBranches
          : [...new Set([...s.journey.resolvedBranches, b.id])],
    };
    const target = backRoom(s);
    const next: Game = {
      ...s,
      journey: { ...journey, branch: null },
      phase: "exploration",
    };
    if (a.choice === "leave")
      return say(
        target ? enterMappedRoom(s, target) : next,
        "You retrace the connected passage.",
      );
    if (b.kind === "cache" && ["careful", "risk"].includes(a.choice)) {
      const safe = a.choice === "careful" || a.roll >= 0.4;
      const plannedItem = directedEncounter(s)?.rewardItem;
      const treasures = ITEMS.filter(
        (i) =>
          ["weapon", "armor", "helmet", "boots", "charm"].includes(i.kind) &&
          !i.faction &&
          gearFloor(i) <= s.floor &&
          i.price > 0 &&
          i.price <= 180 + s.floor * 45,
      );
      const roomSeed = [...s.journey.room].reduce(
        (n, c) => n + c.charCodeAt(0),
        s.journey.seed + s.expedition.number,
      );
      const treasure =
        plannedItem ||
        treasures[roomSeed % treasures.length]?.id ||
        "relic-fragment";
      const materials =
        s.route === "roots"
          ? ["night-herb"]
          : s.route === "frost"
            ? ["frost-shard"]
            : s.route === "forge"
              ? ["ancient-ore"]
              : ["relic-fragment", "ancient-ore", "night-herb"];
      const material = materials[(roomSeed >>> 2) % materials.length];
      const draw = rollTreasureGold(s.rng.loot);
      const gold = draw.gold;
      return say(
        {
          ...next,
          rng: { ...next.rng, loot: draw.seed },
          gold: s.gold + gold,
          inventory: {
            ...s.inventory,
            ...(safe
              ? {
                  [treasure]: (s.inventory[treasure] || 0) + 1,
                  [material]:
                    (s.inventory[material] || 0) +
                    (treasure === material ? 3 : 2),
                }
              : {}),
          },
          party: safe
            ? s.party
            : s.party.map((c) =>
                c.hp <= 0
                  ? c
                  : {
                      ...c,
                      hp: Math.max(1, c.hp - (s.route === "forge" ? 22 : 15)),
                      mp: s.route === "crypt" ? Math.max(0, c.mp - 12) : c.mp,
                      ailments: {
                        ...c.ailments,
                        poison: s.route === "roots" ? 2 : c.ailments.poison,
                        paralysis:
                          s.route === "frost" ? 1 : c.ailments.paralysis,
                      },
                    },
              ),
        },
        safe
          ? `You recover ${ITEMS.find((i) => i.id === treasure)?.name || treasure} and ${gold} coins from the chest.`
          : `The trapped lock snaps. The party is hurt, but you recover ${gold} coins.`,
      );
    }
    if (
      b.kind === "company" &&
      npcAt(s) === "sable" &&
      ["cooperate", "claim"].includes(a.choice)
    ) {
      const old = s.npcs?.sable,
        cooperate = a.choice === "cooperate";
      if (cooperate && (old?.trust || 0) < 2)
        return say(
          s,
          "Sable needs an earlier act of trust before sharing a cache.",
        );
      const message = cooperate
        ? "Sable's crew shares a ration and a maintenance key. Both parties sign the survey; your rivals will remember who stood beside them."
        : "You take the disputed salvage for 80 gold. Sable folds the shared chart away and records your claim against the crew.";
      return say(
        {
          ...next,
          gold: s.gold + (cooperate ? 0 : 80),
          food: s.food + (cooperate ? 1 : 0),
          inventory: cooperate
            ? {
                ...s.inventory,
                "labyrinth-key": (s.inventory["labyrinth-key"] || 0) + 1,
              }
            : s.inventory,
          npcs: {
            ...s.npcs,
            sable: {
              visits: (old?.visits || 0) + 1,
              helped: (old?.helped || 0) + (cooperate ? 1 : 0),
              lastExpedition: s.expedition.number,
              trust: (old?.trust || 0) + (cooperate ? 2 : -3),
              decisions: [...(old?.decisions || []), a.choice].slice(-12),
            },
          },
          journey: { ...chartRumour(next, s.floor), met: s.journey.met + 1 },
        },
        message,
      );
    }
    if (b.kind === "company" && ["talk", "help"].includes(a.choice)) {
      if (a.choice === "help" && s.food < 1)
        return say(s, "You need a ration to share with this team.");
      const floor = Math.min(12, s.floor + 1);
      const named = npcAt(s);
      return say(
        {
          ...next,
          npcs: named
            ? {
                ...s.npcs,
                [named]: {
                  visits: (s.npcs?.[named]?.visits || 0) + 1,
                  helped:
                    (s.npcs?.[named]?.helped || 0) +
                    (a.choice === "help" ? 1 : 0),
                  lastExpedition: s.expedition.number,
                  trust:
                    (s.npcs?.[named]?.trust || 0) +
                    (a.choice === "help" ? 2 : 1),
                  decisions: [
                    ...(s.npcs?.[named]?.decisions || []),
                    a.choice,
                  ].slice(-12),
                },
              }
            : s.npcs,
          food: s.food - (a.choice === "help" ? 1 : 0),
          knownFloors: [...new Set([...s.knownFloors, floor])],
          journey: { ...chartRumour(next, s.floor), met: s.journey.met + 1 },
          faction: {
            ...s.faction,
            stag: s.faction.stag + (a.choice === "help" ? 1 : 0),
          },
        },
        `${named ? WORLD_NPCS[named].name : "A tired survey team"} trades two real route marks and news of ${FLOORS[floor - 1].name}.${a.choice === "help" ? " Your ration may get them through the night." : " They promise to remember your faces."}`,
      );
    }
    if (b.kind === "company" && a.choice === "trade" && npcAt(s) === "tamsin") {
      if (s.gold < BALANCE.rationPackGold)
        return say(
          s,
          `Tamsin asks ${BALANCE.rationPackGold} gold for a month’s ration pack.`,
        );
      const old = s.npcs?.tamsin;
      const quantity =
        BALANCE.rationPackSize + ((old?.trust || 0) >= 3 ? 1 : 0);
      return say(
        {
          ...next,
          gold: s.gold - BALANCE.rationPackGold,
          food: s.food + quantity,
          npcs: {
            ...s.npcs,
            tamsin: {
              visits: (old?.visits || 0) + 1,
              helped: old?.helped || 0,
              lastExpedition: s.expedition.number,
              trust: (old?.trust || 0) + 1,
              decisions: [...(old?.decisions || []), "trade"].slice(-12),
            },
          },
        },
        `Tamsin sells you ${quantity} party rations for ${BALANCE.rationPackGold} gold${quantity > BALANCE.rationPackSize ? ", including an extra ration for a trusted customer" : ""}.`,
      );
    }
    if (b.kind === "spring" && ["gather", "drink"].includes(a.choice)) {
      const safe =
        a.choice === "gather" ||
        s.party.some((c) => c.hp > 0 && c.race === "elf") ||
        a.roll >= 0.35;
      return say(
        {
          ...next,
          food: s.food + (a.choice === "gather" ? 2 : 0),
          party:
            a.choice === "drink"
              ? s.party.map((c) =>
                  c.hp > 0
                    ? {
                        ...c,
                        hp: Math.min(c.maxHp, c.hp + (safe ? 30 : 0)),
                        ailments: safe
                          ? c.ailments
                          : { ...c.ailments, poison: 2 },
                      }
                    : c,
                )
              : s.party,
        },
        a.choice === "gather"
          ? "You gather two rations of edible cave roots. The next shelter will be easier to reach."
          : safe
            ? "The spring is clean. Every standing companion recovers 30 HP."
            : "The spring burns your throat. The standing party is poisoned.",
      );
    }
    if (b.kind === "beast" && a.choice === "fight") {
      const enemy = enemyFor(s.floor, s.party.length);
      const hp = Math.round(enemy.maxHp * 0.65);
      return say(
        {
          ...s,
          phase: "combat",
          enemy: {
            ...enemy,
            species:
              s.expedition.director || (s.floor >= 5 && s.floor <= 7 && s.route)
                ? enemy.species
                : "bonegnaw",
            name:
              s.expedition.director || (s.floor >= 5 && s.floor <= 7 && s.route)
                ? enemy.name
                : "Bonegnaw Scavenger",
            boss: false,
            sprite:
              s.expedition.director || (s.floor >= 5 && s.floor <= 7 && s.route)
                ? enemy.sprite
                : 20,
            hp,
            maxHp: hp,
          },
          turn: 1,
          momentum: 0,
          party: s.party.map((c) => ({ ...c, battleMastery: {} })),
          journey: { ...journey, branchFight: true },
        },
        "You draw the creature away from the crossing. Your marked route will wait.",
      );
    }
    return s;
  }
  if (a.type === "REST_HERE" && canRestHere(s)) {
    if (s.journey.startDay === null || !s.party.some((c) => c.hp > 0)) return s;
    const rested = spendWatches(s, BALANCE.watchesPerDay, { rest: true });
    if (["defeat", "extraction"].includes(rested.phase)) return rested;
    const draw = nextRandom(rested.rng.encounters);
    const next = { ...rested, rng: { ...rested.rng, encounters: draw.seed } };
    if (next.phase === "nag" && next.journey.nag) {
      next.phase = next.journey.nag.resume;
      next.journey = { ...next.journey, nag: null };
    }
    if (draw.roll < restHereRisk(s.floor))
      return say(
        {
          ...next,
          phase: "combat",
          sideBattle: false,
          fieldRest: rememberRestLocation(s),
          combat: null,
          lootReceipt: null,
          discoveryReceipt: null,
          arrivalChoice: "",
          arrivalOutcome: "",
          arrivalEffect: "",
          arrivalScouted: false,
          enemy: enemyFor(s.floor, s.party.length),
          journey: {
            ...next.journey,
            defender: false,
            portal: false,
            branch: null,
            branchFight: true,
          },
        },
        `${rested.message} Footsteps break the quiet: an ambush!`,
      );
    return say(next, `${rested.message} No one finds you.`);
  }
  if (a.type === "WILD_CAMP" && ["exploration", "branch"].includes(s.phase)) {
    if (!(s.inventory["camp-kit"] > 0))
      return say(
        s,
        "A wild camp requires a camping kit. Sanctuaries need no kit.",
      );
    return {
      ...s,
      phase: "camp",
      inventory: { ...s.inventory, "camp-kit": s.inventory["camp-kit"] - 1 },
      journey: {
        ...s.journey,
        wildCamp: true,
        branch: null,
        defender: false,
        campReturn: "exploration",
      },
      message:
        "A supplied wild camp is ready. It can be interrupted while you rest.",
    };
  }
  if (a.type === "CAMP_REST" && ["camp", "defeat"].includes(s.phase)) {
    if (s.phase === "defeat") return spendWatches(s, 180 - s.journey.watches);
    let next = s;
    do {
      const unfed = next.food === 0;
      next = spendWatches(
        next,
        Math.min(BALANCE.watchesPerDay, 180 - next.journey.watches),
      );
      if (next.phase !== "camp") break;
      if (next.journey.wildCamp) {
        const draw = nextRandom(next.rng.encounters);
        next = { ...next, rng: { ...next.rng, encounters: draw.seed } };
        if (draw.roll < wildCampRisk(s.floor))
          return {
            ...next,
            phase: "combat",
            enemy: enemyFor(s.floor, s.party.length),
            journey: { ...next.journey, defender: false },
            message:
              "Your wild camp is interrupted. The accepted day's recovery has resolved; face the intruders.",
          };
      }
      if (unfed || !a.untilClose) break;
    } while (next.journey.watches < 180);
    return next;
  }
  if (a.type === "LEAVE_CAMP" && s.phase === "camp") {
    if (!s.party.some((c) => c.hp > 0))
      return say(
        s,
        "No one can continue. Keep watch until the labyrinth closes and teleports everyone to town.",
      );
    const phase: Phase = s.journey.campReturn;
    if (s.journey.wildCamp)
      return enterMappedRoom(
        { ...s, journey: { ...s.journey, wildCamp: false } },
        s.journey.room,
      );
    return say(
      {
        ...moveRoom(
          s,
          backRoom(s) ||
            Object.values(currentRoom(s).exits)[0] ||
            s.journey.room,
        ),
        phase,
      },
      "You shoulder your packs. The team chooses to carry on together.",
    );
  }
  return null;
}
