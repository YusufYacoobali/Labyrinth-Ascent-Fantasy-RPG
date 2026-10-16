import type { Game } from "./engine";
import type { Recruit } from "./town-content";

export interface RecruitReply {
  id: string;
  name: string;
  portrait: number;
  outcome: "accepted" | "declined" | "blocked";
  offered: number;
  asking: number;
  line: string;
}

export function recruitShare(
  s: Game,
  r: Recruit,
  trust = s.rapport[r.id]?.trust || 0,
) {
  const specialist = r.skills?.includes("Second Wind")
    ? 8
    : r.job === "Mage"
      ? 6
      : r.skills?.includes("Nerve Lock")
        ? 3
        : 0;
  const experience = Math.max(0, (r.level || 1) - 1) * 4;
  const skills = Math.max(0, (r.skills?.length || 1) - 1) * 5;
  const smallPartyRisk = Math.max(0, 3 - s.party.length) * 5;
  const asking = Math.min(
    50,
    r.share + specialist + experience + skills + smallPartyRisk,
  );
  return Math.max(
    10,
    asking -
      Math.min(3, Math.max(0, trust)) * 2 -
      Math.min(3, Math.floor(s.faction.guild / 10)),
  );
}

const voices: Record<string, { accept: string; decline: string }> = {
  kael: {
    accept: "Deal. My shield is yours. We bring everyone home.",
    decline:
      "I’m putting my life beside yours. My shield needs a fair share behind it.",
  },
  lyria: {
    accept:
      "Agreed. You keep us alive; I’ll make sure the journey is worth remembering.",
    decline:
      "Curiosity is free. Keeping you alive while I indulge it is rather more expensive.",
  },
  bram: {
    accept: "Done! My axe, your plan. Let’s try to keep both in one piece.",
    decline: "That won’t keep my axe sharp. Or me fed. Mostly me fed.",
  },
  ragnar: {
    accept: "Ha! A fair split and a glorious death to avoid. I’m in.",
    decline: "You’re buying a berserker, not hiring someone to hold your coat.",
  },
  elowen: {
    accept: "Agreed. If you fall, I’ll be there. Be there for me, too.",
    decline:
      "Healing hands need supplies, and a small company means more lives resting on mine.",
  },
  mira: {
    accept:
      "Acceptable. I’ve already calculated three ways for us to survive. Let’s avoid the fourth.",
    decline:
      "My spells are worth more than that. So are the eyebrows I keep losing while learning them.",
  },
  torren: {
    accept: "Terms agreed. Stand behind my shield when I tell you.",
    decline:
      "Experience costs. Especially the kind that keeps a whole company alive.",
  },
  sigrun: {
    accept:
      "You’ve got an axe at your side. Give me something worth swinging it for.",
    decline: "I swing the axe. I don’t also sharpen it for pennies.",
  },
  finn: {
    accept: "A deal! I’ll watch your back. Try not to make it too difficult.",
    decline:
      "That’s a charming offer. Unfortunately, charm doesn’t stop a knife.",
  },
  eira: {
    accept: "Agreed. When the path disappears, follow my arrows.",
    decline:
      "Those spells and arrows took years to master. I won’t wager them for that share.",
  },
};

export function recruitmentReply(
  s: Game,
  r: Recruit,
  offered: number,
  outcome: RecruitReply["outcome"],
  reason?: string,
): RecruitReply {
  const asking = recruitShare(s, r);
  return {
    id: r.id,
    name: r.name,
    portrait:
      r.portrait ?? { human: 0, elf: 1, dwarf: 2, barbarian: 3 }[r.race],
    offered,
    asking,
    outcome,
    line:
      reason ||
      (outcome === "accepted"
        ? `${voices[r.id]?.accept || "Agreed. Let’s see this through together."} ${offered}% it is.`
        : `${voices[r.id]?.decline || "That’s too little for the risk."} Make it ${asking}%, and we have a deal.`),
  };
}
