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
  day: number;
  statusTitle: string;
  successScore: number;
  subtitle: string;
};

function SuccessRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
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
}: Props) {
  return (
    <LinearGradient
      colors={[...HERO_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}>
      <View style={styles.topRow}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText} numberOfLines={1}>
            Gün {day}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name="sparkles" size={12} color={colors.hubGoldDark} />
          <Text style={styles.statusPillText} numberOfLines={1}>
            {statusTitle}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            Gün Sonu Değerlendirmesi
          </Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
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
    flexShrink: 0,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
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
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
