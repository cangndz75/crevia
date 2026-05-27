import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DaySummaryStat } from '@/features/events/utils/eventsScreenModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const CHIP_PALETTE: Record<
  DaySummaryStat['key'],
  { bg: string; text: string; icon: string; border: string }
> = {
  critical: {
    bg: colors.dangerMuted,
    text: colors.danger,
    icon: colors.danger,
    border: `${colors.danger}28`,
  },
  urgent: {
    bg: colors.warningMuted,
    text: colors.warning,
    icon: colors.warning,
    border: `${colors.warning}30`,
  },
  active: {
    bg: colors.hubGoldMuted,
    text: colors.hubGoldDark,
    icon: colors.hubGoldDark,
    border: `${colors.hubGold}35`,
  },
  resolved: {
    bg: colors.successMuted,
    text: colors.success,
    icon: colors.success,
    border: `${colors.success}30`,
  },
};

type EventSummaryChipsProps = {
  stats: DaySummaryStat[];
};

export function EventSummaryChips({ stats }: EventSummaryChipsProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => {
        const palette = CHIP_PALETTE[stat.key];
        return (
          <View
            key={stat.key}
            style={[
              styles.chip,
              shadows.soft,
              {
                backgroundColor: palette.bg,
                borderColor: palette.border,
              },
            ]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
              <Ionicons
                name={stat.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={palette.icon}
              />
            </View>
            <Text style={[styles.count, { color: palette.text }]}>
              {stat.count}
            </Text>
            <Text style={[styles.label, { color: palette.text }]}>
              {stat.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 15,
    borderWidth: 1,
    gap: 3,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
});
