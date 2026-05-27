import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getDistrictMinimapImage } from '@/features/events/utils/eventAssets';
import type { DistrictContext } from '@/features/events/utils/eventsScreenModel';
import { getRiskLevelLabel } from '@/core/content/mockGameData';
import {
  getRiskLevelColor,
  getRiskLevelMuted,
} from '@/features/events/utils/eventPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictContextCardProps = {
  context: DistrictContext;
};

export function DistrictContextCard({ context }: DistrictContextCardProps) {
  const riskColor = getRiskLevelColor(context.riskLevel);
  const riskMuted = getRiskLevelMuted(context.riskLevel);
  const minimap = getDistrictMinimapImage(
    context.districtId,
    context.districtName,
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        pressed && styles.pressed,
      ]}
      onPress={() => {
        // TODO: mahalle detay route — context.districtId
      }}
      accessibilityRole="button">
      <View style={styles.mapCol}>
        <HubAssetImage
          source={minimap}
          containerStyle={styles.mapImage}
          style={styles.mapImageInner}
          contentFit="cover"
        />
        <View style={[styles.pin, { backgroundColor: riskColor }]}>
          <Ionicons name="location" size={9} color={colors.textInverse} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.district} numberOfLines={1}>
          {context.districtName}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.riskBadge, { backgroundColor: riskMuted }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {getRiskLevelLabel(context.riskLevel)} Risk
            </Text>
          </View>
          <Text style={styles.activeCount}>
            {context.activeEventCount} aktif olay
          </Text>
        </View>
        <Text style={styles.focusLine} numberOfLines={1}>
          {context.riskFocusLine}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.96,
  },
  mapCol: {
    width: '35%',
    maxWidth: 88,
    minWidth: 72,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapImage: {
    flex: 1,
  },
  mapImageInner: {
    width: '100%',
    height: '100%',
  },
  pin: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  district: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  focusLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    fontStyle: 'italic',
  },
});
