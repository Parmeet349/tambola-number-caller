import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../utils/store/themeState";

// Keep the native splash up until our first frame is laid out.
SplashScreen.preventAutoHideAsync().catch(() => {});

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLS = 10;
const GAP = 4;
// Calculate cell size dynamically so it fits comfortably on any screen:
const CELL = Math.min(34, Math.floor((SCREEN_WIDTH - 36 - (COLS - 1) * GAP) / COLS));
const BALL = Math.min(168, Math.floor(SCREEN_WIDTH * 0.44));
const EXIT_AT = 2400; // ms before we fade out

// Darken a #RRGGBB theme colour so white text on it stays readable.
function deepen(hex: string, amount = 0.18) {
  if (!hex || !hex.startsWith("#")) return "#111827";
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean,
    16
  );
  if (isNaN(n)) return "#111827";
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function GridCell({
  n,
  lit,
  delay,
}: {
  n: number;
  lit: boolean;
  delay: number;
}) {
  const o = useSharedValue(0.28);

  useEffect(() => {
    if (lit) {
      o.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(0.75, { duration: 500 }),
        ),
      );
    }
  }, [lit, delay, o]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[styles.cell, style]}>
      <Text style={styles.cellText}>{n}</Text>
    </Animated.View>
  );
}

type Props = {
  /** The player's current theme colour, e.g. '#c93b3b'. If omitted, active theme primary is used. */
  accent?: string;
  onFinish: () => void;
  /** Optional display font, e.g. your bold header family. */
  fontFamily?: string;
};

export default function AnimatedSplashScreen({
  accent,
  onFinish,
  fontFamily,
}: Props) {
  let themeAccent = accent;
  try {
    const { currentTheme } = useTheme();
    if (!themeAccent && currentTheme?.primary) {
      themeAccent = currentTheme.primary;
    }
  } catch (e) {}
  if (!themeAccent) themeAccent = "#c93b3b";

  const deep = useMemo(() => deepen(themeAccent!), [themeAccent]);
  const [shown, setShown] = useState(90);

  // 90 numbers; ~11 of them "get called" in a random order during the splash. 90 always lands last.
  const flashes = useMemo(() => {
    const pool = Array.from({ length: 89 }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    const map = new Map<number, number>();
    pool.forEach((n, i) => map.set(n, 250 + i * 140));
    map.set(90, 250 + 10 * 140);
    return map;
  }, []);

  const gridOpacity = useSharedValue(0);
  const drop = useSharedValue(-460);
  const ring = useSharedValue(0.6);
  const word = useSharedValue(0);
  const root = useSharedValue(1);

  const finish = () => onFinish();

  useEffect(() => {
    gridOpacity.value = withTiming(1, { duration: 450 });
    drop.value = withDelay(
      300,
      withSpring(0, { damping: 9, stiffness: 110, mass: 0.9 }),
    );
    ring.value = withDelay(900, withTiming(1, { duration: 500 }));
    word.value = withDelay(1500, withTiming(1, { duration: 450 }));

    // The ball "draws" random numbers, then settles on 90.
    let ticks = 0;
    const roll = setInterval(() => {
      ticks += 1;
      if (ticks >= 12) {
        clearInterval(roll);
        setShown(90);
      } else {
        setShown(1 + Math.floor(Math.random() * 89));
      }
    }, 80);

    let reduced = false;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      reduced = r;
    });
    const exit = setTimeout(() => {
      root.value = withTiming(0, { duration: reduced ? 100 : 300 }, (done) => {
        if (done) runOnJS(finish)();
      });
    }, EXIT_AT);

    return () => {
      clearInterval(roll);
      clearTimeout(exit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridStyle = useAnimatedStyle(() => ({ opacity: gridOpacity.value }));
  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value - 0.6,
    transform: [{ scale: 0.9 + ring.value * 0.1 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 14 }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: root.value }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: deep, zIndex: 99999, elevation: 999 },
        rootStyle,
      ]}
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      accessibilityLabel="Tambola"
    >
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={[styles.grid, gridStyle]}>
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
            <GridCell
              key={n}
              n={n}
              lit={flashes.has(n)}
              delay={flashes.get(n) ?? 0}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.ball, ballStyle]}>
          <Text style={[styles.ballText, { color: deep, fontFamily }]}>
            {shown}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.wordWrap, wordStyle]} pointerEvents="none">
        <Text style={[styles.word, { fontFamily }]}>Tambola</Text>
        <Text style={styles.tag}>HOUSIE · GAME NIGHT</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    width: COLS * CELL + (COLS - 1) * GAP,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: Math.max(6, Math.round(CELL * 0.24)),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  cellText: {
    color: "#FFFFFF",
    fontSize: Math.max(10, Math.round(CELL * 0.38)),
    fontWeight: "700",
  },
  ball: {
    position: "absolute",
    width: BALL,
    height: BALL,
    borderRadius: BALL / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  ballText: {
    fontSize: Math.round(BALL * 0.52),
    lineHeight: Math.round(BALL * 0.6),
    fontWeight: "800",
    includeFontPadding: false,
  },
  ring: {
    position: "absolute",
    width: BALL + 28,
    height: BALL + 28,
    borderRadius: (BALL + 28) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  wordWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "16%",
    alignItems: "center",
  },
  word: {
    color: "#FFFFFF",
    fontSize: 54,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tag: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.6,
    marginTop: 12,
  },
});
