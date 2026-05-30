import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapFilterChipModel } from '@/features/map/utils/mapUiPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  filter: MapFilterChipModel;
  onGuidePress?: () => void;
};

export function MapOperationHeader({ filter, onGuidePress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title} numberOfLines={1}>
            Operasyon Haritası
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Saha kontrol merkezi — pilot bölge operasyonlarını buradan izle.
          </Text>
        </View>
        {onGuidePress ? (
          <Pressable
            style={styles.guideBtn}
            onPress={onGuidePress}
            accessibilityLabel="Harita rehberi">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={mapUi.teal}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <View style={styles.dayChip}>
          <Ionicons name="calendar-outline" size={16} color={mapUi.teal} />
          <Text style={styles.dayChipText} numberOfLines={1}>
            {filter.dayLabel}
          </Text>
        </View>
        <View style={styles.areaChip}>
          <View style={[styles.dot, { backgroundColor: filter.districtAccentColor }]} />
          <Text style={styles.areaChipText} numberOfLines={1}>
            {filter.districtLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={mapUi.gold} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: mapUi.screenPadding,
    gap: 14,
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    color: mapUi.textDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: mapUi.textSecondary,
  },
  guideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: mapUi.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  areaChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 23,
    backgroundColor: mapUi.goldSoft,
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  areaChipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
