import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedPressable } from '@/shared/motion';
import {
  centerLowerPalette,
  centerLowerPanelShadow,
} from '@/features/hub/utils/centerLowerDashboardTokens';

import { pushHubRoute } from './centerLowerDashboardShared';

export type CenterStatusCardProps = {
  title?: string;
  statusTitle: string;
  statusSubtitle: string;
  ctaLabel: string;
  route?: string;
  compact?: boolean;
  reducedMotion?: boolean;
  onPress?: () => void;
};

function ShieldRings({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.ringsWrap, compact && styles.ringsWrapCompact]}>
      <View style={[styles.ring, styles.ringOuter, compact && styles.ringOuterCompact]} />
      <View style={[styles.ring, styles.ringMiddle, compact && styles.ringMiddleCompact]} />
      <View style={[styles.ring, styles.ringInner, compact && styles.ringInnerCompact]} />
      <View style={[styles.core, compact && styles.coreCompact]}>
        <Ionicons name="shield-checkmark" size={compact ? 18 : 22} color={centerLowerPalette.tealPanel} />
      </View>
    </View>
  );
}

export function CenterStatusCard({
  title = 'MERKEZ DURUMU',
  statusTitle,
  statusSubtitle,
  ctaLabel,
  route = '/events',
  compact = false,
  reducedMotion,
  onPress,
}: CenterStatusCardProps) {
  const router = useRouter();
  const handlePress = onPress ?? (() => pushHubRoute(router, route));

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]} numberOfLines={1}>
        {title}
      </Text>
      <ShieldRings compact={compact} />
      <View style={styles.copy}>
        <Text
          style={[styles.statusTitle, compact && styles.statusTitleCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}>
          {statusTitle}
        </Text>
        <Text style={[styles.statusSubtitle, compact && styles.statusSubtitleCompact]} numberOfLines={2}>
          {statusSubtitle}
        </Text>
      </View>
      <CreviaAnimatedPressable
        onPress={handlePress}
        reducedMotion={reducedMotion}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        style={[styles.cta, compact && styles.ctaCompact]}>
        <Ionicons name="shield-outline" size={compact ? 10 : 12} color={centerLowerPalette.tealPanel} />
        <Text
          style={[styles.ctaText, compact && styles.ctaTextCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}>
          {ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={compact ? 9 : 11} color={centerLowerPalette.tealPanel} />
      </CreviaAnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 224,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.12)',
    backgroundColor: centerLowerPalette.cream,
    padding: 12,
    overflow: 'hidden',
    ...centerLowerPanelShadow,
  },
  cardCompact: {
    minHeight: 196,
    padding: 10,
    borderRadius: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: centerLowerPalette.tealPanel,
  },
  eyebrowCompact: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  ringsWrap: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ringsWrapCompact: {
    height: 78,
    marginTop: 4,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.12)',
  },
  ringOuter: {
    width: 94,
    height: 94,
  },
  ringOuterCompact: {
    width: 72,
    height: 72,
  },
  ringMiddle: {
    width: 70,
    height: 70,
    borderColor: 'rgba(7, 86, 79, 0.16)',
  },
  ringMiddleCompact: {
    width: 54,
    height: 54,
  },
  ringInner: {
    width: 46,
    height: 46,
    borderColor: 'rgba(63, 158, 106, 0.28)',
  },
  ringInnerCompact: {
    width: 36,
    height: 36,
  },
  core: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 158, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(63, 158, 106, 0.22)',
  },
  coreCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  copy: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statusTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: '#173D3A',
    textAlign: 'center',
  },
  statusTitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  statusSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: centerLowerPalette.mutedDark,
    textAlign: 'center',
  },
  statusSubtitleCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  cta: {
    minHeight: 32,
    borderRadius: 999,
    marginTop: 'auto',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 86, 79, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.12)',
  },
  ctaCompact: {
    minHeight: 28,
    paddingHorizontal: 7,
    gap: 3,
  },
  ctaText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
  },
  ctaTextCompact: {
    fontSize: 9,
  },
});
