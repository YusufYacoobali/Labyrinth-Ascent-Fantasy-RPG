import React, { useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Redirect } from "expo-router";
import {
  art,
  Atlas,
  Button,
  Copy,
  Divider,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import { RACES, Race } from "@/game/engine";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";
const CHARACTER_NAMES: Record<Race, string[]> = {
  barbarian: [
    "Bjorn",
    "Astrid",
    "Hakon",
    "Freya",
    "Gunnar",
    "Saga",
    "Rurik",
    "Ingrid",
    "Einar",
    "Ylva",
    "Leif",
    "Thora",
  ],
  human: [
    "Kael",
    "Rowan",
    "Maren",
    "Cassian",
    "Alina",
    "Dorian",
    "Tessa",
    "Lucan",
    "Vera",
    "Ronan",
    "Cedric",
    "Isla",
  ],
  elf: [
    "Sylva",
    "Aerion",
    "Faelyn",
    "Thalion",
    "Nyriel",
    "Elaris",
    "Caelith",
    "Vaela",
    "Ilyra",
    "Orien",
    "Lethiel",
    "Sylwen",
  ],
  dwarf: [
    "Brom",
    "Hilda",
    "Durgan",
    "Brunna",
    "Orik",
    "Sigrid",
    "Torvi",
    "Keld",
    "Berra",
    "Durin",
    "Thrain",
    "Greta",
  ],
};
export function CreateScreen() {
  const [race, setRace] = useState<Race>("barbarian");
  const [name, setName] = useState(CHARACTER_NAMES.barbarian[0]);
  const { dispatch, state } = useGame();
  const r = RACES.find((r) => r.id === race)!;
  if (state.started)
    return <Redirect href={state.phase === "town" ? "/town" : "/expedition"} />;
  return (
    <Frame
      background={art.cover}
      title="Who will you become?"
      hideNav
      back={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 22, gap: 16 }}>
          <View
            style={{ flexDirection: "row", gap: 7, justifyContent: "center" }}
          >
            {RACES.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${c.name}`}
                accessibilityState={{ selected: race === c.id }}
                onPress={() => {
                  setRace(c.id);
                  setName(CHARACTER_NAMES[c.id][0]);
                }}
                style={{
                  flex: 1,
                  borderWidth: race === c.id ? 2 : 1,
                  borderColor: race === c.id ? t.color.gold : t.color.line,
                  borderRadius: 5,
                  overflow: "hidden",
                  backgroundColor: t.color.bg,
                }}
              >
                <Atlas index={c.portrait} size={88} />
                <Copy
                  style={{
                    fontSize: 11,
                    textAlign: "center",
                    padding: 6,
                    color: race === c.id ? t.color.goldLight : t.color.text,
                  }}
                >
                  {c.name}
                </Copy>
              </Pressable>
            ))}
          </View>
          <Panel>
            <View
              style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
            >
              <Atlas
                index={r.portrait}
                size={104}
                style={{
                  borderWidth: 1,
                  borderColor: t.color.gold,
                  borderRadius: 4,
                }}
              />
              <View style={{ flex: 1, gap: 5 }}>
                <Copy title>{r.name}</Copy>
                <Copy style={{ color: t.color.gold }}>{r.job}</Copy>
                <Copy muted style={{ fontSize: 13 }}>
                  {r.style}
                </Copy>
                <Copy muted style={{ fontSize: 12 }}>
                  {r.trait}
                </Copy>
              </View>
            </View>
            <Divider />
            <Copy
              style={{
                color: t.color.goldLight,
                fontFamily: t.font.story,
                fontSize: 22,
                lineHeight: 27,
              }}
            >
              “{r.quote}”
            </Copy>
            <Copy>{r.description}</Copy>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 14,
              }}
            >
              {[
                ["heart", r.hp],
                ["sword", r.atk],
                ["shield", r.def],
                ["run-fast", r.speed],
              ].map(([icon, n]) => (
                <View
                  key={String(icon)}
                  style={{ alignItems: "center", gap: 4 }}
                >
                  <Icon name={String(icon)} />
                  <Copy>{n}</Copy>
                </View>
              ))}
            </View>
          </Panel>
          <View style={{ gap: 6 }}>
            <Copy>Name</Copy>
            <View
              style={{ flexDirection: "row", alignItems: "stretch", gap: 8 }}
            >
              <TextInput
                accessibilityLabel="Adventurer name"
                value={name}
                onChangeText={setName}
                maxLength={18}
                placeholder="Your name"
                placeholderTextColor={t.color.muted}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderWidth: 1,
                  borderColor: t.color.goldDim,
                  borderRadius: 5,
                  padding: 14,
                  color: t.color.text,
                  fontFamily: t.font.body,
                  fontSize: 17,
                  backgroundColor: t.color.bg,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Roll a new name"
                accessibilityHint={`Suggests a different ${r.name.toLowerCase()} name`}
                onPress={() =>
                  setName((current) => {
                    const choices = CHARACTER_NAMES[race].filter(
                      (candidate) =>
                        candidate.toLowerCase() !==
                        current.trim().toLowerCase(),
                    );
                    return choices[Math.floor(Math.random() * choices.length)];
                  })
                }
                style={({ pressed }) => ({
                  width: 52,
                  minHeight: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: t.color.goldDim,
                  borderRadius: 5,
                  backgroundColor: t.color.bg,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Icon name="dice-multiple" size={28} />
              </Pressable>
            </View>
          </View>
          <Button
            label={`Begin as ${name.trim() || r.name}`}
            disabled={!name.trim()}
            onPress={() => {
              dispatch({ type: "CREATE", race, name, roll: Math.random() });
              router.replace("/town");
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Frame>
  );
}
