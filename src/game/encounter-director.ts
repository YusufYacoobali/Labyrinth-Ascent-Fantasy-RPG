import { gearFloor } from "./build-equipment";
import { BALANCE } from "./balance";
import type { Game } from "./engine";
import {
  generateFloor,
  mapKey,
  random,
  seedFor,
  type FloorMap,
  type Occupant,
} from "./floor-map";
import { GENERIC_ENCOUNTERS } from "./generic-encounters";
import { ITEMS } from "./world";
import { prepareShortcuts } from "./shortcuts";
import { WORLD_NPCS, type WorldNpcId } from "./world-npcs";
const B = BALANCE.director;
export interface DirectedEncounter {
  kind: Occupant;
  variant:
    | "quiet"
    | "patrol"
    | "ambush"
    | "elite"
    | "survivors"
    | "merchant"
    | "explorers"
    | "cache"
    | "rare"
    | "hazard"
    | "spring";
  generic?: { id: string; variant: number };
  rewardItem?: string;
  approach: string;
  lateKind?: Occupant;
  locked?: boolean;
}
export interface DirectorContext {
  startFloor: number;
  level: number;
  injuries: number;
  party: string[];
  skills: string[];
  faction: number;
  storyProgress: number;
  remainingWatches: number;
}
export interface ExpeditionDirector {
  version: 1;
  seed: number;
  context: DirectorContext;
  encounters: Record<string, Record<string, DirectedEncounter>>;
  npcs: Partial<Record<WorldNpcId, { map: string; room: string }>>;
}
function weighted(weights: [Occupant, number][], rng: () => number) {
  let roll = rng() * weights.reduce((n, [, w]) => n + w, 0);
  return weights.find(([, w]) => (roll -= w) < 0)?.[0] || "quiet";
}
export function establishExpedition(s: Game): Game {
  if (s.expedition.director) return s;
  const context: DirectorContext = {
    startFloor: s.startFloor,
    level:
      s.party.reduce((n, c) => n + c.level, 0) / Math.max(1, s.party.length),
    injuries: s.party.reduce((n, c) => n + c.injuries, 0),
    party: s.party.map((c) => c.id),
    skills: s.party.flatMap((c) => c.skills),
    faction: Math.max(
      s.faction.guild,
      s.faction.stag,
      ...Object.values(s.stories.factions),
    ),
    storyProgress: Object.values(s.stories.stages).reduce((n, v) => n + v, 0),
    remainingWatches: 180 - s.journey.watches,
  };
  const seed = seedFor(
      `${s.journey.seed}:director:${s.expedition.number}:${JSON.stringify(context)}`,
    ),
    rng = random(seed);
  const maps: Record<string, FloorMap> = { ...s.journey.maps },
    occupants: Game["journey"]["occupants"] = {},
    encounters: ExpeditionDirector["encounters"] = {};
  for (let floor = 1; floor <= 12; floor++)
    for (const route of floor >= 5 && floor <= 7
      ? ["roots", "frost", "forge", "crypt"]
      : [""]) {
      const key = mapKey(floor, route);
      maps[key] = prepareShortcuts(
        maps[key] || generateFloor(floor, s.journey.seed, route),
      );
      const map = maps[key];
      encounters[key] = {};
      occupants[key] = {};
      for (const room of Object.values(map.nodes).filter((n) =>
        ["crossroads", "dead-end"].includes(n.kind),
      )) {
        const late =
            context.remainingWatches -
              (Math.max(0, floor - context.startFloor) * 12 + room.depth) *
                BALANCE.watchesPerDay <
            B.forecastWatches,
          strong = context.level >= floor + 2;
        const kind = weighted(
          [
            ["quiet", B.quiet],
            ["beast", strong ? B.strongPatrol : B.patrol],
            [
              "hazard",
              route === "forge" || route === "crypt" ? B.routeHazard : B.hazard,
            ],
            ["cache", late ? B.lateCache : B.cache],
            ["spring", context.injuries ? B.injuredSpring : B.spring],
            [
              "company",
              context.injuries ||
              context.faction >= BALANCE.factionSupplyStanding
                ? B.alliedCompany
                : B.company,
            ],
          ],
          rng,
        );
        const roll = rng();
        const variant: DirectedEncounter["variant"] =
          kind === "beast"
            ? roll < B.ambushChance
              ? "ambush"
              : roll < B.ambushChance + B.eliteChance
                ? "elite"
                : "patrol"
            : kind === "company"
              ? roll < 0.4
                ? "survivors"
                : roll < 0.6
                  ? "merchant"
                  : "explorers"
              : kind === "cache"
                ? roll < B.rareChance
                  ? "rare"
                  : "cache"
                : kind;
        const gear = ITEMS.filter(
          (i) =>
            ["weapon", "armor", "helmet", "boots", "charm"].includes(i.kind) &&
            i.quality === (floor >= 8 ? "rare" : "fine") &&
            !i.faction &&
            gearFloor(i) <= floor,
        );
        encounters[key][room.id] = {
          kind,
          variant,
          rewardItem:
            variant === "rare"
              ? gear[Math.floor(rng() * gear.length)]?.id
              : undefined,
          approach:
            variant === "ambush"
              ? "Fresh tracks circle a narrow approach. The party can prepare before drawing the patrol out."
              : variant === "elite"
                ? "A disciplined patrol has fortified this chamber."
                : kind === "hazard"
                  ? `The ${route || "stone"} passage bears signs of a disturbed mechanism.`
                  : kind === "quiet"
                    ? "Only old tracks remain; this chamber is quiet this month."
                    : "Signs of this month's expedition remain in the chamber.",
        };
        occupants[key][room.id] = kind;
        encounters[key][room.id].lateKind =
          rng() < 0.5 ? "cache" : rng() < 0.5 ? "spring" : "quiet";
      }
    }
  const npcs: ExpeditionDirector["npcs"] = {};
  let offset = 0;
  for (const id of Object.keys(WORLD_NPCS) as WorldNpcId[]) {
    const desired = Math.min(12, s.startFloor + offset++);
    const candidates = Object.keys(encounters)
      .flatMap((key) =>
        Object.keys(encounters[key]).map((room) => ({ map: key, room })),
      )
      .filter(
        (p) =>
          maps[p.map].floor === desired &&
          (desired < 5 ||
            desired > 7 ||
            maps[p.map].routeId === (s.startRoute || s.route || "roots")) &&
          !Object.values(npcs).some(
            (old) => old?.map === p.map && old.room === p.room,
          ),
      );
    const place = candidates[Math.floor(rng() * candidates.length)];
    if (place) {
      npcs[id] = place;
      occupants[place.map][place.room] = "company";
      encounters[place.map][place.room] = {
        kind: "company",
        variant: WORLD_NPCS[id].role === "merchant" ? "merchant" : "explorers",
        approach: `An expedition crew has made a temporary stop here.`,
      };
    }
  }
  // The first floor always offers two real item chests, outside named NPC rooms.
  const firstKey = mapKey(1, null);
  if (encounters[firstKey]) {
    const candidates = Object.keys(encounters[firstKey]).filter(
      (room) =>
        !Object.values(npcs).some(
          (p) => p?.map === firstKey && p.room === room,
        ),
    );
    const existing = candidates.filter(
      (room) => encounters[firstKey][room].kind === "cache",
    );
    const spare = candidates.filter(
      (room) => encounters[firstKey][room].kind === "quiet",
    );
    const others = candidates.filter(
      (room) => !existing.includes(room) && !spare.includes(room),
    );
    for (const room of [...existing, ...spare, ...others].slice(0, 2)) {
      encounters[firstKey][room] = {
        ...encounters[firstKey][room],
        kind: "cache",
        variant: "cache",
        approach: "An ironbound chest is tucked behind the fallen stones.",
      };
      occupants[firstKey][room] = "cache";
    }
  }
  // Reserve content at entry. History is committed only when a traveller is encountered.
  const reserved = new Set<string>();
  let family = s.stories.genericFamily;
  for (const [key, slots] of Object.entries(encounters))
    for (const [room, slot] of Object.entries(slots)) {
      if (
        slot.kind !== "company" ||
        Object.values(npcs).some((p) => p?.map === key && p.room === room)
      )
        continue;
      const map = maps[key];
      const pool = GENERIC_ENCOUNTERS.filter(
        (c) =>
          map.floor >= c.minFloor &&
          map.floor <= c.maxFloor &&
          (!c.route || c.route === map.routeId) &&
          (!c.faction || s.faction[c.faction] >= (c.standing || 0)) &&
          (s.stories.genericHistory[c.id] ?? -2) < s.expedition.number - 1 &&
          !reserved.has(c.id) &&
          c.family !== family,
      );
      const content = pool[Math.floor(rng() * pool.length)];
      if (content) {
        slot.generic = {
          id: content.id,
          variant: Math.floor(rng() * content.variants.length),
        };
        reserved.add(content.id);
        family = content.family;
      } else {
        slot.kind = "quiet";
        slot.variant = "quiet";
        slot.approach = "Old tracks fade into a quiet chamber.";
        occupants[key][room] = "quiet";
      }
    }
  const director: ExpeditionDirector = {
    version: 1,
    seed,
    context,
    encounters,
    npcs,
  };
  return {
    ...s,
    journey: { ...s.journey, maps, occupants },
    expedition: {
      ...s.expedition,
      director,
      trail: {},
      roomVisits: { [mapKey(s.floor, s.route)]: [s.journey.room] },
    },
  };
}
export const directedEncounter = (s: Game, room = s.journey.room) =>
  s.expedition.director?.encounters[mapKey(s.floor, s.route)]?.[room];
/** Both alternatives were rolled at entry. First arrival locks the applicable one permanently for this month. */
export function lockEncounter(s: Game, room: string): Game {
  const key = mapKey(s.floor, s.route),
    slot = directedEncounter(s, room),
    director = s.expedition.director;
  if (!slot || slot.locked || !director) return s;
  const named = Object.values(director.npcs).some(
    (p) => p?.map === key && p.room === room,
  );
  const late =
    s.journey.watches >= B.lateWatch &&
    !named &&
    slot.lateKind &&
    slot.kind === "quiet";
  const encounter = {
    ...slot,
    kind: late ? slot.lateKind! : slot.kind,
    variant: late
      ? ((slot.lateKind === "cache"
          ? "cache"
          : slot.lateKind === "spring"
            ? "spring"
            : "quiet") as DirectedEncounter["variant"])
      : slot.variant,
    locked: true,
  };
  return {
    ...s,
    journey: {
      ...s.journey,
      occupants: {
        ...s.journey.occupants,
        [key]: { ...s.journey.occupants[key], [room]: encounter.kind },
      },
    },
    expedition: {
      ...s.expedition,
      director: {
        ...director,
        encounters: {
          ...director.encounters,
          [key]: { ...director.encounters[key], [room]: encounter },
        },
      },
    },
  };
}
