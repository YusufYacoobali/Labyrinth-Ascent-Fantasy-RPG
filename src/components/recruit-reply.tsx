import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
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
  const { state, dispatch, saving } = useGame();
  const { height } = useWindowDimensions();
  const reply = state.recruitReply;
  const dismiss = () => {
    if (!reply || saving) return;
    dispatch({ type: "ACK_RECRUIT_REPLY" });
    if (reply.outcome === "accepted") onDone();
  };
  return (
    <Modal
      visible={!!reply}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: "rgba(0, 0, 0, 0.78)",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reply"
          onPress={dismiss}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        {reply && (
          <View
            accessibilityViewIsModal
            testID="recruit-reply-popup"
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: height * 0.82,
              borderRadius: 16,
              backgroundColor: "#102431",
              padding: 18,
            }}
          >
            <ScrollView
              testID="recruit-reply-content"
              key={reply.id}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 16, paddingBottom: 2 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Atlas index={reply.portrait} size={60} />
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Copy title style={{ fontSize: 24, color: "#fff1d1" }}>
                    {reply.name}
                  </Copy>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon
                      name={
                        reply.outcome === "accepted"
                          ? "handshake"
                          : "chat-outline"
                      }
                      size={19}
                      color={
                        reply.outcome === "accepted"
                          ? t.color.green
                          : t.color.goldLight
                      }
                    />
                    <Copy style={{ flex: 1, color: "#f2d69b" }}>
                      {reply.outcome === "accepted"
                        ? `Joined · ${reply.offered}% agreed`
                        : reply.outcome === "declined"
                          ? "Offer declined"
                          : "Not this time"}
                    </Copy>
                  </View>
                </View>
              </View>
              <Copy
                accessibilityLiveRegion="polite"
                style={{
                  fontFamily: t.font.story,
                  fontSize: 22,
                  lineHeight: 29,
                  color: "#f7eedb",
                }}
              >
                “{reply.line}”
              </Copy>
              {reply.outcome === "declined" && (
                <Button
                  disabled={saving}
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
                    : reply.outcome === "declined"
                      ? "Keep bargaining"
                      : "Back to the tavern"
                }
                disabled={saving}
                tone={reply.outcome === "accepted" ? "blue" : "dark"}
                onPress={dismiss}
              />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}
