import { Stack } from 'expo-router';

import { GestureRootProvider } from '@/ui/providers/GestureRootProvider';
import { colors } from '@/ui/theme/colors';

export default function RisksLayout() {
  return (
    <GestureRootProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" />
      </Stack>
    </GestureRootProvider>
  );
}
