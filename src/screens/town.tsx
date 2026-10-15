import React from "react";
import { Pressable } from "react-native";
import { Image } from "expo-image";
import { router, Redirect } from "expo-router";
import { art, Frame, Button } from "@/components/game-ui";
import { useGame } from "@/game/provider";
import { daysToGate, gateOpen } from "@/game/engine";
import { SceneMotion } from "@/components/scene-motion";
export function Guard({
  children,
  expedition = false,
}: {
  children: React.ReactNode;
  expedition?: boolean;
}) {
  const { ready, state } = useGame();
  if (!ready) return null;
  if (!state.started) return <Redirect href="/" />;
  if (
    !expedition &&
    state.phase !== "town" &&
    !(state.phase === "story" && state.stories.active?.resume === "town")
  )
    return <Redirect href="/expedition" />;
  return <>{children}</>;
}
const places = [
  { name: "Tavern", path: "/tavern", left: "4%", top: "26%" },
  { name: "Shop", path: "/shop", left: "64%", top: "26%" },
  { name: "Guild", path: "/guild", left: "4%", top: "35%" },
  { name: "Blacksmith", path: "/blacksmith", left: "64%", top: "35%" },
] as const;
export function TownScreen() {
  const { state, dispatch } = useGame();
  if (state.phase === "town" && state.lastReport && !state.lastReport.reviewed)
    return <Redirect href="/report" />;
  const showGuide = !state.guideSeen && !state.walkthrough.active;
  return (
    <Guard>
      <Frame
        active="Home"
        title="Stormhold"
        subtitle={`Day ${state.day} · ${gateOpen(state.day) ? "Gate open" : `${daysToGate(state.day)} days to opening`}`}
        portrait={state.party[0]?.portrait}
        back={false}
        scroll={false}
      >
        {state.lastReport && (
          <Button
            small
            tone="dark"
            label="Last expedition report"
            onPress={() => router.push("/report")}
          />
        )}
        <SceneMotion subtle style={{ flex: 1 }}>
          <Image
            source={showGuide ? art.townGuide : art.townPlay}
            contentFit="fill"
            style={{ width: "100%", height: "100%" }}
            accessibilityLabel={
              showGuide
                ? "Elise: Recruit at the Tavern. Buy supplies. Train at the Guild. Prepare for the gate."
                : "Stormhold town square"
            }
          />
          {places.map((place) => (
            <Pressable
              key={place.name}
              accessibilityRole="button"
              accessibilityLabel={place.name}
              onPress={() => router.push(place.path)}
              style={({ pressed }) => ({
                position: "absolute",
                left: place.left,
                top: place.top,
                width: "33%",
                height: "8%",
                backgroundColor: pressed
                  ? "rgba(255,216,139,.18)"
                  : "transparent",
                borderRadius: 5,
              })}
            />
          ))}
          {showGuide && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss town guide"
              onPress={() => dispatch({ type: "GUIDE" })}
              style={{
                position: "absolute",
                left: "85%",
                top: "84%",
                width: "8%",
                height: "5%",
              }}
              hitSlop={10}
            />
          )}
        </SceneMotion>
      </Frame>
    </Guard>
  );
}
