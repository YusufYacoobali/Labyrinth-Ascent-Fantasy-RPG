import type { Game } from "./engine";
import { impeded } from "./combat-status";
import { validateQueue, type QueuedAction } from "./round-combat";

/** Select actions one at a time; only a complete, valid plan may start playback. */
export function chooseCommand(
  state: Game,
  previous: Record<string, QueuedAction>,
  action: QueuedAction,
) {
  const ready = state.party.filter((c) => c.hp > 0 && !impeded(c));
  if (!ready.some((c) => c.id === action.actor))
    return {
      commands: previous,
      actions: [],
      complete: false,
      nextActor: undefined,
      issue: "That companion cannot act.",
    };
  const commands = { ...previous, [action.actor]: action };
  const actions = ready.flatMap((c) =>
    commands[c.id] ? [commands[c.id]] : [],
  );
  // Validate shared resources even before the last choice. Placeholder attacks are
  // validation-only: they are never stored or dispatched for unchosen companions.
  const issue = validateQueue(state, {
    type: "ROUND",
    battleId: state.combat?.id || "",
    round: state.combat?.round || 0,
    actions: ready.map(
      (c) =>
        commands[c.id] || {
          actor: c.id,
          kind: "attack",
          target: state.combat?.enemies.find((e) => e.hp > 0)?.id,
        },
    ),
  });
  return {
    commands: issue ? previous : commands,
    actions: issue
      ? ready.flatMap((c) => (previous[c.id] ? [previous[c.id]] : []))
      : actions,
    complete: !issue && actions.length === ready.length,
    nextActor: issue ? action.actor : ready.find((c) => !commands[c.id])?.id,
    issue,
  };
}
