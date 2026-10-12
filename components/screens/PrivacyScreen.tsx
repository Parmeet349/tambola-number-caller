// components/screens/PrivacyScreen.tsx
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/store/themeState';
import { useNavigation } from '@react-navigation/native';

const SECTIONS = [
  {
    title: '1. Overview',
    body: 'Tambola Number Caller (Housie) is developed and maintained by ASK Studios. Your privacy is a fundamental priority. This Privacy Policy details how data is handled when you use our mobile application.',
  },
  {
    title: '2. No Personal Data Collection',
    body: 'We do not collect, harvest, or sell any personal identifying information:\n\n• No account sign-up, email, phone number, or login credentials required.\n• No contact book, photos, camera, or precise geolocation access.\n• Core caller gameplay runs completely offline on your device.',
  },
  {
    title: '3. In-App Purchases & Subscriptions',
    body: 'We offer an optional Lifetime Pro / Ad-Free upgrade.\n\n• Payment Processing: All transactions are processed directly by Apple App Store (iOS) or Google Play Store (Android). ASK Studios never sees, processes, or stores your credit card, debit card, or billing information.\n• RevenueCat Integration: We utilize RevenueCat to securely validate purchase receipts, manage Pro entitlements, and restore previous purchases across your devices. RevenueCat processes anonymous app user identifiers and receipt tokens strictly in accordance with their privacy standards.',
  },
  {
    title: '4. Advertising (Free Plan)',
    body: 'The free version of the App serves advertisements powered by Google AdMob.\n\n• AdMob may use device advertising identifiers (such as IDFA or GAID) and coarse analytics to deliver relevant ads and limit repeat views according to Google’s privacy standards.\n• Upgrading to Lifetime Pro or activating 30-minute ad-free sessions completely disables advertisements in the app.',
  },
  {
    title: '5. Local Storage & Device Data',
    body: 'The app saves your caller speed, voice preference, host name, game state, ticket marks, and custom reminders locally on your device storage (AsyncStorage). This data never leaves your device and can be erased at any time by clearing app data or uninstalling the app.',
  },
  {
    title: '6. Live Party Mode & Sync',
    body: 'When hosting or joining a Live Party, room codes and called number events are transmitted ephemerally to synchronize the game board in real-time. No player logs, messages, or personal profiles are stored on our servers once the game session ends.',
  },
  {
    title: '7. Children’s Privacy (COPPA)',
    body: 'Tambola Number Caller is designed for family-friendly gatherings and friendly social games. We do not knowingly collect personal information from children under the age of 13.',
  },
  {
    title: '8. No Gambling',
    body: 'This app is strictly a utility for drawing and announcing random numbers for family party games (Tambola, Housie, Indian Bingo). No real-money gambling, betting, or cash prizes are hosted or facilitated.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have questions, feedback, or concerns regarding your privacy or this policy, please reach out to us at:\n\nEmail: askstudios.developer@gmail.com\nWebsite: https://www.askstudios.net',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { currentTheme: T } = useTheme();
  const isDark = T.isDark;
  const navigation = useNavigation();
  const hostedUrl = 'https://www.askstudios.net/tambola-privacy-policy';

  const handleOpenOnline = async () => {
    try {
      await WebBrowser.openBrowserAsync(hostedUrl);
    } catch (e) {
      console.warn('Failed to open browser', e);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: T.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: T.background, borderBottomColor: isDark ? '#2a1f49' : '#f0f0f0', paddingTop: topInset + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.backBtnText, { color: T.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: T.text }]}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.date, { color: T.textLight }]}>Last Updated: December 26, 2025</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.section, { backgroundColor: T.cardBg, borderColor: isDark ? '#2a1f49' : '#f0f0f0' }]}>
            <Text style={[styles.sectionTitle, { color: T.text }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: T.textLight }]}>{section.body}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: T.primary }]}
          onPress={handleOpenOnline}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>🌐  Read Full Policy Online</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: T.textLight }]}>© 2026 ASK Studios. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 60 },
  backBtnText: { fontWeight: '700', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  container: { padding: 20, gap: 12 },
  date: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  section: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  primaryBtn: {
    marginTop: 4,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footer: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 20 },
});
