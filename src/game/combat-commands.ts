import { skillCost } from "./build-equipment";
import type { Character, Game } from "./engine";
import type { QueuedAction } from "./round-combat";
import { SKILLS } from "./combat-data";
import { impeded } from "./combat-status";
import { fatigueMultiplier } from "./exhaustion";
import { resolveBattle } from "./battle";
import { ECOSYSTEMS } from "./ecosystem-moves";
export const formationOf = (c: Character) =>
  c.formation || (/mage|ranger|archer|warden/i.test(c.job) ? "back" : "front");
export function repeatCommands(s: Game): QueuedAction[] {
  const enemy = s.combat?.enemies.find((e) => e.hp > 0);
  return s.party
    .filter((c) => c.hp > 0 && !impeded(c))
    .map((c) => {
      const old = s.combat?.lastCommands?.find((q) => q.actor === c.id);
      if (!old) return { actor: c.id, kind: "attack", target: enemy?.id };
      const spec = SKILLS.find((k) => k.name === old.skill);
      if (
        old.kind === "skill" &&
        (!spec ||
          !c.skills.includes(spec.name) ||
          c.mp < skillCost(c, spec.name, spec.cost) ||
          c.cooldowns[spec.name])
      )
        return { actor: c.id, kind: "attack", target: enemy?.id };
      const friendly =
        old.kind === "item" || old.kind === "guard" || old.kind === "taunt";
      const target = friendly
        ? s.party.find((p) => p.id === old.target && p.hp > 0)?.id || c.id
        : s.combat?.enemies.find((e) => e.id === old.target && e.hp > 0)?.id ||
          enemy?.id;
      return { ...old, target };
    });
}
export function canAutoResolve(s: Game) {
  const enemies = s.combat?.enemies.filter((e) => e.hp > 0) || [];
  if (
    enemies.some(
      (e) =>
        ECOSYSTEMS[e.behaviorId || ""]?.triggers?.some((t) =>
          ["space", "corpse", "minion"].includes(t.requires || ""),
        ) ||
        e.counter?.turns ||
        e.concealed,
    )
  )
    return false;
  if (
    s.phase !== "combat" ||
    !s.combat ||
    s.combat.defender ||
    s.trial ||
    !enemies.length ||
    enemies.some((e) => e.boss || (e.behaviorId === "goblin" && !e.waves))
  )
    return false;
  if (
    s.party.some(
      (c) =>
        c.hp <= 0 ||
        impeded(c) ||
        c.level < Math.max(...enemies.map((e) => e.level)) + 4 ||
        c.exhaustion > 20 ||
        c.ailments.poison ||
        Object.keys(c.ailments.conditions || {}).length,
    )
  )
    return false;
  const armor = Math.max(...enemies.map((e) => e.guard)) + 5;
  const damage =
    s.party.reduce(
      (n, c) => n + Math.max(2, c.atk * fatigueMultiplier(c) - armor),
      0,
    ) * 0.4;
  const rounds =
    Math.ceil(enemies.reduce((n, e) => n + e.hp, 0) / damage) + enemies.length;
  const worst = enemies.reduce((n, e) => n + e.atk * 2, 0) * rounds;
  return (
    rounds <= 12 &&
    s.party.every(
      (c) => c.hp > worst + Math.round(c.maxHp * (0.2 + rounds * 0.075)),
    )
  );
}
export function commandPreview(s: Game, q: QueuedAction | undefined) {
  if (!q || !["attack", "burst", "skill"].includes(q.kind)) return "";
  const foe = s.combat?.enemies.find((e) => e.id === q.target && e.hp > 0);
  if (!foe) return "";
  const draw = (roll: number) =>
    resolveBattle(
      {
        ...s,
        trial: true,
        party: s.party.map((c) => ({
          ...c,
          ailments: { ...c.ailments },
          cooldowns: { ...c.cooldowns },
        })),
        enemy: { ...foe },
      },
      {
        type: "BATTLE",
        kind: q.kind as "attack" | "burst" | "skill",
        actor: q.actor,
        skill: q.skill,
        roll,
      },
      (v) => v,
      true,
    ).effects.damage;
  return `Damage preview: ${draw(0)}–${draw(0.999)} before ally cover and changing statuses.`;
}
