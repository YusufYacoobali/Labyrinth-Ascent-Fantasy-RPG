# Campaign simulation results

Measured from 200 deterministic seeds using the current reducer, ordinary economy and player-visible connections/intents. Six roster configurations cover all eight initially available companions, three- and four-person parties, all four origins and every route. Each run has a twelve-expedition cap.

| Measure | Result |
|---|---:|
| Completed within twelve expeditions | 200/200 |
| Stalled runs | 0 |
| First-expedition median floor | 3 |
| Median expeditions to completion | 6 |
| Fallen-character events (no permanent death) | 2374 |
| Unfed daily checks | 58 |
| Mean completed rounds per victorious battle | 4.86 |
| Median total party mastery | 155 |
| Loot Continue actions | 4997 |
| Optional essence bindings | 1391 |
| Authored story decisions | 5085 |
| Generic encounter appearances | 8252 |
| Repeated named stages | 0 |
| Generic cooldown/repetition violations | 0 |
| Gold spent on injury treatment | 268800 |
| Town recovery character-days | 5751 |

The agreed median targets pass: the first expedition reaches Floors 2–4, and campaign completion takes 5–8 expeditions. These are policy-dependent simulations; physical-device performance and human enjoyment are not established by these numbers. Victory uses one loot Continue action per victorious battle; binding and story conversations are optional.

## Roster comparison

| Companions | Runs completed | First floor median | Campaign median |
|---|---:|---:|---:|
| Kael, Lyria, Bram | 35/35 | 3 | 5 |
| Ragnar, Elowen, Finn | 36/36 | 4.0 | 6.0 |
| Kael, Mira, Elowen | 33/33 | 3 | 8 |
| Sigrun, Lyria, Bram | 32/32 | 3.0 | 5.0 |
| Kael, Lyria | 32/32 | 3.0 | 8.0 |
| Bram, Mira, Finn | 32/32 | 5.0 | 6.0 |

Starvation counts unfed checks encountered by the policy; fallen-character events count characters ending an expedition downed, rather than permanent deaths. Recovery character-days sum injured characters across town days, so three injured companions recovering over one town day count as three. Paid treatment is optional; the policy uses it selectively and otherwise works, trains or rests through recovery. The battle-length measure divides accepted rounds (including retreats) by victorious encounters, so it includes the cost of unsuccessful fights.

The six rosters are fixed for each campaign, while origins, maps, drops, routes and expedition outcomes vary. The policy follows locally available optional quests without forcing detours solely to complete every chain. Dedicated scenario tests cover every companion, floor, route and generic stage independently.

Raw per-seed results are retained in the ignored `verification/campaign-simulation.json`. Reproduce with `npm run playtest`.
