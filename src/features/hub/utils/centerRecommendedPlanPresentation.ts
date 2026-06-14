import type { CityJournalHubPresentation } from '@/core/cityJournal';
import {
  buildDecisionConsequenceHubLine,
  buildDecisionConsequenceThreadsFromHub,
} from '@/core/decisionConsequence';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import type { GameState } from '@/core/models/GameState';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

import type { CenterActiveTarget } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterDailyReward } from './centerDailyRewardPresentation';
import type { CenterHeaderSummary } from './centerHeaderPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';
import type { CenterOperationFocus } from './centerOperationFocusPresentation';
import type { CenterOperationSignalItem } from './centerOperationSignalsPresentation';

export const CENTER_RECOMMENDED_PLAN_MAX_STEPS = 3;

export type CenterRecommendedPlanType =
  | 'daily_plan'
  | 'city_journal'
  | 'district_report'
  | 'story_chain'
  | 'carry_over'
  | 'tomorrow_risk'
  | 'empty'
  | 'locked';

export type CenterRecommendedPlanStatus =
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'locked'
  | 'empty';

export type CenterRecommendedPlanPriority = 'low' | 'normal' | 'high';

export type CenterRecommendedPlanTone =
  | 'calm'
  | 'positive'
  | 'warning'
  | 'teaching'
  | 'neutral';

export type CenterRecommendedPlanStepState = 'done' | 'current' | 'next' | 'locked';

export type CenterRecommendedPlanStep = {
  id: string;
  label: string;
  state: CenterRecommendedPlanStepState;
  iconKey: string;
};

export type CenterRecommendedPlanInsight = {
  label: string;
  text: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type CenterRecommendedPlanActionKey =
  | 'view_journal'
  | 'view_report'
  | 'view_operations'
  | 'view_plan'
  | 'locked'
  | 'none';

export type CenterRecommendedPlanCta = {
  label: string;
  route?: string;
  actionKey: CenterRecommendedPlanActionKey;
  enabled: boolean;
};

export type CenterRecommendedPlanMotionHint = {
  revealLevel: 'none' | 'soft';
  shouldHighlight: boolean;
};

export type CenterRecommendedPlan = {
  visibility: CenterHomeVisibilityState;
  title: string;
  subtitle?: string;
  body: string;
  planType: CenterRecommendedPlanType;
  status: CenterRecommendedPlanStatus;
  priority: CenterRecommendedPlanPriority;
  tone: CenterRecommendedPlanTone;
  steps?: CenterRecommendedPlanStep[];
  insight?: CenterRecommendedPlanInsight;
  cta?: CenterRecommendedPlanCta;
  sourceLabel: string;
  sourceIds: string[];
  motionHint?: CenterRecommendedPlanMotionHint;
  accessibilityLabel: string;
  lockedTeaser?: string | null;
};

export type BuildCenterRecommendedPlanInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  advisorSuggestion?: CenterAdvisorSuggestion | null;
  operationSignalItems?: CenterOperationSignalItem[];
  operationFocus?: CenterOperationFocus | null;
  citySummary?: CenterCitySummary | null;
  dailyReward?: CenterDailyReward | null;
  headerSummary?: CenterHeaderSummary | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubImpactExplanationLine?: string | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  cardVisibility?: HubCardVisibilityModel;
};

const ALLOWED_PLAN_TYPES: CenterRecommendedPlanType[] = [
  'daily_plan',
  'city_journal',
  'district_report',
  'story_chain',
  'carry_over',
  'tomorrow_risk',
  'empty',
  'locked',
];

const ALLOWED_STATUSES: CenterRecommendedPlanStatus[] = [
  'ready',
  'in_progress',
  'completed',
  'locked',
  'empty',
];

const ALLOWED_PRIORITIES: CenterRecommendedPlanPriority[] = ['low', 'normal', 'high'];

const ALLOWED_TONES: CenterRecommendedPlanTone[] = [
  'calm',
  'positive',
  'warning',
  'teaching',
  'neutral',
];

const ALLOWED_ACTION_KEYS: CenterRecommendedPlanActionKey[] = [
  'view_journal',
  'view_report',
  'view_operations',
  'view_plan',
  'locked',
  'none',
];

const ALLOWED_REVEAL_LEVELS: Array<CenterRecommendedPlanMotionHint['revealLevel']> = [
  'none',
  'soft',
];

const SAFE_ACTION_KEYS_WITH_ROUTE: CenterRecommendedPlanActionKey[] = [
  'view_journal',
  'view_report',
  'view_operations',
  'view_plan',
];

type SourceCandidate = {
  planType: CenterRecommendedPlanType;
  sourceLabel: string;
  sourceIds: string[];
  title: string;
  subtitle: string;
  body: string;
  tone: CenterRecommendedPlanTone;
  status: CenterRecommendedPlanStatus;
  priority: CenterRecommendedPlanPriority;
  steps?: CenterRecommendedPlanStep[];
  insight?: CenterRecommendedPlanInsight;
  cta?: CenterRecommendedPlanCta;
};

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function dedupeAgainst(lines: string[], candidate: string, fallback: string): string {
  const trimmed = candidate.trim();
  if (!trimmed) return fallback;
  if (lines.some((line) => linesAreDuplicate(line, trimmed))) return fallback;
  return trimmed;
}

function uniqueSourceIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function collectDedupeLines(input: BuildCenterRecommendedPlanInput): string[] {
  const lines: string[] = [];
  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) lines.push(trimmed);
  };

  push(input.activeTarget.title);
  push(input.activeTarget.description);
  push(input.activeTarget.helperText);
  push(input.activeTarget.cta.label);

  push(input.advisorSuggestion?.recommendation);
  push(input.advisorSuggestion?.contextLine);
  push(input.advisorSuggestion?.reason);
  push(input.advisorSuggestion?.caution);
  push(input.advisorSuggestion?.action?.label);

  for (const signal of input.operationSignalItems ?? []) {
    push(signal.title);
    push(signal.description);
    push(signal.helperText);
  }

  for (const item of input.operationFocus?.items ?? []) {
    push(item.title);
    push(item.subtitle);
  }

  push(input.dailyReward?.helperText);
  push(input.headerSummary?.notification.label);
  push(input.citySummary?.primaryInsight?.text);

  return lines;
}

function isMeaningfulTomorrowRisk(risk: TomorrowRiskModel | null | undefined): boolean {
  if (!risk?.shouldShowInHub) return false;
  const line = risk.mainLine?.trim();
  if (!line) return false;
  if (risk.kind === 'fallback' && risk.sourceSignals.every((source) => source === 'fallback')) {
    return false;
  }
  return true;
}

function buildHubConsequenceLine(
  input: BuildCenterRecommendedPlanInput,
  avoidLines: Array<string | null | undefined> = [],
): string | null {
  return buildDecisionConsequenceHubLine(
    buildDecisionConsequenceThreadsFromHub({
      day: input.day,
      impactLine: input.hubImpactExplanationLine,
      tomorrowRisk: input.hubTomorrowRisk,
      districtLine: input.hubDistrictReportLine,
      storyLine: input.hubStoryChainLine,
      cityJournalLine: input.hubCityJournal?.primaryLine ?? input.hubCityJournal?.secondaryLine,
    }),
    avoidLines,
  );
}

function buildOperationFlowSteps(
  activeTarget: CenterActiveTarget,
): CenterRecommendedPlanStep[] {
  const status = activeTarget.status;
  if (status === 'completed') {
    return [
      { id: 'inspect', label: 'İncele', state: 'done', iconKey: 'search-outline' },
      { id: 'plan', label: 'Planla', state: 'done', iconKey: 'map-outline' },
      { id: 'direct', label: 'Yönlendir', state: 'done', iconKey: 'people-outline' },
    ];
  }
  if (status === 'in_progress') {
    return [
      { id: 'inspect', label: 'İncele', state: 'done', iconKey: 'search-outline' },
      { id: 'plan', label: 'Planla', state: 'current', iconKey: 'map-outline' },
      { id: 'direct', label: 'Yönlendir', state: 'next', iconKey: 'people-outline' },
    ];
  }
  return [
    { id: 'inspect', label: 'İncele', state: 'current', iconKey: 'search-outline' },
    { id: 'plan', label: 'Planla', state: 'next', iconKey: 'map-outline' },
    { id: 'direct', label: 'Yönlendir', state: 'locked', iconKey: 'people-outline' },
  ];
}

function buildDay1Steps(): CenterRecommendedPlanStep[] {
  return [
    { id: 'inspect', label: 'İncele', state: 'current', iconKey: 'search-outline' },
    { id: 'plan', label: 'Planla', state: 'next', iconKey: 'map-outline' },
    { id: 'direct', label: 'Yönlendir', state: 'locked', iconKey: 'people-outline' },
  ];
}

function buildSecondaryCta(
  label: string,
  actionKey: CenterRecommendedPlanActionKey,
  route: string | undefined,
  dedupeLines: string[],
  activeTargetCtaLabel: string,
): CenterRecommendedPlanCta | undefined {
  if (linesAreDuplicate(label, activeTargetCtaLabel)) {
    return undefined;
  }
  const dedupedLabel = dedupeAgainst(dedupeLines, label, '');
  if (!dedupedLabel) return undefined;
  if (!route) {
    return {
      label: dedupedLabel,
      actionKey: 'none',
      enabled: false,
    };
  }
  return {
    label: dedupedLabel,
    route,
    actionKey,
    enabled: true,
  };
}

function resolveVisibility(
  input: BuildCenterRecommendedPlanInput,
  hasJournalPrimary: boolean,
): CenterHomeVisibilityState {
  const visibility = input.cardVisibility;
  if (visibility?.showDailyPlan === 'hidden') return 'hidden';
  if (input.day <= 1) return 'visible';
  if (visibility?.showDailyPlan === 'compact' && !hasJournalPrimary) return 'locked';
  return 'visible';
}

function pickSourceCandidate(
  input: BuildCenterRecommendedPlanInput,
  dedupeLines: string[],
): SourceCandidate {
  const journal = input.hubCityJournal;
  const journalLine =
    input.day > 1 && journal?.visible && journal.primaryLine?.trim()
      ? journal.primaryLine.trim()
      : null;

  if (journalLine && journal) {
    const consequenceLine = buildHubConsequenceLine(input, dedupeLines);
    const body = dedupeAgainst(
      dedupeLines,
      consequenceLine || journal.secondaryLine?.trim() || journalLine,
      'Merkezdeki kararların sosyal nabız ve mahalle güveni üzerindeki etkisi izleniyor.',
    );
    return {
      planType: 'city_journal',
      sourceLabel: 'Şehir günlüğü',
      sourceIds: uniqueSourceIds(['city-journal', journal.title ?? 'journal']),
      title: journal.title?.trim() || 'Şehir Günlüğü',
      subtitle: 'Bugünkü kayıt',
      body,
      tone: 'calm',
      status: 'ready',
      priority: 'normal',
      cta: buildSecondaryCta(
        'Günlüğü Gör',
        'view_journal',
        '/reports',
        dedupeLines,
        input.activeTarget.cta.label,
      ),
    };
  }

  const districtLine = input.hubDistrictReportLine?.trim();
  if (districtLine) {
    const consequenceLine = buildHubConsequenceLine(input, dedupeLines);
    return {
      planType: 'district_report',
      sourceLabel: 'Mahalle raporu',
      sourceIds: uniqueSourceIds(['district-report']),
      title: 'Önerilen Plan',
      subtitle: 'Mahalle etkisi',
      body: dedupeAgainst(
        dedupeLines,
        consequenceLine || districtLine,
        'Mahalle raporu bugünkü operasyon önceliğini şekillendiriyor.',
      ),
      tone: 'neutral',
      status: 'ready',
      priority: 'normal',
      cta: buildSecondaryCta(
        'Raporu Aç',
        'view_report',
        '/reports',
        dedupeLines,
        input.activeTarget.cta.label,
      ),
    };
  }

  const storyLine = input.hubStoryChainLine?.trim();
  if (storyLine) {
    const consequenceLine = buildHubConsequenceLine(input, dedupeLines);
    return {
      planType: 'story_chain',
      sourceLabel: 'Hikâye zinciri',
      sourceIds: uniqueSourceIds(['story-chain']),
      title: 'Önerilen Plan',
      subtitle: 'Devam eden hikâye',
      body: dedupeAgainst(
        dedupeLines,
        consequenceLine || storyLine,
        'Devam eden hikâye bugünkü karar akışını etkileyebilir.',
      ),
      tone: 'neutral',
      status: 'in_progress',
      priority: 'normal',
      steps: buildOperationFlowSteps(input.activeTarget),
      cta: buildSecondaryCta(
        'Operasyona Git',
        'view_operations',
        '/events',
        dedupeLines,
        input.activeTarget.cta.label,
      ),
    };
  }

  const carryLine = input.hubImpactExplanationLine?.trim();
  if (carryLine) {
    const consequenceLine = buildHubConsequenceLine(input, dedupeLines);
    return {
      planType: 'carry_over',
      sourceLabel: 'Karar hafızası',
      sourceIds: uniqueSourceIds(['carry-over']),
      title: 'Dünden Kalan Etki',
      subtitle: 'Karar hafızası',
      body: dedupeAgainst(
        dedupeLines,
        consequenceLine || carryLine,
        'Önceki tercih, bugün kaynak baskısını biraz artırabilir. Dengeli plan daha güvenli olur.',
      ),
      tone: 'warning',
      status: 'ready',
      priority: 'high',
    };
  }

  const tomorrow = input.hubTomorrowRisk;
  if (isMeaningfulTomorrowRisk(tomorrow)) {
    const consequenceLine = buildHubConsequenceLine(input, dedupeLines);
    const body = dedupeAgainst(
      dedupeLines,
      consequenceLine || tomorrow!.supportLine?.trim() || tomorrow!.mainLine.trim(),
      'Bugünkü seçim yarınki operasyon yükünü etkileyebilir. Hızlı çözüm yerine kalıcı plan avantajlı olabilir.',
    );
    return {
      planType: 'tomorrow_risk',
      sourceLabel: 'Yarın riski',
      sourceIds: uniqueSourceIds([tomorrow!.id, 'tomorrow-risk']),
      title: 'Yarın İçin Not',
      subtitle: 'Risk önizlemesi',
      body,
      tone: tomorrow!.tone === 'risk' || tomorrow!.tone === 'watch' ? 'warning' : 'calm',
      status: 'ready',
      priority: tomorrow!.priority === 'high' ? 'high' : 'normal',
      insight: {
        label: 'Yarın',
        text: tomorrow!.title.trim(),
        tone: tomorrow!.tone === 'risk' ? 'warning' : 'neutral',
      },
    };
  }

  if (input.day <= 1) {
    return {
      planType: 'daily_plan',
      sourceLabel: 'İlk operasyon',
      sourceIds: uniqueSourceIds(['day1-teaching']),
      title: 'Bugünkü Plan',
      subtitle: 'İlk operasyon',
      body: dedupeAgainst(
        dedupeLines,
        'İlk olayı incele, planla ve ekibi yönlendir. Sonuçtan sonra şehir günlüğü açılacak.',
        'İlk olayı incele, planla ve ekibi yönlendir. Sonuçtan sonra şehir günlüğü açılacak.',
      ),
      tone: 'teaching',
      status: 'ready',
      priority: 'high',
      steps: buildDay1Steps(),
    };
  }

  const targetStatus = input.activeTarget.status;
  if (targetStatus !== 'empty' && targetStatus !== 'locked') {
    const contextualBody =
      targetStatus === 'completed'
        ? 'Bugünkü hedef tamamlandı; sonuçları izleyerek yarınki planı şekillendirebilirsin.'
        : targetStatus === 'in_progress'
          ? 'Aktif hedef devam ediyor; ekip yönlendirmesiyle akışı tamamlamak bugünkü öncelik.'
          : 'Önce aktif hedefi incele, ardından ekip yönlendirmesiyle operasyonu tamamla.';
    return {
      planType: 'daily_plan',
      sourceLabel: 'Günlük akış',
      sourceIds: uniqueSourceIds([input.activeTarget.id, 'daily-plan']),
      title: 'Önerilen Plan',
      subtitle: 'Bugünkü akış',
      body: dedupeAgainst(dedupeLines, contextualBody, 'Bugünkü operasyon akışını aktif hedef üzerinden sürdür.'),
      tone: 'neutral',
      status:
        targetStatus === 'completed'
          ? 'completed'
          : targetStatus === 'in_progress'
            ? 'in_progress'
            : 'ready',
      priority: input.activeTarget.priority === 'urgent' ? 'high' : 'normal',
      steps: buildOperationFlowSteps(input.activeTarget),
      cta: buildSecondaryCta(
        'Plana Başla',
        'view_plan',
        '/events',
        dedupeLines,
        input.activeTarget.cta.label,
      ),
    };
  }

  return {
    planType: 'empty',
    sourceLabel: 'Sakin gün',
    sourceIds: uniqueSourceIds(['empty-fallback']),
    title: 'Önerilen Plan',
    subtitle: 'Bugün plan hazır',
    body: dedupeAgainst(
      dedupeLines,
      'Aktif hedefe odaklan; ek risk veya hikâye zinciri yok.',
      'Aktif hedefe odaklan.',
    ),
    tone: 'calm',
    status: 'empty',
    priority: 'low',
    cta: buildSecondaryCta(
      'Operasyonları Gör',
      'view_operations',
      '/events',
      dedupeLines,
      input.activeTarget.cta.label,
    ),
  };
}

function buildLockedPlan(): CenterRecommendedPlan {
  return {
    visibility: 'locked',
    title: 'Önerilen Plan',
    subtitle: 'Yakında',
    body: 'İlk operasyonu tamamla.',
    planType: 'locked',
    status: 'locked',
    priority: 'low',
    tone: 'neutral',
    sourceLabel: 'Kilitli önizleme',
    sourceIds: ['locked-preview'],
    lockedTeaser: 'Sonuçtan sonra şehir günlüğü açılır.',
    cta: {
      label: 'Sonuçtan sonra açılır',
      actionKey: 'locked',
      enabled: false,
    },
    motionHint: { revealLevel: 'none', shouldHighlight: false },
    accessibilityLabel:
      'Önerilen plan kilitli. Sonuçtan sonra şehir günlüğü açılır. İlk operasyonu tamamla.',
  };
}

function buildMotionHint(
  plan: Pick<CenterRecommendedPlan, 'planType' | 'status' | 'priority' | 'tone'>,
): CenterRecommendedPlanMotionHint {
  const shouldHighlight =
    plan.planType === 'carry_over' ||
    plan.planType === 'tomorrow_risk' ||
    (plan.priority === 'high' && plan.status !== 'completed');
  return {
    revealLevel: plan.tone === 'teaching' || plan.planType === 'city_journal' ? 'soft' : 'none',
    shouldHighlight,
  };
}

function buildAccessibilityLabel(plan: CenterRecommendedPlan): string {
  return [
    plan.sourceLabel,
    plan.title,
    plan.subtitle,
    plan.body,
    plan.insight?.text,
    plan.steps?.map((step) => `${step.label} ${step.state}`).join(', '),
    plan.cta?.enabled ? plan.cta.label : undefined,
  ]
    .filter(Boolean)
    .join('. ');
}

export function buildCenterRecommendedPlan(
  input: BuildCenterRecommendedPlanInput,
): CenterRecommendedPlan {
  const journalPrimary =
    input.day > 1 &&
    Boolean(input.hubCityJournal?.visible && input.hubCityJournal.primaryLine?.trim());
  const visibility = resolveVisibility(input, journalPrimary);

  if (visibility === 'hidden') {
    return {
      visibility: 'hidden',
      title: 'Önerilen Plan',
      body: 'Gizli',
      planType: 'empty',
      status: 'empty',
      priority: 'low',
      tone: 'neutral',
      sourceLabel: 'Gizli',
      sourceIds: ['hidden'],
      accessibilityLabel: 'Önerilen plan gizli.',
    };
  }

  if (visibility === 'locked') {
    return buildLockedPlan();
  }

  const dedupeLines = collectDedupeLines(input);
  const candidate = pickSourceCandidate(input, dedupeLines);
  const steps = candidate.steps?.slice(0, CENTER_RECOMMENDED_PLAN_MAX_STEPS);

  const plan: CenterRecommendedPlan = {
    visibility,
    title: candidate.title,
    subtitle: candidate.subtitle,
    body: candidate.body,
    planType: candidate.planType,
    status: candidate.status,
    priority: candidate.priority,
    tone: candidate.tone,
    steps,
    insight: candidate.insight,
    cta: candidate.cta,
    sourceLabel: candidate.sourceLabel,
    sourceIds: uniqueSourceIds(candidate.sourceIds),
    motionHint: buildMotionHint(candidate),
    accessibilityLabel: '',
  };

  plan.accessibilityLabel = buildAccessibilityLabel(plan);
  return plan;
}

export function centerRecommendedPlanCoreFieldsValid(plan: CenterRecommendedPlan): boolean {
  if (plan.visibility === 'hidden') return true;
  return (
    Boolean(plan.title.trim()) &&
    Boolean(plan.body.trim()) &&
    Boolean(plan.accessibilityLabel.trim()) &&
    Boolean(plan.sourceLabel.trim())
  );
}

export function centerRecommendedPlanEnumsValid(plan: CenterRecommendedPlan): boolean {
  return (
    ALLOWED_PLAN_TYPES.includes(plan.planType) &&
    ALLOWED_STATUSES.includes(plan.status) &&
    ALLOWED_PRIORITIES.includes(plan.priority) &&
    ALLOWED_TONES.includes(plan.tone) &&
    (!plan.motionHint || ALLOWED_REVEAL_LEVELS.includes(plan.motionHint.revealLevel))
  );
}

export function centerRecommendedPlanSourceIdsUnique(plan: CenterRecommendedPlan): boolean {
  const ids = plan.sourceIds.map((id) => id.trim()).filter(Boolean);
  return new Set(ids).size === ids.length;
}

export function centerRecommendedPlanStepsValid(plan: CenterRecommendedPlan): boolean {
  if (!plan.steps) return true;
  if (plan.steps.length > CENTER_RECOMMENDED_PLAN_MAX_STEPS) return false;
  const stepIds = plan.steps.map((step) => step.id);
  return new Set(stepIds).size === stepIds.length;
}

export function centerRecommendedPlanCtaSafe(plan: CenterRecommendedPlan): boolean {
  if (!plan.cta) return true;
  if (!ALLOWED_ACTION_KEYS.includes(plan.cta.actionKey)) return false;
  if (plan.cta.enabled) {
    return Boolean(plan.cta.route?.trim()) && SAFE_ACTION_KEYS_WITH_ROUTE.includes(plan.cta.actionKey);
  }
  if (plan.cta.route && plan.cta.enabled === false) return true;
  return !plan.cta.route || plan.cta.actionKey === 'locked' || plan.cta.actionKey === 'none';
}

export function centerRecommendedPlanDay1Teaching(plan: CenterRecommendedPlan): boolean {
  return plan.tone === 'teaching' && plan.planType === 'daily_plan' && plan.status === 'ready';
}

export function centerRecommendedPlanEmptySafe(plan: CenterRecommendedPlan): boolean {
  if (plan.planType !== 'empty') return true;
  return !/(sahte|uydurma|fake)/i.test(plan.body);
}

export function centerRecommendedPlanLockedSafe(plan: CenterRecommendedPlan): boolean {
  if (plan.planType !== 'locked' && plan.status !== 'locked') return true;
  return Boolean(plan.lockedTeaser?.trim() || plan.body.trim());
}

export function centerRecommendedPlanNotDuplicateActiveTarget(
  plan: CenterRecommendedPlan,
  activeTarget: CenterActiveTarget,
): boolean {
  return (
    !linesAreDuplicate(plan.body, activeTarget.title) &&
    !linesAreDuplicate(plan.body, activeTarget.description) &&
    !linesAreDuplicate(plan.title, activeTarget.title)
  );
}

export function centerRecommendedPlanNotDuplicateAdvisor(
  plan: CenterRecommendedPlan,
  advisorRecommendation: string,
): boolean {
  return !linesAreDuplicate(plan.body, advisorRecommendation);
}

export function centerRecommendedPlanNotDuplicateSignals(
  plan: CenterRecommendedPlan,
  signalTitles: string[],
): boolean {
  return signalTitles.every((title) => !linesAreDuplicate(plan.body, title));
}

export function centerRecommendedPlanNotDuplicateDailyReward(
  plan: CenterRecommendedPlan,
  helperText: string | null | undefined,
): boolean {
  if (!helperText?.trim()) return true;
  return !linesAreDuplicate(plan.body, helperText);
}
