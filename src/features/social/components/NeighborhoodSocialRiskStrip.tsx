import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { NeighborhoodSocialRisk } from '../utils/socialUiModel';
import { RISK_LABELS } from '../utils/socialUiModel';

type Props = {
  neighborhoods: NeighborhoodSocialRisk[];
  onViewAll?: () => void;
};

const RISK_COLORS: Record<
  NeighborhoodSocialRisk['riskLevel'],
  { bg: string; border: string; text: string; dot: string }
> = {
  high: {
    bg: colors.criticalMuted,
    border: colors.critical,
    text: colors.critical,
    dot: colors.critical,
  },
  medium: {
    bg: colors.warningMuted,
    border: colors.warning,
    text: colors.warning,
    dot: colors.warning,
  },
  low: {
    bg: colors.surface,
    border: colors.border,
    text: colors.success,
    dot: colors.success,
  },
};

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const h = 20;
  const w = 48;
  const step = w / (points.length - 1);

  return (
    <View style={{ width: w, height: h }}>
      {points.map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x - 1.5,
              top: y - 1.5,
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: color,
            }}
          />
        );
      })}
    </View>
  );
}

function NeighborhoodRiskCard({
  item,
}: {
  item: NeighborhoodSocialRisk;
}) {
  const palette = RISK_COLORS[item.riskLevel];
  const isHigh = item.riskLevel === 'high';

  return (
    <View
      style={[
        styles.riskCard,
        shadows.soft,
        {
          backgroundColor: isHigh ? palette.bg : colors.surface,
          borderColor: isHigh ? palette.border : colors.border,
        },
      ]}>
      <View style={styles.riskCardHeader}>
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
        <Text style={styles.riskName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.riskBadge}>
        <Text style={[styles.riskBadgeText, { color: palette.text }]}>
          {RISK_LABELS[item.riskLevel]}
        </Text>
      </View>
      <MiniSparkline points={item.trend} color={palette.text} />
      <Text style={[styles.riskScore, { color: palette.text }]}>
        {item.score}
      </Text>
    </View>
  );
}

export function NeighborhoodSocialRiskStrip({
  neighborhoods,
  onViewAll,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mahalle Bazlı Sosyal Risk</Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAllLink}>Tüm Mahalleleri Gör &gt;</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {neighborhoods.map((n) => (
          <NeighborhoodRiskCard key={n.id} item={n} />
        ))}
      </ScrollView>
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
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  riskCard: {
    width: 118,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    alignItems: 'center',
  },
  riskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  riskBadge: {
    alignSelf: 'stretch',
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  riskScore: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
