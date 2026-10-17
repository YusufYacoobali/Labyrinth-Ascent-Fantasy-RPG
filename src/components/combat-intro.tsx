import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cubicBezier,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Game } from "@/game/engine";
import { enemyVisual, mirrorEnemy } from "@/game/combat-visuals";
import { FLOORS } from "@/game/world";
import { Atlas, Copy } from "./game-ui";
import { MOTION_SHEETS } from "./combat-sheets";
import { theme as t } from "@/theme";

export default function CombatIntro({
  state,
  ready,
  onComplete,
}: {
  state: Game;
  ready: boolean;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const party = state.party.filter((c) => c.hp > 0);
  const enemies = state.combat?.enemies.filter((e) => e.hp > 0) || [];
  const lead = party[0];
  const size = Math.min(190, width * 0.43);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(onComplete, reduced ? 1100 : 2400);
    return () => clearTimeout(timer);
  }, [ready, reduced, onComplete]);
  const enter = (direction: number) => ({
    animationName: {
      from: {
        opacity: 0,
        transform: [{ translateX: reduced ? 0 : direction * 32 }],
      },
      to: { opacity: 1, transform: [{ translateX: 0 }] },
    },
    animationDuration: "280ms" as const,
    animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    animationFillMode: "both" as const,
  });
  return (
    <Pressable
      testID="combat-intro"
      accessibilityRole="button"
      accessibilityLabel="Begin battle"
      accessibilityHint={`${party.map((c) => c.name).join(", ")} versus ${enemies.map((e) => e.name).join(", ")}. Tap to skip the entrance.`}
      disabled={!ready}
      onPress={onComplete}
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { paddingTop: inset.top + 30, paddingBottom: inset.bottom + 26 },
      ]}
    >
      <LinearGradient
        colors={["#081b2b", "#050a12", "#291019"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.slash} />
      <View style={{ alignItems: "center", gap: 6 }}>
        <Copy style={styles.kicker}>FLOOR {state.floor}</Copy>
        <Copy
          title
          style={{
            fontSize: 24,
            textAlign: "center",
            color: t.color.goldLight,
          }}
        >
          {FLOORS[state.floor - 1]?.name}
        </Copy>
        <View
          style={{
            height: 1,
            width: 56,
            backgroundColor: t.color.goldDim,
            marginTop: 10,
          }}
        />
      </View>
      <View style={styles.matchup}>
        <Animated.View style={[styles.side, enter(-1)]}>
          <Copy style={[styles.kicker, { color: t.color.blue }]}>
            YOUR PARTY
          </Copy>
          {lead && (
            <View style={[styles.portrait, { width: size, height: size }]}>
              <Atlas index={lead.portrait} size={size} />
            </View>
          )}
          <Copy title numberOfLines={2} style={styles.name}>
            {lead?.name || "The expedition"}
          </Copy>
          <View style={styles.backups}>
            {party.slice(1).map((c) => (
              <View key={c.id} style={{ alignItems: "center", gap: 3 }}>
                <View style={styles.mini}>
                  <Atlas index={c.portrait} size={36} />
                </View>
                <Copy numberOfLines={1} style={styles.smallName}>
                  {c.name}
                </Copy>
              </View>
            ))}
          </View>
        </Animated.View>
        <Animated.View style={[styles.side, enter(1)]}>
          <Copy style={[styles.kicker, { color: t.color.red }]}>
            {state.combat?.ambush
              ? "REST AMBUSH"
              : enemies.some((e) => e.boss)
                ? "GUARDIAN"
                : "ENCOUNTER"}
          </Copy>
          <View
            style={{
              width: size,
              height: size,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {enemies.map((enemy, index) => {
              const visual = enemyVisual({ ...state, enemy });
              const spriteSize =
                enemies.length === 1
                  ? size
                  : index === 0
                    ? size * 0.82
                    : size * 0.58;
              return (
                <View
                  key={enemy.id}
                  style={{
                    position: "absolute",
                    width: spriteSize,
                    height: spriteSize,
                    overflow: "hidden",
                    left: index === 0 ? 0 : size - spriteSize,
                    top:
                      index === 0
                        ? size * 0.1
                        : index === 1
                          ? 0
                          : size - spriteSize,
                    zIndex: index === 0 ? 2 : 1,
                    transform: [{ scaleX: mirrorEnemy(visual.key) ? -1 : 1 }],
                  }}
                >
                  <Image
                    source={MOTION_SHEETS[visual.key]}
                    contentFit="fill"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: spriteSize * 8,
                      height: spriteSize * 6,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <Copy title numberOfLines={3} style={styles.name}>
            {enemies[0]?.name || state.enemy?.name}
          </Copy>
          <Copy
            numberOfLines={3}
            style={{
              minHeight: 48,
              fontSize: 12,
              lineHeight: 17,
              color: t.color.muted,
              textAlign: "center",
            }}
          >
            {enemies
              .slice(1)
              .map((e) => e.name)
              .join("\n")}
          </Copy>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.versus, enter(0)]}>
          <Copy style={styles.vs}>VS</Copy>
        </Animated.View>
      </View>
      <View style={{ alignItems: "center", gap: 12 }}>
        <Copy style={styles.fight}>FIGHT</Copy>
        <Copy style={{ fontSize: 11, letterSpacing: 2, color: t.color.muted }}>
          {ready ? "TAP TO BEGIN" : "PREPARING ARENA"}
        </Copy>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 20,
    backgroundColor: "#060c14",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  slash: {
    position: "absolute",
    top: "-10%",
    bottom: "-10%",
    left: "50%",
    width: 1,
    backgroundColor: "#c3975966",
    transform: [{ rotate: "12deg" }],
  },
  kicker: {
    fontFamily: t.font.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.5,
    color: t.color.gold,
  },
  matchup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 250,
  },
  side: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  portrait: {
    overflow: "hidden",
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: t.color.blue,
  },
  name: {
    fontSize: 21,
    lineHeight: 25,
    minHeight: 50,
    textAlign: "center",
    color: t.color.text,
  },
  backups: { flexDirection: "row", gap: 7, minHeight: 58 },
  mini: {
    width: 36,
    height: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: t.color.goldDim,
    borderRadius: 3,
  },
  smallName: {
    fontSize: 9,
    lineHeight: 12,
    color: t.color.muted,
    maxWidth: 45,
  },
  versus: {
    position: "absolute",
    left: "50%",
    top: "43%",
    width: 90,
    marginLeft: -45,
    alignItems: "center",
    transform: [{ rotate: "-10deg" }],
  },
  vs: {
    fontFamily: t.font.bold,
    fontStyle: "italic",
    fontSize: 62,
    lineHeight: 76,
    letterSpacing: -4,
    color: t.color.goldLight,
    textShadowColor: "#02050b",
    textShadowRadius: 14,
    textShadowOffset: { width: 2, height: 4 },
  },
  fight: {
    fontFamily: t.font.bold,
    fontStyle: "italic",
    fontSize: 42,
    lineHeight: 54,
    letterSpacing: 8,
    color: t.color.goldLight,
  },
});
