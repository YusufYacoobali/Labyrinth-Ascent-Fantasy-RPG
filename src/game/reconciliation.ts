import type { Action, Game } from "./engine";
import type { StoryStage } from "./story-types";
import { BALANCE as B } from "./balance";
const VOICES: Record<string, [string, string]> = {
  kael: [
    "I can accept a retreat. I cannot accept being told the wounded were expendable.",
    "Promise a reserved ration for the injured, and put it in the infirmary yourself.",
  ],
  lyria: [
    "You asked me to record living things, then treated their loss as a price nobody paid.",
    "Leave provisions for the survey crews who protect what we have learned.",
  ],
  bram: [
    "A fair contract is more than a number. It means we all get home to spend it.",
    "Restock the rescue pantry before asking me to shoulder another pack.",
  ],
  ragnar: [
    "I followed you into danger. I need to know you can tell courage from waste.",
    "Give the rescue crews their due. Glory should not eat their supper.",
  ],
  elowen: [
    "When I ask for rest, I am counting the people we can still save.",
    "Stock the infirmary with food for the next injured company.",
  ],
  mira: [
    "You do not need every answer. You need to listen when someone sees a danger you missed.",
    "Make room in the guild stores for a company that returns with nothing.",
  ],
  torren: [
    "Holding a door means trusting someone to count every person through it.",
    "Leave supplies for the rear guard before we speak of another gate.",
  ],
  sigrun: [
    "Do not call it strength when we have no choice but to keep walking.",
    "Put food aside for the ones who need to stop.",
  ],
  finn: [
    "Jokes are easier than asking whether anyone will notice if I fall behind.",
    "Help the porters' pantry. Show me that the last person matters.",
  ],
  eira: [
    "The cold does not forgive a leader for meaning well.",
    "Reserve food for the weatherbound crews, with their names on it.",
  ],
};
export function reconciliationStage(s: Game): StoryStage | undefined {
  const active = s.stories.active;
  if (!active?.chain.startsWith("reconcile.")) return;
  const id = active.chain.slice(10),
    c = [...s.party, ...s.reserve].find((c) => c.id === id);
  if (!c) return;
  const lines = VOICES[id] || [
    "I need you to hear why I lost trust.",
    "Help the rescue pantry before the next expedition.",
  ];
  const listen = active.stage.endsWith(".listen");
  return {
    id: active.stage,
    title: `An account owed to ${c.name}`,
    body: listen
      ? `${c.name}: “${lines[0]}”`
      : `${c.name}: “${lines[1]}” Two party rations will be donated. Loyalty returns to ${B.reconciliationLoyalty}; past decisions stay in the chronicle.`,
    location: "town",
    choices: [
      {
        id: listen ? "listen" : "restitution",
        label: listen
          ? "Acknowledge what happened and ask what would help"
          : "Donate two rations and agree on safer decisions",
        outcome: listen
          ? lines[1]
          : `${c.name} witnesses the donation. You agree to listen before the next dangerous decision.`,
      },
    ],
  };
}
export function resolveReconciliation(s: Game, a: Action): Game | undefined {
  if (
    a.type !== "STORY_CHOICE" ||
    !s.stories.active?.chain.startsWith("reconcile.")
  )
    return;
  const stage = reconciliationStage(s);
  if (
    s.phase !== "story" ||
    !stage ||
    stage.id !== a.stage ||
    !stage.choices.some((c) => c.id === a.choice)
  )
    return s;
  if (a.choice === "listen")
    return {
      ...s,
      stories: {
        ...s.stories,
        active: {
          ...s.stories.active,
          stage: s.stories.active.stage.replace(/listen$/, "restitution"),
        },
      },
    };
  if (s.food < 2)
    return {
      ...s,
      message: "You need two party rations for the promised donation.",
    };
  const id = s.stories.active.chain.slice(10),
    message = stage.choices[0].outcome;
  return {
    ...s,
    phase: "town",
    food: s.food - 2,
    stories: {
      ...s.stories,
      active: null,
      loyalty: { ...s.stories.loyalty, [id]: B.reconciliationLoyalty },
    },
    message,
    journal: [message, ...s.journal].slice(0, 60),
  };
}
