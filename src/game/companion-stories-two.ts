import { decision as d, stage as st } from "./companion-stories";
import type { StoryChain } from "./story-types";

export const COMPANION_STORIES_TWO: StoryChain[] = [
  {
    id: "companion.bram",
    category: "unique",
    companion: "bram",
    title: "The bell below the forge",
    stages: [
      st(
        "bram.list",
        "An apprentice’s ledger",
        "Bram kept the names of apprentices sent below with a shipment of failed tools. The forge called them deserters. He asks you to find the maker’s stamp on the third-floor threshold.",
        "town",
        0,
        [
          d(
            "Take the ledger and promise a fair hearing",
            "Bram entrusts you with a ledger he has kept dry through seven winters.",
          ),
          d(
            "Call the apprentices deserters",
            "Bram says nothing. He removes their names from the page you are allowed to see.",
            { id: "blame", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "bram.stamp",
        "Tools made to fail",
        "A split pick at the threshold bears Ironbell’s stamp. Its cheap core failed under a rescue crew. Ragnar proposes breaking into the guild stores for proof; Bram wants the broken tool carried back intact.",
        "field",
        3,
        [
          d(
            "Preserve the pick and let Ragnar witness the find",
            "Ragnar wraps the pick in his spare cloak. Bram begins to see a witness where he once saw only a raider.",
            { pair: { ids: ["bram", "ragnar"], change: 1 } },
          ),
          d(
            "Melt the evidence for its valuable casing",
            "The casing is worth money. Bram watches the stamp disappear into the fire.",
            {
              id: "melt",
              approved: false,
              harmful: true,
              gold: 70,
              pair: { ids: ["bram", "ragnar"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "bram.bell",
        "Ring for the apprentices",
        "With the sixth floor reached, Ironbell can no longer dismiss the ledger as a beginner’s tale. Bram can name the lost apprentices at the forge bell, or accept a private settlement.",
        "town",
        6,
        [
          d(
            "Read every name at the bell",
            "The forge replaces its weakest tools and clears the apprentices’ names. Bram receives a Mountainbreaker made from tested iron.",
            { item: "heavy-maul", faction: "guild", standing: 3 },
          ),
          d(
            "Accept the settlement and close the ledger",
            "The forge pays. Bram returns the ledger to its oilcloth, its names still unheard.",
            { id: "settle", approved: false, harmful: true, gold: 180 },
          ),
        ],
      ),
    ],
    aftermath:
      "The apprentice ledger is closed. Bram’s account of Ironbell remains in your chronicle.",
  },
  {
    id: "companion.ragnar",
    category: "unique",
    companion: "ragnar",
    title: "A banner worth returning",
    stages: [
      st(
        "ragnar.banner",
        "Only the banner returned",
        "Ragnar’s cousin travelled with a celebrated company. Its leader returned with their banner and a heroic story; none of the wounded came home. Ragnar wants the account checked against the White Stag’s records.",
        "town",
        0,
        [
          d(
            "Ask for the names behind the legend",
            "Ragnar names each companion before he names the company. The search begins with people, not trophies.",
          ),
          d(
            "Say glory always demands a price",
            "Ragnar laughs without warmth. He has heard that excuse from the survivors who profited.",
            { id: "glory", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "ragnar.records",
        "The order to hold",
        "At the clan threshold, a damaged dispatch orders the wounded to hold an indefensible passage. Bram recognizes a forge code proving that the celebrated leader had already withdrawn.",
        "field",
        3,
        [
          d(
            "Let Bram copy the code for the hearing",
            "Ragnar restrains his anger long enough for Bram to preserve the evidence. They return to the passage as allies.",
            { pair: { ids: ["bram", "ragnar"], change: 1 } },
          ),
          d(
            "Tear down the memorial and take its offerings",
            "The offerings buy provisions. The destroyed dispatch can no longer speak for the dead.",
            {
              id: "rage",
              approved: false,
              harmful: true,
              gold: 90,
              pair: { ids: ["bram", "ragnar"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "ragnar.return",
        "Bring everyone home",
        "The sixth-floor guardian has fallen. Ragnar can hang the old banner in the guild with the names of the abandoned, or burn it and sell the company’s reputation to its rivals.",
        "town",
        6,
        [
          d(
            "Hang the banner with the full account",
            "The banner becomes a promise to the next expedition. Ragnar accepts a dawnwatch amulet from the rescued company’s families.",
            { item: "dawn-amulet", faction: "stag", standing: 3 },
          ),
          d(
            "Sell the scandal before burning the banner",
            "The rivals pay promptly. Ragnar keeps one strip of cloth, unable to say whose victory it represents.",
            { id: "sell", approved: false, harmful: true, gold: 190 },
          ),
        ],
      ),
    ],
    aftermath:
      "Ragnar’s lost company has its final account. The banner’s fate is permanent.",
  },
  {
    id: "companion.elowen",
    category: "unique",
    companion: "elowen",
    title: "The seed that remembers",
    stages: [
      st(
        "elowen.seed",
        "A seed without a season",
        "Elowen carries a seed her lost brother saved from a grove felled for the first gate. It wakes when the labyrinth opens. She asks for a place below where it can grow without becoming a weapon.",
        "town",
        0,
        [
          d(
            "Help her find living soil",
            "Elowen places the seed in your palm. It is warm, and impossibly light.",
          ),
          d(
            "Ask what weapon the seed could become",
            "She closes your fingers gently, then takes the seed back.",
            { id: "weapon", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "elowen.shrine",
        "Roots around the altar",
        "At the fifth-floor shrine, Elowen finds soil that still smells of daylight. Mira believes the altar can accelerate growth, but its inscription says the cost is memory.",
        "field",
        5,
        [
          d(
            "Ask Mira to disable the altar first",
            "Mira unpicks the binding rune while Elowen prepares the soil. Neither asks the other to surrender what she loves.",
            { pair: { ids: ["elowen", "mira"], change: 1 } },
          ),
          d(
            "Let the altar take Elowen’s oldest memory",
            "The seed sprouts at once. Elowen cannot remember her mother’s voice.",
            {
              id: "sacrifice",
              approved: false,
              harmful: true,
              gold: 100,
              pair: { ids: ["elowen", "mira"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "elowen.grove",
        "The first leaf",
        "In the eighth-floor garden, the young tree reaches toward a crack of blue light. Elowen can leave it for travellers or carry its heartwood back as proof of her discovery.",
        "field",
        8,
        [
          d(
            "Leave a living refuge",
            "A first leaf unfurls above the path. Elowen makes a moonweave robe from the bark the tree freely sheds.",
            { item: "moon-robe", faction: "stag", standing: 3 },
          ),
          d(
            "Cut the heartwood for collectors",
            "The specimen will survive the journey. The refuge will not.",
            {
              id: "cut",
              approved: false,
              harmful: true,
              gold: 200,
              faction: "stag",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "The last seed has found its fate. Elowen’s grove will not be offered again.",
  },
  {
    id: "companion.finn",
    category: "unique",
    companion: "finn",
    title: "The scout’s last trail",
    stages: [
      st(
        "finn.ribbon",
        "A blue scouting ribbon",
        "Finn has followed his sister’s caravan as far as Stormhold. She tied a blue ribbon at every safe crossing. He asks you to read the Sunken Road for signs that the caravan’s ledger missed.",
        "town",
        0,
        [
          d(
            "Follow the signs before drawing conclusions",
            "Finn lends you his sister’s trail key, trusting you with a code he has told no guild officer.",
          ),
          d(
            "Promise a rescue without hearing the evidence",
            "Finn wants to believe you. Your easy certainty makes the waiting worse.",
            { id: "boast", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "finn.trail",
        "The ribbon points onward",
        "A faded ribbon on Floor 2 marks a safe detour for wounded scouts. Eira recognizes a northern rescue knot. Finn’s sister led people upward rather than fleeing alone.",
        "field",
        2,
        [
          d(
            "Keep Eira’s reading beside the trail key",
            "Finn thanks Eira for refusing the easy answer. They agree to follow the people the ribbon protected.",
            { pair: { ids: ["finn", "eira"], change: 1 } },
          ),
          d(
            "Sell the trail key to a rival expedition",
            "The rival pays for an advantage. Finn can no longer keep his sister’s code safe.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 80,
              pair: { ids: ["finn", "eira"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "finn.letter",
        "A letter at the ninth shelter",
        "A scout’s letter on Floor 9 names Finn’s sister among those evacuated by the White Stag. She is alive beyond the northern pass. The letter also lists the official who sold their original route.",
        "field",
        9,
        [
          d(
            "Send word home and lodge the evidence",
            "Finn reads the letter twice before smiling. The scouts leave him a scout’s dagger and a place at their table.",
            { item: "scout-dagger", faction: "guild", standing: 3 },
          ),
          d(
            "Blackmail the official instead",
            "The official pays to keep the route secret. Finn sends his letter without your signature.",
            {
              id: "blackmail",
              approved: false,
              harmful: true,
              gold: 210,
              faction: "guild",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "Finn knows where his sister went. The scout’s trail now belongs to the campaign chronicle.",
  },
];
