// components/NumberGrid.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../utils/store/themeState';

const cols = 10;
const tileSize = Math.floor((Dimensions.get('window').width - 20) / cols);

export default function NumberGrid({ calledNumbersSet, onTilePress }) {
  const { currentTheme } = useTheme();
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {numbers.map((n) => {
        const called = calledNumbersSet.has(n);
        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.tile,
              { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#e0e0e0' },
              called ? [styles.tileCalled, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }] : null
            ]}
            onPress={() => onTilePress && onTilePress(n)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tileText, 
              { color: currentTheme.text },
              called ? [styles.tileTextCalled, { color: currentTheme.primaryDark }] : null
            ]}>
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
    padding: 8,
    justifyContent: 'center',
  },
  tile: {
    width: tileSize,
    height: tileSize,
    margin: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  tileCalled: {
    backgroundColor: '#9fd6a5',
    borderColor: '#76b76a'
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  tileTextCalled: {
    color: '#033306'
  }
});
