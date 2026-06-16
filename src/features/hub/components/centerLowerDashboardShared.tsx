import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { centerLowerPalette } from '@/features/hub/utils/centerLowerDashboardTokens';

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function pushHubRoute(router: ReturnType<typeof useRouter>, route: string) {
  playLightImpactHaptic();
  router.push(route as Href);
}

export function CenterLowerSectionHeader({
  title,
  actionLabel,
  onActionPress,
  reducedMotion,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  reducedMotion?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel ? (
        <CreviaAnimatedPressable
          onPress={onActionPress}
          reducedMotion={reducedMotion}
          pressScale={0.96}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.sectionHeaderAction}>
          <Text style={styles.sectionHeaderActionText} numberOfLines={1}>
            {actionLabel}
          </Text>
        </CreviaAnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: centerLowerPalette.tealDeep,
  },
  sectionHeaderAction: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sectionHeaderActionText: {
    fontSize: 11,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
  },
});
