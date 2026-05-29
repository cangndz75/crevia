import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { getPilotPreset } from '../data/mapSelectors';
import type { PilotAreaId } from '../types/map';

type Props = {
  gameDay: number;
  pilotAreaId: PilotAreaId;
  onGuidePress?: () => void;
};

export function MapOperationHeader({
  gameDay,
  pilotAreaId,
  onGuidePress,
}: Props) {
  const preset = getPilotPreset(pilotAreaId);

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
              size={18}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Ionicons name="calendar-outline" size={12} color={colors.primary} />
          <Text style={styles.chipText} numberOfLines={1}>
            Gün {gameDay}
          </Text>
        </View>
        <View style={[styles.chip, styles.areaChip]}>
          <View style={[styles.dot, { backgroundColor: preset.themeColor }]} />
          <Text style={styles.chipText} numberOfLines={1}>
            {preset.shortName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  guideBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '48%',
  },
  areaChip: {
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.22)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
});
