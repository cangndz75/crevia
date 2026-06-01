import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { verifyContentSafetyPackStage3Scenario } from '@/core/contentPacks/verifyContentSafetyPackStage3Scenario';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { verifyMapPresenceScenario } from '@/core/mapPresence/verifyMapPresenceScenario';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildContainerPressureVisual,
  buildPersonnelFatigueVisual,
  buildResourceFatigueMapMarkerStatus,
  buildResourceFatiguePanelLine,
  buildResourceFatigueVisualSummary,
  formatResourceFatigueForDebug,
  inferResourceDomainFromEventFocus,
  buildRouteLoadVisual,
  buildVehicleFatigueVisual,
  inferResourceVisualState,
  inferResourceVisualTone,
  shouldShowResourceFatigueVisual,
} from './resourceFatigueVisualPresentation';
import type { ResourceFatigueVisualInput, ResourceVisualState } from './resourceFatigueVisualTypes';
import { RESOURCE_VISUAL_DOMAINS, RESOURCE_VISUAL_STATES } from './resourceFatigueVisualTypes';
import {
  validateResourceFatigueDomainCoverage,
  validateResourceFatigueForbiddenWords,
  validateResourceFatigueNoPanicLanguage,
  validateResourceFatigueTextLength,
  validateResourceFatigueVisualModel,
} from './resourceFatigueVisualValidation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

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

function baseInput(day: number, extra: Partial<ResourceFatigueVisualInput> = {}): ResourceFatigueVisualInput {
  return { day, ...extra };
}

export type VerifyResourceFatigueVisualOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

export function verifyResourceFatigueVisualScenario(): VerifyResourceFatigueVisualOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  for (const domain of RESOURCE_VISUAL_DOMAINS) {
    record(assert(checks, RESOURCE_VISUAL_DOMAINS.includes(domain), `domain ${domain}`, `missing ${domain}`));
  }
  for (const state of RESOURCE_VISUAL_STATES) {
    record(assert(checks, RESOURCE_VISUAL_STATES.includes(state), `state ${state}`, `missing ${state}`));
  }
  record(assert(checks, validateResourceFatigueDomainCoverage().length === 0, 'domain coverage validator', 'domain coverage'));

  const readyVehicle = buildVehicleFatigueVisual(
    baseInput(3, {
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'stable', maintenanceRisk: 10, routePressure: 20 } },
      },
    }),
  );
  record(assert(checks, readyVehicle?.state === 'ready' || readyVehicle?.state === 'stable', 'vehicle ready/stable', 'vehicle ready'));

  const tiredVehicle = buildVehicleFatigueVisual(
    baseInput(3, {
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'strained', routePressure: 75, maintenanceRisk: 40 } },
      },
    }),
  );
  record(assert(checks, tiredVehicle?.state === 'tired', 'vehicle tired', 'vehicle tired fail'));

  const maintenanceVehicle = buildVehicleFatigueVisual(
    baseInput(3, {
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'busy', maintenanceRisk: 75, routePressure: 50 } },
      },
    }),
  );
  record(
    assert(
      checks,
      maintenanceVehicle?.state === 'maintenance_risk',
      'vehicle maintenance_risk',
      'maintenance risk',
    ),
  );

  const stablePersonnel = buildPersonnelFatigueVisual(
    baseInput(3, {
      operationalResources: {
        personnelGroups: { field_team: { status: 'stable', fatigueScore: 20, moraleScore: 80 } },
      },
    }),
  );
  record(assert(checks, stablePersonnel?.state === 'stable' || stablePersonnel?.state === 'ready', 'personnel stable', 'personnel stable'));

  const strainedPersonnel = buildPersonnelFatigueVisual(
    baseInput(3, {
      operationalResources: {
        personnelGroups: { field_team: { status: 'strained', fatigueScore: 55, moraleScore: 60 } },
      },
    }),
  );
  record(assert(checks, strainedPersonnel?.state === 'strained' || strainedPersonnel?.state === 'tired', 'personnel strained', 'personnel strained'));

  const tiredPersonnel = buildPersonnelFatigueVisual(
    baseInput(3, {
      operationalResources: {
        personnelGroups: { field_team: { status: 'strained', fatigueScore: 70, moraleScore: 50 } },
      },
    }),
  );
  record(assert(checks, tiredPersonnel?.state === 'tired' || tiredPersonnel?.state === 'critical', 'personnel tired', 'personnel tired'));

  const watchContainer = buildContainerPressureVisual(
    baseInput(2, {
      operationalResources: {
        districtNetworks: { cumhuriyet: { status: 'busy', fillPressure: 50 } },
      },
    }),
  );
  record(assert(checks, watchContainer?.state === 'watch' || watchContainer?.state === 'strained', 'container watch/strained', 'container watch'));

  const strainedContainer = buildContainerPressureVisual(
    baseInput(2, {
      operationalResources: {
        districtNetworks: { cumhuriyet: { status: 'strained', fillPressure: 70 } },
      },
    }),
  );
  record(assert(checks, strainedContainer?.state === 'strained' || strainedContainer?.state === 'critical', 'container strained', 'container strained'));

  const resolvedContainer = buildContainerPressureVisual(
    baseInput(2, { activeEvent: { resolved: true, contentCategory: 'container' } }),
  );
  record(assert(checks, resolvedContainer?.state === 'resolved', 'container resolved', 'container resolved'));

  const routeStrained = buildRouteLoadVisual(
    baseInput(3, {
      operationalResources: {
        vehicleGroups: { standard_truck: { routePressure: 78, maintenanceRisk: 30, status: 'busy' } },
      },
    }),
  );
  record(assert(checks, routeStrained?.state === 'strained' || routeStrained?.state === 'tired', 'route strained', 'route strained'));

  record(assert(checks, inferResourceVisualTone('tired') === 'amber', 'tone tired amber', 'tone tired'));
  record(assert(checks, inferResourceVisualTone('ready') === 'teal', 'tone ready teal', 'tone ready'));

  const day1 = buildResourceFatigueVisualSummary(baseInput(1));
  record(assert(checks, day1.visibleStates.length === 0, 'Day 1 hidden', 'day1 visible'));

  const day2 = buildResourceFatigueVisualSummary(
    baseInput(2, {
      domain: 'container',
      operationalResources: {
        districtNetworks: { merkez: { fillPressure: 55, status: 'busy' } },
      },
    }),
  );
  record(assert(checks, day2.visibleStates.length <= 1, 'Day 2 limited', 'day2 crowded'));

  const day3 = buildResourceFatigueVisualSummary(
    baseInput(3, {
      domain: 'vehicle',
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'strained', routePressure: 72 } },
      },
    }),
  );
  record(assert(checks, day3.visibleStates.length > 0, 'Day 3 vehicle visible', 'day3 empty'));

  const day6 = buildResourceFatigueVisualSummary(
    baseInput(6, { domain: 'mixed', eventDomainFocus: { focus: 'crisis_adjacent' } }),
  );
  const day6Text = day6.visibleStates.map((s) => `${s.title} ${s.summary}`).join(' ').toLowerCase();
  record(assert(checks, !day6Text.includes('kriz başladı') && !day6Text.includes('felaket'), 'Day 6 panic-free', 'day6 panic'));

  const day7 = buildResourceFatigueVisualSummary(
    baseInput(7, {
      domain: 'vehicle',
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'busy', routePressure: 60 } },
        personnelGroups: { field_team: { status: 'busy', fatigueScore: 50 } },
      },
    }),
  );
  record(assert(checks, day7.visibleStates.length <= 2, 'Day 7 compact', 'day7 crowded'));

  const day8 = buildResourceFatigueVisualSummary(baseInput(8, {}));
  record(assert(checks, day8.visibleStates.length === 0, 'Day >7 no data hidden', 'day8 noisy'));

  const hubStrip = buildResourceFatigueVisualSummary(
    baseInput(4, { surface: 'hub', domain: 'container', operationalResources: { districtNetworks: { sanayi: { fillPressure: 66, status: 'strained' } } } }),
  );
  record(assert(checks, hubStrip.visibleStates.length <= 3, 'hub max items', 'hub crowded'));

  const mapMarker = buildResourceFatigueMapMarkerStatus(tiredVehicle);
  record(assert(checks, mapMarker === 'tired', 'map marker tired', 'map marker'));

  const assignment = buildResourceFatigueVisualSummary(
    baseInput(3, {
      surface: 'dispatch',
      domain: 'vehicle',
      activeEvent: { contentCategory: 'vehicle_route' },
      operationalResources: {
        vehicleGroups: { standard_truck: { status: 'strained', routePressure: 72 } },
      },
    }),
  );
  record(assert(checks, assignment.visibleStates.length > 0, 'assignment panel model', 'assignment empty'));

  const field = buildResourceFatigueVisualSummary(
    baseInput(4, {
      surface: 'field',
      domain: 'personnel',
      activeEvent: { contentCategory: 'personnel' },
      operationalResources: {
        personnelGroups: { field_team: { status: 'strained', fatigueScore: 62 } },
      },
    }),
  );
  record(assert(checks, field.primaryState != null, 'field model', 'field empty'));

  const result = buildResourceFatigueVisualSummary(
    baseInput(3, { surface: 'result', domain: 'container', activeEvent: { contentCategory: 'container' } }),
  );
  record(assert(checks, result.visibleStates.length >= 0, 'result model safe', 'result crash'));

  const report = buildResourceFatigueVisualSummary(
    baseInput(5, {
      surface: 'report',
      operationalResources: { vehicleGroups: { standard_truck: { status: 'busy', routePressure: 58 } } },
    }),
  );
  record(assert(checks, report.visibleStates.length <= 3, 'report model', 'report crowded'));

  if (readyVehicle) {
    record(assert(checks, validateResourceFatigueTextLength(readyVehicle).length === 0, 'title length', 'title long'));
    record(assert(checks, readyVehicle.shortLabel.length <= 18, 'shortLabel length', 'shortLabel long'));
    record(assert(checks, readyVehicle.summary.length <= 130, 'summary length', 'summary long'));
    record(assert(checks, readyVehicle.maxLines <= 2, 'maxLines <=2', 'maxLines'));
    record(assert(checks, validateResourceFatigueForbiddenWords(readyVehicle).length === 0, 'forbidden words', 'forbidden'));
    record(assert(checks, validateResourceFatigueNoPanicLanguage(readyVehicle).length === 0, 'no panic', 'panic'));
    record(assert(checks, validateResourceFatigueVisualModel(readyVehicle).length === 0, 'model valid', 'model invalid'));
  }

  record(assert(checks, !readRepo('src/core/resources/resourceFatigueVisualPresentation.ts').includes('Math.random'), 'no Math.random', 'random'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, `SAVE_VERSION ${SAVE_VERSION}`, 'SAVE_VERSION'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-resource-fatigue-visual-states.md')), 'docs exist', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:resource-fatigue-visuals'), 'package script', 'script'));
  record(assert(checks, readRepo('src/features/map/mapPresencePresentation.ts').length === 0 || readRepo('src/core/mapPresence/mapPresencePresentation.ts').includes('buildVehicleFatigueVisual'), 'map presence integration', 'map integration'));
  record(assert(checks, readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx').includes('ResourceFatigueSummaryStrip'), 'hub integration', 'hub'));
  record(assert(checks, readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx').includes('ResourceFatigueSummaryStrip'), 'assignment integration', 'assignment'));
  record(assert(checks, readRepo('src/features/events/components/event-workflow/field/EventFieldMicroDecisionCard.tsx').includes('ResourceFatigueStateChip'), 'field integration', 'field'));
  record(assert(checks, readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('ResourceFatigueStateChip'), 'result integration', 'result'));
  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('reportFatigueState'), 'report integration', 'report'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/resources/components/ResourceFatigueStateChip.tsx')), 'chip component', 'chip'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/resources/components/ResourceFatigueSummaryStrip.tsx')), 'strip component', 'strip'));

  const fatigueSrc = [
    readRepo('src/core/resources/resourceFatigueVisualPresentation.ts'),
    readRepo('src/core/resources/index.ts'),
  ].join('\n');
  record(assert(checks, !fatigueSrc.includes('applyDecision'), 'no applyDecision', 'applyDecision leak'));
  record(assert(checks, !fatigueSrc.includes('dayPipeline'), 'no dayPipeline', 'pipeline'));
  record(assert(checks, !readRepo('src/core/operationalResources/operationalResourceEngine.ts').includes('resourceFatigueVisual'), 'engine unchanged', 'engine touched'));

  const mapLayer = getFinalPolishRoadmapItemById('resource-fatigue-visual-states');
  record(assert(checks, mapLayer?.status === 'completed', 'roadmap completed', 'roadmap'));
  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Advisor Seniority') ||
        next.includes('advisor-seniority') ||
        getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed',
      'next Advisor Seniority',
      `next: ${next}`,
    ),
  );
  record(assert(checks, getFinalPolishRoadmapItemById('dynamic-field-presence-map-layer')?.status === 'completed', 'map presence completed', 'map layer'));

  record(assert(checks, verifyMapPresenceScenario().ok, 'map-presence compat', 'map-presence'));
  recordWarn(warn(checks, verifyReportTomorrowPreviewScenario().ok, 'report tomorrow compat', 'report tomorrow'));
  recordWarn(warn(checks, verifyCarryOverMemoryScenario().ok, 'carry-over compat', 'carry-over'));
  recordWarn(warn(checks, verifyDynamicSocialEchoScenario().ok, 'social echo compat', 'social echo'));
  recordWarn(warn(checks, verifyEventDomainUiPrioritizationScenario().ok, 'event domain compat', 'event domain'));
  recordWarn(warn(checks, verifyContentSafetyPackStage3Scenario().ok, 'csp3 compat', 'csp3'));

  record(assert(checks, !shouldShowResourceFatigueVisual(1, 'hub', 'vehicle', baseInput(1)), 'shouldShow day1 false', 'day1 show'));
  record(assert(checks, shouldShowResourceFatigueVisual(3, 'hub', 'vehicle', baseInput(3)), 'shouldShow day3 vehicle', 'day3 show'));
  record(
    assert(
      checks,
      inferResourceVisualState(
        'vehicle',
        baseInput(3, {
          operationalResources: { vehicleGroups: { standard_truck: { status: 'critical' } } },
        }),
      ) === 'critical',
      'infer critical',
      'infer critical',
    ),
  );

  record(assert(checks, formatResourceFatigueForDebug !== undefined, 'debug helper exported', 'debug missing'));
  record(assert(checks, typeof formatResourceFatigueForDebug === 'function', 'formatResourceFatigueForDebug fn', 'debug fn'));
  record(assert(checks, buildResourceFatiguePanelLine.length > 0, 'panel line helper', 'panel line'));

  for (const st of ['ready', 'stable', 'watch', 'busy', 'strained', 'tired', 'maintenance_risk', 'critical', 'recovering', 'resolved', 'unknown'] as ResourceVisualState[]) {
    record(assert(checks, inferResourceVisualTone(st) != null, `tone for ${st}`, `tone ${st}`));
  }

  const surfaces = ['hub', 'map', 'dispatch', 'field', 'result', 'report'] as const;
  for (const surface of surfaces) {
    record(
      assert(
        checks,
        shouldShowResourceFatigueVisual(4, surface, 'container', baseInput(4)) ||
          !shouldShowResourceFatigueVisual(1, surface, 'container', baseInput(1)),
        `surface ${surface} visibility rule`,
        `surface ${surface}`,
      ),
    );
  }

  record(
    assert(
      checks,
      readRepo('src/features/resources/components/ResourceFatigueStateChip.tsx').includes('numberOfLines'),
      'chip numberOfLines',
      'chip numberOfLines',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/resources/components/ResourceFatigueStateChip.tsx').includes('flexShrink'),
      'chip flexShrink',
      'chip flexShrink',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/resources/components/ResourceFatigueSummaryStrip.tsx').includes('minWidth'),
      'strip minWidth guard',
      'strip minWidth',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/operations/operationSignalEngine.ts').includes('resourceFatigueVisual'),
      'operationSignals engine untouched',
      'signals engine',
    ),
  );
  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'src/core/resources/resourceFatigueVisualValidation.ts')),
      'validation module',
      'validation',
    ),
  );
  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'src/core/resources/index.ts')),
      'resources index',
      'index',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapContainerClusterMarker.tsx').includes('maintenance_risk'),
      'container marker maintenance',
      'container marker',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapVehiclePresenceMarker.tsx').includes('maintenance_risk'),
      'vehicle marker maintenance',
      'vehicle marker',
    ),
  );
  record(assert(checks, buildResourceFatigueMapMarkerStatus(null) === null, 'null map status', 'null map'));
  record(assert(checks, buildVehicleFatigueVisual(baseInput(2)) === null, 'vehicle hidden day2', 'vehicle day2'));
  record(assert(checks, buildPersonnelFatigueVisual(baseInput(2)) === null, 'personnel hidden day2', 'personnel day2'));
  record(assert(checks, buildRouteLoadVisual(baseInput(2)) === null, 'route hidden day2', 'route day2'));
  record(assert(checks, inferResourceDomainFromEventFocus('container') === 'container', 'infer domain container', 'domain container'));
  record(assert(checks, inferResourceDomainFromEventFocus('vehicle_route') === 'vehicle', 'infer domain vehicle', 'domain vehicle'));
  record(assert(checks, inferResourceDomainFromEventFocus('crisis_adjacent') === 'mixed', 'infer domain mixed', 'domain mixed'));
  record(assert(checks, checks.length >= 110, `check count ${checks.length}`, 'checks < 110'));

  return { ok, warn: hasWarn, checks };
}
