const assert = require("node:assert/strict");
const {
  e,
  maps,
  rounds,
  monsters: m,
  presentation: ui,
  exploration: x,
  ecology,
} = require("./engine-loader.cjs");
const plain = (s) => JSON.parse(JSON.stringify(s));
const reload = (s) => e.normalizeSave(plain(s));
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}

function fight(floor = 4, defender = true) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Finisher",
    roll: 1,
    seed: 42,
  });
  s = e.reducer(
    { ...s, day: 30, food: 60 },
    { type: "ENTER", mission: "survey" },
  );
  const route = floor >= 4 && floor <= 7 ? "roots" : null;
  const map = maps.generateFloor(floor, s.journey.seed, route || "");
  s = {
    ...s,
    phase: "combat",
    floor,
    route,
    discoveredRoutes: route ? [route] : [],
    combat: null,
    enemy: e.enemyFor(floor, route, 1, defender ? "portal" : "regular"),
    day: 59,
    party: s.party.map((c) => ({ ...c, hp: 1000, maxHp: 1000, exhaustion: 0 })),
    journey: {
      ...s.journey,
      defender,
      room: map.portal,
      watches: 174,
      maps: { ...s.journey.maps, [maps.mapKey(floor, route)]: map },
      occupants: {
        ...s.journey.occupants,
        [maps.mapKey(floor, route)]: Object.fromEntries(
          Object.keys(map.nodes).map((id) => [id, "quiet"]),
        ),
      },
    },
  };
  s = rounds.beginCombat(s);
  const foe = {
    ...(s.combat.enemies.find((f) => f.species === s.enemy.species) ||
      s.combat.enemies[0]),
    hp: 1000,
    maxHp: 1000,
    atk: 1,
    speed: 1,
    behaviorId: undefined,
    archetype: "skirmisher",
  };
  return {
    ...s,
    enemy: foe,
    combat: {
      ...s.combat,
      rules: undefined,
      intents: undefined,
      enemies: [foe],
    },
  };
}
function act(s, kind = "guard", animate = false) {
  return e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    animate,
    actions: [
      {
        actor: "hero",
        kind,
        target: kind === "guard" ? "hero" : s.combat.enemies[0].id,
      },
    ],
  });
}
const win = (s, animate = false) =>
  act(
    { ...s, party: s.party.map((c) => ({ ...c, atk: 99999 })) },
    "attack",
    animate,
  );

test("Core rewards scale with actual floor; Floor 4 regulars span 4–8 and its boss drops 50", () => {
  const spec = m.MONSTERS.find((s) => s.id === "bonegnaw");
  for (let floor = 1; floor <= 12; floor++) {
    const values = new Set();
    for (let encounter = 0; encounter < 1000; encounter++) {
      const foe = {
        ...e.enemyFor(floor, null, 1, "regular"),
        species: spec.id,
        boss: false,
        id: `encounter-${encounter}`,
      };
      const amount = m.enemyCoreYield(foe, floor);
      assert.ok(amount >= floor && amount <= floor * 2);
      assert.equal(m.enemyCoreYield(plain(foe), floor), amount);
      values.add(amount);
    }
    assert.ok(values.has(floor) && values.has(floor * 2));
    assert.equal(
      m.enemyCoreYield({ ...e.enemyFor(floor), boss: true }, floor),
      (floor + 1) * 10,
    );
  }
  assert.equal(m.enemyCoreYield(e.enemyFor(4), 4, true), 50);
  for (const route of ["roots", "frost", "forge", "crypt"]) {
    assert.equal(m.enemyCoreYield(e.enemyFor(5, route), 5, true), 60);
    assert.equal(m.enemyCoreYield(e.enemyFor(6, route), 6, true), 70);
    assert.equal(m.enemyCoreYield(e.enemyFor(7, route), 7, true), 80);
  }
  assert.ok(ecology.ECOLOGY[spec.id].floors.includes(12));
});

test("Day thirty never interrupts a live boss, including after reload and further rounds", () => {
  const before = fight();
  let s = act(before);
  assert.equal(s.phase, "combat");
  assert.equal(s.day, 60);
  assert.equal(s.journey.watches, 180);
  assert.equal(s.combat.id, before.combat.id);
  assert.equal(s.combat.round, 2);
  assert.equal(s.food, before.food - 1);
  s = reload(s);
  const food = s.food;
  s = act(s);
  assert.equal(s.phase, "combat");
  assert.equal(s.combat.round, 3);
  assert.equal(s.day, 60);
  assert.equal(s.food, food);
});

test("A late boss victory grants fifty cores once; its portal unlocks Floor 5 before teleportation", () => {
  let s = win(act(fight()), true);
  assert.equal(s.phase, "loot");
  assert.equal(s.lootReceipt.items["beast-core"], 50);
  const display = s.roundPlayback.events.flatMap((_, cursor) =>
    ui.defeatedGold(s.roundPlayback, cursor),
  );
  assert.equal(
    display.reduce((n, drop) => n + drop.amount, 0),
    50,
  );
  const seed = s.rng.loot;
  s = e.reducer(reload(s), { type: "FINISH_PLAYBACK" });
  s = e.reducer(s, { type: "COLLECT" });
  assert.equal(s.phase, "victory");
  assert.equal(s.journey.portal, true);
  assert.equal(s.inventory["beast-core"], 50);
  assert.equal(e.reducer(s, { type: "COLLECT" }).inventory["beast-core"], 50);
  s = e.reducer(reload(s), { type: "CONTINUE" });
  assert.equal(s.phase, "extraction");
  assert.equal(s.floor, 5);
  assert.ok(s.checkpoints.includes(5));
  assert.equal(s.inventory["beast-core"], 50);
  assert.equal(s.rng.loot, seed);
  assert.equal(s.day, 60);
  s = e.reducer(reload(s), { type: "RETURN" });
  assert.equal(s.phase, "town");
  assert.equal(s.startFloor, 5);
  assert.equal(s.inventory["beast-core"], 50);
  const gold = s.gold;
  s = e.reducer(s, {
    type: "SELL",
    id: "beast-core",
    quantity: 50,
    vendor: "provisioner",
  });
  assert.equal(s.gold - gold, 5000);
});

test("Ordinary fights also finish before closing, but do not grant an extra floor", () => {
  let s = act(fight(4, false));
  assert.equal(s.phase, "combat");
  s = win(s);
  assert.equal(s.phase, "loot");
  assert.ok(
    s.lootReceipt.items["beast-core"] >= 4 &&
      s.lootReceipt.items["beast-core"] <= 8,
  );
  s = e.reducer(s, { type: "COLLECT" });
  assert.equal(s.phase, "extraction");
  assert.equal(s.floor, 4);
  assert.ok(!s.checkpoints.includes(5));
});

test("Fleeing or falling at closing cannot award a boss victory or unlock its shortcut", () => {
  const s = fight();
  const fled = e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    flee: true,
    actions: [],
  });
  assert.equal(fled.phase, "extraction");
  assert.ok(!fled.checkpoints.includes(5));
  assert.equal(fled.inventory["beast-core"] || 0, 0);
  const doomed = {
    ...s,
    party: s.party.map((c) => ({ ...c, hp: 1 })),
    combat: {
      ...s.combat,
      round: 2,
      enemies: s.combat.enemies.map((f) => ({ ...f, atk: 99999, speed: 1000 })),
    },
  };
  const dead = act(doomed);
  assert.equal(dead.expedition.lost, true);
  assert.equal(dead.phase, "extraction");
  assert.ok(!dead.checkpoints.includes(5));
});

test("The final boss still permits the crown decision before closing", () => {
  let s = win(act(fight(12)));
  assert.equal(s.lootReceipt.items["beast-core"], 130);
  s = e.reducer(reload(s), { type: "COLLECT" });
  assert.equal(s.phase, "event");
  s = e.reducer(s, { type: "EVENT", choice: "seal", roll: 1 });
  assert.equal(s.phase, "extraction");
  assert.equal(s.ending, "Keeper of the Gate");
  assert.equal(s.inventory["hollow-crown"], 1);
  assert.equal(s.inventory["beast-core"], 130);
});

test("An unfinished boss save affected by the old extraction bug recovers without healing or rerolling", () => {
  const s = fight();
  const interrupted = {
    ...s,
    phase: "extraction",
    day: 60,
    journey: { ...s.journey, watches: 180 },
  };
  const resumed = reload(interrupted);
  assert.equal(resumed.phase, "combat");
  assert.deepEqual(plain(resumed.combat), plain(s.combat));
  assert.deepEqual(plain(resumed.rng), plain(s.rng));
  assert.equal(resumed.party[0].hp, s.party[0].hp);
  assert.equal(
    reload({ ...interrupted, expedition: { ...s.expedition, lost: true } })
      .phase,
    "extraction",
  );
  assert.equal(
    reload({
      ...interrupted,
      phase: "town",
      journey: { ...interrupted.journey, startDay: null },
    }).phase,
    "town",
  );
});
console.log(`${count} closing and core-scaling checks passed.`);
