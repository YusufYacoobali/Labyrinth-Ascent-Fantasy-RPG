import type { Game } from "./engine";
export const REACTIONS: Record<
  string,
  { approves: string[]; opposes: string[]; yes: string; no: string }
> = {
  kael: {
    approves: [
      "1.watch",
      "2.careful",
      "3.ally",
      "9.rescue",
      "9.share",
      "12.seal",
    ],
    opposes: ["1.welcome", "9.loot"],
    yes: "We have given them a reason to trust our company.",
    no: "A contract cannot excuse leaving someone behind.",
  },
  lyria: {
    approves: [
      "2.careful",
      "4.roots",
      "5.meditate",
      "6.herbs",
      "8.examine",
      "12.seal",
    ],
    opposes: ["5.blood", "8.take"],
    yes: "There is more here than something we can carry away.",
    no: "We have taken the answer before understanding the question.",
  },
  bram: {
    approves: ["2.careful", "4.forge", "6.antidote", "9.rescue", "10.pick"],
    opposes: ["2.rush", "9.loot", "10.force"],
    yes: "Careful work leaves someone alive to tell the tale.",
    no: "Someone else will pay for the shortcut we just took.",
  },
  ragnar: {
    approves: ["1.watch", "4.forge", "7.fight", "10.force", "12.claim"],
    opposes: ["1.leave", "7.pay"],
    yes: "That is a deed I will put my name beside.",
    no: "Coin has bought the tale before we had a chance to earn it.",
  },
  elowen: {
    approves: [
      "3.ally",
      "4.roots",
      "6.antidote",
      "9.rescue",
      "9.share",
      "12.seal",
    ],
    opposes: ["5.blood", "9.loot"],
    yes: "A living traveller matters more than a splendid account.",
    no: "I have seen a company come home with only its banner.",
  },
  mira: {
    approves: ["2.careful", "4.frost", "5.meditate", "8.examine", "10.pick"],
    opposes: ["2.rush", "10.force"],
    yes: "We can explain what happened without scraping out a margin.",
    no: "We have destroyed the evidence that could have answered us.",
  },
  torren: {
    approves: [
      "1.watch",
      "3.ally",
      "4.crypt",
      "7.climb",
      "9.rescue",
      "12.seal",
    ],
    opposes: ["1.welcome", "9.loot"],
    yes: "The person holding the door can stand behind that order.",
    no: "I have held a door for an order like that before.",
  },
  sigrun: {
    approves: ["1.watch", "7.fight", "9.rescue", "10.force", "12.claim"],
    opposes: ["7.pay", "9.loot"],
    yes: "That is a scar worth earning for someone else.",
    no: "There is no courage in making the helpless pay.",
  },
  finn: {
    approves: ["2.careful", "3.trade", "4.crypt", "7.climb", "9.rescue"],
    opposes: ["2.rush", "9.loot"],
    yes: "Someone following our trail will know why we did it.",
    no: "A missing person’s trail deserves better than that.",
  },
  eira: {
    approves: ["4.frost", "5.meditate", "7.climb", "8.examine", "10.pick"],
    opposes: ["8.take", "10.force"],
    yes: "We listened long enough to hear what was actually there.",
    no: "The last note has gone before we learned what it meant.",
  },
};
export function reactionFor(s: Game, id: string, choice: string) {
  const definition = REACTIONS[id],
    key = `${s.floor}.${choice}`;
  return definition?.approves.includes(key)
    ? { approved: true, line: definition.yes }
    : definition?.opposes.includes(key)
      ? { approved: false, line: definition.no }
      : null;
}
