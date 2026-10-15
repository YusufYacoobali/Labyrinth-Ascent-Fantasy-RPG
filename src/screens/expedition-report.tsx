import React from "react";
import { Redirect, router } from "expo-router";
import { Frame, Panel, Copy, Button } from "@/components/game-ui";
import { useGame } from "@/game/provider";
import { MONSTERS } from "@/game/monsters";
import { ITEMS } from "@/game/world";
import { optionalGoals } from "@/game/expedition-report";
import { Guard } from "./town";
export function ExpeditionReportScreen() {
  const { state, dispatch } = useGame(),
    r = state.lastReport;
  if (!r) return <Redirect href="/town" />;
  return (
    <Guard>
      <Frame title={`Expedition ${r.number} report`} hideNav>
        <Panel style={{ gap: 10, margin: 12 }}>
          <Copy title>
            {r.lost ? "Rescued at the reopening" : "Returned safely"}
          </Copy>
          <Copy>
            Highest Floor {r.highestFloor} · {r.newRooms} new chambers charted.
          </Copy>
          <Copy>
            Gross finds {r.gross} gold · {r.lost ? "forfeited" : "settled"}{" "}
            companion shares{" "}
            {Object.values(r.shares).reduce((a, b) => a + b, 0)} · secured gold{" "}
            {r.net}.
          </Copy>
          <Copy title>Monsters and spoils</Copy>
          {Object.entries(r.enemies).map(([id, n]) => (
            <Copy key={id}>
              {MONSTERS.find((m) => m.id === id)?.name || id} ×{n}
            </Copy>
          ))}
          <Copy muted>
            Essence drops are shown even if bound, sold or lost before
            extraction.
          </Copy>
          {Object.entries(r.essences).map(([id, n]) => (
            <Copy key={id}>
              {ITEMS.find((i) => i.id === id)?.name || id} ×{n}
            </Copy>
          ))}
          <Copy title>
            {r.lost ? "Unsecured belongings lost" : "Belongings secured"}
          </Copy>
          {Object.entries(r.spoils.inventory)
            .filter(([, n]) => n > 0)
            .map(([id, n]) => (
              <Copy key={id}>
                {ITEMS.find((i) => i.id === id)?.name || id} ×{n}
              </Copy>
            ))}
          <Copy>
            {r.spoils.food} rations · {r.spoils.potions} potions ·{" "}
            {r.spoils.gems} crystals
          </Copy>
          {Object.entries(r.lostSkills || {}).map(([id, skills]) => (
            <Copy key={id}>
              Lost provisional powers ·{" "}
              {state.party.find((c) => c.id === id)?.name || id}:{" "}
              {skills.join(", ")}
            </Copy>
          ))}
          {r.challenge && (
            <Copy title>
              Challenge complete: the throne cleared with everyone standing.
            </Copy>
          )}
          <Copy title>Companion progress</Copy>
          {r.characters.map((c) => (
            <React.Fragment key={c.id}>
              <Copy>
                {c.name}: +{c.experience || 0} XP · level {c.level} (
                {c.levels >= 0 ? "+" : ""}
                {c.levels}) · mastery {c.mastery >= 0 ? "+" : ""}
                {c.mastery} · {c.injuries} injuries · loyalty{" "}
                {c.loyalty >= 0 ? "+" : ""}
                {c.loyalty}
              </Copy>
              {c.skills.length > 0 && (
                <Copy muted>Secured powers: {c.skills.join(", ")}</Copy>
              )}
              {c.equipment.length > 0 && (
                <Copy muted>
                  Equipment:{" "}
                  {c.equipment
                    .map((id) => ITEMS.find((i) => i.id === id)?.name || id)
                    .join(", ")}
                </Copy>
              )}
            </React.Fragment>
          ))}
          <Copy title>Consequences and leads</Copy>
          {[...r.quests, ...r.factions, ...r.relationships, ...r.leads].map(
            (line, i) => (
              <Copy key={i}>{line}</Copy>
            ),
          )}
          <Copy title>Prepare for the next opening</Copy>
          {r.recommendations.map((line) => (
            <Copy key={line}>• {line}</Copy>
          ))}
          {state.ending && (
            <>
              <Copy title>Optional journeys after the crown</Copy>
              {optionalGoals(state).map((g) => (
                <Copy key={g.label}>
                  {g.label}: {g.value}/{g.target}
                </Copy>
              ))}
              <Copy muted>
                Choose an earlier checkpoint to explore another route or finish
                a personal story.
              </Copy>
            </>
          )}
          <Button
            label="Continue to town"
            onPress={() => {
              dispatch({ type: "ACK_REPORT" });
              router.replace("/town");
            }}
          />
        </Panel>
      </Frame>
    </Guard>
  );
}
