# Labyrinth Ascent — Master Development Roadmap

**Target:** A highly engaging, story-driven fantasy survival RPG with meaningful tactical combat, monster essence collection, unpredictable expeditions and persistent character progression.

**Starting point:** `ui-polish-from-ui-1`, commit `6da6d25`.

## 1. Core design rules

The game should revolve around five connected experiences:

1. **Exploration:** Discover dangerous places, uncover secrets, meet other adventurers and find ways upward.
2. **Survival:** Manage health, exhaustion, food, injuries and the thirty-day expedition window.
3. **Combat:** Understand monsters, prepare strategies, protect companions and exploit weaknesses.
4. **Progression:** Obtain monster essences, develop unique character builds, craft equipment and become stronger.
5. **Living world:** Build relationships, earn reputations and see earlier decisions affect future expeditions.

### Preserve what already works

Keep the portrait React Native/Expo architecture, current manhwa-inspired presentation, individual equipment and XP, recruiting, loot-share contracts, crafting, skill mastery, persistent geography, checkpoints and existing authored stories.

Do not rewrite these systems unnecessarily. Extend and integrate them.

## 2. Priority 0 — Fix existing problems

Before expanding content:

| Problem | Required change |
|---|---|
| Essence binding | The UI currently selects the first species associated with a skill. It must display every owned compatible essence and consume the species the player selects. |
| Monster identity | Stop assigning combat behaviour predominantly from floor and enemy index. Define behaviour by monster species. |
| Duplicate opponents | Multi-enemy encounters currently clone the same base monster. Replace them with authored, mixed-species encounter groups. |
| Combat artwork | The tactical battle stage must display all living enemy sprites simultaneously, not just the currently selected opponent. |
| Repetitive map geometry | The generator heavily favours north/east corridors and always places a similar loop and sanctuary near the entrance. Diversify layouts without losing persistent geography. |
| Generic room narration | Replace repeated descriptions with location-, biome- and encounter-aware narration. |
| Inconsequential relationships | Make bond, hostility and faction standing affect actual gameplay. |
| Town progression balance | Audit repeatable training, forging and economic rewards so players cannot trivialise survival by indefinitely grinding safe town actions. |

Add regression tests for each fix and preserve current saves.

## 3. Monster ecosystem overhaul

This is the highest-impact gameplay improvement.

### Monster data model

Every monster species must define:

- Permanent species ID, name, artwork and floor/biome eligibility.
- Primary element, resistances and meaningful weaknesses.
- Combat role: skirmisher, defender, bruiser, caster, support, assassin or summoner.
- At least three recognisable behaviours: basic, special and defensive/support.
- Attack telegraphs, cooldowns and target-selection rules.
- Optional minions, summon limits and HP-based phase transitions.
- Signature essence, equipment materials, gold and XP rewards.
- Bestiary information progressively discovered through encounters.

All behaviour should be data-driven rather than expanding one giant conditional combat function.

### Element system

| Element | Typical mechanics | Player counterplay |
|---|---|---|
| Physical | Bleeding, armour damage, knockback/stagger | Guarding, defensive gear, interrupts |
| Fire | Burning, escalating heat, explosive attacks | Fire resistance, warding, interrupting charges |
| Frost | Slowing, freeze buildup, movement restrictions | Frost protection, cleansing, breaking control |
| Venom | Poison stacks, lingering damage, toxic hazards | Antidotes, poison immunity, eliminating poison sources |

Retain the existing four damage types initially. Add Arcane or Dark only when they have enough distinct monsters, defensive equipment and abilities to justify separate systems.

### Distinct floor encounters

| Floor | Main enemy identity | Special mechanics |
|---|---|---|
| 1 — Candle Hollows | Goblins · Physical | Scouts call reinforcements; shieldbearers protect weaker goblins |
| 2 — Sunken Road | Bone Roadkeeper · Physical | Skeleton support units, armour and counterattacks |
| 3 — Clan Threshold | Runestone Guardian · Physical | Rune shields, charged stone slams, guardian fragments |
| 4 — Fourfold Gate | Venom Broodmother · Venom | Spiderlings, webs, poison and consuming minions to recover |
| 5 — Echoing Shrine | Echo Revenant · Route-influenced | Illusions, duplicated attacks and changing vulnerabilities |
| 6 — Alchemist's Ruin | Route-dependent guardian | Four substantially different guardian variants, each with unique mechanics |
| 7 — Broken Span | Route elite / Frostfang family | Pack tactics, ambushes, aggressive target switching |
| 8 — Garden of Names | Gravebound Sentinel · Physical | Defensive stances, ancient wards and undead support |
| 9 — Cinder Bastion | Ashen Knight · Fire | Burning strikes, counterattacks, enraged second phase |
| 10 — Starless Vault | Pale Hunter · Frost | Concealment, vulnerable-target attacks, freezing traps |
| 11 — Last Lantern | King's Blade · Physical | Precision attacks, execution marks and royal guards |
| 12 — Hollow Throne | Hollow King · Fire | Multiple phases, summoned knights and a devastating final attack |

These are starting designs, not fixed final numerical balance.

### Route-exclusive ecosystems

Floors 5–7 must feel distinctly different depending on the chosen path.

**Rootway:** Venomous creatures, living roots, regeneration, entanglement and poisonous environmental effects.

**Frostwell:** Wolves, ice spirits, freezing winds, slowed companions and predators using coordinated attacks.

**Cinder Forge:** Animated armour, furnace creatures, overheated equipment, burning zones and defensive enemies.

**Silent Crypt:** Undead, cursed relics, darkness, corpse guardians, resurrection mechanics and magical resource pressure.

Each route needs its own regular species, elite encounters, guardian variant, environmental hazards and collectible essences. Reusing an existing illustration temporarily is acceptable; shipping distinct-looking monsters is the final goal.

### Minion mechanics

Minions must be genuine combatants with individual HP, skills, initiative and targeting.

- Maximum three active enemies on the battlefield initially.
- Summoners have limited reinforcement waves.
- Some minions protect, heal or strengthen their leader.
- Killing a summoner may prevent future reinforcements.
- Bosses can change their behaviour when minions die.
- Summoned monsters must not provide unlimited farming opportunities. Every eligible defeated monster retains an independent 30% essence chance, but summons per encounter are finite and each unique enemy is rewarded only once.

**Acceptance:** Goblins, skeletons, spiderlings and wolves must create observably different fights, even when their numerical stats are similar.

## 4. Tactical combat redesign

Keep the existing one-command-per-companion, speed-based round resolution.

### Strategic mechanics

- **Enemy targeting:** Attack or interrupt a chosen enemy; focus on dangerous support units first.
- **Party formation:** Add simple Front and Back positions. Defensive characters can protect vulnerable casters or healers. Avoid introducing a complicated tactical grid.
- **Threat and protection:** Some enemies target injured, exposed or weakened companions. Guards and taunts provide counters.
- **Telegraphed attacks:** Display which enemy will attack, the intended target and the nature of the threat before command confirmation.
- **Special abilities:** Summoning, poisoning, shielding, healing, enraging, weakening, retaliation and charging.
- **Boss phases:** Major guardians change their move sets at HP thresholds, not merely their damage values.
- **Status effects:** Define exact stacking limits, duration, cleansing and immunity behaviour for every ailment.
- **Enemy variety:** A group containing a defender, assassin and healer must play differently from three bruisers.

Every major enemy attack should have an understandable counter. Avoid unavoidable deaths caused by completely hidden mechanics.

### Example: Venom Broodmother

1. The Broodmother opens with poison spray.
2. At 75% HP, it summons two spiderlings.
3. Spiderlings attack weakened companions and intensify poison pressure.
4. At 50% HP, it can consume a surviving spiderling to heal.
5. At 25% HP, it prepares a devastating venom storm.
6. Players may interrupt the storm through guard-break, eliminate the spiderlings or use defensive abilities to survive.

This makes the boss memorable through decisions rather than a large health bar.

### Make combat fast to operate

The current combat queue should gain:

- **Repeat Last Commands** for routine rounds.
- **Quick Attack** to fill available companion commands.
- A fast-animation option and Skip Round Playback.
- Automatic resolution for safely outlevelled encounters, with no bonus rewards.
- Clear selected targets, status icons and damage previews.
- An actual multi-enemy battle scene with distinct positions and animations.

Keep difficult boss encounters fully strategic. Ordinary battles should not require excessive menu interactions.

## 5. Monster essences and character development

Keep the independently rolled **30% essence chance per defeated monster**, including major guardians.

### Make every essence interesting

Each species retains a unique essence identity. Its associated power must produce a meaningful combat difference.

Avoid giving several monsters the exact same unmodified skill merely because they share an element. Where skills share a family, provide distinct essence-specific effects.

Examples:

- Goblin essence: a fast follow-up strike with a chance to interrupt.
- Runestone essence: defensive protection that strengthens while guarding.
- Broodmother essence: stacking venom that becomes stronger against poisoned targets.
- Frostfang essence: a finishing strike that gains power against slowed enemies.
- Ashen Knight essence: fire retaliation when attacked.
- Hollow King essence: an expensive, powerful area attack.

### Preserve existing progression

Keep individual levels, XP, equipment slots, learned skill libraries, equipped skill limits and mastery ranks.

Improve their interaction:

- Equipment should complement a character's chosen essence abilities.
- Certain essences should create synergies without becoming mandatory.
- Specialised builds must have advantages and disadvantages.
- Party composition should matter more than simply maximising attack.
- Duplicate essences may teach another companion, replace crafting materials or be sold.

Newly obtained essence powers remain provisional until successful extraction, as currently implemented.

### Make crafting more rewarding

Use monster-specific materials for equipment progression:

- Goblin trophies for lightweight early gear.
- Runestone fragments for durable defensive equipment.
- Venom materials for poison-resistant armour.
- Frost materials for specialised weapons or charms.
- Rare guardian materials for powerful upgrades.

Avoid unlimited stat-only forging. Introduce meaningful upgrade tiers, diminishing returns and special material requirements.

Major guardians should also grant reliable campaign progress independent of the 30% essence roll, so unlucky players never become progression-locked.

## 6. Labyrinth exploration and maps

The existing saved-world geography and changing monthly occupants are the right foundation.

### Improve geography

Generate floors with varied spatial layouts, multiple routes, dead ends, loops, shortcuts, dangerous branches, landmarks and a permanent sanctuary.

- Keep discovered walls, passages and major landmarks consistent between expeditions.
- Vary the placement and layout of permanent sanctuaries by floor.
- Ensure shortest paths fit the intended difficulty bands.
- Prevent every floor from sharing the same entrance pattern.
- Maintain correct compass directions, facing, retracing and fog-of-war behaviour.
- Introduce locked shortcuts that become available through quests, items or previous exploration.

Players should gradually master the geography, but not the exact encounters.

### Procedural encounter director

An encounter director should use the current floor, biome, party status, expedition number, story history, faction standing and remaining expedition time to select appropriate encounters.

Generate content once when establishing an expedition, preserving outcomes and room occupants when backtracking or reloading.

Possible encounters include:

- Monsters, elites, ambushes and patrols.
- Wandering adventurers and rival parties.
- Treasure, traps and rare equipment discoveries.
- Injured survivors, merchants and lost explorers.
- Camps, secret passages and environmental puzzles.
- Unusual signs that lead to later story events.

Use weighted encounter pools and cooldowns instead of giving every chamber an equally likely generic event.

Some rooms should be genuinely quiet to build atmosphere and prevent constant interruptions.

### Map visual redesign

Build on the existing Skia map rather than replacing its underlying navigation rules.

Add:

- Expandable full-screen map mode.
- Environment-themed floors, room silhouettes and passage styles.
- Recognisable portal, sanctuary, danger, mystery and landmark symbols.
- Discovered-versus-rumoured information distinctions.
- Visual indication of the route the player actually travelled.
- Current party position, facing and selected destination.
- Better zoom/recenter behaviour on small screens.
- Accessible text-based room and direction controls.

Avoid revealing hidden monsters or treasures through map icons before players discover them.

### Reduce unnecessary travel interactions

Once a safe route has been explored, allow quick travel along known connected passages. Apply the real watch costs and stop if a new encounter, hazard or story event interrupts travel.

Never teleport players through undiscovered passages.

## 7. Storytelling — make expeditions feel like adventures

The current ten companion chains, twelve floor chains, four route chains and 24 generic encounters are a strong content base.

Do not immediately double their quantity. Improve how existing stories react to the world.

### Better story presentation

Important scenes should follow:

**Discovery → investigation → choice → immediate consequence → later consequence.**

Use multiple illustrated stages for major discoveries, battles and emotionally important decisions. Routine travel should remain much faster.

Story text should account for:

- Who is in the party and who is currently injured.
- Previously discovered locations and clues.
- Available skills, race-specific knowledge and equipment.
- Previous interactions with named NPCs.
- Faction relationships and player decisions.
- Whether an event has already been completed.

### Persistent NPCs and rival adventurers

Introduce a small cast of recurring named explorers and rival parties.

They may appear in different locations on later monthly expeditions, remember earlier encounters, become allies, request help, compete over treasure or develop rivalries.

Avoid repeatedly spawning the same generic adventuring team in the same location.

Their locations may change between expeditions, but should remain consistent within an expedition.

### Companion relationships

Build on existing loyalty and pair-relationship systems.

Bonded companions could unlock defensive support, paired dialogue or cooperation during dangerous choices. Hostile companions may disagree with risky decisions, refuse optional cooperation or require reconciliation.

Personal quests must influence the world and provide a meaningful reward, not simply advance a counter.

Reconciliation should be a short authored conversation or meaningful action, rather than a free button that instantly eliminates relationship problems.

### Factions and route consequences

Guild, White Stag and route-faction standing should affect tangible opportunities:

- Exclusive contracts and equipment.
- Better information or route assistance.
- Merchant prices and supply access.
- Named allies appearing in later encounters.
- Different resolutions to recurring rival-party disputes.

Consequences should remain visible in the journal and future dialogue.

## 8. Survival, town and campaign progression

Keep the thirty-day labyrinth opening and current checkpoints.

### Make survival strategic

The player must weigh:

- Continuing upward versus exploring optional chambers.
- Spending supplies now versus saving them for later.
- Resting in a known sanctuary versus risking a wild camp.
- Helping another team versus protecting their own party.
- Retreating from a dangerous encounter versus risking injuries and unsecured loot.

Every risk should have understandable stakes.

### Make town preparation meaningful

After extraction, provide one clear expedition report showing:

- Highest floor reached and new maps discovered.
- Monsters defeated and essences recovered.
- Character levels, mastery and equipment improvements.
- Injuries, companion loyalty changes and relationship events.
- Completed quests, faction changes and unresolved leads.
- Recommended preparations for the next expedition.

Let the player prepare equipment, treat injuries, train, negotiate, craft and select a checkpoint without tedious repetition.

Training should help weaker characters catch up, but should not completely replace the value of combat and expedition experience.

### Long-term progression

Retain the twelve-floor campaign as the primary goal, targeting approximately five to eight expeditions for a reasonably prepared player.

After completion, offer optional goals such as discovering alternate routes, completing unfinished personal quests, hunting rare essences and attempting challenge expeditions.

Do not build a huge postgame before the main campaign is polished.

## 9. Art, animations and mobile interface

Use the existing manhwa-inspired narrative artwork and pixel character combat style consistently.

### Combat visuals

Render all enemies and their minions on the battlefield at once, with distinct positioning.

Give species recognisable silhouettes, attack effects, hit reactions, status effects and death animations. Boss phase transitions should feel dramatic.

### Exploration visuals

Use environment-appropriate illustrations rather than repeatedly presenting the same corridor image. Change backgrounds, effects and character expressions for major story moments.

Add small details such as environmental movement, changing torchlight, portal glow and monster-specific sound effects.

### Information hierarchy

Keep essential information easy to access:

- Current floor and remaining days.
- Party HP, MP, exhaustion and injuries.
- Important active statuses.
- Current encounter or navigation objective.
- Nearby passages and map controls.

Avoid showing the same party information in several competing areas of the screen.

Maintain readable layouts on smaller phones, accessible controls, reduced-motion support and fast screen transitions.

## 10. Implementation roadmap

Implement in isolated, playable milestones rather than one enormous refactor.

| Order | Milestone | Completion requirement |
|---|---|---|
| **0 — Critical fixes** | Essence selection, existing logic issues and save integrity | Previously working progression remains intact; regression tests pass |
| **1 — Floor 1 vertical slice** | Fully redesigned goblin ecosystem, varied AI, minions, group combat visuals and signature essences | The first floor provides strategically different encounters and a satisfying loot/progression loop |
| **2 — Combat framework** | Data-driven attacks, mixed enemy groups, elemental statuses, boss phases, formations and streamlined commands | All encounter types resolve reliably, with correct telegraphs, rewards and reload behaviour |
| **3 — Monster ecosystems** | Distinct monsters and bosses across the other floors and all four routes | Each floor/route presents identifiable tactics, artwork and collectible abilities |
| **4 — Exploration** | Better map generation, visuals, encounter selection, secrets, NPC movement and safe backtracking | Repeat expeditions preserve geography but produce meaningfully different experiences |
| **5 — Story/world consequences** | Stronger companion interactions, rivals, conditional stories and faction rewards | Important choices visibly change future events and opportunities |
| **6 — Progression/economy** | Equipment synergy, crafting tiers, town balance, expedition reports and postgame goals | Powerful builds feel earned without trivialising the campaign |
| **7 — Production polish** | Art consistency, animations, audio, accessibility, performance and real-device testing | The entire twelve-floor campaign works smoothly from a fresh install |

At the end of each milestone:

1. Run typecheck, lint and relevant automated tests.
2. Run deterministic gameplay simulations and check the measured results.
3. Verify the actual UI on small and large screens.
4. Test saving, quitting and resuming during the affected gameplay.
5. Update the gameplay documentation and commit a playable checkpoint.
6. Do not proceed if the milestone introduces severe progression or state-integrity bugs.

## 11. Quality assurance and playtesting

### Automated verification

Retain and extend the existing testing infrastructure.

- At least 1,000 generated maps across varied seeds and routes, checking reachability, fog, coordinates and reciprocal connections.
- At least 100,000 simulated essence rolls confirming approximately 30% independent drops.
- Combat tests for mixed species, minions, status stacking, phase transitions, targeting, retreat and boss mechanics.
- Tests proving rewards cannot be claimed repeatedly or regenerated through loading.
- Tests for unsecured essences, equipment, injuries and character progression after defeat.
- Repeated-expedition tests for changing encounters and stable permanent geography.
- Save compatibility tests for the existing version-2 campaign format and any new versions.

### Balance targets

Use the existing 200-seed campaign simulations as a regression benchmark, not proof that the game is fun.

**Initial design targets:**

| Metric | Desired outcome |
|---|---|
| Typical first expedition | Reaches Floors 2–4 |
| Median campaign completion | Approximately 5–8 expeditions |
| Normal combat | Usually resolved within a small number of meaningful rounds |
| Boss combat | Longer, with several tactical decisions and distinct phases |
| Essence drops | 30% independently per eligible defeated monster |
| Encounter variety | No unavoidable identical sequence across successive expeditions |
| Progression | Different viable party combinations; no single mandatory essence build |
| Difficulty | Poor preparation should matter, but losing should not permanently trap progression |
| Save stability | No duplicate rewards, lost completed actions or broken interrupted expeditions |

Rebalance numerical values using actual results rather than simply increasing HP or attack whenever the game seems too easy.

### Human playtesting

After the mechanical systems stabilise, run complete playthroughs as:

- A completely new player with no knowledge of the labyrinth.
- A player focused on tactical combat.
- A player focused on exploration and story.
- A player with weak equipment or an incomplete party.
- An experienced player returning for a second and third expedition.

Record where players become confused, skip dialogue, repeat actions unnecessarily, feel cheated by enemies or lose interest.

Test the complete campaign on physical Android and iOS devices. Pay particular attention to Skia map gestures, multi-enemy animation, saving large game states and combat command usability.

## 12. Release-quality principles

**Do not sacrifice these to add more features:**

- Players must understand why they succeeded or failed.
- Every monster should have something distinctive to learn and counter.
- Every important reward should make the player feel stronger or more capable.
- Randomness must create interesting uncertainty, not invalidate decisions.
- Character death or defeat should matter without making recovery miserable.
- Story choices must have visible consequences.
- Previously discovered knowledge must remain useful.
- Repeated expeditions must offer new experiences.
- Routine actions must be fast; major decisions deserve attention.
- Maintain an original fantasy setting, characters, visuals and story rather than reproducing another work's protected content.

**Final acceptance criterion:** A player should be able to finish one expedition, return to town with meaningful discoveries, improve their party and immediately have an interesting reason to begin the next expedition. The second expedition should feel familiar enough to reward what they learned, but different enough to surprise them.