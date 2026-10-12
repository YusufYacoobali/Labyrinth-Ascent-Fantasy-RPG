// Plays with earned stats and the actual starting budget: no boosted HP, gold, or damage.
const { e, story } = require("./engine-loader.cjs");
function play(
  seed = 12,
  route = "roots",
  race = "barbarian",
  strategy = "tactical",
) {
  const initialSeed = seed;
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race,
    name: "Bjorn",
    roll: 0.5,
  });
  const act = (a) => {
    s = e.reducer(s, a);
  };
  for (const [id, motive, offer] of [
    ["kael", "honor", 365],
    ["lyria", "discovery", 465],
    ["bram", "honor", 365],
  ]) {
    act({ type: "TALK", id, choice: "strengths" });
    act({ type: "TALK", id, choice: motive });
    act({ type: "RECRUIT", id, offer });
  }
  for (let i = 0; i < 3; i++) act({ type: "BUY_ITEM", id: "rations" });
  act({ type: "FORGE", id: "hero" });
  act({ type: "ENCHANT", id: "lyria", skill: "Toxic Adaptation" });
  act({ type: "BUY_ITEM", id: "greater-potion" });
  act({ type: "BUY_ITEM", id: "ether" });
  act({ type: "BUY_ITEM", id: "potion" });
  for (let i = 0; i < 6; i++) act({ type: "TRAIN" });
  act({ type: "ENTER" });
  let turns = 0;
  let battleTurns = 0,
    guards = 0,
    focuses = 0,
    bursts = 0,
    breaks = 0,
    skills = 0;
  let maxFloor = 1;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const choices = {
    1: "watch",
    2: "careful",
    3: "ally",
    4: route,
    5: "meditate",
    6: "ether",
    7: "climb",
    8: "examine",
    9: "rescue",
    10: "pick",
    11: "rest",
    12: "seal",
  };
  while (turns++ < 360) {
    maxFloor = Math.max(maxFloor, s.floor);
    if (s.phase === "arrival") {
      if (s.arrivalChoice) act({ type: "ENGAGE" });
      else
        act({
          type: "APPROACH",
          choice: story.ARRIVALS[s.floor - 1].choices[0].id,
          roll: random(),
        });
    } else if (s.phase === "combat") {
      const living = s.party.filter((c) => c.hp > 0),
        low = living.some((c) => c.hp / c.maxHp < 0.48),
        mpLow = living.every((c) => c.mp < 16);
      let a = { type: "BATTLE", kind: "attack", roll: random() };
      const healer = living.find(
        (c) =>
          c.skills.includes("Second Wind") &&
          c.mp >= 20 &&
          !(c.cooldowns["Second Wind"] > 0) &&
          !c.ailments.paralysis,
      );
      const paralyst = living.find(
        (c) =>
          c.skills.includes("Nerve Lock") &&
          c.mp >= 18 &&
          !(c.cooldowns["Nerve Lock"] > 0) &&
          !c.ailments.paralysis,
      );
      const twin = living.find(
        (c) =>
          c.skills.includes("Twin Strike") &&
          c.mp >= 16 &&
          !(c.cooldowns["Twin Strike"] > 0) &&
          !c.ailments.paralysis,
      );
      const poison = living.find(
        (c) =>
          c.skills.includes("Venom Fang") &&
          c.mp >= 14 &&
          !(c.cooldowns["Venom Fang"] > 0) &&
          !c.ailments.paralysis,
      );
      const damage = living.reduce((sum, c) => sum + c.atk - s.enemy.guard, 0);
      if (low && healer)
        a = { ...a, kind: "skill", actor: healer.id, skill: "Second Wind" };
      else if (low && (s.inventory["greater-potion"] || 0) > 0)
        a = { ...a, kind: "item", item: "greater-potion" };
      else if (low && s.potions > 0) a = { ...a, kind: "item", item: "potion" };
      else if (
        living.filter((c) => c.ailments.poison || c.ailments.paralysis).length >
          1 &&
        (s.inventory.antidote || 0) > 0
      )
        a = { ...a, kind: "item", item: "antidote" };
      else if (
        e.battleIntent(s).kind === "heavy" &&
        !s.enemy.controlWard &&
        paralyst
      )
        a = { ...a, kind: "skill", actor: paralyst.id, skill: "Nerve Lock" };
      else if (
        e.battleIntent(s).kind === "heavy" &&
        s.enemy.hp > damage &&
        !(s.momentum >= 2 && s.enemy.poise <= 50)
      )
        a = {
          ...a,
          kind: "guard",
          actor: living
            .filter((c) => !c.ailments.paralysis)
            .sort((x, y) => y.def - x.def)[0]?.id,
        };
      else if (poison && !s.enemy.poison && s.enemy.hp > damage)
        a = { ...a, kind: "skill", actor: poison.id, skill: "Venom Fang" };
      else if (s.momentum >= 2 && s.enemy.hp > damage)
        a = { ...a, kind: "burst" };
      else if (
        ["charge", "recovery", "interrupted"].includes(
          e.battleIntent(s).kind,
        ) &&
        living.some((c) => !c.ailments.paralysis && c.mp < c.maxMp * 0.5)
      )
        a = {
          ...a,
          kind: "focus",
          actor: living
            .filter((c) => !c.ailments.paralysis)
            .sort((x, y) => x.mp / x.maxMp - y.mp / y.maxMp)[0].id,
        };
      else if (twin)
        a = { ...a, kind: "skill", actor: twin.id, skill: "Twin Strike" };
      else if (mpLow && (s.inventory.ether || 0) > 0 && s.enemy.boss)
        a = { ...a, kind: "item", item: "ether" };
      if (strategy === "attack" && a.kind !== "item")
        a = { ...a, kind: "attack" };
      if (a.kind === "guard" && !living.some((c) => !c.ailments.paralysis))
        a = { ...a, kind: "attack" };
      const previousId = s.effects.id;
      act(a);
      if (s.effects.id === previousId)
        throw Error(
          "Policy selected invalid action: " +
            JSON.stringify(a) +
            " " +
            s.message,
        );
      battleTurns++;
      guards += a.kind === "guard";
      focuses += a.kind === "focus";
      bursts += a.kind === "burst";
      skills += a.kind === "skill";
      breaks += s.effects.broken;
    } else if (s.phase === "essence") {
      const id = s.floor === 3 ? "kael" : s.floor === 6 ? "lyria" : "hero";
      const skill =
        s.floor === 3
          ? "Nerve Lock"
          : s.floor === 6
            ? "Second Wind"
            : s.floor === 9
              ? "Ember Ward"
              : "Inspiring Presence";
      act(
        s.party.find((c) => c.id === id).skills.includes(skill)
          ? { type: "DEFER" }
          : { type: "LEARN", id, skill },
      );
    } else if (s.phase === "event")
      act({
        type: "EVENT",
        choice:
          s.floor === 8 && s.encounterExamined ? "take" : choices[s.floor],
        roll: random(),
      });
    else if (s.phase === "victory") {
      if (s.floor === 12) break;
      act({ type: "CONTINUE" });
    } else break;
  }
  return {
    seed: initialSeed,
    route,
    race,
    strategy,
    floor: maxFloor,
    phase: s.phase,
    standing: s.party.filter((c) => c.hp > 0).length,
    turns,
    gold: s.gold,
    battleTurns,
    guards,
    focuses,
    bursts,
    breaks,
    skills,
    potions: s.potions,
    hp: s.party.map((c) => Math.round((c.hp / c.maxHp) * 100)),
  };
}
if (require.main === module) {
  let complete = 0;
  for (const route of ["roots", "frost", "forge", "crypt"])
    for (const seed of [12, 42, 102, 203]) {
      const run = play(seed, route);
      console.log(JSON.stringify(run));
      if (run.floor === 12 && run.phase === "victory") complete++;
    }
  console.log(`${complete}/16 prepared expeditions completed.`);
  if (complete < 12) process.exitCode = 1;
}
module.exports = { play };
