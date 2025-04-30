import { Text, Pressable, StyleSheet, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import { colors } from "@/constants/colors";
import ReadyToScan from "./ReadyToScan";
import { getData, deleteData } from "@/utils/secureStorage";
import OverlayModule from "@/utils/OverlayModule";

const Locked = ({ setState }: { setState: (state: string) => void }) => {
  const [readyToScan, setReadyToScan] = useState(false);

  // Start the overlay service when in locked state (Android only)
  useEffect(() => {
    const startService = async () => {
      if (Platform.OS === "android") {
        try {
          // Get the locked apps list
          const data = await getData("apps");
          const savedApps = data ? JSON.parse(data) : [];

          // Set the locked packages in the native module
          if (savedApps.length > 0) {
            await OverlayModule.setLockedPackages(savedApps);
            await OverlayModule.startOverlayService();
          }
        } catch (err) {
          console.error("Failed to start overlay service:", err);
        }
      }
    };

    startService();

    return () => {
      // Clean up when component unmounts
      if (Platform.OS === "android") {
        OverlayModule.stopOverlayService().catch(console.error);
      }
    };
  }, []);

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
            const storedKey = await getData("key");

            if (id === storedKey) {
              await deleteData("key");
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
