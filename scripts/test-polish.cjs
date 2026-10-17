const assert = require("node:assert/strict"),
  fs = require("node:fs");
const {
  e,
  monsters: m,
  speciesArt: a,
  storyIllustrations: illustrations,
  stories,
  npcs,
  visuals: v,
  animation: anim,
  combatAudio: audio,
  presentation: ui,
  skillIds,
  rounds: r,
} = require("./engine-loader.cjs");
let count = 0;
const plain = (v) => JSON.parse(JSON.stringify(v));
function test(n, fn) {
  fn();
  console.log("PASS " + n);
  count++;
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
test("All forty-four species resolve to distinct real transparent animation sheets", () => {
  const hashes = new Set(),
    crypto = require("node:crypto");
  const sheetBindings = fs.readFileSync(
    "src/components/combat-sheets.ts",
    "utf8",
  );
  assert.equal(m.MONSTERS.length, 44);
  for (const monster of m.MONSTERS) {
    assert.equal(monster.visual, monster.id);
    const path = "assets/combat/" + monster.visual + "-motion.png";
    assert.ok(
      sheetBindings.includes(path.replace("assets/", "../../assets/")),
      path,
    );
    const data = fs.readFileSync(path);
    assert.equal(
      data.readUInt32BE(16) / 8,
      data.readUInt32BE(20) / 6,
      monster.id + " square cells",
    );
    assert.equal(data[25], 6, monster.id + " RGBA alpha");
    hashes.add(crypto.createHash("sha256").update(data).digest("hex"));
    const profile = a.SPECIES_PROFILES[monster.id];
    const s = { ...fresh(), enemy: { ...e.enemyFor(1), species: monster.id } };
    assert.equal(v.enemyVisual(s).key, monster.id);
    if (profile) assert.equal(v.enemyVisual(s).style, profile.style);
  }
  assert.equal(hashes.size, 44);
});

test("All major story stages have stable panel mappings and bundled artwork", () => {
  const stages = stories.STORY_CHAINS.filter((c) => c.category !== "generic");
  const mapped = illustrations.STORY_ILLUSTRATIONS;
  assert.equal(Object.keys(mapped).length, 78);
  const cells = new Set();
  const bindings = fs.readFileSync(
    "src/components/story-illustration-sheets.ts",
    "utf8",
  );
  const completed = JSON.parse(
    fs.readFileSync("assets/art-production-manifest.json", "utf8"),
  ).stories;
  const layouts = require("./engine-loader.cjs").illustrationLayouts
    .ILLUSTRATION_LAYOUTS;
  assert.equal(completed.length, stages.length);
  for (const chain of stages) {
    const path = "assets/story/" + layouts[chain.id].file;
    if (completed.some((a) => a.id === chain.id)) {
      assert.ok(bindings.includes("../../" + path));
      const data = fs.readFileSync(path);
      const ratio = (data.readUInt32BE(16) * 3) / data.readUInt32BE(20);
      assert.ok(Math.abs(ratio - 1.6) < 0.06, path + " landscape panels");
    } else
      assert.ok(
        !bindings.includes("../../" + path),
        "Pending artwork cannot break the bundle",
      );
    chain.stages.forEach((stage, panel) => {
      assert.equal(mapped[stage.id].sheet, chain.id);
      assert.equal(mapped[stage.id].panel, panel);
      assert.equal(mapped[stage.id].label, stage.title);
      cells.add(chain.id + ":" + panel);
    });
  }
  assert.equal(cells.size, 78);
});
test("Every recurring NPC has a distinct portrait bound to its stable identity", () => {
  const completed = JSON.parse(
    fs.readFileSync("assets/art-production-manifest.json", "utf8"),
  ).npcs;
  const bindings = fs.readFileSync("src/components/npc-portrait.tsx", "utf8");
  assert.deepEqual(
    completed.map((a) => a.id).sort(),
    Object.keys(npcs.WORLD_NPCS).sort(),
  );
  const hashes = new Set();
  for (const npc of completed) {
    assert.ok(bindings.includes("../../" + npc.path));
    const data = fs.readFileSync(npc.path);
    assert.ok(
      Math.abs(data.readUInt32BE(16) / data.readUInt32BE(20) - 0.75) < 0.06,
    );
    hashes.add(
      require("node:crypto").createHash("sha256").update(data).digest("hex"),
    );
  }
  assert.equal(hashes.size, 3);
});
test("All sixteen four-character rank arrangements fit phone and large-screen health bounds with correct front distance", () => {
  for (const width of [280, 320, 390, 430, 768])
    for (let mask = 0; mask < 16; mask++) {
      const party = Array.from({ length: 4 }, (_, i) => ({
          ...e.makeCharacter("human", "hero-" + i, "Member " + i),
          formation: mask & (1 << i) ? "front" : "back",
        })),
        height = anim.tacticalStageHeight(party),
        points = anim.partyFormation(width, height, party);
      const panels = points.map(anim.healthPanel);
      for (const panel of panels) {
        assert.ok(panel.x >= 0);
        assert.ok(panel.x + panel.width <= width);
        assert.ok(panel.y >= 0);
        assert.ok(panel.y + panel.height <= height);
      }
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) {
          const A = panels[i],
            B = panels[j];
          assert.ok(
            A.x + A.width <= B.x ||
              B.x + B.width <= A.x ||
              A.y + A.height <= B.y ||
              B.y + B.height <= A.y,
          );
          if (party[i].formation === "front" && party[j].formation === "back")
            assert.ok(points[i].x > points[j].x);
        }
    }
});
test("Saved round playback always starts a new round at its first event and stale cursors cannot skip it", () => {
  const s = fresh(),
    p1 = {
      before: { ...s, combat: { id: "b1", round: 1 } },
      events: [{}, {}, {}],
    },
    p2 = { before: { ...s, combat: { id: "b1", round: 2 } }, events: [{}, {}] },
    key = ui.playbackKey(p1);
  assert.equal(ui.playbackStep({ key, step: 2 }, key, 3), 2);
  assert.equal(ui.playbackStep({ key, step: 2 }, ui.playbackKey(p2), 2), 0);
  assert.equal(
    ui.playbackStep({ key: "", step: 0 }, ui.playbackKey(plain(p1)), 3),
    0,
  );
  assert.equal(ui.playbackStep({ key, step: 99 }, key, 3), 2);
});
test("Elemental, bone, wolf, spider and phase events choose distinct sounds without inventing rewards", () => {
  const event = (kind, species, element = "physical") => ({
    kind,
    actor: "enemy",
    enemies: [{ id: "enemy", species, element }],
    party: [],
    effects: {},
  });
  assert.equal(audio.eventFeedback(event("strike", "goblin", "fire")), "fire");
  assert.equal(
    audio.eventFeedback(event("strike", "goblin", "frost")),
    "frost",
  );
  assert.equal(
    audio.eventFeedback(event("strike", "goblin", "venom")),
    "venom",
  );
  assert.equal(audio.eventFeedback(event("strike", "skeleton-mender")), "bone");
  assert.equal(audio.eventFeedback(event("strike", "wolf-pack")), "pack");
  assert.equal(audio.eventFeedback(event("strike", "spiderling")), "skitter");
  assert.equal(audio.eventFeedback(event("phase", "hollow-king")), "phase");
  assert.equal(audio.eventFeedback(event("cancel", "goblin")), undefined);
});
test("Original synthesized cues are valid mono PCM, non-silent and unclipped", () => {
  const hashes = new Set();
  for (const name of [
    "fire",
    "frost",
    "venom",
    "bone",
    "pack",
    "skitter",
    "phase",
  ]) {
    const data = fs.readFileSync("assets/audio/" + name + ".wav");
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WAVE");
    assert.equal(data.readUInt16LE(22), 1);
    assert.equal(data.readUInt32LE(24), 22050);
    assert.equal(data.readUInt16LE(34), 16);
    let peak = 0;
    for (let i = 44; i < data.length; i += 2)
      peak = Math.max(peak, Math.abs(data.readInt16LE(i)));
    assert.ok(peak > 1000 && peak < 32767);
    hashes.add(data.toString("base64"));
  }
  assert.equal(hashes.size, 7);
});
test("Reduced-motion poses stay stable and new healing, fire and frost powers use appropriate effects", () => {
  const s = fresh();
  for (const [skill, style, color] of [
    ["Thorn Shelter", "heal", "#8fffc0"],
    ["Cinder Rush", "magic", "#ffb078"],
    ["Glacier Aegis", "magic", "#a5e6fc"],
  ]) {
    const before = { ...s, phase: "combat", enemy: e.enemyFor(1) },
      after = {
        ...before,
        effects: { ...before.effects, damage: 20, kind: "skill" },
      };
    const cue = anim.battleCue(before, after, {
      type: "BATTLE",
      kind: "skill",
      skill,
      actor: "hero",
      roll: 0.5,
    });
    assert.equal(cue.actorStyle, style);
    assert.equal(cue.color, color);
    assert.deepEqual(
      plain(anim.combatPose(0, 0, cue, "hero", false, true)),
      plain(anim.combatPose(1000, 5000, cue, "hero", false, true)),
    );
  }
  assert.equal(ui.visibleStatus({ ailments: { poison: 2 } }), "venom");
  assert.equal(
    ui.visibleStatus({
      conditions: { burning: { stacks: 1 }, frozen: { stacks: 1 } },
    }),
    "frozen",
  );
});
test("Area playback snapshots show primary impact before secondary targets and reload cannot repeat the accepted cast", () => {
  let s = fresh();
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  s = r.beginCombat({
    ...s,
    phase: "combat",
    floor: 2,
    enemy: e.enemyFor(2, null, 1),
  });
  s.party = s.party.map((c) => ({
    ...c,
    level: 3,
    mp: 100,
    maxMp: 100,
    skills: ["Crown Pulse"],
    learnedSkills: ["Crown Pulse"],
    speed: 50,
  }));
  s.combat.enemies = s.combat.enemies.map((e, i) => ({
    ...e,
    id: "e" + i,
    hp: 1000,
    maxHp: 1000,
    speed: 1,
    guard: 0,
    shield: 0,
  }));
  s.combat.intents = Object.fromEntries(
    s.combat.enemies.map((e) => [
      e.id,
      { kind: "wait", power: 0, targets: [], label: "wait" },
    ]),
  );
  const req = {
      type: "ROUND",
      battleId: s.combat.id,
      round: s.combat.round,
      animate: true,
      actions: [
        { actor: "hero", kind: "skill", skill: "Crown Pulse", target: "e0" },
      ],
    },
    n = e.reducer(s, req),
    events = n.roundPlayback.events.filter(
      (e) => e.actor === "hero" && e.effects.damage > 0,
    );
  assert.equal(events[0].target, "e0");
  assert.equal(events[0].enemies[1].hp, 1000);
  assert.ok(events[1].enemies[1].hp < 1000);
  const loaded = e.normalizeSave(plain(n)),
    finished = e.reducer(loaded, { type: "FINISH_PLAYBACK" });
  assert.equal(finished.party[0].mp, n.party[0].mp);
  assert.equal(e.reducer(finished, req).party[0].mp, n.party[0].mp);
});
test("A large version-two campaign preserves all new powers, maps and presentation after repeated serialized saves", () => {
  let s = fresh();
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  s.party = s.party.map((c) => ({
    ...c,
    learnedSkills: m.MONSTERS.map((m) => m.skill),
    mastery: Object.fromEntries(m.MONSTERS.map((m) => [m.skill, 40])),
  }));
  const timings = [];
  let text = "";
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    text = skillIds.serializeSave(s);
    s = e.normalizeSave(skillIds.deserializeSave(JSON.parse(text)));
    timings.push(performance.now() - start);
  }
  assert.equal(s.party[0].learnedSkills.length, 44);
  assert.equal(Object.keys(s.journey.maps).length, 21);
  assert.equal(s.expedition.director.version, 1);
  assert.ok(text.length < 2 * 1024 * 1024);
  fs.mkdirSync("verification", { recursive: true });
  const report = {
    bytes: Buffer.byteLength(text),
    iterations: 50,
    meanMs: timings.reduce((n, v) => n + v, 0) / 50,
    maxMs: Math.max(...timings),
    note: "Desktop serialization benchmark; device storage latency is deferred.",
  };
  fs.writeFileSync(
    "verification/master-m7-save-performance.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
});
test("Every floor keeps its own authored scenery and four routes select distinct appropriate empty arenas", () => {
  const { environments } = require("./engine-loader.cjs");
  for (let floor = 1; floor <= 12; floor++)
    assert.equal(environments.arenaFloor(floor), floor);
  assert.deepEqual(
    ["roots", "frost", "forge", "crypt"].map((route) =>
      environments.arenaFloor(6, route),
    ),
    [8, 10, 9, 11],
  );
  for (const route of ["roots", "frost", "forge", "crypt"])
    assert.equal(environments.arenaFloor(12, route), 12);
});
test("Scenery never leaks an adjacent atlas cell in full-screen or compact arenas", () => {
  const { environments } = require("./engine-loader.cjs");
  for (const [width, height] of [
    [320, 488],
    [390, 765],
    [460, 940],
    [375, 260],
    [720, 360],
  ]) {
    for (let cell = 0; cell < 4; cell++) {
      const rect = environments.battleBackdropBounds(width, height, cell);
      const tileWidth = rect.width / 2;
      const tileHeight = rect.height / 2;
      const left = rect.x + (cell % 2) * tileWidth;
      const top = rect.y + Math.floor(cell / 2) * tileHeight;
      assert.ok(left <= 1e-8 && left + tileWidth >= width - 1e-8);
      assert.ok(top <= 1e-8 && top + tileHeight >= height - 1e-8);
      assert.equal(rect.height / rect.width, 1.5);
    }
  }
});
test("Larger focused formations keep every fighter and overhead plate inside the arena", () => {
  for (const [width, height] of [
    [320, 481],
    [390, 765],
    [460, 940],
  ]) {
    for (let mask = 0; mask < 16; mask++) {
      const party = Array.from({ length: 4 }, (_, i) => ({
        ...e.makeCharacter("human", "focus-" + i, "Member " + i),
        formation: mask & (1 << i) ? "front" : "back",
      }));
      for (let count = 1; count <= 3; count++) {
        const layout = anim.focusedBattleFormation(
          width,
          height,
          party,
          count,
          56,
        );
        const plates = [
          ...layout.party.map((p) => ({
            ...anim.healthPanel(p),
            y: p.y - p.size * 0.96 - 28,
            height: 28,
          })),
          ...layout.enemies.map((p) => ({
            x: p.x - Math.min(132, p.size + 8) / 2,
            y: p.y - p.size * 0.96 - 34,
            width: Math.min(132, p.size + 8),
            height: 32,
          })),
        ];
        for (const p of [...layout.party, ...layout.enemies]) {
          assert.ok(p.x - p.size / 2 >= 0 && p.x + p.size / 2 <= width);
          assert.ok(p.y <= height - 10);
        }
        for (const p of plates) {
          assert.ok(p.x >= 0 && p.x + p.width <= width);
          assert.ok(p.y >= 56 && p.y + p.height <= height);
        }
        for (let i = 0; i < plates.length; i++)
          for (let j = i + 1; j < plates.length; j++) {
            const a = plates[i],
              b = plates[j];
            assert.ok(
              a.x + a.width <= b.x ||
                b.x + b.width <= a.x ||
                a.y + a.height <= b.y ||
                b.y + b.height <= a.y,
              `plates overlap at ${width} × ${height}, ranks ${mask}, enemies ${count}`,
            );
          }
        if (mask === 3) {
          assert.ok(
            layout.party.every(
              (p) => p.size >= Math.min(146, width * 0.34) * 0.8,
            ),
          );
          assert.ok(
            layout.enemies.every(
              (p) =>
                p.size >=
                Math.min(150, width * (count === 3 ? 0.3 : 0.38)) * 0.8,
            ),
          );
          const frontX = Math.max(...layout.party.map((p) => p.x));
          assert.ok(layout.enemies.every((p) => p.x - frontX < width * 0.42));
        }
      }
    }
  }
});

test("Enemy inspection reveals only witnessed moves and elements; victories unlock defenses and powers", () => {
  const { bestiary, trial } = require("./engine-loader.cjs");
  let s = r.beginCombat({
    ...trial.trialSave({ ...trial.DEFAULT_TRIAL, enemy: "2" }),
    trial: false,
    combat: null,
    bestiary: {},
    inventory: {},
  });
  const foe = s.combat.enemies[0];
  const first = bestiary.monsterKnowledge(s, foe);
  assert.equal(first.element, undefined);
  assert.equal(first.skill, undefined);
  assert.equal(first.weaknesses, undefined);
  assert.equal(first.resistances, undefined);
  assert.equal(first.moves.length, 0);
  let next = s,
    strike;
  for (let i = 0; i < 4 && !strike; i++) {
    next = e.reducer(next, {
      type: "ROUND",
      battleId: next.combat.id,
      round: next.combat.round,
      actions: next.party.map((c) => ({ actor: c.id, kind: "focus" })),
      animate: true,
    });
    strike = next.roundPlayback.events.find(
      (event) =>
        event.kind === "strike" &&
        s.combat.enemies.some((f) => f.id === event.actor),
    );
    if (!strike) next = e.reducer(next, { type: "FINISH_PLAYBACK" });
  }
  assert.ok(strike, "an actual enemy strike occurred");
  const attacker = next.combat.enemies.find((f) => f.id === strike.actor);
  const observed = bestiary.monsterKnowledge(next, attacker);
  assert.equal(observed.element, attacker.element);
  assert.ok(observed.moves.length > 0);
  assert.equal(observed.skill, undefined);
  assert.equal(
    bestiary.monsterKnowledge(s, foe).moves.length,
    0,
    "future round knowledge cannot leak into the prior state",
  );
  s = e.normalizeSave(
    skillIds.deserializeSave(JSON.parse(skillIds.serializeSave(next))),
  );
  assert.equal(
    bestiary.monsterKnowledge(s, attacker).element,
    attacker.element,
  );
  s = { ...s, bestiary: bestiary.recordDefeats(s.bestiary, [attacker]) };
  const defeated = bestiary.monsterKnowledge(s, attacker);
  assert.ok(defeated.skill);
  assert.deepEqual(
    plain(defeated.weaknesses),
    plain(attacker.weaknesses || []),
  );
  assert.deepEqual(
    plain(defeated.resistances),
    plain(attacker.resistances || {}),
  );
});

test("Legacy discoveries remain readable and a repeated move can still teach a newly witnessed element", () => {
  const { bestiary } = require("./engine-loader.cjs");
  const foe = { ...e.enemyFor(2, null, 1), species: "roadkeeper" };
  const s = {
    ...fresh(),
    bestiary: { roadkeeper: { seen: 2, defeated: 0, moves: ["Heavy strike"] } },
  };
  assert.equal(bestiary.monsterKnowledge(s, foe).element, undefined);
  const next = bestiary.observeMove(
    s,
    "roadkeeper",
    "Heavy strike",
    foe.element,
  );
  assert.equal(bestiary.monsterKnowledge(next, foe).element, foe.element);
  assert.deepEqual(plain(next.bestiary.roadkeeper.moves), ["Heavy strike"]);
  assert.equal(
    bestiary.observeMove(next, "roadkeeper", "Heavy strike", foe.element),
    next,
  );
  assert.equal(
    bestiary.monsterKnowledge(
      { ...s, inventory: { [m.essenceId("roadkeeper")]: 1 } },
      foe,
    ).skill,
    "Shield Bash",
  );
});
test("Battle playback gives complete actions and result text time to read in normal, fast, and reduced motion", () => {
  const event = {
    text: "Kael strikes the Goblin Scout for 24 physical damage.",
  };
  for (const native of [1200, 1950, 2750]) {
    const normal = ui.eventPacing(event, native);
    const fast = ui.eventPacing(event, native, "fast");
    const reduced = ui.eventPacing(event, native, "normal", true);
    assert.ok(normal.animationMs >= native);
    assert.equal(normal.stepMs, Math.round(normal.animationMs + 87.5));
    assert.ok(fast.animationMs >= 900 && fast.stepMs >= 950);
    assert.ok(normal.stepMs > fast.stepMs);
    assert.equal(reduced.animationMs, 200);
    assert.ok(reduced.stepMs >= 1400, "reduced motion must not rush text");
  }
  const short = ui.eventPacing({ text: "Interrupted." });
  const long = ui.eventPacing({
    text: "The guardian calls new reinforcements into the battle. ".repeat(4),
  });
  assert.ok(short.stepMs >= 1400 && long.stepMs > short.stepMs);
});

test("Only the idle interval between actors is quartered; attack, impact, and death animation speeds stay unchanged", () => {
  const event = { text: "Kael strikes for 24 damage." };
  for (const speed of ["normal", "fast"]) {
    const native = 1950;
    const active = 900;
    const timing = ui.eventPacing(event, native, speed, false, active);
    const expectedAnimation = speed === "fast" ? 1365 : 1950;
    const oldStep = expectedAnimation + (speed === "fast" ? 200 : 350);
    const activeMs = (active / native) * expectedAnimation;
    assert.equal(timing.animationMs, expectedAnimation);
    assert.equal(
      timing.stepMs,
      Math.round(activeMs + (oldStep - activeMs) / 4),
    );
    assert.ok(timing.stepMs > activeMs);
  }
  const cue = {
    kind: "attack",
    beats: [{ end: 900 }],
    finishAt: 1950,
    enemyAttacks: false,
    enemyDied: false,
  };
  assert.equal(anim.cueActionEnd(cue), 900);
  assert.equal(
    anim.cueActionEnd({
      ...cue,
      enemyDied: true,
      deathAt: 440,
      finishAt: 2040,
    }),
    1890,
  );
  assert.equal(ui.eventPacing(event, 1950, "normal", false, 900).stepMs, 1250);
});

test("Core pickup amounts match real enemy rewards, appear once per identity, and never mutate game currency", () => {
  const { trial } = require("./engine-loader.cjs");
  const state = r.beginCombat({
    ...trial.trialSave(trial.DEFAULT_TRIAL),
    trial: false,
    combat: null,
  });
  const foe = state.combat.enemies[0];
  const makeEvent = (id, hp, rewardEligible = true) => ({
    id,
    kind: "attack",
    enemies: [{ ...foe, hp, rewardEligible }],
  });
  const playback = {
    before: state,
    events: [
      makeEvent("kill", 0),
      makeEvent("dead", 0),
      makeEvent("revive", 10),
      makeEvent("kill-again", 0),
    ],
  };
  const before = JSON.stringify(playback);
  const drops = ui.defeatedGold(playback, 0);
  assert.equal(drops.length, 1);
  assert.equal(
    drops[0].amount,
    m.enemyCoreYield(foe, state.floor, state.journey.defender),
  );
  assert.equal(drops[0].enemyId, foe.id);
  assert.equal(ui.defeatedGold(playback, 1).length, 0);
  assert.equal(ui.defeatedGold(playback, 3).length, 0);
  assert.equal(ui.defeatedGold(playback, 0, [foe.id]).length, 0);
  assert.equal(
    ui.defeatedGold(
      { ...playback, events: [makeEvent("consumed", 0, false)] },
      0,
    ).length,
    0,
  );
  assert.deepEqual(
    plain(
      ui.defeatedGold({ ...playback, before: { ...state, trial: true } }, 0),
    ),
    plain(drops),
  );
  assert.equal(ui.defeatedGold(undefined, 0).length, 0);
  assert.equal(JSON.stringify(playback), before);
});

test("Real round HP snapshots wait for impact, and new enemy notices identify the actual arriving units once", () => {
  const { trial } = require("./engine-loader.cjs");
  let s = r.beginCombat({
    ...trial.trialSave(trial.DEFAULT_TRIAL),
    trial: false,
    combat: null,
  });
  s.combat.round = 2;
  s.combat.enemies = s.combat.enemies.filter((foe) => foe.species === "goblin");
  s.enemy = s.combat.enemies[0];
  s.combat.intents = undefined;
  s.party = s.party.map((c) => ({ ...c, hp: 10000, maxHp: 10000 }));
  const next = e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions: s.party.map((c) => ({
      actor: c.id,
      kind: "attack",
      target: s.combat.enemies[0].id,
    })),
    animate: true,
  });
  const playback = next.roundPlayback;
  let notices = 0,
    impacts = 0;
  playback.events.forEach((event, cursor) => {
    const before = ui.playbackSnapshot(playback, cursor, false);
    const after = ui.playbackSnapshot(playback, cursor, true);
    const prior = cursor
      ? playback.events[cursor - 1]
      : {
          party: playback.before.party,
          enemies: playback.before.combat.enemies,
        };
    assert.deepEqual(
      plain(before),
      plain({ party: prior.party, enemies: prior.enemies }),
    );
    assert.deepEqual(
      plain(after),
      plain({ party: event.party, enemies: event.enemies }),
    );
    if (
      event.party.some((c, i) => c.hp !== prior.party[i].hp) ||
      event.enemies.some(
        (foe) => foe.hp !== prior.enemies.find((old) => old.id === foe.id)?.hp,
      )
    )
      impacts++;
    const arrivals = ui.arrivingEnemies(playback, cursor);
    if (arrivals.length) {
      notices++;
      assert.equal(event.kind, "summon");
      assert.ok(
        arrivals.every(
          (foe) =>
            foe.id.includes(":summon-") &&
            !prior.enemies.some((old) => old.id === foe.id),
        ),
      );
      assert.ok(
        !playback.events.some((step) =>
          arrivals.some((foe) => foe.id === step.actor),
        ),
        "arrivals do not act before next round",
      );
    }
  });
  assert.ok(impacts > 0);
  assert.equal(notices, 1);
  assert.equal(ui.arrivingEnemies(undefined, 0).length, 0);
  assert.equal(ui.playbackSnapshot(undefined, 0, true), undefined);
});

test("Both sides use sprites twenty percent smaller without shrinking the battlefield or HUD", () => {
  const party = Array.from({ length: 4 }, (_, i) => ({
    ...e.makeCharacter("human", "scaled-" + i, "Member " + i),
    formation: i < 2 ? "front" : "back",
  }));
  const layout = anim.focusedBattleFormation(390, 765, party, 2, 56);
  assert.ok(layout.party.every((p) => Math.abs(p.size - 109.2) < 1e-8));
  assert.ok(layout.enemies.every((p) => Math.abs(p.size - 134.16) < 1e-8));
  assert.equal(anim.healthPanel(layout.party[0]).width, 86);
});

test("Enemy support wind-ups describe protection and healing without calling them attacks", () => {
  const { trial } = require("./engine-loader.cjs");
  const state = r.beginCombat({
    ...trial.trialSave(trial.DEFAULT_TRIAL),
    trial: false,
    combat: null,
  });
  const actor = state.combat.enemies[0];
  const target = { ...actor, id: "ally-goblin", name: "Goblin ally" };
  const event = {
    actor: actor.id,
    target: target.id,
    enemies: [actor, target],
    kind: "guard",
  };
  assert.equal(
    ui.actionLead(event, state),
    `${actor.name} moves to protect ${target.name}.`,
  );
  assert.equal(
    ui.actionLead({ ...event, kind: "heal" }, state),
    `${actor.name} prepares to heal → ${target.name}.`,
  );
});
console.log(`${count} production-polish checks passed.`);
