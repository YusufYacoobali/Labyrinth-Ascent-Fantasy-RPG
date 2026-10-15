/** Original code-native pixel silhouettes. Shared drawing primitives keep outlines,
 * scale and palettes consistent; each species owns its anatomy, equipment and crest.
 * Paths merge same-colour pixel runs, avoiding hundreds of drawing nodes per figure. */
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
export interface SpeciesArt {
  width: 40;
  height: 48;
  paths: { color: string; path: string }[];
  pixels: (string | null)[];
  profile: ArtProfile;
  uri: string;
}
function paint(profile: ArtProfile): SpeciesArt {
  const { body, base, shade, light, accent, gear, variant } = profile,
    grid: (string | null)[] = Array(40 * 48).fill(null);
  const put = (x: number, y: number, c: string) => {
    if (x >= 1 && x < 39 && y >= 1 && y < 47)
      grid[Math.floor(y) * 40 + Math.floor(x)] = c;
  };
  const box = (x: number, y: number, w: number, h: number, c: string) => {
    for (let i = x; i < x + w; i++)
      for (let j = y; j < y + h; j++) put(i, j, c);
  };
  const line = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    c: string,
    width = 1,
  ) => {
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= n; i++)
      box(
        Math.round(ax + ((bx - ax) * i) / Math.max(1, n)),
        Math.round(ay + ((by - ay) * i) / Math.max(1, n)),
        width,
        width,
        c,
      );
  };
  const oval = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    for (let x = cx - rx; x <= cx + rx; x++)
      for (let y = cy - ry; y <= cy + ry; y++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, c);
  };
  const stripe = (x: number, y: number, w: number) => {
    box(x, y, w, 2, shade);
    box(x, y, w - 1, 1, light);
  };
  const eye = (x: number, y: number) => {
    box(x, y, 4, 3, "#111725");
    box(x, y, 2, 1, accent);
  };
  if (["goblin", "bone", "knight", "mage"].includes(body)) {
    const wide = body === "knight" ? 2 : 0;
    box(15 - wide, 19, 17 + wide * 2, 15, shade);
    box(16 - wide, 18, 13 + wide * 2, 12, base);
    box(16 - wide, 19, 4, 10, light);
    box(17, 32, 5, 9, base);
    box(27, 32, 5, 10, shade);
    box(14, 41, 9, 4, shade);
    box(25, 42, 10, 3, base);
    box(14, 41, 8, 1, light);
    box(10 - wide, 20, 5, 14, base);
    box(9 - wide, 31, 6, 5, shade);
    box(30 + wide, 20, 5, 14, shade);
    box(30 + wide, 31, 5, 4, base);
    oval(23, 12, 8, 8, shade);
    box(16, 6, 12, 12, base);
    box(17, 7, 4, 4, light);
    box(
      15,
      12,
      8,
      7,
      body === "goblin" ? "#a6aa70" : body === "bone" ? "#dbd6b9" : shade,
    );
    eye(16, 12);
    box(16, 17, 6, 1, shade);
    box(28, 8, 3, 8, shade);
    box(25, 20, 3, 10, shade);
    stripe(16, 30, 15);
    if (body === "goblin") {
      line(16, 8, 9, 6, base, 2);
      line(28, 8, 34, 5, base, 2);
      box(12, 24, 19, 7, "#695442");
      box(16, 25, 4, 2, accent);
      box(17, 17, 1, 2, light);
    }
    if (body === "bone") {
      box(17, 22, 13, 9, shade);
      for (let y = 22; y < 30; y += 3) box(18, y, 11, 1, light);
      box(23, 21, 2, 12, base);
      box(17, 9, 9, 3, light);
      eye(16, 12);
      box(19, 17, 1, 2, shade);
    }
    if (body === "knight") {
      box(13 - wide, 18, 9, 5, light);
      box(29, 17, 7 + wide, 6, base);
      box(16, 7, 14, 4, light);
      box(14, 12, 14, 3, shade);
      box(15, 12, 7, 1, accent);
      box(21, 21, 7, 6, shade);
      box(23, 22, 3, 4, accent);
    }
    if (body === "mage") {
      box(15, 26, 17, 15, shade);
      box(12, 37, 22, 5, base);
      box(14, 29, 5, 11, light);
      box(29, 15, 5, 27, shade);
      box(16, 5, 13, 4, shade);
      box(15, 7, 6, 12, base);
      eye(17, 12);
      box(24, 31, 2, 9, accent);
    }
  } else if (body === "wolf") {
    oval(25, 30, 11, 7, shade);
    oval(22, 27, 11, 7, base);
    box(18, 23, 13, 3, light);
    box(17, 32, 5, 10, shade);
    box(28, 33, 4, 9, shade);
    box(14, 40, 8, 3, base);
    box(25, 40, 8, 3, base);
    oval(12, 27, 8, 7, base);
    box(3, 28, 10, 5, light);
    box(3, 31, 9, 2, shade);
    box(5, 33, 2, 2, light);
    line(7, 21, 8, 16, shade, 3);
    line(15, 20, 17, 16, shade, 2);
    eye(6, 25);
    line(32, 26, 36, 19, base, 3);
    line(36, 20, 37, 29, light, 2);
    stripe(21, 29, 10);
  } else if (body === "spider") {
    for (const y of [22, 28, 33]) {
      line(17, y, 6, y - 5, shade, 2);
      line(6, y - 5, 3, y + 5, base, 2);
      line(25, y, 35, y - 5, shade, 2);
      line(35, y - 5, 37, y + 6, light, 1);
    }
    oval(24, 25, 9, 10, shade);
    oval(22, 23, 7, 8, base);
    oval(20, 21, 3, 4, light);
    oval(12, 28, 6, 6, base);
    box(7, 26, 4, 3, shade);
    eye(7, 26);
    box(11, 25, 2, 2, accent);
    box(8, 33, 2, 4, light);
    box(13, 33, 2, 4, light);
    box(24, 21, 3, 8, accent);
    if (variant === 6) {
      line(25, 11, 30, 7, light);
      line(30, 7, 35, 12, light);
      line(25, 11, 35, 12, light);
      line(30, 7, 29, 18, light);
    }
  } else if (body === "tree") {
    const giant = variant === 20;
    box(17, 18, giant ? 15 : 11, 21, shade);
    box(17, 17, giant ? 11 : 8, 20, base);
    box(18, 20, 2, 13, light);
    line(18, 38, 10, 44, shade, 3);
    line(24, 38, 32, 44, base, 3);
    line(18, 27, 8, 20, base, 3);
    line(8, 20, 7, 13, light, 2);
    line(27, 26, 34, 19, shade, 3);
    line(34, 20, 35, 11, base, 2);
    oval(22, 13, 8, 9, base);
    box(18, 9, 7, 3, light);
    eye(16, 14);
    box(19, 20, 6, 2, shade);
    line(21, 7, 14, 3, shade, 2);
    line(24, 7, 29, 2, base, 2);
    oval(13, 6, 5, 3, light);
    oval(30, 4, 4, 3, base);
    box(23, 27, 3, 5, accent);
    if (variant === 14) {
      oval(20, 17, 11, 6, base);
      oval(14, 13, 5, 4, light);
    }
  } else if (body === "golem") {
    if (variant === 4) {
      for (const [x, y, sz] of [
        [18, 9, 8],
        [8, 25, 6],
        [27, 22, 9],
        [19, 36, 5],
      ]) {
        box(x, y, sz, sz + 2, shade);
        box(x, y, sz - 2, 3, light);
        box(x + 2, y + 4, 2, 3, accent);
      }
    } else {
      box(11, 17, 23, 20, shade);
      box(11, 17, 18, 17, base);
      box(12, 18, 4, 13, light);
      box(4, 18, 9, 17, base);
      box(32, 20, 5, 17, shade);
      box(12, 34, 7, 10, base);
      box(27, 34, 7, 10, shade);
      box(9, 42, 12, 3, shade);
      box(26, 42, 10, 3, base);
      box(14, 6, 17, 13, shade);
      box(14, 6, 14, 10, base);
      box(14, 7, 5, 3, light);
      eye(14, 12);
      box(20, 23, 8, 9, shade);
      box(21, 24, 5, 6, accent);
      stripe(13, 35, 19);
      for (let y = 20; y < 35; y += 5) box(5, y, 7, 1, light);
    }
  } else {
    const flame = gear === "flame";
    oval(23, 20, 10, 12, shade);
    oval(21, 19, 8, 10, base);
    oval(18, 16, 5, 6, light);
    box(15, 21, 9, 7, shade);
    eye(15, 22);
    box(21, 27, 4, 2, accent);
    line(16, 29, 11, 39, base, 3);
    line(23, 30, 28, 42, shade, 3);
    line(27, 26, 34, 33, base, 2);
    line(16, 14, 12, 7, light, 2);
    line(23, 10, 26, 3, base, 3);
    if (flame) {
      line(20, 9, 20, 2, accent, 2);
      line(13, 20, 8, 13, base, 2);
      box(17, 14, 4, 4, accent);
    } else {
      box(8, 34, 3, 3, light);
      box(31, 14, 2, 2, accent);
      box(26, 39, 2, 2, accent);
    }
  }
  if (gear === "shield") {
    box(5, 23, 12, 16, shade);
    box(6, 23, 9, 13, base);
    box(6, 23, 2, 12, light);
    box(9, 27, 4, 7, accent);
    box(8, 29, 6, 2, light);
  }
  if (gear === "sword") {
    line(9, 36, 4, 14, light, 2);
    box(5, 30, 9, 2, accent);
    box(10, 33, 2, 5, shade);
  }
  if (gear === "pike") {
    line(5, 5, 8, 43, "#82725e", 2);
    line(5, 3, 3, 9, light, 2);
    line(5, 3, 8, 8, base, 2);
    box(4, 11, 5, 2, accent);
  }
  if (gear === "staff") {
    line(6, 11, 9, 43, "#877653", 2);
    oval(6, 9, 4, 5, shade);
    oval(5, 8, 2, 3, accent);
    box(5, 7, 1, 1, light);
  }
  if (gear === "axe") {
    line(9, 11, 10, 43, "#95836b", 2);
    box(3, 9, 12, 7, shade);
    box(3, 9, 9, 3, light);
    box(4, 11, 5, 6, base);
    box(5, 12, 3, 2, accent);
  }
  if (gear === "sling") {
    line(8, 23, 4, 12, "#d0b08a");
    line(4, 12, 9, 8, light);
    line(9, 8, 13, 13, base);
    line(13, 13, 8, 23, "#d0b08a");
    box(5, 11, 4, 3, accent);
  }
  if (gear === "book") {
    box(4, 26, 12, 8, shade);
    box(5, 26, 9, 6, light);
    box(9, 26, 1, 7, base);
    box(6, 28, 2, 1, accent);
  }
  if (gear === "casket") {
    box(29, 8, 7, 29, shade);
    box(30, 9, 5, 26, base);
    box(31, 13, 2, 14, light);
    box(29, 20, 7, 2, accent);
  }
  if (gear === "horns") {
    line(14, 8, 8, 3, light, 2);
    line(28, 8, 33, 2, base, 2);
    box(19, 4, 3, 5, accent);
  }
  if (gear === "thorns") {
    for (const x of [19, 24, 29]) line(x, 23, x + 2, 17, accent, 2);
  }
  if (gear === "shards") {
    for (const [x, y] of [
      [8, 14],
      [30, 10],
      [33, 34],
    ]) {
      line(x, y, x - 2, y + 4, light, 2);
      line(x - 2, y + 4, x + 1, y + 6, base, 2);
    }
  }
  if (gear === "flame") {
    line(27, 21, 31, 11, accent, 2);
    line(31, 11, 29, 7, light, 2);
    line(32, 23, 35, 15, base, 2);
  }
  // Authored royal, forge and marshal headgear changes their silhouettes.
  if (variant === 12) {
    box(16, 4, 14, 3, accent);
    for (const x of [16, 22, 28]) box(x, 1, 2, 4, light);
  }
  if (variant === 10) {
    line(30, 19, 34, 11, accent, 2);
    line(34, 11, 33, 8, light, 2);
  }
  if (variant === 22) {
    line(31, 20, 36, 12, light, 2);
    line(15, 18, 12, 12, accent, 2);
  }
  if (variant === 25) {
    box(29, 2, 4, 11, shade);
    box(28, 2, 6, 2, light);
    box(30, 4, 1, 5, accent);
  }
  if (variant === 28) {
    box(29, 12, 7, 27, shade);
    box(30, 13, 2, 24, accent);
    box(18, 3, 11, 3, light);
  }
  // Species crests are anatomy/detail differences, not just palette swaps.
  box(22, (variant % 3) + 23, 1 + (variant % 4), 1, accent);
  if (variant % 2) box(29, 33, 2, 3, light);
  else box(16, 35, 2, 2, accent);
  const painted = [...grid];
  for (let y = 1; y < 47; y++)
    for (let x = 1; x < 39; x++)
      if (painted[y * 40 + x])
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ])
          if (!grid[(y + dy) * 40 + x + dx])
            grid[(y + dy) * 40 + x + dx] = "#131722";
  const grouped: Record<string, string> = {};
  for (let y = 0; y < 48; y++)
    for (let x = 0; x < 40;) {
      const color = grid[y * 40 + x];
      if (!color) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < 40 && grid[y * 40 + end] === color) end++;
      grouped[color] =
        (grouped[color] || "") + `M${x} ${y}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  const paths = Object.entries(grouped).map(([color, path]) => ({
    color,
    path,
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" shape-rendering="crispEdges">${paths.map((p) => `<path fill="${p.color}" d="${p.path}"/>`).join("")}</svg>`;
  return {
    width: 40,
    height: 48,
    paths,
    pixels: grid,
    profile,
    uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}
export const SPECIES_ART = Object.fromEntries(
  Object.entries(SPECIES_PROFILES).map(([id, profile]) => [id, paint(profile)]),
);
