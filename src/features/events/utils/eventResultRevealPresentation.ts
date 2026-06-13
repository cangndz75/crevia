import type { EventCard } from '@/core/models/EventCard';
import {
  operationMotionResultRevealStaggerMs,
  OPERATION_MOTION_RESULT_REDUCED_MS,
  OPERATION_MOTION_RESULT_TOTAL_MS,
} from '@/core/motion/operationMotionTokens';
import type {
  DecisionMetricChange,
  DecisionResultSnapshot,
  DecisionResultSummaryTone,
} from '@/features/events/types/decisionResultTypes';
import {
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type EventResultOutcomeBand = 'success' | 'partial' | 'mixed' | 'risk' | 'unknown';

export type EventResultOutcomeSummary = {
  label: string;
  body: string;
  outcomeBand: EventResultOutcomeBand;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventResultRevealItemKind =
  | 'task'
  | 'resource'
  | 'district_trust'
  | 'social_pulse'
  | 'tomorrow_risk'
  | 'xp'
  | 'badge'
  | 'authority'
  | 'carry_over'
  | 'butterfly'
  | 'city_memory';

export type EventResultRevealItem = {
  id: string;
  kind: EventResultRevealItemKind;
  title: string;
  body: string;
  valueText?: string;
  deltaText?: string;
  tone: 'positive' | 'neutral' | 'warning' | 'gold';
  priority: 'low' | 'normal' | 'high';
  iconKey: string;
  sourceLabel: string;
  sourceIds: string[];
  revealOrder: number;
};

export type EventResultAdvisorComment = {
  title: string;
  text: string;
  tone: 'calm' | 'positive' | 'warning' | 'teaching';
};

export type EventResultActionId =
  | 'back_to_hub'
  | 'open_report'
  | 'next_day'
  | 'view_authority';

export type EventResultAction = {
  id: EventResultActionId;
  label: string;
  route?: string;
  actionKey: string;
  enabled: boolean;
};

export type EventResultSelectedPlanContext = {
  strategyId?: EventPlanStrategyId;
  label: string;
  resultLine: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventResultRevealPresentation = {
  title: string;
  subtitle?: string;
  outcome: EventResultOutcomeSummary;
  revealItems: EventResultRevealItem[];
  advisorComment: EventResultAdvisorComment;
  finalActions: EventResultAction[];
  selectedPlanContext?: EventResultSelectedPlanContext;
  accessibilityLabel: string;
  revealStaggerMs: number;
  revealTotalMs: number;
};

export type BuildEventResultRevealPresentationInput = {
  snapshot: DecisionResultSnapshot;
  event?: EventCard | null;
  isFallback?: boolean;
  isDay1LearningEvent?: boolean;
  day?: number;
  selectedPlanStrategyId?: EventPlanStrategyId | null;
  carryOverSummary?: string | null;
  authorityProgressLine?: string | null;
  showNextDayAction?: boolean;
  reducedMotion?: boolean;
};

const PLAN_RESULT_LINE: Record<EventPlanStrategyId, string> = {
  rapid_response: 'Hızlı müdahale sonucu süreyi öne aldı.',
  balanced_plan: 'Seçtiğin plan kaynak etkisini dengede tuttu.',
  long_term_fix: 'Kalıcı yatırım odağı güven etkisini güçlendirdi.',
};

const KIND_ORDER: EventResultRevealItemKind[] = [
  'task',
  'resource',
  'district_trust',
  'social_pulse',
  'tomorrow_risk',
  'xp',
  'badge',
  'authority',
  'carry_over',
  'butterfly',
  'city_memory',
];

function mapSummaryToneToOutcomeBand(
  tone: DecisionResultSummaryTone,
): EventResultOutcomeBand {
  switch (tone) {
    case 'positive':
      return 'success';
    case 'mixed':
      return 'partial';
    case 'negative':
      return 'risk';
    default:
      return 'unknown';
  }
}

function buildOutcomeSummary(
  snapshot: DecisionResultSnapshot,
  isFallback: boolean,
): EventResultOutcomeSummary {
  if (isFallback) {
    return {
      label: 'Sonuç kayda alındı',
      body: 'Operasyon sonucu güvenli şekilde görüntüleniyor.',
      outcomeBand: 'unknown',
      tone: 'neutral',
      iconKey: 'document-text-outline',
    };
  }

  const band = mapSummaryToneToOutcomeBand(snapshot.resultTone);
  const label =
    band === 'success'
      ? 'Operasyon tamamlandı'
      : band === 'partial'
        ? 'Operasyon kısmen tamamlandı'
        : band === 'risk'
          ? 'Risk kontrol altına alındı'
          : 'Sonuç kayda alındı';

  const body = snapshot.summaryText?.trim() || snapshot.summaryTitle?.trim() || label;

  return {
    label,
    body: body.length > 120 ? `${body.slice(0, 118)}…` : body,
    outcomeBand: band,
    tone: band === 'success' ? 'positive' : band === 'risk' ? 'warning' : 'neutral',
    iconKey:
      band === 'success'
        ? 'checkmark-circle-outline'
        : band === 'risk'
          ? 'alert-circle-outline'
          : 'pulse-outline',
  };
}

function findMetric(
  metrics: DecisionMetricChange[],
  key: DecisionMetricChange['key'],
): DecisionMetricChange | undefined {
  return metrics.find((metric) => metric.key === key);
}

function formatMetricDelta(metric?: DecisionMetricChange): string | undefined {
  if (!metric || metric.delta === 0) return undefined;
  const sign = metric.delta > 0 ? '+' : '';
  if (metric.key === 'budget') {
    const abs = Math.abs(metric.delta);
    if (abs >= 1000) return `${sign}${Math.round(metric.delta / 1000)}K`;
    return `${sign}${metric.delta}`;
  }
  return `${sign}${metric.delta}`;
}

function buildTaskItem(snapshot: DecisionResultSnapshot): EventResultRevealItem {
  return {
    id: 'reveal-task',
    kind: 'task',
    title: 'Görev sonucu',
    body: snapshot.summaryTitle || 'Operasyon tamamlandı',
    tone: snapshot.resultTone === 'positive' ? 'positive' : 'neutral',
    priority: 'high',
    iconKey: 'flag-outline',
    sourceLabel: 'Operasyon',
    sourceIds: [snapshot.eventId],
    revealOrder: 1,
  };
}

function buildResourceItem(snapshot: DecisionResultSnapshot): EventResultRevealItem {
  const budget = findMetric(snapshot.metricChanges, 'budget');
  const morale = findMetric(snapshot.metricChanges, 'personnelMorale');
  const vehicle = snapshot.subsystemOutcomes.find((o) => o.key === 'vehicle');
  const personnel = snapshot.subsystemOutcomes.find((o) => o.key === 'personnel');

  let title = 'Kaynak kullanımı dengeli';
  let body = 'Kaynak yorgunluğu izleniyor';
  let tone: EventResultRevealItem['tone'] = 'neutral';

  if (budget && budget.delta < -1500) {
    title = 'Ek kaynak kullanıldı';
    body = 'Operasyon bütçe baskısı oluşturdu.';
    tone = 'warning';
  } else if (morale && morale.delta < -3) {
    title = 'Araç/personel baskısı arttı';
    body = personnel?.primaryText || 'Ekip yükü izleniyor.';
    tone = 'warning';
  } else if (vehicle?.status === 'warning' || vehicle?.status === 'critical') {
    title = 'Araç/personel baskısı arttı';
    body = vehicle.primaryText;
    tone = 'warning';
  }

  return {
    id: 'reveal-resource',
    kind: 'resource',
    title,
    body,
    deltaText: formatMetricDelta(budget),
    tone,
    priority: 'normal',
    iconKey: 'cube-outline',
    sourceLabel: 'Kaynak',
    sourceIds: ['budget', personnel?.key ?? 'personnel', vehicle?.key ?? 'vehicle'].filter(
      Boolean,
    ),
    revealOrder: 2,
  };
}

function buildDistrictTrustItem(
  snapshot: DecisionResultSnapshot,
): EventResultRevealItem {
  const publicMetric = findMetric(snapshot.metricChanges, 'publicSatisfaction');
  const district = snapshot.neighborhoodName || 'Bölge';

  let title = 'Bölge etkisi izleniyor';
  let body = `${district} üzerindeki etki kayda alındı.`;
  let tone: EventResultRevealItem['tone'] = 'neutral';

  if (publicMetric && publicMetric.delta > 2) {
    title = 'Mahalle güveni güçlendi';
    body = 'Halk memnuniyeti olumlu yönde izleniyor.';
    tone = 'positive';
  } else if (publicMetric && publicMetric.delta < -2) {
    title = 'Güven artışı sınırlı kaldı';
    body = 'Mahalle tepkisi dengeli seyrediyor.';
    tone = 'warning';
  }

  return {
    id: 'reveal-district-trust',
    kind: 'district_trust',
    title,
    body,
    deltaText: formatMetricDelta(publicMetric),
    tone,
    priority: 'normal',
    iconKey: 'location-outline',
    sourceLabel: district,
    sourceIds: [snapshot.neighborhoodId ?? district],
    revealOrder: 3,
  };
}

function buildSocialPulseItem(snapshot: DecisionResultSnapshot): EventResultRevealItem {
  const social = snapshot.subsystemOutcomes.find((o) => o.key === 'social');

  if (social) {
    return {
      id: 'reveal-social-pulse',
      kind: 'social_pulse',
      title: social.title || 'Sosyal nabız',
      body: social.primaryText,
      tone:
        social.status === 'good'
          ? 'positive'
          : social.status === 'warning' || social.status === 'critical'
            ? 'warning'
            : 'neutral',
      priority: 'normal',
      iconKey: 'chatbubbles-outline',
      sourceLabel: 'Sosyal nabız',
      sourceIds: ['social'],
      revealOrder: 4,
    };
  }

  return {
    id: 'reveal-social-pulse',
    kind: 'social_pulse',
    title: 'Kamu tepkisi izleniyor',
    body: 'Sosyal nabız dengeli görünüyor.',
    tone: 'neutral',
    priority: 'low',
    iconKey: 'chatbubbles-outline',
    sourceLabel: 'Sosyal nabız',
    sourceIds: ['social-fallback'],
    revealOrder: 4,
  };
}

function buildTomorrowRiskItem(snapshot: DecisionResultSnapshot): EventResultRevealItem {
  const riskLine = snapshot.riskLines[0];
  const butterfly = snapshot.butterflyHint;
  const priority = snapshot.dailyPriorityImpact;

  if (butterfly?.text) {
    return {
      id: 'reveal-tomorrow-risk',
      kind: 'tomorrow_risk',
      title: butterfly.title || 'Yarın riski',
      body: butterfly.text,
      tone: butterfly.tone === 'warning' ? 'warning' : 'neutral',
      priority: 'high',
      iconKey: 'calendar-outline',
      sourceLabel: 'Yarın riski',
      sourceIds: ['butterfly'],
      revealOrder: 5,
    };
  }

  if (priority && priority.tone === 'risky') {
    return {
      id: 'reveal-tomorrow-risk',
      kind: 'tomorrow_risk',
      title: priority.title,
      body: priority.text,
      tone: 'warning',
      priority: 'high',
      iconKey: 'calendar-outline',
      sourceLabel: 'Günlük öncelik',
      sourceIds: ['daily-priority'],
      revealOrder: 5,
    };
  }

  if (riskLine) {
    return {
      id: 'reveal-tomorrow-risk',
      kind: 'tomorrow_risk',
      title: 'Yarın riski',
      body: riskLine,
      tone: 'neutral',
      priority: 'normal',
      iconKey: 'calendar-outline',
      sourceLabel: 'Risk',
      sourceIds: ['risk-line'],
      revealOrder: 5,
    };
  }

  return {
    id: 'reveal-tomorrow-risk',
    kind: 'tomorrow_risk',
    title: 'Yarın için ek baskı görünmüyor',
    body: 'Operasyon hafızası oluştu.',
    tone: 'neutral',
    priority: 'low',
    iconKey: 'calendar-outline',
    sourceLabel: 'Yarın riski',
    sourceIds: ['tomorrow-calm'],
    revealOrder: 5,
  };
}

function buildProgressItem(
  snapshot: DecisionResultSnapshot,
  authorityProgressLine?: string | null,
): EventResultRevealItem | null {
  if (snapshot.dailyGoalImpact) {
    return {
      id: 'reveal-xp',
      kind: 'xp',
      title: 'Günlük hedef ilerlemesi',
      body: snapshot.dailyGoalImpact,
      tone: 'positive',
      priority: 'normal',
      iconKey: 'star-outline',
      sourceLabel: 'İlerleme',
      sourceIds: ['daily-goal'],
      revealOrder: 6,
    };
  }

  const badgeLine = snapshot.highlightLines.find((line) =>
    line.toLowerCase().includes('rozet'),
  );
  if (badgeLine) {
    return {
      id: 'reveal-badge',
      kind: 'badge',
      title: 'Rozet ilerlemesi kaydedildi',
      body: badgeLine,
      tone: 'gold',
      priority: 'normal',
      iconKey: 'ribbon-outline',
      sourceLabel: 'Rozet',
      sourceIds: ['badge-line'],
      revealOrder: 6,
    };
  }

  if (authorityProgressLine?.trim()) {
    return {
      id: 'reveal-authority',
      kind: 'authority',
      title: 'Yetki ilerlemesi arttı',
      body: authorityProgressLine,
      tone: 'gold',
      priority: 'normal',
      iconKey: 'shield-outline',
      sourceLabel: 'Yetki',
      sourceIds: ['authority'],
      revealOrder: 6,
    };
  }

  return null;
}

function buildMemoryItem(
  snapshot: DecisionResultSnapshot,
  carryOverSummary?: string | null,
): EventResultRevealItem | null {
  if (snapshot.butterflyHint?.text) {
    return {
      id: 'reveal-butterfly',
      kind: 'butterfly',
      title: snapshot.butterflyHint.title || 'Şehir hafızası',
      body: snapshot.butterflyHint.text,
      tone: 'neutral',
      priority: 'normal',
      iconKey: 'git-branch-outline',
      sourceLabel: 'Butterfly',
      sourceIds: ['butterfly-hint'],
      revealOrder: 7,
    };
  }

  if (carryOverSummary?.trim()) {
    return {
      id: 'reveal-carry-over',
      kind: 'carry_over',
      title: 'Bu karar hatırlanacak',
      body: carryOverSummary,
      tone: 'positive',
      priority: 'normal',
      iconKey: 'bookmark-outline',
      sourceLabel: 'Carry-over',
      sourceIds: ['carry-over'],
      revealOrder: 7,
    };
  }

  return null;
}

function buildRevealItems(
  snapshot: DecisionResultSnapshot,
  input: BuildEventResultRevealPresentationInput,
): EventResultRevealItem[] {
  const candidates: EventResultRevealItem[] = [
    buildTaskItem(snapshot),
    buildResourceItem(snapshot),
    buildDistrictTrustItem(snapshot),
    buildSocialPulseItem(snapshot),
    buildTomorrowRiskItem(snapshot),
  ];

  const progress = buildProgressItem(snapshot, input.authorityProgressLine);
  if (progress) candidates.push(progress);

  const memory = buildMemoryItem(snapshot, input.carryOverSummary);
  if (memory) candidates.push(memory);

  const byKind = new Map<EventResultRevealItemKind, EventResultRevealItem>();
  for (const item of candidates) {
    if (!byKind.has(item.kind)) {
      byKind.set(item.kind, item);
    }
  }

  const ordered = KIND_ORDER.map((kind) => byKind.get(kind)).filter(
    (item): item is EventResultRevealItem => Boolean(item),
  );

  while (ordered.length < 3) {
    if (!byKind.has('city_memory')) {
      ordered.push({
        id: 'reveal-city-memory-fallback',
        kind: 'city_memory',
        title: 'Sonuç kaydı',
        body: 'Karar şehir kayıtlarına işlendi.',
        tone: 'neutral',
        priority: 'low',
        iconKey: 'library-outline',
        sourceLabel: 'Kayıt',
        sourceIds: ['result-fallback'],
        revealOrder: 8,
      });
      break;
    }
    break;
  }

  return ordered.slice(0, 7).map((item, index) => ({
    ...item,
    revealOrder: index + 1,
  }));
}

function buildSelectedPlanContext(
  strategyId: EventPlanStrategyId | null | undefined,
): EventResultSelectedPlanContext | undefined {
  if (!strategyId) return undefined;
  return {
    strategyId,
    label: `${getPlanStrategyLabel(strategyId)} sonucu`,
    resultLine: PLAN_RESULT_LINE[strategyId],
    tone: 'neutral',
  };
}

function isGenuineTomorrowRiskWarning(item: EventResultRevealItem): boolean {
  return (
    item.kind === 'tomorrow_risk' &&
    item.tone === 'warning' &&
    !item.sourceIds.includes('tomorrow-calm')
  );
}

export function buildEventResultAdvisorComment(
  input: BuildEventResultRevealPresentationInput,
  outcome: EventResultOutcomeSummary,
  revealItems: EventResultRevealItem[],
): EventResultAdvisorComment {
  if (input.isDay1LearningEvent || input.day === 1) {
    return {
      title: 'Ece',
      text: 'İlk operasyon tamamlandı. Sonuç kartları, kararının şehir üzerindeki etkisini gösterir.',
      tone: 'teaching',
    };
  }

  const hasCarryOver = revealItems.some(
    (item) => item.kind === 'carry_over' || item.kind === 'butterfly',
  );
  const hasRisk = revealItems.some(isGenuineTomorrowRiskWarning);

  if (hasCarryOver) {
    return {
      title: 'Ece',
      text: 'Bu karar şehir hafızasına işlendi. Sonraki günlerde küçük bir iz bırakabilir.',
      tone: 'calm',
    };
  }

  if (hasRisk || outcome.outcomeBand === 'risk') {
    return {
      title: 'Ece',
      text: 'Operasyon tamamlandı ama bazı etkiler yarına taşınabilir. Raporu kontrol etmek iyi olur.',
      tone: 'warning',
    };
  }

  if (outcome.outcomeBand === 'success') {
    return {
      title: 'Ece',
      text: 'Kararın sahada karşılık buldu. Şimdi bu etkinin rapora nasıl yansıdığını izleyebilirsin.',
      tone: 'positive',
    };
  }

  return {
    title: 'Ece',
    text: 'Sonuç kayda alındı. Merkez ve rapor ekranından etkiyi takip edebilirsin.',
    tone: 'calm',
  };
}

function buildFinalActions(
  showNextDay: boolean,
  showAuthority: boolean,
): EventResultAction[] {
  const actions: EventResultAction[] = [
    {
      id: 'back_to_hub',
      label: "Merkez'e Dön",
      route: '/',
      actionKey: 'back_to_hub',
      enabled: true,
    },
    {
      id: 'open_report',
      label: 'Raporu Aç',
      route: '/reports',
      actionKey: 'open_report',
      enabled: true,
    },
  ];

  if (showAuthority) {
    actions.push({
      id: 'view_authority',
      label: 'Yetkileri Gör',
      route: '/profile',
      actionKey: 'view_authority',
      enabled: true,
    });
  }

  if (showNextDay) {
    actions.push({
      id: 'next_day',
      label: 'Sonraki Güne Geç',
      actionKey: 'next_day',
      enabled: false,
    });
  }

  return actions;
}

export function buildEventResultRevealPresentation(
  input: BuildEventResultRevealPresentationInput,
): EventResultRevealPresentation {
  const isFallback = input.isFallback ?? false;
  const reducedMotion = input.reducedMotion ?? false;
  const outcome = buildOutcomeSummary(input.snapshot, isFallback);
  const revealItems = buildRevealItems(input.snapshot, input);
  const selectedPlanContext = buildSelectedPlanContext(input.selectedPlanStrategyId);
  const advisorComment = buildEventResultAdvisorComment(input, outcome, revealItems);
  const showAuthority = Boolean(input.authorityProgressLine?.trim());
  const finalActions = buildFinalActions(input.showNextDayAction ?? false, showAuthority);

  return {
    title: 'Operasyon Sonucu',
    subtitle: input.snapshot.eventTitle,
    outcome,
    revealItems,
    advisorComment,
    finalActions,
    selectedPlanContext,
    accessibilityLabel: `${input.snapshot.eventTitle} operasyon sonucu, ${outcome.label}`,
    revealStaggerMs: operationMotionResultRevealStaggerMs(reducedMotion),
    revealTotalMs: reducedMotion
      ? OPERATION_MOTION_RESULT_REDUCED_MS
      : OPERATION_MOTION_RESULT_TOTAL_MS,
  };
}

export function auditEventResultRevealPresentation(
  model: EventResultRevealPresentation,
): string[] {
  const issues: string[] = [];

  if (!model.title.trim()) issues.push('title empty');
  if (!model.accessibilityLabel.trim()) issues.push('accessibilityLabel empty');
  if (!model.outcome.label.trim() || !model.outcome.body.trim()) {
    issues.push('outcome incomplete');
  }
  if (!['success', 'partial', 'mixed', 'risk', 'unknown'].includes(model.outcome.outcomeBand)) {
    issues.push('invalid outcomeBand');
  }
  if (model.revealItems.length < 3 || model.revealItems.length > 7) {
    issues.push('revealItems count out of range');
  }

  const ids = new Set<string>();
  const kinds = new Set<string>();
  const sourceIds = new Set<string>();

  for (const item of model.revealItems) {
    if (ids.has(item.id)) issues.push(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (kinds.has(item.kind)) issues.push(`duplicate kind ${item.kind}`);
    kinds.add(item.kind);
    for (const sourceId of item.sourceIds) {
      if (sourceIds.has(sourceId)) issues.push(`duplicate sourceId ${sourceId}`);
      sourceIds.add(sourceId);
    }
    if (item.valueText && /NaN|undefined|null/i.test(item.valueText)) {
      issues.push('invalid valueText');
    }
  }

  const orders = model.revealItems.map((item) => item.revealOrder);
  if (orders.join(',') !== [...orders].sort((a, b) => a - b).join(',')) {
    issues.push('revealOrder not sorted');
  }

  if (!model.advisorComment.text.trim()) issues.push('advisorComment empty');
  if (model.finalActions.length < 1) issues.push('finalActions empty');

  for (const action of model.finalActions) {
    if (action.enabled && !action.route && action.id !== 'next_day') {
      issues.push(`enabled action without route: ${action.id}`);
    }
  }

  if (model.revealTotalMs < 0) issues.push('invalid revealTotalMs');

  return issues;
}

export function resultAdvisorDiffersFromFieldAdvisor(
  resultComment: string,
  fieldComment: string,
): boolean {
  return resultComment.trim() !== fieldComment.trim();
}
