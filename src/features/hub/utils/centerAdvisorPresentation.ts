import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import type { MainOperationFeelHubPresentation } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { GameState } from '@/core/models/GameState';
import type {
  OperationDomainSignal,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

import type { CenterActiveTarget, CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterDailyReward } from './centerDailyRewardPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';

export type CenterAdvisorTone =
  | 'calm'
  | 'positive'
  | 'warning'
  | 'urgent'
  | 'teaching'
  | 'celebration';

export type CenterAdvisorPriority = 'low' | 'normal' | 'high' | 'urgent';

export type CenterAdvisorConfidence = 'low' | 'medium' | 'high';

export type CenterAdvisorActionKey =
  | 'start_operation'
  | 'continue_operation'
  | 'view_plan'
  | 'view_report'
  | 'view_signals'
  | 'view_rewards'
  | 'none';

export type CenterAdvisorAction = {
  label: string;
  route?: string;
  actionKey: CenterAdvisorActionKey;
  enabled: boolean;
};

export type CenterAdvisorMotionHint = {
  attentionLevel: 'none' | 'soft' | 'medium' | 'strong';
  shouldPulseAvatar: boolean;
  shouldRevealSpeech: boolean;
};

export type CenterAdvisorSuggestion = {
  visibility: CenterHomeVisibilityState;
  id: string;
  advisorName: string;
  title: string;
  contextLine: string;
  recommendation: string;
  reason?: string;
  caution?: string;
  tone: CenterAdvisorTone;
  priority: CenterAdvisorPriority;
  confidence: CenterAdvisorConfidence;
  sourceLabel: string;
  sourceIds: string[];
  action?: CenterAdvisorAction;
  secondaryAction?: CenterAdvisorAction;
  compactMode: boolean;
  shouldShowAvatar: boolean;
  motionHint?: CenterAdvisorMotionHint;
  accessibilityLabel: string;
};

export type BuildCenterAdvisorSuggestionInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  dailyReward?: CenterDailyReward | null;
  citySummary?: CenterCitySummary | null;
  operationSignals?: OperationSignalsState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubEceContextLine?: string | null;
  hubImpactExplanationLine?: string | null;
  mainOperationFeelPresentation?: MainOperationFeelHubPresentation | null;
  socialPulseState?: SocialPulseState | null;
  cardVisibility?: HubCardVisibilityModel;
  recommendedPlanBody?: string | null;
};

const ALLOWED_TONES: CenterAdvisorTone[] = [
  'calm',
  'positive',
  'warning',
  'urgent',
  'teaching',
  'celebration',
];

const ALLOWED_PRIORITIES: CenterAdvisorPriority[] = ['low', 'normal', 'high', 'urgent'];

const ALLOWED_CONFIDENCES: CenterAdvisorConfidence[] = ['low', 'medium', 'high'];

const ALLOWED_ACTION_KEYS: CenterAdvisorActionKey[] = [
  'start_operation',
  'continue_operation',
  'view_plan',
  'view_report',
  'view_signals',
  'view_rewards',
  'none',
];

const CONTEXT_MAX = 70;
const RECOMMENDATION_MAX = 110;
const REASON_MAX = 120;

function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
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

function dedupeAgainst(
  text: string,
  avoid: Array<string | null | undefined>,
  fallback: string,
): string {
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  if (avoid.some((line) => linesAreDuplicate(trimmed, line))) {
    return fallback;
  }
  return trimmed;
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

function mapTargetActionToAdvisor(target: CenterActiveTarget): CenterAdvisorAction {
  const actionKey: CenterAdvisorActionKey =
    target.cta.actionKey === 'view_result'
      ? 'view_report'
      : target.cta.actionKey === 'view_plan'
        ? 'view_plan'
        : target.cta.actionKey === 'continue_operation'
          ? 'continue_operation'
          : target.cta.actionKey === 'start_operation'
            ? 'start_operation'
            : target.cta.actionKey === 'locked'
              ? 'none'
              : 'none';

  return {
    label: target.cta.label,
    route: target.cta.route,
    actionKey,
    enabled: target.cta.enabled,
  };
}

function resolveVisibility(
  cardVisibility?: HubCardVisibilityModel,
): CenterHomeVisibilityState {
  if (cardVisibility?.showAdvisor === 'hidden') return 'hidden';
  return 'visible';
}

function resolveCompactMode(
  input: BuildCenterAdvisorSuggestionInput,
  priority: CenterAdvisorPriority,
): boolean {
  if (input.cardVisibility?.showAdvisor === 'compact') return true;
  if (input.activeTarget.status === 'empty') return true;
  if (priority === 'low') return true;
  return false;
}

function buildMotionHint(
  tone: CenterAdvisorTone,
  priority: CenterAdvisorPriority,
): CenterAdvisorMotionHint {
  return {
    attentionLevel:
      priority === 'urgent'
        ? 'strong'
        : tone === 'teaching'
          ? 'medium'
          : tone === 'celebration'
            ? 'soft'
            : tone === 'calm'
              ? 'none'
              : 'soft',
    shouldPulseAvatar: priority === 'urgent' || tone === 'teaching',
    shouldRevealSpeech: tone === 'teaching' || tone === 'celebration',
  };
}

function domainContextLine(domain: CenterActiveTargetDomain): string {
  switch (domain) {
    case 'transport':
      return 'Bugünkü odak ulaşım baskısı.';
    case 'environment':
      return 'Bugünkü odak çevre ve toplama.';
    case 'energy':
      return 'Bugünkü odak enerji ve ekip dengesi.';
    case 'social':
      return 'Bugünkü odak mahalle güveni.';
    case 'logistics':
      return 'Bugünkü odak kaynak ve lojistik.';
    default:
      return 'Bugünkü ana operasyon hattı hazır.';
  }
}

function buildCityWarningContext(
  input: BuildCenterAdvisorSuggestionInput,
): string | null {
  const insight = input.citySummary?.primaryInsight;
  if (insight && (insight.tone === 'warning' || insight.tone === 'urgent')) {
    return insight.text;
  }

  const happiness = input.citySummary?.metrics.find((metric) => metric.id === 'happiness');
  if (happiness?.tone === 'warning' || happiness?.tone === 'urgent') {
    return 'Vatandaş mutluluğu düşük; sosyal etkiye dikkat et.';
  }

  const riskMetric = input.citySummary?.metrics.find(
    (metric) => metric.id === 'risk' || metric.id === 'activeOperations',
  );
  if (riskMetric?.tone === 'warning' || riskMetric?.tone === 'urgent') {
    return riskMetric.helperText ?? 'Operasyon baskısı yükseliyor.';
  }

  return null;
}

function buildConfidence(
  sourceIds: string[],
  hasTarget: boolean,
  hasSignal: boolean,
  hasCity: boolean,
): CenterAdvisorConfidence {
  const uniqueSources = new Set(sourceIds).size;
  if (hasTarget && (hasSignal || hasCity) && uniqueSources >= 2) return 'high';
  if (hasTarget || hasSignal) return 'medium';
  return 'low';
}

function buildAccessibilityLabel(
  advisor: Pick<
    CenterAdvisorSuggestion,
    'title' | 'contextLine' | 'recommendation' | 'reason' | 'caution' | 'action'
  >,
): string {
  return [
    advisor.title,
    advisor.contextLine,
    advisor.recommendation,
    advisor.reason,
    advisor.caution,
    advisor.action?.label,
  ]
    .filter(Boolean)
    .join('. ');
}

function buildDay1Advisor(input: BuildCenterAdvisorSuggestionInput): CenterAdvisorSuggestion {
  const avoid = [
    input.activeTarget.title,
    input.activeTarget.description,
    input.dailyReward?.helperText,
    input.citySummary?.primaryInsight?.text,
    input.recommendedPlanBody,
  ];

  const recommendation = dedupeAgainst(
    'İlk olayı incele; ardından plan ve yönlendirme adımları açılacak.',
    avoid,
    'İlk olayı inceleyerek plan ve yönlendirme akışını aç.',
  );

  const advisor: CenterAdvisorSuggestion = {
    visibility: resolveVisibility(input.cardVisibility),
    id: 'advisor-day1',
    advisorName: 'Ece',
    title: 'Ece Hazır',
    contextLine: clampText('İlk gün şehir akışını tanıyoruz.', CONTEXT_MAX),
    recommendation: clampText(recommendation, RECOMMENDATION_MAX),
    reason: clampText(
      'Bu akış, Merkez’deki hedef ve günlük seriyi anlamanı sağlar.',
      REASON_MAX,
    ),
    tone: 'teaching',
    priority: 'normal',
    confidence: 'high',
    sourceLabel: 'Başlangıç rehberi',
    sourceIds: ['day1', input.activeTarget.id],
    action: mapTargetActionToAdvisor(input.activeTarget),
    compactMode: resolveCompactMode(input, 'normal'),
    shouldShowAvatar: true,
    motionHint: buildMotionHint('teaching', 'normal'),
    accessibilityLabel: '',
  };

  advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
  return advisor;
}

function buildFromActiveTarget(
  input: BuildCenterAdvisorSuggestionInput,
): CenterAdvisorSuggestion {
  const target = input.activeTarget;
  const signal = pickHighPrioritySignal(input.operationSignals);
  const cityWarning = buildCityWarningContext(input);
  const avoid = [
    target.title,
    target.description,
    target.helperText,
    input.dailyReward?.helperText,
    input.citySummary?.primaryInsight?.text,
    input.recommendedPlanBody,
    input.hubEceContextLine,
  ];

  if (target.status === 'empty') {
    const advisor: CenterAdvisorSuggestion = {
      visibility: resolveVisibility(input.cardVisibility),
      id: 'advisor-calm-day',
      advisorName: 'Ece',
      title: 'Ece’nin Önerisi',
      contextLine: clampText('Bugün merkez sakin görünüyor.', CONTEXT_MAX),
      recommendation: clampText(
        dedupeAgainst(
          'Operasyon listesini kontrol edip düşük riskli bir alan seçebilirsin.',
          avoid,
          'Sakin günde operasyon listesinden küçük bir adım seç.',
        ),
        RECOMMENDATION_MAX,
      ),
      tone: 'calm',
      priority: 'low',
      confidence: buildConfidence(['empty'], false, false, Boolean(cityWarning)),
      sourceLabel: 'Sakin gün',
      sourceIds: [target.id],
      action: mapTargetActionToAdvisor(target),
      compactMode: true,
      shouldShowAvatar: true,
      motionHint: buildMotionHint('calm', 'low'),
      accessibilityLabel: '',
    };
    advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
    return advisor;
  }

  if (target.status === 'completed') {
    const advisor: CenterAdvisorSuggestion = {
      visibility: resolveVisibility(input.cardVisibility),
      id: `advisor-completed-${target.id}`,
      advisorName: 'Ece',
      title: 'Ece’nin Önerisi',
      contextLine: clampText('Bugünkü hedef tamamlandı.', CONTEXT_MAX),
      recommendation: clampText(
        dedupeAgainst(
          'Sonuç ekranında şehir etkisini kontrol et.',
          avoid,
          'Tamamlanan hedefin etkisini sonuç ekranından incele.',
        ),
        RECOMMENDATION_MAX,
      ),
      reason: clampText(
        dedupeAgainst(
          input.hubTomorrowRisk?.mainLine ??
            'Bu karar yarınki risk ve mahalle güvenine yansıyabilir.',
          avoid,
          'Bu karar yarınki risk ve mahalle güvenine yansıyabilir.',
        ),
        REASON_MAX,
      ),
      tone: 'celebration',
      priority: 'normal',
      confidence: buildConfidence([target.id, 'completed'], true, false, Boolean(cityWarning)),
      sourceLabel: 'Tamamlanan hedef',
      sourceIds: [target.id, 'completed'],
      action: mapTargetActionToAdvisor(target),
      compactMode: resolveCompactMode(input, 'normal'),
      shouldShowAvatar: true,
      motionHint: buildMotionHint('celebration', 'normal'),
      accessibilityLabel: '',
    };
    advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
    return advisor;
  }

  const urgentSignal =
    signal && (signal.status === 'critical' || signal.status === 'strained')
      ? signal
      : null;
  const tomorrowUrgent = input.hubTomorrowRisk?.priority === 'high';

  let tone: CenterAdvisorTone = 'positive';
  let priority: CenterAdvisorPriority = target.priority === 'urgent' ? 'urgent' : target.priority;
  let caution: string | undefined;
  const sourceIds = [target.id];

  if (urgentSignal) {
    sourceIds.push(`signal-${urgentSignal.domain}`);
    tone = urgentSignal.status === 'critical' ? 'urgent' : 'warning';
    priority = urgentSignal.status === 'critical' ? 'urgent' : 'high';
    caution = clampText(
      dedupeAgainst(
        input.hubImpactExplanationLine ??
          'Yanlış ekip seçimi yarın riski büyütebilir.',
        avoid,
        'Yanlış ekip seçimi yarın riski büyütebilir.',
      ),
      REASON_MAX,
    );
  } else if (cityWarning) {
    tone = 'warning';
    priority = priority === 'low' ? 'normal' : priority;
    sourceIds.push('city-summary');
  } else if (target.status === 'ready') {
    tone = input.day <= 1 ? 'teaching' : 'positive';
  } else if (target.status === 'in_progress') {
    tone = target.priority === 'urgent' ? 'warning' : 'positive';
  }

  if (tomorrowUrgent) {
    sourceIds.push('tomorrow-risk');
    if (tone !== 'urgent') tone = 'warning';
    if (priority !== 'urgent') priority = 'high';
  }

  const contextFromSignal = urgentSignal
    ? clampText(
        dedupeAgainst(
          urgentSignal.summary || 'Operasyon baskısı yükseliyor.',
          [...avoid, urgentSignal.title, target.title],
          'Yüksek baskı sinyali aktif; önce doğrula.',
        ),
        CONTEXT_MAX,
      )
    : null;
  const contextLine = clampText(
    dedupeAgainst(
      contextFromSignal ??
        target.subtitle ??
        domainContextLine(target.domain),
      avoid,
      domainContextLine(target.domain),
    ),
    CONTEXT_MAX,
  );

  let recommendation = '';
  if (urgentSignal) {
    recommendation = dedupeAgainst(
      'Önce risk sinyalini doğrula, ardından hedefe odaklan.',
      [...avoid, urgentSignal.title, urgentSignal.summary],
      'Önce sinyali incele; yanlış adım yarın riski büyütebilir.',
    );
  } else if (target.status === 'ready') {
    recommendation = dedupeAgainst(
      'Önce inceleme adımını açıp risk sinyalini doğrula.',
      avoid,
      'Önce olayı incele, sonra ekibi yönlendir.',
    );
  } else if (target.status === 'in_progress') {
    recommendation = dedupeAgainst(
      'Kaldığın adımdan devam et; küçük ilerleme güven kazandırır.',
      avoid,
      'Devam ederek hedefi tamamla; etki kısa sürede görünür.',
    );
  } else {
    recommendation = dedupeAgainst(
      input.hubEceContextLine ?? target.helperText ?? 'Bugünkü hedefe odaklan.',
      avoid,
      'Bugünkü hedefe odaklanarak merkez akışını sürdür.',
    );
  }

  if (
    input.dailyReward?.claimState === 'locked' &&
    input.day <= 1 &&
    !linesAreDuplicate(recommendation, input.dailyReward.helperText)
  ) {
    recommendation = `${recommendation} İlk hedef seriyi açar.`.trim();
  }

  let reason = dedupeAgainst(
    input.hubImpactExplanationLine ??
      target.impactPreview[0]?.valueText ??
      cityWarning ??
      input.mainOperationFeelPresentation?.model.eceLine ??
      '',
    avoid,
    target.impactPreview[0]
      ? `${target.impactPreview[0].label} etkisi beklenir.`
      : 'Bu seçim şehir dengesine kısa vadede yansır.',
  );

  if (linesAreDuplicate(reason, recommendation)) {
    reason = '';
  }

  const action = mapTargetActionToAdvisor(target);
  let secondaryAction: CenterAdvisorAction | undefined;
  if (urgentSignal && action.actionKey === 'continue_operation') {
    secondaryAction = {
      label: 'Sinyalleri İncele',
      route: '/events',
      actionKey: 'view_signals',
      enabled: true,
    };
  }

  const advisor: CenterAdvisorSuggestion = {
    visibility: resolveVisibility(input.cardVisibility),
    id: `advisor-${target.id}`,
    advisorName: 'Ece',
    title: 'Ece’nin Önerisi',
    contextLine,
    recommendation: clampText(recommendation, RECOMMENDATION_MAX),
    reason: reason ? clampText(reason, REASON_MAX) : undefined,
    caution,
    tone,
    priority,
    confidence: buildConfidence(
      sourceIds,
      true,
      Boolean(urgentSignal),
      Boolean(cityWarning),
    ),
    sourceLabel: urgentSignal ? 'Hedef + sinyal' : 'Aktif hedef',
    sourceIds,
    action,
    secondaryAction,
    compactMode: resolveCompactMode(input, priority),
    shouldShowAvatar: !resolveCompactMode(input, priority),
    motionHint: buildMotionHint(tone, priority),
    accessibilityLabel: '',
  };

  advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
  return advisor;
}

function buildFromSignalOnly(
  input: BuildCenterAdvisorSuggestionInput,
  signal: OperationDomainSignal,
): CenterAdvisorSuggestion {
  const avoid = [
    input.activeTarget.title,
    input.activeTarget.description,
    input.citySummary?.primaryInsight?.text,
    input.recommendedPlanBody,
  ];

  const advisor: CenterAdvisorSuggestion = {
    visibility: resolveVisibility(input.cardVisibility),
    id: `advisor-signal-${signal.domain}`,
    advisorName: 'Ece',
    title: 'Ece’nin Önerisi',
    contextLine: clampText(signal.summary || signal.title, CONTEXT_MAX),
    recommendation: clampText(
      dedupeAgainst(
        'Önce bu sinyali incele; yanlış müdahale yarın riski büyütebilir.',
        avoid,
        'Önce sinyali doğrula, sonra operasyonu seç.',
      ),
      RECOMMENDATION_MAX,
    ),
    caution: clampText(
      dedupeAgainst(
        input.hubImpactExplanationLine ?? 'Yorgun ekiplerle müdahale başarı şansını düşürür.',
        avoid,
        'Yorgun ekiplerle müdahale başarı şansını düşürür.',
      ),
      REASON_MAX,
    ),
    tone: signal.status === 'critical' ? 'urgent' : 'warning',
    priority: signal.status === 'critical' ? 'urgent' : 'high',
    confidence: buildConfidence([`signal-${signal.domain}`], false, true, false),
    sourceLabel: 'Operasyon sinyali',
    sourceIds: [`signal-${signal.domain}`],
    action: {
      label: 'Sinyalleri Aç',
      route: '/events',
      actionKey: 'view_signals',
      enabled: true,
    },
    compactMode: resolveCompactMode(input, 'high'),
    shouldShowAvatar: true,
    motionHint: buildMotionHint(
      signal.status === 'critical' ? 'urgent' : 'warning',
      signal.status === 'critical' ? 'urgent' : 'high',
    ),
    accessibilityLabel: '',
  };

  advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
  return advisor;
}

function buildLowDataAdvisor(input: BuildCenterAdvisorSuggestionInput): CenterAdvisorSuggestion {
  const advisor: CenterAdvisorSuggestion = {
    visibility: resolveVisibility(input.cardVisibility),
    id: 'advisor-low-data',
    advisorName: 'Ece',
    title: 'Ece’nin Önerisi',
    contextLine: clampText('Veri sınırlı; sakin bir öneri paylaşıyorum.', CONTEXT_MAX),
    recommendation: clampText(
      'Operasyon merkezini açıp bugünkü akışı gözden geçir.',
      RECOMMENDATION_MAX,
    ),
    tone: 'calm',
    priority: 'low',
    confidence: 'low',
    sourceLabel: 'Düşük veri',
    sourceIds: ['fallback'],
    action: {
      label: 'Operasyonları Gör',
      route: '/events',
      actionKey: 'view_plan',
      enabled: true,
    },
    compactMode: true,
    shouldShowAvatar: false,
    motionHint: buildMotionHint('calm', 'low'),
    accessibilityLabel: '',
  };

  advisor.accessibilityLabel = buildAccessibilityLabel(advisor);
  return advisor;
}

export function buildCenterAdvisorSuggestion(
  input: BuildCenterAdvisorSuggestionInput,
): CenterAdvisorSuggestion {
  if (input.day <= 1 && input.activeTarget.sourceLabel === 'Başlangıç hedefi') {
    return buildDay1Advisor(input);
  }

  if (
    input.activeTarget.status === 'empty' &&
    input.activeTarget.id === 'calm-day'
  ) {
    const signal = pickHighPrioritySignal(input.operationSignals);
    if (signal && (signal.status === 'critical' || signal.status === 'strained')) {
      return buildFromSignalOnly(input, signal);
    }
  }

  if (!input.activeTarget.title.trim()) {
    return buildLowDataAdvisor(input);
  }

  return buildFromActiveTarget(input);
}

export function centerAdvisorDedupeText(advisor: CenterAdvisorSuggestion): string {
  return [advisor.recommendation, advisor.contextLine, advisor.reason, advisor.caution]
    .filter(Boolean)
    .join(' ');
}

export function centerAdvisorToneValid(advisor: CenterAdvisorSuggestion): boolean {
  return ALLOWED_TONES.includes(advisor.tone);
}

export function centerAdvisorPriorityValid(advisor: CenterAdvisorSuggestion): boolean {
  return ALLOWED_PRIORITIES.includes(advisor.priority);
}

export function centerAdvisorConfidenceValid(advisor: CenterAdvisorSuggestion): boolean {
  return ALLOWED_CONFIDENCES.includes(advisor.confidence);
}

export function centerAdvisorActionKeyValid(advisor: CenterAdvisorSuggestion): boolean {
  if (advisor.action && !ALLOWED_ACTION_KEYS.includes(advisor.action.actionKey)) {
    return false;
  }
  if (
    advisor.secondaryAction &&
    !ALLOWED_ACTION_KEYS.includes(advisor.secondaryAction.actionKey)
  ) {
    return false;
  }
  return true;
}

export function centerAdvisorCoreFieldsValid(advisor: CenterAdvisorSuggestion): boolean {
  return (
    Boolean(advisor.id.trim()) &&
    Boolean(advisor.title.trim()) &&
    Boolean(advisor.contextLine.trim()) &&
    Boolean(advisor.recommendation.trim()) &&
    Boolean(advisor.accessibilityLabel.trim())
  );
}

export function centerAdvisorSourceIdsUnique(advisor: CenterAdvisorSuggestion): boolean {
  return new Set(advisor.sourceIds).size === advisor.sourceIds.length;
}

export function centerAdvisorNotDuplicateText(
  advisor: CenterAdvisorSuggestion,
  other: string | null | undefined,
): boolean {
  if (!other?.trim()) return true;
  return (
    !linesAreDuplicate(advisor.recommendation, other) &&
    !linesAreDuplicate(advisor.contextLine, other) &&
    !linesAreDuplicate(advisor.title, other)
  );
}

export function centerAdvisorActionAlignedWithTarget(
  advisor: CenterAdvisorSuggestion,
  target: CenterActiveTarget,
): boolean {
  if (!advisor.action) return true;
  if (advisor.action.label !== target.cta.label) {
    const compatible =
      (target.cta.actionKey === 'view_result' &&
        advisor.action.actionKey === 'view_report') ||
      (target.cta.actionKey === 'view_plan' &&
        advisor.action.actionKey === 'view_plan');
    if (!compatible && target.status !== 'empty') return false;
  }
  if (advisor.action.enabled !== target.cta.enabled && target.cta.actionKey !== 'locked') {
    return false;
  }
  return true;
}

export function centerAdvisorSecondaryActionSafe(
  advisor: CenterAdvisorSuggestion,
): boolean {
  if (!advisor.secondaryAction) return true;
  if (!advisor.secondaryAction.route && advisor.secondaryAction.enabled) return false;
  return true;
}

export function centerAdvisorNoFakeCrisis(advisor: CenterAdvisorSuggestion): boolean {
  if (advisor.tone !== 'urgent' && advisor.tone !== 'warning') return true;
  if (advisor.sourceIds.includes('fallback')) return false;
  return advisor.sourceIds.length > 0;
}

export function centerAdvisorDay1Teaching(advisor: CenterAdvisorSuggestion): boolean {
  return advisor.tone === 'teaching' && advisor.action?.actionKey === 'start_operation';
}

export function centerAdvisorCompletedTone(advisor: CenterAdvisorSuggestion): boolean {
  return advisor.tone === 'celebration' || advisor.tone === 'positive';
}

export function centerAdvisorUrgentTone(advisor: CenterAdvisorSuggestion): boolean {
  return advisor.tone === 'urgent' || advisor.tone === 'warning';
}
