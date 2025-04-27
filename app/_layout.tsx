import Locked from "@/components/Locked";
import Unlocked from "@/components/Unlocked";
import { colors } from "@/constants/colors";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as SecureStore from "expo-secure-store";
import Logo from "@/components/Logo";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

async function getKey() {
  let result = await SecureStore.getItemAsync("key");
  return result;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceGrotesk.ttf"),
  });

  const [checkKey, setCheckKey] = useState<boolean | null>(null);

  const [state, setState] = useState("unlocked");

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    getKey().then((key) => {
      setCheckKey(!!key);

      if (!key) {
        setState("unlocked");
      } else {
        setState("locked");
      }
    });
  }, []);

  if (!loaded || checkKey === null) {
    return (
      <View style={styles.container}>
        <Logo />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {state === "locked" ? (
          <Locked setState={setState} />
        ) : (
          <Unlocked setState={setState} />
        )}
      </View>
      <StatusBar style="light" />
    </>
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
