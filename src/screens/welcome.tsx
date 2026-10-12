import React, { useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
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
export function CreateScreen() {
  const [race, setRace] = useState<Race>("barbarian");
  const [name, setName] = useState("Bjorn");
  const { dispatch } = useGame();
  const r = RACES.find((r) => r.id === race)!;
  return (
    <Frame background={art.cover} title="Choose your origin" hideNav>
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
                  setName(
                    {
                      barbarian: "Bjorn",
                      human: "Kael",
                      elf: "Sylva",
                      dwarf: "Brom",
                    }[c.id],
                  );
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
                <Copy muted style={{ fontSize: 12 }}>
                  {r.trait}
                </Copy>
              </View>
            </View>
            <Divider />
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
            <TextInput
              accessibilityLabel="Adventurer name"
              value={name}
              onChangeText={setName}
              maxLength={18}
              placeholder="Your name"
              placeholderTextColor={t.color.muted}
              style={{
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
          </View>
          <Button
            label="Enter Stormhold"
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
