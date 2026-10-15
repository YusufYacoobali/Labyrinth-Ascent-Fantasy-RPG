# Labyrinth Awaits

## Gameplay redesign

All four gameplay milestones are implemented: rewards and mastery, persistent relative navigation, queued tactical combat and sealed-month survival, then the companion and story deliveries. See [the delivery notes](docs/GAMEPLAY-REDESIGN.md) for current rules and verification.

- Fourteen original species and twelve route variants have their own essence and a registered signature power. Each defeated monster, including bosses, rolls a 30% essence chance. Victory shows one saved receipt with gold, held companion shares, items and each character's XP.
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
- Begin on Day 24 with 2,340 gold, 120 crystals, six rations and three potions. Choose from ten recruits for a party of four. Negotiate each companion’s percentage of expedition gold, rather than a signing fee. Conversation reveals strengths, hidden traits and route information. Agreed shares survive benching and are reserved on each gold find, rounded down, then paid on successful extraction; town work, sales and guild rewards are excluded.
- The labyrinth opens every 30 **in-game** days. Guild training costs 60 gold and grants 45 XP per companion; work earns 125 gold and one guild standing; rest restores HP, MP and ailments. Each takes one day. Preparation plans can advance directly to the next opening. Shopping, negotiation and forging consume no days.
- Day-consuming town actions ask for confirmation when the gate is open. Inside, the return gate stays sealed for thirty days. Six watches make a day; three combat rounds make a watch. Movement, substantial investigations, foraging and ascent cost one watch. The accepted round or decision finishes before day-thirty extraction.
- Choose a survey, salvage or survivor mission. Explore persistent spatial graphs with loops, branches, landmarks and one sanctuary. Directions are relative to saved facing; the Skia map stays north-up. Pan, zoom, recenter and inspect rooms; travel remains a separate adjacent action. Geography and discoveries persist, while occupants and resolved rewards change each expedition. Portal defenders gate ascent. Guardian victories unlock checkpoint starts on Floors 4, 7 and 10.
- Three shops stock common, fine and rare supplies and equipment. Purchase prices rise 15% on days 27–30 of each cycle. Matching buyers pay more for expedition spoils. The guild buys monster cores. Forge upgrades and elemental refinement remain permanent.
- Species essences, equipment and materials use the existing shops and forge. Four essence recipes supplement ordinary recipes. Torches scout portal defenders, bandages treat one ally, camping kits supply wild camps, and keys open authored treasure. Equipment changes HP/MP capacity, speed, damage, defense and resistance.
- One party ration is consumed per elapsed day. Buy thirty for full coverage. Fed daily rest restores 25% HP/MP and removes 35 exhaustion from standing companions; hunger grants no recovery, adds 15 exhaustion and removes 10% maximum HP. Sanctuary caches replenish between expeditions. Wild camps require a kit and have 20%, 30% or 40% interruption risk. Suitable rooms offer one saved forage attempt.
- Arrival opens exploration. At the portal, study the defender and select an approach before combat. Companions can guarantee some approaches. Outcomes and preparation remain saved, including after retreat and re-entry.
- Queue one action per standing, unimpeded companion and confirm the round after reading initiative and every enemy intent. Skills, Guard, Focus, Burst and items consume that actor’s action. Guard protects one ally; Focus restores only the actor’s MP; items select one ally. Enemy archetypes and guardian phases change their behavior. Break, resistance, statuses and interrupt protection apply individually. Retreat takes enemy responses before following a real passage and preserves remaining enemy HP.
- The twelve principal encounters include the plunderer, White Stag, fourfold route choice, shrines, remedies, a bridge, relic, scouts, vault, merchant and final throne. Routed Floors 5–7 have separate maps and exclusive monster, elite and guardian families.
- Every defeated monster rolls for a species essence. Bind from Party → Skills in town, or from the optional shelter binding panel. Field-found powers become permanent on successful extraction. Complete guild and clan contracts for rewards. Defeat the Hollow King on Floor 12 and choose an ending.

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

The regression suites cover economy, rewards, mastery, provenance, relative navigation, 1,200 generated graphs, queued initiative, resource reservations, retreat, guardian phases, daily food, foraging, injury recovery, all thirty companion stages, twelve floor chains, four faction chains and twenty-four generic encounters. `npm run playtest` simulates 200 seeded repeat-expedition campaigns using discovered connections and player-visible information. Results are written under `verification/`. Physical-device testing was waived by the user. Exports create Android/iOS bundles and a static web build; they are not signed APK/IPA releases.

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
