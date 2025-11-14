import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View, Animated } from 'react-native';
import { colors } from '../theme';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

// Screens
import HomeScreen from '../screens/HomeScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import MarketFlowScreen from '../screens/MarketFlowScreen';
import AddressesScreen from '../screens/AddressesScreen';

const Tab = createBottomTabNavigator();

// Icon Components
const WalletIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z"
      fill={color}
    />
  </Svg>
);

const NewsIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z"
      fill={color}
    />
  </Svg>
);

const HomeIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"
      fill={color}
    />
  </Svg>
);

const ChartIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92L20.59 5.51L13.5 13.48L9.5 9.48L2 16.99L3.5 18.49Z"
      fill={color}
    />
  </Svg>
);

const TargetIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        animation: 'shift',
      }}
    >
      <Tab.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{
          tabBarLabel: 'Addresses',
          tabBarIcon: ({ color, size }) => <WalletIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Updates"
        component={UpdatesScreen}
        options={{
          tabBarLabel: 'Updates',
          tabBarIcon: ({ color, size }) => <NewsIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MarketFlow"
        component={MarketFlowScreen}
        options={{
          tabBarLabel: 'Flow',
          tabBarIcon: ({ color, size }) => <ChartIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Recommendations"
        component={RecommendationsScreen}
        options={{
          tabBarLabel: 'Signals',
          tabBarIcon: ({ color, size }) => <TargetIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    // Reduced top padding and height by ~10% to better center icons/labels
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    height: Platform.OS === 'ios' ? 80 : 62,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 0,
  },
  tabBarIcon: {
    marginTop: 0,
    marginBottom: 0,
  },
});
