import {
  TEAM_SPECIALIZATION_FORBIDDEN_SURFACE_TERMS,
  TEAM_SPECIALIZATION_PASSIVE_DAY_MAX,
  TEAM_SPECIALIZATION_VISIBLE_DAY_MIN,
} from './teamSpecializationRuntimeConstants';
import {
  buildCombinedVehicleTeamStrainLine,
  buildTeamSpecializationAssignmentHint,
  buildTeamSpecializationCityJournalEntry,
  buildTeamSpecializationHubLine,
  buildTeamSpecializationMapLine,
  buildTeamSpecializationReportLine,
  hasMeaningfulTeamSpecializationSurfaceData,
  isTeamSpecializationPositivePresentationLine,
  isTeamSpecializationStrainPresentationLine,
} from './teamSpecializationRuntimePresentation';
import type {
  TeamSpecializationDayCloseInput,
  TeamSpecializationStateV1,
  TeamSpecializationSurfaceLines,
} from './teamSpecializationRuntimeTypes';

function containsForbiddenTerm(text: string): boolean {
  const normalized = ` ${text.toLocaleLowerCase('tr-TR')} `;
  return TEAM_SPECIALIZATION_FORBIDDEN_SURFACE_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

function isDuplicateLine(candidate: string, existing: string[]): boolean {
  const key = candidate.toLocaleLowerCase('tr-TR').slice(0, 40);
  return existing.some((line) => line.toLocaleLowerCase('tr-TR').includes(key.slice(0, 20)));
}

function sanitizePresentationLine(line?: string): string | undefined {
  if (!line?.trim()) return undefined;
  const trimmed = line.trim();
  if (
    trimmed.includes('undefined') ||
    trimmed.includes('null') ||
    trimmed.includes('team_fatigue_warning')
  ) {
    return undefined;
  }
  if (containsForbiddenTerm(trimmed)) return undefined;
  return trimmed;
}

function applyHubDensityGuard(
  hubLine: string | undefined,
  input: Pick<TeamSpecializationDayCloseInput, 'hubDensityContext'>,
): string | undefined {
  if (!hubLine) return undefined;

  const density = input.hubDensityContext;
  const isStrain = isTeamSpecializationStrainPresentationLine(hubLine);
  const isPositive = isTeamSpecializationPositivePresentationLine(hubLine);

  if (isStrain) return hubLine;

  const crowdedInsightCount = density?.existingInsightLineCount ?? 0;
  const denseSurface =
    crowdedInsightCount >= 3 ||
    Boolean(density?.hasActiveOperationInsight) ||
    Boolean(density?.hasAuthorityPreview) ||
    Boolean(density?.hasDistrictExpansion) ||
    Boolean(density?.hasBadgeShowcase);

  if (denseSurface && isPositive) return undefined;
  if ((density?.hasAuthorityPreview || density?.hasDistrictExpansion) && isPositive) {
    return undefined;
  }
  if (density?.hasBadgeShowcase && isPositive && crowdedInsightCount >= 2) {
    return undefined;
  }

  return hubLine;
}

function applyVehicleTeamStrainCopyGuard(
  surfaces: TeamSpecializationSurfaceLines,
  input: Pick<
    TeamSpecializationDayCloseInput,
    'vehicleMaintenanceLine' | 'vehicleMaintenanceStrainActive'
  >,
): TeamSpecializationSurfaceLines {
  const vehicleLine = input.vehicleMaintenanceLine;
  if (!vehicleLine || !input.vehicleMaintenanceStrainActive) {
    return surfaces;
  }

  const merged = buildCombinedVehicleTeamStrainLine(
    vehicleLine,
    surfaces.reportLine ?? surfaces.hubLine ?? surfaces.mapHint,
  );
  if (!merged) return surfaces;

  const next: TeamSpecializationSurfaceLines = { ...surfaces, mergedStrainLine: merged };

  if (surfaces.reportLine && isTeamSpecializationStrainPresentationLine(surfaces.reportLine)) {
    next.reportLine = merged;
    next.suppressVehicleMaintenanceLine = true;
    return next;
  }

  if (surfaces.hubLine && isTeamSpecializationStrainPresentationLine(surfaces.hubLine)) {
    next.hubLine = merged;
    next.suppressVehicleMaintenanceLine = true;
    return next;
  }

  if (surfaces.mapHint && isTeamSpecializationStrainPresentationLine(surfaces.mapHint)) {
    next.mapHint = merged;
    next.suppressVehicleMaintenanceLine = true;
  }

  return next;
}

export function evaluateTeamSpecializationDayVisibility(day: number): {
  allowed: boolean;
  visibility: 'hidden' | 'passive_hint' | 'visible';
} {
  if (day <= 3) return { allowed: false, visibility: 'hidden' };
  if (day <= TEAM_SPECIALIZATION_PASSIVE_DAY_MAX) {
    return { allowed: false, visibility: 'passive_hint' };
  }
  return { allowed: true, visibility: 'visible' };
}

export function selectTeamSpecializationSurfaceLines(
  state: TeamSpecializationStateV1 | null | undefined,
  input: Pick<
    TeamSpecializationDayCloseInput,
    | 'day'
    | 'districtId'
    | 'assignmentPersonnelGroup'
    | 'assignmentDomain'
    | 'existingHubLines'
    | 'existingReportLines'
    | 'existingMapHints'
    | 'hubDensityContext'
    | 'vehicleMaintenanceLine'
    | 'vehicleMaintenanceStrainActive'
  >,
): TeamSpecializationSurfaceLines {
  const visibility = evaluateTeamSpecializationDayVisibility(input.day);
  if (!state || !visibility.allowed || input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) {
    return {};
  }

  if (!hasMeaningfulTeamSpecializationSurfaceData(state)) {
    return {};
  }

  const hubExisting = input.existingHubLines ?? [];
  const reportExisting = input.existingReportLines ?? [];
  const mapExisting = input.existingMapHints ?? [];

  let hubLine = sanitizePresentationLine(buildTeamSpecializationHubLine(state, input));
  let reportLine = sanitizePresentationLine(buildTeamSpecializationReportLine(state, input));
  let mapHint = sanitizePresentationLine(buildTeamSpecializationMapLine(state, input));
  const assignmentHint = sanitizePresentationLine(
    buildTeamSpecializationAssignmentHint(state, input),
  );
  const journalLabel = sanitizePresentationLine(
    buildTeamSpecializationCityJournalEntry(state, input),
  );

  hubLine = applyHubDensityGuard(hubLine, input);

  if (hubLine && isDuplicateLine(hubLine, hubExisting)) hubLine = undefined;
  if (reportLine && isDuplicateLine(reportLine, reportExisting)) reportLine = undefined;
  if (mapHint && isDuplicateLine(mapHint, mapExisting)) mapHint = undefined;

  return applyVehicleTeamStrainCopyGuard(
    { hubLine, reportLine, mapHint, assignmentHint, journalLabel },
    input,
  );
}

export function selectTeamSpecializationAssignmentHint(
  state: TeamSpecializationStateV1 | null | undefined,
  input: Pick<
    TeamSpecializationDayCloseInput,
    | 'day'
    | 'assignmentPersonnelGroup'
    | 'assignmentDomain'
    | 'existingAssignmentHints'
  >,
): string | undefined {
  if (!state || input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) return undefined;
  if (!hasMeaningfulTeamSpecializationSurfaceData(state)) return undefined;

  const hint = sanitizePresentationLine(buildTeamSpecializationAssignmentHint(state, input));
  if (!hint) return undefined;

  const existing = input.existingAssignmentHints ?? [];
  if (isDuplicateLine(hint, existing)) return undefined;

  return hint;
}

export function shouldShowTeamSpecializationHubLine(
  state: TeamSpecializationStateV1 | null | undefined,
  day: number,
): boolean {
  return Boolean(selectTeamSpecializationSurfaceLines(state, { day }).hubLine);
}

export function resolveTeamVehicleStrainReportPresentation(input: {
  vehicleMaintenanceReportLine?: string | null;
  teamSurfaces: TeamSpecializationSurfaceLines;
}): {
  vehicleMaintenanceReportLine?: string;
  teamSpecializationReportLine?: string;
} {
  if (input.teamSurfaces.mergedStrainLine && input.teamSurfaces.suppressVehicleMaintenanceLine) {
    return {
      vehicleMaintenanceReportLine: undefined,
      teamSpecializationReportLine: input.teamSurfaces.mergedStrainLine,
    };
  }

  return {
    vehicleMaintenanceReportLine: input.vehicleMaintenanceReportLine ?? undefined,
    teamSpecializationReportLine: input.teamSurfaces.reportLine,
  };
}
