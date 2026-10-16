import type { Game } from "./engine";
import { generateFloor, mapKey } from "./floor-map";

// Read-only room queries live below the story and exploration reducers.
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
