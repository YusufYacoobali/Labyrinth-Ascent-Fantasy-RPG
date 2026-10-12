import React, { useState } from "react";
import Animated, {
  cubicBezier,
  useReducedMotion,
} from "react-native-reanimated";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image, ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme as t } from "@/theme";
import { useGame } from "@/game/provider";
import { BevelFrame, MockNavbar, ChoiceGlyph } from "./mock-chrome";
export const art = {
  cover: require("../../assets/art/cover-modest.png"),
  town: require("../../assets/art/town.png"),
  tavern: require("../../assets/art/tavern-modest.png"),
  dungeon: require("../../assets/art/dungeon.png"),
  labyrinth: require("../../assets/art/labyrinth.png"),
  relic: require("../../assets/art/relic.png"),
  treasure: require("../../assets/art/treasure.png"),
  portraits: require("../../assets/art/portraits-modest.png"),
  sprites: require("../../assets/art/sprites-modest.png"),
  camp: require("../../assets/art/camp.png"),
  clan: require("../../assets/art/clan.png"),
  forest: require("../../assets/art/forest.png"),
  frost: require("../../assets/art/frost.png"),
  forge: require("../../assets/art/forge.png"),
  bosses: require("../../assets/art/bosses.png"),
  townMock: require("../../assets/art/town-modest.png"),
  townPlay: require("../../assets/art/town-play.png"),
  townGuide: require("../../assets/art/town-guide.png"),
  tavernMock: require("../../assets/art/tavern-banner-modest.png"),
  items: require("../../assets/art/items.png"),
  cave: require("../../assets/art/cave.png"),
  splashMock: require("../../assets/art/splash-mock.png"),
};
export function Copy({
  children,
  style,
  muted = false,
  title = false,
  ...props
}: React.ComponentProps<typeof Text> & { muted?: boolean; title?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: title ? t.font.title : t.font.body,
          color: muted ? t.color.muted : t.color.text,
          fontSize: title ? 20 : 15,
          lineHeight: title ? 28 : 21,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 22,
  color = t.color.gold,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const item = (
    {
      sword: 0,
      "tshirt-crew": 1,
      helmet: 2,
      ring: 3,
      "shoe-print": 4,
      "diamond-stone": 5,
      "book-open-variant": 6,
      ruby: 7,
      gold: 8,
      "treasure-chest": 9,
      "bottle-tonic": 10,
      "bottle-tonic-plus": 10,
      creation: 11,
    } as Record<string, number>
  )[name];
  if (item !== undefined && size >= 25)
    return (
      <View style={{ width: size, height: size, overflow: "hidden" }}>
        <Image
          source={art.items}
          contentFit="fill"
          style={{
            position: "absolute",
            width: size * 4,
            height: size * 3,
            left: -(item % 4) * size,
            top: -Math.floor(item / 4) * size,
          }}
        />
      </View>
    );
  return (
    <MaterialCommunityIcons
      name={name as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
      size={size}
      color={color}
    />
  );
}
export function Atlas({
  index,
  size = 64,
  sprite = false,
  style,
}: {
  index: number;
  size?: number;
  sprite?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const boss = sprite && index >= 6;
  const cell = boss ? index - 6 : index;
  return (
    <View style={[{ width: size, height: size, overflow: "hidden" }, style]}>
      <Image
        source={boss ? art.bosses : sprite ? art.sprites : art.portraits}
        cachePolicy="memory-disk"
        contentFit="fill"
        style={{
          position: "absolute",
          width: size * (boss ? 3 : 2),
          height: size * (boss ? 2 : 3),
          left: -(cell % (boss ? 3 : 2)) * size,
          top: -Math.floor(cell / (boss ? 3 : 2)) * size,
        }}
      />
    </View>
  );
}
export function Button({
  label,
  onPress,
  tone = "gold",
  icon,
  disabled = false,
  small = false,
  compact = false,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: "gold" | "blue" | "red" | "dark" | "green";
  icon?: string;
  disabled?: boolean;
  small?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={compact ? 7 : undefined}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      style={({ pressed }) => [
        { opacity: disabled ? 0.42 : pressed ? 0.76 : 1, flexShrink: 1 },
        style,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
          transitionProperty: "transform",
          transitionDuration: "120ms",
          transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
        }}
      >
        <BevelFrame
          tone={tone}
          style={[
            styles.button,
            {
              minHeight: compact ? 30 : 46,
              paddingVertical: compact ? 3 : small ? 8 : 12,
            },
          ]}
        >
          {icon && (
            <Icon
              name={icon}
              size={small ? 18 : 23}
              color={tone === "gold" ? t.color.goldLight : t.color.text}
            />
          )}
          <Copy
            style={{
              fontFamily: t.font.body,
              fontSize: small ? 14 : 17,
              color: tone === "gold" ? t.color.goldLight : t.color.text,
              textAlign: "center",
            }}
          >
            {label}
          </Copy>
          {tone === "gold" && !small && (
            <Feather name="arrow-right" color={t.color.goldLight} size={18} />
          )}
        </BevelFrame>
      </Animated.View>
    </Pressable>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
export function Choice({
  label,
  detail,
  icon,
  tone = "gold",
  onPress,
  disabled = false,
  trailing,
  style,
}: {
  label: string;
  detail?: string;
  icon?: string;
  tone?: "gold" | "blue" | "red" | "dark" | "green";
  onPress: () => void;
  disabled?: boolean;
  trailing?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.42 : pressed ? 0.82 : 1 },
        style,
      ]}
    >
      <BevelFrame
        tone={tone}
        style={{
          minHeight: 58,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {icon &&
          (["sword", "magnify", "alert-outline"].includes(icon) ? (
            <ChoiceGlyph name={icon} />
          ) : (
            <Icon
              name={icon}
              size={26}
              color={
                tone === "blue"
                  ? "#b6e7ff"
                  : tone === "red"
                    ? "#ffab9e"
                    : t.color.goldLight
              }
            />
          ))}
        <View style={{ flex: 1 }}>
          <Copy
            style={{ fontFamily: t.font.bold, fontSize: 16, lineHeight: 20 }}
          >
            {label}
          </Copy>
          {!!detail && (
            <Copy style={{ fontSize: 13, lineHeight: 18, color: "#d9dce4" }}>
              {detail}
            </Copy>
          )}
        </View>
        {!!trailing && (
          <Copy style={{ fontSize: 12, color: t.color.goldLight }}>
            {trailing}
          </Copy>
        )}
      </BevelFrame>
    </Pressable>
  );
}
export function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: t.color.goldDim,
        opacity: 0.5,
        marginVertical: 12,
      }}
    />
  );
}
export function Bar({
  value,
  max,
  color = t.color.blue,
  label,
}: {
  value: number;
  max: number;
  color?: string;
  label?: string;
}) {
  return (
    <View style={{ gap: 3 }}>
      {label && <Copy style={{ fontSize: 10, lineHeight: 13 }}>{label}</Copy>}
      <View
        style={{
          height: 5,
          backgroundColor: "#303845",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 5,
            width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
export function Resources() {
  const { state } = useGame();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Icon name="circle-double" size={17} />
      <Copy style={{ fontFamily: t.font.bold, fontSize: 12 }}>
        {state.gold.toLocaleString()}
      </Copy>
      <Icon name="diamond-stone" size={16} color={t.color.blue} />
      <Copy style={{ fontFamily: t.font.bold, fontSize: 12 }}>
        {state.gems}
      </Copy>
    </View>
  );
}
export function Header({
  title,
  subtitle,
  back = true,
  portrait,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  portrait?: number;
}) {
  return (
    <View style={styles.header}>
      {portrait !== undefined ? (
        <Atlas
          index={portrait}
          size={43}
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: t.color.gold,
          }}
        />
      ) : back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to town"
          onPress={() => router.replace("/town")}
          style={{ padding: 5 }}
        >
          <Feather name="arrow-left" size={25} color={t.color.goldLight} />
        </Pressable>
      ) : (
        <Icon name="castle" size={28} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Copy title style={{ fontSize: 21, lineHeight: 25 }} numberOfLines={1}>
          {title}
        </Copy>
        {subtitle && (
          <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
            {subtitle}
          </Copy>
        )}
      </View>
      <Resources />
    </View>
  );
}
const tabs = [
  { path: "/town", label: "Home", icon: "home-variant" },
  { path: "/party", label: "Party", icon: "account-group" },
  { path: "/labyrinth", label: "Labyrinth", icon: "gate" },
  { path: "/journal", label: "Journal", icon: "book-open-page-variant" },
  { path: "/more", label: "More", icon: "menu" },
] as const;
export function Nav({ active }: { active: string }) {
  const { state } = useGame();
  return (
    <MockNavbar active={active}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.path}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: active === tab.label }}
          onPress={() =>
            router.replace(state.phase !== "town" ? "/expedition" : tab.path)
          }
          style={{ flex: 1, height: "100%" }}
        />
      ))}
    </MockNavbar>
  );
}
export function Frame({
  children,
  background,
  active,
  title,
  subtitle,
  back,
  portrait,
  scroll = true,
  hideNav = false,
  fullBleed = false,
}: {
  children: React.ReactNode;
  background?: ImageSource;
  active?: string;
  title?: string;
  subtitle?: string;
  back?: boolean;
  portrait?: number;
  scroll?: boolean;
  hideNav?: boolean;
  fullBleed?: boolean;
}) {
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { state, dispatch, saveError, retrySave } = useGame();
  const showNotice =
    /^(You need|Not enough|Select |Choose |You cannot|You do not|No |This contract|The merchant asks|A full training|Your signing offer|Make room|Rest your party)/i.test(
      state.message,
    );
  return (
    <View style={styles.outer}>
      <Image
        source={art.cover}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(5,11,20,.93)" },
        ]}
      />
      <View
        style={[
          styles.frame,
          {
            paddingTop: fullBleed ? 0 : inset.top,
            paddingBottom: fullBleed ? 0 : inset.bottom,
            maxWidth: fullBleed && width <= 600 ? undefined : 460,
          },
        ]}
      >
        {background && (
          <Image
            source={background}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(6,13,23,.15)",
            "rgba(6,13,23,.25)",
            "rgba(6,13,23,.94)",
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {!fullBleed && (
          <View pointerEvents="none" style={styles.frameOutline} />
        )}
        {title && (
          <Header
            title={title}
            subtitle={subtitle}
            back={back}
            portrait={portrait}
          />
        )}
        <View style={{ flex: 1 }}>
          {scroll ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
        {showNotice && (
          <Pressable
            accessibilityLabel="Dismiss notification"
            accessibilityRole="button"
            onPress={() => dispatch({ type: "DISMISS" })}
            style={styles.toast}
          >
            <Icon name="information-outline" size={18} />
            <Copy style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
              {state.message}
            </Copy>
            <Icon name="close" size={16} />
          </Pressable>
        )}
        {!!saveError && (
          <Pressable
            onPress={retrySave}
            accessibilityRole="button"
            style={styles.toast}
          >
            <Copy style={{ fontSize: 12, color: t.color.red }}>
              {saveError}
            </Copy>
          </Pressable>
        )}
        {!hideNav && active && <Nav active={active} />}
      </View>
    </View>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Copy
      style={{
        letterSpacing: 2.5,
        fontSize: 10,
        fontFamily: t.font.bold,
        color: t.color.gold,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Copy>
  );
}
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: t.color.bg, alignItems: "center" },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    backgroundColor: t.color.bg,
    overflow: "hidden",
  },
  frameOutline: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: t.color.goldDim,
    borderRadius: 20,
    zIndex: 10,
  },
  header: {
    minHeight: 68,
    backgroundColor: "rgba(8,15,25,.94)",
    borderBottomWidth: 1,
    borderBottomColor: t.color.goldDim,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    position: "relative",
  },
  buttonInset: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    right: 3,
    borderWidth: 0.7,
    borderRadius: 2,
  },
  panel: {
    backgroundColor: "rgba(9,18,28,.94)",
    borderWidth: 1,
    borderColor: t.color.line,
    borderRadius: 6,
    padding: 14,
  },
  nav: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 3,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 56,
  },
  navActive: { backgroundColor: "#1d3c65", borderColor: t.color.blue },
  toast: {
    backgroundColor: "#142331",
    borderTopWidth: 1,
    borderColor: t.color.goldDim,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
