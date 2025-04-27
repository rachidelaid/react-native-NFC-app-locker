import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import Logo from "./Logo";
import { colors } from "@/constants/colors";

const Locked = ({ setState }: { setState: (state: string) => void }) => {
  return (
    <>
      <Logo />
      <Text style={styles.title}>THIS IS A DISTRACTION</Text>
      <Text style={styles.subtitle}>Your phone is currently jailed.</Text>
      <Text style={styles.subtitle}>To unlock it, tap your key.</Text>

      <Pressable style={styles.button} onPress={() => setState("readyToScan")}>
        <Text style={styles.buttonText}>OK</Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
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
    position: "absolute",
    bottom: 40,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
  },
});

export default Locked;
