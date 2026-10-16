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
        outcome:
          "You leave the scene undisturbed and continue through the chamber.",
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
      "A survey pair shades a failing lantern behind a broken tile. They have ink, but nothing dry enough to take a flame.",
      "Three porters crouch around a wick that will not catch. Their spare oil leaked through a seam in the pack.",
    ],
    [
      {
        id: "talk",
        label: "Compare travelling notes",
        outcome:
          "You exchange accounts of the passages already travelled. Nobody claims to know a route they have not seen.",
      },
      {
        id: "help",
        label: "Share a ration’s wrapping · 1 ration",
        foodCost: 1,
        gold: 20,
        outcome:
          "The dry wrapping takes a flame. The travellers offer twenty gold for the supply and remember the help.",
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
          "The satchel lowers safely. Its broken seal is worth keeping as a relic fragment; the rest has rotted away.",
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
      "Two cooks are stretching a pot of roots for a company twice its size. They have plenty of salt and little else.",
      "A wandering cook offers a thin broth and a story about the feast planned for the gate’s reopening.",
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
          "The broth thickens. The cook gives you a medicinal sprig rather than pretending the kindness has no cost.",
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
          "You mark the real pressure plate without inventing a safe direction. Later travellers can choose their own passage.",
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
        label: "Record the marks as uncertain testimony",
        outcome:
          "You record who made the marks and their missing orientation. They do not become directions on your map.",
      },
      {
        id: "help",
        label: "Leave a note explaining the ambiguity",
        outcome:
          "Your note distinguishes a report from an observed connection. Nobody following it is promised an invented exit.",
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
        label: "Read the public delivery notice",
        outcome:
          "The notice belongs in the next town dispatch. You preserve the seal and give no promise of an impossible passage home.",
      },
      {
        id: "help",
        label: "Share a ration for the remaining month",
        foodCost: 1,
        gold: 20,
        outcome:
          "The messenger pays what she can and keeps the letter. The sealed month still applies to couriers.",
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
      "A water clock marks passing days in a chamber with no windows. Its lowest cup is blocked by a maker’s seal that fell from the frame.",
      "A pendulum taps against a stone marked with six lines. A little brass weight has slipped between the teeth of its escapement.",
    ],
    [
      {
        id: "talk",
        label: "Free the fallen weight",
        item: "relic-fragment",
        outcome:
          "The mechanism resumes its old rhythm. The broken maker’s seal is a relic fragment, separate from the clock’s working parts.",
      },
      {
        id: "help",
        label: "Label it as an unverified timepiece",
        outcome:
          "Your note warns travellers to record each day themselves. An old clock cannot decide when the return gate opens.",
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
      "A frightened novice calls for a companion whose name echoes back a beat too late. The companion is asleep behind the novice’s pack.",
      "A surveyor mistakes a chamber’s echo for an answer from a missing scout. His remaining partner is trying to bring him back to himself.",
    ],
    [
      {
        id: "talk",
        label: "Check who is actually present",
        outcome:
          "You count the living companions before interpreting the echo. The novice sits down beside the person he feared he had lost.",
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
          "A precise warning marks the filament itself. The party does not claim to have disarmed what it left alone.",
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
          "The name and its unfinished expectation join the chronicle. A familiar town becomes a little older.",
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
        label: "Read the public address and note the delay",
        outcome:
          "The parcel stays sealed. Its carrier has a written account of the failed rendezvous for the return journey.",
      },
      {
        id: "help",
        label: "Share a ration with the waiting carrier",
        foodCost: 1,
        gold: 25,
        outcome:
          "The carrier pays for the ration without selling the customer’s parcel. Waiting through the month feels less lonely.",
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
          "The door remains open. You add no mystery where an ordinary maintenance request explains the marks.",
      },
    ],
  ),
  encounter(
    "generic.veterans",
    "travellers",
    "Veterans counting the days",
    8,
    [
      "Two veteran companies disagree about how many days remain. One forgot to record their last battle. The other marked a day for every round.",
      "A veteran has stopped crossing days off her slate. Her companion has recorded each movement and encounter instead and is trying to reconcile the totals.",
    ],
    [
      {
        id: "talk",
        label: "Compare recorded days",
        outcome:
          "The companies reconcile their own slates. Your party keeps the expedition clock it has actually lived through.",
      },
      {
        id: "help",
        label: "Share a ration for their remaining wait",
        foodCost: 1,
        gold: 30,
        outcome:
          "The veterans buy a ration and stop arguing long enough to eat. Their wait is still governed by the sealed gate.",
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
        label: "Record its uncertain origin",
        outcome:
          "The ribbon enters your journal as an object with an unknown owner. It reveals no untravelled passage.",
      },
      {
        id: "help",
        label: "Remove only the misleading added notes",
        outcome:
          "The keepsake remains. The unsupported directions no longer borrow authority from its colour.",
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
          "The tapping ends when the wheel is freed. The obstruction is a useful piece of ancient ore, without a hidden message.",
      },
      {
        id: "help",
        label: "Label the mechanical fault",
        outcome:
          "A maintenance note replaces speculation. Later listeners can hear a broken machine without fearing an unseen caller.",
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
      "A breeze blows steadily from the floor toward a sealed grille. Dust marks a loose pump fitting, not the direction of a secret passage.",
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
          "You warn later travellers about the vent without calling it an exit. The party moves beyond the drifting grit.",
      },
    ],
  ),
  encounter(
    "generic.accounts",
    "traces",
    "Accounts of an ordinary day",
    8,
    [
      "A slate records bread, lamp oil and a repaired chair from the time before the king. There is no prophecy among the careful sums.",
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
          "Both companies have witnesses now. The promises concern the people present, not an easier route the chamber does not contain.",
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
