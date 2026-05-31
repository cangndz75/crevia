import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { colors } from '@/ui/theme/colors';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const HERO_GRADIENT = ['#005952', '#0A7A6E', '#1A8F8A'] as const;

type Props = {
  day: number;
  statusTitle: string;
  successScore: number;
  subtitle: string;
  hideScoreRing?: boolean;
};

function SuccessRing({ score, size = 92 }: { score: number; size?: number }) {
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.hubGold}
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
        <Text style={ringStyles.score}>{score}</Text>
        <Text style={ringStyles.label}>Skor</Text>
      </View>
    </View>
  );
}

export function EndOfDayReportHero({
  day,
  statusTitle,
  successScore,
  subtitle,
  hideScoreRing = false,
}: Props) {
  return (
    <LinearGradient
      colors={[...HERO_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}>
      <View style={styles.sparkleA} pointerEvents="none" />
      <View style={styles.sparkleB} pointerEvents="none" />
      <CreviaAssetImage
        source={creviaAssets.reports.endOfDay.analyticsSheet}
        containerStyle={styles.heroDecor}
        contentFit="contain"
      />

      <View style={styles.topRow}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText} numberOfLines={1}>
            Gün {day}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name="scale-outline" size={12} color={colors.hubGoldDark} />
          <Text style={styles.statusPillText} numberOfLines={1}>
            {statusTitle}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.titleLine} numberOfLines={1}>
            Gün Sonu
          </Text>
          <Text style={styles.titleLine} numberOfLines={1}>
            Değerlendirmesi
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {hideScoreRing ? null : <SuccessRing score={successScore} />}
      </View>
    </LinearGradient>
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
  },
  score: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    marginTop: -2,
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
    minWidth: 0,
  },
  sparkleA: {
    position: 'absolute',
    top: 14,
    right: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(245,183,49,0.55)',
  },
  sparkleB: {
    position: 'absolute',
    bottom: 28,
    left: 18,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245,183,49,0.4)',
  },
  heroDecor: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    width: 72,
    height: 72,
    opacity: 0.22,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.hubGoldMuted,
    maxWidth: '58%',
    flexShrink: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
    flexShrink: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleLine: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    flexShrink: 1,
  },
});
