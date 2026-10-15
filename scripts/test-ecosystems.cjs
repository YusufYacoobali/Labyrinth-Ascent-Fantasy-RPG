const assert = require("node:assert/strict");
const {
  e,
  rounds: r,
  status: t,
  monsters: m,
  ecology: { ECOLOGY },
  ecosystems: { ECOSYSTEMS },
  support,
  powers,
  combatData: data,
  skillIds,
} = require("./engine-loader.cjs");
const plain = (v) => JSON.parse(JSON.stringify(v));
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function arena(floor, route = null) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
  s = e.reducer(s, { type: "RECRUIT", id: "kael" });
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  return r.beginCombat({
    ...s,
    floor,
    route,
    phase: "combat",
    enemy: e.enemyFor(floor, route, 2),
    journey: { ...s.journey, room: "portal", defender: true },
  });
}
function replan(s) {
  s.combat.intents = undefined;
  s.enemy = s.combat.enemies.find((e) => e.hp > 0);
  return s;
}
function round(
  s,
  actions = s.party
    .filter((c) => c.hp > 0 && !t.impeded(c))
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
function healthy(s) {
  s.party = s.party.map((c) => ({ ...c, hp: 10000, maxHp: 10000, atk: 5 }));
  return s;
}
test("All 44 species have eligibility, defenses, meaningful weaknesses, real rewards and three ranked essence effects", () => {
  assert.equal(m.MONSTERS.length, 44);
  assert.equal(new Set(m.MONSTERS.map((m) => m.id)).size, 44);
  for (const spec of m.MONSTERS) {
    const ecology = ECOLOGY[spec.id];
    assert.ok(ecology, spec.id);
    assert.ok(ecology.floors.every((f) => f >= 1 && f <= 12));
    assert.ok(ecology.biomes.length);
    assert.ok(ecology.weaknesses.length);
    assert.ok(spec.gold > 0 && spec.xp > 0);
    assert.equal(data.SKILL_RANKS[spec.skill].length, 3);
  }
});
test("Every floor and route forms authored eligible groups; floor five has a route-influenced Echo Revenant", () => {
  for (let floor = 1; floor <= 12; floor++)
    for (const route of floor >= 5 && floor <= 7
      ? ["roots", "frost", "forge", "crypt"]
      : [null]) {
      const s = arena(floor, route);
      assert.ok(s.combat.enemies.length <= 3);
      for (const foe of s.combat.enemies)
        assert.ok(
          ECOLOGY[foe.species].floors.includes(floor),
          `${foe.species} floor ${floor}`,
        );
      if (floor === 5) {
        assert.equal(s.combat.enemies[0].species, "revenant");
        assert.equal(
          s.combat.enemies[0].element,
          { roots: "venom", frost: "frost", forge: "fire", crypt: "physical" }[
            route
          ],
        );
      }
    }
});
test("Skeleton menders heal wounded allies; runic guardians announce wards, fragments and charged slams", () => {
  let s = healthy(arena(2));
  const healer = s.combat.enemies.find((e) => e.species === "skeleton-mender");
  s.combat.round = 3;
  s.turn = 3;
  s.combat.enemies[0].hp = Math.round(s.combat.enemies[0].maxHp * 0.4);
  replan(s);
  const hp = s.combat.enemies[0].hp;
  const healed = support.resolveEnemySupport(
    s,
    healer.id,
    r.enemyIntent(s, healer),
  );
  assert.equal(healed.kind, "heal");
  assert.ok(healed.state.combat.enemies[0].hp > hp);
  s = healthy(arena(3));
  assert.equal(r.enemyIntent(s, s.enemy).kind, "charge");
  s.enemy.hp = s.enemy.maxHp * 0.7;
  replan(s);
  assert.equal(r.enemyIntent(s, s.enemy).kind, "summon");
  s = round(s);
  assert.ok(s.combat.enemies.some((e) => e.species === "runic-fragment"));
});
test("Broodmother opens with poison, hatches two real spiderlings at 75%, consumes at 50% and charges its 25% storm", () => {
  let s = healthy(arena(4));
  assert.equal(r.enemyIntent(s, s.enemy).status, "venom");
  assert.equal(r.enemyIntent(s, s.enemy).targets.length, 2);
  s.enemy.hp = Math.floor(s.enemy.maxHp * 0.74);
  replan(s);
  s = round(s);
  assert.equal(
    s.combat.enemies.filter((e) => e.species === "spiderling").length,
    2,
  );
  assert.equal(s.combat.enemies[0].waves, 1);
  let mother = s.combat.enemies[0];
  mother.hp = Math.floor(mother.maxHp * 0.49);
  mother.stage = 2;
  replan(s);
  assert.equal(r.enemyIntent(s, mother).kind, "consume");
  const old = mother.hp;
  s = round(s);
  mother = s.combat.enemies[0];
  assert.ok(mother.hp > old);
  assert.equal(mother.stage, 2);
  assert.ok(
    s.combat.enemies.some((e) => e.hp === 0 && e.rewardEligible === false),
  );
  mother.hp = Math.floor(mother.maxHp * 0.24);
  mother.stage = 3;
  mother.charged = false;
  s.combat.round = 2;
  replan(s);
  assert.equal(r.enemyIntent(s, mother).kind, "charge");
});
test("Eliminating spiderlings denies consumption; consumed units cannot add essence rolls or duplicated receipt entries", () => {
  let s = healthy(arena(4));
  const mother = s.combat.enemies[0];
  mother.hp = Math.floor(mother.maxHp * 0.4);
  mother.usedMoves = { spiderlings: 1 };
  mother.waves = 1;
  mother.stage = 2;
  replan(s);
  assert.notEqual(r.enemyIntent(s, mother).kind, "consume");
  let spawned = support.resolveEnemySupport(s, mother.id, {
    kind: "summon",
    label: "Hatch",
    targets: [],
    power: 0,
    summon: "spiderling",
    limit: 2,
    count: 2,
    move: "test-wave",
  }).state;
  const consumed = support.resolveEnemySupport(spawned, mother.id, {
    kind: "consume",
    label: "Consume",
    targets: [],
    power: 0.2,
    move: "consume",
  }).state;
  assert.equal(
    consumed.combat.enemies.filter((e) => e.rewardEligible === false).length,
    1,
  );
  consumed.party = consumed.party.map((c) => ({
    ...c,
    atk: 100000,
    speed: 1000,
  }));
  let won = round(
    consumed,
    consumed.party.map((c) => ({
      actor: c.id,
      kind: "attack",
      target: mother.id,
    })),
  );
  if (won.phase === "combat")
    won = round(
      won,
      won.party.map((c) => ({
        actor: c.id,
        kind: "attack",
        target: won.combat.enemies.find((e) => e.hp > 0).id,
      })),
    );
  assert.equal(won.phase, "loot");
  assert.equal(won.lootReceipt.enemies.length, 2);
});
test("All four route guardians have different moves, minions and unique signature powers", () => {
  const kinds = new Set(),
    skills = new Set(),
    minions = new Set();
  for (const route of ["roots", "frost", "forge", "crypt"]) {
    let s = healthy(arena(6, route));
    const boss = s.combat.enemies[0];
    boss.hp = Math.floor(boss.maxHp * 0.6);
    replan(s);
    const intent = r.enemyIntent(s, boss);
    assert.equal(intent.kind, "summon");
    minions.add(intent.summon);
    skills.add(m.MONSTERS.find((m) => m.id === boss.species).skill);
    kinds.add(ECOSYSTEMS[boss.species].moves.map((m) => m.kind).join(","));
    s = round(s);
    assert.equal(s.combat.enemies.length, 3);
  }
  assert.equal(kinds.size, 4);
  assert.equal(skills.size, 4);
  assert.equal(minions.size, 4);
});
test("Crypt resurrection keeps its original identity, waits a round and is finite across reload", () => {
  let s = healthy(arena(6, "crypt"));
  s.enemy.hp = Math.floor(s.enemy.maxHp * 0.7);
  replan(s);
  s = round(s);
  const boss = s.combat.enemies[0],
    dead = s.combat.enemies[1];
  dead.hp = 0;
  replan(s);
  const intent = r.enemyIntent(s, boss);
  assert.equal(intent.kind, "revive");
  s = round(s, undefined, true);
  const restored = s.combat.enemies.find((e) => e.id === dead.id);
  assert.ok(restored.hp > 0);
  assert.ok(!s.roundPlayback.events.some((event) => event.actor === dead.id));
  s = e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
  s = e.reducer(s, { type: "FINISH_PLAYBACK" });
  s.combat.enemies.find((e) => e.id === dead.id).hp = 0;
  replan(s);
  assert.notEqual(r.enemyIntent(s, s.combat.enemies[0]).kind, "revive");
});
test("Ashen counterattacks punish physical contact, while venom avoids retaliation; concealment responds to exposure", () => {
  function strike(skill) {
    let s = healthy(arena(9));
    s.combat.enemies = [
      {
        ...s.combat.enemies[0],
        speed: 1,
        atk: 40,
        poise: 1000,
        maxPoise: 1000,
        counter: { element: "fire", power: 0.3, turns: 2 },
      },
    ];
    s.combat.intents = undefined;
    s.party[0].skills = skill ? [skill] : [];
    s.party[0].mp = 100;
    s.party[0].maxMp = 100;
    return round(
      s,
      [
        {
          actor: "hero",
          kind: skill ? "skill" : "attack",
          skill,
          target: s.combat.enemies[0].id,
        },
        { actor: "kael", kind: "focus" },
      ],
      true,
    );
  }
  assert.ok(
    strike().roundPlayback.events.some((e) => e.text.includes("retaliates")),
  );
  assert.ok(
    !strike("Venom Fang").roundPlayback.events.some((e) =>
      e.text.includes("retaliates"),
    ),
  );
  let s = healthy(arena(10));
  s.combat.enemies = [
    { ...s.combat.enemies[0], concealed: 2, poise: 1000, maxPoise: 1000 },
  ];
  s.party[0].atk = 40;
  const q = { actor: "hero", kind: "attack", target: s.combat.enemies[0].id };
  const before = require("./engine-loader.cjs").commands.commandPreview(s, q);
  s.combat.enemies[0].conditions = t.applyCondition(undefined, "exposed", 1);
  const after = require("./engine-loader.cjs").commands.commandPreview(s, q);
  assert.notEqual(before, after);
});
test("Royal execution marks are announced and target the marked ally; the Hollow King's waves and final attack remain bounded", () => {
  let s = healthy(arena(11));
  assert.equal(r.enemyIntent(s, s.enemy).kind, "mark");
  s = round(s);
  const marked = s.party.find((c) => c.ailments.conditions?.exposed);
  assert.ok(marked);
  replan(s);
  assert.ok(r.enemyIntent(s, s.combat.enemies[0]).targets.includes(marked.id));
  s = healthy(arena(12));
  s.enemy.hp = Math.floor(s.enemy.maxHp * 0.65);
  s.enemy.stage = 1;
  replan(s);
  s = round(s);
  assert.equal(
    s.combat.enemies.filter((e) => e.species === "hollow-knight").length,
    2,
  );
  assert.equal(s.combat.enemies[0].waves, 1);
  s.combat.enemies[1].hp = 0;
  s.combat.enemies[2].hp = 0;
  s.combat.enemies[0].hp = Math.floor(s.combat.enemies[0].maxHp * 0.32);
  s.combat.enemies[0].stage = 2;
  replan(s);
  s = round(s);
  assert.equal(s.combat.enemies[0].waves, 2);
  assert.equal(s.combat.enemies.filter((e) => e.hp > 0).length, 3);
  s.combat.round = 2;
  s.combat.enemies[0].charged = false;
  replan(s);
  assert.equal(r.enemyIntent(s, s.combat.enemies[0]).kind, "charge");
});
test("New essence powers spend actual MP, apply their signature effects and preserve mastery identities through saves", () => {
  for (const power of powers.ESSENCE_POWERS) {
    let s = healthy(arena(2));
    s.combat.enemies = [
      {
        ...s.combat.enemies[0],
        behaviorId: undefined,
        boss: false,
        hp: 10000,
        maxHp: 10000,
        speed: 1,
        atk: 1,
        archetype: "skirmisher",
        conditions: {},
        controlWard: 0,
      },
    ];
    s.combat.intents = undefined;
    s.party[0].skills = [power.name];
    s.party[0].learnedSkills = [power.name];
    s.party[0].mp = 100;
    s.party[0].maxMp = 100;
    s.party[0].hp = 5000;
    s.party[1].hp = 5000;
    const n = round(s, [
      {
        actor: "hero",
        kind: "skill",
        skill: power.name,
        target: s.combat.enemies[0].id,
      },
      { actor: "kael", kind: "focus" },
    ]);
    assert.equal(
      n.party[0].mp,
      100 - power.cost + (power.mpGain || 0),
      power.name,
    );
    assert.equal(n.party[0].mastery[power.name], 1, power.name);
    if (power.status)
      assert.ok(
        n.combat.enemies[0].conditions[power.status] ||
          (power.status === "chilled" && n.combat.enemies[0].conditions.frozen),
        power.name,
      );
    if (power.barrier)
      assert.ok((n.party[0].ailments.barrier || 0) > 0, power.name);
    assert.equal(
      e.normalizeSave(JSON.parse(skillIds.serializeSave(n))).party[0].mastery[
        power.name
      ],
      1,
      power.name,
    );
  }
});
test("Bestiary records actual observations and unique defeats without rewarding reloads or repeated victory actions", () => {
  let s = healthy(arena(2));
  assert.ok(s.bestiary.roadkeeper);
  s = round(s, undefined, true);
  assert.ok(s.bestiary.roadkeeper.moves.length);
  s = e.reducer(s, { type: "FINISH_PLAYBACK" });
  s.party = s.party.map((c) => ({ ...c, atk: 100000, speed: 1000 }));
  for (let i = 0; i < 5 && s.phase === "combat"; i++)
    s = round(
      s,
      s.party
        .filter((c) => c.hp > 0 && !t.impeded(c))
        .map((c) => ({
          actor: c.id,
          kind: "attack",
          target: s.combat.enemies.find((e) => e.hp > 0).id,
        })),
    );
  assert.equal(s.phase, "loot");
  assert.equal(s.bestiary.roadkeeper.defeated, 1);
  const old = plain(s.bestiary);
  s = e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
  s = round(s, []);
  assert.deepEqual(plain(s.bestiary), old);
});
test("Late-phase wards persist, announce their counter and shatter on a real break without resetting phase progress", () => {
  let s = healthy(arena(4));
  const boss = s.combat.enemies[0];
  boss.hp = Math.floor(boss.maxHp * 0.2);
  boss.stage = 2;
  boss.usedMoves = { spiderlings: 1, consume: 1 };
  replan(s);
  s = round(s, undefined, true);
  assert.equal(s.combat.enemies[0].stage, 3);
  assert.ok(s.combat.enemies[0].shield > 0);
  assert.ok(
    s.roundPlayback.events.some(
      (event) =>
        event.kind === "phase" && event.text.includes("breakable ward"),
    ),
  );
  s = e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
  s = e.reducer(s, { type: "FINISH_PLAYBACK" });
  s.combat.enemies[0].poise = 5;
  s.combat.enemies[0].controlWard = 0;
  s.party[0].skills = ["Shield Bash"];
  s.party[0].speed = 100;
  s.party[0].atk = 2;
  replan(s);
  s = round(s, [
    { actor: "hero", kind: "skill", skill: "Shield Bash", target: s.enemy.id },
    { actor: "kael", kind: "focus" },
  ]);
  assert.equal(s.combat.enemies[0].shield, 0);
  assert.equal(s.combat.enemies[0].stage, 3);
});
test("Pack damage responds to surviving packmates and fresh announced intents switch to newly wounded prey", () => {
  let s = healthy(arena(7, "frost"));
  const hunter = s.combat.enemies.find((e) => e.species === "frost-roamer");
  const before = r.enemyIntent(s, hunter);
  assert.match(before.label, /pack/);
  s.combat.enemies.find((e) => e.species === "wolf-pack").hp = 0;
  s.party[1].hp = 100;
  replan(s);
  const after = r.enemyIntent(s, hunter);
  assert.ok(after.power < before.power);
  assert.deepEqual(Array.from(after.targets), ["kael"]);
});
test("Signature healing barriers count as meaningful protection but full repeated barriers consume no resources or mastery", () => {
  let s = healthy(arena(2));
  s.combat.enemies = [
    { ...s.combat.enemies[0], paralysis: 10, hp: 10000, maxHp: 10000 },
  ];
  s.party[0].skills = ["Burial Hymn"];
  s.party[0].learnedSkills = ["Burial Hymn"];
  s.party[0].mp = 100;
  s.party[0].maxMp = 100;
  replan(s);
  const actions = [
    { actor: "hero", kind: "skill", skill: "Burial Hymn", target: s.enemy.id },
    { actor: "kael", kind: "focus" },
  ];
  s = round(s, actions);
  assert.equal(s.party[0].mastery["Burial Hymn"], 1);
  assert.ok(s.party.every((c) => c.ailments.barrier === 6));
  const mp = s.party[0].mp;
  s.party[0].cooldowns["Burial Hymn"] = 0;
  s = round(s, actions);
  assert.equal(s.party[0].mp, mp);
  assert.equal(s.party[0].mastery["Burial Hymn"], 1);
});
test("Retaliation honors learned wards and their mastery, while frozen companions cannot provide bonded protection", () => {
  let s = healthy(arena(9));
  s.combat.enemies = [
    {
      ...s.combat.enemies[0],
      hp: 10000,
      maxHp: 10000,
      atk: 40,
      speed: 1,
      poise: 1000,
      maxPoise: 1000,
      counter: { element: "fire", power: 0.3, turns: 2 },
    },
  ];
  s.party[0] = {
    ...s.party[0],
    hp: 200,
    maxHp: 200,
    speed: 40,
    skills: ["Ember Ward"],
    learnedSkills: ["Ember Ward"],
    mastery: { "Ember Ward": 12 },
  };
  s.stories.pairs["hero:kael"] = 2;
  s.party[1].ailments.conditions = t.applyCondition(undefined, "frozen", 1);
  replan(s);
  const n = round(s, [{ actor: "hero", kind: "attack", target: s.enemy.id }]);
  assert.equal(n.party[0].hp, 197);
  assert.equal(n.party[0].mastery["Ember Ward"], 13);
});
console.log(`${count} monster-ecosystem checks passed.`);
