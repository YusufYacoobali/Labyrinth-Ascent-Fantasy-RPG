import type { Character } from "./engine";
import { skillRank } from "./progression";
import type { Element } from "./world";
export const STATUS_RULES = {
  bleeding: {
    max: 3,
    turns: 3,
    dot: 0.02,
    element: "physical",
    cleanse: "bandage",
  },
  burning: {
    max: 3,
    turns: 3,
    dot: 0.025,
    element: "fire",
    cleanse: "healing",
  },
  venom: {
    max: 3,
    turns: 3,
    dot: 0.025,
    element: "venom",
    cleanse: "antidote",
  },
  chilled: { max: 3, turns: 4, dot: 0, element: "frost", cleanse: "antidote" },
  frozen: { max: 1, turns: 1, dot: 0, element: "frost", cleanse: "antidote" },
  weakened: {
    max: 1,
    turns: 2,
    dot: 0,
    element: "physical",
    cleanse: "healing",
  },
  fractured: {
    max: 3,
    turns: 3,
    dot: 0,
    element: "physical",
    cleanse: "healing",
  },
  exposed: {
    max: 1,
    turns: 2,
    dot: 0,
    element: "physical",
    cleanse: "healing",
  },
} as const;
export type StatusId = keyof typeof STATUS_RULES;
export interface Condition {
  stacks: number;
  turns: number;
  applied: number;
}
export type Conditions = Partial<Record<StatusId, Condition>>;
export const stacks = (conditions: Conditions | undefined, id: StatusId) =>
  conditions?.[id]?.turns ? conditions[id]!.stacks : 0;
export const impeded = (c: Character) =>
  c.ailments.paralysis > 0 || stacks(c.ailments.conditions, "frozen") > 0;
export function immune(c: Character, id: StatusId) {
  if (c.ailments.ward) return true;
  if (id === "venom" && c.skills.includes("Toxic Adaptation")) return true;
  const ward =
    id === "burning"
      ? "Ember Ward"
      : id === "chilled" || id === "frozen"
        ? "Winter Veil"
        : id === "bleeding" || id === "fractured"
          ? "Grave Guard"
          : null;
  return !!ward && c.skills.includes(ward) && skillRank(c, ward) >= 2;
}
export function applyCondition(
  current: Conditions | undefined,
  id: StatusId,
  round: number,
  amount = 1,
): Conditions {
  const next = { ...current },
    rule = STATUS_RULES[id];
  next[id] = {
    stacks: Math.min(rule.max, stacks(current, id) + amount),
    turns: rule.turns,
    applied: round,
  };
  if (id === "chilled" && next[id]!.stacks === 3) {
    delete next.chilled;
    next.frozen = { stacks: 1, turns: 1, applied: round };
  }
  return next;
}
export function cleanse(
  current: Conditions | undefined,
  remedy: "antidote" | "bandage" | "healing",
): Conditions {
  return Object.fromEntries(
    Object.entries(current || {}).filter(([id]) =>
      remedy === "healing"
        ? false
        : STATUS_RULES[id as StatusId].cleanse !== remedy,
    ),
  );
}
export function consumeFreeze(current: Conditions | undefined): Conditions {
  const next = { ...current };
  delete next.frozen;
  return next;
}
/** Fresh effects begin ticking on the next round. Freeze is consumed by one skipped action, never by the clock. */
export function tickConditions(
  current: Conditions | undefined,
  round: number,
  maxHp: number,
  resistance: (element: Element) => number = () => 0,
) {
  const conditions: Conditions = {};
  let damage = 0;
  for (const [name, condition] of Object.entries(current || {})) {
    const id = name as StatusId,
      rule = STATUS_RULES[id],
      fresh = condition!.applied === round;
    if (!fresh && rule.dot)
      damage += Math.round(
        maxHp *
          rule.dot *
          condition!.stacks *
          (1 - resistance(rule.element) / 100),
      );
    const turns =
      id === "frozen" || fresh ? condition!.turns : condition!.turns - 1;
    if (turns > 0) conditions[id] = { ...condition!, turns };
  }
  return { conditions, damage };
}
export const conditionText = (conditions: Conditions | undefined) =>
  Object.entries(conditions || {})
    .map(([id, c]) => `${id} ×${c!.stacks} (${c!.turns}r)`)
    .join(" · ");
