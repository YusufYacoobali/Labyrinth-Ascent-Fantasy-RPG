# Labyrinth Awaits

A portrait fantasy RPG in TypeScript, React Native, Expo SDK 57 and Expo Router. `mock/onboarding.png` and `mock/gameplay.png` are the visual references.

## Run

Use Node 22.13 or later; Node 24 is recommended.

```powershell
cd "C:\dev\fantasy sim\labyrinth-app"
npm install
npm start
```

Scan the QR code with a compatible Expo Go version. `npm run web` starts the browser version. The current development preview is [localhost:8083](http://localhost:8083).

## Play

- Choose Barbarian, Human, Elf or Dwarf. A human rolls once for a 5% Mage awakening; the result is saved.
- Begin on Day 24 with 2,340 gold, 120 crystals, six rations and three potions. Choose from ten recruits for a party of four. Negotiate each companion’s percentage of expedition gold, rather than a signing fee. Conversation reveals strengths, hidden traits and route information. Agreed shares survive benching and are paid on each gold find, rounded down; town work, sales and guild rewards are excluded.
- The labyrinth opens every 30 **in-game** days. Guild training costs 60 gold and grants 45 XP per companion; work earns 125 gold and one guild standing; rest restores HP, MP and ailments. Each takes one day. Preparation plans can advance directly to the next opening. Shopping, negotiation and forging consume no days.
- Day-consuming town actions ask for confirmation when the gate is open. Once inside, the return gate stays shut for thirty days. Six travel watches make one day; resolved approaches, fights, events and ascents also consume watches. Safe shelter restores standing allies and can count down to the return gate, including when food runs out. Fallen companions remain fallen until an inn rest after returning.
- Choose a survey, salvage or survivor mission at entry. Each floor is a seeded, saved graph of connected story rooms, with a six-turn main route, optional chambers, loops, traps and adjacent shelters. Follow clues, chart turns, backtrack and search branches for caches, edible roots, other teams or optional fights. Ascending requires standing in the discovered portal room. New expeditions traverse the same routes; discovered charts remain saved. Town rumours and recruits reveal only particular floors and route marks.
- Three shops stock common, fine and rare supplies and equipment. Purchase prices rise 15% on days 27–30 of each cycle. Matching buyers pay more for expedition spoils. The guild buys monster cores. Forge upgrades and elemental refinement remain permanent.
- The item catalog contains 37 entries; ten crafting recipes consume real materials and gold. Nine contracts track kills, floors, deliveries, unique recruits, training and crafting. Torches, bandages, camp kits and labyrinth keys have distinct field uses. Equipment can change HP/MP capacity, speed, damage, defense and elemental resistance.
- Entry uses three rations; each new floor uses one. Attack commands the standing party. Select an ally to cast a skill while others attack. Guard halves incoming damage, redirects a single hit to the selected tank, restores 4 party MP and earns momentum. Focus restores 20 MP to the selected ally while others strike at 55%. Burst costs two momentum for +35% party damage and 50 guard-break damage. Items use a turn. Flee returns to town and closes the gate.
- Every floor first opens with an illustrated arrival, three approaches and a written outcome before combat. Floor 1 begins with goblin voices beyond a cave bend, including an original sound cue. Listen to study an enemy, attempt an ambush, rush into an opening exchange, or prepare with supplies where offered. Companions can guarantee some approaches. Choices affect enemy damage, opening hits, interruptions, health, mana and wards, and remain saved between the decision and the fight.
- Skills include poison, paralysis, double strikes, healing, party attack bonuses and elemental wards. Bosses resist some interrupts. Enemies cycle through strike, charge, heavy attack and recovery. Their next targets and estimated damage are visible. Breaking their guard interrupts attacks and opens a +30% damage window; a temporary interrupt ward prevents repeated stun locks. Active skills have cooldowns. Resistance caps at 75%; antidotes clear ailments and briefly prevent reapplication.
- Every floor has an encounter. Floor 1's stranger is a plunderer; Floor 3 introduces the White Stag clan; Floor 4 offers four routes that change Floors 5–7. Later encounters include shrines, remedies, a toll bridge, a trapped relic, missing scouts, a vault and a merchant before the final king.
- Bosses on Floors 3, 6, 9 and 12 grant permanent skill essences. Learn immediately or save an essence for Party → Skills. Complete guild and clan contracts for rewards. Defeat the Hollow King on Floor 12 and choose an ending.

Progress, including battles, saves locally. More contains profile editing, achievements, sound and haptics, local save backup text, contract rewards, the codex, help and a confirmed save reset.

## Visuals

The ten onboarding plates follow the mock's order, copy and illustrated controls. Speech bubbles and demonstration text boxes are generated inside each illustration. Live Next/Skip buttons and pagination remain accessible React Native controls. Plates fill the screen without cropping their embedded text, and slides remain mounted during the animated transition to avoid blank artwork flashes. Reduced motion disables the slide movement.

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

102 checks cover creation, economy, percentage contracts, ailments, resistance, preparation, crafting, quests, arrivals, encounters, connected maps, fog, exhaustion and complaints, the thirty-day expedition window and save migration. `npm run playtest` runs 16 prepared expeditions across the four campaign routes with actual starting resources and traverses every required portal route. Browser checks cover town services, real crafting/equipping, the skip-opening prompt, missions, story choices, combat and saved progress. Physical device performance still needs verification. Export creates Android/iOS bundles and a static web build, rather than signed APK/IPA releases.

## Files

- [`docs/FLOOR-MAPS.md`](docs/FLOOR-MAPS.md): plain-English guide to room connections, seeds, persistence, fog and exhaustion.
- `src/game/floor-map.ts`: seeded graph templates; `exhaustion.ts`: damage penalties and companion complaints.
- `src/game/engine.ts`: rules and reducer; `world.ts`: floors and encounters; `town-content.ts`: recruit builds, items, recipes and contracts; `story.ts`: arrival scenes; `exploration.ts`: routes, branches, missions and expedition time; `provider.tsx`: persistence and opening-skip confirmation.
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
