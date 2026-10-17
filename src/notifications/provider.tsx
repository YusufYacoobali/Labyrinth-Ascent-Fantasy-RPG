import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGame } from "@/game/provider";
import {
  createDailyReminders,
  reminderForegroundBehavior,
  type ReminderStatus,
} from "./daily-reminders";

let native: Promise<typeof import("expo-notifications") | null> | undefined;
function loadNative() {
  if (Platform.OS === "web") return Promise.resolve(null);
  // Older development builds may not contain this native module yet.
  return (native ??= import("expo-notifications")
    .then((api) => {
      api.setNotificationHandler({
        handleNotification: async () => reminderForegroundBehavior,
      });
      return api;
    })
    .catch(() => null));
}

const Context = createContext<{
  status: ReminderStatus | "loading" | "error";
  busy: boolean;
  toggle: () => void;
} | null>(null);

export function DailyReminderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, state } = useGame();
  const [status, setStatus] = useState<ReminderStatus | "loading" | "error">(
    "loading",
  );
  const [busy, setBusy] = useState(false);
  const controller = useRef(
    createDailyReminders({
      storage: AsyncStorage,
      loadNative,
      android: Platform.OS === "android",
    }),
  );
  const inTown = state.phase === "town";
  useEffect(() => {
    if (!ready || !state.started) return;
    let alive = true;
    const refresh = () => {
      if (AppState.currentState !== "active") return;
      void controller.current.sync(inTown).then(
        (next) => {
          if (alive) setStatus(next);
        },
        () => {
          if (alive) setStatus("error");
        },
      );
    };
    refresh();
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => {
      alive = false;
      listener.remove();
    };
  }, [ready, state.started, inTown]);
  const toggle = () => {
    if (busy) return;
    setBusy(true);
    const operation =
      status === "blocked"
        ? Linking.openSettings().then(() => controller.current.sync())
        : status === "error"
          ? controller.current.sync()
          : controller.current.setEnabled(status !== "on");
    void operation
      .then(setStatus, () => setStatus("error"))
      .finally(() => setBusy(false));
  };
  return (
    <Context.Provider value={{ status, busy, toggle }}>
      {children}
    </Context.Provider>
  );
}

export const useDailyReminders = () => useContext(Context);
