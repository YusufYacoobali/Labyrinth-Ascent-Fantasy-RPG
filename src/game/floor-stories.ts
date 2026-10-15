import { EVENTS, FLOORS } from "./world";
import { decision as d } from "./companion-stories";
import type { StoryChain } from "./story-types";

export function floorChain(
  floor: number,
  investigation: [string, string, string, string],
  conclusion: [string, string, string, string],
  aftermath: string,
): StoryChain {
  const event = EVENTS[FLOORS[floor - 1].event];
  return {
    id: `floor.${floor}`,
    category: "floor",
    floor,
    title: event.title,
    aftermath,
    stages: [
      {
        id: `floor.${floor}.arrival`,
        title: event.title,
        body: event.body,
        location: "field",
        floor,
        principal: true,
        choices: event.choices.map((c) => ({
          id: c.id,
          label: c.title,
          outcome: c.detail,
        })),
      },
      {
        id: `floor.${floor}.investigation`,
        title: investigation[0],
        body: investigation[1],
        location: "field",
        floor,
        site: "shelter",
        choices: [
          d(investigation[2], investigation[3], {
            faction: floor % 2 ? "stag" : "guild",
            standing: 1,
          }),
          {
            id: "leave",
            label: "Leave the evidence undisturbed",
            outcome:
              "You record the location and let the old evidence rest. The decision remains in your chronicle.",
          },
        ],
      },
      {
        id: `floor.${floor}.conclusion`,
        title: conclusion[0],
        body: conclusion[1],
        location: "field",
        floor,
        site: "portal",
        choices: [
          d(conclusion[2], conclusion[3], {
            item: floor % 2 ? "night-herb" : "relic-fragment",
            faction: floor % 2 ? "stag" : "guild",
            standing: 2,
          }),
          {
            id: "private",
            label: "Keep the account in the party’s private journal",
            outcome:
              "The party keeps the account. Later travellers will see the place as you left it, while your journal preserves the choice.",
          },
        ],
      },
    ],
  };
}
export const FLOOR_STORIES: StoryChain[] = [
  floorChain(
    1,
    [
      "The names beneath the ash",
      "At the sanctuary, a row of scratched names lies beneath the soot. The smiling stranger used this shelter to learn who travelled alone. Someone has tried to erase the warning left by his last victim.",
      "Restore the warning beside the shelter entrance",
      "You restore the warning and name the missing traveller. The next company will know why the invitation sounded so kind.",
    ],
    [
      "A lantern for the next company",
      "With the first portal open, you can leave a signal visible from the lower crossings. A small lantern could warn travellers where the plunderer waited without pretending that every stranger is an enemy.",
      "Leave the lantern and the full account",
      "The warning names the plunderer’s signs rather than condemning every traveller. A grateful scout leaves medicinal leaves beside it.",
    ],
    "The broken-arch fire is cold. Your account of the smiling stranger remains on the shelter wall.",
  ),
  floorChain(
    2,
    [
      "The second caravan ledger",
      "In the road sanctuary you find a duplicate ledger tucked into a ration crate. The caravan’s owner diverted medicine to a private buyer before the roadkeeper attacked. The cargo was never quite what the guild claimed.",
      "Compare both ledgers without erasing either",
      "The two ledgers tell a harder story than the abandoned wagon alone. You preserve the missing medicine entries for an inquiry.",
    ],
    [
      "Who the road served",
      "The open portal reveals an old dispatch niche. It can carry the caravan’s corrected account toward Stormhold. The surviving workers’ names are crowded into the final page, underneath their employer’s signature.",
      "Send the workers’ account with the ledgers",
      "The workers receive a voice in the inquiry. A guild clerk returns a fragment of the wagon’s old seal for your evidence chest.",
    ],
    "The caravan has been inventoried. Its cut wires and corrected ledger show the consequences of your first visit.",
  ),
  floorChain(
    3,
    [
      "Serin’s sealed dispatch",
      "A White Stag dispatch waits in the threshold sanctuary. It says the missing ninth-floor scouts were sent without enough supplies. Serin signed the order and asks you to preserve it, even if it weakens her standing.",
      "Keep Serin’s signature on the record",
      "The dispatch remains complete. Serin accepts responsibility rather than making the missing scouts bear it.",
    ],
    [
      "The promise at the threshold",
      "The guardian’s arch is open. You can fix a copy of Serin’s promise beside the checkpoint, giving future rescuers an obligation they can read before accepting a banner.",
      "Post the promise where recruits can read it",
      "The threshold becomes a place for informed promises. A clan courier leaves herbs for the road ahead.",
    ],
    "The White Stag’s threshold bears the oath you recorded. Serin’s original invitation will not be repeated.",
  ),
  floorChain(
    4,
    [
      "The gatewright’s four keys",
      "At the fourfold sanctuary, a gatewright’s notes explain that the doors once carried workers rather than rival armies. Each route’s faction has forgotten a different part of that common history.",
      "Copy the shared origin of the four doors",
      "Your journal places the four histories beside one another. None can truthfully claim to have built the gate alone.",
    ],
    [
      "An arch for every route",
      "The portal defender is gone. The arch has room for a neutral inscription telling returning parties that each discovered route can be chosen again, without surrendering their older maps.",
      "Restore the gatewright’s neutral inscription",
      "The four doors keep their separate dangers and their shared past. You recover a loose gate fragment while setting the inscription.",
    ],
    "The fourfold gate retains your inscription. Its doors can still be chosen on later expeditions; their history is already recorded.",
  ),
];
