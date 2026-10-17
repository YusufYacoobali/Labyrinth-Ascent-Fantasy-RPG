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

/** Contracts are between adventurers with comparable experience, regardless of wealth. */
export function recruitLevelRefusal(s: Game, r: Recruit): string | undefined {
  const hero = s.party.concat(s.reserve).find((c) => c.id === "hero");
  const difference = (r.level || 1) - (hero?.level || 1);
  if (difference > 3)
    return r.race === "dwarf"
      ? "You’ve got nerve, I’ll give you that. But the fights I take would bury you. Get some experience, then come find me."
      : r.race === "barbarian"
        ? "You’re not ready to fight beside me. Survive a few harder battles. Then we’ll talk."
        : r.race === "elf"
          ? "I’d spend the whole journey keeping you alive. Find your footing first. I’ll still be here."
          : "I need a captain who can keep up when things go wrong. Prove yourself in the labyrinth, then ask me again.";
  if (difference < -3)
    return "You’re taking on fights I’m not ready for. Find someone who can keep pace with you. I’d only slow you down.";
}

export function recruitEquipment(r: Recruit): string[] {
  if (r.equipment) return r.equipment;
  const tier =
    (r.level || 1) >= 18
      ? "sovereign"
      : (r.level || 1) >= 12
        ? "dragon"
        : (r.level || 1) >= 8
          ? "moon"
          : (r.level || 1) >= 4
            ? "steel"
            : "copper";
  const kits: Record<string, string[]> = {
    kael: ["sword", "mail"],
    lyria: ["bow", "leathers"],
    bram: ["axe", "helm"],
    ragnar: ["maul", "vest"],
    elowen: ["staff", "robes"],
    mira: ["wand", "hood"],
    torren: ["maul", "plate", "helm"],
    sigrun: ["axe", "leathers"],
    finn: ["sword", "runners"],
    eira: ["bow", "mantle", "hood"],
    nessa: ["wand", "vest"],
    orik: ["crossbow", "hood"],
    vesper: ["dagger", "leathers", "runners"],
    haldor: ["spear", "mantle"],
    ilyra: ["staff", "robes", "amulet"],
    cassian: ["sword", "plate", "helm"],
    dagna: ["maul", "mail", "greaves"],
    zephyr: ["bow", "leathers", "runners"],
    morrigan: ["staff", "robes", "circlet", "orb"],
    astra: ["sword", "plate", "helm", "greaves"],
  };
  return (kits[r.id] || ["sword", "leathers"]).map(
    (form) => `market-${tier}-${form}`,
  );
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
        ? `${r.accept || voices[r.id]?.accept || "Agreed. Let’s see this through together."} ${offered}% it is.`
        : `${r.decline || voices[r.id]?.decline || "That’s too little for the risk."} Make it ${asking}%, and we have a deal.`),
  };
}
