import type { RoundEvent } from "./round-combat";
import { SKILLS } from "./combat-data";
export type FeedbackKind =
  | "attack"
  | "skill"
  | "reward"
  | "item"
  | "guard"
  | "fire"
  | "frost"
  | "venom"
  | "bone"
  | "pack"
  | "skitter"
  | "phase";
export function eventFeedback(event: RoundEvent): FeedbackKind | undefined {
  if (["phase", "summon", "revive"].includes(event.kind)) return "phase";
  if (event.kind === "retaliate") return "fire";
  if (
    !["strike", "skill", "attack", "burst", "item", "guard", "taunt"].includes(
      event.kind,
    )
  )
    return;
  if (event.kind === "item") return "item";
  if (event.kind === "guard" || event.kind === "taunt") return "guard";
  const foe = event.enemies.find((e) => e.id === event.actor),
    skill = SKILLS.find((s) => s.name === event.action?.skill);
  const element =
    foe?.element ||
    skill?.element ||
    (event.action?.skill === "Venom Fang"
      ? "venom"
      : event.action?.skill === "Crown Pulse"
        ? "fire"
        : "physical");
  if (element !== "physical") return element;
  if (foe?.species?.match(/skeleton|crypt|grave|royal|hollow-knight/))
    return "bone";
  if (foe?.species?.match(/wolf|frostfang|roamer/)) return "pack";
  if (foe?.species?.match(/spider|spinner|broodmother/)) return "skitter";
  return event.action?.kind === "skill" ? "skill" : "attack";
}
