const assert = require("node:assert/strict");
const { planning, trial, rounds, e } = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  count++;
  console.log("PASS " + name);
};
const plain = (value) => JSON.parse(JSON.stringify(value));
function arena() {
  let state = trial.trialSave(trial.DEFAULT_TRIAL);
  state = rounds.beginCombat({ ...state, trial: false, combat: null });
  state.combat.enemies = [0, 1].map((i) => ({
    ...state.combat.enemies[0],
    id: "target-" + i,
    hp: 1000,
    maxHp: 1000,
  }));
  return state;
}
const attack = (state, i, target = "target-1") => ({
  actor: state.party[i].id,
  kind: "attack",
  target,
});

test("Each choice preserves its target without silently assigning other allies; the last completes the plan", () => {
  const state = arena(),
    before = JSON.stringify(state);
  let commands = {};
  state.party.forEach((c, i) => {
    const result = planning.chooseCommand(state, commands, attack(state, i));
    assert.equal(result.issue, "");
    assert.equal(result.actions.length, i + 1);
    assert.equal(result.complete, i === state.party.length - 1);
    assert.ok(result.actions.every((action) => action.target === "target-1"));
    commands = result.commands;
  });
  assert.equal(JSON.stringify(state), before);
});

test("Battlefield selection can choose out of order and replace an earlier action without adding a turn", () => {
  const state = arena();
  const first = planning.chooseCommand(state, {}, attack(state, 2));
  assert.equal(first.nextActor, state.party[0].id);
  const changed = planning.chooseCommand(state, first.commands, {
    actor: state.party[2].id,
    kind: "guard",
    target: state.party[0].id,
  });
  assert.equal(changed.actions.length, 1);
  assert.equal(changed.commands[state.party[2].id].kind, "guard");
  assert.equal(first.commands[state.party[2].id].kind, "attack");
  assert.equal(changed.complete, false);
});

test("Shared Burst momentum and the last item cannot be reserved twice during automatic planning", () => {
  const state = arena();
  state.momentum = 2;
  let first = planning.chooseCommand(
    state,
    {},
    { ...attack(state, 0), kind: "burst" },
  );
  let rejected = planning.chooseCommand(state, first.commands, {
    ...attack(state, 1),
    kind: "burst",
  });
  assert.match(rejected.issue, /momentum/);
  assert.equal(rejected.complete, false);
  assert.strictEqual(rejected.commands, first.commands);
  state.potions = 1;
  first = planning.chooseCommand(
    state,
    {},
    {
      actor: state.party[0].id,
      kind: "item",
      item: "potion",
      target: state.party[0].id,
    },
  );
  rejected = planning.chooseCommand(state, first.commands, {
    actor: state.party[1].id,
    kind: "item",
    item: "potion",
    target: state.party[1].id,
  });
  assert.match(rejected.issue, /supplies/);
  assert.strictEqual(rejected.commands, first.commands);
});

test("Fallen and frozen companions do not stall completion or receive hidden commands", () => {
  const state = arena();
  state.party[1].ailments.conditions = {
    frozen: { stacks: 1, turns: 1, applied: 0 },
  };
  state.party[2].hp = 0;
  const first = planning.chooseCommand(state, {}, attack(state, 0));
  assert.equal(first.nextActor, state.party[3].id);
  assert.equal(
    planning.chooseCommand(state, first.commands, attack(state, 1)).complete,
    false,
  );
  const last = planning.chooseCommand(state, first.commands, attack(state, 3));
  assert.equal(last.complete, true);
  assert.equal(last.actions.length, 2);
  assert.equal(
    rounds.validateQueue(state, {
      type: "ROUND",
      battleId: state.combat.id,
      round: state.combat.round,
      actions: last.actions,
    }),
    "",
  );
});

test("A dead target or unavailable skill is rejected before the last choice can launch combat", () => {
  const state = arena();
  state.combat.enemies[1].hp = 0;
  const rejected = planning.chooseCommand(state, {}, attack(state, 0));
  assert.match(rejected.issue, /living enemy/);
  assert.equal(Object.keys(rejected.commands).length, 0);
  state.party[0].mp = 0;
  const skill = planning.chooseCommand(
    state,
    {},
    {
      actor: state.party[0].id,
      kind: "skill",
      skill: "Twin Strike",
      target: "target-0",
    },
  );
  assert.match(skill.issue, /unavailable/);
  assert.equal(skill.complete, false);
});

test("An automatically completed plan resolves once and remains protected against a second tap", () => {
  let state = arena(),
    result;
  let commands = {};
  for (let i = 0; i < state.party.length; i++) {
    result = planning.chooseCommand(state, commands, attack(state, i));
    commands = result.commands;
  }
  const request = {
    type: "ROUND",
    battleId: state.combat.id,
    round: state.combat.round,
    actions: plain(result.actions),
    animate: true,
  };
  const resolved = e.reducer(state, request);
  assert.ok(resolved.roundPlayback);
  assert.strictEqual(e.reducer(resolved, request), resolved);
  const finished = e.reducer(resolved, { type: "FINISH_PLAYBACK" });
  const stale = e.reducer(finished, request);
  assert.deepEqual(plain(stale.party), plain(finished.party));
  assert.deepEqual(plain(stale.combat.enemies), plain(finished.combat.enemies));
});
console.log(`${count} automatic combat-planning checks passed.`);
