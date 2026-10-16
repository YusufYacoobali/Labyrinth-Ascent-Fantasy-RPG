import React from "react";
import { View } from "react-native";
import { Choice } from "./game-ui";
import { useGame } from "@/game/provider";
import { encounterKey } from "@/game/exploration";
import { GENERIC_ENCOUNTERS } from "@/game/generic-encounters";
import { SceneIllustration } from "./scene-illustration";
import { genericIllustration } from "@/game/scene-illustrations";
import { StoryCard } from "./story-card";
export function GenericEncounterScene() {
  const { state, dispatch } = useGame();
  const room = encounterKey(state),
    record = state.expedition.generic[room];
  const encounter = GENERIC_ENCOUNTERS.find((c) => c.id === record?.id);
  if (!record || !encounter) return null;
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <SceneIllustration
        illustration={genericIllustration(encounter.id, record.variant)}
      />
      <StoryCard
        title={encounter.title}
        body={encounter.variants[record.variant]}
      >
        {encounter.choices.map((c) => (
          <Choice
            key={c.id}
            label={c.label}
            icon={
              c.id === "leave" ? "walk" : c.foodCost ? "sack" : "chat-outline"
            }
            tone={c.id === "leave" ? "dark" : c.id === "help" ? "gold" : "blue"}
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
      </StoryCard>
    </View>
  );
}
