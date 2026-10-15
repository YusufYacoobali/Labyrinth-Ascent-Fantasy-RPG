/** Shared palette and attack presentation for the thirty expansion species.
 * Final character artwork lives in assets/combat/<species>-motion.png. */
export type PixelBody =
  | "goblin"
  | "bone"
  | "knight"
  | "mage"
  | "wolf"
  | "spider"
  | "tree"
  | "golem"
  | "spirit";
export interface ArtProfile {
  body: PixelBody;
  base: string;
  shade: string;
  light: string;
  accent: string;
  gear:
    | "shield"
    | "sling"
    | "pike"
    | "staff"
    | "axe"
    | "sword"
    | "book"
    | "casket"
    | "horns"
    | "thorns"
    | "shards"
    | "flame";
  variant: number;
  style: "melee" | "arrow" | "magic" | "slam";
}
const P = (
  body: PixelBody,
  base: string,
  shade: string,
  light: string,
  accent: string,
  gear: ArtProfile["gear"],
  variant: number,
  style: ArtProfile["style"] = "melee",
): ArtProfile => ({ body, base, shade, light, accent, gear, variant, style });
export const SPECIES_PROFILES: Record<string, ArtProfile> = {
  "goblin-shieldbearer": P(
    "goblin",
    "#75954c",
    "#344b33",
    "#b5bd69",
    "#e8bb65",
    "shield",
    0,
  ),
  "goblin-slinger": P(
    "goblin",
    "#7da666",
    "#3e5345",
    "#bbd194",
    "#d6a265",
    "sling",
    1,
    "arrow",
  ),
  "skeleton-mender": P(
    "mage",
    "#788c98",
    "#38485d",
    "#d4dbc9",
    "#8edfb9",
    "staff",
    2,
    "magic",
  ),
  "skeleton-pikeman": P(
    "bone",
    "#bac3b4",
    "#566576",
    "#e6e2c6",
    "#dc9c60",
    "pike",
    3,
  ),
  "runic-fragment": P(
    "golem",
    "#557b87",
    "#2b414e",
    "#9bbdb6",
    "#64e9e9",
    "shards",
    4,
    "magic",
  ),
  spiderling: P(
    "spider",
    "#638258",
    "#293d3d",
    "#9db75e",
    "#b6e98b",
    "thorns",
    5,
  ),
  "web-spinner": P(
    "spider",
    "#9e81a5",
    "#4b3b62",
    "#d3b0d1",
    "#e4d8a0",
    "shards",
    6,
    "magic",
  ),
  "echo-mirage": P(
    "spirit",
    "#598fba",
    "#314967",
    "#add6d8",
    "#99e8ff",
    "sword",
    7,
    "magic",
  ),
  "wolf-pack": P(
    "wolf",
    "#7a96a8",
    "#35485d",
    "#d2e1de",
    "#8addf5",
    "horns",
    8,
  ),
  "grave-acolyte": P(
    "mage",
    "#827497",
    "#3f3b55",
    "#b8b3c1",
    "#a1cda3",
    "book",
    9,
    "magic",
  ),
  "ash-squire": P(
    "knight",
    "#8e6461",
    "#3c3340",
    "#c5a185",
    "#f9a864",
    "shield",
    10,
  ),
  "ice-wisp": P(
    "spirit",
    "#70b0ce",
    "#386080",
    "#c6edf1",
    "#f6fcff",
    "shards",
    11,
    "magic",
  ),
  "royal-guard": P(
    "knight",
    "#9d8876",
    "#403e50",
    "#d7c39c",
    "#f5d982",
    "shield",
    12,
  ),
  "hollow-knight": P(
    "knight",
    "#716c8b",
    "#302e47",
    "#aca6bc",
    "#b7a3f5",
    "sword",
    13,
  ),
  "root-sprout": P(
    "tree",
    "#8d9b57",
    "#3d553c",
    "#c0c975",
    "#d2eea5",
    "thorns",
    14,
    "magic",
  ),
  "frost-wisp": P(
    "spirit",
    "#8da6d2",
    "#4a5d8d",
    "#d5e9f8",
    "#9ae9f0",
    "horns",
    15,
    "magic",
  ),
  "furnace-spark": P(
    "spirit",
    "#c87944",
    "#673f40",
    "#f3bc6d",
    "#ffe5a0",
    "flame",
    16,
    "magic",
  ),
  "crypt-bearer": P(
    "bone",
    "#928978",
    "#4b4a58",
    "#d3c4a0",
    "#bb9de1",
    "casket",
    17,
    "magic",
  ),
  "roots-roamer": P(
    "wolf",
    "#6e8753",
    "#354c38",
    "#a5b472",
    "#d3e897",
    "thorns",
    18,
  ),
  "roots-elite": P(
    "tree",
    "#8e8055",
    "#4c4c37",
    "#c0b884",
    "#9cde9a",
    "staff",
    19,
    "magic",
  ),
  "roots-guardian": P(
    "tree",
    "#687c50",
    "#30473b",
    "#a9aa6a",
    "#d1f79c",
    "horns",
    20,
    "slam",
  ),
  "frost-roamer": P(
    "wolf",
    "#b2c9cf",
    "#526681",
    "#e6f0df",
    "#a2e4fb",
    "shards",
    21,
  ),
  "frost-elite": P(
    "knight",
    "#7199b3",
    "#34495e",
    "#b6d3d8",
    "#cbf6fd",
    "axe",
    22,
    "slam",
  ),
  "frost-guardian": P(
    "golem",
    "#8caec3",
    "#455c7b",
    "#cfe2ed",
    "#c6fbff",
    "horns",
    23,
    "slam",
  ),
  "forge-roamer": P(
    "wolf",
    "#856651",
    "#3f3540",
    "#cba56c",
    "#ffba59",
    "flame",
    24,
  ),
  "forge-elite": P(
    "knight",
    "#7b6961",
    "#35323d",
    "#c0a187",
    "#f3ad56",
    "axe",
    25,
    "slam",
  ),
  "forge-guardian": P(
    "golem",
    "#8f7360",
    "#443b40",
    "#c7a67a",
    "#ffd276",
    "flame",
    26,
    "slam",
  ),
  "crypt-roamer": P(
    "spirit",
    "#8a7aa3",
    "#3c354f",
    "#c2b0ca",
    "#d4b3f5",
    "book",
    27,
    "magic",
  ),
  "crypt-elite": P(
    "bone",
    "#a99a86",
    "#49495a",
    "#ded6b9",
    "#d1aeec",
    "pike",
    28,
  ),
  "crypt-guardian": P(
    "golem",
    "#9a8e9b",
    "#484456",
    "#d7c7b8",
    "#e4bdfb",
    "casket",
    29,
    "magic",
  ),
};
