import { GenericEncounterScene } from "@/components/generic-encounter";
import { ShelterBinding } from "@/components/skill-library";
import React from "react";
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
import {
  currentRoom,
  backRoom,
  exitsFor,
  roomOccupant,
  encounterKey,
} from "@/game/exploration";
import RouteMap from "@/components/route-map";
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
export { default as RouteMap } from "@/components/route-map";
const arrows: Record<Direction, string> = {
  left: "←",
  straight: "↑",
  right: "→",
  back: "↓",
};
function Directions() {
  const { state, dispatch } = useGame();
  return (
    <View style={{ gap: 6 }}>
      <Copy muted style={{ fontSize: 12 }}>
        Facing {state.journey.facing} · directions are relative to you
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {exitsFor(state).map(({ direction, heading }) => (
          <Button
            key={direction}
            label={`${arrows[direction]} ${direction[0].toUpperCase() + direction.slice(1)} · ${heading}`}
            small
            tone="blue"
            style={{ minWidth: "45%", flexGrow: 1 }}
            onPress={() => dispatch({ type: "MOVE", direction })}
          />
        ))}
      </View>
    </View>
  );
}
function FieldSurvival() {
  const { state, dispatch } = useGame();
  const suitable =
      currentRoom(state).kind === "landmark" ||
      roomOccupant(state) === "spring" ||
      currentRoom(state).kind === "dead-end",
    foraged = state.expedition.foraged.includes(encounterKey(state));
  return (
    <View style={{ gap: 6 }}>
      {suitable && (
        <Button
          small
          tone="dark"
          label={foraged ? "This room has been foraged" : "Forage · one watch"}
          disabled={foraged}
          onPress={() => dispatch({ type: "FORAGE" })}
        />
      )}
      <Button
        small
        tone="dark"
        label={`Make wild camp · ${state.inventory["camp-kit"] || 0} camping kits`}
        disabled={!(state.inventory["camp-kit"] > 0)}
        onPress={() => dispatch({ type: "WILD_CAMP" })}
      />
    </View>
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
        <Directions />
        <FieldSurvival />
        <TeamCondition />
        {!!backRoom(state) && (
          <Button
            label="Retrace previous connection"
            small
            tone="dark"
            onPress={() => dispatch({ type: "MOVE_BACK" })}
          />
        )}
        {currentRoom(state).kind === "portal" && (
          <Button
            label={
              state.journey.portal
                ? "Return to the open portal"
                : "Approach the portal defender"
            }
            small
            onPress={() => dispatch({ type: "AT_PORTAL" })}
          />
        )}
        <Button
          label="Check for an adjacent sanctuary"
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
    body: "An exhausted survey team raises empty hands. Their chart records connected rooms and compass headings, with the direction they approached from.",
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
  if (b.kind === "company" && state.expedition.generic[encounterKey(state)])
    return <GenericEncounterScene />;
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
            ? "Stone closes off this chamber. Its single passage is the way you entered."
            : resolved
              ? "This room has already been searched this expedition. Your saved connections remain on the map."
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
                  roll: -1,
                })
              }
            />
          ))}
        <RouteMap />
        <Directions />
        <FieldSurvival />
        <Button
          label="Retrace previous connection"
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
        title={state.journey.wildCamp ? "Wild camp" : "The sanctuary"}
        body={
          state.message ||
          "The lantern is sheltered. Your team can rest here until the return gate opens."
        }
      >
        <TeamCondition />
        {!state.journey.wildCamp && <ShelterBinding />}
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
          detail={`At dawn: 1 party ration, 25% HP/MP and −35 exhaustion. ${state.journey.wildCamp ? `${state.floor <= 4 ? 20 : state.floor <= 8 ? 30 : 40}% interruption risk.` : "Safe from ambush."}`}
          icon="campfire"
          onPress={() => dispatch({ type: "CAMP_REST" })}
        />
        <Choice
          label="Keep watch until the gate returns"
          detail="Apply daily food and rest checks; stop for hunger or an interruption"
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
          label="Check the adjoining sanctuary"
          detail="Only succeeds if a sanctuary is connected here; use the map to reach it"
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
