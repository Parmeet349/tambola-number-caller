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
  View,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../app/(tabs)/index';
import { logEvent } from '../../utils/analytics';
import { useAdState } from '../../utils/store/adState';
import { scheduleGameNightReminder, ReminderConfig } from '../../utils/notifications';
import RewardedButton from '../RewardedButton';
import { useTheme, THEMES } from '../../utils/store/themeState';

interface CustomReminderConfig {
  type: 'weekly' | 'once';
  weekday: number; // 1 = Sunday, 7 = Saturday
  hour: number; // 1-12
  minute: number; // 0-59
  period: 'AM' | 'PM';
  onceDate: string; // YYYY-MM-DD
}

function get24Hour(hour12: number, period: 'AM' | 'PM'): number {
  let hr = hour12;
  if (period === 'PM' && hr < 12) hr += 12;
  if (period === 'AM' && hr === 12) hr = 0;
  return hr;
}

function getReminderDisplayText(config: CustomReminderConfig): string {
  const timeStr = `${config.hour}:${String(config.minute).padStart(2, '0')} ${config.period}`;
  if (config.type === 'weekly') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[config.weekday - 1] || 'Saturday';
    return `Weekly on ${dayName}s at ${timeStr}`;
  } else {
    try {
      const [year, month, day] = config.onceDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dateFormatted = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return `${dateFormatted} at ${timeStr}`;
    } catch (e) {
      return `${config.onceDate} at ${timeStr}`;
    }
  }
}


type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { currentTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [mute, setMute] = useState<boolean>(false);
  const [hostName, setHostName] = useState<string>('');
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderConfig, setReminderConfig] = useState<CustomReminderConfig>({
    type: 'weekly',
    weekday: 7, // Saturday
    hour: 7,
    minute: 0,
    period: 'PM',
    onceDate: new Date().toISOString().split('T')[0],
  });
  const [tempConfig, setTempConfig] = useState<CustomReminderConfig>({
    type: 'weekly',
    weekday: 7,
    hour: 7,
    minute: 0,
    period: 'PM',
    onceDate: new Date().toISOString().split('T')[0],
  });
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
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

          const configStr = await AsyncStorage.getItem('@tambola_reminder_config');
          if (configStr) {
            setReminderConfig(JSON.parse(configStr));
          }
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
      const hr24 = get24Hour(reminderConfig.hour, reminderConfig.period);
      const reminderPayload: ReminderConfig = {
        enabled: val,
        type: reminderConfig.type,
        weekday: reminderConfig.weekday,
        hour: hr24,
        minute: reminderConfig.minute,
        onceDate: reminderConfig.onceDate,
      };
      const success = await scheduleGameNightReminder(reminderPayload);
      if (val && !success) {
        setReminderEnabled(false);
        await AsyncStorage.setItem('@tambola_reminder', 'false');
        Alert.alert('Reminder Setup Failed', 'Please ensure you select a future date/time, and enable notifications in your device settings.');
      }
    } catch (e) {}
  };

  const saveReminderConfig = async (newConfig: CustomReminderConfig) => {
    try {
      await AsyncStorage.setItem('@tambola_reminder_config', JSON.stringify(newConfig));
      setReminderConfig(newConfig);
      
      setReminderEnabled(true);
      await AsyncStorage.setItem('@tambola_reminder', 'true');

      const hr24 = get24Hour(newConfig.hour, newConfig.period);
      const reminderPayload: ReminderConfig = {
        enabled: true,
        type: newConfig.type,
        weekday: newConfig.weekday,
        hour: hr24,
        minute: newConfig.minute,
        onceDate: newConfig.onceDate,
      };
      const success = await scheduleGameNightReminder(reminderPayload);

      if (!success) {
        setReminderEnabled(false);
        await AsyncStorage.setItem('@tambola_reminder', 'false');
        Alert.alert('Reminder Setup Failed', 'Please ensure you select a future date and time, and check your notification settings.');
      } else {
        Alert.alert('Reminder Set', 'Your custom Tambola reminder has been successfully scheduled!');
      }
    } catch (e) {
      console.warn('Failed to save reminder config', e);
    }
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

  const confirmExit = useCallback(() => {
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
  }, []);

  const onHardwareBackPress = useCallback(() => {
    confirmExit();
    return true; // VERY IMPORTANT
  }, [confirmExit]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          onHardwareBackPress
        );
        return () => backHandler.remove();
      }
    }, [onHardwareBackPress])
  );
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const datesList = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const dateNum = d.getDate();
    
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    const dayNum = dateNum;
    const weekday = weekdayNames[d.getDay()];
    const month = monthNames[monthIndex];
    datesList.push({ dateStr, dayNum, weekday, month });
  }

  const WEEKDAYS = [
    { id: 1, label: 'Sun' },
    { id: 2, label: 'Mon' },
    { id: 3, label: 'Tue' },
    { id: 4, label: 'Wed' },
    { id: 5, label: 'Thu' },
    { id: 6, label: 'Fri' },
    { id: 7, label: 'Sat' },
  ];

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

          <View style={[styles.row, { marginTop: 12, alignItems: 'center' }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.rowLabel, { color: currentTheme.text }]}>Game Night Reminder</Text>
              <TouchableOpacity 
                onPress={() => {
                  setTempConfig(reminderConfig);
                  setReminderModalVisible(true);
                }}
                style={{ marginTop: 4 }}
              >
                <Text style={{ color: reminderEnabled ? currentTheme.primary : currentTheme.textLight, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                  {getReminderDisplayText(reminderConfig)}
                </Text>
              </TouchableOpacity>
            </View>
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
              {"You'll be taken to the Game screen. Use the History button in the game to view all called numbers as a modal — your current game will remain unchanged."}
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

      <Modal
        visible={reminderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.isDark ? '#1b1433' : '#ffffff', borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0', borderWidth: 1 }]}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>⏰ Custom Reminder</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseBtnText, { color: currentTheme.textLight }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Modal Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              
              {/* Reminder Type Selection */}
              <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Reminder Type</Text>
              <View style={[styles.typeToggleRow, { backgroundColor: currentTheme.isDark ? '#120b24' : '#f5f5f5' }]}>
                <TouchableOpacity
                  onPress={() => setTempConfig(prev => ({ ...prev, type: 'weekly' }))}
                  style={[
                    styles.typeToggleBtn,
                    tempConfig.type === 'weekly' && { backgroundColor: currentTheme.primary }
                  ]}
                >
                  <Text style={[styles.typeToggleText, { color: tempConfig.type === 'weekly' ? '#fff' : currentTheme.textLight }]}>
                    Weekly Repeating
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTempConfig(prev => ({ ...prev, type: 'once' }))}
                  style={[
                    styles.typeToggleBtn,
                    tempConfig.type === 'once' && { backgroundColor: currentTheme.primary }
                  ]}
                >
                  <Text style={[styles.typeToggleText, { color: tempConfig.type === 'once' ? '#fff' : currentTheme.textLight }]}>
                    One-Time Event
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Weekly Settings */}
              {tempConfig.type === 'weekly' ? (
                <>
                  <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Select Day</Text>
                  <View style={styles.weekdayContainer}>
                    {WEEKDAYS.map((day) => {
                      const isSelected = tempConfig.weekday === day.id;
                      return (
                        <TouchableOpacity
                          key={day.id}
                          onPress={() => setTempConfig(prev => ({ ...prev, weekday: day.id }))}
                          style={[
                            styles.weekdayCircle,
                            {
                              borderColor: isSelected ? currentTheme.primary : (currentTheme.isDark ? '#3c2a63' : '#ddd'),
                              backgroundColor: isSelected ? currentTheme.primary : 'transparent',
                            }
                          ]}
                        >
                          <Text style={[styles.weekdayText, { color: isSelected ? '#fff' : currentTheme.text }]}>
                            {day.label.slice(0, 1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  {/* One-Time Date Picker */}
                  <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {datesList.map((item) => {
                      const isSelected = tempConfig.onceDate === item.dateStr;
                      return (
                        <TouchableOpacity
                          key={item.dateStr}
                          onPress={() => setTempConfig(prev => ({ ...prev, onceDate: item.dateStr }))}
                          style={[
                            styles.dateCard,
                            {
                              borderColor: isSelected ? currentTheme.primary : (currentTheme.isDark ? '#3c2a63' : '#ddd'),
                              backgroundColor: isSelected ? currentTheme.primary : 'transparent',
                            }
                          ]}
                        >
                          <Text style={[styles.dateCardWeekday, { color: isSelected ? '#fff' : currentTheme.textLight }]}>
                            {item.weekday}
                          </Text>
                          <Text style={[styles.dateCardDay, { color: isSelected ? '#fff' : currentTheme.text, fontWeight: '800' }]}>
                            {item.dayNum}
                          </Text>
                          <Text style={[styles.dateCardMonth, { color: isSelected ? '#fff' : currentTheme.textLight }]}>
                            {item.month}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Hour Selection */}
              <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Select Hour</Text>
              <View style={styles.timeGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hr) => {
                  const isSelected = tempConfig.hour === hr;
                  return (
                    <TouchableOpacity
                      key={hr}
                      onPress={() => setTempConfig(prev => ({ ...prev, hour: hr }))}
                      style={[
                        styles.timeGridButton,
                        {
                          backgroundColor: isSelected ? currentTheme.primary : (currentTheme.isDark ? '#251b40' : '#f5f5f5'),
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#fff' : currentTheme.text, fontWeight: '600' }}>
                        {hr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Minute Selection */}
              <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Select Minute</Text>
              <View style={styles.timeGrid}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
                  const isSelected = tempConfig.minute === min;
                  return (
                    <TouchableOpacity
                      key={min}
                      onPress={() => setTempConfig(prev => ({ ...prev, minute: min }))}
                      style={[
                        styles.timeGridButton,
                        {
                          backgroundColor: isSelected ? currentTheme.primary : (currentTheme.isDark ? '#251b40' : '#f5f5f5'),
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#fff' : currentTheme.text, fontWeight: '600' }}>
                        {String(min).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Period selection */}
              <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>AM / PM</Text>
              <View style={styles.periodRow}>
                {['AM', 'PM'].map((p) => {
                  const isSelected = tempConfig.period === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setTempConfig(prev => ({ ...prev, period: p as 'AM' | 'PM' }))}
                      style={[
                        styles.periodButton,
                        {
                          backgroundColor: isSelected ? currentTheme.primary : (currentTheme.isDark ? '#251b40' : '#f5f5f5'),
                          flex: 1,
                          marginHorizontal: 4,
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#fff' : currentTheme.text, fontWeight: 'bold' }}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.modalFooter, { borderTopColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
              <TouchableOpacity
                onPress={() => setReminderModalVisible(false)}
                style={[styles.modalFooterBtn, { backgroundColor: currentTheme.isDark ? '#251b40' : '#f5f5f5' }]}
              >
                <Text style={[styles.modalFooterBtnText, { color: currentTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setReminderModalVisible(false);
                  saveReminderConfig(tempConfig);
                }}
                style={[styles.modalFooterBtn, { backgroundColor: currentTheme.primary }]}
              >
                <Text style={[styles.modalFooterBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeToggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeToggleText: {
    fontWeight: '700',
    fontSize: 14,
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  weekdayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateCard: {
    width: 60,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateCardWeekday: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateCardDay: {
    fontSize: 18,
    marginVertical: 2,
  },
  dateCardMonth: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  timeGridButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  periodButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalFooterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalFooterBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});