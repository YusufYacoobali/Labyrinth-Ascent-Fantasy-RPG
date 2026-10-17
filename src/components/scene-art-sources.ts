import { STORY_ILLUSTRATION_SHEETS } from "./story-illustration-sheets";

/** Static requires keep every audited image available offline in native builds. */
export const SCENE_ART_SOURCES: Record<string, number> = {
  ...STORY_ILLUSTRATION_SHEETS,
  environmentsA: require("../../assets/story/battle-floors-1-4.png"),
  environmentsB: require("../../assets/story/battle-floors-5-8.png"),
  environmentsC: require("../../assets/story/battle-floors-9-12.png"),
  arrivalsA: require("../../assets/story/arrival-scenes-a.png"),
  arrivalsB: require("../../assets/story/arrival-scenes-b.png"),
  rooms: require("../../assets/story/room-scenes.png"),
  floodedRoad: require("../../assets/story/flooded-road.png"),
  "generic-a": require("../../assets/story/generic-a.png"),
  "generic-b": require("../../assets/story/generic-b.png"),
  "generic-c": require("../../assets/story/generic-c.png"),
  "generic-d": require("../../assets/story/generic-d.png"),
  "generic-a-alternate": require("../../assets/story/generic-a-alternate.png"),
  "generic-b-alternate": require("../../assets/story/generic-b-alternate.png"),
  "generic-c-alternate": require("../../assets/story/generic-c-alternate.png"),
  "generic-d-alternate": require("../../assets/story/generic-d-alternate.png"),
  encounters: require("../../assets/story/encounter-scenes-v2.png"),
  passages: require("../../assets/story/passage-scenes-v1.png"),
  approaches: require("../../assets/story/encounter-approaches.png"),
};
