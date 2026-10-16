const assert = require("node:assert/strict");
const {
  e,
  progression: p,
  monsters: m,
  saves,
  skillIds,
} = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function fresh() {
  return e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "human",
    name: "Rowan",
    roll: 0.5,
  });
}
const variants = m.MONSTERS.filter((s) => s.skill === "Briar Lash");
const {
  behavior,
  rounds: r,
  maps,
  visuals,
  animation,
  narration,
  townProgression: tp,
  relationships,
  exploration: x,
  stories,
} = require("./engine-loader.cjs");
const plain = (value) => JSON.parse(JSON.stringify(value));
function fight(floor = 1, species = "goblin") {
  let s = fresh();
  s = e.reducer(s, { type: "RECRUIT", id: "kael" });
  return r.beginCombat({
    ...s,
    floor,
    phase: "combat",
    enemy: { ...e.enemyFor(floor, null, 2), species, boss: false },
  });
}
test("Every registered species has an authored profile independent of floor and group index", () => {
  for (const species of m.MONSTERS)
    assert.ok(behavior.SPECIES_BEHAVIOR[species.id], species.id);
  const low = fight(1).combat.enemies.find((e) => e.species === "goblin"),
    high = fight(8).combat.enemies[0];
  assert.equal(low.speed, high.speed);
  assert.equal(low.archetype, high.archetype);
  const s = fight(8);
  assert.equal(r.enemyIntent(s, low).label, r.enemyIntent(s, high).label);
  for (const group of Object.values(behavior.MIXED_GROUPS))
    for (const id of group) assert.ok(m.MONSTERS.some((m) => m.id === id));
});
test("Mixed groups have distinct species and identities; a saved fight resumes its exact combatants", () => {
  const s = fight(8, "sentinel");
  assert.equal(s.combat.enemies.length, 3);
  assert.equal(new Set(s.combat.enemies.map((e) => e.species)).size, 3);
  assert.equal(new Set(s.combat.enemies.map((e) => e.id)).size, 3);
  const old = plain(s.combat);
  old.enemies.forEach((e) => {
    delete e.behaviorId;
    e.hp = 11;
  });
  s.expedition.battles[old.id] = old;
  const loaded = e.normalizeSave(plain(s));
  const resumed = r.beginCombat(loaded);
  assert.deepEqual(plain(resumed.combat), old);
  assert.ok(resumed.combat.enemies.every((e) => e.hp === 11 && !e.behaviorId));
});
test("All three enemy visual slots fit small and large scenes and resolve species artwork", () => {
  for (const [width, height] of [
    [280, 240],
    [430, 360],
    [800, 500],
  ])
    for (const count of [1, 2, 3]) {
      const slots = animation.enemyFormation(width, height, count);
      assert.equal(slots.length, count);
      for (const slot of slots) {
        assert.ok(slot.x - slot.size / 2 >= width * 0.5);
        assert.ok(slot.x + slot.size / 2 <= width);
        assert.ok(slot.y - slot.size >= 0 && slot.y <= height);
      }
    }
  const s = fight(8, "sentinel");
  assert.equal(
    new Set(
      s.combat.enemies.map((enemy) => visuals.enemyVisual({ ...s, enemy }).key),
    ).size,
    3,
  );
});
test("New geography varies entrance headings and sanctuary distance; existing charts retain coordinates", () => {
  const headings = new Set(),
    locations = new Set(),
    distances = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const map = maps.generateFloor(1, seed);
    const first = maps.shortestPath(map, map.entrance, map.portal)[1];
    headings.add(
      Object.keys(map.nodes[map.entrance].exits).find(
        (h) => map.nodes[map.entrance].exits[h] === first,
      ),
    );
    const shelter = map.nodes[map.sanctuary];
    locations.add(`${shelter.x},${shelter.y}`);
    distances.add(maps.shortestPath(map, map.entrance, map.sanctuary).length);
  }
  assert.equal(headings.size, 4);
  assert.ok(locations.size > 20);
  assert.ok(distances.size > 4);
  let s = fresh();
  const old = plain(require("./fixtures/floor-v2-6da6d25.json"));
  s.journey.maps[1] = old;
  s = e.normalizeSave(plain(s));
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  assert.deepEqual(plain(s.journey.maps[1].nodes), old.nodes);
});
test("Room prose is deterministic and reflects real exits, orientation, biome and aftermath", () => {
  const room = {
    seed: 42,
    floor: 5,
    floorName: "Shrine",
    biome: "frost",
    id: "room-2",
    kind: "crossroads",
    exits: 3,
    facing: "south",
    resolved: true,
    injured: true,
  };
  const text = narration.narrateRoom(room);
  assert.equal(text, narration.narrateRoom(room));
  assert.match(text, /3 passages/);
  assert.match(text, /face south/);
  assert.match(text, /earlier encounter/);
  assert.match(text, /injured/);
  assert.notEqual(text, narration.narrateRoom({ ...room, biome: "forge" }));
});
test("Bonded protection reduces one incoming hit each round and unavailable allies cannot protect", () => {
  let s = fight(1);
  s.combat.enemies = [
    {
      ...s.combat.enemies[0],
      hp: 1000,
      maxHp: 1000,
      atk: 40,
      speed: 1,
      behaviorId: undefined,
      archetype: "skirmisher",
    },
  ];
  s.party = s.party.map((c, i) => ({ ...c, hp: i ? c.maxHp : 60 }));
  const request = {
    type: "ROUND",
    battleId: s.combat.id,
    round: 1,
    actions: s.party.map((c) => ({ actor: c.id, kind: "focus" })),
  };
  const neutral = e.reducer(plain(s), request);
  s.stories.pairs["hero:kael"] = 2;
  assert.equal(relationships.bondedProtector(s, "hero", new Set()).id, "kael");
  assert.equal(
    relationships.bondedProtector(s, "hero", new Set(["kael"])),
    undefined,
  );
  const bonded = e.reducer(plain(s), request);
  assert.ok(bonded.party[0].hp > neutral.party[0].hp);
  const playback = e.reducer(plain(s), { ...request, animate: true });
  assert.ok(
    playback.roundPlayback.events.some((event) =>
      event.text.includes("bonded protection"),
    ),
  );
  s.party[1].hp = 0;
  assert.equal(relationships.bondedProtector(s, "hero", new Set()), undefined);
});
test("Faction cache help applies once per sanctuary, and hostile pairs decline optional cooperation", () => {
  let s = fresh();
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  const map = x.floorMap(s),
    original = s.food;
  const normal = x.enterMappedRoom(s, map.sanctuary);
  s.faction.guild = 10;
  const allied = x.enterMappedRoom(s, map.sanctuary);
  assert.equal(allied.food, normal.food + 1);
  assert.equal(x.enterMappedRoom(allied, map.sanctuary).food, allied.food);
  assert.ok(allied.food > original);
  const stage = stories.STORY_CHAINS.flatMap((c) => c.stages).find((st) =>
    st.choices.some((c) => c.pair),
  );
  assert.ok(stage);
  {
    const pair = stage.choices.find((c) => c.pair).pair;
    for (const id of pair.ids)
      if (!s.party.some((c) => c.id === id))
        s.party.push(e.makeCharacter("human", id, id));
    s.stories.pairs[[...pair.ids].sort().join(":")] = -2;
    assert.ok(
      stories.presentStoryStage(s, stage).choices.every((c) => !c.pair),
    );
  }
});
test("Training catches up weaker characters without safe infinite levels; bulk plans obey the same limit", () => {
  let s = fresh();
  s.gold = 100000;
  for (let i = 0; i < 100; i++)
    s = e.reducer(s, { type: "TRAIN", skipOpening: true });
  assert.equal(s.party[0].level, tp.trainingLimit(s.bestFloor));
  const day = s.day,
    gold = s.gold;
  s = e.reducer(s, { type: "TRAIN", skipOpening: true });
  assert.equal(s.day, day);
  assert.equal(s.gold, gold);
  s = e.reducer(s, { type: "RECRUIT", id: "kael" });
  const hero = plain(s.party[0]);
  s = e.reducer(s, { type: "TRAIN", skipOpening: true });
  assert.deepEqual(plain(s.party[0]), hero);
  assert.ok(s.party[1].xp > 0);
  let bulk = fresh();
  bulk.day = 1;
  bulk.gold = 1000;
  bulk = e.reducer(bulk, { type: "PREPARE_CYCLE", mode: "train" });
  assert.equal(bulk.day, 30);
  assert.equal(bulk.party[0].level, 2);
  assert.equal(bulk.townProgress.trained, 2);
  assert.equal(bulk.gold, 1000 - 2 * 60 + 27 * 125);
  const veteran = { ...s.party[0], level: 20 };
  assert.equal(tp.trainingXp(veteran, 0), 0);
});
test("Tempering is finite, consumes real materials and retains old upgrades; work cannot farm elite standing", () => {
  let s = fresh();
  s.gold = 100000;
  s.bestFloor = 12;
  for (const id of ["beast-core", "ancient-ore", "relic-fragment"])
    s.inventory[id] = 20;
  const base = s.party[0].atk;
  for (const [i, material, qty] of [
    [0, "beast-core", 2],
    [1, "ancient-ore", 3],
    [2, "relic-fragment", 5],
  ]) {
    s = e.reducer(s, { type: "FORGE", id: "hero" });
    assert.equal(s.party[0].gear, i + 1);
    assert.equal(s.inventory[material], 20 - qty);
  }
  assert.equal(s.party[0].atk, base + 12);
  const gold = s.gold;
  s = e.reducer(s, { type: "FORGE", id: "hero" });
  assert.equal(s.gold, gold);
  s.party[0].gear = 20;
  const stats = plain(s.party[0]);
  s = e.reducer(s, { type: "FORGE", id: "hero" });
  assert.deepEqual(plain(s.party[0]), stats);
  s.faction.guild = 20;
  s = e.reducer(s, { type: "WORK", skipOpening: true });
  assert.equal(s.faction.guild, 20);
  s.faction.guild = 45;
  s = e.reducer(s, { type: "WORK", skipOpening: true });
  assert.equal(s.faction.guild, 45);
});
test("Binding offers every held compatible species, including a route essence without the original", () => {
  let s = fresh();
  const variant = variants.find((v) => v.id === "roots-roamer");
  s.inventory[m.essenceId(variant.id)] = 2;
  let options = p.essenceBindingOptions(s, "Briar Lash");
  assert.equal(options.length, 1);
  assert.equal(options[0].species, variant.id);
  s = e.reducer(s, {
    type: "LEARN",
    id: "hero",
    skill: "Briar Lash",
    species: options[0].species,
  });
  assert.ok(s.party[0].learnedSkills.includes("Briar Lash"));
  assert.equal(s.inventory[m.essenceId(variant.id)], 1);
});
test("An ambiguous binding requires a species and consumes precisely the selected essence", () => {
  // A temporary compatible source keeps the selection regression meaningful now that shipped route powers are unique.
  const alias = m.MONSTERS.find((m) => m.id === "roots-elite"),
    oldSkill = alias.skill;
  alias.skill = "Briar Lash";
  variants.push(alias);
  try {
    let s = fresh();
    for (const v of variants) s.inventory[m.essenceId(v.id)] = 2;
    const before = JSON.stringify(s.inventory);
    const ambiguous = e.reducer(s, {
      type: "LEARN",
      id: "hero",
      skill: "Briar Lash",
    });
    assert.equal(JSON.stringify(ambiguous.inventory), before);
    assert.ok(!ambiguous.party[0].learnedSkills.includes("Briar Lash"));
    assert.equal(
      p.essenceBindingOptions(s, "Briar Lash").length,
      variants.length,
    );
    const selected = variants.at(-1);
    s = e.reducer(s, {
      type: "LEARN",
      id: "hero",
      skill: "Briar Lash",
      species: selected.id,
    });
    for (const v of variants)
      assert.equal(s.inventory[m.essenceId(v.id)], v === selected ? 1 : 2);
    const repeated = e.reducer(s, {
      type: "LEARN",
      id: "hero",
      skill: "Briar Lash",
      species: selected.id,
    });
    assert.equal(
      JSON.stringify(repeated.inventory),
      JSON.stringify(s.inventory),
    );
  } finally {
    variants.pop();
    alias.skill = oldSkill;
  }
});
test("Selected field and secured essences keep their own provenance across binding and defeat", () => {
  for (const unsecured of [true, false]) {
    let s = fresh();
    const selected = variants.at(-1),
      id = m.essenceId(selected.id);
    s = { ...s, phase: "camp", journey: { ...s.journey, startDay: 30 } };
    s.inventory[id] = 2;
    if (unsecured) s.expedition.unsecured.inventory[id] = 1;
    const option = p.essenceBindingOptions(s, "Briar Lash")[0];
    assert.equal(option.unsecured, unsecured ? 1 : 0);
    assert.equal(option.secured, unsecured ? 1 : 2);
    s = e.reducer(s, {
      type: "LEARN",
      id: "hero",
      skill: "Briar Lash",
      species: selected.id,
    });
    assert.equal(
      Boolean(s.expedition.provisionalSkills.hero?.includes("Briar Lash")),
      unsecured,
    );
    s = e.reducer({ ...s, phase: "defeat" }, { type: "DISMISS" });
    assert.equal(s.party[0].learnedSkills.includes("Briar Lash"), !unsecured);
    assert.equal(s.inventory[id], 1);
  }
});
test("Wrong, absent and wild-camp essences cannot consume another species", () => {
  let s = fresh();
  s.inventory["essence-roots-roamer"] = 1;
  for (const species of ["goblin", "missing", "broodmother"]) {
    const n = e.reducer(s, {
      type: "LEARN",
      id: "hero",
      skill: "Briar Lash",
      species,
    });
    assert.equal(n.inventory["essence-roots-roamer"], 1);
    assert.ok(!n.party[0].learnedSkills.includes("Briar Lash"));
  }
  s = { ...s, phase: "camp", journey: { ...s.journey, wildCamp: true } };
  const n = e.reducer(s, {
    type: "LEARN",
    id: "hero",
    skill: "Briar Lash",
    species: "roots-roamer",
  });
  assert.equal(n.inventory["essence-roots-roamer"], 1);
});
async function persistence() {
  let s = fresh();
  s.inventory["essence-roots-roamer"] = 1;
  s = e.reducer(s, {
    type: "LEARN",
    id: "hero",
    skill: "Briar Lash",
    species: "roots-roamer",
  });
  const snapshot = skillIds.serializeSave(s),
    map = new Map([[saves.SAVE_KEY, snapshot]]);
  const loaded = await saves.loadSave({
    getItem: async (key) => map.get(key) || null,
    setItem: async (key, value) => map.set(key, value),
  });
  assert.ok(loaded.save);
  assert.equal(loaded.backedUp, false);
  assert.equal(map.get(saves.SAVE_KEY), snapshot);
  const resumed = e.normalizeSave(loaded.save);
  assert.ok(resumed.party[0].learnedSkills.includes("Briar Lash"));
  assert.equal(resumed.inventory["essence-roots-roamer"], 0);
  assert.equal(resumed.journey.seed, s.journey.seed);
  assert.equal(resumed.party[0].xp, s.party[0].xp);
  count++;
  console.log(
    "PASS Current version-2 campaigns resume without reset or repeated binding rewards",
  );
}
persistence()
  .then(() => console.log(`${count} critical-fix checks passed.`))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
