import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DistrictReportCardMapPresentation } from '@/core/districtReportCard/districtReportCardTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  presentation: DistrictReportCardMapPresentation;
};

const STATUS_TONE = {
  bg: mapUi.mint,
  border: 'rgba(15, 143, 134, 0.18)',
  text: mapUi.tealDark,
} as const;

export function MapDistrictReportCard({ presentation }: Props) {
  if (presentation.visibleLineCount <= 0) return null;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={presentation.title}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {presentation.title}
        </Text>
        {presentation.statusChipLabel ? (
          <View style={[styles.chip, { backgroundColor: STATUS_TONE.bg, borderColor: STATUS_TONE.border }]}>
            <Text style={[styles.chipText, { color: STATUS_TONE.text }]} numberOfLines={1}>
              {presentation.statusChipLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {presentation.primaryLine ? (
        <Text style={styles.primaryLine} numberOfLines={2}>
          {presentation.primaryLine}
        </Text>
      ) : null}

      {presentation.recentEffectLine ? (
        <Text style={styles.secondaryLine} numberOfLines={2}>
          {presentation.recentEffectLine}
        </Text>
      ) : null}

      {presentation.eceLine ? (
        <View style={styles.eceRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={12} color={mapUi.teal} />
          <Text style={styles.eceLine} numberOfLines={2}>
            {presentation.eceLine}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '900',
    color: mapUi.tealDark,
  },
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '48%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  primaryLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: mapUi.textDark,
    flexShrink: 1,
    minWidth: 0,
  },
  secondaryLine: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: mapUi.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  eceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
  },
  eceLine: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: mapUi.teal,
    flexShrink: 1,
  },
});
