import { Stack } from 'expo-router';

import { colors } from '@/ui/theme/colors';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.hubCream },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="outcome-history" />
      <Stack.Screen name="mentions" />
    </Stack>
  );
}
