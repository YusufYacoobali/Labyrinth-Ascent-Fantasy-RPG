const { e, exploration: x, maps } = require("./engine-loader.cjs");
const portalArrival = (s) => ({
  ...s,
  journey: { ...s.journey, room: "portal", defender: true },
});
function toward(s, target = x.floorMap(s).portal) {
  const path = maps.shortestPath(x.floorMap(s), s.journey.room, target);
  const edge = x.exitsFor(s).find((edge) => edge.to === path[1]);
  if (!edge)
    throw Error("No connected path to " + target + " from " + s.journey.room);
  return { type: "MOVE", direction: edge.direction };
}
function travel(s, target) {
  s = { ...s, phase: "exploration", eventResolved: true };
  let limit = 100;
  while (s.journey.room !== target && limit--)
    s = e.reducer(s, toward(s, target));
  if (!limit) throw Error("Travel stalled");
  return s;
}
module.exports = { portalArrival, toward, travel };
