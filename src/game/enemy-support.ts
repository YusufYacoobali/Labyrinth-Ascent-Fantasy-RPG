import type { Game } from "./engine";
import type { CombatEnemy } from "./round-combat";
import type { EnemyIntent } from "./monster-behavior";
import { SPECIES_BEHAVIOR } from "./monster-behavior";
import { MONSTERS } from "./monsters";
import { BALANCE as B } from "./balance";
import { ECOLOGY } from "./ecology";
import { applyCondition, immune } from "./combat-status";

/** Support effects share the same durable combatants and finite reinforcement budget. */
export function resolveEnemySupport(s: Game, id: string, intent: EnemyIntent) {
  if (
    !s.combat ||
    ![
      "summon",
      "heal",
      "guard",
      "charge",
      "counter",
      "veil",
      "mark",
      "consume",
      "revive",
    ].includes(intent.kind)
  )
    return null;
  const combat = {
    ...s.combat,
    enemies: s.combat.enemies.map((e) => ({ ...e })),
  };
  const actor = combat.enemies.find((e) => e.id === id)!;
  let target = "",
    text = `${actor.name}: ${intent.label}.`,
    kind = intent.kind;
  let party = s.party;
  if (kind === "counter")
    actor.counter = { element: actor.element, power: intent.power, turns: 2 };
  if (kind === "veil") actor.concealed = 3;
  if (kind === "mark") {
    const ally = party.find((c) => c.id === intent.targets[0] && c.hp > 0);
    if (ally && !immune(ally, "exposed")) {
      party = party.map((c) =>
        c.id === ally.id
          ? {
              ...c,
              ailments: {
                ...c.ailments,
                conditions: applyCondition(
                  c.ailments.conditions,
                  "exposed",
                  combat.round,
                ),
              },
            }
          : c,
      );
      target = ally.id;
    }
  }
  if (kind === "consume") {
    const minion = combat.enemies
      .filter((e) => e.id !== id && e.hp > 0 && !e.boss)
      .sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0];
    if (minion) {
      minion.hp = 0;
      minion.rewardEligible = false;
      actor.hp = Math.min(
        actor.maxHp,
        actor.hp + Math.round(actor.maxHp * intent.power),
      );
      target = minion.id;
      text = `${actor.name} consumes ${minion.name} and recovers. Consumed minions grant no loot.`;
    } else {
      kind = "cancel";
      text = `${actor.name} finds no living minion to consume.`;
    }
  }
  if (kind === "revive") {
    const corpse = [...combat.enemies, ...(combat.defeated || [])].find(
      (e) => e.hp <= 0 && e.id !== id && e.rewardEligible !== false,
    );
    if (corpse && combat.enemies.filter((e) => e.hp > 0).length < 3) {
      const revived = {
        ...corpse,
        hp: Math.max(1, Math.round(corpse.maxHp * intent.power)),
        enteredRound: combat.round,
        poison: 0,
        paralysis: 0,
        broken: 0,
        conditions: {},
      };
      const slot = combat.enemies.findIndex((e) => e.id === corpse.id);
      if (slot >= 0) combat.enemies[slot] = revived;
      else {
        const empty = combat.enemies.findIndex((e) => e.hp <= 0);
        if (empty >= 0) {
          combat.defeated = [...(combat.defeated || []), combat.enemies[empty]];
          combat.enemies[empty] = revived;
        } else combat.enemies.push(revived);
      }
      combat.defeated = (combat.defeated || []).filter(
        (e) => e.id !== corpse.id,
      );
      target = corpse.id;
      text = `${actor.name} restores ${corpse.name}. Its original identity and single reward are retained; it acts next round.`;
    } else {
      kind = "cancel";
      text = `${actor.name} finds no room or corpse to restore.`;
    }
  }
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
      actor.waves = (actor.waves || 0) + 1;
      const called: string[] = [];
      for (
        let waveUnit = 0;
        waveUnit < (intent.count || 1) &&
        combat.enemies.filter((e) => e.hp > 0).length < 3;
        waveUnit++
      ) {
        const profile = SPECIES_BEHAVIOR[species.id],
          spawned = (combat.spawned || 0) + 1;
        const hp = Math.round(
          (B.normalHp[0] + s.floor * B.normalHp[1]) *
            (1 + B.partyHpScale * (s.party.length - 1)) *
            (ECOLOGY[species.id]?.hp === 1
              ? B.goblins.minionHp
              : ECOLOGY[species.id]?.hp || B.goblins.minionHp),
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
              (ECOLOGY[species.id]?.attack || B.goblins.minionAttack),
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
          enteredRound: combat.round,
          resistances: ECOLOGY[species.id]?.resistances,
          weaknesses: ECOLOGY[species.id]?.weaknesses,
          sprite: actor.sprite,
          intent: profile.basic,
        };
        const empty = combat.enemies.findIndex((e) => e.hp <= 0);
        if (empty >= 0) {
          combat.defeated = [...(combat.defeated || []), combat.enemies[empty]];
          combat.enemies[empty] = minion;
        } else combat.enemies.push(minion);
        combat.spawned = spawned;
        target = minion.id;
        called.push(species.name);
      }
      text = `${actor.name} calls ${called.join(" and ")} (wave ${actor.waves}/${intent.limit}). Reinforcements act next round.`;
    }
  }
  if (kind !== "cancel" && intent.move)
    actor.usedMoves = {
      ...actor.usedMoves,
      [intent.move]: (actor.usedMoves?.[intent.move] || 0) + 1,
    };
  return { state: { ...s, party, combat }, target, text, kind };
}
