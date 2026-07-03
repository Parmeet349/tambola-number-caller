import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/store/themeState';

export default function PrivacyScreen() {
  const { currentTheme } = useTheme();
  const hostedUrl = 'https://www.askstudios.net/tambola-privacy-policy';

  const handleOpenOnline = async () => {
    try {
      await WebBrowser.openBrowserAsync(hostedUrl);
    } catch (e) {
      console.warn('Failed to open browser', e);
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.card, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: currentTheme.textLight }]}>Last Updated: December 26, 2025</Text>
        
        <View style={styles.separator} />
        
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>1. Overview</Text>
        <Text style={[styles.paragraph, { color: currentTheme.textLight }]}>
          Tambola Number Caller (Housie) is developed and owned by ASK Studios. Your privacy is extremely important to us. This document explains how information is handled when you use our mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>2. No Personal Data Collection</Text>
        <Text style={[styles.paragraph, { color: currentTheme.textLight }]}>
          We do not collect, store, or share any personal or sensitive user data. 
          {"\n"}• No account creation or registration is required.
          {"\n"}• No names, email addresses, phone numbers, or physical addresses are stored.
          {"\n"}• No precise location data is collected.
          {"\n"}All core game features run entirely offline and locally on your device.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>3. Advertising & Cookies</Text>
        <Text style={[styles.paragraph, { color: currentTheme.textLight }]}>
          {"The App displays advertisements using Google AdMob. While ASK Studios does not collect personal data, AdMob may automatically collect limited device identifiers and basic usage metrics according to Google's policies to serve relevant advertisements."}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>4. No Gambling</Text>
        <Text style={[styles.paragraph, { color: currentTheme.textLight }]}>
          This app is a random number caller utility designed for friendly family game nights. No real-money gambling is offered, supported, or integrated.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: currentTheme.primary }]} 
        onPress={handleOpenOnline}
      >
        <Text style={styles.buttonText}>Read Full Policy Online</Text>
      </TouchableOpacity>
      
      <Text style={[styles.footerText, { color: currentTheme.textLight }]}>
        © 2026 ASK Studios. All rights reserved.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});
