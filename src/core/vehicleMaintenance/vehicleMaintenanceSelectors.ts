import {
  VEHICLE_MAINTENANCE_FORBIDDEN_SURFACE_TERMS,
  VEHICLE_MAINTENANCE_PLAYER_LABELS,
  VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN,
} from './vehicleMaintenanceRuntimeConstants';
import type {
  VehicleMaintenanceDayCloseInput,
  VehicleMaintenanceStateV1,
  VehicleMaintenanceSurfaceLines,
} from './vehicleMaintenanceRuntimeTypes';

function containsForbiddenTerm(text: string): boolean {
  const normalized = ` ${text.toLocaleLowerCase('tr-TR')} `;
  return VEHICLE_MAINTENANCE_FORBIDDEN_SURFACE_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

function isDuplicateLine(candidate: string, existing: string[]): boolean {
  const key = candidate.toLocaleLowerCase('tr-TR').slice(0, 40);
  return existing.some((line) => line.toLocaleLowerCase('tr-TR').includes(key.slice(0, 20)));
}

function topSuggestedWindow(state: VehicleMaintenanceStateV1, day: number) {
  return state.maintenanceWindows
    .filter((w) => w.day === day && w.status === 'suggested')
    .sort((a, b) => b.priority - a.priority)[0];
}

export function selectVehicleMaintenanceSurfaceLines(
  state: VehicleMaintenanceStateV1 | null | undefined,
  input: Pick<VehicleMaintenanceDayCloseInput, 'day' | 'existingHubLines' | 'existingReportLines'>,
): VehicleMaintenanceSurfaceLines {
  if (!state || input.day < VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN) {
    return {};
  }

  const window = topSuggestedWindow(state, input.day);
  const groupId =
    window?.groupId ?? state.fatigueSummary.highestPressureGroupId ?? 'route_support';
  const label = VEHICLE_MAINTENANCE_PLAYER_LABELS[groupId];
  const group = state.fleetGroups[groupId];
  const hubExisting = input.existingHubLines ?? [];
  const reportExisting = input.existingReportLines ?? [];

  let hubLine: string | undefined;
  let reportLine: string | undefined;
  let mapHint: string | undefined;

  if (window) {
    hubLine = `Araç hattı: ${label} yarın hafif bakım penceresi istiyor.`;
    reportLine = `Araç bakım izi: ${label} yorgunluk kontrollü seviyeye çıktı.`;
    mapHint = `Araç desteği: ${label} bakım izinde.`;
  } else if ((group?.maintenanceNeedScore ?? 0) >= 45) {
    hubLine = `Araç hattı: ${label} yorgunluk izleniyor.`;
    reportLine = `Araç bakım izi: ${group?.playerVisibleLine ?? `${label} izleniyor.`}`;
    mapHint = `Saha desteği: ${label} baskı sinyali veriyor.`;
  } else if (input.day >= VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN && group?.conditionBand === 'stable') {
    reportLine = `Araç bakım izi: Bugünkü dengeli rota, destek hattını rahatlattı.`;
  }

  if (hubLine && (containsForbiddenTerm(hubLine) || isDuplicateLine(hubLine, hubExisting))) {
    hubLine = undefined;
  }
  if (reportLine && (containsForbiddenTerm(reportLine) || isDuplicateLine(reportLine, reportExisting))) {
    reportLine = undefined;
  }
  if (mapHint && containsForbiddenTerm(mapHint)) {
    mapHint = undefined;
  }

  const journalLabel =
    window?.status === 'completed'
      ? 'Filo toparlandı'
      : window
        ? 'Bakım penceresi'
        : group?.maintenanceNeedScore && group.maintenanceNeedScore >= 45
          ? 'Araç bakım izi'
          : undefined;

  return { hubLine, reportLine, mapHint, journalLabel };
}

export function shouldShowVehicleMaintenanceHubLine(
  state: VehicleMaintenanceStateV1 | null | undefined,
  day: number,
): boolean {
  return Boolean(selectVehicleMaintenanceSurfaceLines(state, { day }).hubLine);
}
