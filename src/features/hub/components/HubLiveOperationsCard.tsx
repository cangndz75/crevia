import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildActiveMicroDecisionsModel,
  buildMicroDecisionPresentationInput,
} from '@/core/microDecisions';
import { shouldHideAdvancedSystemForFirstTenMinutes } from '@/core/onboarding/firstTenMinutesPresentation';
import { deriveMicroDecisionAccessMode } from '@/core/microDecisions/microDecisionEngine';
import { LiveOperationDecisionCard } from '@/features/hub/components/LiveOperationDecisionCard';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubLiveOperationsCardProps = {
  compact?: boolean;
};

export function HubLiveOperationsCard({ compact = false }: HubLiveOperationsCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const refreshMicroDecisions = useGameStore((s) => s.refreshMicroDecisionsForCurrentDay);
  const resolveMicroDecision = useGameStore((s) => s.resolveMicroDecision);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const refreshedDayRef = useRef<number | null>(null);

  const day = gameState.city.day;

  useEffect(() => {
    if (isDay1) return;
    if (refreshedDayRef.current === day) return;
    refreshedDayRef.current = day;
    refreshMicroDecisions();
  }, [day, isDay1, refreshMicroDecisions]);

  const model = useMemo(() => {
    const input = buildMicroDecisionPresentationInput({
      day,
      gameState,
      monetization,
      operationSignals,
      crisisState,
      dailyOperationsPlan,
      assignments,
      mainOperationSeason,
      advisorState,
      microDecisionState,
    });
    const access = deriveMicroDecisionAccessMode(input);
    if (access === 'inactive' || isDay1) return undefined;
    return buildActiveMicroDecisionsModel(input, { compact: compact || isDay1 });
  }, [
    day,
    gameState,
    monetization,
    operationSignals,
    crisisState,
    dailyOperationsPlan,
    assignments,
    mainOperationSeason,
    advisorState,
    microDecisionState,
    compact,
    isDay1,
  ]);

  if (
    shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions') ||
    !model ||
    model.decisions.length === 0
  ) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <LinearGradient
        colors={['#F0FAF8', '#FFFCF5', '#F5FAF7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.shell, hubPremiumShadowCard()]}>
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {model.subtitle}
          </Text>
        </View>
        <View style={styles.stack}>
          {model.decisions.map((decision) => (
            <LiveOperationDecisionCard
              key={decision.id}
              model={decision}
              onSelectOption={(optionId) => resolveMicroDecision(decision.id, optionId)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    minWidth: 0,
  },
  wrapCompact: {
    paddingHorizontal: spacing.sm,
  },
  shell: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
    minWidth: 0,
  },
  head: {
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  subtitle: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
  },
  stack: {
    gap: spacing.sm,
  },
});
