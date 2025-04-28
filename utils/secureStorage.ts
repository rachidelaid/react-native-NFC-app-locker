import * as SecureStore from "expo-secure-store";

export const getData = async (key: string) => SecureStore.getItemAsync(key);

export const setData = async (key: string, value: string) =>
  SecureStore.setItemAsync(key, value);

export const deleteData = async (key: string) =>
  SecureStore.deleteItemAsync(key);
