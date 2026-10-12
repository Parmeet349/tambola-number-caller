// components/screens/HomeScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../app/(tabs)/index";
import { logEvent } from "../../utils/analytics";
import { generateRoomCode } from "../../utils/partySync";
import { useAdState } from "../../utils/store/adState";
import { THEMES, useTheme } from "../../utils/store/themeState";
import JoinPartyModal from "../JoinPartyModal";
import ProModal from "../ProModal";
import RewardedButton from "../RewardedButton";
import { ThemeModal } from "../ThemeModal";

interface CustomReminderConfig {
  type: "weekly" | "once";
  weekday: number;
  hour: number;
  minute: number;
  period: "AM" | "PM";
  onceDate: string;
}

function get24Hour(hour12: number, period: "AM" | "PM"): number {
  let hr = hour12;
  if (period === "PM" && hr < 12) hr += 12;
  if (period === "AM" && hr === 12) hr = 0;
  return hr;
}

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const VOICE_OPTIONS = [
  { id: "fun_english", label: "Fun English" },
  { id: "classic", label: "Classic UK" },
  { id: "desi_bingo", label: "Desi Bingo" },
  { id: "hindi_standard", label: "Hindi Standard" },
] as const;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  );
  const { currentTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [mute, setMute] = useState<boolean>(false);
  const [hostName, setHostName] = useState<string>("");
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const [voiceIndex, setVoiceIndex] = useState<number>(0);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderConfig, setReminderConfig] = useState<CustomReminderConfig>({
    type: "weekly",
    weekday: 7,
    hour: 7,
    minute: 0,
    period: "PM",
    onceDate: new Date().toISOString().split("T")[0],
  });

  const [proModalVisible, setProModalVisible] = useState(false);
  const [joinPartyModalVisible, setJoinPartyModalVisible] = useState(false);
  const { isPro, adFreeUntil } = useAdState();

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleHostLiveParty = () => {
    const code = generateRoomCode();
    navigation.navigate("Game", {
      initialMode: mode,
      initialSpeed: speed,
      initialMute: mute,
      hostName,
      partyRoomCode: code,
      isPartyHost: true,
      callerVoice: VOICE_OPTIONS[voiceIndex].id,
      isNewGame: true,
    });
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const name = await AsyncStorage.getItem("@tambola_host_name");
          if (name) setHostName(name);

          const savedVoice = await AsyncStorage.getItem(
            "@tambola_caller_voice",
          );
          if (savedVoice) {
            const idx = VOICE_OPTIONS.findIndex((v) => v.id === savedVoice);
            if (idx !== -1) setVoiceIndex(idx);
          }

          const stateStr = await AsyncStorage.getItem("@tambola_state_v1");
          if (stateStr) {
            const state = JSON.parse(stateStr);
            if (
              state &&
              state.called &&
              state.called.length > 0 &&
              state.called.length < 90
            ) {
              setResumeCount(state.called.length);
            } else {
              setResumeCount(null);
            }
          } else {
            setResumeCount(null);
          }

          const reminderStr = await AsyncStorage.getItem("@tambola_reminder");
          if (reminderStr === "true") setReminderEnabled(true);
        } catch (e) {}
      })();
    }, []),
  );

  const handleStart = async () => {
    try {
      await AsyncStorage.removeItem("@tambola_state_v1");
    } catch (e) {}
    logEvent("game_start", { mode, speed, mute });
    navigation.navigate("Game", {
      initialMode: mode,
      initialSpeed: speed,
      initialMute: mute,
      hostName,
      callerVoice: VOICE_OPTIONS[voiceIndex].id,
      isNewGame: true,
    });
  };

  const handleResume = () => {
    logEvent("game_resume", { resumeCount });
    navigation.navigate("Game", {
      hostName,
      callerVoice: VOICE_OPTIONS[voiceIndex].id,
      isResume: true,
    });
  };

  const T = currentTheme;
  const isDark = T.isDark;

  return (
    <View style={[styles.safe, { backgroundColor: T.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── HEADER ── */}
      <View
        style={[
          styles.header,
          { backgroundColor: T.background, paddingTop: topInset + 8 },
        ]}
      >
        <View style={styles.headerBrand}>
          <View
            style={[styles.headerIconBadge, { backgroundColor: T.primary }]}
          >
            <Ionicons name="dice" size={17} color="#ffffff" />
          </View>
          <Text style={[styles.headerLogo, { color: T.text }]}>Tambola</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.goProPill,
              isPro
                ? {
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#d1fae5",
                    borderColor: isDark
                      ? "rgba(16, 185, 129, 0.35)"
                      : "#a7f3d0",
                  }
                : {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.15)"
                      : "#fef3c7",
                    borderColor: isDark
                      ? "rgba(245, 158, 11, 0.35)"
                      : "#fde68a",
                  },
            ]}
            onPress={() => setProModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPro ? "sparkles" : "star"}
              size={13}
              color={isPro ? "#10b981" : isDark ? "#fbbf24" : "#d97706"}
            />
            <Text
              style={[
                styles.goProPillText,
                { color: isPro ? "#10b981" : isDark ? "#fbbf24" : "#b45309" },
              ]}
            >
              {isPro ? "PRO ACTIVE" : "GO PRO"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.infoBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
            onPress={() => navigation.navigate("About")}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={T.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── TITLE SECTION ── */}
          <View style={styles.titleSection}>
            <Text style={[styles.titleGreeting, { color: T.textLight }]}>
              {hostName.trim()
                ? `Welcome back, ${hostName}! 👋`
                : "Ready for game night?"}
            </Text>
            <Text style={[styles.titleMain, { color: T.text }]}>
              Let's Play
            </Text>
          </View>

          {/* ── RESUME BANNER (if active game exists) ── */}
          {resumeCount !== null && resumeCount > 0 && (
            <TouchableOpacity
              style={[
                styles.resumeCard,
                {
                  backgroundColor: T.cardBg,
                  borderColor: isDark ? "#2a1f49" : "#f0f1f4",
                },
              ]}
              onPress={handleResume}
              activeOpacity={0.85}
            >
              <View style={styles.resumeLeft}>
                <View
                  style={[
                    styles.resumeProgressCircle,
                    { borderColor: T.primary },
                  ]}
                >
                  <View
                    style={[
                      styles.resumeInnerDot,
                      { backgroundColor: T.primary },
                    ]}
                  />
                </View>
                <View>
                  <Text style={[styles.resumeTitle, { color: T.text }]}>
                    Game in progress
                  </Text>
                  <Text style={[styles.resumeSub, { color: T.textLight }]}>
                    {resumeCount} of 90 numbers called
                  </Text>
                </View>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Text style={[styles.resumeCtaText, { color: T.primary }]}>
                  Resume
                </Text>
                <Ionicons name="chevron-forward" size={16} color={T.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* ── NEW GAME CARD ── */}
          <View style={[styles.newGameCard, { backgroundColor: T.primary }]}>
            {/* Watermark 90 */}
            <Text style={styles.watermark}>90</Text>

            <Text style={styles.newGameTag}>NEW GAME</Text>

            {/* Mode Switcher */}
            <View style={styles.modeTabsWrap}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  mode === "manual" && styles.modeTabActive,
                ]}
                onPress={() => setMode("manual")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === "manual"
                      ? { color: T.primary }
                      : styles.modeTabInactiveText,
                  ]}
                >
                  Manual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTab,
                  mode === "auto" && styles.modeTabActive,
                ]}
                onPress={() => setMode("auto")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === "auto"
                      ? { color: T.primary }
                      : styles.modeTabInactiveText,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instruction description */}
            <Text style={styles.modeDescription}>
              {mode === "manual"
                ? "Tap to call each number at your own pace."
                : "Numbers will be called automatically on a timer."}
            </Text>

            {/* Speed Pills */}
            <View style={styles.speedPillsRow}>
              {(["slow", "medium", "fast"] as const).map((s) => {
                const label =
                  s === "slow" ? "Relaxed" : s === "medium" ? "Normal" : "Fast";
                const isSelected = speed === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedPill,
                      isSelected && styles.speedPillActive,
                    ]}
                    onPress={() => setSpeed(s)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.speedPillText,
                        isSelected && { fontWeight: "900" },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Start Game Button */}
            <TouchableOpacity
              style={styles.startGameBtn}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Ionicons
                name="play"
                size={16}
                color={T.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.startGameBtnText, { color: T.primary }]}>
                Start game
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── HOST A GAME / JOIN A GAME GRID ── */}
          <View style={styles.partyGridRow}>
            {/* Host Card */}
            <TouchableOpacity
              style={[
                styles.partyCard,
                {
                  backgroundColor: T.cardBg,
                  borderColor: isDark
                    ? T.id === "midnight"
                      ? "#222f44"
                      : "#2a1f49"
                    : "#f0f1f4",
                },
              ]}
              onPress={handleHostLiveParty}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.partyIconCircle,
                  { backgroundColor: T.secondary },
                ]}
              >
                <Ionicons name="people" size={20} color={T.primary} />
              </View>
              <Text style={[styles.partyCardTitle, { color: T.text }]}>
                Host a game
              </Text>
              <Text style={[styles.partyCardSub, { color: T.textLight }]}>
                Share a room code
              </Text>
            </TouchableOpacity>

            {/* Join Card */}
            <TouchableOpacity
              style={[
                styles.partyCard,
                {
                  backgroundColor: T.cardBg,
                  borderColor: isDark
                    ? T.id === "midnight"
                      ? "#222f44"
                      : "#2a1f49"
                    : "#f0f1f4",
                },
              ]}
              onPress={() => setJoinPartyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.partyIconCircle,
                  { backgroundColor: T.secondary },
                ]}
              >
                <Ionicons name="grid-outline" size={18} color={T.primary} />
              </View>
              <Text style={[styles.partyCardTitle, { color: T.text }]}>
                Join a game
              </Text>
              <Text style={[styles.partyCardSub, { color: T.textLight }]}>
                Enter a room code
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── PREFERENCES CARD (VOICE & THEME) ── */}
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: T.cardBg,
                borderColor: isDark
                  ? T.id === "midnight"
                    ? "#222f44"
                    : "#2a1f49"
                  : "#f0f1f4",
              },
            ]}
          >
            {/* Voice Row */}
            <TouchableOpacity
              style={styles.settingRowItem}
              onPress={() => setVoiceModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: T.secondary },
                  ]}
                >
                  <Ionicons name="mic-outline" size={17} color={T.primary} />
                </View>
                <Text style={[styles.settingItemLabel, { color: T.text }]}>
                  Caller Voice
                </Text>
              </View>
              <View style={styles.settingRowRight}>
                <Text style={[styles.settingItemValue, { color: T.textLight }]}>
                  {VOICE_OPTIONS[voiceIndex].label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={T.textLight}
                />
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.settingDivider,
                {
                  backgroundColor: isDark
                    ? T.id === "midnight"
                      ? "#1e293b"
                      : "#2a1f49"
                    : "#f3f4f6",
                },
              ]}
            />

            {/* Theme Row Header */}
            <TouchableOpacity
              style={styles.settingRowItem}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: T.secondary },
                  ]}
                >
                  <Ionicons
                    name="color-palette-outline"
                    size={17}
                    color={T.primary}
                  />
                </View>
                <Text style={[styles.settingItemLabel, { color: T.text }]}>
                  App Theme
                </Text>
              </View>
              <View style={styles.settingRowRight}>
                <View
                  style={[
                    styles.themeActiveTag,
                    {
                      backgroundColor: isDark
                        ? T.id === "midnight"
                          ? "#1e293b"
                          : "#2a124a"
                        : T.secondary,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themePillDot,
                      { backgroundColor: T.primary },
                    ]}
                  />
                  <Text
                    style={[styles.themeActiveTagName, { color: T.primary }]}
                  >
                    {T.name}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={T.textLight}
                />
              </View>
            </TouchableOpacity>

            {/* Quick-Select Theme Horizontal Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themePillsContainer}
            >
              {Object.values(THEMES).map((th) => {
                const isSelected = T.id === th.id;
                return (
                  <TouchableOpacity
                    key={th.id}
                    onPress={() => setTheme(th.id)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? T.id === "midnight"
                              ? "#1e293b"
                              : "#2a124a"
                            : T.secondary
                          : isDark
                            ? T.id === "midnight"
                              ? "#0b0f19"
                              : "#0a0518"
                            : "#f9f9fb",
                        borderColor: isSelected
                          ? th.primary
                          : isDark
                            ? T.id === "midnight"
                              ? "#222f44"
                              : "#2a1f49"
                            : "#e5e7eb",
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.themePillDot,
                        { backgroundColor: th.primary },
                      ]}
                    >
                      {th.isDark && (
                        <Ionicons name="moon" size={7} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.themePillName,
                        {
                          color: isSelected
                            ? isDark
                              ? "#fff"
                              : th.primaryDark
                            : T.text,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {th.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={th.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 30-MIN AD-FREE REWARDED CTA ── */}
          {!isPro && (
            <View style={styles.adFreeSection}>
              {adFreeUntil && adFreeUntil > Date.now() ? (
                <View
                  style={[
                    styles.adFreeActiveCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.15)"
                        : "#ecfdf5",
                      borderColor: isDark
                        ? "rgba(16, 185, 129, 0.35)"
                        : "#a7f3d0",
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={18} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.adFreeActiveTitle, { color: "#10b981" }]}
                    >
                      30-Min Ad-Free Active
                    </Text>
                    <Text
                      style={[
                        styles.adFreeActiveSub,
                        { color: isDark ? "#a7f3d0" : "#047857" },
                      ]}
                    >
                      Enjoying ad-free play until{" "}
                      {new Date(adFreeUntil).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ) : (
                <RewardedButton />
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Voice Selection Modal */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVoiceModalVisible(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: T.cardBg }]}>
            <Text style={[styles.modalTitle, { color: T.text }]}>
              Select Caller Voice
            </Text>
            {VOICE_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.modalItem,
                  voiceIndex === i && { backgroundColor: T.secondary },
                ]}
                onPress={() => {
                  setVoiceIndex(i);
                  setVoiceModalVisible(false);
                  AsyncStorage.setItem("@tambola_caller_voice", opt.id).catch(
                    () => {},
                  );
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: voiceIndex === i ? T.primary : T.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {voiceIndex === i && (
                  <Ionicons name="checkmark" size={18} color={T.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pro Modal */}
      <ProModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
      />

      {/* Join Party Modal */}
      <JoinPartyModal
        visible={joinPartyModalVisible}
        onClose={() => setJoinPartyModalVisible(false)}
      />

      {/* Theme Selection Modal */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  goProPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  goProPillText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  infoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  titleSection: {
    marginBottom: 16,
  },
  titleGreeting: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  titleMain: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  // Resume Card
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  resumeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resumeProgressCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resumeTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  resumeSub: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  resumeCtaText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // NEW GAME Card
  newGameCard: {
    borderRadius: 28,
    padding: 22,
    position: "relative",
    overflow: "hidden",
    marginBottom: 16,
  },
  watermark: {
    position: "absolute",
    right: 10,
    top: -10,
    fontSize: 130,
    fontWeight: "900",
    color: "rgba(0,0,0,0.06)",
    letterSpacing: -6,
  },
  newGameTag: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  modeTabsWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 16,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: "800",
  },
  modeTabInactiveText: {
    color: "rgba(255,255,255,0.85)",
  },
  modeDescription: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 14,
  },
  speedPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  speedPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  speedPillActive: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderColor: "#ffffff",
  },
  speedPillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  startGameBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  startGameBtnText: {
    fontSize: 16,
    fontWeight: "900",
  },

  // Party Grid
  partyGridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  partyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  partyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  partyCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  partyCardSub: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Preferences Card & Settings
  settingsCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  settingItemLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  settingRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingItemValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  themeActiveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  themeActiveTagName: {
    fontSize: 13,
    fontWeight: "800",
  },
  settingDivider: {
    height: 1,
    marginVertical: 10,
  },
  themePillsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 2,
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  themePillDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  themePillName: {
    fontSize: 13,
  },

  // 30m Ad-Free Section
  adFreeSection: {
    marginBottom: 20,
  },
  adFreeActiveCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  adFreeActiveTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  adFreeActiveSub: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Voice Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
