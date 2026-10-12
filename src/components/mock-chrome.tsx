import React, { useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

export type ChromeTone =
  "gold" | "blue" | "red" | "dark" | "green" | "nav" | "selected";
type Rect = { x: number; y: number; width: number; height: number };
const choice = require("../../assets/ui/choice-reference.png");
const gameplay = require("../../assets/ui/gameplay-reference.png");
const frames: Record<
  ChromeTone,
  {
    source: number;
    size: [number, number];
    rect: Rect;
    colors: [string, string, string, string];
  }
> = {
  gold: {
    source: choice,
    size: [220, 110],
    rect: { x: 7, y: 4, width: 207, height: 29 },
    colors: ["#796342", "#615036", "#52432e", "#685537"],
  },
  blue: {
    source: choice,
    size: [220, 110],
    rect: { x: 7, y: 39, width: 207, height: 30 },
    colors: ["#285b8b", "#1c3c65", "#172e50", "#24496f"],
  },
  red: {
    source: choice,
    size: [220, 110],
    rect: { x: 7, y: 74, width: 207, height: 30 },
    colors: ["#773b3f", "#4c262d", "#3c2028", "#603037"],
  },
  dark: {
    source: gameplay,
    size: [1448, 1086],
    rect: { x: 635, y: 958, width: 77, height: 53 },
    colors: ["#35404c", "#252d38", "#1c242e", "#303a45"],
  },
  green: {
    source: gameplay,
    size: [1448, 1086],
    rect: { x: 979, y: 285, width: 84, height: 27 },
    colors: ["#4c8757", "#2e5538", "#20402d", "#386b43"],
  },
  nav: {
    source: gameplay,
    size: [1448, 1086],
    rect: { x: 366, y: 518, width: 355, height: 62 },
    colors: ["#111a23", "#0b131b", "#080f17", "#080e16"],
  },
  selected: {
    source: gameplay,
    size: [1448, 1086],
    rect: { x: 375, y: 521, width: 62, height: 52 },
    colors: ["#205783", "#173e64", "#102d51", "#1b466e"],
  },
};

/** Clips the original supplied bitmap at render time; the source is never edited. */
export function MockCrop({
  source,
  size,
  rect,
  width,
  height,
}: {
  source: number;
  size: [number, number];
  rect: Rect;
  width: number;
  height: number;
}) {
  const sx = width / rect.width,
    sy = height / rect.height;
  return (
    <View pointerEvents="none" style={{ width, height, overflow: "hidden" }}>
      <Image
        source={source}
        contentFit="fill"
        cachePolicy="memory-disk"
        style={{
          position: "absolute",
          width: size[0] * sx,
          height: size[1] * sy,
          left: -rect.x * sx,
          top: -rect.y * sy,
        }}
      />
    </View>
  );
}

/** Eight original border strips around a native, darker text surface. */
export function BevelFrame({
  tone = "gold",
  children,
  style,
}: {
  tone?: ChromeTone;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const frame = frames[tone];
  const r = frame.rect;
  const cap = tone === "nav" ? 15 : 8;
  const edge = tone === "nav" ? 3 : 4;
  const pieces = [
    { x: 0, y: 0, w: cap, h: cap, sx: r.x, sy: r.y, sw: cap, sh: cap },
    {
      x: cap,
      y: 0,
      w: width - 2 * cap,
      h: edge,
      sx: r.x + cap,
      sy: r.y,
      sw: r.width - 2 * cap,
      sh: edge,
    },
    {
      x: width - cap,
      y: 0,
      w: cap,
      h: cap,
      sx: r.x + r.width - cap,
      sy: r.y,
      sw: cap,
      sh: cap,
    },
    {
      x: 0,
      y: cap,
      w: edge,
      h: height - 2 * cap,
      sx: r.x,
      sy: r.y + cap,
      sw: edge,
      sh: r.height - 2 * cap,
    },
    {
      x: width - edge,
      y: cap,
      w: edge,
      h: height - 2 * cap,
      sx: r.x + r.width - edge,
      sy: r.y + cap,
      sw: edge,
      sh: r.height - 2 * cap,
    },
    {
      x: 0,
      y: height - cap,
      w: cap,
      h: cap,
      sx: r.x,
      sy: r.y + r.height - cap,
      sw: cap,
      sh: cap,
    },
    {
      x: cap,
      y: height - edge,
      w: width - 2 * cap,
      h: edge,
      sx: r.x + cap,
      sy: r.y + r.height - edge,
      sw: r.width - 2 * cap,
      sh: edge,
    },
    {
      x: width - cap,
      y: height - cap,
      w: cap,
      h: cap,
      sx: r.x + r.width - cap,
      sy: r.y + r.height - cap,
      sw: cap,
      sh: cap,
    },
  ];
  return (
    <View
      onLayout={(e) => {
        const n = e.nativeEvent.layout;
        setSize((old) =>
          Math.abs(old.width - n.width) < 0.2 &&
          Math.abs(old.height - n.height) < 0.2
            ? old
            : { width: n.width, height: n.height },
        );
      }}
      style={[
        {
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#08121b",
        },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={frame.colors}
        locations={[0, 0.18, 0.7, 1]}
        style={[StyleSheet.absoluteFill, { margin: 2 }]}
      />
      {width > 6 &&
        height > 6 &&
        (tone === "gold" || tone === "blue" || tone === "red") && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 3, top: 3 }}
          >
            <MockCrop
              source={choice}
              size={[220, 110]}
              rect={{ x: 50, y: r.y + 4, width: 4, height: r.height - 8 }}
              width={width - 6}
              height={height - 6}
            />
          </View>
        )}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,.10)",
          "transparent",
          "rgba(0,0,0,.13)",
          "transparent",
          "rgba(255,255,255,.05)",
        ]}
        locations={[0, 0.12, 0.5, 0.88, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { margin: 4 }]}
      />
      {width > 0 && height > 0 && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {pieces
            .filter((p) => p.w > 0 && p.h > 0)
            .map((p, i) => (
              <View
                key={i}
                style={{ position: "absolute", left: p.x, top: p.y }}
              >
                <MockCrop
                  source={frame.source}
                  size={frame.size}
                  rect={{ x: p.sx, y: p.sy, width: p.sw, height: p.sh }}
                  width={p.w}
                  height={p.h}
                />
              </View>
            ))}
        </View>
      )}
      {children}
    </View>
  );
}

const glyphs = {
  Home: { x: 395, y: 529, width: 25, height: 25 },
  Party: { x: 459, y: 530, width: 27, height: 25 },
  Labyrinth: { x: 527, y: 528, width: 26, height: 28 },
  Journal: { x: 594, y: 529, width: 27, height: 27 },
  More: { x: 662, y: 532, width: 25, height: 23 },
};
export function NavGlyph({
  name,
  size = 25,
}: {
  name: keyof typeof glyphs;
  size?: number;
}) {
  return (
    <MockCrop
      source={gameplay}
      size={[1448, 1086]}
      rect={glyphs[name]}
      width={size}
      height={size}
    />
  );
}

// Static navigation lettering and icons stay in the original mock artwork.
// Native hit targets supply selection, navigation and accessibility.
export function MockNavbar({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const [width, setWidth] = useState(355),
    scale = width / 355;
  const strips: Record<string, Rect> = {
    Home: { x: 366, y: 518, width: 355, height: 62 },
    Party: { x: 1094, y: 518, width: 350, height: 62 },
    Labyrinth: { x: 4, y: 1019, width: 350, height: 64 },
  };
  const rect = strips[active] || { x: 733, y: 518, width: 350, height: 62 };
  const index = ["Home", "Party", "Labyrinth", "Journal", "More"].indexOf(
    active,
  );
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        width: "100%",
        height: 62 * scale,
        position: "relative",
        backgroundColor: "#09121a",
        isolation: "isolate",
      }}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <MockCrop
          source={gameplay}
          size={[1448, 1086]}
          rect={rect}
          width={width}
          height={62 * scale}
        />
      </View>
      {!strips[active] && index >= 0 && (
        <BevelFrame
          tone="selected"
          style={{
            position: "absolute",
            left: (8 + 67 * index) * scale,
            top: 3 * scale,
            width: 62 * scale,
            height: 52 * scale,
            padding: 5 * scale,
          }}
        >
          <View style={{ mixBlendMode: "screen" }}>
            <MockCrop
              source={gameplay}
              size={[1448, 1086]}
              rect={{ x: 746 + 67 * index, y: 527, width: 50, height: 40 }}
              width={50 * scale}
              height={40 * scale}
            />
          </View>
        </BevelFrame>
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { flexDirection: "row", paddingHorizontal: 8 * scale },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function ChoiceGlyph({
  name,
  size = 26,
}: {
  name: string;
  size?: number;
}) {
  const y = name === "sword" ? 7 : name === "magnify" ? 42 : 77;
  return (
    <MockCrop
      source={choice}
      size={[220, 110]}
      rect={{ x: 22, y, width: 23, height: 23 }}
      width={size}
      height={size}
    />
  );
}
