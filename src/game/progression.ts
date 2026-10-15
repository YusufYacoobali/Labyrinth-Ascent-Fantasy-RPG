import type { CombatState } from "./round-combat";
import type { GenericRecord } from "./generic-stories";
import { MONSTERS, essenceId } from "./monsters";
import type { Action, Character, Game, Skill, LootReceipt } from "./engine";

/** Binding always identifies the held species, even when several grant the same power. */
export function essenceBindingOptions(s: Game, skill: Skill) {
  return MONSTERS.filter((m) => m.skill === skill).flatMap((m) => {
    const itemId = essenceId(m.id),
      quantity = s.inventory[itemId] || 0;
    const unsecured = Math.min(
      quantity,
      s.expedition.unsecured.inventory[itemId] || 0,
    );
    return quantity > 0
      ? [
          {
            species: m.id,
            itemId,
            name: m.name,
            quantity,
            unsecured,
            secured: quantity - unsecured,
          },
        ]
      : [];
  });
}

export const skillSlots = (level: number) =>
  Math.min(6, 2 + Math.floor(level / 3));
export const skillRank = (c: Character, skill: Skill) =>
  (c.mastery?.[skill] || 0) >= 40 ? 3 : (c.mastery?.[skill] || 0) >= 12 ? 2 : 1;
export const potency = (c: Character, skill: Skill) =>
  1 + (skillRank(c, skill) - 1) * 0.1;
export function prepareSkills(c: Character): Character {
  return {
    ...c,
    learnedSkills: [...new Set([...(c.learnedSkills || []), ...c.skills])],
    skills: c.skills.slice(0, skillSlots(c.level)),
    mastery: { ...c.mastery },
    battleMastery: {},
  };
}
export interface Spoils {
  gold: number;
  gems: number;
  food: number;
  potions: number;
  inventory: Record<string, number>;
}
export interface Expedition {
  number: number;
  unsecured: Spoils;
  provisionalSkills: Record<string, Skill[]>;
  accruedShares: Record<string, number>;
  lost: boolean;
  battles: Record<string, CombatState>;
  rounds: number;
  foraged: string[];
  generic: Record<string, GenericRecord>;
  receipts: Record<string, LootReceipt>;
  resolutions: Record<
    string,
    {
      action: string;
      outcome: string;
      gold: number;
      food: number;
      items: Record<string, number>;
    }
  >;
}
export const emptySpoils = (): Spoils => ({
  gold: 0,
  gems: 0,
  food: 0,
  potions: 0,
  inventory: {},
});
export const newExpedition = (number = 0): Expedition => ({
  number,
  unsecured: emptySpoils(),
  provisionalSkills: {},
  accruedShares: {},
  lost: false,
  battles: {},
  rounds: 0,
  foraged: [],
  generic: {},
  receipts: {},
  resolutions: {},
});

/** Totals stay directly usable by existing services; this ledger owns only their unsecured portion. */
export function trackSpoils(before: Game, after: Game, action?: Action): Game {
  if (before === after) return after;
  if (
    before.journey.startDay === null ||
    before.phase === "town" ||
    after.phase === "town" ||
    before.expedition.lost
  )
    return after;
  const old = before.expedition.unsecured;
  // Field goods bought entirely with secured gold stay secured.
  // Any unsecured contribution keeps the whole acquired bundle at risk.
  const securedPurchase =
    ((action?.type === "EVENT" &&
      before.floor === 11 &&
      action.choice === "supplies") ||
      action?.type === "GENERIC_CHOICE") &&
    after.gold < before.gold &&
    old.gold === 0;
  const inventory = { ...old.inventory };
  for (const id of new Set([
    ...Object.keys(before.inventory),
    ...Object.keys(after.inventory),
  ]))
    inventory[id] = Math.max(
      0,
      (old.inventory[id] || 0) +
        (securedPurchase
          ? Math.min(
              0,
              (after.inventory[id] || 0) - (before.inventory[id] || 0),
            )
          : (after.inventory[id] || 0) - (before.inventory[id] || 0)),
    );
  const unsecured = { ...old, inventory };
  for (const key of ["gold", "gems", "food", "potions"] as const)
    unsecured[key] = Math.max(
      0,
      old[key] +
        (securedPurchase
          ? Math.min(0, after[key] - before[key])
          : after[key] - before[key]),
    );
  return { ...after, expedition: { ...after.expedition, unsecured } };
}
export function loseSpoils(s: Game): Game {
  if (s.expedition.lost) return s;
  const bag = s.expedition.unsecured;
  const inventory = { ...s.inventory };
  for (const [id, qty] of Object.entries(bag.inventory))
    inventory[id] = Math.max(0, (inventory[id] || 0) - qty);
  const clean = (c: Character) => {
    const lost = s.expedition.provisionalSkills[c.id] || [];
    return {
      ...c,
      skills: c.skills.filter((k) => !lost.includes(k)),
      learnedSkills: c.learnedSkills.filter((k) => !lost.includes(k)),
      mastery: Object.fromEntries(
        Object.entries(c.mastery).filter(([k]) => !lost.includes(k as Skill)),
      ),
    };
  };
  return {
    ...s,
    gold: Math.max(0, s.gold - bag.gold),
    gems: Math.max(0, s.gems - bag.gems),
    food: Math.max(0, s.food - bag.food),
    potions: Math.max(0, s.potions - bag.potions),
    inventory,
    party: s.party.map(clean),
    reserve: s.reserve.map(clean),
    expedition: {
      ...s.expedition,
      unsecured: emptySpoils(),
      provisionalSkills: {},
      accruedShares: {},
      lost: true,
    },
  };
}
export function earnMastery(
  s: Game,
  before: Game,
  actorId: string,
  skill?: Skill,
): Game {
  const average =
    before.party.reduce((n, c) => n + c.level, 0) /
    Math.max(1, before.party.length);
  if (s.trial || (before.enemy?.level || before.floor) < average - 2) return s;
  return {
    ...s,
    party: s.party.map((c) => {
      const old = before.party.find((p) => p.id === c.id)!;
      const counted = { ...c.battleMastery };
      const mastery = { ...c.mastery };
      const add = (key: Skill, limit: number) => {
        if ((counted[key] || 0) >= limit) return;
        counted[key] = (counted[key] || 0) + 1;
        mastery[key] = Math.min(40, (mastery[key] || 0) + 1);
      };
      if (c.id === actorId && skill) {
        const useful =
          skill === "Second Wind"
            ? before.party.some(
                (p) =>
                  p.hp > 0 &&
                  (p.hp < p.maxHp ||
                    (p.ailments.poison > 0 &&
                      (p.id === actorId || skillRank(old, skill) >= 2)) ||
                    (skillRank(old, skill) === 3 &&
                      (p.ailments.barrier || 0) < Math.round(p.maxHp * 0.1))),
              )
            : skill === "Scavenge"
              ? s.effects.damage > 0 || c.hp > old.hp
              : s.effects.damage > 0 || s.effects.stunned;
        if (useful) add(skill, 3);
      }
      if (old.hp > 0)
        for (const key of old.skills) {
          if (key === "Candle Ward" && (s.effects.protection?.[c.id] || 0) > 0)
            add(key, 1);
          if (
            key === "Inspiring Presence" &&
            Object.values(s.effects.strikes || {}).some(
              (damage) => damage > 0,
            ) &&
            before.party.find((p) => p.hp > 0 && p.skills.includes(key))?.id ===
              c.id
          )
            add(key, 1);
          if (
            ((key === "Ember Ward" && before.enemy?.element === "fire") ||
              (key === "Winter Veil" && before.enemy?.element === "frost") ||
              (key === "Toxic Adaptation" &&
                before.enemy?.element === "venom") ||
              (key === "Grave Guard" &&
                before.enemy?.element === "physical")) &&
            s.effects.targets[c.id] > 0
          )
            add(key, 1);
        }
      return { ...c, mastery, battleMastery: counted };
    }),
  };
}
