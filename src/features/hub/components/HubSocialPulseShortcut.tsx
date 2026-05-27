import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubSocialPulseShortcut() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/social' as Href)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Sosyal Nabız, mahalle riskleri ve kriz yönetimi">
      <View style={styles.iconWrap}>
        <Ionicons
          name="pulse-outline"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>Sosyal Nabız</Text>
        <Text style={styles.hint}>Kriz, söylenti ve halk güveni</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  hint: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
