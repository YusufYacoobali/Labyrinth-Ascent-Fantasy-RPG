import { SKILL_IDS, type SkillId } from "./skill-ids";
import { ESSENCE_POWERS } from "./essence-powers";
import type { StatusId } from "./combat-status";
import type { Character, Skill } from "./engine";
import { ITEMS, type Element } from "./world";
import { skillRank } from "./progression";
export const SKILLS: {
  id: SkillId;
  name: Skill;
  icon: string;
  description: string;
  cost: number;
  passive?: boolean;
  cooldown?: number;
  color: string;
  family?: Skill;
  element?: Element;
  status?: StatusId;
  barrier?: number;
  mpGain?: number;
  bonusVsStatus?: StatusId;
  bonus?: number;
}[] = [
  {
    id: SKILL_IDS["Candle Ward"],
    name: "Candle Ward",
    icon: "shield",
    description:
      "Passive: Guard adds a 6 HP barrier to the guarded ally. Earn mastery when its barrier absorbs a hit.",
    cost: 0,
    passive: true,
    color: "#e4bc6b",
  },
  {
    id: SKILL_IDS["Sling Shot"],
    name: "Sling Shot",
    icon: "bullseye-arrow",
    description:
      "Fast shot (+4 initiative): 1.1× damage, ignoring half armor; 16 break; weakens the next strike by 10%.",
    cost: 10,
    cooldown: 1,
    color: "#ed8e72",
  },
  {
    id: SKILL_IDS["Arcane Bolt"],
    name: "Arcane Bolt",
    icon: "creation",
    description: "1.65× damage, ignoring armor. 18 break damage.",
    cost: 14,
    cooldown: 1,
    color: "#70b3ff",
  },
  {
    id: SKILL_IDS["Shield Bash"],
    name: "Shield Bash",
    icon: "shield",
    description: "1.4× damage; 38 break. 55% interrupt chance (bosses: 30%).",
    cost: 12,
    cooldown: 2,
    color: "#e4bc6b",
  },
  {
    id: SKILL_IDS["Venom Fang"],
    name: "Venom Fang",
    icon: "snake",
    description:
      "A venom strike. Poison deals 6% max HP for 3 turns. Bosses take half.",
    cost: 14,
    cooldown: 2,
    color: "#91cc74",
  },
  {
    id: SKILL_IDS["Nerve Lock"],
    name: "Nerve Lock",
    icon: "lightning-bolt",
    description: "1.1× damage; 45 break. Interrupt chance: 100% (bosses: 50%).",
    cost: 18,
    cooldown: 3,
    color: "#ccabef",
  },
  {
    id: SKILL_IDS["Twin Strike"],
    name: "Twin Strike",
    icon: "sword-cross",
    description:
      "Fast follow-up (+4 initiative): double caster damage, 22 break and 25% interrupt chance (bosses: 10%).",
    cost: 16,
    cooldown: 1,
    color: "#ed8e72",
  },
  {
    id: SKILL_IDS["Second Wind"],
    name: "Second Wind",
    icon: "heart",
    description:
      "Heal all standing allies by 22% max HP and cleanse the caster.",
    cost: 20,
    cooldown: 3,
    color: "#78c997",
  },
  {
    id: SKILL_IDS["Inspiring Presence"],
    name: "Inspiring Presence",
    icon: "sun",
    description:
      "Passive: party attack +15%. Guard also grants an 8 HP rune barrier.",
    cost: 0,
    passive: true,
    color: "#70b3ff",
  },
  {
    id: SKILL_IDS["Ember Ward"],
    name: "Ember Ward",
    icon: "fire",
    description:
      "Passive: 30% fire resistance; retaliate with fire after a damaging hit. Stacks with equipment to 75%.",
    cost: 0,
    passive: true,
    color: "#ed8e72",
  },
  {
    id: SKILL_IDS["Winter Veil"],
    name: "Winter Veil",
    icon: "snowflake",
    description:
      "Passive: 30% frost resistance; +15% damage against chilled or frozen prey.",
    cost: 0,
    passive: true,
    color: "#70b3ff",
  },
  {
    id: SKILL_IDS["Toxic Adaptation"],
    name: "Toxic Adaptation",
    icon: "leaf",
    description: "Passive: 30% venom resistance and immunity to poison.",
    cost: 0,
    passive: true,
    color: "#91cc74",
  },
  {
    id: SKILL_IDS["Grave Guard"],
    name: "Grave Guard",
    icon: "shield",
    description: "Passive: 15% physical resistance.",
    cost: 0,
    passive: true,
    color: "#bba9da",
  },
  {
    id: SKILL_IDS["Sunder"],
    name: "Sunder",
    icon: "sword-cross",
    description: "1.45× damage and 35 break; weakens the next enemy strike.",
    cost: 16,
    cooldown: 2,
    color: "#ed8e72",
  },
  {
    id: SKILL_IDS["Crown Pulse"],
    name: "Crown Pulse",
    icon: "crown",
    description:
      "1.35× fire damage to every enemy; restore 10% maximum HP to standing allies once.",
    cost: 36,
    cooldown: 3,
    color: "#ccabef",
  },
  {
    id: SKILL_IDS["Scavenge"],
    name: "Scavenge",
    icon: "heart",
    description: "0.85× damage; restore 12% of the caster's maximum HP.",
    cost: 12,
    cooldown: 2,
    color: "#78c997",
  },
];
export const skillId = (skill: Skill) =>
  skill.toLowerCase().replaceAll(" ", "-");
SKILLS.push(
  ...ESSENCE_POWERS.map((power) => ({
    ...power,
    id: SKILL_IDS[power.name],
    icon: "creation",
    description: power.detail,
    color: "#9fcde0",
  })),
);
export const SKILL_RANKS = Object.fromEntries(
  SKILLS.map((s) => [
    s.name,
    [
      s.description,
      s.name === "Candle Ward"
        ? "Guard grants a 10 HP barrier and protects against physical stagger for the round."
        : s.name === "Sling Shot"
          ? "10% greater damage, 26 break and 15% weakening."
          : s.passive
            ? s.name === "Inspiring Presence"
              ? "Party attack +17%; restore 1 MP to each attacker. Guard grants a 10 HP rune barrier."
              : s.name === "Winter Veil"
                ? "35% frost resistance and freeze immunity; recover 5 HP after a frost hit."
                : s.name === "Ember Ward"
                  ? "35% fire resistance and heat-shock immunity; recover 5 HP after a fire hit."
                  : s.name === "Grave Guard"
                    ? "20% physical resistance and stagger immunity; recover 5 HP after a physical hit."
                    : "Resistance +5 points; recover 5 HP after a matching hit."
            : s.name === "Second Wind" || s.name === "Crown Pulse"
              ? "10% greater potency; cleanse party poison."
              : s.name === "Scavenge"
                ? "10% greater damage and healing; cleanse the caster's poison."
                : s.name === "Shield Bash" || s.name === "Nerve Lock"
                  ? "10% greater damage; weaken the next enemy strike by 10% and slow by 2 speed for two rounds."
                  : s.name === "Venom Fang"
                    ? "10% greater damage and poison; +10 break damage."
                    : "10% greater damage; +10 break damage.",
      s.name === "Candle Ward"
        ? "Guard grants a 14 HP barrier and protects against physical stagger for the round."
        : s.name === "Sling Shot"
          ? "20% greater damage, 36 break, 20% weakening and two-turn vulnerability."
          : s.passive
            ? s.name === "Inspiring Presence"
              ? "Party attack +19%; restore 2 MP and 2 HP to each attacker. Guard grants a 12 HP rune barrier."
              : s.name === "Winter Veil"
                ? "40% frost resistance and freeze immunity; recover 5 HP and 3 MP after a frost hit."
                : s.name === "Ember Ward"
                  ? "40% fire resistance and heat-shock immunity; recover 5 HP and 3 MP after a fire hit."
                  : s.name === "Grave Guard"
                    ? "25% physical resistance and stagger immunity; recover 5 HP and 3 MP after a physical hit."
                    : "Resistance +10 points; recover 5 HP and 3 MP after a matching hit."
            : s.name === "Second Wind" || s.name === "Crown Pulse"
              ? "20% greater potency; cleanse poison and grant a 10% max-HP barrier."
              : s.name === "Scavenge"
                ? "20% greater damage and healing; cleanse poison and grant a 10% max-HP barrier."
                : s.name === "Shield Bash" || s.name === "Nerve Lock"
                  ? "20% greater damage; weaken the next strike by 20%, slow by 3 speed for two rounds and add 10 break."
                  : s.name === "Venom Fang"
                    ? "20% greater damage and poison; +20 break and expose the enemy for +10% damage for two turns."
                    : "20% greater damage; +20 break and expose the enemy for +10% damage for two turns.",
    ],
  ]),
) as Record<Skill, [string, string, string]>;
for (const p of ESSENCE_POWERS)
  for (const rank of [2, 3] as const) {
    SKILL_RANKS[p.name][rank - 1] =
      `${SKILL_RANKS[p.family][rank - 1]} ${p.status ? `Also applies ${p.status}. ` : ""}${p.barrier ? `Signature barrier: ${Math.round(p.barrier * (1 + (rank - 1) * 0.1))} HP. ` : ""}${p.mpGain ? `Returns ${p.mpGain} MP on hit.` : ""}`;
  }
for (const rank of [2, 3] as const) {
  SKILL_RANKS["Ember Ward"][rank - 1] += " Fire retaliation grows with rank.";
  SKILL_RANKS["Winter Veil"][rank - 1] +=
    " Chilled/frozen prey take 15% extra damage.";
}
export function resist(c: Character, element: Element): number {
  let n = c.refinements?.[element] ? 10 : 0;
  for (const id of c.equipment) {
    const r = ITEMS.find((x) => x.id === id)?.resist;
    if (r?.element === element) n += r.amount;
  }
  if (element === "fire" && c.skills.includes("Ember Ward"))
    n += 30 + (skillRank(c, "Ember Ward") - 1) * 5;
  if (element === "frost" && c.skills.includes("Winter Veil"))
    n += 30 + (skillRank(c, "Winter Veil") - 1) * 5;
  if (element === "venom" && c.skills.includes("Toxic Adaptation"))
    n += 30 + (skillRank(c, "Toxic Adaptation") - 1) * 5;
  if (element === "physical" && c.skills.includes("Grave Guard"))
    n += 15 + (skillRank(c, "Grave Guard") - 1) * 5;
  if (element === "venom" && c.traitRevealed && c.trait === "Stoneblood")
    n += 25;
  return Math.min(75, n);
}
