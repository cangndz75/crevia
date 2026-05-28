import { createId } from '@/core/game/createId';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import { selectNeighborhoodContainerStatus, selectWorstContainerNeighborhood } from '@/core/containers/containerSelectors';
import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import {
  enrichGoalDescriptionWithIdentity,
  getNeighborhoodDisplayName,
  getNeighborhoodGoalBias,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { applyXpTransactions } from '@/core/xp/xpEngine';
import type { PlayerProgress, XpTransaction } from '@/core/xp/types';

import {
  DAILY_GOAL_THRESHOLDS,
  DEFAULT_GOAL_REWARD_XP,
  METRIC_KEY_TO_CITY_FIELD,
} from '@/core/dailyGoals/dailyGoalConstants';
import type {
  DailyGoal,
  DailyGoalEvaluationTrigger,
  DailyGoalKind,
  DailyGoalMetricKey,
  DailyGoalPriority,
  DailyGoalState,
  DailyGoalStatus,
  DailyGoalSubsystem,
} from '@/core/dailyGoals/dailyGoalTypes';
import type { DailyGoalRuntime } from '@/core/dailyGoals/dailyGoalIntegration';

export type CreateDailyGoalsInput = {
  day: number;
  gameState: GameState;
  neighborhoods: Neighborhood[];
  containerState: ContainerState;
  vehicleState: VehicleState;
  personnelState: PersonnelState;
  socialPulseState: SocialPulseState;
  isDay1Tutorial?: boolean;
};

export type DailyGoalEvaluationInput = CreateDailyGoalsInput & {
  decisionHistory: DecisionRecord[];
  dailyGoalRuntime: DailyGoalRuntime;
  trigger: DailyGoalEvaluationTrigger;
  lastClosedDay?: number | null;
};

export type DailyGoalClaimResult = {
  goal: DailyGoal;
  playerProgress: PlayerProgress;
  xpTransaction?: XpTransaction;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
};

function hashSeed(...parts: Array<string | number>): number {
  let hash = 0;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(hash);
}

function pickDeterministic<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length]!;
}

function pickWeightedDeterministic<T>(
  items: readonly T[],
  seed: number,
  weightOf: (item: T) => number,
): T {
  if (items.length === 0) {
    throw new Error('pickWeightedDeterministic: empty items');
  }
  const weights = items.map((item) => Math.max(1, Math.round(weightOf(item) * 10)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let cursor = seed % total;
  for (let i = 0; i < items.length; i += 1) {
    cursor -= weights[i]!;
    if (cursor < 0) {
      return items[i]!;
    }
  }
  return items[items.length - 1]!;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getMetricFromCity(
  key: DailyGoalMetricKey,
  city: GameState['city'],
): number | undefined {
  const field = METRIC_KEY_TO_CITY_FIELD[key];
  if (field) {
    return city[field];
  }
  return undefined;
}

function maxTeamFatigue(personnelState: PersonnelState): number {
  if (!personnelState.teams?.length) return 0;
  return Math.max(...personnelState.teams.map((t) => t.fatigue ?? 0));
}

function resolvedCountForDay(
  decisionHistory: DecisionRecord[],
  day: number,
): number {
  return decisionHistory.filter((r) => r.day === day).length;
}

function isSocialEvent(event: EventCard): boolean {
  const haystack = `${event.category} ${event.eventType ?? ''} ${event.title}`.toLowerCase();
  return haystack.includes('social') || haystack.includes('şikayet') || haystack.includes('gürültü');
}

function buildGoalBase(
  partial: Omit<
    DailyGoal,
    'id' | 'createdAt' | 'progressPercent' | 'isCompleted' | 'isFailed' | 'status'
  > & {
    progressPercent?: number;
    status?: DailyGoalStatus;
  },
): DailyGoal {
  const defaultStatus: DailyGoalStatus =
    partial.status ??
    (partial.priority === 'secondary' ? 'locked' : 'active');
  return {
    ...partial,
    id: createId('daily_goal'),
    createdAt: Date.now(),
    progressPercent: partial.progressPercent ?? 0,
    status: defaultStatus,
    isCompleted: false,
    isFailed: false,
    xpClaimed: false,
  };
}

export function createDay1TutorialGoals(day: number): DailyGoal[] {
  return [
    buildGoalBase({
      day,
      priority: 'primary',
      kind: 'resolve_main_event',
      title: 'İlk olayı çöz',
      description: 'Operasyon merkezindeki ilk olaya müdahale et.',
      shortLabel: 'İlk olay',
      targetValue: 1,
      startValue: 0,
      currentValue: 0,
      rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
      relatedSubsystem: 'general',
    }),
    buildGoalBase({
      day,
      priority: 'secondary',
      kind: 'keep_metric_above',
      metricKey: 'publicSatisfaction',
      title: 'Halk memnuniyetini koru',
      description: 'Memnuniyet seviyesini kritik bandın altına düşürme.',
      shortLabel: 'Memnuniyet',
      targetValue: DAILY_GOAL_THRESHOLDS.satisfactionRisk,
      startValue: DAILY_GOAL_THRESHOLDS.satisfactionMin,
      currentValue: DAILY_GOAL_THRESHOLDS.satisfactionMin,
      rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
      relatedSubsystem: 'general',
      status: 'active' as DailyGoalStatus,
    }),
    buildGoalBase({
      day,
      priority: 'secondary',
      kind: 'complete_day_report',
      title: 'Günü raporla tamamla',
      description: 'Karar verip gün sonu raporunu oluştur.',
      shortLabel: 'Rapor',
      targetValue: 1,
      startValue: 0,
      currentValue: 0,
      rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
      relatedSubsystem: 'general',
      status: 'active' as DailyGoalStatus,
    }),
  ];
}

function buildPrimaryFromEvent(
  day: number,
  event: EventCard,
  neighborhoodName?: string,
): DailyGoal {
  const neighborhoodId =
    normalizeNeighborhoodId(event.neighborhoodId) ??
    normalizeNeighborhoodId(event.district) ??
    event.neighborhoodId;
  const display =
    (neighborhoodId ? getNeighborhoodDisplayName(neighborhoodId) : null) ??
    neighborhoodName ??
    event.district ??
    'Bölge';

  if (isContainerRelevantEvent({
    id: event.id,
    title: event.title,
    category: event.category,
    eventType: event.eventType,
    neighborhoodId: event.neighborhoodId,
    tags: event.filterTags,
  })) {
    return buildGoalBase({
      day,
      priority: 'primary',
      kind: 'avoid_critical_subsystem',
      metricKey: 'containerPressure',
      title: `${display}'de atık baskısını kontrol altına al`,
      description: enrichGoalDescriptionWithIdentity(
        neighborhoodId,
        `Gün bitmeden ${display}'de taşma riskinin kritik seviyeye çıkmasını engelle.`,
      ),
      shortLabel: 'Konteyner',
      targetValue: 1,
      relatedEventId: event.id,
      relatedNeighborhoodId: neighborhoodId,
      relatedSubsystem: 'container',
      rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
      riskText: 'Doluluk baskısı artıyor.',
    });
  }

  if (isSocialEvent(event)) {
    return buildGoalBase({
      day,
      priority: 'primary',
      kind: 'improve_social_pulse',
      metricKey: 'socialPulse',
      title: `${display}'de sosyal baskıyı düşür`,
      description: enrichGoalDescriptionWithIdentity(
        neighborhoodId,
        'Sosyal Nabız skorunu koru ve şikayet yayılımını büyütme.',
      ),
      shortLabel: 'Sosyal',
      targetValue: DAILY_GOAL_THRESHOLDS.socialPulseMin,
      startValue: DAILY_GOAL_THRESHOLDS.socialPulseMin,
      relatedEventId: event.id,
      relatedNeighborhoodId: neighborhoodId,
      relatedSubsystem: 'social',
      rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
    });
  }

  const eventTypeHaystack = `${event.eventType ?? ''} ${event.category}`.toLowerCase();
  if (
    eventTypeHaystack.includes('fatigue') ||
    eventTypeHaystack.includes('staff') ||
    event.riskLevel === 'high' ||
    event.riskLevel === 'critical'
  ) {
    return buildGoalBase({
      day,
      priority: 'primary',
      kind: 'protect_personnel',
      metricKey: 'personnelMorale',
      title: 'Ekibi yormadan müdahale et',
      description: 'Günü personel morali kritik seviyeye düşmeden tamamla.',
      shortLabel: 'Personel',
      targetValue: DAILY_GOAL_THRESHOLDS.moraleMin,
      startValue: DAILY_GOAL_THRESHOLDS.moraleRisk,
      relatedEventId: event.id,
      relatedSubsystem: 'personnel',
      rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
    });
  }

  return buildGoalBase({
    day,
    priority: 'primary',
    kind: 'resolve_main_event',
    title: `Ana olayı çöz: ${event.title}`,
    description: 'Bugünün öncelikli olayına müdahale et.',
    shortLabel: 'Ana olay',
    targetValue: 1,
    relatedEventId: event.id,
    relatedNeighborhoodId: neighborhoodId,
    relatedSubsystem: 'general',
    rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
  });
}

function buildSubsystemPrimary(
  day: number,
  subsystem: DailyGoalSubsystem,
  neighborhoodId?: string,
  neighborhoodName?: string,
): DailyGoal {
  const display = neighborhoodName ?? 'Bölge';
  switch (subsystem) {
    case 'container':
      return buildGoalBase({
        day,
        priority: 'primary',
        kind: 'avoid_critical_subsystem',
        metricKey: 'containerPressure',
        title: `${display}'de taşma riskini kontrol et`,
        description: 'Kritik konteyner baskısı oluşmadan günü tamamla.',
        shortLabel: 'Konteyner',
        targetValue: 1,
        relatedNeighborhoodId: neighborhoodId,
        relatedSubsystem: 'container',
        rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
      });
    case 'vehicle':
      return buildGoalBase({
        day,
        priority: 'primary',
        kind: 'avoid_critical_subsystem',
        metricKey: 'vehicleRisk',
        title: 'Filo bakım riskini kontrol et',
        description: 'Araç filosunda kritik arıza riski oluşturma.',
        shortLabel: 'Filo',
        targetValue: 1,
        relatedSubsystem: 'vehicle',
        rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
      });
    case 'social':
      return buildGoalBase({
        day,
        priority: 'primary',
        kind: 'improve_social_pulse',
        metricKey: 'socialPulse',
        title: 'Sosyal Nabız baskısını düşür',
        description: 'Kamuoyu baskısını kontrol altında tut.',
        shortLabel: 'Sosyal',
        targetValue: DAILY_GOAL_THRESHOLDS.socialPulseMin,
        relatedSubsystem: 'social',
        rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
      });
    default:
      return buildBalancedPrimary(day);
  }
}

function buildBalancedPrimary(day: number): DailyGoal {
  return buildGoalBase({
    day,
    priority: 'primary',
    kind: 'keep_metric_above',
    metricKey: 'publicSatisfaction',
    title: 'Günü dengede tamamla',
    description: 'Halk memnuniyeti ve operasyon riskini kontrol altında tut.',
    shortLabel: 'Denge',
    targetValue: DAILY_GOAL_THRESHOLDS.satisfactionMin,
    startValue: DAILY_GOAL_THRESHOLDS.satisfactionMin,
    rewardXp: DEFAULT_GOAL_REWARD_XP.primary,
    relatedSubsystem: 'general',
  });
}

function detectCriticalSubsystem(input: CreateDailyGoalsInput): DailyGoalSubsystem | null {
  const worstContainer = selectWorstContainerNeighborhood(input.containerState);
  if (worstContainer && worstContainer.criticalContainerCount > 0) {
    return 'container';
  }
  if (input.vehicleState.aggregates.criticalCount >= 2) {
    return 'vehicle';
  }
  if (input.socialPulseState.globalPulseScore < DAILY_GOAL_THRESHOLDS.socialPulseRisk) {
    return 'social';
  }
  if (maxTeamFatigue(input.personnelState) >= DAILY_GOAL_THRESHOLDS.fatigueMax) {
    return 'personnel';
  }
  return null;
}

function pickSecondaryGoals(
  day: number,
  primary: DailyGoal,
  input: CreateDailyGoalsInput,
  seed: number,
): DailyGoal[] {
  const candidates: Array<() => DailyGoal> = [
    () =>
      buildGoalBase({
        day,
        priority: 'secondary',
        kind: 'keep_metric_below',
        metricKey: 'operationRisk',
        title: 'Operasyon riskini sınırla',
        description: `Risk skorunu ${DAILY_GOAL_THRESHOLDS.riskMax} altında tut.`,
        shortLabel: 'Risk',
        targetValue: DAILY_GOAL_THRESHOLDS.riskMax,
        startValue: input.gameState.city.riskScore,
        rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
        relatedSubsystem: 'general',
        status: 'active',
      }),
    () =>
      buildGoalBase({
        day,
        priority: 'secondary',
        kind: 'protect_budget',
        metricKey: 'budget',
        title: 'Bütçeyi koru',
        description: 'Kaynakları fazla eritmeden günü kapat.',
        shortLabel: 'Bütçe',
        targetValue: DAILY_GOAL_THRESHOLDS.budgetRisk,
        startValue: input.gameState.city.budget,
        rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
        relatedSubsystem: 'general',
        status: 'active',
      }),
    () =>
      buildGoalBase({
        day,
        priority: 'secondary',
        kind: 'resolve_event_count',
        metricKey: 'resolvedEvents',
        title: 'En az 1 olay çöz',
        description: 'Bugün en az bir operasyon olayını kapat.',
        shortLabel: '1 olay',
        targetValue: 1,
        rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
        relatedSubsystem: 'general',
        status: 'active',
      }),
    () =>
      buildGoalBase({
        day,
        priority: 'secondary',
        kind: 'protect_personnel',
        metricKey: 'personnelMorale',
        title: 'Personel moralini koru',
        description: `Morali %${DAILY_GOAL_THRESHOLDS.moraleMin} altına düşürme.`,
        shortLabel: 'Moral',
        targetValue: DAILY_GOAL_THRESHOLDS.moraleMin,
        startValue: input.gameState.city.morale,
        rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
        relatedSubsystem: 'personnel',
        status: 'active',
      }),
    () =>
      buildGoalBase({
        day,
        priority: 'secondary',
        kind: 'improve_social_pulse',
        metricKey: 'socialPulse',
        title: 'Sosyal nabzı koru',
        description: 'Sosyal skoru gün içinde düşürme.',
        shortLabel: 'Sosyal',
        targetValue: DAILY_GOAL_THRESHOLDS.socialPulseMin,
        startValue: input.socialPulseState.globalPulseScore,
        rewardXp: DEFAULT_GOAL_REWARD_XP.secondary,
        relatedSubsystem: 'social',
        status: 'active',
      }),
  ];

  const filtered = candidates.filter((factory) => {
    const draft = factory();
    if (draft.kind === primary.kind && draft.metricKey === primary.metricKey) {
      return false;
    }
    return true;
  });

  const neighborhoodId = normalizeNeighborhoodId(primary.relatedNeighborhoodId);
  const weightFor = (factory: () => DailyGoal) => {
    const draft = factory();
    if (!neighborhoodId || !draft.metricKey) {
      return 1;
    }
    return 1 + getNeighborhoodGoalBias(neighborhoodId, draft.metricKey);
  };

  const firstFactory = pickWeightedDeterministic(filtered, seed, weightFor);
  const secondPool = filtered.filter((f) => f !== firstFactory);
  const secondFactory = pickWeightedDeterministic(secondPool, seed + 1, weightFor);

  return [firstFactory(), secondFactory()];
}

export function createDailyGoalsForDay(input: CreateDailyGoalsInput): DailyGoalState {
  const day = Math.max(1, Math.floor(input.day));

  if (input.isDay1Tutorial || day === 1) {
    return {
      day,
      goals: createDay1TutorialGoals(day),
      lastEvaluatedAt: Date.now(),
    };
  }

  const featured =
    input.gameState.events.find((e) => e.id === input.gameState.featuredEventId) ??
    input.gameState.events[0];

  const neighborhood = featured?.neighborhoodId
    ? input.neighborhoods.find((n) => n.id === featured.neighborhoodId)
    : input.neighborhoods.find((n) => n.name === featured?.district);

  let primary: DailyGoal;
  if (featured) {
    primary = buildPrimaryFromEvent(day, featured, neighborhood?.name);
  } else {
    const critical = detectCriticalSubsystem(input);
    primary = critical
      ? buildSubsystemPrimary(day, critical)
      : buildBalancedPrimary(day);
  }

  const seed = hashSeed(day, featured?.id ?? 'none', input.gameState.city.riskScore);
  const secondaries = pickSecondaryGoals(day, primary, input, seed);

  return {
    day,
    goals: [primary, ...secondaries],
    lastEvaluatedAt: Date.now(),
  };
}

/** Geriye uyumluluk — tek hedef API’si kullanan eski importlar için. */
export function createDailyGoalForDay(day: number): DailyGoal {
  const goals = createDay1TutorialGoals(Math.max(1, day));
  return goals.find((g) => g.priority === 'primary') ?? goals[0]!;
}

export function ensureDailyGoalsForDay(
  input: CreateDailyGoalsInput,
  existing: DailyGoalState | null | undefined,
): DailyGoalState {
  const day = Math.max(1, Math.floor(input.day));
  if (existing?.day === day && existing.goals.length > 0) {
    return existing;
  }
  return createDailyGoalsForDay(input);
}

function computeProgressPercent(
  goal: DailyGoal,
  current: number,
  target: number,
  kind: DailyGoalKind,
): number {
  if (kind === 'keep_metric_above') {
    if (target <= 0) return 0;
    return clampPercent((current / target) * 100);
  }
  if (kind === 'keep_metric_below') {
    if (goal.startValue == null || goal.startValue === target) {
      return current <= target ? 100 : clampPercent((target / Math.max(current, 1)) * 100);
    }
    const span = Math.max(1, goal.startValue - target);
    const improved = goal.startValue - current;
    return clampPercent((improved / span) * 100);
  }
  if (kind === 'resolve_event_count' || kind === 'resolve_main_event' || kind === 'complete_day_report') {
    return clampPercent((current / Math.max(1, target)) * 100);
  }
  return clampPercent(current * 100);
}

function finalizeProtectionStatus(
  goal: DailyGoal,
  current: number,
  target: number,
  trigger: DailyGoalEvaluationTrigger,
  kind: DailyGoalKind,
): Pick<DailyGoal, 'status' | 'isCompleted' | 'isFailed' | 'progressPercent' | 'currentValue'> {
  const progressPercent = computeProgressPercent(goal, current, target, kind);

  if (goal.isCompleted && goal.kind !== 'keep_metric_above' && goal.kind !== 'keep_metric_below') {
    return {
      status: 'completed',
      isCompleted: true,
      isFailed: false,
      progressPercent: 100,
      currentValue: current,
    };
  }

  if (kind === 'keep_metric_above') {
    if (current >= target) {
      return {
        status: 'completed',
        isCompleted: true,
        isFailed: false,
        progressPercent: 100,
        currentValue: current,
      };
    }
    if (current >= target - 8) {
      return {
        status: trigger === 'end_of_day' ? 'failed' : 'at_risk',
        isCompleted: false,
        isFailed: trigger === 'end_of_day',
        progressPercent,
        currentValue: current,
      };
    }
    return {
      status: trigger === 'end_of_day' ? 'failed' : 'active',
      isCompleted: false,
      isFailed: trigger === 'end_of_day',
      progressPercent,
      currentValue: current,
    };
  }

  if (kind === 'keep_metric_below') {
    if (current <= target) {
      return {
        status: 'completed',
        isCompleted: true,
        isFailed: false,
        progressPercent: 100,
        currentValue: current,
      };
    }
    if (current <= target + 6) {
      return {
        status: 'at_risk',
        isCompleted: false,
        isFailed: false,
        progressPercent,
        currentValue: current,
      };
    }
    return {
      status: trigger === 'end_of_day' ? 'failed' : 'at_risk',
      isCompleted: false,
      isFailed: trigger === 'end_of_day',
      progressPercent,
      currentValue: current,
    };
  }

  return {
    status: 'active',
    isCompleted: false,
    isFailed: false,
    progressPercent,
    currentValue: current,
  };
}

export function evaluateSingleGoal(
  goal: DailyGoal,
  input: DailyGoalEvaluationInput,
): DailyGoal {
  if (goal.status === 'locked' && goal.priority === 'secondary') {
    const primaryDone = input.dailyGoalRuntime.primaryCompletedHint;
    if (!primaryDone) {
      return goal;
    }
  }

  const { gameState, containerState, vehicleState, personnelState, socialPulseState } =
    input;
  const trigger = input.trigger;
  const city = gameState.city;
  const resolvedToday = resolvedCountForDay(input.decisionHistory, goal.day);
  const solvedIds = new Set(gameState.solvedEvents.map((e) => e.id));

  let next: DailyGoal = { ...goal, status: goal.priority === 'primary' ? 'active' : goal.status };

  switch (goal.kind) {
    case 'resolve_main_event': {
      const done =
        goal.relatedEventId != null
          ? solvedIds.has(goal.relatedEventId)
          : resolvedToday >= 1;
      next.currentValue = done ? 1 : 0;
      next.progressPercent = done ? 100 : 0;
      if (done) {
        next = {
          ...next,
          status: 'completed',
          isCompleted: true,
          isFailed: false,
          completedAt: next.completedAt ?? Date.now(),
        };
      }
      break;
    }
    case 'resolve_event_count': {
      next.currentValue = resolvedToday;
      next.progressPercent = computeProgressPercent(
        goal,
        resolvedToday,
        goal.targetValue ?? 1,
        goal.kind,
      );
      if (resolvedToday >= (goal.targetValue ?? 1)) {
        next = {
          ...next,
          status: 'completed',
          isCompleted: true,
          isFailed: false,
          completedAt: next.completedAt ?? Date.now(),
        };
      }
      break;
    }
    case 'complete_day_report': {
      const reported =
        input.lastClosedDay === goal.day ||
        (trigger === 'end_of_day' && resolvedToday > 0);
      next.currentValue = reported ? 1 : 0;
      next.progressPercent = reported ? 100 : trigger === 'end_of_day' ? 0 : 50;
      if (reported) {
        next = {
          ...next,
          status: 'completed',
          isCompleted: true,
          isFailed: false,
          completedAt: next.completedAt ?? Date.now(),
        };
      } else if (trigger === 'end_of_day') {
        next = { ...next, status: 'failed', isFailed: true, failedAt: Date.now() };
      }
      break;
    }
    case 'avoid_critical_subsystem': {
      let critical = false;
      if (goal.relatedSubsystem === 'container' || goal.metricKey === 'containerPressure') {
        const nid = normalizeContainerNeighborhoodId(
          goal.relatedNeighborhoodId ?? goal.relatedEventId,
        );
        const status = nid
          ? selectNeighborhoodContainerStatus(containerState, nid)
          : selectWorstContainerNeighborhood(containerState);
        critical = (status?.criticalContainerCount ?? 0) > 0;
        next.currentValue = critical ? 1 : 0;
      } else if (goal.relatedSubsystem === 'vehicle' || goal.metricKey === 'vehicleRisk') {
        critical = vehicleState.aggregates.criticalCount > 0;
        next.currentValue = critical ? 1 : 0;
      } else {
        critical = false;
        next.currentValue = 0;
      }
      if (!critical && trigger === 'end_of_day') {
        next = {
          ...next,
          status: 'completed',
          isCompleted: true,
          isFailed: false,
          progressPercent: 100,
          completedAt: next.completedAt ?? Date.now(),
        };
      } else if (critical) {
        next = {
          ...next,
          status: trigger === 'end_of_day' ? 'failed' : 'at_risk',
          isFailed: trigger === 'end_of_day',
          isCompleted: false,
          progressPercent: critical ? 20 : 80,
        };
      } else {
        next = { ...next, status: 'active', progressPercent: 70 };
      }
      break;
    }
    case 'improve_social_pulse': {
      const current = socialPulseState.globalPulseScore;
      const target = goal.targetValue ?? DAILY_GOAL_THRESHOLDS.socialPulseMin;
      const patch = finalizeProtectionStatus(goal, current, target, trigger, goal.kind);
      next = { ...next, ...patch };
      break;
    }
    case 'protect_personnel': {
      const current = city.morale;
      const target = goal.targetValue ?? DAILY_GOAL_THRESHOLDS.moraleMin;
      const patch = finalizeProtectionStatus(goal, current, target, trigger, goal.kind);
      next = { ...next, ...patch };
      if (maxTeamFatigue(personnelState) >= DAILY_GOAL_THRESHOLDS.fatigueMax && !next.isCompleted) {
        next.status = trigger === 'end_of_day' ? 'failed' : 'at_risk';
        next.isFailed = trigger === 'end_of_day';
      }
      break;
    }
    case 'protect_budget': {
      const current = city.budget;
      const target = goal.targetValue ?? DAILY_GOAL_THRESHOLDS.budgetRisk;
      const exceeded = input.dailyGoalRuntime.budgetExceededToday;
      if (exceeded && trigger === 'end_of_day') {
        next = {
          ...next,
          status: 'failed',
          isFailed: true,
          failedAt: Date.now(),
          currentValue: current,
          progressPercent: 30,
        };
      } else {
        const patch = finalizeProtectionStatus(goal, current, target, trigger, 'keep_metric_above');
        next = { ...next, ...patch, currentValue: current };
      }
      break;
    }
    case 'reduce_neighborhood_pressure': {
      const nid = normalizeContainerNeighborhoodId(goal.relatedNeighborhoodId);
      const status = nid ? selectNeighborhoodContainerStatus(containerState, nid) : null;
      const fill = status?.averageFillRate ?? 0;
      const start = goal.startValue ?? fill;
      next.currentValue = fill;
      next.progressPercent =
        start > fill
          ? clampPercent(((start - fill) / Math.max(1, start)) * 100)
          : fill < DAILY_GOAL_THRESHOLDS.containerFillRisk
            ? 100
            : 40;
      if (fill < DAILY_GOAL_THRESHOLDS.containerFillRisk || (status?.criticalContainerCount ?? 0) === 0) {
        next = {
          ...next,
          status: 'completed',
          isCompleted: true,
          isFailed: false,
          progressPercent: 100,
        };
      }
      break;
    }
    default: {
      const metricKey = goal.metricKey ?? 'publicSatisfaction';
      const current = getMetricFromCity(metricKey, city) ?? 0;
      const target =
        goal.targetValue ??
        (goal.kind === 'keep_metric_below'
          ? DAILY_GOAL_THRESHOLDS.riskMax
          : DAILY_GOAL_THRESHOLDS.satisfactionMin);
      const patch = finalizeProtectionStatus(goal, current, target, trigger, goal.kind);
      next = { ...next, ...patch };
      break;
    }
  }

  if (next.priority === 'secondary' && next.status !== 'locked') {
    const primary = input.dailyGoalRuntime.primaryCompletedHint;
    if (!primary && next.status === 'active') {
      // secondary stays active
    }
  }

  if (next.isCompleted && !next.completedAt) {
    next.completedAt = Date.now();
  }

  return next;
}

export function evaluateDailyGoals(
  state: DailyGoalState,
  input: DailyGoalEvaluationInput,
): DailyGoalState {
  const primaryCompleted = state.goals.some(
    (g) => g.priority === 'primary' && g.isCompleted,
  );
  const runtime = {
    ...input.dailyGoalRuntime,
    primaryCompletedHint: primaryCompleted,
  };

  const goals = state.goals.map((goal) => {
    let evaluated = evaluateSingleGoal(goal, { ...input, dailyGoalRuntime: runtime });
    if (goal.priority === 'secondary' && evaluated.status === 'locked' && primaryCompleted) {
      evaluated = { ...evaluated, status: 'active' };
      evaluated = evaluateSingleGoal(evaluated, { ...input, dailyGoalRuntime: runtime });
    }
    return evaluated;
  });

  return {
    ...state,
    goals,
    lastEvaluatedAt: Date.now(),
  };
}

export function claimDailyGoalXp(params: {
  playerProgress: PlayerProgress;
  goal: DailyGoal;
}): DailyGoalClaimResult {
  const previousLevel = params.playerProgress.currentLevel;
  const reward = params.goal.rewardXp ?? 0;

  if (!params.goal.isCompleted || params.goal.xpClaimed || reward <= 0) {
    return {
      goal: params.goal,
      playerProgress: params.playerProgress,
      leveledUp: false,
      previousLevel,
      newLevel: params.playerProgress.currentLevel,
    };
  }

  const transaction: XpTransaction = {
    id: createId('xp'),
    day: params.goal.day,
    amount: reward,
    category: 'daily_goal',
    sourceId: params.goal.id,
    sourceType: 'goal',
    title: 'Günlük hedef tamamlandı',
    description: params.goal.title,
    createdAt: new Date().toISOString(),
  };

  const applyResult = applyXpTransactions(params.playerProgress, [transaction]);

  return {
    goal: { ...params.goal, xpClaimed: true },
    playerProgress: applyResult.progress,
    xpTransaction: transaction,
    leveledUp: applyResult.leveledUp,
    previousLevel: applyResult.previousLevel,
    newLevel: applyResult.newLevel,
  };
}

export function claimAllCompletedGoalXp(
  goals: DailyGoal[],
  playerProgress: PlayerProgress,
): { goals: DailyGoal[]; playerProgress: PlayerProgress; claims: DailyGoalClaimResult[] } {
  let progress = playerProgress;
  const claims: DailyGoalClaimResult[] = [];
  const updatedGoals = goals.map((goal) => {
    if (!goal.isCompleted || goal.xpClaimed) {
      return goal;
    }
    const claim = claimDailyGoalXp({ goal, playerProgress: progress });
    if (claim.xpTransaction) {
      claims.push(claim);
      progress = claim.playerProgress;
      return claim.goal;
    }
    return goal;
  });
  return { goals: updatedGoals, playerProgress: progress, claims };
}
