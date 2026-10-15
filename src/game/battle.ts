import { buildDamage, healingBuild, skillCost } from "./build-equipment";
import { fatigueMultiplier } from "./exhaustion";
import { applyCondition, cleanse, stacks } from "./combat-status";
import { SKILLS, resist } from "./combat-data";
import { earnMastery, potency, skillRank } from "./progression";
import type { Action, BattleEffect, Character, Enemy, Game } from "./engine";

export type BattleAction = Extract<Action, { type: "BATTLE" }>;
type Win = (
  s: Game,
  party: Character[],
  enemy: Enemy,
  effects: BattleEffect,
  logs: string[],
  potions: number,
  inventory: Record<string, number>,
) => Game;
export type Intent = {
  kind: "strike" | "charge" | "heavy" | "recovery" | "interrupted";
  label: string;
  targets: string[];
  power: number;
};

/** Intent is decided before a player acts. Random critical rolls never change its targets. */
export function battleIntent(s: Game): Intent {
  const e = s.enemy,
    alive = s.party.filter((c) => c.hp > 0);
  if (!e || !alive.length)
    return { kind: "interrupted", label: "No target", targets: [], power: 0 };
  if (e.broken > 0 || e.paralysis > 0)
    return {
      kind: "interrupted",
      label: e.broken > 0 ? "BROKEN · +30% damage" : "Interrupted",
      targets: [],
      power: 0,
    };
  const beat = (s.turn - 1) % 4;
  if (beat === 1)
    return {
      kind: "charge",
      label: `Charging ${e.intent}`,
      targets: [],
      power: 0,
    };
  if (beat === 3)
    return {
      kind: "recovery",
      label: "Recovering · +20% damage",
      targets: [],
      power: 0,
    };
  const target = alive[(s.turn + s.floor - 2) % alive.length];
  if (beat === 2) {
    const targets = e.boss
      ? alive.map((c) => c.id)
      : s.sideBattle
        ? [target.id, alive[(alive.indexOf(target) + 1) % alive.length].id]
        : [target.id];
    return {
      kind: "heavy",
      label: e.intent,
      targets: [...new Set(targets)],
      power: (e.boss ? 1.35 : 1.6) * (e.charged ? 1 : 0.65),
    };
  }
  return {
    kind: "strike",
    label: `${e.element} strike`,
    targets: [target.id],
    power: 1,
  };
}

function hitDamage(
  s: Game,
  c: Character,
  power: number,
  guard: boolean,
): number {
  const e = s.enemy!;
  const lastStand =
    c.traitRevealed && c.trait === "Last Stand" && c.hp / c.maxHp < 0.35
      ? 8
      : 0;
  let n =
    Math.max(
      6,
      e.atk * power -
        (c.def * (1 - (c.exhaustion || 0) * 0.0015) + lastStand) * 0.55,
    ) *
    (1 - resist(c, e.element) / 100);
  if (
    e.element === "physical" &&
    s.party.some((x) => x.hp > 0 && x.traitRevealed && x.trait === "Vanguard")
  )
    n *= 0.85;
  if (guard) n *= 0.5;
  if (e.weakened) n *= 1 - e.weakened;
  n = Math.max(0, n - (c.ailments.barrier || 0));
  return Math.round(n);
}
export function battleForecast(
  s: Game,
  guard = false,
  actorId?: string,
): Record<string, number> {
  const intent = battleIntent(s);
  let ids = intent.targets;
  const tank = s.party.find(
    (c) => c.id === actorId && c.hp > 0 && !c.ailments.paralysis,
  );
  if (guard && ids.length === 1 && tank) ids = [tank.id];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      hitDamage(
        s,
        s.party.find((c) => c.id === id)!,
        intent.power,
        guard,
      ),
    ]),
  );
}

export function resolveBattle(
  s: Game,
  a: BattleAction,
  won: Win,
  singleActor = false,
): Game {
  if (!Number.isFinite(a.roll)) return s;
  const roll = Math.max(0, Math.min(0.999999, a.roll)),
    intent = battleIntent(s);
  const actor =
    s.party.find((c) => c.id === a.actor && c.hp > 0) ||
    s.party.find((c) => c.hp > 0);
  if (!actor) return { ...s, phase: "defeat" };
  const skill =
    a.skill ||
    actor.skills.find((k) => !SKILLS.find((x) => x.name === k)?.passive);
  const spec = SKILLS.find((x) => x.name === skill);
  const family = spec?.family || skill;
  const rank = skill ? skillRank(actor, skill) : 1;
  const power = skill ? potency(actor, skill) : 1;
  const reject = (message: string) => ({ ...s, message });
  if (
    a.kind === "skill" &&
    (!skill ||
      !spec ||
      !actor.skills.includes(skill) ||
      spec.passive ||
      actor.mp < skillCost(actor, spec.name, spec.cost))
  )
    return reject("Choose a learned active skill with enough MP.");
  if (a.kind === "skill" && (actor.cooldowns[skill!] || 0) > 0)
    return reject("This skill is cooling down.");
  if (
    (a.kind === "skill" || a.kind === "focus" || a.kind === "guard") &&
    actor.ailments.paralysis > 0
  )
    return reject("Select an ally who is not paralysed.");
  if (a.kind === "burst" && s.momentum < 2)
    return reject("You need 2 momentum for a burst.");
  const id = a.item || "potion";
  if (
    a.kind === "item" &&
    (!["potion", "greater-potion", "antidote", "ether", "bandage"].includes(
      id,
    ) ||
      (id === "potion" ? s.potions < 1 : !(s.inventory[id] > 0)))
  )
    return reject("You do not have that item.");
  let party = s.party.map((c) => ({
    ...c,
    ailments: { ...c.ailments },
    cooldowns: Object.fromEntries(
      Object.entries(c.cooldowns).map(([k, v]) => [
        k,
        Math.max(0, (v || 0) - (singleActor ? 0 : 1)),
      ]),
    ),
  }));
  let enemy = { ...s.enemy! },
    potions = s.potions,
    inventory = { ...s.inventory },
    momentum = s.momentum;
  let damage = 0,
    absorbed = 0,
    poisonDamage = 0,
    critical = false,
    broken = false,
    stunned = false,
    poiseDamage = 0;
  const logs: string[] = [];
  const targets: Record<string, number> = {};
  const strikes: Record<string, number> = {};
  if (a.kind === "item") {
    if (id === "potion") potions--;
    else inventory[id]--;
    party = party.map((c) => {
      if (c.hp <= 0) return c;
      if (id === "bandage")
        return c.id === actor.id
          ? {
              ...c,
              hp: Math.min(c.maxHp, c.hp + 90),
              ailments: { ...c.ailments, poison: 0 },
            }
          : c;
      if (id === "potion" || id === "greater-potion")
        return {
          ...c,
          hp: Math.min(c.maxHp, c.hp + (id === "potion" ? 65 : 120)),
        };
      if (id === "ether") return { ...c, mp: Math.min(c.maxMp, c.mp + 30) };
      return { ...c, ailments: { poison: 0, paralysis: 0, ward: 2 } };
    });
    logs.push(
      id === "bandage"
        ? actor.name + " is bandaged: +90 HP; poison cleansed."
        : id === "ether"
          ? "Moondew restores 30 MP to each ally."
          : id === "antidote"
            ? "Silverleaf clears ailments and wards for 2 turns."
            : `Healing mist restores ${id === "potion" ? 65 : 120} HP to each ally.`,
    );
  } else if (a.kind === "guard") {
    momentum = Math.min(3, momentum + 1);
    party = party.map((c) =>
      c.hp > 0 ? { ...c, mp: Math.min(c.maxMp, c.mp + 4) } : c,
    );
    logs.push(`${actor.name} guards. Half damage; +4 party MP; +1 momentum.`);
  } else {
    if (a.kind === "focus") {
      momentum = Math.min(3, momentum + 1);
      logs.push(`${actor.name} focuses: +20 MP; +1 momentum.`);
    }
    if (a.kind === "attack") momentum = Math.min(3, momentum + 1);
    if (a.kind === "burst") {
      momentum -= 2;
      logs.push("Burst: −2 momentum; +35% party damage; 50 break damage.");
    }
    const inspirer = party.find(
      (c) => c.hp > 0 && c.skills.includes("Inspiring Presence"),
    );
    const inspireRank = inspirer
      ? skillRank(inspirer, "Inspiring Presence")
      : 0;
    const inspire = inspirer ? 1.15 + (inspireRank - 1) * 0.02 : 1;
    const opening =
      enemy.broken > 0 ? 1.3 : intent.kind === "recovery" ? 1.2 : 1;
    party = party.map((c) => {
      if (
        c.hp <= 0 ||
        c.ailments.paralysis > 0 ||
        (singleActor && c.id !== actor.id)
      )
        return c;
      if (a.kind === "focus" && c.id === actor.id)
        return { ...c, mp: Math.min(c.maxMp, c.mp + 20) };
      const cast = a.kind === "skill" && c.id === actor.id;
      let mult = cast
        ? family === "Twin Strike"
          ? 2
          : family === "Shield Bash"
            ? 1.4
            : family === "Nerve Lock"
              ? 1.1
              : family === "Arcane Bolt"
                ? 1.65
                : family === "Second Wind"
                  ? 0
                  : family === "Sunder"
                    ? 1.45
                    : family === "Crown Pulse"
                      ? 1.35
                      : family === "Sling Shot"
                        ? 1.1
                        : family === "Scavenge"
                          ? 0.85
                          : 1
        : a.kind === "burst"
          ? 1.35
          : a.kind === "focus"
            ? 0.55
            : 1;
      if (cast) mult *= power;
      if (
        cast &&
        family === "Venom Fang" &&
        (enemy.poison || stacks(enemy.conditions, "venom"))
      )
        mult *= 1.2;
      if (
        cast &&
        spec?.bonusVsStatus &&
        (stacks(enemy.conditions, spec.bonusVsStatus) ||
          (spec.bonusVsStatus === "chilled" &&
            stacks(enemy.conditions, "frozen")))
      )
        mult *= 1 + (spec.bonus || 0);
      if (
        c.skills.includes("Winter Veil") &&
        (stacks(enemy.conditions, "chilled") ||
          stacks(enemy.conditions, "frozen"))
      )
        mult *= 1.15;

      mult *=
        (1 - stacks(c.ailments.conditions, "weakened") * 0.2) *
        (1 + stacks(enemy.conditions, "exposed") * 0.15);
      if (enemy.vulnerable) mult *= 1.1;
      if (
        c.traitRevealed &&
        c.hp / c.maxHp < 0.4 &&
        (c.trait === "Blood Rage" || c.trait === "Reckless Heart")
      )
        mult *= c.trait === "Reckless Heart" ? 1.35 : 1.25;
      const crit =
        mult > 0 &&
        roll >
          1 - Math.min(0.26, 0.06 + c.speed * fatigueMultiplier(c) * 0.005) &&
        c.id === actor.id;
      if (crit) {
        mult *= 1.5;
        critical = true;
      }
      const armor =
        enemy.broken > 0 || (cast && family === "Arcane Bolt")
          ? 0
          : enemy.guard *
            (1 - stacks(enemy.conditions, "fractured") * 0.1) *
            (cast && family === "Sling Shot" ? 0.5 : 1) *
            (c.traitRevealed && c.trait === "Moon Sight" ? 0.5 : 1);
      const element = cast
        ? spec?.element ||
          (family === "Venom Fang"
            ? "venom"
            : family === "Crown Pulse"
              ? "fire"
              : "physical")
        : "physical";
      const elementPower =
        (1 - (enemy.resistances?.[element] || 0) / 100) *
        (enemy.weaknesses?.includes(element) ? 1.2 : 1);
      const hit =
        mult > 0
          ? Math.max(
              2,
              Math.round(
                (c.atk * fatigueMultiplier(c) * mult * inspire * opening -
                  armor) *
                  elementPower *
                  buildDamage(c, cast ? skill : undefined, element, enemy) *
                  (enemy.concealed &&
                  !enemy.broken &&
                  !enemy.vulnerable &&
                  !stacks(enemy.conditions, "exposed")
                    ? 0.65
                    : 1),
              ),
            )
          : 0;
      damage += hit;
      if (hit > 0) strikes[c.id] = hit;
      if (hit > 0 && inspireRank >= 2)
        c = {
          ...c,
          mp: Math.min(c.maxMp, c.mp + inspireRank - 1),
          hp: Math.min(c.maxHp, c.hp + (inspireRank === 3 ? 2 : 0)),
        };
      if (!cast) return c;
      logs.push(`${c.name} uses ${skill}.`);
      if (
        spec?.status &&
        !(enemy.controlWard && ["chilled", "entangled"].includes(spec.status))
      )
        enemy.conditions = applyCondition(
          enemy.conditions,
          spec.status,
          s.combat?.round || s.turn,
        );
      if (spec?.barrier && family !== "Second Wind")
        c = {
          ...c,
          ailments: {
            ...c.ailments,
            barrier: Math.max(
              c.ailments.barrier || 0,
              Math.round(spec.barrier * power),
            ),
            candleOwner: undefined,
          },
        };
      if (family === "Venom Fang") {
        enemy.poison = 3;
        enemy.poisonPower = power;
      }
      if ((family === "Shield Bash" || family === "Nerve Lock") && rank >= 2)
        enemy.weakened = rank === 3 ? 0.2 : 0.1;
      if (
        singleActor &&
        (family === "Shield Bash" || family === "Nerve Lock") &&
        rank >= 2
      ) {
        enemy.slowed = rank;
        enemy.slowTurns = 3;
      }
      if (family === "Sunder") enemy.weakened = 0.1 + (rank - 1) * 0.05;
      if (family === "Sling Shot") enemy.weakened = 0.1 + (rank - 1) * 0.05;
      if (
        rank === 3 &&
        ![
          "Second Wind",
          "Crown Pulse",
          "Scavenge",
          "Shield Bash",
          "Nerve Lock",
        ].includes(family!)
      )
        enemy.vulnerable = 3;
      const interrupt =
        enemy.controlWard === 0 &&
        ((family === "Nerve Lock" && (enemy.boss ? roll < 0.5 : true)) ||
          (family === "Shield Bash" && roll < (enemy.boss ? 0.3 : 0.55)) ||
          (family === "Twin Strike" && roll < (enemy.boss ? 0.1 : 0.25)));
      if (interrupt) enemy.paralysis = 1;
      return {
        ...c,
        mp: spec?.mpGain
          ? Math.min(
              c.maxMp,
              c.mp - skillCost(c, spec.name, spec.cost) + spec.mpGain,
            )
          : c.mp - skillCost(c, spec!.name, spec!.cost),
        cooldowns: { ...c.cooldowns, [skill!]: spec!.cooldown || 0 },
        ailments:
          family === "Second Wind" ? { poison: 0, paralysis: 0 } : c.ailments,
      };
    });
    if (
      a.kind === "skill" &&
      (family === "Second Wind" || family === "Crown Pulse")
    )
      party = party.map((c) =>
        c.hp > 0
          ? {
              ...c,
              hp: Math.min(
                c.maxHp,
                c.hp +
                  Math.round(
                    c.maxHp *
                      (family === "Second Wind" ? 0.22 : 0.1) *
                      power *
                      healingBuild(actor),
                  ),
              ),
              ailments: {
                ...c.ailments,
                poison: rank >= 2 ? 0 : c.ailments.poison,
                conditions:
                  rank >= 2
                    ? cleanse(c.ailments.conditions, "healing")
                    : c.ailments.conditions,
                barrier:
                  rank === 3 ? Math.round(c.maxHp * 0.1) : c.ailments.barrier,
                candleOwner: rank === 3 ? undefined : c.ailments.candleOwner,
              },
            }
          : c,
      );
    if (a.kind === "skill" && family === "Scavenge")
      party = party.map((c) =>
        c.id !== actor.id
          ? c
          : {
              ...c,
              hp: Math.min(c.maxHp, c.hp + Math.round(c.maxHp * 0.12 * power)),
              ailments: {
                ...c.ailments,
                poison: rank >= 2 ? 0 : c.ailments.poison,
                conditions:
                  rank >= 2
                    ? cleanse(c.ailments.conditions, "healing")
                    : c.ailments.conditions,
                barrier:
                  rank === 3 ? Math.round(c.maxHp * 0.1) : c.ailments.barrier,
                candleOwner: rank === 3 ? undefined : c.ailments.candleOwner,
              },
            },
      );
    if (a.kind === "skill" && family === "Second Wind" && spec?.barrier)
      party = party.map((c) =>
        c.hp > 0
          ? {
              ...c,
              ailments: {
                ...c.ailments,
                barrier: Math.max(
                  c.ailments.barrier || 0,
                  Math.round(spec.barrier! * power),
                ),
                candleOwner: undefined,
              },
            }
          : c,
      );
    poiseDamage =
      a.kind === "burst"
        ? 50
        : a.kind === "attack"
          ? 10
          : a.kind === "focus"
            ? 4
            : family === "Shield Bash"
              ? 38
              : family === "Nerve Lock"
                ? 45
                : family === "Arcane Bolt"
                  ? 18
                  : family === "Twin Strike"
                    ? 22
                    : family === "Venom Fang"
                      ? 12
                      : family === "Sunder"
                        ? 35
                        : family === "Crown Pulse"
                          ? 15
                          : family === "Sling Shot"
                            ? 16
                            : family === "Scavenge"
                              ? 8
                              : 0;
    if (
      a.kind === "skill" &&
      !["Second Wind", "Crown Pulse", "Scavenge"].includes(family!)
    )
      poiseDamage += ["Shield Bash", "Nerve Lock"].includes(family!)
        ? rank === 3
          ? 10
          : 0
        : (rank - 1) * 10;
    if (
      a.kind === "skill" &&
      family === "Sunder" &&
      actor.equipment.includes("iron-pike")
    )
      poiseDamage += 10;
    if (
      enemy.broken === 0 &&
      (!singleActor || enemy.controlWard === 0) &&
      poiseDamage > 0
    ) {
      enemy.poise = Math.max(0, enemy.poise - poiseDamage);
      if (enemy.poise === 0) {
        enemy.broken = 2;
        enemy.shield = 0;
        enemy.charged = false;
        broken = true;
        logs.push("BREAK · Attack interrupted. +30% damage until it recovers.");
      }
    }
    absorbed = Math.min(enemy.shield || 0, damage);
    enemy.shield = Math.max(0, (enemy.shield || 0) - absorbed);
    enemy.hp = Math.max(0, enemy.hp - (damage - absorbed));
    if (damage > 0)
      logs.push(
        `Party deals ${damage}${critical ? " · CRITICAL" : ""} damage.`,
      );
  }
  if (singleActor) {
    const effects: BattleEffect = {
      absorbed,
      id: s.effects.id + 1,
      damage,
      enemyDamage: 0,
      critical,
      kind: a.kind,
      target: actor.id,
      poisonDamage: 0,
      stunned: enemy.paralysis > 0,
      targets: {},
      strikes,
      broken,
      healing: Object.fromEntries(
        party.map((c) => [
          c.id,
          Math.max(0, c.hp - (s.party.find((p) => p.id === c.id)?.hp || 0)),
        ]),
      ),
    };
    return earnMastery(
      {
        ...s,
        party,
        enemy,
        inventory,
        potions,
        momentum,
        effects,
        message: "",
        log: [...logs, ...s.log].slice(0, 10),
      },
      s,
      actor.id,
      a.kind === "skill" ? skill : undefined,
    );
  }
  // An already paralysed ally loses one action; newly inflicted paralysis lasts into the next turn.
  party = party.map((c) => ({
    ...c,
    ailments: {
      ...c.ailments,
      paralysis: Math.max(0, c.ailments.paralysis - 1),
    },
  }));
  if (enemy.poison > 0 && enemy.hp > 0) {
    const savant = party.some(
      (c) => c.hp > 0 && c.traitRevealed && c.trait === "Venom Savant",
    );
    poisonDamage = Math.round(
      enemy.maxHp *
        0.06 *
        (enemy.boss ? 0.5 : 1) *
        (savant ? 1.5 : 1) *
        (enemy.poisonPower || 1),
    );
    enemy.hp = Math.max(0, enemy.hp - poisonDamage);
    enemy.poison--;
    logs.push(`Venom deals ${poisonDamage} damage.`);
  }
  const effects: BattleEffect = {
    id: s.effects.id + 1,
    damage,
    enemyDamage: 0,
    critical,
    kind: a.kind,
    target: "",
    poisonDamage,
    stunned: false,
    targets,
    healing: Object.fromEntries(
      party.map((c) => [
        c.id,
        Math.max(0, c.hp - (s.party.find((p) => p.id === c.id)?.hp || 0)),
      ]),
    ),
    strikes,
    broken,
  };
  const mastery = (next: Game) =>
    earnMastery(next, s, actor.id, a.kind === "skill" ? skill : undefined);
  if (enemy.hp === 0)
    return mastery(
      won({ ...s, momentum }, party, enemy, effects, logs, potions, inventory),
    );
  if (enemy.broken > 0 || enemy.paralysis > 0) {
    const recoveringBreak = enemy.broken > 0;
    stunned = true;
    enemy.paralysis = Math.max(0, enemy.paralysis - 1);
    enemy.broken = Math.max(0, enemy.broken - 1);
    enemy.controlWard = 2;
    enemy.charged = false;
    if (recoveringBreak && !enemy.broken) enemy.poise = enemy.maxPoise;
    logs.push(`${enemy.name} cannot act.`);
  } else {
    const guard = a.kind === "guard";
    const forecast = battleForecast(s, guard, actor.id);
    for (const targetId of Object.keys(forecast)) {
      const c = party.find((x) => x.id === targetId)!;
      if (c.hp <= 0) continue;
      // Healing and cleanses happen before impact, so mitigation uses the current HP threshold.
      const hit = hitDamage({ ...s, party, enemy }, c, intent.power, guard);
      targets[c.id] = hit;
      c.hp = Math.max(0, c.hp - hit);
      c.ailments.barrier = 0;
      const ward =
        enemy.element === "fire"
          ? "Ember Ward"
          : enemy.element === "frost"
            ? "Winter Veil"
            : enemy.element === "venom"
              ? "Toxic Adaptation"
              : "Grave Guard";
      if (c.hp > 0 && c.skills.includes(ward) && skillRank(c, ward) >= 2) {
        c.hp = Math.min(c.maxHp, c.hp + 5);
        if (skillRank(c, ward) === 3) c.mp = Math.min(c.maxMp, c.mp + 3);
      }
      if (
        enemy.element === "venom" &&
        !c.skills.includes("Toxic Adaptation") &&
        !c.ailments.ward
      )
        c.ailments.poison = 2;
      if (
        enemy.element === "frost" &&
        intent.kind === "heavy" &&
        !(
          c.skills.includes("Winter Veil") && skillRank(c, "Winter Veil") >= 2
        ) &&
        !c.ailments.ward &&
        !(c.traitRevealed && c.trait === "Iron Will")
      )
        c.ailments.paralysis = 1;
      logs.push(`${c.name} takes ${hit} ${enemy.element} damage.`);
    }
    if (intent.kind === "charge") {
      enemy.charged = true;
      logs.push(`The enemy charges ${enemy.intent}.`);
    }
    if (intent.kind === "heavy") {
      enemy.charged = false;
      logs.push(`${enemy.intent}${guard ? " was guarded." : "."}`);
    }
    if (intent.kind === "recovery") logs.push("The enemy recovers. No attack.");
    enemy.controlWard = Math.max(0, enemy.controlWard - 1);
    if (Object.keys(targets).length) enemy.weakened = 0;
  }
  enemy.vulnerable = Math.max(0, (enemy.vulnerable || 0) - 1);
  party = party.map((c) => {
    let hp = c.hp;
    if (hp > 0 && c.ailments.poison > 0) {
      const tick = Math.max(
        2,
        Math.round(c.maxHp * 0.05 * (1 - resist(c, "venom") / 100)),
      );
      hp = Math.max(0, hp - tick);
      logs.push(`${c.name} takes ${tick} poison damage.`);
    }
    return {
      ...c,
      hp,
      ailments: {
        ...c.ailments,
        poison: Math.max(0, c.ailments.poison - 1),
        ward: Math.max(0, (c.ailments.ward || 0) - 1),
      },
    };
  });
  const dead = party.every((c) => c.hp <= 0),
    enemyDamage = Object.values(targets).reduce((n, x) => n + x, 0);
  return mastery({
    ...s,
    party,
    inventory,
    potions,
    enemy,
    momentum,
    turn: s.turn + 1,
    phase: dead ? "defeat" : "combat",
    message: "",
    effects: {
      ...effects,
      enemyDamage,
      target: Object.keys(targets)[0] || "",
      stunned,
    },
    lastOutcome: dead ? "The expedition was lost" : s.lastOutcome,
    log: [...logs, ...s.log].slice(0, 10),
  });
}
