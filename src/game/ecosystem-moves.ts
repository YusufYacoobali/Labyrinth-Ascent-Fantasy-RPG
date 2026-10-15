import type { EnemyMove } from "./enemy-moves";
import type { Game } from "./engine";
import type { CombatEnemy } from "./round-combat";
import type { StatusId } from "./combat-status";
export interface Ecosystem {
  phaseWards?: number[];
  thresholds?: number[];
  moves: EnemyMove[];
  patterns: string[][];
  triggers?: {
    id: string;
    hp: number;
    uses: number;
    requires?: "space" | "minion" | "corpse";
  }[];
}
const attack = (
  id: string,
  name: string,
  power = 1,
  target: EnemyMove["target"] = "front",
  status?: StatusId,
): EnemyMove => ({
  id,
  name,
  kind: "strike",
  power,
  target,
  status,
  cooldown: id === "basic" ? 0 : 2,
  requiresCharge: [
    "slam",
    "storm",
    "rain",
    "whiteout",
    "ruin",
    "eclipse",
  ].includes(id),
});
const effect = (
  id: string,
  kind: string,
  name: string,
  power = 0,
): EnemyMove => ({
  id,
  kind,
  name,
  power,
  target: "self",
  cooldown: kind === "charge" ? 0 : 2,
});
const wave = (
  id: string,
  name: string,
  summon: string,
  limit = 1,
  count = 1,
): EnemyMove => ({
  ...effect(id, "summon", name),
  summon,
  limit,
  count,
  cooldown: 0,
});
export const ECOSYSTEMS: Record<string, Ecosystem> = {
  roadkeeper: {
    moves: [
      attack("basic", "Bone cleave"),
      effect(
        "counter",
        "counter",
        "Lock shields · physical counter stance",
        0.25,
      ),
      attack(
        "pike",
        "Roadbreaker · armor fracture",
        1.15,
        "front",
        "fractured",
      ),
    ],
    patterns: [["counter", "basic", "pike"]],
  },
  guardian: {
    thresholds: [0.5],
    moves: [
      attack("basic", "Stone hammer", 0.8),
      effect(
        "ward",
        "guard",
        "Rune shield · focus fragments or break the guardian",
      ),
      effect(
        "charge",
        "charge",
        "Charge a stone slam · interrupt before its next action",
      ),
      attack("slam", "Charged runic slam", 1.35, "all", "fractured"),
      wave("fragments", "Raise a runic fragment", "runic-fragment"),
    ],
    patterns: [
      ["charge", "slam", "ward", "basic"],
      ["charge", "slam", "ward", "slam"],
    ],
    triggers: [{ id: "fragments", hp: 0.75, uses: 1, requires: "space" }],
  },
  broodmother: {
    phaseWards: [0, 0, 0, 0.4],
    thresholds: [0.75, 0.5, 0.25],
    moves: [
      attack("basic", "Venom bite", 0.8, "front", "venom"),
      attack("spray", "Opening poison spray", 0.65, "all", "venom"),
      attack(
        "web",
        "Binding webs · cleanse or Guard",
        0.65,
        "weakest",
        "entangled",
      ),
      wave(
        "spiderlings",
        "Hatch two spiderlings · interrupt the mother",
        "spiderling",
        1,
        2,
      ),
      effect(
        "consume",
        "consume",
        "Consume a living spiderling · eliminate minions to deny healing",
        0.22,
      ),
      effect(
        "charge",
        "charge",
        "Prepare venom storm · break the mother before its next action",
      ),
      attack("storm", "Venom storm", 1.55, "all", "venom"),
    ],
    patterns: [
      ["spray", "basic", "web"],
      ["web", "spray", "basic"],
      ["spray", "web", "basic"],
      ["charge", "storm", "web"],
    ],
    triggers: [
      { id: "spiderlings", hp: 0.75, uses: 1, requires: "space" },
      { id: "consume", hp: 0.5, uses: 1, requires: "minion" },
    ],
  },
  revenant: {
    moves: [
      attack("basic", "Echoed touch", 0.8),
      effect(
        "veil",
        "veil",
        "Split into reflections · break or expose to reveal",
      ),
      attack("echo", "Duplicated echo volley", 0.7, "all", "exposed"),
      wave("mirage", "Call a shrine reflection", "echo-mirage"),
    ],
    patterns: [["veil", "echo", "basic"]],
    triggers: [{ id: "mirage", hp: 0.7, uses: 1, requires: "space" }],
  },
  frostfang: {
    moves: [
      attack("basic", "Pack bite", 0.9, "weakest"),
      attack(
        "pounce",
        "Pack pounce · target switching",
        1.2,
        "weakest",
        "chilled",
      ),
      effect("circle", "guard", "Circle the wounded"),
    ],
    patterns: [["basic", "pounce", "circle"]],
  },
  sentinel: {
    moves: [
      attack("basic", "Graveblade"),
      effect("ward", "guard", "Ancient burial ward"),
      attack("cleave", "Sepulchral sweep", 0.75, "all", "fractured"),
      wave("acolyte", "Raise a grave acolyte", "grave-acolyte"),
    ],
    patterns: [["ward", "basic", "cleave"]],
    triggers: [{ id: "acolyte", hp: 0.6, uses: 1, requires: "space" }],
  },
  ashen: {
    thresholds: [0.5],
    moves: [
      attack("basic", "Ashen cleave", 0.8, "front", "burning"),
      effect(
        "counter",
        "counter",
        "Fire retaliation stance · use nonphysical powers or wait",
        0.25,
      ),
      effect("charge", "charge", "Stoke furnace storm · interrupt the charge"),
      attack("storm", "Furnace storm", 1.4, "all", "burning"),
      wave("squire", "Call the ashen squire", "ash-squire"),
    ],
    patterns: [
      ["counter", "basic", "charge", "storm"],
      ["charge", "storm", "counter", "storm"],
    ],
    triggers: [{ id: "squire", hp: 0.75, uses: 1, requires: "space" }],
  },
  "pale-hunter": {
    moves: [
      attack("basic", "Pale cut", 0.85, "weakest"),
      effect("veil", "veil", "Concealing frost · break or expose to reveal"),
      attack(
        "trap",
        "Freezing trap · Guard or cleanse chill",
        1.1,
        "weakest",
        "chilled",
      ),
      wave("wisps", "Call a vault wisp", "ice-wisp"),
    ],
    patterns: [["veil", "trap", "basic"]],
    triggers: [{ id: "wisps", hp: 0.6, uses: 1, requires: "space" }],
  },
  "kings-blade": {
    moves: [
      attack("basic", "Royal thrust", 0.85, "weakest"),
      {
        ...effect("mark", "mark", "Execution mark · Guard, taunt or cleanse"),
        target: "weakest",
        status: "exposed",
      },
      attack(
        "execute",
        "Execute the marked companion",
        1.45,
        "marked",
        "bleeding",
      ),
      wave("guard", "Call a royal guard", "royal-guard"),
    ],
    patterns: [["mark", "execute", "basic"]],
    triggers: [{ id: "guard", hp: 0.6, uses: 1, requires: "space" }],
  },
  "hollow-king": {
    phaseWards: [0, 0, 0.2],
    thresholds: [0.66, 0.33],
    moves: [
      attack("basic", "Hollow decree", 0.8),
      effect(
        "charge",
        "charge",
        "Prepare Crown of Ruin · break, Guard or ward",
      ),
      attack("ruin", "Crown of Ruin", 1.35, "all", "burning"),
      wave(
        "knights",
        "Summon hollow knights · finite royal wave",
        "hollow-knight",
        2,
        2,
      ),
      effect(
        "final-charge",
        "charge",
        "Prepare the LAST ECLIPSE · interrupt or protect every companion",
      ),
      attack("eclipse", "Last Eclipse", 1.75, "all", "burning"),
    ],
    patterns: [
      ["charge", "ruin", "basic"],
      ["charge", "ruin", "basic", "ruin"],
      ["final-charge", "eclipse", "basic"],
    ],
    triggers: [
      { id: "knights", hp: 0.66, uses: 1, requires: "space" },
      { id: "knights", hp: 0.33, uses: 2, requires: "space" },
    ],
  },
  "roots-guardian": {
    thresholds: [0.5],
    moves: [
      attack("basic", "Heartroot lash", 0.85, "front", "venom"),
      effect("regrow", "heal", "Regrow the wounded heartwood"),
      attack("roots", "Entangling canopy", 0.75, "all", "entangled"),
      wave("sprouts", "Grow living root sprouts", "root-sprout", 1, 2),
      effect(
        "feed",
        "consume",
        "Reclaim a living sprout · eliminate it to deny healing",
        0.2,
      ),
    ],
    patterns: [
      ["basic", "regrow", "roots"],
      ["roots", "basic", "regrow"],
    ],
    triggers: [
      { id: "sprouts", hp: 0.75, uses: 1, requires: "space" },
      { id: "feed", hp: 0.4, uses: 1, requires: "minion" },
    ],
  },
  "frost-guardian": {
    thresholds: [0.5],
    moves: [
      attack("basic", "Rime lance", 0.85, "weakest", "chilled"),
      effect("charge", "charge", "Gather Whiteout · Guard or frost ward"),
      attack("whiteout", "Coordinated whiteout", 1.25, "all", "chilled"),
      wave("spirits", "Call frostwell spirits", "frost-wisp", 1, 2),
    ],
    patterns: [
      ["basic", "charge", "whiteout"],
      ["charge", "whiteout", "basic"],
    ],
    triggers: [{ id: "spirits", hp: 0.65, uses: 1, requires: "space" }],
  },
  "forge-guardian": {
    thresholds: [0.5],
    moves: [
      attack("basic", "Crucible hammer", 0.85, "front", "burning"),
      effect(
        "plates",
        "counter",
        "Close furnace plates · fire counter stance",
        0.3,
      ),
      effect("charge", "charge", "Pressurize molten rain · interrupt the vent"),
      attack("rain", "Molten rain", 1.4, "all", "burning"),
      wave("sparks", "Release furnace sparks", "furnace-spark", 1, 2),
    ],
    patterns: [
      ["plates", "basic", "charge", "rain"],
      ["charge", "rain", "plates", "basic"],
    ],
    triggers: [{ id: "sparks", hp: 0.65, uses: 1, requires: "space" }],
  },
  "crypt-guardian": {
    thresholds: [0.5],
    moves: [
      attack("basic", "Oathbreaker cut", 0.85),
      {
        ...attack(
          "drain",
          "Silence tithe · drains 8 MP",
          0.9,
          "weakest",
          "weakened",
        ),
        drain: 8,
      },
      effect(
        "revive",
        "revive",
        "Restore one fallen oathbearer · resurrection is finite",
        0.4,
      ),
      wave("bearers", "Raise crypt oathbearers", "crypt-bearer", 1, 2),
      attack("judgment", "Silent judgment", 1.2, "all", "exposed"),
    ],
    patterns: [
      ["basic", "drain", "basic"],
      ["drain", "judgment", "basic"],
    ],
    triggers: [
      { id: "bearers", hp: 0.75, uses: 1, requires: "space" },
      { id: "revive", hp: 1, uses: 1, requires: "corpse" },
    ],
  },
};
export const ECOSYSTEM_GROUPS: Record<
  string,
  { regular: string[]; portal?: string[] }
> = {
  plunderer: { regular: ["plunderer", "bonegnaw"] },
  bonegnaw: { regular: ["bonegnaw", "plunderer"] },
  roadkeeper: {
    regular: ["roadkeeper", "skeleton-pikeman"],
    portal: ["roadkeeper", "skeleton-pikeman", "skeleton-mender"],
  },
  guardian: { regular: ["guardian", "runic-fragment"], portal: ["guardian"] },
  broodmother: {
    regular: ["web-spinner", "spiderling"],
    portal: ["broodmother"],
  },
  revenant: {
    regular: ["revenant", "echo-mirage"],
    portal: ["revenant", "echo-mirage"],
  },
  frostfang: {
    regular: ["frostfang", "wolf-pack"],
    portal: ["frostfang", "wolf-pack", "wolf-pack"],
  },
  sentinel: {
    regular: ["sentinel", "grave-acolyte", "roadkeeper"],
    portal: ["sentinel", "grave-acolyte", "roadkeeper"],
  },
  ashen: { regular: ["ashen", "ash-squire"], portal: ["ashen"] },
  "pale-hunter": {
    regular: ["pale-hunter", "ice-wisp"],
    portal: ["pale-hunter", "ice-wisp"],
  },
  "kings-blade": {
    regular: ["kings-blade", "royal-guard"],
    portal: ["kings-blade", "royal-guard"],
  },
  "hollow-king": {
    regular: ["hollow-knight", "royal-guard"],
    portal: ["hollow-king"],
  },
};
for (const [route, minion] of [
  ["roots", "root-sprout"],
  ["frost", "wolf-pack"],
  ["forge", "furnace-spark"],
  ["crypt", "crypt-bearer"],
]) {
  ECOSYSTEM_GROUPS[`${route}-roamer`] = {
    regular: [`${route}-roamer`, minion],
  };
  ECOSYSTEM_GROUPS[`${route}-elite`] = {
    regular: [`${route}-elite`, `${route}-roamer`],
    portal: [`${route}-elite`, `${route}-roamer`, minion],
  };
  ECOSYSTEM_GROUPS[`${route}-guardian`] = {
    regular: [`${route}-roamer`, minion],
    portal: [`${route}-guardian`],
  };
}
export function authoredMove(s: Game, e: CombatEnemy): EnemyMove | undefined {
  const scheme = ECOSYSTEMS[e.behaviorId || ""];
  if (!scheme) return;
  const uses = e.usedMoves || {};
  const trigger = scheme.triggers?.find(
    (t) =>
      e.hp / e.maxHp <= t.hp &&
      (uses[t.id] || 0) < t.uses &&
      (!t.requires ||
        (t.requires === "space" &&
          s.combat!.enemies.filter((n) => n.hp > 0).length < 3) ||
        (t.requires === "minion" &&
          s.combat!.enemies.some(
            (n) => n.id !== e.id && n.hp > 0 && !n.boss,
          )) ||
        (t.requires === "corpse" &&
          [...s.combat!.enemies, ...(s.combat!.defeated || [])].some(
            (n) => n.hp <= 0 && n.id !== e.id,
          ))),
  );
  const pattern =
    scheme.patterns[Math.min(e.stage, scheme.patterns.length - 1)];
  const id =
    trigger?.id || pattern[((s.combat?.round || 1) - 1) % pattern.length];
  return scheme.moves.find((m) => m.id === id);
}
