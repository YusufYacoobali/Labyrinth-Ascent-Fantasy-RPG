import React, { useEffect } from "react";
import { View, Platform, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  ReduceMotion,
} from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Atlas, Copy } from "./game-ui";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";
export function useCombatFeedback() {
  const { state } = useGame();
  const strike = useAudioPlayer(require("../../assets/audio/strike.wav"));
  const skill = useAudioPlayer(require("../../assets/audio/skill.wav"));
  const reward = useAudioPlayer(require("../../assets/audio/reward.wav"));
  return (kind: "attack" | "skill" | "reward" | "item" | "guard") => {
    if (state.sound) {
      const player =
        kind === "reward"
          ? reward
          : kind === "skill" || kind === "item"
            ? skill
            : strike;
      void player
        .seekTo(0)
        .then(() => {
          player.volume = 0.28;
          player.play();
        })
        .catch(() => {});
    }
    if (state.haptics && Platform.OS !== "web") {
      void (
        kind === "reward"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          : Haptics.impactAsync(
              kind === "skill"
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            )
      ).catch(() => {});
    }
  };
}
export function BattleSprite({
  index,
  size = 170,
  effect = 0,
  hit = false,
}: {
  index: number;
  size?: number;
  effect?: number;
  hit?: boolean;
}) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const flash = useSharedValue(1);
  useEffect(() => {
    if (!effect || !hit) return;
    flash.set(
      withSequence(
        withTiming(0.45, { duration: 55 }),
        withTiming(1, { duration: 120 }),
      ),
    );
    if (!reduced)
      x.set(
        withSequence(
          withTiming(-7, { duration: 45 }),
          withTiming(6, { duration: 45 }),
          withTiming(-3, { duration: 45 }),
          withTiming(0, {
            duration: 65,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          }),
        ),
      );
  }, [effect, hit, reduced, x, flash]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    opacity: flash.get(),
  }));
  return (
    <Animated.View style={style}>
      <Atlas sprite index={index} size={size} />
    </Animated.View>
  );
}
export function DamageNumber({
  amount,
  critical = false,
  poison = false,
  id,
}: {
  amount: number;
  critical?: boolean;
  poison?: boolean;
  id: number;
}) {
  const reduced = useReducedMotion();
  const y = useSharedValue(8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    y.set(
      withTiming(reduced ? 0 : -25, {
        duration: 520,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      }),
    );
    opacity.set(
      withSequence(
        withTiming(1, { duration: 90 }),
        withDelay(350, withTiming(0, { duration: 150 })),
      ),
    );
  }, [id, reduced, y, opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: y.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: poison ? 75 : 32,
          left: 0,
          right: 0,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Copy
        style={{
          fontFamily: t.font.bold,
          fontSize: critical ? 34 : 27,
          lineHeight: 40,
          color: poison
            ? t.color.green
            : critical
              ? t.color.goldLight
              : t.color.text,
          textShadowColor: "#000",
          textShadowRadius: 5,
          textShadowOffset: { width: 1, height: 2 },
        }}
      >
        {critical ? "CRIT " : poison ? "VENOM " : ""}
        {amount}
      </Copy>
    </Animated.View>
  );
}
export function Reveal({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={style}
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
export function Sparks() {
  return (
    <View
      pointerEvents="none"
      style={{
        height: 20,
        flexDirection: "row",
        justifyContent: "center",
        gap: 17,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Copy
          key={i}
          style={{ fontSize: i % 2 ? 12 : 18, color: t.color.gold }}
        >
          ✦
        </Copy>
      ))}
    </View>
  );
}
