import React from "react";
import { Panel, Copy, Button } from "./game-ui";
import { useGame } from "@/game/provider";
import {
  FACTION_OPPORTUNITIES,
  factionStanding,
} from "@/game/faction-opportunities";
import { buyPrice } from "@/game/engine";
import { ITEMS } from "@/game/world";
export function FactionOpportunities() {
  const { state, dispatch } = useGame();
  return (
    <Panel style={{ gap: 8 }}>
      <Copy title>Faction commissions</Copy>
      <Copy muted>
        5 standing unlocks a one-time material delivery; 10 unlocks faction
        stock and a 10% affiliated merchant discount.
      </Copy>
      {FACTION_OPPORTUNITIES.filter(
        (o) => state.bestFloor >= o.floor || factionStanding(state, o.id) > 0,
      ).map((o) => {
        const item = ITEMS.find((i) => i.id === o.item)!;
        const done = state.factionClaims?.includes(o.id),
          ready =
            !done &&
            state.phase === "town" &&
            state.bestFloor >= o.floor &&
            factionStanding(state, o.id) >= 5 &&
            (state.inventory[o.material] || 0) >= o.quantity;
        return (
          <React.Fragment key={o.id}>
            <Copy>
              {o.name} · {factionStanding(state, o.id)} standing
            </Copy>
            <Copy muted>
              {o.title}: {o.quantity} {o.material}, Floor {o.floor}. Reward:{" "}
              {ITEMS.find((i) => i.id === o.item)?.name}.
            </Copy>
            <Button
              small
              tone="dark"
              disabled={!ready}
              label={
                done ? "Delivery recorded" : `Deliver materials to ${o.name}`
              }
              onPress={() => dispatch({ type: "FACTION_DELIVER", id: o.id })}
            />
            {state.bestFloor >= o.floor &&
              factionStanding(state, o.id) >= 10 && (
                <Button
                  small
                  tone="dark"
                  label={`Buy ${item.name} · ${buyPrice(item, state.day, state)} gold`}
                  disabled={
                    state.phase !== "town" ||
                    state.gold < buyPrice(item, state.day, state)
                  }
                  onPress={() => dispatch({ type: "BUY_ITEM", id: item.id })}
                />
              )}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}
