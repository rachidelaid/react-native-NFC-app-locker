import {
  Text,
  StyleSheet,
  View,
  Image,
  Switch,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { InstalledApps } from "react-native-launcher-kit";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { colors } from "@/constants/colors";
import { getData, setData } from "@/utils/secureStorage";
import OverlayModule from "@/utils/OverlayModule";

interface InstalledApp {
  icon: string;
  label: string;
  packageName: string;
  checked: boolean;
}

const Settings = ({ onClose }: { onClose: () => void }) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [installedApps, setInstalledApps] = useState<
    InstalledApp[] | undefined
  >(undefined);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        try {
          const hasPermission = await OverlayModule.checkOverlayPermission();
          console.log("Overlay permission check result:", hasPermission);
          setHasOverlayPermission(hasPermission);
        } catch (err) {
          console.error("Error checking overlay permission:", err);
          setError(`Error checking permissions: ${err}`);
        }
        setHasCheckedPermissions(true);
      }
    } catch (e) {
      console.error("Error in checkPermissions:", e);
      setError(`Error in checkPermissions: ${e}`);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        try {
          const granted = await OverlayModule.requestOverlayPermission();
          console.log("Permission request result:", granted);
          setHasOverlayPermission(granted);

          if (granted) {
            Alert.alert(
              "Accessibility Permission",
              "The app also needs accessibility permission to detect when locked apps are opened. Press OK to open accessibility settings.",
              [
                {
                  text: "OK",
                  onPress: () => OverlayModule.openAccessibilitySettings(),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }
        } catch (err) {
          console.error("Error requesting permissions:", err);
          setError(`Error requesting permissions: ${err}`);
        }
      }
    } catch (e) {
      console.error("Error in requestPermissions:", e);
      setError(`Error in requestPermissions: ${e}`);
    }
  };

  const getInstalledApps = async () => {
    setIsLoading(true);
    try {
      const data = await getData("apps");
      const savedApps = data ? JSON.parse(data) : [];
      console.log("Retrieved saved apps:", savedApps);

      try {
        // Get installed apps
        const result = await InstalledApps.getSortedApps();
        console.log(`Got ${result.length} installed apps`);

        // Map to our format with checked state
        const formattedApps = result.map((app) => ({
          ...app,
          checked: savedApps.includes(app.packageName),
        }));
        setInstalledApps(formattedApps);

        // Update native module with locked packages - only if on Android
        if (Platform.OS === "android") {
          try {
            console.log("Updating locked packages, count:", savedApps.length);
            const success = await OverlayModule.setLockedPackages(savedApps);
            console.log("Set locked packages result:", success);
          } catch (err) {
            console.error("Failed to set locked packages:", err);
            setError(`Error setting locked packages: ${err}`);
          }
        }
      } catch (e) {
        console.error("Error getting installed apps:", e);
        setError(`Error getting apps: ${e}`);
      }
    } catch (e) {
      console.error("Error in getInstalledApps:", e);
      setError(`Error in getInstalledApps: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose?.();
      setInstalledApps(undefined);
      bottomSheetModalRef.current?.dismiss();
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (bottomSheetModalRef.current) {
      try {
        bottomSheetModalRef.current.present();
        bottomSheetModalRef.current.snapToIndex(0);
      } catch (e) {
        console.error("Error presenting sheet:", e);
      }

      if (
        Platform.OS === "android" &&
        !hasOverlayPermission &&
        hasCheckedPermissions
      ) {
        requestPermissions();
      }
      getInstalledApps();
    }
  }, [bottomSheetModalRef, hasOverlayPermission, hasCheckedPermissions]);

  const toggleSwitch = async (id: string) => {
    try {
      // Create a new list with the toggled item
      const newList = installedApps?.map((app) =>
        app.packageName !== id ? app : { ...app, checked: !app.checked }
      );

      // Get just the package names of checked apps
      const checkedApps = newList
        ?.filter((app) => app.checked)
        .map((app) => app.packageName);

      console.log("New checked apps:", checkedApps);

      // Save to secure storage
      await setData("apps", JSON.stringify(checkedApps || []));
      setInstalledApps(newList);

      // Update native module with locked packages
      if (Platform.OS === "android") {
        try {
          console.log("Updating locked packages (toggle):", checkedApps);
          await OverlayModule.setLockedPackages(checkedApps || []);

          // Start or stop the service based on if there are locked apps
          if (checkedApps && checkedApps.length > 0) {
            console.log("Starting overlay service");
            await OverlayModule.startOverlayService();
          } else {
            console.log("Stopping overlay service");
            await OverlayModule.stopOverlayService();
          }
        } catch (err) {
          console.error("Failed to update locked packages:", err);
          setError(`Error updating locked packages: ${err}`);
        }
      }
    } catch (e) {
      console.error("Error in toggleSwitch:", e);
      setError(`Error toggling app: ${e}`);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          index={0}
          snapPoints={["60%"]}
          animateOnMount={true}
          handleIndicatorStyle={styles.handleIndicator}
          handleStyle={styles.handle}
          enableDynamicSizing={false}
          enableOverDrag={false}
        >
          <BottomSheetView style={styles.contentContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={styles.errorButton}
                  onPress={() => setError(null)}
                >
                  <Text style={styles.errorButtonText}>Dismiss</Text>
                </Pressable>
              </View>
            )}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading apps...</Text>
              </View>
            ) : Platform.OS === "android" &&
              !hasOverlayPermission &&
              hasCheckedPermissions ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                  To show overlays on locked apps, the app needs permission to
                  display over other apps.
                </Text>
                <Pressable
                  style={styles.permissionButton}
                  onPress={requestPermissions}
                >
                  <Text style={styles.buttonText}>GRANT PERMISSION</Text>
                </Pressable>
              </View>
            ) : (
              <BottomSheetScrollView>
                <Text style={styles.settingsHeader}>Select apps to lock:</Text>
                <BottomSheetFlatList
                  data={installedApps}
                  keyExtractor={(item) => item.packageName}
                  renderItem={({ item }) => (
                    <View style={styles.appItem}>
                      <Switch
                        trackColor={{ false: colors.gray, true: "#005f02" }}
                        thumbColor={item.checked ? "#00ee00" : colors.secondary}
                        ios_backgroundColor={colors.gray}
                        onValueChange={() => toggleSwitch(item.packageName)}
                        value={item.checked}
                      />
                      <Image
                        source={{ uri: item.icon }}
                        style={styles.appIcon}
                      />
                      <Text style={styles.appName}>{item.label}</Text>
                    </View>
                  )}
                />
              </BottomSheetScrollView>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    top: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.black,
    paddingTop: 15,
  },
  handleIndicator: {
    backgroundColor: colors.secondary,
  },
  handle: {
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
  },
  appItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 10,
    marginRight: "auto",
  },
  appIcon: {
    width: 28,
    height: 28,
    borderRadius: 100,
    marginRight: 20,
    marginLeft: 10,
  },
  appName: {
    color: colors.white,
    width: "99%",
  },
  settingsHeader: {
    color: colors.white,
    fontSize: 16,
    marginVertical: 10,
    paddingHorizontal: 20,
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    color: colors.white,
    textAlign: "center",
    marginBottom: 30,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 30,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
  },
  errorContainer: {
    backgroundColor: "#5c0011",
    padding: 10,
    margin: 10,
    borderRadius: 5,
    width: "90%",
  },
  errorText: {
    color: colors.white,
    textAlign: "center",
    marginBottom: 10,
  },
  errorButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "center",
  },
  errorButtonText: {
    color: colors.white,
    fontSize: 12,
  },
});

export default Settings;
