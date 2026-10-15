import type { Game } from "./engine";
import { mapKey } from "./floor-map";
export function knownPath(s: Game, destination: string): string[] {
  const map = s.journey.maps[mapKey(s.floor, s.route)];
  if (!map || !map.explored.includes(destination)) return [];
  const visited = new Set(map.explored),
    queue = [[s.journey.room]],
    seen = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!,
      id = path[path.length - 1];
    if (id === destination) return path;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const to of Object.values(map.nodes[id]?.exits || {}))
      if (visited.has(to) && !seen.has(to)) queue.push([...path, to]);
  }
  return [];
}
