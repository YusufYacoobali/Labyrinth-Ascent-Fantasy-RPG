export type Approach = "observe" | "ambush" | "rush" | "rest" | "ward";
export interface ArrivalChoice {
  id: string;
  label: string;
  detail: string;
  icon: string;
  effect: Approach;
  success: string;
  failure?: string;
  favoredRace?: "elf" | "dwarf";
}
export interface ArrivalScene {
  id: string;
  title: string;
  art: string;
  body: string;
  cue: string;
  choices: ArrivalChoice[];
}
export const ARRIVALS: ArrivalScene[] = [
  {
    id: "goblin",
    title: "Beyond the cave mouth",
    art: "cave",
    body: "Daylight shrinks behind you. Somewhere beyond the torchlight, a sharp goblin cry answers the scrape of iron on stone. Then another sound: a hurried whisper. Something is waiting around the bend. What do you do?",
    cue: "Goblin voices beyond the bend",
    choices: [
      {
        id: "listen",
        label: "Stop and listen",
        detail: "Read its movements before entering.",
        icon: "ear-hearing",
        effect: "observe",
        success:
          "You douse the torch and listen. One goblin, dragging a shield, rehearses the same clumsy swing. You mark the pause after each scrape. When you step into the chamber, you already know where the next blow will land.",
      },
      {
        id: "sneak",
        label: "Follow the wall quietly",
        detail: "Try an ambush. An elf guarantees success.",
        icon: "shoe-print",
        effect: "ambush",
        favoredRace: "elf",
        success:
          "You follow the damp wall, keeping outside the torchlight. The goblin turns toward a falling pebble. You are already behind it. Your first strike lands before it can raise its shield.",
        failure:
          "Your boot catches a loose stone. The goblin stops muttering. Its shield comes up, and it charges toward the sound. You have lost the chance to surprise it.",
      },
      {
        id: "charge",
        label: "Draw your weapon and charge",
        detail: "Land an opening hit; take a hit in return.",
        icon: "sword-cross",
        effect: "rush",
        success:
          "You round the corner with your weapon raised. The goblin's shield buckles under the first blow, but its axe catches you as you push past. It stumbles back, snarling. The chamber is yours to fight for.",
      },
    ],
  },
  {
    id: "roadkeeper",
    title: "The road under water",
    art: "labyrinth",
    body: "Wagon tracks disappear beneath black water. A guild seal hangs from a broken wheel on the far bank. Beside it, a skeleton in rusted armor turns its head. Its blade follows every ripple, even when nothing is there.",
    cue: "Water ripples around a broken wagon",
    choices: [
      {
        id: "ripples",
        label: "Watch what draws its attention",
        detail: "Study the roadkeeper's attack.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "A falling drop makes the skeleton swing at empty water. It hunts by movement. You wait for the blade to strike stone, then cross in the brief silence that follows.",
      },
      {
        id: "flank",
        label: "Circle behind the wagon",
        detail: "Try an ambush. An elf guarantees success.",
        icon: "shoe-print",
        effect: "ambush",
        favoredRace: "elf",
        success:
          "The wagon hides your approach. You reach the dry bank behind the roadkeeper and strike through a gap in its armor.",
        failure:
          "The submerged axle rolls under your foot. Water splashes against the wheel. The roadkeeper pivots before you reach the bank.",
      },
      {
        id: "cross",
        label: "Break through its guard",
        detail: "Trade health for an opening strike.",
        icon: "sword",
        effect: "rush",
        success:
          "You sprint through the shallows and drive your weapon into rusted plate. Its answering slash draws blood before you reach firm ground.",
      },
    ],
  },
  {
    id: "guardian",
    title: "The White Stag checkpoint",
    art: "clan",
    body: "Blue banners hang beyond a stone checkpoint. Armed adventurers watch from behind a runestone guardian. Their commander raises a hand. “It tests every party. Survive it, and we can talk.” The guardian's chest begins to glow.",
    cue: "A warning horn from the checkpoint",
    choices: [
      {
        id: "runes",
        label: "Read the guardian's runes",
        detail: "Study the pulse before it strikes.",
        icon: "magnify",
        effect: "observe",
        success:
          "Three runes brighten in sequence. A strike follows the third. You call the rhythm to your companions, and the commander lowers her hand. The test has begun.",
      },
      {
        id: "joints",
        label: "Strike its exposed joints",
        detail: "Try a surprise attack. A dwarf guarantees success.",
        icon: "hammer",
        effect: "ambush",
        favoredRace: "dwarf",
        success:
          "Old dwarven markings point to the hinges beneath the stone shell. Your opening blow cracks one. The guardian turns slowly, grinding against damaged stone.",
        failure:
          "The joint locks before your weapon reaches it. Sparks fly from the runestone shell, and the guardian steps between you and the checkpoint.",
      },
      {
        id: "brace",
        label: "Brace together behind your shields",
        detail: "Spend 1 ration to prepare an ailment ward.",
        icon: "shield",
        effect: "ward",
        success:
          "You share a ration and bind cloth beneath every shield grip. No one enters alone. The guardian advances while your party holds its formation.",
      },
    ],
  },
  {
    id: "broodmother",
    title: "Silk across four doors",
    art: "forest",
    body: "Four doorways rise beyond a hall webbed with silver thread. A pack hangs above them, its owner nowhere in sight. The ceiling creaks. Something with too many legs moves between the pillars, guarding every way upward.",
    cue: "A web tightens above the doors",
    choices: [
      {
        id: "threads",
        label: "Trace the taut threads",
        detail: "Find where the broodmother will strike.",
        icon: "magnify",
        effect: "observe",
        success:
          "The threads tighten toward one pillar. You point out the hanging strands before anyone steps beneath them. The broodmother drops where your party would have been.",
      },
      {
        id: "silence",
        label: "Slip beneath the loose webbing",
        detail: "Try an ambush. An elf guarantees success.",
        icon: "shoe-print",
        effect: "ambush",
        favoredRace: "elf",
        success:
          "You crawl beneath the slack strands without touching them. One exposed leg rests against the pillar. Your first blow severs it before the broodmother turns.",
        failure:
          "A thread brushes your shoulder. The ceiling shudders, and the broodmother falls between your party and the doors.",
      },
      {
        id: "wrap",
        label: "Wrap every exposed wound",
        detail: "Spend 1 ration for an ailment ward.",
        icon: "shield-check",
        effect: "ward",
        success:
          "You pack silverleaf into your bandages and check every wound. The spider's venom will find no easy opening. Above you, the pack tears free from its web.",
      },
    ],
  },
  {
    id: "revenant",
    title: "Footsteps before your own",
    art: "route",
    body: "Past your chosen doorway, your footsteps return a heartbeat too early. A figure stands beside a dark basin, copying the way you hold your weapon. When you stop, it takes one more step. The reflection is coming toward you.",
    cue: "An echo steps out of time",
    choices: [
      {
        id: "echo",
        label: "Wait for the false step",
        detail: "Learn the revenant's rhythm.",
        icon: "ear-hearing",
        effect: "observe",
        success:
          "You change your pace twice. The reflection stutters after each pause. It can copy movement, but it cannot predict hesitation. You move when its borrowed rhythm breaks.",
      },
      {
        id: "feint",
        label: "Feint, then strike from the side",
        detail: "Try to catch it between movements.",
        icon: "sword",
        effect: "ambush",
        success:
          "You lower your weapon as if surrendering. The reflection lowers its blade too. Your second hand is already moving. It recoils from a strike it never copied.",
        failure:
          "The reflection anticipates the feint. Its blade rises with yours, and the basin ripples behind it.",
      },
      {
        id: "breather",
        label: "Share a ration before advancing",
        detail: "1 ration restores 20 HP and 15 MP per standing ally.",
        icon: "sack",
        effect: "rest",
        success:
          "You sit where the basin cannot reach you and share the last clean water in a ration pack. The echo waits. For once, you decide when the next step begins.",
      },
    ],
  },
  {
    id: "blight",
    title: "The alchemist's warning",
    art: "route",
    body: "Glass vessels crowd a ruined workbench. Someone has scratched “Do not breathe the mist” into the stone. Beyond it, the Blight Warden drags a chain through pools of old reagents. Each breath makes the air shimmer.",
    cue: "A chain drags through glass",
    choices: [
      {
        id: "breath",
        label: "Watch the gaps between breaths",
        detail: "Study the warden's attack.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "The mist thins when the warden draws breath. You time your advance to those gaps, keeping your companions out of its longest exhalation.",
      },
      {
        id: "chain",
        label: "Pin the chain beneath the bench",
        detail: "Try to damage it before the battle.",
        icon: "hammer",
        effect: "ambush",
        success:
          "You jam the chain beneath a fallen bench. The warden pulls against it, exposing its side. Your opening blow lands before the stonework gives way.",
        failure:
          "The bench collapses under the chain's weight. The warden turns toward the falling glass.",
      },
      {
        id: "cloth",
        label: "Cover your mouths and wounds",
        detail: "Spend 1 ration for an ailment ward.",
        icon: "shield-check",
        effect: "ward",
        success:
          "You dampen clean cloth and bind it over each mouth. The warning on the wall was left by someone who did not get this far prepared. You intend to pass it.",
      },
    ],
  },
  {
    id: "frostfang",
    title: "Tracks on the broken span",
    art: "route",
    body: "The path narrows above a chasm. Claw marks score the stone beside tracks made by boots. Across the gap, a pale wolf lifts its muzzle. Farther up, a masked traveler watches without offering help.",
    cue: "A howl carries over the chasm",
    choices: [
      {
        id: "pounce",
        label: "Watch its weight shift",
        detail: "Read the wolf's first pounce.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "The wolf lowers its left shoulder before every leap. You leave room on that side of the span. The masked traveler stops smiling when your party changes formation.",
      },
      {
        id: "ledge",
        label: "Take the narrow ledge above it",
        detail: "Try an ambush. An elf guarantees success.",
        icon: "shoe-print",
        effect: "ambush",
        favoredRace: "elf",
        success:
          "You follow a ledge barely wide enough for a boot. The wolf watches the main span. It never looks up before your first strike.",
        failure:
          "Stone crumbles beneath your foot. You reach the span safely, but the wolf is already facing you.",
      },
      {
        id: "warmth",
        label: "Eat and warm your hands",
        detail: "1 ration restores 20 HP and 15 MP per standing ally.",
        icon: "sack",
        effect: "rest",
        success:
          "You share a ration beneath an overhang and work warmth back into your fingers. On the far bank, the wolf circles. The traveler is still waiting.",
      },
    ],
  },
  {
    id: "sentinel",
    title: "The garden keeps its names",
    art: "relic",
    body: "Names cover the stones around an old sword. A sentinel kneels beside the pedestal, polishing a blade that has no reflection. Your torch passes over the newest carving. The letters look uncomfortably like your own name.",
    cue: "Steel scrapes against the pedestal",
    choices: [
      {
        id: "inscriptions",
        label: "Read the old warnings",
        detail: "Find the sentinel's weakness.",
        icon: "magnify",
        effect: "observe",
        success:
          "An older inscription warns of a slow backswing. You keep the pedestal between yourself and the sentinel until its blade passes. The newest name remains unfinished.",
      },
      {
        id: "vines",
        label: "Circle through the ivy",
        detail: "Try a strike from behind.",
        icon: "shoe-print",
        effect: "ambush",
        success:
          "The ivy hides your approach. You strike the sentinel's unguarded side before it can finish polishing the blade.",
        failure:
          "A dead vine snaps. The sentinel rises and draws its blade across the unfinished name.",
      },
      {
        id: "challenge",
        label: "Challenge it before the sword",
        detail: "Trade health for an opening strike.",
        icon: "sword-cross",
        effect: "rush",
        success:
          "You refuse to wait for the last letter. Your weapon crashes against its armor. Its counter cuts deep, but the sentinel retreats from the pedestal.",
      },
    ],
  },
  {
    id: "ashen",
    title: "A banner in the furnace",
    art: "forge",
    body: "A White Stag banner burns above the stairs. Someone below calls for help, then falls silent. Between you and that voice stands a knight whose armor glows through its cracks. It lifts a blade still dripping molten metal.",
    cue: "A call for help beneath the forge",
    choices: [
      {
        id: "vents",
        label: "Watch the armor's vents",
        detail: "Read the knight's breathing fire.",
        icon: "magnify",
        effect: "observe",
        success:
          "Fire escapes through the shoulder vents before each sweep. You wait for the glow to fade, then advance. Below the stairs, the voice calls again.",
      },
      {
        id: "seam",
        label: "Strike where the armor has split",
        detail: "Try an opening hit. A dwarf guarantees success.",
        icon: "hammer",
        effect: "ambush",
        favoredRace: "dwarf",
        success:
          "The molten seams cannot support the plate above them. Your strike knocks a shoulder guard loose. The knight turns toward you, leaving the stairwell unguarded.",
        failure:
          "The cracked plate flares as you approach. Heat drives you back before your weapon reaches the seam.",
      },
      {
        id: "covers",
        label: "Dampen cloth around the party",
        detail: "Spend 1 ration for an ailment ward.",
        icon: "shield-check",
        effect: "ward",
        success:
          "You soak your last clean cloth and cover exposed skin. There are people beyond this knight. You will reach them together.",
      },
    ],
  },
  {
    id: "hunter",
    title: "Breath on the vault glass",
    art: "frost",
    body: "Frost seals the vault door. Scratches run across it from the inside. A pale hunter moves between the ice pillars, disappearing whenever your breath clouds the air. Its tracks stop directly behind your party.",
    cue: "Claws scrape frozen glass",
    choices: [
      {
        id: "breath",
        label: "Hold still and watch the frost",
        detail: "Learn where it will emerge.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "The frost thickens just before the hunter appears. You turn toward that patch of ice and call a warning. Its next leap finds a waiting shield.",
      },
      {
        id: "reflection",
        label: "Use the pillars as mirrors",
        detail: "Try an ambush. An elf guarantees success.",
        icon: "magnify",
        effect: "ambush",
        favoredRace: "elf",
        success:
          "Its reflection appears a moment before its body. You strike toward the mirror and catch the hunter as it rounds the pillar.",
        failure:
          "The reflection breaks across several pillars. You turn toward the wrong one, and the hunter emerges beside the vault.",
      },
      {
        id: "ration",
        label: "Recover in the sheltered doorway",
        detail: "1 ration restores 20 HP and 15 MP per standing ally.",
        icon: "sack",
        effect: "rest",
        success:
          "You rest against the sealed door and share a ration. Your breath steadies. The hunter can wait one more minute.",
      },
    ],
  },
  {
    id: "kingsblade",
    title: "One lantern still burning",
    art: "dungeon",
    body: "A lantern glows at the end of the hall. Beside it sits a merchant with his pack tied shut. “Not yet,” he says, looking past you. The King's Blade steps out of the dark behind your party, sword already drawn.",
    cue: "A blade leaves its scabbard",
    choices: [
      {
        id: "stance",
        label: "Turn slowly and read its stance",
        detail: "Study the executioner's first strike.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "You turn without raising your weapon. The swordsman shifts its grip too soon. You see the cut it intends before it moves. The merchant pulls his lantern farther away.",
      },
      {
        id: "light",
        label: "Use the lantern to blind it",
        detail: "Try to steal the first strike.",
        icon: "lightbulb-on-outline",
        effect: "ambush",
        success:
          "You lift the lantern between its eyes and your blade. It flinches just long enough for your first strike.",
        failure:
          "The swordsman shields its eyes with its blade. The lantern's light shows you nothing but the edge.",
      },
      {
        id: "rush",
        label: "Strike before it corners you",
        detail: "Trade health for an opening strike.",
        icon: "sword-cross",
        effect: "rush",
        success:
          "You drive forward before the hall becomes a trap. Your first strike lands, and so does its reply. The merchant steps aside as steel rings against stone.",
      },
    ],
  },
  {
    id: "king",
    title: "Before the Hollow Throne",
    art: "forge",
    body: "The final door opens without a hand upon it. A crown hangs above a throne of black stone. The king rises beneath it. “Twelve floors,” he says. “And still you think the way home is behind you.” His shadow reaches the doorway.",
    cue: "The final door opens",
    choices: [
      {
        id: "shadow",
        label: "Watch where his shadow moves",
        detail: "Read the king's opening attack.",
        icon: "eye-outline",
        effect: "observe",
        success:
          "The shadow moves before the king does. You follow it instead of the crown. When his blade falls, your party is already stepping out of its path.",
      },
      {
        id: "crown",
        label: "Strike beneath the floating crown",
        detail: "Try an opening hit against the king.",
        icon: "sword",
        effect: "ambush",
        success:
          "You strike as the crown settles toward his brow. The king catches the blow too late. For a moment, the shadow at your feet breaks apart.",
        failure:
          "The crown turns toward you before the king does. His blade meets yours, and the throne room closes around your party.",
      },
      {
        id: "lastmeal",
        label: "Share one final ration",
        detail: "1 ration restores 20 HP and 15 MP per standing ally.",
        icon: "sack",
        effect: "rest",
        success:
          "You sit in the doorway and share a ration where the king can see you. No one eats alone. When the last mouthful is gone, you stand together.",
      },
    ],
  },
];
