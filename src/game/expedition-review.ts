import type { Game } from "./engine";

/** First expedition, then every four expeditions: 1, 5, 9, 13… */
export const reviewDue = (expedition: number, lastRequested = 0) =>
  Number.isSafeInteger(expedition) &&
  expedition > 0 &&
  (expedition - 1) % 4 === 0 &&
  expedition > lastRequested;

export function reviewAfterEntry(before: Game, after: Game) {
  const expedition = after.expedition.number;
  return before.phase === "town" &&
    after.journey.startDay !== null &&
    expedition === before.expedition.number + 1 &&
    reviewDue(expedition, before.reviewPromptExpedition || 0) &&
    after.reviewPromptExpedition === expedition
    ? expedition
    : null;
}

function atStart(s: Game, expedition: number) {
  return (
    s.started &&
    !s.trial &&
    s.expedition.number === expedition &&
    s.reviewPromptExpedition === expedition &&
    s.journey.startDay !== null &&
    s.journey.room === "entrance" &&
    !s.journey.defender &&
    s.journey.watches <= 6 &&
    ["mission", "arrival", "exploration"].includes(s.phase)
  );
}

/** Requests follow a durable entry save, after the portal screen has settled.
 * Native stores decide whether to display their dialog; requests are never retried
 * on reload, and a failed/unavailable review must not interrupt the expedition. */
export function createExpeditionReview(options: {
  getState: () => Game;
  isActive: () => boolean;
  isAvailable: () => Promise<boolean>;
  requestReview: () => Promise<void>;
  schedule?: (task: () => void, delay: number) => () => void;
}) {
  let pending: number | null = null;
  let cancel: (() => void) | null = null;
  let generation = 0;
  const schedule =
    options.schedule ||
    ((task, delay) => {
      const timer = setTimeout(task, delay);
      return () => clearTimeout(timer);
    });
  const reset = () => {
    generation++;
    pending = null;
    cancel?.();
    cancel = null;
  };
  const request = async (expedition: number, token: number) => {
    const valid = () =>
      generation === token &&
      options.isActive() &&
      atStart(options.getState(), expedition);
    if (!valid()) return;
    try {
      if ((await options.isAvailable()) && valid())
        await options.requestReview();
    } catch {
      // OS review availability, quotas or cancellation never become gameplay errors.
    }
  };
  return {
    queueEntry(before: Game, after: Game) {
      if (after.expedition.number === before.expedition.number) return;
      reset();
      pending = reviewAfterEntry(before, after);
    },
    afterSaved() {
      if (pending === null || cancel) return;
      const expedition = pending,
        token = generation;
      cancel = schedule(() => {
        cancel = null;
        pending = null;
        void request(expedition, token);
      }, 1200);
    },
    reset,
  };
}
