# How the labyrinth map works

Think of a floor as rooms joined by passages. It is a graph: a room is a **node**, and a passage between two rooms is an **edge**. The map contains actual room IDs and connections. It does not decide your position from a turn counter.

## Walking a floor

Each floor starts with its guardian story and fight. Once the guardian and its story are resolved, you pass through the cleared chamber to the first crossing. Six crossings lead to the upward portal. One template's main route is:

**Left → Right → Straight → Right → Left → Straight into the Portal.**

Left, Right and Straight are the named passages at the room you are standing in. They are not north, south, east and west. **Back** retraces the connection into the previous room on that passage. A right turn after a left turn therefore does not automatically undo the left turn.

Each crossing also has side passages. They lead to treasure, other adventurers, springs, monsters, trapped compartments or dead ends. Some side rooms contain another connected chamber. Two side passages connect to make a loop, so a floor is not just one line with decorative branches. A wrong turn still visits a real room. You can retrace it, explore its other exits or encounter another team.

Find shelter takes the party through a separate connection into an adjoining watch room. Leaving shelter follows its Back connection to the room you left, with the same encounter and enemy health. Resting, attacking and searching are actions **inside** a room; they do not move you unless the choice says you return to the crossing or take a passage. Search-and-return choices resolve the room and follow its Back connection. In a side-room chain, Back can lead to another side room rather than the main crossing.

You may ascend only while physically standing in the portal room. Discovering the portal once does not allow you to ascend from another room. The return gate to town stays sealed until the expedition's 30 days are over.

## Generating and remembering a floor

`src/game/floor-map.ts` generates each floor from a character's saved seed and one of twelve route templates. A small seeded random generator chooses the template, side-room contents and loop. The same seed and floor produce the same connections. Different characters can have different layouts.

The generated graph is stored in `journey.maps[floor]`, including every room's type, display position and named exits. The character's current location is `journey.room`. `journey.history` remembers the incoming path, so Back retraces your actual approach even across a loop. This graph, the seed and explored rooms are saved with the game. Reloading or starting another expedition keeps the layout. A new expedition resets its search/reward flags and current location, so you must walk the floor again; it does not regenerate the floor.

Old saves receive a graph on migration. Existing route knowledge is retained as reported main-route rooms, including floors other than your current one. Old transient side-passage counters return to their crossing, so the saved character never occupies a nonexistent room.

## Revealing the map

Entering a room adds its ID to `explored`. The map draws explored rooms and their immediate connections. Unentered adjacent rooms appear as **?**; their contents remain hidden. Rooms beyond that frontier are absent. Town rumours and survey teams add reported rooms to `known` without falsely marking them explored. Blue rooms are charted, gold is your present position, triangles are shelter and the tower symbol is the portal.

The small six-dot header shows route knowledge. It is a progress display; movement still follows room connections. The larger floor map shows side rooms and loops.

Each searched side room has a per-expedition resolved flag. Re-entering it cannot award the same treasure or team meeting twice. Leaving without searching does not consume the encounter.

## Time, exhaustion and complaints

Six travel watches equal a day; the gate opens after 180 watches. Each member has their own exhaustion. On travel, the pathfinder gains 2 and other standing members gain 1. A specialist taking a story approach bears more effort than the companions following them. Living members deal up to 30% less damage at full exhaustion, have up to 15% less effective defence and fewer critical hits. Their base equipment and character stats remain intact.

Companions complain at 50, 75 and 90 exhaustion. Each threshold is used once until the member recovers below 35. You can take the adjoining shelter connection or ask them to press on, which adds 4 exhaustion. Complaints preserve the interrupted story phase. A fed day of shelter rest removes 35 exhaustion; foraging without a ration removes 18. Rest cannot revive a fallen member. Open the Party button to see each member's health and exhaustion; press it again to hide the overview.

Tap a portrait in the Party overview to select the pathfinder outside combat; the compass badge marks who leads. The choice persists across rooms and floors. During combat, the selected attacker tires more than supporting attackers. Casting Arcane Bolt or Second Wind is more tiring than an ordinary strike. A guard bears the effort of defending while other members conserve their strength. The character focusing on mana does not gain fatigue from that focus, while the others still tire from their supporting attacks. Handling an item tires its user; taking an enemy hit adds strain to its target. Invalid actions and fallen members gain no exhaustion. This lets you rotate scouting, casting and defensive work instead of every member receiving the same fatigue.
