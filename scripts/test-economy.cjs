const assert = require("node:assert/strict");
const {
  e,
  w,
  town,
  monsters,
  treasure,
  director,
  exploration: x,
  survival,
  balance: { BALANCE: B },
  factionOpportunities: factions,
} = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  console.log("PASS " + name);
  count++;
};
const fresh = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Climber",
    seed: 42,
    roll: 0.5,
  });
const reload = (s) => e.normalizeSave(JSON.parse(JSON.stringify(s)));
const field = () =>
  e.reducer(
    { ...fresh(), day: 30, food: 40 },
    { type: "ENTER", mission: "survey" },
  );

test("Every ration purchase is thirty days of food for exactly fifty gold, including season and discounts", () => {
  const rations = w.ITEMS.find((i) => i.id === "rations");
  assert.equal(rations.quantity, 30);
  for (const day of [1, 24, 27, 30, 60]) {
    const s = { ...fresh(), day, faction: { guild: 100, stag: 100 } };
    assert.equal(e.buyPrice(rations, day, s), 50);
    for (const action of [
      { type: "BUY_ITEM", id: "rations" },
      { type: "BUY", item: "food" },
    ]) {
      const bought = e.reducer(s, action);
      assert.equal(bought.gold, s.gold - 50);
      assert.equal(bought.food, s.food + 30);
    }
  }
  const s = fresh();
  const batch = e.reducer(s, {
    type: "BUY_BATCH",
    items: [{ id: "rations", quantity: 2 }],
  });
  assert.equal(batch.gold, s.gold - 100);
  assert.equal(batch.food, s.food + 60);
  const poor = { ...s, gold: 49 };
  assert.equal(
    e.reducer(poor, { type: "BUY_ITEM", id: "rations" }).food,
    poor.food,
  );
  const bought = e.reducer(s, { type: "BUY_ITEM", id: "rations" });
  let journey = e.reducer(
    { ...bought, day: 30 },
    { type: "ENTER", mission: "survey" },
  );
  journey = survival.passTime(journey, 174, { rest: true });
  assert.equal(journey.phase, "extraction");
  assert.equal(journey.food, 1);
  assert.ok(journey.party.every((c) => c.hp > 0 && c.exhaustion === 0));
});

test("A monster core sells for one hundred gold everywhere, independently of its floor-scaled drop quantity", () => {
  const core = w.ITEMS.find((i) => i.id === "beast-core");
  for (const vendor of ["provisioner", "alchemist", "emporium", "guild"]) {
    assert.equal(e.sellPrice(core, vendor), 100);
    const s = { ...fresh(), inventory: { "beast-core": 3 } };
    const sold = e.reducer(s, {
      type: "SELL",
      id: core.id,
      vendor,
      quantity: 3,
    });
    assert.equal(sold.gold, s.gold + 300);
    assert.equal(sold.inventory[core.id], 0);
  }
  assert.match(core.description, /shop/);
  assert.doesNotMatch(core.description, /guild/);
  for (const spec of monsters.MONSTERS)
    assert.equal(
      monsters.monsterCoreYield(spec),
      monsters.monsterCoreYield({ ...spec, gold: spec.gold * 100 }),
    );
});

test("No recipe or commission requires monster cores, and all tempering tiers need gold alone", () => {
  for (const recipe of town.RECIPES)
    assert.ok(recipe.materials.every((m) => m.id !== "beast-core"));
  for (const commission of factions.FACTION_OPPORTUNITIES)
    assert.notEqual(commission.material, "beast-core");
  let s = {
    ...fresh(),
    gold: 5000,
    bestFloor: 12,
    inventory: { "beast-core": 7 },
  };
  const base = s.party[0].atk;
  for (let i = 0; i < B.tempering.length; i++) {
    const gold = s.gold;
    s = e.reducer(s, { type: "FORGE", id: "hero" });
    assert.equal(s.party[0].gear, i + 1);
    assert.equal(s.gold, gold - B.tempering[i].gold);
    assert.equal(s.inventory["beast-core"], 7);
  }
  assert.equal(s.party[0].atk, base + 12);
  assert.equal(e.reducer(s, { type: "FORGE", id: "hero" }).gold, s.gold);
  for (const id of [
    "iron-blade",
    "iron-helm",
    "scout-boots",
    "leather",
    "scout-dagger",
  ]) {
    const crafted = e.reducer(
      { ...fresh(), gold: 1000, inventory: {} },
      { type: "CRAFT", id },
    );
    assert.equal(crafted.inventory[id], 1, id);
  }
});

test("Town jobs pay at most eighty a day; long guild work and training plans earn at most five hundred", () => {
  for (const payLimit of [undefined, 999999, 20, 0, -1, NaN, Infinity]) {
    const s = fresh(),
      next = e.reducer(s, { type: "WORK", payLimit });
    assert.equal(next.day, s.day + 1);
    assert.ok(next.gold - s.gold >= 0 && next.gold - s.gold <= 80);
  }
  assert.equal(e.reducer(fresh(), { type: "WORK" }).gold, 380);
  for (const mode of ["work", "train", "rest"])
    for (const day of [1, 12, 24, 29]) {
      const s = { ...fresh(), gold: 1000, day };
      const next = e.reducer(s, { type: "PREPARE_CYCLE", mode });
      const trainingCost =
        (next.townProgress.trained - s.townProgress.trained) * 60;
      const earned = next.gold - s.gold + trainingCost;
      assert.ok(earned >= 0 && earned <= 500, mode + ": " + earned);
      if (mode === "work") assert.equal(earned, Math.min(500, (30 - day) * 80));
      if (mode === "rest") assert.equal(earned, 0);
      assert.equal(next.day, 30);
      assert.equal(
        e.reducer(reload(next), { type: "PREPARE_CYCLE", mode }).gold,
        next.gold,
      );
    }
});

test("Random chest draws cover fifty to one thousand gold and are deterministic across save/load", () => {
  let seed = 42;
  const amounts = new Set();
  for (let i = 0; i < 10000; i++) {
    const draw = treasure.rollTreasureGold(seed);
    assert.deepEqual(draw, treasure.rollTreasureGold(seed));
    assert.ok(
      Number.isInteger(draw.gold) && draw.gold >= 50 && draw.gold <= 1000,
    );
    amounts.add(draw.gold);
    seed = draw.seed;
  }
  assert.equal(Math.min(...amounts), 50);
  assert.equal(Math.max(...amounts), 1000);
  assert.ok(amounts.size > 900);
  let s = field();
  const room = Object.keys(s.expedition.director.encounters["1"]).find(
    (id) => s.expedition.director.encounters["1"][id].kind === "cache",
  );
  s = x.enterMappedRoom(s, room);
  const found = e.reducer(s, {
    type: "BRANCH_CHOICE",
    choice: "careful",
    roll: 1,
  });
  const loaded = e.reducer(reload(s), {
    type: "BRANCH_CHOICE",
    choice: "careful",
    roll: 1,
  });
  assert.equal(found.gold, loaded.gold);
  assert.equal(found.discoveryReceipt.gold, found.gold - s.gold);
  assert.ok(found.gold - s.gold >= 50 && found.gold - s.gold <= 1000);
  const repeated = e.reducer(
    {
      ...reload(found),
      phase: "branch",
      journey: { ...found.journey, branch: s.journey.branch },
    },
    { type: "BRANCH_CHOICE", choice: "careful", roll: 1 },
  );
  assert.equal(repeated.gold, found.gold);
  assert.equal(repeated.rng.loot, found.rng.loot);
});

test("Caravan and vault treasure, including keyed compartments, stay within the same gold range", () => {
  for (const [floor, choices] of [
    [2, ["careful", "rush"]],
    [10, ["pick", "force", "leave"]],
  ]) {
    for (const choice of choices) {
      const s = { ...field(), floor, phase: "event", eventResolved: false };
      const next = e.reducer(s, { type: "EVENT", choice, roll: 0.5 });
      assert.ok(next.gold - s.gold >= 50 && next.gold - s.gold <= 1000);
      assert.equal(
        e.reducer(reload(next), { type: "EVENT", choice, roll: 0.5 }).gold,
        next.gold,
      );
    }
    const s = {
      ...field(),
      floor,
      phase: "event",
      eventResolved: false,
      inventory: { "labyrinth-key": 1 },
    };
    const keyed = e.reducer(s, { type: "USE_SUPPLY", id: "labyrinth-key" });
    assert.ok(keyed.gold - s.gold >= 50 && keyed.gold - s.gold <= 1000);
  }
});

test("First-floor patrol prose describes fortifications and a visible goblin in every variant", () => {
  for (const variant of ["ambush", "elite", "patrol"]) {
    const text = director.patrolApproach(1, variant);
    assert.match(text, /goblin/i);
    assert.match(text, /crate|shield|barricade/i);
    assert.doesNotMatch(text, /this month|expedition remain/);
  }
});
console.log(`${count} economy checks passed.`);
