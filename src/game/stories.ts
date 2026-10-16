import { contextualStoryStage } from "./story-context";
import { resolveReconciliation } from "./reconciliation";
import { pairBond } from "./relationships";
import { SOLO_SCENES } from "./companion-solo-scenes";
import { BALANCE as B } from "./balance";
import { reactionFor } from "./story-reactions";
import { ROUTE_STORIES } from "./route-stories";
import { FLOOR_STORIES_THREE } from "./floor-stories-three";
import { FLOOR_STORIES_TWO } from "./floor-stories-two";
import { FLOOR_STORIES } from "./floor-stories";
import { currentRoom, currentMapKey } from "./exploration-state";
import { COMPANION_STORIES_THREE } from "./companion-stories-three";
import { COMPANION_STORIES_TWO } from "./companion-stories-two";
import type { Action, Game } from "./engine";
import { COMPANION_STORIES } from "./companion-stories";
import type { StoryChain, StoryStage } from "./story-types";

export const STORY_CHAINS: StoryChain[] = [
  ...COMPANION_STORIES,
  ...COMPANION_STORIES_TWO,
  ...COMPANION_STORIES_THREE,
  ...FLOOR_STORIES,
  ...FLOOR_STORIES_TWO,
  ...FLOOR_STORIES_THREE,
  ...ROUTE_STORIES,
];
export const loyalty = (s: Game, id: string) =>
  s.stories.loyalty[id] ?? B.loyaltyStart;
export const pairKey = (a: string, b: string) => [a, b].sort().join(":");
export const pairRelationship = (s: Game, a: string, b: string) => {
  const value = s.stories.pairs[pairKey(a, b)] || 0;
  return value >= 2 ? "bonded" : value <= -2 ? "hostile" : "neutral";
};
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function storyEligible(s: Game, chain: StoryChain) {
  const step = s.stories.stages[chain.id] || 0,
    stage = chain.stages[step];
  if (!stage || stage.principal || s.stories.outcomes[stage.id]) return false;
  if (stage.site === "shelter" && (s.phase !== "camp" || s.journey.wildCamp))
    return false;
  if (
    stage.site === "portal" &&
    (currentRoom(s).kind !== "portal" ||
      !s.journey.defeatedPortals.includes(currentMapKey(s)))
  )
    return false;
  const roster =
    stage.location === "town" ? [...s.party, ...s.reserve] : s.party;
  if (
    chain.companion &&
    !roster.some(
      (c) =>
        c.id === chain.companion && (stage.location === "town" || c.hp > 0),
    )
  )
    return false;
  if (stage.location === "town")
    return s.phase === "town" && s.bestFloor >= (stage.bestFloor || 0);
  return (
    ["exploration", "camp", "victory"].includes(s.phase) &&
    s.floor === stage.floor &&
    (!chain.route || s.route === chain.route)
  );
}
export const storyLeads = (s: Game) =>
  STORY_CHAINS.filter((c) => storyEligible(s, c));
export function presentStoryStage(s: Game, stage: StoryStage): StoryStage {
  const solo = SOLO_SCENES[stage.id],
    pair = stage.choices.find((c) => c.pair)?.pair;
  const roster =
    stage.location === "town"
      ? [...s.party, ...s.reserve]
      : s.party.filter((c) => c.hp > 0);
  if (
    !solo ||
    !pair ||
    (pair.ids.every((id) => roster.some((c) => c.id === id)) &&
      pairBond(s, pair.ids[0], pair.ids[1]) > -2)
  )
    return contextualStoryStage(s, stage);
  return contextualStoryStage(s, {
    ...stage,
    body: solo.body,
    choices: stage.choices.map((c) => ({
      ...c,
      pair: undefined,
      ...(c.id === "help"
        ? { label: solo.label, outcome: solo.outcome }
        : {
            label: solo.alternateLabel || c.label,
            outcome: solo.alternateOutcome || c.outcome,
          }),
    })),
  });
}
export function resolveStoryAction(s: Game, a: Action): Game | undefined {
  if (a.type === "RECONCILE") {
    if (
      s.phase !== "town" ||
      ![...s.party, ...s.reserve].some((c) => c.id === a.id) ||
      loyalty(s, a.id) >= B.reconciliationThreshold
    )
      return s;
    return {
      ...s,
      phase: "story",
      stories: {
        ...s.stories,
        active: {
          chain: `reconcile.${a.id}`,
          stage: `reconcile.${a.id}.listen`,
          resume: "town",
        },
      },
      message: "",
    };
  }
  const reconciliation = resolveReconciliation(s, a);
  if (reconciliation) return reconciliation;
  if (a.type === "OPEN_STORY") {
    const chain = STORY_CHAINS.find((c) => c.id === a.id);
    if (!chain || !storyEligible(s, chain)) return s;
    return {
      ...s,
      phase: "story",
      stories: {
        ...s.stories,
        active: {
          chain: chain.id,
          stage: chain.stages[s.stories.stages[chain.id] || 0].id,
          resume: s.phase,
        },
      },
      message: "",
    };
  }
  if (a.type === "CLOSE_STORY") {
    if (s.phase !== "story" || !s.stories.active) return s;
    return {
      ...s,
      phase: s.stories.active.resume,
      stories: { ...s.stories, active: null },
    };
  }
  if (a.type !== "STORY_CHOICE") return undefined;
  const active = s.stories.active,
    chain = STORY_CHAINS.find((c) => c.id === active?.chain);
  if (
    s.phase !== "story" ||
    !active ||
    active.stage !== a.stage ||
    !chain ||
    s.stories.outcomes[a.stage]
  )
    return s;
  const step = s.stories.stages[chain.id] || 0,
    stage = chain.stages[step]
      ? presentStoryStage(s, chain.stages[step])
      : undefined,
    choice = stage?.choices.find((c) => c.id === a.choice);
  if (!choice || !stage || stage.id !== a.stage) return s;
  const stories = {
    ...s.stories,
    active: null,
    stages: { ...s.stories.stages, [chain.id]: step + 1 },
    outcomes: { ...s.stories.outcomes, [stage.id]: choice.id },
    loyalty: { ...s.stories.loyalty },
    pairs: { ...s.stories.pairs },
    factions: { ...s.stories.factions },
    history: [
      ...s.stories.history,
      {
        stage: stage.id,
        title: stage.title,
        outcome: choice.outcome,
        expedition: s.expedition.number,
      },
    ],
  };
  if (chain.companion)
    stories.loyalty[chain.companion] = clamp(
      loyalty(s, chain.companion) +
        B.loyaltyMilestone +
        (choice.approved
          ? B.loyaltyApproval
          : choice.harmful
            ? -B.loyaltyHarm
            : 0),
    );
  if (
    choice.pair &&
    choice.pair.ids.every((id) =>
      [...s.party, ...s.reserve].some((c) => c.id === id),
    )
  ) {
    const key = pairKey(...choice.pair.ids);
    stories.pairs[key] = Math.max(
      -2,
      Math.min(2, (stories.pairs[key] || 0) + choice.pair.change),
    );
  }
  const faction = { ...s.faction };
  if (choice.faction) {
    if (choice.faction === "guild" || choice.faction === "stag")
      faction[choice.faction] += choice.standing || 0;
    else stories.factions[choice.faction] += choice.standing || 0;
  }
  return {
    ...s,
    stories,
    faction,
    phase: active.resume,
    gold: s.gold + (choice.gold || 0),
    inventory: choice.item
      ? { ...s.inventory, [choice.item]: (s.inventory[choice.item] || 0) + 1 }
      : s.inventory,
    message: choice.outcome,
    journal: [`${stage.title}: ${choice.outcome}`, ...s.journal].slice(0, 60),
  };
}
export function storyConsequences(before: Game, after: Game, a: Action): Game {
  if (before === after) return after;
  const loss = !before.expedition.lost && after.expedition.lost;
  const event =
    a.type === "EVENT" &&
    !before.eventResolved &&
    after.eventResolved &&
    !principalResolved(before);
  if (!loss && !event) return after;
  const values = { ...after.stories.loyalty },
    reactions: string[] = [];
  for (const c of after.party.filter((c) => c.id !== "hero")) {
    if (loss) values[c.id] = clamp(loyalty(after, c.id) - B.loyaltyDefeat);
    else if (event && a.type === "EVENT") {
      const reaction = reactionFor(before, c.id, a.choice);
      if (reaction) {
        values[c.id] = clamp(
          loyalty(after, c.id) +
            (reaction.approved ? B.loyaltyApproval : -B.loyaltyHarm),
        );
        reactions.push(
          `${c.name} (${reaction.approved ? "+5" : "−10"} loyalty): “${reaction.line}”`,
        );
      }
    }
  }
  return {
    ...after,
    stories: { ...after.stories, loyalty: values },
    journal: [...reactions, ...after.journal].slice(0, 60),
  };
}

export function principalResolved(s: Game, floor = s.floor) {
  return (s.stories.stages[`floor.${floor}`] || 0) > 0;
}
export function principalAftermath(s: Game) {
  const chain = STORY_CHAINS.find((c) => c.id === `floor.${s.floor}`);
  const progress = s.stories.stages[`floor.${s.floor}`] || 0;
  if (!chain)
    return "Your earlier decision is recorded here. The chamber bears its aftermath.";
  if (progress < chain.stages.length)
    return `Your earlier decision in ${chain.title.toLowerCase()} is recorded. ${s.stories.history.find((h) => h.stage === chain.stages[0].id)?.outcome || "The original encounter is over."} Further evidence may remain at the sanctuary.`;
  return chain.aftermath;
}
export function recordPrincipal(
  before: Game,
  after: Game,
  choice: string,
): Game {
  if (principalResolved(before)) return after;
  const chain = STORY_CHAINS.find((c) => c.id === `floor.${before.floor}`);
  if (!chain) return after;
  const stage = chain.stages[0];
  return {
    ...after,
    stories: {
      ...after.stories,
      stages: { ...after.stories.stages, [chain.id]: 1 },
      outcomes: { ...after.stories.outcomes, [stage.id]: choice },
      history: [
        ...after.stories.history,
        {
          stage: stage.id,
          title: stage.title,
          outcome: after.message,
          expedition: before.expedition.number,
        },
      ],
    },
  };
}
