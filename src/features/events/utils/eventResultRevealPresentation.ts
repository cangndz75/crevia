import type { EventCard } from '@/core/models/EventCard';
import {
  buildDistrictReactionFlavor,
  buildDistrictPersonalityEceHint,
  dedupeDistrictPersonalityCopy,
  mapResultToneToPersonalityOutcome,
} from '@/core/districtPersonality';
import {
  buildEceMemorySnapshot,
  buildResultEceLine,
  mapEceToneToResultAdvisorTone,
  type EceMemoryContextInput,
  type EceOutcomeTone,
} from '@/core/eceTone';
import { buildResultResourceCostFromContext } from '@/core/operationReadiness';
import {
  buildMaintenanceActionUiBundle,
  buildMaintenanceBacklogFromReadiness,
  buildMaintenanceBacklogRuntimePresentation,
  buildMaintenanceResultHint,
  buildMaintenanceRuntimeResultHint,
} from '@/core/maintenanceBacklog';
import type { MaintenanceActionPresentation } from '@/core/maintenanceBacklog/maintenanceActionTypes';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type { ReadinessResultBridgePresentation } from '@/core/readinessStrategicPriority/readinessStrategicPriorityTypes';
import {
  buildReadinessInputFromContext,
  buildResultReadinessBridge,
} from '@/core/readinessStrategicPriority/readinessSurfaceBridge';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import {
  buildOperationPhaseTransitionPresentation,
  type OperationPhaseTransitionPresentation,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
import {
  buildDecisionConsequenceThreadsFromResult,
  mapDecisionConsequenceToneToSurface,
} from '@/core/decisionConsequence';
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
import type { SocialEchoPresentation } from '@/core/socialEcho';
import {
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import {
  buildOperationResultRevealSections,
  type OperationResultRevealSections,
} from './operationResultRevealSectionsPresentation';

export type EventResultOutcomeBand = 'success' | 'partial' | 'mixed' | 'risk' | 'unknown';

export type EventResultOutcomeTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral';

export type EventResultOutcomeSummary = {
  label: string;
  body: string;
  eventTitle: string;
  districtName: string;
  statusLabel: string;
  resultTone: EventResultOutcomeTone;
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

export type EventResultImpactCardId =
  | 'district_trust'
  | 'operation_risk'
  | 'resource_pressure'
  | 'social_pulse';

export type EventResultImpactCard = {
  id: EventResultImpactCardId;
  title: string;
  body: string;
  valueLabel: string;
  deltaText: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
  indicator?: 'up' | 'down' | 'neutral';
};

export type EventResultCityImpactSection = {
  title: string;
  items: EventResultImpactCard[];
};

export type EventResultDistrictReaction = {
  title: string;
  sourceLabel: string;
  message: string;
  tone: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  iconKey: string;
};

export type EventResultResourceCostItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventResultResourceCostSection = {
  title: string;
  summary: string;
  items: EventResultResourceCostItem[];
  tone: 'positive' | 'neutral' | 'warning' | 'mixed';
  maintenanceHint?: string;
  maintenanceHintTone?: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  maintenanceAction?: MaintenanceActionPresentation | null;
};

export type EventResultSelectedPlanOutcome = {
  title: string;
  planLabel: string;
  summary: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventResultReportBridgeChip = {
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventResultReportBridge = {
  title: string;
  summary: string;
  chips: EventResultReportBridgeChip[];
};

export type EventResultSecondaryActionId =
  | 'view_map'
  | 'view_recent_impact'
  | 'open_note';

export type EventResultSecondaryAction = {
  id: EventResultSecondaryActionId;
  label: string;
  iconKey: string;
  actionKey: string;
  enabled: boolean;
};

export type EventResultRecentImpactPreview = {
  eventId: string;
  title: string;
  districtName: string;
  tone: EventResultOutcomeBand;
  summary: string;
  impactCards: EventResultImpactCard[];
};

export type EventResultAdvisorComment = {
  title: string;
  text: string;
  tone: 'calm' | 'positive' | 'warning' | 'teaching';
  toneLabel: string;
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
  phaseHeading: string;
  phaseDescription: string;
  outcome: EventResultOutcomeSummary;
  cityImpact: EventResultCityImpactSection;
  impactCards: EventResultImpactCard[];
  districtReaction?: EventResultDistrictReaction;
  resourceCost: EventResultResourceCostSection;
  selectedPlanOutcome?: EventResultSelectedPlanOutcome;
  recentImpact: EventResultRecentImpactPreview;
  revealItems: EventResultRevealItem[];
  advisorComment: EventResultAdvisorComment;
  reportBridge: EventResultReportBridge;
  secondaryActions: EventResultSecondaryAction[];
  finalActions: EventResultAction[];
  primaryCta: EventResultAction;
  selectedPlanContext?: EventResultSelectedPlanContext;
  accessibilityLabel: string;
  revealStaggerMs: number;
  revealTotalMs: number;
  phaseTransition: OperationPhaseTransitionPresentation;
  revealSections: OperationResultRevealSections;
  readinessImpact: ReadinessResultBridgePresentation;
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
  eceMemoryContext?: EceMemoryContextInput;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  socialEcho?: SocialEchoPresentation | null;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

const PLAN_RESULT_LINE: Record<EventPlanStrategyId, string> = {
  rapid_response:
    'Hızlı müdahale güveni hızla toparladı, ekip baskısını artırdı.',
  balanced_plan: 'Dengeli plan riski büyütmeden kontrol sağladı.',
  long_term_fix: 'Önleyici plan yarınki baskıyı azaltacak bir zemin oluşturdu.',
};

const ADVISOR_TONE_LABEL: Record<EventResultAdvisorComment['tone'], string> = {
  calm: 'Stratejik',
  positive: 'Olumlu',
  warning: 'Dikkat',
  teaching: 'Öğretici',
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

function mapSummaryToneToResultTone(
  tone: DecisionResultSummaryTone,
  band: EventResultOutcomeBand,
): EventResultOutcomeTone {
  if (band === 'risk') return 'critical';
  if (tone === 'positive') return 'positive';
  if (tone === 'mixed' || band === 'partial') return 'mixed';
  if (tone === 'negative') return 'warning';
  return 'neutral';
}

function buildStatusLabel(resultTone: EventResultOutcomeTone): string {
  switch (resultTone) {
    case 'positive':
      return 'Olumlu Etki';
    case 'mixed':
      return 'Karışık Etki';
    case 'warning':
      return 'Dikkat';
    case 'critical':
      return 'Kritik İz';
    default:
      return 'Tamamlandı';
  }
}

function buildOutcomeSummary(
  snapshot: DecisionResultSnapshot,
  isFallback: boolean,
): EventResultOutcomeSummary {
  const eventTitle = snapshot.eventTitle?.trim() || snapshot.summaryTitle?.trim() || 'Operasyon';
  const districtName = snapshot.neighborhoodName?.trim() || 'Merkez';

  if (isFallback) {
    return {
      label: 'Operasyon Tamamlandı',
      body: 'Kararın şehirdeki ilk etkisi kayda alındı.',
      eventTitle,
      districtName,
      statusLabel: 'Tamamlandı',
      resultTone: 'neutral',
      outcomeBand: 'unknown',
      tone: 'neutral',
      iconKey: 'document-text-outline',
    };
  }

  const band = mapSummaryToneToOutcomeBand(snapshot.resultTone);
  const resultTone = mapSummaryToneToResultTone(snapshot.resultTone, band);
  const statusLabel = buildStatusLabel(resultTone);

  const label = 'Operasyon Tamamlandı';
  const rawBody =
    snapshot.summaryText?.trim() ||
    snapshot.summaryTitle?.trim() ||
    'Operasyon tamamlandı. Şehirde oluşan ilk etki ve kalan baskıyı değerlendir.';
  const body = rawBody.length > 120 ? `${rawBody.slice(0, 118)}…` : rawBody;

  return {
    label,
    body,
    eventTitle,
    districtName,
    statusLabel,
    resultTone,
    outcomeBand: band,
    tone:
      resultTone === 'positive'
        ? 'positive'
        : resultTone === 'warning' || resultTone === 'critical'
          ? 'warning'
          : 'neutral',
    iconKey:
      resultTone === 'positive'
        ? 'checkmark-circle-outline'
        : resultTone === 'warning' || resultTone === 'critical'
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

function formatImpactDelta(metric?: DecisionMetricChange): string {
  return formatMetricDelta(metric) ?? 'Dengeli';
}

function impactTone(metric?: DecisionMetricChange): EventResultImpactCard['tone'] {
  if (!metric || metric.delta === 0 || metric.direction === 'flat') return 'neutral';
  if (metric.isGood) return 'positive';
  return 'warning';
}

function qualitativeTrustLabel(metric?: DecisionMetricChange): string {
  const tone = impactTone(metric);
  if (tone === 'positive') return 'Toparlanıyor';
  if (tone === 'warning') return 'Kısmi artış';
  return 'Dengede';
}

function qualitativeRiskLabel(metric?: DecisionMetricChange): string {
  const tone = impactTone(metric);
  if (tone === 'positive') return 'Azaldı';
  if (tone === 'warning') return 'İzleniyor';
  return 'Kontrol altında';
}

function qualitativeResourceLabel(
  budgetMetric?: DecisionMetricChange,
  personnelMetric?: DecisionMetricChange,
): string {
  const budgetTone = impactTone(budgetMetric);
  const moraleTone = impactTone(personnelMetric);
  if (budgetTone === 'warning' || moraleTone === 'warning') return 'Arttı';
  if (budgetTone === 'positive') return 'Dengede';
  return 'İzlenmeli';
}

function qualitativeSocialLabel(snapshot: DecisionResultSnapshot): string {
  const social = snapshot.subsystemOutcomes.find((o) => o.key === 'social');
  if (social?.status === 'good') return 'Sakinleşiyor';
  if (social?.status === 'warning' || social?.status === 'critical') return 'Hâlâ yüksek';
  return 'İzleniyor';
}

function buildResultImpactCards(snapshot: DecisionResultSnapshot): EventResultImpactCard[] {
  const publicMetric = findMetric(snapshot.metricChanges, 'publicSatisfaction');
  const budgetMetric = findMetric(snapshot.metricChanges, 'budget');
  const riskMetric = findMetric(snapshot.metricChanges, 'operationRisk');
  const personnelMetric = findMetric(snapshot.metricChanges, 'personnelMorale');
  const publicTone = impactTone(publicMetric);
  const riskTone = impactTone(riskMetric);
  const resourceTone =
    impactTone(budgetMetric) === 'warning' || impactTone(personnelMetric) === 'warning'
      ? 'warning'
      : impactTone(budgetMetric);
  const socialSubsystem = snapshot.subsystemOutcomes.find((o) => o.key === 'social');
  const socialTone =
    socialSubsystem?.status === 'good'
      ? 'positive'
      : socialSubsystem?.status === 'warning' || socialSubsystem?.status === 'critical'
        ? 'warning'
        : 'neutral';

  return [
    {
      id: 'district_trust',
      title: 'Mahalle Güveni',
      body:
        publicTone === 'positive'
          ? 'Görünür müdahale güven algısını toparladı.'
          : publicTone === 'warning'
            ? 'Güven artışı sınırlı kaldı, mahalle izleniyor.'
            : 'Mahalle güveni dengede seyrediyor.',
      valueLabel: qualitativeTrustLabel(publicMetric),
      deltaText: formatImpactDelta(publicMetric),
      tone: publicTone,
      iconKey: 'shield-checkmark-outline',
      indicator: publicTone === 'positive' ? 'up' : publicTone === 'warning' ? 'down' : 'neutral',
    },
    {
      id: 'operation_risk',
      title: 'Operasyon Riski',
      body:
        riskTone === 'positive'
          ? 'Saha müdahalesi kısa vadeli riski baskıladı.'
          : riskTone === 'warning'
            ? 'Risk baskısı tamamen sönmedi.'
            : 'Risk seviyesi izlemeye alındı.',
      valueLabel: qualitativeRiskLabel(riskMetric),
      deltaText: formatImpactDelta(riskMetric),
      tone: riskTone,
      iconKey: 'pulse-outline',
      indicator: riskTone === 'positive' ? 'down' : riskTone === 'warning' ? 'up' : 'neutral',
    },
    {
      id: 'resource_pressure',
      title: 'Kaynak Baskısı',
      body:
        resourceTone === 'warning'
          ? 'Ekip ve kaynak temposu yarına taşınabilir.'
          : 'Kaynak kullanımı kontrol altında kaldı.',
      valueLabel: qualitativeResourceLabel(budgetMetric, personnelMetric),
      deltaText: formatImpactDelta(budgetMetric),
      tone: resourceTone,
      iconKey: 'wallet-outline',
      indicator: resourceTone === 'warning' ? 'up' : 'neutral',
    },
    {
      id: 'social_pulse',
      title: 'Sosyal Nabız',
      body:
        socialTone === 'positive'
          ? 'Mahalledeki görünür tepki düşmeye başladı.'
          : socialTone === 'warning'
            ? 'Sosyal beklenti tamamen kapanmadı.'
            : 'Sosyal nabız dengeli görünüyor.',
      valueLabel: qualitativeSocialLabel(snapshot),
      deltaText: '—',
      tone: socialTone,
      iconKey: 'chatbubbles-outline',
      indicator: socialTone === 'positive' ? 'down' : socialTone === 'warning' ? 'up' : 'neutral',
    },
  ];
}

function buildRecentImpactPreview(
  snapshot: DecisionResultSnapshot,
  outcome: EventResultOutcomeSummary,
  impactCards: EventResultImpactCard[],
): EventResultRecentImpactPreview {
  return {
    eventId: snapshot.eventId,
    title: snapshot.summaryTitle || outcome.label,
    districtName: snapshot.neighborhoodName || 'Merkez',
    tone: outcome.outcomeBand,
    summary: outcome.body,
    impactCards,
  };
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

function buildDecisionConsequenceItem(
  snapshot: DecisionResultSnapshot,
  input: BuildEventResultRevealPresentationInput,
): EventResultRevealItem | null {
  const thread = buildDecisionConsequenceThreadsFromResult({
    snapshot,
    carryOverSummary: input.carryOverSummary,
    authorityProgressLine: input.authorityProgressLine,
  }).find((item) => item.visibleIn.includes('result') && item.consequenceType !== 'neutral_record');

  if (!thread) return null;

  return {
    id: `reveal-consequence-${thread.id}`,
    kind: 'city_memory',
    title: thread.title || 'Karar izi',
    body: thread.causalLine,
    tone: mapDecisionConsequenceToneToSurface(thread.tone),
    priority: thread.strength === 'high' ? 'high' : 'normal',
    iconKey: 'trail-sign-outline',
    sourceLabel: thread.sourceLabel,
    sourceIds: [`decision-consequence-${thread.id}`],
    revealOrder: 8,
  };
}

const REVEAL_KINDS_COVERED_BY_CITY_IMPACT: EventResultRevealItemKind[] = [
  'district_trust',
  'social_pulse',
  'resource',
];

function buildDistrictReaction(
  input: BuildEventResultRevealPresentationInput,
  advisorText: string,
  outcomeBand: EventResultOutcomeBand,
): EventResultDistrictReaction | undefined {
  const socialEcho = input.socialEcho;
  const cityReaction = input.cityReaction;
  const districtId = input.snapshot.neighborhoodId ?? input.event?.neighborhoodId;
  const districtName =
    input.snapshot.neighborhoodName ??
    input.event?.district ??
    'Bölge';
  const personalityOutcome = mapResultToneToPersonalityOutcome(
    outcomeBand === 'success'
      ? 'positive'
      : outcomeBand === 'partial' || outcomeBand === 'mixed'
        ? 'mixed'
        : outcomeBand === 'risk'
          ? 'warning'
          : 'neutral',
  );
  const flavor = buildDistrictReactionFlavor({
    districtId,
    districtName,
    day: input.day ?? input.snapshot.day,
    outcomeBand: personalityOutcome,
    avoidLines: [advisorText, socialEcho?.message ?? '', cityReaction?.shortSummary ?? ''],
  });

  const message =
    socialEcho?.message?.trim() ||
    cityReaction?.socialEcho?.line?.trim() ||
    cityReaction?.shortSummary?.trim() ||
    flavor.description;

  if (!message) return undefined;

  const normalizedAdvisor = advisorText.trim().toLowerCase();
  if (normalizedAdvisor && message.toLowerCase().includes(normalizedAdvisor.slice(0, 24))) {
    if (dedupeDistrictPersonalityCopy(flavor.description, [message])) {
      return undefined;
    }
  }

  const sourceLabel =
    socialEcho?.title?.trim() ||
    cityReaction?.socialEcho?.sourceLabel?.trim() ||
    districtName;
  const tone =
    flavor.tone === 'positive'
      ? 'positive'
      : flavor.tone === 'warning'
        ? 'warning'
        : socialEcho?.tone ??
          cityReaction?.socialEcho?.tone ??
          cityReaction?.tone ??
          'neutral';

  const combinedMessage =
    message !== flavor.description &&
    !dedupeDistrictPersonalityCopy(flavor.description, [message])
      ? `${message} ${flavor.description}`
      : message;

  return {
    title: flavor.title,
    sourceLabel,
    message: combinedMessage.length > 140 ? `${combinedMessage.slice(0, 138)}…` : combinedMessage,
    tone,
    iconKey: 'chatbubble-ellipses-outline',
  };
}

function buildResourceCostSection(
  snapshot: DecisionResultSnapshot,
  strategyId?: EventPlanStrategyId | null,
  outcomeTone?: EventResultOutcomeTone,
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null,
  currentDay = 1,
): EventResultResourceCostSection {
  const budgetMetric = findMetric(snapshot.metricChanges, 'budget');
  const moraleMetric = findMetric(snapshot.metricChanges, 'personnelMorale');
  const vehicle = snapshot.subsystemOutcomes.find((o) => o.key === 'vehicle');
  const personnel = snapshot.subsystemOutcomes.find((o) => o.key === 'personnel');

  const cost = buildResultResourceCostFromContext(
    {
      phase: 'result',
      planStrategyId: strategyId,
      moraleDelta: moraleMetric?.delta,
      budgetDelta: budgetMetric?.delta,
      outcomeTone,
    },
    {
      personnelDescription: personnel?.primaryText,
      vehicleDescription: vehicle?.primaryText,
    },
  );

  const readinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'result',
    planStrategyId: strategyId,
    moraleDelta: moraleMetric?.delta,
    budgetDelta: budgetMetric?.delta,
    outcomeTone,
  });
  const maintenancePresentation = maintenanceBacklogRuntime
    ? buildMaintenanceBacklogRuntimePresentation(maintenanceBacklogRuntime, {
        readinessSnapshot,
      })
    : null;
  const maintenanceHint = maintenancePresentation
    ? buildMaintenanceRuntimeResultHint(maintenancePresentation, [
        cost.summary,
        personnel?.primaryText ?? '',
        vehicle?.primaryText ?? '',
      ]) ??
      buildMaintenanceResultHint(buildMaintenanceBacklogFromReadiness(readinessSnapshot), [
        cost.summary,
        personnel?.primaryText ?? '',
        vehicle?.primaryText ?? '',
      ])
    : buildMaintenanceResultHint(buildMaintenanceBacklogFromReadiness(readinessSnapshot), [
        cost.summary,
        personnel?.primaryText ?? '',
        vehicle?.primaryText ?? '',
      ]);

  const maintenanceActionBundle = maintenanceBacklogRuntime
    ? buildMaintenanceActionUiBundle({
        runtime: maintenanceBacklogRuntime,
        currentDay,
        surface: 'result',
        readinessSnapshot,
        avoidLines: [cost.summary, personnel?.primaryText ?? '', vehicle?.primaryText ?? ''],
      })
    : null;

  return {
    title: cost.title,
    summary: cost.summary,
    tone: cost.tone,
    items: cost.items,
    maintenanceHint: maintenanceActionBundle?.hintText ?? maintenanceHint ?? undefined,
    maintenanceHintTone:
      maintenanceActionBundle?.hintTone ??
      maintenancePresentation?.overallTone ??
      buildMaintenanceBacklogFromReadiness(readinessSnapshot).overallTone,
    maintenanceAction: maintenanceActionBundle?.action ?? null,
  };
}

function buildSelectedPlanOutcome(
  strategyId: EventPlanStrategyId | null | undefined,
): EventResultSelectedPlanOutcome | undefined {
  if (!strategyId) return undefined;
  const tone: EventResultSelectedPlanOutcome['tone'] =
    strategyId === 'rapid_response'
      ? 'warning'
      : strategyId === 'long_term_fix'
        ? 'positive'
        : 'neutral';
  return {
    title: 'Seçilen Planın İzi',
    planLabel: getPlanStrategyLabel(strategyId),
    summary: PLAN_RESULT_LINE[strategyId],
    tone,
  };
}

function buildReportBridge(
  input: BuildEventResultRevealPresentationInput,
  outcome: EventResultOutcomeSummary,
  resourceCost: EventResultResourceCostSection,
): EventResultReportBridge {
  const day = input.day ?? input.snapshot.day ?? 1;
  const cityReaction = input.cityReaction;
  const memoryLine = cityReaction?.reportMemoryLine?.trim();
  const riskHint = cityReaction?.nextRiskHint?.trim();

  const summary =
    memoryLine ||
    (day <= 1
      ? 'Bu karar gün sonu raporunda mahalle güveni ve kaynak etkisiyle görünecek.'
      : resourceCost.tone === 'warning' || resourceCost.tone === 'mixed'
        ? 'Günün izine eklendi: Güven toparlandı, kaynak baskısı izlenmeli.'
        : 'Bu karar gün sonu raporunda mahalle güveni, kaynak baskısı ve sosyal nabız etkisiyle görünecek.');

  const chips: EventResultReportBridgeChip[] = [
    {
      label: 'Rapor',
      value: outcome.resultTone === 'positive' ? 'Eklendi' : 'Kayıtta',
      tone: 'neutral',
    },
    {
      label: 'Yarın Riski',
      value: riskHint ? 'Taşınır' : resourceCost.tone === 'warning' ? 'İzlenir' : 'Düşük',
      tone: riskHint || resourceCost.tone === 'warning' ? 'warning' : 'positive',
    },
  ];

  return {
    title: day <= 1 ? 'Günün İzine Eklendi' : 'Rapora Yansıyacak',
    summary: summary.length > 150 ? `${summary.slice(0, 148)}…` : summary,
    chips,
  };
}

function buildSecondaryActions(): EventResultSecondaryAction[] {
  return [
    {
      id: 'view_map',
      label: 'Haritada Gör',
      iconKey: 'map-outline',
      actionKey: 'view_map',
      enabled: true,
    },
    {
      id: 'view_recent_impact',
      label: 'Son Etkiyi Gör',
      iconKey: 'pulse-outline',
      actionKey: 'view_recent_impact',
      enabled: true,
    },
    {
      id: 'open_note',
      label: 'Not Aç',
      iconKey: 'document-text-outline',
      actionKey: 'open_note',
      enabled: true,
    },
  ];
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

  const consequence = buildDecisionConsequenceItem(snapshot, input);
  if (consequence) candidates.push(consequence);

  const byKind = new Map<EventResultRevealItemKind, EventResultRevealItem>();
  for (const item of candidates) {
    if (!byKind.has(item.kind)) {
      byKind.set(item.kind, item);
    }
  }

  const ordered = KIND_ORDER.map((kind) => byKind.get(kind)).filter(
    (item): item is EventResultRevealItem => Boolean(item),
  );

  const filtered = ordered.filter(
    (item) => !REVEAL_KINDS_COVERED_BY_CITY_IMPACT.includes(item.kind),
  );

  while (filtered.length < 3) {
    if (!byKind.has('city_memory')) {
      filtered.push({
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

  return filtered.slice(0, 7).map((item, index) => ({
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

function mapOutcomeBandToEceTone(
  outcome: EventResultOutcomeSummary,
  hasRisk: boolean,
  hasCarryOver: boolean,
): EceOutcomeTone {
  if (hasCarryOver && outcome.outcomeBand === 'risk') return 'warning';
  if (hasRisk || outcome.outcomeBand === 'risk') return 'warning';
  if (outcome.outcomeBand === 'success') return 'positive';
  if (outcome.outcomeBand === 'mixed' || outcome.outcomeBand === 'partial') return 'mixed';
  if (outcome.tone === 'warning') return 'warning';
  return 'neutral';
}

export function buildEventResultAdvisorComment(
  input: BuildEventResultRevealPresentationInput,
  outcome: EventResultOutcomeSummary,
  revealItems: EventResultRevealItem[],
): EventResultAdvisorComment {
  const day = input.day ?? input.event?.day ?? 1;
  const hasCarryOver = revealItems.some(
    (item) => item.kind === 'carry_over' || item.kind === 'butterfly' || item.kind === 'city_memory',
  );
  const hasRisk = revealItems.some(isGenuineTomorrowRiskWarning);
  const outcomeTone = mapOutcomeBandToEceTone(outcome, hasRisk, hasCarryOver);

  const memoryContext: EceMemoryContextInput = {
    day,
    event: input.event ?? null,
    eventId: input.event?.id ?? input.snapshot.eventId,
    districtName: input.event?.district ?? input.snapshot.neighborhoodName,
    selectedPlanId: input.selectedPlanStrategyId ?? undefined,
    recentOutcomeTone: outcomeTone,
    ...input.eceMemoryContext,
  };

  const districtEceHint = buildDistrictPersonalityEceHint(
    {
      districtId: input.snapshot.neighborhoodId ?? input.event?.neighborhoodId,
      districtName: memoryContext.districtName,
      day,
      outcomeBand: mapResultToneToPersonalityOutcome(outcome.outcomeBand),
      avoidLines: input.eceMemoryContext?.avoidLines,
    },
    'result',
  );

  const memory = buildEceMemorySnapshot(memoryContext);
  const line = buildResultEceLine({
    memory,
    context: memoryContext,
    seed: `${input.snapshot.eventId}:result:${day}`,
    outcomeTone,
    avoidLines: [
      ...(input.eceMemoryContext?.avoidLines ?? []),
      districtEceHint ?? '',
    ].filter((entry) => Boolean(entry)),
  });

  if (input.isDay1LearningEvent || day === 1) {
    return {
      title: 'Ece Değerlendirmesi',
      text: line.message,
      tone: 'teaching',
      toneLabel: ADVISOR_TONE_LABEL.teaching,
    };
  }

  const tone = mapEceToneToResultAdvisorTone(line.tone);
  return {
    title: 'Ece Değerlendirmesi',
    text: line.message,
    tone,
    toneLabel: ADVISOR_TONE_LABEL[tone],
  };
}

function buildFinalActions(
  showNextDay: boolean,
  showAuthority: boolean,
): EventResultAction[] {
  const actions: EventResultAction[] = [
    {
      id: 'back_to_hub',
      label: 'Merkeze Dön',
      route: '/',
      actionKey: 'back_to_hub',
      enabled: true,
    },
    {
      id: 'open_report',
      label: 'Raporu Gör',
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
  const day = input.day ?? input.snapshot.day ?? 1;
  const outcome = buildOutcomeSummary(input.snapshot, isFallback);
  const impactCards = buildResultImpactCards(input.snapshot);
  const cityImpact: EventResultCityImpactSection = {
    title: 'Şehir Etkisi',
    items: impactCards,
  };
  const recentImpact = buildRecentImpactPreview(input.snapshot, outcome, impactCards);
  const revealItems = buildRevealItems(input.snapshot, input);
  const selectedPlanContext = buildSelectedPlanContext(input.selectedPlanStrategyId);
  const selectedPlanOutcome = buildSelectedPlanOutcome(input.selectedPlanStrategyId);
  const advisorComment = buildEventResultAdvisorComment(input, outcome, revealItems);
  const districtReaction = buildDistrictReaction(
    input,
    advisorComment.text,
    outcome.outcomeBand,
  );
  const resourceCost = buildResourceCostSection(
    input.snapshot,
    input.selectedPlanStrategyId,
    outcome.resultTone,
    input.maintenanceBacklogRuntime,
    day,
  );
  const reportBridge = buildReportBridge(input, outcome, resourceCost);
  const secondaryActions = buildSecondaryActions();
  const showAuthority = Boolean(input.authorityProgressLine?.trim());
  const finalActions = buildFinalActions(input.showNextDayAction ?? false, showAuthority);
  const primaryCtaBase =
    finalActions.find((action) => action.id === 'back_to_hub' && action.enabled) ??
    finalActions.find((action) => action.enabled) ??
    {
      id: 'back_to_hub',
      label: 'Merkeze Dön',
      route: '/',
      actionKey: 'back_to_hub',
      enabled: true,
    };
  const primaryCta: EventResultAction = {
    ...primaryCtaBase,
    label:
      primaryCtaBase.id === 'back_to_hub'
        ? day <= 1
          ? 'Merkeze Dön'
          : 'Gün Sonuna Geç'
        : primaryCtaBase.label,
  };

  const phaseDescription =
    day <= 1
      ? 'Operasyon tamamlandı. Kararının şehirde bıraktığı ilk etkiyi oku.'
      : 'Operasyon tamamlandı. Şehirde oluşan ilk etki ve kalan baskıyı değerlendir.';

  const outcomeToneForBridge: EceOutcomeTone =
    outcome.outcomeBand === 'success'
      ? 'positive'
      : outcome.outcomeBand === 'mixed' || outcome.outcomeBand === 'partial'
        ? 'mixed'
        : outcome.outcomeBand === 'risk'
          ? 'warning'
          : 'neutral';

  const phaseTransition = buildOperationPhaseTransitionPresentation({
    phase: 'result',
    event: input.event ?? null,
    outcomeTone: outcomeToneForBridge,
    trustLabel: impactCards.find((card) => card.id === 'district_trust')?.valueLabel,
    riskLabel: impactCards.find((card) => card.id === 'operation_risk')?.valueLabel,
    resourceLabel: resourceCost.items[0]?.value,
    ctaEnabled: primaryCta.enabled,
    ctaActionKey: primaryCta.actionKey,
    avoidSummaries: [advisorComment.text, reportBridge.summary, districtReaction?.message ?? ''],
  });

  const revealSections = buildOperationResultRevealSections({
    snapshot: input.snapshot,
    outcome,
    impactCards,
    resourceCost,
    day,
    eventCategory: input.event?.category ?? null,
    strategyId: input.selectedPlanStrategyId,
    cityReaction: input.cityReaction,
    socialEcho: input.socialEcho,
    advisorLine: advisorComment.text,
    reportSummary: reportBridge.summary,
  });

  const readinessInput = buildReadinessInputFromContext({
    phase: 'result',
    day,
    planStrategyId: input.selectedPlanStrategyId,
    eventRiskLevel: input.event?.riskLevel,
    moraleDelta: input.snapshot.metricChanges.find((metric) => metric.key === 'personnelMorale')?.delta,
    budgetDelta: input.snapshot.metricChanges.find((metric) => metric.key === 'budget')?.delta,
    outcomeTone: outcomeToneForBridge,
    maintenanceRuntime: input.maintenanceBacklogRuntime,
    operationTitle: input.snapshot.eventTitle,
    avoidLines: [advisorComment.text, resourceCost.summary],
  });
  const readinessImpact = buildResultReadinessBridge({
    ...readinessInput,
    outcomePositive: outcome.outcomeBand === 'success',
  });

  return {
    title: phaseTransition.shell.title,
    subtitle: phaseTransition.shell.subtitle,
    phaseHeading: 'Operasyon Sonucu',
    phaseDescription,
    outcome,
    cityImpact,
    impactCards,
    districtReaction,
    resourceCost,
    selectedPlanOutcome,
    recentImpact,
    revealItems,
    advisorComment,
    reportBridge,
    secondaryActions,
    finalActions,
    primaryCta,
    selectedPlanContext,
    accessibilityLabel: `${input.snapshot.eventTitle} operasyon sonucu, ${outcome.statusLabel}`,
    revealStaggerMs: operationMotionResultRevealStaggerMs(reducedMotion),
    revealTotalMs: reducedMotion
      ? OPERATION_MOTION_RESULT_REDUCED_MS
      : OPERATION_MOTION_RESULT_TOTAL_MS,
    phaseTransition,
    revealSections,
    readinessImpact,
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
  if (model.impactCards.length !== 4) {
    issues.push('impactCards count should be 4');
  }
  if (!model.cityImpact.title.trim() || model.cityImpact.items.length !== 4) {
    issues.push('cityImpact incomplete');
  }
  if (!model.phaseHeading.trim() || !model.phaseDescription.trim()) {
    issues.push('phase heading/description empty');
  }
  if (!model.resourceCost.summary.trim() || model.resourceCost.items.length < 3) {
    issues.push('resourceCost incomplete');
  }
  if (!model.reportBridge.summary.trim() || model.reportBridge.chips.length < 2) {
    issues.push('reportBridge incomplete');
  }
  if (!model.advisorComment.toneLabel.trim()) {
    issues.push('advisorComment toneLabel empty');
  }
  if (!model.primaryCta.label.trim() || !model.primaryCta.enabled) {
    issues.push('primaryCta invalid');
  }
  if (model.secondaryActions.length < 3) {
    issues.push('secondaryActions incomplete');
  }
  if (!model.recentImpact.eventId.trim() || !model.recentImpact.summary.trim()) {
    issues.push('recentImpact incomplete');
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

  if (!model.revealSections.hero.title.trim()) issues.push('reveal hero empty');
  if (model.revealSections.impactSummary.chips.length < 2) {
    issues.push('impact chips below minimum');
  }
  if (model.revealSections.impactSummary.chips.length > 3) {
    issues.push('impact chips above maximum');
  }
  if (
    model.revealSections.densityBand === 'day1' &&
    model.revealSections.impactSummary.chips.length > 2
  ) {
    issues.push('day1 impact chips not capped');
  }

  return issues;
}

export function resultAdvisorDiffersFromFieldAdvisor(
  resultComment: string,
  fieldComment: string,
): boolean {
  return resultComment.trim() !== fieldComment.trim();
}
