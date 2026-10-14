import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Action,
  Game,
  initialGame,
  normalizeSave,
  reducer,
  needsGateConfirmation,
} from "./engine";
const KEY = "labyrinth-awaits-save-v1";
const Context = createContext<{
  state: Game;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
  saveError: string;
  retrySave: () => void;
  pendingTownAction: Action | null;
  confirmTownAction: (skip: boolean) => void;
} | null>(null);
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchBase] = useReducer(
    (s: Game, a: Action | { type: "HYDRATE"; save: Game }) =>
      a.type === "HYDRATE" ? a.save : reducer(s, a),
    undefined,
    initialGame,
  );
  const [ready, setReady] = useState(false);
  const [pendingTownAction, setPendingTownAction] = useState<Action | null>(
    null,
  );
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!live) return;
        if (raw) {
          try {
            const g = JSON.parse(raw);
            if (
              g.version === 1 &&
              Array.isArray(g.party) &&
              typeof g.day === "number" &&
              g.party.every((c: Game["party"][number]) =>
                Array.isArray(c.skills),
              )
            )
              dispatchBase({ type: "HYDRATE", save: normalizeSave(g) });
            else
              setSaveError(
                "The saved journey could not be read. A fresh journey is ready.",
              );
          } catch {
            setSaveError(
              "The saved journey could not be read. A fresh journey is ready.",
            );
          }
        }
      })
      .catch(() => {
        if (live)
          setSaveError(
            "Storage is unavailable. Your journey will last for this session.",
          );
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    AsyncStorage.setItem(KEY, JSON.stringify(state))
      .then(() => {
        if (live) setSaveError("");
      })
      .catch(() => {
        if (live) setSaveError("Progress could not be saved. Tap to retry.");
      });
    return () => {
      live = false;
    };
  }, [state, ready, retry]);
  return (
    <Context.Provider
      value={{
        state,
        dispatch: (action) => {
          if (needsGateConfirmation(state, action))
            setPendingTownAction(action);
          else dispatchBase(action);
        },
        pendingTownAction,
        confirmTownAction: (skip) => {
          if (
            skip &&
            pendingTownAction &&
            (pendingTownAction.type === "REST" ||
              pendingTownAction.type === "WORK" ||
              pendingTownAction.type === "TRAIN")
          ) {
            dispatchBase({ ...pendingTownAction, skipOpening: true });
          }
          setPendingTownAction(null);
        },
        ready,
        saveError,
        retrySave: () => setRetry((x) => x + 1),
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
