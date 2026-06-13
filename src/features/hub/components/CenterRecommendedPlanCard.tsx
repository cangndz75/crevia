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
  cardWarm: '#FDF5E6',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.1)',
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
      return { color: palette.green, opacity: 1 };
    case 'current':
      return { color: palette.teal, opacity: 1 };
    case 'next':
      return { color: palette.muted, opacity: 0.9 };
    default:
      return { color: palette.muted, opacity: 0.55 };
  }
}

function PlanStepsRow({ steps }: { steps: CenterRecommendedPlanStep[] }) {
  return (
    <View style={styles.stepsRow}>
      {steps.map((step, index) => {
        const tone = stepStateStyle(step.state);
        return (
          <View key={step.id} style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: tone.color + '18' }]}>
              <Ionicons name={resolveIcon(step.iconKey)} size={12} color={tone.color} />
            </View>
            <Text style={[styles.stepLabel, { color: tone.color, opacity: tone.opacity }]} numberOfLines={1}>
              {step.label}
            </Text>
            {index < steps.length - 1 ? <View style={styles.stepConnector} /> : null}
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
        <Text style={styles.sectionEyebrow}>ÖNERİLEN PLAN</Text>
        <View style={styles.lockedCard}>
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
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionEyebrow}>{plan.title.toLocaleUpperCase('tr-TR')}</Text>
          {plan.subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {plan.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.card,
          { borderColor: tone.border },
          highlight ? styles.cardHighlight : undefined,
        ]}>
        <LinearGradient
          colors={[palette.cardWarm, palette.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}>
          <View style={[styles.accentRail, { backgroundColor: tone.accent }]} />
          <View style={styles.copy}>
            <Text style={styles.body} numberOfLines={2}>
              {plan.body}
            </Text>
            {plan.insight ? (
              <View style={[styles.insightPill, { backgroundColor: tone.pill }]}>
                <Text style={[styles.insightLabel, { color: tone.accent }]} numberOfLines={1}>
                  {plan.insight.label}
                </Text>
                <Text style={styles.insightText} numberOfLines={1}>
                  {plan.insight.text}
                </Text>
              </View>
            ) : null}
            {plan.steps && plan.steps.length > 0 ? <PlanStepsRow steps={plan.steps} /> : null}
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
                {plan.cta.enabled ? (
                  <Ionicons name="chevron-forward" size={12} color={tone.accent} />
                ) : null}
              </CreviaAnimatedPressable>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: palette.teal,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHighlight: {
    shadowColor: palette.teal,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardGradient: {
    flexDirection: 'row',
    minHeight: 88,
  },
  accentRail: {
    width: 4,
  },
  copy: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#173D3A',
  },
  insightPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 11,
    color: palette.muted,
    flexShrink: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 72,
  },
  stepConnector: {
    width: 10,
    height: 1,
    backgroundColor: 'rgba(7, 86, 79, 0.15)',
    marginHorizontal: 2,
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
    fontWeight: '600',
  },
  lockedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  lockedText: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.muted,
  },
});
