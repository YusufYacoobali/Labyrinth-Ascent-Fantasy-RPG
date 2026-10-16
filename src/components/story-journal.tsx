import { optionalGoals } from "@/game/expedition-report";
import { StoryStageArt } from "./story-art";
import { StoryCard } from "./story-card";
import { NpcPortrait } from "./npc-portrait";
import { WORLD_NPCS, type WorldNpcId } from "@/game/world-npcs";
import { reconciliationStage } from "@/game/reconciliation";
import { ROUTE_FACTIONS } from "@/game/route-stories";
import React from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { Atlas, Button, Copy, Panel } from "./game-ui";
import { useGame } from "@/game/provider";
import {
  loyalty,
  presentStoryStage,
  pairRelationship,
  storyLeads,
  STORY_CHAINS,
} from "@/game/stories";
import { theme as t } from "@/theme";

export function StoryLeads({ companion }: { companion?: string }) {
  const { state, dispatch } = useGame();
  const leads = storyLeads(state).filter(
    (c) => !companion || c.companion === companion,
  );
  if (!leads.length) return null;
  return (
    <Panel style={{ padding: 12, gap: 8 }}>
      <Copy title style={{ fontSize: 19 }}>
        Unfinished stories
      </Copy>
      {leads.map((c) => (
        <Button
          key={c.id}
          small
          tone="dark"
          label={c.stages[state.stories.stages[c.id] || 0].title}
          onPress={() => dispatch({ type: "OPEN_STORY", id: c.id })}
        />
      ))}
      <Copy muted style={{ fontSize: 11 }}>
        Optional · recorded decisions and rewards persist.
      </Copy>
    </Panel>
  );
}
export function CompanionRelationships({ id }: { id: string }) {
  const { state, dispatch } = useGame();
  if (id === "hero") return null;
  return (
    <Panel style={{ padding: 12, gap: 8 }}>
      <Copy title>Loyalty {loyalty(state, id)}/100</Copy>
      {loyalty(state, id) < 25 && (
        <>
          <Copy>Reconciliation is required before the next expedition.</Copy>
          {state.phase === "town" && (
            <Button
              label="Talk and reconcile"
              small
              onPress={() => dispatch({ type: "RECONCILE", id })}
            />
          )}
        </>
      )}
      {state.party
        .filter((c) => c.id !== id && c.id !== "hero")
        .map((c) => (
          <Copy key={c.id} muted style={{ fontSize: 12 }}>
            {c.name} · {pairRelationship(state, id, c.id)}
          </Copy>
        ))}
      <Copy muted style={{ fontSize: 12 }}>
        Bonded companions reduce one incoming hit to their partner by 15% each
        round while standing and unimpeded. Hostile pairs decline optional
        cooperation in personal stories.
      </Copy>
    </Panel>
  );
}
export function StoryScene() {
  const { state, dispatch } = useGame();
  const active = state.stories.active,
    chain = STORY_CHAINS.find((c) => c.id === active?.chain);
  const base = chain?.stages.find((s) => s.id === active?.stage);
  const stage =
    reconciliationStage(state) ||
    (base ? presentStoryStage(state, base) : undefined);
  if (!stage) return null;
  const companionId = active?.chain.startsWith("reconcile.")
    ? active.chain.slice(10)
    : chain?.companion;
  const companion = [...state.party, ...state.reserve].find(
    (c) => c.id === companionId,
  );
  return (
    <View
      style={{
        flex: 1,
        gap: 12,
        paddingBottom: 20,
        backgroundColor: t.color.bg,
      }}
    >
      <StoryStageArt stage={stage} />
      <StoryCard
        title={stage.title}
        body={stage.body}
        portrait={
          companion ? <Atlas index={companion.portrait} size={48} /> : undefined
        }
      >
        {stage.choices.map((c) => (
          <Button
            key={c.id}
            label={c.label}
            tone="dark"
            onPress={() => {
              dispatch({ type: "STORY_CHOICE", stage: stage.id, choice: c.id });
              if (stage.location === "town") router.replace("/town");
            }}
          />
        ))}
        <Button
          small
          label="Continue later"
          tone="dark"
          onPress={() => dispatch({ type: "CLOSE_STORY" })}
        />
      </StoryCard>
    </View>
  );
}
export function StoryChronicle() {
  const { state } = useGame();
  return (
    <View style={{ gap: 8 }}>
      <Panel style={{ padding: 12, gap: 6 }}>
        <Copy title>Faction standing</Copy>
        <Copy muted>
          Guild {state.faction.guild} · White Stag {state.faction.stag}
        </Copy>
        <Copy muted style={{ fontSize: 12 }}>
          At 10 standing with the Guild, White Stag or your current route
          faction, allies add one ration to each sanctuary cache. Caches
          replenish next expedition.
        </Copy>
        {Object.entries(ROUTE_FACTIONS).map(([id, name]) => (
          <Copy key={id} muted style={{ fontSize: 12 }}>
            {name}: {state.stories.factions[id as keyof typeof ROUTE_FACTIONS]}
          </Copy>
        ))}
      </Panel>
      {state.ending && (
        <Panel style={{ gap: 6 }}>
          <Copy title>Optional journeys</Copy>
          {optionalGoals(state).map((g) => (
            <Copy key={g.label}>
              {g.label}: {g.value}/{g.target}
            </Copy>
          ))}
        </Panel>
      )}
      {Object.entries(state.npcs || {}).map(([id, memory]) => (
        <Panel key={id} style={{ gap: 5, padding: 12 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <NpcPortrait id={id} width={54} />
            <Copy title style={{ flex: 1 }}>
              {WORLD_NPCS[id as WorldNpcId]?.name || id}
            </Copy>
          </View>
          <Copy muted>
            {memory.visits} meetings · trust {memory.trust} · last decisions:{" "}
            {memory.decisions.join(", ")}
          </Copy>
          <Copy muted>
            {id === "sable"
              ? memory.trust >= 2
                ? "Shared surveys are available at future meetings."
                : memory.trust < 0
                  ? "The rival crew remembers your disputed claim."
                  : "Earlier aid can lead to a shared survey."
              : id === "tamsin" && memory.trust >= 3
                ? "Trusted core trades include a fourth ration."
                : "Your earlier help will be remembered at the next meeting."}
          </Copy>
        </Panel>
      ))}
      {STORY_CHAINS.filter((c) => state.stories.stages[c.id]).map((c) => {
        const progress = state.stories.stages[c.id],
          complete = progress >= c.stages.length;
        return (
          <Panel key={c.id} style={{ padding: 12, gap: 6 }}>
            <Copy title>
              {c.title} · {progress}/{c.stages.length}
            </Copy>
            <Copy muted style={{ fontSize: 11 }}>
              {c.category === "unique"
                ? "Unique named chain"
                : c.category === "floor"
                  ? "Floor-specific chain"
                  : "Route-exclusive chain"}
            </Copy>
            <Copy style={{ fontSize: 13 }}>
              {complete
                ? c.aftermath
                : `Next: ${c.stages[progress].title} · ${c.stages[progress].location === "town" ? `town after Floor ${c.stages[progress].bestFloor || 0}` : `Floor ${c.stages[progress].floor}${c.stages[progress].site === "shelter" ? " · established sanctuary" : c.stages[progress].site === "portal" ? " · opened portal" : ""}`}`}
            </Copy>
            {c.stages.slice(0, progress).map((stage) => (
              <Copy key={stage.id} muted style={{ fontSize: 12 }}>
                {state.stories.history.find((h) => h.stage === stage.id)
                  ?.outcome ||
                  stage.choices.find(
                    (ch) => ch.id === state.stories.outcomes[stage.id],
                  )?.outcome}
              </Copy>
            ))}
          </Panel>
        );
      })}
    </View>
  );
}
