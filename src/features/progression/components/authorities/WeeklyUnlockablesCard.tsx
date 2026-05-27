import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AUTHORITY_THEME } from '@/features/progression/components/authorities/theme';
import type { WeeklyUnlockItem } from '@/features/progression/utils/authoritiesScreenModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type WeeklyUnlockablesCardProps = {
  daysLeft: number;
  items: WeeklyUnlockItem[];
};

export function WeeklyUnlockablesSection({
  daysLeft,
  items,
}: WeeklyUnlockablesCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Bu hafta açılabilecekler</Text>
        </View>
        <Text style={styles.daysLeft}>{daysLeft} gün kaldı</Text>
      </View>

      <View style={[styles.card, shadows.card]}>
        {items.map((item, index) => {
          const palette = AUTHORITY_THEME[item.theme];
          const isLast = index === items.length - 1;
          return (
            <View
              key={item.id}
              style={[styles.miniCol, !isLast && styles.miniColBorder]}>
              <View
                style={[styles.miniIcon, { backgroundColor: palette.muted }]}>
                <Ionicons name={item.icon} size={20} color={palette.main} />
              </View>
              <Text style={styles.miniTitle}>{item.title}</Text>
              <Text style={styles.miniDesc}>{item.description}</Text>
              <View style={[styles.percentPill, { backgroundColor: palette.pillBg }]}>
                <Text style={[styles.percentText, { color: palette.pillText }]}>
                  {item.percentLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  miniCol: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
    alignItems: 'flex-start',
  },
  miniColBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  miniDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  percentPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
