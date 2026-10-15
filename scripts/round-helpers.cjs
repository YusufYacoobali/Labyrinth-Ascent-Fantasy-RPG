// Translate old one-command unit fixtures into an explicit, single-foe round.
// Production and practice both dispatch ROUND; old unit fixtures use this adapter.
const { e, rounds: r } = require("./engine-loader.cjs");
function act(s, a) {
  if (a.type !== "BATTLE") return e.reducer(s, a);
  if (s.phase !== "combat") return e.reducer(s, a);
  const legacy = s.enemy;
  if (!s.combat) s = r.beginCombat(s);
  const first = {
    ...s.combat.enemies[0],
    ...legacy,
    id: s.combat.enemies[0].id,
    archetype: "skirmisher",
    behaviorId: undefined,
  };
  s = {
    ...s,
    enemy: first,
    combat: {
      ...s.combat,
      rules: undefined,
      intents: undefined,
      complete: false,
      enemies: [first],
    },
  };
  const active =
    s.party.find((c) => c.id === a.actor) || s.party.find((c) => c.hp > 0);
  const actions = s.party
    .filter((c) => c.hp > 0 && !c.ailments.paralysis)
    .map((c) => {
      const kind = c.id === active?.id ? a.kind : "attack",
        skill =
          a.skill ||
          c.skills.find((k) => !e.SKILLS.find((s) => s.name === k)?.passive);
      return {
        actor: c.id,
        kind,
        skill: kind === "skill" ? skill : undefined,
        item: kind === "item" ? a.item || "potion" : undefined,
        target: kind === "guard" || kind === "item" ? c.id : first.id,
      };
    });
  return e.reducer(s, {
    type: "ROUND",
    battleId: s.combat.id,
    round: s.combat.round,
    actions,
    animate: a.animate,
  });
}
module.exports = { act };
