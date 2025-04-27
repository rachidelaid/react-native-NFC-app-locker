import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import Logo from "./Logo";
import { colors } from "@/constants/colors";

const Unlocked = ({ setState }: { setState: (state: string) => void }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>JAIL IT</Text>

      <View style={styles.content}>
        <Logo />
        <Text style={{ marginTop: 20, ...styles.subtitle }}>
          Your phone is currently jailed.
        </Text>
        <Text style={styles.subtitle}>To unlock it, tap your key.</Text>
      </View>

      <View style={styles.content}>
        <Pressable style={styles.button} onPress={() => setState("locked")}>
          <Text style={styles.buttonText}>LOCK IT</Text>
        </Pressable>

        <Pressable onPress={() => {}}>
          <Text style={styles.settings}>SETTINGS</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    padding: 40,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 10,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondary,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
  },
  settings: {
    color: colors.secondary,
    fontSize: 13,
  },
});

export default Unlocked;
