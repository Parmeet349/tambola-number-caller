// app/screens/PrivacyScreen.tsx
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PrivacyScreen() {
  const hostedUrl = 'parmeetsingh.ca'; // use hosted policy if available

  // if you have the local HTML included in assets and want to load it:
  const localSource = Platform.OS === 'android'
    ? { uri: 'file:///android_asset/privacy.html' }
    : { uri: 'privacy.html' }; // on iOS you need to bundle differently

  // If you don't want to bundle local HTML, open the hosted URL in external browser
  return (
    <View style={{ flex: 1 }}>
      {/* If you have react-native-webview and a hosted url, uncomment the WebView */}
      <WebView source={{ uri: hostedUrl }} />

      {/* Simple fallback: open external link */}
      <View style={styles.center}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.text}>Open the hosted privacy policy in your browser.</Text>
        <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(hostedUrl)}>
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
