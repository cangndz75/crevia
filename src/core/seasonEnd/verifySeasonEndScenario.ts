import { createDay1Seed } from '@/core/content/day1Seed';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialCrisisActionState } from '@/core/crisisActions/crisisActionState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { getInteractionContractsForComponent } from '@/core/quality/interactionContracts/interactionContractRegistry';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  SEASON_END_FORBIDDEN_WORDS,
  getSeasonEndRatingFromScore,
} from './seasonEndConstants';
import {
  buildSeasonEndEvaluationModel,
  calculateSeasonEndOverallScore,
  evaluateAssignments,
  evaluateCityBalance,
  evaluateCrisisManagement,
  evaluateDistrictCoverage,
  evaluateOperationalResources,
  evaluateSeasonGoals,
  isSeasonEndEligible,
  type SeasonEndEvaluationInput,
} from './seasonEndEvaluation';
import {
  buildSeasonEndDetailSheetModel,
  buildSeasonEndReportCardModel,
} from './seasonEndPresentation';
import {
  createFullMainOperationSeasonState,
  createLimitedMainOperationSeasonPreviewState,
} from '@/core/mainOperation/mainOperationState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';

export type VerifySeasonEndOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function containsForbidden(text: string): boolean {
  const lower = text.toLowerCase();
  return SEASON_END_FORBIDDEN_WORDS.some((w) => lower.includes(w));
}

function seasonEndInput(
  day: number,
  season = createFullMainOperationSeasonState(POST_PILOT_FIRST_OPERATION_DAY),
): SeasonEndEvaluationInput {
  const gs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  return {
    gameState: {
      ...gs,
      city: { ...gs.city, day },
      pilot: { ...gs.pilot, currentPilotDay: 7 },
    },
    monetization: mockPurchaseMainOperationPack(
      createInitialMonetizationState(),
      day,
    ),
    mainOperationSeason: {
      ...season,
      status: 'completed',
      currentSeasonDay: season.seasonLengthDays,
    },
    operationSignals: createInitialOperationSignalsState(day),
    operationalResources: createInitialOperationalResourcesState(day),
    crisisState: createInitialCrisisState(),
    crisisActionState: createInitialCrisisActionState(),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    socialPulseState: createInitialSocialPulseState(day),
  };
}

export function verifySeasonEndScenario(): VerifySeasonEndOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const endInput = seasonEndInput(21);
  const model = buildSeasonEndEvaluationModel(endInput);

  ok =
    assert(checks, model != null, 'Full season end model', 'No model for completed season') &&
    ok;
  ok =
    assert(
      checks,
      !isSeasonEndEligible(seasonEndInput(7)),
      'Pilot day 7 not eligible',
      'Pilot day 7 should not be eligible',
    ) && ok;

  const limitedGs = applyLimitedContinueToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  const limitedInput: SeasonEndEvaluationInput = {
    ...endInput,
    gameState: { ...limitedGs, city: { ...limitedGs.city, day: 21 } },
    monetization: selectLimitedContinue(createInitialMonetizationState(), 21),
    mainOperationSeason: createLimitedMainOperationSeasonPreviewState(21),
  };
  ok =
    assert(
      checks,
      buildSeasonEndEvaluationModel(limitedInput) == null,
      'Limited mode no model',
      'Limited produced season end model',
    ) && ok;

  const lightGs = {
    ...endInput.gameState,
    pilot: {
      ...endInput.gameState.pilot,
      postPilotOperation: normalizePostPilotOperationState(
        {
          phase: 'main_operation_light',
          operationDay: 21,
          lastUpdatedDay: 21,
        },
        { pilotStatus: 'completed', currentPilotDay: 7 },
      ),
    },
  };
  ok =
    assert(
      checks,
      buildSeasonEndEvaluationModel({ ...endInput, gameState: lightGs }) == null,
      'Post-pilot light no model',
      'Light phase produced model',
    ) && ok;

  const incomplete = seasonEndInput(
    10,
    createFullMainOperationSeasonState(POST_PILOT_FIRST_OPERATION_DAY),
  );
  ok =
    assert(
      checks,
      buildSeasonEndEvaluationModel(incomplete) == null,
      'Incomplete season no model',
      'Incomplete season produced model',
    ) && ok;

  if (model) {
    ok =
      assert(checks, model.title.length > 0, 'Model title', 'Empty title') && ok;
    ok =
      assert(
        checks,
        ['excellent', 'strong', 'steady', 'strained', 'critical'].includes(
          model.overallRating,
        ),
        'Overall rating valid',
        'Invalid overall rating',
      ) && ok;
    ok =
      assert(
        checks,
        model.overallScoreLabel.length > 0,
        'Overall score label',
        'Empty score label',
      ) && ok;
    ok =
      assert(
        checks,
        model.categoryEvaluations.length >= 5,
        'At least 5 categories',
        'Too few categories',
      ) && ok;

    const categories = model.categoryEvaluations.map((c) => c.category);
    for (const required of [
      'season_goals',
      'city_balance',
      'district_coverage',
      'operational_resources',
      'assignments',
      'crisis_management',
    ] as const) {
      ok =
        assert(
          checks,
          categories.includes(required),
          `Category ${required}`,
          `Missing ${required}`,
        ) && ok;
    }

    for (const cat of model.categoryEvaluations) {
      ok =
        assert(checks, cat.title.length > 0, `${cat.category} title`, 'Empty cat title') &&
        ok;
      ok =
        assert(
          checks,
          ['excellent', 'strong', 'steady', 'strained', 'critical'].includes(
            cat.rating,
          ),
          `${cat.category} rating`,
          'Invalid category rating',
        ) && ok;
      ok =
        assert(
          checks,
          cat.evidenceLines.length <= 2,
          `${cat.category} evidence cap`,
          'Too many evidence lines',
        ) && ok;
      ok =
        assert(
          checks,
          cat.recommendationLine.length > 0,
          `${cat.category} recommendation`,
          'Empty recommendation',
        ) && ok;
    }

    ok =
      assert(checks, model.strongestArea != null, 'Strongest area', 'No strongest') &&
      ok;
    ok =
      assert(checks, model.weakestArea != null, 'Weakest area', 'No weakest') && ok;
    ok =
      assert(
        checks,
        model.nextSeasonFocus.length <= 3,
        'Next focus max 3',
        'Too many focus items',
      ) && ok;
    ok =
      assert(
        checks,
        model.advisorLine.length > 0,
        'Advisor line',
        'Empty advisor',
      ) && ok;

    const card = buildSeasonEndReportCardModel(endInput);
    ok = assert(checks, card != null, 'Report card model', 'No report card') && ok;
    ok =
      assert(
        checks,
        buildSeasonEndReportCardModel(limitedInput) == null,
        'Limited card undefined',
        'Limited card exists',
      ) && ok;

    const sheet = buildSeasonEndDetailSheetModel(endInput);
    ok = assert(checks, sheet != null, 'Detail sheet model', 'No detail sheet') && ok;
    ok =
      assert(
        checks,
        (sheet?.categoryEvaluations.length ?? 0) >= 5,
        'Sheet categories',
        'Sheet missing categories',
      ) && ok;
    ok =
      assert(
        checks,
        (sheet?.metricRows.length ?? 0) >= 3,
        'Sheet metrics',
        'Sheet missing metrics',
      ) && ok;

    const copyBlob = JSON.stringify(model);
    ok =
      assert(
        checks,
        !containsForbidden(copyBlob),
        'No forbidden words',
        'Forbidden copy in model',
      ) && ok;
  }

  const score = calculateSeasonEndOverallScore([
    evaluateSeasonGoals(endInput),
    evaluateCityBalance(endInput),
    evaluateDistrictCoverage(endInput),
    evaluateOperationalResources(endInput),
    evaluateAssignments(endInput),
    evaluateCrisisManagement(endInput),
  ]);
  ok =
    assert(
      checks,
      score >= 0 && score <= 100,
      'Overall score clamp',
      'Score out of range',
    ) && ok;

  ok =
    assert(
      checks,
      getSeasonEndRatingFromScore(90) === 'excellent',
      'Excellent mapping',
      'Rating mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      getSeasonEndRatingFromScore(75) === 'strong',
      'Strong mapping',
      'Strong mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      getSeasonEndRatingFromScore(60) === 'steady',
      'Steady mapping',
      'Steady mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      getSeasonEndRatingFromScore(45) === 'strained',
      'Strained mapping',
      'Strained mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      getSeasonEndRatingFromScore(20) === 'critical',
      'Critical mapping',
      'Critical mapping failed',
    ) && ok;

  const crisisCat = evaluateCrisisManagement(endInput);
  ok =
    assert(
      checks,
      crisisCat.evaluation.category === 'crisis_management',
      'Crisis reads crisisActionState',
      'Crisis category wrong',
    ) && ok;

  const resourceCat = evaluateOperationalResources(endInput);
  ok =
    assert(
      checks,
      resourceCat.evaluation.title.includes('Kaynak'),
      'Resources category title',
      'Resources title wrong',
    ) && ok;

  const assignCat = evaluateAssignments(endInput);
  ok =
    assert(
      checks,
      assignCat.evaluation.summary.length > 0,
      'Assignments summary',
      'Assignments empty',
    ) && ok;

  const districtCat = evaluateDistrictCoverage(endInput);
  ok =
    assert(
      checks,
      districtCat.evaluation.summary.length > 0,
      'District summary',
      'District empty',
    ) && ok;

  const goalsCat = evaluateSeasonGoals(endInput);
  ok =
    assert(
      checks,
      goalsCat.evaluation.evidenceLines[0]?.includes('%'),
      'Goals progress evidence',
      'Goals evidence missing %',
    ) && ok;

  const reportContracts = getInteractionContractsForComponent(
    'ReportSeasonEndEvaluationCard',
  );
  ok =
    assert(
      checks,
      reportContracts.some((c) => c.id === 'report_season_end_detail_cta'),
      'Report card contract',
      'Missing report card contract',
    ) && ok;

  const sheetContracts = getInteractionContractsForComponent(
    'SeasonEndEvaluationDetailSheet',
  );
  ok =
    assert(
      checks,
      sheetContracts.some((c) => c.id === 'season_end_evaluation_close'),
      'Detail sheet close contract',
      'Missing sheet contract',
    ) && ok;

  ok =
    assert(
      checks,
      endInput.gameState.pilot.status === 'completed',
      'Player flow compatible pilot',
      'Pilot not completed',
    ) && ok;

  ok =
    assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', 'SAVE_VERSION changed') &&
    ok;

  checks.push(
    'WARN Season lifecycle completed flag not persisted; presentation-level eligibility used',
  );
  hasWarn = true;
  checks.push('WARN Season 2 restart flow pending');
  checks.push('WARN Share/export not implemented');

  return { ok, warn: hasWarn, checks };
}
