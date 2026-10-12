import React, { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router } from "expo-router";
import { art, Button, Choice, Copy, Icon } from "@/components/game-ui";
import { Reveal } from "@/components/combat-motion";
import { ARRIVALS } from "@/game/story";
import { floorEnvironment } from "@/game/engine";
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
  const source =
    scene.art === "route"
      ? floorEnvironment(state.floor, state.route)
      : scene.art;
  return (
    <View
      style={{
        flex: 1,
        gap: 12,
        paddingBottom: 15,
        backgroundColor: t.color.bg,
      }}
    >
      <Image
        source={art[source as keyof typeof art]}
        contentFit="cover"
        style={{ width: "100%", aspectRatio: 1.4 }}
        accessibilityLabel={scene.cue}
      />
      <Reveal key={`${state.floor}-${resolved}`}>
        <View style={{ gap: 12, paddingHorizontal: 15 }}>
          <Copy
            title
            style={{
              fontSize: 28,
              lineHeight: 32,
              textAlign: "center",
              color: t.color.goldLight,
            }}
          >
            {scene.title}
          </Copy>
          <Copy style={{ fontSize: 16, lineHeight: 23 }}>
            {resolved ? state.arrivalOutcome : scene.body}
          </Copy>
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
        </View>
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
      <Button
        label="Return to town"
        small
        tone="dark"
        style={{ marginHorizontal: 15 }}
        onPress={() => {
          dispatch({ type: "RETURN" });
          router.replace("/town");
        }}
      />
    </View>
  );
}
