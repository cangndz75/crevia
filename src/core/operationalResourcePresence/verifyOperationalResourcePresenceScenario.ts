import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildSyntheticContentPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyOperationalResourceEffects,
} from '@/core/operationalResources/operationalResourceEngine';
import {
  createInitialOperationalResourcesState,
  normalizeOperationalResourcesState,
} from '@/core/operationalResources/operationalResourceState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  OPERATIONAL_RESOURCE_PRESENCE_LITE_FORBIDDEN_WORDS,
  TEAM_GROUP_STATUS_LABELS,
  VEHICLE_GROUP_STATUS_LABELS,
} from './operationalResourcePresenceConstants';
import {
  buildOperationalResourcePresenceLiteModel,
  buildOperationalResourcePresenceLiteVisibility,
  collectOperationalResourcePresenceVisibleLines,
  getTeamGroupStatusLabel,
  getVehicleGroupStatusLabel,
  operationalResourcePresenceContainsForbiddenWords,
  shouldShowOperationalResourcePresenceLite,
} from './operationalResourcePresenceModel';
import {
  buildOperationalResourcePresenceDecisionImpactHint,
  buildOperationalResourcePresenceDetailTeamCards,
  buildOperationalResourcePresenceDetailVehicleCards,
  buildOperationalResourcePresenceHubPresentation,
  buildOperationalResourcePresenceMapLine,
  buildOperationalResourcePresenceReportLine,
  buildOperationalResourcePresenceTomorrowRiskHint,
} from './operationalResourcePresencePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 24;

export type VerifyOperationalResourcePresenceOutcome = {
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

function strainedSignals() {
  return {
    vehicles: { status: 'critical', summary: 'Rota baskısı', score: 85 },
    containers: { status: 'watch', summary: 'Konteyner', score: 55 },
    personnel: { status: 'strained', summary: 'Personel', score: 72 },
    districts: { status: 'watch', summary: 'Mahalle', score: 60 },
  };
}

function strainedResources(day = 6) {
  let state = createInitialOperationalResourcesState(day);
  state = applyOperationalResourceEffects(
    state,
    [
      {
        domain: 'personnel',
        targetId: 'field_team',
        delta: 28,
        metric: 'workload',
        reason: 'test',
        sourceTags: [],
      },
      {
        domain: 'personnel',
        targetId: 'field_team',
        delta: 22,
        metric: 'fatigue',
        reason: 'test',
        sourceTags: [],
      },
      {
        domain: 'vehicles',
        targetId: 'route_support_vehicle',
        delta: 30,
        metric: 'route',
        reason: 'test',
        sourceTags: [],
      },
      {
        domain: 'vehicles',
        targetId: 'maintenance_vehicle',
        delta: 24,
        metric: 'maintenance',
        reason: 'test',
        sourceTags: [],
      },
    ],
    day,
  );
  return state;
}

export function verifyOperationalResourcePresenceScenario(): VerifyOperationalResourcePresenceOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const baseModel = buildOperationalResourcePresenceLiteModel({
    day: 6,
    operationalResources: strainedResources(),
    operationSignals: strainedSignals(),
    focusDistrictId: 'sanayi',
  });

  record(assert(checks, Boolean(baseModel?.teamGroups.length), 'OperationalResourcePresenceLiteModel üretilebiliyor'));
  record(assert(checks, Boolean(baseModel?.vehicleGroups.length), 'VehicleGroupPresence üretilebiliyor'));
  record(assert(checks, baseModel.teamGroups.every((g) => g.label && g.line), 'TeamGroupPresence üretilebiliyor'));

  const allCopy = collectOperationalResourcePresenceVisibleLines(baseModel).join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !allCopy.includes('ahmet') && !allCopy.includes('mehmet'), 'Tekil personel adı yok'));
  record(assert(checks, !allCopy.includes('plaka') && !allCopy.includes('34 '), 'Tekil araç/plaka yok'));
  record(assert(checks, !allCopy.includes('gps') && !allCopy.includes('canlı takip') && !allCopy.includes('koordinat'), 'GPS/canlı takip/koordinat dili yok'));

  record(assert(checks, Boolean(getTeamGroupStatusLabel('busy')), 'Ekip status label üretilebiliyor'));
  record(assert(checks, Boolean(getVehicleGroupStatusLabel('route_pressure')), 'Araç status label üretilebiliyor'));
  record(assert(checks, baseModel.teamGroups.some((g) => g.fatigueBand), 'Fatigue band üretilebiliyor'));
  record(assert(checks, baseModel.vehicleGroups.some((g) => g.maintenanceBand), 'Maintenance/watch band üretilebiliyor'));

  const fallback = buildOperationalResourcePresenceLiteModel({ day: 2 });
  record(assert(checks, Boolean(fallback?.primaryPressureLine), 'fallback güvenli'));

  const routePack = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family',
    districtId: 'sanayi',
  });
  const routeModel = buildOperationalResourcePresenceLiteModel({
    day: 8,
    isPostPilot: true,
    operationalResources: strainedResources(8),
    operationSignals: strainedSignals(),
    contentPackMeta: routePack,
    focusDistrictId: 'sanayi',
  });
  record(
    assert(
      checks,
      routeModel.vehicleGroups.some((v) => v.kind === 'route_support_vehicle'),
      'Vehicle/Route pack route_support_vehicle seçebiliyor',
    ),
  );

  const fatiguePack = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family',
    districtId: 'sanayi',
    variantKind: 'resource_fatigue',
  });
  const fatigueModel = buildOperationalResourcePresenceLiteModel({
    day: 8,
    isPostPilot: true,
    operationalResources: strainedResources(8),
    operationSignals: strainedSignals(),
    contentPackMeta: fatiguePack,
  });
  record(
    assert(
      checks,
      fatigueModel.vehicleGroups.some((v) => v.status === 'fatigue_watch'),
      'Vehicle/Route resource_fatigue variant fatigue_watch üretiyor',
    ),
  );

  const maintenanceMeta = {
    packId: 'vehicle_route_pack_one' as const,
    familyId: 'route_family',
    variantId: 'route_family_maintenance',
    variantKind: 'vehicle_maintenance',
    domain: 'vehicle_maintenance',
    districtId: 'sanayi',
    source: 'content_runtime_activation_lite' as const,
  };
  const maintenanceModel = buildOperationalResourcePresenceLiteModel({
    day: 8,
    operationalResources: strainedResources(8),
    contentPackMeta: maintenanceMeta,
  });
  record(
    assert(
      checks,
      maintenanceModel.vehicleGroups.some((v) => v.status === 'maintenance_watch'),
      'Vehicle maintenance domain maintenance_watch üretiyor ama full runtime açmıyor',
    ),
  );

  const containerPack = buildSyntheticContentPackMeta({
    packId: 'container_environment_pack_one',
    familyId: 'container_family',
    districtId: 'cumhuriyet',
  });
  const containerModel = buildOperationalResourcePresenceLiteModel({
    day: 8,
    isPostPilot: true,
    operationalResources: strainedResources(8),
    contentPackMeta: containerPack,
    focusDistrictId: 'cumhuriyet',
  });
  record(
    assert(
      checks,
      containerModel.teamGroups.some((t) => t.kind === 'container_team') &&
        containerModel.vehicleGroups.some((v) => v.kind === 'container_vehicle'),
      'Container pack container_vehicle/container_team üretebiliyor',
    ),
  );

  const districtPack = buildSyntheticContentPackMeta({
    packId: 'district_pack_one',
    familyId: 'district_family',
    districtId: 'yesilvadi',
  });
  const districtModel = buildOperationalResourcePresenceLiteModel({
    day: 8,
    isPostPilot: true,
    operationalResources: strainedResources(8),
    contentPackMeta: districtPack,
  });
  record(
    assert(
      checks,
      districtModel.teamGroups.some((t) => t.kind === 'support_team'),
      'District/social pack support_team üretebiliyor',
    ),
  );

  record(
    assert(
      checks,
      routeModel.vehicleGroups.some((v) => v.status === 'route_pressure'),
      'operationSignals vehicle/route pressure vehicle group status etkiliyor',
    ),
  );
  record(
    assert(
      checks,
      routeModel.teamGroups.some((t) => t.priority === 'high'),
      'operationSignals personnel pressure team group status etkiliyor',
    ),
  );

  const highFatigue = buildOperationalResourcePresenceLiteModel({
    day: 6,
    operationalResources: strainedResources(),
    operationSignals: { vehicles: { status: 'critical', score: 90 } },
    resourceFatigue: { standard_truck: { state: 'tired', note: 'vehicle fatigue' } },
  });
  record(
    assert(
      checks,
      highFatigue.vehicleGroups.some((v) => v.status === 'fatigue_watch'),
      'resourceFatigue high ise fatigue_watch üretiliyor',
    ),
  );

  record(assert(checks, buildOperationalResourcePresenceLiteVisibility({ day: 1 }) === 'hidden', 'Day 1 ağır kaynak dili yok'));
  record(assert(checks, buildOperationalResourcePresenceLiteVisibility({ day: 2 }) === 'compact', 'Day 2-3 compact'));
  record(assert(checks, buildOperationalResourcePresenceLiteVisibility({ day: 5 }) === 'standard', 'Day 4-7 standard'));
  record(
    assert(
      checks,
      Boolean(
        buildOperationalResourcePresenceLiteModel({
          day: 8,
          isPostPilot: true,
          operationalResources: strainedResources(8),
          operationSignals: strainedSignals(),
        }).hubLine,
      ),
      'Day 8+ ana operasyon kaynak line üretiyor',
    ),
  );
  record(
    assert(
      checks,
      buildOperationalResourcePresenceLiteVisibility({ day: 9, isPostPilot: true, accessMode: 'full' }) ===
        'detailed_preview',
      'Full mode detailed_preview ama full management değil',
    ),
  );

  const hubPresentation = buildOperationalResourcePresenceHubPresentation(baseModel, []);
  record(assert(checks, Boolean(hubPresentation?.summaryLine), 'HubOperationalResourcesCard entegrasyonu helper var'));

  const teamCards = buildOperationalResourcePresenceDetailTeamCards(baseModel);
  const vehicleCards = buildOperationalResourcePresenceDetailVehicleCards(baseModel);
  record(assert(checks, teamCards.length > 0 && vehicleCards.length > 0, 'OperationalResourcesDetailSheet ekip/araç gruplarını gösteriyor'));

  const mapLine = buildOperationalResourcePresenceMapLine(baseModel, []);
  record(assert(checks, Boolean(mapLine), 'Map presence helper var'));

  const reportLine = buildOperationalResourcePresenceReportLine(baseModel, []);
  record(assert(checks, reportLine == null || typeof reportLine === 'string', 'Report helper var'));

  record(
    assert(
      checks,
      readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx').includes('numberOfLines'),
      'numberOfLines guard var',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx').includes('flexShrink'),
      'flexShrink guard var',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx').includes('minWidth: 0'),
      'minWidth guard var',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx').includes('operational-resource-presence'),
      'Yeni route yok',
    ),
  );

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('operationalResourcePresence'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('operationalResourcePresence'), 'persist shape değişmedi'));
  record(
    assert(
      checks,
      readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationConstants.ts').includes(
        'CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT = 1',
      ),
      'content pack caps değişmedi',
    ),
  );

  const playerCopy = [
    routeModel.hubLine ?? '',
    containerModel.hubLine ?? '',
    districtModel.hubLine ?? '',
  ].join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !playerCopy.includes('pack_one') && !playerCopy.includes('metadata'), 'Teknik pack adı UI yok'));

  for (const word of ['gps', 'plaka', 'runtime', 'panik']) {
    record(
      assert(
        checks,
        OPERATIONAL_RESOURCE_PRESENCE_LITE_FORBIDDEN_WORDS.some((w) => w.includes(word)),
        `forbidden word listed: ${word}`,
      ),
    );
  }
  record(
    assert(
      checks,
      operationalResourcePresenceContainsForbiddenWords('GPS canlı takip koordinat'),
      'forbidden copy guard',
    ),
  );

  record(assert(checks, shouldShowOperationalResourcePresenceLite(baseModel), 'shouldShow'));
  record(assert(checks, !shouldShowOperationalResourcePresenceLite(buildOperationalResourcePresenceLiteModel({ day: 1 })), 'Day 1 hidden'));

  const dedupeHint = buildOperationalResourcePresenceDecisionImpactHint(baseModel, [baseModel.primaryPressureLine]);
  record(assert(checks, dedupeHint == null || !dedupeHint.includes(baseModel.primaryPressureLine.slice(0, 20)), 'Decision Impact duplicate guard'));

  const tomorrowHint = buildOperationalResourcePresenceTomorrowRiskHint(baseModel, []);
  record(assert(checks, tomorrowHint == null || tomorrowHint.includes('Yarın'), 'Tomorrow Risk helper'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-operational-resource-presence-lite.md')), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:operational-resource-presence'), 'package.json script var'));
  record(assert(checks, readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx').includes('operationalResourcePresence'), 'Hub wiring'));
  record(assert(checks, readRepo('src/features/map/utils/mapResourcePresentation.ts').includes('operationalResourcePresence'), 'Map wiring'));

  record(
    assert(
      checks,
      Object.keys(TEAM_GROUP_STATUS_LABELS).length >= 6 && Object.keys(VEHICLE_GROUP_STATUS_LABELS).length >= 6,
      'Status label setleri tam',
    ),
  );

  void createDay1Seed();
  void normalizeOperationalResourcesState(undefined, 1);

  return { ok, checks };
}
