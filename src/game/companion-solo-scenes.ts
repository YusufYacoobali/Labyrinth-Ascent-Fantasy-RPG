/** The evidence remains discoverable when the optional paired witness is absent. */
export const SOLO_SCENES: Record<
  string,
  {
    body: string;
    label: string;
    outcome: string;
    alternateLabel?: string;
    alternateOutcome?: string;
  }
> = {
  "kael.roster": {
    body: "A brass roster is pinned beneath a wagon wheel on the Sunken Road. Iven’s last order reads: escort the wounded to the west shelter. A matching trail mark survives beside it. Kael asks you to preserve the account rather than take the captain’s medal.",
    label: "Copy the order and compare the trail mark",
    outcome:
      "You help Kael compare the mark with the order. Iven did not abandon his company. His account is carried home.",
  },
  "lyria.echo": {
    body: "Roots on the Sunken Road curl around a caravan bell. Lyria hears rain in its silence. An inscription records the road’s original watercourse, offering evidence that can be checked against her memory.",
    label: "Record the memory beside the inscription",
    outcome:
      "Lyria copies the lettering while you hold the lantern. The map now distinguishes a memory from a surviving inscription.",
    alternateLabel: "Dismiss Lyria’s memory as a distraction",
  },
  "bram.stamp": {
    body: "A split pick at the third-floor threshold bears Ironbell’s stamp. Its cheap core failed under a rescue crew. Bram wants to carry the broken tool back intact, even though its valuable casing would be easier to sell.",
    label: "Preserve the pick for a hearing",
    outcome:
      "You wrap the pick in a spare cloak. Bram has physical evidence to carry beside the names in his ledger.",
  },
  "ragnar.records": {
    body: "At the clan threshold, a damaged dispatch orders the wounded to hold an indefensible passage. A dated forge code shows that the celebrated leader had already withdrawn. Ragnar asks for help preserving the dispatch before his anger destroys it.",
    label: "Copy the code and preserve the dispatch",
    outcome:
      "Ragnar restrains his anger while you copy the code. The dead will have evidence at the hearing, rather than another tale of revenge.",
  },
  "elowen.shrine": {
    body: "At the fifth-floor shrine, Elowen finds soil that still smells of daylight. The altar can accelerate growth, but its inscription names memory as the price. She asks you to disable the binding before planting her brother’s seed.",
    label: "Disable the binding before planting",
    outcome:
      "You trace the binding while Elowen prepares the soil. The seed can grow without taking another piece of her family’s history.",
  },
  "finn.trail": {
    body: "A faded ribbon on Floor 2 marks a safe detour for wounded scouts. Finn compares its northern rescue knot with his sister’s trail key. The marks suggest that she led people upward instead of fleeing alone.",
    label: "Keep the rescue knot beside the trail key",
    outcome:
      "Finn records the matching knot before following the trail. The evidence gives him hope without promising an answer the road has not yet supplied.",
  },
  "mira.translation": {
    body: "The fifth-floor inscription names memory, not blood, as the gate’s first offering. A plant illustrated in the margin explains a word Mira’s teacher translated as a person. Her first theory may be wrong.",
    label: "Check the illustration and correct the translation",
    outcome:
      "Mira writes the correction above her first theory. The notebook keeps both the mistake and the evidence that changed her mind.",
  },
  "torren.bell": {
    body: "The bridge bell on Floor 7 still hangs above a severed rescue line. Torren finds the names of the wounded inscribed inside its clapper. He asks you to help lower the whole bell instead of cutting away its valuable bronze.",
    label: "Lower the bell and read every name",
    outcome:
      "You steady the line while Torren lowers the bell. He reads each name aloud before wrapping the clapper for the return journey.",
  },
  "sigrun.axe": {
    body: "The axe lies under a collapsed rescue arch on Floor 6. Sigrun can retrieve it if you help brace the remaining stone. Its valuable silver grip would be easier to take, leaving behind the haft engraved with her rival’s name.",
    label: "Brace the arch and recover the whole axe",
    outcome:
      "You hold the brace while Sigrun retrieves the axe. She returns with the name intact, carrying more than a valuable grip.",
  },
  "eira.answer": {
    body: "On Floor 7, a crystal rings the missing interval from Eira’s counting song. Its timing matches an old scout signal for survivors. She asks you to test the signal before breaking the crystal that holds it.",
    label: "Test the scout signal before breaking the crystal",
    outcome:
      "You tap the signal and Eira answers. The crystal repeats a warning that can finally be understood as a message instead of a plea.",
    alternateOutcome:
      "The crystal’s last note cuts off mid-word. Eira refuses to carry the pieces as treasure.",
  },
};
