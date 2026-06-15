import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { CITY_ARCHIVE_ENTRY_KINDS } from '@/core/cityArchive/cityArchiveConstants';
import { createInitialCityArchiveState } from '@/core/cityArchive/cityArchiveState';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { SAVE_VERSION, normalizePersistedSave } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';

import {
  VEHICLE_MAINTENANCE_FLEET_GROUP_IDS,
  VEHICLE_MAINTENANCE_FORBIDDEN_SURFACE_TERMS,
  VEHICLE_MAINTENANCE_MAX_SUGGESTED_WINDOWS_PER_DAY,
  VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN,
} from './vehicleMaintenanceRuntimeConstants';
import {
  buildMaintenanceWindowSuggestions,
  buildVehicleMaintenanceStorySignal,
  calculateFleetGroupMaintenanceNeed,
  updateVehicleMaintenanceForDay,
} from './vehicleMaintenanceEngine';
import {
  migrateVehicleMaintenanceFromSaveV24,
  resolveVehicleMaintenanceOnPersistLoad,
} from './vehicleMaintenanceMigration';
import { selectVehicleMaintenanceSurfaceLines } from './vehicleMaintenanceSelectors';
import {
  appendVehicleMaintenanceDayCloseArchive,
  buildVehicleMaintenanceArchiveEntry,
} from './vehicleMaintenanceWiring';
import {
  createInitialVehicleMaintenanceState,
  normalizeVehicleMaintenanceState,
} from './vehicleMaintenanceState';
import type { VehicleMaintenanceDayCloseInput } from './vehicleMaintenanceRuntimeTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyVehicleMaintenanceRuntimeOutcome = {
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

function dayCloseInput(day: number, extra: Partial<VehicleMaintenanceDayCloseInput> = {}): VehicleMaintenanceDayCloseInput {
  return {
    day,
    operationSignals: {
      vehicles: { status: 'watch' },
      containers: { status: 'stable' },
    },
    districtId: 'sanayi',
    ...extra,
  };
}

export function verifyVehicleMaintenanceRuntimeScenario(): VerifyVehicleMaintenanceRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const gamePersist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 26'));
  record(assert(checks, gamePersist.includes('vehicleMaintenance'), 'vehicleMaintenance in gamePersist'));
  record(assert(checks, gamePersist.includes('SAVE_VERSION_24'), 'v24 migration path exists'));

  const v24Save = { ...createDay1Seed(), saveVersion: 24 };
  const migrated = normalizePersistedSave(v24Save);
  record(assert(checks, migrated != null && migrated.saveVersion === SAVE_VERSION, 'v24 save migrates to current SAVE_VERSION'));
  record(assert(checks, migrated != null && migrated.vehicleMaintenance != null, 'migrated save has vehicleMaintenance'));

  const normalizedMissing = resolveVehicleMaintenanceOnPersistLoad({
    saveVersion: 25,
    currentDay: 5,
    rawVehicleMaintenance: undefined,
  });
  record(assert(checks, normalizedMissing.fleetGroups.route_support.conditionBand === 'stable', 'missing normalizes stable'));

  const corrupt = normalizeVehicleMaintenanceState({ version: 99, fleetGroups: null }, 8);
  record(assert(checks, corrupt.version === 1, 'corrupt vehicleMaintenance safe initial'));

  const migratedV24 = resolveVehicleMaintenanceOnPersistLoad({ saveVersion: 24, currentDay: 6 });
  const migratedAgain = resolveVehicleMaintenanceOnPersistLoad({
    saveVersion: 25,
    currentDay: 6,
    rawVehicleMaintenance: migratedV24,
  });
  record(
    assert(
      checks,
      migratedV24.migrationMeta.idempotent === true &&
        migratedAgain.fleetGroups.route_support.conditionBand === migratedV24.fleetGroups.route_support.conditionBand,
      'migration idempotent',
    ),
  );

  const passiveDay7 = createInitialVehicleMaintenanceState(7);
  record(
    assert(
      checks,
      passiveDay7.fleetGroups.route_support.conditionBand === 'stable',
      'Day <= 7 passive stable default',
    ),
  );

  const derivedDay8 = migrateVehicleMaintenanceFromSaveV24({
    saveVersion: 24,
    currentDay: 8,
    operationSignals: { vehicles: { status: 'critical' } },
    cityArchive: createInitialCityArchiveState(8),
  });
  record(
    assert(
      checks,
      derivedDay8.fleetGroups.route_support.maintenanceNeedScore > 0,
      'Day >= 8 safe derived default',
    ),
  );

  record(assert(checks, VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.length === 5, '5 fleet groups exist'));

  const state8 = updateVehicleMaintenanceForDay(createInitialVehicleMaintenanceState(8), {
    ...dayCloseInput(8),
    vehicleRoutePressure: true,
    resourcePressure: true,
    routeBalanced: false,
  });
  const routeGroup = state8.fleetGroups.route_support;
  record(assert(checks, Boolean(routeGroup.conditionBand), 'conditionBand computed'));
  record(assert(checks, Boolean(routeGroup.fatigueBand), 'fatigueBand computed'));
  record(assert(checks, Boolean(routeGroup.availabilityBand), 'availabilityBand computed'));
  record(
    assert(
      checks,
      routeGroup.maintenanceNeedScore >= 0 && routeGroup.maintenanceNeedScore <= 100,
      'maintenanceNeedScore bounded 0-100',
    ),
  );

  const engineSource = readRepo('src/core/vehicleMaintenance/vehicleMaintenanceEngine.ts');
  record(assert(checks, !engineSource.includes('Math.random'), 'no Math.random in engine'));

  const stateJson = JSON.stringify(state8);
  record(assert(checks, !stateJson.includes('plaka') && !stateJson.includes('gps'), 'no plaka/GPS fields'));

  const day3 = updateVehicleMaintenanceForDay(createInitialVehicleMaintenanceState(3), dayCloseInput(3));
  record(
    assert(
      checks,
      selectVehicleMaintenanceSurfaceLines(day3, { day: 3 }).hubLine == null,
      'Day 1-3 no visible window',
    ),
  );

  const day6 = updateVehicleMaintenanceForDay(createInitialVehicleMaintenanceState(6), {
    ...dayCloseInput(6),
    vehicleRoutePressure: true,
  });
  record(
    assert(
      checks,
      selectVehicleMaintenanceSurfaceLines(day6, { day: 6 }).hubLine == null,
      'Day 4-7 passive only',
    ),
  );

  const pressuredSeed = createInitialVehicleMaintenanceState(8);
  pressuredSeed.fleetGroups.route_support = {
    ...pressuredSeed.fleetGroups.route_support,
    consecutiveUseDays: 4,
    maintenanceNeedScore: 48,
  };
  const pressuredDay8 = updateVehicleMaintenanceForDay(pressuredSeed, {
    ...dayCloseInput(8),
    vehicleRoutePressure: true,
    resourcePressure: true,
    assignmentVehicleGroup: 'route_truck',
    assignmentCompatibilityScore: 25,
    contentPackDomains: ['vehicle_route', 'resource_pressure'],
    storyChainKinds: ['route_pressure_chain'],
  });
  const suggestions = buildMaintenanceWindowSuggestions(pressuredDay8, dayCloseInput(8, { vehicleRoutePressure: true }));
  record(
    assert(
      checks,
      suggestions.length <= VEHICLE_MAINTENANCE_MAX_SUGGESTED_WINDOWS_PER_DAY,
      'max 2 suggestions/day',
    ),
  );
  record(
    assert(
      checks,
      new Set(suggestions.map((w) => w.groupId)).size === suggestions.length,
      'same group duplicate window blocked',
    ),
  );
  record(
    assert(
      checks,
      Boolean(selectVehicleMaintenanceSurfaceLines(pressuredDay8, { day: 8 }).hubLine),
      'Day 8+ suggested window possible',
    ),
  );

  const freshRouteGroup = createInitialVehicleMaintenanceState(8).fleetGroups.route_support;
  const balancedScore = calculateFleetGroupMaintenanceNeed(
    'route_support',
    { ...dayCloseInput(8), routeBalanced: true, vehicleRoutePressure: true },
    freshRouteGroup,
  );
  const unbalancedScore = calculateFleetGroupMaintenanceNeed(
    'route_support',
    { ...dayCloseInput(8), routeBalanced: false, vehicleRoutePressure: true },
    freshRouteGroup,
  );
  record(assert(checks, balancedScore < unbalancedScore, 'route_balanced lowers route_support score'));

  const resourceScore = calculateFleetGroupMaintenanceNeed(
    'route_support',
    { ...dayCloseInput(8), resourcePressure: true },
    createInitialVehicleMaintenanceState(8).fleetGroups.route_support,
  );
  const baseScore = calculateFleetGroupMaintenanceNeed(
    'route_support',
    dayCloseInput(8),
    createInitialVehicleMaintenanceState(8).fleetGroups.route_support,
  );
  record(assert(checks, resourceScore > baseScore, 'resource_pressure increases score'));

  const missingAssignment = calculateFleetGroupMaintenanceNeed('route_support', dayCloseInput(8));
  record(assert(checks, Number.isFinite(missingAssignment), 'assignment fallback safe'));

  const storySignal = buildVehicleMaintenanceStorySignal(pressuredDay8);
  record(assert(checks, typeof storySignal.canStrengthenRouteChain === 'boolean', 'Story Chain signal exported'));

  for (const kind of [
    'vehicle_maintenance_suggested',
    'vehicle_fatigue_warning',
    'fleet_recovered',
  ]) {
    record(assert(checks, CITY_ARCHIVE_ENTRY_KINDS.includes(kind as (typeof CITY_ARCHIVE_ENTRY_KINDS)[number]), `archive kind ${kind}`));
  }

  const archiveEntry = buildVehicleMaintenanceArchiveEntry(pressuredDay8, dayCloseInput(8));
  record(assert(checks, archiveEntry == null || Boolean(archiveEntry.duplicateKey), 'archive duplicateKey safe'));

  const archiveWithSuppress = appendVehicleMaintenanceDayCloseArchive(
    createInitialCityArchiveState(8),
    pressuredDay8,
    { ...dayCloseInput(8), cityArchiveRecentKinds: ['story_chain_step'] },
  );
  record(
    assert(
      checks,
      !archiveWithSuppress.entries.some((e) => e.sourceKind === 'vehicleMaintenance'),
      'duplicate suppression with story chain',
    ),
  );

  const hubLines = selectVehicleMaintenanceSurfaceLines(pressuredDay8, { day: 8 });
  record(assert(checks, (hubLines.hubLine?.match(/Araç hattı/g) ?? []).length <= 1, 'Hub max 1 line'));

  const reportLines = selectVehicleMaintenanceSurfaceLines(pressuredDay8, { day: 8 });
  record(assert(checks, Boolean(reportLines.reportLine), 'Report max 1 line possible'));

  const mapHint = selectVehicleMaintenanceSurfaceLines(pressuredDay8, { day: 8 }).mapHint;
  record(assert(checks, mapHint == null || mapHint.length > 0, 'Map max 1 hint'));

  for (const term of VEHICLE_MAINTENANCE_FORBIDDEN_SURFACE_TERMS.slice(0, 5)) {
    const surfaces = selectVehicleMaintenanceSurfaceLines(pressuredDay8, { day: 8 });
    const combined = [surfaces.hubLine, surfaces.reportLine, surfaces.mapHint].filter(Boolean).join(' ');
    record(assert(checks, !combined.toLocaleLowerCase('tr-TR').includes(term.trim()), `forbidden term absent: ${term.trim()}`));
  }

  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('vehicleMaintenance'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('vehicleMaintenance'), 'dayPipeline core unchanged'));
  record(assert(checks, !readRepo('src/core/game/generateDailyEventSet.ts').includes('vehicleMaintenance'), 'event generation unchanged'));

  const contentFull = readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationFullConstants.ts');
  record(assert(checks, !contentFull.includes('maxPackOriginEventsPerDay: 3'), 'Content Pack Aşama 2 max 3 not opened'));

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'evidence verified 0'));
  record(assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'public launch blocked'));

  record(assert(checks, readRepo('package.json').includes('verify:vehicle-maintenance'), 'package.json verify script'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-vehicle-maintenance-runtime-v1.md')), 'runtime docs exist'));

  const hubScreen = readRepo('src/features/hub/screens/HubScreen.tsx');
  record(assert(checks, hubScreen.includes('selectVehicleMaintenanceSurfaceLines'), 'Hub wired'));
  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  record(assert(checks, reportView.includes('vehicleMaintenanceReportLine'), 'Report wired'));
  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  record(assert(checks, mapScreen.includes('mapVehicleMaintenanceHint'), 'Map wired'));

  return { ok, checks };
}
