// app/(tabs)/explore.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../utils/store/themeState";
import { generateTicket } from "../../utils/ticketGenerator";

export interface GameHistoryEntry {
  id: string;
  date: number;
  durationSeconds: number;
  numbersCalled: number;
  mode: "manual" | "auto";
  speed: string;
}

const { width } = Dimensions.get("window");
// Card padding (16*2) + outer screen padding (20*2) + 8 gaps between 9 cells
const TICKET_CARD_PADDING = 14;
const GRID_GAP = 4;
const availableWidth = width - 40 - (TICKET_CARD_PADDING * 2) - (GRID_GAP * 8);
const cellWidth = Math.floor(availableWidth / 9);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0
  );
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;

  const [activeTab, setActiveTab] = useState<"tickets" | "history">("tickets");
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [tickets, setTickets] = useState<number[][][]>(() => [
    generateTicket(),
    generateTicket(),
    generateTicket(),
  ]);
  const [markedCells, setMarkedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const savedT = await AsyncStorage.getItem("@tambola_saved_tickets");
        if (savedT) {
          const parsed = JSON.parse(savedT);
          if (Array.isArray(parsed) && parsed.length > 0) setTickets(parsed);
        }
        const savedM = await AsyncStorage.getItem("@tambola_marked_cells");
        if (savedM) {
          const parsedM = JSON.parse(savedM);
          if (Array.isArray(parsedM)) setMarkedCells(new Set(parsedM));
        }
      } catch (e) {}
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, []),
  );

  const loadHistory = async () => {
    try {
      const h = await AsyncStorage.getItem("@tambola_history");
      if (h) setHistory(JSON.parse(h));
    } catch (e) {}
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Game History",
      "Are you sure you want to permanently clear all saved game records?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("@tambola_history");
              setHistory([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {}
          },
        },
      ],
    );
  };

  const handleAddTickets = (count: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    const newBatch = [];
    for (let i = 0; i < count; i++) {
      newBatch.push(generateTicket());
    }
    setTickets(newBatch);
    setMarkedCells(new Set());
    AsyncStorage.setItem("@tambola_saved_tickets", JSON.stringify(newBatch)).catch(() => {});
    AsyncStorage.removeItem("@tambola_marked_cells").catch(() => {});
  };

  const toggleCell = (ticketIdx: number, rIdx: number, cIdx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const key = `${ticketIdx}-${rIdx}-${cIdx}`;
    setMarkedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      AsyncStorage.setItem("@tambola_marked_cells", JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  const clearMarks = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setMarkedCells(new Set());
    AsyncStorage.removeItem("@tambola_marked_cells").catch(() => {});
  };

  const getTicketMarkedCount = (tIdx: number) => {
    let count = 0;
    const t = tickets[tIdx];
    if (!t) return 0;
    t.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell > 0 && markedCells.has(`${tIdx}-${rIdx}-${cIdx}`)) {
          count++;
        }
      });
    });
    return count;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " • " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const T = currentTheme;

  return (
    <View style={[styles.safe, { backgroundColor: T.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      {/* ── SCREEN TITLE ── */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.headerTitle, { color: T.text }]}>Tickets</Text>
      </View>

      {/* ── SEGMENTED CONTROL ── */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? (T.id === "midnight" ? "#0f172a" : "#120e24") : "#f3f4f6" }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "tickets" && [styles.tabActive, { backgroundColor: isDark ? T.cardBg : "#ffffff" }],
          ]}
          onPress={() => setActiveTab("tickets")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "tickets" ? T.text : "#6b7280" },
              activeTab === "tickets" && { fontWeight: "800" },
            ]}
          >
            Tickets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "history" && [styles.tabActive, { backgroundColor: isDark ? T.cardBg : "#ffffff" }],
          ]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "history" ? T.text : "#6b7280" },
              activeTab === "history" && { fontWeight: "800" },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── TICKETS CONTENT ── */}
      {activeTab === "tickets" ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ADD TICKETS & Clear marks Header */}
          <View style={styles.addTicketsHeader}>
            <Text style={[styles.addTicketsLabel, { color: T.textLight }]}>
              ADD TICKETS
            </Text>
            <TouchableOpacity onPress={clearMarks} activeOpacity={0.7}>
              <Text style={[styles.clearMarksText, { color: T.primary }]}>
                Clear marks
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Quantity Pills (+1, +2, +3, +4, +5, +6) */}
          <View style={styles.pillRow}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.pillBtn,
                  { backgroundColor: isDark ? T.secondary : T.secondary },
                ]}
                onPress={() => handleAddTickets(num)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillBtnText, { color: T.primary }]}>
                  +{num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Render Tickets */}
          {tickets.map((t, idx) => {
            const markedOnThisTicket = getTicketMarkedCount(idx);
            return (
              <View
                key={idx}
                style={[
                  styles.ticketCard,
                  {
                    backgroundColor: T.cardBg,
                    borderColor: isDark ? (T.id === "midnight" ? "#222f44" : "#2a1f49") : "#f0f1f4",
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.ticketCardHeader}>
                  <Text style={[styles.ticketCardTitle, { color: T.text }]}>
                    Ticket {idx + 1}
                  </Text>
                  <Text style={[styles.ticketMarkedCounter, { color: T.primary }]}>
                    {markedOnThisTicket} of 15 marked
                  </Text>
                </View>

                {/* 3x9 Grid with rounded rectangle cells */}
                <View style={styles.ticketGrid}>
                  {t.map((row, rIdx) => (
                    <View key={rIdx} style={styles.ticketRow}>
                      {row.map((cell, cIdx) => {
                        const isMarked = markedCells.has(`${idx}-${rIdx}-${cIdx}`);
                        const isBlank = cell === 0;

                        return (
                          <TouchableOpacity
                            key={cIdx}
                            style={[
                              styles.ticketCell,
                              {
                                backgroundColor: isBlank
                                  ? isDark
                                    ? (T.id === "midnight" ? "#0d131f" : "#0f0b1c")
                                    : "#f4f5f8"
                                  : isMarked
                                  ? T.primary
                                  : T.cardBg,
                                borderColor: isBlank
                                  ? "transparent"
                                  : isMarked
                                  ? T.primary
                                  : isDark
                                  ? (T.id === "midnight" ? "#222f44" : "#2a1f49")
                                  : "#e5e7eb",
                              },
                            ]}
                            onPress={() => {
                              if (!isBlank) toggleCell(idx, rIdx, cIdx);
                            }}
                            activeOpacity={isBlank ? 1 : 0.7}
                          >
                            {!isBlank && (
                              <Text
                                style={[
                                  styles.cellText,
                                  {
                                    color: isMarked
                                      ? "#ffffff"
                                      : T.text,
                                    fontWeight: isMarked ? "900" : "800",
                                  },
                                ]}
                              >
                                {cell}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ── HISTORY TAB ── */
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            history.length > 0 ? (
              <View style={styles.historyTopRow}>
                <Text style={[styles.historyCountLabel, { color: T.text }]}>
                  Past Games ({history.length})
                </Text>
                <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
                  <Text style={[styles.clearHistoryBtnText, { color: "#ef4444" }]}>
                    Clear history
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: T.cardBg, borderColor: isDark ? (T.id === "midnight" ? "#222f44" : "#2a1f49") : "#eee" }]}>
              <Ionicons name="game-controller-outline" size={38} color={T.textLight} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: T.text }]}>No Past Games</Text>
              <Text style={[styles.emptySub, { color: T.textLight }]}>
                Complete a session from the game screen to see your round records saved here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.historyCard,
                { backgroundColor: T.cardBg, borderColor: isDark ? (T.id === "midnight" ? "#222f44" : "#2a1f49") : "#f0f1f4" },
              ]}
            >
              <View style={styles.historyCardTop}>
                <Text style={[styles.historyDate, { color: T.text }]}>{formatDate(item.date)}</Text>
                <View style={[styles.historyModePill, { backgroundColor: item.mode === "manual" ? (isDark ? "#20163c" : "#ede9fe") : (isDark ? "#143a25" : "#d1fae5") }]}>
                  <Text style={[styles.historyModeText, { color: item.mode === "manual" ? "#7c3aed" : "#059669" }]}>
                    {item.mode === "manual" ? "Manual" : `Auto • ${item.speed}`}
                  </Text>
                </View>
              </View>
              <View style={styles.historyCardBottom}>
                <Text style={[styles.historyStat, { color: T.textLight }]}>
                  {item.numbersCalled}/90 numbers called
                </Text>
                <Text style={[styles.historyStat, { color: T.textLight }]}>
                  {formatTime(item.durationSeconds)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  // Segmented Control
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 4,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Add Tickets Row
  addTicketsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  addTicketsLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  clearMarksText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Pill Row
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBtnText: {
    fontSize: 15,
    fontWeight: "900",
  },

  // Ticket Card
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: TICKET_CARD_PADDING,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketCardTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  ticketMarkedCounter: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Grid
  ticketGrid: {
    gap: GRID_GAP,
  },
  ticketRow: {
    flexDirection: "row",
    gap: GRID_GAP,
    justifyContent: "center",
  },
  ticketCell: {
    width: cellWidth,
    height: cellWidth * 1.3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // History
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyCountLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  clearHistoryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  historyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "700",
  },
  historyModePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyModeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  historyCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyStat: {
    fontSize: 12,
    fontWeight: "600",
  },

  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
