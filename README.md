# Labyrinth Awaits

A portrait fantasy RPG in TypeScript, React Native, Expo SDK 57 and Expo Router. `mock/onboarding.png` and `mock/gameplay.png` are the visual references.

## Run

Use Node 22.13 or later; Node 24 is recommended.

```powershell
cd "C:\dev\fantasy sim\labyrinth-app"
npm install
npm start
```

Scan the QR code with a compatible Expo Go version. `npm run web` starts the browser version. The current development preview is [localhost:8082](http://localhost:8082).

## Play

- Choose Barbarian, Human, Elf or Dwarf. A human rolls once for a 5% Mage awakening; the result is saved.
- Begin on Day 24 with 2,340 gold, 120 crystals, six rations and three potions. Recruit a party of up to four at the tavern. Conversation reveals strengths and hidden traits and reduces signing prices. Benched companions retain their progress.
- The labyrinth opens every 30 **in-game** days. Guild training costs 60 gold and grants 45 XP per companion; work earns 125 gold and one guild standing; rest restores HP, MP and ailments. Each takes one day. Preparation plans can advance directly to the next opening. Shopping, negotiation and forging consume no days.
- Three shops stock common, fine and rare supplies and equipment. Purchase prices rise 15% on days 27–30 of each cycle. Matching buyers pay more for expedition spoils. The guild buys monster cores. Forge upgrades and elemental refinement remain permanent.
- Entry uses three rations; each new floor uses one. Attack commands the standing party. Select an ally to cast a skill while others attack. Guard is in the Skill menu and halves incoming damage while restoring 8 MP. Items use a turn. Flee returns to town and closes the gate.
- Every floor first opens with an illustrated arrival, three approaches and a written outcome before combat. Floor 1 begins with goblin voices beyond a cave bend, including an original sound cue. Listen to study an enemy, attempt an ambush, rush into an opening exchange, or prepare with supplies where offered. Companions can guarantee some approaches. Choices affect enemy damage, opening hits, interruptions, health, mana and wards, and remain saved between the decision and the fight.
- Skills include poison, paralysis, double strikes, healing, party attack bonuses and elemental wards. Bosses resist some interrupts. Every third enemy turn is a heavy attack. Resistance caps at 75%; antidotes clear ailments and briefly prevent reapplication.
- Every floor has an encounter. Floor 1's stranger is a plunderer; Floor 3 introduces the White Stag clan; Floor 4 offers four routes that change Floors 5–7. Later encounters include shrines, remedies, a toll bridge, a trapped relic, missing scouts, a vault and a merchant before the final king.
- Bosses on Floors 3, 6, 9 and 12 grant permanent skill essences. Learn immediately or save an essence for Party → Skills. Complete guild and clan contracts for rewards. Defeat the Hollow King on Floor 12 and choose an ending.

Progress, including battles, saves locally. More contains sound, haptics, the introduction and a confirmed save reset.

## Visuals

The ten onboarding plates follow the mock's order, copy and illustrated controls. Speech bubbles and demonstration text boxes are generated inside each illustration. Live Next/Skip buttons and pagination remain accessible React Native controls. Plates fill the screen without cropping their embedded text, and slides remain mounted during the animated transition to avoid blank artwork flashes. Reduced motion disables the slide movement.

Town signs and Elise's dialogue, the tavern banner's speech bubble, and the launch logo are also baked into generated artwork. Town signs have native accessible hit targets. Dynamic combat, equipment, resources and choices remain playable native UI. Cormorant Garamond titles and Roboto Condensed body text follow the mock's serif/condensed typography. Generated pixel atlases supply characters, bosses and equipment icons.

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

34 reducer checks cover creation, economy, negotiation, ailments, resistance, preparation, quests, arrivals, encounters, progression and save migration. The playtest runs 16 prepared expeditions across four routes with actual starting resources. Android, iOS and web export succeeds; Expo Doctor passes all 21 checks. Browser checks cover onboarding, town services, story choices, combat and saved progress. Physical device performance still needs verification. Export creates bundles and a static web build, rather than signed APK/IPA releases.

## Files

- `src/game/engine.ts`: rules and reducer; `world.ts`: floors, encounters, items and contracts; `story.ts`: arrival scenes, approaches and outcomes; `provider.tsx`: local persistence.
- `src/screens/`: game screens; `src/app/`: Expo Router routes.
- `src/components/`: shared frames, typography, atlases, controls and combat motion.
- `assets/art/` and `assets/onboarding/`: generated illustrations and transparent atlases.
- `assets/audio/`: original synthesized strike, skill and reward effects.
- `ART-PROMPTS*.json`: image-generation provenance.
- `verification/`: browser screenshot artifacts.

This version contains a local single-player twelve-floor campaign and repeatable preparation cycle. There is no server or real-money purchase flow.
