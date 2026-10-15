# Master roadmap implementation

Starting point: `6da6d25` on `ui-polish-from-ui-1`. The user requested sequential delivery through the master roadmap. This document tracks the new milestones 0–7; the earlier four-milestone redesign remains documented in GAMEPLAY-REDESIGN.md.

## Milestone 0 — critical fixes

Implemented and committed as `8633ad9`. On 15 October 2026 the user authorized continuing sequentially with UI checks deferred while automation is unavailable. Actual small/large-screen checks remain deferred; automated tests and platform exports are required at each checkpoint. Both UI runtimes reported `failed to write kernel assets: The system cannot find the path specified`.

- Essence binding lists every held compatible species, counts secured/unsecured units and consumes the explicitly selected source. Ambiguous requests cannot silently consume another species.
- New battles use species profiles and authored mixed groups. All living enemy sprites occupy stable battlefield positions, and cards use species artwork. Existing unfinished fights retain their accepted combatants and legacy behavior until resolved.
- New maps use all four compass headings, variable loops and variable sanctuary placement. Saved version-2 charts are retained. Relative navigation, real passage travel, fog and portal distance bands are preserved.
- Room narration uses deterministic local atmosphere, floor/biome, real exits, facing, encounter aftermath and injuries. It does not reveal occupants.
- Bonded companions provide 15% protection to a partner against one hit per round while standing and unimpeded. Hostile pairs decline optional paired cooperation through the authored solo scenes. Standing of 10 with the Guild, White Stag or current route faction adds one ration per sanctuary cache, once per expedition.
- Town training grants up to 45 XP only below the catch-up ceiling: level 2 initially, then highest cleared floor +2. Capped sessions spend neither gold nor days. Bulk training obeys the same limit, then works remaining days. The introductory training contract requires two sessions.
- Tempering has three diminishing tiers with real materials, floor unlocks and gold costs. Previously earned stats, levels and upgrades are preserved, including characters beyond the new limits. Town work retains its affordable recovery income; work-derived Guild standing stops at 20 without lowering previously earned standing.

### Verification

- 175 grouped automated checks pass, including 14 new regression groups for the critical fixes.
- Map checks cover 1,200 graphs. All four initial travel headings and many sanctuary locations/distances occur; connectivity, reciprocal edges and distance bands pass.
- Essence checks include 100,000 independent rolls for ordinary and boss species: 29,967 drops in each seeded stream, with no guaranteed boss essence.
- Reload tests preserve current version-2 campaigns, old chart coordinates, unfinished combatants, binding provenance, mastery, rewards and resolved outcomes. Existing failure/retry and interrupted-playback checks remain in the suite.
- Typecheck and lint pass. Android, iOS and web exports build. Exports are build validation, not native runtime or physical-device testing.
- Actual UI checks and human playtesting are pending, and visual polish is not claimed verified.

### Campaign benchmark

The same 200-seed policy uses player-visible navigation and telegraphs across six varied rosters. Training switches to work at the real limit rather than repeatedly issuing rejected actions. The seed report is in the ignored `verification/campaign-simulation.json`; the previous implementation's baseline is preserved as `verification/campaign-baseline-6da6d25.json`.

| Metric | Current result |
|---|---:|
| Campaigns completed within 12 expeditions | 195/200 |
| Stalled state machines | 0 |
| First-expedition median floor | 3 |
| Completion median among completed campaigns | 6 expeditions |
| Mean rounds per battle | 4.96 |
| Fallen-character events | 2,546 |
| Unfed-day checks | 0 |
| Median total mastery | 184 |
| Loot Continue actions | 5,117 |
| Binding actions | 1,616 |
| Story choices | 6,808 |
| Generic encounters | 7,803 |
| Unique story/repetition violations | 0 |
| Treatment gold | 306,200 |
| Injured-character recovery days | 6,000 |

Five seeds did not complete within the simulation's twelve-expedition cap; these are incomplete campaigns, not state-machine stalls. Aggregate target medians pass but this does not prove player enjoyment, UI clarity or equal difficulty across every party. Later ecosystem changes require fresh measurements.

## Milestone 1 — Floor 1 vertical slice

Implemented after the Milestone 0 gate and the user's explicit UI deferral. Solo scouts, shield-and-scout patrols, scout/slinger pairs and the three-role portal group use distinct telegraphs and actions. Scouts can call one slinger wave when space is available; killing or interrupting the scout cancels the call. New arrivals act next round. Shieldbearers cover one wounded ally, reducing incoming damage by 40% while the bearer stands unimpeded; attacking or interrupting the bearer removes that protection. Slingers hunt vulnerable companions, add exhaustion with their crippling shot and shelter behind rubble.

Summons have stable saved IDs and share the three-active-enemy cap. A replaced casualty is archived, and the final receipt de-duplicates actual defeated identities, including archived casualties. Saved wave counts and enemy HP survive retreat, reload and interrupted playback. Legacy fights retain their original combatants.

Goblin essence powers now have tangible differences: Twin Strike gains fast initiative and a chance to interrupt, Sling Shot is a cheaper fast armor-piercing strike that weakens the next attack, and passive Candle Ward adds a barrier when guarding an ally. All have three mastery ranks. The ward earns mastery only when its barrier absorbs a hit, once per battle. Its higher ranks prevent physical stagger during Guard. Newly bound field powers remain provisional. New goblin trophies and two equipment recipes use the ordinary inventory, crafting and vendor systems, with essence substitutions and ordinary material recipes retained.

The shieldbearer and slinger currently reuse existing animated sheets through explicit species mappings. Their final unique goblin artwork remains production-polish work; no new art generation or completed visual verification is claimed.

Verification: 184 grouped checks, typecheck, lint and Android/iOS/web exports pass. Nine goblin regression groups cover role variety, finite calls, interrupting calls, late initiative replacement, retreat/resume, actual cover mitigation, power/mastery effects, extraction/binding/duplicates/crafting/sale and 100,000 independent drop rolls per goblin species. UI checks and human playtesting remain deferred by the user.

The 200-seed benchmark completes 198 campaigns within twelve expeditions, with zero state stalls, first-expedition median Floor 4 and completed-campaign median six expeditions. Mean battle length is 4.97 rounds; fallen-character events 2,156; unfed checks 0; median mastery 179; loot Continue actions 5,021; binding actions 1,788; story choices 6,897; generic appearances 7,710; repetition violations 0; treatment cost 251,200 gold and 5,187 injured-character recovery days. Two campaigns remain incomplete at the simulation cap. Report: `verification/master-m1-campaign.json`.

## Milestone 2 — combat framework

Implemented following the Floor 1 checkpoint. New fights persist their announced intents, move cooldowns, current phase and previous commands. Species profiles feed reusable basic/special/defensive move definitions with explicit targets, effects and phase-dependent patterns. Support actions share a dedicated resolver for healing, armor, charging and finite reinforcements. Existing unfinished fights retain their previous behavior rules.

Characters have Front/Back formation selectable outside combat. Ordinary front attacks prefer standing front companions; hunting moves seek wounded targets and volleys retain their announced group targets. Guard and Taunt use the actor's action: Taunt guards its own actor and redirects subsequent single-target attacks after its initiative, while area attacks remain unchanged.

The status registry defines stack caps, durations, damage, cleansing and matching mastery immunities. Bleeding caps at three stacks, 2% maximum HP per stack for three future ticks. Burning and venom use 2.5% with the same cap/duration. Chilled removes two speed per stack for four rounds; three stacks convert into one action lost to freezing. Weakened reduces damage 20% for two rounds; fractured reduces armor 10% per stack (three maximum) for three rounds; exposed increases incoming damage 15% for two rounds. Fresh effects start ticking the following round, and freezing is consumed by exactly one missed action. Guard prevents special-hit ailments; antidotes, bandages, mastered healing and matching wards provide explicit counters. Rules and active durations are available in combat.

Repeat Last Commands retargets defeated units and replaces unavailable skills, while the complete queue still validates shared resources before spending them. Quick Attack fills remaining commands. Normal/fast playback preference persists, and Skip remains available. Selected offensive commands show a read-only damage range. Conservative auto resolution is limited to ordinary fights with a substantial level, health and estimated damage margin; it uses real round resolution, watches and ordinary seeded rewards, and stops if new ailments or significant damage require attention.

Verification: 196 grouped checks, typecheck, lint and Android/iOS/web exports pass. Twelve framework regression groups cover move definitions, intent persistence, formation targeting, taunts, exact status ticks and caps, freezing, remedies/immunities, Guard, phase patterns/cooldowns, repeated-command validation, previews/preferences and auto rewards. User-authorized UI deferral remains in effect; no physical-device or human playthrough result is claimed.

The 200-seed benchmark completes all 200 campaigns within twelve expeditions, with zero stalls. First-expedition median Floor 3; completed-campaign median five expeditions; mean battle length 4.75 rounds; fallen-character events 1,442; unfed checks 0; median mastery 165.5; loot Continue actions 4,560; binding actions 1,740; story choices 6,873; generic appearances 7,167; repetition violations 0; treatment cost 149,300 gold and 3,444 injured-character recovery days. Report: `verification/master-m2-campaign.json`. These aggregate simulations remain balance regression evidence, not a substitute for player feedback.

## Milestone 3 — floor and route ecosystems

Implemented after the combat framework checkpoint. The registry now has 44 stable species identities with floor/biome eligibility, elemental defenses and weaknesses, loot, XP and essence powers. Twenty new ranked powers extend the existing skill families with distinct status, barrier, healing or MP effects; the four route guardians have separate signature powers. Existing learned skills remain valid. Eight regular/elite route powers still share legacy families and are scheduled for the Milestone 6 build refinement.

Authored compositions and move sets now cover skeleton counter lines and menders; runic wards, fragments and charged slams; spiderling waves, webs, consumption and venom storms; route-influenced Echo Revenants and mirages; frost packs whose damage falls as packmates die; burial wards and acolytes; Ashen retaliation and fire storms; the Pale Hunter's concealment and freezing pressure; royal execution marks and guards; and Hollow King phases, finite knight waves and Last Eclipse. The four Floor 6 guardians respectively use regeneration/roots, coordinated frost, furnace counters and heat, or MP pressure and finite resurrection.

Broodmother phases occur at 75%, 50% and 25%. Its first wave contains two spiderlings, and killing them denies its later consumption heal. Consumed units grant no loot. Phases cannot regress when a boss heals. Late-phase Broodmother and Hollow King wards are announced before planning; full break removes the ward, allowing players to counter the prepared final attack. Devastating named slams/storms require an announced charge rather than appearing immediately after a threshold changes.

All reinforcements have saved unique identities and wait until the next round. At most three enemies stand at once. Resurrection retains the casualty's original ID, spends its finite use and never creates an extra reward. Defeated eligible identities are de-duplicated into one victory receipt; every eligible monster independently retains its 30% essence chance. The bestiary records actual sightings, moves and defeats, and reveals defenses and reward information after defeating a species. Historical discoveries remain accessible in existing campaigns.

New species currently reuse existing motion sheets through separate identity/art mappings. Distinct production artwork and actual device/UI verification remain outstanding; the user's UI deferral remains in force.

Verification: 211 grouped checks, typecheck, lint and Android/iOS/web exports pass. Fifteen ecosystem groups cover all species/eligibility, every floor and route composition, support healing, charged runic attacks, Broodmother thresholds and denied consumption, unique route guardians, resurrection/reload, counters/concealment, execution/final phases, every new power's real MP/effects/mastery/save identity, bestiary idempotency, breakable wards, pack cooperation, meaningful healing barriers and matching defensive mastery on retaliation.

The 200-seed benchmark completes 187 campaigns within its twelve-expedition cap, with zero state stalls. First-expedition median Floor 4; completed-campaign median six expeditions; mean battle length 6.65 rounds; fallen-character events 2,691; unfed checks 0; median mastery 211; loot Continue actions 5,116; binding actions 2,337; story choices 6,830; generic appearances 8,044; repetition violations 0; treatment cost 399,000 gold and 6,411 injured-character recovery days. Thirteen campaigns remain unfinished at the cap. The simulation now recognizes learned power families, prioritizes visible support units, respects heavy telegraphs and uses visible initiative/interrupt windows against counter stances. It grants no resources and uses no hidden navigation. Report: `verification/master-m3-campaign.json`.

The pacing medians pass, but combat is longer and the completion tail is worse than Milestone 2. Milestone 6 equipment/build preparation and the final balance pass must revisit those costs; these aggregate results are not a claim that all party compositions are equally effective or that human playtesting is complete.

## Milestone 4 — exploration

New expeditions precompute all floor/route occupant plans from the campaign seed, month, party preparation, story history, standing and time budget. Weighted quiet chambers, local patrols, charged ambushes, elite formations, caches, hazards, springs and travellers replace the uniform pool. Generic identities and variants are reserved at entry with previous-month cooldowns and no duplicate reservations; exhausted or consecutive-family content becomes quiet traversal. First arrival locks pre-rolled late-month alternatives. Existing expeditions retain their occupants until the next entry.

Elian Voss, Tamsin Reed and Sable Dusk occupy one saved location each month and remember meetings. Tamsin offers a finite core-for-rations trade; fully secured inputs preserve security, while any unsecured contribution keeps the acquired bundle at risk. Rare cache equipment uses the ordinary durable resolution and unsecured ledger. Optional mapped battles now use regional species; the previous Bonegnaw substitution had hidden those ecosystems outside portal fights.

Deterministic keyed and survey-operated shortcuts preserve coordinates and open reciprocal connections permanently. Opening costs a watch and never moves the party. Known-route travel traverses only visited connected rooms, charges each real watch, restores facing/history/trail and stops for encounters, stories, sanctuary decisions, hunger and the gate boundary. Looking at a room never moves or turns the party.

The existing Skia map now has a full-screen Router screen, environment backgrounds, portal/sanctuary/landmark and discovered-occupant symbols, selected-room highlighting and actual travelled passages. Current-month visits gate occupant symbols, preventing last month's knowledge from revealing new inhabitants. Text lists, explicit adjacent travel, zoom/recenter and room-inspection sheets remain available. Dead-end encounters are actionable, and descriptions respect their real exits after a shortcut opens.

Verification: 221 grouped checks pass, including ten director groups, 1,000 additional shortcut graphs, durable rare loot/trades, monthly reservations, NPC memory and known-route costs/stops. Typecheck, lint and Android/iOS/web exports pass. UI, device checks and human playtesting remain deferred by explicit user instruction.

The 200-seed benchmark completes 178 campaigns within twelve expeditions, with zero state stalls. First-expedition median Floor 4; completed-campaign median seven expeditions; mean battle length 6.73 rounds; fallen-character events 3,197; unfed checks 0; median mastery 215; loot Continue actions 5,380; binding actions 2,291; story choices 6,704; generic appearances 3,411; repetition violations 0; treatment cost 477,300 gold and 7,530 injured-character recovery days. Twenty-two campaigns remain unfinished at the cap. The completion tail and recovery costs need the Milestone 6 preparation/balance pass. Report: `verification/master-m4-campaign.json`.

## Milestone 5 — story and world consequences

The existing ten personal arcs, twelve floor chains, four route chains and 24 generic encounters remain the content base. Six authored investigation/cooperation alternatives now use dwarven knowledge, equipped essence skills, protective equipment, Elian's earlier assistance, route standing or Sable's trust. Their availability is revalidated when choosing, and the ordinary one-time story resolution records their rewards. Injuries and earlier harmful decisions add contextual reactions. Important stages use the existing illustrated scene library and preserve unique aftermath.

All ten companions now have an individual reconciliation conversation. Opening it grants no loyalty: the player acknowledges the grievance, then donates two real party rations to an appropriate rescue effort. Insufficient supplies leave the promise pending; closing, reloading or repeating an old choice cannot restore loyalty for free. Prior decisions remain recorded.

Sable's disputed salvage and cooperative surveys have durable trust, gold/supply/key and future-dialogue consequences. Shared surveys require earlier trust; a claim closes off cooperation until trust is rebuilt. Tamsin's remembered trust improves the finite monthly barter. The journal records meetings, trust, decisions and later opportunities.

Six faction commissions require earned standing, floor progress and secured species materials. Each grants exclusive equipment once. Ten standing unlocks affiliated stock and a 10% merchant discount, with identical displayed, cart and resolver prices. Locked mixed carts are atomic; exclusive faction equipment is excluded from procedural cache pools. Existing faction sanctuary assistance and bonded/hostile cooperation continue to apply.

Verification: 229 grouped checks pass, including eight world-consequence groups covering every companion's reconciliation, pending promises, authored conditions, durable rewards, all six faction deliveries, atomic stock purchases, disputes and trusted trades. Typecheck, lint and Android/iOS/web exports pass. UI/device/human checks remain explicitly deferred.

The existing 200-seed policy continues to choose the original authored options; results remain 178 completions, zero stalls, first-floor median 4, completed-campaign median 7, mean 6.73 rounds, 3,197 fallen-character events, no starvation or repetition violations. Recovery cost remains 477,300 gold and 7,530 injured-character days. The new optional faction/NPC alternatives are verified deterministically, rather than represented as sampled by that unchanged campaign policy. Report: `verification/master-m5-campaign.json`.

## Milestone 6 — builds, economy and expedition reports

All 44 species now grant different shipped powers. Eight route roamer/elite signatures extend existing families with entanglement, healing barriers, chilled-target finishing damage, frost protection, burning rushes, weakening fire bashes, MP siphons and armor-fracturing edicts. Earlier learned powers remain valid. Poisoned-target venom bonuses, frost finishing bonuses, guarding rune barriers and real Ember Ward retaliation give the original signatures additional tactical identity.

Crown Pulse hits every living enemy through the existing damage/status resolver while spending one action, one MP cost, one cooldown, one mastery use and one party heal. Secondary targets retain individual wards, cover, break, defenses and durable identities. The Uncrowned scepter's cost reduction is shared by displayed costs, repeat-command validation, full-queue validation and actual spending.

Equipment now complements twin attacks, arcane powers, venom/frost/fire builds, group healing, armor break and Guard. Reliable guardian trophies supplement ordinary material drops; their appearance never forces an essence. Five advanced recipes have earned floor gates, real trophy/material costs and matching stock gates. Earlier recipes, alternate essence ingredients, finite tempering and existing improvements remain intact. Catch-up training grants up to 90 XP to companions at least two levels behind the party while preserving the same earned level ceiling.

A durable consolidated return report records actual defeated species, essence finds, secured or forfeited belongings and shares, individual XP/levels/mastery/secured powers, injuries, loyalty, relationships, quest/faction consequences, unresolved leads and recommended preparation. Defeat retains a loss receipt while revoking provisional powers. Generated but unvisited floors do not inflate discoveries. One Continue action returns to town; the last report remains accessible. Optional completion goals track routes, personal arcs, powers, full surveys and repeating the throne with every companion standing, without adding a separate campaign.

Verification: 241 grouped checks pass, including twelve build/progression groups covering all unique powers, real route effects, area resource/mastery/healing limits, discounted command validation, retaliation and Guard contribution, gear and status synergies, guaranteed trophies without guaranteed essences, earned crafting/stock gates, catch-up caps and durable extraction/loss reports. Typecheck, lint and Android/iOS/web exports pass. Actual UI/device checks and human playtesting remain deferred by the user.

The 200-seed benchmark now prepares earned recipes, faction deliveries, found gear and affordable upgraded equipment through ordinary town actions. It grants no resources and still navigates using visible information. It completes 199 campaigns within twelve expeditions, with zero stalls, first-expedition median Floor 4 and completed-campaign median five expeditions. Mean battle length 6.03 rounds; fallen-character events 1,446; unfed checks 0; median mastery 173.5; loot Continue actions 4,362; binding actions 2,169; story choices 6,905; generic appearances 2,930; repetition violations 0; treatment cost 156,200 gold and 3,558 injured-character recovery days. One campaign remains incomplete at the cap. This comparison includes a stronger preparation policy, so the improvement cannot be attributed entirely to changed powers. Report: `verification/master-m6-campaign.json`.

## Remaining sequence

7. Production art, audio, accessibility, performance and platform verification.

Each milestone requires its own automated, simulation, UI and persistence gate and a reviewable checkpoint. No later milestone is represented as implemented by the critical-fix foundation.
