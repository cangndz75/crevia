import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const ACTIONS = [
  { id: 'team', label: 'Ekip Ata', icon: 'people-outline' as const },
  { id: 'route', label: 'Rota Planla', icon: 'map-outline' as const },
  { id: 'maint', label: 'Bakım', icon: 'construct-outline' as const },
  { id: 'announce', label: 'Duyuru', icon: 'megaphone-outline' as const },
];

export function HubQuickActions() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Hızlı Aksiyonlar</Text>
      <View style={styles.row}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.btn,
              shadows.soft,
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}>
            <View style={styles.iconCircle}>
              <Ionicons name={action.icon} size={22} color={colors.hubGoldDark} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 88,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
