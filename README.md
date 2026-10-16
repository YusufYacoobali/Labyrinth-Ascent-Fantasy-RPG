# Labyrinth Awaits

## Gameplay redesign

All four gameplay milestones are implemented: rewards and mastery, persistent relative navigation, queued tactical combat and sealed-month survival, then the companion and story deliveries. See [the delivery notes](docs/GAMEPLAY-REDESIGN.md) for current rules and verification.

- Fourteen original species and twelve route variants have their own essence and a registered signature power. Each defeated monster, including bosses, rolls a 30% essence chance. Victory shows a saved receipt with monster cores, optional essence, quest trophies and each character's XP. Trade cores for 55 gold each in town.
- Expedition spoils are unsecured until extraction. Defeat loses those spoils and powers bound from field-found essences; secured belongings, earlier skills and character experience remain.
- Learn in town or shelter. Skills share two equipped slots initially, increasing at levels 3, 6, 9 and 12 to six. Learned powers stay in a library; swap loadouts only in town.
- Meaningful combat use unlocks three mastery ranks at 0, 12 and 40 points. Duplicate essences teach other companions, substitute for materials in four forge recipes, or sell through existing vendors.
- Version-1 development saves are backed up before starting a version-2 campaign. Combat results are saved before animation playback; reload restores the result rather than rerolling.


A portrait fantasy RPG in TypeScript, React Native, Expo SDK 57 and Expo Router. `mock/onboarding.png` and `mock/gameplay.png` are the visual references.

## Run

Use Node 22.13 or later; Node 24 is recommended.

```powershell
cd "C:\dev\fantasy sim\labyrinth-app"
npm install
npm start
```

Scan the QR code with a compatible Expo Go version. `npm run web` starts the browser version. The current development preview is [localhost:8092](http://localhost:8092).

## Play

- Choose Barbarian, Human, Elf or Dwarf. A human rolls once for a 5% Mage awakening; the result is saved.
- Begin on Day 24 with 80 gold, one ration, no crystals and no potions. A chipped shortsword costs 45 gold; one bundle of three rations costs 35. Each race has its own survival-minded opening dialogue. Existing saves retain their wealth and belongings.
- Choose from ten recruits for a party of four. Asking shares range from 10–50%, increasing with specialist skills, experience and smaller party size; trust lowers them. Offers receive personal acceptances or declines with a counteroffer. Keep at least 25% for the player. Conversation reveals strengths, hidden traits and route information. Agreed shares survive benching and are reserved on each expedition gold find, rounded down, then paid on successful extraction; town work, sales and guild rewards are excluded.
- Town companion stories appear in Stormhold. Quiet meals, practice and repairs offer one additional moment per companion per expedition, with visible loyalty gains and shared-meal pair bonds. Completed moments and outcomes survive reloads.
- The labyrinth opens every 30 **in-game** days. Guild training costs 60 gold per day and grants up to 45 XP to companions below the catch-up ceiling: level 2 initially, then highest cleared floor +2. Work earns 125 gold; its Guild standing gain stops at 20, with higher standing earned in expeditions. Rest restores HP, MP and ailments. Preparation plans advance to the next opening; training plans switch to work once everyone reaches the ceiling. Shopping, negotiation and forging consume no days.
- Tempering has three permanent tiers: 2 beast cores/120 gold (+6 ATK/+2 DEF), then Floor 4 and 3 ancient ore/240 gold (+4/+1), then Floor 7 and 5 relic fragments/400 gold (+2/+1). Existing upgrades remain intact.
- Day-consuming town actions ask for confirmation when the gate is open. Inside, the return gate stays sealed for thirty days. Every movement, completed combat round, event decision, shortcut opening and ascent costs one full day. Viewing maps, reading screens and collecting awarded loot use no time. The accepted round or decision finishes before day-thirty extraction.
- Choose a survey, salvage or survivor mission. Explore persistent spatial graphs with loops, branches, landmarks and one sanctuary. Directions are relative to saved facing; the Skia map stays north-up. Pan, zoom, recenter and inspect rooms; travel remains a separate adjacent action. Geography and discoveries persist, while occupants and resolved rewards change each expedition. Portal defenders gate ascent. Guardian victories unlock checkpoint starts on Floors 4, 7 and 10.
- Three shops stock common, fine and rare supplies and equipment. Purchase prices rise 15% on days 27–30 of each cycle. Matching buyers pay more for expedition spoils. The guild buys monster cores. Forge upgrades and elemental refinement remain permanent.
- Species essences, equipment and materials use the existing shops and forge. Four essence recipes supplement ordinary recipes. Torches scout portal defenders, bandages treat one ally, camping kits supply wild camps, and keys open authored treasure. Equipment changes HP/MP capacity, speed, damage, defense and resistance.
- One party ration is consumed per elapsed day. Buy thirty for full coverage. Fed daily rest restores 25% HP/MP and removes 35 exhaustion from standing companions; hunger grants no recovery, adds 15 exhaustion and removes 10% maximum HP. Sanctuary caches replenish between expeditions. Wild camps require a kit and have 20%, 30% or 40% interruption risk. Room foraging and automatic sanctuary checks have been removed; reach sanctuaries through ordinary map passages.
- Arrival opens exploration. At the portal, study the defender and select an approach before combat. Companions can guarantee some approaches. Outcomes and preparation remain saved, including after retreat and re-entry.
- Queue one action per standing, unimpeded companion after reading initiative and every enemy intent; the last choice starts the round. Skills, Guard, Focus, Burst and items consume that actor’s action. Guard protects one ally; Focus restores only the actor’s MP; items select one ally. The combat help explains the controls, and the action log keeps every character’s past actions. Enemy archetypes and guardian phases change their behavior. Break, resistance, statuses and interrupt protection apply individually. Retreat takes enemy responses before following a real passage and preserves remaining enemy HP.
- The twelve principal encounters include the plunderer, White Stag, fourfold route choice, shrines, remedies, a bridge, relic, scouts, vault, merchant and final throne. Routed Floors 5–7 have separate maps and exclusive monster, elite and guardian families.
- Every defeated monster rolls for a species essence. Bind from Party → Skills in town, or from the optional shelter binding panel. Field-found powers become permanent on successful extraction. Complete guild and clan contracts for rewards. Defeat the Hollow King on Floor 12 and choose an ending.

Progress, including battles, saves locally. More contains profile editing, achievements, sound and haptics, local save backup text, contract rewards, the codex, help and a confirmed save reset.

## Visuals

The six onboarding plates stop after Fight for Survival, before Discover Rare Loot. Live Next/Skip buttons and pagination remain accessible React Native controls. Plates preserve their proportions and fit without cropping embedded text; slides remain mounted during the animated transition to avoid blank artwork flashes. Reduced motion disables the slide movement.

Town signs and the tutorial dialogue are baked into generated artwork. Elise appears only in the dismissible town guide; More → Help reopens it. The separate launch screen is removed. Onboarding artwork sits below the top safe area. Town signs have native accessible hit targets. Dynamic combat, equipment, resources and choices remain playable native UI. Cormorant Garamond titles and Roboto Condensed body text follow the mock's serif/condensed typography. Generated pixel atlases supply characters, bosses and equipment icons.

Female character artwork uses opaque clothing with covered chest and shoulders across the town, tavern, portraits, sprites and onboarding. The cover companions also wear full-length leggings. Original source images remain available; the app references the modest variants. Clothing edit prompts and saved asset paths are recorded in `ART-PROMPTS-MODESTY.json` and `ART-PROMPTS-MODESTY-ADDITIONAL.json`.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run playtest
npx expo-doctor
npm run export
```

The regression suites cover economy, rewards, mastery, provenance, relative navigation, 1,200 generated graphs, queued initiative, resource reservations, retreat, guardian phases, daily food, day-per-action timing, injury recovery, all thirty companion stages, twelve floor chains, four faction chains and twenty-four generic encounters. `npm run playtest` simulates 200 seeded repeat-expedition campaigns using discovered connections and player-visible information. Results are written under `verification/`. Physical-device testing was waived by the user. Exports create Android/iOS bundles and a static web build; they are not signed APK/IPA releases.

## Files

- [`docs/FLOOR-MAPS.md`](docs/FLOOR-MAPS.md): plain-English guide to room connections, seeds, persistence, fog and exhaustion.
- `src/game/floor-map.ts`: seeded spatial graphs; `exhaustion.ts`: damage penalties and companion complaints.
- `src/game/engine.ts`: rules and reducer; `world.ts`: floors and encounters; `town-content.ts`: recruit builds, items, recipes and contracts; `story.ts`: arrival scenes; `exploration.ts`: routes, branches, missions and expedition time; `provider.tsx`: persistence and opening-skip confirmation.
- `src/game/stories.ts`: stage eligibility, durable outcomes and relationships; `companion-stories*.ts`, `floor-stories*.ts`, `route-stories.ts`: authored chains; `generic-stories.ts` and `generic-encounters.ts`: saved reusable encounter pools.
- `src/screens/`: game screens; `src/app/`: Expo Router routes.
- `src/components/`: shared frames, typography, atlases, controls and combat motion.
- `assets/story/`: dedicated arrival, encounter and side-room paintings; exact built-in image-generation prompts in `generation-manifest.json`.
- `assets/art/` and `assets/onboarding/`: generated illustrations and transparent atlases.
- `assets/audio/`: original synthesized strike, skill and reward effects.
- `ART-PROMPTS*.json`: image-generation provenance.
- `verification/`: local screenshots, reports and exports, ignored by Git.

This version contains a local single-player twelve-floor campaign and repeatable preparation cycle. There is no server or real-money purchase flow.

The additional six screen mocks guide the tavern, guild, shop, forge, journal and More layouts. `native-chrome.tsx` builds the navbar and ornate panels in code with isolated generated icons. The header and navigation backgrounds cover their safe areas, and native status-bar icons are hidden. Town scene paintings have a welcome fade and gentle ambient motion, respecting reduced motion. Enemy defeats collapse and fade before the next story scene. The portal and quiet expedition-results illustrations are recorded in `assets/art/scene-polish-manifest.json`; `ART-PROMPTS-SCREENS.json` records the town screen assets.

Story screens use dedicated scenery for each arrival and encounter, framed native cards, Cormorant narrative text and transparent generated choice glyphs. The expedition header has health, route knowledge, remaining days and a collapsible Party overview. Exhaustion reduces damage, effective defence and critical chance; companions complain at 50, 75 and 90, with connected shelter or press-on choices. A fed rest removes 35 exhaustion per day.

Exhaustion is individual: the pathfinder, selected attackers, spellcasters, guards and wounded allies accumulate different effort. Tap a portrait in the expedition Party overview to change the pathfinder outside combat; its compass badge marks the leader. Choice buttons retain the earlier mock frames with transparent icons.
