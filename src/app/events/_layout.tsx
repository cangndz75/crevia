import { Stack } from 'expo-router';

import { colors } from '@/ui/theme/colors';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pilot-final-report" options={{ headerShown: false }} />
      <Stack.Screen
        name="main-operation-preview"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="decision-result" options={{ headerShown: false }} />
    </Stack>
  );
}
