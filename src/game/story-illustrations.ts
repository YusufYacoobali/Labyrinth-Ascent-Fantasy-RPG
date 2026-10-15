/** Stable stage IDs select individual panels; no story progress is inferred from titles. */
export const STORY_ILLUSTRATIONS: Record<
  string,
  { sheet: string; panel: number; label: string }
> = {
  "kael.promise": {
    sheet: "companion.kael",
    panel: 0,
    label: "A scratched-out name",
  },
  "kael.roster": {
    sheet: "companion.kael",
    panel: 1,
    label: "Under the broken axle",
  },
  "kael.memorial": {
    sheet: "companion.kael",
    panel: 2,
    label: "A shield with two names",
  },
  "lyria.ink": {
    sheet: "companion.lyria",
    panel: 0,
    label: "Ink that keeps moving",
  },
  "lyria.echo": {
    sheet: "companion.lyria",
    panel: 1,
    label: "The road remembers rain",
  },
  "lyria.garden": {
    sheet: "companion.lyria",
    panel: 2,
    label: "A map for the living",
  },
  "bram.list": {
    sheet: "companion.bram",
    panel: 0,
    label: "An apprentice’s ledger",
  },
  "bram.stamp": {
    sheet: "companion.bram",
    panel: 1,
    label: "Tools made to fail",
  },
  "bram.bell": {
    sheet: "companion.bram",
    panel: 2,
    label: "Ring for the apprentices",
  },
  "ragnar.banner": {
    sheet: "companion.ragnar",
    panel: 0,
    label: "Only the banner returned",
  },
  "ragnar.records": {
    sheet: "companion.ragnar",
    panel: 1,
    label: "The order to hold",
  },
  "ragnar.return": {
    sheet: "companion.ragnar",
    panel: 2,
    label: "Bring everyone home",
  },
  "elowen.seed": {
    sheet: "companion.elowen",
    panel: 0,
    label: "A seed without a season",
  },
  "elowen.shrine": {
    sheet: "companion.elowen",
    panel: 1,
    label: "Roots around the altar",
  },
  "elowen.grove": {
    sheet: "companion.elowen",
    panel: 2,
    label: "The first leaf",
  },
  "finn.ribbon": {
    sheet: "companion.finn",
    panel: 0,
    label: "A blue scouting ribbon",
  },
  "finn.trail": {
    sheet: "companion.finn",
    panel: 1,
    label: "The ribbon points onward",
  },
  "finn.letter": {
    sheet: "companion.finn",
    panel: 2,
    label: "A letter at the ninth shelter",
  },
  "mira.margin": {
    sheet: "companion.mira",
    panel: 0,
    label: "The missing margin",
  },
  "mira.translation": {
    sheet: "companion.mira",
    panel: 1,
    label: "The name of the offering",
  },
  "mira.archive": {
    sheet: "companion.mira",
    panel: 2,
    label: "An archive without a lock",
  },
  "torren.order": {
    sheet: "companion.torren",
    panel: 0,
    label: "A veteran’s silence",
  },
  "torren.bell": {
    sheet: "companion.torren",
    panel: 1,
    label: "Three slow strokes",
  },
  "torren.hearing": {
    sheet: "companion.torren",
    panel: 2,
    label: "Hold the door open",
  },
  "sigrun.oath": {
    sheet: "companion.sigrun",
    panel: 0,
    label: "The unearned scar",
  },
  "sigrun.axe": {
    sheet: "companion.sigrun",
    panel: 1,
    label: "The axe beneath the stones",
  },
  "sigrun.feast": {
    sheet: "companion.sigrun",
    panel: 2,
    label: "A name at the feast",
  },
  "eira.song": {
    sheet: "companion.eira",
    panel: 0,
    label: "A song beneath hearing",
  },
  "eira.answer": {
    sheet: "companion.eira",
    panel: 1,
    label: "An answer across the bridge",
  },
  "eira.vault": { sheet: "companion.eira", panel: 2, label: "The last verse" },
  "floor.1.arrival": {
    sheet: "floor.1",
    panel: 0,
    label: "A stranger at your fire",
  },
  "floor.1.investigation": {
    sheet: "floor.1",
    panel: 1,
    label: "The names beneath the ash",
  },
  "floor.1.conclusion": {
    sheet: "floor.1",
    panel: 2,
    label: "A lantern for the next company",
  },
  "floor.2.arrival": {
    sheet: "floor.2",
    panel: 0,
    label: "The abandoned caravan",
  },
  "floor.2.investigation": {
    sheet: "floor.2",
    panel: 1,
    label: "The second caravan ledger",
  },
  "floor.2.conclusion": {
    sheet: "floor.2",
    panel: 2,
    label: "Who the road served",
  },
  "floor.3.arrival": {
    sheet: "floor.3",
    panel: 0,
    label: "A banner greater than yours",
  },
  "floor.3.investigation": {
    sheet: "floor.3",
    panel: 1,
    label: "Serin’s sealed dispatch",
  },
  "floor.3.conclusion": {
    sheet: "floor.3",
    panel: 2,
    label: "The promise at the threshold",
  },
  "floor.4.arrival": { sheet: "floor.4", panel: 0, label: "The fourfold gate" },
  "floor.4.investigation": {
    sheet: "floor.4",
    panel: 1,
    label: "The gatewright’s four keys",
  },
  "floor.4.conclusion": {
    sheet: "floor.4",
    panel: 2,
    label: "An arch for every route",
  },
  "floor.5.arrival": {
    sheet: "floor.5",
    panel: 0,
    label: "The shrine answers",
  },
  "floor.5.investigation": {
    sheet: "floor.5",
    panel: 1,
    label: "The reflection’s missing face",
  },
  "floor.5.conclusion": {
    sheet: "floor.5",
    panel: 2,
    label: "A basin that can be refused",
  },
  "floor.6.arrival": {
    sheet: "floor.6",
    panel: 0,
    label: "What survives the poison",
  },
  "floor.6.investigation": {
    sheet: "floor.6",
    panel: 1,
    label: "The healer’s second recipe",
  },
  "floor.6.conclusion": {
    sheet: "floor.6",
    panel: 2,
    label: "Medicine without a debt",
  },
  "floor.7.arrival": { sheet: "floor.7", panel: 0, label: "The broken span" },
  "floor.7.investigation": {
    sheet: "floor.7",
    panel: 1,
    label: "The rope beneath the toll",
  },
  "floor.7.conclusion": {
    sheet: "floor.7",
    panel: 2,
    label: "A crossing with witnesses",
  },
  "floor.8.arrival": { sheet: "floor.8", panel: 0, label: "An ancient relic" },
  "floor.8.investigation": {
    sheet: "floor.8",
    panel: 1,
    label: "The gardener’s empty scabbard",
  },
  "floor.8.conclusion": {
    sheet: "floor.8",
    panel: 2,
    label: "What the blade is for",
  },
  "floor.9.arrival": {
    sheet: "floor.9",
    panel: 0,
    label: "The White Stag’s last stand",
  },
  "floor.9.investigation": {
    sheet: "floor.9",
    panel: 1,
    label: "The scouts’ unfinished survey",
  },
  "floor.9.conclusion": {
    sheet: "floor.9",
    panel: 2,
    label: "A report that returns everyone",
  },
  "floor.10.arrival": {
    sheet: "floor.10",
    panel: 0,
    label: "The starless vault",
  },
  "floor.10.investigation": {
    sheet: "floor.10",
    panel: 1,
    label: "The inventory before the king",
  },
  "floor.10.conclusion": {
    sheet: "floor.10",
    panel: 2,
    label: "A vault with an inventory",
  },
  "floor.11.arrival": {
    sheet: "floor.11",
    panel: 0,
    label: "Hope has a price",
  },
  "floor.11.investigation": {
    sheet: "floor.11",
    panel: 1,
    label: "The merchant’s last customer",
  },
  "floor.11.conclusion": {
    sheet: "floor.11",
    panel: 2,
    label: "A lantern that stays lit",
  },
  "floor.12.arrival": {
    sheet: "floor.12",
    panel: 0,
    label: "The hollow throne",
  },
  "floor.12.investigation": {
    sheet: "floor.12",
    panel: 1,
    label: "The keeper before the crown",
  },
  "floor.12.conclusion": {
    sheet: "floor.12",
    panel: 2,
    label: "An ending with witnesses",
  },
  "roots.water": {
    sheet: "route.roots",
    panel: 0,
    label: "A spring with two owners",
  },
  "roots.channel": {
    sheet: "route.roots",
    panel: 1,
    label: "The buried channel",
  },
  "roots.charter": {
    sheet: "route.roots",
    panel: 2,
    label: "A charter beneath the arch",
  },
  "frost.bell": {
    sheet: "route.frost",
    panel: 0,
    label: "The bell that orders winter",
  },
  "frost.witness": {
    sheet: "route.frost",
    panel: 1,
    label: "A witness in the ice",
  },
  "frost.thaw": {
    sheet: "route.frost",
    panel: 2,
    label: "The first lawful thaw",
  },
  "forge.wages": {
    sheet: "route.forge",
    panel: 0,
    label: "Wages paid in heat",
  },
  "forge.shift": {
    sheet: "route.forge",
    panel: 1,
    label: "The shift that does no work",
  },
  "forge.contract": {
    sheet: "route.forge",
    panel: 2,
    label: "A contract for returning",
  },
  "crypt.names": {
    sheet: "route.crypt",
    panel: 0,
    label: "A court without petitioners",
  },
  "crypt.ink": {
    sheet: "route.crypt",
    panel: 1,
    label: "Ink for those who could not pay",
  },
  "crypt.judgment": {
    sheet: "route.crypt",
    panel: 2,
    label: "The quiet judgment",
  },
};
