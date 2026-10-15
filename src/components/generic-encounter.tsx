import React from "react";
import { View } from "react-native";
import { Button, Copy, Panel } from "./game-ui";
import { useGame } from "@/game/provider";
import { encounterKey } from "@/game/exploration";
import { GENERIC_ENCOUNTERS } from "@/game/generic-encounters";
import { EnvironmentArt } from "./story-art";
export function GenericEncounterScene() {
  const { state, dispatch } = useGame();
  const room = encounterKey(state),
    record = state.expedition.generic[room];
  const encounter = GENERIC_ENCOUNTERS.find((c) => c.id === record?.id);
  if (!record || !encounter) return null;
  return (
    <View style={{ padding: 18, gap: 16 }}>
      <Copy muted>Travelling encounter</Copy>
      <Copy title style={{ fontSize: 27 }}>
        {encounter.title}
      </Copy>
      <View style={{ maxHeight: 128, overflow: "hidden", borderRadius: 8 }}>
        <EnvironmentArt
          floor={state.floor}
          route={state.route}
          label="The surrounding labyrinth passage"
        />
      </View>
      <Panel style={{ padding: 14 }}>
        <Copy>{encounter.variants[record.variant]}</Copy>
      </Panel>
      {encounter.choices.map((c) => (
        <Button
          key={c.id}
          label={c.label}
          tone="dark"
          disabled={
            state.food < (c.foodCost || 0) || state.gold < (c.goldCost || 0)
          }
          onPress={() =>
            dispatch({
              type: "GENERIC_CHOICE",
              room,
              id: record.id,
              choice: c.id,
            })
          }
        />
      ))}
    </View>
  );
}
