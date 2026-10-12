// app/screens/AboutScreen.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdState } from "../../utils/store/adState";
import { useTheme } from "../../utils/store/themeState";
import ProModal from "../ProModal";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  );
  const { currentTheme } = useTheme();
  const { isPro } = useAdState();
  const [proModalVisible, setProModalVisible] = useState(false);
  const navigation = useNavigation();

  const expoConfig =
    (Constants as any).expoConfig ?? (Constants as any).manifest ?? {};
  const appVersion = expoConfig.version ?? "1.5.0";
  const buildNumber =
    expoConfig.android?.versionCode ?? expoConfig.ios?.buildNumber ?? "5";
  const packageName =
    expoConfig.android?.package ?? "com.geekypajis.tambolanumbers";

  const T = currentTheme;
  const isDark = T.isDark;

  const shareApp = async () => {
    try {
      const url =
        Platform.OS === "android"
          ? `https://play.google.com/store/apps/details?id=${packageName}`
          : `https://apps.apple.com/app/id6757088103`;
      await Share.share({
        message: `🎱 Check out Tambola Number Caller — the easiest way to host Tambola / Housie at home! Download: ${url}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const openPrivacy = () => {
    (navigation as any).navigate("Privacy");
  };

  const openRating = () => {
    if (Platform.OS === "android") {
      const url = `market://details?id=${packageName}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(
          `https://play.google.com/store/apps/details?id=${packageName}`,
        );
      });
    } else {
      const appleId = "6757088103";
      const url = `itms-apps://itunes.apple.com/app/id${appleId}?action=write-review`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://apps.apple.com/app/id${appleId}`);
      });
    }
  };

  const infoRows = [
    { label: "Version", value: `${appVersion}` },
    { label: "Developer", value: "ASK Studios" },
    { label: "Platform", value: Platform.OS === "ios" ? "iOS" : "Android" },
  ];

  return (
    <View style={[styles.safe, { backgroundColor: T.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: T.background,
            borderBottomColor: isDark ? "#2a1f49" : "#f0f0f0",
            paddingTop: topInset + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="arrow-back" size={18} color={T.primary} />
            <Text style={[styles.backBtnText, { color: T.primary }]}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: T.text }]}>About</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* App logo + title */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={[
              styles.logo,
              {
                borderColor: isDark ? "#2a1f49" : "#eee",
                backgroundColor: isDark ? "#1a122e" : "#f9f9f9",
              },
            ]}
          />
          <Text style={[styles.appTitle, { color: T.text }]}>
            Tambola Number Caller
          </Text>
          <Text style={[styles.appSubtitle, { color: T.textLight }]}>
            The modern, clean Housie caller
          </Text>
        </View>

        {/* Membership card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: T.cardBg,
              borderColor: isDark ? "#2a1f49" : "#f0f0f0",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: T.text }]}>Membership</Text>
          <View
            style={[
              styles.membershipRow,
              {
                backgroundColor: isPro
                  ? isDark
                    ? "#1e382b"
                    : "#e8f5e9"
                  : isDark
                    ? "#1b1433"
                    : "#fafafa",
                borderColor: isPro ? "#4caf50" : isDark ? "#2a1f49" : "#ebebeb",
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <MaterialIcons
                name={isPro ? "verified" : "lock-open"}
                size={16}
                color={isPro ? (isDark ? "#81c784" : "#2e7d32") : T.textLight}
              />
              <Text
                style={[
                  styles.membershipStatusText,
                  {
                    color: isPro
                      ? isDark
                        ? "#81c784"
                        : "#2e7d32"
                      : T.textLight,
                  },
                ]}
              >
                {isPro ? "Lifetime Pro · Ad-Free" : "Free Plan (Ad-Supported)"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.proBtn,
              {
                backgroundColor: isPro
                  ? isDark
                    ? "#251b40"
                    : "#f5f5f5"
                  : T.primary,
              },
            ]}
            onPress={() => setProModalVisible(true)}
            activeOpacity={0.85}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MaterialIcons
                name={isPro ? "sync" : "workspace-premium"}
                size={16}
                color={isPro ? T.textLight : "#fff"}
              />
              <Text
                style={[
                  styles.proBtnText,
                  { color: isPro ? T.textLight : "#fff" },
                ]}
              >
                {isPro
                  ? "Manage / Restore Purchase"
                  : "Upgrade to Lifetime Pro"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App info card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: T.cardBg,
              borderColor: isDark ? "#2a1f49" : "#f0f0f0",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: T.text }]}>App Info</Text>
          {infoRows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                {
                  borderBottomColor: isDark ? "#2a1f49" : "#f5f5f5",
                  borderBottomWidth: i < infoRows.length - 1 ? 1 : 0,
                },
              ]}
            >
              <Text style={[styles.infoLabel, { color: T.textLight }]}>
                {row.label}
              </Text>
              <Text style={[styles.infoValue, { color: T.text }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: T.primary }]}
            onPress={openRating}
            activeOpacity={0.85}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="star" size={16} color="#ffd700" />
              <Text style={styles.primaryBtnText}>
                {Platform.OS === "android"
                  ? "Rate on Play Store"
                  : "Rate on App Store"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: T.primary, backgroundColor: T.cardBg },
            ]}
            onPress={shareApp}
            activeOpacity={0.85}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={T.primary}
              />
              <Text style={[styles.secondaryBtnText, { color: T.primary }]}>
                Share with Friends
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textBtn} onPress={openPrivacy}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={T.textLight}
              />
              <Text style={[styles.textBtnText, { color: T.textLight }]}>
                Privacy Policy
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerNote, { color: T.textLight }]}>
            Made with
          </Text>
          <Ionicons name="heart" size={13} color="#ef4444" />
          <Text style={[styles.footerNote, { color: T.textLight }]}>
            for Tambola lovers everywhere
          </Text>
        </View>
      </ScrollView>

      <ProModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 60 },
  backBtnText: { fontWeight: "700", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "900" },

  container: { padding: 20, alignItems: "center" },

  logoSection: { alignItems: "center", marginBottom: 28, marginTop: 8 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  appTitle: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  appSubtitle: { fontSize: 13, marginTop: 4, textAlign: "center" },

  card: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  membershipRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  membershipStatusText: { fontWeight: "700", fontSize: 14 },
  proBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  proBtnText: { fontWeight: "800", fontSize: 14 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: { fontWeight: "600", fontSize: 14 },
  infoValue: { fontWeight: "700", fontSize: 14 },

  actionsSection: { width: "100%", gap: 10, marginBottom: 8 },
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  secondaryBtnText: { fontWeight: "800", fontSize: 15 },
  textBtn: { paddingVertical: 12, alignItems: "center" },
  textBtnText: {
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 24,
    paddingBottom: 20,
  },
  footerNote: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
