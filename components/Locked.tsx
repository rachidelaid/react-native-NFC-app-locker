import { Text, Pressable, StyleSheet } from "react-native";
import React, { useState } from "react";
import Logo from "./Logo";
import { colors } from "@/constants/colors";
import ReadyToScan from "./ReadyToScan";
import * as SecureStore from "expo-secure-store";

async function getKey() {
  let result = await SecureStore.getItemAsync("key");
  return result;
}
const Locked = ({ setState }: { setState: (state: string) => void }) => {
  const [readyToScan, setReadyToScan] = useState(false);

  return (
    <>
      <Logo />
      <Text style={styles.title}>THIS IS A DISTRACTION</Text>
      <Text style={styles.subtitle}>Your phone is currently jailed.</Text>
      <Text style={styles.subtitle}>To unlock it, tap your key.</Text>

      <Pressable style={styles.button} onPress={() => setReadyToScan(true)}>
        <Text style={styles.buttonText}>OK</Text>
      </Pressable>

      {readyToScan && (
        <ReadyToScan
          onClick={async (id: string, cb?: (msg: string) => void) => {
            const storedKey = await getKey();

            if (id === storedKey) {
              SecureStore.deleteItemAsync("key");
              setState("unlocked");
              setReadyToScan(false);
            } else {
              // setReadyToScan(false);
              cb?.("this is not the unlock key");
            }
          }}
          onCancel={() => {
            setReadyToScan(false);
          }}
        />
      )}
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
