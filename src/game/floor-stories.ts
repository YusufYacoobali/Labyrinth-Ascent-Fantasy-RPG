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
              "You leave everything where you found it. There may be time to look into it another day.",
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
              "You tuck the pages safely into your pack. For now, getting your company home comes first.",
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
      "At the sanctuary, you find names scratched into the wall beneath a layer of soot. Beside them is a warning about a smiling man who offers weary travellers a place by his fire. Someone has tried to rub it out.",
      "Clean the soot from the warning",
      "You clear the soot and retrace the faded letters. Now anyone stopping here will see the warning before they accept an invitation.",
    ],
    [
      "A lantern for the next company",
      "The portal is open. Beside the arch, an old lantern bracket overlooks the lower crossings. A light here could draw the next company towards the warning, before they wander down to the stranger’s fire.",
      "Light the lantern above the warning",
      "You hang the lantern where its light catches the writing. A passing scout reads it, thanks you, and leaves a pouch of medicinal herbs.",
    ],
    "The stranger’s fire is cold. The warning beside the broken arch is still there.",
  ),
  floorChain(
    2,
    [
      "The second caravan ledger",
      "A duplicate cargo book lies inside a ration crate at the sanctuary. Its medicine entries disagree with the book at the wagon. The owner sold half the shipment before it ever reached the flooded road.",
      "Compare the two cargo books",
      "You copy the missing entries and wrap the pages against the damp. Back in town, the guild will have a few questions for the caravan’s owner.",
    ],
    [
      "Who the road served",
      "The portal arch shelters a dry dispatch box. A torn page inside lists the wagon crew, including the workers left out of the owner’s report. Their names deserve to go home with the cargo records.",
      "Pack both accounts for the guild",
      "You wrap the crew list with the ledgers. A broken bronze seal lies loose in the box; you keep it with the other relic fragments.",
    ],
    "Only the wagon’s empty frame remains. You’ve already searched the cargo.",
  ),
  floorChain(
    3,
    [
      "Serin’s sealed dispatch",
      "A sealed White Stag dispatch waits at the sanctuary. Serin’s order sent the missing scouts upward with too little food. At the bottom, in a different hand, she has written: “If you find them, tell them I’m sorry.”",
      "Keep the dispatch for the scouts",
      "You fold the page carefully. Serin could have hidden her mistake. Instead, she has asked you to carry it to the people who paid for it.",
    ],
    [
      "The promise at the threshold",
      "Beside the open portal, the checkpoint’s noticeboard is almost bare. Serin has sent a list of the missing scouts and the supplies she owes them. There’s room to pin it where other companies will see.",
      "Pin the missing scouts’ names to the board",
      "You fasten the list beneath the White Stag banner. A clan courier reads it in silence, then gives you herbs for the climb ahead.",
    ],
    "The White Stag still holds the checkpoint. Serin’s offer has already been answered.",
  ),
  floorChain(
    4,
    [
      "The gatewright’s four keys",
      "Four worn keys hang above a workbench in the sanctuary. The notes beneath them describe miners, gardeners and furnace crews passing through the four doors. These routes were workplaces long before they became battlefields.",
      "Copy the gatewright’s notes",
      "You sketch the keys and copy the route names. Someone spent a lifetime keeping these doors open. Their cramped handwriting is all that remains of them.",
    ],
    [
      "An arch for every route",
      "The portal is clear. A fallen plaque beside it bears the gatewright’s name and the four route symbols. With a little work, you could lift it back into its bracket.",
      "Put the gatewright’s plaque back",
      "The plaque settles into place with a heavy click. A loose fragment of its old fitting comes away in your hand, worth keeping as a relic.",
    ],
    "The four doors remain open. Your choice of route is already made for this climb.",
  ),
];
