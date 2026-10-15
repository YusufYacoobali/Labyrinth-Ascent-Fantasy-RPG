import type { Game } from "./engine";
import type { CombatEnemy } from "./round-combat";
import type { EnemyIntent } from "./monster-behavior";
import { BALANCE as B } from "./balance";

export function goblinGroup(roll: number, defender: boolean): string[] {
  if (defender) return ["goblin-shieldbearer", "goblin", "goblin-slinger"];
  if (roll < B.goblins.soloChance) return ["goblin"];
  return roll < B.goblins.shieldGroupChance
    ? ["goblin-shieldbearer", "goblin"]
    : ["goblin", "goblin-slinger"];
}
export function goblinIntent(s: Game, enemy: CombatEnemy): EnemyIntent | null {
  const round = s.combat?.round || 1;
  const weak = [...s.party]
    .filter((c) => c.hp > 0)
    .sort(
      (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
    )[0];
  if (enemy.behaviorId === "goblin") {
    if (
      round % 3 === 2 &&
      (enemy.waves || 0) < B.goblins.waveLimit &&
      (s.combat?.enemies.filter((e) => e.hp > 0).length || 0) < 3
    )
      return {
        kind: "summon",
        label: "Blow the horn · one finite wave; interrupt or defeat the scout",
        targets: [],
        power: 0,
        summon: "goblin-slinger",
        limit: B.goblins.waveLimit,
      };
    if (round % 3 === 0)
      return {
        kind: "guard",
        label: "Duck behind cover",
        targets: [],
        power: 0,
      };
    return {
      kind: "strike",
      label: "Flanking knife · hunt the wounded",
      targets: weak ? [weak.id] : [],
      power: 1,
    };
  }
  if (enemy.behaviorId === "goblin-shieldbearer") {
    const ally = [...(s.combat?.enemies || [])]
      .filter((e) => e.hp > 0 && e.id !== enemy.id)
      .sort(
        (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
      )[0];
    if (ally && round % 3 !== 2)
      return {
        kind: "cover",
        label:
          "Shield link · protects one goblin; defeat or interrupt the bearer",
        targets: [ally.id],
        power: 0,
        cover: B.goblins.cover,
      };
    if (!ally && round % 3 === 0)
      return {
        kind: "guard",
        label: "Brace the shield",
        targets: [],
        power: 0,
      };
    return {
      kind: "strike",
      label: "Shield shove",
      targets: weak ? [weak.id] : [],
      power: 0.85,
    };
  }
  if (enemy.behaviorId === "goblin-slinger") {
    if (round % 3 === 0)
      return {
        kind: "guard",
        label: "Hide behind rubble",
        targets: [],
        power: 0,
      };
    return {
      kind: "strike",
      label:
        round % 3 === 2
          ? "Crippling pebble · weakens the target"
          : "Sling stone · hunt the wounded",
      targets: weak ? [weak.id] : [],
      power: 0.8,
      slow: round % 3 === 2 ? 2 : 0,
    };
  }
  return null;
}
