export interface GenericChoice {
  id: "talk" | "help" | "leave";
  label: string;
  outcome: string;
  foodCost?: number;
  goldCost?: number;
  gold?: number;
  item?: string;
  food?: number;
}
export interface GenericEncounter {
  id: string;
  family: string;
  title: string;
  minFloor: number;
  maxFloor: number;
  route?: string;
  faction?: "guild" | "stag";
  standing?: number;
  people?: boolean;
  variants: [string, string];
  choices: GenericChoice[];
}
export function encounter(
  id: string,
  family: string,
  title: string,
  minFloor: number,
  variants: [string, string],
  choices: GenericChoice[],
  extra: Partial<GenericEncounter> = {},
): GenericEncounter {
  return {
    id,
    family,
    title,
    minFloor,
    maxFloor: 12,
    variants,
    choices: [
      ...choices,
      {
        id: "leave",
        label: "Pass quietly",
        outcome: "You shoulder your pack and carry on.",
      },
    ],
    ...extra,
  };
}
export const GENERIC_ENCOUNTERS: GenericEncounter[] = [
  encounter(
    "generic.lantern",
    "travellers",
    "A lantern running low",
    1,
    [
      "Two surveyors huddle over an unlit lantern. One strikes a flint while the other wrings water from their tinder. “Please tell me you’ve got something dry.”",
      "Three porters are trying to relight a lantern. They’ve saved a little oil, but the kindling is soaked. Without a flame, they’ll have to wait here in the dark.",
    ],
    [
      {
        id: "talk",
        label: "Compare travelling notes",
        outcome:
          "You compare notes by your own lantern. They warn you about loose stones and laugh at a wrong turn you both made. For a while, the dark feels less empty.",
      },
      {
        id: "help",
        label: "Share a ration’s wrapping · 1 ration",
        foodCost: 1,
        gold: 20,
        outcome:
          "Your dry wrapping catches on the first spark. The lantern lights, and a relieved porter presses twenty gold into your hand. “Worth it. I hate the dark.”",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.boot",
    "traces",
    "One boot in the mud",
    1,
    [
      "A single boot protrudes from the mud. Beside it, bare footprints lead toward a dry ledge and stop at a sleeping bag.",
      "A boot hangs from a nail above the flooded step. Its owner has scratched a joke about short legs into the wall.",
    ],
    [
      {
        id: "talk",
        label: "Inspect the dry ledge",
        item: "night-herb",
        outcome:
          "The owner has moved on. A medicinal plant has taken root in the old sleeping place; you gather one sprig.",
      },
      {
        id: "help",
        label: "Leave the boot where it can be found",
        outcome:
          "You hang the boot above the water. Its owner will have a chance to find it on the way back.",
      },
    ],
  ),
  encounter(
    "generic.pulley",
    "mechanisms",
    "The jammed pulley",
    1,
    [
      "A cargo pulley hangs sideways above an empty shaft. Its rope has caught a small supply satchel against the wall.",
      "An old lifting frame creaks whenever water drips onto its wheel. A sealed satchel is trapped behind the ratchet.",
    ],
    [
      {
        id: "talk",
        label: "Release the ratchet carefully",
        item: "relic-fragment",
        outcome:
          "You ease the satchel down. The supplies inside have rotted, but its old bronze seal survives. You tuck the relic fragment into your pack.",
      },
      {
        id: "help",
        label: "Repair the pulley for later crews",
        outcome:
          "You align the wheel and leave the rope reachable. The next cargo team will not have to climb the shaft.",
      },
    ],
  ),
  encounter(
    "generic.soup",
    "provisions",
    "Soup with too much water",
    1,
    [
      "A cook stirs a pot of roots while her partner slices the next batch. “Soup’s hot. Flavour costs extra.” Judging by the smell, that might be a warning.",
      "A wandering cook guards a pot of thin broth and a sack of roots. He’s planning a feast for the day the gate reopens. Today’s menu is less ambitious.",
    ],
    [
      {
        id: "talk",
        label: "Buy their spare roots · 15 gold",
        goldCost: 15,
        food: 1,
        outcome:
          "The cooks sell a bundle of roots they cannot fit in the pot. You gain one ration and leave them coin for later trade.",
      },
      {
        id: "help",
        label: "Add a ration to the communal pot",
        foodCost: 1,
        item: "night-herb",
        outcome:
          "You crumble a ration into the pot. The cook tastes it and nods. “That’s almost supper.” She slips you a medicinal sprig in thanks.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.rattle",
    "hazards",
    "A rattle behind the wall",
    1,
    [
      "A loose stone rattles when the party passes. Fine dust outlines a pressure plate that has slipped out of alignment.",
      "Pebbles skitter from a wall niche. A rusted spring is still trying to push a trap arm through solid mortar.",
    ],
    [
      {
        id: "talk",
        label: "Disarm the old spring",
        item: "ancient-ore",
        outcome:
          "The spring comes free without a strike. Its surviving metal can be used as ancient ore.",
      },
      {
        id: "help",
        label: "Mark the plate and leave it alone",
        outcome:
          "You chalk a warning around the pressure plate. The next traveller should see it before they put a foot wrong.",
      },
    ],
  ),
  encounter(
    "generic.missing",
    "lost",
    "A misplaced pack",
    1,
    [
      "A novice searches the same rubble pile for a pack he left beside a very similar pile. He is too tired to notice the difference.",
      "A porter counts five packs and six owners, then starts again. The missing pack is wedged behind his own rolled blanket.",
    ],
    [
      {
        id: "talk",
        label: "Help check the packs",
        gold: 25,
        outcome:
          "The pack turns up without accusation. Its owner insists on twenty-five gold for the time you saved.",
      },
      {
        id: "help",
        label: "Share food before searching",
        foodCost: 1,
        item: "ether",
        outcome:
          "After eating, the owner spots the mistake. An ether from the recovered pack is offered in thanks.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.chalk",
    "traces",
    "Two sets of chalk marks",
    1,
    [
      "Two expeditions have marked the same wall with incompatible symbols. Neither set includes the direction its writers were facing.",
      "A smudged arrow crosses an older circle. A note says the writer was looking back when the mark was made.",
    ],
    [
      {
        id: "talk",
        label: "Work out what the marks mean",
        outcome:
          "One company used circles for danger; the other used them for shelter. That explains the crossed-out arrows. You make a note to trust your own bearings.",
      },
      {
        id: "help",
        label: "Leave a note explaining the ambiguity",
        outcome:
          "You write “Two companies, two sets of signs” beneath the marks. It won’t guide anyone through, but it might stop someone following the wrong arrow.",
      },
    ],
  ),
  encounter(
    "generic.messenger",
    "travellers",
    "The messenger’s sore feet",
    1,
    [
      "A messenger has reached the right floor with a letter for the wrong expedition. She asks whether you know its seal.",
      "A runner rests beneath an old marker, keeping a letter dry inside an empty boot. The recipient left a month ago.",
    ],
    [
      {
        id: "talk",
        label: "Check the expedition’s seal",
        outcome:
          "You recognise the seal from the guild board. That company has already gone home. The messenger sighs and carefully puts the letter away. “Next opening, then.”",
      },
      {
        id: "help",
        label: "Sell her a spare ration",
        foodCost: 1,
        gold: 20,
        outcome:
          "She pays twenty gold and eats slowly, saving half for later. “I’ll deliver it myself when we get out. They can’t say I didn’t try.”",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.debtor",
    "travellers",
    "A debt written twice",
    4,
    [
      "Two traders argue over a debt entered in both their ledgers. Neither has noticed that one entry is marked paid in a different ink.",
      "A porter refuses to move a merchant’s crates until an old debt is settled. The merchant produces a receipt folded around a seed.",
    ],
    [
      {
        id: "talk",
        label: "Compare the dates and signatures",
        gold: 25,
        outcome:
          "The duplicate entry is cancelled. Both traders contribute a few coins for the embarrassment you saved them.",
      },
      {
        id: "help",
        label: "Give them space to settle it themselves",
        outcome:
          "You keep the passage clear while they compare their own records. The argument ends without a drawn blade.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.clock",
    "mechanisms",
    "A clock without daylight",
    4,
    [
      "A water clock drips onto the floor instead of filling its cups. A brass maker’s seal has fallen into the mechanism. The last day it counted was a very long time ago.",
      "A pendulum strains against a jammed gear. A broken brass seal is caught between its teeth. Each swing produces a small, stubborn click.",
    ],
    [
      {
        id: "talk",
        label: "Clear the jam",
        item: "relic-fragment",
        outcome:
          "You work the broken seal free. The clock starts ticking again, and you keep the brass fragment. Whether it tells the right time is another matter.",
      },
      {
        id: "help",
        label: "Leave a warning beside it",
        outcome:
          "You scratch “Stopped clock” into the wall beside it. Better a plain warning than another party losing track of the days.",
      },
    ],
  ),
  encounter(
    "generic.flour",
    "provisions",
    "Flour in a dry box",
    4,
    [
      "A flour box hangs above a patch of mould. Its keeper offers a small dry bundle in exchange for coins she can spend after extraction.",
      "A baker from another expedition has more flour than water. She is guarding the last dry sack beneath her sleeping mat.",
    ],
    [
      {
        id: "talk",
        label: "Buy a dry bundle · 20 gold",
        goldCost: 20,
        food: 2,
        outcome:
          "Two rations of flour change hands. The baker writes an honest receipt and keeps the rest dry.",
      },
      {
        id: "help",
        label: "Share a ration while discussing storage",
        foodCost: 1,
        item: "night-herb",
        outcome:
          "The shared meal settles the discussion. The baker offers a medicinal sprig from her drying rack.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.echo",
    "lost",
    "A voice with the wrong name",
    4,
    [
      "A novice calls his companion’s name into the dark, louder each time. Behind a pile of packs, someone snores. He’s too frightened to hear it.",
      "A surveyor keeps shouting for his scout. Every echo makes him turn towards a different passage. His scout is asleep against the wall, with a cloak pulled over her head.",
    ],
    [
      {
        id: "talk",
        label: "Check who is actually present",
        outcome:
          "You point out the sleeping figure. The shouting stops. A hand reaches out from under the cloak. “I said I was taking a nap.” Nobody quite manages to hide their laughter.",
      },
      {
        id: "help",
        label: "Share food while they recover",
        foodCost: 1,
        item: "ether",
        outcome:
          "The group eats and regains its bearings. Their alchemist gives you an ether for staying through the panic.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.wires",
    "hazards",
    "Copper under the dust",
    4,
    [
      "Copper filaments cross the dust without connecting to an intact trap. A loose power stone is slowly warming the nearest wire.",
      "A broken ward hums beneath a ledge. Its copper line has been severed, but a small stone still feeds the empty circuit.",
    ],
    [
      {
        id: "talk",
        label: "Disconnect the power stone",
        item: "ancient-ore",
        outcome:
          "The wire cools. You keep the inert metal as ancient ore and leave the broken ward safely disconnected.",
      },
      {
        id: "help",
        label: "Mark the warm wire and move on",
        outcome:
          "You mark the hot wire with chalk and give it a wide berth. Whatever powered this place still has a little strength left.",
      },
    ],
  ),
  encounter(
    "generic.postcard",
    "traces",
    "A postcard of Stormhold",
    4,
    [
      "A painted card of Stormhold is tucked behind a loose tile. Its writer describes a town festival that took place thirty years ago.",
      "A water-stained card shows a tower that no longer stands. On the back, someone has written that they expect to be home by autumn.",
    ],
    [
      {
        id: "talk",
        label: "Copy the writer’s name into the journal",
        outcome:
          "You copy the name and the date. Someone in Stormhold may still know the family. You leave the card tucked safely behind its tile.",
      },
      {
        id: "help",
        label: "Preserve the card in its dry niche",
        outcome:
          "You put the card where the water cannot reach it. Another traveller may recognize the name you could not.",
      },
    ],
  ),
  encounter(
    "generic.carrier",
    "travellers",
    "A carrier without a customer",
    4,
    [
      "A porter has reached the rendezvous with a sealed parcel. The customer’s expedition extracted last month and left no forwarding note.",
      "A tired courier guards a crate of ordinary cups. She expected a dramatic treasure and is embarrassed by how much the cups weigh.",
    ],
    [
      {
        id: "talk",
        label: "Help check the delivery address",
        outcome:
          "The address is right; the timing isn’t. You help the carrier write a note for the customer. “Next time,” she says, “they can carry their own parcel.”",
      },
      {
        id: "help",
        label: "Share a ration with the waiting carrier",
        foodCost: 1,
        gold: 25,
        outcome:
          "The carrier pays twenty-five gold for the ration and makes room beside the crate. For a little while, you both complain about other people’s planning.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.latch",
    "mechanisms",
    "A latch polished by hands",
    4,
    [
      "A polished latch opens an empty maintenance cupboard. A small tool has been bent into a wedge that keeps the door from closing.",
      "An old cupboard door has been tied open with wire. Its shelf holds a cracked maker’s badge and a note asking visitors not to lock it.",
    ],
    [
      {
        id: "talk",
        label: "Repair the latch and keep the cupboard open",
        item: "relic-fragment",
        outcome:
          "The cupboard stays usable without a dangerous wedge. The cracked badge comes loose as a relic fragment.",
      },
      {
        id: "help",
        label: "Respect the note and leave the latch alone",
        outcome:
          "You leave the door tied open. Someone went to a lot of trouble to stop it locking, and you’d rather not find out why from inside.",
      },
    ],
  ),
  encounter(
    "generic.veterans",
    "travellers",
    "Veterans counting the days",
    8,
    [
      "Two veterans argue over slates covered in tally marks. One has counted a day twice; neither will admit it. Their companions look ready to leave them here.",
      "A veteran turns her slate sideways, as if the tally might look better that way. Her companion produces a second slate. The totals don’t match.",
    ],
    [
      {
        id: "talk",
        label: "Compare recorded days",
        outcome:
          "You compare meals, battles and places slept. Eventually both slates agree. “Knew mine was right,” says the veteran who was wrong.",
      },
      {
        id: "help",
        label: "Share a ration for their remaining wait",
        foodCost: 1,
        gold: 30,
        outcome:
          "Thirty gold changes hands, and the argument gives way to chewing. They wish you luck on the climb. One quietly fixes a mark on his slate.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.ribbon",
    "traces",
    "A ribbon with no message",
    8,
    [
      "A coloured ribbon is tied around a pillar without any written code. Its sun-faded edge suggests it was a keepsake before it was a marker.",
      "A strip of festival cloth hangs from a nail. Several expeditions have mistaken it for a scout’s signal and added contradictory notes.",
    ],
    [
      {
        id: "talk",
        label: "Examine the ribbon",
        outcome:
          "The faded stitching is from a Stormhold festival. Someone brought a piece of home this far. You tie the loose end back onto the pillar.",
      },
      {
        id: "help",
        label: "Clear away the contradictory notes",
        outcome:
          "You take down the crossed-out directions and leave the ribbon. Whatever it meant to its owner, it wasn’t a map.",
      },
    ],
  ),
  encounter(
    "generic.vat",
    "provisions",
    "Pickles for the final week",
    8,
    [
      "A provisioner has brought an entire vat of pickled roots too far upward. She will sell a small bundle rather than carry it all home.",
      "Two porters roll a leaking pickle barrel onto a dry mat. The roots inside are sound, though the smell has conquered the chamber.",
    ],
    [
      {
        id: "talk",
        label: "Buy a sealed bundle · 25 gold",
        goldCost: 25,
        food: 2,
        outcome:
          "Two rations of pickled roots join your supplies. The provisioner seals them well enough to spare your pack.",
      },
      {
        id: "help",
        label: "Share a dry ration while they repack",
        foodCost: 1,
        item: "night-herb",
        outcome:
          "The provisioner trades a medicinal sprig for a meal that does not taste of vinegar. The barrel rolls onward.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.counterweight",
    "mechanisms",
    "The returning counterweight",
    8,
    [
      "A maintenance weight keeps rising an inch and falling back. A loose fragment has lodged beneath the wheel, imitating a deliberate signal.",
      "A stone weight taps against a brass plate in the same uneven rhythm. The lifting cord is frayed exactly where it catches the frame.",
    ],
    [
      {
        id: "talk",
        label: "Stop the mechanism before clearing it",
        item: "ancient-ore",
        outcome:
          "You brace the weight and free the wheel. The tapping stops. A piece of old metal comes loose, still good enough to sell as ancient ore.",
      },
      {
        id: "help",
        label: "Leave a warning about the loose weight",
        outcome:
          "You mark the floor beneath the weight and warn anyone passing to keep clear. The frayed rope won’t hold forever.",
      },
    ],
  ),
  encounter(
    "generic.mask",
    "lost",
    "A lost festival mask",
    8,
    [
      "An exhausted climber searches for a festival mask packed by her daughter. She has checked every serious piece of equipment twice.",
      "A porter is ashamed to delay the company over a painted paper mask. His companions are quietly searching their packs anyway.",
    ],
    [
      {
        id: "talk",
        label: "Search the ordinary pockets",
        gold: 30,
        outcome:
          "The mask turns up behind a folded receipt. Its owner offers thirty gold, relieved that nobody laughed.",
      },
      {
        id: "help",
        label: "Share a ration and give them time",
        foodCost: 1,
        item: "ether",
        outcome:
          "After eating, the owner remembers the extra pocket. An ether is offered with a story about the child who painted the mask.",
      },
    ],
    { people: true },
  ),
  encounter(
    "generic.dust",
    "hazards",
    "Dust falling upward",
    8,
    [
      "Fine dust rises through a cracked vent. A surviving air pump is pushing grit into the chamber whenever its old piston turns.",
      "A breeze rises from a floor vent, filling the lantern light with dust. Beneath the grille, a loose fitting rattles with every stroke of an old pump.",
    ],
    [
      {
        id: "talk",
        label: "Tighten the loose pump fitting",
        item: "relic-fragment",
        outcome:
          "The draught settles. A broken decorative cap comes free as a relic fragment; the working pipe remains sealed.",
      },
      {
        id: "help",
        label: "Mark the grit-filled vent",
        outcome:
          "You leave a chalk warning beside the grille and pull your cloak over your mouth. The dust follows you a little way down the passage.",
      },
    ],
  ),
  encounter(
    "generic.accounts",
    "traces",
    "Accounts of an ordinary day",
    8,
    [
      "A slate lists bread, lamp oil and the cost of repairing a chair. The writing is older than the king’s crest above it. Somebody once lived an ordinary life here.",
      "A household budget has survived beneath a grand inscription. Its largest expense was winter shoes for three growing children.",
    ],
    [
      {
        id: "talk",
        label: "Copy the ordinary names and sums",
        outcome:
          "Your chronicle keeps a record of life before the throne made every story about a king.",
      },
      {
        id: "help",
        label: "Protect the slate from the leaking ceiling",
        outcome:
          "You set the slate beneath a dry overhang. Its ordinary day may outlast another campaign.",
      },
    ],
  ),
  encounter(
    "generic.homeward",
    "travellers",
    "A company practising its return",
    8,
    [
      "A company rehearses the names it will give the rescue clerks when the gate opens. They are determined that nobody becomes an unnamed casualty.",
      "An expedition leader asks each companion what they want carried home if they cannot stand at extraction. The answers are mostly letters.",
    ],
    [
      {
        id: "talk",
        label: "Exchange the names of your companies",
        outcome:
          "You trade names and descriptions. If either company reaches town first, they’ll know who to ask for. It’s a small promise, but everyone listens.",
      },
      {
        id: "help",
        label: "Share a ration for the rehearsal",
        foodCost: 1,
        gold: 30,
        outcome:
          "Over a shared meal, the company pays for the ration and repeats every name once more. Nobody is left out.",
      },
    ],
    { people: true },
  ),
];
