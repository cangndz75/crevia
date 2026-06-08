import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  FINAL_POLISH_ALLOWED_SCOPE,
  FINAL_POLISH_FORBIDDEN_SCOPE,
  FINAL_POLISH_GUARDS,
} from './finalPolishGuards';
import {
  buildFinalPolishMandatoryChecklist,
  buildFinalPolishNextRecommendedStep,
  buildFinalPolishRoadmapReportText,
  buildFinalPolishSoftLaunchReadinessText,
} from './finalPolishPresentation';
import {
  FINAL_POLISH_DOCS_PATH,
  FINAL_POLISH_ROADMAP,
  getFinalPolishRoadmapItemById,
} from './finalPolishRoadmap';
import type { FinalPolishVerifyOutcome } from './finalPolishTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const MIN_ROADMAP_ITEMS = 30;
const MIN_GUARDS = 17;
const EXPECTED_SAVE_VERSION = 24;

export type VerifyFinalPolishOptions = {
  docsContent?: string;
  packageJsonContent?: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function findItem(id: string) {
  return getFinalPolishRoadmapItemById(id);
}

function blobIncludesForbidden(keyword: string): boolean {
  return FINAL_POLISH_FORBIDDEN_SCOPE.some((f) =>
    f.toLowerCase().includes(keyword.toLowerCase()),
  );
}

function blobIncludesAllowed(keyword: string): boolean {
  return FINAL_POLISH_ALLOWED_SCOPE.some((a) =>
    a.toLowerCase().includes(keyword.toLowerCase()),
  );
}

export function verifyFinalPolishScenario(
  options: VerifyFinalPolishOptions = {},
): FinalPolishVerifyOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  const docs = options.docsContent ?? readRepo(FINAL_POLISH_DOCS_PATH);
  const packageJson = options.packageJsonContent ?? readRepo('package.json');

  record(
    assert(
      checks,
      FINAL_POLISH_ROADMAP.length >= MIN_ROADMAP_ITEMS,
      `Roadmap en az ${MIN_ROADMAP_ITEMS} madde (${FINAL_POLISH_ROADMAP.length})`,
      `Roadmap yetersiz (${FINAL_POLISH_ROADMAP.length})`,
    ),
  );

  const mandatoryItems = FINAL_POLISH_ROADMAP.filter((i) => i.priority === 'mandatory');
  record(
    assert(
      checks,
      mandatoryItems.length >= 5,
      `Mandatory maddeler mevcut (${mandatoryItems.length})`,
      'Mandatory madde eksik',
    ),
  );

  const aiItems = FINAL_POLISH_ROADMAP.filter((i) => i.group === 'ai_later');
  record(
    assert(
      checks,
      aiItems.length >= 6,
      `AI later grubunda ${aiItems.length} madde`,
      'AI later maddeleri eksik',
    ),
  );

  record(
    assert(
      checks,
      aiItems.every((i) => i.status === 'later' && i.priority === 'later'),
      'AI maddeleri later grubunda ve status later',
      'AI maddeleri later değil',
    ),
  );

  const runtimeAiOnMain = FINAL_POLISH_ROADMAP.some(
    (i) =>
      i.group !== 'ai_later' &&
      /runtime\s*ai/i.test(i.description) &&
      !/runtime\s*ai\s*(değil|yok|entegrasyonu yok|not)/i.test(i.description),
  );
  record(
    assert(
      checks,
      !runtimeAiOnMain,
      'Runtime AI final polish main path dışında',
      'Runtime AI main path üzerinde',
    ),
  );

  const mapLayer = findItem('dynamic-field-presence-map-layer');
  record(assert(checks, !!mapLayer, 'Dynamic Field Presence Map Layer roadmap’te', 'Map layer eksik'));

  record(
    assert(
      checks,
      !!mapLayer?.description.includes('container cluster marker'),
      'Container cluster marker hedefi açıklamada',
      'Container cluster marker eksik',
    ),
  );

  record(
    assert(
      checks,
      !!mapLayer?.description.includes('vehicle marker') &&
        !!mapLayer?.description.includes('team marker'),
      'Vehicle ve team marker hedefleri açıklamada',
      'Vehicle/team marker eksik',
    ),
  );

  record(assert(checks, !!findItem('daily-theme-rhythm'), 'Daily Theme Rhythm var', 'Eksik'));
  record(
    assert(
      checks,
      !!findItem('dynamic-event-writing-standard'),
      'Dynamic Event Writing Standard var',
      'Eksik',
    ),
  );

  for (const stage of [
    'content-safety-pack-stage-1',
    'content-safety-pack-stage-2',
    'content-safety-pack-stage-3',
  ]) {
    record(assert(checks, !!findItem(stage), `${stage} var`, `${stage} eksik`));
  }

  const featureIds = [
    'carry-over-memory-cards',
    'dynamic-social-echo',
    'report-tomorrow-preview',
    'ece-player-style-recognition',
    'day-7-personal-pilot-recap',
    'main-operation-trailer-preview',
  ];
  for (const id of featureIds) {
    record(assert(checks, !!findItem(id), `${id} roadmap’te`, `${id} eksik`));
  }

  const analytics = findItem('analytics-sdk-adapter');
  record(assert(checks, !!analytics, 'Analytics SDK Adapter var', 'Analytics eksik'));
  record(
    assert(
      checks,
      !!analytics?.description.includes('Runtime Instrumentation') &&
        !!analytics?.description.includes('no-op'),
      'Analytics runtime instrumentation notu uyumlu',
      'Analytics açıklama uyumsuz',
    ),
  );

  record(
    assert(
      checks,
      findItem('revenuecat-store-manual-setup')?.priority === 'mandatory',
      'RevenueCat manual setup mandatory',
      'RevenueCat mandatory değil',
    ),
  );

  record(
    assert(
      checks,
      findItem('eas-dev-build-iap-sandbox-smoke')?.priority === 'mandatory',
      'EAS IAP smoke test mandatory',
      'EAS smoke mandatory değil',
    ),
  );

  record(
    assert(
      checks,
      findItem('manual-playtest-checklist')?.priority === 'mandatory',
      'Manual playtest mandatory',
      'Playtest mandatory değil',
    ),
  );

  record(
    assert(
      checks,
      findItem('release-candidate-audit')?.priority === 'mandatory',
      'Release Candidate Audit mandatory',
      'RC audit mandatory değil',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesForbidden('full logistics simulation') ||
        blobIncludesForbidden('Tam gerçek zamanlı rota simülasyonu'),
      'Forbidden: full logistics simulation',
      'Logistics simulation yasak listesinde yok',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesForbidden('applyDecision refactor'),
      'Forbidden: applyDecision refactor',
      'applyDecision refactor yasak değil',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesForbidden('SAVE_VERSION'),
      'Forbidden: SAVE_VERSION gereksiz artış',
      'SAVE_VERSION yasak listesinde yok',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesAllowed('Content pack'),
      'Allowed: content pack',
      'Content pack allowed değil',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesAllowed('presentation layer') ||
        blobIncludesAllowed('Map presentation layer'),
      'Allowed: presentation layer',
      'Presentation layer allowed değil',
    ),
  );

  record(
    assert(
      checks,
      blobIncludesAllowed('Analytics SDK adapter'),
      'Allowed: analytics SDK adapter',
      'Analytics adapter allowed değil',
    ),
  );

  const roadmapIds = FINAL_POLISH_ROADMAP.map((i) => i.id);
  record(
    assert(
      checks,
      new Set(roadmapIds).size === roadmapIds.length,
      'Roadmap id unique',
      'Duplicate roadmap id',
    ),
  );

  const guardIds = FINAL_POLISH_GUARDS.map((g) => g.id);
  record(
    assert(
      checks,
      new Set(guardIds).size === guardIds.length,
      'Guard id unique',
      'Duplicate guard id',
    ),
  );

  record(
    assert(
      checks,
      FINAL_POLISH_GUARDS.length >= MIN_GUARDS,
      `Guard sayısı >= ${MIN_GUARDS}`,
      'Guard sayısı yetersiz',
    ),
  );

  const mandatoryCritical = FINAL_POLISH_ROADMAP.filter(
    (i) => i.priority === 'mandatory' || i.priority === 'critical',
  );
  record(
    assert(
      checks,
      mandatoryCritical.every((i) => i.acceptanceChecks.length > 0),
      'Mandatory/critical acceptanceChecks dolu',
      'acceptanceChecks eksik',
    ),
  );

  const highCritical = FINAL_POLISH_ROADMAP.filter(
    (i) => i.priority === 'high' || i.priority === 'critical' || i.priority === 'mandatory',
  );
  const highCriticalGuarded = highCritical.every(
    (i) =>
      i.forbiddenChanges.length > 0 ||
      FINAL_POLISH_GUARDS.some((g) => g.appliesToGroups.includes(i.group)),
  );
  record(
    assert(
      checks,
      highCriticalGuarded,
      'High/critical forbiddenChanges veya grup guard',
      'High/critical koruma eksik',
    ),
  );

  const readiness = buildFinalPolishSoftLaunchReadinessText();
  record(
    assert(
      checks,
      readiness.includes('blocker:') && readiness.includes('fail:') && readiness.includes('warn:'),
      'Soft launch readiness blocker/fail/warn ayrımı',
      'Readiness ayrımı eksik',
    ),
  );

  const report = buildFinalPolishRoadmapReportText();
  const mandatoryList = buildFinalPolishMandatoryChecklist();
  const nextStep = buildFinalPolishNextRecommendedStep();

  record(
    assert(
      checks,
      report.trim().length > 0 &&
        readiness.trim().length > 0 &&
        mandatoryList.length > 0 &&
        nextStep.trim().length > 0,
      'Presentation helper boş string üretmiyor',
      'Boş presentation çıktısı',
    ),
  );

  record(
    assert(
      checks,
      docs.includes('Scope Freeze') && docs.includes('Daily Theme Rhythm'),
      'Docs roadmap maddelerini içeriyor',
      'Docs eksik',
    ),
  );

  record(
    assert(
      checks,
      docs.includes('Yapılmayacaklar') && docs.includes('Yapılabilecekler'),
      'Docs forbidden/allowed bölümleri',
      'Docs scope bölümleri eksik',
    ),
  );

  record(
    assert(
      checks,
      packageJson.includes('"verify:final-polish"'),
      'package.json verify:final-polish script',
      'verify script eksik',
    ),
  );

  record(
    assert(
      checks,
      SAVE_VERSION === EXPECTED_SAVE_VERSION,
      `SAVE_VERSION değişmedi (${SAVE_VERSION})`,
      `SAVE_VERSION beklenen ${EXPECTED_SAVE_VERSION}, mevcut ${SAVE_VERSION}`,
    ),
  );

  const scopeFreeze = findItem('scope-freeze-final-polish-guard');
  recordWarn(
    warn(
      checks,
      scopeFreeze?.status === 'in_progress' || scopeFreeze?.status === 'completed',
      'Scope freeze guard durumu tanımlı',
      'Scope freeze henüz planned — patch tamamlanınca in_progress/completed olmalı',
    ),
  );

  recordWarn(
    warn(
      checks,
      nextStep.includes('Specialist Advisor') ||
        nextStep.includes('specialist-advisor-notes') ||
        getFinalPolishRoadmapItemById('advisor-seniority-system')?.status === 'completed',
      'Sonraki adım Specialist Advisor Notes MVP önerisi',
      `Sonraki adım farklı: ${nextStep}`,
    ),
  );

  return { ok, warn: hasWarn, checks };
}
