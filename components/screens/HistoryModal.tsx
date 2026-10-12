// components/screens/HistoryModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
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
import { useTheme } from "../../utils/store/themeState";

type Props = NativeStackScreenProps<RootStackParamList, "HistoryModal">;

const { width } = Dimensions.get("window");
const boardCellWidth = Math.floor((width - 48) / 10);

const HistoryModal: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0
  );
  const { currentTheme: T } = useTheme();
  const isDark = T.isDark;
  const { historySnapshot } = route.params ?? {
    historySnapshot: [] as number[],
  };

  const [viewMode, setViewMode] = useState<"order" | "board">("order");

  // Set of called numbers for O(1) lookup in Board view
  const calledSet = useMemo(() => new Set(historySnapshot), [historySnapshot]);

  // Map to get the call order for any number (1-based index)
  const callOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    historySnapshot.forEach((num, idx) => {
      // historySnapshot[0] is the latest called, historySnapshot[last] is the first
      map.set(num, historySnapshot.length - idx);
    });
    return map;
  }, [historySnapshot]);

  // All 90 numbers for board view
  const allNumbers = useMemo(
    () => Array.from({ length: 90 }, (_, i) => i + 1),
    [],
  );

  const percentComplete = Math.min(
    100,
    Math.round((historySnapshot.length / 90) * 100),
  );
  const latestNumber = historySnapshot.length > 0 ? historySnapshot[0] : null;

  return (
    <View style={[styles.safe, { backgroundColor: T.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      {/* Header with Done button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: T.cardBg,
            borderBottomColor: isDark ? (T.id === "midnight" ? "#1e293b" : "#2a1f49") : "#f0f0f0",
            paddingTop: topInset + 10,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="list" size={20} color={T.primary} />
          <Text style={[styles.title, { color: T.text }]}>Called Numbers</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.doneBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.doneBtnText, { color: T.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Progress & Summary Bar */}
      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: T.cardBg,
            borderBottomColor: isDark ? (T.id === "midnight" ? "#1e293b" : "#2a1f49") : "#f0f0f0",
          },
        ]}
      >
        <View style={styles.summaryInfoRow}>
          <Text style={[styles.summaryText, { color: T.text }]}>
            <Text style={{ fontWeight: "900", color: T.primary }}>
              {historySnapshot.length}
            </Text>{" "}
            of 90 Called
          </Text>
          {latestNumber !== null && (
            <View style={[styles.latestChip, { backgroundColor: T.secondary }]}>
              <Text style={[styles.latestChipLabel, { color: T.textLight }]}>
                Latest:{" "}
              </Text>
              <Text style={[styles.latestChipNum, { color: T.primary }]}>
                #{latestNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Progress track */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? (T.id === "midnight" ? "#1e293b" : "#1e1635") : "#eef0f5" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentComplete}%`,
                backgroundColor:
                  percentComplete === 100 ? "#10b981" : T.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Segmented Toggle: Calling Order vs Board View */}
      {historySnapshot.length > 0 && (
        <View
          style={[
            styles.segmentWrap,
            { backgroundColor: isDark ? (T.id === "midnight" ? "#111827" : "#120e24") : "#f4f4f7" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === "order" && {
                backgroundColor: T.cardBg,
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => setViewMode("order")}
            activeOpacity={0.8}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="time-outline"
                size={15}
                color={viewMode === "order" ? T.primary : T.textLight}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: viewMode === "order" ? T.text : T.textLight },
                ]}
              >
                Calling Sequence
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === "board" && {
                backgroundColor: T.cardBg,
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => setViewMode("board")}
            activeOpacity={0.8}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="grid-outline"
                size={15}
                color={viewMode === "board" ? T.primary : T.textLight}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: viewMode === "board" ? T.text : T.textLight },
                ]}
              >
                1–90 Board View
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {historySnapshot.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: isDark ? (T.id === "midnight" ? "#1e293b" : "#1e1635") : "#f0f2f7" },
            ]}
          >
            <Ionicons name="hourglass-outline" size={40} color={T.textLight} />
          </View>
          <Text style={[styles.emptyTitle, { color: T.text }]}>
            No Numbers Called Yet
          </Text>
          <Text style={[styles.emptySub, { color: T.textLight }]}>
            Numbers will appear in order here as they are drawn from the caller
            screen.
          </Text>
        </View>
      ) : viewMode === "order" ? (
        /* ── Calling Order View ── */
        <FlatList
          data={historySnapshot}
          keyExtractor={(item, idx) => `${item}-${idx}`}
          numColumns={5}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isLatest = index === 0;
            const orderNum = historySnapshot.length - index;

            return (
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: isLatest
                      ? T.primary
                      : isDark
                        ? T.id === "midnight"
                          ? "#151d2c"
                          : "#1b1433"
                        : T.secondary,
                    borderColor: isLatest
                      ? T.primaryDark
                      : isDark
                        ? T.id === "midnight"
                          ? "#222f44"
                          : "#2a1f49"
                        : "#e0e0e0",
                  },
                  isLatest && styles.latestCellGlow,
                ]}
              >
                {isLatest ? (
                  <View style={styles.latestTag}>
                    <Text style={styles.latestTagText}>LATEST</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.cellOrder,
                      { color: isDark ? (T.id === "midnight" ? "#94a3b8" : "#c084fc") : T.textLight },
                    ]}
                  >
                    #{orderNum}
                  </Text>
                )}
                <Text
                  style={[
                    styles.cellNum,
                    {
                      color: isLatest
                        ? "#fff"
                        : isDark
                          ? "#fff"
                          : T.primaryDark,
                    },
                  ]}
                >
                  {item}
                </Text>
              </View>
            );
          }}
        />
      ) : (
        /* ── 1-90 Board View ── */
        <ScrollView
          contentContainerStyle={styles.boardScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.boardHint}>
            <Text style={[styles.boardHintText, { color: T.textLight }]}>
              Highlighted tiles indicate numbers that have been called in this
              session:
            </Text>
          </View>

          <View
            style={[
              styles.boardCard,
              {
                backgroundColor: T.cardBg,
                borderColor: isDark ? (T.id === "midnight" ? "#222f44" : "#2a1f49") : "#eef0f5",
              },
            ]}
          >
            <View style={styles.boardGrid}>
              {allNumbers.map((num) => {
                const isCalled = calledSet.has(num);
                const isLatest = num === latestNumber;
                const order = callOrderMap.get(num);

                return (
                  <View
                    key={num}
                    style={[
                      styles.boardCell,
                      {
                        backgroundColor: isLatest
                          ? T.primary
                          : isCalled
                            ? T.secondary
                            : isDark
                              ? T.id === "midnight"
                                ? "#0f172a"
                                : "#100c1e"
                              : "#f9fafb",
                        borderColor: isLatest
                          ? T.primaryDark
                          : isCalled
                            ? T.primary
                            : isDark
                              ? T.id === "midnight"
                                ? "#1e293b"
                                : "#22183d"
                              : "#f0f2f5",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.boardCellText,
                        {
                          color: isLatest
                            ? "#fff"
                            : isCalled
                              ? isDark
                                ? "#fff"
                                : T.primaryDark
                              : isDark
                                ? T.id === "midnight"
                                  ? "#475569"
                                  : "#584b77"
                                : "#9ca3af",
                          fontWeight: isCalled ? "900" : "600",
                        },
                      ]}
                    >
                      {num}
                    </Text>
                    {isCalled && order && (
                      <Text
                        style={[
                          styles.boardCellOrder,
                          {
                            color: isLatest
                              ? "rgba(255,255,255,0.85)"
                              : T.textLight,
                          },
                        ]}
                      >
                        #{order}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default HistoryModal;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "900" },
  doneBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },

  summaryBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  latestChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  latestChipLabel: { fontSize: 11, fontWeight: "600" },
  latestChipNum: { fontSize: 12, fontWeight: "900" },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2.5,
  },

  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
  },

  gridContent: { padding: 16, paddingBottom: 40 },
  gridRow: { gap: 8, marginBottom: 8 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  latestCellGlow: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  latestTag: {
    position: "absolute",
    top: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  latestTagText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cellOrder: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  cellNum: { fontSize: 20, fontWeight: "900" },

  boardScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  boardHint: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  boardHintText: {
    fontSize: 12,
    lineHeight: 16,
  },
  boardCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
  },
  boardCell: {
    width: boardCellWidth,
    height: boardCellWidth * 1.25,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  boardCellText: {
    fontSize: 13,
  },
  boardCellOrder: {
    fontSize: 8,
    fontWeight: "700",
    marginTop: 1,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
