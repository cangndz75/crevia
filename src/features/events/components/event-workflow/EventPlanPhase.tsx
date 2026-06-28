import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
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
import {
  EventPlanAdvisorCommentCard,
  EventPlanResourceBalanceCard,
  EventPlanSelectedPreviewCard,
  EventPlanStrategyCardView,
  PlanPhaseContextChips,
  PlanSecondaryActionsRow,
} from '@/features/events/components/event-workflow/plan/EventPlanStrategyBoard';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { OperationPhaseBridgeCard } from '@/features/events/components/event-workflow/OperationPhaseBridgeCard';
import { OperationPhaseContentEnter } from '@/features/events/components/event-workflow/OperationPhaseContentEnter';
import { OperationPhaseProgressRail } from '@/features/events/components/event-workflow/OperationPhaseProgressRail';
import { OperationPhaseShellHeader } from '@/features/events/components/event-workflow/OperationPhaseShellHeader';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventPlanPhasePresentation,
  type EventPlanActionKey,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { useGameStore } from '@/store/useGameStore';
import { CreviaMotionView, useCreviaReducedMotion } from '@/shared/motion';

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

  const compact = width < 370;

  const handleConfirm = () => {
    if (!presentation.primaryCta.enabled) return;
    playLightImpactHaptic();
    onConfirmPlan();
  };

  const handleSecondaryAction = (actionKey: EventPlanActionKey) => {
    playLightImpactHaptic();
    if (actionKey === 'compare_risks' || actionKey === 'view_resources') {
      return;
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
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
        <OperationPhaseShellHeader
          shell={presentation.phaseTransition.shell}
          compact={compact}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />
        <OperationPhaseProgressRail
          progress={presentation.phaseTransition.progress}
          reducedMotion={reducedMotion}
        />
        {presentation.phaseTransition.bridge ? (
          <OperationPhaseBridgeCard
            bridge={presentation.phaseTransition.bridge}
            reducedMotion={reducedMotion}
            index={1}
          />
        ) : null}
        <OperationPhaseContentEnter reducedMotion={reducedMotion} index={2}>
        <PlanPhaseContextChips
          chips={presentation.phaseContextChips}
          reducedMotion={reducedMotion}
        />
        <PhaseHeadingBlock
          heading={presentation.phaseHeading}
          description={presentation.phaseDescription}
        />
        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}
        <View style={styles.strategySection}>
          <Text style={styles.strategySectionTitle}>Strateji Kartları</Text>
          <Text style={styles.strategySectionHint}>
            Her planın avantajı ve bedeli var.
          </Text>
          <View style={styles.strategyList}>
            {presentation.strategies.map((strategy, index) => (
              <EventPlanStrategyCardView
                key={strategy.id}
                strategy={strategy}
                index={index + 3}
                reducedMotion={reducedMotion}
                onSelect={() => {
                  playSelectionHaptic();
                  onSelectStrategy(strategy.id);
                }}
              />
            ))}
          </View>
        </View>
        <EventPlanSelectedPreviewCard
          preview={presentation.selectedPlanPreview}
          reducedMotion={reducedMotion}
        />
        <EventPlanResourceBalanceCard
          balance={presentation.resourceBalance}
          reducedMotion={reducedMotion}
        />
        <EventPlanAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />
        <PlanSecondaryActionsRow
          actions={presentation.actions}
          reducedMotion={reducedMotion}
          onActionPress={handleSecondaryAction}
        />
        </OperationPhaseContentEnter>
      </ScrollView>

      <StickyPlanCtaBar
        label={
          presentation.primaryCta.enabled
            ? presentation.phaseTransition.primaryCta.label
            : presentation.primaryCta.label
        }
        disabled={!presentation.primaryCta.enabled}
        onPress={handleConfirm}
      />
    </SafeAreaView>
  );
}

function PhaseHeadingBlock({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) {
  return (
    <View style={styles.phaseHeadingWrap}>
      <Text style={styles.phaseHeading}>{heading}</Text>
      <Text style={styles.phaseDescription}>{description}</Text>
    </View>
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
    paddingTop: 8,
  },
  phaseHeadingWrap: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 4,
  },
  phaseHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  phaseDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  strategySection: {
    gap: 8,
  },
  strategySectionTitle: {
    marginHorizontal: eventDetail.screenPadding,
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  strategySectionHint: {
    marginHorizontal: eventDetail.screenPadding,
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  strategyList: {
    gap: 10,
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
