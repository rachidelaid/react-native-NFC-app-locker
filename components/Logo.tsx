import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { colors } from "@/constants/colors";

const Logo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.box}></View>
      <Text style={styles.text}>JAIL IT</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: colors.background,
    position: "absolute",
    top: 0,
    left: 0,
    transform: [{ rotate: "45deg" }],
  },
});

export default Logo;
