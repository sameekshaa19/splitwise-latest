 import React from 'react';
 import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from './_hooks/useFrameworkReady';
import { View } from 'react-native';
import { theme } from './styles/theme';

export default function RootLayout() {
  useFrameworkReady();

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
