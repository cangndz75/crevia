import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import {
  WELCOME_CHARACTERS,
  WELCOME_FLOATING_METRICS,
  WELCOME_TAGS,
} from '@/features/onboarding/content/onboardingContent';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const POSITION: Record<string, object> = {
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
};

function FloatingMetricCard({
  metric,
  index,
}: {
  metric: (typeof WELCOME_FLOATING_METRICS)[0];
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 80).springify()}
      style={[styles.metricCard, POSITION[metric.position], shadows.soft]}>
      <View style={[styles.metricIcon, { backgroundColor: metric.muted }]}>
        <Ionicons name={metric.icon} size={14} color={metric.color} />
      </View>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text
        style={[
          styles.metricTrend,
          { color: metric.trendUp ? onboardingTheme.success : onboardingTheme.danger },
        ]}>
        {metric.trend}
      </Text>
    </Animated.View>
  );
}

export function OnboardingWelcomeStep() {
  return (
    <View style={styles.wrap}>
      <View style={styles.tagRow}>
        {WELCOME_TAGS.map((tag) => (
          <View key={tag.id} style={styles.tag}>
            <Ionicons name={tag.icon} size={14} color={onboardingTheme.textMuted} />
            <Text style={styles.tagText}>{tag.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cityWrap}>
        {WELCOME_FLOATING_METRICS.map((m, i) => (
          <FloatingMetricCard key={m.id} metric={m} index={i} />
        ))}
        <Svg width={300} height={180} viewBox="0 0 300 180">
          <Ellipse cx={150} cy={168} rx={130} ry={12} fill="#E0DFF0" opacity={0.6} />
          <Rect x={40} y={80} width={56} height={72} rx={6} fill="#B8D4E8" />
          <Rect x={48} y={64} width={40} height={20} rx={3} fill="#9BBDD6" />
          <Rect x={110} y={50} width={80} height={102} rx={8} fill="#E8EDF5" />
          <Rect x={122} y={38} width={56} height={16} rx={3} fill="#D0D8E8" />
          <Rect x={200} y={70} width={52} height={82} rx={6} fill="#C5E8E6" />
          <Circle cx={60} cy={130} r={16} fill="#3BAF7A" opacity={0.4} />
          <Circle cx={220} cy={120} r={12} fill="#7B5BB8" opacity={0.35} />
          <Path
            d="M10 165 Q80 140 150 155 T290 165"
            stroke={onboardingTheme.primary}
            strokeWidth={2}
            strokeDasharray="4 6"
            fill="none"
            opacity={0.35}
          />
        </Svg>
      </View>

      <View style={styles.characters}>
        {WELCOME_CHARACTERS.map((c, i) => (
          <Animated.View
            key={c.id}
            entering={FadeInDown.delay(400 + i * 60).springify()}
            style={styles.character}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{c.emoji}</Text>
            </View>
            <Text style={styles.characterLabel}>{c.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.lg,
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: onboardingTheme.glass,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  cityWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCard: {
    position: 'absolute',
    width: 108,
    backgroundColor: onboardingTheme.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.sm,
    zIndex: 2,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: onboardingTheme.navy,
  },
  metricTrend: {
    fontSize: 10,
    fontWeight: '700',
  },
  characters: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  character: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: onboardingTheme.primaryMuted,
    borderWidth: 2,
    borderColor: onboardingTheme.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  characterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: onboardingTheme.navy,
  },
});
