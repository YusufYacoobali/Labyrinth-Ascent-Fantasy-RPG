import React from "react";
import { View } from "react-native";
import {
  Atlas,
  Button,
  Choice,
  Copy,
  Eyebrow,
  Icon,
  Panel,
  art,
} from "./game-ui";
import { SceneImage } from "./scene-motion";
import { useGame } from "@/game/provider";
import { newTownLife, openingLine, townMoments } from "@/game/town-life";
import { storyLeads } from "@/game/stories";
import { theme as t } from "@/theme";

export function TownLifeScene() {
  const { state, dispatch } = useGame();
  const life = state.townLife || newTownLife();
  const hero = state.party.find((c) => c.id === "hero");
  if (!life.introSeen && hero)
    return (
      <View style={{ padding: 22, gap: 18, justifyContent: "center", flex: 1 }}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Atlas index={hero.portrait} size={104} />
          <Copy title style={{ color: t.color.goldLight, fontSize: 27 }}>
            Big dreams. Small purse.
          </Copy>
        </View>
        <Panel style={{ gap: 12 }}>
          <Eyebrow>{hero.name}</Eyebrow>
          <Copy
            style={{ fontFamily: t.font.story, fontSize: 23, lineHeight: 29 }}
          >
            “{openingLine(hero.race)}”
          </Copy>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Icon name="gold" size={28} />
            <Copy>{state.gold} gold</Copy>
            <Icon name="sack" size={26} />
            <Copy>{state.food} ration</Copy>
          </View>
        </Panel>
        <Button
          label="Let’s make it count"
          onPress={() => dispatch({ type: "ACK_OPENING" })}
        />
      </View>
    );
  if (life.result)
    return (
      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
          <Icon name="heart-outline" size={44} />
          <Copy
            title
            style={{
              fontSize: 27,
              textAlign: "center",
              color: t.color.goldLight,
            }}
          >
            {life.result.title}
          </Copy>
        </View>
        <Copy
          style={{ fontFamily: t.font.story, fontSize: 22, lineHeight: 29 }}
        >
          {life.result.body}
        </Copy>
        {life.result.bonds.map((bond) => (
          <View
            key={bond.name}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Icon
              name="heart"
              color={bond.change > 0 ? t.color.green : t.color.red}
              size={24}
            />
            <Copy
              style={{ color: bond.change > 0 ? t.color.green : t.color.red }}
            >
              {bond.name} · {bond.change > 0 ? "+" : ""}
              {bond.change} loyalty
            </Copy>
          </View>
        ))}
        {life.result.pair && (
          <Copy style={{ color: t.color.goldLight }}>
            {life.result.pair.names} · +{life.result.pair.change} bond
          </Copy>
        )}
        <Button
          label="Back to Stormhold"
          onPress={() => dispatch({ type: "ACK_TOWN_RESULT" })}
        />
      </View>
    );
  const active = life.active;
  const moment = townMoments(state).find(
    (m) => m.id === active?.id && m.companion === active.companion,
  );
  if (!moment)
    return (
      <View style={{ padding: 20, gap: 12 }}>
        <Copy>
          Your companion has stepped away. Catch up with them another time.
        </Copy>
        <Button
          label="Back to town"
          onPress={() => dispatch({ type: "CLOSE_TOWN_MOMENT" })}
        />
      </View>
    );
  return (
    <View style={{ paddingBottom: 20, gap: 14 }}>
      <SceneImage
        source={art.town}
        contentFit="cover"
        style={{ width: "100%", aspectRatio: 1.7 }}
      />
      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Atlas index={moment.portrait} size={56} />
          <View style={{ flex: 1 }}>
            <Eyebrow>{moment.name} · IN TOWN</Eyebrow>
            <Copy title style={{ fontSize: 23 }}>
              {moment.title}
            </Copy>
          </View>
        </View>
        <Copy
          style={{ fontFamily: t.font.story, fontSize: 22, lineHeight: 28 }}
        >
          {moment.body}
        </Copy>
        <Choice
          label={moment.action}
          icon="heart-outline"
          tone="blue"
          onPress={() =>
            dispatch({ type: "TOWN_MOMENT_CHOICE", choice: "join" })
          }
        />
        <Choice
          label="Wish them well and keep preparing"
          icon="walk"
          tone="dark"
          onPress={() =>
            dispatch({ type: "TOWN_MOMENT_CHOICE", choice: "leave" })
          }
        />
        <Button
          small
          tone="dark"
          label="Come back later"
          onPress={() => dispatch({ type: "CLOSE_TOWN_MOMENT" })}
        />
      </View>
    </View>
  );
}

export function TownLifeBoard() {
  const { state, dispatch } = useGame();
  const lead = storyLeads(state).find(
    (c) => c.stages[state.stories.stages[c.id] || 0].location === "town",
  );
  const moment = townMoments(state)[0];
  if (!lead && !moment) return null;
  const companion =
    lead &&
    [...state.party, ...state.reserve].find((c) => c.id === lead.companion);
  return (
    <Panel style={{ padding: 9, gap: 7 }}>
      <Eyebrow>AROUND STORMHOLD</Eyebrow>
      {lead && (
        <Button
          small
          compact
          icon="chat-outline"
          tone="blue"
          label={`${companion?.name || "Town news"} · ${lead.stages[state.stories.stages[lead.id] || 0].title}`}
          onPress={() => dispatch({ type: "OPEN_STORY", id: lead.id })}
        />
      )}
      {moment && (
        <Button
          small
          compact
          icon="heart-outline"
          tone="dark"
          label={`Spend a moment with ${moment.name}`}
          onPress={() =>
            dispatch({
              type: "OPEN_TOWN_MOMENT",
              id: moment.id,
              companion: moment.companion,
            })
          }
        />
      )}
    </Panel>
  );
}
