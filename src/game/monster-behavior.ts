import type { Element } from "./world";
import type { Game } from "./engine";
import type { Archetype, CombatEnemy } from "./round-combat";
import { goblinIntent } from "./goblin-ecosystem";

export interface EnemyIntent {
  kind: string;
  label: string;
  targets: string[];
  power: number;
  summon?: string;
  limit?: number;
  cover?: number;
  slow?: number;
}

export interface SpeciesBehavior {
  role: Archetype;
  element: Element;
  speed: number;
  basic: string;
  special: string;
  defense: string;
  phases?: string[];
}
const behavior = (
  role: Archetype,
  element: Element,
  speed: number,
  basic: string,
  special: string,
  defense: string,
  phases?: string[],
): SpeciesBehavior => ({
  role,
  element,
  speed,
  basic,
  special,
  defense,
  phases,
});
export const SPECIES_BEHAVIOR: Record<string, SpeciesBehavior> = {
  "goblin-shieldbearer": behavior(
    "defender",
    "physical",
    20,
    "Shield shove",
    "Shield link",
    "Brace the shield",
  ),
  "goblin-slinger": behavior(
    "caster",
    "physical",
    12,
    "Sling stone",
    "Crippling pebble",
    "Hide behind rubble",
  ),
  goblin: behavior(
    "skirmisher",
    "physical",
    14,
    "Scout’s knife",
    "Flanking rush",
    "Duck behind cover",
  ),
  roadkeeper: behavior(
    "defender",
    "physical",
    8,
    "Bone cleave",
    "Roadbreaker",
    "Lock shields",
  ),
  guardian: behavior(
    "bruiser",
    "physical",
    10,
    "Stone hammer",
    "Runic slam",
    "Gather runes",
    ["Stone hammer", "Shattering sweep"],
  ),
  broodmother: behavior(
    "caster",
    "venom",
    11,
    "Venom bite",
    "Webbed venom spray",
    "Draw back into webs",
  ),
  revenant: behavior(
    "caster",
    "physical",
    17,
    "Echoed touch",
    "Refracted volley",
    "Fade into the basin",
  ),
  blight: behavior(
    "support",
    "venom",
    12,
    "Blight lance",
    "Toxic deluge",
    "Distil restorative sap",
    ["Blight lance", "Toxic deluge"],
  ),
  frostfang: behavior(
    "skirmisher",
    "frost",
    22,
    "Pack bite",
    "Rime pounce",
    "Circle the wounded",
  ),
  sentinel: behavior(
    "defender",
    "physical",
    9,
    "Graveblade",
    "Sepulchral sweep",
    "Ancient ward",
  ),
  ashen: behavior(
    "bruiser",
    "fire",
    15,
    "Ashen cleave",
    "Furnace storm",
    "Bank the furnace",
    ["Ashen cleave", "Furnace storm"],
  ),
  "pale-hunter": behavior(
    "skirmisher",
    "frost",
    25,
    "Pale cut",
    "Winter ambush",
    "Concealing frost",
  ),
  "kings-blade": behavior(
    "bruiser",
    "physical",
    23,
    "Royal thrust",
    "Execution cut",
    "Royal salute",
  ),
  "hollow-king": behavior(
    "caster",
    "fire",
    20,
    "Hollow decree",
    "Crown of ruin",
    "Gather royal fire",
    ["Hollow decree", "Crown of ruin", "Last eclipse"],
  ),
  plunderer: behavior(
    "skirmisher",
    "physical",
    18,
    "Hidden dagger",
    "Cut the purse",
    "False surrender",
  ),
  bonegnaw: behavior(
    "bruiser",
    "physical",
    12,
    "Gnawing bite",
    "Bone crunch",
    "Coil to spring",
  ),
  "roots-roamer": behavior(
    "skirmisher",
    "venom",
    17,
    "Briar rake",
    "Entangling rush",
    "Hide in the thorns",
  ),
  "roots-elite": behavior(
    "defender",
    "venom",
    11,
    "Thorn lash",
    "Root rupture",
    "Thornbound shell",
  ),
  "roots-guardian": behavior(
    "support",
    "venom",
    13,
    "Heartroot lash",
    "Canopy deluge",
    "Regrow the heartwood",
    ["Heartroot lash", "Canopy deluge"],
  ),
  "frost-roamer": behavior(
    "skirmisher",
    "frost",
    23,
    "Rime bite",
    "Coordinated pounce",
    "Circle through snow",
  ),
  "frost-elite": behavior(
    "defender",
    "frost",
    12,
    "Glacier cleave",
    "Icefall",
    "Glacier shell",
  ),
  "frost-guardian": behavior(
    "caster",
    "frost",
    19,
    "Rime lance",
    "Whiteout",
    "Gather the blizzard",
    ["Rime lance", "Whiteout"],
  ),
  "forge-roamer": behavior(
    "bruiser",
    "fire",
    16,
    "Cinder bite",
    "Furnace lunge",
    "Stoke the heart",
  ),
  "forge-elite": behavior(
    "defender",
    "fire",
    10,
    "Furnace blade",
    "Molten sweep",
    "Close the furnace plates",
  ),
  "forge-guardian": behavior(
    "bruiser",
    "fire",
    14,
    "Crucible hammer",
    "Molten rain",
    "Pressurize the crucible",
    ["Crucible hammer", "Molten rain"],
  ),
  "crypt-roamer": behavior(
    "caster",
    "physical",
    20,
    "Sepulchral touch",
    "Spectral volley",
    "Withdraw into shadow",
  ),
  "crypt-elite": behavior(
    "defender",
    "physical",
    10,
    "Oathbound cut",
    "Marshal’s sentence",
    "Raise the oathward",
  ),
  "crypt-guardian": behavior(
    "support",
    "physical",
    15,
    "Oathbreaker cut",
    "Silent judgment",
    "Restore the burial ward",
    ["Oathbreaker cut", "Silent judgment"],
  ),
};
export const MIXED_GROUPS: Record<string, string[]> = {
  goblin: ["goblin", "plunderer"],
  roadkeeper: ["roadkeeper", "bonegnaw"],
  guardian: ["guardian", "roadkeeper"],
  broodmother: ["broodmother", "bonegnaw"],
  revenant: ["revenant", "sentinel"],
  blight: ["blight", "bonegnaw"],
  frostfang: ["frostfang", "pale-hunter", "bonegnaw"],
  sentinel: ["sentinel", "revenant", "roadkeeper"],
  ashen: ["ashen", "sentinel", "plunderer"],
  "pale-hunter": ["pale-hunter", "frostfang", "sentinel"],
  "kings-blade": ["kings-blade", "sentinel", "plunderer"],
  plunderer: ["plunderer", "goblin"],
  bonegnaw: ["bonegnaw", "goblin"],
  "roots-roamer": ["roots-roamer", "roots-elite"],
  "roots-elite": ["roots-elite", "roots-roamer"],
  "frost-roamer": ["frost-roamer", "frost-elite"],
  "frost-elite": ["frost-elite", "frost-roamer"],
  "forge-roamer": ["forge-roamer", "forge-elite"],
  "forge-elite": ["forge-elite", "forge-roamer"],
  "crypt-roamer": ["crypt-roamer", "crypt-elite"],
  "crypt-elite": ["crypt-elite", "crypt-roamer"],
};
export function speciesIntent(s: Game, e: CombatEnemy): EnemyIntent | null {
  const profile = e.behaviorId ? SPECIES_BEHAVIOR[e.behaviorId] : undefined;
  if (!profile) return null; // Existing saved battles retain their accepted behavior until finished.
  const alive = s.party.filter((c) => c.hp > 0),
    round = s.combat?.round || 1;
  const weakest = [...alive].sort(
    (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || (a.id < b.id ? -1 : 1),
  )[0];
  const target =
    profile.role === "skirmisher"
      ? weakest
      : alive[(round + profile.speed) % Math.max(1, alive.length)];
  if (e.broken || e.paralysis)
    return { kind: "wait", label: "Interrupted", targets: [], power: 0 };
  const goblin = goblinIntent(s, e);
  if (goblin) return goblin;
  if (e.boss) {
    if (round % 3 === 1)
      return { kind: "charge", label: profile.defense, targets: [], power: 0 };
    return {
      kind: "strike",
      label: profile.phases?.[e.stage] || profile.special,
      targets:
        e.stage > 0 && round % 3 === 2
          ? alive.map((c) => c.id)
          : target
            ? [target.id]
            : [],
      power: round % 3 === 2 ? 1.45 + e.stage * 0.15 : 0.8,
    };
  }
  if (
    profile.role === "support" &&
    s.combat?.enemies.some((n) => n.hp > 0 && n.hp < n.maxHp * 0.7)
  )
    return { kind: "heal", label: profile.defense, targets: [], power: 0 };
  if (round % 3 === 1 && profile.role === "defender")
    return { kind: "guard", label: profile.defense, targets: [], power: 0 };
  if (round % 3 === 1 && profile.role === "bruiser")
    return { kind: "charge", label: profile.defense, targets: [], power: 0 };
  const volley = profile.role === "caster" && round % 3 === 2;
  return {
    kind: "strike",
    label:
      volley || e.charged || round % 3 === 2 ? profile.special : profile.basic,
    targets: volley ? alive.map((c) => c.id) : target ? [target.id] : [],
    power: volley ? 0.65 : e.charged ? 1.7 : 1,
  };
}
