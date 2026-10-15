import React from "react";
import { View } from "react-native";
import { ArrivalArt } from "@/components/story-art";
import { StoryCard } from "@/components/story-card";
import { Button, Choice, Copy } from "@/components/game-ui";
import { Reveal } from "@/components/combat-motion";
import { FieldSupplies } from "@/components/field-supplies";
import { ARRIVALS } from "@/game/story";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";

export function Arrival() {
  const { state, dispatch } = useGame();
  const scene = ARRIVALS[state.floor - 1];
  const resolved = !!state.arrivalChoice;
  if (!state.journey.defender)
    return (
      <View style={{ gap: 12, paddingBottom: 20 }}>
        <ArrivalArt floor={state.floor} label="A new floor" />
        <StoryCard
          title={"Floor " + state.floor + " · " + scene.cue}
          body="The entry lantern burns behind you. Find a route through the passages; a defender guards the upward portal."
        >
          <Button
            label="Explore the passages"
            onPress={() => dispatch({ type: "ENGAGE" })}
          />
        </StoryCard>
      </View>
    );
  return (
    <View
      style={{
        flex: 1,
        gap: 12,
        paddingBottom: 15,
        backgroundColor: t.color.bg,
      }}
    >
      <ArrivalArt floor={state.floor} label={scene.cue} />
      <Reveal key={`${state.floor}-${resolved}`}>
        <StoryCard
          title={scene.title}
          body={resolved ? state.arrivalOutcome : scene.body}
        >
          <FieldSupplies />
          {resolved ? (
            <>
              <Copy style={{ color: t.color.gold, fontSize: 13 }}>
                {state.arrivalEffect}
              </Copy>
              {state.arrivalScouted && state.enemy && (
                <Copy muted style={{ fontSize: 13 }}>
                  {state.enemy.name} · {state.enemy.hp} HP ·{" "}
                  {state.enemy.element} · {state.enemy.intent}
                </Copy>
              )}
              <Button
                label={`Face ${state.enemy?.name || "the enemy"}`}
                onPress={() => dispatch({ type: "ENGAGE" })}
              />
            </>
          ) : (
            scene.choices.map((choice) => {
              const supply =
                choice.effect === "ward" || choice.effect === "rest";
              const favored =
                choice.favoredRace &&
                state.party.some(
                  (c) => c.hp > 0 && c.race === choice.favoredRace,
                );
              return (
                <Choice
                  key={choice.id}
                  label={choice.label}
                  detail={
                    favored
                      ? "Companion advantage · Guaranteed opening hit"
                      : choice.detail
                  }
                  icon={choice.icon}
                  tone={
                    choice.effect === "rush"
                      ? "red"
                      : choice.effect === "observe"
                        ? "blue"
                        : "gold"
                  }
                  disabled={supply && state.food < 1}
                  onPress={() =>
                    dispatch({
                      type: "APPROACH",
                      choice: choice.id,
                      roll: -1,
                    })
                  }
                />
              );
            })
          )}
          {!resolved && state.arrivalScouted && state.enemy && (
            <Copy style={{ fontSize: 12, color: t.color.gold }}>
              {state.enemy.name} · ATK {state.enemy.atk} · {state.enemy.element}
            </Copy>
          )}
          <Choice
            label="Find a sheltered place"
            detail="Step into a defensible watch room"
            icon="tent"
            tone="dark"
            onPress={() => dispatch({ type: "SEEK_SHELTER" })}
          />
        </StoryCard>
      </Reveal>
    </View>
  );
}
