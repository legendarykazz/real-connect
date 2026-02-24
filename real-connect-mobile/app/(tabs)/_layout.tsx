import { Tabs } from 'expo-router';
import React from 'react';
import { Home, PlusSquare, User } from 'lucide-react-native';
import Header from '../../components/Header';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981', // brand-green
        header: () => <Header />,
        tabBarStyle: {
          paddingBottom: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          headerTitle: 'RealConnect',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Post Land',
          headerTitle: 'List Your Property',
          tabBarIcon: ({ color, size }) => <PlusSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
