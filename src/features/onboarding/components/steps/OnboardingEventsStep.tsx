import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  TUTORIAL_DECISION_OPTIONS,
  TUTORIAL_EVENT,
  WELCOME_FLOATING_METRICS,
} from '@/features/onboarding/content/onboardingContent';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const DECISION_TONES = {
  success: {
    bg: onboardingTheme.successMuted,
    border: onboardingTheme.success,
    icon: onboardingTheme.success,
  },
  info: {
    bg: '#EBF2FA',
    border: '#5B8FD4',
    icon: '#5B8FD4',
  },
  warning: {
    bg: onboardingTheme.warningMuted,
    border: onboardingTheme.warning,
    icon: onboardingTheme.warning,
  },
};

type OnboardingEventsStepProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
};

export function OnboardingEventsStep({
  selectedDecisionId,
  onSelectDecision,
}: OnboardingEventsStepProps) {
  const cornerMetrics = WELCOME_FLOATING_METRICS.slice(0, 4);

  return (
    <View style={styles.wrap}>
      <View style={styles.scene}>
        {cornerMetrics.map((m, i) => (
          <Animated.View
            key={m.id}
            entering={FadeInDown.delay(i * 50).springify()}
            style={[
              styles.cornerMetric,
              i === 0 && styles.posTL,
              i === 1 && styles.posTR,
              i === 2 && styles.posBL,
              i === 3 && styles.posBR,
            ]}>
            <Text style={styles.cornerLabel}>{m.label}</Text>
            <Text style={styles.cornerValue}>{m.value}</Text>
          </Animated.View>
        ))}

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={[styles.eventCard, shadows.card]}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTag}>
              <Ionicons name="megaphone" size={12} color={onboardingTheme.purple} />
              <Text style={styles.eventTagText}>OLAY KARTI</Text>
            </View>
            <Text style={styles.eventTime}>{TUTORIAL_EVENT.time}</Text>
          </View>

          <View style={styles.eventImage}>
            <Ionicons name="bus" size={40} color={onboardingTheme.success} />
          </View>

          <Text style={styles.eventTitle}>{TUTORIAL_EVENT.title}</Text>
          <Text style={styles.eventDesc}>{TUTORIAL_EVENT.description}</Text>

          <View style={styles.decisions}>
            {TUTORIAL_DECISION_OPTIONS.map((opt) => {
              const tone = DECISION_TONES[opt.tone];
              const selected = selectedDecisionId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onSelectDecision(opt.id)}
                  style={[
                    styles.decisionBtn,
                    { backgroundColor: tone.bg, borderColor: tone.border },
                    selected && styles.decisionSelected,
                  ]}>
                  <Ionicons name={opt.icon} size={18} color={tone.icon} />
                  <View style={styles.decisionText}>
                    <Text style={styles.decisionTitle}>{opt.title}</Text>
                    <Text style={styles.decisionDesc}>{opt.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>

      <Text style={styles.swipeHint}>
        ‹ Kartı kaydırarak diğer olaylara göz at ›
      </Text>

      <View style={styles.advisorRow}>
        <View style={styles.advisorAvatar}>
          <Text style={styles.advisorEmoji}>👷</Text>
        </View>
        <View style={styles.advisorBubble}>
          <Text style={styles.advisorName}>Saha Şefi</Text>
          <Text style={styles.advisorTip}>{TUTORIAL_EVENT.advisorTip}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  scene: {
    minHeight: 420,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerMetric: {
    position: 'absolute',
    backgroundColor: onboardingTheme.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.sm,
    width: 90,
    zIndex: 1,
  },
  posTL: { top: 0, left: 0 },
  posTR: { top: 0, right: 0 },
  posBL: { bottom: 40, left: 0 },
  posBR: { bottom: 40, right: 0 },
  cornerLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  cornerValue: {
    fontSize: 12,
    fontWeight: '800',
    color: onboardingTheme.navy,
  },
  eventCard: {
    width: '92%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.lg,
    gap: spacing.sm,
    zIndex: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: onboardingTheme.purpleMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  eventTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: onboardingTheme.purple,
    letterSpacing: 0.4,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  eventImage: {
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: onboardingTheme.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: onboardingTheme.navy,
  },
  eventDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTheme.textMuted,
  },
  decisions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  decisionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  decisionSelected: {
    borderWidth: 2.5,
    shadowColor: onboardingTheme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  decisionText: {
    flex: 1,
    gap: 2,
  },
  decisionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: onboardingTheme.navy,
  },
  decisionDesc: {
    fontSize: 11,
    color: onboardingTheme.textMuted,
    fontWeight: '500',
  },
  swipeHint: {
    fontSize: 11,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  advisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: onboardingTheme.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorEmoji: {
    fontSize: 22,
  },
  advisorBubble: {
    flex: 1,
    backgroundColor: onboardingTheme.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.md,
    gap: 4,
  },
  advisorName: {
    fontSize: 11,
    fontWeight: '800',
    color: onboardingTheme.primary,
  },
  advisorTip: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTheme.navy,
    fontWeight: '500',
  },
});
