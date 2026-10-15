const fs = require("node:fs");
const {
  e,
  w,
  exploration: x,
  maps,
  rounds: r,
  combatData: data,
  stories: quests,
  genericData: gd,
  monsters: m,
  townProgression: tp,
  status,
  powers,
} = require("./engine-loader.cjs");
const events = {
  1: "leave",
  2: "careful",
  3: "ally",
  5: "meditate",
  6: "antidote",
  7: "climb",
  8: "examine",
  9: "rescue",
  10: "pick",
  11: "rest",
  12: "seal",
};
const mean = (list) =>
  list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
function combatQueue(s) {
  const foes = s.combat.enemies.filter((e) => e.hp > 0),
    living = s.party.filter((c) => c.hp > 0),
    ready = living.filter((c) => !status.impeded(c)),
    intents = foes.map((e) => r.enemyIntent(s, e));
  let potions = s.potions,
    greater = s.inventory["greater-potion"] || 0,
    ether = s.inventory.ether || 0,
    antidote = s.inventory.antidote || 0,
    momentum = s.momentum;
  const plannedHeals = new Set(),
    actions = [];
  for (const c of ready) {
    const target = [...foes].sort(
        (a, b) =>
          Number(b.archetype === "support") -
            Number(a.archetype === "support") ||
          a.hp - b.hp ||
          a.id.localeCompare(b.id),
      )[0],
      low = [...living]
        .filter((c) => !plannedHeals.has(c.id))
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const skills = c.skills
      .map((name) => data.SKILLS.find((s) => s.name === name))
      .filter(
        (s) => s && !s.passive && c.mp >= s.cost && !(c.cooldowns[s.name] > 0),
      );
    const can = (name) =>
      skills.find((s) => powers.skillFamily(s.name) === name);
    let q = { actor: c.id, kind: "attack", target: target.id };
    if (
      can("Second Wind") &&
      living.filter((c) => c.hp < c.maxHp * 0.7).length >= 2
    ) {
      q = { ...q, kind: "skill", skill: can("Second Wind").name };
      for (const ally of living) plannedHeals.add(ally.id);
    } else if (low && low.hp < low.maxHp * 0.45 && (greater || potions)) {
      const item = greater ? "greater-potion" : "potion";
      if (greater) greater--;
      else potions--;
      plannedHeals.add(low.id);
      q = { actor: c.id, kind: "item", item, target: low.id };
    } else if (
      (c.ailments.poison ||
        c.ailments.paralysis ||
        Object.keys(c.ailments.conditions || {}).some((id) =>
          ["venom", "chilled", "frozen"].includes(id),
        )) &&
      antidote
    ) {
      antidote--;
      q = { actor: c.id, kind: "item", item: "antidote", target: c.id };
    } else if (
      intents.some(
        (intent) =>
          intent.kind === "strike" &&
          intent.power > 1 &&
          intent.targets.includes(c.id),
      )
    )
      q = { actor: c.id, kind: "guard", target: c.id };
    else if (
      c.mp < 15 &&
      c.skills.some(
        (name) => !data.SKILLS.find((s) => s.name === name)?.passive,
      ) &&
      intents.every((i) => ["charge", "guard", "wait"].includes(i.kind))
    )
      q = { actor: c.id, kind: "focus" };
    else if (momentum >= 2 && target.poise <= 50) {
      momentum -= 2;
      q = { ...q, kind: "burst" };
    } else if (can("Venom Fang") && !target.poison && target.hp > c.atk * 3)
      q = { ...q, kind: "skill", skill: can("Venom Fang").name };
    else {
      const skill = skills.find((s) =>
        [
          "Twin Strike",
          "Sunder",
          "Arcane Bolt",
          "Crown Pulse",
          "Shield Bash",
          "Nerve Lock",
          "Scavenge",
          "Sling Shot",
        ].includes(powers.skillFamily(s.name)),
      );
      if (skill) q = { ...q, kind: "skill", skill: skill.name };
      else if (c.mp < 14 && ether) {
        ether--;
        q = { actor: c.id, kind: "item", item: "ether", target: c.id };
      }
    }
    if (
      (target.counter?.turns ||
        (intents[foes.indexOf(target)]?.kind === "counter" &&
          r.effectiveSpeed(c) <= r.enemySpeed(target))) &&
      ["attack", "burst", "skill"].includes(q.kind) &&
      powers.skillFamily(q.skill) !== "Second Wind" &&
      !(
        target.controlWard === 0 &&
        ((q.kind === "burst" && target.poise <= 50) ||
          ["Shield Bash", "Nerve Lock"].includes(powers.skillFamily(q.skill)))
      )
    ) {
      if (q.kind === "burst") momentum += 2;
      const elemental = skills.find(
        (k) =>
          (k.element && k.element !== "physical") ||
          powers.skillFamily(k.name) === "Venom Fang" ||
          powers.skillFamily(k.name) === "Crown Pulse",
      );
      q = elemental
        ? {
            actor: c.id,
            kind: "skill",
            skill: elemental.name,
            target: target.id,
          }
        : { actor: c.id, kind: "focus" };
    }
    actions.push(q);
  }
  return {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions,
  };
}
function visibleStep(s, goal = null) {
  const map = x.floorMap(s),
    known = new Set([...map.explored, ...map.known]),
    queue = [[s.journey.room]],
    seen = new Set();
  while (queue.length) {
    const path = queue.shift(),
      id = path.at(-1);
    if (seen.has(id)) continue;
    seen.add(id);
    if ((goal && id === goal) || (!goal && !known.has(id))) {
      const edge = x.exitsFor(s).find((e) => e.to === path[1]);
      return edge ? { type: "MOVE", direction: edge.direction } : null;
    }
    if (!known.has(id)) continue;
    for (const heading of maps.HEADINGS) {
      const target = map.nodes[id].exits[heading];
      if (target && !seen.has(target)) queue.push([...path, target]);
    }
  }
  return null;
}
function campaign(seed = 1, maxExpeditions = 12) {
  let s = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: ["barbarian", "human", "elf", "dwarf"][seed % 4],
    name: "Surveyor",
    roll: m.nextRandom(maps.seedFor(`${seed}:origin`)).roll,
    seed,
  });
  const rosters = [
    ["kael", "lyria", "bram"],
    ["ragnar", "elowen", "finn"],
    ["kael", "mira", "elowen"],
    ["sigrun", "lyria", "bram"],
    ["kael", "lyria"],
    ["bram", "mira", "finn"],
  ];
  const roster = rosters[Math.floor(seed / 4) % rosters.length];
  const report = {
    seed,
    roster,
    origin: s.party[0].race,
    expeditions: 0,
    completed: false,
    firstFloor: 0,
    casualties: 0,
    starvation: 0,
    rounds: 0,
    battles: 0,
    lootInteractions: 0,
    mastery: 0,
    repeatedStories: 0,
    recoveryCost: 0,
    recoveryCharacterDays: 0,
    bindingInteractions: 0,
    storyDecisions: 0,
    genericEncounters: 0,
    genericRepeats: 0,
    stalled: false,
    floors: [],
  };
  const act = (a) => {
    const old = s;
    s = e.reducer(s, a);
    if (a.type === "ROUND" && s.expedition.rounds > old.expedition.rounds)
      report.rounds++;
    if (a.type === "COLLECT") {
      report.lootInteractions++;
      report.battles++;
    }
    if (
      s.message.includes("No food remains") &&
      s.journey.watches > old.journey.watches
    )
      report.starvation++;
    if (a.type === "TREAT_INJURY") report.recoveryCost += old.gold - s.gold;
    if (
      ["REST", "WORK", "TRAIN"].includes(a.type) &&
      old.phase === "town" &&
      s.day > old.day
    )
      report.recoveryCharacterDays +=
        old.party.filter((c) => c.injuries > 0).length * (s.day - old.day);
    if (
      a.type === "LEARN" &&
      Object.values(s.inventory).reduce((a, b) => a + b, 0) <
        Object.values(old.inventory).reduce((a, b) => a + b, 0)
    )
      report.bindingInteractions++;
    if (s.stories.history.length > old.stories.history.length) {
      report.storyDecisions +=
        s.stories.history.length - old.stories.history.length;
      const history = s.stories.history.map((h) => h.stage);
      report.repeatedStories = history.length - new Set(history).size;
    }
    for (const [room, record] of Object.entries(s.expedition.generic))
      if (!old.expedition.generic[room]) {
        report.genericEncounters++;
        if (
          (old.stories.genericHistory[record.id] ?? -2) >=
          s.expedition.number - 1
        )
          report.genericRepeats++;
      }

    return s;
  };
  for (const id of roster) {
    const recruit = e.RECRUITS.find((r) => r.id === id);
    act({ type: "TALK", id, choice: "strengths" });
    act({ type: "TALK", id, choice: recruit.motive });
    act({ type: "RECRUIT", id, offer: e.recruitShare(s, recruit) });
  }
  for (let expedition = 1; expedition <= maxExpeditions; expedition++) {
    for (const c of s.party)
      if (c.id !== "hero" && quests.loyalty(s, c.id) < 25) {
        if (s.food < 2) {
          if (
            s.gold <
            e.buyPrice(
              w.ITEMS.find((i) => i.id === "rations"),
              s.day,
              s,
            )
          )
            act({ type: "WORK", skipOpening: true });
          act({ type: "BUY_ITEM", id: "rations" });
        }
        act({ type: "RECONCILE", id: c.id });
        act({
          type: "STORY_CHOICE",
          stage: s.stories.active.stage,
          choice: "listen",
        });
        act({
          type: "STORY_CHOICE",
          stage: s.stories.active.stage,
          choice: "restitution",
        });
      }
    for (const chain of quests.storyLeads(s)) {
      const stage = chain.stages[s.stories.stages[chain.id] || 0];
      act({ type: "OPEN_STORY", id: chain.id });
      act({
        type: "STORY_CHOICE",
        stage: stage.id,
        choice: stage.choices[0].id,
      });
    }
    if (seed % 5 === 0)
      for (const c of s.party)
        if (c.injuries && s.gold > 1000 + c.level * 100)
          act({ type: "TREAT_INJURY", id: c.id });
    // Uses town services, secured inventory and learned libraries, without granting resources.
    for (const c of [...s.party])
      for (const spec of m.MONSTERS) {
        const id = m.essenceId(spec.id);
        if (
          s.inventory[id] > 0 &&
          !s.party.find((p) => p.id === c.id).learnedSkills.includes(spec.skill)
        )
          act({ type: "LEARN", id: c.id, species: spec.id, skill: spec.skill });
      }
    for (const [id, qty] of Object.entries(s.inventory)) {
      const item = w.ITEMS.find((i) => i.id === id);
      if (qty > 0 && item?.kind === "loot" && !id.startsWith("essence-"))
        act({ type: "SELL", id, vendor: item.vendor, quantity: qty });
    }
    // Basic equipment and a full month of food fit the real starting budget.
    for (const c of [...s.party])
      for (const id of ["iron-blade", "leather"]) {
        if (
          !s.party
            .find((p) => p.id === c.id)
            .equipment.some(
              (gear) =>
                w.ITEMS.find((i) => i.id === gear)?.kind ===
                w.ITEMS.find((i) => i.id === id)?.kind,
            ) &&
          s.gold >
            e.buyPrice(
              w.ITEMS.find((i) => i.id === id),
              s.day,
            ) +
              500
        ) {
          act({ type: "BUY_ITEM", id });
          act({ type: "EQUIP", character: c.id, item: id });
        }
      }
    while (
      s.food < 30 &&
      s.gold >=
        e.buyPrice(
          w.ITEMS.find((i) => i.id === "rations"),
          s.day,
        )
    )
      act({ type: "BUY_ITEM", id: "rations" });
    while (s.potions < 6 && s.gold > 350)
      act({ type: "BUY_ITEM", id: "potion" });
    if (!(s.inventory["camp-kit"] > 0) && s.gold > 200)
      act({ type: "BUY_ITEM", id: "camp-kit" });
    if (!(s.inventory.ether > 0) && s.gold > 200)
      act({ type: "BUY_ITEM", id: "ether" });
    const days = e.daysToGate(s.day);
    let trained = 0;
    for (let d = 0; d < days; d++) {
      if (s.party.some((c) => c.hp < c.maxHp) && d === 0) act({ type: "REST" });
      else if (
        trained < 6 &&
        s.gold >= 60 &&
        s.party.some((c) => tp.trainingXp(c, s.bestFloor) > 0)
      ) {
        act({ type: "TRAIN" });
        trained++;
      } else act({ type: "WORK" });
    }
    const start = Math.max(...s.checkpoints);
    act({
      type: "SELECT_START",
      floor: start,
      route: start === 7 ? s.discoveredRoutes[0] : undefined,
    });
    act({ type: "ENTER" });
    act({ type: "MISSION", id: expedition === 1 ? "survey" : "salvage" });
    let steps = 0,
      maxFloor = s.floor,
      returning = false;
    while (s.phase !== "town" && steps++ < 1500) {
      maxFloor = Math.max(maxFloor, s.floor);
      const living = s.party.filter((c) => c.hp > 0),
        needRest = living.some(
          (c) =>
            c.exhaustion >= 55 ||
            c.hp / c.maxHp < 0.55 ||
            (c.skills.includes("Second Wind") && c.mp < 20),
        ),
        map = x.floorMap(s),
        known = new Set([...map.explored, ...map.known]);
      const leads = quests.storyLeads(s);
      if (leads.length && !returning) {
        act({ type: "OPEN_STORY", id: leads[0].id });
        continue;
      }
      if (s.phase === "story") {
        const chain = quests.STORY_CHAINS.find(
            (c) => c.id === s.stories.active.chain,
          ),
          stage = chain.stages[s.stories.stages[chain.id] || 0];
        act({
          type: "STORY_CHOICE",
          stage: stage.id,
          choice: stage.choices[0].id,
        });
      } else if (
        s.phase === "branch" &&
        s.expedition.generic[x.encounterKey(s)]
      ) {
        const record = s.expedition.generic[x.encounterKey(s)],
          encounter = gd.GENERIC_ENCOUNTERS.find((c) => c.id === record.id);
        const choice =
          encounter.choices.find(
            (c) =>
              c.id !== "leave" &&
              s.food >= (c.foodCost || 0) + 5 &&
              s.gold >= (c.goldCost || 0),
          ) || encounter.choices.at(-1);
        act({
          type: "GENERIC_CHOICE",
          room: x.encounterKey(s),
          id: record.id,
          choice: choice.id,
        });
      } else if (s.phase === "arrival") {
        if (!s.journey.defender || s.arrivalChoice) act({ type: "ENGAGE" });
        else
          act({
            type: "APPROACH",
            choice: require("./engine-loader.cjs").story.ARRIVALS[s.floor - 1]
              .choices[0].id,
            roll: -1,
          });
      } else if (s.phase === "combat") {
        if (
          living.length < 2 ||
          (living.length < 3 && mean(living.map((c) => c.hp / c.maxHp)) < 0.28)
        ) {
          returning = true;
          act({ ...combatQueue(s), actions: [], flee: true });
        } else act(combatQueue(s));
      } else if (s.phase === "loot") act({ type: "COLLECT" });
      else if (s.phase === "event") {
        act({
          type: "EVENT",
          choice:
            s.floor === 4
              ? ["roots", "frost", "forge", "crypt"][seed % 4]
              : s.floor === 8 && s.encounterExamined
                ? "take"
                : events[s.floor],
          roll: -1,
        });
      } else if (s.phase === "nag") act({ type: "NAG_DECISION", rest: true });
      else if (s.phase === "extraction") act({ type: "RETURN" });
      else if (s.phase === "defeat") {
        returning = true;
        act({ type: "CAMP_REST", untilClose: true });
      } else if (s.phase === "camp") {
        if (s.food === 0 && s.journey.watches < 174 && living.length) {
          act({ type: "LEAVE_CAMP" });
          continue;
        }
        if (returning || (s.floor === 12 && s.ending)) {
          act({ type: "CAMP_REST", untilClose: true });
        } else if (
          living.some(
            (c) =>
              c.exhaustion >= 20 ||
              c.hp < c.maxHp * 0.85 ||
              c.mp < c.maxMp * 0.5,
          )
        )
          act({ type: "CAMP_REST" });
        else act({ type: "LEAVE_CAMP" });
      } else if (s.phase === "victory") {
        if (s.floor === 12 && s.ending) {
          returning = true;
          act({ type: "SEARCH_PORTAL" });
        } else if (needRest) {
          act({ type: "SEARCH_PORTAL" });
        } else act({ type: "CONTINUE" });
      } else if (["exploration", "branch"].includes(s.phase)) {
        if (living.length < s.party.length) returning = true;
        const suitable =
          x.currentRoom(s).kind === "landmark" ||
          x.currentRoom(s).kind === "dead-end" ||
          x.roomOccupant(s) === "spring";
        if (
          s.food < 4 &&
          suitable &&
          !s.expedition.foraged.includes(x.encounterKey(s))
        ) {
          act({ type: "FORAGE" });
          continue;
        }
        if (
          (needRest || returning) &&
          !known.has(map.sanctuary) &&
          s.inventory["camp-kit"] > 0
        ) {
          act({ type: "WILD_CAMP" });
          continue;
        }
        let goal =
          needRest || returning
            ? known.has(map.sanctuary)
              ? map.sanctuary
              : null
            : known.has(map.portal)
              ? map.portal
              : null;
        if (x.currentRoom(s).kind === "portal" && !needRest && !returning) {
          act({ type: "AT_PORTAL" });
          continue;
        }
        const lead = [...living].sort(
          (a, b) => a.exhaustion - b.exhaustion || a.id.localeCompare(b.id),
        )[0];
        if (lead && lead.id !== s.journey.leaderId)
          act({ type: "LEAD", id: lead.id });
        const move = visibleStep(s, goal);
        if (move) act(move);
        else {
          const fallback = visibleStep(s);
          if (fallback) act(fallback);
          else {
            report.stalled = true;
            break;
          }
        }
      } else {
        report.stalled = true;
        break;
      }
    }
    report.last = {
      room: s.journey.room,
      food: s.food,
      day: s.day,
      party: s.party.map((c) => ({
        level: c.level,
        hp: c.hp,
        max: c.maxHp,
        mp: c.mp,
        ex: c.exhaustion,
      })),
    };
    report.expeditions = expedition;
    report.floors.push(maxFloor);
    if (expedition === 1) report.firstFloor = maxFloor;
    report.casualties += s.party.filter((c) => c.hp <= 0).length;
    report.mastery = s.party.reduce(
      (n, c) => n + Object.values(c.mastery).reduce((a, b) => a + b, 0),
      0,
    );
    if (steps >= 1500 || report.stalled) {
      report.stalled = true;
      report.phase = s.phase;
      report.message = s.message;
      break;
    }
    if (s.bestFloor === 12 && s.ending) {
      report.completed = true;
      break;
    }
  }
  return report;
}
const median = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  return sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
};
function simulate(count = 200) {
  const runs = Array.from({ length: count }, (_, i) => campaign(i + 1));
  const completed = runs.filter((r) => r.completed);
  return {
    summary: {
      seeds: count,
      completed: completed.length,
      stalled: runs.filter((r) => r.stalled).length,
      firstFloorMedian: median(runs.map((r) => r.firstFloor)),
      campaignMedian: completed.length
        ? median(completed.map((r) => r.expeditions))
        : null,
      casualties: runs.reduce((n, r) => n + r.casualties, 0),
      starvation: runs.reduce((n, r) => n + r.starvation, 0),
      meanBattleRounds:
        runs.reduce((n, r) => n + r.rounds, 0) /
        Math.max(
          1,
          runs.reduce((n, r) => n + r.battles, 0),
        ),
      masteryMedian: median(runs.map((r) => r.mastery)),
      lootInteractions: runs.reduce((n, r) => n + r.lootInteractions, 0),
      repeatedStories: runs.reduce((n, r) => n + r.repeatedStories, 0),
      recoveryGold: runs.reduce((n, r) => n + r.recoveryCost, 0),
      recoveryCharacterDays: runs.reduce(
        (n, r) => n + r.recoveryCharacterDays,
        0,
      ),
      bindingInteractions: runs.reduce((n, r) => n + r.bindingInteractions, 0),
      storyDecisions: runs.reduce((n, r) => n + r.storyDecisions, 0),
      genericEncounters: runs.reduce((n, r) => n + r.genericEncounters, 0),
      genericRepeats: runs.reduce((n, r) => n + r.genericRepeats, 0),
    },
    runs,
  };
}
if (require.main === module) {
  const count = Number(process.argv[2] || 200),
    result = simulate(count);
  fs.mkdirSync("verification", { recursive: true });
  fs.writeFileSync(
    "verification/campaign-simulation.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result.summary));
  if (
    result.summary.stalled ||
    result.summary.firstFloorMedian < 2 ||
    result.summary.firstFloorMedian > 4 ||
    result.summary.campaignMedian < 5 ||
    result.summary.campaignMedian > 8 ||
    result.summary.repeatedStories ||
    result.summary.genericRepeats
  )
    process.exitCode = 1;
}
module.exports = { campaign, simulate, combatQueue, visibleStep };
