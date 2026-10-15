# Persistent geography and relative travel

Every floor is a north-up spatial graph with compass connections. A saved world seed generates the same room coordinates and passages on every expedition. Branches grow from a seeded spine; extra edges form real loops without shortening the portal outside its distance band. Distances are 5–8 edges on Floors 1–4, 7–10 on Floors 5–8 and 9–12 on Floors 9–12. Each floor has landmarks, dead ends and exactly one permanent sanctuary.

`journey.maps` stores permanent geography, visited rooms and reports. Keys are floor numbers except routed Floors 5–7, which use `floor:route`. `journey.occupants` is generated independently for each expedition. Monthly resolutions, combat records, forage attempts and unsecured rewards reset on entry. Geography, discoveries and source-attributed route notes remain.

## Directions

`journey.facing` starts north and changes to the heading travelled. Left, Straight, Right and Back are relative to that facing. For example, facing west makes Right north and Back east. The map stays north-up and its current-position arrow shows facing. Looking at a room never turns or moves the party.

Retrace is separate from Back. It follows the actual previous connection stored in `journey.history`, including travel around loops, and turns to the heading travelled. Every move must follow a saved edge. Sanctuary access and retreat also follow real edges.

Route notes contain `from`, `to`, absolute heading, approach facing, source and confidence. Survey reports derive from the saved graph. Room descriptions count real exits and never automatically reveal the correct route.

## Progression

Entry arrival opens exploration. The portal has an elite defender, or a major guardian on Floors 3, 6, 9 and 12. Finding the arch is insufficient: defeat its defender before ascending, and stand in the portal room to use it. Major victories unlock starts on Floors 4, 7 and 10. Earlier checkpoint starts remain selectable. Floor 7 requires a previously discovered route, selected in town.

The fourfold choice remains on Floor 4. If a loop bypasses its marked chamber, the arch presents the choice before its defender. Routed floors have exclusive regular monsters, elites, Floor 6 guardian variants, hazards and essence identities. The Hollow King's crown choice occurs after his defeat.

## Map interface

The Skia canvas uses Gesture Handler for pan, pinch and room selection and Reanimated shared values for continuous transforms. Zoom controls and Recenter provide alternatives. Visited, reported and adjacent unknown rooms have distinct colours. The current marker has an orientation arrow. The map does not disclose hidden occupants. Uncharted room inspections do not reveal structural IDs or unreached exits.

Selecting a room opens an Expo UI inspection sheet. It never moves the party. An adjacent room offers a separate Travel action. The accessible room list and relative direction buttons provide a canvas-independent route through the same data.

## Time and survival

Movement, substantial investigation, foraging and ascent cost one watch. Six watches form a day. Three completed rounds of combat, accumulated across encounters, cost one watch. Daily food consumes one party ration, with no entry or floor ration charge. Supplied rest restores 25% maximum HP/MP and removes 35 exhaustion from standing characters. Unfed days grant no recovery, add 15 exhaustion and remove 10% maximum HP.

Sanctuaries are safe from ambush. Their three-ration cache can be collected once per expedition. Wild camps consume a camping kit; daily interruption risks are 20%, 30% and 40% in the three floor bands. Waiting applies ordinary daily checks and stops for hunger, combat or the return gate. Suitable rooms permit one saved forage attempt: 50% one or two rations, 25% nothing, 25% danger.

The month closes only after the accepted round or decision finishes. A final-watch victory retains its loot receipt before extraction. Defeat loses unsecured rewards and provisional skills. Fallen characters receive an injury on rescue, up to two. Each removes 10% maximum HP and one speed. Three town days heal one injury; treatment costs 100 gold per level. Inn rest restores HP/MP while injury recovery follows its own calendar.
