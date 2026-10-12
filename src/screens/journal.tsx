import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  art,
  Bar,
  Button,
  Copy,
  Divider,
  Eyebrow,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import { questProgress } from "@/game/engine";
import { FLOORS, QUESTS, ROUTES } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";
export function JournalScreen() {
  const { state } = useGame();
  const [tab, setTab] = useState("Chronicle");
  return (
    <Guard>
      <Frame active="Journal" title="Your Journal">
        <View style={{ padding: 17, gap: 14 }}>
          <Panel
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            {[
              ["stairs-up", state.bestFloor, "Best floor"],
              ["skull-outline", state.kills, "Defeated"],
              ["calendar", state.day, "Day"],
            ].map(([icon, n, label]) => (
              <View
                key={String(label)}
                style={{ alignItems: "center", gap: 4 }}
              >
                <Icon name={String(icon)} size={27} />
                <Copy title>{n}</Copy>
                <Copy muted style={{ fontSize: 11 }}>
                  {label}
                </Copy>
              </View>
            ))}
          </Panel>
          {!!state.ending && (
            <Panel style={{ borderColor: t.color.gold }}>
              <Eyebrow>YOUR CAMPAIGN’S ENDING</Eyebrow>
              <Copy title style={{ color: t.color.goldLight, marginTop: 5 }}>
                {state.ending}
              </Copy>
            </Panel>
          )}
          <View style={{ flexDirection: "row", gap: 4 }}>
            {["Chronicle", "Contracts", "Floors"].map((x) => (
              <Button
                key={x}
                label={x}
                small
                tone={tab === x ? "gold" : "dark"}
                style={{ flex: 1 }}
                onPress={() => setTab(x)}
              />
            ))}
          </View>
          {tab === "Chronicle" ? (
            <Panel>
              {state.journal.map((line, i) => (
                <View
                  key={`${i}-${line}`}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: i === state.journal.length - 1 ? 0 : 1,
                    borderBottomColor: t.color.line,
                  }}
                >
                  <Copy
                    style={{
                      fontSize: 12,
                      lineHeight: 19,
                      color: i === 0 ? t.color.goldLight : t.color.muted,
                    }}
                  >
                    {line}
                  </Copy>
                </View>
              ))}
            </Panel>
          ) : tab === "Contracts" ? (
            <>
              {QUESTS.map((q) => (
                <Panel key={q.id} style={{ gap: 8 }}>
                  <Eyebrow>{q.faction}</Eyebrow>
                  <Copy title style={{ fontSize: 18 }}>
                    {q.title}
                  </Copy>
                  <Copy muted style={{ fontSize: 12 }}>
                    {q.description}
                  </Copy>
                  <Bar
                    value={questProgress(state, q.id)}
                    max={q.target}
                    label={`${questProgress(state, q.id)}/${q.target} · ${state.quests[q.id] || "Not accepted"}`}
                  />
                </Panel>
              ))}
              <Button
                label="Manage guild contracts"
                onPress={() => router.push("/guild")}
              />
            </>
          ) : (
            <>
              {state.route && (
                <Panel>
                  <Eyebrow>YOUR CHOSEN ROUTE</Eyebrow>
                  <Copy title style={{ marginTop: 5 }}>
                    {ROUTES.find((r) => r.id === state.route)!.name}
                  </Copy>
                  <Copy muted style={{ fontSize: 12 }}>
                    {ROUTES.find((r) => r.id === state.route)!.description}
                  </Copy>
                </Panel>
              )}
              {FLOORS.map((f) => (
                <Panel
                  key={f.id}
                  style={{
                    padding: 12,
                    gap: 5,
                    borderColor:
                      f.id <= state.bestFloor ? t.color.goldDim : t.color.line,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Copy
                      title
                      style={{
                        color:
                          f.id <= state.bestFloor
                            ? t.color.gold
                            : t.color.muted,
                        fontSize: 23,
                      }}
                    >
                      F{f.id}
                    </Copy>
                    <View style={{ flex: 1 }}>
                      <Copy title style={{ fontSize: 15 }}>
                        {f.id <= state.bestFloor ? f.name : "Uncharted floor"}
                      </Copy>
                      <Copy muted style={{ fontSize: 11 }}>
                        {f.id <= state.bestFloor
                          ? f.subtitle
                          : "Ascend to uncover this chapter."}
                      </Copy>
                    </View>
                    <Icon
                      name={f.id <= state.bestFloor ? "check" : "lock-outline"}
                      size={20}
                      color={
                        f.id <= state.bestFloor ? t.color.green : t.color.muted
                      }
                    />
                  </View>
                  {f.id <= state.bestFloor && (
                    <Copy muted style={{ fontSize: 12 }}>
                      {f.intro}
                    </Copy>
                  )}
                </Panel>
              ))}
            </>
          )}
        </View>
      </Frame>
    </Guard>
  );
}
export function MoreScreen() {
  const { state, dispatch } = useGame();
  const [reset, setReset] = useState(false);
  return (
    <Guard>
      <Frame
        background={art.cover}
        active="More"
        title="The Adventurer’s Guide"
      >
        <View style={{ padding: 18, gap: 14 }}>
          <Panel>
            <Copy title style={{ fontSize: 18 }}>
              Settings
            </Copy>

            <Divider />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                label={`Sound ${state.sound ? "on" : "off"}`}
                icon={state.sound ? "volume-high" : "volume-off"}
                small
                tone={state.sound ? "blue" : "dark"}
                style={{ flex: 1 }}
                onPress={() =>
                  dispatch({
                    type: "SETTING",
                    key: "sound",
                    value: !state.sound,
                  })
                }
              />
              <Button
                label={`Haptics ${state.haptics ? "on" : "off"}`}
                icon="vibrate"
                small
                tone={state.haptics ? "blue" : "dark"}
                style={{ flex: 1 }}
                onPress={() =>
                  dispatch({
                    type: "SETTING",
                    key: "haptics",
                    value: !state.haptics,
                  })
                }
              />
            </View>
          </Panel>
          <Button
            label="How to play in town"
            tone="gold"
            onPress={() => {
              dispatch({ type: "GUIDE", show: true });
              router.replace("/town");
            }}
          />
          <Button
            label="Revisit the introduction"
            tone="dark"
            onPress={() => router.push("/onboarding")}
          />
          <Button
            label="Start a new journey"
            tone="red"
            onPress={() => setReset(true)}
          />
          {reset && (
            <Panel>
              <Copy title style={{ fontSize: 17 }}>
                End this journey?
              </Copy>
              <Copy style={{ fontSize: 13, marginTop: 7 }}>
                This removes your saved characters, inventory, contracts, and
                progress from this device.
              </Copy>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 13 }}>
                <Button
                  label="Keep journey"
                  tone="dark"
                  small
                  style={{ flex: 1 }}
                  onPress={() => setReset(false)}
                />
                <Button
                  label="Reset journey"
                  tone="red"
                  small
                  style={{ flex: 1 }}
                  onPress={() => {
                    dispatch({ type: "RESET" });
                    router.replace("/");
                  }}
                />
              </View>
            </Panel>
          )}
        </View>
      </Frame>
    </Guard>
  );
}
