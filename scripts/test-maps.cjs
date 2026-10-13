const assert = require("node:assert/strict");
const { e, exploration: x, maps, fatigue } = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function start(seed = 42) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "barbarian",
    name: "Map test",
    roll: 0.5,
  });
  s = { ...s, day: 30, journey: { ...s.journey, seed } };
  s = e.reducer(s, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  return e.reducer(
    { ...s, phase: "victory", eventResolved: true },
    { type: "SEARCH_PORTAL" },
  );
}
test("480 seeded floor graphs have reachable rooms, reciprocal edges, real loops and six-step portals", () => {
  for (let seed = 1; seed <= 40; seed++)
    for (let floor = 1; floor <= 12; floor++) {
      const map = maps.generateFloor(floor, seed),
        visited = new Set(),
        edges = new Set(),
        queue = [map.entrance];
      while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        for (const target of Object.values(map.nodes[id].exits)) {
          assert.ok(map.nodes[target], "No dangling connection");
          assert.ok(
            Object.values(map.nodes[target].exits).includes(id),
            "Reverse connection exists",
          );
          edges.add([id, target].sort().join(":"));
          queue.push(target);
        }
      }
      assert.equal(visited.size, Object.keys(map.nodes).length);
      assert.ok(edges.size >= visited.size, "At least one genuine cycle");
      let room = "cross-0";
      for (const direction of map.route)
        room = map.nodes[room].exits[direction];
      assert.equal(room, map.portal);
      assert.equal(map.route.length, 6);
      for (const kind of [
        "monster",
        "treasure",
        "npc",
        "trap",
        "spring",
        "portal",
        "camp",
      ])
        assert.ok(Object.values(map.nodes).some((n) => n.kind === kind));
    }
});
test("Seed generation is deterministic and distinct seeds can produce different layouts", () => {
  assert.equal(
    JSON.stringify(maps.generateFloor(2, 42)),
    JSON.stringify(maps.generateFloor(2, 42)),
  );
  assert.notEqual(
    JSON.stringify(maps.generateFloor(2, 42).nodes),
    JSON.stringify(maps.generateFloor(2, 43).nodes),
  );
});
test("Fog reveals adjacent frontier only and reports do not count as explored rooms", () => {
  const map = maps.generateFloor(1, 42);
  let fog = maps.visibleRooms(map);
  assert.ok(fog.visible.has("aftermath"));
  assert.ok(!fog.visible.has(map.portal));
  assert.ok(!fog.named.has("aftermath"));
  const s = start();
  const journey = x.chartRumour(s, 3),
    report = journey.maps[3];
  assert.ok(report.known.includes("cross-2"));
  assert.ok(!report.explored.includes("cross-2"));
});
test("Side-room travel changes actual IDs and Back follows saved edges without regenerating", () => {
  const s = start(),
    room = x.currentRoom(s),
    direction = ["left", "straight", "right"].find(
      (d) => d !== x.floorMap(s).route[0],
    );
  const target = room.exits[direction],
    moved = e.reducer(s, { type: "MOVE", direction });
  assert.equal(moved.journey.room, target);
  assert.equal(moved.phase, "branch");
  assert.ok(moved.journey.maps[1].explored.includes(target));
  const back = e.reducer(moved, { type: "MOVE_BACK" });
  assert.equal(back.journey.room, s.journey.room);
  assert.equal(back.journey.watches, s.journey.watches + 2);
  assert.equal(
    JSON.stringify(back.journey.maps[1].nodes),
    JSON.stringify(s.journey.maps[1].nodes),
  );
});
test("Invalid travel cannot change rooms, reveal secrets or spend watches", () => {
  let s = start();
  const map = x.floorMap(s),
    end = Object.values(map.nodes).find((n) => n.kind === "dead-end");
  if (!end) return;
  s = x.enterMappedRoom(s, end.id);
  const result = e.reducer(s, { type: "MOVE", direction: "straight" });
  assert.equal(result.journey.room, end.id);
  assert.equal(result.journey.watches, s.journey.watches);
  assert.equal(result.journey.maps, s.journey.maps);
});
test("Leaving an unsearched side room does not consume its encounter", () => {
  let s = start();
  const node = Object.values(x.floorMap(s).nodes).find(
    (n) => n.kind === "treasure",
  );
  s = x.enterMappedRoom(s, node.id);
  const back = e.reducer(s, {
    type: "BRANCH_CHOICE",
    choice: "leave",
    roll: 0.5,
  });
  assert.ok(!back.journey.resolvedBranches.includes(node.id));
  s = x.enterMappedRoom(back, node.id);
  const reward = e.reducer(s, {
    type: "BRANCH_CHOICE",
    choice: "careful",
    roll: 0.5,
  });
  assert.ok(reward.gold > s.gold);
  const again = x.enterMappedRoom(reward, node.id);
  assert.equal(
    e.reducer(again, { type: "BRANCH_CHOICE", choice: "careful", roll: 0.5 })
      .gold,
    again.gold,
  );
});
test("Finding a portal cannot teleport a backtracked party through it", () => {
  let s = start();
  for (const direction of x.floorMap(s).route)
    s = e.reducer(s, { type: "MOVE", direction });
  assert.equal(x.currentRoom(s).kind, "portal");
  s = e.reducer(s, { type: "SEARCH_PORTAL" });
  s = e.reducer(s, { type: "MOVE_BACK" });
  assert.ok(s.journey.portal);
  assert.equal(s.journey.room, "cross-5");
  assert.equal(
    e.reducer({ ...s, phase: "victory" }, { type: "CONTINUE" }).floor,
    1,
  );
  assert.equal(e.reducer(s, { type: "AT_PORTAL" }).phase, "exploration");
});
test("Reload and re-entry retain exact floor graphs, explored rooms and seed", () => {
  let s = start();
  s = e.reducer(s, { type: "MOVE", direction: x.floorMap(s).route[0] });
  const before = JSON.stringify(s.journey.maps),
    seed = s.journey.seed;
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(JSON.stringify(s.journey.maps), before);
  s = e.reducer(e.reducer(s, { type: "SEEK_SHELTER" }), {
    type: "CAMP_REST",
    untilClose: true,
  });
  s = e.reducer(s, { type: "RETURN" });
  s = e.reducer(s, { type: "BUY_ITEM", id: "rations" });
  s = e.reducer(s, { type: "PREPARE_CYCLE", mode: "rest" });
  s = e.reducer(s, { type: "ENTER" });
  assert.equal(s.journey.seed, seed);
  assert.equal(s.journey.room, "entrance");
  assert.equal(
    JSON.stringify(s.journey.maps[1].nodes),
    JSON.stringify(JSON.parse(before)[1].nodes),
  );
  assert.ok(s.journey.maps[1].explored.includes("cross-1"));
  assert.equal(s.journey.resolvedBranches.length, 0);
});
test("Exhaustion reduces real damage and defence without changing base stats", () => {
  let s = start();
  s = {
    ...s,
    phase: "combat",
    enemy: { ...s.enemy, hp: 10000, maxHp: 10000, guard: 0 },
  };
  const fresh = { ...s, party: s.party.map((c) => ({ ...c, exhaustion: 0 })) };
  const tired = {
    ...s,
    party: s.party.map((c) => ({ ...c, exhaustion: 100 })),
  };
  const a = e.reducer(fresh, { type: "BATTLE", kind: "attack", roll: 0.5 }),
    b = e.reducer(tired, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.ok(b.effects.damage < a.effects.damage);
  assert.ok(b.effects.enemyDamage >= a.effects.enemyDamage);
  assert.equal(b.party[0].atk, a.party[0].atk);
  assert.equal(b.party[0].def, a.party[0].def);
});
test("Complaint thresholds persist, rest resumes the exact room and recovery re-arms complaints", () => {
  let s = start();
  s = { ...s, party: s.party.map((c) => ({ ...c, exhaustion: 50 })) };
  s = fatigue.maybeComplain(s);
  assert.equal(s.phase, "nag");
  const room = s.journey.room;
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.ok(s.journey.nag.quote);
  s = e.reducer(s, { type: "NAG_DECISION", rest: true });
  assert.equal(s.phase, "camp");
  assert.equal(x.currentRoom(s).kind, "camp");
  s = e.reducer(s, { type: "CAMP_REST" });
  assert.equal(s.party[0].exhaustion, 17);
  s = e.reducer(s, { type: "LEAVE_CAMP" });
  assert.equal(s.journey.room, room);
  assert.equal(s.phase, "exploration");
  assert.equal(s.journey.nagged.hero, 0);
  s = fatigue.maybeComplain({
    ...s,
    party: s.party.map((c) => ({ ...c, exhaustion: 50 })),
  });
  assert.equal(s.phase, "nag");
  s = e.reducer(s, { type: "NAG_DECISION", rest: false });
  assert.equal(s.party[0].exhaustion, 54);
  assert.equal(fatigue.maybeComplain(s).phase, "exploration");
});
test("A complaint during a floor story can rest and resume that unresolved story", () => {
  let s = { ...start(), phase: "event", eventResolved: false };
  s = x.moveRoom(s, "aftermath");
  s = { ...s, party: s.party.map((c) => ({ ...c, exhaustion: 75 })) };
  s = fatigue.maybeComplain(s);
  s = e.reducer(s, { type: "NAG_DECISION", rest: true });
  s = e.reducer(s, { type: "CAMP_REST" });
  s = e.reducer(s, { type: "LEAVE_CAMP" });
  assert.equal(s.phase, "event");
  assert.equal(s.journey.room, "aftermath");
  assert.equal(s.eventResolved, false);
});
test("Back retraces the entered connection even after travelling through a side-room loop", () => {
  let s = start();
  const a = Object.values(x.floorMap(s).nodes).find(
    (n) =>
      n.id.startsWith("side-") &&
      n.exits.right &&
      n.exits.right.startsWith("side-"),
  );
  s = x.enterMappedRoom(s, a.id);
  const b = e.reducer(s, { type: "MOVE", direction: "right" });
  assert.equal(b.journey.room, a.exits.right);
  const back = e.reducer(b, { type: "MOVE_BACK" });
  assert.equal(back.journey.room, a.id);
  assert.ok(Object.values(x.currentRoom(b).exits).includes(back.journey.room));
});
test("Saved route knowledge cannot award a new survey mission without revisiting its portal", () => {
  let s = start();
  for (const direction of x.floorMap(s).route)
    s = e.reducer(s, { type: "MOVE", direction });
  assert.equal(x.missionProgress(s), 6);
  s = e.reducer(e.reducer(s, { type: "SEEK_SHELTER" }), {
    type: "CAMP_REST",
    untilClose: true,
  });
  s = e.reducer(s, { type: "RETURN" });
  s = e.reducer(s, { type: "BUY_ITEM", id: "rations" });
  s = e.reducer(s, { type: "PREPARE_CYCLE", mode: "rest" });
  s = e.reducer(s, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  assert.equal(s.journey.chart[1].length, 6);
  assert.equal(x.missionProgress(s), 0);
});
test("The final floor's connected passages and summit portal remain explorable", () => {
  let s = {
    ...start(),
    floor: 12,
    phase: "victory",
    journey: { ...start().journey, room: "aftermath", history: [] },
  };
  s = e.reducer(s, { type: "SEARCH_PORTAL" });
  assert.equal(s.journey.room, "cross-0");
  for (const direction of x.floorMap(s).route)
    s = e.reducer(s, { type: "MOVE", direction });
  assert.equal(x.currentRoom(s).kind, "portal");
  assert.equal(s.phase, "victory");
  assert.equal(e.reducer(s, { type: "CONTINUE" }).floor, 12);
});
test("Legacy route charts migrate on every floor and active portals and shelters restore valid rooms", () => {
  const raw = JSON.parse(JSON.stringify(start()));
  delete raw.journey.maps;
  delete raw.journey.history;
  delete raw.journey.reachedPortals;
  raw.floor = 2;
  raw.phase = "victory";
  raw.journey.step = 6;
  raw.journey.portal = true;
  raw.journey.chart = { 1: [...x.FLOOR_PATHS[0]], 2: [...x.FLOOR_PATHS[1]] };
  let s = e.normalizeSave(raw);
  assert.equal(s.journey.room, "cross-6");
  assert.equal(x.currentRoom(s).kind, "portal");
  assert.ok(s.journey.maps[1].known.includes("cross-6"));
  assert.ok(
    s.journey.reachedPortals.includes(1) &&
      s.journey.reachedPortals.includes(2),
  );
  raw.phase = "camp";
  raw.journey.campReturn = "victory";
  s = e.normalizeSave(raw);
  assert.equal(s.journey.room, "camp-cross-6");
  const resumed = e.reducer(s, { type: "LEAVE_CAMP" });
  assert.equal(resumed.journey.room, "cross-6");
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
  let s = e.reducer(company(), { type: "LEAD", id: "kael" });
  s = e.reducer(s, { type: "MOVE", direction: x.floorMap(s).route[0] });
  assert.deepEqual(
    Array.from(s.party, (c) => c.exhaustion),
    [1, 2, 1, 1],
  );
  assert.equal(
    e.normalizeSave(JSON.parse(JSON.stringify(s))).journey.leaderId,
    "kael",
  );
  const denied = { ...s, phase: "combat" };
  assert.equal(e.reducer(denied, { type: "LEAD", id: "mira" }), denied);
  const fallen = {
    ...s,
    party: s.party.map((c) => (c.id === "mira" ? { ...c, hp: 0 } : c)),
  };
  assert.equal(
    e.reducer(fallen, { type: "LEAD", id: "mira" }).journey.leaderId,
    "kael",
  );
});
test("The elf scouting an approach bears its extra effort instead of the whole team", () => {
  let s = company();
  s = { ...s, phase: "arrival", arrivalChoice: "" };
  s = e.reducer(s, { type: "APPROACH", choice: "sneak", roll: 0.5 });
  assert.deepEqual(
    Array.from(s.party, (c) => c.exhaustion),
    [1, 1, 2, 1],
  );
});
test("Attackers, mages, tanks, item users and focusing allies gain different exhaustion", () => {
  const act = (kind, actor, extra = {}) =>
    e.reducer(roleArena(), {
      type: "BATTLE",
      kind,
      actor,
      roll: 0.5,
      ...extra,
    });
  assert.deepEqual(
    Array.from(act("attack", "kael").party, (c) => c.exhaustion),
    [1, 2, 1, 1],
  );
  assert.deepEqual(
    Array.from(act("guard", "kael").party, (c) => c.exhaustion),
    [0, 2, 0, 0],
  );
  assert.deepEqual(
    Array.from(
      act("skill", "mira", { skill: "Arcane Bolt" }).party,
      (c) => c.exhaustion,
    ),
    [1, 1, 1, 3],
  );
  assert.deepEqual(
    Array.from(
      act("item", "mira", { item: "potion" }).party,
      (c) => c.exhaustion,
    ),
    [0, 0, 0, 1],
  );
  let s = roleArena();
  s.party[3].mp = 0;
  s = e.reducer(s, { type: "BATTLE", kind: "focus", actor: "mira", roll: 0.5 });
  assert.deepEqual(
    Array.from(s.party, (c) => c.exhaustion),
    [1, 1, 1, 0],
  );
});
test("Enemy hits add individual strain, killing blows count effort once and rejected actions count none", () => {
  let s = roleArena();
  s.turn = 1;
  const hit = e.reducer(s, {
    type: "BATTLE",
    kind: "attack",
    actor: "mira",
    roll: 0.5,
  });
  const target = Object.keys(hit.effects.targets)[0];
  assert.equal(
    hit.party.find((c) => c.id === target).exhaustion,
    target === "mira" ? 3 : 2,
  );
  s = roleArena();
  s.enemy.hp = 1;
  const killed = e.reducer(s, {
    type: "BATTLE",
    kind: "attack",
    actor: "kael",
    roll: 0.5,
  });
  assert.equal(killed.kills, s.kills + 1);
  assert.deepEqual(
    Array.from(killed.party, (c) => c.exhaustion),
    [1, 2, 1, 1],
  );
  const invalid = e.reducer(roleArena(), {
    type: "BATTLE",
    kind: "burst",
    roll: 0.5,
  });
  assert.deepEqual(
    Array.from(invalid.party, (c) => c.exhaustion),
    [0, 0, 0, 0],
  );
});
console.log(count + " connected-map and exhaustion checks passed.");
