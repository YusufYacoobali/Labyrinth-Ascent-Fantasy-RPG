const assert = require("node:assert/strict"),
  fs = require("node:fs");
const {
  e,
  monsters: m,
  speciesArt: a,
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
test("Thirty previously shared species own distinct transparent pixel silhouettes and cached vector portraits", () => {
  assert.equal(Object.keys(a.SPECIES_ART).length, 30);
  assert.equal(
    new Set(
      Object.values(a.SPECIES_ART).map((a) =>
        a.pixels.map((c) => (c ? 1 : 0)).join(""),
      ),
    ).size,
    30,
  );
  for (const [id, art] of Object.entries(a.SPECIES_ART)) {
    assert.ok(m.MONSTERS.some((m) => m.id === id));
    assert.equal(art.pixels.length, 40 * 48);
    assert.ok(art.pixels.filter(Boolean).length > 100);
    assert.ok(art.pixels.some((p) => !p));
    assert.ok(art.paths.length <= 10);
    assert.ok(art.paths.every((p) => !p.path.includes("NaN")));
    assert.ok(decodeURIComponent(art.uri).includes("<svg"));
    const s = { ...fresh(), enemy: { ...e.enemyFor(1), species: id } };
    assert.equal(v.enemyVisual(s).style, art.profile.style, id);
    assert.equal(v.enemyVisual(s).color, art.profile.accent, id);
  }
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
console.log(`${count} production-polish checks passed.`);
