import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { getFilterDescription } from '../data/mapSelectors';
import type { MapFilterId, PilotAreaId } from '../types/map';

type Props = {
  selectedFilter: MapFilterId;
  pilotAreaId: PilotAreaId;
  onGuidePress?: () => void;
};

export function MapPageHeader({
  selectedFilter,
  pilotAreaId,
  onGuidePress,
}: Props) {
  const description = getFilterDescription(pilotAreaId, selectedFilter);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Harita</Text>
        <Pressable style={styles.guidePill} onPress={onGuidePress}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.primary}
          />
          <Text style={styles.guideText}>Harita Rehberi</Text>
        </Pressable>
      </View>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.responsibility}>
        7 günlük pilot süreçte yalnızca seçtiğin pilot bölgeden sorumlusun.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  guideText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  responsibility: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
});
