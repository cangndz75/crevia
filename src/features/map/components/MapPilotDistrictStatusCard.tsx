import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { MapPilotDistrictStatusModel } from '@/features/map/presentation/mapScreenPresentation';
import { MapMetricTile } from '@/features/map/components/MapMetricTile';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: MapPilotDistrictStatusModel;
  onSuggestionPress?: () => void;
  onMiniMapPress?: () => void;
};

export function MapPilotDistrictStatusCard({
  model,
  onSuggestionPress,
  onMiniMapPress,
}: Props) {
  const { width } = useWindowDimensions();
  const miniMapWidth = Math.min(Math.round(width * 0.36), 140);

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {model.subtitle}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.metricsCol}>
          <View style={styles.metricsRow}>
            {model.metrics.map((metric) => (
              <MapMetricTile key={metric.id} metric={metric} />
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.miniMapWrap, { width: miniMapWidth }]}
          onPress={onMiniMapPress}
          accessibilityLabel="Bölge haritasını genişlet">
          <Image source={model.miniMapAsset} style={styles.miniMap} resizeMode="cover" />
          <View style={styles.expandBadge}>
            <Ionicons name="expand-outline" size={12} color={mapUi.teal} />
          </View>
        </Pressable>
      </View>

      <Pressable style={styles.suggestionStrip} onPress={onSuggestionPress}>
        <Ionicons name="bulb-outline" size={16} color={mapUi.gold} />
        <Text style={styles.suggestionText} numberOfLines={1}>
          {model.suggestionLabel}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={mapUi.gold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.1)',
    padding: 14,
    gap: 12,
    minWidth: 0,
  },
  header: {
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    minWidth: 0,
  },
  metricsCol: {
    flex: 1,
    minWidth: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  miniMapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: mapUi.mint,
    flexShrink: 0,
    position: 'relative',
    minHeight: 96,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  expandBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: mapUi.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
});
