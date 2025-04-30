import { Platform } from "react-native";
import OverlayModule from "./OverlayModule";

// A safer wrapper that doesn't throw exceptions
export const SafeOverlayModule = {
  async checkOverlayPermission(): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.checkOverlayPermission();
    } catch (e) {
      console.error("Error in checkOverlayPermission:", e);
      return false;
    }
  },

  async requestOverlayPermission(): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.requestOverlayPermission();
    } catch (e) {
      console.error("Error in requestOverlayPermission:", e);
      return false;
    }
  },

  async openAccessibilitySettings(): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.openAccessibilitySettings();
    } catch (e) {
      console.error("Error in openAccessibilitySettings:", e);
      return false;
    }
  },

  async setLockedPackages(packages: string[]): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.setLockedPackages(packages);
    } catch (e) {
      console.error("Error in setLockedPackages:", e);
      return false;
    }
  },

  async startOverlayService(): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.startOverlayService();
    } catch (e) {
      console.error("Error in startOverlayService:", e);
      return false;
    }
  },

  async stopOverlayService(): Promise<boolean> {
    try {
      if (Platform.OS !== "android") return true;
      return await OverlayModule.stopOverlayService();
    } catch (e) {
      console.error("Error in stopOverlayService:", e);
      return false;
    }
  },
};

export default SafeOverlayModule;
