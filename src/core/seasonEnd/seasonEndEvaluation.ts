import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { CrisisActionState } from '@/core/crisisActions/crisisActionTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import {
  deriveMainOperationAccessMode,
  ensureMainOperationSeasonForGameState,
} from '@/core/mainOperation/mainOperationEngine';
import {
  MAIN_OPERATION_SEASON_ID,
  MAIN_OPERATION_SEASON_LENGTH_DAYS,
} from '@/core/mainOperation/mainOperationConstants';
import {
  getMainOperationSeasonDay,
} from '@/core/mainOperation/mainOperationState';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import { normalizePostPilotOperationState } from '@/core/postPilot';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';

import {
  SEASON_END_CATEGORY_META,
  SEASON_END_CATEGORY_WEIGHTS,
  SEASON_END_RATING_LABELS,
  SEASON_END_UI_COPY,
  getSeasonEndRatingFromScore,
  getSeasonEndToneFromRating,
} from './seasonEndConstants';
import type {
  SeasonEndCategory,
  SeasonEndCategoryEvaluation,
  SeasonEndEvaluationModel,
  SeasonEndHighlight,
  SeasonEndMetricRow,
  SeasonEndRating,
} from './seasonEndTypes';

export type SeasonEndEvaluationInput = {
  gameState: GameState;
  monetization: MonetizationState;
  mainOperationSeason: MainOperationSeasonState;
  operationSignals?: OperationSignalsState;
  operationalResources?: OperationalResourcesState;
  crisisState?: CrisisState;
  crisisActionState?: CrisisActionState;
  assignments?: AssignmentsState;
  microDecisionState?: MicroDecisionState;
  socialPulseState?: SocialPulseState;
};

type ScoredCategory = {
  score: number;
  evaluation: SeasonEndCategoryEvaluation;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function averageGoalProgress(season: MainOperationSeasonState): number {
  if (season.goals.length === 0) return 0;
  return (
    season.goals.reduce((sum, g) => sum + g.progress, 0) / season.goals.length
  );
}

function countResourcePressure(
  resources: OperationalResourcesState | undefined,
): { critical: number; strained: number } {
  if (!resources) return { critical: 0, strained: 0 };
  let critical = 0;
  let strained = 0;
  const bump = (status: string) => {
    if (status === 'critical') critical += 1;
    else if (status === 'strained' || status === 'busy') strained += 1;
  };
  for (const g of Object.values(resources.personnelGroups)) bump(g.status);
  for (const g of Object.values(resources.vehicleGroups)) bump(g.status);
  for (const n of Object.values(resources.containerNetworksByDistrictId)) {
    bump(n.status);
  }
  return { critical, strained };
}

function buildCategoryEvaluation(
  category: SeasonEndCategory,
  score: number,
  summary: string,
  evidenceLines: string[],
  recommendationLine: string,
): ScoredCategory {
  const rating = getSeasonEndRatingFromScore(score);
  const meta = SEASON_END_CATEGORY_META[category];
  return {
    score,
    evaluation: {
      category,
      title: meta.title,
      rating,
      scoreLabel: `${clampScore(score)}/100`,
      summary,
      evidenceLines: evidenceLines.slice(0, 2),
      recommendationLine,
      tone: getSeasonEndToneFromRating(rating),
      iconKey: meta.iconKey,
    },
  };
}

export function isSeasonEndEligible(input: SeasonEndEvaluationInput): boolean {
  const { gameState, monetization } = input;
  if (gameState.pilot.status !== 'completed') return false;
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) return false;

  const access = deriveMainOperationAccessMode(gameState, monetization);
  if (access !== 'full') return false;

  const season = ensureMainOperationSeasonForGameState({
    gameState,
    monetization,
    mainOperationSeason: input.mainOperationSeason,
    operationSignals: input.operationSignals,
    assignments: input.assignments,
  });
  if (season.accessMode !== 'full') return false;

  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );
  if (postPilot.phase === 'main_operation_light') return false;

  if (season.status === 'completed') return true;

  const seasonDay = getMainOperationSeasonDay(season, gameState.city.day);
  return seasonDay >= season.seasonLengthDays;
}

export function calculateSeasonEndOverallScore(
  scored: ScoredCategory[],
): number {
  if (scored.length === 0) return 0;
  let total = 0;
  let weightSum = 0;
  for (const item of scored) {
    const weight =
      SEASON_END_CATEGORY_WEIGHTS[
        item.evaluation.category as keyof typeof SEASON_END_CATEGORY_WEIGHTS
      ];
    if (weight == null) continue;
    total += item.score * weight;
    weightSum += weight;
  }
  if (weightSum <= 0) return 0;
  return clampScore(total / weightSum);
}

export function evaluateSeasonGoals(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const season = ensureMainOperationSeasonForGameState({
    gameState: input.gameState,
    monetization: input.monetization,
    mainOperationSeason: input.mainOperationSeason,
  });
  const avg = averageGoalProgress(season);
  const completed = season.goals.filter((g) => g.status === 'completed').length;
  const evidence: string[] = [
    `Milestone hedefleri %${Math.round(avg)} seviyesinde ilerledi.`,
  ];
  if (completed > 0) {
    evidence.push(`${completed} hedef tam tamamlandı.`);
  }
  const weakGoal = season.goals.find((g) => g.progress < 40);
  if (weakGoal) {
    evidence.push(`${weakGoal.title} bu operasyon döneminde belirleyici oldu.`);
  }
  const recommendation =
    avg >= 70
      ? 'Sonraki dönemde hedefleri erken ilerletmek için günlük planı koru.'
      : 'Sonraki dönemde hedefleri parçalayarak günlük ilerlemeyi sabitle.';
  return buildCategoryEvaluation(
    'season_goals',
    avg,
    avg >= 70
      ? 'Milestone hedefleri güçlü ilerledi.'
      : avg >= 40
        ? 'Milestone hedefleri ilerledi ama bazı alanlar geride kaldı.'
        : 'Milestone hedefleri zorlayıcı kaldı.',
    evidence,
    recommendation,
  );
}

export function evaluateCityBalance(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const signals = input.operationSignals;
  const crisis = input.crisisState;
  const overall = signals?.overall?.score ?? 50;
  const crisisScore = crisis?.cityCrisisScore ?? 40;
  const pressureBlend = overall * 0.55 + crisisScore * 0.45;
  const score = clampScore(100 - pressureBlend);
  const evidence: string[] = [];
  if (signals?.overall?.status === 'stable') {
    evidence.push('Genel operasyon baskısı dengeli kaldı.');
  } else {
    evidence.push('Genel operasyon baskısı dönem içinde dalgalandı.');
  }
  if (crisis?.riskLevel === 'elevated' || crisis?.riskLevel === 'critical') {
    evidence.push('Bazı günlerde kriz eşiği şehir dengesini zorladı.');
  }
  const recommendation =
    score >= 70
      ? 'Şehir dengesini korumak için plan ve atamayı birlikte oku.'
      : 'Sonraki dönemde şehir baskısını erken günlerde düşürmeye odaklan.';
  return buildCategoryEvaluation(
    'city_balance',
    score,
    score >= 70
      ? 'Operasyon dönemi boyunca şehir dengesi kontrollü kaldı.'
      : 'Şehir dengesi dönem içinde zorlandı.',
    evidence,
    recommendation,
  );
}

export function evaluateDistrictCoverage(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const season = ensureMainOperationSeasonForGameState({
    gameState: input.gameState,
    monetization: input.monetization,
    mainOperationSeason: input.mainOperationSeason,
  });
  const scopes = Object.values(season.districtScopes);
  const active = scopes.filter((s) => s.status === 'active' || s.status === 'agenda');
  const highPressure = scopes.filter((s) => s.pressureScore >= 58);
  const avgPressure =
    active.length > 0
      ? active.reduce((sum, s) => sum + s.pressureScore, 0) / active.length
      : 55;
  const coverageRatio =
    scopes.length > 0 ? active.length / scopes.length : 0.5;
  const score = clampScore(
    coverageRatio * 45 + (100 - avgPressure) * 0.55,
  );
  const evidence: string[] = [];
  if (active.length > 0) {
    const label = getMapDistrictLabel(active[0]!.districtId);
    evidence.push(`Mahalle kapsamı ${label} ve çevresiyle genişledi.`);
  }
  if (highPressure.length > 0) {
    const names = highPressure
      .slice(0, 2)
      .map((s) => getMapDistrictLabel(s.districtId))
      .join(', ');
    evidence.push(`${names} dönem içinde daha fazla izleme istedi.`);
  } else {
    evidence.push('Aktif mahalleler dönem boyunca dengeli izlendi.');
  }
  return buildCategoryEvaluation(
    'district_coverage',
    score,
    score >= 65
      ? 'Mahalle kapsamı operasyonla uyumlu genişledi.'
      : 'Mahalle kapsamı bazı bölgelerde baskı taşıdı.',
    evidence,
    'Sonraki dönemde yüksek baskılı mahalleleri erken gündeme al.',
  );
}

export function evaluateOperationalResources(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const resources = input.operationalResources;
  const { critical, strained } = countResourcePressure(resources);
  const penalty = critical * 14 + strained * 6;
  const score = clampScore(100 - penalty);
  const evidence: string[] = [];
  const summary = resources?.dailySummary;
  if (summary?.personnelLine) {
    evidence.push(summary.personnelLine);
  } else if (critical > 0) {
    evidence.push('Teknik ekip veya saha grupları dönem boyunca yoğun kaldı.');
  } else {
    evidence.push('Saha kaynakları genel olarak dengeli seyretti.');
  }
  if (summary?.containerLine) {
    evidence.push(summary.containerLine);
  } else if (strained > 0) {
    evidence.push('Konteyner ağı bazı mahallelerde baskı üretti.');
  }
  const recommendation =
    critical > 0
      ? 'Sonraki dönem odağı: filo ve konteyner hattı bakımı.'
      : 'Kaynak toparlamasını plan günü başında kontrol et.';
  return buildCategoryEvaluation(
    'operational_resources',
    score,
    score >= 70
      ? 'Saha kaynakları çoğu gün kontrollü kaldı.'
      : 'Saha kaynakları bazı günlerde baskı altında kaldı.',
    evidence,
    recommendation,
  );
}

export function evaluateAssignments(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const summary = input.assignments?.dailyAssignmentSummary;
  const strongFit = summary?.strongFitCount ?? 0;
  const weakFit = summary?.weakFitCount ?? 0;
  const confirmed = summary?.confirmedCount ?? 0;
  let score = 55 + strongFit * 8 - weakFit * 10;
  if (confirmed > 0) {
    score += Math.min(8, confirmed * 2);
  }
  score = clampScore(score);
  const evidence: string[] = [];
  if (strongFit > weakFit) {
    evidence.push('Güçlü uyumlu atamalar operasyon dönemini destekledi.');
  } else if (weakFit > 0) {
    evidence.push('Zayıf atama günleri operasyon dengesini yavaşlattı.');
  } else {
    evidence.push('Atama uyumu dönem boyunca izlendi.');
  }
  if (summary?.dominantDomain) {
    evidence.push(`Baskın etki alanı: ${summary.dominantDomain}.`);
  }
  return buildCategoryEvaluation(
    'assignments',
    score,
    score >= 70
      ? 'Atama uyumu milestone hedeflerini destekledi.'
      : 'Atama uyumu dönem içinde dalgalandı.',
    evidence,
    'Sonraki dönemde zayıf uyumlu günleri erken telafi et.',
  );
}

export function evaluateCrisisManagement(
  input: SeasonEndEvaluationInput,
): ScoredCategory {
  const crisis = input.crisisState;
  const actions = input.crisisActionState;
  const crisisScore = crisis?.cityCrisisScore ?? 50;
  const selectedActions =
    actions?.dailySummary?.selectedCount ??
    Object.values(actions?.actionsById ?? {}).filter((a) => a.status === 'selected')
      .length;
  let score = clampScore(100 - crisisScore * 0.65 + selectedActions * 4);
  if (crisis?.activeIncident?.status === 'active') {
    score -= 12;
  }
  if (crisis?.riskLevel === 'critical') {
    score -= 8;
  }
  score = clampScore(score);
  const evidence: string[] = [];
  if (selectedActions > 0) {
    evidence.push('Kriz hamleleri kritik eşiği sınırladı.');
  } else if (crisis?.recentSignals.length) {
    evidence.push('Kriz sinyalleri izlendi; hamle seçimi sınırlı kaldı.');
  } else {
    evidence.push('Kriz Masası dönem boyunca düşük profilde kaldı.');
  }
  if (crisis?.activeIncident) {
    evidence.push('Dönem sonunda açık bir kriz hattı izleniyor.');
  }
  return buildCategoryEvaluation(
    'crisis_management',
    score,
    score >= 70
      ? 'Kriz yönetimi dönemi dengede tuttu.'
      : 'Kriz yönetimi dönem içinde zorlandı.',
    evidence,
    selectedActions > 0
      ? 'Kriz hamlelerini risk yükselmeden önce seçmeye devam et.'
      : 'Sonraki dönemde kriz hamlelerini daha erken devreye al.',
  );
}

export function evaluateSocialTrust(
  input: SeasonEndEvaluationInput,
): ScoredCategory | undefined {
  const social = input.socialPulseState;
  if (!social?.neighborhoods?.length) return undefined;

  const profiles = Object.values(social.neighborhoods);
  if (profiles.length === 0) return undefined;

  const avgTrust =
    profiles.reduce((sum, p) => sum + p.trust, 0) / profiles.length;
  const highHeat = profiles.filter((p) => p.complaintHeat >= 55).length;
  const score = clampScore(avgTrust - highHeat * 8);
  const evidence: string[] = [
    highHeat > 0
      ? 'Bazı mahallelerde şikâyet ısısı yükseldi.'
      : 'Mahalle tepkisi kontrol altında kaldı.',
  ];
  if (profiles[0]) {
    evidence.push(
      `${getNeighborhoodDisplayName(profiles[0]!.neighborhoodId)} hattı dönem içinde izlendi.`,
    );
  }
  return buildCategoryEvaluation(
    'social_trust',
    score,
    score >= 65
      ? 'Sosyal güven dönem boyunca dengeli kaldı.'
      : 'Sosyal güven bazı mahallelerde zorlandı.',
    evidence,
    'Sonraki dönemde sosyal sinyalleri plan günü başında oku.',
  );
}

export function pickStrongestSeasonArea(
  scored: ScoredCategory[],
): SeasonEndHighlight | undefined {
  if (scored.length === 0) return undefined;
  const best = [...scored].sort((a, b) => b.score - a.score)[0]!;
  return {
    id: `strongest-${best.evaluation.category}`,
    title: 'Dönemin güçlü alanı',
    summary: `${best.evaluation.title}: ${best.evaluation.summary}`,
    tone: best.evaluation.tone,
    iconKey: best.evaluation.iconKey,
  };
}

export function pickWeakestSeasonArea(
  scored: ScoredCategory[],
): SeasonEndHighlight | undefined {
  if (scored.length === 0) return undefined;
  const worst = [...scored].sort((a, b) => a.score - b.score)[0]!;
  return {
    id: `weakest-${worst.evaluation.category}`,
    title: 'Gelişim alanı',
    summary: `${worst.evaluation.title}: ${worst.evaluation.summary}`,
    tone: worst.evaluation.tone,
    iconKey: worst.evaluation.iconKey,
  };
}

export function buildNextSeasonFocus(
  scored: ScoredCategory[],
  _input: SeasonEndEvaluationInput,
): SeasonEndHighlight[] {
  const sorted = [...scored].sort((a, b) => a.score - b.score);
  const picks = sorted.slice(0, 3);
  const focusCopy: Partial<Record<SeasonEndCategory, string>> = {
    operational_resources: 'Sonraki dönem odağı: filo ve konteyner hattı.',
    crisis_management: 'Sonraki dönem odağı: kriz hamlelerini erken seçmek.',
    assignments: 'Sonraki dönem odağı: atama uyumunu güçlendirmek.',
    city_balance: 'Sonraki dönem odağı: şehir baskısını erken düşürmek.',
    district_coverage: 'Sonraki dönem odağı: yüksek baskılı mahalleler.',
    season_goals: 'Sonraki dönem odağı: hedef ilerlemesini sabitlemek.',
    social_trust: 'Sonraki dönem odağı: mahalle iletişimi.',
  };
  return picks.map((item, index) => ({
    id: `focus-${item.evaluation.category}-${index}`,
    title: 'Sonraki dönem odağı',
    summary:
      focusCopy[item.evaluation.category] ??
      item.evaluation.recommendationLine,
    tone: item.evaluation.tone,
    iconKey: item.evaluation.iconKey,
  }));
}

function buildSeasonEndMetricRows(
  input: SeasonEndEvaluationInput,
  goalAvg: number,
): SeasonEndMetricRow[] {
  const summary = input.assignments?.dailyAssignmentSummary;
  const resources = input.operationalResources;
  const crisis = input.crisisState;
  const actions = input.crisisActionState;
  const { critical } = countResourcePressure(resources);

  const rows: SeasonEndMetricRow[] = [
    {
      id: 'metric-season-goals',
      label: 'Milestone hedefi',
      valueLabel: `%${Math.round(goalAvg)}`,
      summary: 'Ortalama milestone hedef ilerlemesi',
      tone: goalAvg >= 70 ? 'positive' : goalAvg >= 40 ? 'neutral' : 'warning',
      iconKey: 'season_goal',
    },
    {
      id: 'metric-crisis',
      label: 'Kriz hamlesi',
      valueLabel: `${actions?.dailySummary?.selectedCount ?? 0} seçim`,
      summary: `Şehir baskı skoru ${Math.round(crisis?.cityCrisisScore ?? 0)}`,
      tone:
        (crisis?.cityCrisisScore ?? 0) < 55
          ? 'positive'
          : (crisis?.cityCrisisScore ?? 0) < 75
            ? 'neutral'
            : 'warning',
      iconKey: 'crisis',
    },
    {
      id: 'metric-resources',
      label: 'Kaynak durumu',
      valueLabel: critical > 0 ? `${critical} kritik grup` : 'Dengeli',
      summary:
        resources?.dailySummary?.vehicleLine ??
        'Filo ve konteyner durumu dönem özeti',
      tone: critical > 0 ? 'warning' : 'positive',
      iconKey: 'operational_resources',
    },
    {
      id: 'metric-assignments',
      label: 'Atama uyumu',
      valueLabel: `${summary?.strongFitCount ?? 0} güçlü / ${summary?.weakFitCount ?? 0} zayıf`,
      summary: 'Son gün atama uyumu özeti',
      tone:
        (summary?.strongFitCount ?? 0) > (summary?.weakFitCount ?? 0)
          ? 'positive'
          : (summary?.weakFitCount ?? 0) > 0
            ? 'warning'
            : 'neutral',
      iconKey: 'assignment',
    },
  ];
  return rows;
}

export function buildSeasonEndAdvisorLine(
  _gameState: GameState,
  model: Pick<SeasonEndEvaluationModel, 'overallRating' | 'weakestArea'>,
): string {
  switch (model.overallRating) {
    case 'excellent':
    case 'strong':
      return 'Bu dönemde şehir dengesi iyi korundu. Sonraki dönemde kaynak baskısını erken okumak daha büyük fark yaratır.';
    case 'steady':
      return 'Dönem genel olarak dengeli geçti. Filo ve konteyner hattını biraz daha erken toparlamak gerekir.';
    case 'strained':
      return 'Milestone hedefleri ilerledi ama kriz ve kaynak baskısı kararlarını zorladı. Sonraki dönem ilk odak bakım ve atama uyumu olmalı.';
    case 'critical':
    default:
      return 'Bu dönemde şehir baskısı yüksek kaldı. Önce kaynakları toparlamak ve kriz hamlelerini daha erken seçmek gerekiyor.';
  }
}

export function buildSeasonEndEvaluationModel(
  input: SeasonEndEvaluationInput,
): SeasonEndEvaluationModel | undefined {
  if (!isSeasonEndEligible(input)) {
    return undefined;
  }

  const season = ensureMainOperationSeasonForGameState({
    gameState: input.gameState,
    monetization: input.monetization,
    mainOperationSeason: input.mainOperationSeason,
    operationSignals: input.operationSignals,
    assignments: input.assignments,
  });

  const scored: ScoredCategory[] = [
    evaluateSeasonGoals(input),
    evaluateCityBalance(input),
    evaluateDistrictCoverage(input),
    evaluateOperationalResources(input),
    evaluateAssignments(input),
    evaluateCrisisManagement(input),
  ];
  const social = evaluateSocialTrust(input);
  if (social) {
    scored.push(social);
  }

  const overallScore = calculateSeasonEndOverallScore(scored);
  const overallRating = getSeasonEndRatingFromScore(overallScore);
  const goalAvg = averageGoalProgress(season);

  const categoryEvaluations = scored.map((s) => s.evaluation);
  const strongestArea = pickStrongestSeasonArea(scored);
  const weakestArea = pickWeakestSeasonArea(scored);
  const nextSeasonFocus = buildNextSeasonFocus(scored, input);

  const model: SeasonEndEvaluationModel = {
    seasonId: season.seasonId ?? MAIN_OPERATION_SEASON_ID,
    title: SEASON_END_UI_COPY.evaluationTitle,
    subtitle: SEASON_END_UI_COPY.evaluationSubtitle,
    overallRating,
    overallScoreLabel: `${overallScore}/100`,
    overallSummary:
      overallRating === 'excellent' || overallRating === 'strong'
        ? 'Ana operasyon bu dönemde kontrollü bir profil gösterdi.'
        : overallRating === 'steady'
          ? 'Dönem özeti dengeli; bazı alanlar güçlü, bazıları izleme istedi.'
          : 'Dönem özeti kaynak ve kriz baskısının kararları zorladığını gösteriyor.',
    completedDayLabel: `${SEASON_END_UI_COPY.completedDayPrefix}: ${season.currentSeasonDay}`,
    categoryEvaluations,
    strongestArea,
    weakestArea,
    nextSeasonFocus,
    metricRows: buildSeasonEndMetricRows(input, goalAvg),
    advisorLine: '',
    footerNote: SEASON_END_UI_COPY.footerNote,
  };

  model.advisorLine = buildSeasonEndAdvisorLine(input.gameState, model);
  return model;
}

export { getSeasonEndRatingFromScore, getSeasonEndToneFromRating } from './seasonEndConstants';

export function formatSeasonEndRatingLabel(rating: SeasonEndRating): string {
  return SEASON_END_RATING_LABELS[rating];
}

export function isSeasonEndReadyForPresentation(
  input: SeasonEndEvaluationInput,
): boolean {
  return isSeasonEndEligible(input);
}

export const SEASON_END_EXPECTED_LENGTH_DAYS = MAIN_OPERATION_SEASON_LENGTH_DAYS;
