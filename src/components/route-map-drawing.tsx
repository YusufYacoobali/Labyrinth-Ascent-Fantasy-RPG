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
  onSelect: (id: string) => void;
}
const STEP = 40,
  HEIGHT = 260;
export default function MapCanvas({
  map,
  room,
  facing,
  onSelect,
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
    cy = HEIGHT / 2 - here.y * STEP;
  const transform = useDerivedValue(() => [
    { translateX: panX.get() + width / 2 },
    { translateY: panY.get() + HEIGHT / 2 },
    { scale: scale.get() },
    { translateX: cx - width / 2 },
    { translateY: cy - HEIGHT / 2 },
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
          (e.y - HEIGHT / 2 - panY.get()) / scale.get() - cy + HEIGHT / 2,
        );
    });
  const gesture = Gesture.Simultaneous(pan, pinch, tap);
  return (
    <View style={{ gap: 6 }}>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{
            height: HEIGHT,
            overflow: "hidden",
            backgroundColor: "#091421",
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
                    fog.named.has(a) && fog.named.has(b) ? "#56768e" : "#29394a"
                  }
                  strokeWidth={2}
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
                  {fog.named.has(n.id) &&
                    (n.kind === "camp" || n.kind === "portal") && (
                      <Circle
                        cx={n.x * STEP}
                        cy={n.y * STEP}
                        r={4}
                        color={n.kind === "camp" ? "#8fddaa" : "#b59bff"}
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
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Button
          label="Zoom −"
          small
          tone="dark"
          style={{ flex: 1 }}
          onPress={() => scale.set(Math.max(0.5, scale.get() / 1.25))}
        />
        <Button
          label="Recenter"
          small
          tone="dark"
          style={{ flex: 1 }}
          onPress={() => {
            panX.set(0);
            panY.set(0);
            scale.set(1);
          }}
        />
        <Button
          label="Zoom +"
          small
          tone="dark"
          style={{ flex: 1 }}
          onPress={() => scale.set(Math.min(2.5, scale.get() * 1.25))}
        />
      </View>
    </View>
  );
}
