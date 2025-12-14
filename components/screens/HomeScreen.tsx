// components/screens/HomeScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RootStackParamList } from '../../app/(tabs)/index';
import { useAdState } from '../../utils/store/adState';
import RewardedButton from '../RewardedButton';


// Get device type ios/android to adjust layout if needed
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [mute, setMute] = useState<boolean>(false);
  const { isPro, adFreeUntil, showAds } = useAdState();

  function handleStart() {
    navigation.navigate('Game', { initialMode: mode, initialSpeed: speed, initialMute: mute });
  }

  return (
    <View style={styles.safe}>
      {/* hide status bar for a clean full-screen look */}
      <StatusBar hidden />



      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome to Tambola</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Step 1 — Choose Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'manual' }}
              style={[styles.option, mode === 'manual' && styles.optionActive]}
              onPress={() => setMode('manual')}
            >
              <Text style={[styles.optionText, mode === 'manual' && styles.optionTextActive]}>Manual</Text>
              <Text style={styles.optionSub}>Tap to call numbers yourself</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'auto' }}
              style={[styles.option, mode === 'auto' && styles.optionActive]}
              onPress={() => setMode('auto')}
            >
              <Text style={[styles.optionText, mode === 'auto' && styles.optionTextActive]}>Automatic</Text>
              <Text style={styles.optionSub}>Auto-play with chosen speed</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Step 2 — Speed (Auto only)</Text>
          <View style={styles.speedRow}>
            <TouchableOpacity
              style={[styles.smallOption, speed === 'slow' && styles.optionActive]}
              onPress={() => setSpeed('slow')}
              accessibilityRole="button"
            >
              <Text style={[styles.smallOptionText, speed === 'slow' && styles.optionTextActive]}>Slow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallOption, speed === 'medium' && styles.optionActive]}
              onPress={() => setSpeed('medium')}
              accessibilityRole="button"
            >
              <Text style={[styles.smallOptionText, speed === 'medium' && styles.optionTextActive]}>Medium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallOption, speed === 'fast' && styles.optionActive]}
              onPress={() => setSpeed('fast')}
              accessibilityRole="button"
            >
              <Text style={[styles.smallOptionText, speed === 'fast' && styles.optionTextActive]}>Fast</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mute TTS</Text>
            <Switch value={mute} ios_backgroundColor={'#1976d2'} onValueChange={setMute} />
          </View>

          <View style={styles.noteWrap}>
            <Text style={styles.noteTitle}>What happens next</Text>
            <Text style={styles.noteText}>
              You'll be taken to the Game screen. Use the History button in the game to view all called numbers as a modal — your current game will remain unchanged.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', top: 12, right: 16, padding: 8 }}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={{ color: '#1976d2', fontWeight: '700' }}>About</Text>
        </TouchableOpacity>

        {/* Rewarded Button */}
        <>
          <View style={{ height: 12 }} />
          {
            adFreeUntil && adFreeUntil > Date.now() ? (
              <Text style={{ textAlign: 'center', color: '#1976d2', fontWeight: '700' }}>
                Ad-free until {new Date(adFreeUntil).toLocaleTimeString()}
              </Text>
            ) : (
              <RewardedButton />
            )
          }
        </>
        {/* Add a button to clear the storage for testing */}
        {/* <TouchableOpacity
          style={{ position: 'absolute', bottom: 12, right: 16, padding: 8 }}
          onPress={() => {
            AsyncStorage.clear();
          }}
        >
          <Text style={{ color: '#1976d2', fontWeight: '700' }}>Clear Storage</Text>
        </TouchableOpacity> */}



        {/* spacer so content doesn't get hidden by footer */}
        {/* {isPro ? <Text>Thanks for supporting — Ads removed</Text> : (
          <>
            <PurchaseButton />
            <View style={{ height: 12 }} />
            {
              adFreeUntil && adFreeUntil > Date.now() ? (
                <Text style={{ textAlign: 'center', color: '#1976d2', fontWeight: '700' }}>
                  Ad-free until {new Date(adFreeUntil).toLocaleTimeString()}
                </Text>
              ) : (
                <RewardedButton />
              )
            }
          </>
        )} */}
        {/* <View style={{ height: 80 }} /> */}
        {/* Check isPro then show Thank you messasge, if isPro false then check for adFreeUntil then show until message, if both false then show buttons */}
        {/* {isPro ? (
          <Text style={{ textAlign: 'center', color: '#4caf50', fontWeight: '700' }}>Thanks for supporting — Ads removed</Text>
        ) : adFreeUntil && adFreeUntil > Date.now() ? (
          <Text style={{ textAlign: 'center', color: '#1976d2', fontWeight: '700' }}>Ad-free until {new Date(adFreeUntil).toLocaleTimeString()}</Text>
        ) : (
          <>
            <PurchaseButton />
            <View style={{ height: 12 }} />
            <RewardedButton />
            
          </>
        )} */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky footer with START button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} accessibilityRole="button">
          <Text style={styles.startBtnText}>START</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18,
    color: '#111',
    marginTop: isIOS ? 50 : 20,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  optionActive: { backgroundColor: '#fff7e0', borderColor: '#ffd54f' },
  optionText: { fontSize: 16, fontWeight: '800', color: '#111' },
  optionTextActive: { color: '#6b4a00' },
  optionSub: { fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' },

  speedRow: { flexDirection: 'row', justifyContent: 'center' },
  smallOption: {
    marginHorizontal: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  smallOptionText: { fontWeight: '700' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rowLabel: { fontSize: 15 },

  noteWrap: { marginTop: 12 },
  noteTitle: { fontWeight: '700', marginBottom: 6 },
  noteText: { color: '#444', lineHeight: 18 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
