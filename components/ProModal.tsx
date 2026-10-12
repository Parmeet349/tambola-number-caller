// components/ProModal.tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { isRevenueCatConfigured } from '../constants/purchases';
import { getOfferings, purchasePackage, restorePurchases } from '../utils/purchases';
import { useAdState } from '../utils/store/adState';
import { useTheme } from '../utils/store/themeState';

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProModal({ visible, onClose }: ProModalProps) {
  const { currentTheme } = useTheme();
  const { isPro, setPro } = useAdState();

  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    (async () => {
      if (!isRevenueCatConfigured()) {
        return;
      }
      setLoadingOfferings(true);
      try {
        const offerings = await getOfferings();
        if (offerings && offerings.current && offerings.current.availablePackages.length > 0) {
          if (isMounted) {
            // Find lifetime package or fallback to the first available package
            const lifetime =
              offerings.current.lifetime ??
              offerings.current.availablePackages[0];
            setLifetimePackage(lifetime);
          }
        }
      } catch (e) {
        console.warn('Failed to load offerings:', e);
      } finally {
        if (isMounted) setLoadingOfferings(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handlePurchase = async () => {
    if (!isRevenueCatConfigured()) {
      if (__DEV__) {
        Alert.alert(
          'Dev Simulation Mode',
          'RevenueCat API keys are not set yet. Would you like to simulate a successful Pro unlock for testing?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate Pro',
              onPress: () => {
                setPro(true);
                Alert.alert('Unlocked!', 'Simulated Pro unlocked successfully.');
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Setup Pending',
          'In-app purchases are currently being initialized. Please try again shortly.'
        );
      }
      return;
    }

    if (!lifetimePackage) {
      Alert.alert(
        'Product Not Ready',
        'Could not load store product. Please verify your internet connection and try again.'
      );
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchasePackage(lifetimePackage);
      if (result.success || result.isPro) {
        setPro(true);
        Alert.alert('Welcome to Pro!', 'All ads have been permanently removed. Enjoy your game nights!');
        onClose();
      } else if (!result.userCancelled) {
        Alert.alert('Purchase Failed', result.error?.message || 'Could not complete purchase. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Purchase Error', e?.message || 'Something went wrong.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!isRevenueCatConfigured()) {
      if (__DEV__) {
        Alert.alert('Dev Mode', 'RevenueCat keys are not configured yet.');
      } else {
        Alert.alert('Notice', 'No previous purchases found to restore.');
      }
      return;
    }

    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        setPro(true);
        Alert.alert('Purchases Restored', 'Your Lifetime Pro purchase has been restored.');
        onClose();
      } else {
        Alert.alert('No Purchase Found', 'We could not find an active Pro purchase on this Apple / Google account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const openPrivacy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://www.askstudios.net/tambola-privacy-policy');
    } catch (e) {
      console.warn('Failed to open privacy policy:', e);
    }
  };

  const openTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        Platform.OS === 'ios'
          ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
          : 'https://play.google.com/intl/en_us/about/play-terms/'
      );
    } catch (e) {
      console.warn('Failed to open terms:', e);
    }
  };

  const priceLabel = lifetimePackage?.product?.priceString ?? (isRevenueCatConfigured() ? 'Unlock Pro' : 'Unlock Pro');

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.isDark ? (currentTheme.id === 'midnight' ? '#334155' : '#3d2e6b') : '#eee',
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: currentTheme.isDark ? (currentTheme.id === 'midnight' ? '#1e293b' : '#2a1f49') : '#f0f0f0' },
              ]}
              onPress={onClose}
              disabled={purchasing || restoring}
            >
              <MaterialIcons name="close" size={20} color={currentTheme.text} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Crown Badge Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.crownCircle,
                    {
                      backgroundColor: currentTheme.isDark ? '#ffd70020' : '#fff9db',
                      borderColor: '#ffd700',
                    },
                  ]}
                >
                  <MaterialIcons name="workspace-premium" size={44} color="#f59e0b" />
                </View>

                <Text style={[styles.title, { color: currentTheme.text }]}>
                  Tambola Lifetime Pro
                </Text>
                <Text style={[styles.subtitle, { color: currentTheme.textLight }]}>
                  One-time purchase • Ad-free forever
                </Text>
              </View>

              {/* Status Banner if already Pro */}
              {isPro ? (
                <View
                  style={[
                    styles.proActiveBanner,
                    {
                      backgroundColor: currentTheme.isDark ? '#1b4d24' : '#e8f5e9',
                      borderColor: '#4caf50',
                    },
                  ]}
                >
                  <MaterialIcons name="verified" size={24} color="#4caf50" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: '800', color: currentTheme.isDark ? '#fff' : '#1b5e20', fontSize: 15 }}>
                      Pro is Active
                    </Text>
                    <Text style={{ fontSize: 12, color: currentTheme.isDark ? '#c8e6c9' : '#2e7d32' }}>
                      All advertisements are permanently disabled on this device.
                    </Text>
                  </View>
                </View>
              ) : (
                /* Feature Benefit Cards */
                <View style={styles.features}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: '#ffebee' }]}>
                      <MaterialIcons name="block" size={22} color="#e53935" />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={[styles.featureTitle, { color: currentTheme.text }]}>
                        100% Ad-Free Forever
                      </Text>
                      <Text style={[styles.featureDesc, { color: currentTheme.textLight }]}>
                        No banners, popups, or video ads interrupting your game.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: '#e3f2fd' }]}>
                      <MaterialIcons name="speed" size={22} color="#1e88e5" />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={[styles.featureTitle, { color: currentTheme.text }]}>
                        Smooth Game Flow
                      </Text>
                      <Text style={[styles.featureDesc, { color: currentTheme.textLight }]}>
                        Never pause the excitement or make players wait for ads.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: '#fff3e0' }]}>
                      <MaterialIcons name="sync" size={22} color="#f57c00" />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={[styles.featureTitle, { color: currentTheme.text }]}>
                        Keep It Forever
                      </Text>
                      <Text style={[styles.featureDesc, { color: currentTheme.textLight }]}>
                        One purchase unlocks Pro for life across all your devices.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: '#f3e5f5' }]}>
                      <MaterialIcons name="favorite" size={22} color="#8e24aa" />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={[styles.featureTitle, { color: currentTheme.text }]}>
                        Support Indie Development
                      </Text>
                      <Text style={[styles.featureDesc, { color: currentTheme.textLight }]}>
                        Help us build new caller voices, themes, and game modes!
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Dev notice if keys not configured */}
              {__DEV__ && !isRevenueCatConfigured() && (
                <View style={styles.devBanner}>
                  <Text style={styles.devBannerText}>
                    💡 Setup Mode: RevenueCat keys not configured yet in constants/purchases.ts
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                {isPro ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
                    onPress={onClose}
                  >
                    <Text style={styles.primaryButtonText}>Continue Playing</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: '#e65100' },
                      purchasing && { opacity: 0.8 },
                    ]}
                    onPress={handlePurchase}
                    disabled={purchasing || restoring}
                  >
                    {purchasing || loadingOfferings ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.primaryButtonText}>
                          {lifetimePackage ? `Unlock Lifetime Pro (${priceLabel})` : 'Unlock Lifetime Pro'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Restore Purchases Button (Mandatory for App Store) */}
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={handleRestore}
                  disabled={purchasing || restoring}
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color={currentTheme.primary} />
                  ) : (
                    <Text style={[styles.restoreBtnText, { color: currentTheme.primary }]}>
                      Restore Previous Purchase
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Legal & Store Compliance Links */}
                <View style={styles.legalRow}>
                  <TouchableOpacity onPress={openTerms}>
                    <Text style={[styles.legalText, { color: currentTheme.textLight }]}>
                      Terms of Use
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.legalDot, { color: currentTheme.textLight }]}>•</Text>
                  <TouchableOpacity onPress={openPrivacy}>
                    <Text style={[styles.legalText, { color: currentTheme.textLight }]}>
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    maxHeight: '92%',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  crownEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  proActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  features: {
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  devBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginBottom: 14,
  },
  devBannerText: {
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e65100',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  restoreBtn: {
    paddingVertical: 8,
  },
  restoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  legalText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  legalDot: {
    marginHorizontal: 8,
    fontSize: 11,
  },
});
