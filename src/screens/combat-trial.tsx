import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Host, BottomSheet, Picker } from "@expo/ui";
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
import TacticalCombat from "@/components/tactical-combat";
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
  const fighting = !!state.roundPlayback || state.phase === "combat";
  const won = !!state.combat?.complete;
  return (
    <Frame
      title={fighting ? undefined : "Combat trial"}
      expedition
      fullBleed={fighting}
      hideNav
      back={false}
      scroll={!fighting}
    >
      {fighting ? (
        <TacticalCombat
          key={state.combat?.id}
          practice={{ customize, restart: reset, exit }}
        />
      ) : (
        <View
          style={{ flex: 1, padding: 24, gap: 18, justifyContent: "center" }}
        >
          <Copy title style={{ textAlign: "center", fontSize: 36 }}>
            {won
              ? "Victory"
              : state.phase === "defeat"
                ? "Defeat"
                : "Retreated"}
          </Copy>
          <Copy style={{ textAlign: "center" }}>
            {won
              ? "Your party won the fight."
              : state.phase === "defeat"
                ? "Your party cannot keep fighting."
                : "Your party withdrew from the battle."}
          </Copy>
          {state.lootReceipt && (
            <Copy style={{ textAlign: "center", color: t.color.gold }}>
              Gold found: {state.lootReceipt.gross}
            </Copy>
          )}
          <Button label="Fight again" onPress={reset} />
          <Button
            label="Choose party & enemy"
            tone="dark"
            onPress={customize}
          />
          <Button label="Leave trial" tone="dark" onPress={exit} />
        </View>
      )}
    </Frame>
  );
}
export function CombatTrialScreen() {
  const { state: saved } = useGame();
  const [config, setConfig] = useState<TrialConfig>(DEFAULT_TRIAL);
  const [draft, setDraft] = useState<TrialConfig>(DEFAULT_TRIAL);
  const [editing, setEditing] = useState(false);
  const [round, setRound] = useState(0);
  const initial = useMemo(
    () => ({
      ...trialSave(config),
      sound: saved.sound,
      haptics: saved.haptics,
      combatSpeed: saved.combatSpeed,
    }),
    [config, saved.sound, saved.haptics, saved.combatSpeed],
  );
  return (
    <>
      <CombatTrialProvider
        key={JSON.stringify(config) + ":" + round}
        initial={initial}
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
