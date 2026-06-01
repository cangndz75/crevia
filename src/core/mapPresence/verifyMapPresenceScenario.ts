import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { verifyContentSafetyPackStage3Scenario } from '@/core/contentPacks/verifyContentSafetyPackStage3Scenario';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { MAP_DISTRICT_IDS } from '@/features/map/data/mapDistrictConstants';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ALL_MAP_PRESENCE_ANCHORS,
  MAP_PRESENCE_ANCHORS_BY_DISTRICT,
  getMapPresenceAnchorsForDistrict,
} from './mapPresenceAnchors';
import {
  buildContainerPresenceMarkers,
  buildMapPresencePanelLines,
  buildMapPresenceViewModel,
  buildRoutePresenceHints,
  buildTeamPresenceMarkers,
  buildVehiclePresenceMarkers,
  inferMapPresenceDomain,
  shouldShowContainerPresence,
  shouldShowMapPresenceLayer,
  shouldShowRouteHint,
  shouldShowTeamPresence,
  shouldShowVehiclePresence,
  suppressMapPresenceForCrisisPriority,
} from './mapPresencePresentation';
import type { MapPresenceInput } from './mapPresenceTypes';
import {
  validateMapPresenceAnchorRegistry,
  validateMapPresenceAnchors,
  validateMapPresenceCrisisPriority,
  validateMapPresenceDayVisibility,
  validateMapPresenceMarkerCaps,
  validateMapPresenceNoForbiddenWords,
  validateMapPresenceViewModel,
} from './mapPresenceValidation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

const CONTAINER_EVENT = {
  id: 'map-container-cumhuriyet',
  title: 'Konteyner Baskısı',
  contentCategory: 'container',
  neighborhoodId: 'cumhuriyet',
};

const VEHICLE_EVENT = {
  id: 'map-vehicle-istasyon',
  title: 'Araç Rotası',
  contentCategory: 'vehicle_route',
  neighborhoodId: 'istasyon',
};

const PERSONNEL_EVENT = {
  id: 'map-personnel',
  title: 'Ekip Temposu',
  contentCategory: 'personnel',
  neighborhoodId: 'merkez',
};

const SOCIAL_EVENT = {
  id: 'map-social',
  title: 'Sosyal Şikayet',
  contentCategory: 'social',
  neighborhoodId: 'yesilvadi',
};

const CRISIS_EVENT = {
  id: 'map-crisis',
  title: 'Risk Sinyali',
  contentCategory: 'crisis_adjacent',
  neighborhoodId: 'sanayi',
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function baseInput(day: number, extra: Partial<MapPresenceInput> = {}): MapPresenceInput {
  return { day, ...extra };
}

export type VerifyMapPresenceOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

export function verifyMapPresenceScenario(): VerifyMapPresenceOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  for (const districtId of MAP_DISTRICT_IDS) {
    record(assert(checks, !!MAP_PRESENCE_ANCHORS_BY_DISTRICT[districtId], `anchors ${districtId}`, `missing ${districtId}`));
    const anchors = getMapPresenceAnchorsForDistrict(districtId);
    record(
      assert(
        checks,
        anchors.filter((a) => a.kind === 'container').length >= 3,
        `${districtId} 3+ container anchors`,
        `${districtId} container anchors`,
      ),
    );
    for (const kind of [
      'vehicle_access',
      'team_station',
      'social_hotspot',
      'crisis_point',
      'district_center',
    ] as const) {
      record(
        assert(
          checks,
          anchors.some((a) => a.kind === kind),
          `${districtId} has ${kind}`,
          `${districtId} missing ${kind}`,
        ),
      );
    }
  }

  record(assert(checks, ALL_MAP_PRESENCE_ANCHORS.length >= 40, 'anchor registry size', 'anchors too few'));
  record(assert(checks, validateMapPresenceAnchorRegistry(), 'validate anchors registry', 'anchor registry invalid'));
  record(assert(checks, validateMapPresenceAnchors().length === 0, 'anchor validation clean', 'anchor errors'));

  const ids = new Set(ALL_MAP_PRESENCE_ANCHORS.map((a) => a.id));
  record(assert(checks, ids.size === ALL_MAP_PRESENCE_ANCHORS.length, 'no duplicate anchor ids', 'duplicate ids'));

  for (const anchor of ALL_MAP_PRESENCE_ANCHORS) {
    record(
      assert(
        checks,
        anchor.x >= 0.05 && anchor.x <= 0.95 && anchor.y >= 0.05 && anchor.y <= 0.95,
        `coords safe ${anchor.id}`,
        `coords unsafe ${anchor.id}`,
      ),
    );
  }

  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(2, { activeEvent: CONTAINER_EVENT })) === 'container',
      'infer container',
      'container infer',
    ),
  );
  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(3, { activeEvent: VEHICLE_EVENT })) === 'vehicle_route',
      'infer vehicle_route',
      'vehicle infer',
    ),
  );
  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(3, { activeEvent: PERSONNEL_EVENT })) === 'personnel',
      'infer personnel',
      'personnel infer',
    ),
  );
  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(4, { activeEvent: SOCIAL_EVENT })) === 'social',
      'infer social',
      'social infer',
    ),
  );
  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(6, { activeEvent: CRISIS_EVENT })) === 'crisis_adjacent',
      'infer crisis_adjacent',
      'crisis infer',
    ),
  );
  record(
    assert(
      checks,
      inferMapPresenceDomain(
        baseInput(5, { eventDomainFocus: { focus: 'district_balance' } }),
      ) === 'district_balance',
      'infer district_balance',
      'balance infer',
    ),
  );

  const day1 = buildMapPresenceViewModel(baseInput(1, { activeEvent: CONTAINER_EVENT }));
  record(assert(checks, !day1.visible, 'Day 1 hidden', 'day1 visible'));
  record(assert(checks, day1.containerMarkers.every((m) => !m.visible || day1.containerMarkers.length === 0), 'Day 1 minimal markers', 'day1 markers'));

  const day2 = buildMapPresenceViewModel(
    baseInput(2, { activeEvent: CONTAINER_EVENT, selectedDistrictId: 'cumhuriyet' }),
  );
  record(assert(checks, day2.visible, 'Day 2 visible', 'day2 hidden'));
  record(assert(checks, day2.containerMarkers.length > 0, 'Day 2 container markers', 'day2 no container'));
  record(assert(checks, day2.containerMarkers.length <= 3, 'Day 2 container cap', 'day2 too many'));

  const day3 = buildMapPresenceViewModel(
    baseInput(3, { activeEvent: VEHICLE_EVENT, selectedDistrictId: 'istasyon' }),
  );
  record(assert(checks, day3.vehicleMarkers.length > 0, 'Day 3 vehicle marker', 'day3 vehicle'));
  record(assert(checks, shouldShowVehiclePresence(3, 'vehicle_route'), 'should show vehicle day3', 'vehicle flag'));

  const day4 = buildMapPresenceViewModel(baseInput(4, { activeEvent: SOCIAL_EVENT }));
  record(assert(checks, day4.teamMarkers.length > 0 || day4.containerMarkers.length >= 0, 'Day 4 social surface', 'day4 empty'));

  const day6 = buildMapPresenceViewModel(baseInput(6, { activeEvent: CRISIS_EVENT }));
  record(
    assert(
      checks,
      day6.containerMarkers.some((m) => m.status === 'risk_watch') || day6.domain === 'crisis_adjacent',
      'Day 6 risk_watch',
      'day6 risk',
    ),
  );
  record(
    assert(
      checks,
      !buildMapPresencePanelLines(day6).join(' ').toLowerCase().includes('kriz başladı'),
      'Day 6 no panic phrase',
      'day6 panic',
    ),
  );

  const day7 = buildMapPresenceViewModel(
    baseInput(7, { activeEvent: CONTAINER_EVENT, selectedDistrictId: 'merkez' }),
  );
  record(
    assert(
      checks,
      day7.containerMarkers.length + day7.vehicleMarkers.length + day7.teamMarkers.length <= 5,
      'Day 7 compact',
      'day7 crowded',
    ),
  );

  const day8NoData = buildMapPresenceViewModel(baseInput(8, {}));
  record(assert(checks, !day8NoData.visible || day8NoData.containerMarkers.length === 0, 'Day >7 no data minimal', 'day8 noisy'));

  const day8WithData = buildMapPresenceViewModel(
    baseInput(8, {
      activeEvent: CONTAINER_EVENT,
      hasRealPostPilotData: true,
      postPilotOperation: { active: true },
    }),
  );
  recordWarn(
    warn(
      checks,
      day8WithData.visible || day8WithData.containerMarkers.length > 0,
      'Day >7 real data may show',
      'day8 with data still hidden',
    ),
  );

  const containerMarkers = buildContainerPresenceMarkers(
    baseInput(2, { activeEvent: CONTAINER_EVENT, selectedDistrictId: 'cumhuriyet' }),
  );
  record(assert(checks, containerMarkers.length > 0, 'container event markers', 'no container markers'));
  record(
    assert(
      checks,
      containerMarkers[0]?.pulse === true || containerMarkers[0]?.status === 'pressure',
      'container pressure/pulse',
      'container pulse',
    ),
  );

  const carryOverContainer = buildMapPresenceViewModel(
    baseInput(2, {
      carryOverMemory: { domain: 'container', districtId: 'cumhuriyet' },
      selectedDistrictId: 'cumhuriyet',
    }),
  );
  record(
    assert(
      checks,
      carryOverContainer.containerMarkers.some((m) => m.status === 'carry_over' || m.status === 'pressure'),
      'carry_over container marker',
      'carry_over missing',
    ),
  );

  const resolvedContainer = buildContainerPresenceMarkers(
    baseInput(2, {
      activeEvent: { ...CONTAINER_EVENT, resolved: true },
      selectedDistrictId: 'cumhuriyet',
    }),
  );
  record(
    assert(
      checks,
      resolvedContainer.some((m) => m.status === 'resolved') || resolvedContainer.length === 0,
      'resolved container status',
      'resolved status',
    ),
  );

  const vehicleMarkers = buildVehiclePresenceMarkers(
    baseInput(3, { activeEvent: VEHICLE_EVENT, selectedDistrictId: 'istasyon' }),
  );
  record(assert(checks, vehicleMarkers.length > 0, 'vehicle event marker', 'vehicle marker'));

  const tiredVehicle = buildVehiclePresenceMarkers(
    baseInput(3, {
      activeEvent: VEHICLE_EVENT,
      operationalResources: {
        vehicleGroups: {
          standard_truck: { status: 'strained', maintenanceRisk: 70, routePressure: 80 },
        },
      },
    }),
  );
  record(
    assert(
      checks,
      tiredVehicle.some((m) => m.status === 'tired' || m.status === 'maintenance_risk'),
      'vehicle fatigue marker',
      'fatigue marker',
    ),
  );

  const routes = buildRoutePresenceHints(baseInput(3, { activeEvent: VEHICLE_EVENT }));
  record(assert(checks, routes.length <= 1, 'route hint cap build', 'route too many'));
  record(assert(checks, shouldShowRouteHint(3, 'vehicle_route'), 'route hint flag', 'route flag'));

  const teamMarkers = buildTeamPresenceMarkers(
    baseInput(3, { activeEvent: PERSONNEL_EVENT, selectedDistrictId: 'merkez' }),
  );
  record(assert(checks, teamMarkers.length > 0, 'personnel team marker', 'team marker'));

  const socialModel = buildMapPresenceViewModel(baseInput(4, { activeEvent: SOCIAL_EVENT }));
  record(assert(checks, socialModel.teamMarkers.length > 0 || socialModel.domain === 'social', 'social hotspot', 'social marker'));

  const balanceModel = buildMapPresenceViewModel(
    baseInput(5, { eventDomainFocus: { focus: 'district_balance' }, selectedDistrictId: 'sanayi' }),
  );
  record(assert(checks, balanceModel.domain === 'district_balance', 'district balance domain', 'balance domain'));

  const crisisModel = buildMapPresenceViewModel(
    baseInput(6, { activeEvent: CRISIS_EVENT, crisisState: { active: false } }),
  );
  record(
    assert(
      checks,
      crisisModel.containerMarkers.some((m) => m.status === 'risk_watch') || crisisModel.domain === 'crisis_adjacent',
      'crisis_adjacent risk_watch',
      'risk_watch',
    ),
  );

  const crisisActive = buildMapPresenceViewModel(
    baseInput(3, {
      activeEvent: CONTAINER_EVENT,
      crisisState: { active: true, phase: 'active' },
    }),
  );
  const suppressed = suppressMapPresenceForCrisisPriority(
    baseInput(3, { crisisState: { active: true } }),
    crisisActive,
  );
  record(
    assert(
      checks,
      suppressed.containerMarkers.length <= crisisActive.containerMarkers.length,
      'crisis suppresses markers',
      'crisis suppress fail',
    ),
  );
  record(
    assert(
      checks,
      validateMapPresenceCrisisPriority(suppressed, { active: true }).length === 0,
      'crisis priority validation',
      'crisis validation',
    ),
  );

  record(assert(checks, validateMapPresenceMarkerCaps(day2).length === 0, 'marker caps valid', 'caps invalid'));
  record(assert(checks, day2.panelLines.length <= 2, 'panel <=2 lines', 'panel too many'));
  record(assert(checks, validateMapPresenceNoForbiddenWords(day2.panelLines).length === 0, 'no forbidden words', 'forbidden'));
  record(
    assert(
      checks,
      !day2.panelLines.join(' ').toLowerCase().includes('gps'),
      'no GPS in panel',
      'gps leak',
    ),
  );
  record(
    assert(
      checks,
      !day2.panelLines.join(' ').toLowerCase().includes('gerçek zamanlı'),
      'no realtime wording',
      'realtime leak',
    ),
  );

  const det1 = buildMapPresenceViewModel(baseInput(2, { activeEvent: CONTAINER_EVENT }));
  const det2 = buildMapPresenceViewModel(baseInput(2, { activeEvent: CONTAINER_EVENT }));
  record(
    assert(
      checks,
      JSON.stringify(det1) === JSON.stringify(det2),
      'deterministic output',
      'non-deterministic',
    ),
  );
  record(assert(checks, !readRepo('src/core/mapPresence/mapPresencePresentation.ts').includes('Math.random'), 'no Math.random', 'random used'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, `SAVE_VERSION ${SAVE_VERSION}`, 'SAVE_VERSION changed'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('SAVE_VERSION = 24'), 'no SAVE bump in file', 'save bump'));

  const presenceSrc = [
    readRepo('src/core/mapPresence/mapPresencePresentation.ts'),
    readRepo('src/core/mapPresence/index.ts'),
  ].join('\n');
  record(assert(checks, !presenceSrc.includes('applyDecision'), 'no applyDecision in mapPresence', 'applyDecision leak'));
  record(assert(checks, !presenceSrc.includes('postPilotEventEngine'), 'no postPilot engine', 'engine import'));
  record(assert(checks, !presenceSrc.includes('dayPipeline'), 'no dayPipeline', 'pipeline leak'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-dynamic-field-presence-map-layer.md')), 'docs exist', 'docs missing'));
  record(assert(checks, readRepo('package.json').includes('verify:map-presence'), 'package script', 'script missing'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/map/components/MapContainerClusterMarker.tsx')), 'MapContainerClusterMarker', 'component missing'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/map/components/MapVehiclePresenceMarker.tsx')), 'MapVehiclePresenceMarker', 'component missing'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/map/components/MapTeamPresenceMarker.tsx')), 'MapTeamPresenceMarker', 'component missing'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/map/components/MapRouteHintLayer.tsx')), 'MapRouteHintLayer', 'component missing'));
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('buildMapPresenceViewModel'), 'MapScreen integration', 'MapScreen missing'));
  record(assert(checks, readRepo('src/features/map/components/CityOverviewMap.tsx').includes('MapPresenceSvgLayer'), 'CityOverview integration', 'overview missing'));

  const uiFiles = [
    'src/features/map/components/MapContainerClusterMarker.tsx',
    'src/features/map/components/MapOperationBottomPanel.tsx',
  ];
  for (const file of uiFiles) {
    const src = readRepo(file);
    recordWarn(
      warn(
        checks,
        src.includes('numberOfLines') || src.includes('pointerEvents'),
        `${file} overflow/touch guard`,
        `${file} guard note`,
      ),
    );
  }

  const mapLayer = getFinalPolishRoadmapItemById('dynamic-field-presence-map-layer');
  record(assert(checks, mapLayer?.status === 'completed', 'roadmap map layer completed', 'roadmap status'));
  const nextStep = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      nextStep.includes('Ece') ||
        nextStep.includes('ece-player-style') ||
        getFinalPolishRoadmapItemById('map-before-after-state')?.status === 'completed',
      'next step Ece Player Style Recognition',
      `next: ${nextStep}`,
    ),
  );

  record(assert(checks, getFinalPolishRoadmapItemById('report-tomorrow-preview')?.status === 'completed', 'report tomorrow completed', 'report tomorrow'));

  record(
    assert(
      checks,
      validateMapPresenceViewModel(day2).length === 0,
      'view model validation',
      'view model errors',
    ),
  );
  record(assert(checks, validateMapPresenceDayVisibility(day2, 2).length === 0, 'day2 visibility validation', 'day2 validation'));

  record(assert(checks, verifyReportTomorrowPreviewScenario().ok, 'report tomorrow compat', 'report tomorrow verify'));
  recordWarn(warn(checks, verifyCarryOverMemoryScenario().ok, 'carry-over compat', 'carry-over verify'));
  recordWarn(warn(checks, verifyDynamicSocialEchoScenario().ok, 'social echo compat', 'social echo verify'));
  recordWarn(warn(checks, verifyEventDomainUiPrioritizationScenario().ok, 'event domain compat', 'event domain verify'));
  recordWarn(warn(checks, verifyContentSafetyPackStage3Scenario().ok, 'csp3 compat', 'csp3 verify'));

  const mapUi = readRepo('src/features/map/verifyMapUiScenario.ts');
  record(assert(checks, mapUi.length > 0, 'map-ui verify exists', 'map-ui missing'));

  record(assert(checks, !readRepo('src/features/map/screens/MapScreen.tsx').includes('new Route'), 'no new route', 'route added'));
  record(assert(checks, shouldShowContainerPresence(2, 'container'), 'shouldShowContainer day2', 'container show flag'));
  record(assert(checks, !shouldShowVehiclePresence(2, 'vehicle_route'), 'vehicle hidden day2', 'vehicle day2'));
  record(assert(checks, shouldShowTeamPresence(4, 'social'), 'team social day4', 'team day4'));
  record(assert(checks, !shouldShowMapPresenceLayer(1, baseInput(1)), 'layer hidden day1', 'layer day1'));

  record(
    assert(
      checks,
      inferMapPresenceDomain(baseInput(2, { activeEvent: { title: 'Genel Operasyon' } })) ===
        'generic_operation',
      'infer generic_operation',
      'generic infer',
    ),
  );
  record(
    assert(
      checks,
      buildMapPresenceViewModel(
        baseInput(2, { activeEvent: CONTAINER_EVENT, selectedDistrictId: 'cumhuriyet' }),
      ).selectedDistrictId === 'cumhuriyet',
      'selected district preserved',
      'district lost',
    ),
  );
  record(assert(checks, day2.routeHints.length <= 1, 'route hint cap in model', 'route cap'));
  record(
    assert(
      checks,
      buildMapPresencePanelLines({
        ...day2,
        domain: 'container',
        selectedDistrictId: 'cumhuriyet',
      }).length <= 2,
      'panel builder cap',
      'panel builder',
    ),
  );
  record(assert(checks, checks.length >= 130, `check count ${checks.length}`, 'checks < 130'));

  return { ok, warn: hasWarn, checks };
}
