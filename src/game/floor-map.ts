/** North-up persistent geography. Occupants belong to the current expedition. */
export type Heading = "north" | "east" | "south" | "west";
export type RelativeDirection = "left" | "straight" | "right" | "back";
export type Passage = Heading;
export type RoomKind =
  | "monster"
  | "story"
  | "crossroads"
  | "treasure"
  | "npc"
  | "spring"
  | "trap"
  | "portal"
  | "camp"
  | "dead-end"
  | "landmark";
export interface Room {
  id: string;
  kind: RoomKind;
  x: number;
  y: number;
  depth: number;
  exits: Partial<Record<Heading, string>>;
}
export interface FloorMap {
  version: 2;
  seed: number;
  floor: number;
  routeId: string;
  entrance: string;
  portal: string;
  sanctuary: string;
  route: Heading[];
  nodes: Record<string, Room>;
  explored: string[];
  known: string[];
}
export interface RouteNote {
  from: string;
  to: string;
  heading: Heading;
  approach: Heading;
  source: string;
  confidence: "observed" | "reported";
}
export type Occupant =
  "cache" | "company" | "spring" | "beast" | "hazard" | "quiet";
export const HEADINGS: Heading[] = ["north", "east", "south", "west"];
export const DELTA: Record<Heading, [number, number]> = {
  north: [0, -1],
  east: [1, 0],
  south: [0, 1],
  west: [-1, 0],
};
export const opposite = (h: Heading): Heading =>
  HEADINGS[(HEADINGS.indexOf(h) + 2) % 4];
export const absoluteHeading = (
  facing: Heading,
  direction: RelativeDirection,
): Heading =>
  HEADINGS[
    (HEADINGS.indexOf(facing) +
      { straight: 0, right: 1, back: 2, left: 3 }[direction]) %
      4
  ];
export const relativeDirection = (
  facing: Heading,
  heading: Heading,
): RelativeDirection =>
  (["straight", "right", "back", "left"] as const)[
    (HEADINGS.indexOf(heading) - HEADINGS.indexOf(facing) + 4) % 4
  ];
export const mapKey = (floor: number, route: string | null = null) =>
  floor >= 5 && floor <= 7 ? `${floor}:${route || "roots"}` : String(floor);
export function seedFor(text: string) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let v = Math.imul(n ^ (n >>> 15), n | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
export function shortestPath(
  map: FloorMap,
  from: string,
  to: string,
): string[] {
  const queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!,
      id = path[path.length - 1];
    if (id === to) return path;
    for (const next of Object.values(map.nodes[id]?.exits || {}))
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
  }
  return [];
}
export function generateFloor(floor: number, seed = 1, routeId = ""): FloorMap {
  const rng = random(seedFor(`${seed}:geography:${floor}:${routeId}`));
  const min = floor <= 4 ? 5 : floor <= 8 ? 7 : 9,
    distance = min + Math.floor(rng() * 4);
  const nodes: Record<string, Room> = {},
    coordinates = new Map<string, string>();
  const add = (id: string, kind: RoomKind, x: number, y: number) => {
    nodes[id] = { id, kind, x, y, depth: 0, exits: {} };
    coordinates.set(`${x},${y}`, id);
  };
  const link = (a: string, h: Heading, b: string) => {
    nodes[a].exits[h] = b;
    nodes[b].exits[opposite(h)] = a;
  };
  add("entrance", "landmark", 0, 0);
  let previous = "entrance",
    x = 0,
    y = 0;
  // A seed-grown spine guarantees the band distance without assigning relative labels to coordinates.
  for (let i = 1; i <= distance; i++) {
    const h: Heading = rng() < 0.5 ? "north" : "east";
    x += DELTA[h][0];
    y += DELTA[h][1];
    const id = i === distance ? "portal" : i === 1 ? "aftermath" : `room-${i}`;
    add(
      id,
      i === distance
        ? "portal"
        : i === 1
          ? "story"
          : i === Math.floor(distance / 2)
            ? "landmark"
            : "crossroads",
      x,
      y,
    );
    link(previous, h, id);
    previous = id;
  }
  // An equal-length loop beside the entrance and one permanent sanctuary.
  add("loop-west", "crossroads", -1, 0);
  add("loop-southwest", "crossroads", -1, 1);
  add("loop-south", "crossroads", 0, 1);
  link("entrance", "west", "loop-west");
  link("loop-west", "south", "loop-southwest");
  link("loop-southwest", "east", "loop-south");
  link("loop-south", "north", "entrance");
  add("sanctuary", "camp", -2, 0);
  link("loop-west", "west", "sanctuary");
  // Branches grow out of any free compass edge; optional connections create further loops.
  const anchors = Object.values(nodes).filter(
    (n) => n.id !== "portal" && n.kind !== "camp",
  );
  for (const anchor of anchors) {
    if (rng() < 0.22) continue;
    const headings = [...HEADINGS];
    for (let i = headings.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [headings[i], headings[j]] = [headings[j], headings[i]];
    }
    const heading = headings.find(
      (h) =>
        !anchor.exits[h] &&
        !coordinates.has(`${anchor.x + DELTA[h][0]},${anchor.y + DELTA[h][1]}`),
    );
    if (!heading) continue;
    let parent = anchor;
    const length = 1 + Math.floor(rng() * 3);
    for (let j = 0; j < length; j++) {
      const px = parent.x + DELTA[heading][0],
        py = parent.y + DELTA[heading][1];
      if (coordinates.has(`${px},${py}`)) break;
      const id = `branch-${anchor.id}-${j}`;
      add(id, j === length - 1 ? "dead-end" : "crossroads", px, py);
      link(parent.id, heading, id);
      parent = nodes[id];
    }
  }
  const map: FloorMap = {
    version: 2,
    seed,
    floor,
    routeId,
    entrance: "entrance",
    portal: "portal",
    sanctuary: "sanctuary",
    route: [],
    nodes,
    explored: ["entrance"],
    known: [],
  };
  // Only join neighbouring coordinates. Reject shortcuts outside the agreed distance band.
  for (const a of Object.values(nodes))
    for (const h of ["east", "south"] as Heading[]) {
      const id = coordinates.get(`${a.x + DELTA[h][0]},${a.y + DELTA[h][1]}`);
      if (
        !id ||
        a.exits[h] ||
        a.kind === "camp" ||
        nodes[id].kind === "camp" ||
        rng() > 0.4
      )
        continue;
      link(a.id, h, id);
      if (shortestPath(map, map.entrance, map.portal).length - 1 < min) {
        delete a.exits[h];
        delete nodes[id].exits[opposite(h)];
      }
    }
  for (const n of Object.values(nodes)) {
    n.depth = shortestPath(map, "entrance", n.id).length - 1;
    if (n.kind === "dead-end" && Object.keys(n.exits).length > 1)
      n.kind = "crossroads";
  }
  const path = shortestPath(map, "entrance", "portal");
  map.route = path
    .slice(1)
    .map((id, i) => HEADINGS.find((h) => nodes[path[i]].exits[h] === id)!);
  return map;
}
export function populateFloor(
  map: FloorMap,
  expedition: number,
): Record<string, Occupant> {
  const rng = random(
    seedFor(`${map.seed}:encounters:${map.floor}:${map.routeId}:${expedition}`),
  );
  const pool: Occupant[] = [
    "cache",
    "company",
    "spring",
    "beast",
    "hazard",
    "quiet",
  ];
  return Object.fromEntries(
    Object.values(map.nodes)
      .filter((n) => ["crossroads", "dead-end"].includes(n.kind))
      .map((n) => [n.id, pool[Math.floor(rng() * pool.length)]]),
  );
}
export const reveal = (map: FloorMap, id: string): FloorMap => ({
  ...map,
  explored: [...new Set([...map.explored, id])],
});
export function visibleRooms(map: FloorMap) {
  const named = new Set([...map.explored, ...map.known]);
  const visible = new Set(named);
  for (const id of named)
    for (const to of Object.values(map.nodes[id]?.exits || {})) visible.add(to);
  return { named, visible };
}

export function roomName(map: FloorMap, id: string) {
  const room = map.nodes[id];
  return id === map.entrance
    ? "Entry lantern"
    : room?.kind === "camp"
      ? "Sanctuary"
      : room?.kind === "portal"
        ? "Upward arch"
        : room?.kind === "story"
          ? "Marked chamber"
          : room?.kind === "landmark"
            ? "Carved waystone"
            : `Chamber ${Object.keys(map.nodes).indexOf(id) + 1}`;
}
