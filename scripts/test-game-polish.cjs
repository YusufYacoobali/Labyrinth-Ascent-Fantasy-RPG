const assert = require("node:assert/strict");
const {
  e,
  w,
  monsters,
  exploration: ex,
  trial,
  characterStats: { characterStat },
  survival,
} = require("./engine-loader.cjs");
const plain = (value) => JSON.parse(JSON.stringify(value));
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function expedition(seed = 42) {
  let state = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Scout",
    roll: 0.5,
    seed,
  });
  return e.reducer({ ...state, day: 30 }, { type: "ENTER" });
}
function chest(state) {
  const room = Object.entries(state.expedition.director.encounters["1"]).find(
    ([, slot]) => slot.kind === "cache",
  )[0];
  return ex.enterMappedRoom({ ...state, phase: "exploration" }, room);
}

test("Every first floor has two item chests outside named NPC rooms", () => {
  for (const seed of [1, 2, 3, 7, 42, 99, 123, 1250, 9851]) {
    const state = expedition(seed);
    const chests = Object.entries(
      state.expedition.director.encounters["1"],
    ).filter(([, slot]) => slot.kind === "cache");
    assert.ok(chests.length >= 2, "seed " + seed);
    for (const [room] of chests)
      assert.ok(
        !Object.values(state.expedition.director.npcs).some(
          (npc) => npc?.map === "1" && npc.room === room,
        ),
      );
  }
});
test("Opening a chest reveals actual equipment and exact net coins once, including after reload", () => {
  const before = chest(expedition());
  const found = e.reducer(before, {
    type: "BRANCH_CHOICE",
    choice: "careful",
    roll: 1,
  });
  const receipt = found.discoveryReceipt;
  assert.equal(receipt.title, "Chest opened");
  assert.ok(
    Object.keys(receipt.items).some((id) =>
      ["weapon", "armor", "helmet", "boots", "charm"].includes(
        w.ITEMS.find((i) => i.id === id)?.kind,
      ),
    ),
  );
  assert.equal(receipt.gold, found.gold - before.gold);
  for (const [id, quantity] of Object.entries(receipt.items))
    assert.equal(quantity, found.inventory[id] - (before.inventory[id] || 0));
  const loaded = e.normalizeSave(plain(found));
  assert.deepEqual(plain(loaded.discoveryReceipt), plain(receipt));
  const dismissed = e.reducer(loaded, { type: "ACK_DISCOVERY" });
  const repeated = e.reducer(
    {
      ...dismissed,
      phase: "branch",
      journey: { ...dismissed.journey, branch: before.journey.branch },
    },
    { type: "BRANCH_CHOICE", choice: "careful", roll: 1 },
  );
  assert.equal(repeated.gold, found.gold);
  assert.deepEqual(plain(repeated.inventory), plain(found.inventory));
  assert.equal(
    e.reducer(dismissed, { type: "ACK_DISCOVERY" }).discoveryReceipt,
    null,
  );
});
test("Cash-only event finds also receive a collection screen after companion shares", () => {
  let state = expedition();
  state = {
    ...state,
    phase: "branch",
    runContracts: { kael: 20 },
    journey: {
      ...state.journey,
      branch: {
        id: ex.encounterKey(state),
        kind: "company",
        direction: "left",
      },
    },
    expedition: {
      ...state.expedition,
      generic: {
        [ex.encounterKey(state)]: {
          id: "generic.lantern",
          variant: 0,
          resolved: false,
        },
      },
    },
  };
  const found = e.reducer(state, {
    type: "GENERIC_CHOICE",
    room: ex.encounterKey(state),
    id: "generic.lantern",
    choice: "help",
  });
  assert.equal(found.discoveryReceipt.gold, 16);
  assert.equal(found.expedition.accruedShares.kael, 4);
  assert.equal(found.food, state.food - 1);
});
test("Monster drops contain cores, optional essence, trophies and carried gear; guild trade pays once", () => {
  for (const monster of monsters.MONSTERS) {
    const { items } = monsters.monsterDrops(monster, 123456);
    assert.equal(items["beast-core"], monsters.monsterCoreYield(monster));
    assert.ok(
      Object.keys(items).every(
        (id) =>
          id === "beast-core" ||
          id.startsWith("essence-") ||
          (monster.equipment || []).includes(id) ||
          id === monster.trophy,
      ),
    );
  }
  const state = {
    ...e.initialGame(),
    started: true,
    inventory: { "beast-core": 4 },
  };
  const sold = e.reducer(state, {
    type: "SELL",
    id: "beast-core",
    vendor: "guild",
    quantity: 4,
  });
  assert.equal(sold.gold - state.gold, 4 * monsters.CORE_TRADE_VALUE);
  assert.equal(sold.inventory["beast-core"], 0);
  assert.equal(
    e.reducer(sold, {
      type: "SELL",
      id: "beast-core",
      vendor: "guild",
      quantity: 4,
    }).gold,
    sold.gold,
  );
});
test("Every emitted ally and enemy action remains in chronological history across rounds and saves", () => {
  let state = trial.trialSave(trial.DEFAULT_TRIAL);
  state.combat.enemies = state.combat.enemies.map((foe) => ({
    ...foe,
    hp: 100000,
    maxHp: 100000,
    atk: 1,
  }));
  state.party = state.party.map((c) => ({ ...c, hp: 10000, maxHp: 10000 }));
  const events = [];
  for (let i = 0; i < 4; i++) {
    const result = e.reducer(state, {
      type: "ROUND",
      battleId: state.combat.id,
      round: state.combat.round,
      animate: true,
      actions: state.party
        .filter((c) => c.hp > 0 && !c.ailments.paralysis)
        .map((c) => ({ actor: c.id, kind: "guard", target: c.id })),
    });
    assert.ok(result.roundPlayback);
    events.push(
      ...result.roundPlayback.events.map(
        ({ id, actor, target, text, kind }) => ({
          id,
          round: state.combat.round,
          actor,
          target,
          text,
          kind,
        }),
      ),
    );
    state = e.reducer(result, { type: "FINISH_PLAYBACK" });
  }
  assert.deepEqual(plain(state.combat.history), plain(events));
  assert.ok(events.length > 8);
  assert.ok(
    events.some((event) => state.party.some((c) => c.id === event.actor)),
  );
  assert.ok(
    events.some((event) =>
      state.combat.enemies.some((foe) => foe.id === event.actor),
    ),
  );
  assert.deepEqual(
    plain(e.normalizeSave(plain(state)).combat.history),
    plain(events),
  );
  assert.deepEqual(
    plain(state.expedition.battles[state.combat.id].history),
    plain(events),
  );
});
test("Core value completes salvage missions and the report includes the paid guild reward", () => {
  const initial = expedition();
  const state = {
    ...initial,
    phase: "extraction",
    inventory: { ...initial.inventory, "beast-core": 8 },
    journey: { ...initial.journey, watches: 180, mission: "salvage" },
    expedition: {
      ...initial.expedition,
      unsecured: {
        ...initial.expedition.unsecured,
        inventory: { "beast-core": 8 },
      },
    },
  };
  assert.equal(ex.missionProgress(state), 800);
  const returned = e.reducer(state, { type: "RETURN" });
  assert.equal(returned.gold - state.gold, 200);
  assert.equal(returned.lastReport.missionReward, 200);
});
test("Game modules have no runtime circular imports after TypeScript erases type-only references", () => {
  const fs = require("node:fs"),
    path = require("node:path"),
    ts = require("typescript");
  const graph = new Map();
  for (const name of fs
    .readdirSync("src/game")
    .filter((name) => name.endsWith(".ts"))) {
    const file = path.resolve("src/game", name);
    const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    graph.set(
      file,
      [...js.matchAll(/require\(["'](\.\/?[^"']+)["']\)/g)].map((match) =>
        path.resolve(path.dirname(file), match[1] + ".ts"),
      ),
    );
  }
  const complete = new Set();
  function visit(file, stack = []) {
    assert.ok(
      !stack.includes(file),
      "Require cycle: " +
        [...stack, file].map((p) => path.basename(p)).join(" -> "),
    );
    if (complete.has(file) || !graph.has(file)) return;
    for (const dependency of graph.get(file))
      visit(dependency, [...stack, file]);
    complete.add(file);
  }
  for (const file of graph.keys()) visit(file);
});
function equippedFixture() {
  return e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Smith",
    roll: 0.5,
    seed: 42,
  });
}
function equip(state, item) {
  return e.reducer(
    { ...state, inventory: { ...state.inventory, [item]: 1 } },
    { type: "EQUIP", character: "hero", item },
  );
}
test("Stat presentation preserves bare stats and combat totals", () => {
  const c = equippedFixture().party[0];
  for (const stat of ["atk", "def", "speed", "maxHp", "maxMp"])
    assert.deepEqual(plain(characterStat(c, stat)), {
      base: c[stat],
      bonus: 0,
      total: c[stat],
    });
});
test("Weapon swaps replace the green bonus without changing base attack", () => {
  const start = equippedFixture();
  const base = start.party[0].atk;
  const first = equip(start, "chipped-blade");
  const second = equip(first, "iron-blade");
  assert.deepEqual(plain(characterStat(first.party[0], "atk")), {
    base,
    bonus: 3,
    total: base + 3,
  });
  assert.deepEqual(plain(characterStat(second.party[0], "atk")), {
    base,
    bonus: 7,
    total: base + 7,
  });
});
test("Multiple armor slots and boots split defense and speed independently", () => {
  const start = equippedFixture();
  const state = ["leather", "warden-helm", "scout-boots"].reduce(equip, start);
  for (const [stat, bonus] of [
    ["def", 14],
    ["speed", 3],
    ["maxHp", 15],
  ])
    assert.deepEqual(plain(characterStat(state.party[0], stat)), {
      base: start.party[0][stat],
      bonus,
      total: state.party[0][stat],
    });
});
test("Tempering stacks with the weapon bonus and survives reload", () => {
  const start = equippedFixture();
  let state = equip(start, "iron-blade");
  state = e.reducer(
    { ...state, gold: 250, inventory: { ...state.inventory, "beast-core": 2 } },
    { type: "FORGE", id: "hero" },
  );
  const c = e.normalizeSave(plain(state)).party[0];
  assert.equal(c.gear, 1);
  assert.deepEqual(plain(characterStat(c, "atk")), {
    base: start.party[0].atk,
    bonus: 13,
    total: c.atk,
  });
  assert.deepEqual(plain(characterStat(c, "def")), {
    base: start.party[0].def,
    bonus: 2,
    total: c.def,
  });
});
test("Heavy equipment shows a negative speed modifier without hiding its attack bonus", () => {
  const start = equippedFixture();
  const c = equip(start, "iron-pike").party[0];
  assert.deepEqual(plain(characterStat(c, "speed")), {
    base: start.party[0].speed,
    bonus: -2,
    total: c.speed,
  });
  assert.ok(characterStat(c, "atk").bonus > 0);
});
test("MP gear stacks across slots while base MP stays unchanged", () => {
  const start = equippedFixture();
  const c = ["spark-focus", "moon-robe", "dawn-amulet"].reduce(equip, start)
    .party[0];
  assert.deepEqual(plain(characterStat(c, "maxMp")), {
    base: start.party[0].maxMp,
    bonus: 60,
    total: c.maxMp,
  });
});
test("Equipment HP bonuses reflect injury scaling and rounding", () => {
  const start = equippedFixture();
  const injured = survival.setInjuries(start.party[0], 2);
  const state = equip({ ...start, party: [injured] }, "warden-helm");
  const c = state.party[0];
  const split = characterStat(c, "maxHp");
  assert.equal(split.base, injured.maxHp);
  assert.equal(split.bonus, c.maxHp - injured.maxHp);
  assert.equal(split.base + split.bonus, c.maxHp);
  assert.ok(split.bonus > 0 && split.bonus < 15);
});
console.log(`${count} polish regression checks passed.`);
