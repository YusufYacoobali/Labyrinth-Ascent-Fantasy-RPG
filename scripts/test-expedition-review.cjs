const assert = require("node:assert/strict");
const {
  e,
  expeditionReview: review,
  saves,
  skillIds,
} = require("./engine-loader.cjs");
const tick = () => new Promise(setImmediate);
const fresh = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Reviewer",
    seed: 42,
    roll: 1,
  });
const reload = (s) => e.normalizeSave(JSON.parse(skillIds.serializeSave(s)));
function entry(number = 1, last = 0) {
  const base = fresh();
  const before = {
    ...base,
    day: 30,
    food: 40,
    reviewPromptExpedition: last,
    expedition: { ...base.expedition, number: number - 1 },
  };
  return {
    before,
    after: e.reducer(before, { type: "ENTER", mission: "survey" }),
  };
}
function driver(initial, overrides = {}) {
  let state = initial,
    active = true;
  const timers = new Map(),
    calls = { available: 0, requested: 0 };
  let id = 0;
  const prompt = review.createExpeditionReview({
    getState: () => state,
    isActive: () => active,
    isAvailable: async () => {
      calls.available++;
      return true;
    },
    requestReview: async () => {
      calls.requested++;
    },
    schedule: (task, delay) => {
      assert.ok(delay >= 1000);
      const key = ++id;
      timers.set(key, task);
      return () => timers.delete(key);
    },
    ...overrides,
  });
  return {
    prompt,
    calls,
    timers,
    setState: (s) => {
      state = s;
    },
    setActive: (value) => {
      active = value;
    },
    flush: async () => {
      const tasks = [...timers.values()];
      timers.clear();
      tasks.forEach((task) => task());
      await tick();
    },
  };
}
let count = 0;
async function test(name, run) {
  await run();
  count++;
  console.log("PASS " + name);
}
async function main() {
  await test("Native review cadence is expeditions 1, 5, 9, 13 and 17, once per successful entry", () => {
    let last = 0;
    const scheduled = [];
    for (let number = 1; number <= 20; number++) {
      const { before, after } = entry(number, last);
      const requested = review.reviewAfterEntry(before, after);
      if (requested !== null) scheduled.push(requested);
      assert.equal(
        after.reviewPromptExpedition,
        requested === null ? last : number,
      );
      assert.equal(
        review.reviewAfterEntry(
          after,
          e.reducer(after, { type: "ENTER", mission: "survey" }),
        ),
        null,
      );
      assert.equal(
        reload(after).reviewPromptExpedition,
        after.reviewPromptExpedition,
      );
      last = after.reviewPromptExpedition;
    }
    assert.deepEqual(scheduled, [1, 5, 9, 13, 17]);
    for (const invalid of [0, -1, 1.5, NaN, Infinity])
      assert.equal(review.reviewDue(invalid), false);
    assert.equal(review.reviewDue(5, 5), false);
    const { before } = entry();
    const blocked = e.reducer(
      { ...before, day: 29 },
      { type: "ENTER", mission: "survey" },
    );
    assert.equal(blocked.reviewPromptExpedition, 0);
    assert.equal(review.reviewAfterEntry(before, blocked), null);
  });

  await test("Review requests follow the durable entry save and a short delay, with no duplicate calls", async () => {
    const { before, after } = entry();
    let stored = null,
      requested = 0;
    const d = driver(before, {
      requestReview: async () => {
        assert.equal(JSON.parse(stored).reviewPromptExpedition, 1);
        requested++;
      },
    });
    d.prompt.queueEntry(before, after);
    d.setState(after);
    assert.equal(d.timers.size, 0);
    const writer = saves.saveWriter({
      setItem: async (_, value) => {
        stored = value;
      },
    });
    await writer.save(skillIds.serializeSave(after));
    d.prompt.afterSaved();
    d.prompt.afterSaved();
    assert.equal(requested, 0);
    assert.equal(d.timers.size, 1);
    await d.flush();
    assert.equal(requested, 1);
    d.prompt.afterSaved();
    await d.flush();
    assert.equal(requested, 1);
    const reopened = driver(reload(after));
    reopened.prompt.afterSaved();
    await reopened.flush();
    assert.equal(reopened.calls.requested, 0);
  });

  await test("A failed entry save delays the review until its successful save retry", async () => {
    const { before, after } = entry();
    const d = driver(before);
    d.prompt.queueEntry(before, after);
    d.setState(after);
    let fail = true;
    const writer = saves.saveWriter({
      setItem: async () => {
        if (fail) throw Error("storage unavailable");
      },
    });
    await assert.rejects(writer.save(skillIds.serializeSave(after)));
    assert.equal(d.timers.size, 0);
    fail = false;
    await writer.retry();
    d.prompt.afterSaved();
    await d.flush();
    assert.equal(d.calls.requested, 1);
  });

  await test("Trials, combat, moving away from the entry and background apps never open review dialogs", async () => {
    const { before, after } = entry();
    const variants = [
      { ...after, trial: true },
      { ...after, phase: "combat" },
      { ...after, journey: { ...after.journey, room: "aftermath" } },
      { ...after, journey: { ...after.journey, watches: 12 } },
      {
        ...after,
        phase: "town",
        journey: { ...after.journey, startDay: null },
      },
    ];
    for (const next of variants) {
      const d = driver(next);
      d.prompt.queueEntry(before, after);
      d.prompt.afterSaved();
      await d.flush();
      assert.equal(d.calls.requested, 0);
    }
    const background = driver(after);
    background.prompt.queueEntry(before, after);
    background.prompt.afterSaved();
    background.setActive(false);
    await background.flush();
    assert.equal(background.calls.available, 0);
    const opening = driver({ ...after, phase: "exploration" });
    opening.prompt.queueEntry(before, after);
    opening.prompt.afterSaved();
    await opening.flush();
    assert.equal(opening.calls.requested, 1);
  });

  await test("Unavailable stores and rejected native requests remain silent and do not change gameplay", async () => {
    const { before, after } = entry();
    const snapshot = skillIds.serializeSave(after);
    for (const overrides of [
      { isAvailable: async () => false },
      {
        isAvailable: async () => {
          throw Error("native module absent");
        },
      },
      {
        requestReview: async () => {
          throw Error("store request rejected");
        },
      },
    ]) {
      const d = driver(after, overrides);
      d.prompt.queueEntry(before, after);
      d.prompt.afterSaved();
      await d.flush();
      assert.equal(skillIds.serializeSave(after), snapshot);
      assert.equal(d.calls.requested, 0);
      d.prompt.afterSaved();
      assert.equal(d.timers.size, 0);
    }
  });

  await test("Unmounts and late availability results cannot display stale reviews during another scene", async () => {
    const { before, after } = entry();
    let resolve,
      requests = 0;
    const d = driver(after, {
      isAvailable: () =>
        new Promise((done) => {
          resolve = done;
        }),
      requestReview: async () => {
        requests++;
      },
    });
    d.prompt.queueEntry(before, after);
    d.prompt.afterSaved();
    await d.flush();
    d.setState({ ...after, phase: "combat" });
    resolve(true);
    await tick();
    assert.equal(requests, 0);
    const closed = driver(after);
    closed.prompt.queueEntry(before, after);
    closed.prompt.afterSaved();
    closed.prompt.reset();
    await closed.flush();
    assert.equal(closed.calls.requested, 0);
    // React's development cleanup may run before the real mount; the controller remains usable.
    closed.prompt.queueEntry(before, after);
    closed.prompt.afterSaved();
    await closed.flush();
    assert.equal(closed.calls.requested, 1);
  });

  await test("Older saves retain progress and never receive a retroactive mid-expedition review", async () => {
    const { after } = entry(9, 5);
    const legacy = JSON.parse(skillIds.serializeSave(after));
    delete legacy.reviewPromptExpedition;
    const loaded = e.normalizeSave(legacy);
    assert.equal(loaded.expedition.number, 9);
    assert.equal(loaded.reviewPromptExpedition, 0);
    const d = driver(loaded);
    d.prompt.afterSaved();
    await d.flush();
    assert.equal(d.calls.requested, 0);
    assert.equal(
      e.normalizeSave({ ...legacy, reviewPromptExpedition: -2 })
        .reviewPromptExpedition,
      0,
    );
  });
  console.log(`${count} native review checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
