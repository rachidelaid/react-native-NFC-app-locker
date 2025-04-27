import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

const ReadyToScan = ({
  onClick,
  onCancel,
}: {
  onClick: (key: string, cb?: (msg: string) => void) => void;
  onCancel: () => void;
}) => {
  const [hasNfc, setHasNFC] = useState<boolean | null>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function readNdef() {
      setError(null);
      if (!hasNfc) return;

      try {
        NfcManager.start();
        // Ensure no previous technology requests are active
        await NfcManager.cancelTechnologyRequest();

        // register for the NFC tag with NDEF in it
        await NfcManager.requestTechnology([
          NfcTech.NfcA,
          NfcTech.MifareClassic,
          NfcTech.NdefFormatable,
        ]);
        // the resolved tag object will contain `ndefMessage` property
        const tag = await NfcManager.getTag();

        onClick(tag?.id ?? "", (msg: string) => {
          setError(msg);
        });

        NfcManager.cancelTechnologyRequest();
      } catch (ex) {
        console.warn("Oops!", ex);
        setError("Oops! Something went wrong");
      } finally {
        // stop the nfc scanning
        NfcManager.cancelTechnologyRequest();
      }
    }
    readNdef();
  }, []);

  // useEffect(() => {
  //   const checkIsSupported = async () => {
  //     const deviceIsSupported = await NfcManager.isSupported();

  //     setHasNFC(deviceIsSupported);
  //     if (deviceIsSupported) {
  //       await NfcManager.start();
  //     }
  //   };

  //   checkIsSupported();
  // }, []);

  return (
    <View style={{ ...styles.container, height: !!hasNfc ? "50%" : "20%" }}>
      {!!hasNfc ? (
        <>
          <Text style={styles.title}>Ready to Scan</Text>
          <Image
            source={require("@/assets/images/contactless-payment.png")}
            style={styles.image}
          />
          <Text style={styles.subtitle}>
            Tap the top of your phone to scan your key.
          </Text>
          {!!error && (
            <Text style={{ ...styles.subtitle, color: "#c03841" }}>
              {error}
            </Text>
          )}
          <Pressable style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>CANCEL</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text
            style={{ ...styles.subtitle, marginTop: "auto", marginBottom: 20 }}
          >
            NFC is not supported on this device
          </Text>
          <Pressable style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>CANCEL</Text>
          </Pressable>
        </>
      )}
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
