import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { getMapPilotMetricImage } from '@/core/assets/creviaAssetPresentation';
import type { MapPilotDistrictMetric } from '@/features/map/presentation/mapScreenPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';

type Props = {
  metric: MapPilotDistrictMetric;
};

const TONE_COLORS = {
  teal: mapUi.teal,
  gold: mapUi.gold,
  red: '#B4534B',
  purple: '#7C6CB0',
} as const;

export function MapMetricTile({ metric }: Props) {
  const barColor = TONE_COLORS[metric.tone];
  const metricImage = getMapPilotMetricImage(metric.icon);

  return (
    <View style={styles.tile}>
      {metricImage ? (
        <CreviaAssetImage
          source={metricImage}
          containerStyle={styles.metricAsset}
          contentFit="contain"
        />
      ) : (
        <Ionicons name={metric.icon} size={14} color={barColor} />
      )}
      <Text style={styles.value} numberOfLines={1}>
        {metric.value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(Math.min(1, Math.max(0, metric.progress)) * 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricAsset: {
    width: 22,
    height: 22,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
