import { hashSeed } from '@/core/game/createSeededRandom';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type {
  DailyPriorityFinalStatus,
  DailyPriorityKey,
  DailyPriorityState,
} from '@/core/dailyPriority/dailyPriorityTypes';
import type { ButterflyHook, ButterflyHookState } from '@/core/events/butterflyHookTypes';
import { mapEventToContentCategory } from '@/core/events/eventVariationEngine';
import type { EventContentCategory } from '@/core/events/eventContentTypes';
import type { EventCard } from '@/core/models/EventCard';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import {
  CARRY_OVER_MAX_BIAS_SIGNALS_PER_DAY,
  CARRY_OVER_MAX_NEGATIVE_FRACTION,
  CARRY_OVER_MAX_POSITIVE_FRACTION,
  CARRY_OVER_MAX_SIGNALS_PER_DAY,
  CARRY_OVER_PRIORITY_CATEGORIES,
  CARRY_OVER_STATUS_DELTAS,
  CARRY_OVER_TOTAL_BIAS_CLAMP,
  CARRY_OVER_WEIGHT_SCALE,
} from './carryOverConstants';
import type {
  CarryOverEvaluationInput,
  CarryOverEventWeightHint,
  CarryOverSignal,
  CarryOverSignalKind,
  CarryOverSignalStrength,
  CarryOverSignalTone,
  CarryOverTarget,
} from './carryOverTypes';

function signalId(parts: string[]): string {
  return `co-${parts.join('-')}`.slice(0, 56);
}

function resolveFinalStatus(state: DailyPriorityState | undefined): DailyPriorityFinalStatus | null {
  if (!state?.selectedKey) return null;
  const fromFinal = state.finalResult?.status;
  if (fromFinal) return fromFinal;
  if (state.status === 'fulfilled' || state.status === 'partial' || state.status === 'failed') {
    return state.status;
  }
  return null;
}

const SOCIAL_CARRY_OVER_CATEGORIES = new Set([
  'social_pressure',
  'community_support',
  'noise',
  'citizen_complaint',
]);

/** Due veya aktif (expires içinde) butterfly hook'ları — resolved/expired hariç. */
export function activeDueButterflyHooksForDay(
  hookState: ButterflyHookState | undefined,
  day: number,
): ButterflyHook[] {
  if (!hookState?.hooks?.length) return [];
  return hookState.hooks.filter(
    (h) =>
      h.status === 'active' &&
      h.dueDay <= day &&
      h.expiresDay >= day,
  );
}

function matchesSocialButterflyHook(hook: ButterflyHook): boolean {
  if (hook.triggerTag === 'social_follow') return true;
  if (hook.category && SOCIAL_CARRY_OVER_CATEGORIES.has(hook.category)) {
    return true;
  }
  return hook.preferredPriorityKeys?.includes('public_relief') ?? false;
}

function hookTargetsOverlap(target: CarryOverTarget, hook: ButterflyHook): boolean {
  switch (target) {
    case 'social':
      return matchesSocialButterflyHook(hook);
    case 'personnel':
      return hook.category === 'personnel_morale';
    case 'container':
      return hook.category === 'waste_container';
    case 'vehicle':
      return hook.category === 'vehicle_route';
    case 'budget':
      return hook.triggerTag === 'resource_echo';
    case 'operation_risk':
      return hook.kind === 'risk_signal' || hook.category === 'waste_container';
    default:
      return false;
  }
}

export function overlapsButterflyTarget(
  signal: Pick<
    CarryOverSignal,
    | 'neighborhoodId'
    | 'categoryHint'
    | 'target'
    | 'dailyPriorityKey'
    | 'eventWeightHint'
  >,
  hook: ButterflyHook,
): boolean {
  if (hook.status !== 'active') return false;

  const signalCategory =
    signal.categoryHint ?? signal.eventWeightHint?.category;
  const normNh = signal.neighborhoodId
    ? normalizeNeighborhoodId(signal.neighborhoodId)
    : null;
  const hookNh = hook.neighborhoodId
    ? normalizeNeighborhoodId(hook.neighborhoodId)
    : null;

  if (normNh && hookNh && normNh === hookNh) {
    if (!signalCategory || !hook.category || signalCategory === hook.category) {
      return true;
    }
    if (
      signalCategory &&
      hook.preferredCategories?.includes(signalCategory as EventContentCategory)
    ) {
      return true;
    }
    if (signal.target && hookTargetsOverlap(signal.target, hook)) {
      return true;
    }
  }

  if (signalCategory && hook.category && signalCategory === hook.category) {
    return true;
  }
  if (
    signalCategory &&
    hook.preferredCategories?.includes(signalCategory as EventContentCategory)
  ) {
    return true;
  }

  if (signal.dailyPriorityKey === 'public_relief') {
    if (hook.preferredPriorityKeys?.includes('public_relief')) return true;
    if (hook.triggerTag === 'social_follow') return true;
    if (
      signalCategory &&
      hook.category &&
      SOCIAL_CARRY_OVER_CATEGORIES.has(signalCategory) &&
      SOCIAL_CARRY_OVER_CATEGORIES.has(hook.category)
    ) {
      return true;
    }
  }

  if (signal.target && hookTargetsOverlap(signal.target, hook)) {
    return true;
  }

  if (
    hook.kind === 'follow_up_event' &&
    normNh &&
    hookNh &&
    normNh === hookNh &&
    (!signalCategory || !hook.category || signalCategory === hook.category)
  ) {
    return true;
  }

  return false;
}

export function findOverlappingButterflyHook(
  signal: CarryOverSignal,
  hookState: ButterflyHookState | undefined,
  activeDay: number,
): ButterflyHook | null {
  const hooks = activeDueButterflyHooksForDay(hookState, activeDay);
  for (const hook of hooks) {
    if (overlapsButterflyTarget(signal, hook)) {
      return hook;
    }
  }
  return null;
}

export function shouldSuppressCarryOverBiasForButterfly(
  signal: CarryOverSignal,
  hookState: ButterflyHookState | undefined,
  day: number,
): boolean {
  if (!signal.eventWeightHint) return false;
  return findOverlappingButterflyHook(signal, hookState, day) != null;
}

export function convertCarryOverToButterflyOverlap(
  signal: CarryOverSignal,
  _hook?: ButterflyHook | null,
): CarryOverSignal {
  return {
    ...signal,
    kind: 'butterfly_overlap',
    tone: 'mixed',
    shortLabel: 'Karar yankısı takipte',
    text: 'Dünkü karar zaten takip sinyali olarak izleniyor.',
    eventWeightHint: undefined,
    suppressIfButterflyHookExists: true,
  };
}

function applyButterflyOverlapToSignals(
  signals: CarryOverSignal[],
  hookState: ButterflyHookState | undefined,
  activeDay: number,
): CarryOverSignal[] {
  return signals.map((signal) => {
    const hook = findOverlappingButterflyHook(signal, hookState, activeDay);
    if (!hook) return signal;
    if (signal.kind === 'butterfly_overlap' && !signal.eventWeightHint) {
      return signal;
    }
    if (!signal.eventWeightHint && signal.kind !== 'priority_echo') {
      return signal;
    }
    return convertCarryOverToButterflyOverlap(signal, hook);
  });
}

export function resolveCarryOverNeighborhood(
  input: CarryOverEvaluationInput,
): string | undefined {
  const fromFocal = input.focalNeighborhoodId
    ? normalizeNeighborhoodId(input.focalNeighborhoodId)
    : null;
  if (fromFocal) return fromFocal;

  const prev = input.dailyPriorityByDay?.[input.previousDay];
  const fromLog = prev?.impactLog
    ?.slice()
    .reverse()
    .find((e) => e.relatedNeighborhoodId)?.relatedNeighborhoodId;
  if (fromLog) {
    const n = normalizeNeighborhoodId(fromLog);
    if (n) return n;
  }
  return undefined;
}

export function resolveCarryOverCategory(
  priorityKey: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
): string | undefined {
  const cats = CARRY_OVER_PRIORITY_CATEGORIES[priorityKey];
  const list = status === 'fulfilled' ? cats.positive : cats.negative;
  return list[0];
}

function buildPriorityCopy(
  key: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
  neighborhoodId?: string,
): { title: string; text: string; shortLabel: string; tone: CarryOverSignalTone; strength: CarryOverSignalStrength; target: CarryOverTarget } {
  const place = neighborhoodId === 'sanayi' ? 'Sanayi' : neighborhoodId === 'cumhuriyet' ? 'Cumhuriyet' : neighborhoodId === 'merkez' ? 'Merkez' : 'mahalle';

  if (key === 'public_relief') {
    if (status === 'fulfilled') {
      return {
        title: 'Halk baskısı hafifledi',
        shortLabel: 'Halk baskısı hafifledi',
        text: 'Dünkü halkı rahatlatma vaadi sosyal baskıyı yumuşattı.',
        tone: 'positive',
        strength: 'soft',
        target: 'social',
      };
    }
    if (status === 'partial') {
      return {
        title: 'Algı takipte',
        shortLabel: 'Algı takipte',
        text: 'Dünkü kararlar baskıyı azalttı ama sosyal algı tamamen kapanmadı.',
        tone: 'mixed',
        strength: 'soft',
        target: 'social',
      };
    }
    return {
      title: 'Sosyal baskı kaldı',
      shortLabel: 'Sosyal baskı kaldı',
      text: `Dünkü halkı rahatlatma vaadi tutulamadı; bugün ${place}'de algı daha hassas.`,
      tone: 'warning',
      strength: 'soft',
      target: 'social',
    };
  }

  if (key === 'operation_stability') {
    if (status === 'fulfilled') {
      return {
        title: 'Saha dengelendi',
        shortLabel: 'Saha dengelendi',
        text: 'Dünkü operasyon toparlandı; bugün saha baskısı daha kontrollü başlıyor.',
        tone: 'positive',
        strength: 'soft',
        target: 'operation_risk',
      };
    }
    if (status === 'partial') {
      return {
        title: 'Operasyon takipte',
        shortLabel: 'Operasyon takipte',
        text: 'Dünkü kararlar baskıyı azalttı ama takip gerektiren bir sinyal kaldı.',
        tone: 'mixed',
        strength: 'soft',
        target: 'operation_risk',
      };
    }
    return {
      title: 'Saha baskısı kaldı',
      shortLabel: 'Saha baskısı kaldı',
      text: `Dünkü operasyon baskısı bugün ${place}'de takip sinyali bıraktı.`,
      tone: 'warning',
      strength: 'medium',
      target: 'operation_risk',
    };
  }

  if (status === 'fulfilled') {
    return {
      title: 'Kaynaklar korundu',
      shortLabel: 'Kaynaklar korundu',
      text: 'Dünkü kaynak koruma tercihi bütçe ve ekip yükünü rahatlattı.',
      tone: 'positive',
      strength: 'soft',
      target: 'budget',
    };
  }
  if (status === 'partial') {
    return {
      title: 'Kaynak dengesi hassas',
      shortLabel: 'Kaynak dengesi hassas',
      text: 'Dünkü kaynak dengesi korundu ama ince ayar gerekiyor.',
      tone: 'mixed',
      strength: 'soft',
      target: 'budget',
    };
  }
  return {
    title: 'Kaynak baskısı arttı',
    shortLabel: 'Kaynak baskısı arttı',
    text: 'Dünkü kaynak koruma hedefi zorlandı; bugün personel ve bakım baskısı daha hassas.',
    tone: 'warning',
    strength: 'soft',
    target: 'personnel',
  };
}

function buildEventWeightHint(
  key: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
  neighborhoodId?: string,
): CarryOverEventWeightHint | undefined {
  const rules = CARRY_OVER_STATUS_DELTAS[status];
  if (!rules.applyBias) {
    if (status === 'partial' && hashSeed(`${key}-partial-bias`) % 3 === 0) {
      return {
        category: resolveCarryOverCategory(key, status),
        neighborhoodId,
        delta: rules.positive,
      };
    }
    return undefined;
  }

  const category = resolveCarryOverCategory(key, status);
  const delta =
    status === 'fulfilled' ? rules.positive : rules.negative;

  return {
    category,
    neighborhoodId,
    delta: clampFraction(delta),
  };
}

function clampFraction(delta: number): number {
  if (delta > 0) return Math.min(delta, CARRY_OVER_MAX_POSITIVE_FRACTION);
  if (delta < 0) return Math.max(delta, CARRY_OVER_MAX_NEGATIVE_FRACTION);
  return 0;
}

export function buildCarryOverFromDailyPriority(
  input: CarryOverEvaluationInput,
): CarryOverSignal | null {
  const prev = input.dailyPriorityByDay?.[input.previousDay];
  const status = resolveFinalStatus(prev);
  const key = prev?.selectedKey;
  if (!status || !key) return null;

  if (input.day <= 1) return null;
  if (input.day === 2 && prev?.isDay1Auto) {
    return null;
  }

  const neighborhoodId = resolveCarryOverNeighborhood(input);
  const categoryHint = resolveCarryOverCategory(key, status);
  const copy = buildPriorityCopy(key, status, neighborhoodId);
  let eventWeightHint = buildEventWeightHint(key, status, neighborhoodId);
  let kind: CarryOverSignalKind = 'priority_echo';
  let tone = copy.tone;
  let text = copy.text;
  let shortLabel = copy.shortLabel;

  const draft: CarryOverSignal = {
    id: signalId([String(input.day), 'priority', key, status]),
    sourceDay: input.previousDay,
    activeDay: input.day,
    kind,
    tone,
    strength: status === 'failed' && key === 'operation_stability' ? 'medium' : 'soft',
    title: copy.title,
    text,
    shortLabel,
    target: copy.target,
    categoryHint,
    neighborhoodId,
    dailyPriorityKey: key,
    eventWeightHint,
    suppressIfButterflyHookExists: true,
    createdAt: Date.now(),
  };

  const overlapHook = findOverlappingButterflyHook(
    draft,
    input.butterflyHookState,
    input.day,
  );
  if (overlapHook) {
    return convertCarryOverToButterflyOverlap(draft, overlapHook);
  }

  return draft;
}

export function buildCarryOverFromDailyGoals(
  input: CarryOverEvaluationInput,
): CarryOverSignal[] {
  const goalsState = input.dailyGoalsByDay?.[input.previousDay];
  if (!goalsState?.goals?.length || input.day <= 1) {
    return [];
  }

  const primary = goalsState.goals.find((g) => g.priority === 'primary');
  if (!primary) return [];

  const failedSecondary = goalsState.goals.filter(
    (g) => g.priority === 'secondary' && g.isFailed,
  ).length;
  const allCompleted = goalsState.goals.every((g) => g.isCompleted);

  if (primary.isCompleted && allCompleted) {
    return [
      {
        id: signalId([String(input.day), 'goal', 'all-done']),
        sourceDay: input.previousDay,
        activeDay: input.day,
        kind: 'opportunity_memory',
        tone: 'positive',
        strength: 'soft',
        title: 'Hedefler tamam',
        shortLabel: 'Gün hedefleri tuttu',
        text: 'Dünkü günlük hedefler tamamlandı; bugün küçük bir fırsat penceresi var.',
        target: 'general',
        createdAt: Date.now(),
      },
    ];
  }

  if (primary.isFailed) {
    return [
      {
        id: signalId([String(input.day), 'goal', 'primary-fail']),
        sourceDay: input.previousDay,
        activeDay: input.day,
        kind: 'goal_echo',
        tone: 'warning',
        strength: failedSecondary >= 2 ? 'medium' : 'soft',
        title: 'Ana hedef kaçtı',
        shortLabel: 'Ana hedef takipte',
        text: 'Dünkü ana hedef tam tutmadı; bugün öncelik listesi daha sıkı.',
        target: 'general',
        createdAt: Date.now(),
      },
    ];
  }

  if (primary.isCompleted) {
    return [
      {
        id: signalId([String(input.day), 'goal', 'primary-ok']),
        sourceDay: input.previousDay,
        activeDay: input.day,
        kind: 'goal_echo',
        tone: 'positive',
        strength: 'soft',
        title: 'Ana hedef tuttu',
        shortLabel: 'Ana hedef tamam',
        text: 'Dünkü ana hedef tamamlandı; bugün operasyon ritmi biraz daha rahat.',
        target: 'general',
        createdAt: Date.now(),
      },
    ];
  }

  return [];
}

export function buildCarryOverFromButterflyHooks(
  input: CarryOverEvaluationInput,
): CarryOverSignal[] {
  const hooks = activeDueButterflyHooksForDay(input.butterflyHookState, input.day);
  if (hooks.length === 0 || input.day <= 1) return [];

  const dueToday = hooks.filter((h) => h.dueDay === input.day);
  if (dueToday.length === 0) return [];

  return dueToday.slice(0, 1).map((hook) => ({
    id: signalId([String(input.day), 'butterfly', hook.id]),
    sourceDay: hook.createdDay,
    activeDay: input.day,
    kind: 'butterfly_overlap' as const,
    tone: 'mixed' as const,
    strength: 'soft' as const,
    title: 'Karar yankısı',
    shortLabel: 'Karar yankısı takipte',
    text: 'Dünkü karar zaten takip sinyali olarak izleniyor.',
    target: 'general' as const,
    neighborhoodId: hook.neighborhoodId,
    categoryHint: hook.category,
    createdAt: Date.now(),
  }));
}

export function dedupeCarryOverSignals(signals: CarryOverSignal[]): CarryOverSignal[] {
  const seen = new Set<string>();
  const out: CarryOverSignal[] = [];
  for (const s of signals) {
    const key = `${s.kind}:${s.target}:${s.categoryHint ?? ''}:${s.neighborhoodId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function limitCarryOverSignals(signals: CarryOverSignal[]): CarryOverSignal[] {
  const sorted = [...signals].sort((a, b) => {
    const rank = (s: CarryOverSignal) => {
      if (s.kind === 'priority_echo') return 4;
      if (s.kind === 'butterfly_overlap') return 3;
      if (s.kind === 'goal_echo') return 2;
      return 1;
    };
    return rank(b) - rank(a);
  });

  let biasCount = 0;
  const limited: CarryOverSignal[] = [];

  for (const s of sorted) {
    if (limited.length >= CARRY_OVER_MAX_SIGNALS_PER_DAY) break;
    if (s.eventWeightHint) {
      if (biasCount >= CARRY_OVER_MAX_BIAS_SIGNALS_PER_DAY) {
        const { eventWeightHint: _, ...rest } = s;
        limited.push(rest);
        continue;
      }
      biasCount += 1;
    }
    limited.push(s);
  }

  return limited;
}

export function buildCarryOverSignalsForDay(
  input: CarryOverEvaluationInput,
): CarryOverSignal[] {
  if (input.day <= 1) return [];

  const priority = buildCarryOverFromDailyPriority(input);
  const goals = buildCarryOverFromDailyGoals(input);
  const butterfly = buildCarryOverFromButterflyHooks(input);

  const merged: CarryOverSignal[] = [];
  if (priority) merged.push(priority);
  if (priority?.kind !== 'butterfly_overlap') {
    merged.push(...goals.slice(0, priority ? 1 : 2));
  }
  if (!merged.some((s) => s.kind === 'butterfly_overlap')) {
    merged.push(...butterfly);
  }

  const withOverlap = applyButterflyOverlapToSignals(
    merged,
    input.butterflyHookState,
    input.day,
  );
  return limitCarryOverSignals(dedupeCarryOverSignals(withOverlap));
}

function eventMatchesHint(
  event: EventCard,
  hint: CarryOverEventWeightHint,
): boolean {
  const category = mapEventToContentCategory(event);
  const nh = event.neighborhoodId
    ? normalizeNeighborhoodId(event.neighborhoodId)
    : event.contentMeta?.neighborhoodId
      ? normalizeNeighborhoodId(event.contentMeta.neighborhoodId)
      : null;

  if (hint.category && hint.category !== category) {
    const hintCat = hint.category as EventContentCategory;
    if (category !== hintCat) return false;
  }

  if (hint.neighborhoodId && nh) {
    const hintNh = normalizeNeighborhoodId(hint.neighborhoodId);
    if (hintNh && nh && nh !== hintNh) {
      return false;
    }
  }

  return true;
}

export function getCarryOverWeightDeltaForEvent(
  event: EventCard,
  signals: CarryOverSignal[],
): number {
  let totalFraction = 0;

  for (const signal of signals) {
    if (!signal.eventWeightHint) continue;
    if (signal.kind === 'butterfly_overlap') continue;
    if (!eventMatchesHint(event, signal.eventWeightHint)) continue;
    totalFraction += signal.eventWeightHint.delta;
  }

  const clamped = Math.max(
    -CARRY_OVER_TOTAL_BIAS_CLAMP,
    Math.min(CARRY_OVER_TOTAL_BIAS_CLAMP, totalFraction),
  );

  return Math.round(clamped * CARRY_OVER_WEIGHT_SCALE);
}

export function applyCarryOverWeightToCandidates(
  candidates: EventCard[],
  signals: CarryOverSignal[],
): EventCard[] {
  return candidates;
}

export function clampCarryOverFraction(delta: number): number {
  return Math.max(
    -CARRY_OVER_TOTAL_BIAS_CLAMP,
    Math.min(CARRY_OVER_TOTAL_BIAS_CLAMP, delta),
  );
}
