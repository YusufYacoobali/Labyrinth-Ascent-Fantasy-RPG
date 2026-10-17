const assert = require("node:assert/strict");
const {
  e,
  exploration: x,
  shopStock: shop,
  w,
} = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const fresh = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Climber",
    seed: 42,
    roll: 1,
  });
test("Every newly entered floor unlocks a permanent shortcut and becomes the next expedition start", () => {
  let s = e.reducer(
    { ...fresh(), day: 30, food: 1000 },
    { type: "ENTER", mission: "survey" },
  );
  for (let floor = 2; floor <= 12; floor++) {
    const map = x.floorMap(s);
    s = {
      ...s,
      phase: "victory",
      route: s.floor >= 4 ? "frost" : null,
      discoveredRoutes: s.floor >= 4 ? ["frost"] : [],
      journey: { ...s.journey, room: map.portal, portal: true, watches: 0 },
    };
    s = e.reducer(s, { type: "CONTINUE" });
    assert.equal(s.floor, floor);
    assert.equal(s.startFloor, 1);
    assert.ok(s.checkpoints.includes(floor));
    assert.ok(!s.checkpoints.includes(floor + 1));
    const loaded = e.normalizeSave(JSON.parse(JSON.stringify(s)));
    let town = e.reducer(
      {
        ...loaded,
        phase: "extraction",
        journey: { ...loaded.journey, watches: 180 },
      },
      { type: "RETURN" },
    );
    assert.equal(town.phase, "town");
    assert.equal(town.startFloor, floor);
    town = e.reducer(
      { ...town, day: 90 },
      { type: "ENTER", mission: "salvage" },
    );
    assert.equal(town.floor, floor);
    assert.equal(town.journey.room, "entrance");
    if (floor >= 5 && floor <= 7) {
      assert.equal(town.route, "frost");
      assert.equal(x.floorMap(town).routeId, "frost");
      assert.equal(x.currentMapKey(town), `${floor}:frost`);
    }
  }
});
test("Unlocking a floor never resets an earned mission reward, including after reload", () => {
  let s = e.reducer(
    { ...fresh(), day: 30, food: 40 },
    { type: "ENTER", mission: "survey" },
  );
  s = {
    ...s,
    phase: "victory",
    journey: {
      ...s.journey,
      room: "portal",
      portal: true,
      reachedPortals: [1],
    },
  };
  assert.equal(x.missionProgress(s), 6);
  s = e.reducer(s, { type: "CONTINUE" });
  assert.equal(s.floor, 2);
  assert.equal(x.missionProgress(s), 6);
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(x.missionProgress(s), 6);
  const returned = e.reducer(
    { ...s, phase: "extraction", journey: { ...s.journey, watches: 180 } },
    { type: "RETURN" },
  );
  assert.equal(returned.gold - s.gold, 150);
  assert.equal(returned.startFloor, 2);
});
test("Existing campaigns gain shortcuts to every reached floor without resetting their progress", () => {
  for (const floor of [2, 4, 5, 6, 7, 10, 12]) {
    const raw = {
      ...fresh(),
      floor,
      bestFloor: floor - 1,
      checkpoints: [1],
      route: floor >= 5 && floor <= 7 ? "crypt" : null,
      inventory: { "beast-core": 17 },
    };
    const loaded = e.normalizeSave(raw);
    assert.deepEqual(
      Array.from(loaded.checkpoints),
      Array.from({ length: floor }, (_, i) => i + 1),
    );
    assert.equal(loaded.startFloor, floor);
    assert.equal(loaded.inventory["beast-core"], 17);
    if (raw.route) assert.ok(loaded.discoveredRoutes.includes("crypt"));
    assert.equal(e.normalizeSave(loaded).startFloor, floor);
  }
  assert.equal(
    e.reducer(fresh(), { type: "SELECT_START", floor: 12 }).startFloor,
    1,
  );
});
test("Routed shortcuts keep the chosen route on Floors 5, 6 and 7", () => {
  for (const floor of [5, 6, 7]) {
    const s = {
      ...fresh(),
      day: 30,
      checkpoints: [1, floor],
      discoveredRoutes: ["roots", "forge"],
    };
    const denied = e.reducer(s, {
      type: "SELECT_START",
      floor,
      route: "crypt",
    });
    assert.equal(denied.startFloor, 1);
    const chosen = e.reducer(s, {
      type: "SELECT_START",
      floor,
      route: "forge",
    });
    const entered = e.reducer(chosen, { type: "ENTER", mission: "survey" });
    assert.equal(entered.route, "forge");
    assert.equal(x.floorMap(entered).routeId, "forge");
  }
});
test("Closing the labyrinth reports teleportation and settles the expedition once", () => {
  let s = e.reducer(
    { ...fresh(), day: 30, food: 100 },
    { type: "ENTER", mission: "survey" },
  );
  s = e.reducer(
    { ...s, phase: "defeat" },
    { type: "CAMP_REST", untilClose: true },
  );
  assert.equal(s.phase, "extraction");
  assert.match(s.message, /labyrinth is closing.*teleported back to town/i);
  const town = e.reducer(s, { type: "RETURN" });
  assert.match(town.message, /labyrinth is closing.*teleported back to town/i);
  const repeated = e.reducer(town, { type: "RETURN" });
  assert.equal(repeated.gold, town.gold);
  assert.equal(repeated.day, town.day);
  assert.equal(repeated.expedition.number, town.expedition.number);
});
test("The combined Gear stock contains equipment from every shop and filters exactly by slot", () => {
  const all = shop.shopStock("Gear", "all", {});
  for (const vendor of ["provisioner", "alchemist", "emporium"])
    assert.ok(all.some((i) => i.vendor === vendor));
  assert.ok(all.every((i) => i.kind !== "supply" && i.kind !== "loot"));
  for (const kind of w.GEAR_KINDS) {
    const filtered = shop.shopStock("Gear", kind, {});
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every((i) => i.kind === kind));
    assert.equal(filtered.length, all.filter((i) => i.kind === kind).length);
  }
  assert.ok(
    shop.shopStock("Supplies", "all", {}).every((i) => i.kind === "supply"),
  );
  assert.deepEqual(
    Array.from(
      shop.shopStock("Sell", "boots", { "scout-boots": 1, "iron-blade": 1 }),
      (i) => i.id,
    ),
    ["scout-boots"],
  );
});
console.log(`${count} floor and shop checks passed.`);
