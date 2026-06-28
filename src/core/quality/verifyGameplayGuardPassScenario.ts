import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { isSameMessage } from '@/core/presentationDedupe/presentationDedupe';
import {
  assertCurrentSaveVersion,
  getExpectedSaveVersionForCurrentBuild,
} from '@/core/quality/saveVersionPolicy';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  buildCenterHomePresentation,
  countHubPrimarySections,
  deriveHubDisclosureBand,
  hubSurfaceIsRenderable,
} from '@/features/hub/utils/centerHomePresentation';
import { buildMemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import {
  buildEndOfDayReportViewModel,
  type EndOfDayReportViewModel,
} from '@/features/reports/utils/endOfDayReportPresentation';
import {
  auditEventFieldPhasePresentation,
  buildEventFieldPhasePresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import { getPlanStrategyLabel } from '@/features/events/utils/eventPlanPhasePresentation';
import type { EventCard } from '@/core/models/EventCard';

import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  GAMEPLAY_10_10_BASE_RULES,
  GAMEPLAY_10_10_GUARD_DOCS_PATH,
  GAMEPLAY_10_10_GUARD_MINIMUM_COMMANDS,
  GAMEPLAY_10_10_OUT_OF_SCOPE,
  GAMEPLAY_10_10_PASS_REPORT_SECTIONS,
  GAMEPLAY_10_10_PER_PASS_MINIMUM_COMMANDS,
  GAMEPLAY_10_10_QUALITY_CRITERIA,
  GAMEPLAY_10_10_RISKY_AREAS,
} from './gameplayGuardPass/gameplayGuardPassConstants';
import {
  GAMEPLAY_10_10_PRIORITY_PASSES,
  getNextRecommendedGameplayPass,
  listGameplayPassVerifyScripts,
} from './gameplayGuardPass/gameplayGuardPassRegistry';
import { verifyPresentationDedupeScenario } from '@/core/presentationDedupe/verifyPresentationDedupeScenario';

export type VerifyGameplayGuardPassOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
  nextRecommendedPassId: string;
};

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function readPackageScripts(): Record<string, string> {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return pkg.scripts ?? {};
}

function sampleFieldEvent(): EventCard {
  return {
    id: 'evt_guard_field',
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
      },
    ],
  };
}

function sampleFieldAssignment(): EventAssignmentState {
  return {
    eventId: 'evt_guard_field',
    day: 2,
    status: 'dispatched',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 72,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
  };
}

function makeStateForDay(day: number) {
  const base = createDay1Seed().gameState;
  if (day < 8) {
    return {
      ...base,
      city: { ...base.city, day },
      pilot: { ...base.pilot, currentPilotDay: day },
      player: { ...base.player, streakDays: Math.max(1, day - 1) },
    };
  }
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day, status: 'completed' as const },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
  };
}

function countReportEnrichmentNotes(report: EndOfDayReportViewModel): number {
  return [
    report.oneMoreDayCard,
    report.eceStrategyLine,
    report.cityMemoryNote,
    report.followUpActionHint,
    report.positiveComebackNote,
    report.districtNeglectRecoveryNote,
    report.day8StrategicContentNote,
    report.cityRhythmNote,
    report.resourcePressureNote,
    report.dominantStrategyNote,
  ].filter(Boolean).length;
}

function buildReportVm(day: number) {
  const context = buildMemoryFollowUpPresentationContext({
    day,
    gameState: makeStateForDay(day),
    operationSignals: createInitialOperationSignalsState(day),
    socialPulseState: createInitialSocialPulseState(),
    hubDistrictReportLine: day >= 8 ? 'Mahalle güveni bugünkü kararla değişti.' : undefined,
    hubStoryChainLine: day >= 10 ? 'Hikaye zinciri yeni bir iz bıraktı.' : undefined,
  });
  return buildEndOfDayReportViewModel({
    report: buildDailyReport({
      day,
      metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
      decisionHistory: [],
      activeEvents: [],
      resolvedEventIds: [],
      snapshots: [],
    }),
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day, totalXp: day > 1 ? 12 : 0, categories: [] },
    memoryFollowUpContext: context,
  });
}

function runBehavioralGameplayContracts(checks: Check[]): void {
  const day1State = makeStateForDay(1);
  const day1Hub = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(checks, deriveHubDisclosureBand(1) === 'day1', 'Day 1 hub disclosure band', day1Hub.hubDensity.band);
  assert(
    checks,
    countHubPrimarySections(day1Hub.hubDensity) <= day1Hub.hubDensity.maxPrimarySections,
    'Day 1 hub primary section cap',
    `${countHubPrimarySections(day1Hub.hubDensity)}/${day1Hub.hubDensity.maxPrimarySections}`,
  );
  assert(
    checks,
    !hubSurfaceIsRenderable(day1Hub.hubDensity, 'maintenanceSignal'),
    'Day 1 maintenance surface hidden',
  );
  assert(
    checks,
    day1Hub.hubDensity.surfaceByKey.activeOperation.priority >= 95,
    'Day 1 active operation top priority',
    String(day1Hub.hubDensity.surfaceByKey.activeOperation.priority),
  );

  const day8State = makeStateForDay(8);
  const day8Hub = buildCenterHomePresentation({
    gameState: day8State,
    operationSignals: createInitialOperationSignalsState(8),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(8),
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
  });

  assert(checks, deriveHubDisclosureBand(8) === 'openEnded', 'Day 8 hub disclosure band', day8Hub.hubDensity.band);
  assert(
    checks,
    countHubPrimarySections(day8Hub.hubDensity) >= countHubPrimarySections(day1Hub.hubDensity),
    'Day 8 hub en az Day 1 kadar yüzey sunar',
    `d1=${countHubPrimarySections(day1Hub.hubDensity)} d8=${countHubPrimarySections(day8Hub.hubDensity)}`,
  );
  assert(
    checks,
    day8Hub.hubDensity.maxPrimarySections >= day1Hub.hubDensity.maxPrimarySections,
    'Day 8 hub section budget Day 1’den düşük değil',
    `d1max=${day1Hub.hubDensity.maxPrimarySections} d8max=${day8Hub.hubDensity.maxPrimarySections}`,
  );

  const fieldModel = buildEventFieldPhasePresentation({
    event: sampleFieldEvent(),
    assignment: sampleFieldAssignment(),
    selectedPlanStrategyId: 'balanced_plan',
    selectedPlanStrategyLabel: getPlanStrategyLabel('balanced_plan'),
    interactionState: 'running',
    timelineStepIndex: 2,
    day: 2,
  });
  const fieldAudit = auditEventFieldPhasePresentation(fieldModel);
  assert(checks, fieldAudit.length === 0, 'Field phase presentation audit temiz', fieldAudit.join(', '));
  assert(
    checks,
    fieldModel.timeline.steps.length >= 3 && fieldModel.timeline.steps.length <= 5,
    'Field phase timeline adımları canlı operasyon hissi verir (3–5)',
    String(fieldModel.timeline.steps.length),
  );
  assert(
    checks,
    fieldModel.liveOperation.progress.stages.length === 4,
    'Field phase canlı ilerleme 4 aşama',
    String(fieldModel.liveOperation.progress.stages.length),
  );
  assert(
    checks,
    fieldModel.primaryCta.label.length > 0 &&
      fieldModel.liveOperation.progress.progressPercent >= 0,
    'Field phase tek ana CTA ve progress modeli',
    `${fieldModel.primaryCta.label} ${fieldModel.liveOperation.progress.progressPercent}%`,
  );

  const day1Report = buildReportVm(1);
  const day8Report = buildReportVm(8);

  assert(checks, day1Report.isDay1, 'Day 1 report isDay1 flag', String(day1Report.isDay1));
  assert(
    checks,
    !day1Report.showSystemSummaries || day1Report.systemSections.length <= 2,
    'Day 1 report system summaries sade',
    `sections=${day1Report.systemSections.length}`,
  );
  assert(
    checks,
    countReportEnrichmentNotes(day8Report) >= countReportEnrichmentNotes(day1Report),
    'Day 8 report enrichment Day 1’den zengin veya eşit',
    `d1=${countReportEnrichmentNotes(day1Report)} d8=${countReportEnrichmentNotes(day8Report)}`,
  );
  assert(
    checks,
    day1Report.statusTitle.trim().length > 0 && day1Report.heroSubtitle.trim().length > 0,
    'Day 1 report hero başlık ve alt başlık dolu',
    day1Report.statusTitle,
  );

  const dedupeOutcome = verifyPresentationDedupeScenario();
  assert(
    checks,
    dedupeOutcome.ok,
    'Presentation dedupe contract (duplicate content guard)',
    `${dedupeOutcome.failCount} fail`,
  );
  assert(
    checks,
    !isSameMessage('Ekip temposu yarına baskı taşıyor.', 'Ekip temposu bakım kuyruğunda takip adayı.'),
    'Distinct copy not falsely deduped',
  );
}

export function verifyGameplayGuardPassScenario(): VerifyGameplayGuardPassOutcome {
  const checks: Check[] = [];
  const scripts = readPackageScripts();
  const docsPath = join(REPO_ROOT, GAMEPLAY_10_10_GUARD_DOCS_PATH);

  assert(checks, existsSync(docsPath), 'Guard pass dokümantasyonu mevcut', GAMEPLAY_10_10_GUARD_DOCS_PATH);
  assert(
    checks,
    typeof scripts['verify:gameplay-guard-pass'] === 'string',
    'verify:gameplay-guard-pass package.json’da tanımlı',
    scripts['verify:gameplay-guard-pass'] ?? 'missing',
  );

  assert(checks, GAMEPLAY_10_10_BASE_RULES.length === 20, '20 temel kural tanımlı', String(GAMEPLAY_10_10_BASE_RULES.length));
  assert(
    checks,
    GAMEPLAY_10_10_QUALITY_CRITERIA.length === 10,
    '10 kalite kriteri tanımlı',
    String(GAMEPLAY_10_10_QUALITY_CRITERIA.length),
  );
  assert(
    checks,
    GAMEPLAY_10_10_PRIORITY_PASSES.length === 10,
    '10 öncelikli pass tanımlı',
    String(GAMEPLAY_10_10_PRIORITY_PASSES.length),
  );
  assert(
    checks,
    GAMEPLAY_10_10_PASS_REPORT_SECTIONS.length === 12,
    '12 zorunlu rapor bölümü tanımlı',
    String(GAMEPLAY_10_10_PASS_REPORT_SECTIONS.length),
  );
  assert(
    checks,
    GAMEPLAY_10_10_OUT_OF_SCOPE.length >= 8,
    'Kapsam dışı liste tanımlı',
    String(GAMEPLAY_10_10_OUT_OF_SCOPE.length),
  );
  assert(
    checks,
    GAMEPLAY_10_10_RISKY_AREAS.length >= 6,
    'Riskli alan listesi tanımlı',
    String(GAMEPLAY_10_10_RISKY_AREAS.length),
  );

  for (const command of GAMEPLAY_10_10_GUARD_MINIMUM_COMMANDS) {
    const scriptKey = command === 'typecheck:tsc' ? 'typecheck:tsc' : command;
    assert(
      checks,
      typeof scripts[scriptKey] === 'string',
      `Guard minimum komut: ${command}`,
      scripts[scriptKey] ?? 'missing',
    );
  }

  for (const command of GAMEPLAY_10_10_PER_PASS_MINIMUM_COMMANDS) {
    assert(
      checks,
      typeof scripts[command] === 'string',
      `Per-pass minimum komut: ${command}`,
      scripts[command] ?? 'missing',
    );
  }

  const missingPassScripts = listGameplayPassVerifyScripts().filter((key) => typeof scripts[key] !== 'string');
  assert(
    checks,
    missingPassScripts.length === 0,
    'Tüm öncelik pass verify scriptleri package.json’da',
    missingPassScripts.join(', ') || 'ok',
  );

  for (const pass of GAMEPLAY_10_10_PRIORITY_PASSES) {
    assert(
      checks,
      pass.verifyScripts.length > 0 && pass.targetDirs.length > 0,
      `Pass registry tam: ${pass.id}`,
      pass.title,
    );
    assert(checks, pass.status === 'ready', `Pass hazır: ${pass.id}`, pass.status);
  }

  assert(
    checks,
    getExpectedSaveVersionForCurrentBuild() === SAVE_VERSION,
    'SAVE_VERSION policy runtime ile uyumlu',
    String(SAVE_VERSION),
  );
  assert(checks, assertCurrentSaveVersion(), 'SAVE_VERSION guard pass sırasında değişmedi');

  const gamePersistSource = readFileSync(join(REPO_ROOT, 'src/store/gamePersist.ts'), 'utf8');
  assert(
    checks,
    gamePersistSource.includes(`export const SAVE_VERSION: number = ${SAVE_VERSION}`),
    'gamePersist SAVE_VERSION literal policy ile eşleşir',
    String(SAVE_VERSION),
  );

  runBehavioralGameplayContracts(checks);

  const nextPass = getNextRecommendedGameplayPass();
  assert(
    checks,
    nextPass.id === 'field_live_operation',
    'Sonraki önerilen pass sahada fazı',
    nextPass.id,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`),
    nextRecommendedPassId: nextPass.id,
  };
}
