import type { EventCard } from '@/core/models/EventCard';
import {
  OPERATION_MOTION_SCAN_MAX_MS,
  OPERATION_MOTION_SCAN_MIN_MS,
  operationMotionScanDurationMs,
} from '@/core/motion/operationMotionTokens';
import { OPERATION_WORKFLOW_STEPS } from '@/features/events/utils/eventWorkflowPresentation';

import {
  auditEventInspectPhasePresentation,
  buildEventInspectFindings,
  buildEventInspectPhasePresentation,
  isAllowedInspectFindingKind,
  type EventInspectFinding,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  auditEventInspectLowerPresentation,
  buildEventInspectLowerPresentation,
} from '@/features/events/utils/eventInspectLowerPresentation';

export type VerifyOperationInspectUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_inspect_ui',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Mahallede biriken atık şikayetleri artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: -3, risk: 1, xp: 0 },
    decisions: [
      {
        id: 'd_assign',
        title: 'Ekibi yönlendir',
        description: 'Saha ekibini hızlı sevk et',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
        costs: { budget: 1200, staffHours: 2 },
      },
    ],
    ...partial,
  };
}

function sampleLowDataEvent(): EventCard {
  return sampleEvent({
    id: 'evt_low_data',
    title: 'Genel operasyon',
    riskLevel: 'low',
    district: '',
    description: '',
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'd_basic',
        title: 'Standart müdahale',
        description: 'Temel operasyon',
        style: 'balanced',
        effects: { publicSatisfaction: 1, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    ],
  });
}

export function verifyOperationInspectUiScenario(): VerifyOperationInspectUiOutcome {
  const checks: Check[] = [];

  const event = sampleEvent();
  const lowData = sampleLowDataEvent();

  const idleModel = buildEventInspectPhasePresentation({
    event,
    interactionState: 'idle',
    reducedMotion: false,
    day: 2,
  });
  const analyzingModel = buildEventInspectPhasePresentation({
    event,
    interactionState: 'analyzing',
    reducedMotion: false,
    day: 2,
  });
  const revealedModel = buildEventInspectPhasePresentation({
    event,
    interactionState: 'revealed',
    reducedMotion: false,
    day: 2,
  });
  const reducedModel = buildEventInspectPhasePresentation({
    event,
    interactionState: 'analyzing',
    reducedMotion: true,
    day: 2,
  });
  const day1Model = buildEventInspectPhasePresentation({
    event,
    interactionState: 'revealed',
    reducedMotion: false,
    day: 1,
    isDay1LearningEvent: true,
  });
  const lowDataModel = buildEventInspectPhasePresentation({
    event: lowData,
    interactionState: 'revealed',
    reducedMotion: false,
    day: 2,
  });

  for (const [label, model] of [
    ['idle', idleModel],
    ['analyzing', analyzingModel],
    ['revealed', revealedModel],
    ['reduced', reducedModel],
    ['day1', day1Model],
    ['lowData', lowDataModel],
  ] as const) {
    const issues = auditEventInspectPhasePresentation(model);
    assert(checks, issues.length === 0, `${label} presentation audit clean`, issues.join('; '));
  }

  assert(checks, idleModel.title.length > 0, 'title not empty');
  assert(checks, idleModel.summary.length > 0, 'summary not empty');
  assert(checks, idleModel.accessibilityLabel.length > 0, 'accessibilityLabel not empty');

  assert(
    checks,
    idleModel.findings.length >= 2 && idleModel.findings.length <= 3,
    'findings count 2-3 in idle build',
  );
  assert(
    checks,
    revealedModel.findings.length >= 2 && revealedModel.findings.length <= 3,
    'findings count 2-3 in revealed build',
  );

  const findingIds = new Set(revealedModel.findings.map((f) => f.id));
  assert(
    checks,
    findingIds.size === revealedModel.findings.length,
    'finding id unique',
  );

  for (const finding of revealedModel.findings as EventInspectFinding[]) {
    assert(
      checks,
      isAllowedInspectFindingKind(finding.kind),
      `finding kind allowed: ${finding.kind}`,
    );
    assert(checks, finding.title.trim().length > 0, `finding title: ${finding.id}`);
    assert(checks, finding.body.trim().length > 0, `finding body: ${finding.id}`);
  }

  const lowDataUrgent = lowDataModel.findings.some(
    (f: EventInspectFinding) => f.priority === 'urgent',
  );
  assert(checks, !lowDataUrgent, 'low-data does not produce fake urgent');

  assert(
    checks,
    day1Model.advisorComment?.tone === 'teaching',
    'Day 1 advisor teaching tone',
  );
  assert(
    checks,
    Boolean(day1Model.advisorComment?.text.trim()),
    'Day 1 advisor text not empty',
  );

  assert(
    checks,
    idleModel.primaryCta.actionKey === 'start_inspection',
    'idle CTA start_inspection',
  );
  assert(
    checks,
    revealedModel.primaryCta.actionKey === 'go_to_plan',
    'revealed CTA go_to_plan',
  );
  assert(checks, !analyzingModel.primaryCta.enabled, 'analyzing CTA disabled');

  const scanNormalMs = operationMotionScanDurationMs(false);
  assert(
    checks,
    scanNormalMs >= OPERATION_MOTION_SCAN_MIN_MS && scanNormalMs <= OPERATION_MOTION_SCAN_MAX_MS,
    'scan duration 600-900ms',
  );

  const scanReducedMs = operationMotionScanDurationMs(true);
  assert(checks, scanReducedMs === 0, 'reduced motion scan duration zero');
  assert(checks, reducedModel.scanHint.estimatedDurationMs === 0, 'reduced model scan hint zero');

  assert(checks, scanReducedMs === 0, 'reduced motion scan helper zero');

  assert(
    checks,
    OPERATION_WORKFLOW_STEPS.some((s) => s.id === 'inspect' && s.label === 'İncele'),
    'workflow step inspect unchanged',
  );

  let findingsCrash = false;
  try {
    buildEventInspectFindings(sampleEvent({ title: 'Test', district: 'Merkez' }));
  } catch {
    findingsCrash = true;
  }
  assert(checks, !findingsCrash, 'buildEventInspectFindings does not throw');

  const lowerRevealed = buildEventInspectLowerPresentation({
    event,
    day: 2,
    interactionState: 'revealed',
    confirmedSignalIds: ['field', 'citizen', 'social'],
    advisorComment: revealedModel.advisorComment,
    signalsComplete: true,
  });
  const lowerIdle = buildEventInspectLowerPresentation({
    event,
    day: 2,
    interactionState: 'idle',
    confirmedSignalIds: [],
  });
  assert(
    checks,
    auditEventInspectLowerPresentation(lowerRevealed).length === 0,
    'lower presentation audit revealed',
  );
  assert(
    checks,
    auditEventInspectLowerPresentation(lowerIdle).length === 0,
    'lower presentation audit idle',
  );
  assert(
    checks,
    lowerRevealed.primaryCta.label === 'Planlamaya Geç',
    'revealed lower CTA Planlamaya Geç',
  );
  assert(
    checks,
    lowerIdle.primaryCta.label === 'Sinyalleri Tamamla',
    'idle lower CTA Sinyalleri Tamamla',
  );
  assert(
    checks,
    lowerRevealed.evidenceSources.items.every((item) => !item.title.toLowerCase().includes('dinleme')),
    'no surveillance copy in evidence',
  );
  assert(
    checks,
    lowerRevealed.actions.every((action) => !['Paylaş', 'Arşivle'].includes(action.label)),
    'no share/archive actions',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
