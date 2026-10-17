const campaignAction = require("./round-helpers.cjs").act;
const assert = require("node:assert/strict");
const { e, exploration: x, maps, fatigue } = require("./engine-loader.cjs");
const { toward, travel } = require("./map-helpers.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function start(seed = 42) {
  let s = campaignAction(e.initialGame(), {
    type: "CREATE",
    seed,
    race: "barbarian",
    name: "Map test",
    roll: 0.5,
  });
  s.journey.maps[1] = JSON.parse(
    JSON.stringify(require("./fixtures/floor-v2-6da6d25.json")),
  );
  s = campaignAction({ ...s, day: 30, food: 40 }, { type: "ENTER" });
  s = campaignAction(s, { type: "MISSION", id: "survey" });
  return campaignAction(s, { type: "ENGAGE" });
}
const plain = (v) => JSON.parse(JSON.stringify(v));
test("1200 spatial graphs have reciprocal compass edges, connected loops, one sanctuary and portal distances in band", () => {
  for (let seed = 1; seed <= 100; seed++)
    for (let floor = 1; floor <= 12; floor++) {
      const map = maps.generateFloor(
          floor,
          seed,
          floor >= 5 && floor <= 7
            ? ["roots", "frost", "forge", "crypt"][seed % 4]
            : "",
        ),
        nodes = Object.values(map.nodes),
        edges = new Set();
      assert.equal(nodes.filter((n) => n.kind === "camp").length, 1);
      assert.equal(
        new Set(nodes.map((n) => `${n.x},${n.y}`)).size,
        nodes.length,
      );
      for (const node of nodes) {
        assert.ok(maps.shortestPath(map, map.entrance, node.id).length);
        for (const [heading, id] of Object.entries(node.exits)) {
          const target = map.nodes[id];
          assert.ok(target);
          assert.equal(target.exits[maps.opposite(heading)], node.id);
          assert.equal(target.x - node.x, maps.DELTA[heading][0]);
          assert.equal(target.y - node.y, maps.DELTA[heading][1]);
          edges.add([node.id, id].sort().join(":"));
        }
        if (node.kind === "dead-end")
          assert.equal(Object.keys(node.exits).length, 1);
      }
      assert.ok(edges.size >= nodes.length, "A real loop");
      const distance =
          maps.shortestPath(map, map.entrance, map.portal).length - 1,
        min = floor <= 4 ? 5 : floor <= 8 ? 7 : 9;
      assert.ok(
        distance >= min && distance <= min + 3,
        `floor ${floor} distance ${distance}`,
      );
    }
});
test("World geography is deterministic and route maps remain distinct", () => {
  assert.deepEqual(
    plain(maps.generateFloor(6, 42, "roots")),
    plain(maps.generateFloor(6, 42, "roots")),
  );
  assert.notEqual(
    JSON.stringify(maps.generateFloor(6, 42, "roots").nodes),
    JSON.stringify(maps.generateFloor(6, 42, "frost").nodes),
  );
  assert.notEqual(
    JSON.stringify(maps.generateFloor(1, 42).nodes),
    JSON.stringify(maps.generateFloor(1, 43).nodes),
  );
});

test("Arrival faces into every generated floor without a backward exit where a wall exists", () => {
  for (let seed = 1; seed <= 100; seed++)
    for (let floor = 1; floor <= 12; floor++) {
      const map = maps.generateFloor(floor, seed);
      const exits = map.nodes[map.entrance].exits;
      const facing = maps.entryFacing(map);
      assert.ok(maps.HEADINGS.includes(facing));
      if (Object.keys(exits).length < 4)
        assert.equal(exits[maps.opposite(facing)], undefined);
      assert.ok(
        Object.keys(exits).some(
          (h) => maps.relativeDirection(facing, h) !== "back",
        ),
      );
    }
});

test("Four-way arrivals turn in place, retain every passage and only acquire a return route after moving", () => {
  let s = start();
  assert.equal(x.isFreshEntrance(s), true);
  assert.equal(x.exitsFor(s).length, 4);
  const before = s;
  s = campaignAction(s, { type: "TURN_AROUND" });
  assert.equal(s.journey.room, before.journey.room);
  assert.equal(s.journey.facing, maps.opposite(before.journey.facing));
  assert.equal(s.day, before.day);
  assert.equal(s.food, before.food);
  assert.equal(
    JSON.stringify(s.journey.maps),
    JSON.stringify(before.journey.maps),
  );
  assert.equal(e.normalizeSave(plain(s)).journey.facing, s.journey.facing);
  const exit = x.exitsFor(s).find((e) => e.direction === "straight");
  s = campaignAction(s, { type: "MOVE", direction: exit.direction });
  assert.equal(s.journey.room, exit.to);
  assert.equal(x.isFreshEntrance(s), false);
  assert.equal(
    x.exitsFor(s).find((e) => e.direction === "back").to,
    "entrance",
  );
  assert.equal(
    campaignAction(s, { type: "TURN_AROUND" }).journey.facing,
    s.journey.facing,
  );
});

test("Old untouched entrances repair their facing without changing saved rooms or travelled approaches", () => {
  let s = start();
  const map = maps.generateFloor(1, 43);
  s = {
    ...s,
    journey: {
      ...s.journey,
      maps: { ...s.journey.maps, 1: map },
      facing: "north",
    },
  };
  delete s.journey.arrivalFacingSet;
  const loaded = e.normalizeSave(plain(s));
  assert.equal(loaded.journey.facing, maps.entryFacing(map));
  assert.equal(
    JSON.stringify(loaded.journey.maps[1].nodes),
    JSON.stringify(map.nodes),
  );
  const travelled = {
    ...s,
    expedition: { ...s.expedition, trail: { 1: ["entrance:aftermath"] } },
  };
  assert.equal(e.normalizeSave(plain(travelled)).journey.facing, "north");
});
test("All four facings convert every relative direction consistently and save travelled headings", () => {
  for (const facing of maps.HEADINGS)
    for (const direction of ["left", "straight", "right", "back"]) {
      const heading = maps.absoluteHeading(facing, direction);
      assert.equal(maps.relativeDirection(facing, heading), direction);
      let s = start();
      s = { ...s, journey: { ...s.journey, facing }, eventResolved: true };
      const target = x.currentRoom(s).exits[heading];
      const next = campaignAction(s, { type: "MOVE", direction });
      if (target) {
        assert.equal(next.journey.room, target);
        assert.equal(next.journey.facing, heading);
        assert.equal(e.normalizeSave(plain(next)).journey.facing, heading);
      } else assert.equal(next.journey.room, s.journey.room);
    }
});
test("Retrace follows actual history around a loop and updates facing independently of Back", () => {
  let s = start();
  s = travel(s, "entrance");
  for (const id of ["loop-west", "loop-southwest", "loop-south", "entrance"]) {
    s = { ...s, phase: "exploration" };
    s = campaignAction(s, toward(s, id));
    assert.equal(s.journey.room, id);
  }
  assert.equal(s.journey.facing, "north");
  s = campaignAction(s, { type: "MOVE_BACK" });
  assert.equal(s.journey.room, "loop-south");
  assert.equal(s.journey.facing, "south");
  s = campaignAction(s, { type: "MOVE_BACK" });
  assert.equal(s.journey.room, "loop-southwest");
  assert.equal(s.journey.facing, "west");
});
test("Invalid movement preserves position, fog, facing and watches", () => {
  let s = travel(start(), "sanctuary");
  s = { ...s, phase: "exploration" };
  const absent = maps.HEADINGS.find((h) => !x.currentRoom(s).exits[h]);
  const next = campaignAction(s, {
    type: "MOVE",
    direction: maps.relativeDirection(s.journey.facing, absent),
  });
  for (const field of ["room", "facing", "watches", "maps"])
    assert.equal(next.journey[field], s.journey[field]);
});
test("Fog distinguishes visited and reported rooms without exposing monthly occupants", () => {
  const s = start(),
    map = x.floorMap(s),
    fog = maps.visibleRooms(map);
  assert.ok(!fog.visible.has(map.portal));
  const journey = x.chartRumour(s, 3, "Inn surveyor"),
    reported = journey.maps[3];
  assert.ok(reported.known.length >= 3);
  assert.equal(reported.explored.length, 1);
  const notes = journey.chart[3];
  for (const n of notes) {
    assert.equal(reported.nodes[n.from].exits[n.heading], n.to);
    assert.equal(n.confidence, "reported");
    assert.equal(n.source, "Inn surveyor");
    assert.ok(maps.HEADINGS.includes(n.approach));
  }
  assert.ok(!("occupants" in reported));
});
test("Travel records room connections, source and approach; looking up prose changes no facing", () => {
  let s = start(),
    before = s.journey.facing;
  s = campaignAction(s, toward(s, "loop-west"));
  const note = s.journey.chart[1].at(-1);
  assert.equal(note.from, "entrance");
  assert.equal(note.to, "loop-west");
  assert.equal(note.heading, "west");
  assert.equal(note.approach, before);
  assert.equal(note.confidence, "observed");
  const facing = s.journey.facing,
    story = x.roomStory(s);
  assert.ok(
    !/Cold air slips|scratched arrow points|pulse returns from/.test(
      story.body,
    ),
  );
  assert.equal(s.journey.facing, facing);
});
test("Monthly occupants are deterministic per expedition and regenerate without changing geography", () => {
  const map = maps.generateFloor(5, 42, "roots"),
    a = maps.populateFloor(map, 1),
    b = maps.populateFloor(map, 2);
  assert.deepEqual(plain(a), plain(maps.populateFloor(map, 1)));
  assert.notEqual(JSON.stringify(a), JSON.stringify(b));
  let s = start();
  s = travel(s, "sanctuary");
  const geometry = JSON.stringify(x.floorMap(s).nodes),
    visited = [...x.floorMap(s).explored];
  s = campaignAction(
    { ...s, food: 40 },
    { type: "CAMP_REST", untilClose: true },
  );
  s = campaignAction(s, { type: "RETURN" });
  s = campaignAction({ ...s, day: 90, food: 20 }, { type: "ENTER" });
  assert.equal(JSON.stringify(x.floorMap(s).nodes), geometry);
  assert.deepEqual(plain(x.floorMap(s).explored), visited);
  assert.equal(s.journey.resolvedBranches.length, 0);
  assert.equal(s.journey.facing, "north");
});
test("Sanctuary access and departure use ordinary neighbouring map passages", () => {
  let s = start();
  s = campaignAction(s, toward(s, "loop-west"));
  s = campaignAction(s, toward(s, "sanctuary"));
  assert.equal(s.journey.room, "sanctuary");
  assert.equal(s.phase, "camp");
  assert.equal(s.journey.facing, "west");
  s = campaignAction(s, { type: "LEAVE_CAMP" });
  assert.equal(s.journey.room, "loop-west");
  assert.equal(s.journey.facing, "east");
});
test("Portal discovery requires a defender victory, rewards once, and retains the actual room", () => {
  let s = travel(start(), "portal");
  assert.equal(s.phase, "arrival");
  assert.equal(s.journey.portal, false);
  assert.equal(
    campaignAction({ ...s, phase: "victory" }, { type: "CONTINUE" }).floor,
    1,
  );
  s = campaignAction(s, { type: "APPROACH", choice: "listen", roll: 0.5 });
  s = campaignAction(s, { type: "ENGAGE" });
  s = campaignAction(
    { ...s, enemy: { ...s.enemy, hp: 1 } },
    { type: "BATTLE", kind: "attack", roll: 0.5 },
  );
  assert.equal(s.phase, "loot");
  assert.equal(s.bestFloor, 1);
  const gold = s.gold;
  s = campaignAction(s, { type: "COLLECT" });
  assert.equal(s.phase, "victory");
  assert.equal(s.journey.room, "portal");
  assert.equal(s.gold, gold);
  s = campaignAction(s, { type: "SEARCH_PORTAL" });
  s = campaignAction(s, { type: "MOVE_BACK" });
  assert.equal(s.journey.portal, false);
  assert.equal(
    campaignAction({ ...s, phase: "victory" }, { type: "CONTINUE" }).floor,
    1,
  );
  s = travel(s, "portal");
  assert.equal(s.phase, "victory");
  assert.equal(campaignAction(s, { type: "CONTINUE" }).floor, 2);
});
test("Checkpoint unlocks require actual major guardian victories and reject undiscovered route starts", () => {
  let s = start();
  assert.equal(
    campaignAction({ ...s, phase: "town" }, { type: "SELECT_START", floor: 7 })
      .startFloor,
    1,
  );
  for (const floor of [3, 6, 9]) {
    s = {
      ...s,
      floor,
      phase: "combat",
      enemy: { ...e.enemyFor(floor), hp: 1 },
      journey: { ...s.journey, room: "portal", defender: true },
      party: s.party.map((c) => ({ ...c, atk: 999 })),
    };
    s = campaignAction(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
    assert.ok(s.checkpoints.includes(floor + 1));
  }
  s = { ...s, phase: "town" };
  assert.equal(
    campaignAction(s, { type: "SELECT_START", floor: 7, route: "frost" })
      .startFloor,
    1,
  );
  s = { ...s, discoveredRoutes: ["frost"], day: 60, food: 20 };
  s = campaignAction(s, { type: "SELECT_START", floor: 7, route: "frost" });
  s = campaignAction(s, { type: "ENTER" });
  assert.equal(s.floor, 7);
  assert.equal(s.route, "frost");
  assert.equal(x.currentMapKey(s), "7:frost");
  assert.equal(s.journey.room, "entrance");
});
test("Route regulars, elites and guardian variants have exclusive identities, essences, elements and materials", () => {
  const { monsters, w } = require("./engine-loader.cjs"),
    identities = new Set(),
    materials = new Set();
  for (const route of w.ROUTES) {
    for (const [floor, role] of [
      [5, "regular"],
      [5, "portal"],
      [6, "portal"],
    ]) {
      const enemy = e.enemyFor(floor, route.id, 4, role);
      identities.add(enemy.species);
      assert.equal(enemy.element, route.element);
      const spec = monsters.monsterFor(enemy, floor);
      assert.ok(spec.id.startsWith(route.id));
      assert.ok(w.ITEMS.find((i) => i.id === monsters.essenceId(spec.id)));
      materials.add(spec.material);
    }
  }
  assert.equal(identities.size, 12);
  assert.equal(materials.size, 4);
});
test("Save reload preserves graphs, monthly occupants, resolutions, notes and heading", () => {
  let s = start();
  s = campaignAction(s, toward(s, "loop-west"));
  s = { ...s, journey: { ...s.journey, resolvedBranches: ["1:loop-west"] } };
  const loaded = e.normalizeSave(plain(s));
  for (const field of [
    "maps",
    "occupants",
    "chart",
    "resolvedBranches",
    "facing",
    "history",
  ])
    assert.deepEqual(plain(loaded.journey[field]), plain(s.journey[field]));
});
function company() {
  const s = start();
  return {
    ...s,
    party: [
      s.party[0],
      e.makeCharacter("human", "kael", "Kael"),
      e.makeCharacter("elf", "elowen", "Elowen"),
      e.makeCharacter("human", "mira", "Mira"),
    ].map((c) => ({ ...c, exhaustion: 0 })),
  };
}
function roleArena() {
  const s = company();
  return {
    ...s,
    phase: "combat",
    turn: 2,
    enemy: { ...s.enemy, hp: 10000, maxHp: 10000, guard: 0 },
  };
}
test("Pathfinders tire more on travel, can rotate outside combat, and persist after reload", () => {
  let s = campaignAction(company(), { type: "LEAD", id: "kael" });
  s = campaignAction(s, toward(s));
  assert.deepEqual(
    Array.from(s.party, (c) => c.exhaustion),
    [1, 2, 1, 1],
  );
  assert.equal(
    e.normalizeSave(JSON.parse(JSON.stringify(s))).journey.leaderId,
    "kael",
  );
  const denied = { ...s, phase: "combat" };
  assert.equal(campaignAction(denied, { type: "LEAD", id: "mira" }), denied);
  const fallen = {
    ...s,
    party: s.party.map((c) => (c.id === "mira" ? { ...c, hp: 0 } : c)),
  };
  assert.equal(
    campaignAction(fallen, { type: "LEAD", id: "mira" }).journey.leaderId,
    "kael",
  );
});
test("The elf scouting an approach bears its extra effort instead of the whole team", () => {
  let s = company();
  s = {
    ...s,
    phase: "arrival",
    arrivalChoice: "",
    journey: { ...s.journey, defender: true },
  };
  s = campaignAction(s, { type: "APPROACH", choice: "sneak", roll: 0.5 });
  assert.deepEqual(
    Array.from(s.party, (c) => c.exhaustion),
    [1, 1, 2, 1],
  );
});
console.log(count + " connected-map and exhaustion checks passed.");
