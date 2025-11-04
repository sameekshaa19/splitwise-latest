 import React, { useEffect } from 'react';
 import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from './_hooks/useFrameworkReady';
import { View } from 'react-native';
import { theme } from './styles/theme';
import { SupabaseService } from './services/SupabaseService';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    SupabaseService.initialize();

    SupabaseService.ensureUser('Demo User', 'demo@example.com').then(userId => {
      console.log('User initialized:', userId);
    }).catch(error => {
      console.error('Failed to initialize user:', error);
    });
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.primaryBg },
        }}
      >
        {/* Main tabs container */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Add Expense as modal, not a tab */}
        <Stack.Screen
          name="add-expense"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
