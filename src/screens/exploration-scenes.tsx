import { GenericEncounterScene } from "@/components/generic-encounter";
import { ShelterBinding } from "@/components/skill-library";
import { directedEncounter } from "@/game/encounter-director";
import { npcAt, npcDescription, WORLD_NPCS } from "@/game/world-npcs";
import React from "react";
import { View } from "react-native";
import { art, Atlas, Bar, Button, Choice, Copy } from "@/components/game-ui";
import { StoryArt, EnvironmentArt, EntryArt } from "@/components/story-art";
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
import { NpcPortrait } from "@/components/npc-portrait";
import {
  currentRoom,
  backRoom,
  exitsFor,
  encounterKey,
} from "@/game/exploration";
import RouteMap from "@/components/route-map";
import { theme as t } from "@/theme";

export { default as RouteMap } from "@/components/route-map";
const arrows: Record<Direction, string> = {
  left: "←",
  straight: "↑",
  right: "→",
  back: "↓",
};
export function Directions({ afterMove }: { afterMove?: () => void } = {}) {
  const { state, dispatch } = useGame();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {exitsFor(state).map(({ direction, heading }) => (
          <Button
            key={direction}
            label={`${arrows[direction]} ${direction[0].toUpperCase() + direction.slice(1)} · ${heading}`}
            small
            tone="blue"
            style={{ minWidth: "45%", flexGrow: 1 }}
            onPress={() => {
              dispatch({ type: "MOVE", direction });
              afterMove?.();
            }}
          />
        ))}
      </View>
    </View>
  );
}
function FieldSurvival() {
  const { state, dispatch } = useGame();
  return (
    <View style={{ gap: 6 }}>
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
      {currentRoom(state).id === "entrance" ? (
        <EntryArt floor={state.floor} route={state.route} />
      ) : (
        <EnvironmentArt floor={state.floor} route={state.route} />
      )}
      <StoryCard title={room.title} body={room.body}>
        <RouteMap />
        <Directions />
        <MissionTracker />
        {!!state.message && (
          <Copy style={{ color: t.color.gold, fontSize: 13 }}>
            {state.message}
          </Copy>
        )}
        <FieldSurvival />
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
      </StoryCard>
    </View>
  );
}
const branchScenes = {
  cache: {
    art: art.treasure,
    title: "A hidden treasure chest",
    body: "An ironbound chest waits behind the fallen stones. Its lock is intact. What has been hidden here?",
    choices: [
      {
        id: "careful",
        title: "Check the lock and open it",
        detail: "Safely recover the treasure",
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
  const npc = npcAt(state),
    plan = directedEncounter(state);
  const resolved = state.journey.resolvedBranches.includes(b.id);
  if (b.kind === "company" && state.expedition.generic[encounterKey(state)])
    return <GenericEncounterScene />;
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
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
      <StoryCard
        title={
          npc ? WORLD_NPCS[npc].name : resolved ? "Your old marks" : scene.title
        }
        portrait={npc ? <NpcPortrait id={npc} /> : undefined}
        body={
          resolved
            ? "Already searched this expedition."
            : npc
              ? npcDescription(state, npc)
              : plan && b.kind === "beast"
                ? plan.approach
                : scene.body
        }
      >
        {!resolved &&
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
        {!resolved && npc === "tamsin" && (
          <Choice
            label={`Trade two monster cores for ${(state.npcs?.tamsin?.trust || 0) >= 3 ? "four" : "three"} rations`}
            detail="One trade this expedition; field-found cores produce unsecured rations"
            icon="sack"
            disabled={(state.inventory["beast-core"] || 0) < 2}
            onPress={() =>
              dispatch({ type: "BRANCH_CHOICE", choice: "trade", roll: 1 })
            }
          />
        )}
        {!resolved && npc === "sable" && (
          <>
            <Choice
              label="Claim the disputed salvage"
              detail="80 unsecured gold; Sable's trust falls by three"
              icon="gold"
              onPress={() =>
                dispatch({ type: "BRANCH_CHOICE", choice: "claim", roll: 1 })
              }
            />
            <Choice
              label="Survey the cache together"
              detail="Requires two trust from earlier meetings; gain a ration and a maintenance key"
              icon="map"
              disabled={(state.npcs?.sable?.trust || 0) < 2}
              onPress={() =>
                dispatch({
                  type: "BRANCH_CHOICE",
                  choice: "cooperate",
                  roll: 1,
                })
              }
            />
          </>
        )}
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
      <EnvironmentArt floor={state.floor} route={state.route} />
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
          label="Back to the map"
          detail="Choose a route to a sanctuary, or use a camping kit."
          icon="map-outline"
          tone="blue"
          onPress={() => dispatch({ type: "NAG_DECISION" })}
        />
      </StoryCard>
    </View>
  );
}
