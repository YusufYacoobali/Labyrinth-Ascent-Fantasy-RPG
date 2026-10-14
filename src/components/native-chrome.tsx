import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TOWN_ITEMS } from "@/game/town-content";
import { theme as t } from "@/theme";

export function ResourceGlyph({
  index,
  size = 23,
}: {
  index: number;
  size?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      <Image
        source={require("../../assets/ui/resources-ui-2.png")}
        cachePolicy="memory-disk"
        contentFit="fill"
        style={{
          position: "absolute",
          width: size * 2,
          height: size * 2,
          left: -(index % 2) * size,
          top: -Math.floor(index / 2) * size,
        }}
      />
    </View>
  );
}

export function ItemGlyph({ id, size = 36 }: { id: string; size?: number }) {
  const supplies: Record<string, number> = {
    rations: 0,
    potion: 1,
    antidote: 2,
    ether: 3,
    "greater-potion": 4,
    "beast-core": 5,
    "night-herb": 6,
    "iron-ore": 7,
    "frost-charm": 9,
    "ember-mail": 10,
    "venom-ring": 11,
  };
  const equipment: Record<string, number> = {
    "iron-blade": 0,
    dawnsteel: 0,
    leather: 1,
    "crown-fragment": 7,
    "iron-helm": 2,
    "warden-helm": 2,
    "scout-boots": 4,
    "frost-boots": 4,
  };
  const townIndex = TOWN_ITEMS.findIndex((i) => i.id === id);
  const index =
    townIndex >= 0 ? townIndex : (supplies[id] ?? equipment[id] ?? 5);
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      <Image
        source={
          townIndex >= 0
            ? require("../../assets/ui/town-item-icons.png")
            : supplies[id] !== undefined
              ? require("../../assets/ui/supply-icons.png")
              : require("../../assets/art/items.png")
        }
        contentFit="fill"
        cachePolicy="memory-disk"
        style={{
          position: "absolute",
          width: size * 4,
          height: size * (townIndex >= 0 ? 4 : 3),
          left: -(index % 4) * size,
          top: -Math.floor(index / 4) * size,
        }}
      />
    </View>
  );
}

// Only the isolated glyphs are generated artwork. All frames, labels and states are native views.
export function MenuIcon({
  index,
  size = 32,
}: {
  index: number;
  size?: number;
}) {
  const row = Math.floor(index / 4);
  const cropY = [110, 490, 870][row];
  const scale = size / 310;
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      <Image
        source={require("../../assets/ui/menu-icons.png")}
        contentFit="fill"
        cachePolicy="memory-disk"
        style={{
          position: "absolute",
          width: 1280 * scale,
          height: 1280 * scale,
          left: -((index % 4) * 320 + 5) * scale,
          top: -cropY * scale,
        }}
      />
    </View>
  );
}

export function Ornament({ color = t.color.goldDim }: { color?: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginVertical: 5,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: color }} />
      <View
        style={{
          width: 6,
          height: 6,
          borderWidth: 1,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View style={{ flex: 1, height: 1, backgroundColor: color }} />
    </View>
  );
}

export function Surface({
  children,
  parchment = false,
  selected = false,
  style,
}: {
  children: React.ReactNode;
  parchment?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const rim = selected ? "#90ceff" : parchment ? "#d8ae63" : t.color.goldDim;
  return (
    <View
      style={[
        {
          position: "relative",
          borderWidth: 1,
          borderColor: rim,
          borderRadius: 5,
          overflow: "hidden",
          backgroundColor: parchment ? t.color.parchment : "#0b1724",
        },
        selected && { boxShadow: "0 0 8px #2783dd88" },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          parchment
            ? ["#faecd0", "#eddbb5", "#f8e9c9"]
            : ["#182b3b", "#08131e", "#11202d"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {parchment && (
        <Image
          source={require("../../assets/ui/parchment-ui-2.png")}
          pointerEvents="none"
          contentFit="fill"
          cachePolicy="memory-disk"
          style={[StyleSheet.absoluteFill, { opacity: 0.58 }]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            margin: 3,
            borderWidth: 1,
            borderColor: parchment ? "#d6b582" : "#34505e",
            borderRadius: 2,
          },
        ]}
      />
      {children}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <View
          key={corner}
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 9,
            height: 9,
            borderColor: rim,
            borderTopWidth: corner[0] === "t" ? 1 : 0,
            borderBottomWidth: corner[0] === "b" ? 1 : 0,
            borderLeftWidth: corner[1] === "l" ? 1 : 0,
            borderRightWidth: corner[1] === "r" ? 1 : 0,
            top: corner[0] === "t" ? 4 : undefined,
            bottom: corner[0] === "b" ? 4 : undefined,
            left: corner[1] === "l" ? 4 : undefined,
            right: corner[1] === "r" ? 4 : undefined,
          }}
        />
      ))}
    </View>
  );
}

export function TabStrip({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <View
      style={{ flexDirection: "row", gap: 3, padding: 8, paddingVertical: 5 }}
    >
      {tabs.map((label) => (
        <Pressable
          key={label}
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: active === label }}
          onPress={() => onChange(label)}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          <Surface
            parchment={label === active}
            style={{
              minHeight: 37,
              paddingHorizontal: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: t.font.title,
                color: label === active ? "#241d17" : t.color.text,
                fontSize: label.length > 10 ? 13 : label.length > 8 ? 15 : 17,
              }}
            >
              {label}
            </Text>
          </Surface>
        </Pressable>
      ))}
    </View>
  );
}

export function NativeNavbar({
  active,
  tabs,
  onSelect,
}: {
  active: string;
  tabs: readonly { label: string; path: string }[];
  onSelect: (path: string) => void;
}) {
  const inset = useSafeAreaInsets();
  return (
    <View
      accessibilityLabel="Main navigation"
      style={{
        flexDirection: "row",
        padding: 6,
        paddingBottom: 5 + inset.bottom,
        backgroundColor: "#08131e",
        borderTopWidth: 1,
        borderTopColor: t.color.goldDim,
        gap: 2,
      }}
    >
      {tabs.map((tab, index) => {
        const selected = active === tab.label;
        return (
          <Pressable
            key={tab.path}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(tab.path)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 65,
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              opacity: pressed ? 0.7 : 1,
              borderWidth: 1,
              borderColor: selected ? "#7ac7ff" : "transparent",
              borderRadius: 5,
              boxShadow: selected
                ? "inset 0 0 5px #79c2ff, 0 0 7px #1976dc80"
                : undefined,
            })}
          >
            {selected && (
              <LinearGradient
                pointerEvents="none"
                colors={["#164982", "#122b51", "#174983"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 4 }]}
              />
            )}
            <MenuIcon index={index} size={31} />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: t.font.title,
                fontSize: 16,
                color: selected ? "#fff8ec" : "#b8bbc9",
              }}
            >
              {tab.label}
            </Text>
            {selected && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  bottom: -3,
                  width: 5,
                  height: 5,
                  backgroundColor: "#b5e6ff",
                  transform: [{ rotate: "45deg" }],
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
