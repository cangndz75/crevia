import { clampMetric } from '@/core/game/clamp';
import { districtProfiles } from '@/core/content/districtProfiles';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { PersonnelState } from '@/core/personnel/personnelTypes';

import {
  BUDGET_EFFICIENCY_LOW_RATIO,
  BUDGET_EFFICIENCY_SATISFACTION_PER_SPEND_UNIT,
  BUTTERFLY_PARTIAL_DECISION_CAP,
  BUTTERFLY_PARTIAL_PENALTY_PER,
  BUTTERFLY_PERMANENT_BONUS_PER,
  CATEGORY_SCORE_WEIGHTS,
  COMPLAINT_MIN_COMPLETED_EVENTS,
  DEFAULT_COMPONENT_SCORE,
  DEFAULT_NEIGHBORHOOD_DIFFICULTY,
  LEADERBOARD_BASE_MAX,
  LEADERBOARD_BASE_TO_POINTS,
  LEADERBOARD_MAX_SCORE,
  LEADERBOARD_MIN_SCORE,
  LEADERBOARD_TITLE_THRESHOLDS,
  NEIGHBORHOOD_DIFFICULTY_MULTIPLIERS,
  NEIGHBORHOOD_DISPLAY_NAMES,
  NEIGHBORHOOD_FIT_MATCH_BONUS,
  NEIGHBORHOOD_FIT_MISMATCH_PENALTY,
  PENALTY_CRITICAL_FATIGUE_AMOUNT,
  PENALTY_CRITICAL_FATIGUE_THRESHOLD,
  PENALTY_HIGH_RISK_AMOUNT,
  PENALTY_HIGH_RISK_THRESHOLD,
  PENALTY_NEGATIVE_BUDGET_AMOUNT,
  PENALTY_REPEATED_PROBLEM_AMOUNT,
  PENALTY_REPEATED_PROBLEM_THRESHOLD,
  PENALTY_SOCIAL_MEDIA_RISK_AMOUNT,
  PENALTY_SOCIAL_MEDIA_RISK_THRESHOLD,
  PENALTY_TEMPORARY_SOLUTION_AMOUNT,
  PENALTY_TEMPORARY_SOLUTION_THRESHOLD,
  PERSONNEL_FATIGUE_CRITICAL,
  PERSONNEL_FATIGUE_WARNING,
  PERSONNEL_MORALE_LOW,
  SCORE_WEIGHTS,
} from './leaderboardConstants';
import type {
  LeaderboardCategory,
  LeaderboardPenalty,
  LeaderboardScoreBreakdown,
  LeaderboardScoreInput,
  LeaderboardScoreResult,
} from './leaderboardTypes';

const PILOT_DISTRICT_TO_NEIGHBORHOOD: Record<PilotDistrictId, string> = {
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  industrial_market: 'sanayi',
};

const PARTIAL_DECISION_MARKERS = ['partial', 'gecici', 'temporary', 'quick_fix'];
const PERMANENT_DECISION_MARKERS = ['permanent', 'kalici', 'planned', 'root_fix'];

export function clampScore(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function normalizeMetric(value: number): number {
  return clampMetric(value);
}

export function invertRisk(value: number): number {
  return clampMetric(100 - normalizeMetric(value));
}

export function getNeighborhoodDifficultyMultiplier(neighborhoodId: string): number {
  const key = neighborhoodId.trim().toLowerCase();
  return NEIGHBORHOOD_DIFFICULTY_MULTIPLIERS[key] ?? DEFAULT_NEIGHBORHOOD_DIFFICULTY;
}

export function getLeaderboardTitle(score: number): string {
  const clamped = clampScore(score, LEADERBOARD_MIN_SCORE, LEADERBOARD_MAX_SCORE);
  for (const tier of LEADERBOARD_TITLE_THRESHOLDS) {
    if (clamped >= tier.minScore) {
      return tier.title;
    }
  }
  return LEADERBOARD_TITLE_THRESHOLDS[LEADERBOARD_TITLE_THRESHOLDS.length - 1]
    .title;
}

function resolveStartingBudget(
  gameState: GameState,
  snapshots?: DaySnapshot[],
): number {
  const fromSnapshot = snapshots?.[0]?.metrics?.budget;
  if (fromSnapshot != null && fromSnapshot > 0) {
    return fromSnapshot;
  }
  const districtId = gameState.pilot.selectedDistrictId;
  if (districtId) {
    const profileBudget = districtProfiles[districtId]?.startingMetrics.budget;
    if (profileBudget != null && profileBudget > 0) {
      return profileBudget;
    }
  }
  const fallback = gameState.city.budget;
  return fallback > 0 ? fallback : 1;
}

export function resolveLeaderboardNeighborhood(
  gameState: GameState,
): { neighborhoodId: string; neighborhoodName: string } {
  const districtId = gameState.pilot.selectedDistrictId;
  if (districtId && districtId in PILOT_DISTRICT_TO_NEIGHBORHOOD) {
    const neighborhoodId = PILOT_DISTRICT_TO_NEIGHBORHOOD[districtId as PilotDistrictId];
    const profileName = districtProfiles[districtId]?.shortName;
    return {
      neighborhoodId,
      neighborhoodName:
        NEIGHBORHOOD_DISPLAY_NAMES[neighborhoodId] ?? profileName ?? neighborhoodId,
    };
  }

  const runDistrict = gameState.pilot.run?.selectedDistrictId;
  if (runDistrict && runDistrict in PILOT_DISTRICT_TO_NEIGHBORHOOD) {
    const neighborhoodId =
      PILOT_DISTRICT_TO_NEIGHBORHOOD[runDistrict as PilotDistrictId];
    return {
      neighborhoodId,
      neighborhoodName:
        NEIGHBORHOOD_DISPLAY_NAMES[neighborhoodId] ?? runDistrict,
    };
  }

  return { neighborhoodId: 'merkez', neighborhoodName: 'Merkez' };
}

function decisionLooksPartial(decisionId: string, decisionLabel: string): boolean {
  const haystack = `${decisionId} ${decisionLabel}`.toLowerCase();
  return PARTIAL_DECISION_MARKERS.some((marker) => haystack.includes(marker));
}

function decisionLooksPermanent(decisionId: string, decisionLabel: string): boolean {
  const haystack = `${decisionId} ${decisionLabel}`.toLowerCase();
  return PERMANENT_DECISION_MARKERS.some((marker) => haystack.includes(marker));
}

function countPartialDecisions(decisionHistory: DecisionRecord[]): number {
  let count = 0;
  for (const record of decisionHistory) {
    if (decisionLooksPartial(record.decisionId, record.decisionLabel)) {
      count += 1;
      continue;
    }
    const styleFlag = inferPartialFromFlags(record);
    if (styleFlag) {
      count += 1;
    }
  }
  return count;
}

function countPermanentDecisions(decisionHistory: DecisionRecord[]): number {
  return decisionHistory.filter((record) =>
    decisionLooksPermanent(record.decisionId, record.decisionLabel),
  ).length;
}

function inferPartialFromFlags(record: DecisionRecord): boolean {
  return record.decisionId.includes('-partial') || record.decisionId.endsWith('_partial');
}

function computeBudgetEfficiency(
  gameState: GameState,
  decisionHistory: DecisionRecord[],
  snapshots?: DaySnapshot[],
  economySpent?: number,
): number {
  const currentBudget = gameState.city.budget;
  const startingBudget = resolveStartingBudget(gameState, snapshots);
  const preservation =
    startingBudget > 0
      ? clampMetric((currentBudget / startingBudget) * 100)
      : 0;

  let satisfactionGain = 0;
  let budgetSpent = 0;
  for (const record of decisionHistory) {
    const sat = record.appliedEffects.publicSatisfaction ?? 0;
    if (sat > 0) {
      satisfactionGain += sat;
    }
    const cost = record.appliedCosts?.budget ?? record.appliedEffects.budget ?? 0;
    if (cost < 0) {
      budgetSpent += Math.abs(cost);
    }
  }

  if (economySpent != null && economySpent > budgetSpent) {
    budgetSpent = economySpent;
  }

  const spendUnits = Math.max(budgetSpent / 1000, 1);
  const valueRatio = satisfactionGain / spendUnits;
  const valueScore = clampMetric(valueRatio * BUDGET_EFFICIENCY_SATISFACTION_PER_SPEND_UNIT * 100);

  const lowBudgetPenalty =
    preservation < BUDGET_EFFICIENCY_LOW_RATIO * 100
      ? (BUDGET_EFFICIENCY_LOW_RATIO * 100 - preservation) * 0.35
      : 0;

  const raw =
    preservation * 0.42 +
    valueScore * 0.38 +
    clampMetric(100 - lowBudgetPenalty) * 0.2;

  return clampMetric(raw);
}

function computePersonnelSustainability(
  gameState: GameState,
  personnelState: PersonnelState,
): number {
  const teams = personnelState.teams;
  if (teams.length === 0) {
    return normalizeMetric(gameState.city.morale);
  }

  const avgFatigue =
    teams.reduce((sum, team) => sum + team.fatigue, 0) / teams.length;
  const avgMorale =
    teams.reduce((sum, team) => sum + team.morale, 0) / teams.length;
  const fatigueControl = invertRisk(avgFatigue);
  const moraleScore = normalizeMetric((avgMorale + gameState.city.morale) / 2);

  const restUsage = teams.filter(
    (team) => team.restMode === 'full_rest' || team.restMode === 'light_duty',
  ).length;
  const restBonus = clampMetric((restUsage / teams.length) * 25);

  const riskyCount = teams.filter(
    (team) =>
      team.status === 'risky' ||
      team.status === 'exhausted' ||
      team.warningTags.includes('risky_fatigue'),
  ).length;
  const riskPenalty = clampMetric(riskyCount * 12);

  const highFatigueCount = teams.filter(
    (team) => team.fatigue >= PERSONNEL_FATIGUE_WARNING,
  ).length;
  const fatiguePenalty = clampMetric(highFatigueCount * 8);

  const lowMoralePenalty =
    avgMorale < PERSONNEL_MORALE_LOW ? clampMetric(PERSONNEL_MORALE_LOW - avgMorale) : 0;

  const incidentPenalty = clampMetric(
    (personnelState.dayIncidents?.length ?? 0) * 6,
  );

  const raw =
    fatigueControl * 0.3 +
    moraleScore * 0.3 +
    restBonus * 0.15 +
    100 -
    riskPenalty -
    fatiguePenalty -
    lowMoralePenalty -
    incidentPenalty;

  return clampMetric(raw);
}

function computeComplaintResolution(
  gameState: GameState,
  decisionHistory: DecisionRecord[],
): number {
  const completedCount = Math.max(
    gameState.pilot.completedEventIds.length,
    COMPLAINT_MIN_COMPLETED_EVENTS,
  );
  const solvedRatio =
    (gameState.solvedEvents.length / completedCount) * 100;

  let positiveResolution = 0;
  let neutralOrNegative = 0;
  for (const record of decisionHistory) {
    const sat = record.appliedEffects.publicSatisfaction ?? 0;
    const trust = record.appliedEffects.trust ?? 0;
    if (sat > 0 || trust > 0) {
      positiveResolution += 1;
    } else if (sat < 0 || (record.appliedEffects.risk ?? 0) > 0) {
      neutralOrNegative += 1;
    }
  }

  const historyTotal = decisionHistory.length || 1;
  const decisionQuality = (positiveResolution / historyTotal) * 100;
  const penalty = (neutralOrNegative / historyTotal) * 20;

  const pilotHistoryBoost = gameState.pilot.run
    ? clampMetric(
        (gameState.pilot.run.eventHistory.filter(
          (entry) =>
            (entry.effects.publicSatisfaction ?? 0) > 0 ||
            (entry.effects.trust ?? 0) > 0,
        ).length /
          Math.max(gameState.pilot.run.eventHistory.length, 1)) *
          100,
      )
    : DEFAULT_COMPONENT_SCORE;

  const raw =
    solvedRatio * 0.35 +
    decisionQuality * 0.35 +
    pilotHistoryBoost * 0.2 +
    clampMetric(100 - penalty) * 0.1;

  return clampMetric(raw);
}

function computeButterflyControl(
  gameState: GameState,
  decisionHistory: DecisionRecord[],
): number {
  if (decisionHistory.length === 0 && !gameState.pilot.run?.eventHistory.length) {
    return DEFAULT_COMPONENT_SCORE;
  }

  const partialCount = Math.min(
    countPartialDecisions(decisionHistory),
    BUTTERFLY_PARTIAL_DECISION_CAP,
  );
  const permanentCount = countPermanentDecisions(decisionHistory);

  const butterflyEvents = decisionHistory.filter((record) =>
    record.eventId.toLowerCase().includes('butterfly'),
  ).length;

  const negativeFlags = Object.entries(gameState.pilot.flags).filter(
    ([key, value]) =>
      key.toLowerCase().includes('butterfly') &&
      (value === 'partial' || value === 'risky' || value === 'fast'),
  ).length;

  let score = DEFAULT_COMPONENT_SCORE;
  score += permanentCount * BUTTERFLY_PERMANENT_BONUS_PER;
  score -= partialCount * BUTTERFLY_PARTIAL_PENALTY_PER;
  score -= butterflyEvents * 3;
  score -= negativeFlags * 5;

  if (gameState.pilot.flags.day1ResponseStyle === 'partial') {
    score -= 6;
  }
  if (gameState.pilot.flags.day1ResponseStyle === 'planned') {
    score += 4;
  }

  return clampMetric(score);
}

function computeNeighborhoodFit(
  gameState: GameState,
  decisionHistory: DecisionRecord[],
): number {
  const { neighborhoodId } = resolveLeaderboardNeighborhood(gameState);
  const relevant = decisionHistory.filter(
    (record) => record.neighborhoodId != null || record.neighborhoodName != null,
  );

  if (relevant.length === 0) {
    return DEFAULT_COMPONENT_SCORE;
  }

  let matches = 0;
  let mismatches = 0;
  for (const record of relevant) {
    const recordId = (record.neighborhoodId ?? record.neighborhoodName ?? '')
      .trim()
      .toLowerCase();
    if (!recordId) {
      continue;
    }
    if (recordId.includes(neighborhoodId) || neighborhoodId.includes(recordId)) {
      matches += 1;
    } else {
      mismatches += 1;
    }
  }

  if (matches === 0 && mismatches === 0) {
    return DEFAULT_COMPONENT_SCORE;
  }

  const raw =
    DEFAULT_COMPONENT_SCORE +
    matches * NEIGHBORHOOD_FIT_MATCH_BONUS -
    mismatches * NEIGHBORHOOD_FIT_MISMATCH_PENALTY;

  return clampMetric(raw);
}

function weightedBaseScore(
  breakdown: LeaderboardScoreBreakdown,
  category: LeaderboardCategory,
): number {
  const overrides = CATEGORY_SCORE_WEIGHTS[category];
  const weights = { ...SCORE_WEIGHTS, ...overrides };
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weighted =
    breakdown.citizenSatisfaction * weights.citizenSatisfaction +
    breakdown.riskControl * weights.riskControl +
    breakdown.budgetEfficiency * weights.budgetEfficiency +
    breakdown.personnelSustainability * weights.personnelSustainability +
    breakdown.complaintResolution * weights.complaintResolution +
    breakdown.butterflyControl * weights.butterflyControl +
    breakdown.neighborhoodFit * weights.neighborhoodFit;

  return clampMetric(Math.round(weighted / totalWeight * 100) / 100);
}

export function calculateScoreBreakdown(
  input: LeaderboardScoreInput,
): LeaderboardScoreBreakdown {
  const { gameState, personnelState, decisionHistory, snapshots, economyState } =
    input;

  return {
    citizenSatisfaction: normalizeMetric(gameState.city.publicSatisfaction),
    riskControl: invertRisk(gameState.city.riskScore ?? 0),
    budgetEfficiency: computeBudgetEfficiency(
      gameState,
      decisionHistory,
      snapshots,
      economyState?.totalSpent,
    ),
    personnelSustainability: computePersonnelSustainability(
      gameState,
      personnelState,
    ),
    complaintResolution: computeComplaintResolution(gameState, decisionHistory),
    butterflyControl: computeButterflyControl(gameState, decisionHistory),
    neighborhoodFit: computeNeighborhoodFit(gameState, decisionHistory),
  };
}

function estimateSocialMediaRisk(
  gameState: GameState,
  decisionHistory: DecisionRecord[],
): number {
  const districtId = gameState.pilot.selectedDistrictId;
  const districtPressure =
    districtId != null
      ? (districtProfiles[districtId]?.eventBias.socialPressureMultiplier ?? 1) *
        50
      : 50;

  const socialEvents = decisionHistory.filter((record) =>
    record.eventId.toLowerCase().includes('social'),
  ).length;

  const riskFromCity = normalizeMetric(gameState.city.riskScore ?? 0);
  const partialSocial = decisionHistory.filter(
    (record) =>
      record.eventId.toLowerCase().includes('social') &&
      decisionLooksPartial(record.decisionId, record.decisionLabel),
  ).length;

  return clampMetric(
    riskFromCity * 0.55 +
      districtPressure * 0.2 +
      socialEvents * 8 +
      partialSocial * 12,
  );
}

function repeatedProblemTypeCount(decisionHistory: DecisionRecord[]): number {
  const buckets = new Map<string, number>();
  for (const record of decisionHistory) {
    const key = record.eventId.replace(/\d+/g, '').toLowerCase();
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  let repeats = 0;
  for (const count of buckets.values()) {
    if (count >= PENALTY_REPEATED_PROBLEM_THRESHOLD) {
      repeats += 1;
    }
  }
  return repeats;
}

export function calculateLeaderboardPenalties(
  input: LeaderboardScoreInput,
): LeaderboardPenalty[] {
  const { gameState, personnelState, decisionHistory } = input;
  const penalties: LeaderboardPenalty[] = [];

  const maxFatigue = personnelState.teams.reduce(
    (max, team) => Math.max(max, team.fatigue),
    0,
  );
  if (maxFatigue >= PENALTY_CRITICAL_FATIGUE_THRESHOLD) {
    penalties.push({
      key: 'critical_fatigue',
      label: 'Kritik personel yorgunluğu',
      amount: PENALTY_CRITICAL_FATIGUE_AMOUNT,
      reason: `Pilot sonunda ekip yorgunluğu ${Math.round(maxFatigue)} seviyesinde kaldı.`,
    });
  }

  const riskScore = normalizeMetric(gameState.city.riskScore ?? 0);
  if (riskScore >= PENALTY_HIGH_RISK_THRESHOLD) {
    penalties.push({
      key: 'high_operation_risk',
      label: 'Yüksek operasyon riski',
      amount: PENALTY_HIGH_RISK_AMOUNT,
      reason: `Operasyon riski ${Math.round(riskScore)} — kontrol zayıfladı.`,
    });
  }

  if (gameState.city.budget < 0) {
    penalties.push({
      key: 'negative_budget',
      label: 'Bütçe açığı',
      amount: PENALTY_NEGATIVE_BUDGET_AMOUNT,
      reason: 'Kaynak dengesi negatife düştü.',
    });
  }

  const partialCount = countPartialDecisions(decisionHistory);
  if (partialCount >= PENALTY_TEMPORARY_SOLUTION_THRESHOLD) {
    penalties.push({
      key: 'temporary_solutions',
      label: 'Geçici çözüm eğilimi',
      amount: PENALTY_TEMPORARY_SOLUTION_AMOUNT,
      reason: `${partialCount} geçici müdahale kararı operasyonel borç oluşturdu.`,
    });
  }

  const socialRisk = estimateSocialMediaRisk(gameState, decisionHistory);
  if (socialRisk >= PENALTY_SOCIAL_MEDIA_RISK_THRESHOLD) {
    penalties.push({
      key: 'social_media_pressure',
      label: 'Sosyal medya baskısı',
      amount: PENALTY_SOCIAL_MEDIA_RISK_AMOUNT,
      reason: `Sosyal algı riski ${Math.round(socialRisk)} — iletişim baskısı yükseldi.`,
    });
  }

  const repeatedProblems = repeatedProblemTypeCount(decisionHistory);
  if (repeatedProblems > 0) {
    penalties.push({
      key: 'repeated_problems',
      label: 'Tekrarlayan sorun tipi',
      amount: PENALTY_REPEATED_PROBLEM_AMOUNT * repeatedProblems,
      reason: `${repeatedProblems} olay tipi pilot boyunca tekrar etti.`,
    });
  }

  const exhaustedTeams = personnelState.teams.filter(
    (team) => team.fatigue >= PERSONNEL_FATIGUE_CRITICAL,
  ).length;
  if (
    exhaustedTeams > 0 &&
    !penalties.some((penalty) => penalty.key === 'critical_fatigue')
  ) {
    penalties.push({
      key: 'personnel_exhaustion',
      label: 'Personel tükenmesi',
      amount: Math.round(PENALTY_CRITICAL_FATIGUE_AMOUNT * 0.45),
      reason: `${exhaustedTeams} ekip kritik yorgunluk bandında.`,
    });
  }

  return penalties;
}

export function calculateLeaderboardScore(
  input: LeaderboardScoreInput,
): LeaderboardScoreResult {
  const category = input.category ?? 'overall';
  const breakdown = calculateScoreBreakdown(input);
  const baseScore = weightedBaseScore(breakdown, category);
  const { neighborhoodId, neighborhoodName } = resolveLeaderboardNeighborhood(
    input.gameState,
  );
  const difficultyMultiplier = getNeighborhoodDifficultyMultiplier(neighborhoodId);
  const penalties = calculateLeaderboardPenalties(input);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);

  const rawPoints =
    baseScore * LEADERBOARD_BASE_TO_POINTS * difficultyMultiplier - penaltyTotal;
  const score = clampScore(
    Math.round(rawPoints),
    LEADERBOARD_MIN_SCORE,
    LEADERBOARD_MAX_SCORE,
  );
  const title = getLeaderboardTitle(score);

  return {
    baseScore: clampMetric(baseScore),
    score,
    difficultyMultiplier,
    penalties,
    penaltyTotal,
    breakdown,
    title,
    neighborhoodId,
    neighborhoodName,
  };
}

/** Kategori odaklı skor — mock sıralama ve çoklu leaderboard görünümü için. */
export function calculateCategoryScore(
  breakdown: LeaderboardScoreBreakdown,
  category: LeaderboardCategory,
  difficultyMultiplier: number,
  penaltyTotal: number,
): number {
  const baseScore = weightedBaseScore(breakdown, category);
  const rawPoints =
    baseScore * LEADERBOARD_BASE_TO_POINTS * difficultyMultiplier - penaltyTotal;
  return clampScore(
    Math.round(rawPoints),
    LEADERBOARD_MIN_SCORE,
    LEADERBOARD_MAX_SCORE,
  );
}

/** Test senaryoları için karar stilini dışarıdan işaretleme — production akışını etkilemez. */
export function isPartialStyleDecision(decision: Pick<EventDecision, 'id' | 'decisionStyle'>): boolean {
  if (decision.decisionStyle === 'partial') {
    return true;
  }
  return decisionLooksPartial(decision.id, decision.id);
}
