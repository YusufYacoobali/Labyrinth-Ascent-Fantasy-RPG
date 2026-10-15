const assert = require("node:assert/strict");
const {
  e,
  maps,
  exploration: x,
  director: d,
  shortcuts: h,
  travel: k,
  npcs,
  w,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
let count = 0;
function test(name, fn) {
  fn();
  console.log("PASS " + name);
  count++;
}
function start(seed = 42) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed,
    race: "human",
    name: "Atlas",
    roll: 0.5,
  });
  s = e.reducer({ ...s, day: 30, food: 40 }, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  return e.reducer(s, { type: "ENGAGE" });
}
function quiet() {
  let s = start();
  const map = x.floorMap(s);
  return {
    ...s,
    eventResolved: true,
    expedition: { ...s.expedition, director: undefined },
    journey: {
      ...s.journey,
      maps: {
        ...s.journey.maps,
        1: {
          ...map,
          explored: Object.keys(map.nodes),
          nodes: Object.fromEntries(
            Object.entries(map.nodes).map(([id, n]) => [
              id,
              { ...n, kind: "landmark" },
            ]),
          ),
        },
      },
    },
  };
}
test("Monthly director precomputes every floor and route once and survives reload without rerolls", () => {
  const s = start(),
    v = plain(s.expedition.director);
  assert.equal(Object.keys(v.encounters).length, 21);
  assert.deepEqual(plain(e.normalizeSave(plain(s)).expedition.director), v);
  assert.equal(d.establishExpedition(s), s);
  for (const [key, slots] of Object.entries(v.encounters))
    for (const [id, slot] of Object.entries(slots))
      assert.equal(s.journey.occupants[key][id], slot.kind);
});
test("Director preserves geography while month and preparation change weighted encounters", () => {
  const s = start();
  const next = d.establishExpedition({
    ...s,
    expedition: { ...s.expedition, number: 2, director: undefined },
    party: s.party.map((c) => ({ ...c, injuries: 2, level: 8 })),
  });
  assert.notEqual(next.expedition.director.seed, s.expedition.director.seed);
  assert.notDeepEqual(
    plain(next.journey.occupants),
    plain(s.journey.occupants),
  );
  for (const key of Object.keys(s.journey.maps))
    assert.deepEqual(
      plain(next.journey.maps[key].nodes),
      plain(s.journey.maps[key].nodes),
    );
  const slots = Object.values(s.expedition.director.encounters).flatMap(
    Object.values,
  );
  assert.ok(slots.some((c) => c.kind === "quiet"));
  assert.ok(slots.some((c) => c.variant === "ambush"));
  assert.ok(slots.some((c) => c.variant === "elite"));
});
test("First arrival locks precomputed late-time alternatives and backtracking cannot replace them", () => {
  let s = start();
  const [room, slot] = Object.entries(s.expedition.director.encounters[1]).find(
    ([, p]) => p.kind === "quiet",
  );
  s = {
    ...s,
    expedition: {
      ...s.expedition,
      director: {
        ...s.expedition.director,
        encounters: {
          ...s.expedition.director.encounters,
          1: {
            ...s.expedition.director.encounters[1],
            [room]: { ...slot, lateKind: "cache" },
          },
        },
      },
    },
  };
  const early = d.lockEncounter(s, room);
  assert.equal(
    d.lockEncounter(
      { ...early, journey: { ...early.journey, watches: 150 } },
      room,
    ).journey.occupants[1][room],
    "quiet",
  );
  const late = d.lockEncounter(
    { ...s, journey: { ...s.journey, watches: 150 } },
    room,
  );
  assert.equal(late.journey.occupants[1][room], "cache");
  assert.equal(
    d.lockEncounter(e.normalizeSave(plain(late)), room).journey.occupants[1][
      room
    ],
    "cache",
  );
});
test("Recurring named explorers occupy one stable location and remember encounters across months", () => {
  const s = start(),
    places = Object.values(s.expedition.director.npcs);
  assert.equal(places.length, 3);
  assert.equal(new Set(places.map((p) => p.map + ":" + p.room)).size, 3);
  const place = s.expedition.director.npcs.elian;
  let visit = x.enterMappedRoom(
    { ...s, floor: Number(place.map.split(":")[0]) },
    place.room,
  );
  assert.equal(npcs.npcAt(visit), "elian");
  visit = e.reducer(visit, {
    type: "BRANCH_CHOICE",
    choice: "help",
    roll: 0.5,
  });
  assert.equal(visit.npcs.elian.helped, 1);
  assert.match(npcs.npcDescription(visit, "elian"), /recognizes/);
  assert.equal(
    e.reducer(visit, { type: "BRANCH_CHOICE", choice: "help", roll: 0.5 }).npcs
      .elian.helped,
    1,
  );
});
test("Merchant barter preserves secured inputs and keeps mixed field-derived rations unsecured", () => {
  for (const field of [0, 1, 2]) {
    let s = start();
    const place = s.expedition.director.npcs.tamsin;
    s = x.enterMappedRoom(
      {
        ...s,
        floor: 2,
        inventory: { ...s.inventory, "beast-core": 2 },
        expedition: {
          ...s.expedition,
          unsecured: {
            ...s.expedition.unsecured,
            inventory: { "beast-core": field },
          },
        },
      },
      place.room,
    );
    const food = s.food;
    s = e.reducer(s, { type: "BRANCH_CHOICE", choice: "trade", roll: 0.5 });
    assert.equal(s.food, food + 3);
    assert.equal(s.inventory["beast-core"], 0);
    assert.equal(s.expedition.unsecured.food, field ? 3 : 0);
    assert.equal(
      e.reducer(e.normalizeSave(plain(s)), {
        type: "BRANCH_CHOICE",
        choice: "trade",
        roll: 0.5,
      }).food,
      s.food,
    );
  }
});
test("Rare cache equipment is granted once and remains unsecured through reload", () => {
  let s = start();
  const [room, slot] = Object.entries(s.expedition.director.encounters[1]).find(
    ([, v]) => v.kind === "cache",
  );
  const item = w.ITEMS.find(
    (i) => i.quality === "fine" && i.kind === "weapon",
  ).id;
  s = {
    ...s,
    expedition: {
      ...s.expedition,
      director: {
        ...s.expedition.director,
        encounters: {
          ...s.expedition.director.encounters,
          1: {
            ...s.expedition.director.encounters[1],
            [room]: { ...slot, rewardItem: item },
          },
        },
      },
    },
  };
  s = x.enterMappedRoom(s, room);
  s = e.reducer(s, { type: "BRANCH_CHOICE", choice: "careful", roll: 0.5 });
  assert.equal(s.inventory[item], 1);
  assert.equal(s.expedition.unsecured.inventory[item], 1);
  s = e.normalizeSave(plain(s));
  assert.equal(
    e.reducer(s, { type: "BRANCH_CHOICE", choice: "careful", roll: 0.5 })
      .inventory[item],
    1,
  );
});
test("Known-route travel charges every watch, updates facing and trail, and refuses unknown passages", () => {
  let s = quiet(),
    map = x.floorMap(s),
    target = Object.keys(map.nodes).find(
      (id) => maps.shortestPath(map, map.entrance, id).length >= 4,
    ),
    path = k.knownPath(s, target);
  assert.ok(path.length >= 4);
  const n = e.reducer(s, { type: "QUICK_TRAVEL", room: target });
  assert.equal(n.journey.room, target);
  assert.equal(n.journey.watches, path.length - 1);
  assert.equal(n.expedition.trail[1].length, path.length - 1);
  assert.equal(
    e.reducer(n, { type: "QUICK_TRAVEL", room: target }).journey.watches,
    n.journey.watches,
  );
  s = {
    ...s,
    journey: {
      ...s.journey,
      maps: { ...s.journey.maps, 1: { ...map, explored: [map.entrance] } },
    },
  };
  assert.equal(
    e.reducer(s, { type: "QUICK_TRAVEL", room: target }).journey.watches,
    0,
  );
});
test("Quick travel stops at unresolved encounters and the gate boundary without skipping decisions", () => {
  let s = quiet(),
    map = x.floorMap(s),
    target = Object.keys(map.nodes).find(
      (id) => maps.shortestPath(map, map.entrance, id).length >= 4,
    ),
    path = k.knownPath(s, target),
    stop = path[1];
  const node = { ...map.nodes[stop], kind: "crossroads" };
  s = {
    ...s,
    journey: {
      ...s.journey,
      maps: {
        ...s.journey.maps,
        1: { ...map, nodes: { ...map.nodes, [stop]: node } },
      },
      occupants: { ...s.journey.occupants, 1: { [stop]: "hazard" } },
    },
  };
  const n = e.reducer(s, { type: "QUICK_TRAVEL", room: target });
  assert.equal(n.journey.room, stop);
  assert.equal(n.phase, "branch");
  assert.equal(n.journey.watches, 1);
  const late = e.reducer(
    { ...quiet(), journey: { ...quiet().journey, watches: 179 } },
    { type: "QUICK_TRAVEL", room: target },
  );
  assert.ok(late.journey.watches <= 180);
  assert.notEqual(late.journey.room, target);
});
test("1000 maps retain coordinates and reciprocal edges after deterministic shortcuts open", () => {
  let doors = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const map = h.prepareShortcuts(
      maps.generateFloor((seed % 12) + 1, seed, seed % 2 ? "frost" : ""),
    );
    assert.deepEqual(plain(h.prepareShortcuts(map)), plain(map));
    for (const door of map.shortcuts) {
      doors++;
      const next = h.openShortcut(map, door.id);
      assert.equal(next.nodes[door.from].exits[door.heading], door.to);
      assert.equal(
        next.nodes[door.to].exits[maps.opposite(door.heading)],
        door.from,
      );
      for (const id of Object.keys(map.nodes)) {
        assert.equal(next.nodes[id].x, map.nodes[id].x);
        assert.equal(next.nodes[id].y, map.nodes[id].y);
      }
      assert.ok(maps.shortestPath(next, next.entrance, next.portal).length);
      assert.equal(h.openShortcut(next, door.id), next);
    }
  }
  assert.ok(doors > 500);
});
test("Unlocking a shortcut costs one watch and one key, persists and does not move or turn the party", () => {
  let s = start(2);
  let map = x.floorMap(s);
  if (!map.shortcuts.length) {
    map = h.prepareShortcuts(maps.generateFloor(1, 11));
    s = {
      ...s,
      journey: { ...s.journey, maps: { ...s.journey.maps, 1: map } },
    };
  }
  const door = { ...map.shortcuts[0], requirement: "key" };
  assert.ok(door.id);
  map = { ...map, shortcuts: [door] };
  s = {
    ...s,
    inventory: { ...s.inventory, "labyrinth-key": 1 },
    journey: {
      ...s.journey,
      room: door.from,
      maps: { ...s.journey.maps, 1: map },
    },
  };
  const n = e.reducer(s, { type: "UNLOCK_SHORTCUT", id: door.id });
  assert.equal(n.inventory["labyrinth-key"], 0);
  assert.equal(n.journey.watches, s.journey.watches + 1);
  assert.equal(n.journey.room, s.journey.room);
  assert.equal(n.journey.facing, s.journey.facing);
  assert.equal(x.floorMap(n).shortcuts[0].open, true);
  const again = e.reducer(e.normalizeSave(plain(n)), {
    type: "UNLOCK_SHORTCUT",
    id: door.id,
  });
  assert.equal(again.journey.watches, n.journey.watches);
});
console.log(`${count} exploration-director checks passed.`);
