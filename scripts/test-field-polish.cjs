const assert = require("node:assert/strict");
const {
  e,
  w,
  exploration: x,
  monsters: m,
  townLife: town,
  walkthrough: wt,
  rounds,
} = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  console.log("PASS " + name);
  count++;
};
const reload = (s) => e.normalizeSave(JSON.parse(JSON.stringify(s)));
function fresh(race = "human") {
  return e.reducer(e.initialGame(), {
    type: "CREATE",
    race,
    name: "Climber",
    seed: 42,
    roll: 0.5,
  });
}
function field() {
  let s = e.reducer({ ...fresh(), day: 30, food: 40 }, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  s = e.reducer(s, { type: "ENGAGE" });
  return {
    ...s,
    eventResolved: true,
    party: s.party.map((c) => ({
      ...c,
      hp: Math.floor(c.maxHp / 2),
      mp: 0,
      exhaustion: 50,
    })),
  };
}
function seedFor(ambush, floor = 1) {
  for (let seed = 0; seed < 10000; seed++)
    if (m.nextRandom(seed).roll < x.restHereRisk(floor) === ambush) return seed;
  throw new Error("No matching encounter seed");
}
function rest(s, ambush) {
  return e.reducer(
    { ...s, rng: { ...s.rng, encounters: seedFor(ambush, s.floor) } },
    { type: "REST_HERE" },
  );
}
function home(s) {
  return e.reducer(
    {
      ...s,
      phase: "extraction",
      day: 60,
      journey: { ...s.journey, watches: 180 },
    },
    { type: "RETURN" },
  );
}
function plunderers() {
  const s = field();
  return e.reducer(
    {
      ...s,
      phase: "event",
      eventResolved: false,
      journey: { ...s.journey, defender: false },
      party: s.party.map((c) => ({ ...c, hp: c.maxHp, exhaustion: 0 })),
    },
    { type: "EVENT", choice: "watch", roll: 0.5 },
  );
}
function win(s) {
  s = {
    ...s,
    party: s.party.map((c) => ({ ...c, atk: 10000, speed: 100 })),
    combat: {
      ...s.combat,
      enemies: s.combat.enemies.map((foe) => ({ ...foe, hp: 1, guard: 0 })),
    },
  };
  let next = s;
  for (const foe of s.combat.enemies) {
    if (next.phase !== "combat") break;
    next = e.reducer(next, {
      type: "ROUND",
      battleId: next.combat.id,
      round: next.combat.round,
      actions: [{ actor: "hero", kind: "attack", target: foe.id }],
    });
  }
  assert.equal(next.phase, "loot");
  return next;
}

test("Rest here spends one day and ration, recovers once, and keeps the same room", () => {
  const s = field(),
    next = rest(s, false);
  assert.equal(next.phase, "exploration");
  assert.equal(next.day, s.day + 1);
  assert.equal(next.journey.watches, s.journey.watches + 6);
  assert.equal(next.food, s.food - 1);
  assert.equal(
    next.party[0].hp,
    s.party[0].hp + Math.round(s.party[0].maxHp * 0.25),
  );
  assert.equal(next.party[0].mp, Math.round(s.party[0].maxMp * 0.25));
  assert.equal(next.party[0].exhaustion, 15);
  assert.equal(next.journey.room, s.journey.room);
  assert.match(next.message, /No one finds you/);
  assert.equal(reload(next).day, next.day);
});
test("Hungry, fallen and out-of-expedition parties cannot obtain free rest", () => {
  for (const s of [
    fresh(),
    { ...field(), food: 0 },
    { ...field(), party: field().party.map((c) => ({ ...c, hp: 0 })) },
  ]) {
    const next = e.reducer(s, { type: "REST_HERE" });
    assert.equal(next.day, s.day);
    assert.equal(next.journey.watches, s.journey.watches);
    assert.equal(next.party[0].hp, s.party[0].hp);
    assert.equal(next.rng.encounters, s.rng.encounters);
  }
});
test("Resting can produce a real ambush after recovery without resolving the room's story", () => {
  const s = field(),
    key = x.encounterKey(s);
  const next = rest(
    {
      ...s,
      phase: "branch",
      journey: {
        ...s.journey,
        branch: { id: key, kind: "cache", direction: "left" },
      },
    },
    true,
  );
  assert.equal(next.phase, "combat");
  assert.ok(next.combat.enemies.length > 0);
  assert.equal(next.combat.defender, false);
  assert.equal(next.combat.ambush, true);
  assert.equal(next.combat.resume, "exploration");
  assert.equal(next.journey.branch, null);
  assert.equal(next.journey.resolvedBranches.includes(key), false);
  assert.equal(
    next.party[0].hp,
    s.party[0].hp + Math.round(s.party[0].maxHp * 0.25),
  );
  assert.equal(next.day, s.day + 1);
  assert.equal(next.food, s.food - 1);
  assert.match(next.message, /ambush/);
  const won = win(next);
  assert.equal(won.journey.resolvedBranches.includes(key), false);
  assert.equal(won.journey.portal, false);
});
test("Later floors raise resting risk; kits remain safer; separate ambushes cannot reuse a completed fight", () => {
  assert.deepEqual([1, 5, 9].map(x.restHereRisk), [0.4, 0.5, 0.6]);
  for (const floor of [1, 5, 9])
    assert.ok(x.wildCampRisk(floor) < x.restHereRisk(floor));
  const first = rest(field(), true),
    oldId = first.combat.id;
  const finished = e.reducer(win(first), { type: "COLLECT" });
  assert.equal(finished.fieldRest, null);
  const next = rest(finished, true);
  assert.equal(next.phase, "combat");
  assert.notEqual(next.combat.id, oldId);
});

test("Rest here works during every unfinished field interaction and never starts in combat or town", () => {
  for (const phase of [
    "arrival",
    "exploration",
    "branch",
    "event",
    "encounter",
    "story",
    "victory",
    "loot",
    "essence",
    "nag",
  ]) {
    const s = { ...field(), phase, eventResolved: false };
    const next = rest(s, false);
    assert.equal(next.phase, phase, phase);
    assert.equal(next.day, s.day + 1, phase);
    assert.equal(next.food, s.food - 1, phase);
    assert.equal(next.eventResolved, false, phase);
    assert.equal(next.journey.room, s.journey.room, phase);
  }
  for (const phase of ["town", "combat", "defeat", "extraction"]) {
    const s = { ...field(), phase };
    const next = rest(s, false);
    assert.equal(next.day, s.day);
    assert.equal(next.food, s.food);
    assert.equal(next.party[0].hp, s.party[0].hp);
  }
});

test("An ambush restores the pending event, prepared defender, portal or story after its rewards", () => {
  for (const phase of [
    "event",
    "arrival",
    "victory",
    "story",
    "encounter",
    "nag",
  ]) {
    let s = {
      ...field(),
      phase,
      eventResolved: false,
      arrivalChoice: "observe",
      arrivalScouted: true,
      arrivalOutcome: "Prepared before resting",
      journey: {
        ...field().journey,
        defender: phase === "arrival",
        portal: phase === "victory",
      },
    };
    if (phase === "arrival") {
      s = rounds.beginCombat({
        ...s,
        journey: { ...s.journey, room: "portal" },
      });
      s = {
        ...s,
        enemy: { ...s.enemy, hp: 17 },
        combat: {
          ...s.combat,
          enemies: s.combat.enemies.map((foe, i) =>
            i === 0 ? { ...foe, hp: 17 } : foe,
          ),
        },
      };
    }
    const interrupted = reload(rest(s, true));
    assert.equal(interrupted.phase, "combat");
    assert.equal(interrupted.arrivalChoice, "");
    let won = win(interrupted);
    if (phase === "arrival")
      won = {
        ...won,
        party: won.party.map((c) => ({
          ...c,
          battleMastery: { "Second Wind": 3 },
          cooldowns: { "Second Wind": 2 },
        })),
      };
    const resumed = reload(e.reducer(won, { type: "COLLECT" }));
    assert.equal(resumed.phase, phase, phase);
    assert.equal(resumed.fieldRest, null, phase);
    assert.equal(resumed.journey.room, s.journey.room, phase);
    assert.equal(resumed.journey.defender, s.journey.defender, phase);
    assert.equal(resumed.journey.portal, s.journey.portal, phase);
    assert.equal(resumed.arrivalChoice, "observe", phase);
    assert.equal(resumed.arrivalOutcome, "Prepared before resting", phase);
    assert.equal(resumed.eventResolved, false, phase);
    assert.equal(JSON.stringify(resumed.enemy), JSON.stringify(s.enemy), phase);
    assert.equal(
      JSON.stringify(resumed.combat),
      JSON.stringify(s.combat),
      phase,
    );
    if (phase === "arrival") {
      assert.equal(JSON.stringify(resumed.party[0].battleMastery), "{}");
      assert.equal(JSON.stringify(resumed.party[0].cooldowns), "{}");
    }
  }
});

test("Resting during loot review preserves both rewards without replaying either award", () => {
  const original = win(plunderers());
  const originalId = original.lootReceipt.id;
  const interrupted = rest(original, true);
  assert.equal(interrupted.lootReceipt, null);
  const won = win(interrupted);
  assert.notEqual(won.lootReceipt.id, originalId);
  const inventory = JSON.stringify(won.inventory);
  const resumed = e.reducer(reload(won), { type: "COLLECT" });
  assert.equal(resumed.phase, "loot");
  assert.equal(resumed.lootReceipt.id, originalId);
  assert.equal(JSON.stringify(resumed.inventory), inventory);
  const collected = e.reducer(reload(resumed), { type: "COLLECT" });
  assert.equal(JSON.stringify(collected.inventory), inventory);
});

test("A discovery receipt survives a rest ambush and the last battle day still forces extraction", () => {
  const receipt = {
    title: "Chest opened",
    gold: 0,
    food: 0,
    potions: 0,
    gems: 0,
    items: { "iron-ore": 1 },
  };
  const s = { ...field(), discoveryReceipt: receipt };
  const interrupted = rest(s, true);
  assert.equal(interrupted.discoveryReceipt, null);
  const resumed = e.reducer(reload(win(interrupted)), { type: "COLLECT" });
  assert.equal(
    JSON.stringify(resumed.discoveryReceipt),
    JSON.stringify(receipt),
  );
  const late = rest(
    {
      ...field(),
      phase: "event",
      day: 58,
      journey: { ...field().journey, watches: 168 },
    },
    true,
  );
  const finished = e.reducer(win(late), { type: "COLLECT" });
  assert.equal(finished.phase, "extraction");
  assert.equal(finished.fieldRest, null);
});

test("Fleeing a rest ambush leaves the pending interaction behind and reaches the actual connected room", () => {
  const ambush = rest(
    { ...field(), phase: "event", eventResolved: false },
    true,
  );
  const s = {
    ...ambush,
    combat: {
      ...ambush.combat,
      enemies: ambush.combat.enemies.map((foe) => ({
        ...foe,
        hp: 10000,
        maxHp: 10000,
        atk: 1,
      })),
    },
  };
  const escaped = e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions: [],
    flee: true,
  });
  assert.notEqual(escaped.journey.room, s.journey.room);
  assert.equal(escaped.fieldRest, null);
  assert.equal(escaped.eventResolved, false);
});
test("The final rest day opens extraction without starting another ambush", () => {
  const s = field();
  const next = rest(
    { ...s, day: 59, journey: { ...s.journey, watches: 174 } },
    true,
  );
  assert.equal(next.phase, "extraction");
  assert.equal(next.day, 60);
  assert.equal(next.journey.watches, 180);
  assert.equal(next.food, s.food - 1);
  assert.equal(next.combat, s.combat);
});
test("Every defeated plunderer drops the weapon and armor shown in their loadout exactly once", () => {
  const s = plunderers(),
    enemies = s.combat.enemies.filter((foe) => foe.species === "plunderer");
  assert.equal(s.enemy.name, "The Smiling Plunderer");
  assert.ok(enemies.length > 0);
  for (const foe of enemies) {
    assert.equal(foe.equipment.join(), "iron-blade,leather");
    for (const id of foe.equipment)
      assert.ok(
        ["weapon", "armor"].includes(
          w.ITEMS.find((item) => item.id === id).kind,
        ),
      );
  }
  const won = win(s);
  for (const id of ["iron-blade", "leather"]) {
    assert.equal(won.lootReceipt.items[id], enemies.length);
    assert.equal(won.inventory[id], enemies.length);
    assert.equal(won.expedition.unsecured.inventory[id], enemies.length);
    const opened = e.reducer(won, { type: "COLLECT" });
    assert.equal(
      e.reducer(reload(opened), { type: "COLLECT" }).inventory[id],
      enemies.length,
    );
    assert.equal(home(won).inventory[id], enemies.length);
  }
  const lost = e.reducer(
    { ...won, phase: "defeat", party: won.party.map((c) => ({ ...c, hp: 0 })) },
    { type: "DISMISS" },
  );
  assert.equal(lost.inventory["iron-blade"] || 0, 0);
  assert.equal(lost.inventory.leather || 0, 0);
});
test("An enemy's explicit carried equipment overrides its species defaults", () => {
  const spec = m.monsterFor(
    {
      ...e.enemyFor(1),
      species: "plunderer",
      equipment: ["chipped-blade", "iron-helm"],
    },
    1,
  );
  const items = m.monsterDrops(spec, 42).items;
  assert.equal(items["chipped-blade"], 1);
  assert.equal(items["iron-helm"], 1);
  assert.equal(items["iron-blade"], undefined);
});
test("The first return ends guidance after success or defeat, including reload and the next expedition", () => {
  for (const lost of [false, true]) {
    let s = field();
    s = home({ ...s, expedition: { ...s.expedition, lost } });
    assert.equal(s.walkthrough.active, false);
    assert.equal(wt.walkthroughTip(s), null);
    assert.equal(s.guideSeen, true);
    const migrated = reload({
      ...s,
      walkthrough: { ...s.walkthrough, active: true },
    });
    assert.equal(migrated.walkthrough.active, false);
    s = e.reducer({ ...migrated, day: 90 }, { type: "ENTER" });
    assert.equal(s.phase, "mission");
    assert.equal(wt.walkthroughTip(s), null);
  }
});
test("Returning adventurers get a race-specific Floor 12 ambition once, saved independently of onboarding", () => {
  for (const race of ["human", "barbarian", "elf", "dwarf"]) {
    const s = fresh(race);
    assert.equal(town.ascentPending(s), false);
    assert.match(town.ascentLine(race), /12|Twelve/);
  }
  const s = home(field());
  assert.equal(town.ascentPending(s), true);
  assert.equal(town.ascentPending(reload(s)), true);
  const next = e.reducer(s, { type: "ACK_ASCENT" });
  assert.equal(town.ascentPending(reload(next)), false);
  assert.equal(next.day, s.day);
  assert.equal(next.gold, s.gold);
  assert.equal(next.food, s.food);
});
console.log(count + " field polish checks passed.");
