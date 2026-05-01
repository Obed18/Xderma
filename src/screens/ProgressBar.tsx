import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";

const ProgressBar = ({ label, value }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}%</Text>
      </View>

      <View style={styles.bar}>
        <MotiView
          from={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: "timing", duration: 800 }}
          style={styles.fill}
        />
      </View>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { color: "#fff" },
  value: { color: "#aaa" },
  bar: {
    height: 6,
    backgroundColor: "#2A3441",
    borderRadius: 10,
    marginTop: 4,
  },
  fill: {
    height: 6,
    backgroundColor: "#F59E0B",
    borderRadius: 10,
  },
});