import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  EVENT_RESULT_COPY,
  type EventResultDeltaTone,
  type EventResultImpactRowModel,
} from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  rows: EventResultImpactRowModel[];
};

const ROW_ICON_CIRCLE: Record<
  EventResultImpactRowModel['id'],
  { bg: string; color: string }
> = {
  public: { bg: '#DDF5EE', color: '#0F8F86' },
  team: { bg: '#DCEEFF', color: '#2477A8' },
  resource: { bg: '#FFF1C9', color: '#D59A14' },
};

function toneColor(tone: EventResultDeltaTone): string {
  switch (tone) {
    case 'positive':
      return colors.success;
    case 'negative':
      return colors.danger;
    default:
      return eventDetail.textMuted;
  }
}

function EventResultImpactRow({ row }: { row: EventResultImpactRowModel }) {
  const iconCircle = ROW_ICON_CIRCLE[row.id];
  const deltaColor = toneColor(row.deltaTone);
  const trendColor = toneColor(row.trendTone);

  return (
    <View style={[styles.row, shadows.soft]}>
      <View style={styles.leftBlock}>
        <View style={[styles.iconCircle, { backgroundColor: iconCircle.bg }]}>
          <Ionicons name={row.iconName} size={18} color={iconCircle.color} />
        </View>
        <View style={styles.leftCopy}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {row.title}
          </Text>
          <View style={styles.deltaRow}>
            <Text style={[styles.delta, { color: deltaColor }]} numberOfLines={1}>
              {row.deltaText}
            </Text>
            <Ionicons
              name={
                row.deltaTone === 'negative'
                  ? 'alert-circle'
                  : row.deltaTone === 'positive'
                    ? 'checkmark-circle'
                    : 'remove-circle-outline'
              }
              size={16}
              color={deltaColor}
            />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.description} numberOfLines={2}>
        {row.description}
      </Text>

      <View style={[styles.trendCircle, { backgroundColor: `${trendColor}18` }]}>
        <Ionicons
          name={
            row.trendTone === 'negative'
              ? 'trending-down-outline'
              : row.trendTone === 'positive'
                ? 'trending-up-outline'
                : 'remove-outline'
          }
          size={18}
          color={trendColor}
        />
      </View>
    </View>
  );
}

export function EventResultImpactMetricsRow({ rows }: Props) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {EVENT_RESULT_COPY.impactSectionTitle}
      </Text>
      <View style={styles.list}>
        {rows.map((row) => (
          <EventResultImpactRow key={row.id} row={row} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 18,
    gap: 10,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.3,
  },
  list: {
    gap: 9,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 10,
    minWidth: 0,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 124,
    flexShrink: 0,
    minWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
    flexShrink: 1,
    minWidth: 0,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  delta: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    flexShrink: 1,
    minWidth: 0,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 14,
  },
  description: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 20,
    minWidth: 0,
    flexShrink: 1,
  },
  trendCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
