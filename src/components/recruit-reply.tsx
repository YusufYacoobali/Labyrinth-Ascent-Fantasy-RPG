import React from "react";
import { ScrollView, View } from "react-native";
import { Host, BottomSheet } from "@expo/ui";
import { Atlas, Button, Copy, Icon } from "./game-ui";
import { useGame } from "@/game/provider";
import { theme as t } from "@/theme";

export function RecruitReplyDialog({
  onDone,
  onCounter,
}: {
  onDone: () => void;
  onCounter: (share: number) => void;
}) {
  const { state, dispatch } = useGame();
  const reply = state.recruitReply;
  if (!reply) return null;
  const dismiss = () => {
    dispatch({ type: "ACK_RECRUIT_REPLY" });
    if (reply.outcome === "accepted") onDone();
  };
  return (
    <Host colorScheme="dark" style={{ position: "absolute" }}>
      <BottomSheet
        isPresented
        onDismiss={dismiss}
        contentPadding={18}
        containerColor={t.color.bg}
      >
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Atlas index={reply.portrait} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Copy title style={{ fontSize: 24 }}>
                {reply.name}
              </Copy>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Icon
                  name={
                    reply.outcome === "accepted" ? "handshake" : "chat-outline"
                  }
                  size={20}
                  color={
                    reply.outcome === "accepted" ? t.color.green : t.color.gold
                  }
                />
                <Copy style={{ color: t.color.goldLight }}>
                  {reply.outcome === "accepted"
                    ? `Joined · ${reply.offered}% agreed`
                    : reply.outcome === "declined"
                      ? "Offer declined"
                      : "Not yet"}
                </Copy>
              </View>
            </View>
          </View>
          <Copy
            accessibilityLiveRegion="polite"
            style={{ fontFamily: t.font.story, fontSize: 22, lineHeight: 28 }}
          >
            “{reply.line}”
          </Copy>
          {reply.outcome === "declined" && (
            <Button
              label={`Offer ${reply.asking}%`}
              tone="gold"
              onPress={() => {
                onCounter(reply.asking);
                dispatch({
                  type: "RECRUIT",
                  id: reply.id,
                  offer: reply.asking,
                });
              }}
            />
          )}
          <Button
            label={
              reply.outcome === "accepted"
                ? "Welcome aboard"
                : "Keep bargaining"
            }
            tone={reply.outcome === "accepted" ? "blue" : "dark"}
            onPress={dismiss}
          />
        </ScrollView>
      </BottomSheet>
    </Host>
  );
}
