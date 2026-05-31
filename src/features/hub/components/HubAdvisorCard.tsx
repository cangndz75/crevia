import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADVISOR_COPY } from '@/core/advisors/advisorConstants';
import {
  buildAdvisorHubCardModel,
  buildAdvisorMissedSignalNoteModel,
  buildAdvisorPresentationContextFromStore,
  getAdvisorAvatarInitials,
} from '@/core/advisors/advisorPresentation';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { AdvisorMissedSignalNote } from '@/features/hub/components/AdvisorMissedSignalNote';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import {
  selectAdvisorState,
  useGameStore,
} from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { spacing } from '@/ui/theme/spacing';

type HubAdvisorCardProps = {
  compact?: boolean;
};

export function HubAdvisorCard({ compact = false }: HubAdvisorCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const advisorState = useGameStore(selectAdvisorState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const askDaily = useGameStore((s) => s.askAdvisorForDailySummary);
  const acknowledgeMissed = useGameStore((s) => s.acknowledgeAdvisorMissedSignal);
  const [expanded, setExpanded] = useState(false);

  const ctx = useMemo(
    () =>
      buildAdvisorPresentationContextFromStore({
        gameState,
        advisorState,
        personnelState,
        vehicleState,
        containerState,
        operationSignals,
        dailyOperationsPlan,
        isDay1Tutorial: isDay1,
      }),
    [
      gameState,
      advisorState,
      personnelState,
      vehicleState,
      containerState,
      operationSignals,
      dailyOperationsPlan,
      isDay1,
    ],
  );

  const model = useMemo(
    () =>
      buildAdvisorHubCardModel({
        ctx,
        advisorState,
        expanded,
      }),
    [ctx, advisorState, expanded],
  );

  const missedNote = useMemo(
    () =>
      isDay1
        ? undefined
        : buildAdvisorMissedSignalNoteModel(advisorState, { showCta: true }),
    [advisorState, isDay1],
  );

  const usesLeft = advisorState.dailyUsesRemaining > 0;
  const canAsk = usesLeft;

  const handleAsk = () => {
    playLightImpactHaptic();
    if (!canAsk) return;
    askDaily();
    setExpanded(true);
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#F4FBF8', '#FFFCF7', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard(), compact && styles.cardCompact]}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAdvisorAvatarInitials()}</Text>
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.advisorName} numberOfLines={1}>
              {model.advisorName}
            </Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText} numberOfLines={1}>
                {model.levelLabel}
              </Text>
            </View>
            {!isDay1 ? (
              <View style={styles.clarityChip}>
                <Text style={styles.clarityChipText} numberOfLines={1}>
                  {model.clarityLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {model.primaryInsight ? (
          <Text
            style={styles.body}
            numberOfLines={expanded ? 4 : 2}
            ellipsizeMode="tail">
            {model.primaryInsight.body}
          </Text>
        ) : null}

        {missedNote ? (
          <AdvisorMissedSignalNote
            model={missedNote}
            onAcknowledge={acknowledgeMissed}
          />
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {model.usesLabel}
          </Text>
          {!isDay1 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(model.progressRatio * 100)}%` },
                ]}
              />
            </View>
          ) : null}
        </View>
        {!compact && !isDay1 ? (
          <Text style={styles.progressLabel} numberOfLines={1}>
            {model.progressLabel}
          </Text>
        ) : null}

        <Pressable
          onPress={handleAsk}
          disabled={!canAsk}
          accessibilityRole="button"
          accessibilityLabel={canAsk ? model.ctaLabel : model.usesLabel}
          accessibilityState={{ disabled: !canAsk }}
          style={({ pressed }) => [
            styles.cta,
            !canAsk && styles.ctaDisabled,
            getPressFeedbackStyle({ pressed: pressed && canAsk, disabled: !canAsk }),
          ]}>
          <Text style={[styles.ctaText, !canAsk && styles.ctaTextDisabled]} numberOfLines={1}>
            {canAsk ? model.ctaLabel : ADVISOR_COPY.usesExhausted}
          </Text>
        </Pressable>
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
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HUB_PREMIUM_COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  advisorName: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 143, 134, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: '100%',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.teal,
    flexShrink: 1,
  },
  clarityChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(198, 235, 220, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: '100%',
  },
  clarityChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2A6B64',
    flexShrink: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  metaText: {
    fontSize: 11,
    color: '#5E726E',
    flexShrink: 0,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: HUB_PREMIUM_COLORS.teal,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  cta: {
    marginTop: 2,
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  ctaDisabled: {
    backgroundColor: 'rgba(15, 74, 70, 0.35)',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  ctaTextDisabled: {
    color: 'rgba(255,255,255,0.9)',
  },
});
