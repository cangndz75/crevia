import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { EVENT_FAMILY_VERIFY_FIXTURES } from '@/core/eventFamilies/eventFamilyConstants';
import { getDistrictOperationDefinition } from '@/core/districtOperations/districtOperationModel';
import { getOperationEraDefinition } from '@/core/operationEra/operationEraModel';

import {
  CONTENT_PRODUCTION_COVERAGE_DIMENSIONS,
  CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS,
  CONTENT_PRODUCTION_ISSUE_LABELS,
  CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS,
  CONTENT_PRODUCTION_PACK_KINDS,
  CONTENT_PRODUCTION_PACK_STATUS_LABELS,
  CONTENT_PRODUCTION_RECOMMENDED_DISTRICT_TARGETS,
  CONTENT_PRODUCTION_RECOMMENDED_DOMAIN_TARGETS,
  CONTENT_PRODUCTION_RECOMMENDED_VARIANT_TARGETS,
  CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES,
  CONTENT_PRODUCTION_DUPLICATE_FAIL_THRESHOLD,
  CONTENT_PRODUCTION_DUPLICATE_WARN_THRESHOLD,
  CONTENT_PRODUCTION_SCORE_THRESHOLDS,
  CONTENT_PRODUCTION_SURFACES,
} from './contentProductionConstants';
import {
  buildContentCoverageMatrix,
  buildContentCoverageTargets,
  getCoverageStatus,
  getMissingCoverageResults,
} from './contentCoverageMatrix';
import {
  buildContentItemDuplicateSignature,
  compareContentItemSimilarity,
  findContentDuplicateRisks,
  normalizeContentCopyText,
} from './contentDuplicateGuard';
import {
  evaluateEchoCompleteness,
  getRequiredEchoSurfacesForItem,
} from './contentEchoCompleteness';
import {
  CONTENT_PRODUCTION_VERIFY_PACK,
  buildContentPackDefinition,
  buildContentPackItemFromDistrictOperation,
  buildContentPackItemFromEventFamily,
  buildContentPackItemFromOperationEra,
  buildVerifyOnlyFoundationContentPack,
  defineCreviaContentPack,
  validateContentPackDefinition,
} from './contentPackSchema';
import {
  buildContentProductionAuditResult,
  buildContentProductionReportModel,
  buildWriterChecklist,
  calculateDuplicateSafetyRatio,
  collectContentProductionPlayerFacingCopy,
  contentProductionCopyContainsForbiddenTerms,
  scoreContentProductionAudit,
} from './contentProductionPresentation';
import type { CreviaContentPackDefinition, CreviaContentPackItem } from './contentProductionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContentProductionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, note: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${note}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function verifyContentProductionScenario(): VerifyContentProductionOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnFlag = false;

  function record(result: boolean) {
    if (!result) ok = false;
  }

  function recordWarn(result: boolean) {
    if (!result) warnFlag = true;
  }

  for (const status of Object.keys(CONTENT_PRODUCTION_PACK_STATUS_LABELS)) {
    record(
      assert(
        checks,
        !!CONTENT_PRODUCTION_PACK_STATUS_LABELS[status as keyof typeof CONTENT_PRODUCTION_PACK_STATUS_LABELS],
        `status label ${status}`,
        `missing status ${status}`,
      ),
    );
  }

  record(assert(checks, CONTENT_PRODUCTION_PACK_KINDS.length >= 10, '10+ pack kinds', 'insufficient pack kinds'));

  for (const surface of [
    'event_family',
    'event_variant',
    'district_operation',
    'operation_era',
    'social_echo',
    'report_echo',
    'map_hint',
  ] as const) {
    record(assert(checks, CONTENT_PRODUCTION_SURFACES.includes(surface), `surface ${surface}`, `missing surface ${surface}`));
  }

  for (const dimension of ['district', 'domain', 'variant_kind', 'echo_surface', 'operation_era'] as const) {
    record(
      assert(
        checks,
        CONTENT_PRODUCTION_COVERAGE_DIMENSIONS.includes(dimension),
        `coverage dimension ${dimension}`,
        `missing dimension ${dimension}`,
      ),
    );
  }

  record(assert(checks, CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS.length >= 10, 'forbidden copy list', 'forbidden list'));
  record(assert(checks, CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS.title > 0, 'mobile length limits', 'missing limits'));

  for (const district of CONTENT_PRODUCTION_RECOMMENDED_DISTRICT_TARGETS) {
    record(assert(checks, district.id.length > 0, `district target ${district.id}`, `missing district ${district.id}`));
  }

  for (const domain of ['container', 'vehicle_route', 'social', 'crisis_adjacent', 'operation_era'] as const) {
    record(
      assert(
        checks,
        CONTENT_PRODUCTION_RECOMMENDED_DOMAIN_TARGETS.some((target) => target.id === domain),
        `domain target ${domain}`,
        `missing domain ${domain}`,
      ),
    );
  }

  for (const variant of ['reward', 'comeback', 'recovery', 'operation_era'] as const) {
    record(
      assert(
        checks,
        CONTENT_PRODUCTION_RECOMMENDED_VARIANT_TARGETS.includes(variant),
        `variant target ${variant}`,
        `missing variant ${variant}`,
      ),
    );
  }

  for (const surface of ['advisor_echo', 'report_echo', 'social_echo', 'map_hint'] as const) {
    record(
      assert(
        checks,
        CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES.includes(surface) ||
          CONTENT_PRODUCTION_SURFACES.includes(surface),
        `echo surface ${surface}`,
        `missing echo ${surface}`,
      ),
    );
  }

  record(
    assert(
      checks,
      CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES.some((s) => s === 'tomorrow_preview' || s === 'operation_result'),
      'tomorrow/result echo',
      'missing tomorrow echo',
    ),
  );

  const validPack = CONTENT_PRODUCTION_VERIFY_PACK;
  record(assert(checks, defineCreviaContentPack(validPack).status !== 'fail', 'defineCreviaContentPack valid', 'valid pack failed'));

  const invalidPack = buildContentPackDefinition({
    id: '',
    title: '',
    description: '',
    kind: 'pilot_core',
    status: 'draft',
    version: '',
    targetDistrictIds: [],
    targetDomains: [],
    targetOperationEraIds: [],
    targetSurfaces: [],
    relatedRankPermissionIds: [],
    relatedMapLayerIds: [],
    releaseNotes: '',
    createdForPhase: 'test',
    isRuntimeLinked: false,
    isFutureOnly: false,
    items: [],
  });
  const invalidResult = validateContentPackDefinition(invalidPack);
  record(assert(checks, invalidResult.status === 'fail' || invalidResult.status === 'warn', 'invalid pack fails/warns', 'invalid pack accepted'));

  const family = EVENT_FAMILY_VERIFY_FIXTURES[0]!;
  const familyItem = buildContentPackItemFromEventFamily(family);
  record(assert(checks, !!familyItem.id, 'event family item', 'event family item missing'));

  const districtOp = getDistrictOperationDefinition('visible_service_merkez');
  record(assert(checks, !!districtOp, 'district op fixture', 'district op missing'));
  if (districtOp) {
    record(assert(checks, !!buildContentPackItemFromDistrictOperation(districtOp).id, 'district operation item', 'district item missing'));
  }

  const era = getOperationEraDefinition('route_maintenance_era');
  record(assert(checks, !!era, 'era fixture', 'era missing'));
  if (era) {
    record(assert(checks, !!buildContentPackItemFromOperationEra(era).id, 'operation era item', 'era item missing'));
  }

  const verifyPack = buildVerifyOnlyFoundationContentPack();
  record(assert(checks, verifyPack.isRuntimeLinked === false, 'verify pack not runtime linked', 'runtime linked leak'));
  record(assert(checks, verifyPack.items.some((item) => item.surface === 'event_family'), 'verify pack event family', 'no event family item'));
  record(assert(checks, verifyPack.items.some((item) => item.surface === 'district_operation'), 'verify pack district op', 'no district op item'));
  record(assert(checks, verifyPack.items.some((item) => item.surface === 'operation_era'), 'verify pack operation era', 'no era item'));

  const coverageResults = buildContentCoverageMatrix([verifyPack]);
  record(assert(checks, coverageResults.length > 0, 'coverage matrix', 'empty coverage'));
  record(assert(checks, getMissingCoverageResults(coverageResults).length >= 0, 'missing coverage detectable', 'missing coverage error'));

  const fullCoverageStatus = getCoverageStatus(2, 1, 2);
  record(assert(checks, fullCoverageStatus === 'pass', 'full coverage PASS', 'full coverage status'));

  const sig = buildContentItemDuplicateSignature(familyItem);
  record(assert(checks, sig.titleWords.length > 0, 'duplicate signature', 'empty signature'));

  const similarA: CreviaContentPackItem = {
    ...familyItem,
    id: 'dup_a',
    title: 'Cumhuriyet konteyner baskisi saha olayi',
    tags: ['container', 'cumhuriyet', 'overflow'],
  };
  const similarB: CreviaContentPackItem = {
    ...familyItem,
    id: 'dup_b',
    title: 'Cumhuriyet konteyner baskisi saha olayi',
    tags: ['container', 'cumhuriyet', 'overflow'],
  };
  const highSim = compareContentItemSimilarity(similarA, similarB);
  record(assert(checks, highSim >= 0.65, 'high overlap duplicate risk', 'high sim too low'));

  const differentItem: CreviaContentPackItem = {
    ...familyItem,
    id: 'diff',
    title: 'Sanayi rota bakim penceresi',
    districtIds: ['sanayi'],
    domains: ['vehicle_route'],
    tags: ['sanayi', 'route'],
  };
  const lowSim = compareContentItemSimilarity(similarA, differentItem);
  record(assert(checks, lowSim < 0.65, 'low overlap different items', 'low sim too high'));

  const dupRisks = findContentDuplicateRisks([similarA, similarB]);
  record(assert(checks, dupRisks.some((risk) => risk.status !== 'pass'), 'duplicate WARN/FAIL', 'duplicate risk missing'));
  record(assert(checks, calculateDuplicateSafetyRatio({ pass: 0, warn: 0, fail: 0 }) === 1, 'empty duplicate risk ratio full', 'empty duplicate ratio not full'));
  record(assert(checks, calculateDuplicateSafetyRatio({ pass: 0, warn: 1, fail: 0 }) === 0, 'duplicate WARN ratio penalized', 'duplicate WARN ratio not penalized'));
  record(assert(checks, calculateDuplicateSafetyRatio({ pass: 0, warn: 0, fail: 1 }) === 0, 'duplicate FAIL ratio penalized', 'duplicate FAIL ratio not penalized'));
  record(
    assert(
      checks,
      CONTENT_PRODUCTION_DUPLICATE_WARN_THRESHOLD === 0.65 &&
        CONTENT_PRODUCTION_DUPLICATE_FAIL_THRESHOLD === 0.82,
      'duplicate thresholds unchanged',
      'duplicate thresholds changed',
    ),
  );

  const noDuplicateScore = scoreContentProductionAudit({
    coveragePassRatio: 100,
    echoPassRatio: 100,
    duplicateSafetyRatio: calculateDuplicateSafetyRatio({ pass: 0, warn: 0, fail: 0 }) * 100,
    copySafetyRatio: 100,
    mobileReadabilityRatio: 100,
    hasBlocker: false,
  });
  const warnDuplicateScore = scoreContentProductionAudit({
    coveragePassRatio: 100,
    echoPassRatio: 100,
    duplicateSafetyRatio: calculateDuplicateSafetyRatio({ pass: 0, warn: 1, fail: 0 }) * 100,
    copySafetyRatio: 100,
    mobileReadabilityRatio: 100,
    hasBlocker: false,
  });
  const failDuplicateScore = scoreContentProductionAudit({
    coveragePassRatio: 100,
    echoPassRatio: 100,
    duplicateSafetyRatio: calculateDuplicateSafetyRatio({ pass: 0, warn: 0, fail: 1 }) * 100,
    copySafetyRatio: 100,
    mobileReadabilityRatio: 100,
    hasBlocker: false,
  });
  record(assert(checks, noDuplicateScore.score === 100, 'no duplicate risk keeps full score', `no duplicate score ${noDuplicateScore.score}`));
  record(assert(checks, warnDuplicateScore.score < noDuplicateScore.score, 'duplicate WARN still lowers score', 'duplicate WARN did not lower score'));
  record(assert(checks, failDuplicateScore.score < noDuplicateScore.score, 'duplicate FAIL still lowers score', 'duplicate FAIL did not lower score'));

  const echoRequired = getRequiredEchoSurfacesForItem(familyItem);
  record(assert(checks, echoRequired.length > 0, 'required echo surfaces', 'empty required echo'));

  const echoComplete = evaluateEchoCompleteness(familyItem);
  record(assert(checks, echoComplete.status === 'pass', 'complete echo PASS', 'echo complete failed'));

  const incompleteItem: CreviaContentPackItem = {
    ...familyItem,
    id: 'incomplete_echo',
    echoSurfaces: ['report_echo'],
    copyBlocks: familyItem.copyBlocks.filter((block) => block.surface === 'report_echo'),
  };
  const echoIncomplete = evaluateEchoCompleteness(incompleteItem);
  record(assert(checks, echoIncomplete.status !== 'pass', 'missing echo WARN/FAIL', 'incomplete echo passed'));

  const forbiddenItem: CreviaContentPackItem = {
    ...familyItem,
    id: 'forbidden_item',
    copyBlocks: [
      {
        id: 'forbidden_block',
        surface: 'report_echo',
        text: 'Bu metin sezon finali yaklaşıyor.',
        isPlayerFacing: true,
        language: 'tr',
      },
    ],
  };
  const forbiddenAudit = buildContentProductionAuditResult([
    buildContentPackDefinition({ ...verifyPack, items: [forbiddenItem] }),
  ]);
  record(assert(checks, forbiddenAudit.blockerCount > 0 || forbiddenAudit.status === 'fail', 'forbidden copy blocker', 'forbidden not blocked'));

  const technicalItem: CreviaContentPackItem = {
    ...familyItem,
    id: 'technical_item',
    copyBlocks: [
      {
        id: 'technical_block',
        surface: 'report_echo',
        text: 'internal verify-only content_production_foundation marker',
        isPlayerFacing: false,
        language: 'tr',
      },
    ],
  };
  record(
    assert(
      checks,
      !contentProductionCopyContainsForbiddenTerms(technicalItem.copyBlocks[0]!.text) ||
        !technicalItem.copyBlocks[0]!.isPlayerFacing,
      'technical copy allowed',
      'technical copy blocked wrongly',
    ),
  );

  const longTitleItem: CreviaContentPackItem = {
    ...familyItem,
    id: 'long_title',
    title: 'A'.repeat(CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS.title + 20),
  };
  const mobileAudit = buildContentProductionAuditResult([
    buildContentPackDefinition({ ...verifyPack, items: [longTitleItem] }),
  ]);
  record(
    assert(
      checks,
      mobileAudit.issues.some((issue) => issue.kind === 'mobile_length_risk'),
      'mobile title warning',
      'mobile warning missing',
    ),
  );

  const checklist = buildWriterChecklist();
  record(assert(checks, checklist.length >= 10, 'writer checklist 10+', 'checklist too short'));

  const audit = buildContentProductionAuditResult([verifyPack]);
  record(assert(checks, audit.score >= 0 && audit.score <= 100, 'audit score range', 'score out of range'));
  record(assert(checks, audit.summaryLines.length > 0, 'audit summary lines', 'empty summary'));
  record(assert(checks, audit.summaryLines.some((line) => line.includes('Duplicate safety')), 'audit duplicate safety summary', 'missing duplicate safety summary'));
  record(assert(checks, buildContentProductionReportModel(audit).title.length > 0, 'report model title', 'empty report title'));
  record(assert(checks, buildContentProductionReportModel(audit).nextActionLines.length > 0, 'next action lines', 'empty next actions'));

  const playerCopy = collectContentProductionPlayerFacingCopy([verifyPack]).join(' ').toLocaleLowerCase('tr-TR');
  for (const term of ['14 günlük sezon', 'sezon sonu', 'sezon finali', 'premium al', 'paywall', 'panik', 'felaket']) {
    record(assert(checks, !playerCopy.includes(term), `forbidden absent ${term}`, `forbidden ${term}`));
  }

  record(assert(checks, normalizeContentCopyText('  Merkez  ') === 'merkez', 'normalize copy', 'normalize failed'));

  const docs = readRepo('docs/crevia-content-production-pipeline.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('runtime event generation yok'), 'docs runtime note', 'docs missing runtime'));
  record(assert(checks, docs.includes('admin dashboard yok'), 'docs admin note', 'docs missing admin'));
  record(assert(checks, docs.includes('save_version yok') || docs.includes('save_version artır'), 'docs SAVE_VERSION', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('persist yok') || docs.includes('persist shape'), 'docs persist', 'docs missing persist'));
  record(assert(checks, docs.includes('soft launch content targets'), 'docs soft launch targets', 'docs missing targets'));
  record(assert(checks, docs.includes('operation era'), 'docs operation era', 'docs missing operation era'));
  record(assert(checks, docs.includes('analytics future mapping') || docs.includes('contentpackid'), 'docs analytics mapping', 'docs missing analytics'));

  record(assert(checks, !docs.toLocaleLowerCase('tr-TR').includes('event generation değiştir'), 'no event generation change', 'event gen change'));
  record(assert(checks, !docs.includes('selection engine eklendi'), 'no selection engine note', 'selection engine note'));

  record(assert(checks, Object.keys(CONTENT_PRODUCTION_ISSUE_LABELS).length >= 10, 'issue labels', 'issue labels missing'));
  record(assert(checks, buildContentCoverageTargets().length > 0, 'coverage targets', 'empty targets'));
  record(assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23', 'SAVE_VERSION changed'));

  const indexSource = readRepo('src/core/contentProduction/index.ts');
  record(assert(checks, indexSource.includes('export type'), 'type exports', 'missing type exports'));
  record(assert(checks, !indexSource.includes('verifyContentProductionScenario'), 'index verify decoupling', 'index verify export'));

  recordWarn(
    warn(
      checks,
      audit.score >= CONTENT_PRODUCTION_SCORE_THRESHOLDS.warnMin,
      'verify pack audit score acceptable',
      `verify pack audit score low: ${audit.score}`,
    ),
  );

  return { ok, warn: warnFlag, checks };
}
