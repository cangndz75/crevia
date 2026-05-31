import type { GameState } from '@/core/models/GameState';
import type { EventCard } from '@/core/models/EventCard';
import type {
  OperationDomainSignal,
  OperationSignalsState,
  OperationSignalStatus,
} from '@/core/operations/operationSignalTypes';

import {
  DOMAIN_DISPLAY_NAMES,
  MISSED_SIGNAL_RELIABILITY_DELTA,
} from './advisorConstants';
import {
  addAdvisorPrediction,
  getAdvisorReliabilityBand,
  syncAdvisorReliabilityBand,
  updateAdvisorReliability,
} from './advisorState';
import type {
  AdvisorDomain,
  AdvisorInsightType,
  AdvisorMissedSignal,
  AdvisorPrediction,
  AdvisorPredictionConfidence,
  AdvisorState,
} from './advisorTypes';

const MILD_STATUSES: ReadonlySet<OperationSignalStatus> = new Set([
  'stable',
  'watch',
]);
const SEVERE_STATUSES: ReadonlySet<OperationSignalStatus> = new Set([
  'strained',
  'critical',
]);

function isSocialCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('social') ||
    c.includes('sosyal') ||
    c.includes('citizen') ||
    c.includes('halk')
  );
}

function isVehicleCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes('vehicle') || c.includes('araç') || c.includes('route');
}

function isContainerCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes('container') || c.includes('konteyner') || c.includes('waste');
}

export function getAdvisorDomainFromOperationDomain(
  operationDomain: keyof OperationSignalsState | 'overall' | 'social' | 'crisis',
): AdvisorDomain {
  switch (operationDomain) {
    case 'personnel':
      return 'personnel';
    case 'vehicles':
      return 'vehicles';
    case 'containers':
      return 'containers';
    case 'districts':
      return 'districts';
    case 'social':
      return 'social';
    case 'crisis':
    case 'overall':
      return 'crisis';
    default:
      return 'districts';
  }
}

export function getAdvisorConfidenceForState(
  state: AdvisorState,
  _domain: AdvisorDomain,
): AdvisorPredictionConfidence {
  const band = state.reliabilityBand ?? getAdvisorReliabilityBand(state.reliabilityScore);
  if (state.level === 1 || band === 'early_observation') return 'low';
  if (state.level === 2 || band === 'developing') return 'medium';
  if (state.level >= 3 && band === 'expert') return 'high';
  return 'medium';
}

function signalForDomain(
  signals: OperationSignalsState,
  domain: AdvisorDomain,
): OperationDomainSignal {
  switch (domain) {
    case 'personnel':
      return signals.personnel;
    case 'vehicles':
      return signals.vehicles;
    case 'containers':
      return signals.containers;
    case 'districts':
    case 'social':
      return signals.districts;
    case 'crisis':
      return signals.overall;
    default:
      return signals.overall;
  }
}

function domainFromDailyFocus(
  signals: OperationSignalsState,
): AdvisorDomain {
  switch (signals.dailyFocus) {
    case 'personnel':
      return 'personnel';
    case 'vehicles':
      return 'vehicles';
    case 'containers':
      return 'containers';
    case 'districts':
      return 'districts';
    default:
      if (signals.vehicles.score >= signals.containers.score) {
        return 'vehicles';
      }
      return 'containers';
  }
}

function domainFromEvent(event: EventCard): AdvisorDomain {
  if (isContainerCategory(event.category)) return 'containers';
  if (isVehicleCategory(event.category)) return 'vehicles';
  if (isSocialCategory(event.category)) return 'social';
  return 'districts';
}

export function shouldCreateMissedSignal(
  prediction: AdvisorPrediction,
  currentStatus: OperationSignalStatus,
): boolean {
  if (!MILD_STATUSES.has(prediction.predictedStatus as OperationSignalStatus)) {
    return false;
  }
  return SEVERE_STATUSES.has(currentStatus);
}

export function buildMissedSignalMessage(
  missed: Pick<AdvisorMissedSignal, 'domain' | 'previousStatus' | 'currentStatus'>,
  options?: { fastRise?: boolean },
): string {
  const name = DOMAIN_DISPLAY_NAMES[missed.domain];
  if (options?.fastRise) {
    return `Dünkü ${name} baskısını düşük okudum. Bugün sinyaller beklediğimden hızlı yükseldi.`;
  }
  if (missed.domain === 'social' || missed.domain === 'districts') {
    return `Mahalle tarafında sosyal tepkiyi eksik değerlendirmişim. Bugün bu sinyali daha yakından izlemek mantıklı.`;
  }
  if (missed.domain === 'containers') {
    return `Konteyner tarafında temizlik etkisini kaçırmışım. Sonraki analizde bu sinyali daha ağırlıklı okuyacağım.`;
  }
  return `Dünkü ${name} baskısını düşük okudum. Bugün filo sinyalleri beklediğimden hızlı yükseldi.`;
}

export function buildAdvisorPredictionFromSignals(input: {
  gameState: GameState;
  advisorState: AdvisorState;
  signals: OperationSignalsState;
  insightType: AdvisorInsightType;
  event?: EventCard;
}): AdvisorPrediction | undefined {
  const day = input.gameState.city.day;
  let domain: AdvisorDomain;
  if (input.insightType === 'event_plan_hint' && input.event) {
    domain = domainFromEvent(input.event);
  } else if (input.insightType === 'daily_summary') {
    domain = domainFromDailyFocus(input.signals);
  } else {
    domain = domainFromDailyFocus(input.signals);
  }

  const signal = signalForDomain(input.signals, domain);
  const confidence = getAdvisorConfidenceForState(input.advisorState, domain);

  return {
    id: `pred-${day}-${domain}-${input.insightType}`,
    day,
    domain,
    predictedStatus: signal.status,
    confidence,
    sourceSignalScore: signal.score,
    relatedDistrictId:
      domain === 'districts' || domain === 'social'
        ? input.signals.priorityDistrictId
        : undefined,
    resolved: false,
  };
}

export function evaluateAdvisorPredictionsAgainstSignals(input: {
  state: AdvisorState;
  signals: OperationSignalsState;
  evalDay: number;
  isDay1Tutorial?: boolean;
  hasCriticalEvent?: boolean;
}): { state: AdvisorState; missedSignal?: AdvisorMissedSignal } {
  if (input.isDay1Tutorial || input.evalDay <= 1) {
    return {
      state: {
        ...input.state,
        lastPredictionEvaluatedDay: input.evalDay,
        pendingPredictions: input.state.pendingPredictions.map((p) =>
          p.day < input.evalDay ? { ...p, resolved: true } : p,
        ),
      },
    };
  }

  if (input.state.lastPredictionEvaluatedDay === input.evalDay) {
    return { state: input.state };
  }

  let nextState: AdvisorState = {
    ...input.state,
    lastPredictionEvaluatedDay: input.evalDay,
  };
  let missedSignal: AdvisorMissedSignal | undefined;

  const pending = nextState.pendingPredictions.filter(
    (p) => !p.resolved && p.day < input.evalDay,
  );

  for (const prediction of pending) {
    const current = signalForDomain(input.signals, prediction.domain);
    const resolved = { ...prediction, resolved: true };

    if (!missedSignal && shouldCreateMissedSignal(prediction, current.status)) {
      const fastRise = input.hasCriticalEvent === true;
      missedSignal = {
        id: `miss-${prediction.id}-${input.evalDay}`,
        day: input.evalDay,
        domain: prediction.domain,
        previousStatus: prediction.predictedStatus,
        currentStatus: current.status,
        message: buildMissedSignalMessage(
          {
            domain: prediction.domain,
            previousStatus: prediction.predictedStatus,
            currentStatus: current.status,
          },
          { fastRise },
        ),
        acknowledged: false,
      };
      nextState = updateAdvisorReliability(
        nextState,
        MISSED_SIGNAL_RELIABILITY_DELTA,
      );
      nextState = {
        ...nextState,
        lastMissedSignal: missedSignal,
      };
    }

    nextState = {
      ...nextState,
      pendingPredictions: nextState.pendingPredictions.map((p) =>
        p.id === prediction.id ? resolved : p,
      ),
    };

    if (missedSignal) break;
  }

  if (!missedSignal) {
    nextState = {
      ...nextState,
      pendingPredictions: nextState.pendingPredictions.map((p) =>
        p.day < input.evalDay ? { ...p, resolved: true } : p,
      ),
    };
  }

  return { state: syncAdvisorReliabilityBand(nextState), missedSignal };
}

export function resolveAdvisorPredictionsForDay(input: {
  state: AdvisorState;
  signals: OperationSignalsState;
  evalDay: number;
  isDay1Tutorial?: boolean;
  hasCriticalEvent?: boolean;
}): AdvisorState {
  return evaluateAdvisorPredictionsAgainstSignals(input).state;
}

export function attachAdvisorPredictionAfterInsight(input: {
  state: AdvisorState;
  signals?: OperationSignalsState;
  gameState: GameState;
  insightType: AdvisorInsightType;
  event?: EventCard;
}): AdvisorState {
  if (!input.signals || input.gameState.city.day <= 1) {
    return input.state;
  }
  const prediction = buildAdvisorPredictionFromSignals({
    gameState: input.gameState,
    advisorState: input.state,
    signals: input.signals,
    insightType: input.insightType,
    event: input.event,
  });
  if (!prediction) return input.state;
  return addAdvisorPrediction(input.state, prediction);
}
