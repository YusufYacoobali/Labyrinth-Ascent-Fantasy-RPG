import type { Action, Enemy, Game, Phase } from "./engine";
import { FLOORS } from "./world";
import {
  generateFloor,
  reveal,
  PATH_TEMPLATES,
  type FloorMap,
} from "./floor-map";

export type Direction = "left" | "straight" | "right";
export type Mission = "survey" | "salvage" | "survivors";
export type BranchKind = "cache" | "company" | "spring" | "beast";
export interface Journey {
  startDay: number | null;
  watches: number;
  mission: Mission | null;
  step: number;
  portal: boolean;
  chart: Record<number, Direction[]>;
  resolvedBranches: string[];
  branch: { id: string; kind: BranchKind; direction: Direction } | null;
  campReturn:
    "victory" | "exploration" | "combat" | "arrival" | "event" | "branch";
  met: number;
  branchFight: boolean;
  seed: number;
  maps: Record<number, FloorMap>;
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
  room: "entrance",
  nagged: {},
  nag: null,
  reachedPortals: [],
  history: [],
  leaderId: "hero",
});
export const FLOOR_PATHS = PATH_TEMPLATES;
export const floorMap = (s: Game) =>
  s.journey.maps[s.floor] || generateFloor(s.floor, s.journey.seed);
export const currentRoom = (s: Game) =>
  floorMap(s).nodes[s.journey.room] || floorMap(s).nodes.entrance;
export function backRoom(s: Game) {
  const previous = s.journey.history?.at(-1);
  return previous && Object.values(currentRoom(s).exits).includes(previous)
    ? previous
    : currentRoom(s).exits.back;
}
export function moveRoom(s: Game, id: string): Game {
  const map = floorMap(s);
  if (!map.nodes[id]) return s;
  const room = map.nodes[id];
  const history = s.journey.history || [];
  const previous = s.journey.room;
  const nextHistory =
    id === previous
      ? history
      : history.at(-1) === id
        ? history.slice(0, -1)
        : Object.values(map.nodes[previous]?.exits || {}).includes(id)
          ? [...history, previous]
          : [];
  const chart = s.journey.chart[s.floor] || [];
  return {
    ...s,
    journey: {
      ...s.journey,
      room: id,
      history: nextHistory,
      step: room.depth,
      maps: { ...s.journey.maps, [s.floor]: reveal(map, id) },
      portal: s.journey.portal || room.kind === "portal",
      reachedPortals:
        room.kind === "portal"
          ? [...new Set([...(s.journey.reachedPortals || []), s.floor])]
          : s.journey.reachedPortals,
      chart: {
        ...s.journey.chart,
        [s.floor]:
          chart.length >= room.depth ? chart : map.route.slice(0, room.depth),
      },
    },
  };
}
export function enterMappedRoom(
  s: Game,
  id: string,
  direction: Direction = "straight",
): Game {
  const next = moveRoom(s, id);
  const room = currentRoom(next);
  if (room.kind === "camp") return { ...next, phase: "camp" };
  if (room.kind === "portal")
    return say(
      { ...next, phase: "victory" },
      s.floor === 12
        ? "You reach the summit arch. When the thirty-day watch ends, its light will guide you home."
        : "Blue light floods the arch. You found the upward portal. Only now can your team ascend.",
    );
  if (
    room.kind === "crossroads" ||
    room.id === "aftermath" ||
    room.id === "entrance"
  )
    return {
      ...next,
      phase: "exploration",
      message: "",
      journey: { ...next.journey, branch: null },
    };
  const kind: BranchKind =
    room.kind === "treasure" || room.kind === "trap"
      ? "cache"
      : room.kind === "npc" || room.kind === "dead-end"
        ? "company"
        : room.kind === "spring"
          ? "spring"
          : "beast";
  return {
    ...next,
    phase: "branch",
    journey: { ...next.journey, branch: { id, kind, direction } },
  };
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
export function chartRumour(s: Game, floor: number): Journey {
  const map = s.journey.maps[floor] || generateFloor(floor, s.journey.seed);
  return {
    ...s.journey,
    maps: {
      ...s.journey.maps,
      [floor]: {
        ...map,
        known: [
          ...new Set([
            ...map.known,
            "aftermath",
            "cross-0",
            "cross-1",
            "cross-2",
          ]),
        ],
      },
    },
    chart: {
      ...s.journey.chart,
      [floor]:
        (s.journey.chart[floor]?.length || 0) >= 2
          ? s.journey.chart[floor]
          : map.route.slice(0, 2),
    },
  };
}
export function spendWatches(s: Game, watches: number): Game {
  if (s.journey.startDay === null) return s;
  const elapsed = Math.min(180, s.journey.watches + watches);
  const closed = elapsed >= 180;
  return {
    ...s,
    day: s.journey.startDay + Math.floor(elapsed / 6),
    journey: { ...s.journey, watches: elapsed },
    phase: closed ? "extraction" : s.phase,
    message: closed
      ? "Thirty days have passed. The return gate shines again. Your watch is over."
      : s.message,
  };
}
const say = (s: Game, message: string): Game => ({
  ...s,
  message,
  journal: [message, ...s.journal].slice(0, 60),
});

export function roomStory(s: Game) {
  const room = currentRoom(s);
  if (room.id === "entrance" || room.id === "aftermath")
    return {
      title: "The cleared chamber",
      body: "You recognise your own boot marks beside the guttering lantern. The guardian is gone. Your chalk trail leads straight into the passages; the town gate behind you is still sealed.",
    };
  const direction = floorMap(s).route[s.journey.step] || "straight";
  const clues = [
    `Cold air slips through the ${direction} passage. Behind you, the last torch gutters. Something moves in one of the other tunnels.`,
    `A surveyor’s scratched arrow points ${direction}. A broken pack lies beside a darker opening. Do you trust the mark or search for its owner?`,
    `The faint blue pulse returns from ${direction}. You hear water elsewhere. Your companions stop to check their wounds.`,
    `Footprints lead ${direction}; a loose coin glints down another corridor. The route and the reward may not be the same path.`,
    `Your lantern flame bends ${direction}. Quiet voices carry from a side passage. They could be survivors—or people waiting for survivors.`,
    `A pale glow gathers ${direction}. The stone is warm beneath your hand. Somewhere ahead, a portal is breathing.`,
  ];
  return {
    title:
      [
        "The first crossing",
        "A stranger’s mark",
        "Blue echoes",
        "Tracks in the dust",
        "Voices beyond stone",
        "The last bend",
      ][s.journey.step] || "The portal",
    body: `${FLOORS[s.floor - 1].name}. ${clues[s.journey.step] || "The upward portal stands open."}`,
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
    if (s.journey.room === "entrance" || s.journey.room === "aftermath")
      return enterMappedRoom(moveRoom(s, "aftermath"), "cross-0");
    return { ...s, phase: "exploration" };
  }
  if (
    a.type === "AT_PORTAL" &&
    s.phase === "exploration" &&
    currentRoom(s).kind === "portal"
  )
    return { ...s, phase: "victory" };
  if (
    (a.type === "MOVE" || a.type === "MOVE_BACK") &&
    ["exploration", "branch"].includes(s.phase)
  ) {
    const direction = a.type === "MOVE_BACK" ? "back" : a.direction;
    const target =
      direction === "back" ? backRoom(s) : currentRoom(s).exits[direction];
    if (!target) return say(s, "There is no passage in that direction.");
    return enterMappedRoom(
      s,
      target,
      direction === "back" ? "straight" : direction,
    );
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
    const next: Game = target
      ? enterMappedRoom({ ...s, journey }, target)
      : { ...s, phase: "exploration", journey };
    if (a.choice === "leave")
      return say(
        next,
        "You return to the last crossing. The route you marked is still there.",
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
                c.hp > 0 ? { ...c, hp: Math.max(1, c.hp - 15) } : c,
              ),
        },
        safe
          ? `Under the loose stone: ${gold} gold and a relic fragment. You share the find under your agreed contracts.`
          : "The catch snaps. Your standing companions lose 15 HP, but you recover 30 gold.",
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
            name: "Bonegnaw Scavenger",
            boss: false,
            sprite: 20,
            hp,
            maxHp: hp,
          },
          turn: 1,
          momentum: 0,
          journey: { ...journey, branchFight: true },
        },
        "You draw the creature away from the crossing. Your marked route will wait.",
      );
    }
    return s;
  }
  if (
    a.type === "SEEK_SHELTER" &&
    [
      "victory",
      "exploration",
      "defeat",
      "arrival",
      "combat",
      "event",
      "branch",
    ].includes(s.phase)
  ) {
    const fleeing = s.phase === "combat";
    const target = currentRoom(s).exits.shelter;
    if (!target)
      return say(s, "Backtrack to a crossing to find a defensible shelter.");
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
  if (a.type === "CAMP_REST" && ["camp", "defeat"].includes(s.phase)) {
    const watches = a.untilClose
      ? 180 - s.journey.watches
      : Math.min(6, 180 - s.journey.watches);
    const days = Math.ceil(watches / 6);
    const fed = Math.min(days, s.food);
    const recovery = fed * 0.25 + (days - fed) * 0.08;
    const rested = say(
      {
        ...s,
        food: s.food - fed,
        party: s.party.map((c) =>
          c.hp > 0
            ? {
                ...c,
                hp: Math.min(c.maxHp, c.hp + Math.round(c.maxHp * recovery)),
                mp: Math.min(c.maxMp, c.mp + Math.round(c.maxMp * recovery)),
                ailments: { poison: 0, paralysis: 0 },
                cooldowns: {},
                exhaustion: Math.max(
                  0,
                  (c.exhaustion || 0) - fed * 35 - (days - fed) * 18,
                ),
              }
            : c,
        ),
      },
      `${days} ${days === 1 ? "day passes" : "days pass"} in shelter. ${fed} ${fed === 1 ? "ration" : "rations"} used. ${fed < days ? "You forage while the lantern watch keeps the corridor quiet." : "Your team sleeps in shifts and tends the lantern."}${s.party.some((c) => c.hp <= 0) ? " The fallen still cannot walk." : ""}`,
    );
    return spendWatches(rested, watches);
  }
  if (a.type === "LEAVE_CAMP" && s.phase === "camp") {
    if (!s.party.some((c) => c.hp > 0))
      return say(
        s,
        "No one can continue. Keep watch until the return gate opens.",
      );
    const phase: Phase = s.journey.campReturn;
    return say(
      { ...moveRoom(s, backRoom(s) || "entrance"), phase },
      "You shoulder your packs. The team chooses to carry on together.",
    );
  }
  return null;
}
