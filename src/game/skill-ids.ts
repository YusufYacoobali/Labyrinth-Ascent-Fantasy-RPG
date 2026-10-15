/** Persist these identities independently of their current display names. */
export const SKILL_IDS = {
  "Ossuary Mend": "ossuary-mend",
  "Pike Thrust": "pike-thrust",
  "Shard Ward": "shard-ward",
  "Venom Needle": "venom-needle",
  "Silken Snare": "silken-snare",
  "Echo Cut": "echo-cut",
  "Pack Pounce": "pack-pounce",
  "Burial Hymn": "burial-hymn",
  "Cinder Riposte": "cinder-riposte",
  "Rime Lance": "rime-lance",
  "Royal Bulwark": "royal-bulwark",
  "Hollow Cleave": "hollow-cleave",
  "Root Renewal": "root-renewal",
  "Whiteout Shard": "whiteout-shard",
  "Furnace Spark": "furnace-spark",
  "Oath Siphon": "oath-siphon",
  "Heartroot Covenant": "heartroot-covenant",
  "Winter Reckoning": "winter-reckoning",
  "Crucible Mantle": "crucible-mantle",
  "Oath Return": "oath-return",
  "Arcane Bolt": "arcane-bolt",
  "Shield Bash": "shield-bash",
  "Second Wind": "second-wind",
  "Inspiring Presence": "inspiring-presence",
  "Venom Fang": "venom-fang",
  "Nerve Lock": "nerve-lock",
  "Twin Strike": "twin-strike",
  "Candle Ward": "candle-ward",
  "Sling Shot": "sling-shot",
  "Ember Ward": "ember-ward",
  "Winter Veil": "winter-veil",
  "Toxic Adaptation": "toxic-adaptation",
  "Grave Guard": "grave-guard",
  Sunder: "sunder",
  "Crown Pulse": "crown-pulse",
  Scavenge: "scavenge",
} as const;
export type SkillName = keyof typeof SKILL_IDS;
export type SkillId = (typeof SKILL_IDS)[SkillName];
export const SKILL_NAMES = Object.fromEntries(
  Object.entries(SKILL_IDS).map(([name, id]) => [id, name]),
) as Record<SkillId, SkillName>;

/** Transform mechanical fields only: never rewrite character names or narrative text. */
function transform(value: unknown, encode: boolean, context = ""): unknown {
  const lookup: Record<string, string> = encode ? SKILL_IDS : SKILL_NAMES;
  const convert = (name: string) => lookup[name] || name;
  if (Array.isArray(value)) {
    if (["skills", "learnedSkills", "provisionalSkills"].includes(context))
      return value.map((v) => (typeof v === "string" ? convert(v) : v));
    return value.map((v) => transform(v, encode));
  }
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value);
  return Object.fromEntries(
    entries.map(([key, item]) => {
      const mechanical = ["mastery", "battleMastery", "cooldowns"].includes(
        context,
      );
      const convertedKey =
        mechanical && typeof item === "number" ? convert(key) : key;
      if (key === "skill" && typeof item === "string")
        return [key, convert(item)];
      // Combat mastery adds a character-ID layer; provisional skills add a roster layer.
      const nestedContext =
        context === "provisionalSkills" ||
        (context === "mastery" && typeof item === "object")
          ? context
          : key;
      return [convertedKey, transform(item, encode, nestedContext)];
    }),
  );
}
export function serializeSave(value: unknown): string {
  return JSON.stringify({
    ...(transform(value, true) as object),
    skillEncoding: "id-v1",
  });
}
export function deserializeSave<T>(value: T): T {
  return transform(value, false) as T;
}
