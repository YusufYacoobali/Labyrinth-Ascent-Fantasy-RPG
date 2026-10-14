import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular,
} from "@expo-google-fonts/cormorant-garamond";
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
import { battleAtlases } from "@/components/battle-backdrop";
export default function RootLayout() {
  useEffect(() => {
    const foreground = [
      art.portraits,
      art.sprites,
      art.bosses,
      art.townGuide,
      art.townPlay,
      art.menuIcons,
      art.storyGlyphs,
      art.supplyIcons,
      art.recruitPortraits,
      art.recruitSprites,
      art.townItemIcons,
      art.resources,
      art.parchment,
      art.floorEnemies,
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
      art.shopScene,
      art.guildScene,
      art.forgeScene,
      art.tavernScene,
      art.journalChapter,
      art.moreStudy,
      art.portal,
      art.sanctuary,
      art.floodedRoad,
      ...battleAtlases,
    ].map((source) => Asset.fromModule(source).uri);
    // Reused atlases stay decoded; larger scenes warm the disk cache without pinning all of them in memory.
    void Image.prefetch(foreground, { cachePolicy: "memory-disk" })
      .then(() => Image.prefetch(scenes, { cachePolicy: "disk" }))
      .catch(() => {});
  }, []);
  const [loaded, error] = useFonts({
    GameNarrative: CormorantGaramond_400Regular,
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
        <StatusBar hidden style="light" />
        <ActivityIndicator color={theme.color.gold} />
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
        <StatusBar hidden style="light" />
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
