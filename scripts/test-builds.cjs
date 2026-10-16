const assert = require("node:assert/strict");
const {
  e,
  w,
  rounds: r,
  monsters: m,
  combatData: data,
  powers,
  builds: b,
  reports,
  progression: p,
  townProgression: tp,
  town,
  skillIds,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
let count = 0;
function test(n, fn) {
  fn();
  count++;
  console.log("PASS " + n);
}
function fresh() {
  return e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Builder",
    roll: 0.5,
  });
}
function arena(skill = "Crown Pulse", foes = 1) {
  let s = fresh();
  s = e.reducer({ ...s, day: 30, food: 40 }, { type: "ENTER" });
  s = r.beginCombat({
    ...s,
    phase: "combat",
    floor: 2,
    enemy: e.enemyFor(2, null, 1),
  });
  s.party = s.party.map((c) => ({
    ...c,
    hp: 50,
    maxHp: 100,
    level: 3,
    mp: 100,
    maxMp: 100,
    atk: 30,
    def: 0,
    speed: 30,
    skills: [skill],
    learnedSkills: [skill],
    mastery: {},
    battleMastery: {},
  }));
  s.combat.enemies = Array.from({ length: foes }, (_, i) => ({
    ...s.combat.enemies[0],
    id: "test-" + i,
    hp: 1000,
    maxHp: 1000,
    atk: 20,
    guard: 0,
    poise: 100,
    maxPoise: 100,
    conditions: {},
    resistances: {},
    weaknesses: [],
    boss: false,
    shield: 0,
    behaviorId: undefined,
    speed: 1,
    level: 3,
  }));
  s.combat.intents = Object.fromEntries(
    s.combat.enemies.map((e) => [
      e.id,
      { kind: "wait", label: "wait", targets: [], power: 0 },
    ]),
  );
  s.enemy = s.combat.enemies[0];
  return s;
}
function cast(s, skill = s.party[0].skills[0]) {
  return e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions: [
      { actor: "hero", kind: "skill", skill, target: s.combat.enemies[0].id },
    ],
    animate: true,
  });
}
test("All 44 species grant different shipped powers with stable IDs and three explicit ranks", () => {
  assert.equal(new Set(m.MONSTERS.map((m) => m.skill)).size, 44);
  for (const species of m.MONSTERS) {
    assert.ok(data.SKILLS.some((s) => s.name === species.skill));
    assert.equal(data.SKILL_RANKS[species.skill].length, 3);
  }
  let s = fresh();
  s.party[0].learnedSkills = ["Venom Fang", "Winter Veil"];
  s = e.normalizeSave(plain(s));
  assert.ok(s.party[0].learnedSkills.includes("Venom Fang"));
  assert.ok(s.party[0].learnedSkills.includes("Winter Veil"));
  assert.equal(
    skillIds.deserializeSave(JSON.parse(skillIds.serializeSave(s))).party[0]
      .learnedSkills.length,
    s.party[0].learnedSkills.length,
  );
});
test("Eight route powers execute their own effects and mastery rather than identical legacy family skills", () => {
  for (const species of m.MONSTERS.filter((m) =>
    /^(roots|frost|forge|crypt)-(roamer|elite)$/.test(m.id),
  )) {
    const s = arena(species.skill),
      spec = data.SKILLS.find((k) => k.name === species.skill),
      n = cast(s);
    assert.equal(
      n.party[0].mp,
      100 - spec.cost + (spec.mpGain || 0),
      species.id,
    );
    assert.equal(n.party[0].mastery[species.skill], 1, species.id);
    if (spec.status)
      assert.ok(n.combat.enemies[0].conditions[spec.status], species.id);
    if (spec.barrier) assert.ok(n.party[0].ailments.barrier > 0, species.id);
    if (powers.skillFamily(species.skill) === "Second Wind")
      assert.ok(n.party[0].hp > 50);
  }
});
test("Crown Pulse strikes three real enemies but pays MP, heals and earns mastery once per action", () => {
  const s = arena("Crown Pulse", 3),
    n = cast(s);
  assert.ok(n.combat.enemies.every((e) => e.hp < 1000));
  assert.equal(n.party[0].mp, 64);
  assert.equal(n.party[0].hp, 60);
  assert.equal(n.party[0].mastery["Crown Pulse"], 1);
  assert.equal(
    n.roundPlayback.events.filter(
      (e) => e.actor === "hero" && e.effects.damage > 0,
    ).length,
    3,
  );
  const reload = e.normalizeSave(plain(n));
  assert.equal(
    e.reducer(reload, {
      type: "ROUND",
      battleId: s.combat.id,
      round: 1,
      actions: [],
    }).party[0].mp,
    64,
  );
});
test("The scepter discount is validated by queues and consumes exactly the displayed effective MP", () => {
  let s = arena();
  s.party[0].equipment = ["throne-scepter"];
  s.party[0].mp = 30;
  const n = cast(s);
  assert.equal(n.party[0].mp, 0);
  assert.equal(b.skillCost(s.party[0], "Crown Pulse", 36), 30);
  assert.ok(n.combat.enemies[0].hp < 1000);
});
test("Ember Ward retaliates after real incoming damage and earns passive mastery once", () => {
  let s = arena("Ember Ward");
  s.party[0].hp = 100;
  s.combat.intents = {
    "test-0": { kind: "strike", label: "cut", power: 1, targets: ["hero"] },
  };
  const n = e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: 1,
    actions: [{ actor: "hero", kind: "focus" }],
    animate: true,
  });
  assert.ok(n.combat.enemies[0].hp < 1000);
  assert.equal(n.party[0].mastery["Ember Ward"], 1);
  assert.ok(n.roundPlayback.events.some((e) => e.kind === "retaliate"));
});
test("Runestone presence and defensive equipment make Guard stronger and mastery requires absorption", () => {
  let s = arena("Inspiring Presence");
  s.party[0].hp = 100;
  s.party[0].equipment = ["runestone-mail"];
  s.combat.intents = {
    "test-0": { kind: "strike", label: "cut", power: 1, targets: ["hero"] },
  };
  const n = e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: 1,
    actions: [{ actor: "hero", kind: "guard", target: "hero" }],
  });
  assert.equal(n.party[0].hp, 100);
  assert.equal(n.party[0].mastery["Inspiring Presence"], 1);
  const quiet = arena("Inspiring Presence");
  assert.equal(
    e.reducer(quiet, {
      type: "ROUND",
      battleId: quiet.combat.id,
      round: 1,
      actions: [{ actor: "hero", kind: "guard", target: "hero" }],
    }).party[0].mastery["Inspiring Presence"],
    undefined,
  );
});
test("Poison and chilled finishers and equipment synergies change real damage without granting stats", () => {
  for (const [skill, condition, gear] of [
    ["Venom Fang", "venom", "brood-veil"],
    ["Rime Fang", "chilled", "glacier-blade"],
    ["Arcane Bolt", null, "spark-focus"],
  ]) {
    const s = arena(skill),
      base = 1000 - cast(s).combat.enemies[0].hp;
    s.party[0].equipment = [gear];
    if (condition)
      s.combat.enemies[0].conditions = {
        [condition]: { stacks: 1, turns: 3, applied: 0 },
      };
    const boosted = 1000 - cast(s).combat.enemies[0].hp;
    assert.ok(boosted > base, skill);
  }
  const s = arena("Second Wind");
  s.party[0].equipment = ["moon-robe"];
  assert.ok(cast(s).party[0].hp > cast(arena("Second Wind")).party[0].hp);
});
test("Guardian trophies are guaranteed alongside cores without forcing an essence", () => {
  for (const species of m.MONSTERS.filter((m) => m.trophy)) {
    let missing = false;
    for (let seed = 1; seed <= 30; seed++) {
      const drops = m.monsterDrops(species, seed * 100000).items;
      assert.equal(drops[species.trophy], 1);
      assert.equal(drops["beast-core"], m.monsterCoreYield(species));
      if (!drops[m.essenceId(species.id)]) missing = true;
    }
    assert.ok(missing, species.id);
  }
});
test("Advanced recipes require earned floors and real trophies, and their stock remains locked before the tier", () => {
  for (const recipe of b.HUNT_RECIPES) {
    let s = {
      ...fresh(),
      gold: 10000,
      bestFloor: recipe.floor - 1,
      inventory: Object.fromEntries(
        recipe.materials.map((m) => [m.id, m.quantity]),
      ),
    };
    assert.equal(
      e.reducer(s, { type: "CRAFT", id: recipe.id }).inventory[recipe.id],
      undefined,
    );
    assert.equal(e.reducer(s, { type: "BUY_ITEM", id: recipe.id }).gold, 10000);
    s = { ...s, bestFloor: recipe.floor };
    const n = e.reducer(s, { type: "CRAFT", id: recipe.id });
    assert.equal(n.inventory[recipe.id], 1);
    assert.equal(n.gold, s.gold - recipe.gold);
    for (const material of recipe.materials)
      assert.equal(n.inventory[material.id], 0);
  }
});
test("Catch-up training accelerates lagging companions but retains the earned ceiling and finite top tiers", () => {
  const s = fresh(),
    low = s.party[0];
  assert.equal(tp.trainingXp(low, 6, 8), 90);
  assert.equal(tp.trainingXp(low, 6, 1), 45);
  assert.equal(tp.trainingXp({ ...low, level: 8 }, 6, 12), 0);
});
test("Extraction reports persist actual secured progress and do not count unvisited generated maps as discoveries", () => {
  let s = fresh();
  s = e.reducer({ ...s, day: 30, food: 40 }, { type: "ENTER" });
  s = {
    ...s,
    phase: "camp",
    journey: { ...s.journey, watches: 180 },
    expedition: {
      ...s.expedition,
      unsecured: {
        ...s.expedition.unsecured,
        gold: 50,
        inventory: { "essence-goblin": 1 },
      },
    },
    gold: s.gold + 50,
    inventory: { ...s.inventory, "essence-goblin": 1 },
  };
  let n = e.reducer(s, { type: "RETURN" });
  assert.equal(n.lastReport.net, 50);
  assert.equal(n.lastReport.spoils.inventory["essence-goblin"], 1);
  assert.equal(n.lastReport.newRooms, 0);
  assert.equal(n.lastReport.reviewed, false);
  const report = plain(n.lastReport);
  assert.deepEqual(
    plain(e.reducer(e.normalizeSave(plain(n)), { type: "RETURN" }).lastReport),
    report,
  );
  n = e.reducer(n, { type: "ACK_REPORT" });
  assert.equal(n.lastReport.reviewed, true);
});
test("Defeat reports retain the forfeiture receipt while keeping secured skills, XP and discoveries", () => {
  let s = fresh();
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  s = {
    ...s,
    phase: "defeat",
    journey: { ...s.journey, watches: 180 },
    gold: s.gold + 50,
    expedition: {
      ...s.expedition,
      unsecured: {
        ...s.expedition.unsecured,
        gold: 50,
        inventory: { "essence-goblin": 1 },
      },
    },
    inventory: { ...s.inventory, "essence-goblin": 1 },
  };
  s = e.reducer(s, { type: "DISMISS" });
  const n = e.reducer(s, { type: "RETURN" });
  assert.equal(n.lastReport.lost, true);
  assert.equal(n.lastReport.net, 0);
  assert.equal(n.lastReport.spoils.gold, 50);
  assert.equal(n.inventory["essence-goblin"], 0);
  assert.ok(n.party[0].learnedSkills.includes("Shield Bash"));
});
console.log(`${count} progression-build checks passed.`);
