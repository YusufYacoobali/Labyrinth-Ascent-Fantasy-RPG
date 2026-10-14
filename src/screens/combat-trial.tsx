import { useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { Host, BottomSheet, Picker } from "@expo/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CombatTrialProvider, useGame } from "@/game/provider";
import {
  DEFAULT_TRIAL,
  TRIAL_CHARACTERS,
  TRIAL_ENEMIES,
  trialSave,
  type TrialConfig,
} from "@/game/combat-trial";
import { Button, Copy, Frame } from "@/components/game-ui";
import { useCombatFeedback } from "@/components/combat-motion";
import { Combat } from "./expedition";
import { theme as t } from "@/theme";
function TrialFight({
  customize,
  reset,
  exit,
}: {
  customize: () => void;
  reset: () => void;
  exit: () => void;
}) {
  const { state } = useGame();
  const feedback = useCombatFeedback();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Frame
      title="Combat trial"
      subtitle="Combat animation trial"
      expedition
      hideNav
      back={false}
      scroll={height - insets.top - insets.bottom < 700}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <Copy style={{ flex: 1, fontSize: 12 }}>Floor {state.floor}</Copy>
        <Button
          label="Choose party & enemy"
          small
          compact
          tone="dark"
          onPress={customize}
        />
      </View>
      {state.phase === "combat" ? (
        <Combat feedback={feedback} />
      ) : (
        <View
          style={{ flex: 1, padding: 24, gap: 18, justifyContent: "center" }}
        >
          <Copy title style={{ textAlign: "center", fontSize: 36 }}>
            {state.enemy?.hp === 0
              ? "Victory"
              : state.phase === "camp"
                ? "Retreated"
                : "Round over"}
          </Copy>
          <Copy style={{ textAlign: "center" }}>
            {state.enemy?.hp === 0
              ? state.enemy.name + " defeated."
              : state.phase === "camp"
                ? "Your party found shelter."
                : "Your party cannot keep fighting."}
          </Copy>
          <Button label="Fight again" onPress={reset} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 8, padding: 10 }}>
        <Button
          label="Restart fight"
          small
          compact
          tone="dark"
          style={{ flex: 1 }}
          onPress={reset}
        />
        <Button
          label="Leave trial"
          small
          compact
          tone="dark"
          style={{ flex: 1 }}
          onPress={exit}
        />
      </View>
    </Frame>
  );
}
export function CombatTrialScreen() {
  const { state: saved } = useGame();
  const [config, setConfig] = useState<TrialConfig>(DEFAULT_TRIAL);
  const [draft, setDraft] = useState<TrialConfig>(DEFAULT_TRIAL);
  const [editing, setEditing] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <>
      <CombatTrialProvider
        key={JSON.stringify(config) + ":" + round}
        initial={trialSave(config)}
      >
        <TrialFight
          customize={() => {
            setDraft({ ...config, party: [...config.party] });
            setEditing(true);
          }}
          reset={() => setRound((n) => n + 1)}
          exit={() =>
            router.replace(
              saved.started
                ? saved.phase === "town"
                  ? "/town"
                  : "/expedition"
                : "/",
            )
          }
        />
      </CombatTrialProvider>
      <Host colorScheme="dark" style={{ position: "absolute" }}>
        <BottomSheet
          isPresented={editing}
          onDismiss={() => setEditing(false)}
          snapPoints={["full"]}
          containerColor={t.color.bg}
          contentPadding={16}
        >
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            <Copy title style={{ fontSize: 25 }}>
              Choose your fight
            </Copy>
            {draft.party.map((key, i) => (
              <View key={i} style={{ gap: 4 }}>
                <Copy style={{ fontSize: 12 }}>Party member {i + 1}</Copy>
                <Host
                  colorScheme="dark"
                  seedColor={t.color.gold}
                  style={{ height: 42 }}
                >
                  <Picker
                    testID={"trial-member-" + i}
                    selectedValue={key}
                    onValueChange={(value) =>
                      setDraft((old) => ({
                        ...old,
                        party: old.party.map((id, slot) =>
                          slot === i ? value : id,
                        ),
                      }))
                    }
                  >
                    {TRIAL_CHARACTERS.map((c) => (
                      <Picker.Item key={c.id} value={c.id} label={c.name} />
                    ))}
                  </Picker>
                </Host>
              </View>
            ))}
            <View style={{ gap: 4 }}>
              <Copy style={{ fontSize: 12 }}>Enemy</Copy>
              <Host
                colorScheme="dark"
                seedColor={t.color.gold}
                style={{ height: 42 }}
              >
                <Picker
                  testID="trial-enemy"
                  selectedValue={draft.enemy}
                  onValueChange={(enemy) =>
                    setDraft((old) => ({ ...old, enemy }))
                  }
                >
                  {TRIAL_ENEMIES.map((e) => (
                    <Picker.Item key={e.id} value={e.id} label={e.name} />
                  ))}
                </Picker>
              </Host>
            </View>
            <Copy muted style={{ fontSize: 12 }}>
              Trial progress is separate from your journey.
            </Copy>
            <Button
              label="Start this fight"
              onPress={() => {
                setConfig(draft);
                setRound((n) => n + 1);
                setEditing(false);
              }}
            />
            <Button
              label="Cancel"
              tone="dark"
              onPress={() => setEditing(false)}
            />
          </ScrollView>
        </BottomSheet>
      </Host>
    </>
  );
}
