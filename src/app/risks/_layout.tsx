import { Stack } from 'expo-router';

import { colors } from '@/ui/theme/colors';

export default function RisksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
