// components/ThemeModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { THEMES, Theme, useTheme } from '../utils/store/themeState';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ visible, onClose }) => {
  const { currentTheme: T, setTheme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'light' | 'dark'>('all');

  const themeList = useMemo(() => {
    const all = Object.values(THEMES);
    if (filter === 'light') return all.filter((t) => !t.isDark);
    if (filter === 'dark') return all.filter((t) => t.isDark);
    return all;
  }, [filter]);

  const isDark = T.isDark;
  const darkBorder = T.id === 'midnight' ? '#1e293b' : '#2a1f49';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: T.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: T.cardBg,
              borderBottomColor: isDark ? darkBorder : '#f0f0f0',
            },
          ]}
        >
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIconWrap, { backgroundColor: T.secondary }]}>
              <Ionicons name="color-palette" size={18} color={T.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: T.text }]}>Color Themes</Text>
              <Text style={[styles.headerSub, { color: T.textLight }]}>
                Personalize your caller and tickets
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.doneBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.doneBtnText, { color: T.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View
          style={[
            styles.filterBar,
            { backgroundColor: isDark ? (T.id === 'midnight' ? '#111827' : '#120e24') : '#f3f4f6' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && [styles.filterTabActive, { backgroundColor: T.cardBg }],
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === 'all' ? T.primary : T.textLight },
                filter === 'all' && { fontWeight: '800' },
              ]}
            >
              All (8)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'light' && [styles.filterTabActive, { backgroundColor: T.cardBg }],
            ]}
            onPress={() => setFilter('light')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="sunny-outline"
                size={13}
                color={filter === 'light' ? T.primary : T.textLight}
              />
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === 'light' ? T.primary : T.textLight },
                  filter === 'light' && { fontWeight: '800' },
                ]}
              >
                Light (6)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'dark' && [styles.filterTabActive, { backgroundColor: T.cardBg }],
            ]}
            onPress={() => setFilter('dark')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="moon-outline"
                size={13}
                color={filter === 'dark' ? T.primary : T.textLight}
              />
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === 'dark' ? T.primary : T.textLight },
                  filter === 'dark' && { fontWeight: '800' },
                ]}
              >
                Dark (2)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Theme List */}
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {themeList.map((th: Theme) => {
            const isSelected = T.id === th.id;
            return (
              <TouchableOpacity
                key={th.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: th.cardBg,
                    borderColor: isSelected
                      ? th.primary
                      : isDark
                        ? (T.id === 'midnight' ? '#1e293b' : '#2a1f49')
                        : '#eef0f5',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setTheme(th.id)}
                activeOpacity={0.85}
              >
                {/* Visual Preview Box */}
                <View
                  style={[
                    styles.previewBox,
                    {
                      backgroundColor: th.background,
                      borderColor: th.isDark ? '#334155' : '#e5e7eb',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewNumberBadge,
                      { backgroundColor: th.primary },
                    ]}
                  >
                    <Text style={styles.previewNumberText}>42</Text>
                  </View>
                </View>

                {/* Info Section */}
                <View style={styles.cardInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: th.text }]}>
                      {th.name}
                    </Text>
                    {th.isDark ? (
                      <View style={[styles.typeBadge, { backgroundColor: th.secondary }]}>
                        <Ionicons name="moon" size={10} color={th.primary} />
                        <Text style={[styles.typeBadgeText, { color: th.primary }]}>
                          Dark
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.typeBadge, { backgroundColor: th.secondary }]}>
                        <Ionicons name="sunny" size={10} color={th.primary} />
                        <Text style={[styles.typeBadgeText, { color: th.primary }]}>
                          Light
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[styles.cardDesc, { color: th.textLight }]}
                    numberOfLines={2}
                  >
                    {th.description}
                  </Text>

                  {/* Palette dots */}
                  <View style={styles.paletteRow}>
                    <View
                      style={[styles.paletteDot, { backgroundColor: th.primary }]}
                    />
                    <View
                      style={[styles.paletteDot, { backgroundColor: th.accent || th.primaryDark }]}
                    />
                    <View
                      style={[
                        styles.paletteDot,
                        {
                          backgroundColor: th.background,
                          borderWidth: 1,
                          borderColor: th.isDark ? '#475569' : '#d1d5db',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Radio / Checkmark Icon */}
                <View style={styles.checkWrap}>
                  {isSelected ? (
                    <View
                      style={[styles.radioActive, { backgroundColor: th.primary }]}
                    >
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.radioInactive,
                        { borderColor: isDark ? '#4b5563' : '#d1d5db' },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  doneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },

  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  listContainer: {
    padding: 16,
    gap: 12,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  previewBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  previewNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paletteDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkWrap: {
    paddingLeft: 4,
  },
  radioActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
});
