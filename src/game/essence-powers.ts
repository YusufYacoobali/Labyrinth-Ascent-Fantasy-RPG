import type { Character, Skill } from "./engine";
import type { StatusId } from "./combat-status";
import type { Element } from "./world";
export interface EssencePower {
  name: Skill;
  family: Skill;
  element: Element;
  status?: StatusId;
  barrier?: number;
  bonusVsStatus?: StatusId;
  bonus?: number;
  mpGain?: number;
  cost: number;
  cooldown: number;
  detail: string;
}
export const ESSENCE_POWERS: EssencePower[] = [
  {
    name: "Briar Lash",
    family: "Venom Fang",
    element: "venom",
    status: "entangled",
    cost: 16,
    cooldown: 2,
    detail:
      "Venom lash poisons and entangles the target, slowing initiative by four.",
  },
  {
    name: "Thorn Shelter",
    family: "Second Wind",
    element: "venom",
    barrier: 8,
    cost: 22,
    cooldown: 3,
    detail: "Heal standing allies and wrap each in an 8 HP thorn barrier.",
  },
  {
    name: "Rime Fang",
    family: "Twin Strike",
    element: "frost",
    bonusVsStatus: "chilled",
    bonus: 0.25,
    cost: 20,
    cooldown: 2,
    detail:
      "Fast double frost strike deals 25% extra damage against chilled or frozen prey.",
  },
  {
    name: "Glacier Aegis",
    family: "Shield Bash",
    element: "frost",
    status: "chilled",
    barrier: 10,
    cost: 20,
    cooldown: 3,
    detail: "A chilling interrupt with a 10 HP personal glacier barrier.",
  },
  {
    name: "Cinder Rush",
    family: "Twin Strike",
    element: "fire",
    status: "burning",
    cost: 22,
    cooldown: 2,
    detail: "Fast double fire strike leaves a stacking burn.",
  },
  {
    name: "Furnace Brace",
    family: "Shield Bash",
    element: "fire",
    status: "weakened",
    barrier: 10,
    cost: 20,
    cooldown: 3,
    detail:
      "An interrupting fire bash weakens its target and grants a 10 HP barrier.",
  },
  {
    name: "Shade Tithe",
    family: "Scavenge",
    element: "physical",
    status: "weakened",
    mpGain: 8,
    cost: 14,
    cooldown: 3,
    detail: "A weakening life siphon returns 8 MP after hitting.",
  },
  {
    name: "Marshal Edict",
    family: "Nerve Lock",
    element: "physical",
    status: "fractured",
    barrier: 6,
    cost: 22,
    cooldown: 3,
    detail:
      "Interrupt and fracture an enemy's armor; gain a 6 HP personal barrier.",
  },

  {
    name: "Ossuary Mend",
    family: "Scavenge",
    element: "physical",
    status: "weakened",
    cost: 12,
    cooldown: 2,
    detail:
      "Bone-drawing strike; weakens the enemy for two rounds while restoring your HP.",
  },
  {
    name: "Pike Thrust",
    family: "Sunder",
    element: "physical",
    status: "fractured",
    cost: 14,
    cooldown: 2,
    detail:
      "Armor-piercing pike strike; stacks armor fracture up to three times.",
  },
  {
    name: "Shard Ward",
    family: "Shield Bash",
    element: "physical",
    barrier: 8,
    cost: 14,
    cooldown: 2,
    detail: "Interrupting shard bash; grants the caster an 8 HP barrier.",
  },
  {
    name: "Venom Needle",
    family: "Venom Fang",
    element: "venom",
    status: "venom",
    cost: 18,
    cooldown: 2,
    detail: "Venom strike adds a stacking toxin alongside lingering poison.",
  },
  {
    name: "Silken Snare",
    family: "Nerve Lock",
    element: "venom",
    status: "entangled",
    cost: 18,
    cooldown: 3,
    detail: "Interrupt and entangle the enemy, slowing its initiative by four.",
  },
  {
    name: "Echo Cut",
    family: "Twin Strike",
    element: "physical",
    status: "exposed",
    cost: 18,
    cooldown: 2,
    detail:
      "Double strike exposes the target to 15% more damage for two rounds.",
  },
  {
    name: "Pack Pounce",
    family: "Twin Strike",
    element: "frost",
    status: "chilled",
    cost: 18,
    cooldown: 2,
    detail: "Double frost strike builds chill toward a freeze.",
  },
  {
    name: "Burial Hymn",
    family: "Second Wind",
    element: "physical",
    barrier: 6,
    cost: 24,
    cooldown: 4,
    detail: "Heal standing allies and give each a 6 HP barrier.",
  },
  {
    name: "Cinder Riposte",
    family: "Sunder",
    element: "fire",
    status: "burning",
    cost: 16,
    cooldown: 2,
    detail: "A weakening fire cleave that leaves a stacking burn.",
  },
  {
    name: "Rime Lance",
    family: "Arcane Bolt",
    element: "frost",
    status: "chilled",
    cost: 16,
    cooldown: 2,
    detail: "Armor-ignoring frost lance; builds chill.",
  },
  {
    name: "Royal Bulwark",
    family: "Shield Bash",
    element: "physical",
    barrier: 12,
    cost: 18,
    cooldown: 3,
    detail: "Interrupting royal bash; grants the caster a 12 HP barrier.",
  },
  {
    name: "Hollow Cleave",
    family: "Sunder",
    element: "fire",
    status: "fractured",
    cost: 18,
    cooldown: 2,
    detail:
      "A fire cleave that fractures armor and weakens the enemy's next strike.",
  },
  {
    name: "Root Renewal",
    family: "Scavenge",
    element: "venom",
    barrier: 6,
    cost: 14,
    cooldown: 2,
    detail: "Venom siphon restores HP and leaves a 6 HP barrier.",
  },
  {
    name: "Whiteout Shard",
    family: "Crown Pulse",
    element: "frost",
    status: "chilled",
    cost: 24,
    cooldown: 3,
    detail: "Frost pulse builds chill while restoring standing allies.",
  },
  {
    name: "Furnace Spark",
    family: "Arcane Bolt",
    element: "fire",
    status: "burning",
    cost: 16,
    cooldown: 2,
    detail: "Armor-ignoring furnace bolt applies a stacking burn.",
  },
  {
    name: "Oath Siphon",
    family: "Scavenge",
    element: "physical",
    mpGain: 6,
    cost: 16,
    cooldown: 3,
    detail: "A restorative oath strike returns 6 MP after hitting.",
  },
  {
    name: "Heartroot Covenant",
    family: "Second Wind",
    element: "venom",
    barrier: 10,
    cost: 28,
    cooldown: 4,
    detail: "Heal standing allies and protect each with 10 HP of living roots.",
  },
  {
    name: "Winter Reckoning",
    family: "Twin Strike",
    element: "frost",
    status: "chilled",
    barrier: 6,
    cost: 24,
    cooldown: 3,
    detail: "Double frost strike builds chill and grants a 6 HP barrier.",
  },
  {
    name: "Crucible Mantle",
    family: "Sunder",
    element: "fire",
    status: "burning",
    barrier: 10,
    cost: 24,
    cooldown: 3,
    detail: "Burning crucible cleave; grants a 10 HP barrier.",
  },
  {
    name: "Oath Return",
    family: "Crown Pulse",
    element: "physical",
    barrier: 8,
    cost: 28,
    cooldown: 4,
    detail:
      "Royal pulse restores standing allies and grants the caster an 8 HP barrier.",
  },
];
export const skillFamily = (skill: Skill | undefined) =>
  ESSENCE_POWERS.find((p) => p.name === skill)?.family || skill;
export function healingUseful(
  party: Character[],
  caster: Character,
  skill: Skill,
) {
  const points = caster.mastery[skill] || 0,
    rank = points >= 40 ? 3 : points >= 12 ? 2 : 1;
  const barrier = ESSENCE_POWERS.find((p) => p.name === skill)?.barrier || 0;
  return party.some(
    (c) =>
      c.hp > 0 &&
      (c.hp < c.maxHp ||
        (c.ailments.poison > 0 && (c.id === caster.id || rank >= 2)) ||
        (rank >= 2 && Object.keys(c.ailments.conditions || {}).length > 0) ||
        (c.ailments.barrier || 0) <
          Math.max(
            rank === 3 ? Math.round(c.maxHp * 0.1) : 0,
            Math.round(barrier * (1 + (rank - 1) * 0.1)),
          )),
  );
}
