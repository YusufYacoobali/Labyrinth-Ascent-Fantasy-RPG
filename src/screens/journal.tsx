import { StoryChronicle } from "@/components/story-journal";
import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  art,
  Atlas,
  Bar,
  Button,
  Copy,
  Frame,
  Icon,
  SettingsControls,
} from "@/components/game-ui";
import {
  Surface,
  TabStrip,
  MenuIcon,
  Ornament,
} from "@/components/native-chrome";
import { questProgress, SKILLS } from "@/game/engine";
import { FLOORS, QUESTS } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";

export function JournalScreen() {
  const { state } = useGame();
  const params = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState(
    params.section === "relics"
      ? "Relics"
      : params.section === "bestiary"
        ? "Bestiary"
        : "Story",
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const chapterScenes = [
    art.dungeon,
    art.labyrinth,
    art.clan,
    art.forest,
    art.relic,
    art.forge,
    art.frost,
  ];
  return (
    <Guard expedition>
      <Frame
        hideNav={state.journey.startDay !== null}
        expedition={state.journey.startDay !== null}
        active="Journal"
        title="Stormhold"
        portrait={state.party[0]?.portrait}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
          }}
        >
          <MenuIcon index={10} size={49} />
          <View>
            <Copy
              title
              style={{ fontSize: 35, lineHeight: 39, color: t.color.goldLight }}
            >
              Journal
            </Copy>
            <Copy style={{ fontSize: 13 }}>
              Stories, quests, and discoveries.
            </Copy>
          </View>
        </View>
        <TabStrip
          tabs={["Story", "Quests", "Bestiary", "Relics"]}
          active={tab}
          onChange={(tab) => {
            setTab(tab);
            setExpanded(null);
          }}
        />
        <View style={{ padding: 10, gap: 8 }}>
          {tab === "Story" ? (
            <>
              <Image
                source={art.journalChapter}
                contentFit="fill"
                style={{ width: "100%", aspectRatio: 2 }}
                accessibilityLabel="Chapter I — A Deeper Tomorrow. Beyond Stormhold lies a vast labyrinth. Our journey into the depths begins."
              />
              <Surface style={{ padding: 11, gap: 4 }}>
                <Copy title style={{ fontSize: 19 }}>
                  Departure from Stormhold
                </Copy>
                <Copy muted style={{ fontSize: 12 }}>
                  Day {state.day} · Best floor {state.bestFloor} · {state.kills}{" "}
                  defeated
                </Copy>
              </Surface>
              {FLOORS.filter(
                (floor) => floor.id <= Math.max(1, state.bestFloor + 1),
              ).map((floor) => {
                const unlocked = floor.id <= state.bestFloor;
                return (
                  <Pressable
                    key={floor.id}
                    accessibilityRole="button"
                    accessibilityLabel={
                      unlocked
                        ? "Read " + floor.name
                        : "Floor " + floor.id + " is uncharted"
                    }
                    disabled={!unlocked}
                    onPress={() =>
                      setExpanded(expanded === floor.id ? null : floor.id)
                    }
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : unlocked ? 1 : 0.6,
                    })}
                  >
                    <Surface
                      style={{
                        flexDirection: "row",
                        minHeight: 76,
                        gap: 10,
                        paddingRight: 10,
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={
                          chapterScenes[(floor.id - 1) % chapterScenes.length]
                        }
                        contentFit="cover"
                        style={{
                          width: 80,
                          alignSelf: "stretch",
                          opacity: unlocked ? 1 : 0.35,
                        }}
                      />
                      <View style={{ flex: 1, paddingVertical: 8 }}>
                        <Copy title style={{ fontSize: 19, lineHeight: 22 }}>
                          {unlocked ? floor.name : "Uncharted chapter"}
                        </Copy>
                        <Copy muted style={{ fontSize: 12, lineHeight: 16 }}>
                          {unlocked
                            ? floor.subtitle
                            : "Reach Floor " + floor.id}
                        </Copy>
                        {expanded === floor.id && (
                          <Copy style={{ fontSize: 13, marginTop: 6 }}>
                            {floor.intro}
                          </Copy>
                        )}
                      </View>
                      <View style={{ alignItems: "center", gap: 4 }}>
                        <Icon
                          name={unlocked ? "stairs-up" : "lock-outline"}
                          size={20}
                        />
                        <Copy style={{ fontSize: 11 }}>F{floor.id}</Copy>
                      </View>
                    </Surface>
                  </Pressable>
                );
              })}
              <StoryChronicle />
              <Ornament />
              <Copy title style={{ fontSize: 21 }}>
                Your Chronicle
              </Copy>
              <Surface style={{ padding: 13, gap: 12 }}>
                {state.journal.map((entry, i) => (
                  <Copy
                    key={i + entry}
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      color: i === 0 ? t.color.goldLight : t.color.muted,
                    }}
                  >
                    {entry}
                  </Copy>
                ))}
              </Surface>
              {!!state.ending && (
                <Surface parchment style={{ padding: 13 }}>
                  <Copy title style={{ color: "#2b2018" }}>
                    {state.ending}
                  </Copy>
                </Surface>
              )}
            </>
          ) : tab === "Quests" ? (
            <>
              {QUESTS.map((q) => (
                <Surface key={q.id} parchment style={{ padding: 13, gap: 6 }}>
                  <Copy title style={{ color: "#281e16" }}>
                    {q.title}
                  </Copy>
                  <Copy style={{ color: "#443629", fontSize: 13 }}>
                    {q.description}
                  </Copy>
                  <Copy style={{ color: "#76532b", fontSize: 12 }}>
                    {state.quests[q.id] || "Not accepted"} ·{" "}
                    {questProgress(state, q.id)}/{q.target}
                  </Copy>
                  <Bar value={questProgress(state, q.id)} max={q.target} />
                </Surface>
              ))}
              <Button
                label="Manage guild contracts"
                onPress={() => router.push("/guild")}
              />
            </>
          ) : tab === "Bestiary" ? (
            <>
              {FLOORS.filter(
                (floor) => floor.id <= Math.max(1, state.bestFloor + 1),
              ).map((floor) => (
                <Surface
                  key={floor.id}
                  style={{
                    padding: 11,
                    flexDirection: "row",
                    gap: 13,
                    alignItems: "center",
                  }}
                >
                  <Atlas
                    sprite
                    index={floor.sprite}
                    size={62}
                    enemyFloor={floor.id}
                  />
                  <View style={{ flex: 1 }}>
                    <Copy title style={{ fontSize: 19 }}>
                      {floor.id <= state.bestFloor
                        ? floor.enemy
                        : "Unknown creature"}
                    </Copy>
                    <Copy muted style={{ fontSize: 12 }}>
                      {floor.id <= state.bestFloor
                        ? "Floor " + floor.id + " · " + floor.element
                        : "Defeat it on Floor " + floor.id}
                    </Copy>
                    {floor.id <= state.bestFloor && (
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        {floor.intent}
                      </Copy>
                    )}
                  </View>
                  {floor.id > state.bestFloor && (
                    <Icon name="lock-outline" size={19} />
                  )}
                </Surface>
              ))}
            </>
          ) : (
            <>
              <Surface style={{ padding: 16, gap: 7 }}>
                <Icon name="sword" size={50} />
                <Copy title>Dawnbringer</Copy>
                <Copy
                  style={{ color: state.relic ? t.color.gold : t.color.muted }}
                >
                  {state.relic
                    ? "Recovered · permanent +5 party ATK"
                    : "Undiscovered · The Garden of Names, Floor 8"}
                </Copy>
              </Surface>
              <Surface style={{ padding: 13, gap: 9 }}>
                <Copy title>Monster Essences</Copy>
                <Copy>
                  {Object.entries(state.inventory)
                    .filter(([id]) => id.startsWith("essence-"))
                    .reduce((n, [, qty]) => n + qty, 0)}{" "}
                  unbound
                </Copy>
                <Copy muted style={{ fontSize: 13 }}>
                  Every defeated monster has a 30% chance to drop its species
                  essence. Bind in town or shelter; field-found skills are
                  secured on extraction.
                </Copy>
              </Surface>
              {SKILLS.filter((skill) =>
                state.party.some((c) => c.skills.includes(skill.name)),
              ).map((skill) => (
                <Surface
                  key={skill.name}
                  style={{
                    padding: 12,
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Icon name={skill.icon} color={skill.color} size={32} />
                  <View style={{ flex: 1 }}>
                    <Copy title style={{ fontSize: 19 }}>
                      {skill.name}
                    </Copy>
                    <Copy muted style={{ fontSize: 12 }}>
                      {state.party
                        .filter((c) => c.skills.includes(skill.name))
                        .map((c) => c.name)
                        .join(", ")}
                    </Copy>
                  </View>
                </Surface>
              ))}
              <Button
                label="Bind skills in your party"
                onPress={() => router.push("/party")}
              />
            </>
          )}
        </View>
      </Frame>
    </Guard>
  );
}

const menu = [
  { name: "Profile", detail: "Your adventurer", icon: 5 },
  { name: "Achievements", detail: "Progress and milestones", icon: 6 },
  { name: "Settings", detail: "Sound and haptics", icon: 7 },
  { name: "Save Data", detail: "Saved on this device", icon: 8 },
  { name: "Mail", detail: "Contract rewards", icon: 9 },
  { name: "Codex", detail: "Creatures and relics", icon: 10 },
  { name: "Help", detail: "How to play", icon: 11 },
];
export function MoreScreen() {
  const { state, dispatch, saveError, retrySave } = useGame();
  const [section, setSection] = useState("");
  const [reset, setReset] = useState(false);
  const [name, setName] = useState(state.party[0]?.name || "");
  const hero = state.party[0];
  if (!hero)
    return (
      <Guard>
        <View />
      </Guard>
    );
  const milestones = [
    {
      title: "First Ascent",
      detail: "Clear Floor 1",
      done: state.bestFloor >= 1,
    },
    {
      title: "Guardian Slayer",
      detail: "Clear Floor 3",
      done: state.bestFloor >= 3,
    },
    { title: "Veteran", detail: "Defeat 10 monsters", done: state.kills >= 10 },
    {
      title: "The White Stag",
      detail: "Forge a clan alliance",
      done: state.clanAlly,
    },
    { title: "Relic Keeper", detail: "Recover Dawnbringer", done: state.relic },
    {
      title: "The Hollow Crown",
      detail: "Clear Floor 12",
      done: state.bestFloor >= 12,
    },
  ];
  return (
    <Guard>
      <Frame
        background={art.moreStudy}
        active="More"
        title="Labyrinth Awaits"
        back={false}
      >
        <View style={{ padding: 13, gap: 11 }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Copy
              title
              style={{ fontSize: 44, lineHeight: 48, color: t.color.goldLight }}
            >
              More
            </Copy>
            <View style={{ width: "60%" }}>
              <Ornament />
            </View>
          </View>
          <Surface
            parchment
            style={{
              padding: 10,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Atlas
              index={hero.portrait}
              size={83}
              style={{ borderRadius: 3 }}
            />
            <View style={{ flex: 1 }}>
              <Copy title style={{ color: "#241d18", fontSize: 27 }}>
                {hero.name}
              </Copy>
              <Copy style={{ color: "#44352a", fontSize: 13 }}>
                Lv. {hero.level} · {hero.race} {hero.job}
              </Copy>
              <Copy style={{ color: "#795429", fontSize: 12 }}>
                Guild renown {state.faction.guild}
              </Copy>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => setSection("Profile")}
              style={{ padding: 7 }}
            >
              <Icon name="pencil" size={21} color="#583c20" />
            </Pressable>
          </Surface>
          {section ? (
            <Surface style={{ padding: 14, gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Copy title style={{ fontSize: 25 }}>
                  {section}
                </Copy>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu detail"
                  onPress={() => {
                    setSection("");
                    setReset(false);
                  }}
                  style={{ padding: 5 }}
                >
                  <Icon name="close" size={23} />
                </Pressable>
              </View>
              <Ornament />
              {section === "Profile" ? (
                <>
                  <Copy muted>Adventurer name</Copy>
                  <TextInput
                    accessibilityLabel="Adventurer name"
                    value={name}
                    onChangeText={setName}
                    maxLength={18}
                    style={{
                      color: t.color.text,
                      fontFamily: t.font.body,
                      fontSize: 19,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: t.color.goldDim,
                      borderRadius: 4,
                    }}
                  />
                  <Button
                    label="Save name"
                    disabled={!name.trim()}
                    onPress={() => {
                      dispatch({ type: "RENAME", name });
                      setSection("");
                    }}
                  />
                  <Copy muted style={{ fontSize: 12 }}>
                    {hero.trait} · Day {state.day}
                  </Copy>
                  <Button
                    label="View party"
                    small
                    tone="dark"
                    onPress={() => router.push("/party")}
                  />
                </>
              ) : section === "Settings" ? (
                <SettingsControls />
              ) : section === "Achievements" ? (
                milestones.map((m) => (
                  <View
                    key={m.title}
                    style={{
                      flexDirection: "row",
                      gap: 11,
                      alignItems: "center",
                      paddingVertical: 6,
                    }}
                  >
                    <Icon
                      name={m.done ? "trophy" : "lock-outline"}
                      size={28}
                      color={m.done ? t.color.gold : t.color.muted}
                    />
                    <View style={{ flex: 1 }}>
                      <Copy title style={{ fontSize: 19 }}>
                        {m.title}
                      </Copy>
                      <Copy muted style={{ fontSize: 12 }}>
                        {m.detail}
                      </Copy>
                    </View>
                    {m.done && <Icon name="check" color={t.color.green} />}
                  </View>
                ))
              ) : section === "Save Data" ? (
                <>
                  <Copy
                    style={{ color: saveError ? t.color.red : t.color.green }}
                  >
                    {saveError || "Autosave active"}
                  </Copy>
                  <Copy muted style={{ fontSize: 13 }}>
                    Day {state.day} · Best floor {state.bestFloor} ·{" "}
                    {state.party.length} companions
                  </Copy>
                  {saveError && (
                    <Button label="Retry save" onPress={retrySave} />
                  )}
                  <Copy muted style={{ fontSize: 12 }}>
                    Local save backup · Select and copy
                  </Copy>
                  <TextInput
                    accessibilityLabel="Local save backup"
                    value={JSON.stringify(state)}
                    editable={false}
                    multiline
                    selectTextOnFocus
                    style={{
                      height: 92,
                      color: t.color.muted,
                      fontFamily: t.font.body,
                      fontSize: 11,
                      borderWidth: 1,
                      borderColor: t.color.line,
                      padding: 8,
                    }}
                  />
                  <Button
                    label="Start a new journey"
                    tone="red"
                    small
                    onPress={() => setReset(true)}
                  />
                  {reset && (
                    <>
                      <Copy>Remove this device’s current journey?</Copy>
                      <Button
                        label="Keep journey"
                        tone="dark"
                        small
                        onPress={() => setReset(false)}
                      />
                      <Button
                        label="Reset journey"
                        tone="red"
                        small
                        onPress={() => {
                          dispatch({ type: "RESET" });
                          router.replace("/");
                        }}
                      />
                    </>
                  )}
                </>
              ) : section === "Mail" ? (
                <>
                  {QUESTS.filter(
                    (q) =>
                      state.quests[q.id] === "accepted" &&
                      questProgress(state, q.id) >= q.target,
                  ).map((q) => (
                    <Surface
                      parchment
                      key={q.id}
                      style={{ padding: 10, gap: 8 }}
                    >
                      <Copy title style={{ color: "#281e18" }}>
                        {q.title}
                      </Copy>
                      <Copy style={{ color: "#57402b" }}>
                        {q.gold} gold · {q.gems} crystals
                      </Copy>
                      <Button
                        label="Claim reward"
                        small
                        onPress={() => dispatch({ type: "CLAIM", id: q.id })}
                      />
                    </Surface>
                  ))}
                  {!QUESTS.some(
                    (q) =>
                      state.quests[q.id] === "accepted" &&
                      questProgress(state, q.id) >= q.target,
                  ) && <Copy muted>No rewards waiting.</Copy>}
                  <Button
                    label="Visit the guild"
                    small
                    onPress={() => router.push("/guild")}
                  />
                </>
              ) : section === "Codex" ? (
                <>
                  <Button
                    label="Bestiary"
                    tone="blue"
                    onPress={() =>
                      router.push({
                        pathname: "/journal",
                        params: { section: "bestiary" },
                      })
                    }
                  />
                  <Button
                    label="Relics and skills"
                    onPress={() =>
                      router.push({
                        pathname: "/journal",
                        params: { section: "relics" },
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Copy style={{ fontSize: 13 }}>
                    Prepare in town. The gate opens every 30 days. Bring thirty
                    party rations for the sealed month; one is used each day.
                  </Copy>
                  <Copy style={{ fontSize: 13 }}>
                    Read initiative and every enemy intent. Queue one action per
                    available companion. Guard protects one ally, Focus restores
                    only the actor’s MP, and Burst spends shared momentum.
                  </Copy>
                  <Button
                    label="Replay guided walkthrough"
                    tone="blue"
                    onPress={() => {
                      dispatch({ type: "WALKTHROUGH", kind: "restart" });
                      router.replace(
                        state.phase === "town" ? "/town" : "/expedition",
                      );
                    }}
                  />
                  <Button
                    label="Try pixel combat"
                    tone="blue"
                    onPress={() => router.push("/combat-trial")}
                  />
                  <Button
                    label="How to play in town"
                    onPress={() => {
                      dispatch({ type: "GUIDE", show: true });
                      router.replace("/town");
                    }}
                  />
                  <Button
                    label="Revisit the introduction"
                    small
                    tone="dark"
                    onPress={() => router.push("/onboarding")}
                  />
                </>
              )}
            </Surface>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
              {menu.map((item) => (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  onPress={() => setSection(item.name)}
                  style={({ pressed }) => ({
                    width: "48.5%",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Surface
                    style={{
                      minHeight: 91,
                      padding: 10,
                      flexDirection: "row",
                      gap: 9,
                      alignItems: "center",
                    }}
                  >
                    <MenuIcon index={item.icon} size={34} />
                    <View style={{ flex: 1 }}>
                      <Copy
                        title
                        style={{
                          fontSize: item.name.length > 10 ? 17 : 20,
                          lineHeight: 23,
                        }}
                      >
                        {item.name}
                      </Copy>
                      <Copy muted style={{ fontSize: 11, lineHeight: 14 }}>
                        {item.detail}
                      </Copy>
                    </View>
                  </Surface>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Frame>
    </Guard>
  );
}
