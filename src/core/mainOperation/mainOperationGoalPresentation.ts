import type { AdvisorState } from '@/core/advisors/advisorTypes';
import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import { MAIN_OPERATION_UI_COPY } from './mainOperationConstants';
import {
  deriveMainOperationAccessMode,
  ensureMainOperationSeasonForGameState,
} from './mainOperationEngine';
import { getActiveMainOperationDistrictIds } from './mainOperationState';
import type {
  MainOperationEngineInput,
  MainOperationGoalDomain,
  MainOperationHubGoalRowTone,
  MainOperationSeasonGoal,
} from './mainOperationTypes';

export type MainOperationGoalTone = MainOperationHubGoalRowTone;

export type MainOperationGoalInsight = {
  goalId: string;
  domain: MainOperationGoalDomain;
  title: string;
  progressLabel: string;
  progressRatio: number;
  statusLabel: string;
  tone: MainOperationGoalTone;
  todayDeltaLabel: string;
  sourceLine: string;
  recommendationLine: string;
  iconKey: string;
};

export type MainOperationGoalDetailModel = {
  goalId: string;
  title: string;
  description: string;
  progressLabel: string;
  progressRatio: number;
  statusLabel: string;
  tone: MainOperationGoalTone;
  sourceRows: Array<{
    id: string;
    label: string;
    value: string;
    summary: string;
    tone: MainOperationGoalTone;
    iconKey: string;
  }>;
  sourceLine: string;
  recommendationLine: string;
  footerNote: string;
};

export type MainOperationSeasonDetailModel = {
  title: string;
  subtitle: string;
  seasonDayLabel: string;
  accessLabel: string;
  topInsightLine: string;
  goalDetails: MainOperationGoalDetailModel[];
  footerNote: string;
};

export type MainOperationGoalPresentationInput = MainOperationEngineInput & {
  crisisState?: CrisisState;
  dailyOperationsPlan?: DailyOperationsPlanState;
  microDecisionState?: MicroDecisionState;
  advisorState?: AdvisorState;
};

export type ReportMainOperationSeasonModel = {
  title: string;
  subtitle: string;
  seasonDayLabel: string;
  topLine: string;
  lines: string[];
  goalChips: Array<{
    id: string;
    label: string;
    value: string;
    tone: MainOperationGoalTone;
  }>;
  footerNote: string;
  tone: MainOperationGoalTone;
  visible: boolean;
};

export function getMainOperationGoalTone(
  progress: number,
  status: string,
): string {
  if (status === 'completed') return 'positive';
  if (progress >= 60) return 'positive';
  if (progress >= 30) return 'neutral';
  return 'warning';
}

function goalIconKey(domain: MainOperationGoalDomain): string {
  switch (domain) {
    case 'city_balance':
      return 'pulse';
    case 'districts':
      return 'location';
    case 'vehicles':
      return 'car';
    case 'assignments':
      return 'people';
    default:
      return 'flag';
  }
}

function statusLabelForGoal(goal: MainOperationSeasonGoal): string {
  if (goal.status === 'completed') return 'Tamamlandı';
  if (goal.progress >= 70) return 'İyi gidiyor';
  if (goal.progress >= 40) return 'İzleniyor';
  return 'Dikkat istiyor';
}

function toneFromGoal(goal: MainOperationSeasonGoal): MainOperationGoalTone {
  const base = getMainOperationGoalTone(goal.progress, goal.status);
  if (goal.status === 'failed') return 'critical';
  if (goal.progress < 30) return 'warning';
  return base as MainOperationGoalTone;
}

function sourceLineForGoal(
  goal: MainOperationSeasonGoal,
  input: MainOperationGoalPresentationInput,
): string {
  const signals = input.operationSignals;
  const crisis = input.crisisState;
  const plan = input.dailyOperationsPlan;
  const assignments = input.assignments;
  const season = ensureMainOperationSeasonForGameState(input);
  const micro = input.microDecisionState?.dailySummary;

  switch (goal.domain) {
    case 'city_balance': {
      const risk = crisis?.riskLevel ?? 'stable';
      if (risk === 'elevated' || risk === 'critical' || crisis?.activeIncident) {
        return 'Şehir dengesi bugün operasyon sinyalleri ve kriz eşiğiyle şekillendi.';
      }
      if (micro && micro.resolvedCount > 0) {
        return 'Gün içi canlı operasyon kararları genel dengeye küçük etki verdi.';
      }
      return 'Şehir dengesi operasyon sinyalleri ve günlük plan odağıyla izleniyor.';
    }
    case 'districts': {
      const active = getActiveMainOperationDistrictIds(season);
      const names = active.slice(0, 2).map((id) => getNeighborhoodDisplayName(id));
      const focus = plan?.districtFocusId
        ? getNeighborhoodDisplayName(plan.districtFocusId)
        : null;
      if (names.length > 0) {
        return `Mahalle kapsamı, ${names.join(' ve ')} sinyalleriyle öne çıktı${
          focus ? `; plan odağı ${focus}.` : '.'
        }`;
      }
      return 'Mahalle kapsamı sezon gündemi ve bölge sinyalleriyle genişliyor.';
    }
    case 'vehicles': {
      const vf = plan?.vehicleFocus;
      if (signals?.vehicles.status === 'strained' || signals?.vehicles.status === 'critical') {
        return 'Filo hedefi araç baskısı ve saha tercihleri arasında dengeleniyor.';
      }
      if (vf === 'preventive_maintenance') {
        return 'Filo hedefi önleyici bakım odağı ve atama yüküyle ilerliyor.';
      }
      return 'Filo hedefi günlük plan araç odağı ve saha sinyalleriyle şekilleniyor.';
    }
    case 'assignments': {
      const summary = assignments?.dailyAssignmentSummary;
      if (summary && summary.weakFitCount > summary.strongFitCount) {
        return 'Saha ataması hedefi zayıf uyumlu kararlar nedeniyle baskı altında.';
      }
      if (summary && summary.strongFitCount > 0) {
        return 'Saha ataması hedefi güçlü uyumlu kararlarla ilerledi.';
      }
      return 'Saha ataması hedefi günlük atama özeti ve olay uyumuna bağlı.';
    }
    default:
      return 'Sezon hedefi bugünkü operasyon kararlarıyla güncellendi.';
  }
}

function recommendationForGoal(
  goal: MainOperationSeasonGoal,
  input: MainOperationGoalPresentationInput,
): string {
  const signals = input.operationSignals;
  const plan = input.dailyOperationsPlan;
  const crisis = input.crisisState;

  switch (goal.domain) {
    case 'city_balance':
      if (crisis?.riskLevel === 'elevated' || crisis?.riskLevel === 'critical') {
        return 'Yarın genel baskı yükselirse planı tek mahalle yerine araç ve konteyner zincirine göre kur.';
      }
      return 'Yarın operasyon sinyallerini sabah planıyla birlikte oku; ani sıçramalarda mikro karar ver.';
    case 'districts': {
      const strained = signals?.districts.status === 'strained' || signals?.districts.status === 'critical';
      if (strained) {
        return 'Yarın mahalle sinyali yükselirse temsilci ve sosyal tepki kararlarını izle.';
      }
      const focus = plan?.districtFocusId;
      if (focus) {
        return `Yarın plan odağını ${getNeighborhoodDisplayName(focus)} ile uyumlu tut; gündem mahallesini atlama.`;
      }
      return 'Yarın aktifleşen mahalle ile plan odağını aynı hatta tut.';
    }
    case 'vehicles':
      if ((signals?.vehicles.score ?? 0) >= 55) {
        return 'Yarın araç baskısı yükselirse önleyici bakım odağı seç.';
      }
      return 'Yarın yüksek kapasite ile önleyici bakım arasında dengeli araç odağı kullan.';
    case 'assignments': {
      const weak = input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;
      if (weak > 0) {
        return 'Yarın zayıf atamaları azaltmak için ekip ve araç uyumunu birlikte değerlendir.';
      }
      return 'Yarın güçlü uyumu korumak için atamayı plan odağıyla aynı günde onayla.';
    }
    default:
      return 'Yarınki plan sezon hedeflerine göre yeniden şekillenir.';
  }
}

function todayDeltaLabel(goal: MainOperationSeasonGoal): string {
  if (goal.status === 'completed') return 'Bugün hedef tamamlandı';
  if (goal.progress >= 60) return 'Bugün iyi ilerleme';
  if (goal.progress >= 35) return 'Bugün dengeli ilerleme';
  return 'Bugün yavaş ilerleme';
}

function buildSourceRows(
  goal: MainOperationSeasonGoal,
  input: MainOperationGoalPresentationInput,
): MainOperationGoalDetailModel['sourceRows'] {
  const rows: MainOperationGoalDetailModel['sourceRows'] = [];
  const signals = input.operationSignals;
  const plan = input.dailyOperationsPlan;
  const assignments = input.assignments;
  const crisis = input.crisisState;

  if (signals) {
    rows.push({
      id: 'signals',
      label: 'Operasyon sinyalleri',
      value: signals.overall.status,
      summary: `Genel baskı ${signals.overall.score}`,
      tone:
        signals.overall.status === 'stable' || signals.overall.status === 'watch'
          ? 'neutral'
          : 'warning',
      iconKey: 'pulse',
    });
  }
  if (plan?.status === 'confirmed') {
    rows.push({
      id: 'plan',
      label: 'Günlük plan',
      value: 'Onaylandı',
      summary: 'Plan odağı bugünkü kararlara rehber oldu.',
      tone: 'positive',
      iconKey: 'calendar',
    });
  }
  if (assignments?.dailyAssignmentSummary) {
    const s = assignments.dailyAssignmentSummary;
    rows.push({
      id: 'assignments',
      label: 'Saha ataması',
      value: `${s.confirmedCount} onaylı`,
      summary: `${s.strongFitCount} güçlü, ${s.weakFitCount} zayıf uyum`,
      tone: s.weakFitCount > 0 ? 'warning' : 'positive',
      iconKey: 'people',
    });
  }
  if (crisis && crisis.riskLevel !== 'stable') {
    rows.push({
      id: 'crisis',
      label: 'Kriz eşiği',
      value: crisis.riskLevel,
      summary: crisis.activeIncident?.title ?? 'Şehir baskısı izleniyor',
      tone: crisis.riskLevel === 'critical' ? 'critical' : 'warning',
      iconKey: 'alert-circle',
    });
  }
  if (input.microDecisionState?.dailySummary?.resolvedCount) {
    rows.push({
      id: 'micro',
      label: 'Canlı operasyon',
      value: `${input.microDecisionState.dailySummary.resolvedCount} karar`,
      summary: 'Gün içi mikro kararlar hedefe küçük katkı verdi.',
      tone: 'neutral',
      iconKey: 'flash',
    });
  }

  if (rows.length === 0) {
    rows.push({
      id: 'fallback',
      label: 'Sezon izleme',
      value: 'Aktif',
      summary: 'Bugünkü veriler henüz sınırlı; hedef izleniyor.',
      tone: 'neutral',
      iconKey: 'flag',
    });
  }

  return rows.slice(0, 4);
}

export function buildMainOperationGoalInsights(
  input: MainOperationGoalPresentationInput,
): MainOperationGoalInsight[] {
  const season = ensureMainOperationSeasonForGameState(input);
  if (season.accessMode !== 'full' || season.status !== 'active') {
    return [];
  }

  return season.goals.map((goal) => ({
    goalId: goal.id,
    domain: goal.domain,
    title: goal.title,
    progressLabel: `%${goal.progress}`,
    progressRatio: Math.min(1, Math.max(0, goal.progress / 100)),
    statusLabel: statusLabelForGoal(goal),
    tone: toneFromGoal(goal),
    todayDeltaLabel: todayDeltaLabel(goal),
    sourceLine: sourceLineForGoal(goal, input),
    recommendationLine: recommendationForGoal(goal, input),
    iconKey: goalIconKey(goal.domain),
  }));
}

export function buildMainOperationGoalDetail(
  input: MainOperationGoalPresentationInput,
  goalId: string,
): MainOperationGoalDetailModel | undefined {
  const season = ensureMainOperationSeasonForGameState(input);
  const goal = season.goals.find((g) => g.id === goalId);
  if (!goal) return undefined;

  return {
    goalId: goal.id,
    title: goal.title,
    description: goal.description,
    progressLabel: `%${goal.progress} tamamlandı`,
    progressRatio: Math.min(1, Math.max(0, goal.progress / 100)),
    statusLabel: statusLabelForGoal(goal),
    tone: toneFromGoal(goal),
    sourceRows: buildSourceRows(goal, input),
    sourceLine: sourceLineForGoal(goal, input),
    recommendationLine: recommendationForGoal(goal, input),
    footerNote: 'Bugünkü etki yarınki planla birlikte değerlendirilir.',
  };
}

export function pickTopSeasonInsightLine(
  insights: MainOperationGoalInsight[],
): string {
  if (insights.length === 0) {
    return 'Sezon hedefleri izleniyor';
  }
  const risky = [...insights].sort((a, b) => a.progressRatio - b.progressRatio)[0];
  const best = [...insights].sort((a, b) => b.progressRatio - a.progressRatio)[0];

  if (risky && risky.progressRatio < 0.4) {
    return `${risky.title} dikkat istiyor`;
  }
  if (best && best.progressRatio >= 0.6) {
    return `${best.title} iyi ilerliyor`;
  }
  if (risky?.domain === 'city_balance') {
    return 'Bugün şehir dengesi izleniyor';
  }
  return risky?.sourceLine.split('.')[0] ?? 'Sezon hedefleri güncellendi';
}

export function sortInsightsForHub(insights: MainOperationGoalInsight[]): MainOperationGoalInsight[] {
  return [...insights].sort((a, b) => {
    const riskScore = (i: MainOperationGoalInsight) => {
      if (i.tone === 'critical') return 0;
      if (i.tone === 'warning') return 1;
      if (i.progressRatio < 0.35) return 2;
      return 10 - i.progressRatio;
    };
    return riskScore(a) - riskScore(b);
  });
}

export function buildMainOperationSeasonDetailModel(
  input: MainOperationGoalPresentationInput,
): MainOperationSeasonDetailModel | undefined {
  const season = ensureMainOperationSeasonForGameState(input);
  if (season.accessMode !== 'full' || season.status !== 'active') {
    return undefined;
  }

  const insights = buildMainOperationGoalInsights(input);
  const sorted = sortInsightsForHub(insights);

  return {
    title: MAIN_OPERATION_UI_COPY.hubTitle,
    subtitle: MAIN_OPERATION_UI_COPY.seasonSubtitle,
    seasonDayLabel: `Sezon günü ${season.currentSeasonDay} / ${season.seasonLengthDays}`,
    accessLabel: MAIN_OPERATION_UI_COPY.accessFull,
    topInsightLine: pickTopSeasonInsightLine(sorted),
    goalDetails: season.goals
      .map((g) => buildMainOperationGoalDetail(input, g.id))
      .filter((d): d is MainOperationGoalDetailModel => d != null),
    footerNote: MAIN_OPERATION_UI_COPY.fullFooter,
  };
}

function reportLineForDomain(
  domain: MainOperationGoalDomain,
  input: MainOperationGoalPresentationInput,
): string | undefined {
  const goal = ensureMainOperationSeasonForGameState(input).goals.find(
    (g) => g.domain === domain,
  );
  if (!goal) return undefined;

  const plan = input.dailyOperationsPlan;
  const assignments = input.assignments;
  const crisis = input.crisisState;
  const micro = input.microDecisionState?.dailySummary;

  switch (domain) {
    case 'city_balance':
      if (crisis?.riskLevel === 'elevated' || crisis?.riskLevel === 'critical') {
        return 'Kriz eşiği şehir dengesi hedefini yavaşlattı.';
      }
      if (micro && micro.resolvedCount > 0) {
        return 'Canlı operasyon kararları şehir dengesine küçük katkı verdi.';
      }
      return 'Operasyon sinyalleri şehir dengesi hedefini şekillendirdi.';
    case 'districts': {
      const active = getActiveMainOperationDistrictIds(
        ensureMainOperationSeasonForGameState(input),
      );
      const name = active[0] ? getNeighborhoodDisplayName(active[0]) : 'mahalle';
      if (plan?.districtFocusId) {
        return `Günlük plan ${getNeighborhoodDisplayName(plan.districtFocusId)} odağıyla mahalle kapsamını destekledi.`;
      }
      return `Mahalle kapsamı ${name} ve çevre sinyalleriyle genişledi.`;
    }
    case 'vehicles':
      if (plan?.vehicleFocus === 'preventive_maintenance') {
        return 'Günlük plan filo hedefini destekledi; yüksek kapasite baskısı izlemeye kaldı.';
      }
      return 'Araç sinyali ve plan odağı filo hedefini birlikte etkiledi.';
    case 'assignments': {
      const s = assignments?.dailyAssignmentSummary;
      if (s && s.strongFitCount > 0) {
        return 'Güçlü saha atamaları sezonun atama hedefini ilerletti.';
      }
      if (s && s.weakFitCount > 0) {
        return 'Zayıf atamalar atama hedefini zorladı.';
      }
      return 'Saha atamaları sezon hedefini izlemeye aldı.';
    }
    default:
      return undefined;
  }
}

export function buildReportMainOperationSeasonModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationGoalPresentationInput['mainOperationSeason'],
  inputExtras?: Omit<
    MainOperationGoalPresentationInput,
    'gameState' | 'monetization' | 'mainOperationSeason'
  >,
): ReportMainOperationSeasonModel {
  const input: MainOperationGoalPresentationInput = {
    gameState,
    monetization,
    mainOperationSeason,
    ...inputExtras,
  };
  const season = ensureMainOperationSeasonForGameState(input);
  const isFull = season.accessMode === 'full' && season.status === 'active';

  if (gameState.pilot.status === 'active' || gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return {
      title: MAIN_OPERATION_UI_COPY.reportTitle,
      subtitle: '',
      seasonDayLabel: '',
      topLine: '',
      lines: [],
      goalChips: [],
      footerNote: '',
      tone: 'neutral',
      visible: false,
    };
  }

  if (!isFull) {
    return {
      title: MAIN_OPERATION_UI_COPY.reportTitle,
      subtitle: MAIN_OPERATION_UI_COPY.seasonSubtitle,
      seasonDayLabel: '',
      topLine: MAIN_OPERATION_UI_COPY.accessLimited,
      lines: ['Sınırlı gündemde sezon hedefleri tam kapsamda izlenmez.'],
      goalChips: [],
      footerNote: '',
      tone: 'neutral',
      visible: gameState.pilot.status === 'completed',
    };
  }

  const insights = buildMainOperationGoalInsights(input);
  const lineCandidates: string[] = [];

  for (const domain of ['assignments', 'vehicles', 'city_balance', 'districts'] as const) {
    const line = reportLineForDomain(domain, input);
    if (line) lineCandidates.push(line);
  }

  if (input.crisisState?.activeIncident) {
    lineCandidates.unshift('Aktif kriz olayı sezon hedeflerini bugün zorladı.');
  }

  const lines = lineCandidates.slice(0, 3);
  const topLine =
    insights.find((i) => i.tone === 'warning')?.sourceLine.split('.')[0] ??
    insights[0]?.sourceLine.split('.')[0] ??
    'Bugün sezon hedefleri operasyon kararlarıyla güncellendi.';

  const goalChips = sortInsightsForHub(insights)
    .slice(0, 3)
    .map((i) => ({
      id: i.goalId,
      label: i.title.replace('Şehir Dengesini Koru', 'Şehir dengesi').replace('Filo Baskısını Kontrol Et', 'Filo'),
      value: i.progressLabel,
      tone: i.tone,
    }));

  return {
    title: MAIN_OPERATION_UI_COPY.reportTitle,
    subtitle: MAIN_OPERATION_UI_COPY.seasonSubtitle,
    seasonDayLabel: `Sezon günü ${season.currentSeasonDay} / ${season.seasonLengthDays}`,
    topLine,
    lines,
    goalChips,
    footerNote: MAIN_OPERATION_UI_COPY.reportFooter,
    tone: insights.some((i) => i.tone === 'warning') ? 'warning' : 'positive',
    visible: true,
  };
}

export function buildMainOperationGoalAdvisorLine(
  gameState: GameState,
  advisorState: AdvisorState,
  input: MainOperationGoalPresentationInput,
): string | undefined {
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) return undefined;
  const mode = deriveMainOperationAccessMode(gameState, input.monetization);
  if (mode !== 'full') return undefined;

  const insights = buildMainOperationGoalInsights(input);
  if (insights.length === 0) return undefined;

  const risky = sortInsightsForHub(insights)[0];
  const best = [...insights].sort((a, b) => b.progressRatio - a.progressRatio)[0];
  const level = advisorState.level;
  const crisis = input.crisisState?.riskLevel;

  if (level === 1) {
    if (risky.progressRatio < 0.45) {
      const focusHint =
        risky.domain === 'vehicles'
          ? 'araç odağını'
          : risky.domain === 'districts'
            ? 'mahalle odağını'
            : 'plan odağını';
      return `Sezon hedeflerinde ${risky.title.toLowerCase()} hassas görünüyor. Yarın ${focusHint} izlemek iyi olur.`;
    }
    return 'Sezon hedefleri izleniyor; yarın planı hedeflere göre kurmak güvenli.';
  }

  if (level === 2) {
    if (risky.domain === 'vehicles') {
      return 'Filo hedefi yavaşladı. Önleyici bakım seçimi yarın bu hedefi toparlayabilir.';
    }
    return `${risky.title} bugün geride kaldı; ${risky.recommendationLine.split('.')[0]}.`;
  }

  if (level >= 3) {
    const parts: string[] = [];
    if (best.progressRatio >= 0.55) {
      parts.push(`Bugün güçlü atamalar ${best.title.toLowerCase()} hedefini destekledi`);
    }
    if (crisis === 'elevated' || crisis === 'critical') {
      parts.push('kriz eşiği şehir dengesini zorluyor');
    }
    if (parts.length > 0) {
      return `${parts.join(', ')}. Yarın aktif mahalleleri birlikte düşünmek daha güvenli.`;
    }
    return risky.recommendationLine;
  }

  return undefined;
}

export function shouldShowSeasonGoalUi(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  if (gameState.pilot.status === 'active') return false;
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) return false;
  const mode = deriveMainOperationAccessMode(gameState, monetization);
  return mode === 'full' || mode === 'limited';
}
