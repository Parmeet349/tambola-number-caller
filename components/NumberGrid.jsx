// components/NumberGrid.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../utils/store/themeState';

const COLS = 10;
const PADDING = 16;
const GAP = 5;
const tileSize = Math.floor((Dimensions.get('window').width - PADDING * 2 - GAP * (COLS - 1)) / COLS);

export default function NumberGrid({ calledNumbersSet, latestNumber, onTilePress }) {
  const { currentTheme: T } = useTheme();
  const isDark = T.isDark;
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { backgroundColor: T.background }]}>
      {numbers.map((n) => {
        const isLatest = n === latestNumber;
        const isCalled = calledNumbersSet && calledNumbersSet.has(n);

        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.tile,
              {
                backgroundColor: isLatest
                  ? (isDark ? '#ffffff' : '#111827')
                  : isCalled
                  ? T.primary
                  : isDark
                  ? (T.id === 'midnight' ? '#162030' : '#1c1038')
                  : '#f2f4f7',
                borderColor: isLatest
                  ? (isDark ? '#ffffff' : '#111827')
                  : isCalled
                  ? T.primary
                  : isDark
                  ? (T.id === 'midnight' ? '#24324a' : '#2c1c4e')
                  : 'transparent',
              },
            ]}
            onPress={() => onTilePress && onTilePress(n)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tileText,
                {
                  color: isLatest
                    ? (isDark ? '#111827' : '#ffffff')
                    : isCalled
                    ? '#ffffff'
                    : isDark
                    ? '#9ca3af'
                    : '#4b5563',
                  fontWeight: isLatest || isCalled ? '900' : '600',
                },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    paddingVertical: 12,
    gap: GAP,
    justifyContent: 'center',
  },
  tile: {
    width: tileSize,
    height: tileSize,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tileText: {
    fontSize: 13,
  },
});
