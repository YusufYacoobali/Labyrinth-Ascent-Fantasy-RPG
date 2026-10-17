import type * as Notifications from "expo-notifications";

export const REMINDER_KEY = "labyrinth.daily-reminders.v1";
export const REMINDER_PREFIX = "labyrinth-daily-";
export const REMINDER_CHANNEL = "daily-adventure";
export const REMINDER_HOUR = 18;
const REVISION = 1;

// One weekly trigger for each weekday keeps the copy rotating even if the app
// stays closed. These are local reminders; they never need a server or push token.
export const DAILY_MESSAGES = [
  {
    title: "The Labyrinth is calling",
    body: "A few rations, a sharpened blade, and a little courage. Ready for another climb?",
  },
  {
    title: "Make your next move",
    body: "Return to Stormhold, ready your party, and see how far you can climb.",
  },
  {
    title: "Floor 12 is waiting",
    body: "The summit is still out there. Gather your supplies and take another step toward it.",
  },
  {
    title: "Treasure won't find itself",
    body: "Check your pack and follow the next passage. There could be something worth carrying home.",
  },
  {
    title: "Back to the climb",
    body: "Take a breath, gather your supplies, and give the Labyrinth another try.",
  },
  {
    title: "Your story isn't finished",
    body: "There are companions to meet and higher floors to reach. Pick up where you left off.",
  },
  {
    title: "One floor higher",
    body: "Whether you return for treasure or the summit, the next expedition starts with one step.",
  },
] as const;

export type ReminderStatus = "on" | "off" | "blocked" | "unavailable";
type Native = typeof Notifications;
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
const owned = (request: { identifier: string }) =>
  request.identifier.startsWith(REMINDER_PREFIX);

export function reminderRequests(
  api: Native,
): Notifications.NotificationRequestInput[] {
  return DAILY_MESSAGES.map((message, index) => ({
    identifier: `${REMINDER_PREFIX}${index + 1}`,
    content: {
      ...message,
      sound: "default",
      data: { kind: "daily-reminder", revision: REVISION },
    },
    trigger: {
      type: api.SchedulableTriggerInputTypes.WEEKLY,
      weekday: index + 1,
      hour: REMINDER_HOUR,
      minute: 0,
      channelId: REMINDER_CHANNEL,
    },
  }));
}

/** Serialize reconciliation, permission responses and toggles so an app resume
 * during the system permission dialog cannot leave duplicate or unwanted alerts. */
export function createDailyReminders(options: {
  storage: Storage;
  loadNative: () => Promise<Native | null>;
  android: boolean;
}) {
  let queue: Promise<unknown> = Promise.resolve();
  const serialize = (task: () => Promise<ReminderStatus>) => {
    const result = queue.then(task);
    queue = result.catch(() => {});
    return result;
  };
  const cancelOwned = async (api: Native) => {
    for (const request of await api.getAllScheduledNotificationsAsync())
      if (owned(request))
        await api.cancelScheduledNotificationAsync(request.identifier);
  };
  const sync = async (
    allowInitialPrompt: boolean,
    explicitEnable = false,
  ): Promise<ReminderStatus> => {
    const preference = await options.storage.getItem(REMINDER_KEY);
    const api = await options.loadNative();
    if (!api) return "unavailable";
    if (preference === "off") {
      await cancelOwned(api);
      return "off";
    }
    if (options.android)
      await api.setNotificationChannelAsync(REMINDER_CHANNEL, {
        name: "Daily adventure",
        description: "One daily reminder to return to the Labyrinth.",
        importance: api.AndroidImportance.DEFAULT,
        sound: "default",
      });
    let permission = await api.getPermissionsAsync();
    const allowed = () =>
      permission.granted ||
      permission.ios?.status === api.IosAuthorizationStatus.PROVISIONAL ||
      permission.ios?.status === api.IosAuthorizationStatus.EPHEMERAL;
    if (
      !allowed() &&
      permission.canAskAgain &&
      (explicitEnable || (allowInitialPrompt && preference === null))
    ) {
      // Record the attempt before opening native UI. A denial is never followed
      // by another automatic prompt, including after restarting the app.
      await options.storage.setItem(REMINDER_KEY, "on");
      permission = await api.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
    }
    if (!allowed()) {
      await cancelOwned(api);
      return "blocked";
    }
    await options.storage.setItem(REMINDER_KEY, "on");
    const expected = reminderRequests(api);
    const scheduled = await api.getAllScheduledNotificationsAsync();
    for (const existing of scheduled.filter(owned))
      if (
        !expected.some((request) => request.identifier === existing.identifier)
      )
        await api.cancelScheduledNotificationAsync(existing.identifier);
    for (const request of expected) {
      const existing = scheduled.find(
        (candidate) => candidate.identifier === request.identifier,
      );
      if (existing?.content.data?.revision === REVISION) continue;
      if (existing)
        await api.cancelScheduledNotificationAsync(existing.identifier);
      await api.scheduleNotificationAsync(request);
    }
    return "on";
  };
  return {
    sync: (allowInitialPrompt = false) =>
      serialize(() => sync(allowInitialPrompt)),
    setEnabled: (enabled: boolean) =>
      serialize(async () => {
        await options.storage.setItem(REMINDER_KEY, enabled ? "on" : "off");
        return sync(false, enabled);
      }),
  };
}

export const reminderForegroundBehavior = {
  shouldShowBanner: false,
  shouldShowList: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
};
