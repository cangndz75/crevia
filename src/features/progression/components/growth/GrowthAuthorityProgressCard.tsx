import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { GrowthAuthorityProgressModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { hubAssets } from '@/features/hub/utils/hubAssets';

type GrowthAuthorityProgressCardProps = {
  model: GrowthAuthorityProgressModel;
  onCtaPress?: () => void;
};

function AuthorityRing({
  unlocked,
  total,
  size = 76,
}: {
  unlocked: number;
  total: number;
  size?: number;
}) {
  const strokeWidth = 6;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const ratio = total > 0 ? unlocked / total : 0;
  const offset = circumference * (1 - ratio);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={growth.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={growth.mint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={ringStyles.value}>
          {unlocked} / {total}
        </Text>
        <Text style={ringStyles.label}>Yetki Açıldı</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    color: growth.text,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: growth.textSoft,
    textAlign: 'center',
    marginTop: 2,
  },
});

export function GrowthAuthorityProgressCard({
  model,
  onCtaPress,
}: GrowthAuthorityProgressCardProps) {
  return (
    <View style={[styles.card, growth.shadow]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{model.title}</Text>
            <Ionicons name="information-circle-outline" size={16} color={growth.textMuted} />
          </View>
          <Text style={styles.subtitle}>{model.subtitle}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <AuthorityRing unlocked={model.unlockedCount} total={model.totalCount} />

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Toplam Etki</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{model.impactPercent}</Text>
              <Ionicons name="trending-up" size={14} color={growth.mint} />
            </View>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Sıradaki Yetki</Text>
            <Text style={styles.nextAuthority}>{model.nextAuthorityTitle}</Text>
          </View>
        </View>

        <LinearGradient
          colors={[growth.buildingFallbackTop, growth.buildingFallbackBottom]}
          style={styles.buildingFrame}>
          <Image
            source={hubAssets.day1Plan.heroBuilding}
            style={styles.building}
            contentFit="contain"
          />
        </LinearGradient>
      </View>

      <Pressable
        onPress={onCtaPress}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={model.ctaLabel}>
        <Ionicons name="git-network-outline" size={18} color={growth.gold} />
        <Text style={styles.ctaText}>{model.ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color={growth.textSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: growth.card,
    borderRadius: growth.radiusCard,
    borderWidth: 1,
    borderColor: growth.borderGold,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerCopy: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: growth.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    lineHeight: 18,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    minWidth: 0,
  },
  metrics: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  metric: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: growth.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: growth.text,
  },
  nextAuthority: {
    fontSize: 14,
    fontWeight: '800',
    color: growth.gold,
    lineHeight: 18,
  },
  buildingFrame: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: growth.border,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  building: {
    width: 68,
    height: 60,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: growth.minTouch,
    borderTopWidth: 1,
    borderTopColor: growth.border,
    backgroundColor: growth.cardSolid,
    paddingHorizontal: 16,
  },
  ctaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: growth.text,
  },
});
