import { NativeModules, Platform } from "react-native";

const { OverlayModule: NativeOverlayModule } = NativeModules;

interface OverlayModuleInterface {
  checkOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  setLockedPackages(packages: string[]): Promise<boolean>;
  startOverlayService(): Promise<boolean>;
  stopOverlayService(): Promise<boolean>;
}

// Create a wrapper with error handling
const createSafeMethod = (name: string, method: Function) => {
  return async (...args: any[]) => {
    try {
      if (!method) {
        console.warn(`Method ${name} not available`);
        return Platform.OS === "android" ? false : true;
      }
      return await method(...args);
    } catch (error) {
      console.error(`Error calling ${name}:`, error);
      return false;
    }
  };
};

// Create a no-op implementation for iOS
const NoopModule: OverlayModuleInterface = {
  checkOverlayPermission: async () => true,
  requestOverlayPermission: async () => true,
  openAccessibilitySettings: async () => true,
  setLockedPackages: async () => true,
  startOverlayService: async () => true,
  stopOverlayService: async () => true,
};

let OverlayModule: OverlayModuleInterface;

// Create a safe implementation for Android
if (Platform.OS === "android" && NativeOverlayModule) {
  OverlayModule = {
    checkOverlayPermission: createSafeMethod(
      "checkOverlayPermission",
      NativeOverlayModule.checkOverlayPermission
    ),
    requestOverlayPermission: createSafeMethod(
      "requestOverlayPermission",
      NativeOverlayModule.requestOverlayPermission
    ),
    openAccessibilitySettings: createSafeMethod(
      "openAccessibilitySettings",
      NativeOverlayModule.openAccessibilitySettings
    ),
    setLockedPackages: createSafeMethod(
      "setLockedPackages",
      NativeOverlayModule.setLockedPackages
    ),
    startOverlayService: createSafeMethod(
      "startOverlayService",
      NativeOverlayModule.startOverlayService
    ),
    stopOverlayService: createSafeMethod(
      "stopOverlayService",
      NativeOverlayModule.stopOverlayService
    ),
  };
} else {
  // Use the no-op implementation for iOS or if the module isn't available
  OverlayModule = NoopModule;
}

export default OverlayModule;
