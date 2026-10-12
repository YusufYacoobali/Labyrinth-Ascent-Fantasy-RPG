const assert = require("node:assert/strict");
const { e, w } = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const create = (race = "barbarian", roll = 0.5) =>
  e.reducer(e.initialGame(), { type: "CREATE", race, name: "Bjorn", roll });
const reduce = (s, a) => e.reducer(s, a);
const arrive = (s = create()) => reduce({ ...s, day: 30 }, { type: "ENTER" });
const enter = (s = create()) =>
  reduce(reduce(arrive(s), { type: "APPROACH", choice: "sneak", roll: 0.99 }), {
    type: "ENGAGE",
  });
function arena(race = "barbarian") {
  let s = enter(create(race));
  return { ...s, enemy: { ...s.enemy, hp: 1000, maxHp: 1000, guard: 0 } };
}
test("Mage creation is exactly one 5% roll", () => {
  assert.equal(e.makeCharacter("human", "h", "M", 0.049999).job, "Mage");
  assert.equal(e.makeCharacter("human", "h", "K", 0.05).job, "Knight");
  assert.equal(e.makeCharacter("elf", "h", "E", 0).job, "Ranger");
  let s = create("human", 0.01);
  s = reduce(s, { type: "CREATE", race: "human", name: "Retry", roll: 0.9 });
  assert.equal(s.party[0].job, "Mage");
  assert.equal(s.party[0].name, "Bjorn");
});
test("Gate is open every thirty days and closed otherwise", () => {
  for (const day of [30, 60, 90]) assert.equal(e.gateOpen(day), true);
  for (const day of [24, 31, 59]) assert.equal(e.gateOpen(day), false);
  assert.equal(e.daysToGate(31), 29);
  assert.equal(reduce(create(), { type: "ENTER" }).phase, "town");
});
test("Gate-season prices increase exactly 15%, repeat each cycle", () => {
  const potion = w.ITEMS.find((i) => i.id === "potion");
  assert.equal(e.buyPrice(potion, 24), 80);
  assert.equal(e.buyPrice(potion, 27), 92);
  assert.equal(e.buyPrice(potion, 30), 92);
  assert.equal(e.buyPrice(potion, 31), 80);
  assert.equal(e.buyPrice(potion, 60), 92);
});
test("Negotiation reveals traits, lowers signing price, and cannot farm trust", () => {
  let s = create();
  s = reduce(s, { type: "TALK", id: "lyria", choice: "strengths" });
  s = reduce(s, { type: "TALK", id: "lyria", choice: "discovery" });
  assert.equal(s.rapport.lyria.trust, 3);
  const repeated = reduce(s, {
    type: "TALK",
    id: "lyria",
    choice: "discovery",
  });
  assert.equal(repeated.rapport.lyria.trust, 3);
  const rejected = reduce(s, { type: "RECRUIT", id: "lyria", offer: 100 });
  assert.equal(rejected.gold, s.gold);
  assert.equal(rejected.party.length, 1);
  s = reduce(s, { type: "RECRUIT", id: "lyria", offer: 465 });
  assert.equal(s.party.length, 2);
  assert.equal(s.party[1].traitRevealed, true);
  assert.equal(s.gold, 1875);
});
test("Recruitment caps at four and no duplicate signing costs", () => {
  let s = create();
  for (const id of ["kael", "lyria", "bram"])
    s = reduce(s, { type: "RECRUIT", id });
  assert.equal(s.party.length, 4);
  assert.equal(s.gold, 740);
  assert.equal(reduce(s, { type: "RECRUIT", id: "ragnar" }).party.length, 4);
  assert.equal(reduce(s, { type: "RECRUIT", id: "kael" }).gold, 740);
});
test("Bench and invite preserve levels and gear with no second fee", () => {
  let s = reduce(create(), { type: "RECRUIT", id: "kael" });
  s = reduce(s, { type: "FORGE", id: "kael" });
  const gold = s.gold,
    atk = s.party[1].atk;
  s = reduce(s, { type: "BENCH", id: "kael" });
  assert.equal(s.reserve[0].gear, 1);
  s = reduce(s, { type: "RECRUIT", id: "kael" });
  assert.equal(s.gold, gold);
  assert.equal(s.party[1].atk, atk);
  assert.equal(s.reserve.length, 0);
  assert.equal(reduce(s, { type: "BENCH", id: "hero" }).party.length, 2);
});
test("Training levels the party and consumes a day and gold", () => {
  let s = create();
  s = reduce(s, { type: "TRAIN" });
  s = reduce(s, { type: "TRAIN" });
  assert.equal(s.day, 26);
  assert.equal(s.party[0].level, 2);
  assert.equal(s.gold, 2220);
});
test("No inventory transaction permits negative balances", () => {
  let s = { ...create(), gold: 0 };
  assert.equal(reduce(s, { type: "BUY_ITEM", id: "dawnsteel" }).gold, 0);
  assert.equal(
    reduce(s, { type: "SELL", id: "beast-core", vendor: "guild", quantity: 1 })
      .gold,
    0,
  );
  s = { ...s, inventory: { "beast-core": 1 } };
  assert.equal(
    reduce(s, { type: "SELL", id: "beast-core", vendor: "guild", quantity: -3 })
      .inventory["beast-core"],
    1,
  );
  assert.equal(
    reduce(s, { type: "SELL", id: "beast-core", vendor: "guild", quantity: 2 })
      .gold,
    0,
  );
});
test("Appraisal pays matching vendors more", () => {
  const core = w.ITEMS.find((i) => i.id === "beast-core");
  assert.equal(e.sellPrice(core, "guild"), 55);
  assert.equal(e.sellPrice(core, "alchemist"), 36);
  let s = { ...create(), inventory: { "beast-core": 2 } };
  s = reduce(s, {
    type: "SELL",
    id: "beast-core",
    vendor: "guild",
    quantity: 2,
  });
  assert.equal(s.gold, 2450);
  assert.equal(s.inventory["beast-core"], 0);
});
test("Equipment swapping replaces bonuses rather than stacking forever", () => {
  let s = reduce(create(), { type: "BUY_ITEM", id: "iron-blade" });
  s = reduce(s, { type: "EQUIP", character: "hero", item: "iron-blade" });
  assert.equal(s.party[0].atk, 39);
  s = reduce(s, { type: "BUY_ITEM", id: "dawnsteel" });
  s = reduce(s, { type: "EQUIP", character: "hero", item: "dawnsteel" });
  assert.equal(s.party[0].atk, 52);
  assert.equal(s.inventory["iron-blade"], 1);
  s = reduce(s, { type: "EQUIP", character: "hero", item: "iron-blade" });
  assert.equal(s.party[0].atk, 39);
  assert.equal(s.inventory.dawnsteel, 1);
});
test("Twin Strike gives double caster damage and consumes exactly 16 MP", () => {
  const s = arena();
  const basic = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  const double = reduce(s, {
    type: "BATTLE",
    kind: "skill",
    skill: "Twin Strike",
    roll: 0.5,
  });
  assert.equal(basic.effects.damage, 32);
  assert.equal(double.effects.damage, 64);
  assert.equal(double.party[0].mp, s.party[0].mp - 16);
});
test("Poison applies and ticks for three turns", () => {
  let s = arena("elf");
  s = reduce(s, {
    type: "BATTLE",
    kind: "skill",
    skill: "Venom Fang",
    roll: 0.5,
  });
  assert.equal(s.enemy.poison, 2);
  assert.equal(s.effects.poisonDamage, 60);
  s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.enemy.poison, 1);
  s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.equal(s.enemy.poison, 0);
});
test("Nerve Lock interrupts normal enemies; bosses can resist", () => {
  let s = arena();
  s.party[0].skills.push("Nerve Lock");
  const lock = reduce(s, {
    type: "BATTLE",
    kind: "skill",
    skill: "Nerve Lock",
    roll: 0.6,
  });
  assert.equal(lock.effects.stunned, true);
  assert.equal(lock.effects.enemyDamage, 0);
  s.enemy.boss = true;
  const resisted = reduce(s, {
    type: "BATTLE",
    kind: "skill",
    skill: "Nerve Lock",
    roll: 0.6,
  });
  assert.equal(resisted.effects.stunned, false);
  assert.ok(resisted.effects.enemyDamage > 0);
});
test("Passive fire wards reduce matching damage, not other types", () => {
  const s = arena();
  s.enemy.element = "fire";
  const basic = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  const ward = {
    ...s,
    party: s.party.map((c) => ({ ...c, skills: [...c.skills, "Ember Ward"] })),
  };
  const resisted = reduce(ward, { type: "BATTLE", kind: "attack", roll: 0.5 });
  assert.ok(resisted.effects.enemyDamage < basic.effects.enemyDamage);
  assert.equal(e.resist(ward.party[0], "fire"), 30);
  assert.equal(e.resist(ward.party[0], "frost"), 0);
});
test("Resistance stacking caps at 75%", () => {
  const c = e.makeCharacter("dwarf", "bram", "Bram");
  c.traitRevealed = true;
  c.skills.push("Toxic Adaptation");
  c.equipment = ["venom-ring"];
  assert.equal(e.resist(c, "venom"), 75);
});
test("Guard halves a heavy strike and restores mana", () => {
  let s = arena();
  s.turn = 3;
  s.party[0].mp = 0;
  const attack = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
  const guard = reduce(s, { type: "BATTLE", kind: "guard", roll: 0.5 });
  assert.equal(guard.party[0].mp, 4);
  assert.ok(guard.effects.enemyDamage < attack.effects.enemyDamage);
});
test("Antidote clears ailments; ether restores mana", () => {
  let s = arena();
  s.party[0].ailments = { poison: 2, paralysis: 1 };
  s.party[0].mp = 0;
  const cure = reduce(s, {
    type: "BATTLE",
    kind: "item",
    item: "antidote",
    roll: 0.5,
  });
  assert.equal(cure.party[0].ailments.poison, 0);
  assert.equal(cure.party[0].ailments.paralysis, 0);
  assert.equal(cure.inventory.antidote, 0);
  const mana = reduce(s, {
    type: "BATTLE",
    kind: "item",
    item: "ether",
    roll: 0.5,
  });
  assert.equal(mana.party[0].mp, 30);
  assert.equal(mana.inventory.ether, 0);
});
test("No MP or supplies are consumed by an invalid action", () => {
  let s = arena();
  s.party[0].mp = 0;
  s.potions = 0;
  const hp = s.enemy.hp;
  assert.equal(
    reduce(s, { type: "BATTLE", kind: "skill", roll: 0 }).enemy.hp,
    hp,
  );
  assert.equal(reduce(s, { type: "BATTLE", kind: "item", roll: 0 }).potions, 0);
});
test("Camp stranger is a plunderer; welcoming him ambushes party", () => {
  const s = { ...create(), phase: "event", floor: 1 };
  const watch = reduce(s, { type: "EVENT", choice: "watch", roll: 0 });
  const welcome = reduce(s, { type: "EVENT", choice: "welcome", roll: 0 });
  assert.equal(watch.phase, "combat");
  assert.equal(watch.enemy.name, "The Smiling Plunderer");
  assert.equal(watch.party[0].hp, 180);
  assert.equal(welcome.party[0].hp, 158);
  assert.equal(welcome.sideBattle, true);
});
test("Event rewards cannot be claimed twice", () => {
  let s = { ...create(), phase: "event", floor: 2 };
  s = reduce(s, { type: "EVENT", choice: "careful", roll: 0.5 });
  const gold = s.gold;
  s = reduce(s, { type: "EVENT", choice: "careful", roll: 0.5 });
  assert.equal(s.gold, gold);
  assert.equal(s.inventory["beast-core"], 2);
});
test("Fourfold gate routes change danger, environment, and drops", () => {
  for (const route of ["roots", "frost", "forge", "crypt"]) {
    let s = { ...create(), phase: "event", floor: 4, food: 8 };
    s = reduce(s, { type: "EVENT", choice: route, roll: 0 });
    s = reduce(s, { type: "CONTINUE" });
    assert.equal(s.floor, 5);
    assert.equal(s.route, route);
    assert.equal(s.enemy.element, w.ROUTES.find((r) => r.id === route).element);
    assert.ok(
      ["forest", "frost", "forge", "dungeon"].includes(
        e.floorEnvironment(5, route),
      ),
    );
  }
});
test("Clan alliance unlocks rescue quest, betrayal breaks eligibility", () => {
  let s = { ...create(), phase: "event", floor: 3 };
  s = reduce(s, { type: "EVENT", choice: "ally", roll: 0 });
  assert.equal(s.clanAlly, true);
  assert.equal(s.quests["clan-rescue"], "accepted");
  s = { ...s, phase: "event", floor: 9 };
  s = reduce(s, { type: "EVENT", choice: "rescue", roll: 0 });
  assert.equal(e.questProgress(s, "clan-rescue"), 1);
  const betrayed = reduce(
    { ...s, phase: "event" },
    { type: "EVENT", choice: "abandon", roll: 0 },
  );
  assert.equal(e.questProgress(betrayed, "clan-rescue"), 0);
});
test("Relic examination prevents the trap; fallen allies stay fallen", () => {
  let s = { ...create(), phase: "event", floor: 8 };
  s.party.push({ ...e.makeCharacter("human", "kael", "Kael"), hp: 0 });
  s = reduce(s, { type: "EVENT", choice: "examine", roll: 0 });
  s = reduce(s, { type: "EVENT", choice: "take", roll: 0 });
  assert.equal(s.relic, true);
  assert.equal(s.party[0].atk, 37);
  assert.equal(s.party[1].hp, 0);
  const trapped = reduce(
    { ...create(), phase: "event", floor: 8 },
    { type: "EVENT", choice: "take", roll: 0 },
  );
  assert.equal(trapped.relic, false);
  assert.equal(trapped.party[0].hp, 150);
});
test("Boss XP does not revive fallen companions", () => {
  let s = enter();
  s.party.push({ ...e.makeCharacter("human", "kael", "Kael"), hp: 0, xp: 60 });
  s.enemy.hp = 1;
  s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0 });
  assert.equal(s.party[1].hp, 0);
  assert.equal(s.party[1].level, 2);
});
const choices = {
  1: "watch",
  2: "careful",
  3: "ally",
  5: "meditate",
  6: "antidote",
  7: "climb",
  8: "examine",
  9: "rescue",
  10: "pick",
  11: "rest",
  12: "seal",
};
test("Every campaign route reaches all twelve events and both final rewards", () => {
  for (const route of ["roots", "frost", "forge", "crypt"]) {
    let s = create();
    for (const id of ["kael", "lyria", "bram"])
      s = reduce(s, { type: "RECRUIT", id });
    s = {
      ...s,
      day: 30,
      food: 40,
      gold: 4000,
      party: s.party.map((c) => ({ ...c, atk: 450, hp: 1000, maxHp: 1000 })),
    };
    s = reduce(s, { type: "ENTER" });
    const seen = new Set();
    let safety = 0;
    while (safety++ < 150) {
      if (s.phase === "arrival") {
        s = reduce(s, {
          type: "APPROACH",
          choice: require("./engine-loader.cjs").story.ARRIVALS[s.floor - 1]
            .choices[0].id,
          roll: 0.5,
        });
        s = reduce(s, { type: "ENGAGE" });
      } else if (s.phase === "combat")
        s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 });
      else if (s.phase === "essence") s = reduce(s, { type: "DEFER" });
      else if (s.phase === "event") {
        seen.add(s.floor);
        const choice =
          s.floor === 4
            ? route
            : s.floor === 8 && s.encounterExamined
              ? "take"
              : choices[s.floor];
        s = reduce(s, { type: "EVENT", choice, roll: 0.5 });
      } else if (s.phase === "victory") {
        if (s.floor === 12) break;
        s = reduce(s, { type: "CONTINUE" });
      } else throw Error(s.phase);
    }
    assert.equal(seen.size, 12);
    assert.equal(s.bestFloor, 12);
    assert.equal(s.ending, "Keeper of the Gate");
    assert.equal(s.inventory["hollow-crown"], 1);
    assert.ok(s.inventory["beast-core"] > 12);
    assert.equal(s.scoutsRescued, true);
    s = reduce(s, { type: "RETURN" });
    assert.equal(s.day, 31);
    assert.equal(s.phase, "town");
    const gold = s.gold;
    s = reduce(s, { type: "CLAIM", id: "first-ascent" });
    assert.equal(s.gold, gold + 400);
    assert.equal(reduce(s, { type: "CLAIM", id: "first-ascent" }).gold, s.gold);
  }
});
test("Defeat, return, and inn rest recover every companion", () => {
  let s = enter();
  s.party[0].hp = 1;
  s.party[0].atk = 1;
  s = reduce(s, { type: "BATTLE", kind: "attack", roll: 0 });
  assert.equal(s.phase, "defeat");
  s = reduce(s, { type: "RETURN" });
  s = reduce(s, { type: "REST" });
  assert.equal(s.party[0].hp, s.party[0].maxHp);
  assert.equal(s.party[0].ailments.poison, 0);
});
test("Save migration preserves mage identity and adds campaign defaults", () => {
  let s = arena("human");
  s.party[0].job = "Mage";
  const old = JSON.parse(JSON.stringify(s));
  delete old.inventory;
  delete old.route;
  delete old.effects;
  delete old.party[0].ailments;
  const loaded = e.normalizeSave(old);
  assert.equal(loaded.party[0].job, "Mage");
  assert.equal(loaded.phase, "combat");
  assert.equal(loaded.inventory.ether, 1);
  assert.equal(loaded.party[0].ailments.poison, 0);
  assert.equal(loaded.effects.id, 0);
});
test("Refinement consumes crystals once and grants a resistance", () => {
  let s = create();
  s = reduce(s, { type: "ENCHANT", id: "hero", skill: "Ember Ward" });
  assert.equal(s.gems, 90);
  assert.equal(s.gold, 2240);
  assert.equal(e.resist(s.party[0], "fire"), 30);
  assert.equal(
    reduce(s, { type: "ENCHANT", id: "hero", skill: "Ember Ward" }).gems,
    90,
  );
});
test("Preparation plans stop at the next gate and cannot skip an open gate", () => {
  for (const mode of ["rest", "work", "train"]) {
    let s = create();
    const before = s.gold;
    s = reduce(s, { type: "PREPARE_CYCLE", mode });
    assert.equal(s.day, 30);
    assert.equal(e.gateOpen(s.day), true);
    assert.equal(
      s.gold,
      before + (mode === "work" ? 750 : mode === "train" ? -360 : 0),
    );
    const again = reduce(s, { type: "PREPARE_CYCLE", mode });
    assert.equal(again.day, 30);
    assert.equal(again.gold, s.gold);
    if (mode === "work") assert.equal(s.faction.guild, 6);
  }
  const s = { ...create(), day: 31, gold: 0 };
  const blocked = reduce(s, { type: "PREPARE_CYCLE", mode: "train" });
  assert.equal(blocked.day, 31);
  assert.equal(blocked.gold, 0);
  assert.equal(reduce(s, { type: "PREPARE_CYCLE", mode: "rest" }).day, 60);
});
test("Antidote prevents reapplication on its turn and the following turn", () => {
  let s = arena();
  s.enemy = { ...s.enemy, element: "venom", attack: 1 };
  s.party[0].ailments = { poison: 2, paralysis: 0 };
  s = reduce(s, { type: "BATTLE", kind: "item", item: "antidote", roll: 0.5 });
  assert.equal(s.party[0].ailments.poison, 0);
  assert.equal(s.party[0].ailments.ward, 1);
  s = reduce(s, { type: "BATTLE", kind: "guard", roll: 0.5 });
  assert.equal(s.party[0].ailments.poison, 0);
  assert.equal(s.party[0].ailments.ward, 0);
  s = reduce(s, { type: "BATTLE", kind: "guard", roll: 0.5 });
  assert.equal(s.party[0].ailments.poison, 1);
});
test("Entering a floor presents a story before any combat action", () => {
  const s = arrive();
  assert.equal(s.phase, "arrival");
  assert.equal(s.food, 3);
  assert.equal(reduce(s, { type: "ENGAGE" }).phase, "arrival");
  assert.equal(
    reduce(s, { type: "BATTLE", kind: "attack", roll: 0.5 }).enemy.hp,
    s.enemy.hp,
  );
  const scouted = reduce(s, { type: "APPROACH", choice: "listen", roll: 0.5 });
  assert.equal(scouted.phase, "arrival");
  assert.equal(scouted.arrivalScouted, true);
  assert.equal(scouted.enemy.atk, Math.round(s.enemy.atk * 0.9));
  assert.ok(scouted.arrivalOutcome.includes("listen"));
  assert.equal(
    reduce(scouted, { type: "APPROACH", choice: "charge", roll: 0.5 }).enemy.hp,
    scouted.enemy.hp,
  );
  assert.equal(reduce(scouted, { type: "ENGAGE" }).phase, "combat");
});
test("Arrival ambushes respect companion strengths and keep boss resistance", () => {
  const s = arrive();
  const failure = reduce(s, { type: "APPROACH", choice: "sneak", roll: 0.99 });
  assert.equal(failure.enemy.hp, s.enemy.hp);
  const success = reduce(s, { type: "APPROACH", choice: "sneak", roll: 0 });
  assert.ok(success.enemy.hp < s.enemy.hp);
  assert.equal(success.enemy.paralysis, 1);
  const elf = reduce(
    { ...s, party: [...s.party, e.makeCharacter("elf", "elf", "Sylva")] },
    { type: "APPROACH", choice: "sneak", roll: 0.99 },
  );
  assert.ok(elf.enemy.hp < s.enemy.hp);
  let boss = { ...s, floor: 3, enemy: { ...s.enemy, boss: true } };
  boss = reduce(boss, { type: "APPROACH", choice: "joints", roll: 0 });
  assert.equal(boss.enemy.paralysis, 0);
  const rushed = reduce(s, { type: "APPROACH", choice: "charge", roll: 0 });
  assert.equal(rushed.party[0].hp, s.party[0].hp - 10);
  assert.ok(rushed.enemy.hp < s.enemy.hp);
});
test("Story preparation costs supplies, preserves fallen allies and survives reload", () => {
  let s = { ...arrive(), floor: 5, food: 1 };
  s.party[0].hp = 50;
  s.party[0].mp = 0;
  s.party.push({ ...e.makeCharacter("human", "kael", "Kael"), hp: 0 });
  const rested = reduce(s, { type: "APPROACH", choice: "breather", roll: 0 });
  assert.equal(rested.food, 0);
  assert.equal(rested.party[0].hp, 70);
  assert.equal(rested.party[0].mp, 15);
  assert.equal(rested.party[1].hp, 0);
  const loaded = e.normalizeSave(JSON.parse(JSON.stringify(rested)));
  assert.equal(loaded.arrivalChoice, "breather");
  assert.equal(loaded.arrivalOutcome, rested.arrivalOutcome);
  assert.equal(
    reduce(loaded, { type: "APPROACH", choice: "breather", roll: 0 }).food,
    0,
  );
  assert.equal(reduce(loaded, { type: "ENGAGE" }).phase, "combat");
  const blocked = reduce(
    { ...s, food: 0 },
    { type: "APPROACH", choice: "breather", roll: 0 },
  );
  assert.equal(blocked.arrivalChoice, "");
  assert.equal(blocked.party[0].hp, 50);
  const warded = reduce(
    { ...s, floor: 3 },
    { type: "APPROACH", choice: "brace", roll: 0 },
  );
  assert.equal(warded.party[0].ailments.ward, 3);
  assert.equal(warded.food, 0);
});
test("Every floor has three distinct arrival choices and each resolves once", () => {
  const { story } = require("./engine-loader.cjs");
  assert.equal(story.ARRIVALS.length, 12);
  for (let floor = 1; floor <= 12; floor++) {
    const scene = story.ARRIVALS[floor - 1];
    assert.equal(new Set(scene.choices.map((c) => c.id)).size, 3);
    for (const choice of scene.choices) {
      const s = { ...arrive(), floor, food: 20 };
      const resolved = reduce(s, {
        type: "APPROACH",
        choice: choice.id,
        roll: 0.5,
      });
      assert.equal(resolved.arrivalChoice, choice.id);
      assert.ok(resolved.arrivalOutcome.length > 50);
      const again = reduce(resolved, {
        type: "APPROACH",
        choice: choice.id,
        roll: 0.5,
      });
      assert.equal(again.food, resolved.food);
      assert.equal(again.enemy.hp, resolved.enemy.hp);
    }
  }
});
test('Introduction completion persists separately from the town guide',()=>{
  let s=reduce(e.initialGame(),{type:'INTRO_COMPLETED'});
  assert.equal(s.introSeen,true);assert.equal(s.guideSeen,false);
  s=e.normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(s.introSeen,true);assert.equal(s.started,false);
  s=reduce(s,{type:'CREATE',race:'elf',name:'Sylva',roll:.5});
  assert.equal(s.introSeen,true);assert.equal(s.guideSeen,false);
});
test('Elise guide dismissal persists and can be explicitly reopened',()=>{
  let s=reduce(create(),{type:'GUIDE'});assert.equal(s.guideSeen,true);
  s=e.normalizeSave(JSON.parse(JSON.stringify(s)));assert.equal(s.guideSeen,true);
  s=reduce(s,{type:'GUIDE',show:true});assert.equal(s.guideSeen,false);
  assert.equal(s.introSeen,true);assert.equal(reduce(s,{type:'RESET'}).guideSeen,false);
});
test('Existing characters skip the removed launch screen and unfinished new saves retain onboarding',()=>{
  const s=create();delete s.introSeen;assert.equal(e.normalizeSave(s).introSeen,true);
  const fresh=e.initialGame();delete fresh.introSeen;assert.equal(e.normalizeSave(fresh).introSeen,false);
});
console.log(`${count} gameplay checks passed.`);
