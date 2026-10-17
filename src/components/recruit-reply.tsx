import React, { useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { Host, BottomSheet, RNHostView } from "@expo/ui";
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
  const { height } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(0);
  const maxHeight = Math.max(120, Math.floor(height * 0.72) - 36);
  const reply = state.recruitReply;
  if (!reply) return null;
  const dismiss = () => {
    dispatch({ type: "ACK_RECRUIT_REPLY" });
    if (reply.outcome === "accepted") onDone();
  };
  return (
    <Host colorScheme="dark" style={{ position: "absolute" }}>
      <BottomSheet
        testID="recruit-reply-sheet"
        isPresented
        onDismiss={dismiss}
        contentPadding={18}
        containerColor={t.color.bg}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <ScrollView
            testID="recruit-reply-content"
            style={{
              width: "100%",
              height: Math.min(contentHeight || maxHeight, maxHeight),
              flexGrow: 0,
            }}
            contentContainerStyle={{
              gap: 14,
              paddingBottom: 16,
              width: "100%",
            }}
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled
            onContentSizeChange={(_, measuredHeight) => {
              const nextHeight = Math.ceil(measuredHeight);
              setContentHeight((current) =>
                current === nextHeight ? current : nextHeight,
              );
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Atlas index={reply.portrait} size={64} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Copy title style={{ fontSize: 24 }}>
                  {reply.name}
                </Copy>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Icon
                    name={
                      reply.outcome === "accepted"
                        ? "handshake"
                        : "chat-outline"
                    }
                    size={20}
                    color={
                      reply.outcome === "accepted"
                        ? t.color.green
                        : t.color.gold
                    }
                  />
                  <Copy style={{ flex: 1, color: t.color.goldLight }}>
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
              style={{
                width: "100%",
                fontFamily: t.font.story,
                fontSize: 22,
                lineHeight: 28,
              }}
            >
              “{reply.line}”
            </Copy>
            {reply.outcome === "declined" && (
              <Button
                label={`Offer ${reply.asking}%`}
                tone="gold"
                style={{ width: "100%" }}
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
              style={{ width: "100%" }}
              onPress={dismiss}
            />
          </ScrollView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
