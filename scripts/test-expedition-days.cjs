const assert = require("node:assert/strict");
const { e, exploration: x, maps, rounds } = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  count++;
  console.log("PASS " + name);
};
const reload = (s) => e.normalizeSave(JSON.parse(JSON.stringify(s)));
function field() {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Clock",
    seed: 42,
    roll: 0.5,
  });
  s = e.reducer({ ...s, day: 30, food: 60 }, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  s = e.reducer(s, { type: "ENGAGE" });
  const map = x.floorMap(s);
  return {
    ...s,
    eventResolved: true,
    expedition: { ...s.expedition, director: undefined },
    journey: {
      ...s.journey,
      maps: {
        ...s.journey.maps,
        1: { ...map, explored: Object.keys(map.nodes) },
      },
      occupants: {
        ...s.journey.occupants,
        1: Object.fromEntries(
          Object.keys(map.nodes).map((id) => [id, "quiet"]),
        ),
      },
    },
  };
}
function moveTo(s, id) {
  const edge = x.exitsFor(s).find((e) => e.to === id);
  assert.ok(edge);
  return e.reducer(s, { type: "MOVE", direction: edge.direction });
}
function fight(size = 1) {
  let s = field();
  s = {
    ...s,
    phase: "combat",
    enemy: e.enemyFor(1),
    party: [
      ...s.party,
      ...["kael", "lyria"]
        .slice(0, size - 1)
        .map((id) => e.makeCharacter(id === "lyria" ? "elf" : "human", id, id)),
    ],
  };
  s = rounds.beginCombat(s);
  s.combat = {
    ...s.combat,
    rules: undefined,
    intents: undefined,
    enemies: [
      {
        ...s.combat.enemies[0],
        hp: 10000,
        maxHp: 10000,
        atk: 1,
        speed: 1,
        archetype: "skirmisher",
        behaviorId: undefined,
      },
    ],
  };
  return { ...s, enemy: s.combat.enemies[0] };
}
function command(s, kind = "guard") {
  return {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions: s.party.map((c) => ({
      actor: c.id,
      kind,
      target: kind === "guard" ? c.id : s.combat.enemies[0].id,
    })),
  };
}
test("Choosing the expedition mission takes exactly one day and one ration", () => {
  const s = field();
  assert.equal(s.day, 31);
  assert.equal(s.journey.watches, 6);
  assert.equal(s.food, 59);
  assert.equal(e.daysRemaining(s), 29);
});
test("Every passage and backtrack takes exactly one day; invalid movement takes none", () => {
  const s = field();
  const edge = x.exitsFor(s)[0];
  const moved = moveTo(s, edge.to);
  assert.equal(moved.day, s.day + 1);
  assert.equal(moved.food, s.food - 1);
  const back = e.reducer(
    { ...moved, phase: "exploration" },
    { type: "MOVE_BACK" },
  );
  assert.equal(back.journey.room, s.journey.room);
  assert.equal(back.day, s.day + 2);
  const unavailable = ["left", "right", "straight", "back"].find(
    (direction) => !x.exitsFor(s).some((e) => e.direction === direction),
  );
  const blocked = e.reducer(s, { type: "MOVE", direction: unavailable });
  assert.equal(blocked.day, s.day);
  assert.equal(blocked.food, s.food);
});
test("One round costs one day regardless of how many characters act, and duplicate submissions are free", () => {
  for (const size of [1, 3]) {
    let s = fight(size);
    for (let i = 0; i < 3; i++) {
      const request = command(s);
      const next = e.reducer(s, request);
      assert.equal(next.day, s.day + 1);
      assert.equal(next.food, s.food - 1);
      assert.equal(e.reducer(next, request).day, next.day);
      s = reload(next);
    }
  }
});
test("Authored and generic event choices each take one day, once, with their own costs", () => {
  let s = { ...field(), phase: "event", floor: 2, eventResolved: false };
  let next = e.reducer(s, { type: "EVENT", choice: "careful", roll: 0.5 });
  assert.equal(next.day, s.day + 1);
  assert.equal(next.food, s.food - 1);
  assert.equal(
    e.reducer(next, { type: "EVENT", choice: "careful", roll: 0.5 }).day,
    next.day,
  );
  s = field();
  const key = x.encounterKey(s);
  s = {
    ...s,
    phase: "branch",
    journey: {
      ...s.journey,
      branch: { id: key, kind: "company", direction: "left" },
    },
    expedition: {
      ...s.expedition,
      generic: {
        [key]: { id: "generic.lantern", variant: 0, resolved: false },
      },
    },
  };
  const request = {
    type: "GENERIC_CHOICE",
    room: key,
    id: "generic.lantern",
    choice: "help",
  };
  next = e.reducer(s, request);
  assert.equal(next.day, s.day + 1);
  assert.equal(next.food, s.food - 2);
  assert.equal(next.gold, s.gold + 20);
  assert.equal(e.reducer(reload(next), request).day, next.day);
});
test("Preparation takes a day once; map inspection, receipts and UI acknowledgements are free", () => {
  const s = {
    ...field(),
    phase: "arrival",
    arrivalChoice: "",
    enemy: e.enemyFor(1),
    journey: { ...field().journey, room: "portal", defender: true },
  };
  const request = { type: "APPROACH", choice: "listen", roll: 0.5 };
  const next = e.reducer(s, request);
  assert.equal(next.day, s.day + 1);
  assert.equal(e.reducer(next, request).day, next.day);
  for (const action of [
    { type: "DISMISS" },
    { type: "ACK_DISCOVERY" },
    { type: "FINISH_PLAYBACK" },
  ]) {
    assert.equal(e.reducer(next, action).day, next.day);
  }
});
test("Reaching a sanctuary or setting up a wild camp uses a day without free healing; resting heals", () => {
  let s = field();
  const map = x.floorMap(s),
    adjacent = Object.values(map.nodes).find((n) =>
      Object.values(n.exits).includes(map.sanctuary),
    );
  s = {
    ...s,
    party: s.party.map((c) => ({ ...c, hp: 20, mp: 0 })),
    journey: { ...s.journey, room: adjacent.id },
  };
  const camp = moveTo(s, map.sanctuary);
  assert.equal(camp.phase, "camp");
  assert.equal(camp.day, s.day + 1);
  assert.equal(camp.party[0].hp, 20);
  const rested = e.reducer(camp, { type: "CAMP_REST" });
  assert.equal(rested.day, camp.day + 1);
  assert.ok(rested.party[0].hp > camp.party[0].hp);
  s = { ...s, inventory: { "camp-kit": 1 } };
  const wild = e.reducer(s, { type: "WILD_CAMP" });
  assert.equal(wild.day, s.day + 1);
  assert.equal(wild.party[0].hp, 20);
  assert.equal(wild.inventory["camp-kit"], 0);
});
test("The final day's accepted victory awards its receipt before extraction, with no extra collection day", () => {
  let s = fight();
  s = { ...s, day: 59, journey: { ...s.journey, watches: 174 } };
  s.combat.enemies[0].hp = 1;
  s = e.reducer(s, command(s, "attack"));
  assert.equal(s.phase, "loot");
  assert.equal(s.day, 60);
  assert.ok(s.lootReceipt.items["beast-core"]);
  s = reload(s);
  s = e.reducer(s, { type: "COLLECT" });
  assert.equal(s.phase, "extraction");
  assert.equal(s.day, 60);
});
test("Quick travel charges each traversed passage and stops exactly at day thirty", () => {
  let s = field();
  const map = x.floorMap(s),
    target = Object.keys(map.nodes).find(
      (id) => maps.shortestPath(map, map.entrance, id).length >= 4,
    );
  s = { ...s, day: 59, journey: { ...s.journey, watches: 174 } };
  const next = e.reducer(s, { type: "QUICK_TRAVEL", room: target });
  assert.equal(next.day, 60);
  assert.equal(next.journey.watches, 180);
  assert.equal(next.phase, "extraction");
  assert.notEqual(next.journey.room, target);
});
test("Existing partial-day saves keep their elapsed time and each new action advances a full day", () => {
  let s = field();
  s = reload({ ...s, day: 30, journey: { ...s.journey, watches: 5 } });
  const next = moveTo(s, x.exitsFor(s)[0].to);
  assert.equal(next.day, 31);
  assert.equal(next.journey.watches, 11);
  assert.equal(reload(next).day, 31);
});
test("Exhaustion reminders return to the map without teleporting, charging a day or penalizing loyalty", () => {
  let s = field();
  s = {
    ...s,
    phase: "nag",
    journey: {
      ...s.journey,
      nag: { speaker: "hero", quote: "Rest.", resume: "exploration" },
    },
  };
  const next = e.reducer(s, { type: "NAG_DECISION" });
  assert.equal(next.phase, "exploration");
  assert.equal(next.journey.room, s.journey.room);
  assert.equal(next.day, s.day);
  assert.equal(
    JSON.stringify(next.stories.loyalty),
    JSON.stringify(s.stories.loyalty),
  );
});
console.log(`${count} full-day expedition checks passed.`);
