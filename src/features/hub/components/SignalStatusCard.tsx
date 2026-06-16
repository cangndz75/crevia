import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CreviaAnimatedPressable } from '@/shared/motion';
import {
  centerLowerPalette,
  centerLowerPanelShadow,
} from '@/features/hub/utils/centerLowerDashboardTokens';

import { clampPercent, pushHubRoute } from './centerLowerDashboardShared';

export type SignalStatusCardProps = {
  title?: string;
  statusTitle: string;
  statusSubtitle: string;
  ctaLabel: string;
  signalStrength: number;
  authorityLine?: string;
  route?: string;
  reducedMotion?: boolean;
  onPress?: () => void;
};

function RadarRing({
  signalStrength,
  reducedMotion,
}: {
  signalStrength: number;
  reducedMotion?: boolean;
}) {
  const strength = clampPercent(signalStrength);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: reducedMotion ? 1 : 0.72 + (pulse.value - 1) * 2.4,
  }));

  return (
    <View style={styles.radarWrap}>
      <Animated.View style={[styles.radarRing, styles.radarRingOuter, outerRingStyle]} />
      <View style={[styles.radarRing, styles.radarRingMiddle]} />
      <View style={[styles.radarRing, styles.radarRingInner]} />
      <View style={[styles.signalDot, styles.signalDotOne]} />
      <View style={[styles.signalDot, styles.signalDotTwo]} />
      <View style={[styles.signalDot, styles.signalDotThree]} />
      <View
        style={[
          styles.radarCore,
          !reducedMotion && strength >= 70 ? styles.radarCoreActive : undefined,
        ]}>
        <Ionicons name="wifi" size={23} color={centerLowerPalette.goldSoft} />
      </View>
    </View>
  );
}

export function SignalStatusCard({
  title = 'SİNYAL DURUMU',
  statusTitle,
  statusSubtitle,
  ctaLabel,
  signalStrength,
  authorityLine,
  route = '/events',
  reducedMotion,
  onPress,
}: SignalStatusCardProps) {
  const router = useRouter();
  const handlePress = onPress ?? (() => pushHubRoute(router, route));

  return (
    <LinearGradient
      colors={[centerLowerPalette.tealPanel, centerLowerPalette.tealDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topCard}>
      <View style={styles.cardGlowMint} />
      <Text style={styles.cardEyebrow} numberOfLines={1}>
        {title}
      </Text>
      <RadarRing signalStrength={signalStrength} reducedMotion={reducedMotion} />
      <View style={styles.signalCopy}>
        <Text
          style={styles.signalTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}>
          {statusTitle}
        </Text>
        <Text style={styles.signalSubtitle} numberOfLines={1}>
          {statusSubtitle}
        </Text>
        {authorityLine ? (
          <Text style={styles.authorityLine} numberOfLines={1}>
            {authorityLine}
          </Text>
        ) : null}
      </View>
      <CreviaAnimatedPressable
        onPress={handlePress}
        reducedMotion={reducedMotion}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        style={styles.signalCta}>
        <Ionicons name="stats-chart" size={12} color={centerLowerPalette.goldSoft} />
        <Text
          style={styles.signalCtaText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}>
          {ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={11} color={centerLowerPalette.goldSoft} />
      </CreviaAnimatedPressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topCard: {
    minHeight: 224,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: centerLowerPalette.borderGold,
    padding: 12,
    overflow: 'hidden',
    ...centerLowerPanelShadow,
  },
  cardGlowMint: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: 'rgba(33,191,168,0.14)',
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: centerLowerPalette.goldSoft,
  },
  radarWrap: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.24)',
  },
  radarRingOuter: {
    width: 94,
    height: 94,
  },
  radarRingMiddle: {
    width: 70,
    height: 70,
  },
  radarRingInner: {
    width: 46,
    height: 46,
    borderColor: 'rgba(245,227,175,0.34)',
  },
  radarCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.36)',
  },
  radarCoreActive: {
    transform: [{ scale: 1.02 }],
  },
  signalDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: centerLowerPalette.mint,
  },
  signalDotOne: {
    top: 17,
    right: 39,
  },
  signalDotTwo: {
    left: 35,
    bottom: 26,
    backgroundColor: centerLowerPalette.goldSoft,
  },
  signalDotThree: {
    right: 29,
    bottom: 36,
  },
  signalCopy: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  signalTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: centerLowerPalette.textLight,
    textAlign: 'center',
  },
  signalSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: centerLowerPalette.mutedLight,
    textAlign: 'center',
  },
  authorityLine: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: 'rgba(157,242,210,0.78)',
    textAlign: 'center',
  },
  signalCta: {
    minHeight: 32,
    borderRadius: 999,
    marginTop: 'auto',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: centerLowerPalette.borderGold,
  },
  signalCtaText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.goldSoft,
  },
});
