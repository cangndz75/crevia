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
import {
  buildCityEchoAdvisorLine,
  buildCityEchoBinding,
} from '@/core/cityEchoBinding';
import { buildCrisisAdvisorNoteModel } from '@/core/crisis';
import {
  buildCrisisActionHubModel,
  buildCrisisActionPresentationInputFromStore,
} from '@/core/crisisActions/crisisActionPresentation';
import { buildMainOperationAdvisorNote } from '@/core/mainOperation';
import { getAdvisorLevelFromExperience } from '@/core/advisors/advisorState';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { AdvisorMissedSignalNote } from '@/features/hub/components/AdvisorMissedSignalNote';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import {
  DAY1_ADVISOR_SHORT_COPY,
  shouldUseFirstTenMinutesAdvisorShortMode,
} from '@/core/onboarding/firstTenMinutesPresentation';
import {
  buildAdvisorSeniorityModel,
  shouldSuppressPlayerStyleForSeniority,
} from '@/core/advisors/advisorSeniorityPresentation';
import { buildPlayerStyleProfile } from '@/core/playerStyle';
import { AdvisorDepthInsightBlock } from '@/features/advisor/components/AdvisorDepthInsightBlock';
import { AdvisorSeniorityBadge } from '@/features/advisor/components/AdvisorSeniorityBadge';
import { buildPilotThemeAdvisorLine } from '@/core/pilotRhythm';
import { EcePlayerStyleInsightCard } from '@/features/advisor/components/EcePlayerStyleInsightCard';
import {
  buildOperationalResourceAdvisorLine,
  buildOperationalResourceEngineInputFromStore,
} from '@/core/operationalResources/operationalResourcePresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import {
  selectAdvisorState,
  selectDecisionHistory,
  useGameStore,
} from '@/store/useGameStore';
import { buildAdvisorRelationshipHubPresentation } from '@/core/advisorRelationship';
import { buildRewardComebackHubPresentation } from '@/core/rewardComeback';
import { buildEceArchiveHintModel } from '@/core/cityArchive/cityArchiveSurfaceWiring';
import { selectPriorityAdvisorSupportingLine } from '@/core/releaseCandidatePolish/hubAdvisorPolishPresentation';
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
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const crisisState = useGameStore((s) => s.crisisState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const cityArchive = useGameStore((s) => s.cityArchive);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const advisorShortMode = shouldUseFirstTenMinutesAdvisorShortMode(gameState);
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
        mainOperationAdvisorNote: (() => {
          if (advisorShortMode) {
            return DAY1_ADVISOR_SHORT_COPY.body;
          }
          const crisisActionInput = buildCrisisActionPresentationInputFromStore({
            gameState,
            monetization,
            crisisState,
            operationSignals,
            dailyOperationsPlan,
            assignments,
            mainOperationSeason,
            advisorState,
            crisisActionState,
          });
          const crisisActionHub = buildCrisisActionHubModel(crisisActionInput, {
            compact,
          });
          if (crisisActionHub?.advisorLine) {
            return crisisActionHub.advisorLine;
          }
          const crisisNote = buildCrisisAdvisorNoteModel(
            gameState,
            monetization,
            crisisState,
            getAdvisorLevelFromExperience(advisorState.experience),
          );
          if (crisisNote) {
            return crisisNote.body;
          }
          return buildMainOperationAdvisorNote(
            gameState,
            monetization,
            mainOperationSeason,
            {
              operationSignals,
              dailyOperationsPlan,
              assignments,
              crisisState,
              microDecisionState,
            },
            advisorState,
          );
        })(),
      }),
    [
      gameState,
      advisorState,
      personnelState,
      vehicleState,
      containerState,
      operationSignals,
      dailyOperationsPlan,
      monetization,
      mainOperationSeason,
      assignments,
      microDecisionState,
      crisisState,
      crisisActionState,
      advisorShortMode,
      isDay1,
      compact,
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
      isDay1 || advisorShortMode
        ? undefined
        : buildAdvisorMissedSignalNoteModel(advisorState, { showCta: true }),
    [advisorState, isDay1, advisorShortMode],
  );

  const pilotThemeAdvisorLine = useMemo(() => {
    const day = gameState.city.day;
    if (day < 1 || day > 7) return undefined;
    return buildPilotThemeAdvisorLine(day) ?? undefined;
  }, [gameState.city.day]);

  const playerStyleProfile = useMemo(() => {
    if (isDay1 || advisorShortMode) return null;
    const day = gameState.city.day;
    return buildPlayerStyleProfile({
      day,
      surface: 'hub',
      decisionHistory,
      advisorState,
    });
  }, [advisorShortMode, advisorState, decisionHistory, gameState.city.day, isDay1]);

  const seniorityModel = useMemo(() => {
    if (advisorShortMode) return null;
    return buildAdvisorSeniorityModel({
      day: gameState.city.day,
      surface: 'hub',
      advisorState,
      playerStyleProfile: playerStyleProfile ?? undefined,
    });
  }, [advisorShortMode, advisorState, gameState.city.day, playerStyleProfile]);

  const suppressPlayerStyleDuplicate = shouldSuppressPlayerStyleForSeniority(
    seniorityModel,
    playerStyleProfile,
  );

  const resourceAdvisorLine = useMemo(() => {
    if (advisorShortMode) return undefined;
    return buildOperationalResourceAdvisorLine(
      buildOperationalResourceEngineInputFromStore({
        gameState,
        monetization,
        operationSignals,
        dailyOperationsPlan,
        assignments,
        microDecisionState,
        crisisActionState,
        operationalResources,
      }),
      getAdvisorLevelFromExperience(advisorState.experience),
    );
  }, [
    advisorShortMode,
    gameState,
    monetization,
    operationSignals,
    dailyOperationsPlan,
    assignments,
    microDecisionState,
    crisisActionState,
    operationalResources,
    advisorState.experience,
  ]);

  const cityEchoAdvisorLine = useMemo(() => {
    const lastDecision = decisionHistory.filter((record) => record.day === gameState.city.day - 1).at(-1);
    return buildCityEchoAdvisorLine(
      buildCityEchoBinding({
        day: gameState.city.day,
        operationSignals,
        socialPulse: { score: undefined },
        snapshot: lastDecision
          ? {
              id: `advisor-${lastDecision.id}`,
              day: lastDecision.day,
              eventId: lastDecision.eventId,
              eventTitle: lastDecision.eventTitle,
              neighborhoodId: lastDecision.neighborhoodId,
              neighborhoodName: lastDecision.neighborhoodName,
              decisionId: lastDecision.decisionId,
              decisionTitle: lastDecision.decisionLabel,
              decisionTone: 'balanced',
              createdAt: Date.parse(lastDecision.createdAt) || Date.now(),
              summaryTitle: lastDecision.eventTitle,
              summaryText: lastDecision.decisionLabel,
              resultTone: 'mixed',
              metricChanges: [],
              subsystemOutcomes: [],
              highlightLines: [],
              riskLines: [],
            }
          : null,
        existingLines: [model.primaryInsight?.body ?? '', resourceAdvisorLine ?? ''].filter(Boolean),
      }),
    );
  }, [
    decisionHistory,
    gameState.city.day,
    model.primaryInsight?.body,
    operationSignals,
    resourceAdvisorLine,
  ]);

  const advisorRelationshipPresentation = useMemo(() => {
    if (advisorShortMode || isDay1) return null;
    return buildAdvisorRelationshipHubPresentation({
      day: gameState.city.day,
      surface: 'hub',
      advisorState,
      playerStyleProfile: playerStyleProfile ?? undefined,
      decisionHistory,
      operationSignals,
      existingLines: [
        model.primaryInsight?.body ?? '',
        cityEchoAdvisorLine ?? '',
        resourceAdvisorLine ?? '',
      ].filter(Boolean),
    });
  }, [
    advisorShortMode,
    advisorState,
    cityEchoAdvisorLine,
    decisionHistory,
    gameState.city.day,
    isDay1,
    model.primaryInsight?.body,
    operationSignals,
    playerStyleProfile,
    resourceAdvisorLine,
  ]);

  const rewardComebackPresentation = useMemo(() => {
    if (advisorShortMode || isDay1) return null;
    return buildRewardComebackHubPresentation({
      day: gameState.city.day,
      surface: 'hub',
      operationSignals,
      advisorRelationship: advisorRelationshipPresentation?.model,
      existingLines: [
        model.primaryInsight?.body ?? '',
        advisorRelationshipPresentation?.mainLine ?? '',
        cityEchoAdvisorLine ?? '',
        resourceAdvisorLine ?? '',
      ].filter(Boolean),
    });
  }, [
    advisorRelationshipPresentation?.mainLine,
    advisorRelationshipPresentation?.model,
    advisorShortMode,
    cityEchoAdvisorLine,
    gameState.city.day,
    isDay1,
    model.primaryInsight?.body,
    operationSignals,
    resourceAdvisorLine,
  ]);

  const supportingAdvisorLine = useMemo(() => {
    if (advisorShortMode) return undefined;
    const eceHint = buildEceArchiveHintModel({
      day: gameState.city.day,
      cityArchive,
      advisorRelationshipSupportingLine: advisorRelationshipPresentation?.supportingLine ?? null,
      advisorRelationshipMainLine: advisorRelationshipPresentation?.mainLine ?? null,
      rewardComebackEceLine: rewardComebackPresentation?.model.eceLine ?? null,
      cityEchoAdvisorLine: cityEchoAdvisorLine ?? null,
      existingLines: [
        model.primaryInsight?.body ?? '',
        resourceAdvisorLine ?? '',
        rewardComebackPresentation?.hubLine ?? '',
      ].filter(Boolean),
    });
    if (eceHint.supportingLine) return eceHint.supportingLine;
    return selectPriorityAdvisorSupportingLine(
      [
        { id: 'city_echo', line: cityEchoAdvisorLine ?? '', priority: 2 },
        { id: 'resource', line: resourceAdvisorLine ?? '', priority: 1 },
        { id: 'pilot_theme', line: pilotThemeAdvisorLine ?? '', priority: 3 },
      ],
      gameState.city.day,
    );
  }, [
    advisorRelationshipPresentation?.mainLine,
    advisorRelationshipPresentation?.supportingLine,
    advisorShortMode,
    cityArchive,
    cityEchoAdvisorLine,
    gameState.city.day,
    model.primaryInsight?.body,
    pilotThemeAdvisorLine,
    resourceAdvisorLine,
    rewardComebackPresentation?.hubLine,
    rewardComebackPresentation?.model.eceLine,
  ]);

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
          <View style={[styles.titleCol, { flexShrink: 1, minWidth: 0 }]}>
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
            {seniorityModel?.visible ? (
              <AdvisorSeniorityBadge
                model={seniorityModel}
                compact={gameState.city.day <= 3 || isDay1}
              />
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

        {advisorRelationshipPresentation?.visible && advisorRelationshipPresentation.mainLine ? (
          <Text
            style={styles.relationshipLine}
            numberOfLines={gameState.city.day >= 8 ? 2 : 2}
            ellipsizeMode="tail"
            accessibilityRole="text">
            {advisorRelationshipPresentation.mainLine}
          </Text>
        ) : null}

        {seniorityModel?.visible && gameState.city.day >= 2 && !advisorShortMode ? (
          <AdvisorDepthInsightBlock
            model={seniorityModel}
            compact={gameState.city.day <= 3}
          />
        ) : null}

        {supportingAdvisorLine ? (
          <Text
            style={styles.cityEchoLine}
            numberOfLines={gameState.city.day >= 8 ? 2 : 2}
            ellipsizeMode="tail"
            accessibilityRole="text">
            {supportingAdvisorLine}
          </Text>
        ) : null}

        {playerStyleProfile?.visible &&
        !suppressPlayerStyleDuplicate &&
        gameState.city.day >= 4 ? (
          <EcePlayerStyleInsightCard profile={playerStyleProfile} compact={gameState.city.day <= 5} />
        ) : playerStyleProfile?.visible &&
          !suppressPlayerStyleDuplicate &&
          gameState.city.day >= 2 ? (
          <EcePlayerStyleInsightCard profile={playerStyleProfile} hubChip compact />
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

        {!canAsk && !isDay1 ? (
          <Text style={styles.disabledHint} numberOfLines={2}>
            Günlük danışman hakkın doldu. Yarın yeni analiz alabilirsin.
          </Text>
        ) : null}

        <Pressable
          onPress={handleAsk}
          disabled={!canAsk}
          accessibilityRole="button"
          accessibilityLabel={
            canAsk
              ? advisorShortMode
                ? DAY1_ADVISOR_SHORT_COPY.cta
                : model.ctaLabel
              : ADVISOR_COPY.usesExhausted
          }
          accessibilityState={{ disabled: !canAsk }}
          style={({ pressed }) => [
            styles.cta,
            !canAsk && styles.ctaDisabled,
            getPressFeedbackStyle({ pressed: pressed && canAsk, disabled: !canAsk }),
          ]}>
          <Text style={[styles.ctaText, !canAsk && styles.ctaTextDisabled]} numberOfLines={1}>
            {canAsk
              ? advisorShortMode
                ? DAY1_ADVISOR_SHORT_COPY.cta
                : model.ctaLabel
              : ADVISOR_COPY.usesExhausted}
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
  relationshipLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#2A5C56',
    fontWeight: '600',
    flexShrink: 1,
  },
  themeContextLine: {
    fontSize: 12,
    lineHeight: 17,
    color: HUB_PREMIUM_COLORS.teal,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  resourceLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#0F8F86',
    fontWeight: '600',
    flexShrink: 1,
  },
  cityEchoLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#2A6B64',
    fontWeight: '700',
    flexShrink: 1,
  },
  rewardComebackLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#1F6B5E',
    fontWeight: '600',
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
  disabledHint: {
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7F7B',
    fontStyle: 'italic',
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
