import type { Game } from "./engine";
import type { CombatEnemy } from "./round-combat";
import type { EnemyIntent, SpeciesBehavior } from "./monster-behavior";
import type { StatusId } from "./combat-status";
import { formationOf } from "./combat-commands";
import { goblinIntent } from "./goblin-ecosystem";

export interface EnemyMove {
  id: string;
  kind: string;
  name: string;
  power: number;
  target: "front" | "weakest" | "all" | "self";
  cooldown?: number;
  status?: StatusId;
  phase?: number;
}
const ELEMENT_STATUS = {
  physical: "bleeding",
  fire: "burning",
  frost: "chilled",
  venom: "venom",
} as const;
/** Species supply names and roles; reusable definitions supply timing, targets and effects. */
export function movesFor(e: CombatEnemy, p: SpeciesBehavior): EnemyMove[] {
  const status = ELEMENT_STATUS[p.element];
  if (e.boss)
    return [
      {
        id: "prepare",
        kind: "charge",
        name: p.defense,
        power: 0,
        target: "self",
      },
      {
        id: "phase-special",
        kind: "strike",
        name: p.phases?.[e.stage] || p.special,
        power: 1.45 + e.stage * 0.15,
        target: e.stage > 0 ? "all" : "front",
        cooldown: 2,
        status,
      },
      {
        id: "basic",
        kind: "strike",
        name: p.basic,
        power: 0.8,
        target: "front",
      },
      {
        id: "phase-ward",
        kind: e.stage > 0 ? "guard" : "charge",
        name: e.stage > 0 ? "Reinforce the broken ward" : p.defense,
        power: 0,
        target: "self",
        phase: 1,
      },
    ];
  return [
    {
      id: "basic",
      kind: "strike",
      name: p.basic,
      power: 1,
      target: p.role === "skirmisher" ? "weakest" : "front",
    },
    {
      id: "special",
      kind: "strike",
      name: p.special,
      power: p.role === "caster" ? 0.65 : 1.25,
      target:
        p.role === "caster"
          ? "all"
          : p.role === "skirmisher"
            ? "weakest"
            : "front",
      cooldown: 2,
      status,
    },
    {
      id: "defense",
      kind:
        p.role === "support"
          ? "heal"
          : p.role === "bruiser"
            ? "charge"
            : "guard",
      name: p.defense,
      power: 0,
      target: "self",
      cooldown: 2,
    },
  ];
}
export function selectMove(
  s: Game,
  e: CombatEnemy,
  p: SpeciesBehavior,
): EnemyIntent {
  const goblin = goblinIntent(s, e);
  if (goblin) return { ...goblin, move: goblin.kind };
  const moves = movesFor(e, p),
    round = s.combat?.round || 1;
  const pattern = e.boss
    ? e.stage > 0
      ? [3, 1, 2, 1]
      : [0, 1, 2]
    : p.role === "defender" || p.role === "bruiser"
      ? [2, 1, 0]
      : [0, 1, 2];
  const desired = moves[pattern[(round - 1) % pattern.length]];
  const move =
    (e.moveCooldowns?.[desired.id] || 0) > 0
      ? moves.find((m) => m.id === "basic")!
      : desired;
  const alive = s.party.filter((c) => c.hp > 0);
  const front = alive.filter((c) => formationOf(c) === "front");
  const pool = move.target === "front" && front.length ? front : alive;
  const target =
    move.target === "weakest"
      ? [...pool].sort(
          (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
        )[0]
      : pool[(round + p.speed) % Math.max(1, pool.length)];
  return {
    kind: move.kind,
    label: move.name,
    targets:
      move.target === "self"
        ? []
        : move.target === "all"
          ? alive.map((c) => c.id)
          : target
            ? [target.id]
            : [],
    power: e.charged && move.kind === "strike" ? move.power * 1.3 : move.power,
    move: move.id,
    cooldown: move.cooldown,
    status: move.status,
  };
}
