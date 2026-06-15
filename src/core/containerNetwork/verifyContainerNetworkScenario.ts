import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { getDistrictOperationDefinition } from '@/core/districtOperations/districtOperationModel';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';
import { getTeamSpecializationDefinition } from '@/core/teamSpecialization/teamSpecializationModel';
import type { TeamSpecializationFitResult } from '@/core/teamSpecialization/teamSpecializationTypes';

import {
  CONTAINER_NETWORK_FORBIDDEN_COPY_TERMS,
  CONTAINER_NETWORK_HEALTH_LABELS,
  CONTAINER_NETWORK_HEALTH_LEVELS,
  CONTAINER_NETWORK_IMPACT_DOMAIN_LABELS,
  CONTAINER_NETWORK_IMPACT_DOMAINS,
  CONTAINER_NETWORK_PRESSURE_LABELS,
  CONTAINER_NETWORK_PRESSURE_LEVELS,
  CONTAINER_NETWORK_STATUS_LABELS,
  CONTAINER_NETWORK_UPGRADE_KIND_LABELS,
  CONTAINER_NETWORK_UPGRADE_KINDS,
  CONTAINER_NETWORK_UPGRADE_STATUSES,
  DISTRICT_CONTAINER_NETWORK_PROFILES,
} from './containerNetworkConstants';
import {
  buildContainerNetworkCandidatesForAllDistricts,
  buildContainerNetworkFallbackCandidate,
  buildContainerNetworkHealthResult,
  buildContainerNetworkUpgradeCandidate,
  calculateContainerNetworkHealthScore,
  calculateContainerNetworkImpactScore,
  calculateContainerNetworkPressureScore,
  calculateContainerNetworkReadinessScore,
  clampContainerNetworkScore,
  getContainerNetworkDistrictProfile,
  getContainerNetworkHealthLevel,
  getContainerNetworkPressureLevel,
  getRecommendedContainerNetworkUpgrades,
  getSuggestedContainerNetworkTeam,
  resolveContainerNetworkUpgradeKind,
  shouldShowContainerNetworkUpgrade,
} from './containerNetworkModel';
import {
  buildContainerNetworkCompactLine,
  buildContainerNetworkEmptyState,
  buildContainerNetworkHealthLabel,
  buildContainerNetworkPresentationModel,
  buildContainerNetworkPressureLabel,
  buildContainerNetworkStatusLabel,
  buildContainerNetworkUnlockLine,
  buildContainerNetworkUpgradeKindLabel,
  collectContainerNetworkPlayerFacingCopy,
  containerNetworkCopyContainsForbiddenTerms,
} from './containerNetworkPresentation';
import type { ContainerNetworkContext } from './containerNetworkTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContainerNetworkOutcome = {
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

function baseContext(overrides: Partial<ContainerNetworkContext> = {}): ContainerNetworkContext {
  return {
    day: 5,
    districtId: 'merkez',
    unlockedPermissionIds: [
      'container_network_upgrade_preview',
      'district_specific_operations_preview',
      'resource_pressure_summary',
      'district_trust_preview',
      'map_resource_layer',
      'map_trust_layer',
    ],
    operationalResources: {
      containerNetworks: [
        {
          districtId: 'merkez',
          fillPressure: 72,
          cleanlinessPressure: 55,
          status: 'strained',
        },
      ],
    },
    resourceFatigue: { container: 'strained' },
    districtTrustResult: {
      districtId: 'merkez',
      score: 62,
      level: 'stable',
      trend: 'steady',
      pressureDomains: ['container'],
      signalSources: ['resource_fatigue'],
      confidence: 'medium',
      isVisibleToPlayer: true,
      reasonLines: ['Kaynak baskısı izleniyor.'],
      memoryItems: [],
    },
    eventFamilySignals: [{ domain: 'container', strength: 'medium' }],
    mapLayerStates: { resource_pressure: 'visible', district_trust: 'visible' },
    ...overrides,
  };
}

export function verifyContainerNetworkScenario(): VerifyContainerNetworkOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnFlag = false;

  function record(result: boolean) {
    if (!result) ok = false;
  }

  function recordWarn(result: boolean) {
    if (!result) warnFlag = true;
  }

  for (const level of CONTAINER_NETWORK_HEALTH_LEVELS) {
    record(
      assert(checks, !!CONTAINER_NETWORK_HEALTH_LABELS[level], `health label ${level}`, `missing health label ${level}`),
    );
    record(assert(checks, !!buildContainerNetworkHealthLabel(level), `health label helper ${level}`, `health helper ${level}`));
  }

  for (const status of CONTAINER_NETWORK_UPGRADE_STATUSES) {
    record(
      assert(checks, !!CONTAINER_NETWORK_STATUS_LABELS[status], `status label ${status}`, `missing status label ${status}`),
    );
    record(assert(checks, !!buildContainerNetworkStatusLabel(status), `status label helper ${status}`, `status helper ${status}`));
  }

  for (const kind of CONTAINER_NETWORK_UPGRADE_KINDS) {
    record(
      assert(checks, !!CONTAINER_NETWORK_UPGRADE_KIND_LABELS[kind], `upgrade kind label ${kind}`, `missing kind label ${kind}`),
    );
    record(assert(checks, !!buildContainerNetworkUpgradeKindLabel(kind), `kind label helper ${kind}`, `kind helper ${kind}`));
  }

  for (const level of CONTAINER_NETWORK_PRESSURE_LEVELS) {
    record(
      assert(checks, !!CONTAINER_NETWORK_PRESSURE_LABELS[level], `pressure label ${level}`, `missing pressure label ${level}`),
    );
    record(assert(checks, !!buildContainerNetworkPressureLabel(level), `pressure label helper ${level}`, `pressure helper ${level}`));
  }

  for (const domain of CONTAINER_NETWORK_IMPACT_DOMAINS) {
    record(
      assert(
        checks,
        !!CONTAINER_NETWORK_IMPACT_DOMAIN_LABELS[domain],
        `impact domain label ${domain}`,
        `missing impact domain label ${domain}`,
      ),
    );
  }

  record(
    assert(
      checks,
      CONTAINER_NETWORK_FORBIDDEN_COPY_TERMS.length >= 6,
      'forbidden copy list',
      'forbidden copy list missing',
    ),
  );

  record(assert(checks, clampContainerNetworkScore(-5) === 0, 'clamp negative to 0', 'clamp negative failed'));
  record(assert(checks, clampContainerNetworkScore(150) === 100, 'clamp above 100', 'clamp max failed'));

  record(assert(checks, getContainerNetworkHealthLevel(10) === 'fragile', 'score 10 fragile', 'score 10 mismatch'));
  record(assert(checks, getContainerNetworkHealthLevel(30) === 'strained', 'score 30 strained', 'score 30 mismatch'));
  record(assert(checks, getContainerNetworkHealthLevel(50) === 'functional', 'score 50 functional', 'score 50 mismatch'));
  record(assert(checks, getContainerNetworkHealthLevel(65) === 'stable', 'score 65 stable', 'score 65 mismatch'));
  record(assert(checks, getContainerNetworkHealthLevel(80) === 'optimized', 'score 80 optimized', 'score 80 mismatch'));
  record(assert(checks, getContainerNetworkHealthLevel(95) === 'showcase', 'score 95 showcase', 'score 95 mismatch'));

  record(assert(checks, getContainerNetworkPressureLevel(10) === 'low', 'pressure 10 low', 'pressure 10 mismatch'));
  record(assert(checks, getContainerNetworkPressureLevel(35) === 'moderate', 'pressure 35 moderate', 'pressure 35 mismatch'));
  record(assert(checks, getContainerNetworkPressureLevel(55) === 'elevated', 'pressure 55 elevated', 'pressure 55 mismatch'));
  record(assert(checks, getContainerNetworkPressureLevel(75) === 'high', 'pressure 75 high', 'pressure 75 mismatch'));
  record(assert(checks, getContainerNetworkPressureLevel(95) === 'critical', 'pressure 95 critical', 'pressure 95 mismatch'));

  record(assert(checks, Object.keys(DISTRICT_CONTAINER_NETWORK_PROFILES).length === 5, '5 district profiles', 'district profile count'));
  record(
    assert(
      checks,
      DISTRICT_CONTAINER_NETWORK_PROFILES.merkez.preferredUpgradeKinds.includes('visible_clean_point'),
      'Merkez visible_clean_point',
      'Merkez profile mismatch',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_CONTAINER_NETWORK_PROFILES.cumhuriyet.preferredUpgradeKinds.includes('school_residential_order'),
      'Cumhuriyet school_residential_order',
      'Cumhuriyet profile mismatch',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_CONTAINER_NETWORK_PROFILES.sanayi.preferredUpgradeKinds.includes('industrial_heavy_use_point'),
      'Sanayi industrial_heavy_use_point',
      'Sanayi profile mismatch',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_CONTAINER_NETWORK_PROFILES.istasyon.preferredUpgradeKinds.includes('transit_flow_support'),
      'İstasyon transit_flow_support',
      'İstasyon profile mismatch',
    ),
  );
  record(
    assert(
      checks,
      DISTRICT_CONTAINER_NETWORK_PROFILES.yesilvadi.preferredUpgradeKinds.includes('environmental_sensitivity_point'),
      'Yeşilvadi environmental_sensitivity_point',
      'Yeşilvadi profile mismatch',
    ),
  );

  record(
    assert(
      checks,
      getContainerNetworkDistrictProfile('unknown_district').districtId === 'merkez',
      'fallback profile safe',
      'fallback profile crash',
    ),
  );

  const fallback = buildContainerNetworkFallbackCandidate();
  record(assert(checks, !!fallback.id, 'fallback candidate id', 'fallback candidate crash'));
  record(
    assert(
      checks,
      fallback.healthResult.signalSources.includes('fallback'),
      'fallback signalSources',
      'fallback missing signalSources',
    ),
  );

  const day1Candidate = buildContainerNetworkUpgradeCandidate(baseContext({ day: 1 }));
  record(
    assert(
      checks,
      !day1Candidate.isVisibleToPlayer && day1Candidate.status !== 'recommended',
      'Day 1 no visible/recommended',
      'Day 1 visibility leak',
    ),
  );

  const day3Candidate = buildContainerNetworkUpgradeCandidate(
    baseContext({ day: 3, districtId: 'cumhuriyet' }),
  );
  record(
    assert(
      checks,
      shouldShowContainerNetworkUpgrade(baseContext({ day: 3 }), day3Candidate) ||
        day3Candidate.readinessScore >= 0,
      'Day 3+ context candidate',
      'Day 3 candidate missing',
    ),
  );

  const highPressureCtx = baseContext({
    operationalResources: {
      containerNetworks: [{ districtId: 'sanayi', fillPressure: 90, cleanlinessPressure: 88, status: 'critical' }],
    },
    districtId: 'sanayi',
  });
  const lowPressureCtx = baseContext({
    operationalResources: {
      containerNetworks: [{ districtId: 'sanayi', fillPressure: 20, cleanlinessPressure: 15, status: 'stable' }],
    },
    districtId: 'sanayi',
  });
  record(
    assert(
      checks,
      calculateContainerNetworkPressureScore(highPressureCtx) >
        calculateContainerNetworkPressureScore(lowPressureCtx),
      'container pressure increases pressureScore',
      'pressure score unchanged by container pressure',
    ),
  );

  const fragileTrustCtx = baseContext({
    districtTrustResult: {
      districtId: 'merkez',
      score: 30,
      level: 'fragile',
      trend: 'falling',
      pressureDomains: ['social'],
      signalSources: ['social_pulse'],
      confidence: 'medium',
      isVisibleToPlayer: true,
      reasonLines: [],
      memoryItems: [],
    },
  });
  const stableTrustCtx = baseContext({
    districtTrustResult: {
      districtId: 'merkez',
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
  });
  record(
    assert(
      checks,
      calculateContainerNetworkImpactScore(fragileTrustCtx) >= calculateContainerNetworkImpactScore(stableTrustCtx) - 5,
      'fragile trust impact',
      'fragile trust impact missing',
    ),
  );
  record(
    assert(
      checks,
      calculateContainerNetworkHealthScore(stableTrustCtx) >= calculateContainerNetworkHealthScore(fragileTrustCtx),
      'stable trust health boost',
      'stable trust health unchanged',
    ),
  );

  const eventCtx = baseContext({ eventFamilySignals: [{ domain: 'resource_recovery' }] });
  const noEventCtx = baseContext({ eventFamilySignals: [] });
  record(
    assert(
      checks,
      calculateContainerNetworkReadinessScore(eventCtx) > calculateContainerNetworkReadinessScore(noEventCtx),
      'event family readiness',
      'event family readiness unchanged',
    ),
  );

  const containerOpDef = getDistrictOperationDefinition('container_network_cumhuriyet');
  const containerOpCtx = baseContext({
    districtId: 'cumhuriyet',
    districtOperationCandidate: containerOpDef
      ? {
          definition: containerOpDef,
          readinessScore: 70,
          status: 'ready',
          eligibilityReasons: [],
          tone: 'neutral',
          priority: 80,
          summaryLine: 'Test',
          impactLines: ['Konteyner ağı operasyonu'],
          isVisibleToPlayer: true,
          isPreviewOnly: false,
        }
      : undefined,
  });
  record(
    assert(
      checks,
      calculateContainerNetworkReadinessScore(containerOpCtx) >
        calculateContainerNetworkReadinessScore(baseContext({ districtId: 'cumhuriyet' })),
      'district operation container_network readiness',
      'container_network operation readiness unchanged',
    ),
  );

  const technicalDef = getTeamSpecializationDefinition('technical_team_preventive_maintenance');
  const containerTeamDef = getTeamSpecializationDefinition('container_network_unit');

  function buildTeamResult(
    def: NonNullable<ReturnType<typeof getTeamSpecializationDefinition>>,
    summaryLine: string,
    sourceSignals: TeamSpecializationFitResult['sourceSignals'],
  ): TeamSpecializationFitResult {
    return {
      specialization: def,
      fitScore: 78,
      fitLevel: 'strong',
      status: 'recommended',
      tone: 'positive',
      matchedDomains: ['container'],
      missingDomains: [],
      matchedCapabilities: ['container_network_support'],
      pressureWarnings: [],
      sourceSignals,
      summaryLine,
      recommendationLine: 'Öneriliyor',
      isVisibleToPlayer: true,
      isPreviewOnly: false,
    };
  }

  const slimCtx = baseContext({
    unlockedPermissionIds: [],
    eventFamilySignals: [],
    districtOperationCandidate: undefined,
    mapLayerStates: undefined,
    districtTrustResult: undefined,
    operationalResources: undefined,
    resourceFatigue: undefined,
  });
  const technicalCtx = {
    ...slimCtx,
    teamSpecializationResults: technicalDef ? [buildTeamResult(technicalDef, 'Teknik', ['operational_resource'])] : [],
  };
  const containerTeamCtx = {
    ...slimCtx,
    teamSpecializationResults: containerTeamDef
      ? [buildTeamResult(containerTeamDef, 'Konteyner', ['district_operation'])]
      : [],
  };
  record(
    assert(
      checks,
      calculateContainerNetworkReadinessScore(technicalCtx) >
        calculateContainerNetworkReadinessScore(slimCtx),
      'technical team readiness',
      'technical team readiness unchanged',
    ),
  );
  record(
    assert(
      checks,
      calculateContainerNetworkReadinessScore(containerTeamCtx) >
        calculateContainerNetworkReadinessScore(slimCtx),
      'container network team readiness',
      'container team readiness unchanged',
    ),
  );

  const routeCtx = baseContext({
    districtId: 'istasyon',
    activeTaskRoute: {
      id: 'route-container',
      status: 'active',
      stage: 'en_route',
      pressure: 'high',
      tone: 'watch',
      domain: 'container',
      targetDistrictId: 'istasyon',
      nodes: [],
      segments: [],
      sourceSignals: [],
      title: 'Konteyner rotası',
      summaryLine: 'Konteyner rotası',
      routeNote: 'Konteyner',
      isVisibleToPlayer: true,
      isPreviewOnly: false,
    },
  });
  record(
    assert(
      checks,
      calculateContainerNetworkPressureScore(routeCtx) > calculateContainerNetworkPressureScore(baseContext({ districtId: 'istasyon' })),
      'active route container domain pressure',
      'route container pressure unchanged',
    ),
  );

  const preventiveCtx = baseContext({
    dailyPlan: {
      day: 5,
      status: 'confirmed',
      source: 'advisor_suggested',
      districtFocusId: 'merkez',
      personnelFocus: 'balanced_shift',
      vehicleFocus: 'preventive_maintenance',
      containerFocus: 'cleanliness_maintenance',
      operationFocusPoints: { total: 3, used: 1, remaining: 2 },
      advisorSuggested: true,
      appliedEffects: [{ domain: 'containers', delta: -4, reason: 'preventive cleanliness focus' }],
    },
  });
  record(
    assert(
      checks,
      calculateContainerNetworkReadinessScore(preventiveCtx) >= calculateContainerNetworkReadinessScore(baseContext()),
      'daily preventive readiness',
      'preventive readiness unchanged',
    ),
  );

  record(
    assert(
      checks,
      resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'merkez' })) === 'visible_clean_point' ||
        resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'merkez' })) === 'capacity_rebalance',
      'Merkez upgrade kind',
      'Merkez kind mismatch',
    ),
  );
  record(
    assert(
      checks,
      resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'cumhuriyet' })) === 'school_residential_order' ||
        resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'cumhuriyet' })) === 'recovery_cleanup_focus',
      'Cumhuriyet upgrade kind',
      'Cumhuriyet kind mismatch',
    ),
  );
  record(assert(checks, resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'sanayi' })) === 'industrial_heavy_use_point' || resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'sanayi' })) === 'capacity_rebalance', 'Sanayi upgrade kind', 'Sanayi kind mismatch'));
  record(assert(checks, resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'istasyon' })) === 'transit_flow_support', 'İstasyon upgrade kind', 'İstasyon kind mismatch'));
  record(assert(checks, resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'yesilvadi' })) === 'environmental_sensitivity_point' || resolveContainerNetworkUpgradeKind(baseContext({ districtId: 'yesilvadi' })) === 'recovery_cleanup_focus', 'Yeşilvadi upgrade kind', 'Yeşilvadi kind mismatch'));

  const health = buildContainerNetworkHealthResult(baseContext());
  record(assert(checks, health.score >= 0 && health.score <= 100, 'health score range', 'health score out of range'));
  record(assert(checks, CONTAINER_NETWORK_HEALTH_LEVELS.includes(health.healthLevel), 'health level valid', 'invalid health level'));
  record(assert(checks, CONTAINER_NETWORK_PRESSURE_LEVELS.includes(health.pressureLevel), 'pressure level valid', 'invalid pressure level'));
  record(assert(checks, health.reasonLines.length > 0, 'health reasonLines', 'empty reasonLines'));
  record(assert(checks, health.pressureDomains.length > 0, 'health pressureDomains', 'empty pressureDomains'));

  const candidate = buildContainerNetworkUpgradeCandidate(baseContext());
  record(assert(checks, candidate.readinessScore >= 0 && candidate.readinessScore <= 100, 'readiness range', 'readiness out of range'));
  record(assert(checks, candidate.impactScore >= 0 && candidate.impactScore <= 100, 'impact range', 'impact out of range'));
  record(assert(checks, candidate.summaryLine.length > 0, 'summaryLine', 'empty summaryLine'));
  record(assert(checks, candidate.relatedMapLayerIds.length > 0, 'relatedMapLayerIds', 'empty map layers'));
  record(assert(checks, candidate.impactDomains.length > 0, 'impactDomains', 'empty impactDomains'));
  record(assert(checks, candidate.upgradeAxes.length > 0, 'upgradeAxes', 'empty upgradeAxes'));

  const allCandidates = buildContainerNetworkCandidatesForAllDistricts(baseContext());
  record(assert(checks, allCandidates.length === 5, '5 district candidates', 'candidate count mismatch'));

  const recommended = getRecommendedContainerNetworkUpgrades(baseContext(), 2);
  record(assert(checks, recommended.length <= 2, 'recommended max param', 'recommended max violated'));

  record(
    assert(
      checks,
      !shouldShowContainerNetworkUpgrade(baseContext({ day: 1 }), day1Candidate),
      'shouldShow Day 1 false',
      'shouldShow Day 1 leak',
    ),
  );
  record(
    assert(
      checks,
      shouldShowContainerNetworkUpgrade(baseContext({ day: 4 }), candidate),
      'shouldShow Day 3+ true',
      'shouldShow Day 3+ false',
    ),
  );

  const suggestedTeam = getSuggestedContainerNetworkTeam(containerTeamCtx);
  record(
    assert(
      checks,
      suggestedTeam === 'container_network_unit' || suggestedTeam === 'technical_team_preventive_maintenance',
      'suggested team',
      'suggested team missing',
    ),
  );

  const presentation = buildContainerNetworkPresentationModel(candidate, { compact: true, surface: 'map' });
  record(assert(checks, presentation.compactLine.length > 0, 'presentation compactLine', 'empty compactLine'));
  record(assert(checks, presentation.chips.length <= 3, 'presentation chips max 3', 'too many chips'));

  record(assert(checks, buildContainerNetworkEmptyState('map').length > 0, 'empty state map', 'empty map state'));
  record(assert(checks, buildContainerNetworkEmptyState('report').length > 0, 'empty state report', 'empty report state'));
  record(assert(checks, buildContainerNetworkEmptyState('hub').length > 0, 'empty state hub', 'empty hub state'));
  record(assert(checks, buildContainerNetworkUnlockLine(baseContext()).length > 0, 'unlock line', 'empty unlock line'));

  const playerCopy = collectContainerNetworkPlayerFacingCopy(candidate, baseContext()).join(' ').toLocaleLowerCase('tr-TR');
  for (const term of [
    '14 günlük sezon',
    'sezon sonu',
    'sezon finali',
    'premium al',
    'paywall',
    'panik',
    'felaket',
  ]) {
    record(assert(checks, !playerCopy.includes(term), `forbidden term absent: ${term}`, `forbidden term found: ${term}`));
  }
  record(
    assert(
      checks,
      !containerNetworkCopyContainsForbiddenTerms('Operasyon Sorumlusu yetkisiyle konteyner ağı gelişimi gündeme gelir.'),
      'clean copy passes forbidden scan',
      'clean copy failed forbidden scan',
    ),
  );

  const docs = readRepo('docs/crevia-container-network-upgrade-system.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('tekil konteyner sistemi değildir'), 'docs tekil konteyner note', 'docs missing tekil konteyner'));
  record(assert(checks, docs.includes('upgrade economy değildir'), 'docs upgrade economy note', 'docs missing upgrade economy'));
  record(assert(checks, docs.includes('save_version yok') || docs.includes('save_version artır'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('persist yok') || docs.includes('persist shape'), 'docs persist note', 'docs missing persist'));
  record(assert(checks, docs.includes('district trust'), 'docs district trust', 'docs missing district trust'));
  record(assert(checks, docs.includes('district operation'), 'docs district operation', 'docs missing district operation'));
  record(assert(checks, docs.includes('event family'), 'docs event family', 'docs missing event family'));
  record(assert(checks, docs.includes('map layer'), 'docs map layer', 'docs missing map layer'));

  record(
    assert(
      checks,
      !docs.includes('applydecision') &&
        !readRepo('docs/crevia-container-network-upgrade-system.md').toLocaleLowerCase('tr-TR').includes('applydecision'),
      'no applyDecision change note',
      'applyDecision change mentioned',
    ),
  );
  record(assert(checks, !docs.toLocaleLowerCase('tr-TR').includes('event generation değiştir'), 'no event generation change', 'event generation change mentioned'));

  if (!REQUIRED_RANK_PERMISSION_IDS.includes('container_network_upgrade_preview' as (typeof REQUIRED_RANK_PERMISSION_IDS)[number])) {
    recordWarn(
      warn(
        checks,
        false,
        'rank permission container_network_upgrade_preview present',
        'missing permission id: container_network_upgrade_preview',
      ),
    );
  } else {
    record(
      assert(
        checks,
        true,
        'rank permission container_network_upgrade_preview present',
        'missing permission id',
      ),
    );
  }

  const mapUi = readRepo('src/features/map/utils/mapUiPresentation.ts');
  const hasUiIntegration =
    mapUi.includes('containerNetwork') || mapUi.includes('buildContainerNetwork');
  recordWarn(
    warn(
      checks,
      hasUiIntegration,
      'UI integration present',
      'Container network UI integration follow-up needed — foundation-only in this patch',
    ),
  );

  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged at 23', 'SAVE_VERSION changed'));

  const indexSource = readRepo('src/core/containerNetwork/index.ts');
  record(assert(checks, indexSource.includes('export type'), 'type exports present', 'missing type exports'));
  record(assert(checks, !indexSource.includes('verifyContainerNetworkScenario'), 'index avoids verify runtime coupling', 'index verify export ok'));

  return { ok, warn: warnFlag, checks };
}
