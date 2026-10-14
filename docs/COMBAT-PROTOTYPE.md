# Pixel combat

Every fight uses React Native Skia 2.6.2 (the Expo SDK 57 version) and Reanimated 4.5.1. There are 25 transparent animation sheets: 11 player identities, 12 distinct floor enemies, the Plunderer and the Bonegnaw Scavenger. The player identities cover all four origins, the Human Mage variation and all ten recruits. Origins and recruits that already share an identity reuse its sheet: Kael/Human Knight, Ragnar/Barbarian, Lyria/Elf and Bram/Dwarf.

Select a companion by tapping their figure or the small HP/MP panel above them. The blue ring and blue panel mark the selected figure. Red panel borders identify incoming targets. The duplicate card row beneath the battlefield has been removed. Two ranks keep four panels readable without overlapping one another, and panels follow their figures during lunges and recoil. Names, HP, MP and ailment badges remain code-rendered UI. Choose Attack, Skill, Guard, Focus, Item or Burst with the existing buttons; these still use the real character's MP, cooldowns and inventory. First-play guidance uses the same selection instructions.

Open Settings → Try pixel combat, More → Help → Try pixel combat, or the /combat-trial route. **Choose party & enemy** opens a native Expo UI sheet with four member pickers and all fourteen enemies. It includes locked recruits and the Human Mage so every animation can be previewed. Trial members are prepared to a level appropriate for the selected floor. The provider is memory-only: restarting, changing the roster or fighting cannot write to the saved journey. Leave trial restores the campaign route. Very short screens scroll to keep every command reachable.

The visual timeline runs once for each accepted command. Melee characters approach, strike and return; archers and casters release projectiles while staying in formation. Second Wind produces restorative rings around the party. Golems use grounded shockwaves and enemy casters send spells to the actual targets. Source poses supply cape, hair and weapon follow-through. Recoil, camera shake, projectile travel and impact particles run on the UI clock.

Party members act one at a time: the selected member leads, then each eligible support takes a turn in party order. Each move lasts 900 ms with a 70 ms pause before the next. Melee characters return to formation before the next character moves; ranged characters fire from their own positions. Enemy HP, recoil, particles, camera shake and floating damage update at each individual contact (440 ms into a melee move, 600 ms into a ranged move). Damage amounts come directly from the resolver's per-member contributions, without changing totals or critical rolls. Healing happens on the caster's contact; venom ticks after the last move. The enemy begins its response only after the party finishes, and party HP updates when that response lands. A killing blow cancels remaining visual attacks and plays the creature's collapse before Victory. Commands and selection are locked during the sequence. The reducer rolls once; that exact action commits when its animation finishes, with timers cleared if the scene unmounts. Commands also wait for the battlefield images to decode.

Monsters face left toward the party. The original Bone Roadkeeper and Echo Revenant sheets face right, so their pixels are mirrored around the moving figure centre. Shadows, travel coordinates and health UI are unaffected. Other sheets were authored facing left. Floor identity is selected by the actual floor rather than reused legacy atlas indices; route element changes cannot accidentally turn a revenant into a skeleton. Side fights keep their own creature identity.

Each transparent sheet has eight columns and six rows:

| Row | Animation | Frames used |
| --- | --- | --- |
| 0 | Idle / breathing | 6 |
| 1 | Walk / run | 8 |
| 2 | Weapon attack | 8 |
| 3 | Taking damage | 4 |
| 4 | Death | 8 |
| 5 | Special ability | 8 |

The sprite source rectangle, position, particles and camera shake are driven by Reanimated worklets. Skia Atlas draws the decoded sheet with nearest-neighbour sampling; there is no React render for each animation frame. Shadows stay under moving feet. Some generated release cells contain only a spell or projectile. The frame map holds the preceding character pose for those cells, while code draws the moving projectile, preventing disappearing bodies. Originals are preserved. This is simulated motion rather than a physics engine.

Reduced motion keeps characters still and shortens the sequence to 280 milliseconds. The game rules and saved progression do not change. Floor layouts and all timing outside combat remain the same.

On web, CanvasKit loads only when a fight needs it. Its WASM binary is served from the app's own public folder, so no runtime CDN is needed. Postinstall refreshes the matching file after dependency installation. Metro registers literal asset paths; the canvas decodes only the current combatants. Native device performance and haptic timing remain phone checks; browser previews and exported bundles do not establish a device frame-rate measurement.

Checkpoint: commit 0e6770c, tag checkpoint-ui-1. Visual experiments live on ui-polish-from-ui-1.

Exact built-in image-generation prompts, layouts, references and original source paths are recorded in assets/combat/generation-manifest.json (four approved sample sheets) and assets/combat/rollout-generation-manifest.json (21 additional sheets). Runtime mappings are in src/game/combat-visuals.ts and src/components/combat-sheets.ts. Layout and animation checks cover the entire roster, all floor/side enemies, role-specific movement, contact timing, deaths, reduced motion and non-overlapping overhead panels. The English explanation of the persistent room graph is in docs/FLOOR-MAPS.md.
