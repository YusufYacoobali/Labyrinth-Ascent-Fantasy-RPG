import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image, type ImageProps } from "expo-image";
import Animated, {
  cubicBezier,
  FadeIn,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";

/** The whole painting moves together, including any dialogue baked into its art. */
export function SceneMotion({
  children,
  style,
  subtle = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  subtle?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <Animated.View
        entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            { flex: 1 },
            !reduced && {
              animationName: {
                from: { transform: [{ scale: 1 }] },
                to: { transform: [{ scale: subtle ? 1.008 : 1.025 }] },
              },
              animationDuration: "12s",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationTimingFunction: cubicBezier(0.45, 0, 0.55, 1),
            },
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export function SceneImage({
  style,
  ...props
}: Omit<ImageProps, "style"> & { style?: StyleProp<ViewStyle> }) {
  return (
    <SceneMotion style={style}>
      <Image {...props} style={StyleSheet.absoluteFill} />
    </SceneMotion>
  );
}
