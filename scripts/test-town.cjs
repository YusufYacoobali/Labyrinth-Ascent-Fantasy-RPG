const { portalArrival, toward, travel } = require("./map-helpers.cjs");
const assert = require("node:assert/strict");
const { e, w, town } = require("./engine-loader.cjs");
const create = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
const reduce = require("./round-helpers.cjs").act;
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function sign(s, id) {
  const r = e.RECRUITS.find((r) => r.id === id);
  s = reduce(s, { type: "TALK", id, choice: "strengths" });
  s = reduce(s, { type: "TALK", id, choice: r.motive });
  return reduce(s, {
    type: "RECRUIT",
    id,
    offer: e.recruitShare(s, r),
  });
}
const arrival = () =>
  reduce(reduce({ ...create(), day: 30, food: 40 }, { type: "ENTER" }), {
    type: "MISSION",
    id: "survey",
  });
const arena = () =>
  reduce(
    reduce(portalArrival(arrival()), {
      type: "APPROACH",
      choice: "listen",
      roll: 0.5,
    }),
    {
      type: "ENGAGE",
    },
  );

test("Catalog is unique, priced, stocked and all recipes reference real materials", () => {
  assert.ok(w.ITEMS.length >= 30);
  assert.equal(new Set(w.ITEMS.map((i) => i.id)).size, w.ITEMS.length);
  assert.equal(e.RECRUITS.length, 10);
  assert.equal(new Set(e.RECRUITS.map((r) => r.id)).size, 10);
  assert.equal(w.QUESTS.length, 9);
  for (const i of w.ITEMS) {
    assert.ok(i.price >= 0 && i.sell >= 0);
    if (i.kind !== "loot") assert.ok(i.price > i.sell);
  }
  for (const recipe of town.RECIPES) {
    assert.ok(w.ITEMS.find((i) => i.id === recipe.id));
    assert.ok(recipe.materials.length);
    for (const m of recipe.materials)
      assert.ok(m.quantity > 0 && w.ITEMS.find((i) => i.id === m.id));
  }
});
test("Six new recruits have distinct artwork and usable roles; hero mage roll stays 5%", () => {
  const recruits = e.RECRUITS.filter((r) => r.portrait >= 12);
  assert.equal(recruits.length, 6);
  assert.equal(new Set(recruits.map((r) => r.portrait)).size, 6);
  for (const r of recruits) {
    const c = e.makeCharacter(r.race, r.id, r.name);
    assert.equal(c.job, r.job);
    assert.ok(c.skills.every((k) => e.SKILLS.some((s) => s.name === k)));
    assert.ok(c.maxHp > 0 && c.maxMp > 0);
  }
  assert.ok(
    e.makeCharacter("elf", "elowen", "Elowen").skills.includes("Second Wind"),
  );
  assert.ok(
    e.makeCharacter("human", "mira", "Mira").skills.includes("Arcane Bolt"),
  );
  assert.equal(e.makeCharacter("human", "hero", "Rowan", 0.05).job, "Knight");
  assert.equal(e.makeCharacter("human", "hero", "Rowan", 0.049).job, "Mage");
});
test("Veterans stay locked, then arrive with earned-tier levels", () => {
  const s = create();
  assert.equal(reduce(s, { type: "RECRUIT", id: "torren" }).gold, s.gold);
  assert.equal(
    reduce(s, { type: "TALK", id: "torren", choice: "strengths" }),
    s,
  );
  const t = sign({ ...s, bestFloor: 3 }, "torren");
  assert.equal(t.party[1].level, 3);
  const locked = sign({ ...s, bestFloor: 3 }, "eira");
  assert.equal(locked.party.length, 1);
  const f = sign({ ...s, bestFloor: 6 }, "eira");
  assert.equal(f.party[1].level, 4);
});
test("Signing, benching and returning preserve unique progress, roles and mage identity", () => {
  let s = sign(create(), "mira");
  const gold = s.gold;
  const c = s.party[1];
  s = reduce(s, { type: "BENCH", id: "mira" });
  s = reduce(s, { type: "RECRUIT", id: "mira" });
  assert.equal(s.gold, gold);
  assert.deepEqual(
    JSON.parse(JSON.stringify(s.party[1])),
    JSON.parse(JSON.stringify(c)),
  );
  assert.deepEqual(Array.from(s.townProgress.signed), ["mira"]);
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(s.party[1].job, "Mage");
  assert.equal(s.party[1].portrait, 13);
});
test("Equipment changes capacities and speed without healing or stacking bonuses", () => {
  let s = {
    ...create(),
    inventory: {
      "traveler-cloak": 1,
      leather: 1,
      "scout-dagger": 1,
      "iron-blade": 1,
    },
  };
  s.party[0] = { ...s.party[0], hp: 60, mp: 20 };
  const base = s.party[0];
  s = reduce(s, { type: "EQUIP", character: "hero", item: "traveler-cloak" });
  assert.equal(s.party[0].maxHp, base.maxHp + 30);
  assert.equal(s.party[0].hp, 60);
  s = reduce(s, { type: "EQUIP", character: "hero", item: "leather" });
  assert.equal(s.party[0].maxHp, base.maxHp);
  assert.equal(s.party[0].hp, 60);
  s = reduce(s, { type: "EQUIP", character: "hero", item: "scout-dagger" });
  assert.equal(s.party[0].speed, base.speed + 5);
  s = reduce(s, { type: "EQUIP", character: "hero", item: "iron-blade" });
  assert.equal(s.party[0].speed, base.speed);
});
test("Each recipe consumes exactly its materials and gold; locked recipes are atomic", () => {
  for (const recipe of town.RECIPES) {
    const s = {
      ...create(),
      bestFloor: recipe.floor || 0,
      gold: 10000,
      inventory: Object.fromEntries(
        recipe.materials.map((m) => [m.id, m.quantity]),
      ),
    };
    const next = reduce(s, { type: "CRAFT", id: recipe.id });
    assert.equal(next.gold, s.gold - recipe.gold);
    assert.equal(next.inventory[recipe.id], 1);
    assert.equal(next.townProgress.crafted, 1);
    for (const m of recipe.materials) assert.equal(next.inventory[m.id], 0);
    const again = reduce(next, { type: "CRAFT", id: recipe.id });
    assert.equal(again.gold, next.gold);
    assert.equal(again.townProgress.crafted, 1);
    if (recipe.floor) {
      const locked = reduce(
        { ...s, bestFloor: 0 },
        { type: "CRAFT", id: recipe.id },
      );
      assert.equal(locked.gold, s.gold);
      assert.deepEqual(locked.inventory, s.inventory);
    }
  }
});
test("Town contracts track unique recruits, training, crafting and actual kills", () => {
  let s = { ...create(), gold: 500 };
  for (const id of ["elowen", "mira", "finn"]) s = sign(s, id);
  assert.equal(e.questProgress(s, "trusted-company"), 3);
  s = reduce(s, { type: "TRAIN" });
  s = reduce(s, { type: "TRAIN" });
  s = reduce(s, { type: "TRAIN" });
  assert.equal(e.questProgress(s, "ready-for-gate"), 2);
  s = reduce(s, { type: "ACCEPT", id: "trusted-company" });
  const first = reduce(s, { type: "CLAIM", id: "trusted-company" });
  assert.equal(first.gold, s.gold + 180);
  assert.equal(
    reduce(first, { type: "CLAIM", id: "trusted-company" }).gold,
    first.gold,
  );
  assert.equal(e.questProgress({ ...s, kills: 8 }, "seasoned-hunter"), 8);
});
test("Core delivery consumes three cores once and is blocked when materials are missing", () => {
  let s = { ...create(), inventory: { "beast-core": 2 } };
  s = reduce(s, { type: "ACCEPT", id: "quartermaster" });
  assert.equal(reduce(s, { type: "CLAIM", id: "quartermaster" }).gold, s.gold);
  s = { ...s, inventory: { "beast-core": 3 } };
  const reward = reduce(s, { type: "CLAIM", id: "quartermaster" });
  assert.equal(reward.inventory["beast-core"], 0);
  assert.equal(reward.gold, s.gold + 220);
  assert.equal(
    reduce(reward, { type: "CLAIM", id: "quartermaster" }).gold,
    reward.gold,
  );
});
test("Torch is consumed once, survives reload and cannot be used in combat", () => {
  let s = { ...arrival(), inventory: { torch: 2 } };
  const atk = s.enemy.atk;
  s = reduce(s, { type: "USE_SUPPLY", id: "torch" });
  assert.equal(s.enemy.atk, Math.round(atk * 0.92));
  assert.equal(s.inventory.torch, 1);
  assert.equal(s.arrivalScouted, true);
  s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  const repeated = reduce(s, { type: "USE_SUPPLY", id: "torch" });
  assert.equal(repeated.enemy.atk, s.enemy.atk);
  assert.equal(repeated.inventory.torch, 1);
  const combat = { ...s, phase: "combat" };
  assert.equal(
    reduce(combat, { type: "USE_SUPPLY", id: "torch" }).inventory.torch,
    1,
  );
});

test("Keys unlock both treasure encounters safely and rewards cannot be repeated", () => {
  for (const floor of [2, 10]) {
    const s = {
      ...create(),
      floor,
      phase: "event",
      inventory: { "labyrinth-key": 2 },
    };
    const result = reduce(s, { type: "USE_SUPPLY", id: "labyrinth-key" });
    assert.equal(result.phase, "exploration");
    assert.equal(result.inventory["labyrinth-key"], 1);
    assert.ok(result.gold > s.gold);
    assert.ok(result.inventory["relic-fragment"] > 0);
    assert.equal(result.party[0].hp, s.party[0].hp);
    assert.equal(
      reduce(result, { type: "USE_SUPPLY", id: "labyrinth-key" }).gold,
      result.gold,
    );
  }
});
test("Bandages treat the selected ally only and spend one turn", () => {
  let s = arena();
  assert.equal(s.phase, "combat");
  s = {
    ...s,
    turn: 2,
    inventory: { bandage: 1 },
    party: [
      { ...s.party[0], hp: 20, ailments: { poison: 2, paralysis: 0 } },
      { ...e.makeCharacter("elf", "elowen", "Elowen"), hp: 40 },
    ],
  };
  const next = reduce(s, {
    type: "BATTLE",
    kind: "item",
    item: "bandage",
    actor: "hero",
    roll: 0.5,
  });
  assert.ok(next.party[0].hp > 20 && next.party[0].hp <= 110);
  assert.equal(next.party[0].ailments.poison, 0);
  assert.equal(next.party[1].hp, 40);
  assert.equal(next.combat.round, s.combat.round + 1);
  assert.equal(next.inventory.bandage, 0);
});
test("Legacy saves gain town defaults without resetting names, jobs, inventories or health", () => {
  const s = sign(create(), "mira");
  const original = s.party[1];
  delete s.townProgress;
  delete s.usedSupplies;
  const migrated = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(migrated.party[1].job, original.job);
  assert.equal(migrated.party[1].hp, original.hp);
  assert.equal(JSON.stringify(migrated.inventory), JSON.stringify(s.inventory));
  assert.deepEqual(Array.from(migrated.townProgress.signed), ["mira"]);
  assert.deepEqual(Array.from(migrated.usedSupplies), []);
});
test("Monster cores defer currency to town and never charge town work or upfront fees", () => {
  let s = sign(create(), "kael");
  s = sign(s, "mira");
  assert.equal(s.gold, 80);
  assert.equal(s.contracts.kael, 18);
  assert.equal(s.contracts.mira, 22);
  s = reduce(s, { type: "WORK" });
  assert.equal(s.gold, 205);
  s = reduce({ ...s, day: 30 }, { type: "ENTER" });
  s = reduce(s, { type: "MISSION", id: "survey" });
  s = reduce(portalArrival(s), {
    type: "APPROACH",
    choice: "listen",
    roll: 0.5,
  });
  s = reduce(s, { type: "ENGAGE" });
  s = { ...s, enemy: { ...s.enemy, hp: 1 } };
  s.enemy.species = "goblin";
  const before = s.gold;
  s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.runGross, 0);
  assert.equal(s.expedition.accruedShares.kael || 0, 0);
  assert.equal(s.expedition.accruedShares.mira || 0, 0);
  assert.equal(s.runGold, 0);
  assert.equal(s.gold, before);
  assert.ok(s.inventory["beast-core"] > 0);
  assert.deepEqual(Object.keys(s.runPaid), []);
  const loaded = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(JSON.stringify(loaded.runPaid), JSON.stringify(s.runPaid));
  assert.equal(JSON.stringify(loaded.contracts), JSON.stringify(s.contracts));
});
test("Share negotiation rejects invalid offers and keeps waiting companions on agreed terms", () => {
  const penniless = sign({ ...create(), gold: 0 }, "mira");
  assert.equal(penniless.party.length, 2);
  assert.equal(penniless.gold, 0);
  for (const offer of [-1, 0, 51, 14.5, NaN, Infinity]) {
    const s = create();
    assert.equal(
      reduce(s, { type: "RECRUIT", id: "kael", offer }).party.length,
      1,
    );
  }
  let s = sign(create(), "kael");
  s = reduce(s, { type: "BENCH", id: "kael" });
  s = reduce(s, { type: "RECRUIT", id: "kael", offer: 35 });
  assert.equal(s.contracts.kael, 18);
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.contracts;
  raw.rapport.kael.offer = 365;
  const loaded = e.normalizeSave(raw);
  assert.equal(
    loaded.contracts.kael,
    e.recruitShare(
      s,
      e.RECRUITS.find((r) => r.id === "kael"),
    ),
  );
  assert.equal(loaded.rapport.kael.offer, 14);
  const richShares = {
    ...create(),
    contracts: { kael: 35, lyria: 35 },
    party: [
      create().party[0],
      e.makeCharacter("human", "kael", "Kael"),
      e.makeCharacter("elf", "lyria", "Lyria"),
    ],
  };
  assert.equal(
    reduce(richShares, { type: "RECRUIT", id: "bram" }).party.length,
    3,
  );
});
test("Town conversations reveal only learned floor information, persist and cannot repeat", () => {
  let s = create();
  assert.equal(s.knownFloors.length, 0);
  assert.equal(reduce(s, { type: "RUMOUR", id: "fourfold-gate" }), s);
  s = reduce(s, { type: "RUMOUR", id: "camp-watch" });
  assert.deepEqual(Array.from(s.knownFloors), [1]);
  assert.equal(reduce(s, { type: "RUMOUR", id: "camp-watch" }), s);
  s = reduce(s, { type: "TALK", id: "lyria", choice: "strengths" });
  assert.ok(s.knownFloors.includes(2));
  assert.ok(!s.knownFloors.includes(12));
  const loaded = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(
    JSON.stringify(loaded.knownFloors),
    JSON.stringify(s.knownFloors),
  );
});
test("Spending a day at an opening requires an explicit skip decision", () => {
  const s = { ...create(), day: 30, food: 40 };
  for (const type of ["REST", "WORK", "TRAIN"]) {
    assert.ok(e.needsGateConfirmation(s, { type }));
    const blocked = reduce(s, { type });
    assert.equal(blocked.day, 30);
    assert.equal(blocked.gold, s.gold);
    const accepted = reduce(s, { type, skipOpening: true });
    assert.equal(accepted.day, 31);
    assert.equal(e.daysToGate(accepted.day), 29);
  }
  assert.equal(
    e.needsGateConfirmation(s, { type: "BUY_ITEM", id: "torch" }),
    false,
  );
  assert.equal(
    e.needsGateConfirmation({ ...s, gold: 0 }, { type: "TRAIN" }),
    false,
  );
});
test("Head and boot equipment have independent slots, real bonuses and persisted swaps", () => {
  let s = {
    ...create(),
    inventory: {
      "iron-blade": 1,
      leather: 1,
      "iron-helm": 1,
      "scout-boots": 1,
      "frost-boots": 1,
      "warden-helm": 1,
      "frost-charm": 1,
    },
  };
  for (const item of [
    "iron-blade",
    "leather",
    "iron-helm",
    "scout-boots",
    "frost-charm",
  ])
    s = reduce(s, { type: "EQUIP", character: "hero", item });
  assert.equal(s.party[0].equipment.length, 5);
  assert.equal(s.party[0].atk, 32);
  assert.equal(s.party[0].def, 25);
  assert.equal(s.party[0].speed, 15);
  s = reduce(s, { type: "EQUIP", character: "hero", item: "warden-helm" });
  s = reduce(s, { type: "EQUIP", character: "hero", item: "frost-boots" });
  assert.equal(s.party[0].equipment.length, 5);
  assert.equal(s.party[0].def, 29);
  assert.equal(s.party[0].speed, 16);
  assert.equal(s.party[0].maxHp, 155);
  assert.equal(s.party[0].hp, 140);
  assert.equal(e.resist(s.party[0], "frost"), 50);
  assert.equal(e.resist(s.party[0], "physical"), 10);
  assert.equal(s.inventory["iron-helm"], 1);
  assert.equal(s.inventory["scout-boots"], 1);
  const loaded = e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(
    JSON.stringify(loaded.party[0].equipment),
    JSON.stringify(s.party[0].equipment),
  );
  assert.equal(loaded.party[0].def, 29);
});
console.log(count + " town content checks passed.");
