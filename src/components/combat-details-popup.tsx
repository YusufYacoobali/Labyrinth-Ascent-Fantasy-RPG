import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Icon } from "./game-ui";
import { theme as t } from "@/theme";

/** Shared centered field-notes window for enemies and party members. */
export default function CombatDetailsPopup({
  children,
  testID,
  closeLabel,
  onClose,
  action,
}: {
  children: ReactNode;
  testID: string;
  closeLabel: string;
  onClose: () => void;
  action?: { label: string; onPress: () => void };
}) {
  const viewport = useWindowDimensions(),
    inset = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.scrim,
          {
            paddingTop: Math.max(16, inset.top + 12),
            paddingBottom: Math.max(16, inset.bottom + 12),
          },
        ]}
      >
        <Pressable
          accessible={false}
          focusable={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          testID={testID}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            styles.card,
            {
              height: Math.min(
                viewport.height < 700 ? 536 : 710,
                viewport.height - inset.top - inset.bottom - 32,
              ),
            },
          ]}
        >
          {children}
          <View style={styles.footer}>
            <Button
              label={action?.label || "Back to battle"}
              small
              tone="gold"
              onPress={action?.onPress || onClose}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={styles.close}
          >
            <Icon name="close" size={21} color={t.color.goldLight} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(2,6,12,.8)",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    flexShrink: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.color.goldDim,
    overflow: "hidden",
    backgroundColor: t.color.panel,
    boxShadow: "0 24px 60px rgba(0,0,0,.65)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0b1521",
    borderTopWidth: 1,
    borderTopColor: "#876b4244",
  },
  close: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
