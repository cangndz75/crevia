import Animated, { FadeInUp } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import {
  ADVISOR_COPY,
  ADVISOR_END_OF_DAY_EXPERIENCE,
} from '@/core/advisors/advisorConstants';
import {
  buildAdvisorEndDayModel,
  buildAdvisorMissedSignalNoteModel,
  buildAdvisorPresentationContextFromStore,
} from '@/core/advisors/advisorPresentation';
import { getAdvisorLevelFromExperience } from '@/core/advisors/advisorState';
import type { DailyReport } from '@/core/models/DailyReport';
import { AdvisorMissedSignalNote } from '@/features/hub/components/AdvisorMissedSignalNote';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import {
  buildAdvisorSeniorityModel,
  shouldSuppressPlayerStyleForSeniority,
} from '@/core/advisors/advisorSeniorityPresentation';
import { buildPlayerStyleProfile } from '@/core/playerStyle';
import { AdvisorDepthInsightBlock } from '@/features/advisor/components/AdvisorDepthInsightBlock';
import { AdvisorSeniorityBadge } from '@/features/advisor/components/AdvisorSeniorityBadge';
import { buildAdvisorRelationshipReportPresentation } from '@/core/advisorRelationship';
import { EcePlayerStyleInsightCard } from '@/features/advisor/components/EcePlayerStyleInsightCard';
import {
  selectAdvisorState,
  selectDecisionHistory,
  useGameStore,
} from '@/store/useGameStore';

type ReportAdvisorCommentCardProps = {
  report: DailyReport;
  compact?: boolean;
};

export function ReportAdvisorCommentCard({
  report,
  compact = false,
}: ReportAdvisorCommentCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const advisorState = useGameStore(selectAdvisorState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);

  const model = useMemo(() => {
    const ctx = buildAdvisorPresentationContextFromStore({
      gameState,
      advisorState,
      personnelState,
      vehicleState,
      containerState,
      operationSignals,
      isDay1Tutorial: isDay1,
    });
    const grantedToday = advisorState.lastExperienceGrantDay === report.day;
    const experienceBefore = grantedToday
      ? Math.max(0, advisorState.experience - ADVISOR_END_OF_DAY_EXPERIENCE)
      : advisorState.experience;
    return buildAdvisorEndDayModel({
      ctx,
      advisorState,
      report,
      levelBefore: getAdvisorLevelFromExperience(experienceBefore),
    });
  }, [
    gameState,
    advisorState,
    personnelState,
    vehicleState,
    containerState,
    operationSignals,
    isDay1,
    report,
  ]);

  const missedNote = useMemo(
    () =>
      isDay1
        ? undefined
        : buildAdvisorMissedSignalNoteModel(advisorState, { showCta: false }),
    [advisorState, isDay1],
  );

  const body = model.primaryInsight?.body ?? '';

  const playerStyleProfile = useMemo(() => {
    if (isDay1) return null;
    return buildPlayerStyleProfile({
      day: report.day,
      surface: 'report',
      decisionHistory,
      advisorState,
      dailyReports: [
        {
          day: report.day,
          summary: (report.summaryLines ?? []).join(' '),
        },
      ],
    });
  }, [advisorState, decisionHistory, isDay1, report.day, report.summaryLines]);

  const seniorityModel = useMemo(() => {
    if (isDay1) return null;
    return buildAdvisorSeniorityModel({
      day: report.day,
      surface: 'report',
      advisorState,
      playerStyleProfile: playerStyleProfile ?? undefined,
    });
  }, [advisorState, isDay1, playerStyleProfile, report.day]);

  const suppressPlayerStyleDuplicate = shouldSuppressPlayerStyleForSeniority(
    seniorityModel,
    playerStyleProfile,
  );

  const relationshipPresentation = useMemo(() => {
    if (isDay1) return null;
    return buildAdvisorRelationshipReportPresentation({
      day: report.day,
      surface: 'report',
      advisorState,
      playerStyleProfile: playerStyleProfile ?? undefined,
      decisionHistory,
      dailyReport: report,
      operationSignals,
      existingLines: [body, model.learningAckLine ?? '', model.levelUpLine ?? ''].filter(Boolean),
    });
  }, [
    advisorState,
    body,
    decisionHistory,
    isDay1,
    model.learningAckLine,
    model.levelUpLine,
    operationSignals,
    playerStyleProfile,
    report,
  ]);

  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(240).springify().damping(22)}
      style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {ADVISOR_COPY.endDayTitle}
        </Text>
        {!isDay1 ? (
          <View style={styles.metaChips}>
            <Text style={styles.levelChip} numberOfLines={1}>
              {model.levelLabel}
            </Text>
            <Text style={styles.clarityChip} numberOfLines={1}>
              {model.clarityLabel}
            </Text>
            {seniorityModel?.visible && report.day >= 2 ? (
              <AdvisorSeniorityBadge model={seniorityModel} compact />
            ) : null}
          </View>
        ) : null}
      </View>
      <Text
        style={styles.body}
        numberOfLines={compact ? 2 : 3}
        ellipsizeMode="tail">
        {body}
      </Text>
      {missedNote ? (
        <AdvisorMissedSignalNote model={{ ...missedNote, showCta: false }} />
      ) : null}
      {seniorityModel?.visible && report.day >= 3 && !compact ? (
        <AdvisorDepthInsightBlock model={seniorityModel} compact={report.day <= 5} />
      ) : null}
      {playerStyleProfile?.visible && !suppressPlayerStyleDuplicate ? (
        <EcePlayerStyleInsightCard
          profile={playerStyleProfile}
          compact={report.day <= 3 || compact}
        />
      ) : null}
      {relationshipPresentation?.visible && relationshipPresentation.reportLine ? (
        <Text
          style={styles.relationshipLine}
          numberOfLines={2}
          ellipsizeMode="tail"
          accessibilityRole="text">
          {relationshipPresentation.reportLine}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.experienceLine} numberOfLines={1}>
          {model.experienceGrantLine}
        </Text>
        {model.learningAckLine ? (
          <Text style={styles.learningLine} numberOfLines={2}>
            {model.learningAckLine}
          </Text>
        ) : null}
        {model.levelUpLine ? (
          <Text style={styles.levelUpLine} numberOfLines={2}>
            {model.levelUpLine}
          </Text>
        ) : (
          <Text style={styles.progressLine} numberOfLines={1}>
            {model.progressLabel}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4FBF8',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: 12,
    gap: 6,
  },
  headerRow: {
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4A46',
    flexShrink: 1,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  levelChip: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F8F86',
    flexShrink: 1,
  },
  clarityChip: {
    fontSize: 11,
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
  footer: {
    gap: 4,
    minWidth: 0,
  },
  experienceLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F8F86',
    flexShrink: 1,
  },
  learningLine: {
    fontSize: 12,
    color: '#2A6B64',
    flexShrink: 1,
  },
  levelUpLine: {
    fontSize: 12,
    color: '#2A6B64',
    flexShrink: 1,
  },
  progressLine: {
    fontSize: 11,
    color: '#6B7F7B',
    flexShrink: 1,
  },
});
