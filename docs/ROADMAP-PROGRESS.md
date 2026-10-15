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

## Remaining sequence

2. Combat framework: authored moves, elemental statuses, formation/protection, phases and faster command entry.
3. Remaining floor and route ecosystems.
4. Exploration director, map presentation, shortcuts, persistent NPC placement and known-route travel.
5. Conditional stories, rivals, authored reconciliation and tangible faction opportunities.
6. Build/equipment synergy, crafting progression, extraction reports and modest optional goals.
7. Production art, audio, accessibility, performance and platform verification.

Each milestone requires its own automated, simulation, UI and persistence gate and a reviewable checkpoint. No later milestone is represented as implemented by the critical-fix foundation.
