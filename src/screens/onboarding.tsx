import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button, Copy, Frame } from "@/components/game-ui";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";

const pages = [
  {
    art: require("../../assets/onboarding/ob-intro-font.png"),
    title: "",
    body: "Will you become a legend?",
    action: "Begin Your Journey",
  },
  {
    art: require("../../assets/onboarding/ob-welcome.png"),
    title: "Welcome, Adventurer",
    body: "This is Stormhold, your new home. Recruit companions, prepare for the labyrinth, and carve your story.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-town.png"),
    title: "Build Your Team",
    body: "Visit the town to recruit companions, upgrade equipment, and take on quests.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/companions-modest.png"),
    title: "Meet Unique Companions",
    body: "Each companion has their own story, skills and personality. Will they survive the journey with you?",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-ascent.png"),
    title: "Ascend the Labyrinth",
    body: "Each month the labyrinth changes. Climb higher, face new challenges, and see how far you can go.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/combat-modest.png"),
    title: "Fight for Survival",
    body: "Turn-based combat, easy to learn but full of strategy. Use skills, items and your team’s strengths to overcome powerful foes.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-loot-font-v2.png"),
    title: "Discover Rare Loot",
    body: "Find powerful equipment, valuable items and rare treasures. The higher you climb, the greater the rewards.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-choices.png"),
    title: "Every Choice Matters",
    body: "Face unexpected events, difficult decisions and lasting consequences. Your choices shape your story.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-level-font.png"),
    title: "Grow Stronger",
    body: "Gain experience, level up and unlock new skills. Build powerful synergies and become stronger with each run.",
    action: "Next",
  },
  {
    art: require("../../assets/onboarding/ob-ending.png"),
    title: "Your Story Begins",
    body: "The labyrinth is waiting.\nHow high will you climb?",
    action: "Start Playing",
  },
];
function GuideSlide({
  index,
  position,
  width,
  active,
  move,
  finish,
}: {
  index: number;
  position: SharedValue<number>;
  width: number;
  active: boolean;
  move: (n: number) => void;
  finish: () => void;
}) {
  const page = pages[index];
  const inset = useSafeAreaInsets();
  const motion = useAnimatedStyle(() => {
    const offset = index - position.value;
    return {
      transform: [{ translateX: offset * width }],
      opacity: Math.max(0, 1 - Math.abs(offset)),
    };
  });
  return (
    <Animated.View
      pointerEvents={active ? "auto" : "none"}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      aria-hidden={!active}
      style={[
        StyleSheet.absoluteFill,
        motion,
        { paddingTop: inset.top, backgroundColor: "#08131b" },
      ]}
    >
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Image
          source={page.art}
          contentFit="fill"
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", "#08131b"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 45,
          }}
        />
      </View>
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 4,
          paddingBottom: Math.max(21, inset.bottom + 12),
          gap: 12,
          backgroundColor: "#08131b",
        }}
      >
        {!!page.title && (
          <Copy
            title
            style={{
              fontSize: 26,
              lineHeight: 31,
              textAlign: "center",
              color: t.color.goldLight,
            }}
          >
            {page.title}
          </Copy>
        )}
        <Copy
          style={{
            fontSize: 16,
            lineHeight: 22,
            textAlign: "center",
            color: "#e7ebef",
          }}
        >
          {page.body}
        </Copy>
        <Button
          label={page.action}
          onPress={() => (index === 9 ? finish() : move(index + 1))}
        />
        {index === 9 && (
          <Button label="I’m Ready" tone="dark" onPress={finish} />
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 9,
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Guide page ${Math.floor(index / 5) * 5 + i + 1}`}
              onPress={() => move(Math.floor(index / 5) * 5 + i)}
              hitSlop={8}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index % 5 ? t.color.text : "#4c5d70",
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
export function OnboardingScreen() {
  const { state, dispatch } = useGame();
  const [step, setStep] = useState(0);
  const [width, setWidth] = useState(390);
  const position = useSharedValue(0);
  const reduced = useReducedMotion();
  const lastPress = useRef(0);
  const inset = useSafeAreaInsets();
  const finish = () => {
    dispatch({ type: "INTRO_COMPLETED" });
    router.replace(
      state.started
        ? state.phase === "town"
          ? "/town"
          : "/expedition"
        : "/create",
    );
  };
  useEffect(() => {
    void Image.prefetch(
      pages.map((p) => Asset.fromModule(p.art).uri),
      { cachePolicy: "memory-disk" },
    ).catch(() => {});
  }, []);
  const move = (next: number) => {
    if (Date.now() - lastPress.current < 260) return;
    lastPress.current = Date.now();
    const target = Math.max(0, Math.min(9, next));
    setStep(target);
    position.value = withTiming(target, {
      duration: reduced ? 0 : 260,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    });
  };
  return (
    <Frame hideNav scroll={false} fullBleed>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, overflow: "hidden", backgroundColor: "#08131b" }}
      >
        {pages.map((_, index) => (
          <GuideSlide
            key={index}
            index={index}
            position={position}
            width={width}
            active={step === index}
            move={move}
            finish={finish}
          />
        ))}
        {step !== 9 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            onPress={finish}
            style={{
              position: "absolute",
              right: 17,
              top: inset.top + 18,
              borderWidth: 1,
              borderColor: "#647387",
              borderRadius: 5,
              paddingHorizontal: 13,
              paddingVertical: 5,
              backgroundColor: "rgba(10,20,30,.8)",
            }}
          >
            <Copy style={{ fontSize: 14, lineHeight: 18 }}>Skip</Copy>
          </Pressable>
        )}
      </View>
    </Frame>
  );
}
