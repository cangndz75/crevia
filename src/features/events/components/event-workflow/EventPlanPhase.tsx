import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import { playLightImpactHaptic, playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import type { EventCard } from '@/core/models/EventCard';
import { PlanlaBriefingSection } from '@/features/events/components/event-workflow/plan/briefing/PlanlaBriefingSection';
import { ReadinessPriorityCard } from '@/features/events/components/readiness-priority/ReadinessPriorityCard';
import { PlanOptionsSection } from '@/features/events/components/event-workflow/plan/options/PlanOptionsSection';
import { PlanTuningSection } from '@/features/events/components/event-workflow/plan/tuning/PlanTuningSection';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventPlanPhasePresentation,
  type EventPlanActionKey,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import {
  buildEventPlanTuningPresentation,
  getTuningPresetForPlan,
  isTuningValuesEqual,
  type PlanTuningValues,
  type TuningControlKey,
  type TuningLevel,
  type TuningMode,
} from '@/features/events/utils/eventPlanTuningPresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  selectedStrategyId: EventPlanStrategyId;
  onSelectStrategy: (strategyId: EventPlanStrategyId) => void;
  onConfirmPlan: () => void;
  onBack?: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

export function EventPlanPhase({
  event,
  bottomPadding,
  selectedStrategyId,
  onSelectStrategy,
  onConfirmPlan,
  onBack,
  phaseHint = null,
  gameDay = 1,
  isDay1LearningEvent = false,
}: EventPlanPhaseProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);

  const [isTuningAccordionOpen, setIsTuningAccordionOpen] = useState(false);
  const [tuningMode, setTuningMode] = useState<TuningMode>('standard');
  const [tuningValues, setTuningValues] = useState<PlanTuningValues>(() =>
    getTuningPresetForPlan(selectedStrategyId),
  );

  const authorityGameplayContext = useMemo(
    () =>
      buildAuthorityGameplayPresentationContext({
        authorityState,
        day: gameDay,
        isDay1LearningEvent,
      }),
    [authorityState, gameDay, isDay1LearningEvent],
  );

  const presentation = useMemo(
    () =>
      buildEventPlanPhasePresentation({
        event,
        selectedStrategyId,
        day: gameDay,
        isDay1LearningEvent,
        authorityGameplayContext,
      }),
    [authorityGameplayContext, event, gameDay, isDay1LearningEvent, selectedStrategyId],
  );

  const tuningPresentation = useMemo(
    () =>
      buildEventPlanTuningPresentation({
        selectedStrategyId,
        tuningMode,
        tuningValues,
        isAccordionOpen: isTuningAccordionOpen,
      }),
    [isTuningAccordionOpen, selectedStrategyId, tuningMode, tuningValues],
  );

  const compact = width < 370;
  const scrollRef = useRef<ScrollView>(null);
  const strategySectionYRef = useRef(0);
  const tuningSectionYRef = useRef(0);

  useEffect(() => {
    setTuningMode('standard');
    setTuningValues(getTuningPresetForPlan(selectedStrategyId));
    setIsTuningAccordionOpen(false);
  }, [selectedStrategyId]);

  const scrollToStrategies = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, strategySectionYRef.current - 12),
      animated: !reducedMotion,
    });
  };

  const scrollToTuning = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, tuningSectionYRef.current - 12),
      animated: !reducedMotion,
    });
  };

  const handleConfirm = () => {
    if (!presentation.primaryCta.enabled) return;
    playLightImpactHaptic();
    onConfirmPlan();
  };

  const handleSecondaryAction = (actionKey: EventPlanActionKey) => {
    playLightImpactHaptic();
    if (actionKey === 'compare_risks') {
      scrollToTuning();
      return;
    }
    if (actionKey === 'view_resources') {
      return;
    }
  };

  const handleTuningValueChange = (key: TuningControlKey, value: TuningLevel) => {
    playSelectionHaptic();
    const next = { ...tuningValues, [key]: value };
    setTuningValues(next);
    const preset = getTuningPresetForPlan(selectedStrategyId);
    setTuningMode(isTuningValuesEqual(next, preset) ? 'standard' : 'custom');
  };

  const handleResetToStandard = () => {
    playLightImpactHaptic();
    setTuningMode('standard');
    setTuningValues(getTuningPresetForPlan(selectedStrategyId));
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(
              bottomPadding,
              108 + Math.max(insets.bottom, 12),
            ),
          },
        ]}>
        <PlanlaBriefingSection
          event={event}
          briefing={presentation.briefing}
          compact={compact}
          reducedMotion={reducedMotion}
          onBack={onBack}
          onRecommendedPlanPress={scrollToStrategies}
        />
        <View style={styles.readinessPriorityWrap}>
          <ReadinessPriorityCard
            presentation={presentation.readinessPriority}
            compact={compact}
            index={1}
            reducedMotion={reducedMotion}
          />
        </View>
        <View
          onLayout={(layoutEvent) => {
            strategySectionYRef.current = layoutEvent.nativeEvent.layout.y;
          }}>
          <PlanOptionsSection
            optionsPresentation={presentation.options}
            reducedMotion={reducedMotion}
            onSelectOption={(strategyId) => {
              playSelectionHaptic();
              onSelectStrategy(strategyId);
            }}
            onComparePress={() => handleSecondaryAction('compare_risks')}
          />
        </View>
        <View
          onLayout={(layoutEvent) => {
            tuningSectionYRef.current = layoutEvent.nativeEvent.layout.y;
          }}>
          {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}
          <PlanTuningSection
            tuningPresentation={tuningPresentation}
            isAccordionOpen={isTuningAccordionOpen}
            tuningValues={tuningValues}
            reducedMotion={reducedMotion}
            onToggleAccordion={() => setIsTuningAccordionOpen((open) => !open)}
            onResetToStandard={handleResetToStandard}
            onValueChange={handleTuningValueChange}
            onRefinePlan={handleConfirm}
          />
        </View>
      </ScrollView>

      <StickyPlanCtaBar
        label={tuningPresentation.refineCta.label}
        disabled={!presentation.primaryCta.enabled}
        onPress={handleConfirm}
      />
    </SafeAreaView>
  );
}

function StickyPlanCtaBar({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.stickyWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.primaryCta,
          disabled && styles.primaryCtaDisabled,
          pressed && !disabled && styles.primaryCtaPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}>
        <Text
          style={[styles.primaryCtaText, disabled && styles.primaryCtaTextDisabled]}
          numberOfLines={1}>
          {label}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={disabled ? eventDetail.textMuted : '#FFFFFF'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    gap: 12,
    paddingTop: 4,
  },
  readinessPriorityWrap: {
    paddingHorizontal: eventDetail.screenPadding,
  },
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: eventDetail.screenPadding,
    backgroundColor: 'rgba(245,243,234,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6,63,59,0.08)',
  },
  primaryCta: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: eventDetail.tealDark,
  },
  primaryCtaDisabled: {
    backgroundColor: '#DDE5E0',
  },
  primaryCtaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  primaryCtaTextDisabled: {
    color: eventDetail.textMuted,
  },
});
