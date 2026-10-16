# Gameplay redesign delivery notes

## Milestone 1: reward and skill loop

Fourteen species now have stable identities, material tables, a signature skill and an independently rolled 30% essence drop. Bosses use the same chance. Victory records one receipt containing gross gold, held companion shares, net gold, items and individual XP/level changes. Continue dismisses that receipt without granting anything again.

The Milestone 1 reward, binding, extraction and loadout loop was delivered and playtested before replacing maps or the campaign combat resolver. The final persistence audit subsequently added stable skill-ID encoding at the save boundary. The isolated source snapshot is retained under `verification/milestone-1-source.zip` for development review.

### Skills

- Active and passive powers share two equipped slots at levels 1–2, three at 3–5, four at 6–8, five at 9–11 and six thereafter.
- The learned library is separate from the equipped loadout. Rearranging that loadout requires town. Learning in town or shelter fills an empty slot automatically.
- A field-found essence teaches a provisional power, marked **Secured on extraction**. Successful extraction secures the power and its mastery. Defeat removes that power from the library and loadout and removes its mastery. An essence secured on an earlier expedition can teach a permanent power in shelter.
- Duplicate essences can teach another companion, sell through existing vendors, or replace all materials in four existing recipes: Runestone Guardian → iron helm, Frostfang Alpha → frost charm, Ashen Knight → ember charm, Venom Broodmother → root mantle. Gold costs and floor unlocks remain those of the original recipes.
- Skills have three ranks at 0, 12 and 40 mastery points. Meaningful active use earns one point, capped at three per skill per battle. Contributing passives earn at most one. Trials, rejected commands, empty healing and enemies over two levels below the party average earn none. Duplicates never grant mastery.

Crystal refinement remains separate from monster powers: equipped companions can spend 30 crystals and 100 gold for permanent +10% protection against fire, frost or venom, once per element. This never teaches a skill or consumes a skill slot. Resistance still caps at 75%.

### Spoils and saves

Existing resource totals remain usable by town/field services; `expedition.unsecured` records the portion at risk. Consumption removes unsecured holdings first. Field rewards and goods derived from them remain unsecured. Gold shares are held separately and settle only after successful extraction. Defeat discards unsettled shares and unsecured holdings while preserving earlier belongings, XP and secured skill progress.

Version 2 saves use `labyrinth-awaits-save-v2`. Skill libraries, mastery, cooldowns, provisional powers and pending actions serialize stable skill IDs independently of display names; narrative text and character names remain unchanged. The previous development snapshot is backed up before that encoding is first written. An existing development save at the version 1 key is copied to `labyrinth-awaits-development-v1-backup` before starting fresh. Unreadable data is retained instead of overwritten. Failed writes remain available for retry; writes are serialized.

Combat, loot and encounter random streams are saved independently. Production actions use their saved stream; test fixtures can inject a roll or world seed. Combat resolves and saves before playback. During playback, another action cannot commit. Reload skips presentation and restores the already-resolved result, including a pending loot receipt. A final-watch kill still presents its receipt before extraction.

### Verification

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run playtest`. The reward suite includes drop-rate sampling, receipt idempotency, provisional learning, defeat/extraction, duplicate crafting/sales, slot limits, mastery, save backup and retry ordering.

Browser checks use an earned-resource party: recruit Kael, Lyria and Bram, buy two ration bundles, train through the first opening, then fight normally. Verified flows include the first loot receipt, reload after victory, shelter binding to another companion, reload after binding, successful extraction, and town loadout changes. Screenshots are saved under the ignored `verification/` directory.

Native device performance is not established by browser verification.

## Milestone 2: exploration and map

Implemented compass connections with saved facing, relative Left/Straight/Right/Back, history-based Retrace, north-up Skia pan/zoom/recenter, inspection sheets and accessible room lists. Geography persists independently of monthly occupants. Portal defenders, checkpoint starts and route-specific maps and monster families are connected. Factual rumours retain source, confidence and approach orientation. Unvisited rooms do not expose hidden occupants.

Verified 1,200 connected graphs, reciprocal headings, all facings, loops, portal distance bands and reload restoration. Browser playtesting covered movement changing north-facing controls to west-facing controls, inspection without movement, an explicit sheet Travel action, survey reports, pan, zoom, room selection after pan/zoom, and heading restoration after reload. Android, iOS and web exports succeeded. The user explicitly waived physical-device testing before Milestone 3.

## Milestone 3: tactical danger and survival

The campaign uses `ROUND` commands with a battle ID, round number and one action for each standing, unimpeded companion. Complete queues validate before resource consumption. Individual companions and enemies resolve by effective speed with stable ID ties. Items and Guard select one ally; Focus restores only the actor. Actions that become useless keep their resources. Attacks redirect from defeated targets to the first survivor. Enemy archetypes, individual break/interrupt protection and guardian phases produce the announced next-round intents.

Accepted rounds save their resolution events before playback. Repeated round numbers cannot replay rewards. Reload skips presentation and restores the resolved result. Defeated monsters contribute independent drops to a single receipt. Retreat spends a round, takes enemy responses and follows a connected edge. The encounter keeps its enemy HP, round and mastery caps for re-entry.

Daily food, wild camps, rescue injuries and town recovery are implemented. See [FLOOR-MAPS.md](FLOOR-MAPS.md) for exact values. Campaign balance values are centralized in `src/game/balance.ts`. Animation trials remain disposable and do not grant mastery or alter the saved campaign.

The scenario suite covers shared reservations, initiative, defeated actors/targets, single-target resources, cooldown/status timing, boss thresholds, retreat persistence, interrupted playback, final-watch rewards, daily food/hunger, caches, one-day actions and injuries. Seeded campaign results are written to `verification/campaign-simulation.json`; report completion and balance only from the final verified run.

## Milestone 4: story and relationship deliveries

The content shipped in the requested order: relationships plus Kael/Lyria; Bram/Ragnar/Elowen/Finn; Mira/Torren/Sigrun/Eira; floor chains in three batches of four; route chains one at a time; and generic encounters in three batches of eight. Scripted playthroughs exercise both decisions in each companion/route stage, all generic choices and variants, and persistent floor follow-ups. Each batch passed focused story checks before the next was registered. The completed suite includes all content.

- **Unique named chains:** ten companions, three stages each. Town conversations appear in Party; field stages require that companion to be standing on the authored floor. Individual decisions and rewards are permanent records. Authored solo variants preserve each investigation when its optional paired witness is absent. Field rewards follow unsecured provenance and cannot be earned again after defeat.
- **Floor-specific chains:** each of the twelve original principal events starts a three-stage chain, followed by an established-sanctuary investigation and a conclusion at that floor’s opened portal. Later visits show the recorded decision and aftermath. Floor 4 still permits a fresh route choice each expedition; it does not restart its story chain. The throne grants one campaign ending and one crown.
- **Route-exclusive chains:** the Rootkeepers, Frostwardens, Cinder Union and Quiet Court each have a three-stage Floor 5/6/7 chain, independent standing and permanent outcomes. A chain cannot advance on another route.
- **Generic encounters:** 24 encounters, each with two saved variants. Eligible pools depend on floor and authored restrictions. Saved shuffle bags exclude encounters seen in this or the preceding expedition and avoid consecutive families. Exhausted pools yield quiet traversal. Room selection, variant and resolution survive reload; repeated taps cannot repay a result.

Loyalty starts at 50. Approved decisions add five, companion quest milestones add ten, harmful decisions remove ten, and defeat removes five once. Named companions respond differently to authored principal decisions. Reactions go into the journal without a mandatory dialogue after routine actions. Companions below 25 must reconcile in town before joining the next expedition; they remain with the party throughout the sealed month. Authored paired decisions move relationships through hostile, neutral and bonded. Guild and White Stag standing remain alongside the four route factions.

The journal is accessible during an expedition. It shows chain categories, completed outcomes, next-stage floor and sanctuary/portal requirements, faction standing and aftermath. Field conversations are optional; accepting a substantial story decision costs one day, while town conversations use no day. A final-watch decision resolves before extraction.

## Final verification

- `npm test`: 161 grouped checks, including 1,200 generated maps, deterministic reward/round/persistence scenarios and all story categories.
- Essence frequency: 29,967 drops in 100,000 rolls (29.967%), separately sampled for ordinary and boss tables.
- Typecheck and Expo lint pass. Final Android, iOS and static web exports are generated under `verification/milestone-4-export`.
- Physical-device checks were skipped at the user’s request. Browser verification established the reward/binding/extraction loop and map controls before the combat delivery. Scripted gameplay exercises the final campaign and every story chain; native performance is not asserted.
- Version-1 saves, earlier spatial/tactical formats and the pre-story development snapshot are preserved under development backup keys before replacement or format extension. No legacy gameplay mode is shipped.

### Campaign sample

`node scripts/campaign-sim.cjs 200` uses the actual reducer, paid town services, six three- and four-person roster configurations, all eight initially available companions, all origins, seeded human awakening, discovered connections, visible enemy intents, repeat expeditions and checkpoint starts. The policy follows available optional stories without reading hidden occupants or unrevealed graph connections. It sometimes pays for injury treatment and otherwise uses ordinary town days. It does not grant equipment, levels, supplies or full health outside the game’s actions.

The final measured values are recorded in `verification/campaign-simulation.json` and summarized in [CAMPAIGN-RESULTS.md](CAMPAIGN-RESULTS.md). The acceptance gate checks the agreed medians (first run Floors 2–4; campaign 5–8 expeditions), stalled runs and repetition violations. Completion within the simulation’s twelve-expedition cap is reported separately; the plan does not require every possible party to finish within that cap.

### Interaction and pacing review

Victory uses one consolidated receipt and one Continue action. Binding is optional in shelter/town, and the library explains full loadouts and the next level-unlocked slot. Tactical rounds show the complete queue and incoming intents before confirmation; a quick-fill attack queue reduces routine command entry. Optional story leads stay outside routine combat rewards. Named aftermath prevents repeat reward/dialogue farming; empty generic pools stay quiet. The remaining balance risk is a weakly supported party repeatedly reaching the final guardian. Unfinished runs and roster differences are reported rather than hidden by a simulation-only stat boost.
