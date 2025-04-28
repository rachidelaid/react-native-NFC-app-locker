import { Text, StyleSheet, View, Image, Switch } from "react-native";
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

  const getInstalledApps = async () => {
    const data = await getData("apps");
    const savedApps = data ? JSON.parse(data) : [];

    const result = await InstalledApps.getSortedApps();
    setInstalledApps(
      result.map((app) => ({
        ...app,
        checked: savedApps.includes(app.packageName),
      }))
    );
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose?.();
      setInstalledApps(undefined);
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

  const toggleSwitch = (id: string) => {
    const newList = installedApps?.map((app) =>
      app.packageName !== id ? app : { ...app, checked: !app.checked }
    );

    const checkedApps = newList
      ?.filter((app) => app.checked)
      .map((app) => app.packageName);

    setData("apps", JSON.stringify(checkedApps));

    setInstalledApps(newList);
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
            <BottomSheetScrollView>
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
                    <Image source={{ uri: item.icon }} style={styles.appIcon} />
                    <Text style={styles.appName}>{item.label}</Text>
                  </View>
                )}
              />
            </BottomSheetScrollView>
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
});

export default Settings;
