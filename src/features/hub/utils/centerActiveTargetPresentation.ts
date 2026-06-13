import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import type { DailyGoal, DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import { formatGoalProgress } from '@/core/dailyGoals/dailyGoalPresentation';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import type { MainOperationFeelHubPresentation } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { GameState } from '@/core/models/GameState';
import type {
  OperationDomainSignal,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

import { formatHubTaskRewardLabel } from './hubScreenPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';

export const CENTER_ACTIVE_TARGET_MAX_IMPACTS = 3;

export type CenterActiveTargetDomain =
  | 'transport'
  | 'environment'
  | 'energy'
  | 'social'
  | 'logistics'
  | 'general';

export type CenterActiveTargetStatus =
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'locked'
  | 'empty';

export type CenterActiveTargetPriority = 'low' | 'normal' | 'high' | 'urgent';

export type CenterActiveTargetProgress = {
  label: string;
  current: number;
  target: number;
  valueText: string;
  progressRatio: number;
};

export type CenterActiveTargetRewardTone =
  | 'gold'
  | 'green'
  | 'teal'
  | 'purple'
  | 'neutral';

export type CenterActiveTargetReward = {
  label: string;
  valueText?: string;
  iconKey: string;
  tone: CenterActiveTargetRewardTone;
};

export type CenterActiveTargetImpactId =
  | 'trust'
  | 'happiness'
  | 'resource'
  | 'risk'
  | 'authority'
  | 'district';

export type CenterActiveTargetImpact = {
  id: CenterActiveTargetImpactId;
  label: string;
  valueText: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type CenterActiveTargetActionKey =
  | 'start_operation'
  | 'continue_operation'
  | 'view_result'
  | 'view_plan'
  | 'locked'
  | 'none';

export type CenterActiveTargetCta = {
  label: string;
  route?: string;
  actionKey: CenterActiveTargetActionKey;
  enabled: boolean;
};

export type CenterActiveTargetMotionHint = {
  shouldPulseCta: boolean;
  shouldHighlightProgress: boolean;
  revealLevel: 'none' | 'soft' | 'strong';
};

export type CenterActiveTarget = {
  visibility: CenterHomeVisibilityState;
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  categoryLabel?: string;
  domain: CenterActiveTargetDomain;
  status: CenterActiveTargetStatus;
  priority: CenterActiveTargetPriority;
  progress?: CenterActiveTargetProgress;
  reward?: CenterActiveTargetReward;
  impactPreview: CenterActiveTargetImpact[];
  cta: CenterActiveTargetCta;
  helperText?: string;
  sourceLabel?: string;
  motionHint?: CenterActiveTargetMotionHint;
  accessibilityLabel: string;
};

export type BuildCenterActiveTargetInput = {
  gameState: GameState;
  day: number;
  dailyGoalState?: DailyGoalState | null;
  mainOperationFeelPresentation?: MainOperationFeelHubPresentation | null;
  operationSignals?: OperationSignalsState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubEceContextLine?: string | null;
  hubImpactExplanationLine?: string | null;
  dailyRewardHelperText?: string | null;
  cardVisibility?: HubCardVisibilityModel;
};

const ALLOWED_STATUSES: CenterActiveTargetStatus[] = [
  'ready',
  'in_progress',
  'completed',
  'locked',
  'empty',
];

const ALLOWED_ACTION_KEYS: CenterActiveTargetActionKey[] = [
  'start_operation',
  'continue_operation',
  'view_result',
  'view_plan',
  'locked',
  'none',
];

const DAY1_IMPACTS: CenterActiveTargetImpact[] = [
  {
    id: 'authority',
    label: 'Merkez',
    valueText: 'Akış açılır',
    tone: 'positive',
    iconKey: 'home-outline',
  },
  {
    id: 'trust',
    label: 'Ece',
    valueText: 'Rehberlik başlar',
    tone: 'positive',
    iconKey: 'chatbubble-ellipses-outline',
  },
  {
    id: 'happiness',
    label: 'Seri',
    valueText: 'Hazırlanır',
    tone: 'neutral',
    iconKey: 'flame-outline',
  },
];

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function dedupeDescription(
  description: string,
  avoid: Array<string | null | undefined>,
  fallback: string,
): string {
  const trimmed = description.trim();
  if (!trimmed) return fallback;
  if (avoid.some((line) => linesAreDuplicate(trimmed, line))) {
    return fallback;
  }
  return trimmed;
}

function resolveVisibility(status: CenterActiveTargetStatus): CenterHomeVisibilityState {
  if (status === 'locked') return 'locked';
  return 'visible';
}

function resolveDomainFromSubsystem(
  subsystem?: DailyGoal['relatedSubsystem'],
): CenterActiveTargetDomain {
  switch (subsystem) {
    case 'vehicle':
      return 'transport';
    case 'container':
      return 'environment';
    case 'personnel':
      return 'energy';
    case 'social':
      return 'social';
    default:
      return 'general';
  }
}

function resolveDomainFromSignal(domain: OperationDomainSignal['domain']): CenterActiveTargetDomain {
  switch (domain) {
    case 'vehicles':
      return 'transport';
    case 'containers':
      return 'environment';
    case 'personnel':
      return 'energy';
    case 'districts':
      return 'social';
    default:
      return 'general';
  }
}

function resolvePriorityFromGoal(goal: DailyGoal): CenterActiveTargetPriority {
  if (goal.status === 'at_risk' || goal.isFailed) return 'urgent';
  if (goal.priority === 'primary') return 'high';
  return 'normal';
}

function resolveStatusFromGoal(goal: DailyGoal): CenterActiveTargetStatus {
  if (goal.isCompleted) return 'completed';
  if (goal.status === 'locked') return 'locked';
  if (goal.status === 'active' || goal.status === 'at_risk' || goal.isFailed) {
    return 'in_progress';
  }
  return 'ready';
}

function buildMotionHint(
  status: CenterActiveTargetStatus,
  priority: CenterActiveTargetPriority,
): CenterActiveTargetMotionHint {
  return {
    shouldPulseCta:
      (status === 'ready' || status === 'in_progress') &&
      (priority === 'high' || priority === 'urgent'),
    shouldHighlightProgress: status === 'in_progress',
    revealLevel:
      priority === 'urgent' ? 'strong' : status === 'ready' ? 'soft' : 'none',
  };
}

function buildCta(
  status: CenterActiveTargetStatus,
  options?: { day1?: boolean; completed?: boolean },
): CenterActiveTargetCta {
  if (status === 'completed') {
    return {
      label: 'Sonucu Gör',
      route: '/reports',
      actionKey: 'view_result',
      enabled: true,
    };
  }
  if (status === 'locked') {
    return {
      label: 'Yakında Açılır',
      actionKey: 'locked',
      enabled: false,
    };
  }
  if (status === 'empty') {
    return {
      label: 'Operasyonları Gör',
      route: '/events',
      actionKey: 'view_plan',
      enabled: true,
    };
  }
  if (options?.day1) {
    return {
      label: 'İlk Olayı İncele',
      route: '/events',
      actionKey: 'start_operation',
      enabled: true,
    };
  }
  if (status === 'in_progress') {
    return {
      label: 'Devam Et',
      route: '/events',
      actionKey: 'continue_operation',
      enabled: true,
    };
  }
  return {
    label: 'Operasyonu Başlat',
    route: '/events',
    actionKey: 'start_operation',
    enabled: true,
  };
}

function buildGoalProgress(goal: DailyGoal): CenterActiveTargetProgress | undefined {
  if (goal.isCompleted) {
    return {
      label: 'İlerleme',
      current: 1,
      target: 1,
      valueText: 'Tamam',
      progressRatio: 1,
    };
  }

  if (goal.kind === 'resolve_event_count' || goal.kind === 'resolve_main_event') {
    const current = Math.max(0, goal.currentValue ?? 0);
    const target = Math.max(1, goal.targetValue ?? 1);
    return {
      label: 'İlerleme',
      current,
      target,
      valueText: `${current}/${target} adım`,
      progressRatio: clampRatio(current / target),
    };
  }

  if (goal.progressPercent > 0) {
    const rounded = Math.round(goal.progressPercent);
    return {
      label: 'İlerleme',
      current: rounded,
      target: 100,
      valueText: `%${rounded}`,
      progressRatio: clampRatio(goal.progressPercent / 100),
    };
  }

  return undefined;
}

function buildGoalReward(goal: DailyGoal): CenterActiveTargetReward | undefined {
  const rewardText =
    goal.rewardText?.trim() || formatHubTaskRewardLabel(goal.rewardXp) || undefined;
  if (!rewardText) return undefined;
  if (/elmas|gem|diamond/i.test(rewardText)) return undefined;

  return {
    label: rewardText,
    valueText: rewardText,
    iconKey: 'flash-outline',
    tone: goal.isCompleted ? 'green' : 'gold',
  };
}

function buildGoalImpacts(goal: DailyGoal): CenterActiveTargetImpact[] {
  const impacts: CenterActiveTargetImpact[] = [];

  switch (goal.metricKey) {
    case 'publicSatisfaction':
    case 'socialPulse':
      impacts.push({
        id: 'happiness',
        label: 'Mutluluk',
        valueText: 'Artabilir',
        tone: 'positive',
        iconKey: 'happy-outline',
      });
      break;
    case 'operationRisk':
      impacts.push({
        id: 'risk',
        label: 'Risk',
        valueText: 'Azalır',
        tone: 'positive',
        iconKey: 'shield-checkmark-outline',
      });
      break;
    case 'budget':
      impacts.push({
        id: 'resource',
        label: 'Kaynak',
        valueText: 'Denge gerekir',
        tone: 'warning',
        iconKey: 'cube-outline',
      });
      break;
    default:
      break;
  }

  if (goal.riskText?.trim() && impacts.length < CENTER_ACTIVE_TARGET_MAX_IMPACTS) {
    impacts.push({
      id: 'risk',
      label: 'Dikkat',
      valueText: 'Risk sinyali',
      tone: 'warning',
      iconKey: 'alert-circle-outline',
    });
  }

  return impacts.slice(0, CENTER_ACTIVE_TARGET_MAX_IMPACTS);
}

function buildGoalHelperText(
  goal: DailyGoal,
  status: CenterActiveTargetStatus,
): string | undefined {
  if (status === 'completed') {
    return 'Bugünkü hedef tamamlandı.';
  }
  if (goal.status === 'at_risk') {
    return 'Yüksek risk sinyali var; hızlı müdahale önerilir.';
  }
  if (status === 'ready') {
    return 'Önce incele, sonra ekibi yönlendir.';
  }
  if (status === 'in_progress') {
    return 'Tamamlarsan günlük seri açılır.';
  }
  return undefined;
}

function buildFromDailyGoal(
  goal: DailyGoal,
  input: BuildCenterActiveTargetInput,
): CenterActiveTarget {
  const status = resolveStatusFromGoal(goal);
  const priority = resolvePriorityFromGoal(goal);
  const progress = status === 'locked' ? undefined : buildGoalProgress(goal);
  const description = dedupeDescription(
    goal.description,
    [input.hubEceContextLine, input.hubTomorrowRisk?.mainLine, input.hubImpactExplanationLine],
    'Bu hedef tamamlanırsa şehir dengesi güçlenebilir.',
  );

  const target: CenterActiveTarget = {
    visibility: resolveVisibility(status),
    id: goal.id,
    title: goal.title,
    subtitle: goal.shortLabel?.trim() || undefined,
    description,
    categoryLabel: 'Günlük hedef',
    domain: resolveDomainFromSubsystem(goal.relatedSubsystem),
    status,
    priority,
    progress,
    reward: buildGoalReward(goal),
    impactPreview: buildGoalImpacts(goal),
    cta: buildCta(status),
    helperText: buildGoalHelperText(goal, status),
    sourceLabel: 'Günlük hedef',
    motionHint: buildMotionHint(status, priority),
    accessibilityLabel: '',
  };

  target.accessibilityLabel = buildAccessibilityLabel(target);
  return target;
}

function buildFromMainOperation(
  feel: MainOperationFeelHubPresentation,
  input: BuildCenterActiveTargetInput,
): CenterActiveTarget {
  const status: CenterActiveTargetStatus = 'in_progress';
  const priority: CenterActiveTargetPriority =
    feel.model.tone === 'watch' || feel.model.tone === 'recovery' ? 'high' : 'normal';
  const focusDomain = input.operationSignals?.dailyFocus;
  const domain: CenterActiveTargetDomain =
    focusDomain === 'vehicles'
      ? 'transport'
      : focusDomain === 'containers'
        ? 'environment'
        : focusDomain === 'personnel'
          ? 'energy'
          : focusDomain === 'districts'
            ? 'social'
            : 'general';

  const description = dedupeDescription(
    feel.heroSubtitle || feel.scopeLine || feel.detailLine || feel.model.subtitle,
    [input.hubEceContextLine, feel.model.eceLine],
    'Ana operasyon hattında ilerlemek şehir dengesini güçlendirebilir.',
  );

  const impacts: CenterActiveTargetImpact[] = [];
  if (feel.scopeLine?.trim()) {
    impacts.push({
      id: 'district',
      label: 'Operasyon',
      valueText: 'Etki beklenir',
      tone: 'neutral',
      iconKey: 'pulse-outline',
    });
  }
  if (input.hubTomorrowRisk?.priority === 'high') {
    impacts.push({
      id: 'risk',
      label: 'Risk',
      valueText: 'Yarın riski düşer',
      tone: 'positive',
      iconKey: 'trending-down-outline',
    });
  }

  const target: CenterActiveTarget = {
    visibility: 'visible',
    id: 'main-operation-feel',
    title: feel.heroTitle,
    subtitle: feel.scopeLine?.trim() || undefined,
    description,
    categoryLabel: 'Ana operasyon',
    domain,
    status,
    priority,
    progress: feel.scopeLine
      ? {
          label: 'İlerleme',
          current: feel.compact ? 45 : 25,
          target: 100,
          valueText: 'Devam ediyor',
          progressRatio: feel.compact ? 0.45 : 0.25,
        }
      : undefined,
    reward: {
      label: 'Operasyon etkisi',
      iconKey: 'flash-outline',
      tone: 'teal',
    },
    impactPreview: impacts.slice(0, CENTER_ACTIVE_TARGET_MAX_IMPACTS),
    cta: {
      label: feel.ctaLabel?.trim() || 'Devam Et',
      route: '/events',
      actionKey: 'continue_operation',
      enabled: true,
    },
    helperText: 'Ana operasyon hattında ilerle.',
    sourceLabel: 'Ana operasyon',
    motionHint: buildMotionHint(status, priority),
    accessibilityLabel: '',
  };

  target.accessibilityLabel = buildAccessibilityLabel(target);
  return target;
}

function pickHighPrioritySignal(
  signals?: OperationSignalsState | null,
): OperationDomainSignal | null {
  if (!signals) return null;

  const domains = [
    signals.vehicles,
    signals.containers,
    signals.personnel,
    signals.districts,
    signals.overall,
  ];

  const critical = domains
    .filter((signal) => signal.status === 'critical')
    .sort((a, b) => b.score - a.score);
  if (critical.length > 0) return critical[0]!;

  const strained = domains
    .filter((signal) => signal.status === 'strained')
    .sort((a, b) => b.score - a.score);
  if (strained.length > 0) return strained[0]!;

  return null;
}

function buildFromOperationSignal(
  signal: OperationDomainSignal,
  input: BuildCenterActiveTargetInput,
): CenterActiveTarget {
  const status: CenterActiveTargetStatus = 'ready';
  const priority: CenterActiveTargetPriority =
    signal.status === 'critical' ? 'urgent' : 'high';
  const description = dedupeDescription(
    signal.summary,
    [input.hubEceContextLine, input.operationSignals?.overall.summary],
    'Operasyon sinyali hızlı müdahale gerektirebilir.',
  );

  const target: CenterActiveTarget = {
    visibility: 'visible',
    id: `operation-signal-${signal.domain}`,
    title: signal.title,
    subtitle: signal.status === 'critical' ? 'Acil sinyal' : 'Operasyon sinyali',
    description,
    categoryLabel: 'Operasyon sinyali',
    domain: resolveDomainFromSignal(signal.domain),
    status,
    priority,
    progress: undefined,
    reward: {
      label: 'Denge kazanımı',
      iconKey: 'shield-checkmark-outline',
      tone: 'teal',
    },
    impactPreview: [
      {
        id: 'risk',
        label: 'Risk',
        valueText: signal.status === 'critical' ? 'Yüksek' : 'İzleniyor',
        tone: signal.status === 'critical' ? 'warning' : 'neutral',
        iconKey: 'alert-circle-outline',
      },
      {
        id: 'happiness',
        label: 'Mutluluk',
        valueText: 'Etkilenebilir',
        tone: 'neutral',
        iconKey: 'happy-outline',
      },
    ],
    cta: buildCta(status),
    helperText: 'Yüksek risk sinyali var; hızlı müdahale önerilir.',
    sourceLabel: 'Operasyon sinyali',
    motionHint: buildMotionHint(status, priority),
    accessibilityLabel: '',
  };

  target.accessibilityLabel = buildAccessibilityLabel(target);
  return target;
}

function buildDay1Fallback(input: BuildCenterActiveTargetInput): CenterActiveTarget {
  const featuredEvent =
    input.gameState.events.find((event) => event.id === input.gameState.featuredEventId) ??
    input.gameState.events[0];
  const eventTitle = featuredEvent?.title?.trim();

  const description = dedupeDescription(
    eventTitle
      ? `${eventTitle} üzerinden şehri tanıyarak ilk kararı ver.`
      : 'Şehri tanımak için ilk olayı incele ve ekibi yönlendir.',
    [input.hubEceContextLine, input.dailyRewardHelperText],
    'Şehri tanımak için ilk olayı incele ve ekibi yönlendir.',
  );

  const target: CenterActiveTarget = {
    visibility: 'visible',
    id: 'day1-entry',
    title: 'İlk Operasyonu Başlat',
    description,
    categoryLabel: 'Başlangıç',
    domain: 'general',
    status: 'ready',
    priority: 'high',
    reward: {
      label: 'Başlangıç ödülü',
      iconKey: 'gift-outline',
      tone: 'gold',
    },
    impactPreview: DAY1_IMPACTS,
    cta: buildCta('ready', { day1: true }),
    helperText: 'Başlamak için hazır. Tamamlarsan günlük seri açılır.',
    sourceLabel: 'Başlangıç hedefi',
    motionHint: buildMotionHint('ready', 'high'),
    accessibilityLabel: '',
  };

  target.accessibilityLabel = buildAccessibilityLabel(target);
  return target;
}

function buildEmptyState(input: BuildCenterActiveTargetInput): CenterActiveTarget {
  const status: CenterActiveTargetStatus = 'empty';
  const description =
    input.operationSignals?.overall.status === 'stable'
      ? 'Yeni sinyal bekleniyor; operasyonları gözden geçirebilirsin.'
      : 'Operasyonları gözden geçirerek sonraki adımı planla.';

  const target: CenterActiveTarget = {
    visibility: 'visible',
    id: 'calm-day',
    title: 'Bugün merkez sakin',
    description,
    domain: 'general',
    status,
    priority: 'low',
    impactPreview: [
      {
        id: 'risk',
        label: 'Risk',
        valueText: 'Düşük',
        tone: 'positive',
        iconKey: 'checkmark-circle-outline',
      },
    ],
    cta: buildCta(status),
    helperText: 'Kritik hedef yok; planı gözden geçir.',
    sourceLabel: 'Sakin gün',
    motionHint: buildMotionHint(status, 'low'),
    accessibilityLabel: '',
  };

  target.accessibilityLabel = buildAccessibilityLabel(target);
  return target;
}

function buildAccessibilityLabel(
  target: Pick<
    CenterActiveTarget,
    'title' | 'description' | 'status' | 'cta' | 'helperText' | 'sourceLabel'
  >,
): string {
  return [
    target.sourceLabel,
    target.title,
    target.description,
    target.status,
    target.helperText,
    target.cta.label,
  ]
    .filter(Boolean)
    .join('. ');
}

export function buildCenterActiveTarget(
  input: BuildCenterActiveTargetInput,
): CenterActiveTarget {
  const primaryGoal = selectPrimaryDailyGoal(input.dailyGoalState);
  if (primaryGoal && primaryGoal.status !== 'locked') {
    return buildFromDailyGoal(primaryGoal, input);
  }

  const feel = input.mainOperationFeelPresentation;
  if (feel?.visible && feel.heroTitle?.trim()) {
    return buildFromMainOperation(feel, input);
  }

  const signal = pickHighPrioritySignal(input.operationSignals);
  if (signal && (signal.status === 'critical' || signal.status === 'strained')) {
    return buildFromOperationSignal(signal, input);
  }

  if (input.day <= 1) {
    return buildDay1Fallback(input);
  }

  return buildEmptyState(input);
}

export function centerActiveTargetStatusValid(target: CenterActiveTarget): boolean {
  return ALLOWED_STATUSES.includes(target.status);
}

export function centerActiveTargetActionKeyValid(target: CenterActiveTarget): boolean {
  return ALLOWED_ACTION_KEYS.includes(target.cta.actionKey);
}

export function centerActiveTargetCoreFieldsValid(target: CenterActiveTarget): boolean {
  return (
    Boolean(target.id.trim()) &&
    Boolean(target.title.trim()) &&
    Boolean(target.description.trim()) &&
    Boolean(target.cta.label.trim()) &&
    Boolean(target.accessibilityLabel.trim())
  );
}

export function centerActiveTargetProgressClamped(target: CenterActiveTarget): boolean {
  if (!target.progress) return true;
  return (
    target.progress.progressRatio >= 0 &&
    target.progress.progressRatio <= 1 &&
    Number.isFinite(target.progress.current) &&
    Number.isFinite(target.progress.target)
  );
}

export function centerActiveTargetImpactCountValid(target: CenterActiveTarget): boolean {
  return target.impactPreview.length <= CENTER_ACTIVE_TARGET_MAX_IMPACTS;
}

export function centerActiveTargetRewardSafe(target: CenterActiveTarget): boolean {
  const rewardText = `${target.reward?.label ?? ''} ${target.reward?.valueText ?? ''}`;
  return !/elmas|gem|diamond/i.test(rewardText);
}

export function centerActiveTargetCtaSafe(target: CenterActiveTarget): boolean {
  if (!target.cta.route && target.cta.enabled && target.cta.actionKey !== 'locked') {
    return target.cta.actionKey === 'none';
  }
  return true;
}

export function centerActiveTargetNotDuplicateText(
  target: CenterActiveTarget,
  other: string | null | undefined,
): boolean {
  if (!other?.trim()) return true;
  return (
    !linesAreDuplicate(target.title, other) &&
    !linesAreDuplicate(target.description, other)
  );
}

export function centerActiveTargetSourceLabelValid(target: CenterActiveTarget): boolean {
  return Boolean(target.sourceLabel?.trim());
}

export function centerActiveTargetUsesDailyGoalWhenPresent(
  target: CenterActiveTarget,
  goalId: string,
): boolean {
  return target.id === goalId && target.sourceLabel === 'Günlük hedef';
}

export function centerActiveTargetUsesMainOperationWhenPresent(
  target: CenterActiveTarget,
): boolean {
  return target.sourceLabel === 'Ana operasyon';
}

export function centerActiveTargetDay1SingleAction(target: CenterActiveTarget): boolean {
  return (
    target.sourceLabel === 'Başlangıç hedefi' &&
    target.cta.actionKey === 'start_operation' &&
    target.cta.enabled
  );
}

export function centerActiveTargetCompletedCtaValid(target: CenterActiveTarget): boolean {
  if (target.status !== 'completed') return true;
  return target.cta.actionKey === 'view_result' && Boolean(target.cta.route);
}

export function centerActiveTargetEmptyStillRenderable(target: CenterActiveTarget): boolean {
  if (target.status !== 'empty') return true;
  return target.visibility === 'visible' && Boolean(target.title.trim());
}
