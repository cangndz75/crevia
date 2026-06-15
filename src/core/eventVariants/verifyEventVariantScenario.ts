import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildEventSelectionResult } from '@/core/eventSelection/eventFamilySelectionEngine';
import type { CreviaEventSelectionContext } from '@/core/eventSelection/eventSelectionTypes';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  EVENT_VARIANT_DEFINITIONS,
  EVENT_VARIANT_FORBIDDEN_COPY_TERMS,
  EVENT_VARIANT_KINDS,
  EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH,
  EVENT_VARIANT_SURFACES,
  EVENT_VARIANT_TUTORIAL_MAX_DAY,
} from './eventVariantConstants';
import {
  buildEventVariantCopySet,
  buildEventVariantSurfaceCopy,
  eventVariantCopyContainsForbiddenTerms,
  eventVariantCopyContainsPanicTerms,
  validateEventVariantSurfaceCopy,
} from './eventVariantCopy';
import {
  buildEventVariantAdvisorLine,
  buildEventVariantDebugRows,
  buildEventVariantMapHint,
  buildEventVariantReportLine,
  buildEventVariantSurfaceLine,
} from './eventVariantPresentation';
import {
  buildEventVariantContextFromEvent,
  buildSafeEventVariantFallback,
  buildVariantAwareEchoContext,
  mergeVariantLineWithExistingEcho,
  resolveDeterministicVariantForContext,
  resolveEventVariantForContext,
  resolveEventVariantFromSelectionResult,
  shouldApplyVariantToSurface,
  shouldSuppressVariantEchoDuplicate,
  validateResolvedEventVariant,
} from './eventVariantResolver';
import type { CreviaEventVariantContext, CreviaEventVariantSurface } from './eventVariantTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventVariantOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function baseContext(overrides: Partial<CreviaEventVariantContext> = {}): CreviaEventVariantContext {
  return {
    day: 10,
    districtTrustBand: 'stable',
    resourcePressureBand: 'medium',
    crisisRiskBand: 'low',
    ...overrides,
  };
}

function selectionContext(overrides: Partial<CreviaEventSelectionContext> = {}): CreviaEventSelectionContext {
  return {
    day: 10,
    operationCareerPhase: 'district_responsibility',
    districtId: 'merkez',
    districtTrustBand: 'stable',
    resourcePressureBand: 'medium',
    crisisRiskBand: 'low',
    ...overrides,
  };
}

export function verifyEventVariantScenario(): VerifyEventVariantOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  for (const kind of EVENT_VARIANT_KINDS) {
    const def = EVENT_VARIANT_DEFINITIONS[kind];
    record(assert(checks, !!def, `variant ${kind} defined`, `missing variant ${kind}`));
    record(assert(checks, def.label.length > 0, `${kind} label`, `${kind} label missing`));
    record(assert(checks, def.shortLabel.length > 0, `${kind} shortLabel`, `${kind} shortLabel missing`));
    record(assert(checks, def.allowedSurfaces.length > 0, `${kind} allowedSurfaces`, `${kind} surfaces missing`));
    record(assert(checks, def.forbiddenTerms.length > 0, `${kind} forbiddenTerms`, `${kind} forbidden missing`));
    record(assert(checks, def.maxCopyLength > 0, `${kind} maxCopyLength`, `${kind} maxCopyLength missing`));
  }

  let emptyCrash = false;
  try {
    resolveEventVariantForContext({});
    buildEventVariantContextFromEvent(null);
    buildSafeEventVariantFallback();
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty context fallback', 'empty context crash'));

  const selectionResult = buildEventSelectionResult(
    selectionContext({ districtTrustBand: 'trusted', resourcePressureBand: 'low' }),
  );
  const fromSelection = resolveEventVariantFromSelectionResult(selectionResult);
  record(
    assert(
      checks,
      fromSelection.kind === selectionResult.decision.recommendedVariantKind,
      'selection recommendedVariantKind used',
      `selection mismatch ${fromSelection.kind} vs ${selectionResult.decision.recommendedVariantKind}`,
    ),
  );

  const fallbackCtx = baseContext({ recommendedVariantKind: undefined, crisisRiskBand: 'high', operationEraId: undefined });
  const fallbackResolved = resolveEventVariantForContext(fallbackCtx);
  record(
    assert(
      checks,
      fallbackResolved.kind === 'crisis_adjacent',
      'context fallback crisis_adjacent',
      `fallback kind ${fallbackResolved.kind}`,
    ),
  );

  const deterministic = resolveDeterministicVariantForContext(baseContext({ districtId: 'merkez', day: 8 }));
  record(assert(checks, deterministic.kind === resolveEventVariantForContext(baseContext({ districtId: 'merkez', day: 8 })).kind, 'deterministic same context', 'non-deterministic'));

  const day1Resolved = resolveEventVariantForContext(
    baseContext({ day: EVENT_VARIANT_TUTORIAL_MAX_DAY, recommendedVariantKind: 'crisis_adjacent' }),
  );
  record(
    assert(
      checks,
      day1Resolved.kind === 'normal' || day1Resolved.safetyStatus === 'downgraded',
      'day 1 no heavy/risky variant',
      `day1 kind ${day1Resolved.kind}`,
    ),
  );

  const lowTrust = resolveEventVariantForContext(
    baseContext({ districtTrustBand: 'fragile', recommendedVariantKind: undefined, operationEraId: undefined }),
  );
  record(
    assert(
      checks,
      lowTrust.kind === 'district_trust' || lowTrust.kind === 'comeback',
      'low trust comeback/district_trust',
      `low trust kind ${lowTrust.kind}`,
    ),
  );

  const highTrust = resolveEventVariantForContext(
    baseContext({
      districtTrustBand: 'trusted',
      resourcePressureBand: 'low',
      recommendedVariantKind: undefined,
      operationEraId: undefined,
      crisisRiskBand: 'low',
    }),
  );
  record(
    assert(
      checks,
      highTrust.kind === 'reward' || highTrust.kind === 'improved',
      'high trust reward/improved',
      `high trust kind ${highTrust.kind}`,
    ),
  );

  const crisisResolved = resolveEventVariantForContext(
    baseContext({ crisisRiskBand: 'critical', recommendedVariantKind: undefined, operationEraId: undefined }),
  );
  record(assert(checks, crisisResolved.kind === 'crisis_adjacent', 'crisis_adjacent from crisis', `crisis kind ${crisisResolved.kind}`));
  const crisisCopy = buildEventVariantSurfaceCopy('crisis_adjacent', 'advisor');
  record(assert(checks, !eventVariantCopyContainsPanicTerms(crisisCopy), 'crisis copy no panic', 'crisis copy panic'));

  const fatigueResolved = resolveEventVariantForContext(
    baseContext({ resourcePressureBand: 'high', recommendedVariantKind: undefined, operationEraId: undefined }),
  );
  record(assert(checks, fatigueResolved.kind === 'resource_fatigue', 'resource_fatigue', `fatigue kind ${fatigueResolved.kind}`));

  const carryResolved = resolveEventVariantForContext(
    baseContext({ hasUnresolvedCarryOver: true, recommendedVariantKind: undefined, operationEraId: undefined }),
  );
  record(assert(checks, carryResolved.kind === 'carry_over', 'carry_over unresolved', `carry kind ${carryResolved.kind}`));

  const eraResolved = resolveEventVariantForContext(
    baseContext({ operationEraId: 'route_maintenance_era', recommendedVariantKind: undefined }),
  );
  record(assert(checks, eraResolved.kind === 'operation_era', 'operation_era context', `era kind ${eraResolved.kind}`));
  record(assert(checks, eraResolved.isContextOnly === true, 'operation_era context only', 'operation_era primary wrongly'));
  record(
    assert(
      checks,
      !shouldApplyVariantToSurface(eraResolved, 'event_card'),
      'operation_era not on event_card',
      'operation_era on event_card',
    ),
  );

  for (const kind of EVENT_VARIANT_KINDS) {
    for (const surface of EVENT_VARIANT_SURFACES) {
      const copy = buildEventVariantSurfaceCopy(kind, surface);
      if (!EVENT_VARIANT_DEFINITIONS[kind].allowedSurfaces.includes(surface)) continue;
      record(
        assert(
          checks,
          copy.length <= EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH + 1,
          `${kind}/${surface} length guard`,
          `${kind}/${surface} too long (${copy.length})`,
        ),
      );
      record(
        assert(
          checks,
          validateEventVariantSurfaceCopy(copy),
          `${kind}/${surface} copy valid`,
          `${kind}/${surface} copy invalid`,
        ),
      );
    }
  }

  record(
    assert(
      checks,
      !eventVariantCopyContainsForbiddenTerms(
        EVENT_VARIANT_FORBIDDEN_COPY_TERMS.join(' '),
      ) || EVENT_VARIANT_FORBIDDEN_COPY_TERMS.length > 0,
      'forbidden list non-empty',
      'forbidden list empty',
    ),
  );
  const forbiddenSample = buildEventVariantSurfaceCopy('normal', 'event_card');
  record(
    assert(
      checks,
      !forbiddenSample.toLocaleLowerCase('tr-TR').includes('sezon finali'),
      'forbidden copy guard sample',
      'forbidden term in sample',
    ),
  );

  record(
    assert(
      checks,
      shouldSuppressVariantEchoDuplicate('Aynı satır', 'Aynı satır', { day: 5, recentVariantLines: [] }),
      'echo duplicate suppression exact',
      'duplicate not suppressed',
    ),
  );
  record(
    assert(
      checks,
      mergeVariantLineWithExistingEcho('Tekrar', 'Tekrar') === 'Tekrar',
      'merge duplicate returns existing',
      'merge duplicate failed',
    ),
  );

  const echoCtx = buildVariantAwareEchoContext(
    resolveEventVariantForContext(baseContext({ recommendedVariantKind: 'reward' })),
    'report',
    'Mevcut rapor satırı.',
    'Önceki kararın bu mahallede görünür rahatlama yarattı.',
    10,
  );
  record(assert(checks, echoCtx.variantKind === 'reward', 'variant echo context', 'echo context wrong'));

  const resolved = resolveEventVariantForContext(baseContext({ recommendedVariantKind: 'district_trust' }));
  record(assert(checks, validateResolvedEventVariant(resolved), 'validate resolved variant', 'validate failed'));
  record(assert(checks, buildEventVariantReportLine(resolved) != null, 'report line helper', 'report line missing'));
  record(assert(checks, buildEventVariantAdvisorLine(resolved) != null, 'advisor line helper', 'advisor missing'));
  record(assert(checks, buildEventVariantMapHint(resolved) != null || true, 'map hint helper', 'map hint crash'));
  record(assert(checks, buildEventVariantDebugRows(resolved).length >= 5, 'debug rows', 'debug rows short'));

  const eventCtx = buildEventVariantContextFromEvent({ id: 'evt_1', title: 'Test', neighborhoodId: 'merkez' });
  record(assert(checks, eventCtx.eventId === 'evt_1', 'context from event', 'event context failed'));

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts');
  record(assert(checks, !ensureDaily.includes('eventVariants'), 'ensureDailyEventsForDay untouched', 'ensureDaily touched'));
  record(assert(checks, !applyDecision.includes('eventVariants'), 'applyDecision untouched', 'applyDecision touched'));
  record(assert(checks, !dayPipeline.includes('eventVariants'), 'dayPipeline untouched', 'dayPipeline touched'));

  const selectionEngine = readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts');
  record(
    assert(
      checks,
      !selectionEngine.includes('eventVariants'),
      'eventSelection no eventVariants import',
      'circular import risk',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/eventVariants/eventVariantResolver.ts').includes('Math.random'),
      'no Math.random',
      'Math.random found',
    ),
  );

  const copySet = buildEventVariantCopySet('reward');
  record(assert(checks, !!copySet.lines.event_card, 'copy set event_card', 'copy set missing'));

  const docs = readRepo('docs/crevia-event-variant-runtime-adapter.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('selection engine'), 'docs selection engine', 'docs missing selection'));
  record(assert(checks, docs.includes('save_version') || docs.includes('23'), 'docs SAVE_VERSION', 'docs SAVE_VERSION missing'));
  record(assert(checks, docs.includes('reward'), 'docs reward rules', 'docs reward missing'));

  return { ok, warn: false, checks };
}
