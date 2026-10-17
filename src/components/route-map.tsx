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
  isFreshEntrance,
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
  const [open, setOpen] = useState(true),
    [selected, setSelected] = useState<string | null>(null);
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
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Button
            small
            dense
            compact
            style={{ flex: 1 }}
            tone="dark"
            label={open ? "Hide map" : "Show map"}
            onPress={() => setOpen(!open)}
          />
        </View>
      )}
      {open && (
        <>
          <MapCanvas
            map={map}
            room={state.journey.room}
            facing={state.journey.facing}
            onSelect={setSelected}
            selected={selected}
            height={fullScreen ? Math.max(130, (height - 230) / 2) : 130}
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
        </>
      )}
      {canTravel &&
        doors.map((door) => (
          <Button
            key={door.id}
            small
            tone="dark"
            label={`Open shortcut · 1 day · ${door.requirement === "key" ? "1 labyrinth key" : "survey mechanism"}${shortcutReason(state, map, door) ? ` · ${shortcutReason(state, map, door)}` : ""}`}
            disabled={!!shortcutReason(state, map, door)}
            onPress={() => dispatch({ type: "UNLOCK_SHORTCUT", id: door.id })}
          />
        ))}
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
                label={
                  adjacent.direction === "back" && isFreshEntrance(state)
                    ? "Turn to face this passage"
                    : `Travel ${adjacent.direction} · ${adjacent.heading}`
                }
                onPress={() => {
                  setSelected(null);
                  dispatch(
                    adjacent.direction === "back" && isFreshEntrance(state)
                      ? { type: "TURN_AROUND" }
                      : { type: "MOVE", direction: adjacent.direction },
                  );
                  if (fullScreen) router.back();
                }}
              />
            )}
            {canTravel && visited && path.length > 2 && (
              <Button
                label={`Follow known route · ${path.length - 1} days`}
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
