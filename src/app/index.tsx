import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useGame } from "@/game/provider";
import { theme } from "@/theme";

export default function Entry() {
  const { state, ready } = useGame();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.color.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.color.gold} />
      </View>
    );
  return (
    <Redirect
      href={
        state.started
          ? state.phase === "town"
            ? "/town"
            : "/expedition"
          : state.introSeen
            ? "/create"
            : "/onboarding"
      }
    />
  );
}
