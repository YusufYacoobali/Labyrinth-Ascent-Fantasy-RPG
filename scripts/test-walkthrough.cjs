const assert = require("node:assert/strict");
const { e, walkthrough: wt } = require("./engine-loader.cjs");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const create = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "barbarian",
    name: "Guide",
    roll: 0.5,
  });
const act = (s, a) => e.reducer(s, a);
function arena() {
  let s = create();
  s = act({ ...s, day: 30 }, { type: "ENTER" });
  s = act(s, { type: "MISSION", id: "survey" });
  s = { ...s, journey: { ...s.journey, defender: true, room: "portal" } };
  s = act(s, { type: "APPROACH", choice: "sneak", roll: 0.99 });
  s = act(s, { type: "ENGAGE" });
  return {
    ...s,
    enemy: { ...s.enemy, hp: 10000, maxHp: 10000, atk: 20, paralysis: 0 },
  };
}
test("New characters get real first-play guidance; legacy journeys do not", () => {
  const s = create();
  assert.equal(s.walkthrough.active, true);
  assert.equal(wt.walkthroughTip(s).id, "recruit");
  const old = { ...s };
  delete old.walkthrough;
  const migrated = e.normalizeSave(old);
  assert.equal(migrated.walkthrough.active, false);
  assert.equal(migrated.gold, s.gold);
  assert.equal(migrated.party[0].name, "Guide");
});
test("Recruiting and packing advance only when the real action succeeds", () => {
  let s = create();
  s = act(s, { type: "RECRUIT", id: "kael", offer: 0 });
  assert.equal(wt.walkthroughTip(s).id, "recruit");
  s = act(s, {
    type: "RECRUIT",
    id: "kael",
    offer: e.recruitShare(
      s,
      e.RECRUITS.find((r) => r.id === "kael"),
    ),
  });
  assert.equal(s.party.length, 2);
  assert.equal(wt.walkthroughTip(s).id, "supplies");
  const failed = act({ ...s, gold: 0 }, { type: "BUY", item: "food" });
  assert.equal(failed.walkthrough.done.includes("supplies"), false);
  s = act(s, { type: "BUY", item: "food" });
  assert.equal(s.food, 31);
  assert.equal(wt.walkthroughTip(s).id, "equipment");
  s = act(s, { type: "BUY_ITEM", id: "chipped-blade" });
  assert.equal(s.gold, 205);
  s = act(s, { type: "EQUIP", character: "hero", item: "chipped-blade" });
  s = act(s, { type: "WALKTHROUGH", kind: "ack", id: "equipment" });
  assert.equal(wt.walkthroughTip(s).id, "train");
  s = act(s, { type: "WALKTHROUGH", kind: "ack", id: "train" });
  assert.equal(wt.walkthroughTip(s).id, "gate");
});
test("Walkthrough skip, collapse and progress persist; replay preserves gameplay", () => {
  let s = act(create(), { type: "WALKTHROUGH", kind: "toggle" });
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(s.walkthrough.minimized, true);
  s = act(s, { type: "WALKTHROUGH", kind: "skip" });
  assert.equal(wt.walkthroughTip(s), null);
  const before = JSON.stringify(s.party);
  s = act(s, { type: "WALKTHROUGH", kind: "restart" });
  assert.equal(s.walkthrough.active, true);
  assert.equal(JSON.stringify(s.party), before);
  assert.equal(s.day, 24);
});
test("Mission and arrival guidance follow actual expedition phases", () => {
  let s = act({ ...create(), day: 30 }, { type: "ENTER" });
  assert.equal(wt.walkthroughTip(s).id, "mission");
  s = act(s, { type: "MISSION", id: "survey" });
  assert.equal(wt.walkthroughTip(s).id, "approach");
  assert.equal(s.food, 0);
});
test("Campaign advice explains one queued action and single-target supplies", () => {
  const s = arena();
  const tip = wt.walkthroughTip(s);
  assert.equal(tip.id, "round");
  assert.ok(tip.body.includes("one action"));
});
test("Overview, map and portal lessons finish without resetting the expedition", () => {
  let s = { ...arena(), phase: "exploration" };
  assert.equal(wt.walkthroughTip(s).id, "party");
  const rejected = act(s, { type: "WALKTHROUGH", kind: "ack", id: "complete" });
  assert.equal(rejected.walkthrough.active, true);
  s = act(s, { type: "WALKTHROUGH", kind: "ack", id: "party" });
  assert.equal(wt.walkthroughTip(s).id, "map");
  s = act(s, { type: "WALKTHROUGH", kind: "ack", id: "map" });
  assert.equal(wt.walkthroughTip(s), null);
  s = { ...s, journey: { ...s.journey, portal: true } };
  assert.equal(wt.walkthroughTip(s).id, "complete");
  s = act(s, { type: "WALKTHROUGH", kind: "ack", id: "complete" });
  assert.equal(s.walkthrough.active, false);
  assert.equal(s.journey.portal, true);
});
console.log(count + " first-play walkthrough checks passed.");
