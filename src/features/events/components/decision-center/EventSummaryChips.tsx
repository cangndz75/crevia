import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import type { DaySummaryStat } from '@/features/events/utils/eventsScreenModel';
import { shadows } from '@/ui/theme/shadows';

const STAT_ICONS: Record<DaySummaryStat['key'], keyof typeof Ionicons.glyphMap> = {
  critical: 'shield',
  urgent: 'notifications',
  active: 'flash',
  resolved: 'checkmark-circle',
};

const STAT_PALETTE: Record<
  DaySummaryStat['key'],
  { bg: string; iconBg: string; icon: string; text: string }
> = {
  critical: {
    bg: eventsScreen.criticalMuted,
    iconBg: '#FFFFFF',
    icon: eventsScreen.critical,
    text: eventsScreen.critical,
  },
  urgent: {
    bg: eventsScreen.urgentMuted,
    iconBg: '#FFFFFF',
    icon: eventsScreen.urgent,
    text: eventsScreen.urgent,
  },
  active: {
    bg: eventsScreen.activeMuted,
    iconBg: '#FFFFFF',
    icon: eventsScreen.active,
    text: eventsScreen.amberDark,
  },
  resolved: {
    bg: eventsScreen.resolvedMuted,
    iconBg: '#FFFFFF',
    icon: eventsScreen.resolved,
    text: eventsScreen.resolved,
  },
};

type EventSummaryChipsProps = {
  stats: DaySummaryStat[];
};

export function EventSummaryChips({ stats }: EventSummaryChipsProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => {
        const palette = STAT_PALETTE[stat.key];
        const iconName = STAT_ICONS[stat.key];
        return (
          <View
            key={stat.key}
            style={[styles.card, shadows.soft, { backgroundColor: palette.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
              <Ionicons name={iconName} size={14} color={palette.icon} />
            </View>
            <Text style={[styles.count, { color: palette.text }]}>{stat.count}</Text>
            <Text style={[styles.label, { color: palette.text }]}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: eventsScreen.radiusMd,
    borderWidth: 1,
    borderColor: eventsScreen.border,
    gap: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
