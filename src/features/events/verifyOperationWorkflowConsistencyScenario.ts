import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  OPERATION_MOTION_RESULT_TOTAL_MS,
  OPERATION_MOTION_SCAN_MAX_MS,
  OPERATION_MOTION_SCAN_MIN_MS,
  operationMotionResultRevealTotalMs,
  operationMotionScanDurationMs,
} from '@/core/motion/operationMotionTokens';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
import { verifyOperationFieldLiveScenario } from '@/features/events/verifyOperationFieldLiveScenario';
import { verifyOperationResultRevealScenario } from '@/features/events/verifyOperationResultRevealScenario';
import {
  auditOperationWorkflowConsistencyPresentation,
  buildOperationWorkflowConsistencyMatrix,
  buildOperationWorkflowConsistencyPresentation,
  getExpectedWorkflowCtaChain,
  OPERATION_WORKFLOW_CONCEPT_LABELS,
  suggestDecisionIdForWorkflow,
} from '@/features/events/utils/operationWorkflowConsistencyPresentation';
import { OPERATION_PHASE_CTA_LABELS } from '@/features/events/utils/operationPhaseTransitionPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

const BASIC_FALLBACK_PATTERN =
  /^(Sonuç|Durum|Bilgi|Etki|Özet)\s*$/i;

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(day = 8): EventCard {
  return {
    id: 'workflow-consistency-event',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet Mahallesi',
    neighborhoodId: 'cumhuriyet',
    description: 'Mahalle tepkisi ve kaynak baskısı plan seçimini etkiliyor.',
    contextTag: 'market_cleaning',
    urgencyHours: 5,
    day,
    previewEffects: { publicSatisfaction: -3, risk: 2, xp: 24 },
    decisions: [
      {
        id: 'd_fast',
        title: 'Hızlı sevk',
        description: '',
        style: 'bold',
        decisionStyle: 'fast',
        effects: { publicSatisfaction: 3, budget: -1500, morale: -3, risk: -1, xp: 0 },
      },
      {
        id: 'd_balanced',
        title: 'Dengeli yönlendirme',
        description: '',
        style: 'balanced',
        recommended: true,
        effects: { publicSatisfaction: 2, budget: -1100, morale: -1, risk: -1, xp: 0 },
      },
    ],
  };
}

function sampleAssignment(day = 8): EventAssignmentState {
  return {
    eventId: 'workflow-consistency-event',
    day,
    status: 'confirmed',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 78,
    compatibilityLabel: 'Güçlü uyum',
    effects: [],
  };
}

export function verifyOperationWorkflowConsistencyScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const event = sampleEvent(8);
  const assignment = sampleAssignment(8);
  const matrix = buildOperationWorkflowConsistencyMatrix({ event, assignment });
  const rapidDay8 = matrix.find(
    (model) => model.strategyId === 'rapid_response' && model.day === 8,
  );
  const balancedDay1 = matrix.find(
    (model) => model.strategyId === 'balanced_plan' && model.day === 1,
  );

  assert(checks, matrix.length === 6, 'matrix covers 3 strategies x 2 days', String(matrix.length));

  for (const model of matrix) {
    const issues = auditOperationWorkflowConsistencyPresentation(model);
    assert(
      checks,
      issues.length === 0,
      `audit ${model.strategyId} day${model.day}`,
      issues.join(', ') || 'ok',
    );
  }

  assert(checks, Boolean(rapidDay8), 'rapid day8 model exists');
  assert(checks, Boolean(balancedDay1), 'balanced day1 model exists');

  if (rapidDay8) {
    const ctaChain = rapidDay8.phases.map((phase) => phase.primaryCtaLabel);
    assert(
      checks,
      ctaChain[0] === OPERATION_PHASE_CTA_LABELS.inspect &&
        ctaChain[1] === OPERATION_PHASE_CTA_LABELS.plan &&
        ctaChain[2] === OPERATION_PHASE_CTA_LABELS.dispatch &&
        ctaChain[3] === OPERATION_PHASE_CTA_LABELS.field,
      'CTA zinciri sırası',
      ctaChain.join(' → '),
    );
    assert(
      checks,
      rapidDay8.phases.every((phase) => phase.primaryCtaEnabled),
      'aktif fazlarda CTA enabled',
      'ok',
    );
    assert(
      checks,
      rapidDay8.toneCoherence.coherent,
      'field/result tone coherent rapid',
      `${rapidDay8.toneCoherence.fieldRiskLabel} → ${rapidDay8.toneCoherence.resultToneId}`,
    );
    assert(
      checks,
      rapidDay8.phases[4]?.decisionImpactLine?.includes('Hızlı müdahale') === true,
      'karar etkisi sonuçta görünür',
      rapidDay8.phases[4]?.decisionImpactLine?.slice(0, 40) ?? 'missing',
    );
    assert(
      checks,
      rapidDay8.hubAlignedTerms.length >= 1,
      'hub/report aligned terms',
      String(rapidDay8.hubAlignedTerms.length),
    );
  }

  if (balancedDay1) {
    assert(checks, balancedDay1.densityBand === 'day1', 'day1 density band');
    assert(
      checks,
      balancedDay1.phases.every((phase) => phase.insightLineCount <= 6),
      'day1 insight bounded',
      balancedDay1.phases.map((phase) => phase.insightLineCount).join(','),
    );
    assert(
      checks,
      balancedDay1.phases.every((phase) => phase.chipCount <= 4),
      'day1 chip bounded',
      balancedDay1.phases.map((phase) => phase.chipCount).join(','),
    );
    assert(
      checks,
      !balancedDay1.ctaLabels.includes(OPERATION_PHASE_CTA_LABELS.result),
      'day1 result CTA not conflated',
      balancedDay1.ctaLabels.join('|'),
    );
  }

  const expectedChain = getExpectedWorkflowCtaChain();
  assert(
    checks,
    expectedChain.join('|') ===
      [
        OPERATION_PHASE_CTA_LABELS.inspect,
        OPERATION_PHASE_CTA_LABELS.plan,
        OPERATION_PHASE_CTA_LABELS.dispatch,
        OPERATION_PHASE_CTA_LABELS.field,
      ].join('|'),
    'expected CTA chain registry',
    expectedChain.join(' → '),
  );

  const conceptValues = Object.values(OPERATION_WORKFLOW_CONCEPT_LABELS);
  assert(checks, conceptValues.length >= 8, 'shared concept vocabulary', String(conceptValues.length));

  const single = buildOperationWorkflowConsistencyPresentation({
    event,
    day: 8,
    strategyId: 'balanced_plan',
    assignment,
  });
  const heroTitles = single.phases.map((phase) => phase.heroTitle);
  assert(
    checks,
    heroTitles.every((title) => !BASIC_FALLBACK_PATTERN.test(title.trim())),
    'no basic hero fallback titles',
    heroTitles.join(' | '),
  );
  assert(
    checks,
    single.phases.every((phase) => phase.intentLabel.length > 12),
    'phase intent present',
    'ok',
  );

  const mapped = suggestDecisionIdForWorkflow(event, 'balanced_plan');
  assert(checks, Boolean(mapped), 'plan strategy maps to decision', mapped ?? 'missing');

  assert(
    checks,
    operationMotionScanDurationMs(false) >= OPERATION_MOTION_SCAN_MIN_MS &&
      operationMotionScanDurationMs(false) <= OPERATION_MOTION_SCAN_MAX_MS,
    'inspect motion bounded',
    String(operationMotionScanDurationMs(false)),
  );
  assert(
    checks,
    operationMotionResultRevealTotalMs(false) <= OPERATION_MOTION_RESULT_TOTAL_MS,
    'result motion bounded',
    String(operationMotionResultRevealTotalMs(false)),
  );

  const persistSource = readRepo('src/store/gamePersist.ts');
  assert(checks, assertVerifySaveVersionPolicy(persistSource, SAVE_VERSION), 'SAVE_VERSION 28', String(SAVE_VERSION));
  assert(checks, !persistSource.includes('operationWorkflowConsistency'), 'persist shape unchanged');

  const storeSource = readRepo('src/store/useGameStore.ts');
  assert(
    checks,
    !storeSource.includes('operationWorkflowConsistency'),
    'useGameStore unchanged',
  );

  const subVerifies = [
    verifyOperationResultRevealScenario(),
    verifyOperationFieldLiveScenario(),
  ];
  for (const [index, outcome] of subVerifies.entries()) {
    assert(checks, outcome.ok, `sub-verify ${index}`, String(outcome.failCount));
  }

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
