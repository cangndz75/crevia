import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';

import { CITY_ECHO_BINDING_KINDS } from './cityEchoBindingConstants';
import { buildCityEchoBinding } from './cityEchoBindingModel';
import {
  buildCityEchoAdvisorLine,
  buildCityEchoHubLine,
  buildCityEchoReportLine,
  buildCityEchoSocialLine,
  cityEchoCopyContainsForbiddenTerms,
  isDuplicateCityEchoLine,
} from './cityEchoBindingPresentation';
import type { CityEchoBindingKind } from './cityEchoBindingTypes';

export type VerifyCityEchoBindingOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], label: string, condition: boolean, detail?: string): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

const decisionImpact: DecisionImpactExplanation = {
  id: 'impact-1',
  kind: 'positive_tradeoff',
  title: 'Kararın etkisi',
  mainLine: 'Bugünkü karar sosyal güveni artırdı ama araç yorgunluğunu yükseltti.',
  tomorrowLine: 'Yarın Sanayi rotası tekrar izlenebilir.',
  tone: 'positive',
  relatedDomain: 'operations',
  relatedDistrictId: 'industrial_market',
  relatedResource: 'vehicle',
  confidence: 'high',
  sourceSignals: {
    metricKeys: ['publicSatisfaction'],
    operationSignalDomains: ['vehicles'],
    hasCarryOver: false,
    hasResourcePressure: true,
    hasDistrictContext: true,
    hasSocialContext: true,
  },
  maxVisibleLines: 3,
  shouldShowInResult: true,
  shouldEchoInReport: true,
  shouldEchoInHub: true,
};

const tomorrowRisk: TomorrowRiskModel = {
  id: 'tomorrow-risk-1',
  kind: 'route_pressure_tomorrow',
  title: 'Yarın dikkat',
  mainLine: 'Yarın Sanayi hattında rota dengesi korunmalı.',
  supportLine: 'Araç yorgunluğu kısa tempoyla izlenebilir.',
  tone: 'watch',
  priority: 'high',
  relatedDistrictId: 'industrial_market',
  relatedDomain: 'route',
  relatedResource: 'vehicle',
  sourceSignals: ['operation_signals'],
  shouldShowInReport: true,
  shouldShowInHub: true,
  shouldShowAsCompact: true,
  maxVisibleLines: 2,
};

function expectKind(
  checks: string[],
  label: string,
  expected: CityEchoBindingKind,
  actual: CityEchoBindingKind,
) {
  assert(checks, label, actual === expected, `expected ${expected}, got ${actual}`);
}

export function verifyCityEchoBindingScenario(): VerifyCityEchoBindingOutcome {
  const checks: string[] = [];

  assert(checks, 'en az 14 echo kind var', CITY_ECHO_BINDING_KINDS.length >= 14);

  expectKind(
    checks,
    'decision_tradeoff_echo üretilebiliyor',
    'decision_tradeoff_echo',
    buildCityEchoBinding({ day: 4, decisionImpact }).kind,
  );

  expectKind(
    checks,
    'tomorrow_risk_echo üretilebiliyor',
    'tomorrow_risk_echo',
    buildCityEchoBinding({ day: 4, tomorrowRisk }).kind,
  );

  expectKind(
    checks,
    'route_balance_echo üretilebiliyor',
    'route_balance_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact: { ...decisionImpact, relatedDomain: 'route' },
    }).kind,
  );

  expectKind(
    checks,
    'container_pressure_echo üretilebiliyor',
    'container_pressure_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact: { ...decisionImpact, relatedDomain: 'container', relatedResource: 'container' },
    }).kind,
  );

  expectKind(
    checks,
    'personnel_fatigue_echo üretilebiliyor',
    'personnel_fatigue_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact: { ...decisionImpact, relatedDomain: 'personnel', relatedResource: 'personnel' },
    }).kind,
  );

  expectKind(
    checks,
    'social_trust_echo üretilebiliyor',
    'social_trust_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact: { ...decisionImpact, relatedDomain: 'social', relatedResource: undefined },
    }).kind,
  );

  expectKind(
    checks,
    'district_trust_echo üretilebiliyor',
    'district_trust_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact: { ...decisionImpact, relatedDomain: 'district', relatedResource: undefined },
    }).kind,
  );

  expectKind(
    checks,
    'carry_over_echo üretilebiliyor',
    'carry_over_echo',
    buildCityEchoBinding({
      day: 4,
      decisionImpact,
      carryOverSummary: 'Araç yorgunluğu yarına izleme notu bıraktı.',
    }).kind,
  );

  expectKind(checks, 'fallback üretilebiliyor', 'fallback', buildCityEchoBinding({ day: 4 }).kind);

  const binding = buildCityEchoBinding({ day: 4, decisionImpact, tomorrowRisk });
  assert(checks, 'Ece line var', Boolean(buildCityEchoAdvisorLine(binding)));
  assert(checks, 'Social line var', Boolean(buildCityEchoSocialLine(binding)));
  assert(checks, 'Report line var', Boolean(buildCityEchoReportLine(binding)));
  assert(checks, 'Hub compact line var', Boolean(buildCityEchoHubLine(binding)));
  assert(
    checks,
    'Ece line, Social line, Report line birebir aynı değil',
    binding.eceLine !== binding.socialLine && binding.eceLine !== binding.reportLine && binding.socialLine !== binding.reportLine,
  );

  assert(
    checks,
    'Duplicate guard aynı district/domain/resource tekrarını engelliyor',
    isDuplicateCityEchoLine(binding.reportLine, [binding.reportLine ?? '']),
  );

  const day1 = buildCityEchoBinding({ day: 1, decisionImpact });
  assert(checks, 'Day 1 ağır sistem dili kullanmıyor', !/parametre|optimizasyon|motor/i.test(`${day1.eceLine} ${day1.reportLine}`));

  const day8 = buildCityEchoBinding({
    day: 8,
    tomorrowRisk: { ...tomorrowRisk, kind: 'operation_era_hint', relatedDomain: 'operation' },
    postPilotPhase: 'main_operation_light',
  });
  assert(checks, 'Day 8+ ana operasyon bağlamı destekleniyor', day8.kind === 'operation_era_echo');

  for (const line of [
    binding.eceLine,
    binding.socialLine,
    binding.reportLine,
    binding.tomorrowLine,
    binding.hubLine,
  ]) {
    assert(checks, 'forbidden FOMO/panic/punishment words yok', !cityEchoCopyContainsForbiddenTerms(line ?? ''));
  }

  const signals = createInitialOperationSignalsState(5);
  signals.vehicles.status = 'strained';
  signals.vehicles.score = 78;
  expectKind(
    checks,
    'operation signal vehicle fatigue destekleniyor',
    'vehicle_fatigue_echo',
    buildCityEchoBinding({ day: 5, operationSignals: signals }).kind,
  );

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
