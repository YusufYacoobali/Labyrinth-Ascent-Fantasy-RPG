import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Host, BottomSheet } from "@expo/ui";
import { Button, Copy, Panel } from "./game-ui";
import MapCanvas from "./route-map-canvas";
import { useGame } from "@/game/provider";
import { currentMapKey, floorMap, exitsFor } from "@/game/exploration";
import { visibleRooms, roomName } from "@/game/floor-map";
import { theme as t } from "@/theme";
export default function RouteMap() {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [list, setList] = useState(false);
  const map = floorMap(state),
    fog = visibleRooms(map),
    room = selected ? map.nodes[selected] : null;
  const visited = !!room && map.explored.includes(room.id),
    reported = !!room && map.known.includes(room.id),
    known = visited || reported;
  const description = (id: string) =>
    `${id === state.journey.room ? "You are here · " : ""}${map.explored.includes(id) ? `${map.nodes[id].kind} · visited` : map.known.includes(id) ? `${map.nodes[id].kind} · reported` : "Unknown adjacent room"}`;
  const adjacent = exitsFor(state).find((e) => e.to === selected);
  const notes = (state.journey.chart[currentMapKey(state)] || []).filter(
    (n) => n.from === selected || n.to === selected,
  );
  return (
    <Panel style={{ padding: 10, gap: 8 }}>
      <Button
        small
        compact
        tone="dark"
        label={open ? "Hide floor map" : "Show floor map"}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Copy muted style={{ fontSize: 11 }}>
            North ↑ · gold: you · blue: visited · amber: reported · grey:
            unknown
          </Copy>
          <MapCanvas
            map={map}
            room={state.journey.room}
            facing={state.journey.facing}
            onSelect={setSelected}
          />
          <Button
            small
            tone="dark"
            label={list ? "Hide accessible room list" : "Accessible room list"}
            onPress={() => setList(!list)}
          />
          {list && (
            <View style={{ gap: 5 }}>
              {[...fog.visible].map((id) => (
                <Button
                  key={id}
                  small
                  tone="dark"
                  label={`${fog.named.has(id) ? roomName(map, id) : `Uncharted passage ${[...fog.visible].indexOf(id) + 1}`} · ${description(id)}`}
                  onPress={() => setSelected(id)}
                />
              ))}
            </View>
          )}
          <Copy muted style={{ fontSize: 11 }}>
            Drag to pan · pinch or use zoom controls · selecting a room only
            inspects it
          </Copy>
        </>
      )}
      <Copy muted style={{ fontSize: 11 }}>
        {map.explored.length} visited ·{" "}
        {map.known.filter((id) => !map.explored.includes(id)).length} reported
      </Copy>
      <Host colorScheme="dark" style={{ position: "absolute" }}>
        <BottomSheet
          isPresented={!!room}
          onDismiss={() => setSelected(null)}
          snapPoints={["half", "full"]}
          contentPadding={16}
          containerColor={t.color.bg}
        >
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            <Copy title>
              {room
                ? known
                  ? roomName(map, room.id)
                  : "Uncharted chamber"
                : ""}
            </Copy>
            <Copy>{room ? description(room.id) : ""}</Copy>
            <Copy>
              {known
                ? "Geography is recorded. Occupants may change each expedition."
                : "Only this opening is visible. Explore it to learn what lies beyond."}
            </Copy>
            {known &&
              Object.entries(room?.exits || {}).map(([heading, to]) => (
                <Copy key={heading}>
                  {heading}:{" "}
                  {fog.named.has(to) ? roomName(map, to) : "unexplored passage"}
                </Copy>
              ))}
            {notes.map((n, i) => (
              <Copy key={i} muted style={{ fontSize: 12 }}>
                {roomName(map, n.from)} → {roomName(map, n.to)}: {n.heading},
                approached facing {n.approach}. {n.source} · {n.confidence}.
              </Copy>
            ))}
            {adjacent && ["exploration", "branch"].includes(state.phase) && (
              <Button
                label={`Travel ${adjacent.direction} · ${adjacent.heading}`}
                onPress={() => {
                  setSelected(null);
                  dispatch({ type: "MOVE", direction: adjacent.direction });
                }}
              />
            )}
            <Button
              label="Close inspection"
              tone="dark"
              onPress={() => setSelected(null)}
            />
          </ScrollView>
        </BottomSheet>
      </Host>
    </Panel>
  );
}
