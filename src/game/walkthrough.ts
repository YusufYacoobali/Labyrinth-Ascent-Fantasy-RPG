import type { Action, Game } from "./engine";
import { battleIntent } from "./battle";
import { SKILLS } from "./combat-data";

export type Walkthrough = {
  active: boolean;
  minimized: boolean;
  done: string[];
};
export const newWalkthrough = (active = false): Walkthrough => ({
  active,
  minimized: false,
  done: [],
});
export type Guidance = {
  id: string;
  title: string;
  body: string;
  destination?: "/tavern" | "/shop" | "/guild" | "/party" | "/labyrinth";
  button?: string;
  acknowledge?: boolean;
};
const tip = (
  id: string,
  title: string,
  body: string,
  extras: Partial<Guidance> = {},
): Guidance => ({ id, title, body, ...extras });

/** Advice follows the actual save, not a scripted battle or a second tutorial economy. */
export function walkthroughTip(s: Game): Guidance | null {
  if (!s.started || !s.walkthrough.active) return null;
  const done = (id: string) => s.walkthrough.done.includes(id);
  if (s.phase === "town") {
    if (s.party.length < 2 && !done("recruit"))
      return tip(
        "recruit",
        "Find a companion",
        "Visit the Tavern. Talk to a recruit, then agree on a share of expedition gold. No fee is paid up front.",
        { destination: "/tavern", button: "Visit Tavern" },
      );
    if (s.food < 30 && !done("supplies"))
      return tip(
        "supplies",
        "Pack for the month",
        "Buy 30 party rations for the sealed month. One is used per elapsed day. Bring healing potions and camping kits too.",
        { destination: "/shop", button: "Visit Shop" },
      );
    if (!s.townProgress.trained && !done("train"))
      return tip(
        "train",
        "Train before the gate",
        "Open Prepare at the Guild, then Train. It costs 60 gold and one day and helps companions catch up to level 2 initially. Clearing deeper floors raises that ceiling. Stop when the gate opens.",
        { destination: "/guild", button: "Visit Guild" },
      );
    if (!done("equipment"))
      return tip(
        "equipment",
        "Check your equipment",
        "Open Party, select a member, then Equipment. Tap a slot to equip owned gear; each member has separate equipment.",
        { destination: "/party", button: "Open Party", acknowledge: true },
      );
    return tip(
      "gate",
      s.day % 30 === 0 ? "The gate is open" : "Prepare for opening day",
      s.day % 30 === 0
        ? "Enter from the Labyrinth tab. You will stay inside for 30 days, so check your party and supplies first."
        : "The gate opens every 30 days. Use Rest at the inn to reach opening day, or train more at the Guild. Spending a day on opening day skips it.",
      { destination: "/labyrinth", button: "Open Labyrinth" },
    );
  }
  if (s.phase === "mission")
    return tip(
      "mission",
      "Choose your purpose",
      "Chart a way upward is a good first mission. Other missions reward supplies or helping survivors. Pick a goal before entering.",
    );
  if (s.phase === "arrival")
    return tip(
      "approach",
      "Read the room",
      s.arrivalChoice
        ? "Your choice changed the opening of the fight. Face the enemy when ready, or find shelter first."
        : "Study the scene and choose an approach. Observing reveals the enemy; a companion advantage can secure an opening hit.",
    );
  if (s.phase === "combat" && !s.trial)
    return tip(
      "round",
      "Plan the whole round",
      "Select each standing companion, queue one action and choose its target. Check initiative and every enemy intent, then Confirm round. Guard, Focus and items use that companion's action; potions affect one ally. Retreat spends the round before following a connected passage.",
    );
  if (s.phase === "combat") {
    const living = s.party.filter((c) => c.hp > 0);
    const intent = battleIntent(s);
    if (intent.kind === "heavy")
      return tip(
        "guard",
        "A heavy attack is coming",
        "Tap Guard to halve incoming damage. Red markers above your characters show who is threatened. Read the enemy’s intent before every turn.",
      );
    if (
      living.some((c) => c.hp < c.maxHp * 0.5) &&
      s.potions > 0 &&
      !done("item")
    )
      return tip(
        "item",
        "Heal before someone falls",
        "Open Item and use a Healing draught to heal every living ally. Using an item spends a party turn, so check the incoming attack first.",
      );
    if (!done("attack"))
      return tip(
        "attack",
        "Command your first turn",
        "Tap a character or their HP/MP panel to choose who leads this action, then Attack. The blue ring marks your selection. Living allies support the strike.",
      );
    if (
      !done("skill") &&
      living.some(
        (c) =>
          c.ailments.paralysis === 0 &&
          c.skills.some((name) => {
            const skill = SKILLS.find((x) => x.name === name);
            return (
              skill && c.mp >= skill.cost && !((c.cooldowns[name] || 0) > 0)
            );
          }),
      )
    )
      return tip(
        "skill",
        "Use a companion’s skill",
        "Select a living companion, then open Skill. Choose an available skill. It spends that member’s MP; grey skills need MP or time to recover.",
      );
    if (!done("focus") && living.some((c) => c.mp <= c.maxMp - 20))
      return tip(
        "focus",
        "Recover your magic",
        "Select a member who has spent MP, then Focus to restore 20 MP. Allies still strike at reduced strength. A charging enemy will attack heavily next turn.",
      );
    if (!done("burst") && s.momentum >= 2)
      return tip(
        "burst",
        "Spend your momentum",
        "Attack, Guard and Focus build momentum. Burst spends 2 for a stronger strike and extra break. Emptying the break bar interrupts the enemy.",
      );
    return tip(
      "intent",
      "Watch what happens next",
      intent.kind === "charge"
        ? "The enemy is charging and will strike heavily next turn. Use this opening, then check its intent again before acting."
        : "Attack while the enemy recovers. Guard against heavy blows; use Item when hurt and Focus when MP runs low.",
    );
  }
  if (s.phase === "nag")
    return tip(
      "exhaustion",
      "Listen to your companions",
      "Each member tires differently. Leading and fighting add exhaustion; tired members fight worse. Find shelter when the team asks to stop.",
    );
  if (s.phase === "camp")
    return tip(
      "rest",
      "Rest behind a safe door",
      "Rest restores health and MP. With a ration it also clears more exhaustion. Wait for the return gate here if you need to end the expedition.",
    );
  if (s.phase === "defeat" || s.phase === "extraction")
    return tip(
      "return",
      "The return gate",
      "Town stays sealed until the 30 days end. Successful extraction secures spoils. Defeat loses unsecured rewards and provisional skills.",
      { acknowledge: true },
    );
  if (s.phase === "loot")
    return tip(
      "essence",
      "Victory rewards are recorded",
      "Review gold, items and individual XP, then continue. Bind any monster essence later in town or shelter.",
    );
  if (s.phase === "event" || s.phase === "encounter")
    return tip(
      "story",
      "Choose what comes next",
      "Read the situation, check the party and decide whether to risk more or rest. The map records connected passages; stories need no routine mandatory dialogue.",
    );
  if (!done("party"))
    return tip(
      "party",
      "Check your team",
      "The Party button in the top bar opens health and individual exhaustion. Tap it again to hide the overview. Outside battle, choose a portrait to change the pathfinder.",
      { acknowledge: true },
    );
  if (s.journey.portal || (s.journey.reachedPortals || []).length)
    return tip(
      "complete",
      "You found the upward portal",
      "Only a discovered portal lets you climb. Your map remembers this floor’s routes. Keep exploring, watch supplies, and rest before the team is exhausted.",
      { acknowledge: true },
    );
  if (!done("map"))
    return tip(
      "map",
      "Find the route upward",
      "Show the floor map. Left, right, straight and back move between connected rooms. Explored paths stay saved; side passages hold treasure, strangers or danger.",
      { acknowledge: true },
    );
  return tip(
    "trail",
    "Follow the connected rooms",
    "Use the map to retrace your route. Find a sheltered place if health or exhaustion is getting worse. The upward portal is hidden somewhere ahead.",
  );
}

export function advanceWalkthrough(
  before: Game,
  after: Game,
  action: Action,
): Game {
  if (!after.walkthrough.active || action.type === "CREATE") return after;
  const learned: string[] = [];
  if (after.party.length > before.party.length) learned.push("recruit");
  if (after.food >= 30 && after.food > before.food) learned.push("supplies");
  if (after.townProgress.trained > before.townProgress.trained)
    learned.push("train");
  if (
    action.type === "EQUIP" &&
    after.party.some(
      (c, i) => c.equipment.join() !== before.party[i]?.equipment.join(),
    )
  )
    learned.push("equipment");
  if (
    action.type === "ROUND" &&
    after.expedition.rounds > before.expedition.rounds
  )
    learned.push(...action.actions.map((q) => q.kind));
  if (action.type === "BATTLE" && after.effects.id !== before.effects.id)
    learned.push(action.kind);
  if (
    action.type === "CAMP_REST" &&
    after.journey.watches > before.journey.watches
  )
    learned.push("rest");
  if (!learned.length) return after;
  return {
    ...after,
    walkthrough: {
      ...after.walkthrough,
      done: [...new Set([...after.walkthrough.done, ...learned])],
    },
  };
}
