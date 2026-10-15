import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { CombatGoldDrop } from "@/game/combat-presentation";
import { Copy, Icon } from "./game-ui";
import { theme as t } from "@/theme";

type Point = { x: number; y: number };
const travelEase = Easing.bezierFn(0.77, 0, 0.175, 1);

function Coin({
  progress,
  from,
  to,
  index,
}: {
  progress: SharedValue<number>;
  from: Point;
  to: Point;
  index: number;
}) {
  const motion = useAnimatedStyle(() => {
    const p = progress.get();
    const burst = Math.min(1, p / 0.28);
    const flight = travelEase(
      Math.max(0, Math.min(1, (p - 0.38 - index * 0.035) / 0.44)),
    );
    return {
      opacity: interpolate(p, [0, 0.04, 0.94, 1], [0, 1, 1, 0]),
      transform: [
        {
          translateX:
            from.x +
            (index - 2) * 11 * burst * (1 - flight) +
            (to.x - from.x) * flight,
        },
        {
          translateY:
            from.y -
            Math.sin(burst * Math.PI) * (24 + index * 3) * (1 - flight) +
            (to.y - from.y) * flight -
            Math.sin(flight * Math.PI) * 36,
        },
        { scaleX: 0.7 + Math.sin(p * Math.PI * 6 + index) * 0.3 },
        { rotate: `${(index - 2) * 12 + p * 120}deg` },
      ],
    };
  });
  return (
    <Animated.View style={[styles.coin, motion]}>
      <View style={styles.coinInset} />
    </Animated.View>
  );
}

function DropLabel({
  progress,
  drop,
  reduced,
}: {
  progress: SharedValue<number>;
  drop: CombatGoldDrop & Point;
  reduced: boolean;
}) {
  const motion = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.get(),
      [0, 0.08, 0.52, 0.7, 1],
      [0, 1, 1, 0, 0],
    ),
    transform: [{ translateY: reduced ? 0 : -progress.get() * 22 }],
  }));
  return (
    <Animated.View
      style={[
        styles.dropLabel,
        { left: drop.x - 53, top: drop.y - 64 },
        motion,
      ]}
    >
      <Copy
        style={{
          fontSize: 15,
          color: t.color.goldLight,
          fontFamily: t.font.bold,
          textAlign: "center",
        }}
      >
        +{drop.amount} gold
      </Copy>
    </Animated.View>
  );
}

/** Uses transforms and opacity on the UI runtime; never grants or settles currency. */
export default function CombatGoldPickup({
  drops,
  destination,
  fast,
  reduced,
}: {
  drops: (CombatGoldDrop & Point)[];
  destination: Point;
  fast: boolean;
  reduced: boolean;
}) {
  const progress = useSharedValue(0);
  const duration = reduced ? 800 : fast ? 850 : 1200;
  useEffect(() => {
    progress.set(
      withTiming(1, {
        duration,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, duration]);
  const badge = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.05, 0.95, 1], [0, 1, 1, 0]),
  }));
  const collected = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.5, 0.72, 1], [0, 0, 1, 1]),
  }));
  const total = drops.reduce((sum, drop) => sum + drop.amount, 0);
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="combat-gold-pickup"
      accessibilityLabel={`Gold collected: ${total}`}
      accessibilityLiveRegion="polite"
    >
      {drops.map((drop) => (
        <View key={drop.id}>
          {!reduced &&
            Array.from({ length: 5 }, (_, index) => (
              <Coin
                key={index}
                progress={progress}
                from={drop}
                to={destination}
                index={index}
              />
            ))}
          <DropLabel progress={progress} drop={drop} reduced={reduced} />
        </View>
      ))}
      <Animated.View
        style={[
          styles.collector,
          { left: destination.x - 18, top: destination.y - 18 },
          badge,
        ]}
      >
        <Icon name="sack" size={22} color={t.color.gold} />
        <View>
          <Copy style={{ fontSize: 9, lineHeight: 12, color: t.color.muted }}>
            SPOILS
          </Copy>
          <Animated.View style={collected}>
            <Copy
              style={{ fontSize: 12, lineHeight: 16, color: t.color.goldLight }}
            >
              +{total} gold
            </Copy>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: "absolute",
    left: -6,
    top: -7,
    width: 12,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#ffe6a2",
    backgroundColor: "#d9982e",
    alignItems: "center",
    justifyContent: "center",
  },
  coinInset: {
    width: 4,
    height: 7,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#fff2bd",
  },
  dropLabel: {
    position: "absolute",
    width: 106,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(8,15,25,.88)",
    borderWidth: 1,
    borderColor: t.color.goldDim,
  },
  collector: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(8,15,25,.92)",
    borderWidth: 1,
    borderColor: t.color.goldDim,
    borderRadius: 5,
  },
});
