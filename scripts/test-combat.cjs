const assert = require("node:assert/strict");
const { e } = require("./engine-loader.cjs");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
function arena(race = "barbarian", size = 1) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race,
    name: "Hero",
    roll: 0.5,
  });
  s.party.push(
    ...["human", "elf", "dwarf"]
      .slice(0, size - 1)
      .map((r, i) => e.makeCharacter(r, "ally" + i, "Ally" + i)),
  );
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  s = e.reducer(s, { type: "APPROACH", choice: "sneak", roll: 0.99 });
  s = e.reducer(s, { type: "ENGAGE" });
  return {
    ...s,
    enemy: { ...s.enemy, hp: 10000, maxHp: 10000, atk: 28, paralysis: 0 },
  };
}
const act = (s, kind, extra = {}) =>
  e.reducer(s, { type: "BATTLE", kind, roll: 0.5, ...extra });
test("Intent targets do not change with random rolls", () => {
  const s = arena("barbarian", 4),
    target = e.battleIntent(s).targets[0];
  for (const roll of [0.1, 0.5, 0.99]) {
    const result = act(s, "attack", { roll });
    assert.equal(result.effects.target, target);
    assert.equal(result.effects.targets[target], e.battleForecast(s)[target]);
  }
});
test("Charge and recovery are windows without incoming damage", () => {
  let s = arena();
  s.turn = 2;
  let next = act(s, "attack");
  assert.equal(next.effects.enemyDamage, 0);
  assert.equal(next.enemy.charged, true);
  assert.equal(e.battleIntent(next).kind, "heavy");
  s = { ...s, turn: 4 };
  const recover = act(s, "attack");
  assert.equal(recover.effects.enemyDamage, 0);
  assert.equal(recover.effects.damage, Math.round(32 * 1.2));
});
test("Guard redirects a single hit to the selected tank", () => {
  const s = arena("barbarian", 4);
  const guarded = act(s, "guard", { actor: "ally2" });
  assert.deepEqual(Object.keys(guarded.effects.targets), ["ally2"]);
  assert.equal(
    guarded.effects.enemyDamage,
    e.battleForecast(s, true, "ally2").ally2,
  );
  assert.equal(guarded.momentum, 1);
  assert.equal(guarded.effects.damage, 0);
});
test("Boss heavy hits every standing ally; guard halves each hit", () => {
  const s = arena("barbarian", 4);
  s.turn = 3;
  s.enemy.boss = true;
  s.enemy.charged = true;
  const a = act(s, "attack"),
    g = act(s, "guard", { actor: "ally2" });
  assert.equal(Object.keys(a.effects.targets).length, 4);
  for (const id of Object.keys(a.effects.targets))
    assert.ok(Math.abs(g.effects.targets[id] - a.effects.targets[id] / 2) <= 1);
});
test("Focus restores only selected MP while others strike at 55%", () => {
  const s = arena("barbarian", 4);
  s.turn = 2;
  s.party.forEach((c) => (c.mp = 0));
  const n = act(s, "focus", { actor: "ally1" });
  assert.equal(n.party[2].mp, 20);
  assert.equal(n.party[0].mp, 0);
  assert.ok(n.effects.damage > 0);
  assert.ok(n.effects.damage < act(s, "attack").effects.damage);
  assert.equal(n.momentum, 1);
});
test("Burst rejects insufficient momentum without changing resources", () => {
  const s = arena(),
    n = act(s, "burst");
  assert.equal(n.turn, s.turn);
  assert.equal(n.enemy.hp, s.enemy.hp);
  assert.equal(n.party[0].mp, s.party[0].mp);
  assert.equal(n.effects.id, s.effects.id);
});
test("Burst spends two momentum and breaks a charged attack", () => {
  const s = arena();
  s.turn = 3;
  s.momentum = 3;
  s.enemy.charged = true;
  s.enemy.poise = 50;
  const n = act(s, "burst");
  assert.equal(n.momentum, 1);
  assert.equal(n.enemy.broken, 1);
  assert.equal(n.effects.broken, true);
  assert.equal(n.effects.enemyDamage, 0);
  assert.equal(n.enemy.charged, false);
  const next = act(n, "attack");
  assert.equal(
    next.effects.damage,
    Math.round(32 * (1 - n.party[0].exhaustion * 0.003) * 1.3),
  );
  assert.equal(next.enemy.poise, next.enemy.maxPoise);
  assert.equal(next.enemy.broken, 0);
});
test("Cooldown rejects repeated casts, then becomes ready after intervening turns", () => {
  let s = arena();
  s.turn = 2;
  const n = act(s, "skill", { skill: "Twin Strike" });
  assert.equal(n.party[0].cooldowns["Twin Strike"], 1);
  const invalid = act(n, "skill", { skill: "Twin Strike" });
  assert.equal(invalid.turn, n.turn);
  assert.equal(invalid.party[0].mp, n.party[0].mp);
  const waited = act(n, "attack");
  assert.equal(waited.party[0].cooldowns["Twin Strike"], 0);
  assert.equal(
    act(waited, "skill", { skill: "Twin Strike" }).effects.id,
    waited.effects.id + 1,
  );
});
test("Interrupt ward prevents a second caster from locking the enemy continuously", () => {
  const s = arena("human", 2);
  s.party.forEach((c) => {
    c.skills = ["Nerve Lock"];
    c.mp = 100;
  });
  let n = act(s, "skill", { skill: "Nerve Lock", actor: "hero", roll: 0.1 });
  assert.equal(n.effects.stunned, true);
  n.turn = 3;
  n.enemy.charged = true;
  const next = act(n, "skill", {
    skill: "Nerve Lock",
    actor: "ally0",
    roll: 0.1,
  });
  assert.equal(next.effects.stunned, false);
  assert.ok(next.effects.enemyDamage > 0);
  assert.equal(next.enemy.poise, 10);
});
test("Paralysed caster cannot spend mana or cooldown; other commands advance the ailment", () => {
  const s = arena();
  s.party[0].ailments.paralysis = 1;
  const invalid = act(s, "skill", { skill: "Twin Strike" });
  assert.equal(invalid.turn, s.turn);
  assert.equal(invalid.party[0].mp, s.party[0].mp);
  const n = act(s, "attack");
  assert.equal(n.effects.damage, 0);
  assert.equal(n.party[0].ailments.paralysis, 0);
});
test("Mage begins with armor-piercing Arcane Bolt", () => {
  const c = e.makeCharacter("human", "hero", "Mage", 0.01);
  assert.ok(c.skills.includes("Arcane Bolt"));
  let s = arena();
  s.party = [c];
  s.enemy.guard = 20;
  const n = act(s, "skill", { skill: "Arcane Bolt" });
  assert.equal(n.effects.damage, Math.round(c.atk * 1.65));
  assert.equal(n.party[0].mp, c.mp - 14);
});
test("Enemy HP scales with party size and momentum resets at the next floor", () => {
  const one = arena(),
    four = arena("barbarian", 4);
  const fresh = (size) =>
    e.reducer(
      {
        ...e.initialGame(),
        started: true,
        day: 30,
        party: four.party.slice(0, size),
      },
      { type: "ENTER" },
    );
  assert.ok(fresh(4).enemy.maxHp > fresh(1).enemy.maxHp * 3);
  const n = e.reducer(
    {
      ...four,
      phase: "victory",
      journey: { ...four.journey, portal: true, room: "cross-6" },
      momentum: 3,
      food: 5,
    },
    { type: "CONTINUE" },
  );
  assert.equal(n.momentum, 0);
  assert.equal(n.party[0].cooldowns["Twin Strike"], undefined);
  assert.ok(one.enemy.maxPoise > 0);
});
test("Old saves get combat fields without changing current HP or mage identity", () => {
  const s = arena("human", 4);
  delete s.momentum;
  delete s.effects.targets;
  delete s.effects.broken;
  for (const c of s.party) delete c.cooldowns;
  for (const k of ["poise", "maxPoise", "broken", "controlWard", "charged"])
    delete s.enemy[k];
  s.party[0].job = "Mage";
  const n = e.normalizeSave(s);
  assert.equal(n.enemy.hp, s.enemy.hp);
  assert.equal(n.party[0].job, "Mage");
  assert.equal(n.momentum, 0);
  assert.deepEqual(Object.keys(n.effects.targets), []);
  assert.equal(n.enemy.maxPoise, 100);
  assert.deepEqual(Object.keys(n.party[0].cooldowns), []);
});
console.log(count + " tactical combat checks passed.");
