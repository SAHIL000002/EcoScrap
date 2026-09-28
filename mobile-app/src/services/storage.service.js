import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  // Fallback to AsyncStorage in browser/web or environments without native secure store
}

export const StorageUtil = {
  async saveSecure(key, value) {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      console.warn('SecureStore unavailable, using AsyncStorage:', e.message);
    }
    await AsyncStorage.setItem(key, value);
  },

  async getSecure(key) {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn('SecureStore get error, checking AsyncStorage:', e.message);
    }
    return await AsyncStorage.getItem(key);
  },

  async removeSecure(key) {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      // ignore
    }
    await AsyncStorage.removeItem(key);
  },

  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key) {
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  }
};

export default StorageUtil;