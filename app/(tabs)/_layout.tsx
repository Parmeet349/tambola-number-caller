import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '../../utils/store/themeState';

export default function TabLayout() {
  const { currentTheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: currentTheme.cardBg,
          borderTopColor: currentTheme.isDark ? (currentTheme.id === 'midnight' ? '#1e293b' : '#2a1f49') : '#f0f1f4',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "game-controller" : "game-controller-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "ticket" : "ticket-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
