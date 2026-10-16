const assert = require("node:assert/strict");
const {
  e,
  w,
  town,
  monsters: m,
  progression: p,
  combatData: data,
  saves,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
const act = require("./round-helpers.cjs").act;
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const create = (seed = 42) =>
  act(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Rowan",
    roll: 0.5,
    seed,
  });
function battle(seed = 42) {
  let s = act({ ...create(seed), day: 30, food: 40 }, { type: "ENTER" });
  s = act(s, { type: "MISSION", id: "survey" });
  s = { ...s, journey: { ...s.journey, defender: true, room: "portal" } };
  s = act(s, { type: "APPROACH", choice: "listen", roll: 0.5 });
  s = act(s, { type: "ENGAGE" });
  return {
    ...s,
    enemy: s.combat.enemies.find((e) => e.species === "goblin") || s.enemy,
  };
}
const win = (s = battle()) =>
  act(
    { ...s, enemy: { ...s.enemy, hp: 1 } },
    { type: "BATTLE", kind: "attack", roll: -1 },
  );
function essence(s, species = "goblin", unsecured = true) {
  const id = m.essenceId(species);
  return {
    ...s,
    inventory: { ...s.inventory, [id]: (s.inventory[id] || 0) + 1 },
    expedition: {
      ...s.expedition,
      unsecured: {
        ...s.expedition.unsecured,
        inventory: {
          ...s.expedition.unsecured.inventory,
          [id]:
            (s.expedition.unsecured.inventory[id] || 0) + (unsecured ? 1 : 0),
        },
      },
    },
  };
}
function bind(s, species = "goblin", id = "hero") {
  const spec = m.MONSTERS.find((x) => x.id === species);
  return act(s, { type: "LEARN", id, species, skill: spec.skill });
}
function fail(s) {
  return act(
    {
      ...s,
      phase: "combat",
      inventory: { ...s.inventory, ether: 1 },
      enemy: { ...e.enemyFor(1), atk: 5000 },
      party: s.party.map((c) => ({
        ...c,
        hp: 1,
        atk: 0,
        ailments: { poison: 0, paralysis: 0 },
      })),
    },
    { type: "BATTLE", kind: "item", item: "ether", roll: 0.5 },
  );
}
function extract(s) {
  return act(
    { ...s, phase: "extraction", journey: { ...s.journey, watches: 180 } },
    { type: "RETURN" },
  );
}
test("Registry covers fourteen unique species and powers with real item and visual identities", () => {
  assert.equal(m.MONSTERS.length, 44);
  for (const key of ["id", "skill", "visual"])
    assert.equal(new Set(m.MONSTERS.slice(0, 14).map((x) => x[key])).size, 14);
  for (const spec of m.MONSTERS) {
    assert.ok(w.ITEMS.find((i) => i.id === m.essenceId(spec.id)));
    assert.ok(w.ITEMS.find((i) => i.id === spec.material));
    assert.ok(data.SKILLS.find((s) => s.name === spec.skill));
    assert.equal(data.SKILL_RANKS[spec.skill].length, 3);
  }
});
test("100000 independent essence rolls meet the 30% rate for ordinary and boss species", () => {
  for (const spec of [m.MONSTERS[0], m.MONSTERS[2]]) {
    let seed = 123456,
      drops = 0;
    for (let i = 0; i < 100000; i++) {
      const roll = m.monsterDrops(spec, seed);
      seed = roll.seed;
      drops += roll.items[m.essenceId(spec.id)] || 0;
    }
    assert.ok(drops >= 29000 && drops <= 31000, String(drops));
    console.log(`  ${spec.name}: ${drops}/100000`);
  }
});
test("Victory records cores, no loose gold, items and individual XP once", () => {
  let s = act(create(), { type: "RECRUIT", id: "kael" });
  s = { ...battle(), party: s.party, runContracts: { kael: 14 } };
  const won = win(s);
  assert.equal(won.phase, "loot");
  assert.equal(won.lootReceipt.gross, 0);
  assert.equal(won.lootReceipt.shares.kael, 0);
  assert.equal(won.lootReceipt.net, 0);
  assert.equal(won.gold, s.gold);
  assert.equal(
    won.lootReceipt.items["beast-core"],
    m.monsterCoreYield(m.MONSTERS[0]),
  );
  assert.equal(won.expedition.accruedShares.kael || 0, 0);
  assert.equal(won.runPaid.kael, undefined);
  assert.equal(won.lootReceipt.xp.length, 2);
  assert.equal(
    act(won, { type: "BATTLE", kind: "attack", roll: -1 }).kills,
    won.kills,
  );
  const loaded = e.normalizeSave(plain(won));
  const continued = act(loaded, { type: "COLLECT" });
  assert.equal(continued.gold, won.gold);
  assert.equal(continued.kills, won.kills);
  assert.equal(continued.lootReceipt, null);
  assert.equal(act(continued, { type: "COLLECT" }).gold, won.gold);
});
test("Drops differ by species, include genuine misses, and never give a guaranteed boss essence", () => {
  let found = 0,
    missed = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const s = battle(seed);
    const spec = m.MONSTERS[2];
    const won = win({ ...s, floor: 3, enemy: e.enemyFor(3) });
    if (won.inventory[m.essenceId(spec.id)]) found++;
    else missed++;
    assert.ok(won.inventory["beast-core"] >= m.monsterCoreYield(spec));
    assert.equal(won.essence, undefined);
  }
  assert.ok(found > 0 && missed > 0);
});
test("Final-watch victory retains its receipt before extraction", () => {
  const s = win({
    ...battle(),
    journey: { ...battle().journey, watches: 179 },
    expedition: { ...battle().expedition, rounds: 2 },
  });
  assert.equal(s.phase, "loot");
  assert.equal(s.journey.watches, 180);
  assert.equal(act(s, { type: "COLLECT" }).phase, "extraction");
});
test("World seeds are injectable and combat and loot streams remain independent", () => {
  assert.equal(create(123).journey.seed, 123);
  const a = battle(44),
    b = battle(44);
  assert.deepEqual(plain(a.rng), plain(b.rng));
  const changed = act(a, { type: "BATTLE", kind: "attack", roll: -1 });
  assert.notEqual(changed.rng.combat, a.rng.combat);
  assert.equal(changed.rng.loot, a.rng.loot);
  const rejected = act(a, {
    type: "BATTLE",
    kind: "skill",
    skill: "Arcane Bolt",
    roll: -1,
  });
  assert.deepEqual(plain(rejected.rng), plain(a.rng));
});
test("Interrupted combat playback restores a resolved victory without rerolling", () => {
  const s = { ...battle(), enemy: { ...e.enemyFor(1), hp: 1 } };
  const won = act(s, {
    type: "BATTLE",
    kind: "attack",
    roll: -1,
    animate: true,
  });
  assert.ok(won.roundPlayback);
  assert.equal(won.phase, "loot");
  assert.equal(act(won, { type: "BATTLE", kind: "attack", roll: -1 }), won);
  const loaded = e.normalizeSave(plain(won));
  const done = act(loaded, { type: "FINISH_PLAYBACK" });
  assert.equal(done.gold, won.gold);
  assert.deepEqual(plain(done.rng), plain(won.rng));
  assert.equal(done.lootReceipt.id, won.lootReceipt.id);
});
test("Skill slots unlock at levels 3,6,9,12 and share active/passive capacity", () => {
  assert.deepEqual(
    [1, 2, 3, 5, 6, 8, 9, 11, 12, 30].map(p.skillSlots),
    [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
  );
  let s = essence(
    essence(essence(create(), "goblin", false), "guardian", false),
    "blight",
    false,
  );
  s = bind(s);
  s = bind(s, "guardian");
  s = bind(s, "blight");
  assert.equal(s.party[0].skills.length, 2);
  assert.equal(s.party[0].learnedSkills.length, 4);
  const full = act(s, {
    type: "SLOT_SKILL",
    id: "hero",
    skill: "Toxic Adaptation",
    equip: true,
  });
  assert.equal(full.party[0].skills.length, 2);
  s = act(s, {
    type: "SLOT_SKILL",
    id: "hero",
    skill: "Twin Strike",
    equip: false,
  });
  s = act(s, {
    type: "SLOT_SKILL",
    id: "hero",
    skill: "Toxic Adaptation",
    equip: true,
  });
  assert.ok(s.party[0].skills.includes("Toxic Adaptation"));
  const leveled = { ...s, party: s.party.map((c) => e.gainXp(c, 210)) };
  assert.equal(leveled.party[0].level, 3);
  assert.equal(
    act(leveled, {
      type: "SLOT_SKILL",
      id: "hero",
      skill: "Twin Strike",
      equip: true,
    }).party[0].skills.length,
    3,
  );
});
test("Binding and loadout changes enforce locations and reject duplicate relearning", () => {
  let s = essence(battle());
  const inventory = s.inventory["essence-goblin"];
  assert.equal(bind(s).inventory["essence-goblin"], inventory);
  s = bind({ ...s, phase: "camp" });
  assert.ok(s.party[0].skills.includes("Twin Strike"));
  assert.equal(bind(essence(s)).inventory["essence-goblin"], 1);
  assert.equal(
    act(s, {
      type: "SLOT_SKILL",
      id: "hero",
      skill: "Twin Strike",
      equip: false,
    }).party[0].skills.length,
    2,
  );
});
test("Successful extraction secures provisional powers and a repeat expedition retains them", () => {
  let s = bind({ ...essence(battle()), phase: "camp" });
  assert.ok(s.expedition.provisionalSkills.hero.includes("Twin Strike"));
  s = extract(e.normalizeSave(plain(s)));
  assert.ok(s.party[0].learnedSkills.includes("Twin Strike"));
  assert.deepEqual(plain(s.expedition.provisionalSkills), {});
  const next = act({ ...s, day: 90, food: 10 }, { type: "ENTER" });
  assert.equal(next.expedition.number, 2);
  assert.ok(next.party[0].skills.includes("Twin Strike"));
});
test("Defeat removes unsecured spoils, provisional loadout/mastery, but retains prior growth", () => {
  let s = bind({ ...essence(win()), phase: "camp" });
  s = {
    ...s,
    party: s.party.map((c) => ({
      ...c,
      mastery: { "Twin Strike": 15, "Shield Bash": 12 },
    })),
  };
  const securedGold = s.gold - s.expedition.unsecured.gold;
  const xp = s.party[0].xp;
  const lost = fail(s);
  assert.equal(lost.phase, "defeat");
  assert.equal(lost.gold, securedGold);
  assert.ok(!lost.party[0].learnedSkills.includes("Twin Strike"));
  assert.ok(!lost.party[0].skills.includes("Twin Strike"));
  assert.equal(lost.party[0].mastery["Twin Strike"], undefined);
  assert.equal(lost.party[0].mastery["Shield Bash"], 12);
  assert.equal(lost.party[0].xp, xp);
  assert.equal(lost.expedition.lost, true);
  const returned = extract(lost);
  assert.equal(returned.gold, lost.gold);
});
test("Powers bound from secured essences remain permanent after field defeat", () => {
  const s = bind({ ...essence(battle(), "goblin", false), phase: "camp" });
  assert.ok(!s.expedition.provisionalSkills.hero);
  assert.ok(fail(s).party[0].learnedSkills.includes("Twin Strike"));
});
test("Unsecured essences are consumed before secured duplicates", () => {
  const s = bind({
    ...essence(essence(battle(), "goblin", false)),
    phase: "camp",
  });
  assert.equal(s.inventory["essence-goblin"], 1);
  assert.equal(s.expedition.unsecured.inventory["essence-goblin"], 0);
  assert.equal(fail(s).inventory["essence-goblin"], 1);
});
test("Accrued companion shares settle only on successful extraction", () => {
  const won = win({ ...battle(), runContracts: { kael: 14 } });
  const s = act(
    {
      ...won,
      phase: "branch",
      journey: {
        ...won.journey,
        branch: { id: "share-cache", kind: "cache", direction: "left" },
      },
    },
    { type: "BRANCH_CHOICE", choice: "careful", roll: 1 },
  );
  assert.equal(extract(s).runPaid.kael, 2);
  assert.equal(extract(fail(s)).runPaid.kael, undefined);
});
test("Duplicate essences teach another companion, craft equipment or sell without changing mastery", () => {
  let s = act(essence(essence(create(), "goblin", false), "goblin", false), {
    type: "RECRUIT",
    id: "kael",
  });
  s = bind(s);
  s = bind(s, "goblin", "kael");
  assert.ok(s.party[1].learnedSkills.includes("Twin Strike"));
  assert.equal(s.inventory["essence-goblin"], 0);
  for (const recipe of town.RECIPES.filter((r) => r.essence)) {
    const before = {
      ...essence(create(), recipe.essence, false),
      bestFloor: 12,
      gold: 10000,
    };
    const crafted = act(before, {
      type: "CRAFT",
      id: recipe.id,
      essence: true,
    });
    assert.equal(crafted.inventory[recipe.id], 1);
    assert.equal(crafted.gold, before.gold - recipe.gold);
    assert.equal(crafted.inventory[m.essenceId(recipe.essence)], 0);
  }
  const before = essence(create(), "goblin", false);
  const sold = act(before, {
    type: "SELL",
    id: "essence-goblin",
    vendor: "guild",
    quantity: 1,
  });
  assert.ok(sold.gold > before.gold);
  assert.equal(sold.inventory["essence-goblin"], 0);
  assert.deepEqual(plain(sold.party[0].mastery), {});
});
test("Field spending consumes unsecured balances first and derived purchases remain at risk", () => {
  let s = { ...battle(), phase: "event", floor: 11, eventResolved: false };
  s = {
    ...s,
    gold: s.gold + 200,
    expedition: {
      ...s.expedition,
      unsecured: { ...s.expedition.unsecured, gold: 200 },
    },
  };
  const bought = act(s, { type: "EVENT", choice: "supplies", roll: 0.5 });
  assert.ok(bought.gold < s.gold);
  assert.ok(bought.expedition.unsecured.gold < 200);
  assert.ok(bought.expedition.unsecured.potions > 0);
  const lost = fail(bought);
  assert.equal(lost.potions, s.potions);
});
test("Meaningful mastery caps at three active uses per battle, excludes empty healing and trials", () => {
  let s = battle();
  s = {
    ...s,
    enemy: { ...s.enemy, hp: 100000, maxHp: 100000 },
    party: s.party.map((c) => ({
      ...c,
      mp: 1000,
      maxMp: 1000,
      hp: 1000,
      maxHp: 1000,
    })),
  };
  for (let i = 0; i < 12; i++) {
    s = {
      ...s,
      enemy: { ...s.enemy, broken: 2 },
      party: s.party.map((c) => ({ ...c, cooldowns: {} })),
    };
    s = act(s, {
      type: "BATTLE",
      kind: "skill",
      skill: "Shield Bash",
      roll: 0.5,
    });
  }
  assert.equal(s.party[0].mastery["Shield Bash"], 3);
  let healer = bind({ ...essence(create(), "plunderer", false) }, "plunderer");
  healer = {
    ...battle(),
    party: healer.party,
    enemy: { ...battle().enemy, hp: 10000, maxHp: 10000, broken: 2 },
  };
  const noHeal = act(healer, {
    type: "BATTLE",
    kind: "skill",
    skill: "Second Wind",
    roll: 0.5,
  });
  assert.equal(noHeal.party[0].mastery["Second Wind"], undefined);
  const t = {
    ...s,
    trial: true,
    party: s.party.map((c) => ({
      ...c,
      mastery: {},
      battleMastery: {},
      cooldowns: {},
    })),
  };
  assert.deepEqual(
    plain(
      act(t, { type: "BATTLE", kind: "skill", skill: "Shield Bash", roll: 0.5 })
        .party[0].mastery,
    ),
    {},
  );
  const overlevel = {
    ...t,
    trial: false,
    party: t.party.map((c) => ({ ...c, level: 10 })),
  };
  assert.deepEqual(
    plain(
      act(overlevel, {
        type: "BATTLE",
        kind: "skill",
        skill: "Shield Bash",
        roll: 0.5,
      }).party[0].mastery,
    ),
    {},
  );
});
test("Rank potency and new effects are real combat behavior", () => {
  const base = battle();
  const setup = (rank) => ({
    ...base,
    enemy: { ...base.enemy, hp: 10000, maxHp: 10000 },
    party: base.party.map((c) => ({ ...c, mastery: { "Shield Bash": rank } })),
  });
  const first = act(setup(0), {
    type: "BATTLE",
    kind: "skill",
    skill: "Shield Bash",
    roll: 0.9,
  });
  const third = act(setup(40), {
    type: "BATTLE",
    kind: "skill",
    skill: "Shield Bash",
    roll: 0.9,
  });
  assert.ok(third.effects.damage > first.effects.damage);
  assert.ok(third.effects.enemyDamage <= first.effects.enemyDamage);
  assert.equal(
    p.skillRank(
      { ...base.party[0], mastery: { "Shield Bash": 12 } },
      "Shield Bash",
    ),
    2,
  );
});

test("Crystals refine equipped protection once without buying or occupying a skill", () => {
  let s = { ...create(), gold: 1000, gems: 60 };
  assert.equal(
    act(s, { type: "REFINE_GEAR", id: "hero", element: "fire" }).gems,
    s.gems,
  );
  s = act(s, { type: "BUY_ITEM", id: "leather" });
  s = act(s, { type: "EQUIP", character: "hero", item: "leather" });
  const before = s;
  s = act(s, { type: "REFINE_GEAR", id: "hero", element: "fire" });
  assert.equal(s.gems, before.gems - 30);
  assert.equal(s.gold, before.gold - 100);
  assert.equal(e.resist(s.party[0], "fire"), 10);
  assert.ok(!s.party[0].learnedSkills.includes("Ember Ward"));
  assert.equal(act(s, { type: "REFINE_GEAR", id: "hero", element: "fire" }), s);
  assert.equal(e.resist(e.normalizeSave(plain(s)).party[0], "fire"), 10);
});
test("Secured gold buys secured field supplies; mixed expedition gold keeps the bundle at risk", () => {
  const base = {
    ...battle(),
    gold: 500,
    phase: "event",
    floor: 11,
    eventResolved: false,
  };
  const bought = act(base, { type: "EVENT", choice: "supplies", roll: 0.5 });
  assert.equal(bought.expedition.unsecured.potions, 0);
  assert.equal(bought.expedition.unsecured.food, 0);
  assert.equal(fail(bought).potions, bought.potions);
  const mixed = {
    ...base,
    expedition: {
      ...base.expedition,
      unsecured: { ...base.expedition.unsecured, gold: 1 },
    },
  };
  assert.equal(
    act(mixed, { type: "EVENT", choice: "supplies", roll: 0.5 }).expedition
      .unsecured.potions,
    1,
  );
});
test("Each new signature skill spends real MP and only heals standing characters", () => {
  for (const species of ["kings-blade", "hollow-king", "bonegnaw"]) {
    let learned = bind(essence(create(), species, false), species);
    let s = {
      ...battle(),
      party: learned.party.map((c) => ({ ...c, hp: c.maxHp - 40 })),
      enemy: { ...e.enemyFor(1), hp: 10000, maxHp: 10000, broken: 2 },
    };
    const skill = m.MONSTERS.find((spec) => spec.id === species).skill;
    const result = act(s, { type: "BATTLE", kind: "skill", skill, roll: 0.5 });
    assert.ok(result.effects.strikes.hero > 0);
    assert.equal(
      result.party[0].mp,
      s.party[0].mp - data.SKILLS.find((spec) => spec.name === skill).cost,
    );
    assert.equal(result.party[0].mastery[skill], 1);
    if (skill !== "Sunder") assert.ok(result.party[0].hp > s.party[0].hp);
  }
});
test("Passive mastery persists its per-battle cap across reload and only rewards the contributing inspirer", () => {
  const character = {
    ...create().party[0],
    skills: ["Inspiring Presence"],
    learnedSkills: ["Inspiring Presence"],
  };
  let s = {
    ...battle(),
    party: [character, { ...character, id: "other" }],
    enemy: { ...e.enemyFor(1), hp: 10000, maxHp: 10000, broken: 2 },
  };
  s = act(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.party[0].mastery["Inspiring Presence"], 1);
  assert.equal(s.party[1].mastery["Inspiring Presence"], undefined);
  const loaded = e.normalizeSave(plain(s));
  const again = act(loaded, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(again.party[0].mastery["Inspiring Presence"], 1);
});
test("Mastered healing grants an actual barrier and mastered frost wards prevent freezing", () => {
  let s = bind(essence(create(), "plunderer", false), "plunderer");
  s = {
    ...battle(),
    party: s.party.map((c) => ({
      ...c,
      hp: c.maxHp - 30,
      mastery: { "Second Wind": 40 },
    })),
    enemy: { ...e.enemyFor(1), hp: 10000, maxHp: 10000, broken: 2 },
  };
  const healed = act(s, {
    type: "BATTLE",
    kind: "skill",
    skill: "Second Wind",
    roll: 0.5,
  });
  assert.equal(
    healed.party[0].ailments.barrier,
    Math.round(s.party[0].maxHp * 0.1),
  );
  const frost = {
    ...battle(),
    turn: 3,
    enemy: { ...e.enemyFor(7), hp: 10000, maxHp: 10000, charged: true },
    party: [
      {
        ...create().party[0],
        skills: ["Winter Veil"],
        mastery: { "Winter Veil": 12 },
      },
    ],
  };
  assert.equal(
    act(frost, { type: "BATTLE", kind: "guard", roll: 0.5 }).party[0].ailments
      .paralysis,
    0,
  );
});

test("Save skill identities round-trip libraries, mastery, provisional skills and playback without rewriting names", () => {
  const { skillIds: ids } = require("./engine-loader.cjs");
  let s = create();
  s.party[0].name = "Twin Strike";
  s.party[0].skills = ["Twin Strike"];
  s.party[0].learnedSkills = ["Twin Strike", "Shield Bash"];
  s.party[0].mastery = { "Twin Strike": 12 };
  s.party[0].cooldowns = { "Twin Strike": 2 };
  s.expedition.provisionalSkills = { hero: ["Shield Bash"] };
  s.combat = { id: "fixture", mastery: { hero: { "Twin Strike": 2 } } };
  s.roundPlayback = {
    before: { ...s, roundPlayback: null },
    events: [
      {
        action: { kind: "skill", skill: "Twin Strike" },
        text: "Twin Strike",
        party: s.party,
      },
    ],
  };
  const encoded = JSON.parse(ids.serializeSave(s));
  assert.equal(encoded.party[0].name, "Twin Strike");
  assert.equal(encoded.party[0].skills[0], "twin-strike");
  assert.equal(encoded.party[0].mastery["twin-strike"], 12);
  assert.equal(encoded.combat.mastery.hero["twin-strike"], 2);
  assert.equal(encoded.expedition.provisionalSkills.hero[0], "shield-bash");
  assert.equal(encoded.roundPlayback.events[0].action.skill, "twin-strike");
  assert.equal(encoded.roundPlayback.events[0].text, "Twin Strike");
  const decoded = ids.deserializeSave(encoded);
  assert.equal(decoded.party[0].learnedSkills[1], "Shield Bash");
  assert.equal(decoded.party[0].cooldowns["Twin Strike"], 2);
  assert.equal(decoded.combat.mastery.hero["Twin Strike"], 2);
  assert.equal(e.normalizeSave(encoded).party[0].mastery["Twin Strike"], 12);
  assert.equal(
    new Set(require("./engine-loader.cjs").combatData.SKILLS.map((s) => s.id))
      .size,
    data.SKILLS.length,
  );
});

async function storageTests() {
  const map = new Map([[saves.LEGACY_KEY, "original-development-save"]]);
  const storage = {
    getItem: async (k) => map.get(k) || null,
    setItem: async (k, v) => {
      map.set(k, v);
    },
  };
  const loaded = await saves.loadSave(storage);
  assert.equal(loaded.backedUp, true);
  assert.equal(map.get(saves.LEGACY_BACKUP_KEY), "original-development-save");
  assert.equal((await saves.loadSave(storage)).backedUp, false);
  map.set(saves.SAVE_KEY, "invalid");
  await assert.rejects(() => saves.loadSave(storage));
  assert.equal(map.get(saves.SAVE_KEY), "invalid");
  let calls = [],
    failWrite = true;
  const writer = saves.saveWriter({
    ...storage,
    setItem: async (_k, v) => {
      calls.push(v);
      if (failWrite) throw Error("disk");
    },
  });
  await assert.rejects(() => writer.save("first"));
  failWrite = false;
  await writer.retry();
  await Promise.all([writer.save("second"), writer.save("third")]);
  assert.deepEqual(calls, ["first", "first", "second", "third"]);
  count++;
  console.log(
    "PASS Storage backs up development saves, retains unreadable data, retries failures and serializes writes",
  );
}
storageTests()
  .then(() =>
    console.log(`${count} reward, progression and persistence checks passed.`),
  )
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
