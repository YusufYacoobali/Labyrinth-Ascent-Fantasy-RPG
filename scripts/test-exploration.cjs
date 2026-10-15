const assert = require("node:assert/strict");
const { e, exploration: x, maps } = require("./engine-loader.cjs");
const { travel, toward } = require("./map-helpers.cjs");
let count = 0;
const act = require("./round-helpers.cjs").act;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
function start() {
  let s = act(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
  s = act({ ...s, day: 30 }, { type: "ENTER" });
  return s;
}
function explore() {
  return act(act(start(), { type: "MISSION", id: "survey" }), {
    type: "ENGAGE",
  });
}
function branch(kind) {
  let s = explore();
  const map = x.floorMap(s);
  // Isolate legacy encounter reward rules from the new weighted director.
  s = {
    ...s,
    expedition: { ...s.expedition, director: undefined },
    journey: {
      ...s.journey,
      occupants: {
        ...s.journey.occupants,
        [x.currentMapKey(s)]: maps.populateFloor(map, s.expedition.number),
      },
    },
  };
  const id = Object.entries(s.journey.occupants[x.currentMapKey(s)]).find(
    ([, k]) => k === kind,
  )?.[0];
  assert.ok(id, kind);
  s = travel(s, id);
  return x.enterMappedRoom(s, id);
}
test("Mission seals the month and peaceful arrival opens exploration before the portal fight", () => {
  let s = start();
  assert.equal(s.phase, "mission");
  assert.equal(s.journey.startDay, 30);
  s = act(s, { type: "MISSION", id: "survey" });
  assert.equal(s.phase, "arrival");
  s = act(s, { type: "ENGAGE" });
  assert.equal(s.phase, "exploration");
  assert.equal(s.kills, 0);
  assert.equal(s.journey.room, "entrance");
});
test("Substantial travel costs watches and cannot return through a closed gate", () => {
  let s = explore();
  for (let i = 0; i < 6; i++) {
    s = { ...s, phase: "exploration" };
    s = act(s, toward(s, i % 2 ? "entrance" : "loop-west"));
  }
  assert.equal(s.journey.watches, 6);
  assert.equal(e.daysRemaining(s), 29);
  assert.equal(act(s, { type: "RETURN" }).phase, s.phase);
});
test("Cache outcomes are recorded once in this expedition and survive reload", () => {
  let s = branch("cache"),
    gold = s.gold,
    key = s.journey.branch.id;
  s = act(s, { type: "BRANCH_CHOICE", choice: "careful", roll: 0.5 });
  assert.ok(s.gold > gold);
  assert.ok(s.journey.resolvedBranches.includes(key));
  assert.equal(s.phase, "exploration");
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  s = x.enterMappedRoom(s, s.journey.room);
  assert.equal(s.phase, "exploration");
  assert.equal(
    act(s, { type: "BRANCH_CHOICE", choice: "careful", roll: 0.5 }).gold,
    s.gold,
  );
});
test("Leaving an encounter preserves it and retraces the actual connection", () => {
  let s = branch("cache"),
    key = s.journey.branch.id,
    id = s.journey.room;
  const previous = x.backRoom(s);
  s = act(s, { type: "BRANCH_CHOICE", choice: "leave", roll: 0.5 });
  assert.equal(s.journey.room, previous);
  assert.ok(!s.journey.resolvedBranches.includes(key));
  s = travel(s, id);
  s = x.enterMappedRoom(s, id);
  assert.equal(s.phase, "branch");
});
test("Spring rewards and companion encounters are one-time monthly outcomes", () => {
  let s = branch("spring"),
    food = s.food;
  s = act(s, { type: "BRANCH_CHOICE", choice: "gather", roll: 0.5 });
  assert.equal(s.food, food + 2);
  assert.equal(s.expedition.unsecured.food, 2);
  s = branch("company");
  const before = s.food;
  s = act(s, { type: "BRANCH_CHOICE", choice: "help", roll: 0.5 });
  assert.equal(s.food, before - 1);
  assert.equal(s.journey.met, 1);
  const receipt = Object.values(s.expedition.generic).find(
    (record) => record.resolved,
  );
  assert.ok(receipt?.outcome);
  assert.equal(s.stories.genericHistory[receipt.id], s.expedition.number);
});
test("Survey requires visiting this expedition's portal even when geography was already known", () => {
  let s = travel(explore(), "portal");
  assert.equal(x.missionProgress(s), 6);
  s = travel(s, "sanctuary");
  s = act({ ...s, food: 40 }, { type: "CAMP_REST", untilClose: true });
  s = act(s, { type: "RETURN" });
  s = act({ ...s, day: 90, food: 20 }, { type: "ENTER" });
  s = act(s, { type: "MISSION", id: "survey" });
  assert.equal(x.missionProgress(s), 0);
  assert.ok(s.journey.maps[1].explored.includes("portal"));
});
test("A floor 4 route choice is discovered permanently and cannot be bypassed at ascent", () => {
  let s = {
    ...explore(),
    floor: 4,
    phase: "victory",
    journey: { ...explore().journey, room: "portal", portal: true },
  };
  assert.equal(act(s, { type: "CONTINUE" }).floor, 4);
  s = { ...s, phase: "event", journey: { ...s.journey, room: "aftermath" } };
  s = act(s, { type: "EVENT", choice: "frost", roll: 0.5 });
  assert.equal(s.route, "frost");
  assert.ok(s.discoveredRoutes.includes("frost"));
});
test("Final throne reward follows the Hollow King, then the summit remains explorable", () => {
  let s = {
    ...explore(),
    floor: 12,
    eventResolved: false,
    phase: "exploration",
  };
  s = x.enterMappedRoom(s, "aftermath");
  assert.equal(s.phase, "exploration");
  s = travel(s, "portal");
  s = {
    ...s,
    eventResolved: false,
    phase: "combat",
    enemy: { ...e.enemyFor(12), hp: 1 },
    party: s.party.map((c) => ({ ...c, atk: 999 })),
  };
  s = act(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.inventory["hollow-crown"], undefined);
  s = act(s, { type: "COLLECT" });
  assert.equal(s.phase, "event");
  s = act(s, { type: "EVENT", choice: "seal", roll: 0.5 });
  assert.equal(s.inventory["hollow-crown"], 1);
  assert.equal(s.phase, "victory");
  assert.equal(act(s, { type: "CONTINUE" }).floor, 12);
});
console.log(count + " expedition exploration checks passed.");
