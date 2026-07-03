// app/screens/PrivacyScreen.tsx
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../utils/store/themeState';

export default function PrivacyScreen() {
  const { currentTheme } = useTheme();
  const hostedUrl = 'https://www.askstudios.net/tambola-privacy-policy'; // use hosted policy if available

  // if you have the local HTML included in assets and want to load it:
  const localSource = Platform.OS === 'android'
    ? { uri: 'file:///android_asset/privacy.html' }
    : { uri: 'privacy.html' }; // on iOS you need to bundle differently

  // If you don't want to bundle local HTML, open the hosted URL in external browser
  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      {/* If you have react-native-webview and a hosted url, uncomment the WebView */}
      <WebView source={{ uri: hostedUrl }} style={{ flex: 1, backgroundColor: currentTheme.background }} />

      {/* Simple fallback: open external link */}
      <View style={[styles.center, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Privacy Policy</Text>
        <Text style={[styles.text, { color: currentTheme.textLight }]}>Open the hosted privacy policy in your browser.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.primary }]} onPress={() => Linking.openURL(hostedUrl)}>
          <Text style={styles.buttonText}>Open Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  text: { color: '#555', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#2e7d32', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700' }
});
