import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const HERO_GRADIENT = ['#00665C', '#0A7A6E', '#1A8F8A'] as const;

type Props = {
  successScore: number;
  subtitle: string;
};

function SuccessRing({ score, size = 88 }: { score: number; size?: number }) {
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
          stroke="rgba(255,255,255,0.22)"
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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#7FD4A8"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * 0.35} ${circumference}`}
          strokeDashoffset={offset * 0.6}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          opacity={0.85}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={ringStyles.score}>{score}</Text>
        <Text style={ringStyles.label}>Başarı</Text>
      </View>
    </View>
  );
}

export function EndOfDayReportHero({ successScore, subtitle }: Props) {
  return (
    <LinearGradient
      colors={[...HERO_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}>
      <View style={styles.sparkles} pointerEvents="none">
        <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.35)" />
        <Ionicons
          name="star"
          size={12}
          color="rgba(255,255,255,0.25)"
          style={styles.sparkleSmall}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <View style={styles.badge}>
            <Ionicons name="shield" size={20} color={colors.hubGoldDark} />
          </View>
          <Text style={styles.title}>Gün Sonu Değerlendirmesi</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <SuccessRing score={successScore} />
      </View>
    </LinearGradient>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 28,
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
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  sparkles: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleSmall: {
    marginTop: -8,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
});
