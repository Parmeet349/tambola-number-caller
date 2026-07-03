// app/(tabs)/index.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AboutScreen from '../../components/screens/AboutScreen';
import GameScreen from '../../components/screens/GameScreen';
import HistoryModalImported from '../../components/screens/HistoryModal';
import HomeScreen from '../../components/screens/HomeScreen';
import PrivacyScreen from '../../components/screens/PrivacyScreen';
import { useTheme } from '../../utils/store/themeState';

import { Text, View } from 'react-native';


export type RootStackParamList = {
  Home: undefined;
  Game: { initialMode?: 'manual' | 'auto'; initialSpeed?: 'slow' | 'medium' | 'fast'; initialMute?: boolean; hostName?: string };
  HistoryModal: { historySnapshot: number[] };
  About: undefined;
  Privacy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Helper: if import failed and value is falsy, return a placeholder component
function ensureComponent<T extends React.ComponentType<any> | undefined>(Comp: T, name: string): React.ComponentType<any> {
  if (Comp && typeof Comp === 'function') return Comp as React.ComponentType<any>;
  // fallback placeholder
  console.warn(`[Navigator] Screen component "${name}" is missing or not a valid component. Rendering placeholder.`);
  const Placeholder: React.FC = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>{name} is not available</Text>
      <Text>Please check the import path and ensure the screen exports a default React component.</Text>
    </View>
  );
  return Placeholder;
}

const HistoryModal = ensureComponent(HistoryModalImported as any, 'HistoryModal');
const Home = ensureComponent(HomeScreen as any, 'HomeScreen');
const Game = ensureComponent(GameScreen as any, 'GameScreen');
const About = ensureComponent(AboutScreen as any, 'AboutScreen');
const Privacy = ensureComponent(PrivacyScreen as any, 'PrivacyScreen');

// import { AdStateProvider } from '../../utils/store/adState';


export default function TabsIndex() {
  const { currentTheme } = useTheme();

  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.cardBg,
        },
        headerTintColor: currentTheme.primary,
        headerTitleStyle: {
          fontWeight: '800',
          color: currentTheme.text,
        },
      }}
    >
      <Stack.Screen name="Home" component={Home} options={{ title: 'Tambola — Home', headerShown: false }} />
      <Stack.Screen name="Game" component={Game} options={{ title: 'Tambola — Game', headerShown: false }} />
      <Stack.Screen name="About" component={About} options={{ title: 'Tambola — About', headerShown: false }} />
      <Stack.Screen name="Privacy" component={Privacy} options={{ title: 'Privacy Policy' }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="HistoryModal" component={HistoryModal} options={{ title: 'Called Numbers' }} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
