const assert = require("node:assert/strict");
const {
  e,
  stories: q,
  w,
  progression: p,
  exploration: x,
  generic: g,
  genericData: gd,
} = require("./engine-loader.cjs");
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
function party() {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    name: "Tester",
    race: "barbarian",
    seed: 42,
    roll: 0.5,
  });
  for (const id of ["kael", "lyria", "bram"])
    s = e.reducer(s, { type: "RECRUIT", id });
  return s;
}
function place(s, stage, route) {
  return {
    ...s,
    phase:
      stage.location === "town"
        ? "town"
        : stage.site === "shelter"
          ? "camp"
          : "exploration",
    floor: stage.floor || s.floor,
    bestFloor: Math.max(s.bestFloor, stage.bestFloor || 0),
    route: route || s.route,
    journey: { ...s.journey, startDay: stage.location === "town" ? null : 30 },
    party: s.party.map((c) => ({ ...c, exhaustion: 0 })),
  };
}
function choose(s, chain, choice = "help") {
  const stage = chain.stages[s.stories.stages[chain.id] || 0];
  s = e.reducer(s, { type: "OPEN_STORY", id: chain.id });
  assert.equal(s.phase, "story");
  return e.reducer(s, { type: "STORY_CHOICE", stage: stage.id, choice });
}
test("Kael and Lyria have three eligible, durable stages with unique rewards and aftermath", () => {
  for (const chain of q.STORY_CHAINS.filter((c) =>
    ["kael", "lyria"].includes(c.companion),
  )) {
    let s = party();
    for (const stage of chain.stages) {
      s = place(s, stage);
      assert.equal(q.storyEligible(s, chain), true);
      const opened = e.reducer(s, { type: "OPEN_STORY", id: chain.id });
      const saved = e.normalizeSave(JSON.parse(JSON.stringify(opened)));
      s = e.reducer(saved, {
        type: "STORY_CHOICE",
        stage: stage.id,
        choice: stage.choices[0].id,
      });
      const repeated = e.reducer(s, {
        type: "STORY_CHOICE",
        stage: stage.id,
        choice: stage.choices[0].id,
      });
      assert.equal(repeated.gold, s.gold);
      assert.deepEqual(repeated.inventory, s.inventory);
      assert.ok(s.stories.outcomes[stage.id]);
    }
    assert.equal(s.stories.stages[chain.id], 3);
    assert.equal(q.storyEligible(s, chain), false);
    assert.equal(q.loyalty(s, chain.companion), 95);
    assert.ok(chain.aftermath.length > 40);
    assert.equal(s.stories.history.length, 3);
    assert.ok(
      chain.stages[2].choices.every(
        (c) => !c.item || w.ITEMS.some((i) => i.id === c.item),
      ),
    );
  }
});
test("Locked floors, absent companions and stale stage taps cannot advance a chain", () => {
  let s = party(),
    chain = q.STORY_CHAINS[0];
  const initial = s.stories;
  s = e.reducer(s, {
    type: "STORY_CHOICE",
    stage: chain.stages[0].id,
    choice: "help",
  });
  assert.deepEqual(s.stories, initial);
  s = choose(s, chain);
  assert.equal(q.storyEligible(s, chain), false);
  s = {
    ...s,
    phase: "exploration",
    floor: 2,
    party: s.party.filter((c) => c.id !== "kael"),
  };
  assert.equal(q.storyEligible(s, chain), false);
});
test("Authored choices bond or estrange pairs, and individual reactions stay in the journal", () => {
  for (const harmful of [false, true]) {
    let s = party();
    for (const chain of q.STORY_CHAINS.filter((c) =>
      ["kael", "lyria"].includes(c.companion),
    )) {
      s = choose(place(s, chain.stages[0]), chain);
      s = choose(
        place(s, chain.stages[1]),
        chain,
        harmful ? chain.stages[1].choices[1].id : "help",
      );
    }
    assert.equal(
      q.pairRelationship(s, "kael", "lyria"),
      harmful ? "hostile" : "bonded",
    );
    assert.ok(s.journal[0].length > 40);
  }
});
test("Defeat removes five loyalty once, companions stay, reconciliation gates only the next entry", () => {
  let s = party();
  s.stories.loyalty.kael = 25;
  s = {
    ...s,
    phase: "defeat",
    expedition: p.newExpedition(1),
    journey: { ...s.journey, startDay: 30, watches: 180 },
  };
  s = e.reducer(s, { type: "DISMISS" });
  assert.equal(q.loyalty(s, "kael"), 20);
  s = e.reducer(s, { type: "DISMISS" });
  assert.equal(q.loyalty(s, "kael"), 20);
  assert.equal(s.party.length, 4);
  s = e.reducer(s, { type: "RETURN" });
  s = e.reducer({ ...s, day: 90 }, { type: "ENTER" });
  assert.equal(s.phase, "town");
  s = e.reducer(s, { type: "RECONCILE", id: "kael" });
  assert.equal(q.loyalty(s, "kael"), 20);
  assert.equal(s.phase, "story");
  s = e.reducer(s, {
    type: "STORY_CHOICE",
    stage: s.stories.active.stage,
    choice: "listen",
  });
  s = { ...s, food: Math.max(2, s.food) };
  s = e.reducer(s, {
    type: "STORY_CHOICE",
    stage: s.stories.active.stage,
    choice: "restitution",
  });
  assert.equal(q.loyalty(s, "kael"), 30);
  s = e.reducer(s, { type: "ENTER" });
  assert.equal(s.phase, "mission");
});
test("A field quest reward follows unsecured provenance and its stage cannot be farmed after defeat", () => {
  const chain = q.STORY_CHAINS[1];
  let s = party();
  for (const stage of chain.stages) s = choose(place(s, stage), chain);
  assert.equal(s.expedition.unsecured.inventory["root-mantle"], 1);
  s = e.reducer({ ...s, phase: "defeat" }, { type: "DISMISS" });
  assert.equal(s.inventory["root-mantle"], 0);
  assert.equal(s.stories.stages[chain.id], 3);
});
test("Every shipped companion arc plays through both authored decisions with persistent aftermath", () => {
  for (const chain of q.STORY_CHAINS.filter((c) => c.companion))
    for (const branch of [0, 1]) {
      let s = party();
      const recruit = e.RECRUITS.find((r) => r.id === chain.companion);
      s.party = [
        s.party[0],
        e.makeCharacter(recruit.race, recruit.id, recruit.name),
      ];
      for (const stage of chain.stages) {
        s = place(s, stage);
        const presentation = q.presentStoryStage(s, stage),
          partner = stage.choices
            .find((c) => c.pair)
            ?.pair.ids.find((id) => id !== chain.companion);
        if (partner)
          assert.ok(
            !presentation.body.includes(
              e.RECRUITS.find((r) => r.id === partner).name,
            ),
            "An absent companion cannot narrate a field scene",
          );
        const previous = s.stories.stages[chain.id] || 0;
        s = choose(s, chain, stage.choices[branch].id);
        assert.equal(s.stories.stages[chain.id], previous + 1);
        s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
        const gold = s.gold,
          inventory = JSON.stringify(s.inventory);
        const repeated = e.reducer(s, {
          type: "STORY_CHOICE",
          stage: stage.id,
          choice: stage.choices[branch].id,
        });
        assert.equal(repeated.gold, gold);
        assert.equal(JSON.stringify(repeated.inventory), inventory);
        assert.ok(stage.body.length > 100);
        assert.ok(stage.choices.every((c) => c.outcome.length > 50));
        assert.ok(
          stage.choices.every(
            (c) => !c.item || w.ITEMS.some((i) => i.id === c.item),
          ),
        );
      }
      assert.equal(s.stories.stages[chain.id], 3);
      assert.equal(q.storyEligible(s, chain), false);
      assert.equal(s.stories.history.length, 3);
    }
});
test("Floor chains preserve the principal event, restrict follow-ups to their floor, and cannot repeat rewards", () => {
  for (const chain of q.STORY_CHAINS.filter((c) => c.category === "floor")) {
    let s = place(party(), chain.stages[0]);
    s = { ...s, phase: "event", eventResolved: false };
    const principalChoice = chain.stages[0].choices.find(
      (c) => c.id !== "examine",
    ).id;
    s = e.reducer(s, { type: "EVENT", choice: principalChoice, roll: 0.8 });
    assert.equal(s.stories.stages[chain.id], 1);
    const inventory = JSON.stringify(s.inventory),
      gold = s.gold;
    const repeated = e.reducer(
      { ...s, phase: "event", eventResolved: false },
      { type: "EVENT", choice: principalChoice, roll: 0.8 },
    );
    assert.equal(repeated.gold, gold);
    assert.equal(JSON.stringify(repeated.inventory), inventory);
    for (const stage of chain.stages.slice(1)) {
      s = place(s, stage);
      if (stage.site === "portal") {
        const map = x.floorMap(s);
        s = {
          ...s,
          journey: {
            ...s.journey,
            room: map.portal,
            defeatedPortals: [x.currentMapKey(s)],
          },
        };
      }
      assert.equal(q.storyEligible({ ...s, floor: s.floor + 1 }, chain), false);
      assert.equal(q.storyEligible(s, chain), true);
      s = choose(s, chain, stage.choices[0].id);
    }
    assert.equal(q.principalResolved(s), true);
    assert.equal(s.stories.stages[chain.id], 3);
    assert.equal(q.storyEligible(s, chain), false);
  }
});
test("Each route faction chain requires its own route, persists standing and pays its final reward once", () => {
  for (const chain of q.STORY_CHAINS.filter((c) => c.category === "route"))
    for (const branch of [0, 1]) {
      let s = party();
      for (const stage of chain.stages) {
        s = place(s, stage, chain.route);
        if (stage.site === "portal") {
          const map = x.floorMap(s);
          s = {
            ...s,
            journey: {
              ...s.journey,
              room: map.portal,
              defeatedPortals: [x.currentMapKey(s)],
            },
          };
        }
        assert.equal(
          q.storyEligible(
            { ...s, route: chain.route === "roots" ? "forge" : "roots" },
            chain,
          ),
          false,
        );
        assert.equal(q.storyEligible(s, chain), true);
        s = choose(s, chain, stage.choices[branch].id);
        s = e.normalizeSave(JSON.parse(JSON.stringify(s)));
      }
      assert.equal(s.stories.stages[chain.id], 3);
      assert.equal(q.storyEligible(s, chain), false);
      assert.ok(
        branch
          ? s.stories.factions[chain.route] < 0
          : s.stories.factions[chain.route] > 0,
      );
    }
});
test("Generic shuffle bags exhaust quietly, skip consecutive families, and enforce current/previous-expedition cooldowns", () => {
  let s = {
    ...party(),
    phase: "branch",
    floor: 12,
    expedition: p.newExpedition(1),
  };
  const deferred = g.assignGeneric(
    {
      ...s,
      stories: {
        ...s.stories,
        genericBag: ["generic.lantern"],
        genericFamily: "travellers",
      },
    },
    "deferred-room",
  );
  assert.ok(
    deferred.expedition.generic["deferred-room"],
    "A stale same-family entry cannot block a newly eligible pool",
  );
  assert.notEqual(
    gd.GENERIC_ENCOUNTERS.find(
      (c) => c.id === deferred.expedition.generic["deferred-room"].id,
    ).family,
    "travellers",
  );
  const byExp = [];
  for (let expedition = 1; expedition <= 100; expedition++) {
    s = { ...s, expedition: p.newExpedition(expedition) };
    const seen = new Set();
    for (let room = 0; room < 40; room++) {
      const key = `fixture:${room}`,
        before = s.stories.genericFamily;
      s = g.assignGeneric({ ...s, phase: "branch" }, key);
      const record = s.expedition.generic[key];
      if (!record) {
        assert.equal(s.phase, "exploration");
        continue;
      }
      assert.ok(!seen.has(record.id));
      assert.ok(!byExp.at(-1)?.has(record.id));
      assert.notEqual(
        gd.GENERIC_ENCOUNTERS.find((c) => c.id === record.id).family,
        before,
      );
      seen.add(record.id);
      const saved = e.normalizeSave(JSON.parse(JSON.stringify(s)));
      const same = g.assignGeneric(saved, key);
      assert.equal(
        JSON.stringify(same.expedition.generic[key]),
        JSON.stringify(record),
      );
      assert.equal(same.rng.encounters, s.rng.encounters);
    }
    if (expedition % 2 === 1)
      assert.ok(
        seen.size > 0,
        "Cooled-down stories must become available again",
      );
    byExp.push(seen);
  }
});
test("Every generic variant has payable choices, durable outcomes and at most one reward per room", () => {
  for (const encounter of gd.GENERIC_ENCOUNTERS)
    for (let variant = 0; variant < 2; variant++)
      for (const choice of encounter.choices) {
        let s = party();
        const room = x.encounterKey(s);
        s = {
          ...s,
          food: 30,
          phase: "branch",
          journey: {
            ...s.journey,
            startDay: 30,
            branch: { id: room, kind: "company", direction: "straight" },
          },
          expedition: {
            ...p.newExpedition(1),
            generic: { [room]: { id: encounter.id, variant, resolved: false } },
          },
        };
        const request = {
          type: "GENERIC_CHOICE",
          room,
          id: encounter.id,
          choice: choice.id,
        };
        const next = e.reducer(s, request);
        assert.equal(next.expedition.generic[room].resolved, true);
        assert.equal(next.journey.watches, 1);
        const loaded = e.normalizeSave(JSON.parse(JSON.stringify(next)));
        const repeated = e.reducer(loaded, request);
        assert.equal(repeated.gold, next.gold);
        assert.equal(
          JSON.stringify(repeated.inventory),
          JSON.stringify(next.inventory),
        );
        if (choice.item)
          assert.equal(next.expedition.unsecured.inventory[choice.item], 1);
        assert.ok(encounter.variants[variant].length > 80);
      }
});
test("Shipped content has thirty companion stages, twelve floor chains, four route chains and twenty-four generic encounters", () => {
  assert.equal(
    q.STORY_CHAINS.filter((c) => c.companion).reduce(
      (n, c) => n + c.stages.length,
      0,
    ),
    30,
  );
  assert.equal(q.STORY_CHAINS.filter((c) => c.category === "floor").length, 12);
  assert.equal(q.STORY_CHAINS.filter((c) => c.category === "route").length, 4);
  assert.equal(gd.GENERIC_ENCOUNTERS.length, 24);
  const ids = q.STORY_CHAINS.flatMap((c) => [
    c.id,
    ...c.stages.map((s) => s.id),
  ]).concat(gd.GENERIC_ENCOUNTERS.map((c) => c.id));
  assert.equal(ids.length, new Set(ids).size);
});
test("Town story rewards stay secured and exempt from expedition shares; final-watch field decisions resolve before extraction", () => {
  const chain = q.STORY_CHAINS.find((c) => c.id === "companion.kael");
  let s = party();
  s = {
    ...s,
    stories: { ...s.stories, stages: { [chain.id]: 2 } },
    runContracts: { kael: 14 },
  };
  s = place(s, chain.stages[2]);
  const gold = s.gold;
  s = choose(s, chain, "seal");
  assert.equal(s.gold, gold + 150);
  assert.equal(s.expedition.unsecured.gold, 0);
  assert.equal(
    Object.values(s.expedition.accruedShares).reduce((a, b) => a + b, 0),
    0,
  );
  const field = q.STORY_CHAINS.find((c) => c.id === "companion.lyria");
  s = place(
    {
      ...s,
      food: 30,
      stories: { ...s.stories, stages: { ...s.stories.stages, [field.id]: 2 } },
    },
    field.stages[2],
  );
  s.journey.watches = 179;
  s = choose(s, field);
  assert.equal(s.phase, "extraction");
  assert.equal(s.stories.stages[field.id], 3);
  assert.equal(s.inventory["root-mantle"], 1);
});
test("Companions react individually, generic offers validate costs, and early floors cannot select upper-floor stories", () => {
  let s = { ...party(), phase: "event", floor: 3, eventResolved: false };
  s = e.reducer(s, { type: "EVENT", choice: "ally", roll: 0.8 });
  assert.equal(q.loyalty(s, "kael"), 55);
  assert.equal(q.loyalty(s, "lyria"), 50);
  assert.ok(
    s.journal.some((line) => line.includes("Kael") && line.includes("loyalty")),
  );
  const low = { ...party(), floor: 1, expedition: p.newExpedition(1) };
  for (let i = 0; i < 24; i++) {
    const next = g.assignGeneric(low, `room:${i}`);
    const record = next.expedition.generic[`room:${i}`];
    if (record)
      assert.ok(
        gd.GENERIC_ENCOUNTERS.find((c) => c.id === record.id).minFloor <= 1,
      );
  }
  const room = x.encounterKey(s),
    encounter = gd.GENERIC_ENCOUNTERS.find((c) => c.id === "generic.soup");
  s = {
    ...s,
    gold: 0,
    phase: "branch",
    journey: {
      ...s.journey,
      branch: { id: room, kind: "company", direction: "straight" },
    },
    expedition: {
      ...s.expedition,
      generic: { [room]: { id: encounter.id, variant: 0, resolved: false } },
    },
  };
  const before = s.journey.watches;
  s = e.reducer(s, {
    type: "GENERIC_CHOICE",
    room,
    id: encounter.id,
    choice: "talk",
  });
  assert.equal(s.journey.watches, before);
  assert.equal(s.expedition.generic[room].resolved, false);
  assert.equal(s.gold, 0);
});
console.log(`${count} story checks passed.`);
