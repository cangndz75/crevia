import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';

import {
  ADVISOR_COPY,
  ADVISOR_END_OF_DAY_EXPERIENCE,
  DOMAIN_DISPLAY_NAMES,
  RELIABILITY_LABELS,
} from './advisorConstants';
import {
  buildAssignmentAdvisorInsights,
  buildDailyAdvisorInsights,
  buildEndDayAdvisorInsight,
  buildEventAdvisorInsights,
  buildAdvisorContextFromStore,
} from './advisorEngine';
import { buildMissedSignalPresentation } from './advisorMissedSignalPresentation';
import {
  getAdvisorProgressToNextLevel,
  getAdvisorReliabilityLabel,
  refreshAdvisorDailyUses,
} from './advisorState';
import type {
  AdvisorEngineContext,
  AdvisorLevel,
  AdvisorMissedSignalPresentation,
  AdvisorPresentationModel,
  AdvisorState,
} from './advisorTypes';

export function getAdvisorLevelLabel(level: AdvisorLevel): string {
  return ADVISOR_COPY.levelLabelByLevel[level];
}

export function getAdvisorRoleLabel(level: AdvisorLevel): string {
  return ADVISOR_COPY.roleByLevel[level];
}

export function getAdvisorAvatarInitials(): string {
  return 'E';
}

function buildUsesLabel(state: AdvisorState): string {
  if (state.dailyUsesRemaining <= 0) {
    return ADVISOR_COPY.usesExhausted;
  }
  return ADVISOR_COPY.usesLabel(state.dailyUsesRemaining);
}

function buildClarityLabel(state: AdvisorState): string {
  return getAdvisorReliabilityLabel(state.reliabilityScore);
}

function basePresentation(
  state: AdvisorState,
  insights: ReturnType<typeof buildDailyAdvisorInsights>,
  options?: { compactDay1?: boolean },
): AdvisorPresentationModel {
  const level = state.level;
  const progress = getAdvisorProgressToNextLevel(state);
  const clarityLabel = buildClarityLabel(state);
  const limitedSignalFooter =
    state.level === 1 && state.reliabilityBand === 'early_observation'
      ? ADVISOR_COPY.limitedSignalFooter
      : undefined;

  return {
    advisorName: ADVISOR_COPY.advisorName,
    roleLabel: getAdvisorRoleLabel(level),
    levelLabel: getAdvisorLevelLabel(level),
    clarityLabel,
    progressLabel: progress.label,
    progressRatio: progress.ratio,
    usesLabel: buildUsesLabel(state),
    primaryInsight: insights[0],
    secondaryInsights: insights.slice(1),
    ctaLabel: ADVISOR_COPY.ctaAsk,
    limitedSignalFooter: options?.compactDay1 ? undefined : limitedSignalFooter,
  };
}

export function buildAdvisorMissedSignalNoteModel(
  state: AdvisorState,
  options?: { showCta?: boolean },
): AdvisorMissedSignalPresentation | undefined {
  return buildMissedSignalPresentation(state, options);
}

export function buildAdvisorHubCardModel(input: {
  ctx: AdvisorEngineContext;
  advisorState: AdvisorState;
  expanded?: boolean;
}): AdvisorPresentationModel {
  const state = refreshAdvisorDailyUses(
    input.advisorState,
    input.ctx.gameState.city.day,
  );
  const insights = buildDailyAdvisorInsights({
    ...input.ctx,
    advisorState: state,
  });
  const model = basePresentation(state, insights, {
    compactDay1: input.ctx.isDay1Tutorial,
  });
  if (!input.expanded && state.dailyUsesRemaining > 0 && model.primaryInsight) {
    return {
      ...model,
      primaryInsight: {
        ...model.primaryInsight,
        body: model.primaryInsight.body.split('.')[0]?.concat('.') ?? model.primaryInsight.body,
      },
    };
  }
  return model;
}

export function buildAdvisorEventHintModel(input: {
  ctx: AdvisorEngineContext;
  advisorState: AdvisorState;
  event: EventCard;
  detailed?: boolean;
}): AdvisorPresentationModel {
  const state = refreshAdvisorDailyUses(
    input.advisorState,
    input.ctx.gameState.city.day,
  );
  const insights = input.detailed
    ? [
        ...buildEventAdvisorInsights(
          { ...input.ctx, advisorState: state },
          input.event,
        ),
        ...buildAssignmentAdvisorInsights(
          { ...input.ctx, advisorState: state },
          input.event,
        ),
      ]
    : buildEventAdvisorInsights(
        { ...input.ctx, advisorState: state },
        input.event,
      );
  return basePresentation(state, insights, {
    compactDay1: input.ctx.isDay1Tutorial,
  });
}

export type AdvisorEndDayPresentation = AdvisorPresentationModel & {
  experienceGrantLine: string;
  levelUpLine: string | null;
  learningAckLine: string | null;
  levelBefore: AdvisorLevel;
  levelAfter: AdvisorLevel;
};

export function buildAdvisorEndDayModel(input: {
  ctx: AdvisorEngineContext;
  advisorState: AdvisorState;
  report: DailyReport;
  levelBefore: AdvisorLevel;
}): AdvisorEndDayPresentation {
  const state = refreshAdvisorDailyUses(
    input.advisorState,
    input.ctx.gameState.city.day,
  );
  const insight = buildEndDayAdvisorInsight(
    { ...input.ctx, advisorState: state },
    input.report,
  );
  const insights = insight ? [insight] : buildDailyAdvisorInsights({
    ...input.ctx,
    advisorState: state,
  });
  const model = basePresentation(state, insights);
  const levelAfter = state.level;
  const levelUpLine =
    levelAfter > input.levelBefore
      ? ADVISOR_COPY.levelUpLine(getAdvisorRoleLabel(levelAfter))
      : null;

  const missed = state.lastMissedSignal;
  const learningAckLine =
    missed?.acknowledged === true &&
    missed.acknowledgedDay === input.report.day
      ? ADVISOR_COPY.learningAckLine(DOMAIN_DISPLAY_NAMES[missed.domain])
      : null;

  return {
    ...model,
    experienceGrantLine: ADVISOR_COPY.endDayExperienceLine(
      ADVISOR_END_OF_DAY_EXPERIENCE,
    ),
    levelUpLine,
    learningAckLine,
    levelBefore: input.levelBefore,
    levelAfter,
  };
}

export function buildAdvisorPresentationContextFromStore(state: {
  gameState: AdvisorEngineContext['gameState'];
  advisorState: AdvisorState;
  personnelState?: AdvisorEngineContext['personnelState'];
  vehicleState?: AdvisorEngineContext['vehicleState'];
  containerState?: AdvisorEngineContext['containerState'];
  operationSignals?: AdvisorEngineContext['operationSignals'];
  dailyOperationsPlan?: AdvisorEngineContext['dailyOperationsPlan'];
  isDay1Tutorial?: boolean;
}): AdvisorEngineContext {
  return buildAdvisorContextFromStore(state);
}

export { RELIABILITY_LABELS };
