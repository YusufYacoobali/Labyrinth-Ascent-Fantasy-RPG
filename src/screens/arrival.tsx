import React, { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import { ArrivalArt } from "@/components/story-art";
import { StoryCard } from "@/components/story-card";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Button, Choice, Copy, Icon } from "@/components/game-ui";
import { Reveal } from "@/components/combat-motion";
import { FieldSupplies } from "@/components/field-supplies";
import { ARRIVALS } from "@/game/story";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";

export function Arrival() {
  const { state, dispatch } = useGame();
  const scene = ARRIVALS[state.floor - 1];
  const player = useAudioPlayer(require("../../assets/audio/cave.wav"));
  const audio = useAudioPlayerStatus(player);
  const played = useRef(false);
  useEffect(() => {
    if (!state.sound || state.floor !== 1 || state.arrivalChoice) {
      player.pause();
      return;
    }
    if (audio.isLoaded && !played.current) {
      played.current = true;
      void player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => {});
    }
  }, [audio.isLoaded, player, state.sound, state.floor, state.arrivalChoice]);
  const resolved = !!state.arrivalChoice;
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
                      roll: Math.random(),
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
      {!resolved && state.floor === 1 && state.sound && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hear the goblin noises again"
          onPress={() => {
            void player
              .seekTo(0)
              .then(() => player.play())
              .catch(() => {});
          }}
          style={{
            alignSelf: "center",
            padding: 8,
            flexDirection: "row",
            gap: 7,
            alignItems: "center",
          }}
        >
          <Icon name="volume-high" size={17} />
          <Copy muted style={{ fontSize: 12 }}>
            Listen again
          </Copy>
        </Pressable>
      )}
    </View>
  );
}
