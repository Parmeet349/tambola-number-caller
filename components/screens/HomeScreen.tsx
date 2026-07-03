// components/screens/HomeScreen.tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../app/(tabs)/index';
import { logEvent } from '../../utils/analytics';
import { useAdState } from '../../utils/store/adState';
import { scheduleGameNightReminder } from '../../utils/notifications';
import RewardedButton from '../RewardedButton';
import { useTheme, THEMES } from '../../utils/store/themeState';

const isIOS = Platform.OS === 'ios';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { currentTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [mute, setMute] = useState<boolean>(false);
  const [hostName, setHostName] = useState<string>('');
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const { adFreeUntil } = useAdState();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const name = await AsyncStorage.getItem('@tambola_host_name');
          if (name) setHostName(name);

          const stateStr = await AsyncStorage.getItem('@tambola_state_v1');
          if (stateStr) {
            const state = JSON.parse(stateStr);
            if (state && state.called && state.called.length > 0) {
              setResumeCount(state.called.length);
            } else {
              setResumeCount(null);
            }
          } else {
            setResumeCount(null);
          }

          const reminderStr = await AsyncStorage.getItem('@tambola_reminder');
          if (reminderStr === 'true') setReminderEnabled(true);
        } catch (e) { }
      })();
    }, [])
  );

  const saveHostName = async (name: string) => {
    setHostName(name);
    try {
      await AsyncStorage.setItem('@tambola_host_name', name);
    } catch (e) { }
  };

  const handleReminderToggle = async (val: boolean) => {
    setReminderEnabled(val);
    try {
      await AsyncStorage.setItem('@tambola_reminder', val ? 'true' : 'false');
      const success = await scheduleGameNightReminder(val);
      if (val && !success) {
        setReminderEnabled(false);
        await AsyncStorage.setItem('@tambola_reminder', 'false');
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive Game Night Reminders.');
      }
    } catch (e) {}
  };

  const handleStart = async () => {
    try {
      await AsyncStorage.removeItem('@tambola_state_v1');
    } catch (e) { }
    logEvent('game_start', { mode, speed, mute });
    navigation.navigate('Game', { initialMode: mode, initialSpeed: speed, initialMute: mute, hostName } as any);
  };

  const handleResume = () => {
    logEvent('game_resume', { resumeCount });
    navigation.navigate('Game', { hostName } as any);
  };

  const confirmExit = () => {
    Alert.alert('Hold on!', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'YES',
        onPress: () => {
          if (Platform.OS === 'android') {
            BackHandler.exitApp();
          }
        },
      },
    ]);
  };

  const onHardwareBackPress = () => {
    confirmExit();
    return true; // VERY IMPORTANT
  };



  const handleExit = () => {
    Alert.alert('Hold on!', 'Are you sure you want to exit?', [
      { text: 'Cancel', onPress: () => null, style: 'cancel' },
      { text: 'YES', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          onHardwareBackPress
        );
        return () => backHandler.remove();
      }
    }, [])
  );


  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={currentTheme.isDark ? 'light-content' : 'dark-content'} backgroundColor={currentTheme.background} />

      {/* Enhanced Header with Back/Exit Button */}
      <View style={[styles.topBar, { backgroundColor: currentTheme.background }]}>
        {Platform.OS === 'android' && (
          <TouchableOpacity style={styles.headerBtn} onPress={confirmExit}>
            <Text style={[styles.exitLink, { color: currentTheme.primary }]}>✕ Exit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('About')}>
          <Text style={[styles.aboutLink, { color: currentTheme.primary }]}>About</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {hostName.trim() ? `Welcome back, ${hostName}! 🎉` : 'Welcome to Tambola'}
        </Text>

        <View style={styles.hostInputContainer}>
          <Text style={[styles.hostInputLabel, { color: currentTheme.textLight }]}>Host Name</Text>
          <TextInput
            style={[styles.hostInput, { backgroundColor: currentTheme.cardBg, color: currentTheme.text, borderColor: currentTheme.isDark ? '#32284c' : '#f0f0f0' }]}
            placeholder="Enter your name (e.g., Uncle Raj)"
            placeholderTextColor={currentTheme.isDark ? '#6f648e' : '#888'}
            value={hostName}
            onChangeText={saveHostName}
          />
        </View>

        {resumeCount !== null && resumeCount > 0 && (
          <View style={[styles.card, styles.resumeCard, currentTheme.isDark && { backgroundColor: '#1e3822', borderColor: '#2e7d32' }]}>
            <Text style={[styles.resumeTitle, currentTheme.isDark && { color: '#81c784' }]}>🎲 Game in Progress</Text>
            <Text style={[styles.resumeText, currentTheme.isDark && { color: '#66bb6a' }]}>{resumeCount} of 90 numbers called</Text>
            <View style={styles.resumeBtnRow}>
               <TouchableOpacity style={[styles.resumeBtn, currentTheme.isDark && { backgroundColor: '#2e7d32' }]} onPress={handleResume}>
                 <Text style={styles.resumeBtnText}>Resume Game</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 1 */}
        <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Step 1 — Choose Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.option,
                { backgroundColor: currentTheme.isDark ? '#1b1433' : '#f9f9f9', borderColor: 'transparent' },
                mode === 'manual' && { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }
              ]}
              onPress={() => setMode('manual')}
            >
              <Text style={[
                styles.optionText,
                { color: currentTheme.textLight },
                mode === 'manual' && { color: currentTheme.primary }
              ]}>Manual</Text>
              <Text style={[styles.optionSub, { color: currentTheme.isDark ? '#7a6e9a' : '#888' }]}>Tap to call numbers yourself</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                { backgroundColor: currentTheme.isDark ? '#1b1433' : '#f9f9f9', borderColor: 'transparent' },
                mode === 'auto' && { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }
              ]}
              onPress={() => setMode('auto')}
            >
              <Text style={[
                styles.optionText,
                { color: currentTheme.textLight },
                mode === 'auto' && { color: currentTheme.primary }
              ]}>Automatic</Text>
              <Text style={[styles.optionSub, { color: currentTheme.isDark ? '#7a6e9a' : '#888' }]}>Auto-play with chosen speed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2 */}
        <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Step 2 — Speed (Auto only)</Text>
          <View style={styles.speedRow}>
            {(['slow', 'medium', 'fast'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.smallOption,
                  { backgroundColor: currentTheme.isDark ? '#1b1433' : '#f9f9f9', borderColor: currentTheme.isDark ? '#2a1f49' : '#eee' },
                  speed === s && { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }
                ]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[
                  styles.smallOptionText,
                  { color: currentTheme.textLight },
                  speed === s && { color: currentTheme.primary }
                ]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 3 — Choose Theme */}
        <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Step 3 — Choose Theme 🎨</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {Object.values(THEMES).map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themePill,
                    {
                      backgroundColor: theme.background,
                      borderColor: isSelected ? theme.primary : (currentTheme.isDark ? '#2a1f49' : '#e0e0e0'),
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => setTheme(theme.id)}
                >
                  <Text style={[styles.themePillText, { color: theme.text, fontWeight: isSelected ? '800' : '500' }]}>
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Options & Information */}
        <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Options</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: currentTheme.text }]}>Mute TTS</Text>
            <Switch
              value={mute}
              onValueChange={setMute}
              trackColor={{ false: currentTheme.isDark ? "#3c2a63" : "#ddd", true: currentTheme.primary }}
              thumbColor={mute ? currentTheme.accent : "#f4f3f4"}
            />
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={[styles.rowLabel, { color: currentTheme.text }]}>Game Night Reminder (Sat 7PM)</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: currentTheme.isDark ? "#3c2a63" : "#ddd", true: currentTheme.primary }}
              thumbColor={reminderEnabled ? currentTheme.accent : "#f4f3f4"}
            />
          </View>

          <View style={[styles.noteWrap, { borderTopColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
            <Text style={[styles.noteTitle, { color: currentTheme.text }]}>What happens next</Text>
            <Text style={[styles.noteText, { color: currentTheme.textLight }]}>
              You'll be taken to the Game screen. Use the History button in the game to view all called numbers as a modal — your current game will remain unchanged.
            </Text>
          </View>
        </View>

        {/* Ad Status Area */}
        <View style={styles.adContainer}>
          {adFreeUntil && adFreeUntil > Date.now() ? (
            <View style={[styles.adBadge, { backgroundColor: currentTheme.secondary }]}>
              <Text style={[styles.adBadgeText, { color: currentTheme.primary }]}>
                Ad-free until {new Date(adFreeUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : (
            <RewardedButton />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { backgroundColor: currentTheme.isDark ? 'rgba(9,5,20,0.95)' : 'rgba(255,255,255,0.9)', borderTopColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0', borderTopWidth: 1 }]}>
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: currentTheme.primary }]} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>START GAME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  headerBtn: { padding: 8 },
  exitLink: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
  aboutLink: { color: '#1976d2', fontWeight: 'bold', fontSize: 16 },
  container: { paddingHorizontal: 20, paddingTop: 10 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hostInputContainer: { marginBottom: 16 },
  hostInputLabel: { fontSize: 14, fontWeight: '800', color: '#444', marginBottom: 8 },
  hostInput: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111', borderWidth: 1, borderColor: '#f0f0f0' },
  resumeCard: { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' },
  resumeTitle: { fontSize: 16, fontWeight: '800', color: '#2e7d32', marginBottom: 4 },
  resumeText: { fontSize: 14, color: '#388e3c', marginBottom: 12 },
  resumeBtnRow: { flexDirection: 'row' },
  resumeBtn: { backgroundColor: '#4caf50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  resumeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12, color: '#444' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  option: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionActive: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' },
  optionText: { fontSize: 16, fontWeight: '800', color: '#666' },
  optionTextActive: { color: '#1976d2' },
  optionSub: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  speedRow: { flexDirection: 'row', gap: 8 },
  smallOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  smallOptionText: { fontWeight: '700', color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  noteWrap: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  noteTitle: { fontWeight: '700', marginBottom: 4, color: '#111' },
  noteText: { color: '#666', lineHeight: 20, fontSize: 13 },
  adContainer: { alignItems: 'center', marginTop: 10 },
  adBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  adBadgeText: { color: '#1976d2', fontWeight: '700', fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  startBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  themePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 13,
  },
});