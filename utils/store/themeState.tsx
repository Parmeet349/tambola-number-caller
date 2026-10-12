import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  cardBg: string;
  text: string;
  textLight: string;
  accent: string;
  isDark?: boolean;
  description?: string;
}

export const THEMES: Record<string, Theme> = {
  classic: {
    id: 'classic',
    name: 'Classic Cherry',
    primary: '#c93b3b',
    primaryDark: '#a32b2b',
    secondary: '#fef2f2',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#c93b3b',
    description: 'Vibrant crimson & traditional board styling',
  },
  royal: {
    id: 'royal',
    name: 'Imperial Amethyst',
    primary: '#6957cc',
    primaryDark: '#5041a6',
    secondary: '#f5f3ff',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#8b5cf6',
    description: 'Regal deep violet with soft lavender cards',
  },
  ocean: {
    id: 'ocean',
    name: 'Teal Lagoon',
    primary: '#00828a',
    primaryDark: '#00656c',
    secondary: '#f0fdfa',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#06b6d4',
    description: 'Refreshing coastal teal & turquoise calm',
  },
  forest: {
    id: 'forest',
    name: 'Emerald Valley',
    primary: '#2e7d32',
    primaryDark: '#1e5922',
    secondary: '#f0fdf4',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#10b981',
    description: 'Crisp botanical greens & soft mint accents',
  },
  sunset: {
    id: 'sunset',
    name: 'Amber Glow',
    primary: '#d84315',
    primaryDark: '#a7320e',
    secondary: '#fff7ed',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#f97316',
    description: 'Warm campfire terracotta & autumn orange',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Berry Magenta',
    primary: '#e11d48',
    primaryDark: '#be123c',
    secondary: '#fff1f2',
    background: '#f9f9fb',
    cardBg: '#ffffff',
    text: '#111827',
    textLight: '#6b7280',
    accent: '#f43f5e',
    description: 'Punchy berry pink & electric rose accents',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Onyx',
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#1e293b',
    background: '#0b0f19',
    cardBg: '#151d2c',
    text: '#f8fafc',
    textLight: '#94a3b8',
    accent: '#38bdf8',
    isDark: true,
    description: 'Clean matte obsidian dark mode with electric blue',
  },
  synthwave: {
    id: 'synthwave',
    name: 'Neon Synthwave',
    primary: '#ec4899',
    primaryDark: '#be185d',
    secondary: '#2a124a',
    background: '#0a0518',
    cardBg: '#180e33',
    text: '#fdf4ff',
    textLight: '#c084fc',
    accent: '#06b6d4',
    isDark: true,
    description: 'Playful retro arcade void with hot neon glow',
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(THEMES.classic);

  useEffect(() => {
    (async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem('@tambola_theme');
        if (savedThemeId && THEMES[savedThemeId]) {
          setCurrentThemeState(THEMES[savedThemeId]);
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    })();
  }, []);

  const setTheme = async (id: string) => {
    if (THEMES[id]) {
      setCurrentThemeState(THEMES[id]);
      try {
        await AsyncStorage.setItem('@tambola_theme', id);
      } catch (e) {
        console.error('Error saving theme:', e);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
