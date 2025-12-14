// app/screens/AboutScreen.tsx
import Constants from 'expo-constants';
import React from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
  // safe fallbacks without expo-application native module
  const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest ?? {};
  const appVersion = expoConfig.version ?? '1.5.0';
  const versionCode = expoConfig.android?.versionCode ?? expoConfig.ios?.buildNumber ?? '5';
  const packageName = expoConfig.android?.package ?? 'com.geekypajis.tambolanumbers';

  const openPrivacy = async () => {
    // open in browser the local privacy.html if hosted, else open external link
    const url = 'https://www.parmeetsingh.ca/privacy-policy'; // replace if you host
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Cannot open', url);
    }
  };

  const rateApp = () => {
    const url = `market://details?id=${packageName}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
    });
  };

  // const rateAppStore = () => {
  //   const url = `https://apps.apple.com/app/id${packageName}`;
  //   Linking.openURL(url).catch(() => {
  //     Alert.alert('Cannot open', url);
  //   });
  // };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Tambola Number Caller</Text>
      <Text style={styles.subtitle}>Version {appVersion} (build {versionCode})</Text>

      <TouchableOpacity style={styles.button} onPress={openPrivacy}>
        <Text style={styles.buttonText}>Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={rateApp}>
        <Text style={styles.buttonOutlineText}>Rate on Play Store</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.buttonOutline} onPress={rateAppStore}>
        <Text style={styles.buttonOutlineText}>Rate on App Store</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#fff' },
  logo: { width: 120, height: 120, marginBottom: 18, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 6 },
  button: { marginTop: 24, backgroundColor: '#2e7d32', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonOutline: { marginTop: 12, borderColor: '#2e7d32', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  buttonOutlineText: { color: '#2e7d32', fontWeight: '700' }
});
