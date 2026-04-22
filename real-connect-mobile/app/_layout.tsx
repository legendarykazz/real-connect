import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

// Make sure to add this inside the file:
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (loading) return;
    if (!navigationState?.key) return; // Wait for navigation to mount

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'forgot-password';

    if (!session && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to tabs if user is authenticated but trying to access login
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router, navigationState?.key]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthGuard>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="property/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(profile)/my-listings" options={{ headerShown: false }} />
            <Stack.Screen name="(profile)/account-settings" options={{ headerShown: false }} />
            <Stack.Screen name="(profile)/help" options={{ headerShown: false }} />
            <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
          </Stack>
        </AuthGuard>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
