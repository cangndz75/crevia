import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CENTER_SUPPORT_SECTION_MARGIN } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterRecommendedPlan,
  CenterRecommendedPlanStep,
  CenterRecommendedPlanTone,
} from '@/features/hub/utils/centerRecommendedPlanPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#FFFCF5',
  cardWarm: '#FFF4D7',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.12)',
  white: '#FFFFFF',
} as const;

const toneAccent: Record<CenterRecommendedPlanTone, { border: string; accent: string; pill: string }> = {
  calm: { border: palette.border, accent: palette.tealMid, pill: palette.tealSoft },
  positive: { border: 'rgba(62,158,106,0.28)', accent: palette.green, pill: 'rgba(62,158,106,0.12)' },
  warning: { border: 'rgba(199,137,37,0.32)', accent: palette.amber, pill: 'rgba(199,137,37,0.12)' },
  teaching: { border: 'rgba(216,167,46,0.32)', accent: palette.gold, pill: palette.goldSoft },
  neutral: { border: palette.border, accent: palette.tealMid, pill: palette.tealSoft },
};

type CenterRecommendedPlanCardProps = {
  plan: CenterRecommendedPlan;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'search-outline': 'search-outline',
    'map-outline': 'map-outline',
    'people-outline': 'people-outline',
    'journal-outline': 'journal-outline',
    'document-text-outline': 'document-text-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function stepStateStyle(state: CenterRecommendedPlanStep['state']) {
  switch (state) {
    case 'done':
      return { color: palette.green, opacity: 1, bg: 'rgba(62,158,106,0.12)' };
    case 'current':
      return { color: palette.teal, opacity: 1, bg: palette.goldSoft };
    case 'next':
      return { color: palette.tealMid, opacity: 0.88, bg: palette.tealSoft };
    default:
      return { color: palette.muted, opacity: 0.55, bg: 'rgba(7, 86, 79, 0.06)' };
  }
}

function PlanStepsFlow({ steps }: { steps: CenterRecommendedPlanStep[] }) {
  return (
    <View style={styles.stepsFlow}>
      {steps.map((step, index) => {
        const tone = stepStateStyle(step.state);
        return (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.stepRail}>
              <View style={[styles.stepIcon, { backgroundColor: tone.bg }]}>
                <Ionicons name={resolveIcon(step.iconKey)} size={13} color={tone.color} />
              </View>
              {index < steps.length - 1 ? <View style={styles.stepConnector} /> : null}
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepLabel, { color: tone.color, opacity: tone.opacity }]} numberOfLines={1}>
                {step.label}
              </Text>
              <Text style={styles.stepState} numberOfLines={1}>
                {step.state === 'done'
                  ? 'Tamamlandı'
                  : step.state === 'current'
                    ? 'Aktif adım'
                    : step.state === 'next'
                      ? 'Sıradaki'
                      : 'Kilitli'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function CenterRecommendedPlanCard({
  plan,
  visibility,
  reducedMotion = false,
}: CenterRecommendedPlanCardProps) {
  const router = useRouter();
  const isVisible = (visibility ?? plan.visibility) !== 'hidden';
  const tone = toneAccent[plan.tone] ?? toneAccent.neutral;
  const highlight = plan.motionHint?.shouldHighlight && !reducedMotion;

  if (!isVisible) return null;

  if (plan.visibility === 'locked' || plan.planType === 'locked') {
    return (
      <View style={styles.section} accessibilityLabel={plan.accessibilityLabel}>
        <Text style={styles.sectionEyebrow}>BUGÜNKÜ PLAN</Text>
        <View style={styles.lockedCard}>
          <Ionicons name="lock-closed-outline" size={15} color={palette.gold} />
          <Text style={styles.lockedText} numberOfLines={2}>
            {plan.lockedTeaser ?? plan.body}
          </Text>
        </View>
      </View>
    );
  }

  const handleCtaPress = () => {
    if (!plan.cta?.enabled || !plan.cta.route) return;
    playLightImpactHaptic();
    router.push(plan.cta.route as Href);
  };

  return (
    <View style={styles.section} accessibilityLabel={plan.accessibilityLabel}>
      <View
        style={[
          styles.card,
          { borderColor: tone.border },
          highlight ? styles.cardHighlight : undefined,
        ]}>
        <LinearGradient
          colors={[palette.card, palette.cardWarm]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.sectionEyebrow}>BUGÜNKÜ PLAN</Text>
              <Text style={styles.title} numberOfLines={1}>
                {plan.title}
              </Text>
            </View>
            {plan.insight ? (
              <View style={[styles.insightPill, { backgroundColor: tone.pill }]}>
                <Text style={[styles.insightLabel, { color: tone.accent }]} numberOfLines={1}>
                  {plan.insight.label}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.body} numberOfLines={2}>
            {plan.body}
          </Text>

          {plan.steps && plan.steps.length > 0 ? <PlanStepsFlow steps={plan.steps} /> : null}

          {plan.cta ? (
            <CreviaAnimatedPressable
              onPress={handleCtaPress}
              reducedMotion={reducedMotion}
              disabled={!plan.cta.enabled}
              accessibilityRole="button"
              accessibilityLabel={plan.cta.label}
              accessibilityState={{ disabled: !plan.cta.enabled }}
              style={[
                styles.ctaPill,
                { borderColor: tone.border, backgroundColor: tone.pill },
                !plan.cta.enabled ? styles.ctaPillDisabled : undefined,
              ]}>
              <Text
                style={[styles.ctaText, { color: plan.cta.enabled ? tone.accent : palette.muted }]}
                numberOfLines={1}>
                {plan.cta.label}
              </Text>
              {plan.cta.enabled ? <Ionicons name="chevron-forward" size={12} color={tone.accent} /> : null}
            </CreviaAnimatedPressable>
          ) : null}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: palette.card,
  },
  cardHighlight: {
    borderWidth: 1.5,
  },
  cardGradient: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.tealMid,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.teal,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#173D3A',
  },
  insightPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 116,
    flexShrink: 0,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  stepsFlow: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 9,
    minHeight: 38,
  },
  stepRail: {
    width: 26,
    alignItems: 'center',
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(7, 86, 79, 0.12)',
  },
  stepCopy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 9,
    gap: 1,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepState: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  ctaPillDisabled: {
    opacity: 0.75,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '900',
  },
  lockedCard: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
    fontWeight: '700',
  },
});
