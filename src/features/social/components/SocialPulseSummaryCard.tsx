import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { SocialPulseSummary } from '../utils/socialUiModel';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = { data: SocialPulseSummary };

function coerceSummary(data: SocialPulseSummary): SocialPulseSummary {
  const score =
    typeof data.score === 'number' && Number.isFinite(data.score)
      ? Math.round(Math.min(100, Math.max(0, data.score)))
      : 0;
  const maxScore =
    typeof data.maxScore === 'number' && Number.isFinite(data.maxScore)
      ? Math.max(1, Math.round(data.maxScore))
      : 100;
  const trendDelta =
    typeof data.trendDelta === 'number' && Number.isFinite(data.trendDelta)
      ? Math.round(data.trendDelta)
      : 0;
  const satisfactionPercent =
    typeof data.satisfactionPercent === 'number' &&
    Number.isFinite(data.satisfactionPercent)
      ? Math.round(Math.min(100, Math.max(0, data.satisfactionPercent)))
      : 0;
  const weeklyTrend = Array.isArray(data.weeklyTrend)
    ? data.weeklyTrend.map((v) =>
        typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : score,
      )
    : [score];

  return {
    ...data,
    score,
    maxScore,
    trendDelta,
    satisfactionPercent,
    weeklyTrend: weeklyTrend.length >= 2 ? weeklyTrend : [score, score],
    statusLabel: data.statusLabel || 'Dengede',
    description: data.description || 'Topluluğun nabzı istikrarlı.',
  };
}

function Sparkline({
  points,
  color,
  width,
}: {
  points: number[];
  color: string;
  width: number;
}) {
  if (points.length < 2) return null;
  const h = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => {
    const x = 6 + (i / (points.length - 1)) * (width - 12);
    const y = h - 6 - ((v - min) / range) * (h - 12);
    return { x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <Svg width={width} height={h}>
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {coords.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={3}
          fill={colors.surface}
          stroke={color}
          strokeWidth={1.8}
        />
      ))}
    </Svg>
  );
}

function ScoreGauge({
  score,
  maxScore,
  size,
}: {
  score: number;
  maxScore: number;
  size: number;
}) {
  const ringColor =
    score >= 70 ? colors.primary : score >= 50 ? colors.primary : colors.danger;
  const radiusOuter = size / 2;

  return (
    <View style={styles.gaugeOuter}>
      <View
        style={[
          styles.gaugeRing,
          {
            width: size,
            height: size,
            borderRadius: radiusOuter,
            borderColor: ringColor,
          },
        ]}>
        <View style={styles.gaugeInner}>
          <Text style={styles.gaugeScore}>{score}</Text>
          <Text style={styles.gaugeMax}>/{maxScore}</Text>
        </View>
      </View>
    </View>
  );
}

export function SocialPulseSummaryCard({ data }: Props) {
  const safe = coerceSummary(data);
  const gaugeSize = 76;
  const sparkWidth = 90;

  const trendColor = safe.trendDelta > 0 ? '#E85D5D' : safe.trendDelta < 0 ? colors.danger : colors.textSecondary;
  const trendArrow = safe.trendDelta > 0 ? '↗' : safe.trendDelta < 0 ? '↘' : '';

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={[styles.cardWrap, shadows.card]}>
      <LinearGradient
        colors={['#FFFFFF', '#FAFFFE', '#F4FBFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.highlight} pointerEvents="none" />

        <View style={styles.row}>
          <ScoreGauge
            score={safe.score}
            maxScore={safe.maxScore}
            size={gaugeSize}
          />

          <View style={styles.centerCol}>
            <Text style={styles.kicker} numberOfLines={1}>
              GENEL SOSYAL NABIZ
            </Text>
            <Text style={styles.status} numberOfLines={1}>
              {safe.statusLabel}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {safe.description}
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Sparkline
              points={safe.weeklyTrend}
              color={colors.primary}
              width={sparkWidth}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.trendStat}>
            <Text style={[styles.trendValue, { color: trendColor }]}>
              +{safe.trendDelta} Trend {trendArrow}
            </Text>
          </View>
          <View style={styles.satisfactionStat}>
            <Text style={styles.satisfactionValue}>
              {safe.satisfactionPercent}% Memnun
            </Text>
            <Ionicons name="happy-outline" size={14} color={colors.success} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
  },
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
  },
  highlight: {
    position: 'absolute',
    top: -40,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryMuted,
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gaugeOuter: {
    flexShrink: 0,
  },
  gaugeRing: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  gaugeInner: {
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  gaugeMax: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: -2,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  status: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 4,
  },
  trendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  satisfactionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  satisfactionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
