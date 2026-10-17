import type { Item } from "./world";
import type { Recruit } from "./town-content";

/** Stable ordering also identifies each item's cell in its tier's art sheet. */
const FORMS = [
  ["sword", "Longsword", "weapon", "sword", { atk: 1 }],
  ["dagger", "Daggers", "weapon", "sword-cross", { atk: 0.65, speed: 0.4 }],
  ["axe", "Battleaxe", "weapon", "axe", { atk: 1.3, speed: -0.2 }],
  [
    "maul",
    "Warhammer",
    "weapon",
    "hammer",
    { atk: 1.15, def: 0.2, speed: -0.2 },
  ],
  ["spear", "Pike", "weapon", "sword", { atk: 0.85, def: 0.25 }],
  ["bow", "Longbow", "weapon", "bow-arrow", { atk: 0.8, speed: 0.35 }],
  ["crossbow", "Crossbow", "weapon", "crosshairs", { atk: 1.2, speed: -0.1 }],
  ["staff", "Spellstaff", "weapon", "magic-staff", { atk: 0.75, mp: 2 }],
  ["wand", "Wand", "weapon", "creation", { atk: 0.55, mp: 1.2, speed: 0.2 }],
  ["grimoire", "Grimoire", "weapon", "book-open-variant", { atk: 0.6, mp: 3 }],
  ["plate", "Platecoat", "armor", "shield", { def: 1.1, hp: 2, speed: -0.25 }],
  ["mail", "Chainmail", "armor", "tshirt-crew", { def: 0.9, hp: 1.5 }],
  ["leathers", "Leathers", "armor", "tshirt-crew", { def: 0.55, speed: 0.35 }],
  ["robes", "Robes", "armor", "tshirt-crew", { def: 0.4, mp: 3 }],
  ["mantle", "Mantle", "armor", "tshirt-crew", { def: 0.45, hp: 3, mp: 1 }],
  [
    "vest",
    "Scout Vest",
    "armor",
    "tshirt-crew",
    { def: 0.6, atk: 0.2, speed: 0.2 },
  ],
  ["helm", "Greathelm", "helmet", "shield", { def: 0.6, hp: 1.5, speed: -0.1 }],
  ["hood", "Hood", "helmet", "wizard-hat", { def: 0.3, mp: 1.5 }],
  ["circlet", "Circlet", "helmet", "crown-outline", { atk: 0.2, mp: 2 }],
  [
    "mask",
    "War Mask",
    "helmet",
    "domino-mask",
    { atk: 0.3, def: 0.25, speed: 0.15 },
  ],
  ["greaves", "Greaves", "boots", "shoe-formal", { def: 0.5, hp: 1 }],
  ["runners", "Trail Boots", "boots", "shoe-print", { def: 0.15, speed: 0.55 }],
  ["sandals", "Mage Sandals", "boots", "shoe-print", { mp: 1.5, speed: 0.25 }],
  ["sabatons", "Sabatons", "boots", "shoe-formal", { def: 0.65, speed: -0.15 }],
  ["signet", "Signet", "charm", "ring", { atk: 0.4 }],
  ["amulet", "Life Amulet", "charm", "necklace", { hp: 5 }],
  ["orb", "Mana Orb", "charm", "crystal-ball", { mp: 4 }],
  ["buckler", "Buckler", "charm", "shield", { def: 0.6 }],
  ["talisman", "Ward Talisman", "charm", "shield-star", { def: 0.3, hp: 1.5 }],
  ["compass", "Wayfinder", "charm", "compass", { speed: 0.3, mp: 1, hp: 1.5 }],
] as const;

export const MARKET_TIERS = [
  {
    id: "copper",
    name: "Coppertrail",
    power: 5,
    price: 70,
    quality: "common",
    flavor: "Honest gear for an uncertain road.",
  },
  {
    id: "steel",
    name: "Stormsteel",
    power: 13,
    price: 460,
    quality: "fine",
    flavor: "Made for adventurers who intend to return.",
  },
  {
    id: "moon",
    name: "Moonweave",
    power: 27,
    price: 2400,
    quality: "rare",
    flavor: "Moonlit runes hum beneath the surface.",
  },
  {
    id: "dragon",
    name: "Dragonwake",
    power: 52,
    price: 18000,
    quality: "rare",
    flavor: "Forged from the spoils of a forgotten wyrm.",
  },
  {
    id: "sovereign",
    name: "Sovereign",
    power: 100,
    price: 175000,
    quality: "legendary",
    flavor: "Royal vaults have been emptied for less.",
  },
  {
    id: "starfall",
    name: "Starfall",
    power: 220,
    price: 1800000,
    quality: "legendary",
    flavor: "Absurdly powerful. Priced accordingly.",
  },
] as const;

export const EXPANSION_ITEMS: Item[] = MARKET_TIERS.flatMap((tier, tierIndex) =>
  FORMS.map(([form, name, kind, icon, weights], cell): Item => {
    const stats = Object.fromEntries(
      Object.entries(weights).map(([key, weight]) => [
        key,
        Math.round(tier.power * weight),
      ]),
    );
    const price = Math.round(tier.price * (0.85 + (cell % 10) * 0.09));
    const resist =
      form === "talisman"
        ? {
            element: (
              [
                "physical",
                "venom",
                "frost",
                "fire",
                "physical",
                "physical",
              ] as const
            )[tierIndex],
            amount: [8, 15, 25, 35, 50, 65][tierIndex],
          }
        : undefined;
    const bonuses = Object.entries(stats).map(
      ([key, value]) => `${value >= 0 ? "+" : ""}${value} ${key.toUpperCase()}`,
    );
    if (resist) bonuses.push(`${resist.amount}% ${resist.element} resist`);
    return {
      id: `market-${tier.id}-${form}`,
      name: `${tier.name} ${name}`,
      kind,
      icon,
      quality: tier.quality,
      price,
      sell: Math.floor(price * 0.28),
      shopOnly: true,
      vendor:
        tierIndex >= 2
          ? "emporium"
          : [
                "staff",
                "wand",
                "grimoire",
                "robes",
                "hood",
                "circlet",
                "sandals",
                "orb",
                "talisman",
              ].includes(form)
            ? "alchemist"
            : "provisioner",
      ...stats,
      resist,
      description: `${bonuses.join(" · ")}. ${tier.flavor}`,
    };
  }),
);

export const marketItemCell = (id: string) => {
  const index = EXPANSION_ITEMS.findIndex((item) => item.id === id);
  return index < 0
    ? undefined
    : { tier: Math.floor(index / FORMS.length), cell: index % FORMS.length };
};

export const EXPANSION_RECRUITS: Recruit[] = [
  {
    id: "nessa",
    name: "Nessa",
    race: "human",
    portrait: 24,
    job: "Field Medic",
    level: 1,
    share: 12,
    skills: ["Second Wind"],
    stats: { hp: 110, mp: 85, atk: 16, def: 10, speed: 14 },
    tagline: "Warm hands. Terrible jokes.",
    trait: "Last Stand",
    traitDetail: "Below 35% HP, gain 8 defense.",
    motive: "honor",
    quote: "I charge for the bandages. The dreadful bedside jokes are free.",
    accept: "Deal. Try to keep your blood on the inside.",
    decline:
      "Healing takes supplies. Good intentions do not sterilise a bandage.",
  },
  {
    id: "orik",
    name: "Orik",
    race: "dwarf",
    portrait: 25,
    job: "Scrap Tinkerer",
    level: 2,
    share: 13,
    skills: ["Sling Shot", "Candle Ward"],
    stats: { hp: 135, mp: 55, atk: 21, def: 16, speed: 11 },
    tagline: "One man's junk. His next invention.",
    trait: "Stoneblood",
    traitDetail: "25% resistance to venom damage.",
    motive: "discovery",
    quote: "If it rattles, I can fix it. If it explodes, stand further back.",
    accept:
      "Excellent. You carry the sensible tools. I'll carry the interesting ones.",
    decline: "My inventions need parts, and parts cost more than compliments.",
  },
  {
    id: "vesper",
    name: "Vesper",
    race: "elf",
    portrait: 26,
    job: "Dusk Duelist",
    level: 4,
    share: 16,
    skills: ["Nerve Lock", "Echo Cut"],
    stats: { hp: 115, mp: 90, atk: 32, def: 11, speed: 26 },
    tagline: "A sharp smile. Sharper blades.",
    trait: "Moon Sight",
    traitDetail: "Attacks ignore half enemy armor.",
    motive: "glory",
    quote: "I'll take the first opening. You make sure there's a second.",
    accept: "A promising partnership. Do try to keep up.",
    decline: "You want my speed at a walking pace price.",
  },
  {
    id: "haldor",
    name: "Haldor",
    race: "barbarian",
    portrait: 27,
    job: "Frost Hunter",
    level: 5,
    share: 17,
    skills: ["Rime Fang", "Winter Veil"],
    stats: { hp: 185, mp: 70, atk: 36, def: 16, speed: 18 },
    tagline: "Winter taught him patience.",
    trait: "Iron Will",
    traitDetail: "Immune to paralysis when his talent is revealed.",
    motive: "honor",
    quote: "The cold takes the careless. I prefer to take its teeth.",
    accept: "Then we hunt together. Nobody gets left in the snow.",
    decline: "Frostbite was expensive enough. I don't hunt at a loss.",
  },
  {
    id: "ilyra",
    name: "Ilyra",
    race: "elf",
    portrait: 28,
    job: "Root Oracle",
    level: 6,
    share: 18,
    skills: ["Briar Lash", "Thorn Shelter"],
    stats: { hp: 145, mp: 150, atk: 30, def: 18, speed: 15 },
    tagline: "Gentle voice. Unforgiving thorns.",
    trait: "Venom Savant",
    traitDetail: "Party poison deals 50% more damage.",
    motive: "discovery",
    quote: "Roots survive by holding together. Perhaps we should try it.",
    accept: "Our roots are joined. Let us grow toward the summit.",
    decline: "Even the oldest tree cannot grow from an empty purse.",
  },
  {
    id: "cassian",
    name: "Cassian",
    race: "human",
    portrait: 29,
    job: "Bannerlord",
    level: 8,
    share: 20,
    skills: ["Sunder", "Royal Bulwark", "Inspiring Presence"],
    stats: { hp: 210, mp: 105, atk: 42, def: 30, speed: 14 },
    tagline: "The banner never falls.",
    trait: "Vanguard",
    traitDetail: "Party physical damage taken is reduced by 15%.",
    motive: "honor",
    quote: "A commander earns the right to lead by being the last to leave.",
    accept: "Raise the banner. This company will be remembered.",
    decline: "A seasoned commander costs more than a borrowed flag.",
  },
  {
    id: "dagna",
    name: "Dagna",
    race: "dwarf",
    portrait: 30,
    job: "Cinder Smith",
    level: 10,
    share: 22,
    skills: ["Furnace Brace", "Furnace Spark", "Ember Ward"],
    stats: { hp: 240, mp: 125, atk: 50, def: 35, speed: 10 },
    tagline: "Temper like a furnace. Heart like gold.",
    trait: "Stoneblood",
    traitDetail: "25% resistance to venom damage.",
    motive: "discovery",
    quote:
      "I've spent forty years making weapons. I'd like to test one on a king.",
    accept: "I'll bring the hammer. You find something worth flattening.",
    decline: "Do you have any idea what premium coal costs these days?",
  },
  {
    id: "zephyr",
    name: "Zephyr",
    race: "elf",
    portrait: 31,
    job: "Storm Archer",
    level: 12,
    share: 23,
    skills: ["Sling Shot", "Whiteout Shard", "Nerve Lock"],
    stats: { hp: 180, mp: 170, atk: 62, def: 21, speed: 38 },
    tagline: "Gone before the thunder.",
    trait: "Moon Sight",
    traitDetail: "Attacks ignore half enemy armor.",
    motive: "glory",
    quote: "The trick is to loose the arrow before fate has time to duck.",
    accept: "We're a company! Try not to blink during the impressive parts.",
    decline: "At that price, I could only promise to miss very elegantly.",
  },
  {
    id: "morrigan",
    name: "Morrigan",
    race: "human",
    portrait: 32,
    job: "Archmage",
    level: 18,
    share: 28,
    skills: ["Arcane Bolt", "Crown Pulse", "Oath Siphon", "Grave Guard"],
    stats: { hp: 240, mp: 360, atk: 115, def: 38, speed: 26 },
    tagline: "A walking catastrophe. Excellent manners.",
    trait: "Last Stand",
    traitDetail: "Below 35% HP, gain 8 defense.",
    motive: "discovery",
    quote:
      "I’ve seen what waits above the ice. Most of the people who were with me haven’t spoken of it since.",
    accept:
      "Very well. Let us do something the history books will struggle to explain.",
    decline:
      "That is an apprentice's offer. I have forgotten more spells than most kings can afford.",
  },
  {
    id: "astra",
    name: "Astra",
    race: "barbarian",
    portrait: 33,
    job: "Starbreaker",
    level: 25,
    share: 30,
    skills: ["Twin Strike", "Crown Pulse", "Second Wind", "Royal Bulwark"],
    stats: { hp: 480, mp: 260, atk: 190, def: 65, speed: 35 },
    tagline: "A living legend. Still looking for a challenge.",
    trait: "Reckless Heart",
    traitDetail: "Below 40% HP, strikes deal 35% more damage.",
    motive: "glory",
    quote:
      "I’ve beaten everything they’ve put in front of me. Bring me a challenge worth getting out of this chair for.",
    accept: "Good. Now point me at the tallest thing nobody has conquered.",
    decline: "I take the hardest fights. I expect a share that reflects that.",
  },
];
