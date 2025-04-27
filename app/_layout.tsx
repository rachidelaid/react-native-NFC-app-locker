import Locked from "@/components/Locked";
import ReadyToScan from "@/components/ReadyToScan";
import Unlocked from "@/components/Unlocked";
import { colors } from "@/constants/colors";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import "react-native-reanimated";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceGrotesk.ttf"),
  });

  const [state, setState] = useState("locked");

  useEffect(() => {
    console.log("state ====>", state);
  }, [state]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {["locked", "readyToScan"].includes(state) ? (
        <>
          <Locked setState={setState} />
          {state === "readyToScan" && <ReadyToScan setState={setState} />}
        </>
      ) : (
        <Unlocked setState={setState} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 40,
  },
});
