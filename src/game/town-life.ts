import type { Action, Game, Race } from "./engine";

export interface TownResult {
  title: string;
  body: string;
  bonds: { name: string; change: number }[];
  pair?: { names: string; change: number };
}
export interface TownLife {
  introSeen: boolean;
  completed: Record<string, number>;
  active: { id: string; companion: string } | null;
  result: TownResult | null;
}
export const newTownLife = (): TownLife => ({
  introSeen: false,
  completed: {},
  active: null,
  result: null,
});
export const STARTING_GOLD = 80;
export const openingLine = (race: Race) =>
  ({
    barbarian:
      "Eighty coins. Enough for a chipped blade and stale bread. Fine. First we survive. Then we conquer every last floor.",
    human:
      "A chipped sword and a few rations. So much for a grand entrance. We survive the first floor, find good people, and conquer the rest together.",
    elf: "Centuries of wisdom, and I’m budgeting for stale bread. Survive first. Conquer elegantly. Preferably after lunch.",
    dwarf:
      "Eighty coins? That barely buys a sword with the edge still attached. Right. Bread, blade, then teach this labyrinth some manners.",
  })[race];

const voices: Record<string, string> = {
  kael: "‘We can retreat,’ Kael says. ‘We just count heads before we do.’",
  lyria:
    "‘If supper starts growing roots, call me before you eat it,’ Lyria says. You both laugh.",
  bram: "‘Your sword’s fine,’ Bram says. ‘It’s your stance that needs forging.’",
  ragnar:
    "‘If this chair defeats me, leave it out of the guild report,’ Ragnar says.",
  elowen:
    "‘You can be frightened and still come back for someone,’ Elowen says.",
  mira: "‘I know seven ways a spell can collapse,’ Mira says. ‘We’re not inventing an eighth.’",
  torren:
    "‘Quiet plans. Loud shields,’ Torren says. ‘That’s how you get to grow old.’",
  sigrun:
    "‘I said we should spar,’ Sigrun says. ‘Why did you bring the good table?’",
  finn: "‘Losing at dice is an advanced scouting technique,’ Finn insists. You don’t believe a word of it.",
  eira: "‘Trust is where you stand when the ice starts cracking,’ Eira says.",
};
const topics = ["supper", "spar", "repair"] as const;
export function townMoments(s: Game) {
  if (!s.started || s.phase !== "town") return [];
  return s.party
    .filter(
      (c) =>
        c.id !== "hero" && s.townLife?.completed[c.id] !== s.expedition.number,
    )
    .map((c) => {
      const index =
        [...c.id].reduce(
          (n, letter) => n + letter.charCodeAt(0),
          s.expedition.number,
        ) % topics.length;
      const id = topics[index];
      const partner = s.party.find((p) => p.id !== "hero" && p.id !== c.id);
      return {
        id,
        companion: c.id,
        name: c.name,
        portrait: c.portrait,
        title:
          id === "supper"
            ? "One more chair"
            : id === "spar"
              ? "Blunt blades, honest advice"
              : "A stitch before the gate",
        body:
          id === "supper"
            ? `${c.name} saves you a seat outside the tavern. ${partner ? `${partner.name} pulls up another chair. ` : ""}The meal is already paid for; what they want is company. ‘Sit down. Tell me what you’re hoping to find beyond that gate.’`
            : id === "spar"
              ? `${c.name} is practising in the square with a battered wooden sword. ‘One round? Better to learn each other’s bad habits here than in front of a goblin.’`
              : `${c.name} is fighting a frayed pack strap outside the tavern. The needle bends. They stare at it. ‘I can face monsters. Apparently, sewing is my limit.’`,
        action:
          id === "supper"
            ? "Pull up a chair and listen"
            : id === "spar"
              ? "Practise watching each other’s backs"
              : "Hold the strap and help with the repair",
        outcome:
          id === "supper"
            ? `The conversation wanders from old disasters to tomorrow’s hopes. ${voices[c.id] || `${c.name} looks glad you stayed.`}`
            : id === "spar"
              ? `You leave the yard dusty and laughing, with a better sense of how ${c.name} moves. ${voices[c.id] || "Next time, you’ll know where to stand."}`
              : `The strap holds. ${c.name} tests it, then smiles. ‘Good. Now I only have to worry about the monsters.’`,
        partner: id === "supper" ? partner : undefined,
      };
    });
}

export function resolveTownLife(s: Game, a: Action): Game | undefined {
  if (
    ![
      "ACK_OPENING",
      "OPEN_TOWN_MOMENT",
      "TOWN_MOMENT_CHOICE",
      "CLOSE_TOWN_MOMENT",
      "ACK_TOWN_RESULT",
    ].includes(a.type)
  )
    return undefined;
  if (!s.started || s.phase !== "town") return s;
  const life = s.townLife || newTownLife();
  if (a.type === "ACK_OPENING")
    return { ...s, townLife: { ...life, introSeen: true } };
  if (a.type === "ACK_TOWN_RESULT")
    return { ...s, townLife: { ...life, result: null }, message: "" };
  if (a.type === "CLOSE_TOWN_MOMENT")
    return { ...s, townLife: { ...life, active: null } };
  if (a.type === "OPEN_TOWN_MOMENT") {
    if (life.active || life.result) return s;
    const moment = townMoments(s).find(
      (m) => m.id === a.id && m.companion === a.companion,
    );
    return moment
      ? {
          ...s,
          townLife: {
            ...life,
            active: { id: moment.id, companion: moment.companion },
          },
          message: "",
        }
      : s;
  }
  if (
    a.type !== "TOWN_MOMENT_CHOICE" ||
    !life.active ||
    !["join", "leave"].includes(a.choice)
  )
    return s;
  const active = life.active;
  const moment = townMoments(s).find(
    (m) => m.id === active.id && m.companion === active.companion,
  );
  if (!moment) return { ...s, townLife: { ...life, active: null } };
  const before = s.stories.loyalty[moment.companion] ?? 50;
  const after = a.choice === "join" ? Math.min(100, before + 5) : before;
  const pairs = { ...s.stories.pairs };
  let pair: TownResult["pair"];
  if (a.choice === "join" && moment.partner) {
    const key = [moment.companion, moment.partner.id].sort().join(":");
    const value = pairs[key] || 0;
    pairs[key] = Math.min(2, value + 1);
    if (pairs[key] > value)
      pair = {
        names: `${moment.name} & ${moment.partner.name}`,
        change: pairs[key] - value,
      };
  }
  const body =
    a.choice === "join"
      ? moment.outcome
      : `${moment.name} nods. ‘Another time, then. We’ve both got things to put in order.’`;
  return {
    ...s,
    stories: {
      ...s.stories,
      pairs,
      loyalty: { ...s.stories.loyalty, [moment.companion]: after },
    },
    townLife: {
      ...life,
      active: null,
      completed: { ...life.completed, [moment.companion]: s.expedition.number },
      result: {
        title: moment.title,
        body,
        bonds:
          after > before ? [{ name: moment.name, change: after - before }] : [],
        pair,
      },
    },
    journal: [`In Stormhold · ${body}`, ...s.journal].slice(0, 60),
    message: "",
  };
}
