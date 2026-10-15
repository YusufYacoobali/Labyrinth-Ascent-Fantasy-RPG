import React from "react";
import { Redirect } from "expo-router";
import { Frame } from "@/components/game-ui";
import RouteMap from "@/components/route-map";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
export function FloorMapScreen() {
  const { state } = useGame();
  if (state.phase === "town") return <Redirect href="/town" />;
  return (
    <Guard expedition>
      <Frame
        title={`Floor ${state.floor} map`}
        subtitle="North-up · inspect rooms or follow known passages"
        hideNav
      >
        <RouteMap fullScreen />
      </Frame>
    </Guard>
  );
}
