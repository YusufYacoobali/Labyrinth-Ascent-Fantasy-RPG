import { factionSupplyBonus } from "./relationships";
import { narrateRoom } from "./room-narration";
import { assignGeneric } from "./generic-stories";
import { principalResolved, principalAftermath } from "./stories";
import { passTime } from "./survival";
import { BALANCE } from "./balance";
import { nextRandom } from "./monsters";
import type { Action, Enemy, Game, Phase } from "./engine";
import { FLOORS } from "./world";
import {
  generateFloor,
  reveal,
  mapKey,
  populateFloor,
  absoluteHeading,
  relativeDirection,
  HEADINGS,
  shortestPath,
  type Heading,
  type RelativeDirection,
  type RouteNote,
  type Occupant,
  type FloorMap,
} from "./floor-map";

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
export const currentMapKey = (s: Game) => mapKey(s.floor, s.route);
export const floorMap = (s: Game) =>
  s.journey.maps[currentMapKey(s)] ||
  generateFloor(
    s.floor,
    s.journey.seed,
    s.floor >= 5 && s.floor <= 7 ? s.route || "roots" : "",
  );
export const currentRoom = (s: Game) =>
  floorMap(s).nodes[s.journey.room] || floorMap(s).nodes.entrance;
export const encounterKey = (s: Game, id = s.journey.room) =>
  `${currentMapKey(s)}:${id}`;
export const roomOccupant = (s: Game, id = s.journey.room) =>
  s.journey.occupants[currentMapKey(s)]?.[id] || "quiet";
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
    journey: {
      ...s.journey,
      room: id,
      history: nextHistory,
      step: room.depth,
      facing: heading || s.journey.facing,
      maps: { ...s.journey.maps, [key]: reveal(map, id) },
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
  const next = moveRoom(s, id),
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
  return kind === "company"
    ? assignGeneric(encounter, encounterKey(next, id))
    : encounter;
}
export const MISSIONS = [
  {
    id: "survey" as Mission,
    title: "Chart a way upward",
    body: "Find the first floor’s portal. Bring a reliable route back to the guild.",
    target: 6,
    reward: 150,
  },
  {
    id: "salvage" as Mission,
    title: "Bring home supplies",
    body: "Recover 400 gold before shares. Search side passages; your team needs more than glory.",
    target: 400,
    reward: 200,
  },
  {
    id: "survivors" as Mission,
    title: "Find other survivors",
    body: "Meet two expedition teams in the side passages. Trade news and help them live through the month.",
    target: 2,
    reward: 180,
  },
];
export const daysRemaining = (s: Game) =>
  Math.max(0, 30 - Math.floor(s.journey.watches / 6));
export function missionProgress(s: Game) {
  return s.journey.mission === "survey"
    ? (s.journey.reachedPortals || []).includes(1)
      ? 6
      : s.floor === 1
        ? Math.min(5, s.journey.step)
        : 0
    : s.journey.mission === "salvage"
      ? s.runGross
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
      const gold = safe ? 60 + s.floor * 12 : 30;
      return say(
        {
          ...next,
          gold: s.gold + gold,
          inventory: {
            ...s.inventory,
            "relic-fragment":
              (s.inventory["relic-fragment"] || 0) + (safe ? 1 : 0),
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
          ? `Under the loose stone: ${gold} gold and a relic fragment. You share the find under your agreed contracts.`
          : `The catch snaps. Standing companions lose ${s.route === "forge" ? 22 : 15} HP${s.route === "roots" ? " and are poisoned" : s.route === "frost" ? " and are chilled" : s.route === "crypt" ? " and lose 12 MP" : ""}, but you recover 30 gold.`,
      );
    }
    if (b.kind === "company" && ["talk", "help"].includes(a.choice)) {
      if (a.choice === "help" && s.food < 1)
        return say(s, "You need a ration to share with this team.");
      const floor = Math.min(12, s.floor + 1);
      return say(
        {
          ...next,
          food: s.food - (a.choice === "help" ? 1 : 0),
          knownFloors: [...new Set([...s.knownFloors, floor])],
          journey: { ...chartRumour(next, s.floor), met: s.journey.met + 1 },
          faction: {
            ...s.faction,
            stag: s.faction.stag + (a.choice === "help" ? 1 : 0),
          },
        },
        `A tired survey team trades their first two route marks and news of ${FLOORS[floor - 1].name}.${a.choice === "help" ? " Your ration may get them through the night." : " They promise to remember your faces."}`,
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
              s.floor >= 5 && s.floor <= 7 && s.route
                ? enemy.species
                : "bonegnaw",
            name:
              s.floor >= 5 && s.floor <= 7 && s.route
                ? enemy.name
                : "Bonegnaw Scavenger",
            boss: false,
            sprite: s.floor >= 5 && s.floor <= 7 && s.route ? enemy.sprite : 20,
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
  if (
    a.type === "SEEK_SHELTER" &&
    ["victory", "exploration", "defeat", "arrival", "event", "branch"].includes(
      s.phase,
    )
  ) {
    const fleeing = s.phase === "combat";
    const target = Object.values(currentRoom(s).exits).find(
      (id) => floorMap(s).nodes[id].kind === "camp",
    );
    if (!target)
      return say(
        s,
        "The sanctuary is a real room. Follow connected passages to reach it; inspect your map for known routes.",
      );
    const sheltered = moveRoom(s, target);
    return say(
      {
        ...sheltered,
        phase: "camp",
        party: fleeing
          ? s.party.map((c) =>
              c.hp > 0 ? { ...c, hp: Math.max(1, c.hp - (8 + s.floor)) } : c,
            )
          : s.party,
        journey: {
          ...sheltered.journey,
          campReturn: fleeing
            ? "combat"
            : s.phase === "event"
              ? "event"
              : s.phase === "branch"
                ? "branch"
                : s.phase === "exploration"
                  ? "exploration"
                  : s.phase === "arrival"
                    ? "arrival"
                    : "victory",
        },
      },
      fleeing
        ? "You fall back to a defensible alcove. Standing allies lose HP covering the retreat. The enemy still guards the crossing."
        : "You find a sealed watch room. One companion tends the lantern while the others rest. The town gate remains shut.",
    );
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
  if (a.type === "FORAGE" && ["exploration", "branch"].includes(s.phase)) {
    const key = encounterKey(s),
      suitable =
        currentRoom(s).kind === "landmark" ||
        roomOccupant(s) === "spring" ||
        currentRoom(s).kind === "dead-end";
    if (!suitable || s.expedition.foraged.includes(key))
      return say(s, "No fresh foraging remains in this room.");
    const draw = nextRandom(s.rng.encounters),
      next = {
        ...s,
        rng: { ...s.rng, encounters: draw.seed },
        expedition: {
          ...s.expedition,
          foraged: [...s.expedition.foraged, key],
        },
      };
    if (draw.roll < 0.5)
      return spendWatches(
        say(
          { ...next, food: next.food + (draw.roll < 0.25 ? 1 : 2) },
          "You gather edible roots: " +
            (draw.roll < 0.25 ? 1 : 2) +
            " party rations.",
        ),
        1,
      );
    if (draw.roll < 0.75)
      return spendWatches(
        say(next, "You find nothing edible. This room has been searched."),
        1,
      );
    const danger = nextRandom(draw.seed),
      state = { ...next, rng: { ...next.rng, encounters: danger.seed } };
    return spendWatches(
      danger.roll < 0.5
        ? say(
            {
              ...state,
              party: state.party.map((c) =>
                c.hp > 0
                  ? { ...c, hp: Math.max(0, c.hp - Math.round(c.maxHp * 0.08)) }
                  : c,
              ),
            },
            "A hidden hazard costs each standing ally 8% maximum HP.",
          )
        : {
            ...state,
            phase: "combat",
            enemy: enemyFor(s.floor, s.party.length),
            journey: {
              ...state.journey,
              defender: false,
              branchFight: true,
              branch: null,
            },
            message: "Foraging disturbs a hungry creature.",
          },
      1,
    );
  }
  if (a.type === "CAMP_REST" && ["camp", "defeat"].includes(s.phase)) {
    if (s.phase === "defeat") return spendWatches(s, 180 - s.journey.watches);
    let next = s;
    do {
      const unfed = next.food === 0;
      next = spendWatches(
        next,
        Math.min(6 - (next.journey.watches % 6), 180 - next.journey.watches),
      );
      if (next.phase !== "camp" || unfed) break;
      if (next.journey.wildCamp) {
        const draw = nextRandom(next.rng.encounters);
        next = { ...next, rng: { ...next.rng, encounters: draw.seed } };
        if (
          draw.roll <
          BALANCE.wildCampRisk[s.floor <= 4 ? 0 : s.floor <= 8 ? 1 : 2]
        )
          return {
            ...next,
            phase: "combat",
            enemy: enemyFor(s.floor, s.party.length),
            journey: { ...next.journey, defender: false },
            message:
              "Your wild camp is interrupted. The accepted day's recovery has resolved; face the intruders.",
          };
      }
      if (!a.untilClose) break;
    } while (next.journey.watches < 180);
    return next;
  }
  if (a.type === "LEAVE_CAMP" && s.phase === "camp") {
    if (!s.party.some((c) => c.hp > 0))
      return say(
        s,
        "No one can continue. Keep watch until the return gate opens.",
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
