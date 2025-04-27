import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

NfcManager.start();

const ReadyToScan = ({ setState }: { setState: (state: string) => void }) => {
  const [tag, setTag] = useState<any>(null);
  async function readNdef() {
    try {
      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.Ndef);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      console.warn("Tag found", tag);
      setTag(tag);
    } catch (ex) {
      console.warn("Oops!", ex);
      setTag(ex);
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }

  useEffect(() => {
    readNdef();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready to Scan</Text>
      <Image
        source={require("@/assets/images/contactless-payment.png")}
        style={styles.image}
      />
      <Text style={styles.subtitle}>
        {/* Tap the top of your phone to scan your key. */}
        {tag ? JSON.stringify(tag) : "No tag found"}
      </Text>
      <Pressable style={styles.button} onPress={() => setState("locked")}>
        <Text style={styles.buttonText}>CANCEL</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark_background,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
  },
  title: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 10,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondary,
  },
  image: {
    width: 100,
    height: 100,
    opacity: 0.7,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
  },
});

export default ReadyToScan;
