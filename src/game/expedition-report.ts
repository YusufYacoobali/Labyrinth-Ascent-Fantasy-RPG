import type { Character, Game } from "./engine";
import type { Spoils } from "./progression";
import { skillSlots } from "./progression";
import { MONSTERS } from "./monsters";
import { STORY_CHAINS } from "./stories";
const mastery = (c: Character) =>
  Object.values(c.mastery).reduce((n, v) => n + (v || 0), 0);
export interface DepartureSnapshot {
  campaignComplete?: boolean;
  characters: Record<
    string,
    {
      level: number;
      mastery: number;
      equipment: string[];
      loyalty: number;
      injuries: number;
      learned: string[];
    }
  >;
  maps: Record<string, number>;
  stages: Record<string, number>;
  factions: Record<string, number>;
  pairs: Record<string, number>;
}
export interface ExpeditionReport {
  challenge?: boolean;
  lostSkills?: Record<string, string[]>;
  number: number;
  reviewed: boolean;
  lost: boolean;
  highestFloor: number;
  newRooms: number;
  maps?: string[];
  enemies: Record<string, number>;
  essences: Record<string, number>;
  spoils: Spoils;
  gross: number;
  net: number;
  shares: Record<string, number>;
  characters: {
    id: string;
    name: string;
    level: number;
    levels: number;
    experience: number;
    mastery: number;
    injuries: number;
    loyalty: number;
    skills: string[];
    equipment: string[];
  }[];
  quests: string[];
  factions: string[];
  relationships: string[];
  leads: string[];
  recommendations: string[];
}
export function departureSnapshot(s: Game): DepartureSnapshot {
  return {
    campaignComplete: !!s.ending,
    characters: Object.fromEntries(
      s.party.map((c) => [
        c.id,
        {
          level: c.level,
          mastery: mastery(c),
          equipment: [...c.equipment],
          loyalty: s.stories.loyalty[c.id] ?? 50,
          injuries: c.injuries,
          learned: [...c.learnedSkills],
        },
      ]),
    ),
    maps: Object.fromEntries(
      Object.entries(s.journey.maps).map(([id, m]) => [id, m.explored.length]),
    ),
    stages: { ...s.stories.stages },
    factions: { ...s.faction, ...s.stories.factions },
    pairs: { ...s.stories.pairs },
  };
}
export function expeditionReport(before: Game, after: Game): ExpeditionReport {
  const start = before.expedition.departure,
    receipts = Object.values(before.expedition.receipts),
    enemies: Record<string, number> = {},
    essences: Record<string, number> = {};
  for (const receipt of receipts) {
    for (const enemy of receipt.enemies || [{ species: receipt.species }])
      enemies[enemy.species] = (enemies[enemy.species] || 0) + 1;
    for (const [id, n] of Object.entries(receipt.items))
      if (id.startsWith("essence-")) essences[id] = (essences[id] || 0) + n;
  }
  const characters = after.party.map((c) => {
    const old = start?.characters[c.id];
    return {
      id: c.id,
      name: c.name,
      level: c.level,
      experience: receipts.reduce(
        (n, r) => n + (r.xp.find((x) => x.id === c.id)?.amount || 0),
        0,
      ),
      levels: old ? c.level - old.level : 0,
      mastery: old ? mastery(c) - old.mastery : 0,
      injuries: c.injuries,
      loyalty: old ? (after.stories.loyalty[c.id] ?? 50) - old.loyalty : 0,
      skills: old
        ? c.learnedSkills.filter((k) => !old.learned.includes(k))
        : [],
      equipment: old
        ? c.equipment.filter((i) => !old.equipment.includes(i))
        : [],
    };
  });
  const factions = Object.entries({
    ...after.faction,
    ...after.stories.factions,
  }).flatMap(([id, n]) => {
    const change = n - (start?.factions[id] ?? n);
    return change ? [`${id}: ${change > 0 ? "+" : ""}${change}`] : [];
  });
  const quests = STORY_CHAINS.filter(
    (c) => (after.stories.stages[c.id] || 0) > (start?.stages[c.id] || 0),
  ).map((c) => `${c.title}: ${after.stories.stages[c.id]}/${c.stages.length}`);
  const leads = STORY_CHAINS.filter(
    (c) =>
      (after.stories.stages[c.id] || 0) > 0 &&
      (after.stories.stages[c.id] || 0) < c.stages.length,
  ).map((c) => {
    const st = c.stages[after.stories.stages[c.id]];
    return `${c.title}: ${st.title} · ${st.location === "town" ? "town" : `Floor ${st.floor}`}`;
  });
  const recommendations: string[] = [];
  if (after.party.some((c) => c.injuries))
    recommendations.push(
      "Treat injuries or spend three recovery days per injury before returning.",
    );
  if (after.food < 30)
    recommendations.push(
      `Prepare ${30 - after.food} more party rations for a full month.`,
    );
  if (after.party.some((c) => c.skills.length < skillSlots(c.level)))
    recommendations.push(
      "An equipped skill slot is empty. Check secured essences and learned powers in Party.",
    );
  recommendations.push(
    `Review the bestiary and match protection to Floor ${Math.min(12, Math.max(...after.checkpoints))}.`,
  );
  if (after.bestFloor >= 3)
    recommendations.push(
      "Check guardian-trophy recipes and faction commissions before selling materials.",
    );
  return {
    number: before.expedition.number,
    lostSkills: before.expedition.lostSkills,
    challenge:
      !!start?.campaignComplete &&
      before.floor === 12 &&
      before.journey.defeatedPortals.includes("12") &&
      !before.expedition.lost &&
      before.party.every((c) => c.hp > 0),
    reviewed: false,
    lost: before.expedition.lost,
    highestFloor: Math.max(
      before.floor,
      ...Object.keys(before.expedition.roomVisits || {}).map((k) =>
        Number(k.split(":")[0]),
      ),
    ),
    newRooms: Object.entries(before.journey.maps).reduce(
      (n, [id, m]) =>
        n + Math.max(0, start ? m.explored.length - (start.maps[id] ?? 1) : 0),
      0,
    ),
    maps: Object.entries(before.journey.maps)
      .filter(([id, m]) => start && m.explored.length > (start.maps[id] ?? 1))
      .map(([id]) => `Floor ${id.replace(":", " · ")}`),
    enemies,
    essences,
    spoils: before.expedition.lost
      ? before.expedition.lostSpoils || before.expedition.unsecured
      : before.expedition.unsecured,
    gross: before.runGross,
    net: before.expedition.lost ? 0 : before.expedition.unsecured.gold,
    shares: before.expedition.lost
      ? before.expedition.lostShares || {}
      : before.expedition.accruedShares,
    characters,
    quests,
    factions,
    relationships: Object.entries(after.stories.pairs).flatMap(([id, n]) =>
      n !== (start?.pairs[id] || 0)
        ? [`${id}: ${n >= 2 ? "bonded" : n <= -2 ? "hostile" : "neutral"}`]
        : [],
    ),
    leads,
    recommendations,
  };
}
export function optionalGoals(s: Game) {
  const skills = new Set(
    [...s.party, ...s.reserve].flatMap((c) => c.learnedSkills),
  );
  return [
    {
      label: "Repeat the throne with every companion standing",
      value: s.challengeCompletions || 0,
      target: 1,
    },
    {
      label: "Discover all four routes",
      value: s.discoveredRoutes.length,
      target: 4,
    },
    {
      label: "Complete companion arcs",
      value: STORY_CHAINS.filter(
        (c) => c.companion && (s.stories.stages[c.id] || 0) >= c.stages.length,
      ).length,
      target: 10,
    },
    {
      label: "Secure every monster power",
      value: MONSTERS.filter((m) => skills.has(m.skill)).length,
      target: MONSTERS.length,
    },
    {
      label: "Survey the full labyrinth",
      value: Object.values(s.journey.maps).filter(
        (m) => m.explored.length === Object.keys(m.nodes).length,
      ).length,
      target: 21,
    },
  ];
}
