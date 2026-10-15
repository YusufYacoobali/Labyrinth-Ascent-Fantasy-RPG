import { StoryLeads, StoryScene } from "@/components/story-journal";
import TacticalCombat from "@/components/tactical-combat";
import { EventArt } from "@/components/story-art";
import { StoryCard } from "@/components/story-card";
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
import {
  Reveal,
  useCombatFeedback,
  useExpeditionAmbience,
} from "@/components/combat-motion";
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
  TeamCondition,
  RouteMap,
  MissionTracker,
} from "./exploration-scenes";
import { EVENTS, FLOORS, ITEMS, ROUTES } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { FieldSupplies } from "@/components/field-supplies";
import { Arrival } from "./arrival";
import { theme as t } from "@/theme";

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
                : `${30 - state.food} more party rations cover the full month; forage and trade can help inside.`}
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

function FloorEvent({
  feedback,
}: {
  feedback: ReturnType<typeof useCombatFeedback>;
}) {
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
      <EventArt floor={state.floor} label={event.title} />
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
                feedback("reward");
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
      <Panel style={{ gap: 8 }}>
        <Copy>Gold found: {loot.gross}</Copy>
        {Object.entries(loot.shares).map(([id, amount]) => (
          <Copy key={id} muted>
            {state.party.find((c) => c.id === id)?.name || id}: {amount} gold
            held for extraction
          </Copy>
        ))}
        <Copy>Your gold: {loot.net}</Copy>
      </Panel>
      <Panel style={{ gap: 8 }}>
        <Eyebrow>ENEMIES DEFEATED</Eyebrow>
        {(loot.enemies || [{ id: loot.id, name: loot.name }]).map((enemy) => (
          <Copy key={enemy.id}>{enemy.name}</Copy>
        ))}
        <Eyebrow>RECOVERED</Eyebrow>
        {Object.entries(loot.items).map(([id, amount]) => (
          <Copy key={id}>
            {amount} × {ITEMS.find((i) => i.id === id)?.name || id}
          </Copy>
        ))}
        {!Object.keys(loot.items).some((id) => id.startsWith("essence-")) && (
          <Copy muted>No essence this time · 30% chance per monster</Copy>
        )}
      </Panel>
      <Panel style={{ gap: 8 }}>
        <Eyebrow>PARTY EXPERIENCE</Eyebrow>
        {loot.xp.map((p) => (
          <Copy key={p.id}>
            {p.name} · +{p.amount} XP
            {p.after > p.before ? ` · Level ${p.before} → ${p.after}` : ""}
          </Copy>
        ))}
      </Panel>
      <Copy muted>
        Spoils are unsecured until extraction. Bind essences in town or shelter;
        field-found powers are lost on defeat.
      </Copy>
      <Button label="Continue" onPress={() => dispatch({ type: "COLLECT" })} />
    </View>
  );
}
function Victory() {
  const { state, dispatch } = useGame();
  const extracted = state.phase === "extraction";
  const final = state.floor === 12 && !!state.ending;
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
            {extracted
              ? "Homeward"
              : final
                ? "Legend"
                : state.journey.portal
                  ? "Portal Found"
                  : "Battle Won"}
          </Copy>
          <Copy title style={{ fontSize: 16, color: t.color.gold }}>
            {extracted
              ? "The return gate is open"
              : final
                ? state.ending
                : state.journey.portal
                  ? `Floor ${state.floor} · the next ascent awaits`
                  : "The team catches its breath"}
          </Copy>
        </View>
      </Reveal>
      <TeamCondition />
      {!extracted && !final && <RouteMap />}
      <MissionTracker />
      <Copy style={{ fontSize: 14, lineHeight: 20 }}>
        {extracted
          ? state.expedition.lost
            ? "The party is brought home after defeat. Unsecured spoils and provisional skills were lost; earlier progress remains."
            : state.party.some((c) => c.hp <= 0)
              ? "Thirty days inside. You gather the fallen, pack the spoils, and step toward Stormhold."
              : "Thirty days inside. Your companions pack the spoils and check the final headcount. Stormhold is waiting."
          : final
            ? "The crown is yours. Find shelter while the last days pass, then take your story home."
            : state.journey.portal
              ? "The arch pulses blue. Look at the team’s condition: climb while you can, or let everyone recover in shelter."
              : "The enemy falls silent. Your companions check wounds and count supplies. The next floor is beyond a portal you still need to find."}
      </Copy>
      <Panel style={{ padding: 13, gap: 8 }}>
        {[
          ["Enemies defeated", state.runKills],
          ["Gold earned after shares", state.runGold],
          ["Gold found before shares", state.runGross],
          [
            "Companion shares held for extraction",
            Object.values(
              state.phase === "town"
                ? state.runPaid
                : state.expedition.accruedShares,
            ).reduce((n, gold) => n + gold, 0),
          ],
          [
            "Party standing",
            `${state.party.filter((c) => c.hp > 0).length}/${state.party.length}`,
          ],
          ["Rations left", state.food],
          [
            "Unbound essences",
            Object.entries(state.inventory)
              .filter(([id]) => id.startsWith("essence-"))
              .reduce((n, [, qty]) => n + qty, 0),
          ],
          [
            "Your path",
            state.route
              ? ROUTES.find((r) => r.id === state.route)!.name
              : "Not chosen yet",
          ],
        ]
          .filter(
            (_, i) =>
              (extracted || final || i < 4) &&
              (i !== 7 || state.route !== null),
          )
          .map(([label, n]) => (
            <View
              key={String(label)}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Copy style={{ fontSize: 12 }}>{label}</Copy>
              <Copy style={{ fontSize: 12, color: t.color.goldLight }}>
                {n}
              </Copy>
            </View>
          ))}
      </Panel>
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
          {!final && !state.journey.portal && (
            <Choice
              label="Search for the upward portal"
              detail="Follow connected rooms; discoveries remain on your chart"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
            />
          )}
          {!final && state.journey.portal && (
            <>
              <Button
                label="Step through the upward portal"
                small
                onPress={() => dispatch({ type: "CONTINUE" })}
              />
              <Button
                label="Search more side passages"
                small
                tone="dark"
                onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
              />
            </>
          )}
          <Choice
            label="Find a safe place to rest"
            detail={`${daysRemaining(state)} days remain inside · choose how long to wait`}
            icon="campfire"
            tone="dark"
            onPress={() => dispatch({ type: "SEEK_SHELTER" })}
          />
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
  useExpeditionAmbience();
  const { state, dispatch, ready } = useGame();
  const feedback = useCombatFeedback();
  if (!ready) return null;
  if (state.phase === "town") return <Redirect href="/labyrinth" />;
  const battleFocus = !!state.roundPlayback || state.phase === "combat";
  const event = EVENTS[FLOORS[state.floor - 1]?.event || "camp"];
  const background =
    state.phase === "event"
      ? art[event.art as keyof typeof art]
      : state.phase === "victory" || state.phase === "extraction"
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
          ].includes(state.phase)
            ? undefined
            : background
        }
        active="Labyrinth"
        title={battleFocus ? undefined : title}
        fullBleed={battleFocus}
        subtitle={
          daysRemaining(state) === 0
            ? "Return gate open · thirty-day window complete"
            : `${daysRemaining(state)} days left inside · ${6 - (state.journey.watches % 6)} watches until dawn`
        }
        back={false}
        expedition
        hideNav
        scroll={!battleFocus}
      >
        {!["combat", "loot", "story", "arrival"].includes(state.phase) && (
          <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            <Button
              small
              tone="dark"
              label="Read the expedition journal"
              onPress={() => router.push("/journal")}
            />
          </View>
        )}
        {state.phase === "story" ? (
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
          <FloorEvent feedback={feedback} />
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
        {["exploration", "camp", "victory"].includes(state.phase) && (
          <View style={{ padding: 12 }}>
            <StoryLeads />
          </View>
        )}
      </Frame>
    </Guard>
  );
}
