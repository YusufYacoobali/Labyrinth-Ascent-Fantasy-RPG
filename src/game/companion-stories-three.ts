import { decision as d, stage as st } from "./companion-stories";
import type { StoryChain } from "./story-types";

export const COMPANION_STORIES_THREE: StoryChain[] = [
  {
    id: "companion.mira",
    category: "unique",
    companion: "mira",
    title: "A question the gate remembers",
    stages: [
      st(
        "mira.margin",
        "The missing margin",
        "Mira’s teacher published the first gate translation, then vanished. A copied page has one margin scraped clean. Mira suspects the warning was removed deliberately, and asks to compare the shrine’s original inscription.",
        "town",
        0,
        [
          d(
            "Keep the missing words an open question",
            "Mira starts a second notebook for evidence that contradicts her own theory.",
          ),
          d(
            "Declare the teacher guilty before the search",
            "Mira crosses out the first heading. A verdict has arrived before the evidence.",
            { id: "accuse", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "mira.translation",
        "The name of the offering",
        "The fifth-floor inscription names memory, not blood, as the gate’s first offering. Elowen identifies a plant name mistranslated as a person. Mira’s teacher may have hidden a recipe rather than a sacrifice.",
        "field",
        5,
        [
          d(
            "Credit Elowen and correct the translation",
            "Mira writes Elowen’s name above her own correction. Their different kinds of knowledge finally share a page.",
            { pair: { ids: ["elowen", "mira"], change: 1 } },
          ),
          d(
            "Publish Mira’s first theory for the reward",
            "The dramatic accusation sells. Mira keeps the correction in the notebook she no longer shows you.",
            {
              id: "publish",
              approved: false,
              harmful: true,
              gold: 90,
              pair: { ids: ["elowen", "mira"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "mira.archive",
        "An archive without a lock",
        "At Floor 10, the vault holds the teacher’s final notes: a method for opening the gate without erasing its keeper. Mira can release the work or claim exclusive rights before the guild learns what it means.",
        "field",
        10,
        [
          d(
            "Copy the method into the public archive",
            "Mira leaves enough copies that no scraped margin can hide the answer again. A sparkwright focus is her first creation from the restored method.",
            { item: "spark-focus", faction: "guild", standing: 4 },
          ),
          d(
            "Sell exclusive rights to the highest bidder",
            "The contract is valuable. The archive remains locked, and Mira understands why her teacher disappeared.",
            {
              id: "rights",
              approved: false,
              harmful: true,
              gold: 230,
              faction: "guild",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "Mira’s translation is complete. Your chronicle records who was allowed to read it.",
  },
  {
    id: "companion.torren",
    category: "unique",
    companion: "torren",
    title: "The door he could not hold",
    stages: [
      st(
        "torren.order",
        "A veteran’s silence",
        "Torren remembers the seventh-floor bridge from an expedition he will not name. He held a door while his commander cut the ropes behind the last wounded. He wants the bridge’s signal bell brought back.",
        "town",
        3,
        [
          d(
            "Ask what the wounded tried to signal",
            "Torren describes three slow bell strokes. He has counted them in his sleep for years.",
          ),
          d(
            "Praise the commander’s ruthless efficiency",
            "Torren ends the conversation. You have praised the order he has spent years trying to undo.",
            { id: "praise", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "torren.bell",
        "Three slow strokes",
        "The bridge bell on Floor 7 still hangs above a severed rescue line. Sigrun wants to cut it down as a trophy. Torren asks her to listen: the bell’s clapper contains the names of those waiting below.",
        "field",
        7,
        [
          d(
            "Lower the bell together and read the names",
            "Sigrun kneels beside Torren as he reads. The bell becomes a witness rather than a prize.",
            { pair: { ids: ["torren", "sigrun"], change: 1 } },
          ),
          d(
            "Cut it down and sell the bronze",
            "The bell is heavy enough to fetch a price. Torren will not help count the coins.",
            {
              id: "bronze",
              approved: false,
              harmful: true,
              gold: 120,
              pair: { ids: ["torren", "sigrun"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "torren.hearing",
        "Hold the door open",
        "Back in town after reaching Floor 7, the commander offers Torren a restored rank in exchange for silence. The families wait outside the hearing chamber, uncertain whether they will be admitted.",
        "town",
        7,
        [
          d(
            "Open the hearing to the families",
            "Torren holds the chamber door while every family enters. They give him a wardkeeper’s seal bearing the names the commander tried to erase.",
            { item: "hollow-ward", faction: "guild", standing: 4 },
          ),
          d(
            "Take the commission and close the door",
            "The restored rank brings a payment. Torren takes off its badge before leaving the chamber.",
            { id: "commission", approved: false, harmful: true, gold: 220 },
          ),
        ],
      ),
    ],
    aftermath:
      "Torren has faced the old command. The bridge bell’s testimony is part of your permanent record.",
  },
  {
    id: "companion.sigrun",
    category: "unique",
    companion: "sigrun",
    title: "A scar for someone else",
    stages: [
      st(
        "sigrun.oath",
        "The unearned scar",
        "Sigrun’s clan celebrates a scar she earned while her younger rival carried the wounded to safety. She wants to return the rival’s broken axe from the sixth-floor threshold before the next clan feast.",
        "town",
        0,
        [
          d(
            "Agree that the rival’s courage deserves its name",
            "Sigrun admits how long she has worn a story that belonged to someone else.",
          ),
          d(
            "Tell her a useful legend needs no correction",
            "Sigrun touches the scar and changes the subject. The legend has become another burden.",
            { id: "legend", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "sigrun.axe",
        "The axe beneath the stones",
        "The axe lies under a collapsed rescue arch on Floor 6. Torren can brace the remaining stone while Sigrun retrieves it. She could instead take its silver grip and leave the haft engraved with her rival’s name.",
        "field",
        6,
        [
          d(
            "Let Torren brace the arch and recover the whole axe",
            "Sigrun trusts Torren with her life, and he trusts her to return before the stone gives way.",
            { pair: { ids: ["torren", "sigrun"], change: 1 } },
          ),
          d(
            "Take the silver and leave the name",
            "The grip will sell. Sigrun carries another unnamed piece of someone else’s courage.",
            {
              id: "silver",
              approved: false,
              harmful: true,
              gold: 100,
              pair: { ids: ["torren", "sigrun"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "sigrun.feast",
        "A name at the feast",
        "After Floor 6, Sigrun can place the axe before her clan and correct the story. The feast’s sponsor offers a purse if she repeats the simpler version that sells so many songs.",
        "town",
        6,
        [
          d(
            "Give the rival the story and the axe",
            "The feast falls quiet, then the rival’s family stands. Sigrun receives an Ironbell pike for the courage it took to speak.",
            { item: "iron-pike", faction: "stag", standing: 3 },
          ),
          d(
            "Repeat the sponsored legend",
            "The song is louder than ever. Sigrun leaves before its final verse.",
            { id: "song", approved: false, harmful: true, gold: 200 },
          ),
        ],
      ),
    ],
    aftermath:
      "The story of Sigrun’s scar is settled. The clan remembers the account you chose to support.",
  },
  {
    id: "companion.eira",
    category: "unique",
    companion: "eira",
    title: "The voice in the ice",
    stages: [
      st(
        "eira.song",
        "A song beneath hearing",
        "Eira hears a voice from the upper vaults each time the gate opens. It repeats a scout’s counting song from her childhood. She asks you to listen for its answering interval at the seventh-floor crossing.",
        "town",
        6,
        [
          d(
            "Learn the counting song with her",
            "Eira teaches you the pause between the notes. She says most listeners mistake it for silence.",
          ),
          d(
            "Ask only what treasure the voice protects",
            "Eira sings the next verse too quietly for you to learn.",
            { id: "treasure", approved: false, harmful: true },
          ),
        ],
      ),
      st(
        "eira.answer",
        "An answer across the bridge",
        "On Floor 7, a crystal rings the missing interval. Finn recognizes its timing as a scout’s signal for survivors. Eira’s voice may be a message held in the stone, not a prisoner asking to be freed.",
        "field",
        7,
        [
          d(
            "Test Finn’s signal before breaking the crystal",
            "Finn taps the signal and Eira answers. The crystal repeats a route warning in a voice both can finally understand.",
            { pair: { ids: ["finn", "eira"], change: 1 } },
          ),
          d(
            "Break the crystal for its valuable centre",
            "Its last note cuts off mid-word. Finn refuses to put the pieces in his pack.",
            {
              id: "break",
              approved: false,
              harmful: true,
              gold: 130,
              pair: { ids: ["finn", "eira"], change: -1 },
            },
          ),
        ],
      ),
      st(
        "eira.vault",
        "The last verse",
        "The tenth-floor vault contains a choir of recorded warnings. Eira can retune it for living scouts, or remove the central crystal and sell the only complete recording of her childhood song.",
        "field",
        10,
        [
          d(
            "Retune the choir for those still travelling",
            "The warning carries clearly through the stone. Eira shapes a glacierglass blade from a discarded tuning shard, leaving the choir whole.",
            { item: "glacier-blade", faction: "guild", standing: 4 },
          ),
          d(
            "Remove the central crystal for sale",
            "The complete song will survive in a collector’s room. The corridors lose their warning.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 240,
              faction: "guild",
              standing: -3,
            },
          ),
        ],
      ),
    ],
    aftermath:
      "Eira has found the voice in the ice. The fate of the warning choir is fixed in your chronicle.",
  },
];
