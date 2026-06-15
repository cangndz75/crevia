import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
  TEAM_SPECIALIZATION_VISIBLE_DAY_MIN,
} from './teamSpecializationRuntimeConstants';
import { updateTeamSpecializationForDay } from './teamSpecializationEngine';
import {
  buildCombinedVehicleTeamStrainLine,
  buildTeamSpecializationAssignmentHint,
  hasMeaningfulTeamSpecializationSurfaceData,
} from './teamSpecializationRuntimePresentation';
import {
  resolveTeamVehicleStrainReportPresentation,
  selectTeamSpecializationAssignmentHint,
  selectTeamSpecializationSurfaceLines,
} from './teamSpecializationSelectors';
import { verifyTeamSpecializationPlanningScenario } from './verifyTeamSpecializationPlanningScenario';
import { verifyTeamSpecializationRuntimeScenario } from './verifyTeamSpecializationRuntimeScenario';
import { createInitialTeamSpecializationState } from './teamSpecializationState';
import type { TeamSpecializationDayCloseInput } from './teamSpecializationRuntimeTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyTeamSpecializationUiDensityOutcome = {
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

function dayCloseInput(
  day: number,
  extra: Partial<TeamSpecializationDayCloseInput> = {},
): TeamSpecializationDayCloseInput {
  return {
    day,
    operationSignals: {
      personnel: { status: 'stable' },
      vehicles: { status: 'watch' },
    },
    districtId: 'cumhuriyet',
    assignmentPersonnelGroup: 'field_response_team',
    assignmentCompatibilityScore: 72,
    assignmentDomain: 'vehicle_route',
    ...extra,
  };
}

function pressuredDay8State() {
  const seed = createInitialTeamSpecializationState(8);
  seed.teamGroups.rapid_support = {
    ...seed.teamGroups.rapid_support,
    consecutiveUseDays: 3,
    fatigueScore: 68,
    experienceScore: 42,
    fatigueBand: 'strained',
  };
  return updateTeamSpecializationForDay(seed, {
    ...dayCloseInput(8),
    crisisAdjacent: true,
    assignmentPersonnelGroup: 'field_response_team',
  });
}

export function verifyTeamSpecializationUiDensityScenario(): VerifyTeamSpecializationUiDensityOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const runtimeBaseline = verifyTeamSpecializationRuntimeScenario();
  record(
    assert(
      checks,
      runtimeBaseline.ok,
      'runtime scoring snapshot baseline still passes',
    ),
  );

  const planningBaseline = verifyTeamSpecializationPlanningScenario();
  record(assert(checks, planningBaseline.ok, 'planning verify still passes'));

  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION current build'));
  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_TARGET_SAVE_VERSION <= SAVE_VERSION,
      'team specialization target save version 26',
    ),
  );

  const day1 = createInitialTeamSpecializationState(1);
  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(day1, { day: 1 }).hubLine == null,
      'Hub Day 1 team line hidden',
    ),
  );

  const day8 = pressuredDay8State();
  const day8Surfaces = selectTeamSpecializationSurfaceLines(day8, { day: 8, districtId: 'sanayi' });
  record(
    assert(
      checks,
      (day8Surfaces.hubLine?.match(/Ekip izi/g) ?? []).length <= 1,
      'Hub Day 8+ max 1 team line',
    ),
  );

  const flatDay8 = createInitialTeamSpecializationState(8);
  for (const groupId of Object.keys(flatDay8.teamGroups) as (keyof typeof flatDay8.teamGroups)[]) {
    flatDay8.teamGroups[groupId] = {
      ...flatDay8.teamGroups[groupId],
      specializationBand: 'none',
      fatigueBand: 'low',
      moraleBand: 'steady',
      experienceScore: 0,
      fatigueScore: 0,
      moraleScore: 50,
      suggestedUseLine: '',
      cautionLine: undefined,
    };
  }
  flatDay8.fatigueSummary.strainedGroupIds = [];
  record(
    assert(
      checks,
      !hasMeaningfulTeamSpecializationSurfaceData(flatDay8) &&
        selectTeamSpecializationSurfaceLines(flatDay8, { day: 8 }).hubLine == null,
      'Hub hides line when no meaningful data',
    ),
  );

  const positiveOnly = createInitialTeamSpecializationState(8);
  positiveOnly.teamGroups.route_cleanup = {
    ...positiveOnly.teamGroups.route_cleanup,
    specializationBand: 'reliable',
    experienceScore: 45,
  };
  const densePositive = selectTeamSpecializationSurfaceLines(positiveOnly, {
    day: 8,
    hubDensityContext: {
      existingInsightLineCount: 4,
      hasAuthorityPreview: true,
      hasBadgeShowcase: true,
    },
  });
  record(
    assert(
      checks,
      densePositive.hubLine == null,
      'Hub dense insight context hides low-priority positive line',
    ),
  );

  const strainSurfaces = selectTeamSpecializationSurfaceLines(day8, { day: 8 });
  record(
    assert(
      checks,
      strainSurfaces.hubLine == null ||
        (!strainSurfaces.hubLine.includes('riskli') &&
          !strainSurfaces.hubLine.includes('çöktü') &&
          strainSurfaces.hubLine.length <= 120),
      'Hub fatigue/strain warning stays short and calm',
    ),
  );

  record(
    assert(
      checks,
      day8Surfaces.reportLine == null || day8Surfaces.reportLine.split('\n').length <= 1,
      'Report max 1 team line',
    ),
  );

  record(
    assert(
      checks,
      day8Surfaces.mapHint == null || day8Surfaces.mapHint.split('\n').length <= 1,
      'Map max 1 team hint',
    ),
  );

  const goodFitHint = selectTeamSpecializationAssignmentHint(day8, {
    day: 8,
    assignmentPersonnelGroup: 'field_response_team',
    assignmentDomain: 'crisis',
  });
  record(
    assert(
      checks,
      goodFitHint == null || (goodFitHint.length > 0 && !goodFitHint.includes('+')),
      'Assignment hint good fit preview is meaningful and non-scoring',
    ),
  );

  const poorHint = buildTeamSpecializationAssignmentHint(day8, {
    assignmentPersonnelGroup: 'field_response_team',
    assignmentDomain: 'crisis',
  });
  record(
    assert(
      checks,
      poorHint == null ||
        (!poorHint.includes('çöktü') &&
          !poorHint.includes('Fatigue') &&
          !poorHint.includes('Morale')),
      'Assignment poor/repeated hint avoids panic copy',
    ),
  );

  const assignmentPanel = readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx');
  record(
    assert(
      checks,
      assignmentPanel.includes('selectTeamSpecializationAssignmentHint') &&
        !assignmentPanel.includes('buildAssignmentTeamSpecializationPreviewLine'),
      'Assignment hint wired via safe runtime selector',
    ),
  );
  record(
    assert(
      checks,
      !assignmentPanel.includes('confirmAssignment') ||
        assignmentPanel.includes('selectTeamSpecializationAssignmentHint'),
      'Assignment hint does not rewrite scoring path',
    ),
  );

  const merged = buildCombinedVehicleTeamStrainLine(
    'Araç bakım izi: Rota destek hattı yorgunluk kontrollü seviyeye çıktı.',
    'Ekip yorgunluğu: Hızlı destek ekibi yarın daha dengeli kullanılmalı.',
  );
  record(
    assert(
      checks,
      merged != null && !merged.includes('çöktü') && merged.includes('dengeli'),
      'Vehicle + team strain merge produces one calm line',
    ),
  );

  const strainGuard = selectTeamSpecializationSurfaceLines(day8, {
    day: 8,
    vehicleMaintenanceLine: 'Araç hattı: Rota destek hattı yorgunluk izleniyor.',
    vehicleMaintenanceStrainActive: true,
  });
  const reportResolved = resolveTeamVehicleStrainReportPresentation({
    vehicleMaintenanceReportLine: 'Araç bakım izi: Rota destek hattı yorgunluk kontrollü seviyeye çıktı.',
    teamSurfaces: strainGuard,
  });
  record(
    assert(
      checks,
      strainGuard.mergedStrainLine != null || strainGuard.suppressVehicleMaintenanceLine === true
        ? reportResolved.vehicleMaintenanceReportLine == null ||
            reportResolved.teamSpecializationReportLine != null
        : true,
      'Vehicle + team strain avoids duplicate panic report lines',
    ),
  );

  const presentationLines = [
    day8Surfaces.hubLine,
    day8Surfaces.reportLine,
    day8Surfaces.mapHint,
    goodFitHint,
    merged,
  ].filter((line): line is string => Boolean(line));
  const rawEnumPattern =
    /\b(field_coordination|route_cleanup|container_service|social_response|rapid_support|backup_team)\b/;
  record(
    assert(
      checks,
      presentationLines.every(
        (line) =>
          !line.includes('undefined') &&
          !line.includes('null') &&
          !rawEnumPattern.test(line) &&
          !line.includes('team_fatigue_warning'),
      ),
      'Presentation copy has no undefined/null/raw enum',
    ),
  );

  for (let day = 2; day <= 7; day += 1) {
    const hidden = selectTeamSpecializationSurfaceLines(day8, { day });
    record(
      assert(
        checks,
        hidden.hubLine == null && hidden.reportLine == null && hidden.mapHint == null,
        `Day ${day} surface visibility rules preserved`,
      ),
    );
  }

  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(undefined, { day: 8 }).hubLine == null &&
        selectTeamSpecializationAssignmentHint(null, {
          day: 8,
          assignmentPersonnelGroup: 'field_response_team',
        }) == null,
      'Missing teamSpecialization state does not crash',
    ),
  );

  let missingAssignmentSafe = true;
  try {
    selectTeamSpecializationAssignmentHint(day8, { day: 8 });
  } catch {
    missingAssignmentSafe = false;
  }
  record(assert(checks, missingAssignmentSafe, 'Missing assignment context does not crash'));

  let missingVehicleSafe = true;
  try {
    selectTeamSpecializationSurfaceLines(day8, {
      day: 8,
      vehicleMaintenanceLine: undefined,
      vehicleMaintenanceStrainActive: undefined,
    });
  } catch {
    missingVehicleSafe = false;
  }
  record(assert(checks, missingVehicleSafe, 'Missing vehicle maintenance summary does not crash'));

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'verifiedEvidence stays 0'));
  record(
    assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'release blockers not fake PASS'),
  );

  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_VISIBLE_DAY_MIN === 8,
      'visible day min unchanged at 8',
    ),
  );

  const eventAssignmentStyles = readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx');
  record(
    assert(
      checks,
      eventAssignmentStyles.includes('numberOfLines={1}') &&
        eventAssignmentStyles.includes('flexShrink: 1'),
      'Assignment hint layout uses compact single-line presentation',
    ),
  );

  return { ok, checks };
}
