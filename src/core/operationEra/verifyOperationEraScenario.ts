import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { getDistrictOperationDefinition } from '@/core/districtOperations/districtOperationModel';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';

import { OPERATION_ERA_CATALOG } from './operationEraCatalog';
import {
  OPERATION_ERA_CADENCE_LABELS,
  OPERATION_ERA_CADENCES,
  OPERATION_ERA_CONTENT_HOOK_LABELS,
  OPERATION_ERA_CONTENT_HOOKS,
  OPERATION_ERA_FOCUS_DOMAIN_LABELS,
  OPERATION_ERA_FOCUS_DOMAINS,
  OPERATION_ERA_FORBIDDEN_COPY_TERMS,
  OPERATION_ERA_IS_TERMINAL_GAME_STATE,
  OPERATION_ERA_STATUS_LABELS,
  OPERATION_ERA_STATUSES,
} from './operationEraConstants';
import {
  assertOperationEraIsNonTerminal,
  buildOperationEraCandidate,
  buildOperationEraCandidates,
  buildOperationEraFallbackCandidate,
  calculateOperationEraReadinessScore,
  calculateOperationEraRelevanceScore,
  clampOperationEraScore,
  getOperationEraContentWeightHints,
  getOperationEraDefinition,
  getRecommendedOperationEras,
  shouldShowOperationEraPreview,
} from './operationEraModel';
import {
  buildOperationEraCompactLine,
  buildOperationEraEmptyState,
  buildOperationEraFocusChips,
  buildOperationEraHookChips,
  buildOperationEraNonTerminalDisclaimer,
  buildOperationEraPresentationModel,
  collectOperationEraPlayerFacingCopy,
  operationEraCopyContainsForbiddenTerms,
} from './operationEraPresentation';
import type { OperationEraContext } from './operationEraTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyOperationEraOutcome = {
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

function baseContext(overrides: Partial<OperationEraContext> = {}): OperationEraContext {
  const routeOpDef = getDistrictOperationDefinition('route_discipline_sanayi');
  return {
    day: 10,
    authorityTrust: 62,
    xp: 180,
    unlockedPermissionIds: [
      'operation_era_preview',
      'event_family_rotation_preview',
      'district_specific_operations_preview',
      'container_network_upgrade_preview',
      'district_trust_preview',
      'vehicle_maintenance_window_preview',
      'city_development_preview',
      'map_resource_layer',
      'map_trust_layer',
    ],
    openEndedPhase: 'district_responsibility',
    isFullMode: true,
    eventFamilySignals: [{ domain: 'operation_era', strength: 'medium' }],
    districtOperationCandidates: routeOpDef
      ? [
          {
            definition: routeOpDef,
            status: 'ready',
            tone: 'neutral',
            eligibilityReasons: [],
            priority: 80,
            readinessScore: 70,
            summaryLine: 'Rota disiplini',
            impactLines: ['Rota'],
            isVisibleToPlayer: true,
            isPreviewOnly: false,
          },
        ]
      : [],
    mapLayerStates: { operation_era: 'visible', resource_pressure: 'visible' },
    ...overrides,
  };
}

export function verifyOperationEraScenario(): VerifyOperationEraOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnFlag = false;

  function record(result: boolean) {
    if (!result) ok = false;
  }

  function recordWarn(result: boolean) {
    if (!result) warnFlag = true;
  }

  for (const status of OPERATION_ERA_STATUSES) {
    record(assert(checks, !!OPERATION_ERA_STATUS_LABELS[status], `status label ${status}`, `missing status ${status}`));
  }
  for (const cadence of OPERATION_ERA_CADENCES) {
    record(assert(checks, !!OPERATION_ERA_CADENCE_LABELS[cadence], `cadence label ${cadence}`, `missing cadence ${cadence}`));
  }
  for (const domain of OPERATION_ERA_FOCUS_DOMAINS) {
    record(assert(checks, !!OPERATION_ERA_FOCUS_DOMAIN_LABELS[domain], `focus label ${domain}`, `missing focus ${domain}`));
  }
  for (const hook of OPERATION_ERA_CONTENT_HOOKS) {
    record(assert(checks, !!OPERATION_ERA_CONTENT_HOOK_LABELS[hook], `hook label ${hook}`, `missing hook ${hook}`));
  }

  record(assert(checks, OPERATION_ERA_FORBIDDEN_COPY_TERMS.length >= 8, 'forbidden copy list', 'forbidden list missing'));
  record(assert(checks, OPERATION_ERA_IS_TERMINAL_GAME_STATE === false, 'terminal flag false', 'terminal flag true'));
  record(assert(checks, OPERATION_ERA_CATALOG.length >= 6, 'at least 6 era definitions', 'insufficient era count'));

  const requiredIds = [
    'core_city_operations',
    'route_maintenance_era',
    'container_network_era',
    'district_trust_era',
    'crisis_recovery_era',
    'city_growth_preview_era',
  ];
  for (const id of requiredIds) {
    record(assert(checks, !!getOperationEraDefinition(id), `era ${id} exists`, `missing era ${id}`));
  }

  const uniqueIds = new Set(OPERATION_ERA_CATALOG.map((d) => d.id));
  record(assert(checks, uniqueIds.size === OPERATION_ERA_CATALOG.length, 'unique era ids', 'duplicate era ids'));

  for (const definition of OPERATION_ERA_CATALOG) {
    record(
      assert(
        checks,
        definition.title.length > 0 &&
          definition.shortLabel.length > 0 &&
          definition.description.length > 0 &&
          definition.flavorLine.length > 0,
        `era copy ${definition.id}`,
        `empty copy ${definition.id}`,
      ),
    );
    record(assert(checks, definition.focusDomains.length > 0, `focusDomains ${definition.id}`, `empty focus ${definition.id}`));
    record(assert(checks, definition.contentHooks.length > 0, `contentHooks ${definition.id}`, `empty hooks ${definition.id}`));
    record(
      assert(
        checks,
        definition.relatedEventFamilyDomains.length > 0,
        `event domains ${definition.id}`,
        `empty event domains ${definition.id}`,
      ),
    );
  }

  const routeEra = getOperationEraDefinition('route_maintenance_era')!;
  record(assert(checks, routeEra.focusDomains.includes('vehicle_route'), 'route era vehicle_route focus', 'route focus missing'));
  record(assert(checks, routeEra.contentHooks.includes('vehicle_maintenance'), 'route era vehicle_maintenance hook', 'route hook missing'));

  const containerEra = getOperationEraDefinition('container_network_era')!;
  record(assert(checks, containerEra.focusDomains.includes('container_network'), 'container era focus', 'container focus missing'));
  record(assert(checks, containerEra.contentHooks.includes('container_network'), 'container era hook', 'container hook missing'));

  const trustEra = getOperationEraDefinition('district_trust_era')!;
  record(assert(checks, trustEra.focusDomains.includes('district_trust'), 'trust era focus', 'trust focus missing'));

  const crisisEra = getOperationEraDefinition('crisis_recovery_era')!;
  record(assert(checks, crisisEra.focusDomains.includes('crisis_recovery'), 'crisis era focus', 'crisis focus missing'));

  const cityEra = getOperationEraDefinition('city_growth_preview_era')!;
  record(assert(checks, cityEra.isFutureOnly === true, 'city growth future only', 'city growth not future'));

  record(assert(checks, clampOperationEraScore(-5) >= 0 && clampOperationEraScore(150) <= 100, 'score clamp', 'clamp failed'));

  const coreDef = getOperationEraDefinition('core_city_operations')!;
  const permCtx = baseContext({ unlockedPermissionIds: ['operation_era_preview'] });
  const noPermCtx = baseContext({ unlockedPermissionIds: [] });
  record(
    assert(
      checks,
      calculateOperationEraReadinessScore(coreDef, permCtx) >
        calculateOperationEraReadinessScore(coreDef, noPermCtx),
      'operation_era_preview readiness',
      'permission readiness unchanged',
    ),
  );

  const pilotCandidate = buildOperationEraCandidate(routeEra, baseContext({ day: 5, isPilotDay: true }));
  record(
    assert(
      checks,
      pilotCandidate.status !== 'active' && pilotCandidate.status !== 'recommended',
      'pilot no active/recommended',
      'pilot status leak',
    ),
  );

  const day8Candidate = buildOperationEraCandidate(routeEra, baseContext({ day: 8 }));
  record(
    assert(
      checks,
      day8Candidate.status === 'preview' ||
        day8Candidate.status === 'available' ||
        day8Candidate.status === 'recommended',
      'Day 8+ preview/available',
      'Day 8 status missing',
    ),
  );

  const routePressureCtx = baseContext({
    operationSignals: {
      vehicles: { status: 'critical', score: 85 },
      overall: { status: 'strained' },
    },
    vehicleMaintenanceWindow: {
      id: 'vm-1',
      kind: 'operation_era_maintenance',
      status: 'recommended',
      readinessScore: 70,
      urgencyScore: 75,
      riskLevel: 'high',
      tradeoffTypes: ['protect_tomorrow'],
      pressureDomains: ['vehicle_route'],
      signalSources: ['operational_resource'],
      title: 'Bakım',
      summaryLine: 'Bakım',
      riskLine: 'Yüksek bakım riski',
      tradeoffLine: 'Bugün rotayı zorlamak yarını zorlar.',
      isVisibleToPlayer: true,
      isPreviewOnly: false,
    },
  });
  record(
    assert(
      checks,
      calculateOperationEraRelevanceScore(routeEra, routePressureCtx) >
        calculateOperationEraRelevanceScore(routeEra, baseContext()),
      'route pressure relevance',
      'route relevance unchanged',
    ),
  );

  const containerPressureCtx = baseContext({
    containerNetworkCandidates: [
      {
        id: 'cn-1',
        districtId: 'merkez',
        kind: 'capacity_rebalance',
        status: 'recommended',
        healthResult: {
          districtId: 'merkez',
          score: 45,
          healthLevel: 'strained',
          pressureLevel: 'high',
          signalSources: ['operational_resource'],
          pressureDomains: ['container'],
          reasonLines: ['Baskı'],
          confidence: 'medium',
          isVisibleToPlayer: true,
        },
        readinessScore: 70,
        impactScore: 75,
        pressureLevel: 'high',
        impactDomains: ['container'],
        upgradeAxes: ['container_pressure'],
        title: 'Merkez',
        summaryLine: 'Konteyner',
        relatedMapLayerIds: ['resource_pressure'],
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    ],
  });
  record(
    assert(
      checks,
      calculateOperationEraRelevanceScore(containerEra, containerPressureCtx) >
        calculateOperationEraRelevanceScore(containerEra, baseContext()),
      'container pressure relevance',
      'container relevance unchanged',
    ),
  );

  const trustCtx = baseContext({
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
  });
  record(
    assert(
      checks,
      calculateOperationEraRelevanceScore(trustEra, trustCtx) >
        calculateOperationEraRelevanceScore(trustEra, baseContext()),
      'district trust relevance',
      'trust relevance unchanged',
    ),
  );

  const crisisCtx = baseContext({ crisisState: { riskLevel: 'watch', status: 'active' } });
  record(
    assert(
      checks,
      calculateOperationEraRelevanceScore(crisisEra, crisisCtx) >
        calculateOperationEraRelevanceScore(crisisEra, baseContext()),
      'crisis watch relevance',
      'crisis relevance unchanged',
    ),
  );

  const futureCandidate = buildOperationEraCandidate(cityEra, baseContext());
  record(assert(checks, futureCandidate.status === 'future', 'future-only status', 'future status mismatch'));

  const candidate = buildOperationEraCandidate(coreDef, baseContext());
  record(assert(checks, candidate.summaryLine.length > 0, 'summaryLine', 'empty summaryLine'));
  record(assert(checks, candidate.eligibilityReasons.length > 0, 'eligibilityReasons', 'empty eligibilityReasons'));

  const recommended = getRecommendedOperationEras(baseContext(), 2);
  record(assert(checks, recommended.length <= 2, 'recommended max', 'recommended max violated'));

  record(
    assert(
      checks,
      !shouldShowOperationEraPreview(baseContext({ day: 3, isPilotDay: true }), pilotCandidate),
      'shouldShow pilot false',
      'shouldShow pilot leak',
    ),
  );
  record(
    assert(
      checks,
      shouldShowOperationEraPreview(baseContext({ day: 10 }), candidate),
      'shouldShow Day 8+ true',
      'shouldShow Day 8+ false',
    ),
  );

  const weightHints = getOperationEraContentWeightHints(candidate);
  record(assert(checks, weightHints.preferredEventFamilyDomains.length > 0, 'weight hints event family', 'empty event hints'));
  record(assert(checks, weightHints.preferredDistrictOperationKinds.length > 0, 'weight hints district ops', 'empty district hints'));

  const nonTerminal = assertOperationEraIsNonTerminal(candidate);
  record(assert(checks, nonTerminal.ok === true, 'assertOperationEraIsNonTerminal', nonTerminal.message));

  const presentation = buildOperationEraPresentationModel(candidate, { compact: true, surface: 'hub' });
  record(assert(checks, presentation.compactLine.length > 0, 'presentation compactLine', 'empty compactLine'));
  record(assert(checks, buildOperationEraFocusChips(candidate).length <= 3, 'focusChips max 3', 'too many focus chips'));
  record(assert(checks, buildOperationEraHookChips(candidate).length <= 3, 'hookChips max 3', 'too many hook chips'));

  const disclaimer = buildOperationEraNonTerminalDisclaimer();
  record(
    assert(
      checks,
      !operationEraCopyContainsForbiddenTerms(disclaimer),
      'nonTerminalDisclaimer clean',
      'disclaimer forbidden term',
    ),
  );

  record(assert(checks, buildOperationEraEmptyState('hub').length > 0, 'empty hub', 'empty hub missing'));
  record(assert(checks, buildOperationEraEmptyState('map').length > 0, 'empty map', 'empty map missing'));
  record(assert(checks, buildOperationEraEmptyState('report').length > 0, 'empty report', 'empty report missing'));

  const playerCopy = collectOperationEraPlayerFacingCopy(candidate).join(' ').toLocaleLowerCase('tr-TR');
  for (const term of [
    '14 günlük sezon',
    'sezon sonu',
    'sezon finali',
    'oyun bitti',
    'yeni sezona başla',
    'premium al',
    'paywall',
    'panik',
    'felaket',
  ]) {
    record(assert(checks, !playerCopy.includes(term), `forbidden absent ${term}`, `forbidden found ${term}`));
  }

  const fallback = buildOperationEraFallbackCandidate();
  record(assert(checks, !!fallback.definition.id, 'fallback candidate', 'fallback crash'));

  const docs = readRepo('docs/crevia-operation-era-system.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('14 günlük sezon değildir'), 'docs 14 day season note', 'docs missing 14 day'));
  record(assert(checks, docs.includes('oyun bitişi değildir'), 'docs game end note', 'docs missing game end'));
  record(assert(checks, docs.includes('daily live-ops zorunlu değildir'), 'docs daily live-ops note', 'docs missing daily live-ops'));
  record(assert(checks, docs.includes('save_version yok') || docs.includes('save_version artır'), 'docs SAVE_VERSION', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('persist yok') || docs.includes('persist shape'), 'docs persist', 'docs missing persist'));
  record(assert(checks, docs.includes('event family'), 'docs event family', 'docs missing event family'));
  record(assert(checks, docs.includes('district operation'), 'docs district operation', 'docs missing district operation'));
  record(assert(checks, docs.includes('vehicle maintenance'), 'docs vehicle maintenance', 'docs missing vehicle maintenance'));
  record(assert(checks, docs.includes('container network'), 'docs container network', 'docs missing container network'));
  record(assert(checks, docs.includes('map layer'), 'docs map layer', 'docs missing map layer'));
  record(assert(checks, docs.includes('content production pipeline'), 'docs content pipeline', 'docs missing content pipeline'));

  record(assert(checks, !docs.includes('live-ops backend') && !docs.includes('remote config'), 'no live-ops backend note in constraints', 'live-ops backend mentioned wrongly'));
  record(assert(checks, !docs.toLocaleLowerCase('tr-TR').includes('event generation değiştir'), 'no event generation change', 'event generation change mentioned'));

  if (!REQUIRED_RANK_PERMISSION_IDS.includes('operation_era_preview' as (typeof REQUIRED_RANK_PERMISSION_IDS)[number])) {
    recordWarn(warn(checks, false, 'operation_era_preview permission', 'missing operation_era_preview'));
  } else {
    record(assert(checks, true, 'operation_era_preview permission present', 'missing permission'));
  }

  const hasUiIntegration =
    readRepo('src/features/hub/components/HubScreen.tsx').includes('operationEra') ||
    readRepo('src/features/map/utils/mapUiPresentation.ts').includes('operationEra');
  recordWarn(
    warn(
      checks,
      hasUiIntegration,
      'UI integration present',
      'Operation Era UI integration follow-up needed — foundation-only in this patch',
    ),
  );

  record(assert(checks, buildOperationEraCandidates(baseContext()).length >= 6, 'build all candidates', 'candidate build failed'));
  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23', 'SAVE_VERSION changed'));

  const indexSource = readRepo('src/core/operationEra/index.ts');
  record(assert(checks, indexSource.includes('export type'), 'type exports', 'missing type exports'));
  record(assert(checks, !indexSource.includes('verifyOperationEraScenario'), 'index verify decoupling', 'index verify coupling'));

  const compact = buildOperationEraCompactLine(candidate);
  record(assert(checks, compact.length > 0, 'compact line helper', 'empty compact helper'));

  return { ok, warn: warnFlag, checks };
}
