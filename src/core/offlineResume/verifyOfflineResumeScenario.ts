import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import { OFFLINE_RESUME_DOCS_PATH, OFFLINE_RESUME_EXPECTED_SAVE_VERSION } from './offlineResumeConstants';
import { runOfflineResumeAudit } from './offlineResumeAudit';
import { buildOfflineResumeVerifySummary } from './offlineResumePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyOfflineResumeOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyOfflineResumeScenario(): VerifyOfflineResumeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runOfflineResumeAudit();
  const summary = buildOfflineResumeVerifySummary(audit);

  for (const line of summary.lines) {
    checks.push(line.startsWith('PASS') ? line : line.replace(/^(WARN|FAIL|BLOCKER)/, 'CHECK $1'));
  }

  const phases = new Set(audit.scenarioResults.map((r) => r.phase));
  record(assert(checks, phases.has('day1_tutorial'), 'Day 1 resume senaryosu var'));
  record(assert(checks, phases.has('pilot_day2_7'), 'Day 2-7 pilot resume senaryosu var'));
  record(assert(checks, phases.has('day7_day8_transition'), 'Day 7 → Day 8 transition resume senaryosu var'));
  record(assert(checks, phases.has('post_pilot_light'), 'Day 8+ light pack-origin resume senaryosu var'));
  record(assert(checks, phases.has('surface_resume'), 'Map/Hub surface resume senaryosu var'));
  record(assert(checks, phases.has('offline_no_network'), 'Offline/no network fallback senaryosu var'));
  record(assert(checks, phases.has('content_pack_recovery'), 'contentPackMeta recovery senaryoları var'));
  record(assert(checks, phases.has('idempotency'), 'Idempotency senaryoları var'));
  record(assert(checks, phases.has('derived_presentation'), 'Derived presentation senaryoları var'));

  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'pack-meta-event-pool' && r.status === 'PASS'),
      'solved event id’den contentPackMeta recover edilebiliyor',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'pack-meta-cra-parse' && r.status === 'PASS'),
      'cra_* id parse güvenli',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'post-pilot-daily-set-idempotent' && r.status === 'PASS'),
      'Restart sonrası pack inject idempotent',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'light-pack-cap' && r.status === 'PASS'),
      'Restart sonrası Day 8+ light max 1 pack cap korunur',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'decision-impact-undefined-safe' && r.status === 'PASS'),
      'contentPackMeta undefined crash yaratmaz',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'map-reaction-selected' && r.status !== 'FAIL'),
      'MapReaction restart sonrası selected reaction üretir',
    ),
  );
  record(
    assert(
      checks,
      audit.scenarioResults.some((r) => r.id === 'city-journal-no-duplicate' && r.status === 'PASS'),
      'CityJournal duplicate entry üretmez',
    ),
  );

  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('eventPool'), 'MapScreen eventPool wiring'));
  record(assert(checks, readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('eventPool'), 'DecisionResultScreen eventPool wiring'));
  record(assert(checks, readRepo('src/features/hub/screens/HubScreen.tsx').includes('postPilotCatalog'), 'HubScreen postPilotCatalog wiring'));
  record(assert(checks, readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationWiring.ts').includes('postPilotCatalog'), 'resolveContentPackMeta postPilotCatalog'));
  record(assert(checks, readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationWiring.ts').includes('mergeContentPackLookupCards'), 'mergeContentPackLookupCards helper'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('offlineResume'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/core/game/generateDailyEventSet.ts').includes('offlineResume'), 'generateDailyEventSet değişmedi'));
  record(assert(checks, SAVE_VERSION === OFFLINE_RESUME_EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi'));
  record(assert(checks, existsSync(join(REPO_ROOT, OFFLINE_RESUME_DOCS_PATH)), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:offline-resume'), 'package.json script var'));

  record(
    assert(
      checks,
      audit.overallHealth === 'PASS' || audit.overallHealth === 'WARN',
      `Audit overall ${audit.overallHealth}`,
      `Audit overall ${audit.overallHealth}`,
    ),
  );

  checks.push(
    `Summary: ${summary.pass} PASS, ${summary.warn} WARN, ${summary.fail} FAIL, ${summary.blocker} BLOCKER`,
  );

  return { ok, checks };
}
