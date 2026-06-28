import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayClosureHeroPresentation } from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const HERO_GRADIENT = ['#005952', '#0A7A6E', '#1A8F8A'] as const;

const BADGE_TONES = {
  positive: { bg: colors.hubGoldMuted, text: colors.hubGoldDark, icon: 'trending-up' as const },
  neutral: { bg: 'rgba(255,255,255,0.16)', text: colors.textInverse, icon: 'scale-outline' as const },
  warning: { bg: '#FFF1D6', text: '#B86E12', icon: 'alert-circle-outline' as const },
  mixed: { bg: '#E8F2FA', text: '#327EA8', icon: 'git-compare-outline' as const },
};

type Props = {
  model: EndOfDayClosureHeroPresentation;
  reducedMotion?: boolean;
};

function SuccessRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
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
      </View>
    </View>
  );
}

export function EndOfDayClosureHero({ model, reducedMotion }: Props) {
  const badgeStyle = BADGE_TONES[model.badgeTone];
  const entering = reducedMotion ? undefined : FadeInUp.delay(0).duration(280).springify().damping(24);

  return (
    <Animated.View entering={entering}>
      <LinearGradient colors={[...HERO_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, shadows.card]}>
        <View style={styles.sparkleA} pointerEvents="none" />
        <View style={styles.sparkleB} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>Gün {model.day}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: badgeStyle.bg }]}>
            <Ionicons name={badgeStyle.icon} size={12} color={badgeStyle.text} />
            <Text style={[styles.statusPillText, { color: badgeStyle.text }]} numberOfLines={1}>
              {model.statusBadge}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>
              {model.closingTitle}
            </Text>
            <Text style={styles.subtitle} numberOfLines={3}>
              {model.closingSummary}
            </Text>
          </View>
          {model.showScoreRing ? <SuccessRing score={model.successScore} /> : null}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 26, fontWeight: '800', color: colors.textInverse, letterSpacing: -0.5 },
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dayPillText: { fontSize: 11, fontWeight: '800', color: colors.textInverse },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    maxWidth: '62%',
    flexShrink: 1,
  },
  statusPillText: { fontSize: 11, fontWeight: '800', flexShrink: 1 },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 6 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
