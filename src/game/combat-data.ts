import type { Character, Skill } from "./engine";
import { ITEMS, type Element } from "./world";
export const SKILLS: {
  name: Skill;
  icon: string;
  description: string;
  cost: number;
  passive?: boolean;
  cooldown?: number;
  color: string;
}[] = [
  {
    name: "Arcane Bolt",
    icon: "creation",
    description: "1.65× damage, ignoring armor. 18 break damage.",
    cost: 14,
    cooldown: 1,
    color: "#70b3ff",
  },
  {
    name: "Shield Bash",
    icon: "shield",
    description: "1.4× damage; 38 break. 55% interrupt chance (bosses: 30%).",
    cost: 12,
    cooldown: 2,
    color: "#e4bc6b",
  },
  {
    name: "Venom Fang",
    icon: "snake",
    description:
      "A venom strike. Poison deals 6% max HP for 3 turns. Bosses take half.",
    cost: 14,
    cooldown: 2,
    color: "#91cc74",
  },
  {
    name: "Nerve Lock",
    icon: "lightning-bolt",
    description: "1.1× damage; 45 break. Interrupt chance: 100% (bosses: 50%).",
    cost: 18,
    cooldown: 3,
    color: "#ccabef",
  },
  {
    name: "Twin Strike",
    icon: "sword-cross",
    description: "Double caster damage; 22 break.",
    cost: 16,
    cooldown: 1,
    color: "#ed8e72",
  },
  {
    name: "Second Wind",
    icon: "heart",
    description:
      "Heal all standing allies by 22% max HP and cleanse the caster.",
    cost: 20,
    cooldown: 3,
    color: "#78c997",
  },
  {
    name: "Inspiring Presence",
    icon: "sun",
    description: "Passive: your presence increases party attack by 15%.",
    cost: 0,
    passive: true,
    color: "#70b3ff",
  },
  {
    name: "Ember Ward",
    icon: "fire",
    description:
      "Passive: take 30% less fire damage. Stacks with equipment to 75%.",
    cost: 0,
    passive: true,
    color: "#ed8e72",
  },
  {
    name: "Winter Veil",
    icon: "snowflake",
    description:
      "Passive: take 30% less frost damage. Stacks with equipment to 75%.",
    cost: 0,
    passive: true,
    color: "#70b3ff",
  },
  {
    name: "Toxic Adaptation",
    icon: "leaf",
    description: "Passive: 30% venom resistance and immunity to poison.",
    cost: 0,
    passive: true,
    color: "#91cc74",
  },
];
export function resist(c: Character, element: Element): number {
  let n = 0;
  for (const id of c.equipment) {
    const r = ITEMS.find((x) => x.id === id)?.resist;
    if (r?.element === element) n += r.amount;
  }
  if (element === "fire" && c.skills.includes("Ember Ward")) n += 30;
  if (element === "frost" && c.skills.includes("Winter Veil")) n += 30;
  if (element === "venom" && c.skills.includes("Toxic Adaptation")) n += 30;
  if (element === "venom" && c.traitRevealed && c.trait === "Stoneblood")
    n += 25;
  return Math.min(75, n);
}
