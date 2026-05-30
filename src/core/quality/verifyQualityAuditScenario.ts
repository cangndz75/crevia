import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANIMATION_DURATION, MAX_ANIMATION_DURATION_MS } from '@/core/animations/animationTokens';
import { ANIMATION_PRESET_DEFINITIONS } from '@/core/animations/animationPresetDefinitions';
import { EVENT_AUTHORING_EXAMPLE_PROFILES } from '@/core/content/eventAuthoringGuide';

import {
  readPackageScriptMatrix,
  runArchitectureDependencyAudit,
  VERIFY_SCRIPT_KEYS,
} from './architectureDependencyAudit';
import {
  CRITICAL_UI_GUARD_TARGETS,
  runPerformanceAudit,
} from './performanceAudit';
import {
  assertNoQualityAuditForbiddenWords,
  collectQualityAuditStrings,
  qualityAuditDocExists,
  qualityAuditRequiresGameplayOrPersist,
  runQualityAudit,
} from './qualityAuditPresentation';

export type VerifyQualityAuditOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

const REPO_ROOT = join(__dirname, '..', '..', '..');

export function verifyQualityAuditScenario(): VerifyQualityAuditOutcome {
  const checks: Check[] = [];

  const result = runQualityAudit();
  assert(
    checks,
    result.health === 'PASS' || result.health === 'WARN' || result.health === 'FAIL',
    'Quality audit result üretir',
    result.health,
  );

  assert(
    checks,
    ['PASS', 'WARN', 'FAIL'].includes(result.health),
    'health PASS/WARN/FAIL değerlerinden biridir',
    result.health,
  );

  const arch = runArchitectureDependencyAudit();
  assert(
    checks,
    arch.importScan.productionCoreToFeaturesCount === 0 ||
      arch.warnings.some((w) => w.id === 'core_features_production_import'),
    'core klasörünün features import etmediği doğrulanır veya warning üretir',
    `production=${arch.importScan.productionCoreToFeaturesCount}`,
  );

  assert(
    checks,
    !arch.importScan.postPilotUxImportsUi,
    'postPilot UX helper UI component import etmez',
    String(arch.importScan.postPilotUxImportsUi),
  );

  assert(
    checks,
    !arch.importScan.presentationImportsUi,
    'icon registry UI component import etmez',
    String(arch.importScan.presentationImportsUi),
  );

  const durationsOk = Object.values(ANIMATION_DURATION).every(
    (ms) => ms < MAX_ANIMATION_DURATION_MS,
  );
  assert(
    checks,
    durationsOk,
    'animation duration değerleri 300ms altında kalır',
    Object.values(ANIMATION_DURATION).join(', '),
  );

  assert(
    checks,
    ANIMATION_PRESET_DEFINITIONS.selectedPulse.endlessLoop === false,
    'selectedPulse endless loop değildir',
    `endless=${ANIMATION_PRESET_DEFINITIONS.selectedPulse.endlessLoop}`,
  );

  assert(
    checks,
    CRITICAL_UI_GUARD_TARGETS.length >= 14,
    'critical UI component guard listesi boş değildir',
    String(CRITICAL_UI_GUARD_TARGETS.length),
  );

  const scriptMatrix = readPackageScriptMatrix();
  assert(
    checks,
    scriptMatrix.verifyScripts.length > 20,
    'verify script matrix package.json’dan okunur',
    String(scriptMatrix.verifyScripts.length),
  );

  const missing = VERIFY_SCRIPT_KEYS.filter((k) => !scriptMatrix.verifyScripts.includes(k));
  assert(
    checks,
    missing.length === 0,
    'full-loop/full-ux-flow/meta-progression scriptleri bulunur',
    missing.join(', ') || 'ok',
  );

  const forbidden = collectQualityAuditStrings().reduce(
    (sum, text) => sum + assertNoQualityAuditForbiddenWords(text),
    0,
  );
  assert(checks, forbidden === 0, 'forbidden user-facing words audit metinlerinde yoktur', String(forbidden));

  assert(
    checks,
    qualityAuditDocExists(),
    'docs/crevia-quality-audit.md oluşturulmuştur',
    existsSync(join(REPO_ROOT, 'docs', 'crevia-quality-audit.md')) ? 'ok' : 'missing',
  );

  assert(
    checks,
    qualityAuditRequiresGameplayOrPersist() === false,
    'Audit yeni gameplay/persist alanı gerektirmez',
    'ok',
  );

  const pkg = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  assert(
    checks,
    typeof pkg.scripts?.['verify:quality-audit'] === 'string',
    'verify:quality-audit package.json’da tanımlı',
    pkg.scripts?.['verify:quality-audit'] ?? 'missing',
  );

  void EVENT_AUTHORING_EXAMPLE_PROFILES;

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
