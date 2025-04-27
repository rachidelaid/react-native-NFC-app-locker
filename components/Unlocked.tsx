import { View, Text, Pressable, StyleSheet } from "react-native";
import React, { useState, useCallback } from "react";
import Logo from "./Logo";
import { colors } from "@/constants/colors";
import ReadyToScan from "./ReadyToScan";
import * as SecureStore from "expo-secure-store";
import Settings from "./Settings";
async function save(value: string) {
  await SecureStore.setItemAsync("key", value);
}

const Unlocked = ({ setState }: { setState: (state: string) => void }) => {
  const [readyToScan, setReadyToScan] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePresentModalPress = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>JAIL IT</Text>

        <View style={styles.content}>
          <Logo />
          <Text style={{ marginTop: 19, ...styles.subtitle }}>
            Tap your key to lock it.
          </Text>
        </View>

        <View style={styles.content}>
          <Pressable style={styles.button} onPress={() => setReadyToScan(true)}>
            <Text style={styles.buttonText}>LOCK IT</Text>
          </Pressable>

          <Pressable onPress={handlePresentModalPress}>
            <Text style={styles.settings}>SETTINGS</Text>
          </Pressable>
        </View>
      </View>
      {readyToScan && (
        <ReadyToScan
          onClick={(id: string) => {
            save(id);
            setState("locked");
            setReadyToScan(false);
          }}
          onCancel={() => {
            setReadyToScan(false);
          }}
        />
      )}
      {isModalOpen && <Settings onClose={() => setIsModalOpen(false)} />}
    </>
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
