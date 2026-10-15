import type { Game, Enemy, Character, Skill, BattleEffect } from "./engine";
import { resolveBattle } from "./battle";
import { SKILLS, resist } from "./combat-data";
import { skillRank, earnMastery } from "./progression";
import { fatigueMultiplier } from "./exhaustion";
import { nextRandom, monsterFor } from "./monsters";
import {
  currentMapKey,
  backRoom,
  enterMappedRoom,
  currentRoom,
} from "./exploration";
import { BALANCE as B } from "./balance";
export type Archetype =
  "skirmisher" | "bruiser" | "defender" | "caster" | "support";
export interface CombatEnemy extends Enemy {
  id: string;
  level: number;
  speed: number;
  archetype: Archetype;
  stage: number;
}
export interface CombatState {
  id: string;
  enemies: CombatEnemy[];
  round: number;
  mastery: Record<string, Partial<Record<Skill, number>>>;
  defender: boolean;
  resume: "exploration" | "camp";
  complete: boolean;
  preparation?: {
    choice: string;
    outcome: string;
    effect: string;
    scouted: boolean;
  };
}
export interface QueuedAction {
  actor: string;
  kind: "attack" | "skill" | "guard" | "focus" | "item" | "burst";
  target?: string;
  skill?: Skill;
  item?: string;
}
export interface RoundEvent {
  action?: QueuedAction;
  id: string;
  actor: string;
  target: string;
  text: string;
  kind: string;
  party: Character[];
  enemies: CombatEnemy[];
  effects: BattleEffect;
}
export interface RoundRequest {
  type: "ROUND";
  battleId: string;
  round: number;
  actions: QueuedAction[];
  flee?: boolean;
  animate?: boolean;
}
export const effectiveSpeed = (c: Character) =>
  Math.max(1, c.speed * fatigueMultiplier(c));
export const enemySpeed = (e: CombatEnemy) =>
  Math.max(1, e.speed - (e.slowed || 0));
export function initiative(s: Game) {
  return [
    ...s.party
      .filter((c) => c.hp > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        speed: effectiveSpeed(c),
        enemy: false,
      })),
    ...(s.combat?.enemies || [])
      .filter((e) => e.hp > 0)
      .map((e) => ({
        id: e.id,
        name: e.name,
        speed: enemySpeed(e),
        enemy: true,
      })),
  ].sort((a, b) => b.speed - a.speed || a.id.localeCompare(b.id));
}
export function beginCombat(
  s: Game,
  resume: "exploration" | "camp" = "exploration",
  source = "roamer",
): Game {
  if (!s.enemy) return s;
  const id = `${s.expedition.number}:${currentMapKey(s)}:${s.journey.room}:${s.journey.defender ? "portal" : resume === "camp" ? `camp-${s.journey.watches}` : s.sideBattle ? "story" : source}`;
  const saved = s.expedition.battles[id];
  if (saved?.complete)
    return {
      ...s,
      phase: saved.defender ? "victory" : "exploration",
      combat: null,
      journey: {
        ...s.journey,
        defender: false,
        portal: saved.defender || s.journey.portal,
        resolvedBranches:
          source === "roamer"
            ? [
                ...new Set([
                  ...s.journey.resolvedBranches,
                  `${currentMapKey(s)}:${s.journey.room}`,
                ]),
              ]
            : s.journey.resolvedBranches,
      },
      message: "This encounter is already resolved. Its rewards are recorded.",
    };
  if (saved && !saved.complete)
    return {
      ...s,
      combat: saved,
      turn: saved.round,
      arrivalChoice: saved.preparation?.choice || "",
      arrivalOutcome: saved.preparation?.outcome || "",
      arrivalEffect: saved.preparation?.effect || "",
      arrivalScouted: saved.preparation?.scouted || false,
      enemy: saved.enemies.find((e) => e.hp > 0) || saved.enemies[0],
      party: s.party.map((c) => ({
        ...c,
        battleMastery: saved.mastery[c.id] || {},
      })),
    };
  const draw = nextRandom(s.rng.encounters),
    count = s.enemy.boss
      ? 1
      : s.floor <= 2
        ? draw.roll < 0.65
          ? 1
          : 2
        : s.floor <= 7
          ? 2
          : 3;
  const archetypes: Archetype[] = [
    "skirmisher",
    "bruiser",
    "defender",
    "caster",
    "support",
  ];
  const enemies = Array.from({ length: count }, (_, index): CombatEnemy => {
    const base = s.enemy!,
      hp = Math.round(
        (base.boss
          ? B.bossHp[0] + s.floor * B.bossHp[1]
          : B.normalHp[0] + s.floor * B.normalHp[1]) *
          (1 + B.partyHpScale * (s.party.length - 1)) *
          (s.journey.defender && !base.boss ? 1.2 : 1),
      );
    return {
      ...base,
      id: `${id}:enemy-${index + 1}`,
      name: count > 1 ? `${base.name} ${index + 1}` : base.name,
      hp,
      maxHp: hp,
      atk: Math.round(
        base.boss
          ? B.bossAttack[0] + s.floor * B.bossAttack[1]
          : B.enemyAttack[0] + s.floor * B.enemyAttack[1],
      ),
      level: s.floor,
      speed: base.boss
        ? 8 + s.floor
        : 6 + s.floor + ((index + s.floor) % 5) * 2,
      archetype: archetypes[(index + s.floor) % archetypes.length],
      stage: 0,
      poison: 0,
      paralysis: 0,
      broken: 0,
      controlWard: 0,
      charged: false,
    };
  });
  const combat: CombatState = {
    id,
    enemies,
    round: 1,
    mastery: {},
    defender: s.journey.defender,
    resume,
    complete: false,
  };
  return {
    ...s,
    combat,
    enemy: enemies[0],
    rng: { ...s.rng, encounters: draw.seed },
    turn: 1,
    momentum: 0,
    party: s.party.map((c) => ({ ...c, battleMastery: {}, cooldowns: {} })),
    expedition: {
      ...s.expedition,
      battles: { ...s.expedition.battles, [id]: combat },
    },
  };
}
export function enemyIntent(s: Game, e: CombatEnemy) {
  const alive = s.party.filter((c) => c.hp > 0),
    round = s.combat?.round || 1;
  const weak = [...alive].sort(
    (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
  )[0];
  const target =
    e.archetype === "skirmisher"
      ? weak
      : alive[(round + e.speed) % Math.max(1, alive.length)];
  if (e.broken || e.paralysis)
    return { kind: "wait", label: "Interrupted", targets: [], power: 0 };
  if (e.boss) {
    if (round % 3 === 1)
      return {
        kind: "charge",
        label: ["Gathering power", "Furious charge", "Royal reckoning"][
          e.stage
        ],
        targets: [],
        power: 0,
      };
    const all = e.stage > 0 && round % 3 === 2;
    const names: Record<number, string[]> = {
      3: ["Stone hammer", "Shattering sweep"],
      6:
        e.element === "frost"
          ? ["Rime lance", "Whiteout"]
          : e.element === "fire"
            ? ["Crucible hammer", "Molten rain"]
            : e.element === "physical"
              ? ["Oathbreaker cut", "Silent judgment"]
              : ["Blight lance", "Toxic deluge"],
      9: ["Ashen cleave", "Furnace storm"],
      12: ["Hollow decree", "Crown of ruin", "Last eclipse"],
    };
    return {
      kind: "strike",
      label: names[s.floor]?.[e.stage] || "Guardian strike",
      targets: all ? alive.map((c) => c.id) : target ? [target.id] : [],
      power: round % 3 === 2 ? 1.45 + e.stage * 0.15 : 0.8,
    };
  }
  if (
    e.archetype === "support" &&
    s.combat?.enemies.some((n) => n.hp > 0 && n.hp < n.maxHp * 0.7)
  )
    return { kind: "heal", label: "Mend wounded ally", targets: [], power: 0 };
  if (e.archetype === "defender" && round % 3 === 1)
    return {
      kind: "guard",
      label: "Brace allied ranks",
      targets: [],
      power: 0,
    };
  if (e.archetype === "bruiser" && round % 3 === 1)
    return {
      kind: "charge",
      label: "Wind up heavy blow",
      targets: [],
      power: 0,
    };
  if (e.archetype === "caster" && round % 3 === 2)
    return {
      kind: "strike",
      label: `${e.element} volley`,
      targets: alive.map((c) => c.id),
      power: 0.65,
    };
  return {
    kind: "strike",
    label:
      e.archetype === "skirmisher"
        ? "Hunt the wounded"
        : e.charged
          ? "Crushing blow"
          : `${e.element} strike`,
    targets: target ? [target.id] : [],
    power: e.charged ? 1.7 : 1,
  };
}
export function validateQueue(s: Game, a: RoundRequest): string {
  const combat = s.combat;
  if (
    s.phase !== "combat" ||
    !combat ||
    combat.complete ||
    a.battleId !== combat.id ||
    a.round !== combat.round
  )
    return "This round has already resolved.";
  if (a.flee) return a.actions.length ? "Retreat uses the whole round." : "";
  const ready = s.party.filter((c) => c.hp > 0 && !c.ailments.paralysis),
    ids = a.actions.map((q) => q.actor);
  if (
    ids.length !== ready.length ||
    new Set(ids).size !== ids.length ||
    ready.some((c) => !ids.includes(c.id))
  )
    return "Queue one action for every standing, unimpeded companion.";
  let burst = 0;
  const items: Record<string, number> = {};
  for (const q of a.actions) {
    const actor = ready.find((c) => c.id === q.actor);
    if (!actor) return "That companion cannot act.";
    if (
      !["attack", "skill", "guard", "focus", "item", "burst"].includes(q.kind)
    )
      return "Unknown action.";
    if (q.kind === "skill") {
      const spec = SKILLS.find((k) => k.name === q.skill);
      if (
        !spec ||
        spec.passive ||
        !actor.skills.includes(spec.name) ||
        actor.mp < spec.cost ||
        (actor.cooldowns[spec.name] || 0) > 0
      )
        return "A queued skill is unavailable.";
    }
    const friendly = q.kind === "item" || q.kind === "guard";
    if (friendly && !s.party.some((c) => c.id === q.target && c.hp > 0))
      return "Select a standing ally for items and Guard.";
    if (
      ["attack", "burst"].includes(q.kind) ||
      (q.kind === "skill" && q.skill !== "Second Wind")
    )
      if (!combat.enemies.some((e) => e.id === q.target && e.hp > 0))
        return "Select a living enemy.";
    if (q.kind === "burst") burst += 2;
    if (q.kind === "item") {
      const id = q.item || "";
      if (
        !["potion", "greater-potion", "ether", "antidote", "bandage"].includes(
          id,
        )
      )
        return "Unknown item.";
      items[id] = (items[id] || 0) + 1;
    }
  }
  if (burst > s.momentum) return "Queued bursts exceed available momentum.";
  for (const [id, count] of Object.entries(items))
    if (count > (id === "potion" ? s.potions : s.inventory[id] || 0))
      return "Queued items exceed your shared supplies.";
  return "";
}
export function resolveRound(s: Game, a: RoundRequest): Game {
  const invalid = validateQueue(s, a);
  if (invalid) return { ...s, message: invalid };
  const before = s,
    combat = s.combat!;
  let next: Game = {
    ...s,
    party: s.party.map((c) => ({
      ...c,
      ailments: { ...c.ailments },
      cooldowns: { ...c.cooldowns },
      mastery: { ...c.mastery },
      battleMastery: { ...c.battleMastery },
    })),
    combat: { ...combat, enemies: combat.enemies.map((e) => ({ ...e })) },
  };
  const events: RoundEvent[] = [],
    guards = new Set<string>(),
    enemySkipped = new Set<string>(),
    skipped = new Set<string>(),
    cast = new Set<string>();
  const emit = (
    actor: string,
    target: string,
    text: string,
    kind: string,
    action?: QueuedAction,
  ) =>
    events.push({
      action,
      id: `${combat.id}:${combat.round}:${events.length}`,
      actor,
      target,
      text,
      kind,
      party: next.party.map((c) => ({ ...c, ailments: { ...c.ailments } })),
      enemies: next.combat!.enemies.map((e) => ({ ...e })),
      effects: { ...next.effects },
    });
  const intents = Object.fromEntries(
    combat.enemies
      .filter((e) => e.hp > 0)
      .map((e) => [e.id, enemyIntent(s, e)]),
  );
  for (const entry of initiative(s)) {
    if (
      next.party.every((c) => c.hp <= 0) ||
      next.combat!.enemies.every((e) => e.hp <= 0)
    )
      break;
    next = {
      ...next,
      effects: {
        id: next.effects.id + 1,
        damage: 0,
        enemyDamage: 0,
        critical: false,
        kind: "round",
        target: "",
        poisonDamage: 0,
        stunned: false,
        targets: {},
        strikes: {},
        healing: {},
        broken: false,
      },
    };
    if (entry.enemy) {
      const enemy = next.combat!.enemies.find((e) => e.id === entry.id)!;
      if (enemy.hp <= 0) continue;
      if (enemy.broken || enemy.paralysis) {
        enemySkipped.add(enemy.id);
        enemy.controlWard = 3;
        enemy.charged = false;
        emit(enemy.id, "", `${enemy.name} is interrupted.`, "interrupt");
        continue;
      }
      const intent = intents[enemy.id];
      if (intent.kind === "heal") {
        const target = [...next.combat!.enemies]
          .filter((e) => e.hp > 0)
          .sort(
            (a, b) =>
              a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
          )[0];
        target.hp = Math.min(
          target.maxHp,
          target.hp + Math.round(target.maxHp * 0.18),
        );
        emit(
          enemy.id,
          target.id,
          `${enemy.name} mends ${target.name}.`,
          "heal",
        );
        continue;
      }
      if (intent.kind === "guard") {
        for (const ally of next.combat!.enemies.filter((e) => e.hp > 0))
          ally.guard += 3;
        emit(
          enemy.id,
          "",
          `${enemy.name} braces allied ranks (+3 armor this round).`,
          "guard",
        );
        continue;
      }
      if (intent.kind === "charge") {
        enemy.charged = true;
        emit(enemy.id, "", `${enemy.name}: ${intent.label}.`, "charge");
        continue;
      }
      const targetIds = intent.targets.filter((id) =>
        next.party.some((c) => c.id === id && c.hp > 0),
      );
      if (!targetIds.length) {
        const alive = next.party.find((c) => c.hp > 0);
        if (alive) targetIds.push(alive.id);
      }
      for (const id of targetIds) {
        const old = next;
        let target = next.party.find((c) => c.id === id)!;
        const raw =
          Math.max(
            2,
            enemy.atk * intent.power -
              (target.def * (1 - target.exhaustion * 0.0015) +
                (target.traitRevealed &&
                target.trait === "Last Stand" &&
                target.hp / target.maxHp < 0.35
                  ? 8
                  : 0)) *
                0.6,
          ) *
          (1 - resist(target, enemy.element) / 100) *
          (enemy.element === "physical" &&
          next.party.some(
            (c) => c.hp > 0 && c.traitRevealed && c.trait === "Vanguard",
          )
            ? 0.85
            : 1) *
          (guards.has(id) ? 0.5 : 1) *
          (enemy.weakened ? 1 - enemy.weakened : 1);
        const barrier = target.ailments.barrier || 0,
          hit = Math.max(0, Math.round(raw) - barrier);
        target = {
          ...target,
          hp: Math.max(0, target.hp - hit),
          exhaustion: Math.min(100, target.exhaustion + 1),
          ailments: {
            ...target.ailments,
            barrier: Math.max(0, barrier - Math.round(raw)),
          },
        };
        const ward: Skill =
          enemy.element === "fire"
            ? "Ember Ward"
            : enemy.element === "frost"
              ? "Winter Veil"
              : enemy.element === "venom"
                ? "Toxic Adaptation"
                : "Grave Guard";
        if (
          target.hp > 0 &&
          target.skills.includes(ward) &&
          skillRank(target, ward) >= 2
        ) {
          target.hp = Math.min(target.maxHp, target.hp + 5);
          if (skillRank(target, ward) === 3)
            target.mp = Math.min(target.maxMp, target.mp + 3);
        }
        if (target.hp > 0 && !target.ailments.ward) {
          if (
            enemy.element === "venom" &&
            !target.skills.includes("Toxic Adaptation")
          )
            target.ailments.poison = 2;
          const protection: Skill | undefined =
            enemy.element === "frost"
              ? "Winter Veil"
              : enemy.element === "fire"
                ? "Ember Ward"
                : enemy.element === "physical"
                  ? "Grave Guard"
                  : undefined;
          if (
            intent.power > 1 &&
            protection &&
            !(target.traitRevealed && target.trait === "Iron Will") &&
            !(
              target.skills.includes(protection) &&
              skillRank(target, protection) >= 2
            )
          )
            target.ailments.paralysis = 1;
        }
        next = {
          ...next,
          party: next.party.map((c) => (c.id === id ? target : c)),
          enemy,
          effects: {
            ...next.effects,
            id: next.effects.id + 1,
            enemyDamage: hit,
            damage: 0,
            targets: { [id]: hit },
            strikes: {},
          },
        };
        next = earnMastery(next, { ...old, enemy }, enemy.id);
        emit(
          enemy.id,
          id,
          `${enemy.name} → ${target.name}: ${hit} ${enemy.element} damage${guards.has(id) ? " (guarded)" : ""}.`,
          "strike",
        );
      }
      enemy.charged = false;
      enemy.weakened = 0;
      continue;
    }
    const actor = next.party.find((c) => c.id === entry.id)!;
    if (actor.hp <= 0 || a.flee) continue;
    if (actor.ailments.paralysis) {
      skipped.add(actor.id);
      emit(actor.id, "", `${actor.name} cannot act.`, "interrupt");
      continue;
    }
    const q = a.actions.find((q) => q.actor === actor.id);
    if (!q) {
      emit(
        actor.id,
        "",
        `${actor.name} recovers, ready for the next round.`,
        "recover",
      );
      continue;
    }
    const target = next.party.find((c) => c.id === q.target && c.hp > 0);
    if (q.kind === "guard") {
      if (target) {
        guards.add(target.id);
        next.momentum = Math.min(3, next.momentum + 1);
        emit(
          actor.id,
          target.id,
          `${actor.name} guards ${target.name}.`,
          "guard",
          q,
        );
      }
      continue;
    }
    if (q.kind === "focus") {
      const gain = Math.min(20, actor.maxMp - actor.mp);
      actor.mp += gain;
      next.momentum = Math.min(3, next.momentum + 1);
      emit(
        actor.id,
        actor.id,
        `${actor.name} focuses: +${gain} MP.`,
        "focus",
        q,
      );
      continue;
    }
    if (q.kind === "item") {
      const id = q.item!,
        useful =
          target &&
          (id === "ether"
            ? target.mp < target.maxMp
            : id === "antidote"
              ? target.ailments.poison > 0 || target.ailments.paralysis > 0
              : target.hp < target.maxHp ||
                (id === "bandage" && target.ailments.poison > 0));
      if (!useful) {
        emit(
          actor.id,
          q.target || "",
          `${actor.name}'s ${id} is no longer needed; it is kept.`,
          "cancel",
        );
        continue;
      }
      const priorHp = target.hp;
      if (id === "potion") next.potions--;
      else next.inventory = { ...next.inventory, [id]: next.inventory[id] - 1 };
      if (id === "ether") target.mp = Math.min(target.maxMp, target.mp + 30);
      else if (id === "antidote")
        target.ailments = {
          ...target.ailments,
          poison: 0,
          paralysis: 0,
          ward: 2,
        };
      else {
        target.hp = Math.min(
          target.maxHp,
          target.hp +
            (id === "greater-potion" ? 120 : id === "bandage" ? 90 : 65),
        );
        if (id === "bandage") target.ailments.poison = 0;
      }
      next.effects = {
        ...next.effects,
        healing: { [target.id]: Math.max(0, target.hp - priorHp) },
      };
      emit(
        actor.id,
        target.id,
        `${actor.name} uses ${id} on ${target.name}.`,
        "item",
        q,
      );
      continue;
    }
    const foe =
      next.combat!.enemies.find((e) => e.id === q.target && e.hp > 0) ||
      next.combat!.enemies.find((e) => e.hp > 0);
    if (!foe) continue;
    if (
      q.kind === "skill" &&
      q.skill === "Second Wind" &&
      !next.party.some(
        (c) =>
          c.hp > 0 &&
          (c.hp < c.maxHp ||
            c.ailments.poison > 0 ||
            (skillRank(actor, "Second Wind") === 3 &&
              (c.ailments.barrier || 0) < c.maxHp * 0.1)),
      )
    ) {
      emit(
        actor.id,
        "",
        `${actor.name}'s healing is no longer needed; MP is kept.`,
        "cancel",
      );
      continue;
    }
    const draw = nextRandom(next.rng.combat);
    next = { ...next, rng: { ...next.rng, combat: draw.seed }, enemy: foe };
    next = resolveBattle(
      next,
      {
        type: "BATTLE",
        kind: q.kind,
        actor: q.actor,
        skill: q.skill,
        roll: draw.roll,
      },
      (state) => state,
      true,
    );
    next.combat = {
      ...next.combat!,
      enemies: next.combat!.enemies.map((e) =>
        e.id === foe.id ? { ...e, ...next.enemy } : e,
      ),
    };
    const used = next.party.find((c) => c.id === actor.id)!;
    used.exhaustion = Math.min(
      100,
      used.exhaustion + (q.kind === "skill" ? 2 : 1),
    );
    if (q.kind === "skill") cast.add(`${actor.id}:${q.skill}`);
    emit(
      actor.id,
      foe.id,
      `${actor.name}: ${q.kind === "skill" ? q.skill : q.kind} → ${foe.name}, ${next.effects.damage} damage.`,
      q.kind,
      q,
    );
  }
  // Status durations and cooldowns advance exactly once after the complete initiative queue.
  next.party = next.party.map((c) => {
    let hp = c.hp;
    if (hp > 0 && c.ailments.poison)
      hp = Math.max(
        0,
        hp -
          Math.max(
            2,
            Math.round(c.maxHp * 0.05 * (1 - resist(c, "venom") / 100)),
          ),
      );
    return {
      ...c,
      hp,
      ailments: {
        ...c.ailments,
        poison: Math.max(0, c.ailments.poison - 1),
        paralysis: skipped.has(c.id)
          ? Math.max(0, c.ailments.paralysis - 1)
          : c.ailments.paralysis,
        ward: Math.max(0, (c.ailments.ward || 0) - 1),
      },
      cooldowns: Object.fromEntries(
        Object.entries(c.cooldowns).map(([skill, n]) => [
          skill,
          cast.has(`${c.id}:${skill}`) ? n : Math.max(0, (n || 0) - 1),
        ]),
      ),
    };
  });
  next.combat!.enemies = next.combat!.enemies.map((e) => {
    const original = combat.enemies.find((o) => o.id === e.id)!;
    let hp = e.hp;
    if (hp > 0 && e.poison)
      hp = Math.max(
        0,
        hp -
          Math.round(
            e.maxHp *
              0.06 *
              (e.boss ? 0.5 : 1) *
              (e.poisonPower || 1) *
              (next.party.some(
                (c) =>
                  c.hp > 0 && c.traitRevealed && c.trait === "Venom Savant",
              )
                ? 1.5
                : 1),
          ),
      );
    const stage = e.boss
      ? s.floor === 12
        ? hp / e.maxHp <= 0.33
          ? 2
          : hp / e.maxHp <= 0.66
            ? 1
            : 0
        : hp / e.maxHp <= 0.5
          ? 1
          : 0
      : 0;
    if (stage > e.stage && hp > 0)
      emit(
        e.id,
        "",
        `${e.name} changes phase. New intents will be announced before the next round.`,
        "phase",
      );
    const broken = Math.max(0, e.broken - 1);
    return {
      ...e,
      hp,
      stage,
      guard: original.guard,
      poison: Math.max(0, e.poison - 1),
      paralysis: enemySkipped.has(e.id)
        ? Math.max(0, e.paralysis - 1)
        : e.paralysis,
      broken,
      poise: e.broken && !broken ? e.maxPoise : e.poise,
      controlWard: Math.max(0, e.controlWard - 1),
      vulnerable: Math.max(0, (e.vulnerable || 0) - 1),
      slowTurns: Math.max(0, (e.slowTurns || 0) - 1),
      slowed: (e.slowTurns || 0) > 1 ? e.slowed : 0,
    };
  });
  next.combat = {
    ...next.combat!,
    round: combat.round + 1,
    mastery: Object.fromEntries(next.party.map((c) => [c.id, c.battleMastery])),
    complete: next.combat!.enemies.every((e) => e.hp <= 0),
  };
  next = {
    ...next,
    turn: next.combat.round,
    enemy: next.combat.enemies.find((e) => e.hp > 0) || next.combat.enemies[0],
    expedition: {
      ...next.expedition,
      rounds: next.expedition.rounds + 1,
      battles: { ...next.expedition.battles, [combat.id]: next.combat },
    },
    phase: next.party.every((c) => c.hp <= 0) ? "defeat" : "combat",
    message: "",
  };
  emit("", "", `Round ${combat.round} ends.`, "round");
  if (a.flee && next.phase !== "defeat" && !next.combat!.complete) {
    const destination =
      backRoom(next) || Object.values(currentRoom(next).exits)[0];
    if (destination) {
      const records = next.expedition.battles;
      next = enterMappedRoom(
        {
          ...next,
          combat: null,
          journey: { ...next.journey, defender: false },
        },
        destination,
      );
      next = {
        ...next,
        expedition: { ...next.expedition, battles: records },
        message:
          "You retreat through the connected passage after the enemy responses. Their remaining HP is saved.",
      };
    }
  }
  const attacks = events.filter(
    (event) =>
      event.action && ["attack", "skill", "burst"].includes(event.action.kind),
  );
  const strikes: Record<string, number> = {},
    targets: Record<string, number> = {};
  for (const event of attacks)
    for (const [id, n] of Object.entries(event.effects.strikes || {}))
      strikes[id] = (strikes[id] || 0) + n;
  for (const event of events.filter(
    (event) => event.kind === "strike" && !event.action,
  ))
    for (const [id, n] of Object.entries(event.effects.targets))
      targets[id] = (targets[id] || 0) + n;
  next.effects = {
    ...next.effects,
    id: Math.max(next.effects.id, s.effects.id + 1),
    damage: attacks.reduce((n, event) => n + event.effects.damage, 0),
    enemyDamage: Object.values(targets).reduce((n, x) => n + x, 0),
    strikes,
    targets,
  };
  return {
    ...next,
    roundPlayback: a.animate
      ? { before: { ...before, roundPlayback: null, playback: null }, events }
      : null,
  };
}
export const enemyReward = (enemy: Enemy, floor: number) =>
  monsterFor(enemy, floor);
