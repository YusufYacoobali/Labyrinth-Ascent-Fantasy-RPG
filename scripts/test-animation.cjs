const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  animation: a,
  e,
  visuals: v,
  trial,
  w,
} = require("./engine-loader.cjs");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const cue = {
  id: 1,
  actor: "hero",
  kind: "attack",
  enemyAttacks: true,
  heavy: false,
  enemyDied: false,
  enemyHit: true,
  targets: ["hero"],
  fallen: [],
};
test("All sprite rows and frames remain in bounds throughout a complete turn", () => {
  for (const kind of ["attack", "skill", "guard", "item", "focus", "burst"]) {
    for (const enemy of [true, false])
      for (let t = 0; t <= 2400; t += 10) {
        const p = a.combatPose(t, t, { ...cue, kind }, "hero", enemy, false);
        assert.ok(p.row >= 0 && p.row <= 5);
        assert.ok(p.frame >= 0 && p.frame <= 7);
        assert.ok(p.opacity >= 0 && p.opacity <= 1);
        assert.ok(p.advance >= 0 && p.advance <= 1);
      }
  }
});
test("Selected attacker runs, swings, recoils and returns in chronological order", () => {
  assert.equal(a.combatPose(100, 0, cue, "hero", false, false).row, 1);
  assert.equal(a.combatPose(450, 0, cue, "hero", false, false).row, 2);
  assert.equal(a.combatPose(900, 0, cue, "hero", false, false).row, 1);
  assert.equal(a.combatPose(1200, 0, cue, "hero", false, false).advance, 0);
  assert.equal(a.combatPose(1500, 0, cue, "hero", false, false).row, 3);
});
test("Enemy death suppresses its response and holds the final frame before victory", () => {
  const killed = { ...cue, enemyDied: true, enemyAttacks: false };
  assert.equal(a.combatPose(700, 0, killed, "enemy", true, false).row, 4);
  assert.equal(a.combatPose(1600, 0, killed, "enemy", true, false).frame, 7);
  assert.equal(a.cueDuration(killed), 2200);
  assert.equal(a.combatPose(2100, 0, killed, "enemy", true, false).opacity, 0);
});
test("Reduced motion is still and short; fallen allies cannot return to idle", () => {
  const fallen = { ...cue, fallen: ["hero"] };
  const still = a.combatPose(1000, 1000, cue, "hero", false, true);
  assert.equal(still.advance, 0);
  assert.equal(still.recoil, 0);
  assert.equal(still.frame, 0);
  assert.equal(a.cueDuration(cue, true), 280);
  assert.equal(a.combatPose(1900, 0, fallen, "hero", false, false).row, 4);
});
test("Animation cue uses actual resolver damage, targets and selected actor", () => {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    seed: 42,
    race: "barbarian",
    name: "Test",
    roll: 0.5,
  });
  s = e.reducer({ ...s, day: 30 }, { type: "ENTER" });
  s = e.reducer(s, { type: "MISSION", id: "survey" });
  s = e.reducer(s, { type: "APPROACH", choice: "sneak", roll: 0.99 });
  s = e.reducer(s, { type: "ENGAGE" });
  const action = { type: "BATTLE", kind: "attack", actor: "hero", roll: 0.5 };
  const next = e.reducer(s, action),
    c = a.battleCue(s, next, action);
  assert.equal(c.actor, "hero");
  assert.equal(
    c.enemyHit,
    next.effects.damage > 0 || next.effects.poisonDamage > 0,
  );
  assert.equal(
    JSON.stringify(c.targets),
    JSON.stringify(Object.keys(next.effects.targets)),
  );
  assert.equal(c.enemyDied, next.enemy.hp === 0);
});
test("Formation keeps four readable character hit areas within phone-sized scenes", () => {
  for (const width of [280, 320, 390, 460]) {
    const points = a.formation(width, 260, 4);
    assert.equal(points.length, 4);
    points.forEach((p) => {
      assert.ok(p.x - p.size / 2 >= 0);
      assert.ok(p.x + p.size / 2 <= width);
      assert.ok(p.y - p.size * 0.96 >= 0);
      assert.ok(p.y < 260);
    });
  }
});
test("Every origin, mage variation, recruit, floor foe and side foe resolves to a real alpha animation sheet", () => {
  const keys = new Set();
  for (const preset of trial.TRIAL_CHARACTERS) {
    const c = e.makeCharacter(
      preset.race,
      preset.character,
      preset.name,
      preset.roll,
    );
    const visual = v.characterVisual(c);
    assert.ok(visual.key);
    keys.add(visual.key);
  }
  for (const enemy of trial.TRIAL_ENEMIES)
    keys.add(
      v.enemyVisual(
        trial.trialSave({ ...trial.DEFAULT_TRIAL, enemy: enemy.id }),
      ).key,
    );
  assert.equal(keys.size, 25);
  for (const key of keys) {
    const data = fs.readFileSync("assets/combat/" + key + "-motion.png");
    assert.equal(
      data.readUInt32BE(16) / 8,
      data.readUInt32BE(20) / 6,
      key + " square sprite cells",
    );
    assert.equal(data[25], 6, key + " RGBA alpha channel");
  }
});
test("Floor enemy identity stays distinct even when the old sprite indices or route indices overlap", () => {
  assert.equal(new Set(v.FLOOR_VISUALS.map((x) => x.key)).size, 12);
  for (const floor of w.FLOORS) {
    for (const route of [null, "roots", "frost", "forge", "crypt"]) {
      const s = {
        ...e.initialGame(),
        floor: floor.id,
        enemy: e.enemyFor(floor.id, route, 4),
      };
      assert.equal(
        v.enemyVisual(s).key,
        require("./engine-loader.cjs").monsters.MONSTERS.find(
          (m) => m.id === s.enemy.species,
        ).visual,
      );
    }
  }
  assert.equal(v.mirrorEnemy("roadkeeper"), true);
  assert.equal(v.mirrorEnemy("revenant"), true);
  assert.equal(v.mirrorEnemy("frostfang"), false);
});
test("Ranged and healing actors stay in formation and enemy spells or slams do not dash through the party", () => {
  for (const actorStyle of ["arrow", "magic", "heal"]) {
    for (let t = 0; t < 1100; t += 20) {
      assert.equal(
        a.combatPose(t, t, { ...cue, actorStyle }, "hero", false, false)
          .advance,
        0,
      );
    }
    assert.equal(a.cueContact({ ...cue, actorStyle }), 700);
    assert.equal(a.cueContact({ ...cue, actorStyle }, true), 0);
  }
  for (const enemyStyle of ["magic", "slam"])
    for (let t = 1110; t < 1740; t += 20)
      assert.equal(
        a.combatPose(t, t, { ...cue, enemyStyle }, "enemy", true, false)
          .advance,
        0,
      );
});
test("Arrow impact and death begin after the projectile arrives, not at melee contact", () => {
  const arrow = {
    ...cue,
    actorStyle: "arrow",
    enemyDied: true,
    enemyAttacks: false,
  };
  assert.equal(a.combatPose(550, 0, arrow, "enemy", true, false).row, 0);
  assert.equal(a.combatPose(720, 0, arrow, "enemy", true, false).row, 3);
  assert.equal(a.combatPose(850, 0, arrow, "enemy", true, false).row, 4);
  assert.equal(a.combatPose(1850, 0, arrow, "enemy", true, false).frame, 7);
});
test("All four overhead health panels fit above their sprites without overlapping one another", () => {
  for (const width of [280, 320, 390, 460])
    for (const height of [240, 280, 340, 450]) {
      const points = a.formation(width, height, 4);
      const panels = points.map(a.healthPanel);
      for (const p of panels) {
        assert.ok(p.x >= 0 && p.y >= 0);
        assert.ok(p.x + p.width <= width && p.y + p.height <= height);
        for (const figure of points) {
          assert.ok(
            p.x + p.width <= figure.x - figure.size / 2 ||
              figure.x + figure.size / 2 <= p.x ||
              p.y + p.height <= figure.y - figure.size * 0.96 ||
              figure.y + figure.size * 0.04 <= p.y,
            "An overhead panel must not cover another member's sprite",
          );
        }
      }
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) {
          const x = panels[i],
            y = panels[j];
          assert.ok(
            x.x + x.width <= y.x ||
              y.x + y.width <= x.x ||
              x.y + x.height <= y.y ||
              y.y + y.height <= x.y,
          );
        }
    }
});
test("Overhead HP waits for healing contact and enemy response, including a real Second Wind turn", () => {
  const before = trial.trialSave(trial.DEFAULT_TRIAL);
  before.party = before.party.map((c) => ({ ...c, hp: c.maxHp - 60 }));
  const actor = before.party.find((c) => c.name === "Elowen");
  const action = {
    type: "BATTLE",
    kind: "skill",
    actor: actor.id,
    skill: "Second Wind",
    roll: 0.8,
  };
  const after = e.reducer(before, action),
    c = a.battleCue(before, after, action);
  const prepare = a.battlePartyAt(before, after, c, false, false);
  const healing = a.battlePartyAt(before, after, c, true, false);
  assert.equal(prepare[0].hp, before.party[0].hp);
  assert.equal(
    healing[0].hp,
    Math.min(
      before.party[0].maxHp,
      before.party[0].hp + Math.round(before.party[0].maxHp * 0.22),
    ),
  );
  assert.equal(
    JSON.stringify(a.battlePartyAt(before, after, c, true, true)),
    JSON.stringify(after.party),
  );
});
test("Trial selection supports the entire roster with unique member IDs and fresh full health", () => {
  for (const enemy of trial.TRIAL_ENEMIES) {
    for (let i = 0; i < trial.TRIAL_CHARACTERS.length; i += 4) {
      const party = trial.TRIAL_CHARACTERS.slice(i, i + 4).map((c) => c.id);
      const s = trial.trialSave({ party, enemy: enemy.id });
      assert.equal(s.phase, "combat");
      assert.equal(new Set(s.party.map((c) => c.id)).size, party.length);
      assert.ok(s.party.every((c) => c.hp === c.maxHp && c.mp === c.maxMp));
      assert.equal(s.walkthrough.active, false);
      assert.equal(
        s.enemy.maxHp,
        e.enemyFor(s.floor, null, party.length).maxHp,
      );
    }
  }
});
test("Fallen or paralysed supports do not join the attack and reduced motion preserves deaths", () => {
  const stopped = {
    ...cue,
    targets: [],
    participants: ["hero"],
    styles: { ally: "magic" },
  };
  assert.equal(a.combatPose(400, 0, stopped, "ally", false, false).row, 0);
  const fallen = { ...cue, fallen: ["hero"] };
  assert.equal(a.combatPose(200, 0, fallen, "hero", false, true).row, 4);
  assert.equal(a.combatPose(200, 0, fallen, "hero", false, true).frame, 7);
});
function sequenceTurn(kind = "attack", skill, options = {}) {
  const before = trial.trialSave({ ...trial.DEFAULT_TRIAL, enemy: "2" });
  before.enemy = { ...before.enemy, hp: 10000, maxHp: 10000 };
  before.momentum = 3;
  Object.assign(before, options);
  const action = {
    type: "BATTLE",
    kind,
    skill,
    actor: before.party[3].id,
    roll: 0.8,
  };
  const after = e.reducer(before, action);
  return { before, after, cue: a.battleCue(before, after, action) };
}
test("Selected member leads a strictly serial exchange and the enemy waits for every return", () => {
  const { before, after, cue } = sequenceTurn();
  assert.equal(cue.beats[0].actor, before.party[3].id);
  assert.equal(cue.beats.length, 4);
  assert.equal(
    cue.beats.reduce((n, b) => n + b.damage, 0),
    after.effects.damage,
  );
  for (let t = 0; t < a.cueDuration(cue); t += 10) {
    const acting = before.party.filter((c) => {
      const p = a.combatPose(t, 0, cue, c.id, false, false);
      return [1, 2, 5].includes(p.row);
    });
    assert.ok(acting.length <= 1, "Only one party member may move or attack");
    const foe = a.combatPose(t, 0, cue, "enemy", true, false);
    if ([2, 5].includes(foe.row)) assert.equal(acting.length, 0);
  }
  for (let i = 1; i < cue.beats.length; i++)
    assert.ok(cue.beats[i].start > cue.beats[i - 1].end);
  assert.ok(a.cueResponse(cue) - 330 > cue.beats.at(-1).end);
});
test("HP and enemy recoil advance individually at each character's exact contact", () => {
  const { before, after, cue } = sequenceTurn();
  let hp = before.enemy.hp;
  for (const beat of cue.beats) {
    assert.equal(a.battleEnemyAt(before, after, cue, beat.contact - 1).hp, hp);
    hp -= beat.damage;
    assert.equal(a.battleEnemyAt(before, after, cue, beat.contact).hp, hp);
    assert.equal(
      a.combatPose(beat.contact + 20, 0, cue, "enemy", true, false).row,
      3,
    );
  }
  assert.equal(hp, after.enemy.hp);
});
test("Killing blow cancels remaining visual attacks, then completes the death before victory", () => {
  const { before } = sequenceTurn();
  before.enemy.hp = 1;
  const action = {
    type: "BATTLE",
    kind: "attack",
    actor: before.party[3].id,
    roll: 0.8,
  };
  const after = e.reducer(before, action),
    cue = a.battleCue(before, after, action);
  assert.equal(cue.beats.length, 1);
  assert.equal(cue.enemyAttacks, false);
  assert.equal(cue.deathAt, cue.beats[0].contact);
  assert.equal(a.battleEnemyAt(before, after, cue, cue.deathAt - 1).hp, 1);
  assert.equal(a.battleEnemyAt(before, after, cue, cue.deathAt).hp, 0);
  assert.equal(
    a.combatPose(cue.deathAt + 1100, 0, cue, "enemy", true, false).frame,
    7,
  );
  assert.ok(a.cueDuration(cue) > cue.deathAt + 1450);
});
test("Focus, guard and items do not invent attacks; dead and paralysed allies stay idle", () => {
  for (const kind of ["guard", "item", "focus", "burst"]) {
    const { before, after, cue } = sequenceTurn(kind);
    assert.equal(
      cue.beats.reduce((n, b) => n + b.damage, 0),
      after.effects.damage,
    );
    if (kind === "guard" || kind === "item") assert.equal(cue.beats.length, 1);
    if (kind === "focus") assert.equal(cue.beats[0].damage, 0);
    assert.equal(cue.beats[0].actor, before.party[3].id);
  }
  const { before } = sequenceTurn();
  before.party[0].hp = 0;
  before.party[1].ailments.paralysis = 1;
  const action = {
    type: "BATTLE",
    kind: "attack",
    actor: before.party[1].id,
    roll: 0.8,
  };
  const after = e.reducer(before, action),
    cue = a.battleCue(before, after, action);
  assert.equal(cue.beats.length, 2);
  assert.ok(
    cue.beats.every(
      (b) => ![before.party[0].id, before.party[1].id].includes(b.actor),
    ),
  );
  assert.equal(
    cue.beats.reduce((n, b) => n + b.damage, 0),
    after.effects.damage,
  );
});
test("Healing precedes support strikes and poison ticks after the final strike", () => {
  const { before } = sequenceTurn();
  before.party = before.party.map((c) => ({ ...c, hp: c.maxHp - 60 }));
  before.enemy.poison = 2;
  const action = {
    type: "BATTLE",
    kind: "skill",
    skill: "Second Wind",
    actor: before.party[2].id,
    roll: 0.8,
  };
  const after = e.reducer(before, action),
    cue = a.battleCue(before, after, action);
  assert.equal(cue.beats[0].style, "heal");
  assert.equal(cue.beats[0].damage, 0);
  assert.ok(cue.poisonAt > cue.beats.at(-1).end);
  assert.equal(
    a.battleEnemyAt(before, after, cue, cue.poisonAt - 1).hp -
      a.battleEnemyAt(before, after, cue, cue.poisonAt).hp,
    after.effects.poisonDamage,
  );
  assert.equal(
    a.battleEnemyAt(before, after, cue, a.cueDuration(cue)).hp,
    after.enemy.hp,
  );
  assert.equal(
    a.battlePartyAt(before, after, cue, true, false)[0].hp,
    before.party[0].hp + cue.healing[before.party[0].id],
  );
});
test("Every roster and enemy pairing supports bounded, serial ranged/melee timelines", () => {
  for (const enemy of trial.TRIAL_ENEMIES)
    for (let i = 0; i < trial.TRIAL_CHARACTERS.length; i += 4) {
      const before = trial.trialSave({
        enemy: enemy.id,
        party: trial.TRIAL_CHARACTERS.slice(i, i + 4).map((c) => c.id),
      });
      before.enemy.hp = before.enemy.maxHp = 10000;
      const action = {
        type: "BATTLE",
        kind: "attack",
        actor: before.party.at(-1).id,
        roll: 0.8,
      };
      const after = e.reducer(before, action),
        cue = a.battleCue(before, after, action);
      assert.equal(
        cue.beats.reduce((n, b) => n + b.damage, 0),
        after.effects.damage,
      );
      for (const beat of cue.beats) {
        const p = a.combatPose(beat.contact, 0, cue, beat.actor, false, false);
        assert.equal(p.row, 2);
        if (beat.style !== "melee") assert.equal(p.advance, 0);
        assert.ok(p.frame >= 0 && p.frame < 8);
      }
      assert.equal(a.cueDuration(cue, true), 280);
      assert.equal(a.cueResponse(cue, true), 0);
    }
});
console.log(count + " animation timeline checks passed.");
