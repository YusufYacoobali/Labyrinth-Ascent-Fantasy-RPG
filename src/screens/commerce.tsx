import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  art,
  Atlas,
  Bar,
  Button,
  Copy,
  Divider,
  Eyebrow,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import {
  daysToGate,
  gateOpen,
  buyPrice,
  marketRush,
  questProgress,
  RACES,
  RECRUITS,
  sellPrice,
} from "@/game/engine";
import { ITEMS, QUESTS, Vendor, VENDORS } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";
const quality = {
  common: t.color.muted,
  fine: t.color.green,
  rare: t.color.blue,
  legendary: t.color.gold,
};

export function TavernScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState("Recruit");
  const [selected, setSelected] = useState<string | null>(null);
  const [offer, setOffer] = useState("500");
  const recruit = RECRUITS.find((r) => r.id === selected);
  const rapport = selected ? state.rapport[selected] : undefined;
  return (
    <Guard>
      <Frame
        active="Home"
        title="The Wandering Stag"
        subtitle="Good people. Greater stories."
      >
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          {["Recruit", "Rumours", "Quests"].map((x) => (
            <Button
              key={x}
              small
              compact
              label={x}
              style={{ flex: 1 }}
              tone={tab === x ? "gold" : "dark"}
              onPress={() => setTab(x)}
            />
          ))}
        </View>
        <Image
          source={art.tavernMock}
          contentFit="fill"
          style={{ width: "100%", aspectRatio: 1792 / 768 }}
          accessibilityLabel="New faces? The labyrinth always needs more heroes."
        />
        <View style={{ padding: 12, gap: 10 }}>
          {tab === "Recruit" ? (
            <>
              {recruit && !state.party.some((c) => c.id === recruit.id) && (
                <Panel style={{ borderColor: t.color.goldDim, gap: 11 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Atlas
                      index={RACES.find((r) => r.id === recruit.race)!.portrait}
                      size={64}
                    />
                    <View style={{ flex: 1 }}>
                      <Copy title>{recruit.name}</Copy>
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        Trust {rapport?.trust || 0}/3 · Signing price{" "}
                        {recruit.price}g
                      </Copy>
                      <Bar
                        value={rapport?.trust || 0}
                        max={3}
                        color={t.color.gold}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close conversation"
                      onPress={() => setSelected(null)}
                      style={{ padding: 10 }}
                    >
                      <Icon name="close" />
                    </Pressable>
                  </View>
                  <Copy style={{ fontSize: 13, fontStyle: "italic" }}>
                    {rapport?.reply || recruit.quote}
                  </Copy>
                  <Button
                    label={
                      rapport?.inspected
                        ? "Strengths understood"
                        : "Ask about their strengths"
                    }
                    small
                    tone="blue"
                    disabled={rapport?.inspected}
                    onPress={() =>
                      dispatch({
                        type: "TALK",
                        id: recruit.id,
                        choice: "strengths",
                      })
                    }
                  />
                  {rapport?.inspected && (
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      {[
                        ["heart", RACES.find((r) => r.id === recruit.race)!.hp],
                        [
                          "sword",
                          RACES.find((r) => r.id === recruit.race)!.atk,
                        ],
                        [
                          "shield",
                          RACES.find((r) => r.id === recruit.race)!.def,
                        ],
                      ].map(([icon, n]) => (
                        <View
                          key={String(icon)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Icon name={String(icon)} size={17} />
                          <Copy style={{ fontSize: 12 }}>{n}</Copy>
                        </View>
                      ))}
                    </View>
                  )}
                  {!rapport?.asked && (
                    <>
                      <Copy muted style={{ fontSize: 12 }}>
                        Tell them what your party stands for.
                      </Copy>
                      <View style={{ flexDirection: "row", gap: 5 }}>
                        {[
                          ["honor", "Loyalty"],
                          ["discovery", "Discovery"],
                          ["glory", "Glory"],
                        ].map(([id, label]) => (
                          <Button
                            key={id}
                            label={label}
                            small
                            tone="dark"
                            style={{ flex: 1 }}
                            onPress={() =>
                              dispatch({
                                type: "TALK",
                                id: recruit.id,
                                choice: id as "honor" | "discovery" | "glory",
                              })
                            }
                          />
                        ))}
                      </View>
                    </>
                  )}
                  {rapport && rapport.trust >= 2 && (
                    <Panel
                      style={{
                        padding: 9,
                        backgroundColor: "#18332d",
                        borderColor: t.color.green,
                      }}
                    >
                      <Copy style={{ fontSize: 12, color: t.color.green }}>
                        Hidden trait: {recruit.trait}
                      </Copy>
                      <Copy style={{ fontSize: 12 }}>
                        {recruit.traitDetail}
                      </Copy>
                    </Panel>
                  )}
                  <Divider />
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Eyebrow>YOUR SIGNING OFFER</Eyebrow>
                      <TextInput
                        accessibilityLabel="Signing gold offer"
                        keyboardType="number-pad"
                        value={offer}
                        onChangeText={(v) =>
                          setOffer(v.replace(/[^0-9]/g, "").slice(0, 6))
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: t.color.goldDim,
                          borderRadius: 4,
                          padding: 10,
                          color: t.color.goldLight,
                          fontFamily: t.font.bold,
                          fontSize: 17,
                          marginTop: 4,
                        }}
                      />
                    </View>
                    <Button
                      label={`Offer ${Number(offer) || 0}g`}
                      small
                      tone="green"
                      disabled={
                        !Number(offer) ||
                        Number(offer) > state.gold ||
                        state.party.length >= 4
                      }
                      onPress={() =>
                        dispatch({
                          type: "RECRUIT",
                          id: recruit.id,
                          offer: Number(offer),
                        })
                      }
                    />
                  </View>
                  <Copy muted style={{ fontSize: 11 }}>
                    A fair conversation lowers the price. A rejected offer costs
                    no gold.
                  </Copy>
                </Panel>
              )}
              {RECRUITS.map((r) => {
                const race = RACES.find((x) => x.id === r.race)!;
                const own = state.party.find((c) => c.id === r.id);
                return (
                  <Panel
                    key={r.id}
                    style={{
                      padding: 8,
                      backgroundColor: t.color.parchment,
                      borderColor: t.color.gold,
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Atlas
                      index={race.portrait}
                      size={61}
                      style={{
                        borderWidth: 1,
                        borderColor: t.color.goldDim,
                        borderRadius: 3,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Copy
                        title
                        style={{
                          fontSize: 16,
                          lineHeight: 22,
                          color: "#302922",
                        }}
                      >
                        {r.name}
                      </Copy>
                      <Copy
                        style={{
                          fontSize: 11,
                          lineHeight: 16,
                          color: "#453a30",
                        }}
                      >
                        {race.name} {race.job}
                      </Copy>
                      <Copy
                        style={{
                          fontSize: 11,
                          lineHeight: 16,
                          color: "#655442",
                        }}
                      >
                        {own?.traitRevealed ? own.trait : r.tagline}
                      </Copy>
                    </View>
                    <Atlas sprite index={race.portrait} size={43} />
                    <Button
                      label={
                        own
                          ? "Joined"
                          : state.reserve.some((c) => c.id === r.id)
                            ? "Invite back"
                            : "Talk"
                      }
                      small
                      tone="green"
                      disabled={!!own || state.party.length >= 4}
                      onPress={() => {
                        if (state.reserve.some((c) => c.id === r.id)) {
                          dispatch({ type: "RECRUIT", id: r.id });
                          return;
                        }
                        setSelected(r.id);
                        setOffer(
                          String(
                            Math.max(
                              100,
                              r.price -
                                (state.rapport[r.id]?.trust || 0) * 45 -
                                state.faction.guild * 5,
                            ),
                          ),
                        );
                      }}
                    />
                  </Panel>
                );
              })}
            </>
          ) : tab === "Rumours" ? (
            <Panel>
              <Copy title style={{ marginTop: 8 }}>
                Rumours
              </Copy>
              <Divider />
              <Copy>
                Plunderers dress like adventurers. On the first floor, keep
                someone awake when strangers ask to share your camp.
              </Copy>
              <Divider />
              <Copy muted>
                The White Stag keeps a checkpoint on Floor 3. Win their trust
                before choosing a route through the Fourfold Gate.
              </Copy>
              <Divider />
              <Copy style={{ color: t.color.gold, fontSize: 13 }}>
                Shops raise prices 15% during the last three days before an
                opening. Buy early. Sell your cores to the guild.
              </Copy>
            </Panel>
          ) : (
            <Panel>
              <Copy title>Contracts</Copy>
              <Copy muted style={{ marginTop: 10 }}>
                The guild pays for guardians and plunderers. The White Stag
                rewards companions who keep their promises.
              </Copy>
              <Divider />
              <Button
                label="Visit the guild"
                onPress={() => router.push("/guild")}
              />
            </Panel>
          )}
        </View>
      </Frame>
    </Guard>
  );
}

export function ShopScreen() {
  const { state, dispatch } = useGame();
  const params = useLocalSearchParams<{ vendor?: string; mode?: string }>();
  const [vendor, setVendor] = useState<Vendor>(
    params.vendor === "guild" ? "guild" : "provisioner",
  );
  const [mode, setMode] = useState(params.mode === "sell" ? "Sell" : "Buy");
  const [recipient, setRecipient] = useState(state.party[0]?.id);
  const goods = ITEMS.filter((i) =>
    mode === "Sell"
      ? (state.inventory[i.id] || 0) > 0
      : i.vendor === vendor && i.kind !== "loot",
  );
  return (
    <Guard>
      <Frame active="Home" title="Stormhold Market">
        <View style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {VENDORS.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityLabel={v.name}
                accessibilityState={{ selected: vendor === v.id }}
                onPress={() => setVendor(v.id)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: vendor === v.id ? t.color.gold : t.color.line,
                  padding: 9,
                  borderRadius: 5,
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: vendor === v.id ? "#302b22" : t.color.panel,
                }}
              >
                <Icon name={v.icon} />
                <Copy
                  style={{ fontSize: 10, lineHeight: 15, textAlign: "center" }}
                >
                  {v.name}
                </Copy>
                <Copy
                  style={{
                    fontSize: 9,
                    lineHeight: 12,
                    color:
                      quality[v.quality.toLowerCase() as keyof typeof quality],
                  }}
                >
                  {v.quality}
                </Copy>
              </Pressable>
            ))}
          </View>
          {marketRush(state.day) && (
            <Panel
              style={{
                padding: 9,
                borderColor: t.color.goldDim,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Icon name="clock-outline" size={18} />
              <Copy style={{ fontSize: 11, flex: 1 }}>
                Gate-season demand: purchase prices are 15% higher. Sell prices
                stay stable.
              </Copy>
            </Panel>
          )}
          <View style={{ flexDirection: "row", gap: 6 }}>
            {["Buy", "Sell"].map((x) => (
              <Button
                key={x}
                label={x}
                small
                style={{ flex: 1 }}
                tone={mode === x ? "gold" : "dark"}
                onPress={() => {
                  setMode(x);
                  if (x === "Buy" && vendor === "guild")
                    setVendor("provisioner");
                }}
              />
            ))}
          </View>
          {mode === "Sell" && (
            <Button
              label={
                vendor === "guild"
                  ? "Selling to the guild"
                  : "Sell to the Adventurers’ Guild"
              }
              icon="shield-check"
              small
              tone={vendor === "guild" ? "gold" : "dark"}
              onPress={() => setVendor("guild")}
            />
          )}
          <Eyebrow>
            {vendor === "guild"
              ? "GUILD APPRAISAL"
              : VENDORS.find((v) => v.id === vendor)?.name}{" "}
            · {mode === "Buy" ? "EQUIPMENT & SUPPLIES" : "EXPEDITION SPOILS"}
          </Eyebrow>
          {mode === "Sell" && (
            <Copy muted style={{ fontSize: 12 }}>
              Matching buyers pay 30% above appraisal; other buyers pay 15%
              less. Compare before you sell.
            </Copy>
          )}
          {mode === "Buy" && (
            <View style={{ flexDirection: "row", gap: 5 }}>
              {state.party.map((c) => (
                <Button
                  key={c.id}
                  small
                  label={c.name}
                  tone={recipient === c.id ? "blue" : "dark"}
                  onPress={() => setRecipient(c.id)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          )}
          {goods.length ? (
            goods.map((item) => {
              const qty = state.inventory[item.id] || 0;
              const price =
                mode === "Buy"
                  ? buyPrice(item, state.day)
                  : sellPrice(item, vendor);
              return (
                <Panel
                  key={item.id}
                  style={{
                    padding: 13,
                    borderColor: quality[item.quality],
                    gap: 9,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 13,
                      alignItems: "center",
                    }}
                  >
                    <Panel
                      style={{
                        padding: 9,
                        width: 53,
                        height: 56,
                        alignItems: "center",
                        justifyContent: "center",
                        borderColor: quality[item.quality],
                      }}
                    >
                      <Icon
                        name={item.icon}
                        color={quality[item.quality]}
                        size={32}
                      />
                    </Panel>
                    <View style={{ flex: 1 }}>
                      <Copy title style={{ fontSize: 15, lineHeight: 21 }}>
                        {item.name}
                      </Copy>
                      <Copy
                        style={{
                          fontSize: 10,
                          lineHeight: 15,
                          color: quality[item.quality],
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {item.quality} · {item.kind}
                      </Copy>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Copy
                        style={{
                          color: t.color.gold,
                          fontFamily: t.font.bold,
                          fontSize: 17,
                        }}
                      >
                        {price}g
                      </Copy>
                      <Copy muted style={{ fontSize: 10 }}>
                        Owned{" "}
                        {item.effect === "food"
                          ? state.food
                          : item.effect === "potion"
                            ? state.potions
                            : qty}
                      </Copy>
                    </View>
                  </View>
                  <Copy muted style={{ fontSize: 12, lineHeight: 18 }}>
                    {item.description}
                  </Copy>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {mode === "Buy" ? (
                      <>
                        <Button
                          label={`Buy ${item.name}`}
                          small
                          disabled={state.gold < price}
                          onPress={() =>
                            dispatch({ type: "BUY_ITEM", id: item.id })
                          }
                          style={{ flex: 1 }}
                        />
                        {["weapon", "armor", "charm"].includes(item.kind) && (
                          <Button
                            label="Equip"
                            small
                            tone="blue"
                            disabled={!qty}
                            onPress={() =>
                              dispatch({
                                type: "EQUIP",
                                character: recipient,
                                item: item.id,
                              })
                            }
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          label={`Sell one · ${price}g`}
                          small
                          tone="green"
                          style={{ flex: 1 }}
                          onPress={() =>
                            dispatch({
                              type: "SELL",
                              id: item.id,
                              vendor,
                              quantity: 1,
                            })
                          }
                        />
                        <Button
                          label={`Sell all · ${price * qty}g`}
                          small
                          style={{ flex: 1 }}
                          onPress={() =>
                            dispatch({
                              type: "SELL",
                              id: item.id,
                              vendor,
                              quantity: qty,
                            })
                          }
                        />
                      </>
                    )}
                  </View>
                </Panel>
              );
            })
          ) : (
            <Panel style={{ padding: 25, alignItems: "center", gap: 10 }}>
              <Icon name="sack" size={40} />
              <Copy title>No spoils to trade yet.</Copy>
              <Copy muted style={{ fontSize: 13, textAlign: "center" }}>
                Monster cores, herbs, and fragments arrive from expeditions.
                Keep useful supplies for the next ascent.
              </Copy>
            </Panel>
          )}
        </View>
      </Frame>
    </Guard>
  );
}

export function GuildScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState("Prepare");
  return (
    <Guard>
      <Frame
        background={tab === "Clans" ? art.clan : art.town}
        active="Home"
        title="Adventurers’ Guild"
      >
        <View style={{ padding: 16, gap: 13 }}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {["Prepare", "Contracts", "Clans"].map((x) => (
              <Button
                key={x}
                label={x}
                small
                tone={tab === x ? "gold" : "dark"}
                style={{ flex: 1 }}
                onPress={() => setTab(x)}
              />
            ))}
          </View>
          {tab === "Prepare" ? (
            <>
              <Copy>
                Day {state.day} ·{" "}
                {gateOpen(state.day)
                  ? "Gate open"
                  : `${daysToGate(state.day)} days to opening`}
              </Copy>
              <Panel>
                <Icon name="sword-cross" size={35} />
                <Copy title style={{ marginTop: 8 }}>
                  Train together
                </Copy>
                <Copy muted>+45 XP per companion. 60 gold per day.</Copy>
                <Divider />
                <Button
                  label="Train · 60 gold · +1 day"
                  disabled={state.gold < 60}
                  onPress={() => dispatch({ type: "TRAIN" })}
                />
              </Panel>
              <Panel>
                <Copy title>Town contracts</Copy>
                <Copy muted style={{ marginTop: 7 }}>
                  +125 gold and +1 guild standing per day.
                </Copy>
                <Divider />
                <Button
                  label="Work · +125 gold · +1 day"
                  tone="blue"
                  onPress={() => dispatch({ type: "WORK" })}
                />
              </Panel>
              <Panel style={{ gap: 10 }}>
                <Copy title>Rest at the inn</Copy>
                <Copy muted>Restore HP and MP.</Copy>
                <Button
                  label="Rest · +1 day"
                  tone="blue"
                  onPress={() => dispatch({ type: "REST" })}
                />
              </Panel>
              {!gateOpen(state.day) && (
                <Panel style={{ gap: 10 }}>
                  <Copy title>Prepare until opening</Copy>
                  <Button
                    label="Rest until opening"
                    tone="blue"
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "rest" })
                    }
                  />
                  <Button
                    label={`Work · +${daysToGate(state.day) * 125} gold`}
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "work" })
                    }
                  />
                  <Button
                    label={`Train · ${daysToGate(state.day) * 60} gold`}
                    tone="dark"
                    disabled={state.gold < daysToGate(state.day) * 60}
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "train" })
                    }
                  />
                </Panel>
              )}
              <Button
                label="Sell expedition spoils"
                icon="sack"
                onPress={() =>
                  router.push({
                    pathname: "/shop",
                    params: { vendor: "guild", mode: "sell" },
                  })
                }
              />
              <Copy muted style={{ fontSize: 12, textAlign: "center" }}>
                The guild pays a premium for monster cores.
              </Copy>
            </>
          ) : tab === "Contracts" ? (
            <>
              {QUESTS.map((q) => {
                const status = state.quests[q.id];
                const progress = questProgress(state, q.id);
                const ready = status === "accepted" && progress >= q.target;
                return (
                  <Panel
                    key={q.id}
                    style={{
                      borderColor: ready ? t.color.gold : t.color.line,
                      gap: 9,
                    }}
                  >
                    <Eyebrow>{q.faction}</Eyebrow>
                    <Copy title style={{ fontSize: 18 }}>
                      {q.title}
                    </Copy>
                    <Copy muted style={{ fontSize: 13 }}>
                      {q.description}
                    </Copy>
                    <Bar
                      value={progress}
                      max={q.target}
                      color={ready ? t.color.gold : t.color.blue}
                      label={`${progress}/${q.target} · ${q.gold} gold · ${q.gems} crystals`}
                    />
                    <Button
                      label={
                        status === "claimed"
                          ? "Contract fulfilled"
                          : ready
                            ? "Turn in contract"
                            : status === "accepted"
                              ? "Contract in progress"
                              : "Accept contract"
                      }
                      small
                      tone={ready ? "gold" : "blue"}
                      disabled={
                        status === "claimed" ||
                        (status === "accepted" && !ready) ||
                        (q.id === "clan-rescue" && !state.clanAlly)
                      }
                      onPress={() =>
                        dispatch(
                          ready
                            ? { type: "CLAIM", id: q.id }
                            : { type: "ACCEPT", id: q.id },
                        )
                      }
                    />
                  </Panel>
                );
              })}
            </>
          ) : (
            <>
              <Panel>
                <Icon name="shield-check" size={42} />
                <Copy title>Adventurers’ Guild</Copy>
                <Copy muted style={{ marginTop: 8 }}>
                  Complete contracts to gain standing.
                </Copy>
                <Divider />
                <Copy style={{ color: t.color.gold }}>
                  Standing {state.faction.guild} · Signing offers improve by 5g
                  per standing
                </Copy>
              </Panel>
              <Panel>
                <Icon name="shield-star" size={42} />
                <Copy title>The White Stag</Copy>
                <Copy muted style={{ marginTop: 8 }}>
                  Commander Serin’s clan holds Floor 3. An alliance unlocks the
                  missing-scouts contract on Floor 9.
                </Copy>
                <Divider />
                <Copy
                  style={{
                    color: state.clanAlly ? t.color.green : t.color.gold,
                  }}
                >
                  Standing {state.faction.stag} ·{" "}
                  {state.clanAlly ? "Allied" : "Meet them in the labyrinth"}
                </Copy>
              </Panel>
            </>
          )}
        </View>
      </Frame>
    </Guard>
  );
}
