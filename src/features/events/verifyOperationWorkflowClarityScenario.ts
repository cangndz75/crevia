import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { EventCard } from '@/core/models/EventCard';
import { SAVE_VERSION } from '@/store/gamePersist';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';
import { buildEventInspectPhasePresentation } from '@/features/events/utils/eventInspectPhasePresentation';
import {
  auditOperationWorkflowClarityPresentation,
  buildOperationWorkflowClarityPresentation,
} from '@/features/events/utils/operationWorkflowClarityPresentation';
import { verifyOperationFieldLiveScenario } from '@/features/events/verifyOperationFieldLiveScenario';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function makeEvent(day = 1): EventCard {
  return {
    id: `workflow-clarity-${day}`,
    title: 'Cumhuriyet Ekibinde Yorgunluk Baskısı',
    category: 'personnel',
    riskLevel: day >= 8 ? 'high' : 'medium',
    district: 'Cumhuriyet Mahallesi',
    neighborhoodId: 'cumhuriyet',
    description: 'Ekip temposu ve mahalle tepkisi plan seçimini etkileyebilir.',
    contextTag: 'team_pressure',
    urgencyHours: 6,
    day,
    previewEffects: {
      publicSatisfaction: day >= 8 ? -5 : -2,
      risk: day >= 8 ? 3 : 1,
      xp: 20,
    },
    decisions: [
      {
        id: 'balanced_plan',
        title: 'Dengeli ekip seç',
        description: 'Ekip yorgunluğunu zorlamadan müdahale et.',
        style: 'balanced',
        decisionStyle: 'planned',
        effects: { publicSatisfaction: 2, budget: 0, morale: 0, risk: -1, xp: 20 },
        costs: { budget: 1, staffHours: 1 },
      },
    ],
  };
}

function makeSchoolCleaningEvent(): EventCard {
  return {
    ...makeEvent(8),
    id: 'workflow-clarity-school-cleaning',
    title: 'Cumhuriyet’te okul çevresi temizlik talebi',
    category: 'waste',
    contextTag: 'school_cleaning',
    description: 'Okul çevresinde çöp ve temizlik sinyali plan seçimini etkiliyor.',
  };
}

function buildInspectClarity(day: number, confirmedSignalIds: Array<'field' | 'citizen' | 'social'>) {
  const event = makeEvent(day);
  const inspect = buildEventInspectPhasePresentation({
    event,
    interactionState: confirmedSignalIds.length >= 3 ? 'revealed' : 'idle',
    day,
    isDay1LearningEvent: day <= 1,
  });

  return buildOperationWorkflowClarityPresentation({
    event,
    day,
    interactionState: confirmedSignalIds.length >= 3 ? 'revealed' : 'idle',
    confirmedSignalIds,
    findings: inspect.findings,
    advisorComment: inspect.advisorComment,
    phaseHeader: inspect.phaseTransition.shell,
    isDay1LearningEvent: day <= 1,
  });
}

export function verifyOperationWorkflowClarityScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1 = buildInspectClarity(1, []);
  const day1OneSignal = buildInspectClarity(1, ['field']);
  const day8 = buildInspectClarity(8, ['field', 'citizen']);
  const complete = buildInspectClarity(8, ['field', 'citizen', 'social']);
  const schoolEvent = makeSchoolCleaningEvent();
  const schoolInspect = buildEventInspectPhasePresentation({
    event: schoolEvent,
    interactionState: 'idle',
    day: 8,
    isDay1LearningEvent: false,
  });
  const schoolHero = buildOperationWorkflowClarityPresentation({
    event: schoolEvent,
    day: 8,
    interactionState: 'idle',
    confirmedSignalIds: [],
    findings: schoolInspect.findings,
    advisorComment: schoolInspect.advisorComment,
    phaseHeader: schoolInspect.phaseTransition.shell,
    isDay1LearningEvent: false,
  });
  const phaseLabels = schoolInspect.phaseTransition.progress.items.map((item) => item.label);

  assert(checks, day1.phaseHeader.title === 'İncele', 'header phase title');
  assert(checks, Boolean(day1.phaseHeader.statusSummary), 'header status summary');
  assert(checks, (day1.phaseHeader.metrics?.length ?? 0) > 0, 'header metrics');
  assert(
    checks,
    phaseLabels.join('|') === 'İncele|Planla|Yönlendir|Sahada|Sonuç',
    'phase stepper labels',
    phaseLabels.join(', '),
  );
  assert(checks, day1.investigationChecklist.length >= 1 && day1.investigationChecklist.length <= 3, 'checklist 1-3 items');
  assert(checks, day1.verifiedCount === 0, 'day1 starts 0 verified', `${day1.verifiedCount}/${day1.requiredCount}`);
  assert(
    checks,
    day1.investigationChecklist.every((item) => item.status !== 'verified'),
    '0 progress has no verified checks',
  );
  assert(checks, day1.primaryCta.label === 'İlk bilgiyi doğrula', 'day1 first CTA', day1.primaryCta.label);
  assert(checks, day1.primaryCta.label !== 'Planı Oluştur', 'missing info blocks planning CTA');
  assert(checks, day1OneSignal.primaryCta.label !== 'Planı Oluştur', 'partial info blocks planning CTA');
  assert(checks, complete.primaryCta.label === 'Planı Oluştur', 'complete info allows planning CTA');
  assert(checks, day1.densityBand === 'day1_simple', 'day1 simple density');
  assert(checks, day8.densityBand === 'strategic', 'day8 strategic density');
  assert(checks, day8.planningImpact.lines.length >= 1 && day8.planningImpact.lines.length <= 3, 'planning impact compact');
  assert(checks, day8.advisorHint.text.length <= 170, 'Ece hint max 2-3 lines', `${day8.advisorHint.text.length}`);
  assert(checks, Boolean(day1.investigationBrief.title.trim()), 'hero title present');
  assert(checks, Boolean(day1.investigationBrief.locationLabel.trim()), 'hero location present');
  assert(checks, Boolean(day1.investigationBrief.priorityLabel.trim()), 'hero priority present');
  assert(checks, Boolean(day1.investigationBrief.infoProgressLabel.trim()), 'hero info progress present');
  assert(checks, Boolean(day1.investigationBrief.planQualityLabel.trim()), 'hero plan quality present');
  assert(
    checks,
    !day1.investigationBrief.topChips.some((chip) => chip.label.trim() === 'Açık'),
    'no bare Açık chip',
  );
  assert(
    checks,
    day1.investigationBrief.missingInfoLabel.includes('2 sinyal') &&
      day1.investigationBrief.infoProgressLabel === '0/2 bilgi',
    'info progress matches missing signal copy',
    `${day1.investigationBrief.missingInfoLabel} / ${day1.investigationBrief.infoProgressLabel}`,
  );
  assert(
    checks,
    schoolHero.investigationBrief.heroVisualVariant === 'school_cleaning',
    'school cleaning visual variant',
    schoolHero.investigationBrief.heroVisualVariant,
  );
  assert(
    checks,
    schoolHero.investigationBrief.markerItems.length > 0 &&
      schoolHero.investigationBrief.markerItems.length <= 3,
    'hero marker density controlled',
    String(schoolHero.investigationBrief.markerItems.length),
  );

  const day1Issues = auditOperationWorkflowClarityPresentation(day1);
  const day8Issues = auditOperationWorkflowClarityPresentation(day8);
  assert(checks, day1Issues.length === 0, 'day1 clarity audit', day1Issues.join(', '));
  assert(checks, day8Issues.length === 0, 'day8 clarity audit', day8Issues.join(', '));

  const headerSource = readRepo('src/features/events/components/event-workflow/OperationPhaseShellHeader.tsx');
  assert(checks, !/CreviaGameLogo|logo|notifications-outline|notification/i.test(headerSource), 'operation header has no logo/notification');

  const inspectSource = readRepo('src/features/events/components/event-workflow/EventInspectPhase.tsx');
  assert(checks, inspectSource.includes('paddingBottom: Math.max'), 'bottom nav safe padding preserved');
  assert(checks, inspectSource.includes('StickyUnlockBar'), 'single sticky operation CTA present');

  const persistSource = readRepo('src/store/gamePersist.ts');
  assert(checks, !persistSource.includes('operationWorkflowClarity'), 'persist schema unchanged');
  assert(checks, assertVerifySaveVersionPolicy(persistSource, SAVE_VERSION), 'SAVE_VERSION unchanged', String(SAVE_VERSION));

  const fieldLive = verifyOperationFieldLiveScenario();
  assert(checks, fieldLive.ok, 'Sahada live verifier remains green', `fails=${fieldLive.failCount}`);

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
