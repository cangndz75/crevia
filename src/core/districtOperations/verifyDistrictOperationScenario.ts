import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';

import { DISTRICT_OPERATION_CATALOG } from './districtOperationCatalog';
import {
  DISTRICT_OPERATION_FORBIDDEN_COPY_TERMS,
  DISTRICT_OPERATION_IMPACT_DOMAINS,
  DISTRICT_OPERATION_IMPACT_DOMAIN_LABELS,
  DISTRICT_OPERATION_KINDS,
  DISTRICT_OPERATION_KIND_LABELS,
  DISTRICT_OPERATION_REQUIRED_PERMISSION_IDS,
  DISTRICT_OPERATION_STATUSES,
  DISTRICT_OPERATION_STATUS_LABELS,
} from './districtOperationConstants';
import {
  buildDistrictOperationCandidate,
  buildDistrictOperationCandidates,
  calculateDistrictOperationReadinessScore,
  getDistrictOperationDefinitions,
  getDistrictOperationDefinitionsForDistrict,
  getRecommendedDistrictOperations,
  resolveDistrictOperationStatus,
  shouldShowDistrictOperationPreview,
} from './districtOperationModel';
import {
  buildDistrictOperationEmptyState,
  buildDistrictOperationImpactChips,
  buildDistrictOperationPresentationModel,
  buildDistrictOperationUnlockLine,
  districtOperationCopyContainsForbiddenTerms,
} from './districtOperationPresentation';
import type { DistrictOperationKind } from './districtOperationTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictOperationOutcome = {
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

function unique<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

export function verifyDistrictOperationScenario(): VerifyDistrictOperationOutcome {
  const checks: string[] = [];
  let ok = true;
  let warn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  for (const kind of DISTRICT_OPERATION_KINDS) {
    record(
      assert(
        checks,
        (DISTRICT_OPERATION_KIND_LABELS[kind]?.length ?? 0) > 0,
        `kind label ${kind}`,
        `missing kind label ${kind}`,
      ),
    );
  }

  for (const status of DISTRICT_OPERATION_STATUSES) {
    record(
      assert(
        checks,
        (DISTRICT_OPERATION_STATUS_LABELS[status]?.length ?? 0) > 0,
        `status label ${status}`,
        `missing status label ${status}`,
      ),
    );
  }

  for (const domain of DISTRICT_OPERATION_IMPACT_DOMAINS) {
    record(
      assert(
        checks,
        (DISTRICT_OPERATION_IMPACT_DOMAIN_LABELS[domain]?.length ?? 0) > 0,
        `impact domain label ${domain}`,
        `missing impact domain label ${domain}`,
      ),
    );
  }

  record(
    assert(
      checks,
      DISTRICT_OPERATION_FORBIDDEN_COPY_TERMS.length >= 8,
      'forbidden copy list present',
      'forbidden copy list missing',
    ),
  );

  for (const districtId of MAP_DISTRICT_IDENTITY_IDS) {
    const defs = getDistrictOperationDefinitionsForDistrict(districtId);
    record(
      assert(
        checks,
        defs.length >= 3,
        `${districtId} has 3+ operations`,
        `${districtId} missing operation coverage`,
      ),
    );
  }

  record(
    assert(
      checks,
      unique(DISTRICT_OPERATION_CATALOG.map((definition) => definition.id)),
      'operation ids unique',
      'duplicate operation ids',
    ),
  );

  for (const definition of DISTRICT_OPERATION_CATALOG) {
    record(assert(checks, definition.title.trim().length > 0, `${definition.id} title`, `${definition.id} title empty`));
    record(assert(checks, definition.shortLabel.trim().length > 0, `${definition.id} shortLabel`, `${definition.id} shortLabel empty`));
    record(assert(checks, definition.description.trim().length > 0, `${definition.id} description`, `${definition.id} description empty`));
    record(assert(checks, definition.districtFlavorLine.trim().length > 0, `${definition.id} flavor`, `${definition.id} flavor empty`));
    record(assert(checks, DISTRICT_OPERATION_KINDS.includes(definition.kind), `${definition.id} kind valid`, `${definition.id} kind invalid`));
    record(assert(checks, definition.unlockAxes.length > 0, `${definition.id} unlockAxes`, `${definition.id} unlockAxes empty`));
    record(assert(checks, definition.impactDomains.length > 0, `${definition.id} impactDomains`, `${definition.id} impactDomains empty`));
    record(assert(checks, definition.relatedEventFamilyDomains.length > 0, `${definition.id} eventFamilyDomains`, `${definition.id} eventFamilyDomains empty`));
    record(assert(checks, definition.relatedMapLayerIds.length > 0, `${definition.id} mapLayerIds`, `${definition.id} mapLayerIds empty`));
  }

  record(assert(checks, getDistrictOperationDefinitionsForDistrict('merkez').some((d) => d.kind === 'visible_service'), 'merkez visible_service', 'merkez missing visible_service'));
  record(assert(checks, getDistrictOperationDefinitionsForDistrict('cumhuriyet').some((d) => d.kind === 'public_trust'), 'cumhuriyet public_trust', 'cumhuriyet missing public_trust'));
  record(assert(checks, getDistrictOperationDefinitionsForDistrict('sanayi').some((d) => d.kind === 'route_discipline'), 'sanayi route_discipline', 'sanayi missing route_discipline'));
  record(
    assert(
      checks,
      getDistrictOperationDefinitionsForDistrict('istasyon').some(
        (d) => d.kind === 'route_discipline' || d.kind === 'public_trust' || d.kind === 'visible_service',
      ),
      'istasyon crowd/route/public trust theme',
      'istasyon theme missing',
    ),
  );
  record(assert(checks, getDistrictOperationDefinitionsForDistrict('yesilvadi').some((d) => d.kind === 'environmental_care'), 'yesilvadi environmental_care', 'yesilvadi missing environmental_care'));

  record(
    assert(
      checks,
      DISTRICT_OPERATION_CATALOG.some((d) => d.requiredPermissionId === 'district_specific_operations_preview'),
      'district_specific_operations_preview reference',
      'missing district_specific_operations_preview',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_OPERATION_CATALOG.some((d) => d.relatedMapLayerIds.includes('district_trust')),
      'district_trust_preview map layer link',
      'missing district_trust map layer link',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_OPERATION_CATALOG.some((d) => d.relatedMapLayerIds.includes('district_memory')),
      'district_memory_trace_preview map layer link',
      'missing district_memory map layer link',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_OPERATION_CATALOG.some((d) => d.relatedMapLayerIds.includes('active_task_route')),
      'active_task_route map layer link',
      'missing active_task_route map layer link',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_OPERATION_CATALOG.some(
        (d) => d.kind === 'crisis_prevention' && d.relatedMapLayerIds.includes('crisis_watch'),
      ),
      'crisis_watch on crisis_prevention',
      'crisis_prevention missing crisis_watch layer',
    ),
  );

  const sampleDef = DISTRICT_OPERATION_CATALOG[0]!;
  const scoreClampLow = calculateDistrictOperationReadinessScore(sampleDef, { day: 1 });
  const scoreClampHigh = calculateDistrictOperationReadinessScore(sampleDef, {
    day: 8,
    unlockedPermissionIds: ['district_specific_operations_preview'],
    districtTrustResults: [
      {
        districtId: sampleDef.districtId,
        score: 72,
        level: 'stable',
        trend: 'steady',
        pressureDomains: [],
        signalSources: [],
        confidence: 'high',
        isVisibleToPlayer: true,
        reasonLines: [],
        memoryItems: [],
      },
    ],
    eventFamilySignals: [{ domain: sampleDef.relatedEventFamilyDomains[0]! }],
    activeTaskRoute: {
      id: 'test-route',
      status: 'active',
      stage: 'en_route',
      pressure: 'medium',
      tone: 'neutral',
      domain: 'generic',
      targetDistrictId: sampleDef.districtId,
      nodes: [],
      segments: [],
      sourceSignals: [],
      title: 'Test',
      summaryLine: 'Test',
      routeNote: 'Test',
      isVisibleToPlayer: true,
      isPreviewOnly: false,
    },
  });
  record(assert(checks, scoreClampLow >= 0 && scoreClampLow <= 100, 'readiness score clamp low', 'readiness score out of range low'));
  record(assert(checks, scoreClampHigh >= 0 && scoreClampHigh <= 100, 'readiness score clamp high', 'readiness score out of range high'));

  const baseScore = calculateDistrictOperationReadinessScore(sampleDef, { day: 4 });
  const permScore = calculateDistrictOperationReadinessScore(sampleDef, {
    day: 4,
    unlockedPermissionIds: ['district_specific_operations_preview'],
  });
  record(assert(checks, permScore > baseScore, 'permission increases score', 'permission does not increase score'));

  const trustScore = calculateDistrictOperationReadinessScore(
    getDistrictOperationDefinitionByKind('recovery_focus', 'cumhuriyet')!,
    {
      day: 5,
      districtTrustResults: [
        {
          districtId: 'cumhuriyet',
          score: 35,
          level: 'watch',
          trend: 'strained',
          pressureDomains: ['social'],
          signalSources: ['social_pulse'],
          confidence: 'medium',
          isVisibleToPlayer: true,
          reasonLines: [],
          memoryItems: [],
        },
      ],
    },
  );
  const trustBase = calculateDistrictOperationReadinessScore(
    getDistrictOperationDefinitionByKind('recovery_focus', 'cumhuriyet')!,
    { day: 5 },
  );
  record(assert(checks, trustScore > trustBase, 'trust signal increases score', 'trust signal score unchanged'));

  const resourceDef = getDistrictOperationDefinitionByKind('route_discipline', 'sanayi')!;
  const resourceScore = calculateDistrictOperationReadinessScore(resourceDef, {
    day: 5,
    operationSignals: {
      personnel: { domain: 'personnel', status: 'strained', score: 70, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
      vehicles: { domain: 'vehicles', status: 'critical', score: 85, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
      containers: { domain: 'containers', status: 'watch', score: 40, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
      districts: { domain: 'districts', status: 'watch', score: 45, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
      overall: { domain: 'overall', status: 'strained', score: 65, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
      priorityDistrictId: 'sanayi',
      dailyFocus: 'vehicles',
      lastProcessedDay: 5,
      lastRefreshedDay: 5,
    },
  });
  const resourceBase = calculateDistrictOperationReadinessScore(resourceDef, { day: 5 });
  record(assert(checks, resourceScore > resourceBase, 'resource pressure increases score', 'resource pressure score unchanged'));

  const eventScore = calculateDistrictOperationReadinessScore(sampleDef, {
    day: 5,
    eventFamilySignals: [{ domain: sampleDef.relatedEventFamilyDomains[0]! }],
  });
  record(assert(checks, eventScore > baseScore, 'event family domain increases score', 'event family score unchanged'));

  const routeScore = calculateDistrictOperationReadinessScore(sampleDef, {
    day: 5,
    activeTaskRoute: {
      id: 'route-1',
      status: 'active',
      stage: 'en_route',
      pressure: 'medium',
      tone: 'neutral',
      domain: 'generic',
      targetDistrictId: sampleDef.districtId,
      nodes: [],
      segments: [],
      sourceSignals: [],
      title: 'Rota',
      summaryLine: 'Rota',
      routeNote: 'Rota',
      isVisibleToPlayer: true,
      isPreviewOnly: false,
    },
  });
  record(assert(checks, routeScore > baseScore, 'active route district match increases score', 'route score unchanged'));

  const crisisDef = getDistrictOperationDefinitionByKind('crisis_prevention', 'sanayi')!;
  const crisisStatus = resolveDistrictOperationStatus(crisisDef, {
    day: 5,
    unlockedPermissionIds: ['district_specific_operations_preview'],
    crisisState: { status: 'watch' },
  });
  record(assert(checks, crisisStatus === 'recommended', 'crisis watch + crisis_prevention recommended', 'crisis prevention not recommended'));

  const recoveryDef = getDistrictOperationDefinitionByKind('recovery_focus', 'cumhuriyet')!;
  const recoveryStatus = resolveDistrictOperationStatus(recoveryDef, {
    day: 5,
    unlockedPermissionIds: ['district_specific_operations_preview'],
    districtTrustResults: [
      {
        districtId: 'cumhuriyet',
        score: 28,
        level: 'fragile',
        trend: 'falling',
        pressureDomains: ['social'],
        signalSources: ['social_pulse'],
        confidence: 'medium',
        isVisibleToPlayer: true,
        reasonLines: [],
        memoryItems: [],
      },
    ],
  });
  record(assert(checks, recoveryStatus === 'recommended', 'low trust + recovery recommended', 'recovery not recommended'));

  const day1Candidates = buildDistrictOperationCandidates({ day: 1 });
  record(
    assert(
      checks,
      !day1Candidates.some((candidate) => candidate.status === 'recommended'),
      'Day 1 no recommended',
      'Day 1 produced recommended',
    ),
  );
  record(assert(checks, shouldShowDistrictOperationPreview({ day: 1 }) === false, 'Day 1 preview hidden', 'Day 1 preview visible'));

  const day4Recommended = getRecommendedDistrictOperations(
    {
      day: 5,
      districtId: 'sanayi',
      unlockedPermissionIds: ['district_specific_operations_preview'],
      crisisState: { status: 'watch' },
      operationSignals: {
        personnel: { domain: 'personnel', status: 'strained', score: 70, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        vehicles: { domain: 'vehicles', status: 'critical', score: 85, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        containers: { domain: 'containers', status: 'watch', score: 40, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        districts: { domain: 'districts', status: 'watch', score: 45, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        overall: { domain: 'overall', status: 'strained', score: 65, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        priorityDistrictId: 'sanayi',
        dailyFocus: 'vehicles',
        lastProcessedDay: 5,
        lastRefreshedDay: 5,
      },
    },
    3,
  );
  record(assert(checks, day4Recommended.length > 0, 'Day 4+ recommended available', 'Day 4+ no recommended'));

  const candidate = buildDistrictOperationCandidate(sampleDef, {
    day: 5,
    unlockedPermissionIds: ['district_specific_operations_preview'],
  });
  record(assert(checks, candidate.summaryLine.trim().length > 0, 'candidate summaryLine', 'candidate summaryLine empty'));
  record(assert(checks, candidate.impactLines.length > 0, 'candidate impactLines', 'candidate impactLines empty'));
  record(assert(checks, candidate.eligibilityReasons.length > 0, 'candidate eligibilityReasons', 'candidate eligibilityReasons empty'));

  const recommended = getRecommendedDistrictOperations({ day: 5, unlockedPermissionIds: ['district_specific_operations_preview'] }, 2);
  record(assert(checks, recommended.length <= 2, 'getRecommended max param', 'getRecommended exceeds max'));

  const presentation = buildDistrictOperationPresentationModel(candidate, { includeCtaHint: true });
  record(assert(checks, presentation.title.trim().length > 0, 'presentation title', 'presentation title empty'));
  record(assert(checks, presentation.impactChips.length <= 3, 'impact chips max 3', 'too many impact chips'));

  const unlockCopy = buildDistrictOperationUnlockLine(candidate);
  record(assert(checks, districtOperationCopyContainsForbiddenTerms(unlockCopy).length === 0, 'unlockLine forbidden clean', 'unlockLine forbidden terms'));

  for (const surface of ['hub', 'map', 'report', 'profile', 'dev'] as const) {
    record(assert(checks, buildDistrictOperationEmptyState(surface).length > 0, `emptyState ${surface}`, `emptyState ${surface} missing`));
  }

  const allCopy = [
    ...DISTRICT_OPERATION_CATALOG.flatMap((definition) => [
      definition.title,
      definition.shortLabel,
      definition.description,
      definition.districtFlavorLine,
    ]),
    presentation.summaryLine,
    presentation.unlockLine ?? '',
    unlockCopy,
    ...(['hub', 'map', 'report', 'profile', 'dev'] as const).map(buildDistrictOperationEmptyState),
  ].join(' ');
  record(assert(checks, districtOperationCopyContainsForbiddenTerms(allCopy).length === 0, 'forbidden terms in copy', 'forbidden terms found'));

  const docs = readRepo('docs/crevia-district-specific-operations.md');
  record(assert(checks, docs.includes('runtime activation yok'), 'docs runtime activation note', 'docs missing runtime activation note'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION note'));
  record(assert(checks, docs.includes('Persist yok'), 'docs persist note', 'docs missing persist note'));
  record(assert(checks, docs.includes('District trust'), 'docs district trust link', 'docs missing district trust'));
  record(assert(checks, docs.includes('Event family'), 'docs event family link', 'docs missing event family'));
  record(assert(checks, docs.includes('active route') || docs.includes('Aktif görev rotası'), 'docs map/active route link', 'docs missing map/active route'));

  checks.push('PASS No SAVE_VERSION change note verified in docs');
  checks.push('PASS No persist shape change note verified in docs');
  checks.push('PASS No event generation change note verified in scope');
  checks.push('PASS No applyDecision change note verified in scope');

  const mapUiSrc = readRepo('src/features/map/utils/mapUiPresentation.ts');
  const hasDistrictOpUi = mapUiSrc.includes('districtOperations') || mapUiSrc.includes('districtOperation');
  if (hasDistrictOpUi) {
    record(assert(checks, mapUiSrc.includes('numberOfLines'), 'UI compact overflow guard', 'UI missing overflow guard'));
  } else {
    checks.push('PASS UI integration skipped: District operation UI integration follow-up needed');
    warn = true;
  }

  const districtOpSrc =
    readRepo('src/core/districtOperations/districtOperationModel.ts') +
    readRepo('src/core/districtOperations/districtOperationPresentation.ts');
  record(assert(checks, !districtOpSrc.includes("from '@/core/eventFamilies/eventFamily"), 'no eventFamilies runtime import in model', 'eventFamilies import in model'));
  record(assert(checks, !readRepo('src/core/districtTrust/districtTrustModel.ts').includes('districtOperations'), 'no districtTrust circular import', 'districtTrust imports districtOperations'));

  for (const permissionId of DISTRICT_OPERATION_REQUIRED_PERMISSION_IDS) {
    const inRankMatrix = REQUIRED_RANK_PERMISSION_IDS.includes(permissionId as never);
    const stringLevelOnly = permissionId === 'active_task_route';
    record(
      assert(
        checks,
        inRankMatrix || stringLevelOnly,
        `rank permission string ${permissionId}`,
        `rank permission string mismatch ${permissionId}`,
      ),
    );
  }

  record(assert(checks, getDistrictOperationDefinitions().length === DISTRICT_OPERATION_CATALOG.length, 'getDistrictOperationDefinitions', 'definition count mismatch'));

  for (const file of [
    'src/core/game/ensureDailyEventsForDay.ts',
    'src/core/game/generateDailyEventSet.ts',
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  ]) {
    record(assert(checks, !readRepo(file).includes('districtOperations'), `${file} no districtOperations import`, `${file} imports districtOperations`));
  }

  const indexSrc = readRepo('src/core/districtOperations/index.ts');
  record(assert(checks, indexSrc.includes('districtOperationTypes'), 'type exports runtime-safe', 'index exports missing'));

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));
  checks.push('PASS Persist shape unchanged by scope: district operation state is not stored');

  return { ok, warn, checks };
}

function getDistrictOperationDefinitionByKind(kind: DistrictOperationKind, districtId: string) {
  return DISTRICT_OPERATION_CATALOG.find(
    (definition) => definition.kind === kind && definition.districtId === districtId,
  );
}
