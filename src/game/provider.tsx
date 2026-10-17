import { serializeSave } from "./skill-ids";
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createExpeditionReview } from "./expedition-review";
import {
  Action,
  Game,
  initialGame,
  normalizeSave,
  reducer,
  needsGateConfirmation,
} from "./engine";
import { loadSave, saveWriter } from "./save-store";
const Context = createContext<{
  state: Game;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
  saving: boolean;
  saveError: string;
  retrySave: () => void;
  pendingTownAction: Action | null;
  confirmTownAction: (skip: boolean) => void;
} | null>(null);
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialGame);
  const current = useRef(state);
  const reviewPrompt = useRef<ReturnType<typeof createExpeditionReview> | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const working = useRef(false);
  const canWrite = useRef(true);
  const pendingCommit = useRef<Game | null>(null);
  const alive = useRef(true);
  const writer = useRef(saveWriter(AsyncStorage));
  const [pendingTownAction, setPendingTownAction] = useState<Action | null>(
    null,
  );
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    const prompt = createExpeditionReview({
      getState: () => current.current,
      isActive: () => AppState.currentState === "active",
      isAvailable: async () =>
        (await import("expo-store-review")).isAvailableAsync(),
      requestReview: async () =>
        (await import("expo-store-review")).requestReview(),
    });
    reviewPrompt.current = prompt;
    alive.current = true;
    loadSave(AsyncStorage)
      .then(({ save, backedUp }) => {
        if (!alive.current) return;
        const next = save
          ? { ...normalizeSave(save), playback: null, roundPlayback: null }
          : initialGame();
        current.current = next;
        setState(next);
        if (backedUp)
          setSaveError(
            "Your development save was backed up. This redesign starts a fresh campaign.",
          );
      })
      .catch(() => {
        if (!alive.current) return;
        canWrite.current = false;
        setSaveError(
          "The existing save is retained. Storage could not be read; changes remain in this session.",
        );
      })
      .finally(() => {
        if (alive.current) setReady(true);
      });
    return () => {
      alive.current = false;
      prompt.reset();
    };
  }, []);
  const dispatch: React.Dispatch<Action> = (action) => {
    if (!ready || working.current) return;
    if (needsGateConfirmation(current.current, action)) {
      setPendingTownAction(action);
      return;
    }
    const next = reducer(current.current, action);
    if (next === current.current) return;
    reviewPrompt.current?.queueEntry(current.current, next);
    current.current = next;
    pendingCommit.current = next;
    // Ordinary navigation stays immediate. Combat waits for its durable result before playback.
    const waitForCommit = action.type === "ROUND" && action.animate;
    if (!waitForCommit) setState(next);
    working.current = true;
    setSaving(true);
    const persist = canWrite.current
      ? writer.current.save(serializeSave(next))
      : Promise.reject(new Error("Storage unreadable"));
    persist
      .then(() => {
        pendingCommit.current = null;
        working.current = false;
        if (alive.current) {
          setSaveError("");
          if (waitForCommit) setState(next);
          reviewPrompt.current?.afterSaved();
        }
      })
      .catch(() => {
        if (alive.current)
          setSaveError(
            canWrite.current
              ? "Progress could not be saved. Tap to retry."
              : "Existing save retained; changes remain in this session.",
          );
      })
      .finally(() => {
        if (alive.current) setSaving(false);
      });
  };
  const retrySave = () => {
    if (!canWrite.current) {
      loadSave(AsyncStorage)
        .then(({ save }) => {
          canWrite.current = true;
          const next = save
            ? { ...normalizeSave(save), playback: null, roundPlayback: null }
            : initialGame();
          current.current = next;
          reviewPrompt.current?.reset();
          setState(next);
          pendingCommit.current = null;
          working.current = false;
          setSaveError("");
        })
        .catch(() =>
          setSaveError(
            "The existing save is retained. Storage still cannot be read.",
          ),
        );
      return;
    }
    setSaving(true);
    writer.current
      .retry()
      .then(() => {
        pendingCommit.current = null;
        working.current = false;
        setState(current.current);
        setSaveError("");
        reviewPrompt.current?.afterSaved();
      })
      .catch(() => setSaveError("Progress could not be saved. Tap to retry."))
      .finally(() => setSaving(false));
  };
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        ready,
        saving,
        saveError,
        retrySave,
        pendingTownAction,
        confirmTownAction: (skip) => {
          if (
            skip &&
            pendingTownAction &&
            ["REST", "WORK", "TRAIN"].includes(pendingTownAction.type)
          )
            dispatch({ ...pendingTownAction, skipOpening: true } as Action);
          setPendingTownAction(null);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const c = useContext(Context);
  if (!c) throw new Error("Game provider missing");
  return c;
}

/** A visual trial is a separate, disposable game session; it never writes the saved expedition. */
export function CombatTrialProvider({
  initial,
  children,
}: {
  initial: Game;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        ready: true,
        saving: false,
        saveError: "",
        retrySave: () => {},
        pendingTownAction: null,
        confirmTownAction: () => {},
      }}
    >
      {children}
    </Context.Provider>
  );
}
