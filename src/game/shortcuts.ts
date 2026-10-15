import {
  DELTA,
  HEADINGS,
  opposite,
  random,
  seedFor,
  shortestPath,
  type FloorMap,
  type Heading,
} from "./floor-map";
import { BALANCE } from "./balance";
import type { Game } from "./engine";
export interface Shortcut {
  id: string;
  from: string;
  to: string;
  heading: Heading;
  requirement: "key" | "survey";
  open: boolean;
  discovered: boolean;
}
export function prepareShortcuts(map: FloorMap): FloorMap {
  if (map.shortcuts) return map;
  const rng = random(
    seedFor(`${map.seed}:shortcuts:${map.floor}:${map.routeId}`),
  );
  const candidates: Shortcut[] = [];
  for (const a of Object.values(map.nodes))
    for (const heading of ["east", "south"] as Heading[]) {
      if (a.kind === "camp" || a.kind === "portal" || a.exits[heading])
        continue;
      const b = Object.values(map.nodes).find(
        (b) =>
          b.x === a.x + DELTA[heading][0] &&
          b.y === a.y + DELTA[heading][1] &&
          b.kind !== "camp" &&
          b.kind !== "portal",
      );
      if (b)
        candidates.push({
          id: `hatch:${a.id}:${b.id}`,
          from: a.id,
          to: b.id,
          heading,
          requirement: rng() < 0.5 ? "key" : "survey",
          open: false,
          discovered: false,
        });
    }
  const choices = candidates
    .map((value) => ({ value, roll: rng() }))
    .sort((a, b) => a.roll - b.roll)
    .slice(0, 2)
    .map((x) => x.value);
  return { ...map, shortcuts: choices };
}
export function shortcutReason(s: Game, map: FloorMap, door: Shortcut) {
  if (door.open) return "This shortcut is already open.";
  if (![door.from, door.to].includes(s.journey.room))
    return "Reach one side of the latch first.";
  if (door.requirement === "key")
    return s.inventory["labyrinth-key"] > 0
      ? ""
      : "Requires one labyrinth key.";
  return map.explored.includes(door.from) &&
    map.explored.includes(door.to) &&
    map.explored.length >= BALANCE.shortcutSurveyRooms
    ? ""
    : "Survey both sides and at least eight chambers to understand the mechanism.";
}
export function openShortcut(map: FloorMap, id: string): FloorMap {
  const door = map.shortcuts?.find((d) => d.id === id);
  if (!door || door.open) return map;
  const nodes = {
    ...map.nodes,
    [door.from]: {
      ...map.nodes[door.from],
      exits: { ...map.nodes[door.from].exits, [door.heading]: door.to },
    },
    [door.to]: {
      ...map.nodes[door.to],
      exits: {
        ...map.nodes[door.to].exits,
        [opposite(door.heading)]: door.from,
      },
    },
  };
  const next = {
    ...map,
    nodes,
    shortcuts: map.shortcuts!.map((d) =>
      d.id === id ? { ...d, open: true, discovered: true } : d,
    ),
  };
  const path = shortestPath(next, map.entrance, map.portal);
  next.route = path
    .slice(1)
    .map((to, i) => HEADINGS.find((h) => nodes[path[i]].exits[h] === to)!);
  return next;
}
