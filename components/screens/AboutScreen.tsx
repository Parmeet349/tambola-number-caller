// app/screens/AboutScreen.tsx
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../utils/store/themeState';

export default function AboutScreen() {
  const { currentTheme } = useTheme();
  const navigation = useNavigation();

  // safe fallbacks
  const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest ?? {};
  const appVersion = expoConfig.version ?? '1.5.0';
  const buildNumber = expoConfig.android?.versionCode ?? expoConfig.ios?.buildNumber ?? '5';
  const packageName = expoConfig.android?.package ?? 'com.geekypajis.tambolanumbers';

  const shareApp = async () => {
    try {
      const url = Platform.OS === 'android'
        ? `https://play.google.com/store/apps/details?id=${packageName}`
        : `https://apps.apple.com/app/id6757088103`;

      await Share.share({
        message: `Check out this Tambola Number Caller app! It makes playing Tambola so much easier. Download here: ${url}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const openPrivacy = () => {
    navigation.navigate('Privacy' as any);
  };

  const openRating = () => {
    if (Platform.OS === 'android') {
      const url = `market://details?id=${packageName}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
      });
    } else {
      const appleId = '6757088103';
      const url = `itms-apps://itunes.apple.com/app/id${appleId}?action=write-review`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://apps.apple.com/app/id${appleId}`);
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.background }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: currentTheme.cardBg, borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: currentTheme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>About App</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoSection}>
          <Image source={require('../../assets/images/logo.png')} style={[styles.logo, { borderColor: currentTheme.isDark ? '#2a1f49' : '#eee', backgroundColor: currentTheme.isDark ? '#1a122e' : '#f9f9f9' }]} />
          <Text style={[styles.title, { color: currentTheme.text }]}>Tambola Number Caller</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textLight }]}>Perfect for your next game night!</Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
          <Text style={[styles.cardTitle, { color: currentTheme.text }]}>App Information</Text>
          <View style={[styles.infoRow, { borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
            <Text style={[styles.infoLabel, { color: currentTheme.textLight }]}>Version</Text>
            <Text style={[styles.infoValue, { color: currentTheme.text }]}>{appVersion}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
            <Text style={[styles.infoLabel, { color: currentTheme.textLight }]}>Developer</Text>
            <Text style={[styles.infoValue, { color: currentTheme.text }]}>ASK Studios</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]} onPress={openRating}>
            <Text style={styles.primaryButtonText}>
              {Platform.OS === 'android' ? 'Rate on Play Store' : 'Rate on App Store'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.primary }]} onPress={shareApp}>
            <Text style={[styles.secondaryButtonText, { color: currentTheme.primary }]}>Share with Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={openPrivacy}>
            <Text style={[styles.textButtonText, { color: currentTheme.textLight }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: currentTheme.textLight }]}>Made with ❤️ for Tambola lovers</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 8, width: 70 },
  backBtnText: { color: '#1976d2', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  container: { padding: 24, alignItems: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee'
  },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },

  card: {
    width: '100%',
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#444' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoLabel: { color: '#777', fontWeight: '600' },
  infoValue: { color: '#111', fontWeight: '700' },

  actionSection: { width: '100%', gap: 12 },
  primaryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1976d2'
  },
  secondaryButtonText: { color: '#1976d2', fontWeight: '800', fontSize: 16 },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonText: { color: '#666', fontWeight: '600', textDecorationLine: 'underline' },

  footerText: { marginTop: 40, color: '#bbb', fontSize: 12, fontWeight: '600' }
});