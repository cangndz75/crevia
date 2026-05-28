import { createId } from '@/core/game/createId';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import { selectWorstContainerNeighborhood } from '@/core/containers/containerSelectors';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type {
  DecisionMetricChange,
  DecisionSubsystemOutcome,
} from '@/features/events/types/decisionResultTypes';

import {
  DAILY_PRIORITY_CHOICE_BY_KEY,
  INITIAL_PRIORITY_SCORE,
  PRIORITY_SCORE_DELTAS,
} from './dailyPriorityConstants';
import type {
  DailyPriorityFinalStatus,
  DailyPriorityImpactEntry,
  DailyPriorityKey,
  DailyPriorityMetricSnapshot,
  DailyPriorityState,
  DailyPriorityTone,
  DecisionPriorityImpact,
} from './dailyPriorityTypes';

export type BuildMetricSnapshotInput = {
  gameState: GameState;
  socialPulseState: SocialPulseState;
  containerState: ContainerState;
  vehicleState: VehicleState;
  personnelState: PersonnelState;
};

export type EvaluateDecisionPriorityInput = {
  state: DailyPriorityState;
  event: EventCard;
  decision: EventDecision;
  metricChanges: DecisionMetricChange[];
  subsystemOutcomes: DecisionSubsystemOutcome[];
  neighborhoodId?: string;
};

export type FinalizeDailyPriorityInput = BuildMetricSnapshotInput & {
  state: DailyPriorityState;
  resolvedEventCount: number;
  focalNeighborhoodId?: string | null;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function clampPercent(score: number): number {
  return clampScore(score);
}

export function buildMetricSnapshot(
  input: BuildMetricSnapshotInput,
): DailyPriorityMetricSnapshot {
  const worstContainer = selectWorstContainerNeighborhood(input.containerState);
  return {
    publicSatisfaction: input.gameState.city.publicSatisfaction,
    budget: input.gameState.city.budget,
    personnelMorale: input.gameState.city.morale,
    operationRisk: input.gameState.city.riskScore,
    socialPulse: input.socialPulseState.globalPulseScore,
    containerPressure: worstContainer?.criticalContainerCount ?? 0,
    vehicleRisk: input.vehicleState.aggregates.criticalCount,
  };
}

export function createNotSelectedPriorityState(day: number): DailyPriorityState {
  return {
    day,
    status: 'not_selected',
    score: INITIAL_PRIORITY_SCORE,
    progressPercent: INITIAL_PRIORITY_SCORE,
    impactLog: [],
    processedDecisionEventIds: [],
  };
}

function isSocialFeaturedEvent(event: EventCard): boolean {
  const haystack =
    `${event.eventType ?? ''} ${event.category} ${event.title}`.toLowerCase();
  return /social|sosyal|şikayet|complaint|citizen|medya|gürültü/.test(haystack);
}

export function resolveDay1AutoPriorityKey(
  featuredEvent?: EventCard | null,
): DailyPriorityKey {
  if (
    featuredEvent &&
    isContainerRelevantEvent({
      id: featuredEvent.id,
      title: featuredEvent.title,
      category: featuredEvent.category,
      eventType: featuredEvent.eventType,
      neighborhoodId: featuredEvent.neighborhoodId,
      tags: featuredEvent.filterTags,
    })
  ) {
    return 'operation_stability';
  }
  if (featuredEvent && isSocialFeaturedEvent(featuredEvent)) {
    return 'public_relief';
  }
  return 'public_relief';
}

export function ensureDailyPriorityForDay(params: {
  day: number;
  existing?: DailyPriorityState | null;
  isDay1Tutorial?: boolean;
  featuredEvent?: EventCard | null;
  metricSnapshot?: DailyPriorityMetricSnapshot;
}): DailyPriorityState {
  const day = Math.max(1, Math.floor(params.day));
  if (params.existing?.day === day) {
    return params.existing;
  }

  if (params.isDay1Tutorial || day === 1) {
    const key = resolveDay1AutoPriorityKey(params.featuredEvent);
    const snapshot = params.metricSnapshot;
    return {
      day,
      selectedKey: key,
      status: 'active',
      selectedAt: Date.now(),
      score: INITIAL_PRIORITY_SCORE,
      progressPercent: INITIAL_PRIORITY_SCORE,
      startedMetricSnapshot: snapshot,
      currentMetricSnapshot: snapshot,
      impactLog: [],
      processedDecisionEventIds: [],
      isDay1Auto: true,
    };
  }

  return createNotSelectedPriorityState(day);
}

export function selectDailyPriority(
  state: DailyPriorityState,
  key: DailyPriorityKey,
  metricSnapshot: DailyPriorityMetricSnapshot,
): DailyPriorityState {
  if (state.selectedKey) {
    return state;
  }
  return {
    ...state,
    selectedKey: key,
    status: 'active',
    selectedAt: Date.now(),
    startedMetricSnapshot: metricSnapshot,
    currentMetricSnapshot: metricSnapshot,
    score: INITIAL_PRIORITY_SCORE,
    progressPercent: INITIAL_PRIORITY_SCORE,
  };
}

function haystackDecision(decision: EventDecision, event: EventCard): string {
  return `${decision.id} ${decision.title} ${decision.description ?? ''} ${event.title} ${event.category} ${event.eventType ?? ''}`.toLowerCase();
}

function keywordTone(
  text: string,
  hints: { positiveKeywords: string[]; riskyKeywords: string[] },
): 'positive' | 'risky' | 'neutral' {
  if (hints.riskyKeywords.some((k) => text.includes(k))) return 'risky';
  if (hints.positiveKeywords.some((k) => text.includes(k))) return 'positive';
  return 'neutral';
}

function metricDeltaScore(
  key: DailyPriorityKey,
  changes: DecisionMetricChange[],
): number {
  let delta = 0;
  for (const change of changes) {
    if (change.delta === 0) continue;
    switch (key) {
      case 'public_relief':
        if (change.key === 'publicSatisfaction' && change.isGood) delta += 3;
        if (change.key === 'publicSatisfaction' && !change.isGood) delta -= 3;
        if (change.key === 'operationRisk' && !change.isGood) delta -= 2;
        break;
      case 'operation_stability':
        if (change.key === 'operationRisk' && change.isGood) delta += 3;
        if (change.key === 'operationRisk' && !change.isGood) delta -= 3;
        if (change.key === 'publicSatisfaction' && change.isGood) delta += 1;
        break;
      case 'resource_protection':
        if (change.key === 'budget' && change.isGood) delta += 3;
        if (change.key === 'budget' && !change.isGood) delta -= 3;
        if (change.key === 'personnelMorale' && change.isGood) delta += 2;
        if (change.key === 'personnelMorale' && !change.isGood) delta -= 2;
        break;
      default:
        break;
    }
  }
  return delta;
}

function subsystemDeltaScore(
  key: DailyPriorityKey,
  outcomes: DecisionSubsystemOutcome[],
): number {
  let delta = 0;
  for (const outcome of outcomes) {
    const weight =
      outcome.key === 'social' && key === 'public_relief'
        ? 2
        : outcome.key === 'container' || outcome.key === 'vehicle'
          ? key === 'operation_stability'
            ? 2
            : 1
          : outcome.key === 'personnel' && key === 'resource_protection'
            ? 2
            : 1;
    if (outcome.status === 'good') delta += weight;
    if (outcome.status === 'critical') delta -= weight * 2;
    if (outcome.status === 'warning') delta -= weight;
  }
  return delta;
}

function scoreDeltaFromSignals(
  rawDelta: number,
  keywordMatch: 'positive' | 'risky' | 'neutral',
): { scoreDelta: number; tone: DailyPriorityTone } {
  let adjusted = rawDelta;
  if (keywordMatch === 'positive') adjusted += 1;
  if (keywordMatch === 'risky') adjusted -= 1;

  if (adjusted >= 5) {
    return { scoreDelta: PRIORITY_SCORE_DELTAS.strong, tone: 'supportive' };
  }
  if (adjusted >= 2) {
    return { scoreDelta: PRIORITY_SCORE_DELTAS.support, tone: 'supportive' };
  }
  if (adjusted <= -5) {
    return { scoreDelta: PRIORITY_SCORE_DELTAS.bad, tone: 'risky' };
  }
  if (adjusted <= -2) {
    return { scoreDelta: PRIORITY_SCORE_DELTAS.risk, tone: 'risky' };
  }
  if (adjusted < 0) {
    return { scoreDelta: PRIORITY_SCORE_DELTAS.risk, tone: 'balanced' };
  }
  return { scoreDelta: PRIORITY_SCORE_DELTAS.neutral, tone: 'neutral' };
}

function impactCopyForDecision(
  key: DailyPriorityKey,
  tone: DailyPriorityTone,
): { title: string; text: string } {
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[key];
  if (key === 'public_relief') {
    if (tone === 'supportive') {
      return {
        title: 'Vaat güçlendi',
        text: 'Halkı rahatlatma vaadi güçlendi: şikayet baskısı azaldı.',
      };
    }
    if (tone === 'risky') {
      return {
        title: 'Vaat riskte',
        text: 'Vaat riskte: sosyal tepki azalırken personel yükü arttı.',
      };
    }
    return {
      title: 'Vaat zayıfladı',
      text: 'Halkı rahatlatma vaadi zayıfladı: memnuniyet baskısı büyüdü.',
    };
  }
  if (key === 'operation_stability') {
    if (tone === 'supportive') {
      return {
        title: 'Operasyon ilerledi',
        text: 'Operasyonu toparlama vaadi ilerledi: saha riski azaldı.',
      };
    }
    if (tone === 'balanced') {
      return {
        title: 'Dengeli sonuç',
        text: 'Operasyon toparlandı ama araç yükü arttı.',
      };
    }
    return {
      title: 'Vaat riskte',
      text: 'Operasyon vaadi riskte: yeni saha baskısı oluştu.',
    };
  }
  if (tone === 'supportive') {
    return {
      title: 'Kaynak korundu',
      text: 'Kaynak koruma vaadi güçlendi: bütçe ve ekip dengede kaldı.',
    };
  }
  if (tone === 'balanced') {
    return {
      title: 'Kısmi denge',
      text: 'Kaynaklar korundu ama sorun tamamen kapanmadı.',
    };
  }
  return {
    title: 'Vaat zayıfladı',
    text: 'Kaynak vaadi zayıfladı: bütçe veya ekip yükü arttı.',
  };
}

export function evaluateDecisionImpactOnPriority(
  input: EvaluateDecisionPriorityInput,
): {
  state: DailyPriorityState;
  impact: DecisionPriorityImpact | null;
} {
  const { state, event, decision, metricChanges, subsystemOutcomes } = input;
  if (!state.selectedKey || state.status !== 'active') {
    return { state, impact: null };
  }

  const processed = state.processedDecisionEventIds ?? [];
  if (processed.includes(event.id)) {
    return { state, impact: null };
  }

  const key = state.selectedKey;
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[key];
  const text = haystackDecision(decision, event);
  const kw = keywordTone(text, choice.decisionBiasHints);
  const raw =
    metricDeltaScore(key, metricChanges) +
    subsystemDeltaScore(key, subsystemOutcomes);
  const { scoreDelta, tone } = scoreDeltaFromSignals(raw, kw);
  const copy = impactCopyForDecision(key, tone);

  const entry: DailyPriorityImpactEntry = {
    id: createId('priority-impact'),
    day: state.day,
    source: 'decision',
    tone,
    title: copy.title,
    text: copy.text,
    scoreDelta,
    createdAt: Date.now(),
    relatedEventId: event.id,
    relatedNeighborhoodId: input.neighborhoodId ?? event.neighborhoodId,
  };

  const nextScore = clampScore(state.score + scoreDelta);
  const nextState: DailyPriorityState = {
    ...state,
    score: nextScore,
    progressPercent: clampPercent(nextScore),
    impactLog: [entry, ...state.impactLog].slice(0, 12),
    processedDecisionEventIds: [...processed, event.id],
  };

  return {
    state: nextState,
    impact: {
      title: copy.title,
      text: copy.text,
      tone,
      scoreDelta,
    },
  };
}

export function evaluateSocialQuickActionOnPriority(
  state: DailyPriorityState,
  socialDelta: number,
): DailyPriorityState {
  if (!state.selectedKey || state.status !== 'active') {
    return state;
  }
  const key = state.selectedKey;
  let scoreDelta: number = PRIORITY_SCORE_DELTAS.neutral;
  let tone: DailyPriorityTone = 'neutral';
  let text = 'Sosyal nabız güncellendi.';

  if (key === 'public_relief') {
    if (socialDelta > 0) {
      scoreDelta = PRIORITY_SCORE_DELTAS.support;
      tone = 'supportive';
      text = 'Halkı rahatlatma vaadi sosyal müdahaleyle desteklendi.';
    } else if (socialDelta < 0) {
      scoreDelta = PRIORITY_SCORE_DELTAS.risk;
      tone = 'risky';
      text = 'Sosyal baskı arttı; vaat risk altında.';
    }
  }

  const entry: DailyPriorityImpactEntry = {
    id: createId('priority-impact'),
    day: state.day,
    source: 'social_quick_action',
    tone,
    title: 'Sosyal müdahale',
    text,
    scoreDelta,
    createdAt: Date.now(),
  };

  const nextScore = clampScore(state.score + scoreDelta);
  return {
    ...state,
    score: nextScore,
    progressPercent: clampPercent(nextScore),
    impactLog: [entry, ...state.impactLog].slice(0, 12),
  };
}

function finalStatusFromScore(score: number): DailyPriorityFinalStatus {
  if (score >= 70) return 'fulfilled';
  if (score >= 45) return 'partial';
  return 'failed';
}

function buildCarryOverText(
  status: DailyPriorityFinalStatus,
  key: DailyPriorityKey,
  neighborhoodId?: string | null,
): string | undefined {
  const place = neighborhoodId ? 'ilgili mahallede' : 'şehir genelinde';
  if (status === 'fulfilled') {
    if (key === 'public_relief') {
      return `Yarın ${place} sosyal baskı daha düşük başlayabilir.`;
    }
    if (key === 'operation_stability') {
      return `Yarın ${place} saha yükü daha kontrollü başlayabilir.`;
    }
    return `Yarın ${place} kaynak dengesi daha stabil başlayabilir.`;
  }
  if (status === 'partial') {
    return `Yarın ${place} takip gerektiren bir sinyal kalabilir.`;
  }
  return `Yarın ${place} riskli gündem yeniden yükselebilir.`;
}

function finalCopy(
  key: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
): { title: string; text: string } {
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[key];
  if (status === 'fulfilled') {
    return {
      title: `${choice.shortTitle} · Başarılı`,
      text: `${choice.title} vaadi tutuldu; gün hedefiyle uyumlu kapandı.`,
    };
  }
  if (status === 'partial') {
    return {
      title: `${choice.shortTitle} · Kısmi`,
      text: `${choice.title} vaadi kısmen tutuldu; yarın izleme gerekebilir.`,
    };
  }
  return {
    title: `${choice.shortTitle} · Riskte`,
    text: `${choice.title} vaadi zayıf kaldı; yarın öncelik yeniden netleşmeli.`,
  };
}

export function finalizeDailyPriority(
  input: FinalizeDailyPriorityInput,
): DailyPriorityState {
  const { state } = input;
  if (!state.selectedKey) {
    return state;
  }

  const snapshot = buildMetricSnapshot(input);
  const finalStatus = finalStatusFromScore(state.score);
  const copy = finalCopy(state.selectedKey, finalStatus);
  const carryOverText = buildCarryOverText(
    finalStatus,
    state.selectedKey,
    input.focalNeighborhoodId,
  );

  const xpBonus =
    finalStatus === 'fulfilled' ? 15 : finalStatus === 'partial' ? 8 : 0;

  return {
    ...state,
    status: finalStatus,
    progressPercent: clampPercent(state.score),
    currentMetricSnapshot: snapshot,
    finalResult: {
      status: finalStatus,
      title: copy.title,
      text: copy.text,
      xpBonus,
      carryOverText,
    },
  };
}

const GOAL_WEIGHT_METRICS = new Set([
  'publicSatisfaction',
  'operationRisk',
  'budget',
  'personnelMorale',
  'containerPressure',
  'vehicleRisk',
  'socialPulse',
] as const);

export function getPriorityGoalWeight(
  priorityKey: DailyPriorityKey | undefined,
  metricKey: string,
): number {
  if (!priorityKey || !GOAL_WEIGHT_METRICS.has(metricKey as never)) {
    return 1;
  }
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[priorityKey];
  const weights = choice.goalWeights;
  const value = weights[metricKey as keyof typeof weights];
  if (value == null) {
    return 1;
  }
  return 1 + value * 0.5;
}
