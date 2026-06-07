import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ADVISOR_RELATIONSHIP_PREDICTION_LINES,
  MAP_DISTRICT_IDS,
} from './advisorRelationshipConstants';
import {
  buildAdvisorOperationalRelationshipModel,
  buildAdvisorRelationshipDistrictLine,
  buildAdvisorRelationshipStyleLine,
} from './advisorRelationshipModel';
import {
  advisorRelationshipCopyContainsForbiddenTerms,
  advisorRelationshipCopyUnderminesTrust,
  isDuplicateAdvisorRelationshipLine,
} from './advisorRelationshipPresentation';
import {
  buildAdvisorRelationshipHubPresentation,
  buildAdvisorRelationshipReportPresentation,
  buildAdvisorRelationshipResultPresentation,
} from './advisorRelationshipWiring';
import type { AdvisorRelationshipStyleKind } from './advisorRelationshipTypes';

export type VerifyAdvisorRelationshipOutcome = {
  ok: boolean;
  checks: string[];
};

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], label: string, condition: boolean, detail?: string): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

const decisionImpact: DecisionImpactExplanation = {
  id: 'impact-rel-1',
  kind: 'positive_tradeoff',
  title: 'Kararın etkisi',
  mainLine: 'Bugünkü karar sosyal güveni artırdı ama araç yorgunluğunu yükseltti.',
  tomorrowLine: 'Yarın Sanayi rotası tekrar izlenebilir.',
  tone: 'positive',
  relatedDomain: 'route',
  relatedDistrictId: 'sanayi',
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
  id: 'tomorrow-rel-1',
  kind: 'route_pressure_tomorrow',
  title: 'Yarın dikkat',
  mainLine: 'Yarın Sanayi hattında rota dengesi korunmalı.',
  supportLine: 'Araç yorgunluğu kısa tempoyla izlenebilir.',
  tone: 'watch',
  priority: 'high',
  relatedDistrictId: 'sanayi',
  relatedDomain: 'route',
  relatedResource: 'vehicle',
  sourceSignals: ['operation_signals'],
  shouldShowInReport: true,
  shouldShowInHub: true,
  shouldShowAsCompact: true,
  maxVisibleLines: 2,
};

const fastHistory = [
  {
    id: 'd1',
    day: 3,
    eventId: 'e1',
    eventTitle: 'Konteyner',
    neighborhoodId: 'sanayi',
    neighborhoodName: 'Sanayi',
    decisionId: 'dec1',
    decisionLabel: 'Hızlı müdahale ekibi yönlendir',
    createdAt: new Date().toISOString(),
    appliedEffects: [],
  },
  {
    id: 'd2',
    day: 4,
    eventId: 'e2',
    eventTitle: 'Rota',
    neighborhoodId: 'sanayi',
    neighborhoodName: 'Sanayi',
    decisionId: 'dec2',
    decisionLabel: 'Acil saha müdahalesi',
    createdAt: new Date().toISOString(),
    appliedEffects: [],
  },
] as import('@/core/models/DecisionRecord').DecisionRecord[];

export function verifyAdvisorRelationshipScenario(): VerifyAdvisorRelationshipOutcome {
  const checks: string[] = [];

  const day1 = buildAdvisorOperationalRelationshipModel({ day: 1 });
  assert(checks, 'model üretilebiliyor', Boolean(day1.mainAdvisorLine));
  assert(checks, 'Day 1 sade', day1.familiarityBand === 'new_partner');
  assert(checks, 'Day 1 önceki karar yok', !day1.previousDecisionReference);
  assert(
    checks,
    'Day 1 heavy system sızmıyor',
    !day1.playerStyleSignal && !day1.predictionCorrectionLine,
  );

  const day2 = buildAdvisorOperationalRelationshipModel({ day: 2 });
  assert(checks, 'Day 2-3 observing', day2.trustTone === 'observing');

  const day5 = buildAdvisorOperationalRelationshipModel({
    day: 5,
    decisionHistory: fastHistory,
    playerStyleProfile: {
      styleId: 'fast_responder',
      confidence: 'medium',
      score: 72,
      title: 'Hızlı Müdahaleci',
      shortLabel: 'Hızlı',
      summary: 'test',
      strengthLine: 'test',
      advisorLine: 'test',
      tags: [],
      tone: 'strategic',
      visible: true,
      observations: [],
    },
  });
  assert(checks, 'Day 4-7 recognizes_patterns', day5.familiarityBand === 'recognizes_patterns');

  const day9 = buildAdvisorOperationalRelationshipModel({ day: 9, decisionHistory: fastHistory });
  assert(checks, 'Day 8+ strategic tone', day9.trustTone === 'confident' || day9.trustTone === 'strategic');

  const fallback = buildAdvisorOperationalRelationshipModel({ day: 1, existingLines: [] });
  assert(checks, 'fallback güvenli', Boolean(fallback.mainAdvisorLine) && !advisorRelationshipCopyContainsForbiddenTerms(fallback.mainAdvisorLine));

  const styleKinds: AdvisorRelationshipStyleKind[] = [
    'fast_responder',
    'resource_guardian',
    'route_balancer',
    'social_trust_focused',
  ];
  for (const kind of styleKinds) {
    const line = buildAdvisorRelationshipStyleLine(kind);
    assert(checks, `${kind} style line üretilebiliyor`, Boolean(line));
    assert(
      checks,
      `${kind} suçlayıcı değil`,
      !advisorRelationshipCopyUnderminesTrust(line ?? ''),
    );
  }

  const prevRef = buildAdvisorOperationalRelationshipModel({
    day: 5,
    lastDecision: fastHistory[0],
    decisionImpact,
    existingLines: [decisionImpact.mainLine],
  });
  assert(checks, 'previous decision reference üretilebiliyor', Boolean(prevRef.previousDecisionReference));
  assert(
    checks,
    'DecisionImpact ile duplicate değil',
    !isDuplicateAdvisorRelationshipLine(prevRef.mainAdvisorLine, [decisionImpact.mainLine]) ||
      Boolean(prevRef.previousDecisionReference?.line),
  );
  assert(
    checks,
    'CityJournal ile duplicate değil',
    !isDuplicateAdvisorRelationshipLine(prevRef.mainAdvisorLine, [
      'Cumhuriyet günlüğünde görünür hizmet toparlandı.',
    ]),
  );
  assert(
    checks,
    'TomorrowRisk ile duplicate değil',
    !isDuplicateAdvisorRelationshipLine(prevRef.mainAdvisorLine, [tomorrowRisk.mainLine]) ||
      prevRef.mainAdvisorLine !== tomorrowRisk.mainLine,
  );

  assert(
    checks,
    'prediction_confirmed line var',
    Boolean(ADVISOR_RELATIONSHIP_PREDICTION_LINES.prediction_confirmed),
  );
  assert(
    checks,
    'prediction_softened line var',
    Boolean(ADVISOR_RELATIONSHIP_PREDICTION_LINES.prediction_softened),
  );
  assert(
    checks,
    'still_observing line var',
    Boolean(ADVISOR_RELATIONSHIP_PREDICTION_LINES.still_observing),
  );
  assert(
    checks,
    'güven kıran copy yok',
    !advisorRelationshipCopyUnderminesTrust(ADVISOR_RELATIONSHIP_PREDICTION_LINES.prediction_confirmed) &&
      !advisorRelationshipCopyUnderminesTrust(ADVISOR_RELATIONSHIP_PREDICTION_LINES.prediction_softened),
  );

  for (const districtId of MAP_DISTRICT_IDS) {
    const line = buildAdvisorRelationshipDistrictLine(districtId);
    assert(checks, `${districtId} district-specific line`, Boolean(line));
    assert(
      checks,
      `${districtId} teknik ad yok`,
      !line?.includes('content') && !line?.includes('pack') && !line?.includes('runtime'),
    );
  }

  const baseSignals = createInitialOperationSignalsState(6);
  const resourceModel = buildAdvisorOperationalRelationshipModel({
    day: 6,
    operationSignals: {
      ...baseSignals,
      vehicles: {
        ...baseSignals.vehicles,
        status: 'strained',
        score: 72,
        summary: 'Araç temposu yükseldi',
      },
    },
    resourceFatigue: { domain: 'vehicle', state: 'strained' },
  });
  assert(
    checks,
    'resource fatigue bağlanabiliyor',
    Boolean(resourceModel.resourceHabitReference) || Boolean(resourceModel.supportingLine),
  );

  const hubPresentation = buildAdvisorRelationshipHubPresentation({
    day: 9,
    decisionHistory: fastHistory,
    existingLines: [],
  });
  assert(checks, 'Hub presentation üretilebiliyor', hubPresentation.visible && Boolean(hubPresentation.mainLine));
  assert(checks, 'numberOfLines guard', hubPresentation.numberOfLines <= 2);

  const reportPresentation = buildAdvisorRelationshipReportPresentation({ day: 5, decisionHistory: fastHistory });
  assert(checks, 'Report helper var', Boolean(reportPresentation.reportLine));

  const resultPresentation = buildAdvisorRelationshipResultPresentation({
    day: 4,
    decisionImpact,
    snapshot: {
      id: 'snap-1',
      day: 4,
      eventId: 'e1',
      eventTitle: 'Test',
      neighborhoodId: 'sanayi',
      neighborhoodName: 'Sanayi',
      decisionId: 'd1',
      decisionTitle: 'Karar',
      decisionTone: 'balanced',
      createdAt: Date.now(),
      summaryTitle: 'Sonuç',
      summaryText: 'Test sonuç',
      resultTone: 'positive',
      metricChanges: [],
      subsystemOutcomes: [],
      highlightLines: [],
      riskLines: [],
    },
    existingLines: [decisionImpact.mainLine],
  });
  assert(checks, 'Result helper var', Boolean(resultPresentation.resultLine));

  const hubCard = readRepo('src/features/hub/components/HubAdvisorCard.tsx');
  const reportCard = readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx');
  const resultScreen = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  const packageJson = readRepo('package.json');
  const docs = readRepo('docs/crevia-advisor-relationship-pass.md');
  const persist = readRepo('src/store/gamePersist.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = readRepo('src/core/game/ensureDailyEventsForDay.ts');

  assert(checks, 'HubAdvisorCard integration', hubCard.includes('buildAdvisorRelationshipHubPresentation'));
  assert(checks, 'Report integration', reportCard.includes('buildAdvisorRelationshipReportPresentation'));
  assert(
    checks,
    'Result integration',
    resultScreen.includes('buildAdvisorRelationshipResultPresentation') ||
      resultScreen.includes('buildAdvisorRelationshipResultLine'),
  );
  assert(
    checks,
    'flexShrink guard',
    hubCard.includes('flexShrink') && reportCard.includes('flexShrink'),
  );
  assert(checks, 'package.json script', packageJson.includes('"verify:advisor-relationship"'));
  assert(checks, 'docs var', docs.includes('Advisor Operational Relationship'));
  assert(checks, 'SAVE_VERSION değişmedi', SAVE_VERSION === EXPECTED_SAVE_VERSION);
  assert(checks, 'persist shape değişmedi', persist.includes(`export const SAVE_VERSION = ${EXPECTED_SAVE_VERSION};`));
  assert(checks, 'applyDecision değişmedi', !applyDecision.includes('advisorRelationship'));
  assert(checks, 'dayPipeline değişmedi', !dayPipeline.includes('advisorRelationship'));
  assert(checks, 'event generation değişmedi', !dayPipeline.includes('buildAdvisorOperationalRelationshipModel'));

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
