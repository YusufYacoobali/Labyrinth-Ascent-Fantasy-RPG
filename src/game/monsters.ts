import type { Enemy, Skill } from "./engine";

export interface MonsterSpec {
  id: string;
  name: string;
  visual: string;
  skill: Skill;
  gold: number;
  xp: number;
  material: string;
  quantity: number;
  essenceValue: number;
}
export const MONSTERS: MonsterSpec[] = [
  {
    id: "goblin",
    name: "Goblin Scout",
    visual: "goblin",
    skill: "Twin Strike",
    gold: 65,
    xp: 43,
    material: "beast-core",
    quantity: 1,
    essenceValue: 35,
  },
  {
    id: "roadkeeper",
    name: "Bone Roadkeeper",
    visual: "roadkeeper",
    skill: "Shield Bash",
    gold: 85,
    xp: 51,
    material: "relic-fragment",
    quantity: 1,
    essenceValue: 40,
  },
  {
    id: "guardian",
    name: "Runestone Guardian",
    visual: "guardian",
    skill: "Inspiring Presence",
    gold: 235,
    xp: 59,
    material: "ancient-ore",
    quantity: 2,
    essenceValue: 75,
  },
  {
    id: "broodmother",
    name: "Venom Broodmother",
    visual: "broodmother",
    skill: "Venom Fang",
    gold: 125,
    xp: 67,
    material: "night-herb",
    quantity: 2,
    essenceValue: 50,
  },
  {
    id: "revenant",
    name: "Echo Revenant",
    visual: "revenant",
    skill: "Arcane Bolt",
    gold: 145,
    xp: 75,
    material: "relic-fragment",
    quantity: 2,
    essenceValue: 55,
  },
  {
    id: "blight",
    name: "The Blight Warden",
    visual: "blight",
    skill: "Toxic Adaptation",
    gold: 295,
    xp: 83,
    material: "night-herb",
    quantity: 3,
    essenceValue: 90,
  },
  {
    id: "frostfang",
    name: "Frostfang Alpha",
    visual: "frostfang",
    skill: "Winter Veil",
    gold: 185,
    xp: 91,
    material: "frost-shard",
    quantity: 2,
    essenceValue: 65,
  },
  {
    id: "sentinel",
    name: "Gravebound Sentinel",
    visual: "sentinel",
    skill: "Grave Guard",
    gold: 205,
    xp: 99,
    material: "beast-core",
    quantity: 3,
    essenceValue: 70,
  },
  {
    id: "ashen",
    name: "The Ashen Knight",
    visual: "ashen",
    skill: "Ember Ward",
    gold: 355,
    xp: 107,
    material: "ancient-ore",
    quantity: 3,
    essenceValue: 110,
  },
  {
    id: "pale-hunter",
    name: "The Pale Hunter",
    visual: "pale-hunter",
    skill: "Nerve Lock",
    gold: 245,
    xp: 115,
    material: "frost-shard",
    quantity: 3,
    essenceValue: 80,
  },
  {
    id: "kings-blade",
    name: "The King’s Blade",
    visual: "kings-blade",
    skill: "Sunder",
    gold: 265,
    xp: 123,
    material: "relic-fragment",
    quantity: 3,
    essenceValue: 85,
  },
  {
    id: "hollow-king",
    name: "The Hollow King",
    visual: "hollow-king",
    skill: "Crown Pulse",
    gold: 415,
    xp: 131,
    material: "relic-fragment",
    quantity: 4,
    essenceValue: 130,
  },
  {
    id: "plunderer",
    name: "The Plunderer",
    visual: "plunderer",
    skill: "Second Wind",
    gold: 115,
    xp: 43,
    material: "beast-core",
    quantity: 2,
    essenceValue: 45,
  },
  {
    id: "bonegnaw",
    name: "Bonegnaw Scavenger",
    visual: "bonegnaw",
    skill: "Scavenge",
    gold: 100,
    xp: 43,
    material: "beast-core",
    quantity: 2,
    essenceValue: 40,
  },
];
MONSTERS.push(
  {
    id: "goblin-shieldbearer",
    name: "Goblin Shieldbearer",
    visual: "roadkeeper",
    skill: "Candle Ward",
    gold: 30,
    xp: 14,
    material: "goblin-trophy",
    quantity: 1,
    essenceValue: 35,
  },
  {
    id: "goblin-slinger",
    name: "Goblin Slinger",
    visual: "plunderer",
    skill: "Sling Shot",
    gold: 25,
    xp: 12,
    material: "goblin-trophy",
    quantity: 1,
    essenceValue: 35,
  },
);
// Route families reuse the established artwork while owning rewards and signature essences.
for (const [route, regular, elite, guardian, visual, skill, material] of [
  [
    "roots",
    "Briar Stalker",
    "Thornbound Keeper",
    "Heartroot Warden",
    "broodmother",
    "Venom Fang",
    "night-herb",
  ],
  [
    "frost",
    "Rime Prowler",
    "Glacier Sentinel",
    "Frostwell Warden",
    "frostfang",
    "Winter Veil",
    "frost-shard",
  ],
  [
    "forge",
    "Cinder Hound",
    "Furnace Knight",
    "Crucible Warden",
    "ashen",
    "Ember Ward",
    "ancient-ore",
  ],
  [
    "crypt",
    "Sepulchral Shade",
    "Oathbound Marshal",
    "Silent Warden",
    "sentinel",
    "Grave Guard",
    "relic-fragment",
  ],
] as const) {
  [regular, elite, guardian].forEach((name, i) =>
    MONSTERS.push({
      id: `${route}-${["roamer", "elite", "guardian"][i]}`,
      name,
      visual,
      skill,
      gold: [120, 180, 295][i],
      xp: [60, 75, 90][i],
      material,
      quantity: i + 1,
      essenceValue: [55, 70, 90][i],
    }),
  );
}
export const essenceId = (species: string) => `essence-${species}`;
export const monsterFor = (enemy: Enemy, floor: number): MonsterSpec =>
  MONSTERS.find((m) => m.id === enemy.species) ||
  MONSTERS.find(
    (m) =>
      m.name === enemy.name ||
      (m.id === "plunderer" && /plunderer/i.test(enemy.name)),
  ) ||
  MONSTERS[Math.max(0, Math.min(11, floor - 1))];

export function nextRandom(seed: number) {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: next, roll: next / 4294967296 };
}
export function monsterDrops(spec: MonsterSpec, seed: number) {
  const essence = nextRandom(seed);
  const material = nextRandom(essence.seed);
  return {
    seed: material.seed,
    items: {
      [spec.material]: spec.quantity,
      ...(material.roll < 0.25
        ? {
            "beast-core":
              (spec.material === "beast-core" ? spec.quantity : 0) + 1,
          }
        : {}),
      ...(essence.roll < 0.3 ? { [essenceId(spec.id)]: 1 } : {}),
    },
  };
}
