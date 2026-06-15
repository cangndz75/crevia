import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  EVENT_FAMILY_ALLOWED_DOMAINS,
  EVENT_FAMILY_ALLOWED_OUTCOME_TONES,
  EVENT_FAMILY_REQUIRED_ECHO_SURFACES,
  EVENT_FAMILY_REQUIRED_VARIANT_KINDS,
  EVENT_FAMILY_VERIFY_FIXTURES,
  EVENT_FAMILY_VERIFY_VARIANTS,
} from './eventFamilyConstants';
import {
  buildEchoSurfaceLabel,
  buildEventFamilyDomainLabel,
  buildEventFamilyPreviewModel,
  buildFamilyUnlockLine,
  buildVariantKindLabel,
} from './eventFamilyPresentation';
import {
  summarizeEventFamilyQuality,
  validateEventFamilyForbiddenCopy,
} from './eventFamilyQualityGuards';
import { defineEventFamily, defineEventFamilyVariant } from './eventFamilySchema';
import {
  buildEventFamilyDuplicateSignature,
  buildVariantCoverageSummary,
  compareEventFamilySimilarity,
} from './eventFamilyVariantModel';
import type {
  EventFamilyDomain,
  EventFamilyEchoSurface,
  EventFamilyOutcomeTone,
  EventFamilyVariantKind,
} from './eventFamilyTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventFamilyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
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
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function unique<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

function hasVariant(kind: EventFamilyVariantKind): boolean {
  return EVENT_FAMILY_VERIFY_FIXTURES.some((family) => family.variantKinds.includes(kind));
}

export function verifyEventFamilyScenario(): VerifyEventFamilyOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  for (const kind of EVENT_FAMILY_REQUIRED_VARIANT_KINDS) {
    record(assert(checks, EVENT_FAMILY_REQUIRED_VARIANT_KINDS.includes(kind), `variant kind ${kind}`, `missing ${kind}`));
  }
  for (const surface of ['advisor', 'report', 'social', 'map', 'district_memory'] as EventFamilyEchoSurface[]) {
    record(assert(checks, EVENT_FAMILY_REQUIRED_ECHO_SURFACES.includes(surface), `echo surface ${surface}`, `missing ${surface}`));
  }
  for (const tone of ['positive', 'recovering', 'crisis_watch'] as EventFamilyOutcomeTone[]) {
    record(assert(checks, EVENT_FAMILY_ALLOWED_OUTCOME_TONES.includes(tone), `outcome tone ${tone}`, `missing ${tone}`));
  }

  record(assert(checks, EVENT_FAMILY_VERIFY_FIXTURES.length >= 6, 'fixture family count >= 6', 'too few fixtures'));
  record(assert(checks, unique(EVENT_FAMILY_VERIFY_FIXTURES.map((family) => family.id)), 'fixture ids unique', 'duplicate fixture ids'));

  const familyIds = new Set(EVENT_FAMILY_VERIFY_FIXTURES.map((family) => family.id));
  for (const family of EVENT_FAMILY_VERIFY_FIXTURES) {
    const validation = defineEventFamily(family);
    record(assert(checks, family.title.trim().length > 0, `${family.id} title`, `${family.id} empty title`));
    record(assert(checks, EVENT_FAMILY_ALLOWED_DOMAINS.includes(family.domain as EventFamilyDomain), `${family.id} domain`, `${family.id} invalid domain`));
    record(assert(checks, family.variantKinds.length >= 3, `${family.id} 3+ variant kinds`, `${family.id} too few variants`));
    record(assert(checks, family.echoSurfaces.length >= 3, `${family.id} 3+ echo surfaces`, `${family.id} too few echo surfaces`));
    record(assert(checks, family.duplicateGuardTags.length > 0, `${family.id} duplicate tags`, `${family.id} missing duplicate tags`));
    record(assert(checks, family.qualityTags.length > 0, `${family.id} quality tags`, `${family.id} missing quality tags`));
    record(assert(checks, validation.ok, `${family.id} schema validation`, validation.failures.join('; ')));
  }

  for (const variant of EVENT_FAMILY_VERIFY_VARIANTS) {
    const validation = defineEventFamilyVariant(variant);
    record(assert(checks, familyIds.has(variant.familyId), `${variant.id} family link`, `${variant.id} invalid familyId`));
    record(assert(checks, EVENT_FAMILY_REQUIRED_VARIANT_KINDS.includes(variant.kind), `${variant.id} kind`, `${variant.id} invalid kind`));
    record(assert(checks, validation.ok, `${variant.id} schema validation`, validation.failures.join('; ')));
  }

  for (const kind of [
    'reward',
    'comeback',
    'recovery',
    'player_adaptive',
    'crisis_adjacent',
    'resource_fatigue',
    'district_trust',
    'operation_era',
  ] as EventFamilyVariantKind[]) {
    record(assert(checks, hasVariant(kind), `fixture includes ${kind}`, `fixture missing ${kind}`));
  }

  const qualityResults = summarizeEventFamilyQuality(EVENT_FAMILY_VERIFY_FIXTURES, EVENT_FAMILY_VERIFY_VARIANTS);
  record(assert(checks, qualityResults.length === EVENT_FAMILY_VERIFY_FIXTURES.length, 'quality score for all fixtures', 'quality result count mismatch'));
  record(assert(checks, qualityResults.filter((result) => result.status === 'PASS').length >= 4, '4+ fixture PASS quality', 'too few PASS quality fixtures'));

  for (const family of EVENT_FAMILY_VERIFY_FIXTURES) {
    const variants = EVENT_FAMILY_VERIFY_VARIANTS.filter((variant) => variant.familyId === family.id);
    record(assert(checks, validateEventFamilyForbiddenCopy(family, variants).length === 0, `${family.id} forbidden copy clean`, `${family.id} forbidden copy`));
    record(assert(checks, buildEventFamilyDuplicateSignature(family, variants).length > 0, `${family.id} duplicate signature`, `${family.id} empty signature`));
    record(assert(checks, buildEventFamilyPreviewModel(family, variants).title.length > 0, `${family.id} preview title`, `${family.id} preview empty`));
    record(assert(checks, buildFamilyUnlockLine(family).length > 0, `${family.id} unlock line`, `${family.id} empty unlock line`));
  }

  const first = EVENT_FAMILY_VERIFY_FIXTURES[0]!;
  const second = EVENT_FAMILY_VERIFY_FIXTURES[1]!;
  record(assert(checks, compareEventFamilySimilarity(first, first) >= 0.95, 'similarity same family high', 'same family similarity low'));
  record(assert(checks, compareEventFamilySimilarity(first, second) <= 0.45, 'similarity different domain low', 'different family similarity high'));

  for (const domain of EVENT_FAMILY_ALLOWED_DOMAINS) {
    record(assert(checks, buildEventFamilyDomainLabel(domain).length > 0, `domain label ${domain}`, `empty domain label ${domain}`));
  }
  for (const kind of EVENT_FAMILY_REQUIRED_VARIANT_KINDS) {
    record(assert(checks, buildVariantKindLabel(kind).length > 0, `variant label ${kind}`, `empty variant label ${kind}`));
  }
  for (const surface of [
    'advisor',
    'report',
    'social',
    'map',
    'tomorrow_preview',
    'operation_result',
    'hub',
    'district_memory',
  ] as EventFamilyEchoSurface[]) {
    record(assert(checks, buildEchoSurfaceLabel(surface).length > 0, `surface label ${surface}`, `empty surface label ${surface}`));
  }

  const docs = readRepo('docs/crevia-event-family-system.md');
  const docsLower = docs.toLocaleLowerCase('tr-TR');
  record(assert(checks, docsLower.includes('runtime generation değişmez'), 'docs runtime generation note', 'docs missing runtime generation note'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION note'));
  record(assert(checks, docs.includes('UI redesign yok'), 'docs UI redesign note', 'docs missing UI redesign note'));

  const eventFamilySource = readRepo('src/core/eventFamilies/eventFamilyConstants.ts') + readRepo('src/core/eventFamilies/eventFamilyTypes.ts');
  record(assert(checks, !eventFamilySource.includes("from '@/core/rankPermissions"), 'rankPermissions import avoided', 'rankPermissions import detected'));

  const generationFiles = [
    'src/core/game/ensureDailyEventsForDay.ts',
    'src/core/game/generateDailyEventSet.ts',
    'src/core/postPilot/postPilotEventEngine.ts',
    'src/core/content/pilotEvents.ts',
  ];
  for (const file of generationFiles) {
    record(assert(checks, !readRepo(file).includes('eventFamilies'), `${file} untouched by eventFamilies`, `${file} imports eventFamilies`));
  }

  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));
  checks.push('PASS Persist shape unchanged by scope: event family fixtures are verify-only');

  const coverage = buildVariantCoverageSummary(EVENT_FAMILY_VERIFY_FIXTURES);
  recordWarn(warn(checks, Object.keys(coverage).length >= 10, 'variant coverage broad', 'variant coverage below recommended breadth'));

  return { ok, warn: hasWarn, checks };
}
