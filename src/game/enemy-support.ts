import type { Game } from "./engine";
import type { CombatEnemy } from "./round-combat";
import type { EnemyIntent } from "./monster-behavior";
import { SPECIES_BEHAVIOR } from "./monster-behavior";
import { MONSTERS } from "./monsters";
import { BALANCE as B } from "./balance";

/** Support effects share the same durable combatants and finite reinforcement budget. */
export function resolveEnemySupport(s: Game, id: string, intent: EnemyIntent) {
  if (!s.combat || !["summon", "heal", "guard", "charge"].includes(intent.kind))
    return null;
  const combat = {
    ...s.combat,
    enemies: s.combat.enemies.map((e) => ({ ...e })),
  };
  const actor = combat.enemies.find((e) => e.id === id)!;
  let target = "",
    text = `${actor.name}: ${intent.label}.`,
    kind = intent.kind;
  if (kind === "charge") actor.charged = true;
  if (kind === "guard")
    for (const ally of combat.enemies.filter((e) => e.hp > 0)) ally.guard += 3;
  if (kind === "heal") {
    const ally = [...combat.enemies]
      .filter((e) => e.hp > 0)
      .sort(
        (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
      )[0];
    const recovered = Math.min(
      ally.maxHp - ally.hp,
      Math.round(ally.maxHp * 0.18),
    );
    ally.hp += recovered;
    target = ally.id;
    text = `${actor.name} mends ${ally.name} for ${recovered} HP.`;
  }
  if (kind === "summon") {
    const species = MONSTERS.find((m) => m.id === intent.summon);
    if (
      !species ||
      (actor.waves || 0) >= (intent.limit || 0) ||
      combat.enemies.filter((e) => e.hp > 0).length >= 3
    ) {
      kind = "cancel";
      text = `${actor.name}'s call finds no room or waves remaining.`;
    } else {
      const profile = SPECIES_BEHAVIOR[species.id],
        spawned = (combat.spawned || 0) + 1;
      const hp = Math.round(
        (B.normalHp[0] + s.floor * B.normalHp[1]) *
          (1 + B.partyHpScale * (s.party.length - 1)) *
          B.goblins.minionHp,
      );
      const minion: CombatEnemy = {
        id: `${combat.id}:summon-${spawned}`,
        species: species.id,
        behaviorId: species.id,
        name: species.name,
        boss: false,
        hp,
        maxHp: hp,
        atk: Math.round(
          (B.enemyAttack[0] + s.floor * B.enemyAttack[1]) *
            B.goblins.minionAttack,
        ),
        speed: profile.speed,
        archetype: profile.role,
        element: profile.element,
        level: s.floor,
        stage: 0,
        poison: 0,
        paralysis: 0,
        broken: 0,
        controlWard: 0,
        charged: false,
        guard: 0,
        poise: 50,
        maxPoise: 50,
        waves: 0,
        sprite: actor.sprite,
        intent: profile.basic,
      };
      actor.waves = (actor.waves || 0) + 1;
      const empty = combat.enemies.findIndex((e) => e.hp <= 0);
      if (empty >= 0) {
        combat.defeated = [...(combat.defeated || []), combat.enemies[empty]];
        combat.enemies[empty] = minion;
      } else combat.enemies.push(minion);
      combat.spawned = spawned;
      target = minion.id;
      text = `${actor.name} calls ${species.name} (wave ${actor.waves}/${intent.limit}). Reinforcements act next round.`;
    }
  }
  return { state: { ...s, combat }, target, text, kind };
}
