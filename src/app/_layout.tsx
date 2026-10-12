import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import {
  RobotoCondensed_400Regular,
  RobotoCondensed_600SemiBold,
} from "@expo-google-fonts/roboto-condensed";
import { ActivityIndicator, View } from "react-native";
import { GameProvider } from "@/game/provider";
import { theme } from "@/theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { art } from "@/components/game-ui";
export default function RootLayout() {
  useEffect(() => {
    const foreground = [
      art.portraits,
      art.sprites,
      art.bosses,
      art.townGuide,
      art.townPlay,
    ].map((source) => Asset.fromModule(source).uri);
    const scenes = [
      art.cover,
      art.town,
      art.tavern,
      art.dungeon,
      art.camp,
      art.clan,
      art.labyrinth,
      art.forest,
      art.frost,
      art.forge,
      art.relic,
      art.treasure,
    ].map((source) => Asset.fromModule(source).uri);
    // Reused atlases stay decoded; larger scenes warm the disk cache without pinning all of them in memory.
    void Image.prefetch(foreground, { cachePolicy: "memory-disk" })
      .then(() => Image.prefetch(scenes, { cachePolicy: "disk" }))
      .catch(() => {});
  }, []);
  const [loaded, error] = useFonts({
    GameSerif: CormorantGaramond_700Bold,
    GameBody: RobotoCondensed_400Regular,
    GameBodyBold: RobotoCondensed_600SemiBold,
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.color.bg,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.color.gold} />
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg },
            animation: "none",
          }}
        />
      </GameProvider>
    </GestureHandlerRootView>
  );
}
