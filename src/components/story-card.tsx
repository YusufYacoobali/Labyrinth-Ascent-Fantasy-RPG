import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Copy } from "./game-ui";
import { theme as t } from "@/theme";

export function StoryCard({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={["#071521", "#050e17", "#091824"]}
      style={{
        marginHorizontal: 7,
        marginTop: -3,
        borderWidth: 1,
        borderColor: t.color.goldDim,
        borderRadius: 14,
        padding: 15,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{ height: 1, width: 20, backgroundColor: t.color.goldDim }}
        />
        <Copy
          title
          style={{
            flex: 1,
            fontSize: 29,
            lineHeight: 33,
            color: t.color.goldLight,
            textAlign: "center",
          }}
        >
          {title}
        </Copy>
        <View
          style={{ height: 1, width: 20, backgroundColor: t.color.goldDim }}
        />
      </View>
      {!!body && (
        <Copy
          style={{
            fontFamily: t.font.story,
            fontSize: 21,
            lineHeight: 25,
            color: "#e3e2df",
          }}
        >
          {body}
        </Copy>
      )}
      {children}
      <Copy
        style={{
          alignSelf: "center",
          fontSize: 16,
          lineHeight: 16,
          color: t.color.goldDim,
        }}
      >
        ◇
      </Copy>
    </LinearGradient>
  );
}
