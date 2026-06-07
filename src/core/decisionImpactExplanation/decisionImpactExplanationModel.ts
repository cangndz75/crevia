import { tryBuildDecisionImpactFromPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import type { DecisionMetricChange } from '@/features/events/types/decisionResultTypes';

import { DECISION_IMPACT_DOMAIN_LABELS, DECISION_IMPACT_EXPLANATION_TITLE } from './decisionImpactExplanationConstants';
import {
  sanitizeDecisionImpactMainLine,
  sanitizeDecisionImpactTomorrowLine,
} from './decisionImpactExplanationPresentation';
import type {
  DecisionImpactExplanation,
  DecisionImpactExplanationInput,
  DecisionImpactExplanationKind,
  DecisionImpactExplanationSourceSignals,
  DecisionImpactExplanationTone,
} from './decisionImpactExplanationTypes';

function findMetric(input: DecisionImpactExplanationInput, key: DecisionMetricChange['key']) {
  return input.snapshot?.metricChanges.find((metric) => metric.key === key);
}

function districtName(input: DecisionImpactExplanationInput): string {
  return (
    input.snapshot?.neighborhoodName?.trim() ||
    input.event?.district?.trim() ||
    input.event?.neighborhoodId?.trim() ||
    'saha'
  );
}

function districtId(input: DecisionImpactExplanationInput): string | undefined {
  return input.snapshot?.neighborhoodId ?? input.event?.neighborhoodId ?? input.event?.districtIds?.[0];
}

function eventDomain(input: DecisionImpactExplanationInput): string {
  const raw = [
    input.snapshot?.eventType,
    input.event?.eventType,
    input.event?.category,
    input.event?.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('tr-TR');

  if (/rota|route|araç|vehicle/.test(raw)) return 'route';
  if (/konteyner|container|atık|waste/.test(raw)) return 'container';
  if (/personel|personnel|ekip|staff/.test(raw)) return 'personnel';
  if (/sosyal|şikayet|güven|social/.test(raw)) return 'social';
  if (/kriz|risk|crisis/.test(raw)) return 'crisis';
  return 'operations';
}

function strongestPressure(input: DecisionImpactExplanationInput) {
  const signals = input.operationSignals;
  if (!signals) return null;
  const ranked = [
    signals.vehicles,
    signals.personnel,
    signals.containers,
    signals.districts,
    signals.overall,
  ].sort((a, b) => b.score - a.score);
  return ranked.find((signal) => signal.status === 'critical' || signal.status === 'strained' || signal.status === 'watch') ?? null;
}

function hasResourcePressure(input: DecisionImpactExplanationInput): boolean {
  const pressure = strongestPressure(input);
  if (pressure) return true;
  const resources = input.resourceFatigue;
  if (!resources) return false;
  return (
    Object.values(resources.personnelGroups).some((group) => group.status === 'strained' || group.status === 'critical') ||
    Object.values(resources.vehicleGroups).some((group) => group.status === 'strained' || group.status === 'critical') ||
    Object.values(resources.containerNetworksByDistrictId).some((group) => group.status === 'strained' || group.status === 'critical')
  );
}

function sourceSignals(input: DecisionImpactExplanationInput): DecisionImpactExplanationSourceSignals {
  const pressure = strongestPressure(input);
  return {
    metricKeys: input.snapshot?.metricChanges.map((metric) => metric.key) ?? [],
    operationSignalDomains: pressure ? [pressure.domain] : [],
    hasCarryOver: Boolean(input.carryOverSummary?.trim()),
    hasResourcePressure: hasResourcePressure(input),
    hasDistrictContext: Boolean(districtId(input)),
    hasSocialContext: Boolean(findMetric(input, 'publicSatisfaction')),
  };
}

function buildExplanation(args: {
  input: DecisionImpactExplanationInput;
  kind: DecisionImpactExplanationKind;
  tone: DecisionImpactExplanationTone;
  relatedDomain: string;
  mainLine: string;
  tomorrowLine?: string;
  relatedResource?: string;
  confidence?: DecisionImpactExplanation['confidence'];
}): DecisionImpactExplanation {
  const day = args.input.day ?? args.input.snapshot?.day ?? 1;
  return {
    id: `decision-impact-${day}-${args.input.snapshot?.eventId ?? args.relatedDomain}-${args.kind}`,
    kind: args.kind,
    title: DECISION_IMPACT_EXPLANATION_TITLE,
    mainLine: sanitizeDecisionImpactMainLine(args.mainLine),
    tomorrowLine: sanitizeDecisionImpactTomorrowLine(args.tomorrowLine),
    tone: args.tone,
    relatedDomain: args.relatedDomain,
    relatedDistrictId: districtId(args.input),
    relatedResource: args.relatedResource,
    confidence: args.confidence ?? 'high',
    sourceSignals: sourceSignals(args.input),
    maxVisibleLines: 3,
    shouldShowInResult: true,
    shouldEchoInReport: true,
    shouldEchoInHub: day > 1,
  };
}

export function buildDecisionImpactExplanation(
  input: DecisionImpactExplanationInput,
): DecisionImpactExplanation {
  const domain = eventDomain(input);
  const area = districtName(input);
  const publicMetric = findMetric(input, 'publicSatisfaction');
  const moraleMetric = findMetric(input, 'personnelMorale');
  const riskMetric = findMetric(input, 'operationRisk');
  const budgetMetric = findMetric(input, 'budget');
  const pressure = strongestPressure(input);
  const decisionTitle = input.snapshot?.decisionTitle?.trim() || 'Bu karar';

  if (input.carryOverSummary?.trim()) {
    return buildExplanation({
      input,
      kind: 'carry_over_warning',
      tone: 'watch',
      relatedDomain: domain,
      mainLine: `${decisionTitle} bugünkü sonucu etkiledi; kalan iz yarın planında tekrar okunmalı.`,
      tomorrowLine: input.carryOverSummary,
      confidence: 'high',
    });
  }

  const packImpact = tryBuildDecisionImpactFromPackMeta(input);
  if (packImpact) {
    return packImpact;
  }

  if (pressure?.domain === 'vehicles' || domain === 'route') {
    return buildExplanation({
      input,
      kind: domain === 'route' ? 'route_balance' : 'resource_pressure',
      tone: pressure?.status === 'critical' ? 'risk' : 'watch',
      relatedDomain: 'route',
      relatedResource: 'vehicle',
      mainLine: `Rota önceliği ${area} hattını rahatlattı, fakat araç yorgunluğu izlenmeli.`,
      tomorrowLine: `Yarın ${area} rotası daha dengeli tempoyla kontrol edilebilir.`,
    });
  }

  if (pressure?.domain === 'personnel' || domain === 'personnel') {
    return buildExplanation({
      input,
      kind: 'personnel_fatigue',
      tone: 'watch',
      relatedDomain: 'personnel',
      relatedResource: 'personnel',
      mainLine: 'Personel desteği görünür hizmet etkisini artırdı ama ekip yorgunluğu izlenmeli.',
      tomorrowLine: 'Yarın vardiya temposu kısa rotasyonla dengelenebilir.',
    });
  }

  if (pressure?.domain === 'containers' || domain === 'container') {
    return buildExplanation({
      input,
      kind: 'container_pressure',
      tone: 'watch',
      relatedDomain: 'container',
      relatedResource: 'container',
      mainLine: `Konteyner baskısı ${area} çevresinde azaldı, fakat kalan yoğunluk yarına not bıraktı.`,
      tomorrowLine: `Yarın ${area} konteyner hattı tekrar izlenebilir.`,
    });
  }

  if (riskMetric && riskMetric.delta < 0) {
    return buildExplanation({
      input,
      kind: 'crisis_prevention',
      tone: 'recovery',
      relatedDomain: 'crisis',
      mainLine: 'Kriz eşiği düşürüldü ancak kaynak baskısı tamamen kapanmadı.',
      tomorrowLine: 'Yarın risk bandı sakin kalırsa önleyici plan güçlenir.',
    });
  }

  if (riskMetric && riskMetric.delta > 0) {
    return buildExplanation({
      input,
      kind: 'risk_tradeoff',
      tone: 'risk',
      relatedDomain: domain,
      mainLine: `${decisionTitle} kısa vadeli etki üretti, fakat operasyon riski yarına dikkat notu bıraktı.`,
      tomorrowLine: 'Yarın kaynak baskısı erken kontrol edilmeli.',
    });
  }

  if (publicMetric && publicMetric.delta > 0 && (budgetMetric?.delta ?? 0) < 0) {
    return buildExplanation({
      input,
      kind: 'positive_tradeoff',
      tone: 'positive',
      relatedDomain: DECISION_IMPACT_DOMAIN_LABELS[domain] ? domain : 'operations',
      mainLine: `${decisionTitle} sosyal güveni artırdı ama kaynak yükünü yükseltti.`,
      tomorrowLine: `Yarın ${area} etkisi raporda tekrar izlenebilir.`,
    });
  }

  if (publicMetric && publicMetric.delta > 0) {
    return buildExplanation({
      input,
      kind: domain === 'social' ? 'social_response' : 'district_trust_shift',
      tone: 'positive',
      relatedDomain: domain === 'social' ? 'social' : 'district',
      mainLine: `Karar ${area} çevresinde güveni artırdı; hizmet etkisi daha görünür oldu.`,
      tomorrowLine: `Yarın ${area} geri bildirimi dengeli kalırsa toparlanma güçlenir.`,
    });
  }

  if (moraleMetric && moraleMetric.delta > 0) {
    return buildExplanation({
      input,
      kind: 'recovery_signal',
      tone: 'recovery',
      relatedDomain: 'personnel',
      mainLine: 'Ekip morali toparlandı; etki yavaş ama daha güvenli bir ritim bıraktı.',
      tomorrowLine: 'Yarın aynı tempo korunursa operasyon dengesi güçlenir.',
    });
  }

  if (input.snapshot || input.event) {
    return buildExplanation({
      input,
      kind: 'neutral_learning',
      tone: 'neutral',
      relatedDomain: domain,
      mainLine: `Bu karar ${DECISION_IMPACT_DOMAIN_LABELS[domain] ?? 'operasyon'} dengesini etkiledi.`,
      tomorrowLine: 'Yarın raporda kalan baskı izlenebilir.',
      confidence: 'medium',
    });
  }

  return buildExplanation({
    input,
    kind: 'fallback',
    tone: 'neutral',
    relatedDomain: 'operations',
    mainLine: 'Bugünkü karar kısa vadeli dengeyi etkiledi. Yarın raporda kalan baskı izlenebilir.',
    tomorrowLine: 'Devam eden riskler gün sonu raporunda takip edilecek.',
    confidence: 'fallback',
  });
}

export function buildDecisionImpactExplanationForHub(input: DecisionImpactExplanationInput) {
  const last = input.recentDecisions?.filter((record) => record.day === (input.day ?? 1) - 1).at(-1);
  return buildDecisionImpactExplanation({
    ...input,
    snapshot: input.snapshot ?? (last
      ? {
          id: `hub-${last.id}`,
          day: last.day,
          eventId: last.eventId,
          eventTitle: last.eventTitle,
          neighborhoodId: last.neighborhoodId,
          neighborhoodName: last.neighborhoodName,
          decisionId: last.decisionId,
          decisionTitle: last.decisionLabel,
          decisionTone: 'balanced',
          createdAt: Date.now(),
          summaryTitle: last.eventTitle,
          summaryText: last.decisionLabel,
          resultTone: 'mixed',
          metricChanges: [],
          subsystemOutcomes: [],
          highlightLines: [],
          riskLines: [],
        }
      : null),
  });
}
