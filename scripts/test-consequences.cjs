const assert = require("node:assert/strict");
const {
  e,
  w,
  stories: q,
  director: d,
  npcs,
  exploration: x,
  factionOpportunities: f,
  reconciliation: rc,
  storyContext: sc,
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
    name: "Witness",
    roll: 0.5,
  });
}
function field() {
  let s = fresh();
  s = e.reducer({ ...s, day: 30, food: 20 }, { type: "ENTER" });
  return e.reducer(e.reducer(s, { type: "MISSION", id: "survey" }), {
    type: "ENGAGE",
  });
}
test("All ten companions have distinct two-stage reconciliation with real restitution and durable cancellation", () => {
  for (const recruit of e.RECRUITS) {
    let s = fresh();
    s = {
      ...s,
      party: [
        ...s.party,
        e.makeCharacter(recruit.race, recruit.id, recruit.name),
      ],
      stories: { ...s.stories, loyalty: { [recruit.id]: 20 } },
    };
    const food = s.food;
    s = e.reducer(s, { type: "RECONCILE", id: recruit.id });
    assert.equal(q.loyalty(s, recruit.id), 20);
    assert.ok(rc.reconciliationStage(s));
    const first = s.stories.active.stage;
    s = e.reducer(s, {
      type: "STORY_CHOICE",
      stage: first,
      choice: "restitution",
    });
    assert.equal(q.loyalty(s, recruit.id), 20);
    s = e.reducer(s, { type: "STORY_CHOICE", stage: first, choice: "listen" });
    s = e.normalizeSave(plain(s));
    s = e.reducer(s, {
      type: "STORY_CHOICE",
      stage: s.stories.active.stage,
      choice: "restitution",
    });
    assert.equal(s.phase, "town");
    assert.equal(s.food, food - 2);
    assert.equal(q.loyalty(s, recruit.id), 30);
    assert.equal(
      e.reducer(s, { type: "STORY_CHOICE", stage: first, choice: "listen" })
        .food,
      s.food,
    );
  }
});
test("Insufficient restitution preserves conversation and does not grant loyalty or spend belongings", () => {
  let s = fresh();
  s = {
    ...s,
    food: 0,
    party: [...s.party, e.makeCharacter("human", "kael", "Kael")],
    stories: { ...s.stories, loyalty: { kael: 20 } },
  };
  s = e.reducer(s, { type: "RECONCILE", id: "kael" });
  s = e.reducer(s, {
    type: "STORY_CHOICE",
    stage: s.stories.active.stage,
    choice: "listen",
  });
  s = e.reducer(s, {
    type: "STORY_CHOICE",
    stage: s.stories.active.stage,
    choice: "restitution",
  });
  assert.equal(q.loyalty(s, "kael"), 20);
  assert.equal(s.phase, "story");
  s = e.reducer(s, { type: "CLOSE_STORY" });
  assert.equal(s.phase, "town");
});
test("Authored investigations react to race, skills, protective gear, NPC testimony and previous choices", () => {
  let s = fresh();
  s = {
    ...s,
    party: [...s.party, e.makeCharacter("dwarf", "bram", "Bram")],
    npcs: {
      elian: {
        visits: 2,
        helped: 1,
        lastExpedition: 1,
        trust: 3,
        decisions: ["help"],
      },
    },
    stories: { ...s.stories, factions: { ...s.stories.factions, roots: 2 } },
  };
  const cases = [
    ["floor.2.investigation", () => {}],
    ["floor.3.investigation", () => (s.party[0].skills = ["Arcane Bolt"])],
    ["floor.6.investigation", () => (s.party[0].equipment = ["venom-ring"])],
    ["roots.channel", () => {}],
  ];
  for (const [id, prepare] of cases) {
    prepare();
    const stage = q.STORY_CHAINS.flatMap((c) => c.stages).find(
      (st) => st.id === id,
    );
    assert.ok(
      sc.contextualStoryStage(s, stage).choices.some((c) => c.id === "expert"),
      id,
    );
  }
  s.party[0].injuries = 1;
  const stage = q.STORY_CHAINS[0].stages[1];
  assert.match(sc.contextualStoryStage(s, stage).body, /injured/);
  s.stories.outcomes["kael.promise"] = "dismiss";
  assert.match(sc.contextualStoryStage(s, stage).body, /earlier decision/);
});
test("Conditional choices are validated against current party and grant their authored reward only once", () => {
  let s = fresh();
  s = {
    ...s,
    floor: 2,
    phase: "camp",
    party: [...s.party, e.makeCharacter("dwarf", "bram", "Bram")],
    stories: { ...s.stories, stages: { "floor.2": 1 } },
    journey: { ...s.journey, room: "sanctuary" },
  };
  s = e.reducer(s, { type: "OPEN_STORY", id: "floor.2" });
  const stage = s.stories.active.stage;
  s = e.reducer(s, { type: "STORY_CHOICE", stage, choice: "expert" });
  assert.equal(s.inventory["beast-core"], 1);
  assert.equal(s.stories.stages["floor.2"], 2);
  assert.equal(
    e.reducer(e.normalizeSave(plain(s)), {
      type: "STORY_CHOICE",
      stage,
      choice: "expert",
    }).inventory["beast-core"],
    1,
  );
});
test("Six faction commissions require earned standing, floors and materials and cannot be claimed twice", () => {
  for (const offer of f.FACTION_OPPORTUNITIES) {
    let s = fresh();
    s = {
      ...s,
      bestFloor: offer.floor,
      inventory: { [offer.material]: offer.quantity },
      faction: { guild: 5, stag: 5 },
      stories: {
        ...s.stories,
        factions: { roots: 5, frost: 5, forge: 5, crypt: 5 },
      },
    };
    const poor = { ...s, inventory: {} };
    assert.equal(
      e.reducer(poor, { type: "FACTION_DELIVER", id: offer.id }).inventory[
        offer.item
      ],
      undefined,
    );
    s = e.reducer(s, { type: "FACTION_DELIVER", id: offer.id });
    assert.equal(s.inventory[offer.item], 1);
    assert.equal(s.inventory[offer.material], 0);
    s = e.normalizeSave(plain(s));
    assert.equal(
      e.reducer(
        { ...s, inventory: { ...s.inventory, [offer.material]: 99 } },
        { type: "FACTION_DELIVER", id: offer.id },
      ).inventory[offer.item],
      1,
    );
  }
});
test("Faction stock and displayed discounts use identical prices and locked mixed carts remain atomic", () => {
  let s = { ...fresh(), gold: 10000, bestFloor: 3 };
  const gear = w.ITEMS.find((i) => i.id === "guild-aegis");
  const blocked = e.reducer(s, {
    type: "BUY_BATCH",
    items: [
      { id: "potion", quantity: 1 },
      { id: gear.id, quantity: 1 },
    ],
  });
  assert.equal(blocked.gold, s.gold);
  assert.equal(blocked.potions, s.potions);
  s = { ...s, faction: { ...s.faction, guild: 10 } };
  const price = e.buyPrice(gear, s.day, s);
  assert.ok(price < e.buyPrice(gear, s.day));
  const bought = e.reducer(s, { type: "BUY_ITEM", id: gear.id });
  assert.equal(s.gold - bought.gold, price);
  assert.equal(bought.inventory[gear.id], 1);
});
test("Sable disputes persist into later meetings and trusted cooperation grants one unsecured shared cache", () => {
  let s = field();
  const place = s.expedition.director.npcs.sable;
  s = x.enterMappedRoom({ ...s, floor: Number(place.map) }, place.room);
  const claimed = e.reducer(s, {
    type: "BRANCH_CHOICE",
    choice: "claim",
    roll: 0.5,
  });
  assert.equal(claimed.npcs.sable.trust, -3);
  assert.equal(claimed.expedition.unsecured.gold, 80);
  assert.match(
    npcs.npcDescription(e.normalizeSave(plain(claimed)), "sable"),
    /salvage you claimed/,
  );
  s = {
    ...s,
    npcs: {
      sable: {
        visits: 1,
        helped: 1,
        lastExpedition: 0,
        trust: 2,
        decisions: ["help"],
      },
    },
  };
  const shared = e.reducer(s, {
    type: "BRANCH_CHOICE",
    choice: "cooperate",
    roll: 0.5,
  });
  assert.equal(shared.inventory["labyrinth-key"], 1);
  assert.equal(shared.expedition.unsecured.inventory["labyrinth-key"], 1);
  assert.equal(
    e.reducer(shared, { type: "BRANCH_CHOICE", choice: "cooperate", roll: 0.5 })
      .inventory["labyrinth-key"],
    1,
  );
});
test("Trusted merchant trades use their remembered improved quantity without securing field cores", () => {
  let s = field();
  const place = s.expedition.director.npcs.tamsin;
  s = x.enterMappedRoom(
    {
      ...s,
      floor: 2,
      inventory: { "beast-core": 2 },
      npcs: {
        tamsin: {
          visits: 3,
          helped: 1,
          lastExpedition: 0,
          trust: 3,
          decisions: ["help"],
        },
      },
      expedition: {
        ...s.expedition,
        unsecured: {
          ...s.expedition.unsecured,
          inventory: { "beast-core": 2 },
        },
      },
    },
    place.room,
  );
  const food = s.food;
  s = e.reducer(s, { type: "BRANCH_CHOICE", choice: "trade", roll: 0.5 });
  assert.equal(s.food, food + 4);
  assert.equal(s.expedition.unsecured.food, 4);
});
console.log(`${count} world-consequence checks passed.`);
