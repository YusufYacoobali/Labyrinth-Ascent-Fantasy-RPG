import type { Game } from "./engine";
import type { StoryStage } from "./story-types";
export function contextualStoryStage(s: Game, stage: StoryStage): StoryStage {
  const roster =
      stage.location === "town"
        ? [...s.party, ...s.reserve]
        : s.party.filter((c) => c.hp > 0),
    notes: string[] = [];
  const injured = roster.find((c) => c.injuries > 0);
  if (injured && stage.location === "field")
    notes.push(
      `${injured.name} sits down to spare an old injury while you take a closer look.`,
    );
  const prior = Object.entries(s.stories.outcomes).find(
    ([id]) =>
      id.startsWith(
        (stage.id.startsWith("floor.")
          ? stage.id.split(".").slice(0, 2).join(".")
          : stage.id.split(".")[0]) + ".",
      ) && id !== stage.id,
  );
  if (
    prior &&
    ["dismiss", "sell", "harvest", "seal", "concession", "reserve"].includes(
      prior[1],
    )
  )
    notes.push(
      "Someone asks what happened to the papers you found earlier. The question hangs there for a moment.",
    );
  let extra: { label: string; outcome: string; item?: string } | undefined;
  if (
    stage.id === "floor.2.investigation" &&
    roster.some((c) => c.race === "dwarf")
  )
    extra = {
      label: "Read the caravan maker's pressure marks",
      outcome:
        "Your dwarven companion finds the overwritten cargo weights. The second ledger now has physical proof of the missing medicine.",
      item: "beast-core",
    };
  if (
    stage.id === "floor.3.investigation" &&
    roster.some(
      (c) =>
        c.skills.includes("Arcane Bolt") || c.skills.includes("Shard Ward"),
    )
  )
    extra = {
      label: "Trace the rune without disturbing its ward",
      outcome:
        "The trained pattern reveals a second signature beneath the clan seal. You preserve the rune and recover a loose guard fragment.",
      item: "relic-fragment",
    };
  if (
    stage.id === "lyria.echo" &&
    roster.some((c) => c.race === "elf") &&
    s.npcs?.elian?.helped
  )
    extra = {
      label: "Compare Elian's weather notes with the root inscription",
      outcome:
        "The living script and Elian's notes agree on the flooded season. Kael and Lyria can preserve both memories with a dated account.",
    };
  if (
    stage.id === "floor.6.investigation" &&
    roster.some(
      (c) =>
        c.equipment.includes("venom-ring") ||
        c.equipment.includes("root-mantle"),
    )
  )
    extra = {
      label: "Use the protected sampler to recover the full recipe",
      outcome:
        "The venom-proof equipment lets you preserve the medicine without destroying the false debt entries. A sealed herb sample survives.",
      item: "night-herb",
    };
  if (
    stage.id === "roots.channel" &&
    s.stories.factions.roots >= 2 &&
    (s.npcs?.elian?.trust || 0) >= 2
  )
    extra = {
      label: "Ask Elian to witness the shared channel survey",
      outcome:
        "Elian's dated measurements give both settlements the same evidence. Ina opens the maintenance latch and entrusts you with its key.",
      item: "labyrinth-key",
    };
  if (stage.id === "floor.7.conclusion" && (s.npcs?.sable?.trust || 0) >= 2)
    extra = {
      label: "Raise the rescue line with Sable's crew as witnesses",
      outcome:
        "Sable's rivals sign as fellow rescuers. Their crew leaves a key for the next trapped company.",
      item: "labyrinth-key",
    };
  const choices = extra
    ? [...stage.choices, { ...stage.choices[0], ...extra, id: "expert" }]
    : stage.choices;
  return { ...stage, body: [stage.body, ...notes].join("\n\n"), choices };
}
