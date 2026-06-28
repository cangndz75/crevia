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
  impactLine?: string;
  rewardLine?: string;
  progress: number;
  variant: ContinueOperationVariant;
  isLocked?: boolean;
  ctaLabel?: string;
  route?: string;
  featured?: boolean;
  reducedMotion?: boolean;
  onPress?: () => void;
};

export function ContinueOperationCard({
  title,
  badge,
  location,
  impactLine,
  rewardLine,
  progress,
  variant,
  isLocked = false,
  ctaLabel,
  route = '/events',
  featured = false,
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
      style={[styles.operationPressable, featured && styles.operationPressableFeatured]}>
      <LinearGradient
        colors={isHard ? ['#FFF8EC', '#F3EEF8'] : ['#FFFCF5', '#EAF7EF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.operationCard, featured && styles.operationCardFeatured]}>
        <View style={styles.routeMotif}>
          <View style={styles.routeMotifLine} />
          <View style={[styles.routeMotifPin, styles.routeMotifPinOne]} />
          <View style={[styles.routeMotifPin, styles.routeMotifPinTwo]}>
            <Ionicons name={isHard ? 'lock-closed' : 'flag'} size={12} color={centerLowerPalette.tealPanel} />
          </View>
        </View>
        <View style={styles.operationTopRow}>
          <View style={[styles.operationBadge, isHard ? styles.operationBadgeHard : undefined]}>
            <Text style={styles.operationBadgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
          <Ionicons
            name={isHard ? 'lock-closed-outline' : 'chevron-forward'}
            size={15}
            color={centerLowerPalette.tealPanel}
          />
        </View>
        <View style={styles.operationCopy}>
          <Text style={styles.operationTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.operationLocation} numberOfLines={1}>
            {location}
          </Text>
          {impactLine ? (
            <Text style={styles.operationImpact} numberOfLines={1}>
              {impactLine}
            </Text>
          ) : null}
          {rewardLine ? (
            <Text style={styles.operationReward} numberOfLines={1}>
              {rewardLine}
            </Text>
          ) : null}
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressText}>%{value}</Text>
            {ctaLabel ? (
              <Text style={styles.ctaHint} numberOfLines={1}>
                {ctaLabel}
              </Text>
            ) : null}
          </View>
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
  operationPressableFeatured: {
    flex: 0,
  },
  operationCard: {
    minHeight: 146,
    borderRadius: 22,
    padding: 13,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.14)',
  },
  operationCardFeatured: {
    minHeight: 166,
    padding: 14,
  },
  routeMotif: {
    position: 'absolute',
    right: 12,
    top: 42,
    width: 92,
    height: 70,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 86, 79, 0.07)',
    overflow: 'hidden',
  },
  routeMotifLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 36,
    height: 3,
    borderRadius: 999,
    backgroundColor: centerLowerPalette.tealPanel,
    transform: [{ rotate: '-18deg' }],
  },
  routeMotifPin: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeMotifPinOne: {
    left: 16,
    bottom: 20,
    backgroundColor: centerLowerPalette.mint,
  },
  routeMotifPinTwo: {
    right: 16,
    top: 16,
    backgroundColor: centerLowerPalette.goldSoft,
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
    backgroundColor: 'rgba(157,242,210,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.24)',
    maxWidth: 78,
  },
  operationBadgeHard: {
    backgroundColor: 'rgba(245,227,175,0.14)',
    borderColor: 'rgba(245,227,175,0.26)',
  },
  operationBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
  },
  operationCopy: {
    marginTop: 14,
    gap: 5,
    minWidth: 0,
    maxWidth: '72%',
  },
  operationTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: '#173D3A',
  },
  operationLocation: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: centerLowerPalette.mutedDark,
  },
  operationImpact: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
  },
  operationReward: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#9B741D',
  },
  progressRow: {
    marginTop: 'auto',
    gap: 5,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
  },
  ctaHint: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
    textAlign: 'right',
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(7,86,79,0.10)',
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
