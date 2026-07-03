// storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@tambola_state_v1';

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('saveState error', e);
  }
}

export async function loadState() {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    console.warn('loadState error', e);
    return null;
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('clearState error', e);
  }
}
