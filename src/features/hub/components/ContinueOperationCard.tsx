import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedPressable } from '@/shared/motion';
import type { ContinueOperationVariant } from '@/features/hub/utils/centerLowerDashboardPresentation';
import { centerLowerPalette } from '@/features/hub/utils/centerLowerDashboardTokens';

import { clampPercent, pushHubRoute } from './centerLowerDashboardShared';

export type ContinueOperationCardProps = {
  title: string;
  badge: string;
  location: string;
  progress: number;
  variant: ContinueOperationVariant;
  isLocked?: boolean;
  ctaLabel?: string;
  route?: string;
  reducedMotion?: boolean;
  onPress?: () => void;
};

export function ContinueOperationCard({
  title,
  badge,
  location,
  progress,
  variant,
  isLocked = false,
  route = '/events',
  reducedMotion,
  onPress,
}: ContinueOperationCardProps) {
  const router = useRouter();
  const isHard = variant === 'hard' || variant === 'locked' || isLocked;
  const value = clampPercent(progress);
  const handlePress = onPress ?? (() => pushHubRoute(router, route));

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      pressScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${location}. Yüzde ${value}.`}
      style={styles.operationPressable}>
      <LinearGradient
        colors={isHard ? [centerLowerPalette.plum, '#182848'] : [centerLowerPalette.tealPanel, '#2C7E64']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.operationCard}>
        <View style={isHard ? styles.operationMoon : styles.operationSun} />
        <View style={styles.skyline}>
          <View style={[styles.tower, styles.towerSmall]} />
          <View style={[styles.tower, styles.towerTall]} />
          <View style={[styles.tower, styles.towerMid]} />
        </View>
        <View style={styles.operationTopRow}>
          <View style={[styles.operationBadge, isHard ? styles.operationBadgeHard : undefined]}>
            <Text style={styles.operationBadgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
          <Ionicons
            name={isHard ? 'lock-closed' : 'chevron-forward'}
            size={15}
            color={centerLowerPalette.goldSoft}
          />
        </View>
        <View style={styles.operationCopy}>
          <Text style={styles.operationTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.operationLocation} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>%{value}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${value}%` },
                isHard ? styles.progressFillHard : undefined,
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </CreviaAnimatedPressable>
  );
}

const styles = StyleSheet.create({
  operationPressable: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
  },
  operationCard: {
    minHeight: 152,
    borderRadius: 22,
    padding: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: centerLowerPalette.borderGold,
  },
  operationSun: {
    position: 'absolute',
    right: 14,
    top: 17,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,227,175,0.24)',
  },
  operationMoon: {
    position: 'absolute',
    right: 14,
    top: 17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(215,200,255,0.22)',
  },
  skyline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 34,
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    opacity: 0.22,
  },
  tower: {
    width: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: centerLowerPalette.cream,
  },
  towerSmall: {
    height: 20,
  },
  towerTall: {
    height: 34,
  },
  towerMid: {
    height: 27,
  },
  operationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  operationBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(157,242,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.24)',
    maxWidth: 78,
  },
  operationBadgeHard: {
    backgroundColor: 'rgba(245,227,175,0.14)',
    borderColor: 'rgba(245,227,175,0.26)',
  },
  operationBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: centerLowerPalette.goldSoft,
  },
  operationCopy: {
    marginTop: 28,
    gap: 5,
    minWidth: 0,
  },
  operationTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: centerLowerPalette.textLight,
  },
  operationLocation: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: centerLowerPalette.mutedLight,
  },
  progressRow: {
    marginTop: 'auto',
    gap: 5,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '900',
    color: centerLowerPalette.goldSoft,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: centerLowerPalette.mint,
  },
  progressFillHard: {
    backgroundColor: '#D7C8FF',
  },
});
