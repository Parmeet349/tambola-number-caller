// components/JoinPartyModal.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { numberStyle } from "../utils/numberStyle";
import {
  connectToPartyRoom,
  PartyConnection,
  PartyMessage,
  WinClaimType,
} from "../utils/partySync";
import { useTheme } from "../utils/store/themeState";
import { checkWinClaim, generateTicket } from "../utils/ticketGenerator";
import NumberGrid from "./NumberGrid";

const { width } = Dimensions.get("window");
const cellWidth = Math.floor((width - 48) / 9);

interface JoinPartyModalProps {
  visible: boolean;
  onClose: () => void;
  initialRoomCode?: string;
}

export default function JoinPartyModal({
  visible,
  onClose,
  initialRoomCode = "",
}: JoinPartyModalProps) {
  const { currentTheme } = useTheme();

  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Live game state from host
  const [hostName, setHostName] = useState("Host");
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [calledSet, setCalledSet] = useState<Set<number>>(new Set());

  // Player's local ticket
  const [playerTicket, setPlayerTicket] = useState<number[][]>(() =>
    generateTicket(),
  );
  const [markedCells, setMarkedCells] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"ticket" | "board">("ticket");

  const [showConfetti, setShowConfetti] = useState(false);
  const connectionRef = useRef<PartyConnection | null>(null);
  const styleList = useRef((numberStyle() as any)[0]).current;

  useEffect(() => {
    (async () => {
      try {
        const savedPlayer = await AsyncStorage.getItem("@tambola_player_name");
        if (savedPlayer) setPlayerName(savedPlayer);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (initialRoomCode) setRoomCode(initialRoomCode);
  }, [initialRoomCode]);

  useEffect(() => {
    return () => {
      connectionRef.current?.disconnect();
      Speech.stop();
    };
  }, []);

  const handleConnect = () => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length < 3) {
      Alert.alert(
        "Room Code Required",
        "Please enter a valid room code from your host.",
      );
      return;
    }
    const cleanName = playerName.trim() || "Player";
    AsyncStorage.setItem("@tambola_player_name", cleanName).catch(() => {});

    setConnecting(true);

    const conn = connectToPartyRoom(
      cleanCode,
      (msg: PartyMessage) => {
        handleIncomingMessage(msg);
      },
      (status) => {
        if (status === "connected") {
          setConnecting(false);
          setIsConnected(true);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        } else if (status === "disconnected") {
          // Reconnecting in background
        }
      },
    );

    connectionRef.current = conn;
  };

  const handleIncomingMessage = (msg: PartyMessage) => {
    if (msg.type === "NUMBER_CALLED") {
      setCurrentNumber(msg.currentNumber);
      setHostName(msg.hostName || "Host");
      setCalledNumbers(msg.calledList || []);
      setCalledSet(new Set(msg.calledList || []));

      // Speak number
      try {
        const nick = styleList ? (styleList as any)[msg.currentNumber] : null;
        const speechText = nick
          ? `${nick}, ${msg.currentNumber}`
          : `${msg.currentNumber}`;
        Speech.stop();
        Speech.speak(speechText, { rate: 0.95 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    } else if (msg.type === "GAME_RESET") {
      setCurrentNumber(null);
      setCalledNumbers([]);
      setCalledSet(new Set());
      setMarkedCells(new Set());
      Alert.alert(
        "Game Reset",
        `${msg.hostName || "The host"} has started a new game.`,
      );
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Leave Party",
      "Are you sure you want to disconnect from this party?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            connectionRef.current?.disconnect();
            setIsConnected(false);
            setCurrentNumber(null);
            setCalledNumbers([]);
            setCalledSet(new Set());
          },
        },
      ],
    );
  };

  const toggleTicketCell = (rIdx: number, cIdx: number) => {
    const key = `${rIdx}-${cIdx}`;
    setMarkedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  };

  const handleClaim = (claimType: WinClaimType) => {
    const check = checkWinClaim(playerTicket, calledSet, claimType);
    if (!check.isValid) {
      Alert.alert(
        "Warning: Potential Bogey",
        `You have ${check.matchedCount} matching numbers for ${claimType}. You are still missing: ${check.missing.join(", ")}. Avoid a Bogey disqualification!`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Claim Anyway",
            style: "destructive",
            onPress: () => sendClaimToHost(claimType),
          },
        ],
      );
    } else {
      sendClaimToHost(claimType);
    }
  };

  const sendClaimToHost = async (claimType: WinClaimType) => {
    if (!connectionRef.current) return;
    const name = playerName.trim() || "Player";
    await connectionRef.current.sendClaim(claimType, name);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    Alert.alert(
      "Claim Sent",
      `Your claim for "${claimType}" was sent to ${hostName}'s screen!`,
    );
  };

  const handleRegenerateTicket = () => {
    Alert.alert("New Ticket", "Generate a new ticket for this party?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "New Ticket",
        onPress: () => {
          setPlayerTicket(generateTicket());
          setMarkedCells(new Set());
        },
      },
    ]);
  };

  const currentNick = currentNumber ? (styleList as any)[currentNumber] : null;

  const isDark = currentTheme.isDark;
  const darkBorder = currentTheme.id === "midnight" ? "#1e293b" : "#2a1f49";
  const darkInnerBg = currentTheme.id === "midnight" ? "#151d2c" : "#261c42";
  const darkInputBg = currentTheme.id === "midnight" ? "#1e293b" : "#261c42";
  const darkRowBorder = currentTheme.id === "midnight" ? "#334155" : "#3d2e6b";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: currentTheme.background }]}
      >
        {showConfetti && (
          <ConfettiCannon count={100} origin={{ x: width / 2, y: 0 }} fadeOut />
        )}

        {/* Top Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? darkBorder : "#f0f0f0" },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text
              style={[styles.closeBtnText, { color: currentTheme.primary }]}
            >
              Close
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
            {isConnected
              ? `Party #${roomCode.toUpperCase()}`
              : "Join Live Party"}
          </Text>
          {isConnected ? (
            <TouchableOpacity
              onPress={handleDisconnect}
              style={styles.leaveBtn}
            >
              <Text style={styles.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>

        {!isConnected ? (
          /* Join Setup View */
          <ScrollView
            contentContainerStyle={styles.joinContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.iconCircle, { backgroundColor: currentTheme.secondary }]}>
              <Ionicons name="people" size={42} color={currentTheme.primary} />
            </View>

            <Text style={[styles.joinTitle, { color: currentTheme.text }]}>
              Join Game Night
            </Text>
            <Text
              style={[styles.joinSubtitle, { color: currentTheme.textLight }]}
            >
              Enter the room code from the host's screen to play along and watch
              numbers appear live!
            </Text>

            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: currentTheme.cardBg,
                  borderColor: isDark ? darkBorder : "#eee",
                },
              ]}
            >
              <Text
                style={[styles.inputLabel, { color: currentTheme.textLight }]}
              >
                Room Code
              </Text>
              <TextInput
                style={[
                  styles.inputCode,
                  {
                    color: currentTheme.primary,
                    borderColor: currentTheme.primary,
                    backgroundColor: isDark ? darkInputBg : "#f8f9fa",
                  },
                ]}
                placeholder="e.g. 7492"
                placeholderTextColor="#999"
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: currentTheme.textLight, marginTop: 14 },
                ]}
              >
                Your Name
              </Text>
              <TextInput
                style={[
                  styles.inputName,
                  {
                    color: currentTheme.text,
                    borderColor: isDark ? darkRowBorder : "#eee",
                    backgroundColor: isDark ? darkInputBg : "#f8f9fa",
                  },
                ]}
                placeholder="e.g. Aman"
                placeholderTextColor="#999"
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={20}
              />

              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  { backgroundColor: currentTheme.primary },
                ]}
                onPress={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons name="enter-outline" size={20} color="#fff" />
                    <Text style={styles.joinBtnText}>Join Game</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="wifi" size={18} color="#4caf50" />
              <Text
                style={[styles.infoText, { color: currentTheme.textLight }]}
              >
                No account or sign-in needed — everyone in the room can play
                along on their own phone!
              </Text>
            </View>
          </ScrollView>
        ) : (
          /* Live Party Game Screen */
          <ScrollView
            contentContainerStyle={styles.liveContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Live Number Hero Display */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.isDark ? "#2a1f49" : "#eee",
                },
              ]}
            >
              <View style={styles.liveStatusRow}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveIndicatorText}>
                  PLAYING LIVE • HOST: {hostName.toUpperCase()}
                </Text>
              </View>

              <View
                style={[
                  styles.currentNumberCircle,
                  { backgroundColor: currentTheme.primary },
                ]}
              >
                {currentNumber !== null ? (
                  <Text style={styles.currentNumberText}>{currentNumber}</Text>
                ) : (
                  <Ionicons name="hourglass-outline" size={38} color="#fff" />
                )}
              </View>

              {currentNick && (
                <Text
                  style={[
                    styles.currentNumberNick,
                    { color: currentTheme.primaryDark },
                  ]}
                >
                  "{currentNick}"
                </Text>
              )}

              {/* Recent called numbers strip */}
              <View style={styles.recentStrip}>
                <Text
                  style={[
                    styles.recentLabel,
                    { color: currentTheme.textLight },
                  ]}
                >
                  Recent:
                </Text>
                {calledNumbers
                  .slice(-6, -1)
                  .reverse()
                  .map((num, i) => (
                    <View
                      key={i}
                      style={[
                        styles.recentChip,
                        { backgroundColor: currentTheme.secondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.recentChipText,
                          { color: currentTheme.primary },
                        ]}
                      >
                        {num}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Segmented Switch: My Ticket vs Full Board */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "ticket"
                    ? { backgroundColor: currentTheme.primary }
                    : { backgroundColor: isDark ? (currentTheme.id === "midnight" ? "#1e293b" : "#261c42") : "#eee" },
                ]}
                onPress={() => setActiveTab("ticket")}
              >
                <Ionicons
                  name="ticket-outline"
                  size={16}
                  color={
                    activeTab === "ticket" ? "#fff" : currentTheme.textLight
                  }
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "ticket"
                      ? { color: "#fff" }
                      : { color: isDark ? "#aaa" : "#555" },
                  ]}
                >
                  My Live Ticket
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "board"
                    ? { backgroundColor: currentTheme.primary }
                    : { backgroundColor: isDark ? (currentTheme.id === "midnight" ? "#1e293b" : "#261c42") : "#eee" },
                ]}
                onPress={() => setActiveTab("board")}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={
                    activeTab === "board" ? "#fff" : currentTheme.textLight
                  }
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "board"
                      ? { color: "#fff" }
                      : { color: isDark ? "#aaa" : "#555" },
                  ]}
                >
                  Full Board (1–90)
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "ticket" ? (
              /* Ticket View */
              <View
                style={[
                  styles.ticketContainer,
                  {
                    backgroundColor: currentTheme.cardBg,
                    borderColor: isDark ? darkBorder : "#eee",
                  },
                ]}
              >
                <View
                  style={[
                    styles.ticketHeader,
                    { backgroundColor: currentTheme.primary },
                  ]}
                >
                  <Text style={styles.ticketTitle}>Live Player Ticket</Text>
                  <TouchableOpacity
                    onPress={handleRegenerateTicket}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="refresh" size={13} color="#fff" />
                    <Text style={styles.regenText}>New</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.ticketGrid}>
                  {playerTicket.map((row, rIdx) => (
                    <View
                      key={rIdx}
                      style={[
                        styles.ticketRow,
                        {
                          borderColor: isDark ? darkBorder : "#eee",
                        },
                      ]}
                    >
                      {row.map((cell, cIdx) => {
                        const isMarked = markedCells.has(`${rIdx}-${cIdx}`);
                        const isCalledByHost = cell > 0 && calledSet.has(cell);
                        return (
                          <TouchableOpacity
                            key={cIdx}
                            style={[
                              styles.ticketCell,
                              {
                                borderColor: isDark
                                  ? darkBorder
                                  : "#eee",
                              },
                              cell === 0 && {
                                backgroundColor: isDark
                                  ? currentTheme.id === "midnight"
                                    ? "#0f172a"
                                    : "#110c22"
                                  : "#f5f5f5",
                              },
                              isCalledByHost &&
                                !isMarked && {
                                  backgroundColor: isDark
                                    ? "#3d3000"
                                    : "#fff9c4",
                                },
                              isMarked && {
                                backgroundColor: isDark
                                  ? "#144020"
                                  : "#a5d6a7",
                              },
                            ]}
                            onPress={() => {
                              if (cell > 0) toggleTicketCell(rIdx, cIdx);
                            }}
                            activeOpacity={cell > 0 ? 0.7 : 1}
                          >
                            <Text
                              style={[
                                styles.ticketCellText,
                                { color: currentTheme.text },
                                isCalledByHost &&
                                  !isMarked && {
                                    color: isDark
                                      ? "#ffd54f"
                                      : "#f57f17",
                                    fontWeight: "900",
                                  },
                                isMarked && {
                                  color: isDark
                                    ? "#86efac"
                                    : "#1b5e20",
                                  textDecorationLine: "line-through",
                                },
                              ]}
                            >
                              {cell > 0 ? cell : ""}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    paddingVertical: 6,
                  }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={currentTheme.textLight}
                  />
                  <Text
                    style={[
                      styles.ticketHint,
                      { color: currentTheme.textLight, paddingVertical: 0 },
                    ]}
                  >
                    Yellow = Called by Host • Tap to dab your number
                  </Text>
                </View>
              </View>
            ) : (
              /* Full Board View */
              <View
                style={[
                  styles.boardWrap,
                  {
                    backgroundColor: currentTheme.cardBg,
                    borderColor: isDark ? darkBorder : "#eee",
                  },
                ]}
              >
                <NumberGrid
                  calledNumbersSet={calledSet}
                  latestNumber={currentNumber}
                  onTilePress={() => {}}
                />
              </View>
            )}

            {/* Win Claim Section */}
            <View
              style={[
                styles.claimSection,
                {
                  backgroundColor: currentTheme.cardBg,
                  borderColor: isDark ? darkBorder : "#eee",
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <Ionicons
                  name="trophy-outline"
                  size={18}
                  color={currentTheme.primary}
                />
                <Text
                  style={[
                    styles.claimTitle,
                    { color: currentTheme.text, marginBottom: 0 },
                  ]}
                >
                  Claim Your Win
                </Text>
              </View>
              <Text
                style={[
                  styles.claimSubtitle,
                  { color: currentTheme.textLight },
                ]}
              >
                Completed a winning line or full house? Tap to notify the host!
              </Text>

              <View style={styles.claimGrid}>
                {(
                  [
                    "Early 5",
                    "Top Line",
                    "Middle Line",
                    "Bottom Line",
                    "Four Corners",
                    "Full House",
                  ] as WinClaimType[]
                ).map((type) => {
                  const check = checkWinClaim(playerTicket, calledSet, type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.claimBtn,
                        check.isValid
                          ? styles.claimBtnActive
                          : [
                              styles.claimBtnPending,
                              currentTheme.isDark && {
                                backgroundColor: "#221a3a",
                                borderColor: "#362a5b",
                              },
                            ],
                      ]}
                      onPress={() => handleClaim(type)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {check.isValid && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#fff"
                          />
                        )}
                        <Text
                          style={[
                            styles.claimBtnText,
                            check.isValid
                              ? { color: "#fff" }
                              : {
                                  color: currentTheme.isDark
                                    ? "#cbd5e1"
                                    : "#555",
                                },
                          ]}
                        >
                          {type}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 16, fontWeight: "700" },
  leaveBtn: { padding: 6 },
  leaveBtnText: { color: "#e53935", fontSize: 15, fontWeight: "700" },

  joinContainer: {
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff3e0",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  joinTitle: { fontSize: 24, fontWeight: "900", textAlign: "center" },
  joinSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  formCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputCode: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  inputName: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#fff",
  },
  joinBtn: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: { color: "#fff", fontSize: 17, fontWeight: "900" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },

  liveContainer: { padding: 16, alignItems: "center" },
  heroCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4caf50",
    letterSpacing: 0.5,
  },
  currentNumberCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  currentNumberText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
  },
  currentNumberNick: {
    fontSize: 15,
    fontWeight: "800",
    fontStyle: "italic",
    marginTop: 8,
  },
  recentStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  recentLabel: { fontSize: 12, fontWeight: "700" },
  recentChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentChipText: { fontSize: 13, fontWeight: "800" },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  tabButtonText: { fontSize: 13, fontWeight: "800", color: "#555" },

  ticketContainer: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ticketTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  regenText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  ticketGrid: { padding: 6 },
  ticketRow: { flexDirection: "row", borderBottomWidth: 1 },
  ticketCell: {
    width: cellWidth,
    height: cellWidth * 1.25,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
  },
  ticketCellText: { fontSize: 15, fontWeight: "800" },
  ticketHint: { fontSize: 11, textAlign: "center", paddingVertical: 6 },

  boardWrap: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },

  claimSection: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  claimTitle: { fontSize: 16, fontWeight: "900", marginBottom: 2 },
  claimSubtitle: { fontSize: 12, marginBottom: 12 },
  claimGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  claimBtn: {
    width: "48%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  claimBtnActive: {
    backgroundColor: "#2e7d32",
    borderWidth: 1,
    borderColor: "#1b5e20",
  },
  claimBtnPending: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  claimBtnText: {
    fontWeight: "800",
    fontSize: 13,
    color: "#555",
  },
});
