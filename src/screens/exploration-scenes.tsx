import { GenericEncounterScene } from "@/components/generic-encounter";
import { ShelterBinding } from "@/components/skill-library";
import { directedEncounter } from "@/game/encounter-director";
import { npcAt, npcDescription, WORLD_NPCS } from "@/game/world-npcs";
import React, { useState } from "react";
import { View } from "react-native";
import { art, Atlas, Bar, Button, Choice, Copy } from "@/components/game-ui";
import { SceneImage } from "@/components/scene-motion";
import { EnvironmentArt, EntryArt, PassageArt } from "@/components/story-art";
import { SceneIllustration } from "@/components/scene-illustration";
import {
  NPC_ILLUSTRATIONS,
  ROOM_ILLUSTRATIONS,
  PATROL_ILLUSTRATIONS,
} from "@/game/scene-illustrations";
import { useGame } from "@/game/provider";
import { daysRemaining } from "@/game/engine";
import {
  MISSIONS,
  missionDetails,
  missionProgress,
  roomStory,
  restHereRisk,
  wildCampRisk,
  type Direction,
  type Mission,
} from "@/game/exploration";
import { StoryCard } from "@/components/story-card";
import { NpcPortrait } from "@/components/npc-portrait";
import {
  currentRoom,
  exitsFor,
  encounterKey,
  isFreshEntrance,
} from "@/game/exploration";
import RouteMap from "@/components/route-map";
import { theme as t } from "@/theme";
import { canRestHere } from "@/game/field-rest";

export { default as RouteMap } from "@/components/route-map";
const arrows: Record<Direction, string> = {
  left: "←",
  straight: "↑",
  right: "→",
  back: "↓",
};
export function Directions({ afterMove }: { afterMove?: () => void } = {}) {
  const { state, dispatch } = useGame();
  const exits = exitsFor(state);
  const needsTurn = isFreshEntrance(state);
  const directionButton = (direction: Direction) => (
    <View key={direction} style={{ flex: 1, minHeight: 42 }}>
      {exits.some((exit) => exit.direction === direction) && (
        <Button
          label={
            direction === "back" && needsTurn
              ? "Turn around"
              : `${arrows[direction]} ${direction[0].toUpperCase() + direction.slice(1)}`
          }
          small
          tone="blue"
          style={{ minHeight: 42 }}
          onPress={() => {
            if (direction === "back" && needsTurn)
              dispatch({ type: "TURN_AROUND" });
            else dispatch({ type: "MOVE", direction });
            afterMove?.();
          }}
        />
      )}
    </View>
  );
  return (
    <View style={{ gap: 6 }}>
      {exits.some((e) => e.direction === "straight") && (
        <View
          style={{ width: "50%", alignSelf: "center", flexDirection: "row" }}
        >
          {directionButton("straight")}
        </View>
      )}
      {exits.some((e) => e.direction === "left" || e.direction === "right") && (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {directionButton("left")}
          {directionButton("right")}
        </View>
      )}
      {exits.some((e) => e.direction === "back") && (
        <View
          style={{ width: "50%", alignSelf: "center", flexDirection: "row" }}
        >
          {directionButton("back")}
        </View>
      )}
    </View>
  );
}
export function FieldSurvival() {
  const { state, dispatch } = useGame();
  if (!canRestHere(state)) return null;
  const canCamp = ["exploration", "branch"].includes(state.phase);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {canCamp && (
          <Button
            small
            tone="dark"
            style={{ flex: 1 }}
            label={`Make wild camp · ${state.inventory["camp-kit"] || 0} kit${state.inventory["camp-kit"] === 1 ? "" : "s"}`}
            disabled={!(state.inventory["camp-kit"] > 0)}
            onPress={() => dispatch({ type: "WILD_CAMP" })}
          />
        )}
        <Button
          small
          tone="dark"
          style={{ flex: 1 }}
          label={`Rest here · ${Math.round(restHereRisk(state.floor) * 100)}% ambush`}
          onPress={() => dispatch({ type: "REST_HERE" })}
        />
      </View>
      <Copy muted style={{ fontSize: 11, lineHeight: 16 }}>
        {state.food > 0
          ? "1 day · 1 ration · +25% HP/MP · −35 exhaustion."
          : "1 day · No rations: +10% MP · −20 exhaustion · hunger costs 10% HP."}
        {canCamp
          ? ` Kit camp: ${Math.round(wildCampRisk(state.floor) * 100)}% ambush.`
          : ""}
      </Copy>
    </View>
  );
}
export function MissionTracker() {
  const { state } = useGame();
  const mission = missionDetails(state.journey.mission);
  if (!mission) return null;
  return (
    <Copy style={{ fontSize: 12, color: t.color.gold }}>
      {mission.title} · {Math.min(mission.target, missionProgress(state))}/
      {mission.target}
    </Copy>
  );
}

export function MissionScene({
  onEnter,
  onBack,
}: {
  onEnter?: (mission: Mission) => void;
  onBack?: () => void;
} = {}) {
  const { dispatch } = useGame();
  const [selected, setSelected] = useState<Mission | null>(null);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <SceneImage
        source={art.portal}
        accessibilityLabel="The open portal outside Stormhold"
        contentFit="cover"
        contentPosition="top"
        style={{ width: "100%", aspectRatio: 1.2 }}
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
          Choose your goal before stepping through. The way home will seal for
          thirty days.
        </Copy>
        {MISSIONS.map((m, i) => (
          <Choice
            key={m.id}
            label={m.title}
            detail={m.body}
            icon={i === 0 ? "stairs-up" : "treasure-chest"}
            tone={selected === m.id ? (i === 1 ? "gold" : "blue") : "dark"}
            trailing={selected === m.id ? "Selected" : undefined}
            onPress={() => setSelected(m.id)}
          />
        ))}
        <Button
          label="Portal"
          icon="gate"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            if (onEnter) onEnter(selected);
            else dispatch({ type: "MISSION", id: selected });
          }}
        />
        {onBack && (
          <Button label="Back to preparations" tone="dark" onPress={onBack} />
        )}
      </View>
    </View>
  );
}

export function ExploreScene() {
  const { state, dispatch } = useGame();
  const room = roomStory(state);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      {state.floor === 1 ? (
        <PassageArt directions={exitsFor(state).map((e) => e.direction)} />
      ) : currentRoom(state).id === "entrance" ? (
        <EntryArt
          floor={state.floor}
          route={state.route}
          directions={exitsFor(state).map((e) => e.direction)}
        />
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
  if (
    b.kind === "company" &&
    !npc &&
    state.expedition.generic[encounterKey(state)]
  )
    return <GenericEncounterScene />;
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <SceneIllustration
        illustration={
          resolved
            ? undefined
            : npc
              ? NPC_ILLUSTRATIONS[npc]
              : b.kind === "beast" && plan
                ? PATROL_ILLUSTRATIONS[plan.variant]
                : ROOM_ILLUSTRATIONS[b.kind]
        }
      />
      <StoryCard
        title={
          npc
            ? WORLD_NPCS[npc].name
            : resolved
              ? "Your old marks"
              : b.kind === "beast" && plan
                ? "A patrol ahead"
                : scene.title
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
      </StoryCard>
    </View>
  );
}

export function CampScene() {
  const { state, dispatch } = useGame();
  const standing = state.party.some((c) => c.hp > 0);
  const mission = missionDetails(state.journey.mission);
  return (
    <View style={{ gap: 12, paddingBottom: 20 }}>
      <SceneIllustration
        illustration={
          state.journey.wildCamp
            ? ROOM_ILLUSTRATIONS.wildCamp
            : ROOM_ILLUSTRATIONS.sanctuary
        }
      />
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
          label={
            state.journey.wildCamp
              ? `Rest here · ${Math.round(wildCampRisk(state.floor) * 100)}% ambush`
              : "Rest here · safe"
          }
          detail={
            state.food > 0
              ? "1 day · 1 ration · +25% HP/MP · −35 exhaustion."
              : "1 day · No rations: +10% MP · −20 exhaustion · hunger costs 10% HP."
          }
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
          detail="Keep moving, or use Rest here below to stop now."
          icon="map-outline"
          tone="blue"
          onPress={() => dispatch({ type: "NAG_DECISION" })}
        />
      </StoryCard>
    </View>
  );
}
