import React from "react";
import { Redirect, router } from "expo-router";
import { Frame } from "@/components/game-ui";
import RouteMap from "@/components/route-map";
import { Directions } from "./exploration-scenes";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
export function FloorMapScreen() {
  const { state } = useGame();
  if (state.phase === "town") return <Redirect href="/town" />;
  if (state.discoveryReceipt) return <Redirect href="/expedition" />;
  return (
    <Guard expedition>
      <Frame title={`Floor ${state.floor} map`} hideNav>
        <RouteMap fullScreen />
        {["exploration", "branch"].includes(state.phase) && (
          <Directions afterMove={() => router.back()} />
        )}
      </Frame>
    </Guard>
  );
}
