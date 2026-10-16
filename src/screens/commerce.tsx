import { FactionOpportunities } from "@/components/faction-opportunities";
import { RecruitReplyDialog } from "@/components/recruit-reply";
import { gearFloor } from "@/game/build-equipment";
import { factionAccess } from "@/game/faction-opportunities";
import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { SceneImage } from "@/components/scene-motion";
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
  makeCharacter,
  recruitAvailable,
  recruitShare,
  TOWN_RUMOURS,
  sellPrice,
} from "@/game/engine";
import { ITEMS, QUESTS, Vendor } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";
import { trainingLimit, trainingXp } from "@/game/town-progression";
import {
  Surface,
  TabStrip,
  Ornament,
  ItemGlyph,
} from "@/components/native-chrome";

export function TavernScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState("Recruit");
  const [selected, setSelected] = useState<string | null>(null);
  const [offer, setOffer] = useState("14");
  const [roster, setRoster] = useState("Available");
  const recruit = RECRUITS.find((r) => r.id === selected);
  const rapport = selected ? state.rapport[selected] : undefined;
  const askingShare = (trust: number) =>
    recruit ? recruitShare(state, recruit, trust) : 14;
  const recruitBuild = recruit
    ? makeCharacter(recruit.race, recruit.id, recruit.name)
    : null;
  return (
    <Guard>
      <Frame
        active="Home"
        title="The Wandering Stag"
        subtitle="Good people. Greater stories."
      >
        <TabStrip
          tabs={["Recruit", "Rumours", "Quests"]}
          active={tab}
          onChange={setTab}
        />
        <SceneImage
          source={art.tavernScene}
          contentFit="fill"
          style={{ width: "100%", aspectRatio: 1.5 }}
          accessibilityLabel="Elise: New faces! The labyrinth always needs more heroes. Care to join our story?"
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
                    <Atlas index={recruitBuild!.portrait} size={64} />
                    <View style={{ flex: 1 }}>
                      <Copy title>{recruit.name}</Copy>
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        Trust {rapport?.trust || 0}/3 · Asking{" "}
                        {askingShare(rapport?.trust || 0)}% of gold
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
                    onPress={() => {
                      dispatch({
                        type: "TALK",
                        id: recruit.id,
                        choice: "strengths",
                      });
                      setOffer(String(askingShare((rapport?.trust || 0) + 1)));
                    }}
                  />
                  {rapport?.inspected && (
                    <Copy style={{ fontSize: 12, color: t.color.blue }}>
                      Skills: {recruitBuild!.skills.join(", ")} · MP{" "}
                      {recruitBuild!.maxMp} · SPD {recruitBuild!.speed}
                    </Copy>
                  )}
                  {rapport?.inspected && (
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      {[
                        ["heart", recruitBuild!.maxHp],
                        ["sword", recruitBuild!.atk],
                        ["shield", recruitBuild!.def],
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
                            onPress={() => {
                              dispatch({
                                type: "TALK",
                                id: recruit.id,
                                choice: id as "honor" | "discovery" | "glory",
                              });
                              setOffer(
                                String(
                                  askingShare(
                                    Math.max(
                                      0,
                                      (rapport?.trust || 0) +
                                        (id === recruit.motive ? 2 : -1),
                                    ),
                                  ),
                                ),
                              );
                            }}
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
                      <Eyebrow>YOUR LOOT-SHARE OFFER</Eyebrow>
                      <TextInput
                        accessibilityLabel="Loot share percentage"
                        keyboardType="number-pad"
                        value={offer}
                        onChangeText={(v) =>
                          setOffer(v.replace(/[^0-9]/g, "").slice(0, 2))
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
                      label={`Offer ${Number(offer) || 0}%`}
                      small
                      tone="green"
                      disabled={
                        !Number(offer) ||
                        Number(offer) > 50 ||
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
                    10–50% of expedition gold. Skills and a smaller party raise
                    the asking share; trust lowers it.
                  </Copy>
                </Panel>
              )}
              <TabStrip
                tabs={["Available", "Waiting", "All"]}
                active={roster}
                onChange={setRoster}
              />
              <Copy muted style={{ fontSize: 12 }}>
                Party {state.party.length}/4 · Waiting {state.reserve.length}
              </Copy>
              <Copy style={{ fontSize: 12, color: t.color.gold }}>
                Your share:{" "}
                {100 -
                  state.party.reduce(
                    (n, c) => n + (state.contracts[c.id] || 0),
                    0,
                  )}
                % · Companions split the rest
              </Copy>
              {state.party.length >= 4 && (
                <Button
                  small
                  tone="dark"
                  label="Manage party to make room"
                  onPress={() => router.push("/party")}
                />
              )}
              {RECRUITS.filter((r) =>
                roster === "Waiting"
                  ? state.reserve.some((c) => c.id === r.id)
                  : roster === "Available"
                    ? recruitAvailable(state, r) &&
                      !state.party.some((c) => c.id === r.id)
                    : true,
              ).map((r) => {
                const race = RACES.find((x) => x.id === r.race)!;
                const build =
                  state.party.find((c) => c.id === r.id) ||
                  state.reserve.find((c) => c.id === r.id) ||
                  makeCharacter(r.race, r.id, r.name);
                const unlocked = recruitAvailable(state, r);
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
                      index={build.portrait}
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
                        {race.name} {build.job} · Lv. {build.level}
                      </Copy>
                      <Copy
                        style={{
                          fontSize: 11,
                          lineHeight: 16,
                          color: "#655442",
                        }}
                      >
                        {unlocked
                          ? own?.traitRevealed
                            ? own.trait
                            : r.tagline
                          : "Reach Floor " + r.floor}
                      </Copy>
                    </View>
                    <Atlas sprite index={build.portrait} size={43} />
                    <View style={{ alignItems: "center", gap: 3 }}>
                      <Copy
                        style={{
                          fontSize: 11,
                          lineHeight: 15,
                          color: "#70502b",
                        }}
                      >
                        {state.contracts[r.id] !== undefined
                          ? `${state.contracts[r.id]}% agreed`
                          : `${recruitShare(state, r)}% share`}
                      </Copy>
                      <Button
                        label={
                          !unlocked
                            ? "Locked"
                            : own
                              ? "Joined"
                              : state.reserve.some((c) => c.id === r.id)
                                ? "Invite back"
                                : "Talk"
                        }
                        small
                        tone="green"
                        disabled={!unlocked || !!own || state.party.length >= 4}
                        onPress={() => {
                          if (state.reserve.some((c) => c.id === r.id)) {
                            dispatch({ type: "RECRUIT", id: r.id });
                            return;
                          }
                          setSelected(r.id);
                          setOffer(String(recruitShare(state, r)));
                        }}
                      />
                    </View>
                  </Panel>
                );
              })}
            </>
          ) : tab === "Rumours" ? (
            <>
              {TOWN_RUMOURS.filter((r) => state.bestFloor >= r.required).map(
                (r) => (
                  <Panel key={r.id} style={{ gap: 9 }}>
                    <Copy title>{r.speaker}</Copy>
                    {state.heardRumours.includes(r.id) ? (
                      <>
                        <Copy>{r.body}</Copy>
                        <Copy muted style={{ fontSize: 12 }}>
                          Floor {r.floor} added to your chart
                        </Copy>
                      </>
                    ) : (
                      <Button
                        label={r.title}
                        tone="dark"
                        onPress={() => dispatch({ type: "RUMOUR", id: r.id })}
                      />
                    )}
                  </Panel>
                ),
              )}
            </>
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
        <RecruitReplyDialog
          onDone={() => setSelected(null)}
          onCounter={(share) => setOffer(String(share))}
        />
      </Frame>
    </Guard>
  );
}

export function ShopScreen() {
  const { state, dispatch } = useGame();
  const params = useLocalSearchParams<{ vendor?: string; mode?: string }>();
  const [category, setCategory] = useState(
    params.mode === "sell"
      ? "Sell"
      : params.vendor === "alchemist"
        ? "Consumables"
        : params.vendor === "emporium"
          ? "Rare Goods"
          : "Supplies",
  );
  const [recipient, setRecipient] = useState(state.party[0]?.id);
  const recipients = state.party.map((c) => ({
    id: c.id,
    label: c.name + (c.id === "hero" ? " (You)" : ""),
  }));
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState<Vendor>("guild");
  const vendor: Vendor =
    category === "Consumables"
      ? "alchemist"
      : category === "Rare Goods"
        ? "emporium"
        : "provisioner";
  const sell = category === "Sell";
  const goods = ITEMS.filter((i) =>
    sell
      ? (state.inventory[i.id] || 0) > 0
      : i.vendor === vendor &&
        i.kind !== "loot" &&
        (category === "Supplies"
          ? i.kind === "supply"
          : category === "Equipment"
            ? i.kind !== "supply"
            : true),
  );
  const total = ITEMS.reduce(
    (n, i) => n + (cart[i.id] || 0) * buyPrice(i, state.day, state),
    0,
  );
  const quantity = (id: string, n: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(10, n)) }));
  return (
    <Guard>
      <Frame
        active="Home"
        title="Stormhold"
        portrait={state.party[0]?.portrait}
        subtitle={
          "Day " +
          state.day +
          (marketRush(state.day) ? " · Gate-season prices +15%" : "")
        }
      >
        <SceneImage
          source={art.shopScene}
          contentFit="fill"
          style={{ width: "100%", aspectRatio: 1.5 }}
          accessibilityLabel="Provisioner’s Shop. Good gear makes long roads shorter. Everything you need for a safer journey is right here."
        />
        <TabStrip
          tabs={["Supplies", "Equipment", "Consumables", "Rare Goods", "Sell"]}
          active={category}
          onChange={setCategory}
        />
        <View style={{ padding: 10, gap: 7 }}>
          {sell && (
            <TabStrip
              tabs={["Guild", "Provisioner", "Alchemist", "Emporium"]}
              active={
                buyer === "guild"
                  ? "Guild"
                  : buyer === "provisioner"
                    ? "Provisioner"
                    : buyer === "alchemist"
                      ? "Alchemist"
                      : "Emporium"
              }
              onChange={(v) =>
                setBuyer(
                  v === "Guild"
                    ? "guild"
                    : v === "Provisioner"
                      ? "provisioner"
                      : v === "Alchemist"
                        ? "alchemist"
                        : "emporium",
                )
              }
            />
          )}
          {(category === "Rare Goods" ||
            category === "Equipment" ||
            category === "Consumables") && (
            <TabStrip
              tabs={recipients.map((p) => p.label)}
              active={recipients.find((p) => p.id === recipient)?.label || ""}
              onChange={(name) =>
                setRecipient(recipients.find((p) => p.label === name)!.id)
              }
            />
          )}
          {goods.map((item) => {
            const qty = state.inventory[item.id] || 0;
            const owned =
              item.effect === "food"
                ? state.food
                : item.effect === "potion"
                  ? state.potions
                  : qty;
            const price = sell
              ? sellPrice(item, buyer)
              : buyPrice(item, state.day, state);
            return (
              <Surface key={item.id} parchment style={{ padding: 9, gap: 6 }}>
                <View
                  style={{ flexDirection: "row", gap: 9, alignItems: "center" }}
                >
                  <Surface
                    style={{
                      width: 49,
                      height: 57,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ItemGlyph id={item.id} size={37} />
                  </Surface>
                  <View style={{ flex: 1 }}>
                    <Copy
                      title
                      style={{ fontSize: 18, lineHeight: 21, color: "#241e18" }}
                    >
                      {item.name}
                    </Copy>
                    <Copy
                      style={{ fontSize: 12, lineHeight: 15, color: "#44382b" }}
                    >
                      {item.description}
                    </Copy>
                    <Copy
                      style={{ fontSize: 11, lineHeight: 15, color: "#725335" }}
                    >
                      Owned {owned} · {price}g
                      {!sell &&
                      (factionAccess(state, item) ||
                        state.bestFloor < gearFloor(item))
                        ? ` · ${factionAccess(state, item) || `Reach Floor ${gearFloor(item)}`}`
                        : ""}
                    </Copy>
                  </View>
                  {!sell && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          "Remove " + item.name + " from cart"
                        }
                        onPress={() =>
                          quantity(item.id, (cart[item.id] || 0) - 1)
                        }
                        style={{
                          width: 25,
                          height: 35,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#18232e",
                          borderRadius: 3,
                        }}
                      >
                        <Copy>−</Copy>
                      </Pressable>
                      <Copy
                        style={{
                          color: "#241e18",
                          width: 14,
                          textAlign: "center",
                        }}
                      >
                        {cart[item.id] || 0}
                      </Copy>
                      <Pressable
                        accessibilityRole="button"
                        disabled={
                          !!factionAccess(state, item) ||
                          state.bestFloor < gearFloor(item)
                        }
                        accessibilityLabel={"Add " + item.name + " to cart"}
                        onPress={() =>
                          quantity(item.id, (cart[item.id] || 0) + 1)
                        }
                        style={{
                          width: 25,
                          height: 35,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#18232e",
                          borderRadius: 3,
                        }}
                      >
                        <Copy>+</Copy>
                      </Pressable>
                    </View>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    label={
                      sell
                        ? "Sell one · " + price + "g"
                        : "Buy · " + price + "g"
                    }
                    small
                    compact
                    tone="green"
                    disabled={!sell && state.gold < price}
                    onPress={() =>
                      dispatch(
                        sell
                          ? {
                              type: "SELL",
                              id: item.id,
                              vendor: buyer,
                              quantity: 1,
                            }
                          : { type: "BUY_ITEM", id: item.id },
                      )
                    }
                  />
                  {sell ? (
                    <Button
                      label={"Sell all · " + price * qty + "g"}
                      small
                      compact
                      onPress={() =>
                        dispatch({
                          type: "SELL",
                          id: item.id,
                          vendor: buyer,
                          quantity: qty,
                        })
                      }
                    />
                  ) : (
                    item.kind !== "supply" && (
                      <Button
                        label="Equip"
                        small
                        compact
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
                    )
                  )}
                </View>
              </Surface>
            );
          })}
          {!goods.length && (
            <Surface style={{ padding: 20 }}>
              <Copy title>No spoils to sell</Copy>
              <Copy muted>Bring back loot from the labyrinth.</Copy>
            </Surface>
          )}
          {!sell && (
            <Surface style={{ padding: 13, gap: 9 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Copy title>Your Cart</Copy>
                <Copy style={{ color: t.color.gold }}>{total} gold</Copy>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                {ITEMS.filter((i) => cart[i.id] > 0).map((i) => (
                  <Surface
                    key={i.id}
                    style={{ padding: 6, alignItems: "center", gap: 3 }}
                  >
                    <Icon name={i.icon} size={28} />
                    <Copy style={{ fontSize: 11 }}>×{cart[i.id]}</Copy>
                  </Surface>
                ))}
              </View>
              <Button
                label="Purchase All"
                disabled={!total || state.gold < total}
                onPress={() => {
                  dispatch({
                    type: "BUY_BATCH",
                    items: Object.entries(cart)
                      .filter(([, quantity]) => quantity > 0)
                      .map(([id, quantity]) => ({ id, quantity })),
                  });
                  setCart({});
                }}
              />
            </Surface>
          )}
        </View>
      </Frame>
    </Guard>
  );
}

export function GuildScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState("Contracts");
  const standing = state.faction.guild;
  const rankBase = standing >= 30 ? 30 : standing >= 10 ? 10 : 0;
  const rankStep = standing >= 30 ? 10 : standing >= 10 ? 7 : 4;
  const rank = ["I", "II", "III"][
    Math.min(2, Math.floor((standing - rankBase) / rankStep))
  ];
  return (
    <Guard>
      <Frame active="Home" title="Adventurers’ Guild">
        <View style={{ position: "relative" }}>
          <SceneImage
            source={art.guildScene}
            contentFit="fill"
            style={{ width: "100%", aspectRatio: 1.5 }}
            accessibilityLabel="Seraphine: Brave souls like you keep this world standing. Take a contract, and make your mark."
          />
          <Surface
            style={{
              position: "absolute",
              right: 9,
              top: 10,
              width: "43%",
              padding: 10,
              gap: 4,
            }}
          >
            <Copy style={{ fontSize: 12 }}>Guild Rank</Copy>
            <Copy title style={{ fontSize: 22 }}>
              {standing >= 30 ? "Gold" : standing >= 10 ? "Silver" : "Bronze"}{" "}
              {rank}
            </Copy>
            <Bar value={standing % 10} max={10} />
            <Copy style={{ fontSize: 11 }}>{standing} standing</Copy>
          </Surface>
        </View>
        <TabStrip
          tabs={["Contracts", "Prepare", "Clans"]}
          active={tab}
          onChange={setTab}
        />
        <View style={{ padding: 10, gap: 8 }}>
          {tab === "Contracts" && <FactionOpportunities />}
          {tab === "Contracts" ? (
            QUESTS.map((q, index) => {
              const status = state.quests[q.id],
                progress = questProgress(state, q.id),
                ready = status === "accepted" && progress >= q.target;
              return (
                <Surface key={q.id} parchment style={{ padding: 9, gap: 7 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 9,
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={
                        [art.labyrinth, art.camp, art.clan, art.forge][
                          index % 4
                        ]
                      }
                      contentFit="cover"
                      style={{ width: 50, height: 62, borderRadius: 3 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Copy
                        title
                        style={{
                          color: "#261d17",
                          fontSize: 19,
                          lineHeight: 22,
                        }}
                      >
                        {q.title}
                      </Copy>
                      <Copy
                        style={{
                          color: "#433626",
                          fontSize: 12,
                          lineHeight: 16,
                        }}
                      >
                        {q.description}
                      </Copy>
                      <Copy style={{ color: "#74512b", fontSize: 11 }}>
                        {q.faction}
                      </Copy>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Copy style={{ color: "#372619", fontSize: 12 }}>
                        {q.gold} gold · {q.gems} crystals
                      </Copy>
                      <Copy
                        style={{
                          color: "#67482d",
                          fontSize: 11,
                          lineHeight: 14,
                        }}
                      >
                        {progress}/{q.target}
                      </Copy>
                      <Bar value={progress} max={q.target} />
                    </View>
                    <Button
                      label={
                        status === "claimed"
                          ? "Claimed"
                          : ready
                            ? "Claim"
                            : status === "accepted"
                              ? "Accepted"
                              : "Accept"
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
                  </View>
                </Surface>
              );
            })
          ) : tab === "Prepare" ? (
            <>
              <Copy style={{ color: t.color.gold }}>
                Day {state.day} ·{" "}
                {gateOpen(state.day)
                  ? "Gate open"
                  : daysToGate(state.day) + " days until opening"}
              </Copy>
              {[
                {
                  title: "Train together",
                  detail: `Up to 45 XP each; 90 for companions two levels behind, through level ${trainingLimit(state.bestFloor)} · 60 gold · +1 day`,
                  action: "TRAIN" as const,
                  disabled:
                    state.gold < 60 ||
                    !state.party.some(
                      (c) => trainingXp(c, state.bestFloor) > 0,
                    ),
                  label: "Train",
                },
                {
                  title: "Town contracts",
                  detail: "+125 gold · +1 Guild standing up to 20 · +1 day",
                  action: "WORK" as const,
                  disabled: false,
                  label: "Work",
                },
                {
                  title: "Rest at the inn",
                  detail: "Restore HP and MP · +1 day",
                  action: "REST" as const,
                  disabled: false,
                  label: "Rest",
                },
              ].map((x) => (
                <Surface
                  key={x.title}
                  parchment
                  style={{ padding: 13, gap: 9 }}
                >
                  <Copy title style={{ color: "#261d17" }}>
                    {x.title}
                  </Copy>
                  <Copy style={{ color: "#493a2d", fontSize: 13 }}>
                    {x.detail}
                  </Copy>
                  <Button
                    label={x.label}
                    small
                    tone="blue"
                    disabled={x.disabled}
                    onPress={() => dispatch({ type: x.action })}
                  />
                </Surface>
              ))}
              {!gateOpen(state.day) && (
                <Surface style={{ padding: 13, gap: 8 }}>
                  <Copy title>Until the gate opens</Copy>
                  <Button
                    label="Rest until opening"
                    small
                    tone="blue"
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "rest" })
                    }
                  />
                  <Button
                    label={"Work · +" + daysToGate(state.day) * 125 + " gold"}
                    small
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "work" })
                    }
                  />
                  <Button
                    label="Catch up, then work until opening"
                    small
                    tone="dark"
                    disabled={
                      state.gold < 60 &&
                      state.party.some(
                        (c) => trainingXp(c, state.bestFloor) > 0,
                      )
                    }
                    onPress={() =>
                      dispatch({ type: "PREPARE_CYCLE", mode: "train" })
                    }
                  />
                  <Copy muted>
                    Training costs 60 gold per day while someone can learn. Once
                    everyone reaches the catch-up limit, remaining days earn
                    contract gold.
                  </Copy>
                </Surface>
              )}
              <Button
                label="Sell expedition spoils"
                small
                onPress={() =>
                  router.push({
                    pathname: "/shop",
                    params: { vendor: "guild", mode: "sell" },
                  })
                }
              />
            </>
          ) : (
            <>
              <Image
                source={art.clan}
                style={{ width: "100%", aspectRatio: 1.7, borderRadius: 4 }}
                contentFit="cover"
              />
              <Surface style={{ padding: 14, gap: 8 }}>
                <Copy title>Adventurers’ Guild</Copy>
                <Copy>
                  Standing {standing} · Signing discount {standing * 5}g
                </Copy>
                <Ornament />
                <Copy title>The White Stag</Copy>
                <Copy
                  style={{
                    color: state.clanAlly ? t.color.green : t.color.gold,
                  }}
                >
                  {state.clanAlly
                    ? "Allied"
                    : "Meet Commander Serin on Floor 3"}
                </Copy>
                <Copy muted style={{ fontSize: 13 }}>
                  Standing {state.faction.stag} · The scout contract opens with
                  an alliance.
                </Copy>
              </Surface>
            </>
          )}
        </View>
      </Frame>
    </Guard>
  );
}
