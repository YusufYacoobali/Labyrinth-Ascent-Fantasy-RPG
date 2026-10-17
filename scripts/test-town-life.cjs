const assert = require("node:assert/strict");
const { e, w, townLife: town, stories } = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  count++;
  console.log("PASS " + name);
};
const act = (s, action) => e.reducer(s, action);
const fresh = (race = "barbarian") =>
  act(e.initialGame(), {
    type: "CREATE",
    name: "Penny",
    race,
    seed: 42,
    roll: 0.5,
  });
const reload = (s) => e.normalizeSave(JSON.parse(JSON.stringify(s)));
const recruit = (s, id) => act(s, { type: "RECRUIT", id });
const spec = (id) => e.RECRUITS.find((r) => r.id === id);
function openMoment(s, companion) {
  const moment = town.townMoments(s).find((m) => m.companion === companion);
  assert.ok(moment);
  return act(s, { type: "OPEN_TOWN_MOMENT", id: moment.id, companion });
}

test("A new adventurer starts with 300 gold and can buy a chipped sword and rations", () => {
  let s = fresh();
  assert.equal(s.gold, 300);
  assert.equal(s.gems, 0);
  assert.equal(s.food, 1);
  assert.equal(s.potions, 0);
  assert.deepEqual(Object.keys(s.inventory), []);
  assert.equal(w.ITEMS.find((i) => i.id === "chipped-blade").price, 45);
  const attack = s.party[0].atk;
  s = act(s, { type: "BUY_ITEM", id: "chipped-blade" });
  s = act(s, { type: "BUY", item: "food" });
  assert.equal(s.gold, 220);
  assert.equal(s.food, 4);
  s = act(s, { type: "EQUIP", character: "hero", item: "chipped-blade" });
  assert.equal(s.party[0].atk, attack + 3);
  assert.equal(act(s, { type: "BUY", item: "potion" }).potions, 1);
});
test("Skills, experience, party size and trust change asking shares within 10–50%", () => {
  const s = fresh();
  for (const r of e.RECRUITS) {
    assert.ok(e.recruitShare(s, r) >= 10 && e.recruitShare(s, r) <= 50);
    assert.ok(e.recruitShare(s, r, 3) < e.recruitShare(s, r, 0));
  }
  assert.ok(e.recruitShare(s, spec("mira")) > e.recruitShare(s, spec("kael")));
  assert.ok(e.recruitShare(s, spec("eira")) > e.recruitShare(s, spec("lyria")));
  const supported = {
    ...s,
    party: [...s.party, e.makeCharacter("dwarf", "bram", "Bram")],
  };
  assert.ok(
    e.recruitShare(s, spec("kael")) > e.recruitShare(supported, spec("kael")),
  );
  const full = {
    ...supported,
    party: [...supported.party, e.makeCharacter("elf", "lyria", "Lyria")],
  };
  assert.equal(e.recruitShare(full, spec("kael"), 99), 10);
});
test("A low offer gets a personal decline and durable counteroffer, then an acceptance", () => {
  let s = fresh();
  s = act(s, { type: "RECRUIT", id: "kael", offer: 10 });
  assert.equal(s.party.length, 1);
  assert.equal(s.gold, 300);
  assert.equal(s.recruitReply.outcome, "declined");
  assert.match(s.recruitReply.line, /shield/);
  assert.equal(s.recruitReply.asking, 24);
  s = reload(s);
  s = act(s, { type: "RECRUIT", id: "kael", offer: s.recruitReply.asking });
  assert.equal(s.party.length, 2);
  assert.equal(s.gold, 300);
  assert.equal(s.contracts.kael, 24);
  assert.equal(s.recruitReply.outcome, "accepted");
  assert.match(s.recruitReply.line, /24%/);
  assert.equal(reload(s).recruitReply.outcome, "accepted");
  assert.equal(recruit(s, "kael").party.length, 2);
  assert.equal(act(s, { type: "ACK_RECRUIT_REPLY" }).recruitReply, null);
});
test("Offers through 50% are accepted; impossible terms give an explicit reply", () => {
  let s = { ...fresh(), bestFloor: 12 };
  s = act(s, { type: "RECRUIT", id: "eira", offer: 50 });
  assert.equal(s.contracts.eira, 50);
  for (const offer of [0, -1, 51, 20.5, NaN, Infinity]) {
    const refused = act(fresh(), { type: "RECRUIT", id: "kael", offer });
    assert.equal(refused.party.length, 1);
    assert.equal(refused.recruitReply.outcome, "declined");
    assert.match(refused.recruitReply.line, /10% to 50%/);
  }
  const cap = act(s, { type: "RECRUIT", id: "mira", offer: 40 });
  assert.equal(cap.party.length, 2);
  assert.equal(cap.recruitReply.outcome, "blocked");
  assert.match(cap.recruitReply.line, /25%/);
  assert.equal(recruit(fresh(), "eira").recruitReply.outcome, "blocked");
});
test("An ordinary four-person party can negotiate within the 75% companion cap", () => {
  let s = fresh();
  for (const id of ["kael", "mira", "elowen"]) s = recruit(s, id);
  assert.equal(s.party.length, 4);
  assert.equal(
    Object.values(s.contracts).reduce((n, share) => n + share, 0),
    75,
  );
  const full = recruit(s, "bram");
  assert.equal(full.party.length, 4);
  assert.equal(full.recruitReply.outcome, "blocked");
  assert.match(full.recruitReply.line, /four/);
});
test("Existing wealth, inventory and old contracts survive migration", () => {
  const raw = JSON.parse(JSON.stringify(recruit(fresh(), "kael")));
  Object.assign(raw, {
    gold: 2340,
    gems: 120,
    potions: 3,
    food: 6,
    inventory: { ether: 1 },
    contracts: { kael: 8 },
  });
  delete raw.townLife;
  const s = e.normalizeSave(raw);
  assert.equal(s.gold, 2340);
  assert.equal(s.gems, 120);
  assert.equal(s.inventory.ether, 1);
  assert.equal(s.contracts.kael, 8);
  assert.equal(s.townLife.introSeen, true);
});
test("The survival opening has four voices and is acknowledged durably", () => {
  assert.equal(
    new Set(["human", "elf", "dwarf", "barbarian"].map(town.openingLine)).size,
    4,
  );
  let s = fresh();
  assert.equal(s.townLife.introSeen, false);
  s = reload(act(s, { type: "ACK_OPENING" }));
  assert.equal(s.townLife.introSeen, true);
  assert.equal(s.gold, 300);
});
test("Town moments persist, award actual loyalty once, and return after an expedition", () => {
  let s = openMoment(recruit(fresh(), "kael"), "kael");
  const day = s.day;
  s = reload(s);
  assert.equal(s.townLife.active.companion, "kael");
  s = act(s, { type: "TOWN_MOMENT_CHOICE", choice: "join" });
  assert.equal(s.stories.loyalty.kael, 55);
  assert.equal(s.day, day);
  assert.equal(s.gold, 300);
  assert.equal(s.townLife.result.bonds[0].change, 5);
  assert.match(s.journal[0], /Stormhold/);
  assert.equal(town.townMoments(s).length, 0);
  assert.equal(
    act(s, { type: "TOWN_MOMENT_CHOICE", choice: "join" }).stories.loyalty.kael,
    55,
  );
  s = reload(s);
  assert.equal(s.townLife.result.bonds[0].change, 5);
  s = act(s, { type: "ACK_TOWN_RESULT" });
  assert.equal(s.townLife.result, null);
  s.expedition.number++;
  assert.equal(town.townMoments(s).length, 1);
});
test("Deferring keeps a moment available; leaving consumes it without inventing a bond", () => {
  let s = openMoment(recruit(fresh(), "lyria"), "lyria");
  s = act(s, { type: "CLOSE_TOWN_MOMENT" });
  assert.equal(town.townMoments(s).length, 1);
  s = openMoment(s, "lyria");
  s = act(s, { type: "TOWN_MOMENT_CHOICE", choice: "leave" });
  assert.equal(s.stories.loyalty.lyria, 50);
  assert.equal(s.townLife.result.bonds.length, 0);
  assert.equal(town.townMoments(s).length, 0);
});
test("A shared supper names both companions and strengthens their capped pair bond", () => {
  let s = recruit(recruit(fresh(), "kael"), "lyria");
  const number = s.expedition.number;
  for (
    let i = 0;
    i < 3 && !town.townMoments(s).some((m) => m.id === "supper");
    i++
  )
    s.expedition.number++;
  const supper = town.townMoments(s).find((m) => m.id === "supper");
  assert.ok(supper && supper.partner);
  assert.ok(supper.body.includes(supper.partner.name));
  const key = [supper.companion, supper.partner.id].sort().join(":");
  s.stories.pairs[key] = 1;
  s = openMoment(s, supper.companion);
  s = act(s, { type: "TOWN_MOMENT_CHOICE", choice: "join" });
  assert.equal(s.stories.pairs[key], 2);
  assert.equal(s.townLife.result.pair.change, 1);
  s = act(s, { type: "ACK_TOWN_RESULT" });
  s.expedition.number += 3;
  s = openMoment(s, supper.companion);
  s = act(s, { type: "TOWN_MOMENT_CHOICE", choice: "join" });
  assert.equal(s.stories.pairs[key], 2);
  assert.equal(s.townLife.result.pair, undefined);
  assert.ok(s.expedition.number > number);
});
test("Lyria explains the moving ink and trusting her produces a visible lasting result", () => {
  let s = act(recruit(fresh(), "lyria"), { type: "ACK_OPENING" });
  const chain = stories.STORY_CHAINS.find((c) => c.id === "companion.lyria");
  assert.match(chain.stages[0].body, /Enchanted sap/);
  assert.match(chain.stages[0].body, /mother/);
  s = act(s, { type: "OPEN_STORY", id: chain.id });
  s = act(s, { type: "STORY_CHOICE", stage: "lyria.ink", choice: "help" });
  assert.equal(s.phase, "town");
  assert.equal(s.stories.loyalty.lyria, 65);
  assert.match(s.townLife.result.body, /trusts you/);
  assert.equal(s.townLife.result.bonds[0].change, 15);
  assert.equal(reload(s).townLife.result.title, "Ink that keeps moving");
  assert.equal(
    act(s, { type: "STORY_CHOICE", stage: "lyria.ink", choice: "help" }).stories
      .loyalty.lyria,
    65,
  );
});
test("Loyalty at its cap reports only real gains; a stale companion cannot trap town", () => {
  let s = recruit(fresh(), "kael");
  s.stories.loyalty.kael = 99;
  s = act(openMoment(s, "kael"), {
    type: "TOWN_MOMENT_CHOICE",
    choice: "join",
  });
  assert.equal(s.stories.loyalty.kael, 100);
  assert.equal(s.townLife.result.bonds[0].change, 1);
  s = act(s, { type: "ACK_TOWN_RESULT" });
  s.townLife.active = { id: "spar", companion: "missing" };
  s = act(s, { type: "TOWN_MOMENT_CHOICE", choice: "join" });
  assert.equal(s.townLife.active, null);
});
console.log(`${count} recruitment, lean-start and town-life checks passed.`);
