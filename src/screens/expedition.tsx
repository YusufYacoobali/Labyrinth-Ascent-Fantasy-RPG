import { StoryLeads, StoryScene } from "@/components/story-journal";
import TacticalCombat from "@/components/tactical-combat";
import { EventArt } from "@/components/story-art";
import { StoryCard } from "@/components/story-card";
import { RewardItems, RewardItem } from "@/components/reward-items";
import React, { useState } from "react";
import { View } from "react-native";
import { Redirect, router } from "expo-router";
import {
  art,
  Button,
  Choice,
  Copy,
  Eyebrow,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import { Reveal } from "@/components/combat-motion";
import {
  daysToGate,
  floorEnvironment,
  gateOpen,
  daysRemaining,
} from "@/game/engine";
import {
  MissionScene,
  NagScene,
  ExploreScene,
  BranchScene,
  CampScene,
  RouteMap,
  MissionTracker,
} from "./exploration-scenes";
import { EVENTS, FLOORS, ROUTES } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { FieldSupplies } from "@/components/field-supplies";
import { Arrival } from "./arrival";
import { theme as t } from "@/theme";
import { CORE_TRADE_VALUE } from "@/game/monsters";

export function LabyrinthScreen() {
  const { state, dispatch } = useGame();
  const [map, setMap] = useState(false);
  const open = gateOpen(state.day);
  return (
    <Guard>
      <Frame background={art.portal} active="Labyrinth" title="The Labyrinth">
        <View
          style={{
            padding: 20,
            minHeight: 575,
            flex: 1,
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 15,
              }}
            >
              <View style={{ flex: 1, minHeight: 240 }} />
              <Panel
                style={{ width: 126, padding: 10, alignSelf: "flex-start" }}
              >
                <Copy style={{ fontSize: 12, textAlign: "center" }}>
                  Beyond the Gate
                </Copy>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingVertical: 14,
                  }}
                >
                  <Icon name="treasure-chest" size={28} />
                  <Icon name="creation" size={28} color={t.color.blue} />
                </View>
                <Button
                  label={map ? "Hide floors" : "View floors"}
                  small
                  onPress={() => setMap(!map)}
                />
              </Panel>
            </View>
            {map && (
              <Reveal>
                <Panel style={{ marginTop: 18, gap: 10 }}>
                  {FLOORS.filter(
                    (f) =>
                      f.id <= state.bestFloor ||
                      state.knownFloors.includes(f.id),
                  ).map((f) => (
                    <View
                      key={f.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Copy
                        style={{
                          width: 26,
                          color:
                            f.id <= state.bestFloor
                              ? t.color.green
                              : t.color.gold,
                          fontFamily: t.font.bold,
                          fontSize: 12,
                        }}
                      >
                        {String(f.id).padStart(2, "0")}
                      </Copy>
                      <View style={{ flex: 1 }}>
                        <Copy style={{ fontSize: 12, lineHeight: 17 }}>
                          {f.name}
                        </Copy>
                        <Copy muted style={{ fontSize: 10, lineHeight: 14 }}>
                          {f.id <= state.bestFloor
                            ? f.subtitle
                            : "Known from town talk · unexplored"}
                        </Copy>
                      </View>
                      <Icon
                        name={
                          f.id % 3 === 0
                            ? "skull"
                            : f.id === 4
                              ? "directions-fork"
                              : "stairs-up"
                        }
                        size={17}
                      />
                    </View>
                  ))}
                  <Copy muted style={{ textAlign: "center", fontSize: 12 }}>
                    Uncharted floors remain hidden.
                  </Copy>
                </Panel>
              </Reveal>
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Panel style={{ gap: 10 }}>
              {[
                ["account-group", "Recommended party", "3–4 companions"],
                ["stairs-up", "Highest floor", String(state.bestFloor)],
                ["sack", "Rations", `${state.food} days of party food`],
                ["bottle-tonic-plus", "Healing potions", String(state.potions)],
              ].map(([icon, label, n]) => (
                <View
                  key={label}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Icon name={icon} size={18} />
                  <Copy style={{ flex: 1, fontSize: 12 }}>{label}</Copy>
                  <Copy style={{ fontSize: 12 }}>{n}</Copy>
                </View>
              ))}
            </Panel>
            <Panel style={{ gap: 8 }}>
              <Copy title style={{ fontSize: 18 }}>
                Expedition start
              </Copy>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {state.checkpoints.map((floor) => (
                  <Button
                    key={floor}
                    small
                    tone={state.startFloor === floor ? "gold" : "dark"}
                    label={`Floor ${floor}`}
                    onPress={() =>
                      dispatch({
                        type: "SELECT_START",
                        floor,
                        route:
                          floor === 7
                            ? state.startRoute || state.discoveredRoutes[0]
                            : undefined,
                      })
                    }
                  />
                ))}
              </View>
              {state.startFloor === 7 &&
                ROUTES.filter((r) => state.discoveredRoutes.includes(r.id)).map(
                  (r) => (
                    <Button
                      key={r.id}
                      small
                      label={`${state.startRoute === r.id ? "✓ " : ""}${r.name}`}
                      tone="dark"
                      onPress={() =>
                        dispatch({
                          type: "SELECT_START",
                          floor: 7,
                          route: r.id,
                        })
                      }
                    />
                  ),
                )}
              <Copy muted style={{ fontSize: 12 }}>
                Defeat the major guardians on Floors 3, 6 and 9 to unlock the
                next start. Floor 7 follows a route you discovered.
              </Copy>
            </Panel>
            <Panel
              style={{
                alignItems: "center",
                gap: 4,
                borderColor: t.color.goldDim,
              }}
            >
              <Eyebrow>
                {open
                  ? "THE GATE IS OPEN"
                  : `OPENS IN ${daysToGate(state.day)} DAYS`}
              </Eyebrow>
            </Panel>
            <Copy style={{ fontSize: 13 }}>
              Food coverage: {state.food}/30 days.{" "}
              {state.food >= 30
                ? "Prepared for the sealed month."
                : `${30 - state.food} more party rations cover the full month; sanctuary caches and trade can help inside.`}
            </Copy>
            <Button
              label={open ? "Begin expedition" : "Prepare for expedition"}
              icon="gate"
              onPress={() => {
                if (!open) {
                  router.push("/guild");
                  return;
                }
                dispatch({ type: "ENTER" });
                if (state.party.some((c) => c.hp > 0))
                  router.replace("/expedition");
              }}
            />
            <Button
              label={open ? "Buy more supplies" : "Rest at the inn · +1 day"}
              tone="dark"
              onPress={() =>
                open ? router.push("/shop") : dispatch({ type: "REST" })
              }
            />
          </View>
        </View>
      </Frame>
    </Guard>
  );
}

function FloorEvent() {
  const { state, dispatch } = useGame();
  const event = EVENTS[FLOORS[state.floor - 1].event];
  return (
    <View
      style={{
        flex: 1,
        minHeight: 560,
        justifyContent: "flex-start",
        backgroundColor: t.color.bg,
      }}
    >
      <EventArt id={FLOORS[state.floor - 1].event} />
      <StoryCard title={event.title} body={event.body}>
        {state.floor === 8 && state.encounterExamined && (
          <Copy style={{ color: t.color.green, textAlign: "center" }}>
            The blade can be removed safely.
          </Copy>
        )}
        <FieldSupplies />
        {event.choices.map((choice) => {
          const examined =
            state.floor === 8 &&
            choice.id === "examine" &&
            state.encounterExamined;
          return (
            <Choice
              key={choice.id}
              label={choice.title}
              detail={choice.detail}
              icon={choice.icon}
              tone={choice.tone || "gold"}
              disabled={examined}
              onPress={() => {
                dispatch({
                  type: "EVENT",
                  choice: choice.id,
                  roll: -1,
                });
              }}
            />
          );
        })}
      </StoryCard>
    </View>
  );
}
function Loot() {
  const { state, dispatch } = useGame();
  const loot = state.lootReceipt;
  if (!loot) return null;
  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Eyebrow>VICTORY</Eyebrow>
      <Copy title style={{ fontSize: 27 }}>
        {loot.name} defeated
      </Copy>
      <RewardItems items={loot.items} gold={loot.net} />
      {(loot.items["beast-core"] || 0) > 0 && (
        <Copy muted style={{ fontSize: 13 }}>
          Monster cores are crystallised energy. Trade them in town for{" "}
          {CORE_TRADE_VALUE} gold each.
        </Copy>
      )}
      <Panel style={{ gap: 8 }}>
        <Eyebrow>PARTY EXPERIENCE</Eyebrow>
        {loot.xp.map((p) => (
          <RewardItem
            key={p.id}
            icon={
              p.after > p.before ? "arrow-up-bold-circle" : "star-four-points"
            }
            label={
              p.after > p.before
                ? `${p.name} · Lv. ${p.before} → ${p.after}`
                : p.name
            }
            value={`+${p.amount} XP`}
          />
        ))}
      </Panel>
      <Copy muted style={{ fontSize: 12 }}>
        Bring your spoils home to keep them.
      </Copy>
      <Button label="Continue" onPress={() => dispatch({ type: "COLLECT" })} />
    </View>
  );
}
function Discovery() {
  const { state, dispatch } = useGame();
  const found = state.discoveryReceipt;
  if (!found) return null;
  return (
    <View style={{ paddingBottom: 20, gap: 12 }}>
      <View
        style={{
          alignItems: "center",
          paddingTop: 32,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Icon name="treasure-chest" size={72} />
        <Copy title style={{ fontSize: 28, color: t.color.goldLight }}>
          {found.title}
        </Copy>
      </View>
      <View style={{ paddingHorizontal: 18, gap: 12 }}>
        <RewardItems {...found} />
        <Copy muted style={{ fontSize: 12, textAlign: "center" }}>
          Packed for the journey. Bring it home safely.
        </Copy>
        <Button
          label="Continue exploring"
          onPress={() => dispatch({ type: "ACK_DISCOVERY" })}
        />
      </View>
    </View>
  );
}
function Victory() {
  const { state, dispatch } = useGame();
  const extracted = state.phase === "extraction";
  const final = state.floor === 12 && !!state.ending;
  if (!extracted && !final && state.journey.portal)
    return (
      <View style={{ padding: 20, flex: 1, justifyContent: "flex-end" }}>
        <Button label="Portal" onPress={() => dispatch({ type: "CONTINUE" })} />
      </View>
    );
  const summary: [string, string, number][] = [
    ["sword", "Enemies defeated", state.runKills],
    [
      "diamond-stone",
      "Monster cores",
      state.expedition.unsecured.inventory["beast-core"] || 0,
    ],
    ["gold", "Gold collected", state.runGold],
    [
      "creation",
      "Essences",
      Object.entries(state.expedition.unsecured.inventory)
        .filter(([id]) => id.startsWith("essence-"))
        .reduce((n, [, qty]) => n + qty, 0),
    ],
  ];
  const earned = summary.filter(([, , value]) => value > 0);
  return (
    <View
      style={{
        padding: 20,
        gap: 14,
        minHeight: 550,
        flex: 1,
        justifyContent: "flex-end",
      }}
    >
      <Reveal>
        <View style={{ alignItems: "center" }}>
          <Icon name={final ? "crown" : "trophy-outline"} size={39} />
          <Copy
            title
            style={{ fontSize: 42, lineHeight: 52, color: t.color.goldLight }}
          >
            {extracted ? "Homeward" : final ? "Legend" : "Battle Won"}
          </Copy>
          <Copy title style={{ fontSize: 16, color: t.color.gold }}>
            {extracted
              ? "The return gate is open"
              : final
                ? state.ending
                : "The team catches its breath"}
          </Copy>
        </View>
      </Reveal>
      {!extracted && !final && <RouteMap />}
      {!extracted && <MissionTracker />}
      <Copy style={{ fontSize: 14, lineHeight: 20 }}>
        {extracted
          ? state.expedition.lost
            ? "You made it home. Your experience remains; unsecured spoils were lost."
            : state.party.some((c) => c.hp <= 0)
              ? "Gather the fallen. Stormhold is waiting."
              : "Your spoils are packed. Stormhold is waiting."
          : final
            ? "The crown is yours. Find shelter while the last days pass, then take your story home."
            : "Keep exploring to find the upward portal."}
      </Copy>
      {earned.length > 0 && (
        <Panel style={{ padding: 13, gap: 8 }}>
          {earned.map(([icon, label, n]) => (
            <RewardItem
              key={String(label)}
              icon={String(icon)}
              label={String(label)}
              value={n}
            />
          ))}
        </Panel>
      )}
      {extracted ? (
        <Button
          label="Return to town"
          tone="blue"
          small
          onPress={() => {
            dispatch({ type: "RETURN" });
            router.replace("/town");
          }}
        />
      ) : (
        <View style={{ gap: 9 }}>
          {final && (
            <Choice
              label="Explore the summit passages"
              detail="Search the final floor before your watch ends"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
            />
          )}
          {!final && (
            <Choice
              label="Search for the upward portal"
              detail="Follow connected rooms; discoveries remain on your chart"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
            />
          )}
        </View>
      )}
      {!final && !extracted && <FieldSupplies />}
      {state.food < 1 && !final && !extracted && (
        <Copy muted style={{ fontSize: 12, textAlign: "center" }}>
          No rations remain.
        </Copy>
      )}
    </View>
  );
}
export function ExpeditionScreen() {
  const { state, dispatch, ready } = useGame();
  if (!ready) return null;
  if (state.phase === "town") return <Redirect href="/labyrinth" />;
  const battleFocus =
    !state.discoveryReceipt &&
    (!!state.roundPlayback || state.phase === "combat");
  const portalFound =
    !state.discoveryReceipt &&
    state.phase === "victory" &&
    state.journey.portal &&
    !(state.floor === 12 && state.ending);
  const background =
    state.phase === "victory" || state.phase === "extraction"
      ? state.phase === "victory" && state.journey.portal
        ? art.portal
        : art.sanctuary
      : state.phase === "essence"
        ? art.treasure
        : art[floorEnvironment(state.floor, state.route) as keyof typeof art];
  const title =
    state.phase === "extraction"
      ? "Expedition Complete"
      : `Floor ${state.floor}`;
  return (
    <Guard expedition>
      <Frame
        background={
          [
            "combat",
            "event",
            "arrival",
            "mission",
            "exploration",
            "branch",
            "camp",
            "nag",
            "story",
          ].includes(state.phase)
            ? undefined
            : background
        }
        active="Labyrinth"
        title={battleFocus || portalFound ? undefined : title}
        fullBleed={battleFocus}
        subtitle={
          daysRemaining(state) === 0
            ? "Return gate open · thirty-day window complete"
            : `${daysRemaining(state)} days left · Day ${state.day}`
        }
        back={false}
        expedition
        hideNav
        hideWalkthrough={portalFound}
        scroll={!battleFocus}
      >
        {state.discoveryReceipt ? (
          <Discovery />
        ) : state.phase === "story" ? (
          <StoryScene />
        ) : state.roundPlayback ? (
          <TacticalCombat key={state.combat?.id} />
        ) : state.phase === "nag" ? (
          <NagScene />
        ) : state.phase === "mission" ? (
          <MissionScene />
        ) : state.phase === "exploration" ? (
          <ExploreScene />
        ) : state.phase === "branch" ? (
          <BranchScene />
        ) : state.phase === "camp" ? (
          <CampScene />
        ) : state.phase === "arrival" ? (
          <Arrival key={state.floor} />
        ) : state.phase === "combat" ? (
          <TacticalCombat key={state.combat?.id} />
        ) : state.phase === "event" ? (
          <FloorEvent />
        ) : state.phase === "loot" ? (
          <Loot />
        ) : state.phase === "victory" || state.phase === "extraction" ? (
          <Victory />
        ) : state.phase === "defeat" ? (
          <View
            style={{
              padding: 24,
              minHeight: 520,
              justifyContent: "flex-end",
              gap: 18,
            }}
          >
            <Icon name="skull-outline" color={t.color.red} size={60} />
            <Copy title style={{ fontSize: 28 }}>
              The darkness prevailed.
            </Copy>
            <Copy>
              Your party cannot keep fighting. Shelter the fallen and wait for
              the return gate. Unsecured spoils and provisional essence skills
              are lost. Earlier skills and earned experience remain.
            </Copy>
            <Button
              label="Wait for the return gate"
              onPress={() => dispatch({ type: "CAMP_REST", untilClose: true })}
            />
          </View>
        ) : (
          <View
            style={{
              padding: 24,
              gap: 16,
              minHeight: 500,
              justifyContent: "flex-end",
            }}
          >
            <Copy title>Recover what remains</Copy>
            <Copy>Collect gold and supplies.</Copy>
            <Button
              label="Continue"
              onPress={() =>
                dispatch(
                  state.phase === "loot"
                    ? { type: "COLLECT" }
                    : { type: "ENCOUNTER", choice: "leave", roll: 1 },
                )
              }
            />
          </View>
        )}
        {!state.discoveryReceipt &&
          ["exploration", "camp", "victory"].includes(state.phase) && (
            <View style={{ padding: 12 }}>
              <StoryLeads />
            </View>
          )}
      </Frame>
    </Guard>
  );
}
