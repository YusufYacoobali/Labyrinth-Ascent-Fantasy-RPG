const assert = require("node:assert/strict");
const {
  e,
  rounds: r,
  status: t,
  commands: c,
  moves,
  behavior,
  skillIds,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function arena(floor = 2) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 123,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
  s = e.reducer(s, { type: "RECRUIT", id: "kael" });
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  return r.beginCombat({
    ...s,
    floor,
    phase: "combat",
    enemy: e.enemyFor(floor, null, 2),
  });
}
function focus(s) {
  return s.party
    .filter((c) => c.hp > 0 && !t.impeded(c))
    .map((c) => ({ actor: c.id, kind: "focus" }));
}
function round(s, actions = focus(s), animate = false) {
  return e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions,
    animate,
  });
}
function enemy(s, changes) {
  s.combat.enemies = [{ ...s.combat.enemies[0], ...changes }];
  s.combat.intents = undefined;
  s.enemy = s.combat.enemies[0];
  return s;
}
test("Move definitions give each species named basic, special and defensive moves with explicit targets and cooldowns", () => {
  for (const [id, p] of Object.entries(behavior.SPECIES_BEHAVIOR)) {
    const s = arena();
    const definitions = moves.movesFor(
      { ...s.enemy, behaviorId: id, stage: 0 },
      p,
    );
    assert.ok(definitions.length >= 3);
    assert.ok(definitions.every((m) => m.id && m.name && m.target));
    assert.ok(definitions.some((m) => m.cooldown));
  }
});
test("Accepted intents survive reload and remain stable when actor HP changes during the round", () => {
  const s = arena(),
    intents = plain(s.combat.intents);
  const loaded = e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
  assert.deepEqual(plain(loaded.combat.intents), intents);
  loaded.party[0].hp = 1;
  for (const foe of loaded.combat.enemies)
    assert.deepEqual(plain(r.enemyIntent(loaded, foe)), intents[foe.id]);
  const n = round(loaded);
  assert.equal(n.combat.round, 2);
  assert.ok(n.combat.intents);
  assert.ok(n.combat.lastCommands.length);
});
test("Ordinary front attacks respect formation; hunting moves and area attacks can reach the back", () => {
  let s = arena();
  s.party[0].formation = "back";
  s.party[1].formation = "front";
  s = enemy(s, { behaviorId: "roadkeeper", archetype: "defender" });
  s.combat.round = 3;
  assert.deepEqual(Array.from(r.enemyIntent(s, s.enemy).targets), ["kael"]);
  s.party[0].hp = 1;
  s.enemy.behaviorId = "plunderer";
  s.combat.enemies[0] = s.enemy;
  s.combat.round = 1;
  assert.deepEqual(Array.from(r.enemyIntent(s, s.enemy).targets), ["hero"]);
  const changed = e.reducer(
    { ...s, phase: "town" },
    { type: "SET_FORMATION", id: "hero", formation: "front" },
  );
  assert.equal(changed.party[0].formation, "front");
  assert.equal(
    e.reducer(s, { type: "SET_FORMATION", id: "hero", formation: "front" })
      .party[0].formation,
    "back",
  );
});
test("Taunt redirects only subsequent single-target attacks and guards the actor; invalid taunts reserve nothing", () => {
  let s = enemy(arena(), {
    behaviorId: undefined,
    archetype: "skirmisher",
    atk: 40,
    speed: 1,
  });
  s.party = s.party.map((c) => ({ ...c, speed: 40 }));
  s.party[0].hp = 50;
  const n = round(
    s,
    [
      { actor: "hero", kind: "focus" },
      { actor: "kael", kind: "taunt", target: "kael" },
    ],
    true,
  );
  assert.equal(n.party[0].hp, 50);
  assert.ok(n.party[1].hp < s.party[1].hp);
  assert.ok(
    n.roundPlayback.events.some(
      (e) => e.kind === "strike" && e.target === "kael",
    ),
  );
  const invalid = round(s, [
    { actor: "hero", kind: "focus" },
    { actor: "kael", kind: "taunt", target: "hero" },
  ]);
  assert.equal(invalid.combat.round, 1);
  assert.equal(invalid.party[0].mp, s.party[0].mp);
});
test("Burn, bleed and venom stacks cap at three, refresh duration and tick exactly once after their application round", () => {
  for (const id of ["burning", "bleeding", "venom"]) {
    let conditions;
    for (let i = 0; i < 10; i++)
      conditions = t.applyCondition(conditions, id, 1);
    assert.equal(conditions[id].stacks, 3);
    assert.equal(t.tickConditions(conditions, 1, 100).damage, 0);
    let damage = 0;
    for (let round = 2; round <= 4; round++) {
      const n = t.tickConditions(conditions, round, 100);
      damage += n.damage;
      conditions = n.conditions;
    }
    assert.ok(damage > 0);
    assert.equal(Object.keys(conditions).length, 0);
  }
});
test("Frost buildup slows initiative, freezes at three stacks and consumes exactly one action before recovery", () => {
  let conditions;
  for (let i = 0; i < 3; i++)
    conditions = t.applyCondition(conditions, "chilled", 1);
  assert.ok(conditions.frozen);
  assert.equal(conditions.chilled, undefined);
  let s = enemy(arena(), {
    behaviorId: undefined,
    archetype: "skirmisher",
    atk: 1,
    speed: 1,
  });
  s.party[0].ailments.conditions = conditions;
  const n = round(s, focus(s), true);
  assert.ok(
    n.roundPlayback.events.some(
      (e) => e.actor === "hero" && e.kind === "interrupt",
    ),
  );
  assert.equal(t.impeded(n.party[0]), false);
  const chilled = t.applyCondition(undefined, "chilled", 1);
  s.party[0].ailments.conditions = chilled;
  assert.equal(r.effectiveSpeed(s.party[0]), s.party[0].speed - 2);
});
test("Antidotes and bandages cleanse their defined conditions; mastered wards prevent matching conditions", () => {
  let s = enemy(arena(), {
    behaviorId: undefined,
    archetype: "defender",
    speed: 1,
  });
  s.inventory.antidote = 1;
  s.party[0].ailments.conditions = {
    ...t.applyCondition(undefined, "venom", 0),
    ...t.applyCondition(undefined, "burning", 0),
  };
  let n = round(s, [
    { actor: "hero", kind: "item", item: "antidote", target: "hero" },
    { actor: "kael", kind: "focus" },
  ]);
  assert.equal(n.inventory.antidote, 0);
  assert.equal(n.party[0].ailments.conditions.venom, undefined);
  assert.ok(n.party[0].ailments.conditions.burning);
  for (const [skill, status] of [
    ["Ember Ward", "burning"],
    ["Winter Veil", "chilled"],
    ["Grave Guard", "bleeding"],
  ]) {
    const c = s.party[0];
    c.skills = [skill];
    c.mastery[skill] = 12;
    assert.ok(t.immune(c, status));
  }
  s.party[0].skills = ["Toxic Adaptation"];
  assert.ok(t.immune(s.party[0], "venom"));
});
test("Guard counters special ailments and damaging statuses survive saving without gaining extra ticks", () => {
  let s = enemy(arena(9), {
    behaviorId: "ashen",
    boss: false,
    archetype: "bruiser",
    speed: 1,
    atk: 40,
    hp: 1000,
    maxHp: 1000,
  });
  s.combat.round = 2;
  s.turn = 2;
  s.party = s.party.map((c) => ({ ...c, speed: 40 }));
  let n = round(s, [
    { actor: "hero", kind: "guard", target: "hero" },
    { actor: "kael", kind: "guard", target: "kael" },
  ]);
  assert.ok(n.party.every((c) => !c.ailments.conditions?.burning));
  s.party[0].ailments.conditions = t.applyCondition(undefined, "burning", 1);
  const loaded = e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
  assert.deepEqual(plain(round(s).party), plain(round(loaded).party));
});
test("Boss phases select different move patterns, targets and effects rather than only damage multipliers", () => {
  const s = enemy(arena(3), { boss: true, behaviorId: "guardian", stage: 0 });
  const p = behavior.SPECIES_BEHAVIOR.guardian;
  const before = moves.selectMove(s, s.enemy, p);
  s.enemy.stage = 1;
  const after = moves.selectMove(s, s.enemy, p);
  assert.notEqual(before.kind, after.kind);
  s.combat.round = 2;
  assert.equal(moves.selectMove(s, s.enemy, p).targets.length, 2);
  s.enemy.moveCooldowns = { "phase-special": 2 };
  assert.equal(moves.selectMove(s, s.enemy, p).move, "basic");
});
test("Repeat commands retarget fallen enemies and replace unavailable skills while preserving atomic item validation", () => {
  let s = arena();
  const foe = s.combat.enemies[0];
  s.combat.lastCommands = [
    { actor: "hero", kind: "skill", skill: "Sling Shot", target: "dead" },
    { actor: "kael", kind: "item", item: "potion", target: "dead" },
  ];
  const repeated = c.repeatCommands(s);
  assert.equal(repeated[0].kind, "attack");
  assert.equal(repeated[0].target, foe.id);
  assert.equal(repeated[1].target, "kael");
  s.potions = 0;
  const n = round(s, repeated);
  assert.equal(n.combat.round, s.combat.round);
  assert.equal(n.rng.combat, s.rng.combat);
});
test("Damage previews are read-only and fast-playback preference persists through save normalization", () => {
  const s = arena(),
    before = JSON.stringify(s);
  const text = c.commandPreview(s, {
    actor: "hero",
    kind: "attack",
    target: s.enemy.id,
  });
  assert.match(text, /Damage preview/);
  assert.equal(JSON.stringify(s), before);
  const n = e.reducer(s, { type: "COMBAT_SPEED", speed: "fast" });
  assert.equal(
    e.normalizeSave(JSON.parse(skillIds.serializeSave(n))).combatSpeed,
    "fast",
  );
});
test("Auto resolution rejects danger and grants exactly normal seeded rewards through the ordinary resolver", () => {
  let s = arena();
  assert.equal(c.canAutoResolve(s), false);
  s = enemy(s, {
    behaviorId: "roadkeeper",
    boss: false,
    hp: 20,
    maxHp: 20,
    atk: 1,
    guard: 0,
  });
  s.party = s.party.map((c) => ({
    ...c,
    level: 10,
    atk: 100,
    speed: 40,
    hp: 1000,
    maxHp: 1000,
    exhaustion: 0,
  }));
  assert.ok(c.canAutoResolve(s));
  const automatic = e.reducer(plain(s), { type: "AUTO_COMBAT" });
  const manual = round(
    plain(s),
    s.party.map((c) => ({ actor: c.id, kind: "attack", target: s.enemy.id })),
  );
  assert.equal(automatic.phase, "loot");
  assert.deepEqual(plain(automatic.inventory), plain(manual.inventory));
  assert.equal(automatic.gold, manual.gold);
  assert.equal(automatic.rng.loot, manual.rng.loot);
  assert.equal(automatic.journey.watches, manual.journey.watches);
  s.combat.defender = true;
  assert.equal(c.canAutoResolve(s), false);
});
console.log(`${count} combat-framework checks passed.`);
