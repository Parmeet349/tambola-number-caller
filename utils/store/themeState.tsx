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
}

export const THEMES: Record<string, Theme> = {
  classic: {
    id: 'classic',
    name: 'Classic Cherry 🍒',
    primary: '#ef5350',
    primaryDark: '#c62828',
    secondary: '#ffebee',
    background: '#fcfcfc',
    cardBg: '#ffffff',
    text: '#111111',
    textLight: '#666666',
    accent: '#ef5350',
  },
  royal: {
    id: 'royal',
    name: 'Imperial Amethyst 👑',
    primary: '#7e57c2',
    primaryDark: '#4527a0',
    secondary: '#f3e5f5',
    background: '#f9f8fc',
    cardBg: '#ffffff',
    text: '#1c0d3a',
    textLight: '#756794',
    accent: '#ab47bc',
  },
  ocean: {
    id: 'ocean',
    name: 'Teal Lagoon 🏝️',
    primary: '#00838f',
    primaryDark: '#004d40',
    secondary: '#e0f7fa',
    background: '#f0fbfb',
    cardBg: '#ffffff',
    text: '#00252c',
    textLight: '#546e7a',
    accent: '#00b0ff',
  },
  forest: {
    id: 'forest',
    name: 'Emerald Valley 🌲',
    primary: '#2e7d32',
    primaryDark: '#1b5e20',
    secondary: '#e8f5e9',
    background: '#f4fbf4',
    cardBg: '#ffffff',
    text: '#0e2d10',
    textLight: '#556f57',
    accent: '#81c784',
  },
  sunset: {
    id: 'sunset',
    name: 'Amber Glow 🌅',
    primary: '#d84315',
    primaryDark: '#bf360c',
    secondary: '#fbe9e7',
    background: '#fffbfb',
    cardBg: '#ffffff',
    text: '#3e150a',
    textLight: '#8d6e63',
    accent: '#ffb74d',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk 🌌',
    primary: '#ff007f',
    primaryDark: '#99004c',
    secondary: '#1a102f',
    background: '#090514',
    cardBg: '#130d24',
    text: '#ffffff',
    textLight: '#9d8ebb',
    accent: '#00ffff',
    isDark: true,
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
