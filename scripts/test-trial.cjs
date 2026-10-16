const assert = require("node:assert/strict");
const { e, trial, rounds, presentation } = require("./engine-loader.cjs");
let count = 0;
const plain = (value) => JSON.parse(JSON.stringify(value));
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function request(state, kind = "guard") {
  return {
    type: "ROUND",
    battleId: state.combat.id,
    round: state.combat.round,
    animate: true,
    actions: state.party.map((member) => ({
      actor: member.id,
      kind,
      target: kind === "guard" ? member.id : state.combat.enemies[0].id,
    })),
  };
}

test("Every practice preset starts the campaign round engine with its real encounter and map", () => {
  for (const enemy of trial.TRIAL_ENEMIES) {
    const state = trial.trialSave({ ...trial.DEFAULT_TRIAL, enemy: enemy.id });
    assert.equal(state.trial, true);
    assert.equal(state.phase, "combat");
    assert.equal(state.combat.rules, 2);
    assert.equal(state.combat.round, 1);
    assert.ok(
      state.combat.enemies.length >= 1 && state.combat.enemies.length <= 3,
    );
    assert.ok(
      state.combat.enemies.every((foe) => state.combat.intents[foe.id]),
    );
    assert.ok(
      Object.values(state.journey.maps).some(
        (map) => map.nodes[state.journey.room],
      ),
    );
    assert.ok(
      state.party.every(
        (member) => member.hp === member.maxHp && member.mp === member.maxMp,
      ),
    );
    assert.equal(
      state.combat.defender,
      !["plunderer", "bonegnaw"].includes(enemy.id),
    );
  }
});

test("Practice and campaign execute identical actions, initiative, HP changes, and playback events", () => {
  const state = trial.trialSave(trial.DEFAULT_TRIAL);
  const action = request(state);
  const practice = e.reducer(state, action);
  const campaign = e.reducer({ ...state, trial: false }, action);
  assert.deepEqual(
    plain(practice.roundPlayback.events),
    plain(campaign.roundPlayback.events),
  );
  assert.deepEqual(plain(practice.party), plain(campaign.party));
  assert.deepEqual(plain(practice.combat), plain(campaign.combat));
  assert.equal(practice.phase, campaign.phase);
});

test("Practice cores use the same per-enemy pickups and victory receipt without accepting a round twice", () => {
  const state = trial.trialSave(trial.DEFAULT_TRIAL);
  state.combat.enemies = state.combat.enemies.map((foe) => ({ ...foe, hp: 1 }));
  state.enemy = state.combat.enemies[0];
  const action = request(state, "attack");
  const next = e.reducer(state, action);
  assert.equal(next.combat.complete, true);
  const drops = next.roundPlayback.events.flatMap((_, cursor) =>
    presentation.defeatedGold(next.roundPlayback, cursor),
  );
  assert.equal(drops.length, state.combat.enemies.length);
  assert.equal(
    drops.reduce((total, drop) => total + drop.amount, 0),
    next.lootReceipt.items["beast-core"],
  );
  const finished = e.reducer(next, { type: "FINISH_PLAYBACK" });
  const stale = e.reducer(finished, action);
  assert.equal(stale.gold, finished.gold);
  assert.equal(stale.kills, finished.kills);
});

test("The retired BATTLE controller cannot run a separate practice combat version", () => {
  const state = trial.trialSave(trial.DEFAULT_TRIAL);
  const next = e.reducer(state, {
    type: "BATTLE",
    kind: "attack",
    actor: state.party[0].id,
    roll: 0.5,
    animate: true,
  });
  assert.equal(next.effects.id, state.effects.id);
  assert.equal(next.combat.round, state.combat.round);
  assert.equal(next.playback, null);
  assert.equal(next.roundPlayback, null);
});
test("Practice retreat uses a real connected passage on every selected floor", () => {
  for (const enemy of trial.TRIAL_ENEMIES) {
    const state = trial.trialSave({ ...trial.DEFAULT_TRIAL, enemy: enemy.id });
    const next = e.reducer(state, {
      ...request(state),
      flee: true,
      actions: [],
    });
    assert.ok(next.roundPlayback.events.length > 0);
    assert.notEqual(next.phase, "combat");
    assert.notEqual(next.phase, "defeat");
    assert.notEqual(next.journey.room, state.journey.room);
    assert.equal(next.combat, null);
  }
});
console.log(count + " unified-combat checks passed.");
