const assert = require("node:assert/strict");
const { dailyReminders: reminders } = require("./engine-loader.cjs");

function device({ granted = false, android = true } = {}) {
  let permission = { granted, canAskAgain: true },
    answer = { granted: true, canAskAgain: true },
    failAt = 0;
  const stored = new Map(),
    scheduled = new Map(),
    calls = [];
  const storage = {
    getItem: async (key) => stored.get(key) ?? null,
    setItem: async (key, value) => stored.set(key, value),
  };
  const api = {
    SchedulableTriggerInputTypes: { WEEKLY: "weekly" },
    AndroidImportance: { DEFAULT: 3 },
    IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 },
    getPermissionsAsync: async () => ({ ...permission }),
    requestPermissionsAsync: async () => {
      calls.push("permission");
      permission = { ...answer };
      return permission;
    },
    setNotificationChannelAsync: async () => calls.push("channel"),
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    cancelScheduledNotificationAsync: async (id) => {
      calls.push(`cancel:${id}`);
      scheduled.delete(id);
    },
    scheduleNotificationAsync: async (request) => {
      if (failAt && scheduled.size === failAt) {
        failAt = 0;
        throw Error("Device scheduler busy");
      }
      calls.push(`schedule:${request.identifier}`);
      assert.ok(!scheduled.has(request.identifier), "no duplicate scheduling");
      scheduled.set(request.identifier, request);
      return request.identifier;
    },
  };
  const controller = () =>
    reminders.createDailyReminders({
      storage,
      loadNative: async () => api,
      android,
    });
  return {
    api,
    storage,
    stored,
    scheduled,
    calls,
    controller,
    permission: (value) => (permission = value),
    answer: (value) => (answer = value),
    failAfter: (count) => (failAt = count),
  };
}

let checks = 0;
async function check(name, task) {
  await task();
  checks++;
  console.log(`PASS ${name}`);
}

(async () => {
  await check("one rotating local reminder per weekday at 6 pm", async () => {
    const d = device(),
      requests = reminders.reminderRequests(d.api);
    assert.equal(requests.length, 7);
    assert.equal(new Set(requests.map((n) => n.identifier)).size, 7);
    assert.equal(new Set(requests.map((n) => n.content.body)).size, 7);
    assert.deepEqual(
      Array.from(requests, (n) => n.trigger.weekday),
      [1, 2, 3, 4, 5, 6, 7],
    );
    for (const request of requests) {
      assert.equal(request.trigger.type, "weekly");
      assert.equal(request.trigger.hour, 18);
      assert.equal(request.trigger.minute, 0);
      assert.equal(request.trigger.channelId, reminders.REMINDER_CHANNEL);
      assert.ok(request.content.body.length < 150);
    }
  });
  await check(
    "loading an expedition never opens the permission prompt",
    async () => {
      const d = device();
      assert.equal(await d.controller().sync(), "blocked");
      assert.equal(d.calls.includes("permission"), false);
      assert.equal(d.scheduled.size, 0);
    },
  );
  await check(
    "permission follows Android channel creation and prompts once",
    async () => {
      const d = device(),
        controller = d.controller();
      assert.equal(await controller.sync(true), "on");
      assert.deepEqual(d.calls.slice(0, 2), ["channel", "permission"]);
      assert.equal(d.stored.get(reminders.REMINDER_KEY), "on");
      await controller.sync(true);
      await d.controller().sync(true);
      assert.equal(d.scheduled.size, 7);
      assert.equal(d.calls.filter((s) => s === "permission").length, 1);
      assert.equal(d.calls.filter((s) => s.startsWith("schedule:")).length, 7);
    },
  );
  await check("denial is respected across app restarts", async () => {
    const d = device();
    d.answer({ granted: false, canAskAgain: true });
    assert.equal(await d.controller().sync(true), "blocked");
    assert.equal(await d.controller().sync(true), "blocked");
    assert.equal(d.calls.filter((s) => s === "permission").length, 1);
    assert.equal(d.scheduled.size, 0);
    d.answer({ granted: true, canAskAgain: true });
    assert.equal(await d.controller().setEnabled(true), "on");
    assert.equal(d.scheduled.size, 7);
  });
  await check(
    "turning off cancels reminders and preserves unrelated alerts",
    async () => {
      const d = device({ granted: true });
      d.scheduled.set("other-alert", { identifier: "other-alert" });
      await d.controller().sync(true);
      assert.equal(await d.controller().setEnabled(false), "off");
      assert.deepEqual([...d.scheduled.keys()], ["other-alert"]);
      assert.equal(await d.controller().sync(true), "off");
      assert.equal(d.calls.includes("permission"), false);
      assert.equal(await d.controller().setEnabled(true), "on");
      assert.equal(d.scheduled.size, 8);
    },
  );
  await check(
    "OS permission revocation cancels alerts and re-enabling repairs them",
    async () => {
      const d = device({ granted: true });
      await d.controller().sync(true);
      d.permission({ granted: false, canAskAgain: false });
      assert.equal(await d.controller().sync(true), "blocked");
      assert.equal(d.scheduled.size, 0);
      assert.equal(d.calls.includes("permission"), false);
      d.permission({ granted: true, canAskAgain: false });
      assert.equal(await d.controller().sync(), "on");
      assert.equal(d.scheduled.size, 7);
    },
  );
  await check(
    "provisional and ephemeral iOS permission can schedule quietly",
    async () => {
      for (const status of [3, 4]) {
        const d = device({ android: false });
        d.permission({ granted: false, canAskAgain: false, ios: { status } });
        assert.equal(await d.controller().sync(true), "on");
        assert.equal(d.scheduled.size, 7);
        assert.equal(d.calls.includes("permission"), false);
        assert.equal(d.calls.includes("channel"), false);
      }
    },
  );
  await check(
    "concurrent resume and opt-out leave no reminders behind",
    async () => {
      const d = device(),
        controller = d.controller();
      await Promise.all([controller.sync(true), controller.setEnabled(false)]);
      assert.equal(d.scheduled.size, 0);
      assert.equal(d.stored.get(reminders.REMINDER_KEY), "off");
    },
  );
  await check(
    "a partial scheduling failure recovers without duplicates",
    async () => {
      const d = device({ granted: true }),
        controller = d.controller();
      d.failAfter(3);
      await assert.rejects(controller.sync(true), /scheduler busy/);
      assert.equal(d.scheduled.size, 3);
      assert.equal(await controller.sync(), "on");
      assert.equal(d.scheduled.size, 7);
      assert.equal(d.calls.filter((s) => s.startsWith("schedule:")).length, 7);
    },
  );
  await check(
    "outdated owned reminders are replaced without touching other alerts",
    async () => {
      const d = device({ granted: true });
      d.scheduled.set(`${reminders.REMINDER_PREFIX}old`, {
        identifier: `${reminders.REMINDER_PREFIX}old`,
        content: { data: {} },
      });
      const old = reminders.reminderRequests(d.api)[0];
      old.content.data.revision = 0;
      d.scheduled.set(old.identifier, old);
      d.scheduled.set("other-alert", { identifier: "other-alert" });
      await d.controller().sync(true);
      assert.equal(d.scheduled.size, 8);
      assert.ok(d.scheduled.has("other-alert"));
      assert.equal(d.scheduled.has(`${reminders.REMINDER_PREFIX}old`), false);
      assert.equal(d.scheduled.get(old.identifier).content.data.revision, 1);
    },
  );
  await check("missing native support is harmless", async () => {
    const d = device();
    const controller = reminders.createDailyReminders({
      storage: d.storage,
      loadNative: async () => null,
      android: false,
    });
    assert.equal(await controller.sync(true), "unavailable");
    assert.equal(d.scheduled.size, 0);
  });
  await check(
    "failed opt-out cancellation can retry without re-enabling",
    async () => {
      const d = device({ granted: true }),
        controller = d.controller();
      await controller.sync(true);
      const cancel = d.api.cancelScheduledNotificationAsync;
      d.api.cancelScheduledNotificationAsync = async () => {
        throw Error("Scheduler busy");
      };
      await assert.rejects(controller.setEnabled(false), /Scheduler busy/);
      assert.equal(d.stored.get(reminders.REMINDER_KEY), "off");
      d.api.cancelScheduledNotificationAsync = cancel;
      assert.equal(await controller.setEnabled(false), "off");
      assert.equal(d.scheduled.size, 0);
    },
  );
  await check("storage failure never opens a permission dialog", async () => {
    const d = device();
    const controller = reminders.createDailyReminders({
      storage: {
        ...d.storage,
        setItem: async () => {
          throw Error("Storage unavailable");
        },
      },
      loadNative: async () => d.api,
      android: false,
    });
    await assert.rejects(controller.sync(true), /Storage unavailable/);
    assert.equal(d.calls.includes("permission"), false);
  });
  await check("foreground play is never interrupted by reminders", async () => {
    for (const value of Object.values(reminders.reminderForegroundBehavior))
      assert.equal(value, false);
  });
  console.log(`${checks} daily reminder checks passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
