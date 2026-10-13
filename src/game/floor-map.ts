/** Persistent room graphs. See docs/FLOOR-MAPS.md for the rules in English. */
export type Passage = "left" | "straight" | "right" | "back" | "shelter";
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
  | "dead-end";
export interface Room {
  id: string;
  kind: RoomKind;
  x: number;
  y: number;
  depth: number;
  exits: Partial<Record<Passage, string>>;
}
export interface FloorMap {
  version: 1;
  seed: number;
  floor: number;
  entrance: string;
  portal: string;
  route: ("left" | "straight" | "right")[];
  nodes: Record<string, Room>;
  explored: string[];
  known: string[];
}
export const PATH_TEMPLATES = [
  ["left", "right", "straight", "right", "left", "straight"],
  ["right", "straight", "left", "straight", "right", "left"],
  ["straight", "left", "right", "right", "straight", "left"],
  ["left", "straight", "right", "left", "straight", "right"],
  ["right", "left", "left", "straight", "right", "straight"],
  ["straight", "right", "left", "right", "left", "straight"],
  ["left", "left", "straight", "right", "straight", "right"],
  ["right", "straight", "right", "left", "left", "straight"],
  ["straight", "left", "straight", "right", "right", "left"],
  ["left", "right", "left", "straight", "straight", "right"],
  ["right", "right", "straight", "left", "straight", "left"],
  ["straight", "right", "left", "straight", "left", "right"],
] as const;
export function seedFor(text: string) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let v = Math.imul(n ^ (n >>> 15), n | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
export function generateFloor(floor: number, seed = 1): FloorMap {
  const rng = random(seedFor(`${seed}:${floor}`));
  // Templates guarantee a six-turn route. The seed chooses a template and side-room content.
  const template =
    seed === 1 ? floor - 1 : Math.floor(rng() * PATH_TEMPLATES.length);
  const route = [...PATH_TEMPLATES[template]];
  const nodes: Record<string, Room> = {};
  const add = (
    id: string,
    kind: RoomKind,
    x: number,
    y: number,
    depth: number,
  ) => (nodes[id] = { id, kind, x, y, depth, exits: {} });
  const link = (
    from: string,
    passage: Passage,
    to: string,
    reverse: Passage = "back",
  ) => {
    nodes[from].exits[passage] = to;
    nodes[to].exits[reverse] = from;
  };
  add("entrance", "monster", 3, 0, 0);
  add("aftermath", "story", 3, 1, 0);
  link("entrance", "straight", "aftermath");
  for (let i = 0; i <= 6; i++)
    add(`cross-${i}`, i === 6 ? "portal" : "crossroads", 3, i + 2, i);
  link("aftermath", "straight", "cross-0");
  const firstKinds: RoomKind[] = [
    "treasure",
    "npc",
    "spring",
    "monster",
    "trap",
    "dead-end",
  ];
  for (let i = firstKinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [firstKinds[i], firstKinds[j]] = [firstKinds[j], firstKinds[i]];
  }
  for (let i = 0; i < 6; i++) {
    link(`cross-${i}`, route[i], `cross-${i + 1}`);
    const other = (["left", "straight", "right"] as const).filter(
      (d) => d !== route[i],
    );
    other.forEach((direction, j) => {
      const id = `side-${i}-${direction}`;
      const kinds: RoomKind[] = [
        "treasure",
        "npc",
        "spring",
        "monster",
        "trap",
        "dead-end",
      ];
      const kind =
        i * 2 + j < 6
          ? firstKinds[i * 2 + j]
          : kinds[Math.floor(rng() * kinds.length)];
      add(id, kind, j === 0 ? 1 : 5, i + 2, i);
      link(`cross-${i}`, direction, id);
      if (kind === "trap") {
        const inner = `${id}-inner`;
        add(inner, "treasure", j === 0 ? 0 : 6, i + 2.45, i);
        link(id, "straight", inner);
      }
    });
  }
  // A real loop: two side rooms at successive crossings connect both ways.
  const loopStep = Math.floor(rng() * 4) + 1;
  const a = Object.values(nodes).find(
    (n) => n.id.startsWith(`side-${loopStep}-`) && !n.id.endsWith("inner"),
  )!;
  const b = Object.values(nodes).find(
    (n) => n.id.startsWith(`side-${loopStep + 1}-`) && !n.id.endsWith("inner"),
  )!;
  if (a.kind === "dead-end") a.kind = "npc";
  if (b.kind === "dead-end") b.kind = "npc";
  link(a.id, "right", b.id, "left");
  // Each defensible room has an adjacent watch alcove, drawn as a separate map node.
  for (const room of [...Object.values(nodes)]) {
    const camp = `camp-${room.id}`;
    add(camp, "camp", room.x + 0.38, room.y + 0.35, room.depth);
    link(room.id, "shelter", camp);
  }
  return {
    version: 1,
    seed,
    floor,
    entrance: "entrance",
    portal: "cross-6",
    route,
    nodes,
    explored: ["entrance"],
    known: [],
  };
}
export function reveal(map: FloorMap, id: string): FloorMap {
  return { ...map, explored: [...new Set([...map.explored, id])] };
}
export function visibleRooms(map: FloorMap) {
  const named = new Set([...map.explored, ...map.known]);
  const visible = new Set(named);
  for (const id of named)
    for (const to of Object.values(map.nodes[id]?.exits || {})) visible.add(to);
  return { named, visible };
}
