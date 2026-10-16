import React, { useState } from "react";
import { View } from "react-native";
import {
  Canvas,
  Group,
  Circle,
  Line,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  visibleRooms,
  HEADINGS,
  type FloorMap,
  type Heading,
} from "@/game/floor-map";
import { Button } from "./game-ui";
export interface MapCanvasProps {
  map: FloorMap;
  room: string;
  facing: Heading;
  height?: number;
  selected?: string | null;
  trail?: string[];
  information?: Record<string, "danger" | "treasure" | "company" | "mystery">;
  biome?: string;
  onSelect: (id: string) => void;
}
const STEP = 40;
export default function MapCanvas({
  map,
  room,
  facing,
  onSelect,
  height = 130,
  selected,
  trail = [],
  information = {},
  biome = "stone",
}: MapCanvasProps) {
  const [width, setWidth] = useState(300);
  const panX = useSharedValue(0),
    panY = useSharedValue(0),
    scale = useSharedValue(1),
    startX = useSharedValue(0),
    startY = useSharedValue(0),
    startScale = useSharedValue(1);
  const here = map.nodes[room] || map.nodes.entrance;
  const cx = width / 2 - here.x * STEP,
    cy = height / 2 - here.y * STEP;
  const transform = useDerivedValue(() => [
    { translateX: panX.get() + width / 2 },
    { translateY: panY.get() + height / 2 },
    { scale: scale.get() },
    { translateX: cx - width / 2 },
    { translateY: cy - height / 2 },
  ]);
  const fog = visibleRooms(map),
    rooms = Object.values(map.nodes).filter((n) => fog.visible.has(n.id));
  const edges: [string, string][] = [];
  const seen = new Set<string>();
  for (const a of rooms)
    for (const b of Object.values(a.exits)) {
      const key = [a.id, b].sort().join(":");
      if (
        !seen.has(key) &&
        fog.visible.has(b) &&
        (fog.named.has(a.id) || fog.named.has(b))
      ) {
        seen.add(key);
        edges.push([a.id, b]);
      }
    }
  const select = (x: number, y: number) => {
    const selected = rooms.find(
      (n) => Math.hypot(n.x * STEP - x, n.y * STEP - y) < 18,
    );
    if (selected) onSelect(selected.id);
  };
  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      startX.set(panX.get());
      startY.set(panY.get());
    })
    .onUpdate((e) => {
      panX.set(Math.max(-900, Math.min(900, startX.get() + e.translationX)));
      panY.set(Math.max(-900, Math.min(900, startY.get() + e.translationY)));
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.set(scale.get());
    })
    .onUpdate((e) =>
      scale.set(Math.max(0.5, Math.min(2.5, startScale.get() * e.scale))),
    );
  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((e, success) => {
      if (success)
        scheduleOnRN(
          select,
          (e.x - width / 2 - panX.get()) / scale.get() - cx + width / 2,
          (e.y - height / 2 - panY.get()) / scale.get() - cy + height / 2,
        );
    });
  const gesture = Gesture.Simultaneous(pan, pinch, tap);
  return (
    <View style={{ gap: 6 }}>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{
            height: height,
            overflow: "hidden",
            backgroundColor:
              biome === "roots"
                ? "#0b1c18"
                : biome === "forge"
                  ? "#24140f"
                  : biome === "crypt"
                    ? "#191324"
                    : biome === "frost"
                      ? "#0c1c2b"
                      : "#091421",
            borderRadius: 8,
          }}
          accessible={false}
        >
          <Canvas style={{ flex: 1 }}>
            <Group transform={transform}>
              {edges.map(([a, b]) => (
                <Line
                  key={`${a}:${b}`}
                  p1={vec(map.nodes[a].x * STEP, map.nodes[a].y * STEP)}
                  p2={vec(map.nodes[b].x * STEP, map.nodes[b].y * STEP)}
                  color={
                    trail.includes([a, b].sort().join(":"))
                      ? "#e5bc6a"
                      : fog.named.has(a) && fog.named.has(b)
                        ? "#56768e"
                        : "#29394a"
                  }
                  strokeWidth={trail.includes([a, b].sort().join(":")) ? 4 : 2}
                />
              ))}
              {rooms.map((n) => (
                <Group key={n.id}>
                  <Circle
                    cx={n.x * STEP}
                    cy={n.y * STEP}
                    r={n.id === room ? 10 : 7}
                    color={
                      n.id === room
                        ? "#e5bc6a"
                        : map.explored.includes(n.id)
                          ? "#66bddb"
                          : map.known.includes(n.id)
                            ? "#aa8041"
                            : "#33475b"
                    }
                  />
                  {selected === n.id && (
                    <Circle
                      cx={n.x * STEP}
                      cy={n.y * STEP}
                      r={14}
                      color="#ffffff"
                      style="stroke"
                      strokeWidth={2}
                    />
                  )}
                  {fog.named.has(n.id) && n.kind === "portal" && (
                    <Path
                      path={`M ${n.x * STEP - 5} ${n.y * STEP + 5} l 0 -7 q 5 -8 10 0 l 0 7 z`}
                      color="#b59bff"
                    />
                  )}
                  {fog.named.has(n.id) && n.kind === "camp" && (
                    <Path
                      path={`M ${n.x * STEP} ${n.y * STEP - 6} l -6 11 l 12 0 z`}
                      color="#8fddaa"
                    />
                  )}
                  {fog.named.has(n.id) && n.kind === "landmark" && (
                    <Path
                      path={`M ${n.x * STEP} ${n.y * STEP - 6} l -5 6 l 5 6 l 5 -6 z`}
                      color="#fff1bd"
                    />
                  )}
                  {information[n.id] === "danger" && (
                    <Path
                      path={`M ${n.x * STEP} ${n.y * STEP - 6} l -5 10 l 10 0 z`}
                      color="#ee7968"
                    />
                  )}
                  {information[n.id] === "treasure" && (
                    <Path
                      path={`M ${n.x * STEP - 5} ${n.y * STEP - 3} l 10 0 l 0 7 l -10 0 z`}
                      color="#f8d88b"
                    />
                  )}
                  {information[n.id] === "company" && (
                    <Circle
                      cx={n.x * STEP}
                      cy={n.y * STEP}
                      r={4}
                      color="#efc1ef"
                    />
                  )}
                  {information[n.id] === "mystery" && (
                    <Path
                      path={`M ${n.x * STEP} ${n.y * STEP - 6} l -4 6 l 4 6 l 4 -6 z`}
                      color="#a5b2c8"
                    />
                  )}
                </Group>
              ))}
              <Group
                origin={vec(here.x * STEP, here.y * STEP)}
                transform={[
                  { rotate: (HEADINGS.indexOf(facing) * Math.PI) / 2 },
                ]}
              >
                <Path
                  path={`M ${here.x * STEP} ${here.y * STEP - 19} l -5 8 l 10 0 z`}
                  color="#fff1bd"
                />
              </Group>
            </Group>
          </Canvas>
        </View>
      </GestureDetector>
      <View style={{ position: "absolute", right: 8, bottom: 8 }}>
        <Button
          label="Recenter"
          small
          compact
          dense
          tone="dark"
          onPress={() => {
            panX.set(0);
            panY.set(0);
            scale.set(1);
          }}
        />
      </View>
    </View>
  );
}
