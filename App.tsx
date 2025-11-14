/**
 * Mata - Bitcoin Price Monitor
 * Real-time BTC/USDT tracking with technical indicators
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import ChartScreen from './src/screens/ChartScreen';
import IndicatorDetailScreen from './src/screens/IndicatorDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';

export type RootStackParamList = {
  Main: undefined;
  Chart: { symbol?: string } | undefined;
  IndicatorDetail: { type: 'PRICE' | 'RSI' | 'ATR' | 'VOLUME' | 'FG'; symbol?: string };
  Settings: undefined;
};

export type TabParamList = {
  Addresses: undefined;
  Updates: undefined;
  Home: undefined;
  MarketFlow: undefined;
  Recommendations: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  // Optimize memory usage for navigation stacks
  enableScreens(true);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <Stack.Navigator
        id={undefined}
        initialRouteName="Main"
        screenOptions={{
          headerStyle: { backgroundColor: '#0B1220' },
          headerTintColor: '#F9FAFB',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0B1220' },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={BottomTabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="Chart"
          component={ChartScreen}
          options={({ route }) => ({
            title: (route?.params as any)?.symbol ?? 'Chart',
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen
          name="IndicatorDetail"
          component={IndicatorDetailScreen}
          options={({ route }) => ({
            title: (route.params as any)?.type || 'Indicator',
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
