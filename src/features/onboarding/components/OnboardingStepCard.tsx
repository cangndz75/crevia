import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OnboardingCityIllustration } from '@/features/onboarding/components/OnboardingCityIllustration';
import { OnboardingMissionCard } from '@/features/onboarding/components/OnboardingMissionCard';
import {
  ROLE_METRIC_CHIPS,
  SAMPLE_EVENT_CARD,
} from '@/features/onboarding/content/onboardingContent';
import type { OnboardingStep } from '@/features/onboarding/content/onboardingContent';
import { AdvisorPortrait } from '@/features/onboarding/components/AdvisorPortrait';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type OnboardingStepCardProps = {
  step: OnboardingStep;
};

const STEP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  welcome: 'sparkles',
  role: 'briefcase-outline',
  advisor: 'person-circle-outline',
  events: 'flash-outline',
};

export function OnboardingStepCard({ step }: OnboardingStepCardProps) {
  const icon = STEP_ICONS[step.id] ?? 'ellipse-outline';

  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.wrap}>
      {step.id !== 'welcome' ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.iconBadge}>
          <Ionicons name={icon} size={26} color={colors.primary} />
        </Animated.View>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{step.title}</Text>
        {step.titleAccent ? (
          <Text style={styles.titleAccent}>{step.titleAccent}</Text>
        ) : null}
      </View>

      <Text style={styles.body}>{step.body}</Text>

      {step.id === 'welcome' ? <OnboardingCityIllustration /> : null}

      {step.footnote ? (
        <OnboardingMissionCard
          lead={step.footnoteLead}
          body={step.footnote}
        />
      ) : null}

      {renderStepExtra(step.id)}
    </Animated.View>
  );
}

function renderStepExtra(stepId: string): ReactNode {
  switch (stepId) {
    case 'role':
      return (
        <View style={styles.chipRow}>
          {ROLE_METRIC_CHIPS.map((label, i) => (
            <Animated.View
              key={label}
              entering={FadeInDown.delay(i * 60).springify()}
              style={styles.metricChip}>
              <Text style={styles.metricChipText}>{label}</Text>
            </Animated.View>
          ))}
        </View>
      );
    case 'advisor':
      return (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <AdvisorPortrait size="lg" />
        </Animated.View>
      );
    case 'events':
      return (
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.eventCard, shadows.card]}>
          <View style={styles.eventTop}>
            <View style={styles.eventIcon}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </View>
            <View style={styles.eventText}>
              <Text style={styles.eventEyebrow}>ÖRNEK OLAY</Text>
              <Text style={styles.eventTitle}>{SAMPLE_EVENT_CARD.title}</Text>
              <Text style={styles.eventDistrict}>{SAMPLE_EVENT_CARD.district}</Text>
            </View>
            <View style={styles.eventVisual}>
              <Ionicons name="cube" size={28} color={colors.success} />
            </View>
          </View>
          <View style={styles.eventMeta}>
            <MetaPill icon="alert-circle" label="Risk" value={SAMPLE_EVENT_CARD.risk} tone="warning" />
            <MetaPill icon="eye" label="Görünürlük" value={SAMPLE_EVENT_CARD.visibility} tone="danger" />
          </View>
        </Animated.View>
      );
    default:
      return null;
  }
}

function MetaPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'warning' | 'danger' | 'purple';
}) {
  const toneColor =
    tone === 'warning'
      ? colors.warning
      : tone === 'danger'
        ? colors.danger
        : colors.purple;

  return (
    <View style={[styles.metaPill, { backgroundColor: `${toneColor}14` }]}>
      <Ionicons name={icon} size={14} color={toneColor} />
      <View>
        <Text style={[styles.metaValue, { color: toneColor }]}>{value}</Text>
        <Text style={styles.metaLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}33`,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2B3C',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  metricChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventText: {
    flex: 1,
    gap: 2,
  },
  eventEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.danger,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  eventDistrict: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  eventVisual: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.success}33`,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
