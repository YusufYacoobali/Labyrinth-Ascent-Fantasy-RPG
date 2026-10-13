import React, { useState } from "react";
import { View } from "react-native";
import {
  art,
  Atlas,
  Bar,
  Button,
  Choice,
  Copy,
  Panel,
} from "@/components/game-ui";
import { StoryArt } from "@/components/story-art";
import { SceneImage } from "@/components/scene-motion";
import { useGame } from "@/game/provider";
import { daysRemaining } from "@/game/engine";
import {
  MISSIONS,
  missionProgress,
  roomStory,
  type Direction,
} from "@/game/exploration";
import { StoryCard } from "@/components/story-card";
import { currentRoom, floorMap, backRoom } from "@/game/exploration";
import { visibleRooms } from "@/game/floor-map";
import { theme as t } from "@/theme";

export function TeamCondition() {
  const { state } = useGame();
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {state.party.map((c) => (
        <Panel
          key={c.id}
          style={{ flex: 1, padding: 5, gap: 4, alignItems: "center" }}
        >
          <Atlas
            sprite
            index={c.portrait}
            size={45}
            style={{ opacity: c.hp > 0 ? 1 : 0.35 }}
          />
          <Copy numberOfLines={1} style={{ fontSize: 11, lineHeight: 14 }}>
            {c.name}
          </Copy>
          <View style={{ alignSelf: "stretch", gap: 3 }}>
            <Bar color={t.color.green} value={c.hp} max={c.maxHp} />
            <Bar value={c.mp} max={c.maxMp} />
          </View>
          <Copy
            style={{
              fontSize: 10,
              lineHeight: 13,
              color: c.hp ? t.color.text : t.color.red,
            }}
          >
            {c.hp ? `${c.hp}/${c.maxHp} HP` : "Fallen"}
          </Copy>
          <Copy muted style={{ fontSize: 10, lineHeight: 12 }}>
            {c.mp} MP
          </Copy>
        </Panel>
      ))}
    </View>
  );
}
const arrows: Record<Direction, string> = {
  left: "←",
  right: "→",
  straight: "↑",
};
export function RouteMap() {
  const { state } = useGame();
  const [width, setWidth] = useState(300);
  const [open, setOpen] = useState(false);
  const map = floorMap(state);
  const { named, visible } = visibleRooms(map);
  const rooms = Object.values(map.nodes).filter((n) => visible.has(n.id));
  const point = (n: (typeof rooms)[number]) => ({
    x: 12 + (n.x / 6.5) * (width - 28),
    y: 12 + n.y * 25,
  });
  const edges = new Set<string>();
  const links: [(typeof rooms)[number], (typeof rooms)[number]][] = [];
  for (const room of rooms)
    for (const id of Object.values(room.exits)) {
      if (!visible.has(id)) continue;
      if (!named.has(room.id) && !named.has(id)) continue;
      const key = [room.id, id].sort().join(":");
      if (!edges.has(key)) {
        edges.add(key);
        links.push([room, map.nodes[id]]);
      }
    }
  const icons = {
    monster: "⚔",
    story: "◇",
    crossroads: "·",
    treasure: "◆",
    npc: "♟",
    spring: "≈",
    trap: "!",
    portal: "♜",
    camp: "△",
    "dead-end": "×",
  };
  return (
    <Panel style={{ padding: 10, gap: 7 }}>
      <Button
        small
        compact
        tone="dark"
        label={open ? "Hide floor map" : "Show floor map"}
        onPress={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <View
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={{ height: 233, position: "relative" }}
          >
            {links.map(([a, b]) => {
              const p = point(a),
                q = point(b);
              const length = Math.hypot(q.x - p.x, q.y - p.y);
              return (
                <View
                  key={[a.id, b.id].sort().join(":")}
                  style={{
                    position: "absolute",
                    left: (p.x + q.x) / 2 - length / 2,
                    top: (p.y + q.y) / 2,
                    width: length,
                    height: 1,
                    backgroundColor:
                      named.has(a.id) && named.has(b.id)
                        ? "#58839f"
                        : "#263e52",
                    transform: [
                      { rotate: Math.atan2(q.y - p.y, q.x - p.x) + "rad" },
                    ],
                  }}
                />
              );
            })}
            {rooms.map((n) => {
              const p = point(n),
                known = named.has(n.id),
                here = n.id === state.journey.room;
              return (
                <View
                  key={n.id}
                  accessibilityLabel={
                    here
                      ? "Current room"
                      : known
                        ? n.kind +
                          (map.explored.includes(n.id)
                            ? ", explored"
                            : ", reported")
                        : "Unexplored passage"
                  }
                  style={{
                    position: "absolute",
                    left: p.x - 8,
                    top: p.y - 8,
                    width: 17,
                    height: 17,
                    borderRadius: n.kind === "crossroads" ? 9 : 3,
                    borderWidth: here ? 2 : 1,
                    borderColor: here
                      ? t.color.goldLight
                      : known
                        ? "#7097b3"
                        : "#38526a",
                    backgroundColor: here
                      ? "#806036"
                      : known
                        ? "#173449"
                        : "#091421",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Copy
                    style={{
                      fontSize: 10,
                      lineHeight: 12,
                      color: here ? t.color.goldLight : "#b3d9ee",
                    }}
                  >
                    {known ? icons[n.kind] : "?"}
                  </Copy>
                </View>
              );
            })}
          </View>
          <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
            Gold: you · blue: explored · ?: unseen · △ shelter · ♜ portal. Lines
            are actual connected passages. Rumours reveal reported rooms.
          </Copy>
        </>
      )}
      <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
        {map.explored.length} rooms explored ·{" "}
        {map.known.filter((id) => !map.explored.includes(id)).length} reported
      </Copy>
    </Panel>
  );
}
export function MissionTracker() {
  const { state } = useGame();
  const mission = MISSIONS.find((m) => m.id === state.journey.mission);
  if (!mission) return null;
  return (
    <Copy style={{ fontSize: 12, color: t.color.gold }}>
      {mission.title} · {Math.min(mission.target, missionProgress(state))}/
      {mission.target}
    </Copy>
  );
}

export function MissionScene() {
  const { dispatch } = useGame();
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <SceneImage
        source={art.cave}
        contentFit="cover"
        style={{ width: "100%", aspectRatio: 1.7 }}
      />
      <View style={{ paddingHorizontal: 15, gap: 12 }}>
        <Copy
          title
          style={{
            color: t.color.goldLight,
            fontSize: 28,
            textAlign: "center",
          }}
        >
          Before the gate seals
        </Copy>
        <Copy>
          The team gathers at the threshold. Thirty days inside. No way home
          until the gate returns. What are you here to do?
        </Copy>
        <TeamCondition />
        {MISSIONS.map((m, i) => (
          <Choice
            key={m.id}
            label={m.title}
            detail={`${m.body} · Guild reward ${m.reward}g`}
            icon={["map-outline", "treasure-chest", "account-group"][i]}
            tone={i === 1 ? "gold" : "blue"}
            onPress={() => dispatch({ type: "MISSION", id: m.id })}
          />
        ))}
      </View>
    </View>
  );
}

export function ExploreScene() {
  const { state, dispatch } = useGame();
  const room = roomStory(state);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <StoryArt group="rooms" index={5} />
      <StoryCard title={room.title} body={room.body}>
        <RouteMap />
        <MissionTracker />
        {!!state.message && (
          <Copy style={{ color: t.color.gold, fontSize: 13 }}>
            {state.message}
          </Copy>
        )}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {(["left", "straight", "right"] as Direction[])
            .filter((d) => currentRoom(state).exits[d])
            .map((direction) => (
              <Button
                key={direction}
                label={`${arrows[direction]} ${direction === "straight" ? "Straight" : direction === "left" ? "Left" : "Right"}`}
                small
                tone="blue"
                style={{ flex: 1 }}
                onPress={() => dispatch({ type: "MOVE", direction })}
              />
            ))}
        </View>
        <TeamCondition />
        {!!backRoom(state) && (
          <Button
            label="Back to the previous room"
            small
            tone="dark"
            onPress={() => dispatch({ type: "MOVE_BACK" })}
          />
        )}
        {currentRoom(state).kind === "portal" && (
          <Button
            label="Return to the portal"
            small
            onPress={() => dispatch({ type: "AT_PORTAL" })}
          />
        )}
        <Button
          label="Find shelter and check the team"
          small
          tone="dark"
          onPress={() => dispatch({ type: "SEEK_SHELTER" })}
        />
      </StoryCard>
    </View>
  );
}
const branchScenes = {
  cache: {
    art: art.treasure,
    title: "Beneath a loose stone",
    body: "A brass latch catches your lantern light. There may be treasure under the floor—but someone took care to hide it.",
    choices: [
      {
        id: "careful",
        title: "Check the latch carefully",
        detail: "Safe treasure; search the compartment",
        icon: "magnify",
      },
      {
        id: "risk",
        title: "Pull it open",
        detail: "A trap could hurt everyone standing",
        icon: "sword",
      },
    ],
  },
  company: {
    art: art.clan,
    title: "Another lantern",
    body: "An exhausted survey team raises empty hands. Their leader has two turns marked on a torn chart. They know something about the floor above.",
    choices: [
      {
        id: "talk",
        title: "Trade route information",
        detail: "Meet this team and learn their route marks",
        icon: "map-outline",
      },
      {
        id: "help",
        title: "Share a ration",
        detail: "−1 ration · earn White Stag trust",
        icon: "sack",
      },
    ],
  },
  spring: {
    art: art.forest,
    title: "Water under the roots",
    body: "Pale roots hang over a shallow spring. Your companions look thirsty. A few roots may be edible; the water is harder to judge.",
    choices: [
      {
        id: "gather",
        title: "Gather cave roots",
        detail: "+2 rations; leave the water alone",
        icon: "sack",
      },
      {
        id: "drink",
        title: "Drink from the spring",
        detail: "+30 HP if clean; a standing elf recognises safe water",
        icon: "water",
      },
    ],
  },
  beast: {
    art: art.dungeon,
    title: "Something feeding",
    body: "Bones crunch in the dark. A solitary hunter has not noticed your team. You can slip back—or clear this corridor and recover its spoils.",
    choices: [
      {
        id: "fight",
        title: "Draw it into the lantern light",
        detail: "An optional fight; your marked route stays intact",
        icon: "sword",
      },
    ],
  },
};
export function BranchScene() {
  const { state, dispatch } = useGame();
  const b = state.journey.branch;
  if (!b) return null;
  const scene = branchScenes[b.kind];
  const resolved = state.journey.resolvedBranches.includes(b.id);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      {currentRoom(state).kind === "dead-end" ? (
        <StoryArt group="eventsB" index={5} />
      ) : (
        <StoryArt
          group="rooms"
          index={
            b.kind === "cache"
              ? 0
              : b.kind === "company"
                ? 1
                : b.kind === "spring"
                  ? 2
                  : 3
          }
        />
      )}
      <StoryCard
        title={
          currentRoom(state).kind === "dead-end"
            ? "The passage ends"
            : resolved
              ? "Your old marks"
              : scene.title
        }
        body={
          currentRoom(state).kind === "dead-end"
            ? "Stone closes off the corridor. A narrow opening leads farther into a side chamber, but the main crossing is behind you."
            : resolved
              ? "This room has already been searched this expedition. Your marks point back to the crossing."
              : scene.body
        }
      >
        <TeamCondition />
        {!resolved &&
          currentRoom(state).kind !== "dead-end" &&
          scene.choices.map((c) => (
            <Choice
              key={c.id}
              label={c.title}
              detail={c.detail}
              icon={c.icon}
              disabled={c.id === "help" && state.food < 1}
              onPress={() =>
                dispatch({
                  type: "BRANCH_CHOICE",
                  choice: c.id,
                  roll: Math.random(),
                })
              }
            />
          ))}
        {(["left", "straight", "right"] as Direction[])
          .filter((d) => currentRoom(state).exits[d])
          .map((d) => (
            <Choice
              key={d}
              label={`Take the ${d} passage`}
              detail="Travel to the connected room"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "MOVE", direction: d })}
            />
          ))}
        <Button
          label="Return to the previous room"
          small
          tone="dark"
          onPress={() =>
            dispatch({ type: "BRANCH_CHOICE", choice: "leave", roll: 1 })
          }
        />
      </StoryCard>
    </View>
  );
}

export function CampScene() {
  const { state, dispatch } = useGame();
  const standing = state.party.some((c) => c.hp > 0);
  const mission = MISSIONS.find((m) => m.id === state.journey.mission);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <StoryArt group="rooms" index={4} />
      <StoryCard
        title="The watch room"
        body={
          state.message ||
          "The lantern is sheltered. Your team can rest here until the return gate opens."
        }
      >
        <TeamCondition />
        <Copy muted style={{ fontSize: 13 }}>
          {state.food} rations · {daysRemaining(state)} days until the return
          gate
        </Copy>
        {mission && (
          <Copy style={{ fontSize: 13, color: t.color.gold }}>
            {mission.title}: {Math.min(mission.target, missionProgress(state))}/
            {mission.target}
          </Copy>
        )}
        <Choice
          label="Rest for one day"
          detail="Use 1 ration for 25% HP/MP; without food, forage for 8%"
          icon="campfire"
          onPress={() => dispatch({ type: "CAMP_REST" })}
        />
        <Choice
          label="Keep watch until the gate returns"
          detail="Count down the remaining days in shelter"
          icon="timer-sand"
          tone="blue"
          onPress={() => dispatch({ type: "CAMP_REST", untilClose: true })}
        />
        <Button
          label="The team is ready—carry on"
          disabled={!standing}
          small
          tone="dark"
          onPress={() => dispatch({ type: "LEAVE_CAMP" })}
        />
      </StoryCard>
    </View>
  );
}

export function NagScene() {
  const { state, dispatch } = useGame();
  const nag = state.journey.nag;
  const speaker = state.party.find((c) => c.id === nag?.speaker);
  if (!nag || !speaker) return null;
  return (
    <View style={{ paddingBottom: 20, gap: 10 }}>
      <StoryArt group="rooms" index={5} />
      <StoryCard title={speaker.name + " falls behind"} body={nag.quote}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Atlas index={speaker.portrait} size={62} />
          <View style={{ flex: 1, gap: 6 }}>
            <Copy>{speaker.exhaustion}% exhaustion</Copy>
            <Bar value={speaker.exhaustion} max={100} color={t.color.gold} />
            <Copy muted style={{ fontSize: 12 }}>
              Damage −{Math.round(speaker.exhaustion * 0.3)}% · {speaker.hp}/
              {speaker.maxHp} HP
            </Copy>
          </View>
        </View>
        <Choice
          label="Find a sheltered watch room"
          detail="Move to the adjoining alcove; choose how long to rest"
          icon="tent"
          tone="gold"
          onPress={() => dispatch({ type: "NAG_DECISION", rest: true })}
        />
        <Choice
          label="Ask for one more corridor"
          detail="Keep moving · +4 exhaustion"
          icon="shoe-print"
          tone="red"
          onPress={() => dispatch({ type: "NAG_DECISION", rest: false })}
        />
      </StoryCard>
    </View>
  );
}
