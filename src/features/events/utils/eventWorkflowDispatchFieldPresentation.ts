import { getRiskLevelLabel } from '@/core/content/mockGameData';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PersonnelImpactPreview } from '@/core/personnel/personnelPresentation';
import type { VehicleImpactPreview } from '@/core/vehicles/vehiclePresentation';

import { buildDecisionOptionCardPresentation } from './decisionOptionCardIntegration';
import {
  buildInspectHeroChips,
  formatEventRemainingLabel,
} from './eventWorkflowPresentation';
import { getDecisionRiskLevel } from './decisionTradeoffPresentation';

export const DISPATCH_FIELD_UI_BANNED_WORDS = [
  'xp',
  'level up',
  'premium',
  'kilitli',
  'yetkin yetersiz',
  'satın al',
] as const;

export const DISPATCH_WORKFLOW_FOOTER_EXTRA = 44;
export const FIELD_WORKFLOW_FOOTER_EXTRA = 44;

export const DISPATCH_FIELD_LAYOUT_GUARDS = {
  titleNumberOfLines: 2,
  commandGoalNumberOfLines: 2,
  fieldNoteNumberOfLines: 2,
  metricNumberOfLines: 1,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;

export type DispatchScreenModel = {
  title: string;
  location: string;
  priorityLabel: string;
  remainingLabel: string;
  riskLabel: string;
  commandGoalLine: string;
  selectedDecisionTitle?: string;
  selectedTradeoff?: string;
  footerSummaryLine: string;
};

export type FieldImpactMetric = {
  key: string;
  label: string;
  value: string;
  tone: 'teal' | 'gold' | 'warn' | 'neutral';
};

export type FieldScreenModel = {
  title: string;
  location: string;
  operationStatus: string;
  operationDetail: string;
  progressPercent: number;
  progressLabel: string;
  fieldNote: string;
  impactMetrics: FieldImpactMetric[];
  footerSummaryLine: string;
};

export function dispatchFieldTextContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return DISPATCH_FIELD_UI_BANNED_WORDS.filter((word) => haystack.includes(word));
}

function formatSigned(value: number, suffix: string): string {
  if (value === 0) return `Nötr ${suffix}`;
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)} ${suffix}`;
}

export function buildDispatchScreenModel(params: {
  event: EventCard;
  selectedDecision?: EventDecision | null;
  selectedPlanStrategyLabel?: string | null;
}): DispatchScreenModel {
  const chips = buildInspectHeroChips(params.event);
  const riskLabel = getRiskLevelLabel(params.event.riskLevel);
  const presentation = params.selectedDecision
    ? buildDecisionOptionCardPresentation({
        event: params.event,
        decision: params.selectedDecision,
        variant: 'compact',
      })
    : null;

  const commandGoalLine = params.selectedDecision
    ? 'Ekibi doğru rota ve öncelikle sahaya çıkar.'
    : 'Kaynak seç; ekibi doğru rota ve öncelikle sahaya yönlendir.';

  const planPrefix = params.selectedPlanStrategyLabel?.trim()
    ? `${params.selectedPlanStrategyLabel.trim()} · `
    : '';

  const footerSummaryLine = params.selectedDecision
    ? `${planPrefix}${params.selectedDecision.title} · ${presentation?.tradeoff ?? 'Operasyon hazır'}`
    : planPrefix
      ? `${planPrefix}Kaynak seçimi tamamlandığında sahaya yönlendir.`
      : 'Kaynak seçimi tamamlandığında sahaya yönlendir.';

  return {
    title: params.event.title,
    location: params.event.district,
    priorityLabel: chips.priority,
    remainingLabel: chips.remaining,
    riskLabel,
    commandGoalLine,
    selectedDecisionTitle: params.selectedDecision?.title,
    selectedTradeoff: presentation?.tradeoff,
    footerSummaryLine,
  };
}

export function buildFieldImpactMetrics(params: {
  event: EventCard;
  decision?: EventDecision | null;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
}): FieldImpactMetric[] {
  const decision = params.decision;
  const effects = decision?.effects;

  const publicValue = effects
    ? formatSigned(effects.publicSatisfaction ?? 0, 'halk')
    : params.event.previewEffects.publicSatisfaction >= 0
      ? 'İzleniyor'
      : 'Baskı artıyor';

  const teamValue =
    params.personnelPreview?.shortText ??
    params.personnelPreview?.decisionLine ??
    (effects?.morale != null
      ? formatSigned(effects.morale, 'ekip')
      : 'Ekip hazır');

  const resourceValue =
    params.vehiclePreview?.routePreparationLine ??
    params.vehiclePreview?.riskText ??
    (effects?.budget != null && effects.budget !== 0
      ? formatSigned(-Math.abs(effects.budget), 'kaynak')
      : 'Rota etkisi izleniyor');

  return [
    { key: 'public', label: 'Bölge etkisi', value: publicValue, tone: 'teal' },
    { key: 'team', label: 'Ekip etkisi', value: teamValue, tone: 'gold' },
    { key: 'resource', label: 'Operasyon etkisi', value: resourceValue, tone: 'neutral' },
  ];
}

export function buildFieldScreenModel(params: {
  event: EventCard;
  decision?: EventDecision | null;
  fieldNote?: string;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
}): FieldScreenModel {
  const remainingMinutes = Math.max(15, Math.round(params.event.urgencyHours * 60 * 0.35));
  const progressPercent = Math.min(88, Math.max(42, 100 - remainingMinutes));
  const riskLevel = params.decision
    ? getDecisionRiskLevel(params.decision, { event: params.event })
    : 'medium';

  const operationDetail =
    riskLevel === 'high'
      ? 'Yoğun saha temposu · rota etkisi izleniyor'
      : 'Standart operasyon temposu · ekip sahada';

  const impactMetrics = buildFieldImpactMetrics(params);

  const footerSummaryLine = params.decision
    ? `${params.decision.title} uygulanıyor · sonucu gör`
    : 'Operasyon tamamlanıyor · sonucu gör';

  return {
    title: params.event.title,
    location: params.event.district,
    operationStatus: 'Ekip sahada',
    operationDetail,
    progressPercent,
    progressLabel: `Operasyon ${progressPercent}%`,
    fieldNote:
      params.fieldNote?.trim() ||
      'Saha notu henüz gelmedi. Ekip bölgede operasyonu sürdürüyor.',
    impactMetrics,
    footerSummaryLine,
  };
}

export function collectDispatchFieldPresentationStrings(
  dispatch: DispatchScreenModel,
  field: FieldScreenModel,
): string[] {
  return [
    'İncele',
    'Planla',
    'Yönlendir',
    'Sahada',
    'Sonuç',
    'Planlamaya Geç',
    'Yönlendirmeye Geç',
    'Sahaya Yönlendir',
    'Sonucu Gör',
    dispatch.commandGoalLine,
    dispatch.footerSummaryLine,
    field.operationStatus,
    field.operationDetail,
    field.fieldNote,
    ...field.impactMetrics.map((m) => `${m.label} ${m.value}`),
    field.footerSummaryLine,
  ].filter(Boolean);
}
