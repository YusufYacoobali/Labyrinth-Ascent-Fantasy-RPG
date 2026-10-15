const assert = require("node:assert/strict");
const {
  e,
  rounds: r,
  exploration: x,
  survival,
  progression: p,
  monsters: m,
  saves,
} = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const plain = (v) => JSON.parse(JSON.stringify(v));
function arena(size = 2, count = 2, floor = 1) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "barbarian",
    name: "Bjorn",
    roll: 0.5,
  });
  for (const id of ["kael", "lyria", "bram"].slice(0, size - 1))
    s = e.reducer(s, { type: "RECRUIT", id });
  s.journey.maps[1] = JSON.parse(JSON.stringify(require("./fixtures/floor-v2-6da6d25.json")));
  s = e.reducer({ ...s, day: 30, food: 30 }, { type: "ENTER" });
  s = {
    ...s,
    floor,
    phase: "combat",
    enemy: e.enemyFor(floor, null, size),
    journey: { ...s.journey, room: "entrance", defender: false },
  };
  s = r.beginCombat(s);
  const first = s.combat.enemies[0];
  s.combat = {
    ...s.combat,
    enemies: Array.from({ length: count }, (_, i) => ({
      ...first,
      id: first.id + ":" + i,
      name: "Foe " + i,
      hp: 500,
      maxHp: 500,
      atk: 1,
      speed: 1,
      archetype: "skirmisher",
      behaviorId: undefined,
      stage: 0,
    })),
  };
  s.enemy = s.combat.enemies[0];
  return s;
}
function request(s, changes = {}) {
  return {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions: s.party
      .filter((c) => c.hp > 0 && !c.ailments.paralysis)
      .map((c) => ({
        actor: c.id,
        kind: "attack",
        target: s.combat.enemies.find((e) => e.hp > 0)?.id,
      })),
    ...changes,
  };
}
function act(s, action, actor = s.party[0].id) {
  const q = request(s);
  q.actions = q.actions.map((a) =>
    a.actor === actor ? { ...a, ...action } : a,
  );
  return e.reducer(s, q);
}
test("Queue completeness and shared reservations are validated atomically", () => {
  let s = arena();
  const before = plain(s);
  assert.ok(r.validateQueue(s, { ...request(s), actions: [] }));
  s = { ...s, potions: 1, momentum: 3 };
  const items = request(s, {
    actions: s.party.map((c) => ({
      actor: c.id,
      kind: "item",
      item: "potion",
      target: c.id,
    })),
  });
  assert.match(r.validateQueue(s, items), /shared/);
  const rejected = e.reducer(s, items);
  assert.equal(rejected.potions, 1);
  assert.deepEqual(plain(rejected.party), before.party);
  const bursts = request(s, {
    actions: s.party.map((c) => ({
      actor: c.id,
      kind: "burst",
      target: s.enemy.id,
    })),
  });
  assert.match(r.validateQueue(s, bursts), /momentum/);
});
test("Initiative sorts effective speed with deterministic ties, skips fallen and impeded actors", () => {
  let s = arena(3);
  s.party = s.party.map((c) => ({ ...c, speed: 10 }));
  s.combat.enemies = s.combat.enemies.map((e) => ({ ...e, speed: 10 }));
  const order = r.initiative(s);
  assert.deepEqual(
    plain(order.map((x) => x.id)),
    [...order].sort((a, b) => a.id.localeCompare(b.id)).map((x) => x.id),
  );
  s.party[0].ailments.paralysis = 1;
  s.party[1].hp = 0;
  assert.equal(request(s).actions.length, 1);
  const next = e.reducer(s, request(s));
  assert.equal(next.party[0].ailments.paralysis, 0);
  assert.equal(next.party[1].hp, 0);
});
test("Each queued attack resolves alone and defeated targets redirect to the first survivor", () => {
  let s = arena();
  s.combat.enemies[0].hp = 1;
  const second = s.combat.enemies[1].hp;
  s = e.reducer(s, request(s));
  assert.equal(s.combat.enemies[0].hp, 0);
  assert.ok(s.combat.enemies[1].hp < second);
  assert.equal(s.combat.round, 2);
});
test("Focus and Guard never produce supporting attacks, items affect only the selected ally", () => {
  let s = arena();
  s.party = s.party.map((c) => ({ ...c, hp: 30, mp: 0 }));
  const hp = s.enemy.hp;
  const q = request(s, {
    actions: [
      { actor: s.party[0].id, kind: "focus" },
      { actor: s.party[1].id, kind: "guard", target: s.party[1].id },
    ],
  });
  let n = e.reducer(s, q);
  assert.equal(n.combat.enemies[0].hp, hp);
  assert.equal(n.party[0].mp, 20);
  assert.equal(n.party[1].mp, 0);
  s = arena();
  s.party = s.party.map((c) => ({ ...c, hp: 30 }));
  n = e.reducer(
    s,
    request(s, {
      actions: [
        {
          actor: s.party[0].id,
          kind: "item",
          item: "potion",
          target: s.party[1].id,
        },
        { actor: s.party[1].id, kind: "guard", target: s.party[1].id },
      ],
    }),
  );
  assert.ok(n.party[1].hp > 30);
  assert.ok(n.party[0].hp <= 30);
  assert.equal(n.potions, s.potions - 1);
});
test("Restoratives that become useless keep their shared supplies", () => {
  let s = arena();
  s.combat.enemies = s.combat.enemies.map((e) => ({
    ...e,
    archetype: "bruiser",
  }));
  s.party[0].hp -= 10;
  const q = request(s, {
    actions: s.party.map((c) => ({
      actor: c.id,
      kind: "item",
      item: "potion",
      target: s.party[0].id,
    })),
  });
  s.potions = 2;
  const n = e.reducer(s, q);
  assert.equal(n.potions, 1);
});
test("Cooldowns and poison advance once per round, mastery remains use-based and battle-capped", () => {
  let s = arena(1, 1);
  s.party[0].skills = ["Twin Strike"];
  s.party[0].learnedSkills = ["Twin Strike"];
  s.party[0].mp = 999;
  s.party[0].maxMp = 999;
  s.combat.enemies[0].hp = 10000;
  s.combat.enemies[0].maxHp = 10000;
  for (let i = 0; i < 7; i++) {
    s = act(
      s,
      i % 2 ? { kind: "attack" } : { kind: "skill", skill: "Twin Strike" },
    );
  }
  assert.equal(s.party[0].mastery["Twin Strike"], 3);
  assert.equal(s.party[0].cooldowns["Twin Strike"], 1);
});
test("Break, resistance, armor and interrupt protection remain individual", () => {
  let s = arena(1, 2);
  s.party[0].skills = ["Shield Bash"];
  s.combat.enemies[0].poise = 1;
  s = act(s, { kind: "skill", skill: "Shield Bash" });
  assert.ok(s.combat.enemies[0].broken > 0);
  assert.equal(s.combat.enemies[1].broken, 0);
  assert.ok(s.combat.enemies[0].controlWard > 0);
});
test("Major guardians change at half HP; the Hollow King changes at 66 and 33 percent", () => {
  for (const floor of [3, 6, 9, 12]) {
    let s = arena(1, 1, floor);
    const foe = s.combat.enemies[0];
    foe.boss = true;
    foe.hp = foe.maxHp * (floor === 12 ? 0.65 : 0.49);
    s = act(s, { kind: "guard", target: s.party[0].id });
    assert.equal(s.combat.enemies[0].stage, 1);
    if (floor === 12) {
      s.combat.enemies[0].hp = 150;
      s = act(s, { kind: "guard", target: s.party[0].id });
      assert.equal(s.combat.enemies[0].stage, 2);
    }
    assert.ok(r.enemyIntent(s, s.combat.enemies[0]).label);
  }
});
test("Retreat accepts enemy responses, traverses an edge and preserves remaining HP across reload", () => {
  let s = arena(1, 1);
  s.journey.room = "loop-west";
  s.journey.history = ["entrance"];
  s.combat.enemies[0].hp = 210;
  s.combat.enemies[0].atk = 30;
  const old = s.party[0].hp,
    id = s.combat.id;
  let n = e.reducer(s, request(s, { actions: [], flee: true }));
  assert.equal(n.journey.room, "entrance");
  assert.equal(n.journey.facing, "east");
  assert.ok(n.party[0].hp < old);
  n = e.normalizeSave(plain(n));
  assert.equal(n.expedition.battles[id].enemies[0].hp, 210);
  assert.notEqual(n.phase, "town");
});
test("Repeated round taps and interrupted playback cannot replay rewards or resources", () => {
  let s = arena(1, 1);
  s.combat.enemies[0].hp = 1;
  const q = request(s, { animate: true });
  let n = e.reducer(s, q);
  assert.equal(n.phase, "loot");
  assert.ok(n.roundPlayback.events.length);
  const gold = n.gold;
  n = e.reducer(n, q);
  assert.equal(n.gold, gold);
  n = e.normalizeSave(plain(n));
  n = { ...n, roundPlayback: null };
  assert.equal(e.reducer(n, q).gold, gold);
  assert.equal(n.lootReceipt.enemies.length, 1);
});
test("Multiple monsters produce one receipt with independently rolled species rewards", () => {
  let s = arena(3, 3);
  s.combat.enemies = s.combat.enemies.map((e, i) => ({
    ...e,
    hp: 1,
    species: m.MONSTERS[i].id,
  }));
  s = e.reducer(s, request(s));
  assert.equal(s.phase, "loot");
  assert.equal(s.lootReceipt.enemies.length, 3);
  assert.equal(s.lootReceipt.gross, 65 + 85 + 235);
  assert.equal(s.kills, 3);
});
test("Three completed rounds spend one watch; the final accepted victory retains its receipt", () => {
  let s = arena(1, 1);
  const watches = s.journey.watches;
  for (let i = 0; i < 3; i++)
    s = act(s, { kind: "guard", target: s.party[0].id });
  assert.equal(s.journey.watches, watches + 1);
  s = {
    ...arena(1, 1),
    journey: { ...arena(1, 1).journey, watches: 179 },
    expedition: { ...arena(1, 1).expedition, rounds: 2 },
  };
  s.combat.enemies[0].hp = 1;
  s = e.reducer(s, request(s));
  assert.equal(s.journey.watches, 180);
  assert.equal(s.phase, "loot");
  s = e.reducer(s, { type: "COLLECT" });
  assert.equal(s.phase, "extraction");
});
test("Daily food uses one party ration; fed rest and hunger apply the agreed values", () => {
  let s = arena(2, 1);
  s = {
    ...s,
    phase: "camp",
    food: 1,
    party: s.party.map((c) => ({ ...c, hp: 100, mp: 0, exhaustion: 70 })),
  };
  let n = survival.passTime(s, 6);
  assert.equal(n.food, 0);
  assert.equal(n.party[0].hp, 145);
  assert.equal(n.party[0].mp, 10);
  assert.equal(n.party[0].exhaustion, 35);
  const hp = n.party[0].hp;
  n = survival.passTime(n, 6);
  assert.equal(n.party[0].hp, hp - 18);
  assert.equal(n.party[0].exhaustion, 50);
});
test("Waiting stops on hunger and sanctuary caches cannot replenish within the same expedition", () => {
  let s = arena(1, 1);
  s = {
    ...s,
    phase: "exploration",
    combat: null,
    journey: { ...s.journey, room: "loop-west" },
  };
  s = x.enterMappedRoom(s, "sanctuary");
  const food = s.food;
  s = x.enterMappedRoom(s, "sanctuary");
  assert.equal(s.food, food);
  s = { ...s, food: 0 };
  s = e.reducer(s, { type: "CAMP_REST", untilClose: true });
  assert.equal(s.journey.watches, 6);
  assert.equal(s.phase, "camp");
});
test("Foraging attempts persist once and wild camps consume a kit instead of giving instant recovery", () => {
  let s = arena(1, 1);
  s = {
    ...s,
    phase: "exploration",
    combat: null,
    inventory: { ...s.inventory, "camp-kit": 1 },
    journey: { ...s.journey, room: "entrance" },
  };
  let n = e.reducer(s, { type: "FORAGE" });
  assert.equal(n.expedition.foraged.length, 1);
  const again = e.reducer(n, { type: "FORAGE" });
  assert.equal(again.journey.watches, n.journey.watches);
  s = e.reducer(s, { type: "WILD_CAMP" });
  assert.equal(s.phase, "camp");
  assert.equal(s.inventory["camp-kit"], 0);
  assert.equal(s.journey.wildCamp, true);
});
test("Injuries cap at two, treatment restores capacity, and three town work days heal one", () => {
  let s = arena(1, 1),
    c = s.party[0];
  c = survival.setInjuries(c, 2);
  assert.equal(c.maxHp, 144);
  assert.equal(c.speed, s.party[0].speed - 2);
  assert.equal(survival.setInjuries(c, 3).injuries, 2);
  s = { ...s, phase: "town", day: 61, party: [c], gold: 1000 };
  s = e.reducer(s, { type: "TREAT_INJURY", id: c.id });
  assert.equal(s.party[0].injuries, 1);
  assert.equal(s.gold, 900);
  for (let i = 0; i < 3; i++) s = e.reducer(s, { type: "WORK" });
  assert.equal(s.party[0].injuries, 0);
  assert.equal(s.party[0].maxHp, 180);
});
test("An ally cured before initiative waits for a new queued action next round", () => {
  let s = arena(2, 1);
  s.party[0].speed = 50;
  s.party[1].speed = 10;
  s.party[1].ailments.paralysis = 1;
  s.inventory.antidote = 1;
  const hp = s.combat.enemies[0].hp;
  const n = e.reducer(
    s,
    request(s, {
      actions: [
        {
          actor: s.party[0].id,
          kind: "item",
          item: "antidote",
          target: s.party[1].id,
        },
      ],
    }),
  );
  assert.equal(n.party[1].ailments.paralysis, 0);
  assert.equal(n.combat.enemies[0].hp, hp);
  assert.equal(n.inventory.antidote, 0);
});
test("Completed loot receipts remain durable after presentation is dismissed", () => {
  let s = arena(1, 1);
  s.combat.enemies[0].hp = 1;
  s = e.reducer(s, request(s));
  const id = s.lootReceipt.id;
  s = e.reducer(s, { type: "COLLECT" });
  assert.equal(s.lootReceipt, null);
  assert.ok(s.expedition.receipts[id]);
  assert.equal(s.expedition.receipts[id].gross, 65);
});
test("Playback events for Focus, Guard and items never inherit another actor's attack", () => {
  let s = arena(3, 1);
  s.party[0].speed = 40;
  s.party[1].speed = 30;
  s.party[2].speed = 20;
  s.party[2].mp = 0;
  const actions = [
    { actor: s.party[0].id, kind: "attack", target: s.enemy.id },
    { actor: s.party[1].id, kind: "guard", target: s.party[1].id },
    { actor: s.party[2].id, kind: "focus" },
  ];
  const n = e.reducer(s, request(s, { actions, animate: true }));
  for (const event of n.roundPlayback.events.filter(
    (event) =>
      event.action && ["focus", "guard", "item"].includes(event.action.kind),
  )) {
    assert.deepEqual(plain(event.effects.strikes), {});
    assert.equal(event.effects.damage, 0);
  }
});
test("Mastered defensive powers prevent their matching heavy-hit impediments", () => {
  for (const [element, skill] of [
    ["fire", "Ember Ward"],
    ["frost", "Winter Veil"],
    ["physical", "Grave Guard"],
  ]) {
    const make = (protectedSkill) => {
      let s = arena(1, 1, 3);
      s.combat.round = 2;
      s.combat.enemies[0] = {
        ...s.combat.enemies[0],
        boss: true,
        element,
        atk: 20,
        speed: 99,
      };
      s.party[0].skills = protectedSkill ? [skill] : [];
      s.party[0].mastery = { [skill]: 12 };
      return s;
    };
    const plainState = make(false),
      protectedState = make(true),
      a = e.reducer(plainState, request(plainState)),
      b = e.reducer(protectedState, request(protectedState));
    assert.equal(a.effects.damage, 0);
    assert.ok(b.effects.damage > 0);
  }
});
test("Control mastery slows individual initiative for two later rounds", () => {
  let s = arena(1, 1);
  s.party[0].skills = ["Shield Bash"];
  s.party[0].mastery = { "Shield Bash": 12 };
  s.combat.enemies[0].speed = 20;
  s = act(s, { kind: "skill", skill: "Shield Bash" });
  assert.equal(s.combat.enemies[0].slowed, 2);
  assert.equal(s.combat.enemies[0].slowTurns, 2);
  s = act(s, { kind: "guard", target: s.party[0].id });
  assert.equal(s.combat.enemies[0].slowed, 2);
  s = act(s, { kind: "guard", target: s.party[0].id });
  assert.equal(s.combat.enemies[0].slowed, 0);
});
test("Foraging and a room's original fight retain separate durable identities", () => {
  let s = arena(1, 1);
  const original = s.combat.id;
  s = r.beginCombat({ ...s, combat: null }, "exploration", "forage");
  assert.notEqual(s.combat.id, original);
  assert.ok(s.expedition.battles[original]);
  assert.ok(s.expedition.battles[s.combat.id]);
  const reload = e.normalizeSave(plain(s));
  assert.equal(
    r.beginCombat(reload, "exploration", "forage").combat.id,
    s.combat.id,
  );
});
test("A wild camp ambush cannot resolve or consume an unrelated room encounter", () => {
  let s = arena(1, 1);
  const key = x.encounterKey(s);
  s = {
    ...s,
    phase: "branch",
    inventory: { ...s.inventory, "camp-kit": 1 },
    journey: {
      ...s.journey,
      branch: { id: key, kind: "cache", direction: "straight" },
    },
  };
  s = e.reducer(s, { type: "WILD_CAMP" });
  assert.equal(s.journey.branch, null);
  assert.equal(s.journey.defender, false);
  let seed = 1;
  while (m.nextRandom(seed).roll >= 0.2) seed++;
  s.rng.encounters = seed;
  s = e.reducer(s, { type: "CAMP_REST" });
  assert.equal(s.phase, "combat");
  assert.equal(s.combat.resume, "camp");
  assert.ok(!s.journey.resolvedBranches.includes(key));
});
console.log(count + " round combat and survival checks passed.");
