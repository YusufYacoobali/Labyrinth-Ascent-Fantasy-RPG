import React from "react";
import { View } from "react-native";
import { Redirect, router } from "expo-router";
import {
  Frame,
  Panel,
  Copy,
  Button,
  Icon,
  Eyebrow,
} from "@/components/game-ui";
import { RewardItem, RewardItems } from "@/components/reward-items";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";

export function ExpeditionReportScreen() {
  const { state, dispatch } = useGame(),
    r = state.lastReport;
  if (!r) return <Redirect href="/town" />;
  const kills = Object.values(r.enemies).reduce(
    (n, quantity) => n + quantity,
    0,
  );
  const gold = r.lost ? r.spoils.gold : r.net + (r.missionReward || 0);
  const hasSpoils =
    Object.values(r.spoils.inventory).some((n) => n > 0) ||
    gold > 0 ||
    r.spoils.food > 0 ||
    r.spoils.potions > 0 ||
    r.spoils.gems > 0;
  const progress = r.characters.filter(
    (c) =>
      c.experience > 0 || c.levels > 0 || c.skills.length > 0 || c.mastery > 0,
  );
  return (
    <Guard>
      <Frame title={`Expedition ${r.number}`} hideNav>
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 16 }}>
            <Icon name={r.lost ? "home-heart" : "trophy"} size={54} />
            <Copy title style={{ fontSize: 28, color: t.color.goldLight }}>
              {r.lost ? "Home to recover" : "A journey worth taking"}
            </Copy>
            <Copy muted>
              {r.lost
                ? "Your experience stays with you."
                : "Your spoils are safe in Stormhold."}
            </Copy>
          </View>
          <Panel>
            {r.highestFloor > 0 && (
              <RewardItem
                icon="stairs-up"
                label="Highest floor"
                value={r.highestFloor}
              />
            )}
            {r.newRooms > 0 && (
              <RewardItem
                icon="map-outline"
                label="Rooms discovered"
                value={r.newRooms}
              />
            )}
            {kills > 0 && (
              <RewardItem icon="sword" label="Enemies defeated" value={kills} />
            )}
            {r.challenge && (
              <RewardItem
                icon="crown"
                label="Throne challenge"
                value="Complete"
              />
            )}
          </Panel>
          {hasSpoils && (
            <>
              <Eyebrow>{r.lost ? "SPOILS LOST" : "TREASURE SECURED"}</Eyebrow>
              <RewardItems
                items={r.spoils.inventory}
                gold={gold}
                food={r.spoils.food}
                potions={r.spoils.potions}
                gems={r.spoils.gems}
              />
            </>
          )}
          {progress.length > 0 && (
            <Panel style={{ gap: 8 }}>
              <Eyebrow>STRONGER TOGETHER</Eyebrow>
              {progress.map((c) => (
                <View key={c.id} style={{ gap: 3 }}>
                  <RewardItem
                    icon={
                      c.levels > 0 ? "arrow-up-bold-circle" : "star-four-points"
                    }
                    label={`${c.name}${c.levels > 0 ? ` · Lv. ${c.level}` : ""}`}
                    value={
                      c.experience > 0
                        ? `+${c.experience} XP`
                        : c.mastery > 0
                          ? `+${c.mastery} mastery`
                          : "New skill"
                    }
                  />
                  {c.skills.length > 0 && (
                    <Copy muted style={{ fontSize: 13 }}>
                      {c.skills.join(" · ")}
                    </Copy>
                  )}
                </View>
              ))}
            </Panel>
          )}
          {r.characters.some((c) => c.injuries > 0) && (
            <Copy muted style={{ fontSize: 13 }}>
              Visit the inn or treat injured companions before the next trip.
            </Copy>
          )}
          <Button
            icon="home"
            label="Continue to town"
            onPress={() => {
              dispatch({ type: "ACK_REPORT" });
              router.replace("/town");
            }}
          />
        </View>
      </Frame>
    </Guard>
  );
}
