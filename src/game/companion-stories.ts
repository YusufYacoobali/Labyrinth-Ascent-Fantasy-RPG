import type { StoryChain, StoryChoice, StoryStage } from "./story-types";

export function decision(
  label: string,
  outcome: string,
  extras: Partial<StoryChoice> = {},
): StoryChoice {
  return { id: "help", label, outcome, approved: true, ...extras };
}
export function stage(
  id: string,
  title: string,
  body: string,
  location: StoryStage["location"],
  floor: number,
  choices: StoryChoice[],
): StoryStage {
  return {
    id,
    title,
    body,
    location,
    ...(location === "town" ? { bestFloor: floor } : { floor }),
    choices,
  };
}
export const COMPANION_STORIES: StoryChain[] = [
  {
    id: "companion.kael",
    category: "unique",
    companion: "kael",
    title: "The name on the shield",
    stages: [
      stage(
        "kael.promise",
        "A scratched-out name",
        "Kael is sanding an old shield in the tavern yard. Beneath his name is another: Iven. His former captain ordered a retreat before Iven returned. Kael asks you to look for the company’s brass roster on the Sunken Road.",
        "town",
        0,
        [
          decision(
            "Promise to bring back the roster",
            "Kael writes Iven’s name into your expedition book. He will trust you to decide when the search becomes too dangerous.",
          ),
          decision(
            "Say the missing are no longer your concern",
            "Kael puts the shield away. He will still keep his contract, but your indifference stays with him.",
            { id: "dismiss", approved: false, harmful: true },
          ),
        ],
      ),
      stage(
        "kael.roster",
        "Under the broken axle",
        "A brass roster is pinned beneath a wagon wheel. Iven’s last order reads: escort the wounded to the west shelter. Lyria recognizes a trail mark beside it. Kael wants that account preserved, even if his captain’s medal must be left behind.",
        "field",
        2,
        [
          decision(
            "Copy the order and trust Lyria’s reading",
            "The two compare their memories instead of their accusations. Iven did not abandon his company. You carry his account home.",
            { pair: { ids: ["kael", "lyria"], change: 1 } },
          ),
          decision(
            "Take the medal and discard the damaged roster",
            "The medal brings coin, but Kael watches the last words of his friend crumble in your hands.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 60,
              pair: { ids: ["kael", "lyria"], change: -1 },
            },
          ),
        ],
      ),
      stage(
        "kael.memorial",
        "A shield with two names",
        "After reaching the third floor, Kael asks the guild to record Iven among the rescuers. The clerk will accept your witness. The company’s old captain wants the report sealed to protect his reputation.",
        "town",
        3,
        [
          decision(
            "Witness the account before the guild",
            "Iven’s name joins the memorial. Kael returns to the gate carrying a repaired shield and no longer mistaking every retreat for betrayal.",
            { item: "chainmail", faction: "guild", standing: 3 },
          ),
          decision(
            "Accept the captain’s hush money",
            "The clerk closes the book. Kael accepts his share, but he will never call that captain a friend again.",
            {
              id: "seal",
              approved: false,
              harmful: true,
              gold: 150,
              faction: "guild",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "The account of Iven’s final order is settled in your chronicle. Kael has made his choice about the company he serves.",
  },
  {
    id: "companion.lyria",
    category: "unique",
    companion: "lyria",
    title: "The living map",
    stages: [
      stage(
        "lyria.ink",
        "Ink that keeps moving",
        "At a quiet tavern table, Lyria pins down an old map with two mugs. A green ink line creeps across the page. ‘Enchanted sap,’ she explains. ‘It follows living roots under Stormhold. My mother drew it. I think it can show us a safe way through the labyrinth.’ She looks up. ‘Will you help me trace the roots without cutting them? This is all I have left of her.’",
        "town",
        0,
        [
          decision(
            "Promise to help her finish her mother’s map",
            "‘Then we’ll finish it together,’ Lyria says, sliding you a sheet of tracing bark. For the first time, she lets you hold the map. She trusts you with something precious.",
          ),
          decision(
            "Say you’re here for treasure, not family keepsakes",
            "Lyria rolls the map up. ‘Understood. We’ll keep this professional.’ She stays with the company, but the conversation closes.",
            { id: "harvest", approved: false, harmful: true },
          ),
        ],
      ),
      stage(
        "lyria.echo",
        "The road remembers rain",
        "On the Sunken Road, roots curl around a caravan bell. Lyria hears rain in its silence; Kael hears a warning. An inscription records the road’s original watercourse, a truth neither memory quite captured.",
        "field",
        2,
        [
          decision(
            "Record both accounts beside the inscription",
            "Kael holds the lantern while Lyria copies the lettering. They agree that a map can hold more than one memory.",
            { pair: { ids: ["kael", "lyria"], change: 1 } },
          ),
          decision(
            "Tell Kael his warning matters more",
            "Lyria stops translating. Their disagreement becomes a silence that follows the party.",
            {
              id: "silence",
              approved: false,
              harmful: true,
              pair: { ids: ["kael", "lyria"], change: -1 },
            },
          ),
        ],
      ),
      stage(
        "lyria.garden",
        "A map for the living",
        "The fifth-floor shrine contains a root-covered survey stone. Its grooves show the old watercourse returning toward the surface. Lyria can publish the record openly or sell its location to collectors who will cut the stone free.",
        "field",
        5,
        [
          decision(
            "Leave the stone and copy the survey",
            "Lyria leaves a living archive for later travellers. The White Stag sends a rootbound mantle in thanks.",
            { item: "root-mantle", faction: "stag", standing: 3 },
          ),
          decision(
            "Sell the location to the collectors",
            "The collectors pay for your silence. Lyria keeps the last unbroken leaf between the pages of her map.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 170,
              faction: "stag",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "The living map has a final annotation in Lyria’s hand. Its fate is recorded alongside your decision.",
  },
];
