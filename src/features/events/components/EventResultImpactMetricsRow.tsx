import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  EVENT_RESULT_COPY,
  type EventResultImpactMetric,
  type EventResultImpactTone,
} from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type Props = {
  metrics: EventResultImpactMetric[];
};

function tonePalette(tone: EventResultImpactTone) {
  switch (tone) {
    case 'positive':
      return { bg: colors.successMuted, text: colors.success };
    case 'warning':
      return { bg: colors.dangerMuted, text: colors.danger };
    case 'balanced':
      return { bg: colors.warningMuted, text: colors.warning };
    default:
      return { bg: colors.backgroundAlt, text: colors.textSecondary };
  }
}

export function EventResultImpactMetricsRow({ metrics }: Props) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {EVENT_RESULT_COPY.impactSectionTitle}
      </Text>
      <View style={styles.row}>
        {metrics.map((metric) => {
          const palette = tonePalette(metric.tone);
          return (
            <View
              key={metric.id}
              style={[styles.card, { backgroundColor: palette.bg }]}>
              <Text style={styles.label} numberOfLines={1}>
                {metric.label}
              </Text>
              <View style={styles.valueRow}>
                <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>
                  {metric.value}
                </Text>
                <Ionicons
                  name={
                    metric.tone === 'warning'
                      ? 'alert-circle-outline'
                      : metric.tone === 'positive'
                        ? 'checkmark-circle-outline'
                        : 'remove-outline'
                  }
                  size={13}
                  color={palette.text}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    maxWidth: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    paddingVertical: 9,
    paddingHorizontal: 8,
    gap: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
});
