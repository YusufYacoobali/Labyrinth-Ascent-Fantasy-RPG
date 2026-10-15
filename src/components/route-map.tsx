import React, { useState } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { Host, BottomSheet } from "@expo/ui";
import { Button, Copy, Panel } from "./game-ui";
import MapCanvas from "./route-map-canvas";
import { useGame } from "@/game/provider";
import {
  currentMapKey,
  floorMap,
  exitsFor,
  encounterKey,
} from "@/game/exploration";
import { visibleRooms, roomName } from "@/game/floor-map";
import { router } from "expo-router";
import { knownPath } from "@/game/known-travel";
import { shortcutReason } from "@/game/shortcuts";
import { theme as t } from "@/theme";
export default function RouteMap({
  fullScreen = false,
}: {
  fullScreen?: boolean;
}) {
  const { height } = useWindowDimensions();
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(fullScreen),
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
  const key = currentMapKey(state);
  const path = selected ? knownPath(state, selected) : [];
  const information: Record<
    string,
    "danger" | "treasure" | "company" | "mystery"
  > = {};
  for (const id of state.expedition.roomVisits?.[key] || []) {
    if (state.journey.resolvedBranches.includes(encounterKey(state, id)))
      continue;
    const kind = state.journey.occupants[key]?.[id];
    if (kind && kind !== "quiet")
      information[id] =
        kind === "beast" || kind === "hazard"
          ? "danger"
          : kind === "cache"
            ? "treasure"
            : kind === "company"
              ? "company"
              : "mystery";
  }
  const doors = (map.shortcuts || []).filter(
    (d) => !d.open && [d.from, d.to].includes(state.journey.room),
  );
  const canTravel =
    ["exploration", "victory", "camp"].includes(state.phase) &&
    !state.journey.wildCamp;
  const adjacent = exitsFor(state).find((e) => e.to === selected);
  const notes = (state.journey.chart[currentMapKey(state)] || []).filter(
    (n) => n.from === selected || n.to === selected,
  );
  return (
    <Panel style={{ padding: 10, gap: 8 }}>
      {!fullScreen && (
        <Button
          small
          compact
          tone="dark"
          label={open ? "Hide floor map" : "Show floor map"}
          onPress={() => setOpen(!open)}
        />
      )}
      {open && (
        <>
          {!fullScreen && (
            <Button
              small
              tone="dark"
              label="Expand map"
              onPress={() => router.push("/map")}
            />
          )}
          <Copy muted style={{ fontSize: 11 }}>
            North ↑ · gold: you · blue: visited · amber: reported · grey:
            unknown
          </Copy>
          <MapCanvas
            map={map}
            room={state.journey.room}
            facing={state.journey.facing}
            onSelect={setSelected}
            selected={selected}
            height={fullScreen ? Math.max(260, height - 330) : 260}
            biome={
              state.route ||
              (state.floor >= 9
                ? "forge"
                : state.floor >= 7
                  ? "frost"
                  : "stone")
            }
            trail={state.expedition.trail?.[key]}
            information={information}
          />
          <Copy muted style={{ fontSize: 11 }}>
            Gold passages: travelled · arch: portal · tent: sanctuary · red
            triangle: known danger · box: treasure · pink circle: travellers ·
            diamond: landmark or mystery
          </Copy>
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
      {canTravel &&
        doors.map((door) => (
          <Button
            key={door.id}
            small
            tone="dark"
            label={`Open shortcut · 1 watch · ${door.requirement === "key" ? "1 labyrinth key" : "survey mechanism"}${shortcutReason(state, map, door) ? ` · ${shortcutReason(state, map, door)}` : ""}`}
            disabled={!!shortcutReason(state, map, door)}
            onPress={() => dispatch({ type: "UNLOCK_SHORTCUT", id: door.id })}
          />
        ))}
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
                  if (fullScreen) router.back();
                }}
              />
            )}
            {canTravel && visited && path.length > 2 && (
              <Button
                label={`Follow known route · ${path.length - 1} watches`}
                onPress={() => {
                  setSelected(null);
                  dispatch({ type: "QUICK_TRAVEL", room: selected! });
                  router.canGoBack() && fullScreen && router.back();
                }}
              />
            )}
            {canTravel && visited && path.length > 2 && (
              <Copy muted>
                Travel uses real passages and stops for encounters, supplies or
                decisions.
              </Copy>
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
