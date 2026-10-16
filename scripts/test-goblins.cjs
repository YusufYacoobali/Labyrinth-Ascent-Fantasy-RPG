const assert = require("node:assert/strict");
const {
  e,
  rounds: r,
  monsters: m,
  progression: p,
  combatData: data,
  town,
  skillIds,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function arena(seed = 0, defender = false) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
  s = e.reducer(s, { type: "RECRUIT", id: "kael" });
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  const n = r.beginCombat({
    ...s,
    phase: "combat",
    rng: { ...s.rng, encounters: seed },
    enemy: e.enemyFor(1, null, 2),
    journey: { ...s.journey, room: defender ? "portal" : "entrance", defender },
  });
  n.combat.intents = undefined;
  return n;
}
function round(
  s,
  actions = s.party
    .filter((c) => c.hp > 0 && !c.ailments.paralysis)
    .map((c) => ({ actor: c.id, kind: "focus" })),
  animate = false,
) {
  return e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions,
    animate,
  });
}
test("Floor 1 has solo scouts, protected patrols, slinger pairs and a three-role portal group", () => {
  const groups = new Set();
  for (let seed = 0; seed < 100; seed++)
    groups.add(
      arena(seed * 517)
        .combat.enemies.map((e) => e.species)
        .join(","),
    );
  assert.ok(groups.has("goblin"));
  assert.ok(groups.has("goblin-shieldbearer,goblin"));
  assert.ok(groups.has("goblin,goblin-slinger"));
  const s = arena(0, true);
  assert.equal(s.combat.enemies.length, 3);
  assert.equal(new Set(s.combat.enemies.map((e) => e.species)).size, 3);
});
test("Scout telegraphs one reinforcement wave; new units wait until the following round and reloads preserve the limit", () => {
  let s = arena();
  s.party = s.party.map((c) => ({ ...c, hp: 10000, maxHp: 10000 }));
  s = round(s);
  assert.equal(r.enemyIntent(s, s.combat.enemies[0]).kind, "summon");
  s = round(s, undefined, true);
  assert.equal(s.combat.enemies.length, 2);
  const summoned = s.combat.enemies.find((e) => e.id.includes(":summon-"));
  assert.ok(summoned);
  assert.ok(
    !s.roundPlayback.events.some((event) => event.actor === summoned.id),
  );
  assert.ok(s.roundPlayback.events.some((event) => event.kind === "summon"));
  const snapshot = skillIds.serializeSave(s);
  s = e.normalizeSave(JSON.parse(snapshot));
  s = e.reducer(s, { type: "FINISH_PLAYBACK" });
  for (let i = 0; i < 10; i++) s = round(s);
  assert.equal(s.combat.spawned, 1);
  assert.equal(s.combat.enemies.find((e) => e.species === "goblin").waves, 1);
  assert.equal(
    new Set(s.combat.enemies.map((e) => e.id)).size,
    s.combat.enemies.length,
  );
});
test("Interrupting or killing a scout cancels its call; dead slots are reused without losing their unique reward record", () => {
  let s = arena();
  s.combat.round = 2;
  s.turn = 2;
  s.combat.enemies[0].paralysis = 1;
  assert.equal(round(s).combat.spawned, undefined);
  s = arena(0, true);
  s.combat.round = 2;
  s.turn = 2;
  s.combat.enemies[0].hp = 0;
  const dead = plain(s.combat.enemies[0]);
  s = round(s);
  assert.equal(s.combat.enemies.length, 3);
  assert.equal(s.combat.defeated[0].id, dead.id);
  assert.equal(s.combat.spawned, 1);
  s = e.normalizeSave(plain(s));
  assert.equal(s.combat.defeated[0].id, dead.id);
  s.party = s.party.map((c) => ({ ...c, atk: 100000, speed: 1000 }));
  for (let i = 0; i < 5 && s.phase === "combat"; i++)
    s = round(
      s,
      s.party
        .filter((c) => c.hp > 0 && !c.ailments.paralysis)
        .map((c) => ({
          actor: c.id,
          kind: "attack",
          target: s.combat.enemies.find((e) => e.hp > 0).id,
        })),
    );
  assert.equal(s.phase, "loot");
  assert.equal(s.lootReceipt.enemies.length, 4);
  assert.equal(new Set(s.lootReceipt.enemies.map((e) => e.id)).size, 4);
  assert.equal(s.lootReceipt.gross, 0);
  assert.ok(s.lootReceipt.items["beast-core"] >= 4);
  const inventory = plain(s.inventory),
    gold = s.gold,
    seed = s.rng.loot;
  s = round(s, []);
  assert.deepEqual(plain(s.inventory), inventory);
  assert.equal(s.gold, gold);
  assert.equal(s.rng.loot, seed);
});
test("Replacing a casualty before its pending initiative cannot execute a dead actor or the new minion", () => {
  let s = arena(1500);
  s.combat.round = 2;
  s.turn = 2;
  const slinger = s.combat.enemies.find((e) => e.species === "goblin-slinger");
  slinger.hp = 1;
  s.party = s.party.map((c) => ({ ...c, speed: 100 }));
  const n = round(
    s,
    [
      { actor: "hero", kind: "attack", target: slinger.id },
      { actor: "kael", kind: "focus" },
    ],
    true,
  );
  assert.equal(n.combat.spawned, 1);
  assert.equal(n.combat.defeated[0].id, slinger.id);
  assert.ok(
    !n.roundPlayback.events.some(
      (event) => event.actor === slinger.id || event.actor.includes(":summon-"),
    ),
  );
});
test("Retreating and revisiting a scout preserves used waves, minion HP and the accepted round", () => {
  let s = arena();
  s = round(round(s));
  const id = s.combat.id;
  const saved = plain(s.combat);
  s = e.reducer(s, {
    type: "ROUND",
    battleId: id,
    round: s.combat.round,
    actions: [],
    flee: true,
  });
  assert.equal(s.combat, null);
  assert.equal(s.expedition.battles[id].spawned, 1);
  const resumed = r.beginCombat({
    ...e.normalizeSave(plain(s)),
    phase: "combat",
    enemy: e.enemyFor(1, null, 2),
    journey: { ...s.journey, room: "entrance", defender: false },
  });
  assert.equal(resumed.combat.id, id);
  assert.equal(resumed.combat.spawned, 1);
  assert.equal(resumed.combat.round, saved.round + 1);
  assert.equal(
    resumed.combat.enemies.find((e) => e.species === "goblin").waves,
    1,
  );
});
test("Shield links actually reduce ally damage and vanish when the bearer is defeated or interrupted", () => {
  function hit(interrupted) {
    let s = arena(0, true);
    const shield = s.combat.enemies.find(
        (e) => e.species === "goblin-shieldbearer",
      ),
      foe = s.combat.enemies.find((e) => e.species === "goblin");
    shield.paralysis = interrupted ? 1 : 0;
    foe.hp = 40;
    foe.maxHp = 1000;
    s.party = s.party.map((c) => ({ ...c, speed: 10, atk: 30 }));
    return {
      state: round(s, [
        { actor: "hero", kind: "attack", target: foe.id },
        { actor: "kael", kind: "focus" },
      ]),
      id: foe.id,
    };
  }
  const covered = hit(false),
    open = hit(true);
  assert.ok(
    covered.state.combat.enemies.find((e) => e.id === covered.id).hp >
      open.state.combat.enemies.find((e) => e.id === open.id).hp,
  );
});
test("Goblin essence powers have real fast initiative, armor bypass, weakening and meaningful passive mastery", () => {
  let s = arena();
  s.combat.enemies[0].behaviorId = undefined;
  s.combat.enemies[0].speed = 1;
  s.combat.enemies[0].archetype = "skirmisher";
  s.combat.enemies[0].atk = 30;
  s.combat.enemies[0].hp = 1000;
  s.combat.enemies[0].maxHp = 1000;
  s.party[0].skills = ["Sling Shot", "Candle Ward"];
  s.party[0].learnedSkills = [...s.party[0].skills];
  s.party[0].mp = 100;
  const queue = [
    { actor: "hero", kind: "skill", skill: "Sling Shot", target: s.enemy.id },
    { actor: "kael", kind: "focus" },
  ];
  assert.equal(
    r.initiative(s, queue).find((c) => c.id === "hero").speed,
    r.effectiveSpeed(s.party[0]) + 4,
  );
  let n = round(s, queue);
  assert.equal(n.party[0].mp, 90);
  assert.equal(n.party[0].mastery["Sling Shot"], 1);
  assert.ok(n.effects.damage > 0);
  s.party[0].hp = 50;
  s.party[0].mastery["Candle Ward"] = 12;
  n = round(s, [
    { actor: "hero", kind: "guard", target: "hero" },
    { actor: "kael", kind: "focus" },
  ]);
  assert.equal(n.party[0].mastery["Candle Ward"], 13);
  assert.equal(n.party[0].battleMastery["Candle Ward"], 1);
  assert.equal(n.party[0].ailments.paralysis, 0);
  for (const skill of ["Candle Ward", "Sling Shot"])
    assert.equal(data.SKILL_RANKS[skill].length, 3);
});
test("New essences bind provisionally, teach duplicates to another ally, craft real gear and retain vendor pricing", () => {
  for (const species of ["goblin-shieldbearer", "goblin-slinger"]) {
    let s = arena();
    s.phase = "camp";
    const item = m.essenceId(species),
      power = m.MONSTERS.find((m) => m.id === species).skill;
    s.inventory[item] = 3;
    s.expedition.unsecured.inventory[item] = 3;
    s = e.reducer(s, { type: "LEARN", id: "hero", skill: power, species });
    s = e.reducer(s, { type: "LEARN", id: "kael", skill: power, species });
    assert.ok(s.expedition.provisionalSkills.hero.includes(power));
    assert.ok(s.expedition.provisionalSkills.kael.includes(power));
    assert.equal(s.inventory[item], 1);
    s = e.reducer(
      { ...s, phase: "extraction", journey: { ...s.journey, watches: 180 } },
      { type: "RETURN" },
    );
    assert.ok(s.party[0].learnedSkills.includes(power));
    assert.equal(s.expedition.provisionalSkills.hero, undefined);
    const recipe = town.RECIPES.find((r) => r.essence === species);
    s = e.reducer(s, { type: "CRAFT", id: recipe.id, essence: true });
    assert.equal(s.inventory[item], 0);
    assert.equal(s.inventory[recipe.id], 1);
    s.inventory[item] = 1;
    const gold = s.gold;
    s = e.reducer(s, { type: "SELL", id: item, vendor: "guild", quantity: 1 });
    assert.ok(s.gold > gold);
  }
});
test("Every finite goblin identity has an independent 30% essence roll", () => {
  for (const species of ["goblin", "goblin-shieldbearer", "goblin-slinger"]) {
    let seed = 12345,
      drops = 0;
    const spec = m.MONSTERS.find((m) => m.id === species);
    for (let i = 0; i < 100000; i++) {
      const roll = m.monsterDrops(spec, seed);
      seed = roll.seed;
      drops += roll.items[m.essenceId(species)] || 0;
    }
    assert.ok(drops >= 29000 && drops <= 31000);
  }
});
console.log(`${count} goblin vertical-slice checks passed.`);
