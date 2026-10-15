import React, { useState } from "react";
import Animated, {
  cubicBezier,
  FadeInDown,
  ReduceMotion,
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
import { router, usePathname } from "expo-router";
import { walkthroughTip } from "@/game/walkthrough";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme as t } from "@/theme";
import { useGame } from "@/game/provider";
import { BevelFrame } from "./mock-chrome";
import {
  MenuIcon,
  NativeNavbar,
  Surface,
  ResourceGlyph,
} from "./native-chrome";
export const art = {
  cover: require("../../assets/art/cover-modest.png"),
  town: require("../../assets/art/town.png"),
  tavern: require("../../assets/art/tavern-modest.png"),
  dungeon: require("../../assets/art/dungeon.png"),
  labyrinth: require("../../assets/art/labyrinth.png"),
  portal: require("../../assets/art/portal-scene.png"),
  sanctuary: require("../../assets/art/expedition-sanctuary.png"),
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
  tavernScene: require("../../assets/art/tavern-scene.png"),
  shopScene: require("../../assets/art/shop-scene.png"),
  guildScene: require("../../assets/art/guild-scene.png"),
  forgeScene: require("../../assets/art/forge-scene.png"),
  journalChapter: require("../../assets/art/journal-chapter.png"),
  recruitPortraits: require("../../assets/art/town-recruits-portraits.png"),
  recruitSprites: require("../../assets/art/town-recruits-sprites.png"),
  townItemIcons: require("../../assets/ui/town-item-icons.png"),
  menuIcons: require("../../assets/ui/menu-icons.png"),
  supplyIcons: require("../../assets/ui/supply-icons.png"),
  floodedRoad: require("../../assets/story/flooded-road.png"),
  scavenger: require("../../assets/story/bonegnaw-sprite.png"),
  storyGlyphs: require("../../assets/ui/story-glyphs.png"),
  moreStudy: require("../../assets/art/more-study.png"),
  parchment: require("../../assets/ui/parchment-ui-2.png"),
  resources: require("../../assets/ui/resources-ui-2.png"),
  floorEnemies: require("../../assets/story/floor-enemies-ui-2.png"),
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
  enemyFloor,
}: {
  index: number;
  size?: number;
  sprite?: boolean;
  style?: StyleProp<ViewStyle>;
  enemyFloor?: number;
}) {
  const floorEnemy =
    enemyFloor === undefined
      ? undefined
      : ({ 3: 0, 5: 1, 6: 2, 8: 3, 10: 4, 11: 5 } as Record<number, number>)[
          enemyFloor
        ];
  if (sprite && floorEnemy !== undefined)
    return (
      <View style={[{ width: size, height: size, overflow: "hidden" }, style]}>
        <Image
          source={art.floorEnemies}
          cachePolicy="memory-disk"
          contentFit="fill"
          style={{
            position: "absolute",
            width: size * 3,
            height: size * 2,
            left: -(floorEnemy % 3) * size,
            top: -Math.floor(floorEnemy / 3) * size,
          }}
        />
      </View>
    );
  if (sprite && index === 20)
    return (
      <View style={[{ width: size, height: size }, style]}>
        <Image
          source={art.scavenger}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  const recruit = index >= 12;
  const boss = !recruit && sprite && index >= 6;
  const cell = recruit ? index - 12 : boss ? index - 6 : index;
  const columns = recruit || boss ? 3 : 2;
  const rows = recruit || boss ? 2 : 3;
  return (
    <View style={[{ width: size, height: size, overflow: "hidden" }, style]}>
      <Image
        source={
          recruit
            ? sprite
              ? art.recruitSprites
              : art.recruitPortraits
            : boss
              ? art.bosses
              : sprite
                ? art.sprites
                : art.portraits
        }
        cachePolicy="memory-disk"
        contentFit="fill"
        style={{
          position: "absolute",
          width: size * columns,
          height: size * rows,
          left: -(cell % columns) * size,
          top: -Math.floor(cell / columns) * size,
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
  dense = false,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: "gold" | "blue" | "red" | "dark" | "green";
  icon?: string;
  disabled?: boolean;
  small?: boolean;
  compact?: boolean;
  dense?: boolean;
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
              paddingHorizontal: dense ? 6 : 13,
              gap: dense ? 4 : 9,
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
  const parchment =
    StyleSheet.flatten(style)?.backgroundColor === t.color.parchment;
  return (
    <Surface parchment={parchment} style={[{ padding: 14 }, style]}>
      {children}
    </Surface>
  );
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
          minHeight: 56,
          paddingVertical: 8,
          paddingLeft: 20,
          paddingRight: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        }}
      >
        {icon && <StoryGlyph name={icon} size={36} />}
        <View style={{ flex: 1 }}>
          <Copy
            style={{ fontFamily: t.font.body, fontSize: 16, lineHeight: 19 }}
          >
            {label}
          </Copy>
          {!!detail && (
            <Copy style={{ fontSize: 13, lineHeight: 17, color: "#d9dce4" }}>
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
export function StoryGlyph({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const index = (
    {
      "eye-outline": 0,
      "shoe-print": 1,
      "sword-cross": 2,
      sword: 2,
      tent: 3,
      "ear-hearing": 4,
      magnify: 6,
      "account-group": 7,
      "handshake-outline": 7,
      "treasure-chest": 8,
      shield: 9,
      "shield-check": 9,
      sack: 10,
      campfire: 11,
      water: 12,
      "alert-outline": 13,
      key: 14,
      "map-outline": 15,
    } as Record<string, number>
  )[name];
  if (index === undefined)
    return (
      <MaterialCommunityIcons
        name={
          name as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
        }
        size={size}
        color={t.color.goldLight}
      />
    );
  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <Image
        source={art.storyGlyphs}
        contentFit="fill"
        style={{
          position: "absolute",
          width: size * 4,
          height: size * 4,
          left: -(index % 4) * size,
          top: -Math.floor(index / 4) * size,
        }}
      />
    </View>
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
      <ResourceGlyph index={0} size={22} />
      <Copy style={{ fontFamily: t.font.bold, fontSize: 12 }}>
        {state.gold.toLocaleString()}
      </Copy>
      <ResourceGlyph index={1} size={21} />
      <Copy style={{ fontFamily: t.font.bold, fontSize: 12 }}>
        {state.gems}
      </Copy>
    </View>
  );
}
export function ExpeditionHeader({
  title,
  subtitle,
  onSettings,
}: {
  title: string;
  subtitle?: string;
  onSettings?: () => void;
}) {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const hero = state.party[0];
  const alive = state.party.filter((c) => c.hp > 0);
  const leader =
    alive.find((c) => c.id === state.journey.leaderId)?.id || alive[0]?.id;
  const canLead = [
    "mission",
    "arrival",
    "exploration",
    "branch",
    "camp",
    "event",
    "victory",
  ].includes(state.phase);
  const fatigue = Math.round(
    alive.reduce((n, c) => n + (c.exhaustion || 0), 0) /
      Math.max(1, alive.length),
  );
  return (
    <View
      style={{
        backgroundColor: "#06121d",
        paddingTop: insets.top,
        borderBottomWidth: 1,
        borderColor: t.color.goldDim,
      }}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 8,
          gap: 5,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Copy
            title
            style={{
              flex: 1,
              color: t.color.goldLight,
              fontSize: 27,
              lineHeight: 30,
            }}
          >
            {title}
          </Copy>
          {!!hero && (
            <View style={{ width: 87, gap: 3 }}>
              <Copy style={{ fontSize: 12, lineHeight: 14 }}>
                HP {hero.hp}/{hero.maxHp}
              </Copy>
              <Bar value={hero.hp} max={hero.maxHp} color={t.color.red} />
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expedition settings"
            onPress={onSettings}
            style={{ padding: 5 }}
          >
            <MenuIcon index={7} size={27} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Copy style={{ color: t.color.gold, fontSize: 12 }}>
              Floor {state.floor} · Facing {state.journey.facing}
            </Copy>
            {!!subtitle && (
              <Copy muted style={{ fontSize: 11, lineHeight: 14 }}>
                {subtitle}
              </Copy>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              open ? "Hide party overview" : "Show party overview"
            }
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen((v) => !v)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              borderWidth: 1,
              borderColor: t.color.gold,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 5,
              backgroundColor: "#32291c",
            }}
          >
            <MenuIcon index={1} size={22} />
            <Copy title style={{ fontSize: 21, lineHeight: 23 }}>
              Party
            </Copy>
            <Copy style={{ color: t.color.gold }}>{open ? "⌃" : "⌄"}</Copy>
          </Pressable>
        </View>
      </View>
      {open && (
        <Animated.View
          entering={FadeInDown.duration(160).reduceMotion(ReduceMotion.System)}
          style={{
            borderTopWidth: 1,
            borderColor: t.color.goldDim,
            padding: 9,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", gap: 7 }}>
            {state.party.map((c) => (
              <View
                key={c.id}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 3,
                  opacity: c.hp ? 1 : 0.45,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Let ${c.name} lead the passages`}
                  accessibilityState={{
                    selected: c.id === leader,
                    disabled: !canLead || c.hp <= 0,
                  }}
                  disabled={!canLead || c.hp <= 0}
                  onPress={() => dispatch({ type: "LEAD", id: c.id })}
                >
                  <Atlas
                    index={c.portrait}
                    size={44}
                    style={{
                      borderWidth: 1,
                      borderColor:
                        c.id === leader ? t.color.goldLight : t.color.goldDim,
                      borderRadius: 4,
                    }}
                  />
                  {c.id === leader && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        right: -4,
                        bottom: -3,
                        borderRadius: 8,
                        backgroundColor: "#071521",
                      }}
                    >
                      <StoryGlyph name="map-outline" size={15} />
                    </View>
                  )}
                </Pressable>
                <Copy
                  numberOfLines={1}
                  style={{ fontSize: 12, lineHeight: 14 }}
                >
                  {c.name}
                </Copy>
                <View style={{ alignSelf: "stretch", gap: 3 }}>
                  <Bar value={c.hp} max={c.maxHp} color={t.color.red} />
                  <Bar
                    value={c.exhaustion || 0}
                    max={100}
                    color={t.color.gold}
                  />
                </View>
                <Copy style={{ fontSize: 10, lineHeight: 12 }}>
                  {c.hp}/{c.maxHp} HP
                </Copy>
                <Copy muted style={{ fontSize: 10, lineHeight: 12 }}>
                  {c.exhaustion || 0}% exhausted
                </Copy>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <StoryGlyph name="tent" size={21} />
            <Copy style={{ fontSize: 12 }}>Team exhaustion {fatigue}%</Copy>
            <View style={{ flex: 1 }}>
              <Bar value={fatigue} max={100} color={t.color.gold} />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export function Header({
  title,
  subtitle,
  back = true,
  portrait,
  expedition = false,
  onSettings,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  portrait?: number;
  expedition?: boolean;
  onSettings?: () => void;
}) {
  const inset = useSafeAreaInsets();
  if (expedition)
    return (
      <ExpeditionHeader
        title={title}
        subtitle={subtitle}
        onSettings={onSettings}
      />
    );
  return (
    <View
      style={[
        styles.header,
        { paddingTop: 10 + inset.top, minHeight: 68 + inset.top },
      ]}
    >
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
  if (state.phase !== "town") return null;
  return (
    <NativeNavbar
      active={active}
      tabs={tabs}
      onSelect={(path) => router.replace(path as (typeof tabs)[number]["path"])}
    />
  );
}
export function SettingsControls() {
  const { state, dispatch } = useGame();
  return (
    <View style={{ gap: 9 }}>
      <Button
        label={`Sound ${state.sound ? "on" : "off"}`}
        icon={state.sound ? "volume-high" : "volume-off"}
        small
        tone={state.sound ? "blue" : "dark"}
        onPress={() =>
          dispatch({ type: "SETTING", key: "sound", value: !state.sound })
        }
      />
      <Button
        label={`Haptics ${state.haptics ? "on" : "off"}`}
        icon="vibrate"
        small
        tone={state.haptics ? "blue" : "dark"}
        onPress={() =>
          dispatch({ type: "SETTING", key: "haptics", value: !state.haptics })
        }
      />
    </View>
  );
}
function WalkthroughCard() {
  const { state, dispatch } = useGame();
  const pathname = usePathname();
  const tip = walkthroughTip(state);
  if (!tip) return null;
  const minimized = state.walkthrough.minimized;
  return (
    <View
      style={{
        backgroundColor: "#0c1b29",
        borderBottomWidth: 1,
        borderColor: t.color.goldDim,
        paddingHorizontal: 14,
        paddingVertical: minimized ? 5 : 9,
        gap: 5,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            minimized ? "Expand walkthrough" : "Collapse walkthrough"
          }
          onPress={() => dispatch({ type: "WALKTHROUGH", kind: "toggle" })}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            minHeight: 30,
          }}
        >
          <Icon name="compass-outline" size={18} color={t.color.gold} />
          <Copy
            style={{
              fontFamily: t.font.bold,
              color: t.color.goldLight,
              fontSize: 15,
              flex: 1,
            }}
          >
            {tip.title}
          </Copy>
          <Icon name={minimized ? "chevron-down" : "chevron-up"} size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip walkthrough"
          onPress={() => dispatch({ type: "WALKTHROUGH", kind: "skip" })}
          hitSlop={5}
          style={{ padding: 5, minHeight: 30, justifyContent: "center" }}
        >
          <Copy muted style={{ fontSize: 12 }}>
            Skip
          </Copy>
        </Pressable>
      </View>
      {!minimized && (
        <>
          <Copy style={{ fontSize: 13, lineHeight: 17 }}>{tip.body}</Copy>
          {(tip.acknowledge ||
            (tip.destination && pathname !== tip.destination)) && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
              {tip.destination && pathname !== tip.destination && (
                <View style={{ flex: 1 }}>
                  <Button
                    label={tip.button!}
                    small
                    tone="blue"
                    onPress={() => router.push(tip.destination!)}
                  />
                </View>
              )}
              {tip.acknowledge && (
                <View style={{ flex: 1 }}>
                  <Button
                    label={
                      tip.id === "complete" || tip.id === "return"
                        ? "Finish walkthrough"
                        : "Got it"
                    }
                    small
                    tone="dark"
                    onPress={() =>
                      dispatch({ type: "WALKTHROUGH", kind: "ack", id: tip.id })
                    }
                  />
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}
export function Frame({
  children,
  background,
  backdrop,
  active,
  title,
  subtitle,
  back,
  portrait,
  scroll = true,
  hideNav = false,
  fullBleed = false,
  expedition = false,
}: {
  children: React.ReactNode;
  background?: ImageSource;
  backdrop?: React.ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  back?: boolean;
  portrait?: number;
  scroll?: boolean;
  hideNav?: boolean;
  fullBleed?: boolean;
  expedition?: boolean;
}) {
  const [settings, setSettings] = useState(false);
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    state,
    dispatch,
    saveError,
    retrySave,
    pendingTownAction,
    confirmTownAction,
  } = useGame();
  const showNotice =
    /^(You need|Not enough|Select |Choose |You cannot|You do not|No |This contract|The merchant asks|A full training|Your companions|Your party holds|Training costs|Find the upward portal|The return gate is sealed|Make room|Rest your party)/i.test(
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
            paddingTop: fullBleed || title ? 0 : inset.top,
            paddingBottom:
              fullBleed ||
              (active && !hideNav && !expedition && state.phase === "town")
                ? 0
                : inset.bottom,
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
        {backdrop}
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
            expedition={expedition}
            onSettings={() => setSettings(true)}
          />
        )}
        {title && !fullBleed && <WalkthroughCard />}
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
        {showNotice && !(fullBleed && expedition) && (
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
        {!hideNav && !expedition && active && <Nav active={active} />}
        {pendingTownAction && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 30,
                backgroundColor: "rgba(3,8,14,.92)",
                paddingHorizontal: 22,
                justifyContent: "center",
              },
            ]}
          >
            <Panel style={{ gap: 15, borderColor: t.color.goldDim }}>
              <Copy title style={{ textAlign: "center" }}>
                Skip this opening?
              </Copy>
              <Copy>
                The labyrinth is open today.{" "}
                {pendingTownAction.type === "TRAIN"
                  ? "Training"
                  : pendingTownAction.type === "WORK"
                    ? "Working"
                    : "Resting"}{" "}
                takes a day. The next opening is in 30 days.
              </Copy>
              <Button
                label="Keep the opening"
                tone="blue"
                onPress={() => confirmTownAction(false)}
              />
              <Button
                label="Skip opening and continue"
                tone="dark"
                onPress={() => confirmTownAction(true)}
              />
            </Panel>
          </View>
        )}
        {settings && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 20,
                backgroundColor: "rgba(3,8,14,.88)",
                paddingTop: inset.top + 65,
                paddingHorizontal: 22,
              },
            ]}
          >
            <Panel style={{ gap: 16, borderColor: t.color.goldDim }}>
              <Copy title style={{ textAlign: "center" }}>
                Settings
              </Copy>
              <SettingsControls />
              <Button
                label="Try pixel combat"
                tone="blue"
                onPress={() => router.push("/combat-trial")}
              />
              <Button
                label={
                  title === "Combat trial"
                    ? "Resume fight"
                    : "Resume expedition"
                }
                onPress={() => setSettings(false)}
              />
            </Panel>
          </View>
        )}
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
