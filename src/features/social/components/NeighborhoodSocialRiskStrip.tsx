import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { NeighborhoodSocialRisk } from '../utils/socialUiModel';
import { RISK_LABELS } from '../utils/socialUiModel';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  neighborhoods: NeighborhoodSocialRisk[];
  onViewAll?: () => void;
};

const CARD_WIDTH = 120;

const RISK_PALETTE: Record<
  NeighborhoodSocialRisk['riskLevel'],
  { accent: string; muted: string; bgGrad: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  low: {
    accent: colors.primary,
    muted: colors.primaryMuted,
    bgGrad: '#E8F7F5',
    icon: 'shield-checkmark',
  },
  medium: {
    accent: colors.warning,
    muted: colors.warningMuted,
    bgGrad: '#FFF8EB',
    icon: 'alert-circle',
  },
  high: {
    accent: colors.danger,
    muted: colors.dangerMuted,
    bgGrad: '#FDEEED',
    icon: 'flame',
  },
  critical: {
    accent: colors.critical,
    muted: colors.criticalMuted,
    bgGrad: '#FCEAE8',
    icon: 'warning',
  },
};

function NeighborhoodIllustration({ riskLevel }: { riskLevel: NeighborhoodSocialRisk['riskLevel'] }) {
  const palette = RISK_PALETTE[riskLevel];

  return (
    <View style={[illustrationStyles.wrap, { backgroundColor: palette.muted }]}>
      <View style={[illustrationStyles.building1, { backgroundColor: palette.accent, opacity: 0.3 }]} />
      <View style={[illustrationStyles.building2, { backgroundColor: palette.accent, opacity: 0.2 }]} />
      <View style={[illustrationStyles.building3, { backgroundColor: palette.accent, opacity: 0.4 }]} />
      <Ionicons name={palette.icon} size={18} color={palette.accent} style={illustrationStyles.iconOverlay} />
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  wrap: {
    width: 56,
    height: 48,
    borderRadius: radius.md,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  building1: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    width: 12,
    height: 24,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  building2: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    width: 10,
    height: 32,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  building3: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    width: 14,
    height: 20,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  iconOverlay: {
    zIndex: 1,
  },
});

function NeighborhoodRiskCard({ item, index }: { item: NeighborhoodSocialRisk; index: number }) {
  const palette = RISK_PALETTE[item.riskLevel];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).duration(400)}
      style={[styles.riskCard, shadows.soft]}>
      <Text style={styles.riskName} numberOfLines={1}>
        {item.name}
      </Text>
      {item.identityTagline ? (
        <Text style={styles.identityTagline} numberOfLines={1}>
          {item.identityTagline}
        </Text>
      ) : null}

      {item.riskLevel === 'high' || item.riskLevel === 'critical' ? (
        <View style={[styles.badgeDot, { backgroundColor: palette.accent }]} />
      ) : null}

      <NeighborhoodIllustration riskLevel={item.riskLevel} />

      <Text style={[styles.riskScore, { color: palette.accent }]}>
        {item.score}
      </Text>

      <View style={[styles.riskPill, { backgroundColor: palette.muted }]}>
        <Text
          style={[styles.riskPillText, { color: palette.accent }]}
          numberOfLines={1}>
          {RISK_LABELS[item.riskLevel]}
        </Text>
      </View>
    </Animated.View>
  );
}

export function NeighborhoodSocialRiskStrip({
  neighborhoods,
  onViewAll,
}: Props) {
  const items = neighborhoods.length > 0 ? neighborhoods : [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="location" size={14} color={colors.warning} />
          <Text style={styles.sectionTitle}>Mahalle Riski</Text>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAllLink}>Tümünü Gör {'>'}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 10}
        contentContainerStyle={styles.scrollContent}>
        {items.map((n, i) => (
          <NeighborhoodRiskCard key={n.id} item={n} index={i} />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {items.map((n, i) => (
          <View
            key={n.id}
            style={[styles.dot, i === 0 && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.25,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 10,
    paddingRight: spacing.xl,
  },
  riskCard: {
    width: CARD_WIDTH,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 6,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  riskName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  identityTagline: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 2,
  },
  riskScore: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  riskPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4D2CD',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
