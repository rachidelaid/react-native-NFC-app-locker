import { Text, StyleSheet, View, Image } from "react-native";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { InstalledApps } from "react-native-launcher-kit";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { colors } from "@/constants/colors";

interface InstalledApp {
  icon: string;
  label: string;
  packageName: string;
}

const Settings = ({ onClose }: { onClose: () => void }) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [installedApps, setInstalledApps] = useState<InstalledApp[] | null>(
    null
  );

  const getInstalledApps = async () => {
    const result = await InstalledApps.getSortedApps();
    setInstalledApps(result as unknown as InstalledApp[]);
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose?.();
      setInstalledApps(null);
      bottomSheetModalRef.current?.dismiss();
    }
  }, []);

  useEffect(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current.present();
      bottomSheetModalRef.current.snapToIndex(0);
      getInstalledApps();
    }
  }, [bottomSheetModalRef]);

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
        >
          <BottomSheetView style={styles.contentContainer}>
            {installedApps === null ? (
              <Text style={styles.loading}>Loading...</Text>
            ) : (
              <BottomSheetFlatList
                data={installedApps}
                keyExtractor={(item) => item.packageName}
                renderItem={({ item, index }) => (
                  <View style={styles.appItem}>
                    <Image source={{ uri: item.icon }} style={styles.appIcon} />
                    <Text style={styles.appName}>{item.label}</Text>
                  </View>
                )}
              />
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
    justifyContent: "center",
    backgroundColor: colors.black,
  },
  handleIndicator: {
    backgroundColor: colors.secondary,
  },
  handle: {
    backgroundColor: colors.black,
  },
  loading: {
    color: colors.white,
  },
  appItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: 10,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 100,
    marginRight: 10,
  },
  appName: {
    color: colors.white,
  },
});

export default Settings;
