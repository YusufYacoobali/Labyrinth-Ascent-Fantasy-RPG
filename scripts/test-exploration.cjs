const assert = require("node:assert/strict");
const { e, exploration: x } = require("./engine-loader.cjs");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const act = e.reducer;
const enter = (mission = "survey") =>
  act(
    act(
      act(e.initialGame(), {
        type: "CREATE",
        race: "human",
        name: "Rowan",
        roll: 0.5,
      }),
      { type: "PREPARE_CYCLE", mode: "rest" },
    ),
    { type: "ENTER" },
  );
const journey = (mission = "survey") =>
  act(enter(), { type: "MISSION", id: mission });
const cleared = (floor = 1, mission = "survey") => ({
  ...journey(mission),
  phase: "victory",
  floor,
  eventResolved: true,
  enemy: null,
});
const search = (floor = 1) => act(cleared(floor), { type: "SEARCH_PORTAL" });
function walk(s) {
  for (const direction of x.floorMap(s).route)
    s = act(s, { type: "MOVE", direction });
  return s;
}
function branch(kind) {
  let s = search();
  const correct = x.floorMap(s).route;
  for (let step = 0; step < 6; step++) {
    for (const direction of ["left", "straight", "right"]) {
      if (direction === correct[step]) continue;
      const found = act(s, { type: "MOVE", direction });
      if (found.journey.branch.kind === kind) return found;
    }
    s = act(s, { type: "MOVE", direction: correct[step] });
  }
  throw Error("Branch missing: " + kind);
}
test("Entry seals the gate and asks for a mission before arrival", () => {
  const s = enter();
  assert.equal(s.phase, "mission");
  assert.equal(s.journey.startDay, 30);
  assert.equal(e.daysRemaining(s), 30);
  assert.equal(act(s, { type: "ENGAGE" }).phase, "mission");
  const chosen = act(s, { type: "MISSION", id: "salvage" });
  assert.equal(chosen.phase, "arrival");
  assert.equal(chosen.journey.mission, "salvage");
  assert.equal(
    act(chosen, { type: "MISSION", id: "survivors" }).journey.mission,
    "salvage",
  );
});
test("Every floor has a fixed six-turn route and ascent is blocked until its portal is found", () => {
  assert.equal(x.FLOOR_PATHS.length, 12);
  for (let floor = 1; floor < 12; floor++) {
    const s = cleared(floor);
    assert.equal(act(s, { type: "CONTINUE" }).floor, floor);
    assert.equal(x.FLOOR_PATHS[floor - 1].length, 6);
    const found = walk(act(s, { type: "SEARCH_PORTAL" }));
    assert.equal(found.phase, "victory");
    assert.equal(found.journey.portal, true);
    assert.equal(found.journey.step, 6);
    assert.equal(found.journey.chart[floor].length, 6);
    const next = act(found, { type: "CONTINUE" });
    assert.equal(next.floor, floor + 1);
    assert.equal(next.journey.portal, false);
    assert.equal(next.journey.step, 0);
    assert.equal(next.phase, "arrival");
  }
});
test("Charts survive reload and every expedition retraverses the same route", () => {
  let s = walk(search());
  const route = JSON.stringify(s.journey.chart[1]);
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(JSON.stringify(s.journey.chart[1]), route);
  s = act(s, { type: "SEEK_SHELTER" });
  s = act(s, { type: "CAMP_REST", untilClose: true });
  s = act(s, { type: "RETURN" });
  s = act(s, { type: "BUY_ITEM", id: "rations" });
  s = act(s, { type: "PREPARE_CYCLE", mode: "rest" });
  s = act(s, { type: "ENTER" });
  assert.equal(s.journey.step, 0);
  assert.equal(s.journey.portal, false);
  assert.equal(JSON.stringify(s.journey.chart[1]), route);
});
test("Six travel watches advance a day; returning early is blocked in every phase", () => {
  const s = journey();
  for (const phase of [
    "mission",
    "arrival",
    "combat",
    "event",
    "victory",
    "exploration",
    "branch",
    "camp",
    "defeat",
  ]) {
    const denied = act({ ...s, phase }, { type: "RETURN" });
    assert.equal(denied.phase, phase);
    assert.equal(denied.day, 30);
  }
  const walked = walk(search());
  assert.equal(walked.day, 31);
  assert.equal(walked.journey.watches, 6);
  assert.equal(e.daysRemaining(walked), 29);
});
test("Hidden caches pay once; returning to a searched branch cannot farm gold", () => {
  let s = branch("cache");
  const id = s.journey.branch.id;
  const gold = s.gold;
  const crossing = s.journey.step;
  const direction = s.journey.branch.direction;
  s = act(s, { type: "BRANCH_CHOICE", choice: "careful", roll: 0 });
  assert.equal(s.phase, "exploration");
  assert.equal(s.journey.step, crossing);
  assert.ok(s.gold > gold && s.journey.resolvedBranches.includes(id));
  s = act(s, { type: "MOVE", direction });
  const repeated = act(s, {
    type: "BRANCH_CHOICE",
    choice: "careful",
    roll: 1,
  });
  assert.equal(repeated.gold, s.gold);
  assert.equal(repeated.journey.room, s.journey.room);
  assert.equal(
    act(s, { type: "BRANCH_CHOICE", choice: "leave", roll: 1 }).phase,
    "exploration",
  );
});
test("Other teams share actual lore, route marks and mission progress", () => {
  let s = branch("company");
  const before = s.food;
  s = act(s, { type: "BRANCH_CHOICE", choice: "help", roll: 1 });
  assert.equal(s.food, before - 1);
  assert.equal(s.journey.met, 1);
  assert.ok(s.knownFloors.includes(2));
  assert.ok(s.journey.chart[1].length >= 2);
  assert.equal(s.faction.stag, 1);
});
test("Cave roots refill real rations, while unsafe springs can poison standing allies", () => {
  const s = branch("spring");
  const gathered = act(s, { type: "BRANCH_CHOICE", choice: "gather", roll: 1 });
  assert.equal(gathered.food, s.food + 2);
  const unsafe = act(s, { type: "BRANCH_CHOICE", choice: "drink", roll: 0 });
  assert.equal(unsafe.party[0].ailments.poison, 2);
});
test("Optional corridor fights return to exploration and preserve route position", () => {
  let s = branch("beast");
  const position = s.journey.step;
  s = act(s, { type: "BRANCH_CHOICE", choice: "fight", roll: 1 });
  assert.equal(s.phase, "combat");
  assert.equal(s.journey.branchFight, true);
  s = { ...s, enemy: { ...s.enemy, hp: 1 } };
  s = act(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.phase, "exploration");
  assert.equal(s.journey.step, position);
  assert.equal(s.journey.branchFight, false);
});
test("Shelter can count down without food, never revives allies and returns only after day thirty", () => {
  let s = {
    ...cleared(),
    food: 0,
    party: [
      { ...cleared().party[0], hp: 1 },
      { ...e.makeCharacter("elf", "fallen", "Fallen"), hp: 0 },
    ],
  };
  s = act(s, { type: "SEEK_SHELTER" });
  s = act(s, { type: "CAMP_REST" });
  assert.equal(e.daysRemaining(s), 29);
  assert.ok(s.party[0].hp > 1);
  assert.equal(s.party[1].hp, 0);
  assert.equal(s.food, 0);
  assert.equal(act(s, { type: "LEAVE_CAMP" }).phase, "victory");
  s = act(s, { type: "CAMP_REST", untilClose: true });
  assert.equal(s.phase, "extraction");
  assert.equal(s.day, 60);
  assert.equal(e.daysRemaining(s), 0);
  const returned = act(s, { type: "RETURN" });
  assert.equal(returned.phase, "town");
  assert.equal(returned.day, 61);
  assert.equal(returned.party[1].hp, 0);
  assert.equal(act(returned, { type: "RETURN" }), returned);
});
test("Mission rewards require completion and pay once on return", () => {
  let s = walk(search());
  assert.equal(x.missionProgress(s), 6);
  s = act(act(s, { type: "SEEK_SHELTER" }), {
    type: "CAMP_REST",
    untilClose: true,
  });
  const gold = s.gold;
  s = act(s, { type: "RETURN" });
  assert.equal(s.gold, gold + 150);
  assert.equal(act(s, { type: "RETURN" }).gold, s.gold);
  let incomplete = cleared();
  incomplete = act(act(incomplete, { type: "SEEK_SHELTER" }), {
    type: "CAMP_REST",
    untilClose: true,
  });
  assert.equal(act(incomplete, { type: "RETURN" }).gold, incomplete.gold);
});
test("The final watch opens extraction and legacy expedition saves gain a usable month clock", () => {
  let s = { ...search(), journey: { ...search().journey, watches: 179 } };
  s = act(s, { type: "MOVE", direction: "left" });
  assert.equal(s.phase, "extraction");
  assert.equal(s.journey.watches, 180);
  const raw = JSON.parse(JSON.stringify(journey()));
  delete raw.journey;
  const loaded = e.normalizeSave(raw);
  assert.equal(loaded.phase, "arrival");
  assert.equal(loaded.journey.startDay, 30);
  assert.equal(e.daysRemaining(loaded), 30);
});
test("Leaving shelter resumes the exact arrival or active fight, never bypasses a guardian", () => {
  let s = journey();
  s = act(s, { type: "SEEK_SHELTER" });
  s = act(s, { type: "CAMP_REST" });
  s = act(s, { type: "LEAVE_CAMP" });
  assert.equal(s.phase, "arrival");
  assert.equal(s.arrivalChoice, "");
  s = act(s, { type: "APPROACH", choice: "listen", roll: 0.5 });
  s = act(s, { type: "ENGAGE" });
  const enemy = s.enemy;
  const hp = s.party[0].hp;
  s = act(s, { type: "SEEK_SHELTER" });
  assert.equal(s.party[0].hp, hp - 9);
  s = act(s, { type: "CAMP_REST" });
  s = act(s, { type: "LEAVE_CAMP" });
  assert.equal(s.phase, "combat");
  assert.equal(s.enemy, enemy);
  assert.equal(s.journey.portal, false);
  assert.equal(act(s, { type: "CONTINUE" }).floor, 1);
});
console.log(count + " exploration checks passed.");
