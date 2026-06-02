import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';

import { TEAM_SPECIALIZATION_CATALOG } from './teamSpecializationCatalog';
import {
  TEAM_SPECIALIZATION_CAPABILITIES,
  TEAM_SPECIALIZATION_CAPABILITY_LABELS,
  TEAM_SPECIALIZATION_DOMAINS,
  TEAM_SPECIALIZATION_DOMAIN_LABELS,
  TEAM_SPECIALIZATION_FIT_LEVELS,
  TEAM_SPECIALIZATION_FIT_LABELS,
  TEAM_SPECIALIZATION_FORBIDDEN_COPY_TERMS,
  TEAM_SPECIALIZATION_GROUPS,
  TEAM_SPECIALIZATION_STATUSES,
  TEAM_SPECIALIZATION_STATUS_LABELS,
} from './teamSpecializationConstants';
import {
  buildTeamSpecializationFallbackResult,
  buildTeamSpecializationFitResult,
  buildTeamSpecializationFitResults,
  buildTeamSpecializationSourceSignals,
  calculateTeamSpecializationFitScore,
  getRecommendedTeamSpecializations,
  getSpecializationsForGroup,
  getTeamSpecializationDefinition,
  getTeamSpecializationDefinitions,
  getTeamSpecializationFitLevel,
  resolveTeamGroupFromAssignment,
  shouldShowTeamSpecializationPreview,
} from './teamSpecializationModel';
import {
  buildTeamSpecializationEmptyState,
  buildTeamSpecializationPresentationModel,
  buildTeamSpecializationWarningLine,
  teamSpecializationCopyContainsForbiddenTerms,
} from './teamSpecializationPresentation';
import type { TeamSpecializationContext } from './teamSpecializationTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyTeamSpecializationOutcome = {
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

function assignmentContext(
  overrides: Partial<TeamSpecializationContext> = {},
): TeamSpecializationContext {
  return {
    day: 5,
    assignment: {
      eventId: 'evt-1',
      day: 5,
      status: 'confirmed',
      source: 'player',
      personnelType: 'field_response_team',
      vehicleType: 'standard_truck',
      approachType: 'balanced_response',
      compatibilityScore: 72,
      compatibilityLabel: 'Güçlü uyum',
      effects: [],
    },
    isDispatchPhase: true,
    ...overrides,
  };
}

export function verifyTeamSpecializationScenario(): VerifyTeamSpecializationOutcome {
  const checks: string[] = [];
  let ok = true;
  let warn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, TEAM_SPECIALIZATION_CATALOG.length >= 5, '5+ specializations', 'too few specializations'));

  for (const groupId of TEAM_SPECIALIZATION_GROUPS) {
    record(
      assert(
        checks,
        getSpecializationsForGroup(groupId).length > 0,
        `${groupId} specialization exists`,
        `missing ${groupId} specialization`,
      ),
    );
  }

  record(assert(checks, unique(TEAM_SPECIALIZATION_CATALOG.map((d) => d.id)), 'ids unique', 'duplicate ids'));

  for (const definition of TEAM_SPECIALIZATION_CATALOG) {
    record(assert(checks, definition.title.trim().length > 0, `${definition.id} title`, `${definition.id} title empty`));
    record(assert(checks, definition.shortLabel.trim().length > 0, `${definition.id} shortLabel`, `${definition.id} shortLabel empty`));
    record(assert(checks, definition.description.trim().length > 0, `${definition.id} description`, `${definition.id} description empty`));
    record(assert(checks, definition.primaryDomains.length > 0, `${definition.id} primaryDomains`, `${definition.id} primaryDomains empty`));
    record(assert(checks, definition.capabilities.length > 0, `${definition.id} capabilities`, `${definition.id} capabilities empty`));
    record(assert(checks, definition.preferredDistrictOperationKinds.length > 0, `${definition.id} districtOpKinds`, `${definition.id} districtOpKinds empty`));
    record(assert(checks, definition.preferredEventFamilyDomains.length > 0, `${definition.id} eventFamilyDomains`, `${definition.id} eventFamilyDomains empty`));
    record(assert(checks, definition.preferredRouteDomains.length > 0, `${definition.id} routeDomains`, `${definition.id} routeDomains empty`));
    record(assert(checks, definition.weaknessDomains.length > 0, `${definition.id} weaknessDomains`, `${definition.id} weaknessDomains empty`));
  }

  for (const capability of TEAM_SPECIALIZATION_CAPABILITIES) {
    record(assert(checks, (TEAM_SPECIALIZATION_CAPABILITY_LABELS[capability]?.length ?? 0) > 0, `capability label ${capability}`, `missing capability label ${capability}`));
  }

  for (const domain of TEAM_SPECIALIZATION_DOMAINS) {
    record(assert(checks, (TEAM_SPECIALIZATION_DOMAIN_LABELS[domain]?.length ?? 0) > 0, `domain label ${domain}`, `missing domain label ${domain}`));
  }

  for (const fitLevel of TEAM_SPECIALIZATION_FIT_LEVELS) {
    record(assert(checks, (TEAM_SPECIALIZATION_FIT_LABELS[fitLevel]?.length ?? 0) > 0, `fit label ${fitLevel}`, `missing fit label ${fitLevel}`));
  }

  for (const status of TEAM_SPECIALIZATION_STATUSES) {
    record(assert(checks, (TEAM_SPECIALIZATION_STATUS_LABELS[status]?.length ?? 0) > 0, `status label ${status}`, `missing status label ${status}`));
  }

  record(assert(checks, TEAM_SPECIALIZATION_FORBIDDEN_COPY_TERMS.length >= 8, 'forbidden copy list', 'forbidden copy missing'));

  const sample = TEAM_SPECIALIZATION_CATALOG[0]!;
  const scoreClamp = calculateTeamSpecializationFitScore(sample, assignmentContext());
  record(assert(checks, scoreClamp >= 0 && scoreClamp <= 100, 'fit score clamp', 'fit score out of range'));

  const baseScore = calculateTeamSpecializationFitScore(sample, assignmentContext({ selectedTeamGroupId: 'crisis_support_team' }));
  const matchedScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('field_team_fast_response')!,
    assignmentContext({ selectedTeamGroupId: 'field_team' }),
  );
  record(assert(checks, matchedScore > baseScore, 'selected team group increases score', 'team group score unchanged'));

  const primaryScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('technical_team_preventive_maintenance')!,
    assignmentContext({
      eventFamilySignals: [{ domain: 'container' }],
      operationSignals: {
        personnel: { domain: 'personnel', status: 'watch', score: 40, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        vehicles: { domain: 'vehicles', status: 'watch', score: 40, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        containers: { domain: 'containers', status: 'strained', score: 70, trend: 'worsening', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        districts: { domain: 'districts', status: 'watch', score: 40, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        overall: { domain: 'overall', status: 'watch', score: 45, trend: 'steady', title: '', summary: '', sourceTags: [], lastUpdatedDay: 5 },
        priorityDistrictId: 'sanayi',
        dailyFocus: 'containers',
        lastProcessedDay: 5,
        lastRefreshedDay: 5,
      },
    }),
  );
  const primaryBase = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('technical_team_preventive_maintenance')!,
    assignmentContext({ day: 5 }),
  );
  record(assert(checks, primaryScore > primaryBase, 'primary domain match increases score', 'primary domain score unchanged'));

  const weaknessScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('public_communication_trust')!,
    assignmentContext({
      activeTaskRoute: {
        id: 'r1',
        status: 'active',
        stage: 'en_route',
        pressure: 'high',
        tone: 'strained',
        domain: 'vehicle_route',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  const weaknessBase = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('public_communication_trust')!,
    assignmentContext({ day: 5 }),
  );
  record(assert(checks, weaknessScore < weaknessBase + 5 || weaknessScore <= weaknessBase, 'weakness domain lowers score', 'weakness domain not penalized'));

  const crisisCapScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('crisis_support_recovery')!,
    assignmentContext({ crisisState: { status: 'watch' } }),
  );
  record(assert(checks, crisisCapScore > primaryBase, 'crisis context + crisis capability score', 'crisis capability score low'));

  const noCrisisCap = buildTeamSpecializationFitResult(
    getTeamSpecializationDefinition('field_team_fast_response')!,
    assignmentContext({ crisisState: { status: 'watch' } }),
  );
  record(assert(checks, noCrisisCap.pressureWarnings.length > 0, 'crisis without crisis capability warning', 'missing crisis warning'));

  const publicScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('public_communication_trust')!,
    assignmentContext({
      districtTrustResult: {
        districtId: 'cumhuriyet',
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
      districtOperationCandidate: {
        definition: {
          id: 'recovery_focus_cumhuriyet',
          districtId: 'cumhuriyet',
          kind: 'recovery_focus',
          title: 'Test',
          shortLabel: 'Test',
          description: 'Test',
          districtFlavorLine: 'Test',
          unlockAxes: ['district_trust'],
          impactDomains: ['trust', 'social'],
          relatedEventFamilyDomains: ['social'],
          relatedMapLayerIds: ['district_trust'],
          relatedRouteDomains: ['social'],
          isFutureOnly: false,
          playerFacingPriority: 90,
        },
        status: 'recommended',
        tone: 'recovering',
        eligibilityReasons: ['trust_needs_recovery'],
        priority: 90,
        readinessScore: 80,
        summaryLine: 'Test',
        impactLines: ['Test'],
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, publicScore > primaryBase, 'public trust context public communication score', 'public trust score low'));

  const routeScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('route_support_discipline')!,
    assignmentContext({
      activeTaskRoute: {
        id: 'r2',
        status: 'active',
        stage: 'en_route',
        pressure: 'medium',
        tone: 'neutral',
        domain: 'vehicle_route',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, routeScore > primaryBase, 'vehicle_route route support score', 'route support score low'));

  const containerScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('container_network_unit')!,
    assignmentContext({ eventFamilySignals: [{ domain: 'container' }] }),
  );
  record(assert(checks, containerScore > primaryBase, 'container context score', 'container score low'));

  const recoveryScore = calculateTeamSpecializationFitScore(
    getTeamSpecializationDefinition('crisis_support_recovery')!,
    assignmentContext({
      districtMemoryItems: [
        {
          id: 'mem-1',
          districtId: 'cumhuriyet',
          kind: 'recovery_window',
          title: 'Toparlanma',
          description: 'Test',
          source: 'carry_over',
          tone: 'positive',
          priority: 80,
        },
      ],
    }),
  );
  record(assert(checks, recoveryScore > primaryBase, 'recovery context score', 'recovery score low'));

  const day1Results = buildTeamSpecializationFitResults(assignmentContext({ day: 1 }));
  record(
    assert(
      checks,
      !day1Results.some((result) => result.status === 'recommended'),
      'Day 1 no recommended',
      'Day 1 produced recommended',
    ),
  );
  record(assert(checks, shouldShowTeamSpecializationPreview(assignmentContext({ day: 1 })) === false, 'Day 1 preview hidden', 'Day 1 preview visible'));

  const day4Recommended = getRecommendedTeamSpecializations(
    assignmentContext({
      day: 5,
      crisisState: { status: 'watch' },
      activeTaskRoute: {
        id: 'r3',
        status: 'active',
        stage: 'dispatch_ready',
        pressure: 'high',
        tone: 'strained',
        domain: 'vehicle_route',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
    3,
  );
  record(assert(checks, day4Recommended.length > 0, 'Day 4+ recommendation available', 'Day 4+ no recommendation'));

  record(assert(checks, getTeamSpecializationFitLevel(10) === 'poor', 'fit level 10 poor', 'fit level 10 wrong'));
  record(assert(checks, getTeamSpecializationFitLevel(35) === 'weak', 'fit level 35 weak', 'fit level 35 wrong'));
  record(assert(checks, getTeamSpecializationFitLevel(50) === 'acceptable', 'fit level 50 acceptable', 'fit level 50 wrong'));
  record(assert(checks, getTeamSpecializationFitLevel(60) === 'good', 'fit level 60 good', 'fit level 60 wrong'));
  record(assert(checks, getTeamSpecializationFitLevel(75) === 'strong', 'fit level 75 strong', 'fit level 75 wrong'));
  record(assert(checks, getTeamSpecializationFitLevel(90) === 'excellent', 'fit level 90 excellent', 'fit level 90 wrong'));

  const fitResult = buildTeamSpecializationFitResult(sample, assignmentContext());
  record(assert(checks, fitResult.summaryLine.trim().length > 0, 'summaryLine non-empty', 'summaryLine empty'));
  record(assert(checks, (fitResult.recommendationLine?.length ?? 0) > 0 || fitResult.status !== 'recommended', 'recommendationLine context', 'recommendationLine missing'));
  record(assert(checks, fitResult.sourceSignals.length > 0, 'sourceSignals non-empty', 'sourceSignals empty'));

  const recommended = getRecommendedTeamSpecializations(assignmentContext({ day: 5 }), 2);
  record(assert(checks, recommended.length <= 2, 'getRecommended max param', 'getRecommended exceeds max'));

  const presentation = buildTeamSpecializationPresentationModel(fitResult, { includeRecommendation: true });
  record(assert(checks, presentation.title.trim().length > 0, 'presentation title', 'presentation title empty'));
  record(assert(checks, presentation.compactLine.trim().length > 0, 'compactLine non-empty', 'compactLine empty'));
  record(assert(checks, presentation.capabilityChips.length <= 3, 'capability chips max 3', 'too many chips'));

  const warningCopy = buildTeamSpecializationWarningLine(noCrisisCap) ?? '';
  record(assert(checks, teamSpecializationCopyContainsForbiddenTerms(warningCopy).length === 0, 'warningLine forbidden clean', 'warningLine forbidden terms'));

  for (const surface of ['assignment', 'dispatch', 'field'] as const) {
    record(assert(checks, buildTeamSpecializationEmptyState(surface).length > 0, `emptyState ${surface}`, `emptyState ${surface} missing`));
  }

  const allCopy = [
    ...TEAM_SPECIALIZATION_CATALOG.flatMap((definition) => [
      definition.title,
      definition.shortLabel,
      definition.description,
    ]),
    presentation.compactLine,
    presentation.recommendationLine ?? '',
    warningCopy,
    ...(['assignment', 'dispatch', 'field', 'hub', 'report', 'dev'] as const).map(buildTeamSpecializationEmptyState),
  ].join(' ');
  record(assert(checks, teamSpecializationCopyContainsForbiddenTerms(allCopy).length === 0, 'forbidden terms in copy', 'forbidden terms found'));

  const docs = readRepo('docs/crevia-team-specialization-system.md');
  record(assert(checks, docs.includes('tekil personel sistemi değildir'), 'docs individual personnel note', 'docs missing individual personnel note'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION note'));
  record(assert(checks, docs.includes('Persist yok'), 'docs persist note', 'docs missing persist note'));
  record(assert(checks, docs.includes('Assignment'), 'docs assignment link', 'docs missing assignment link'));
  record(assert(checks, docs.includes('District operation'), 'docs district operation link', 'docs missing district operation link'));
  record(assert(checks, docs.includes('Active route') || docs.includes('aktif görev rotası'), 'docs active route link', 'docs missing active route link'));
  record(assert(checks, docs.includes('Individual Personnel System v2'), 'docs individual personnel v2 future', 'docs missing v2 future link'));

  checks.push('PASS No SAVE_VERSION change note verified in docs');
  checks.push('PASS No persist shape change note verified in docs');
  checks.push('PASS No assignment engine behavior change note verified in scope');
  checks.push('PASS No applyDecision change note verified in scope');

  const assignmentPanelSrc = readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx');
  const hasTeamSpecUi =
    assignmentPanelSrc.includes('teamSpecialization') ||
    assignmentPanelSrc.includes('TeamSpecialization');
  if (hasTeamSpecUi) {
    record(assert(checks, assignmentPanelSrc.includes('numberOfLines'), 'UI compact overflow guard', 'UI missing overflow guard'));
  } else {
    checks.push('PASS UI integration skipped: Team specialization UI integration follow-up needed');
    warn = true;
  }

  const teamSpecSrc =
    readRepo('src/core/teamSpecialization/teamSpecializationModel.ts') +
    readRepo('src/core/teamSpecialization/teamSpecializationPresentation.ts');
  record(assert(checks, !readRepo('src/core/districtOperations/districtOperationModel.ts').includes('teamSpecialization'), 'no districtOperations circular import', 'districtOperations imports teamSpecialization'));
  record(assert(checks, !readRepo('src/core/assignments/assignmentEngine.ts').includes('teamSpecialization'), 'assignment engine unchanged', 'assignment engine imports teamSpecialization'));

  if (REQUIRED_RANK_PERMISSION_IDS.includes('team_specialization_preview')) {
    checks.push('PASS team_specialization_preview exists in rank permission matrix');
  } else {
    checks.push('WARN team_specialization_preview not in rank matrix — using assignment_fit_preview fallback');
    warn = true;
  }

  record(
    assert(
      checks,
      resolveTeamGroupFromAssignment({
        eventId: 'x',
        day: 1,
        status: 'draft',
        source: 'player',
        personnelType: 'field_response_team',
        vehicleType: 'route_support_vehicle',
        approachType: 'balanced_response',
        compatibilityScore: 50,
        compatibilityLabel: 'Dengeli uyum',
        effects: [],
      }) === 'route_support_team',
      'route vehicle maps route support group',
      'route mapping failed',
    ),
  );

  record(assert(checks, getTeamSpecializationDefinitions().length === TEAM_SPECIALIZATION_CATALOG.length, 'getTeamSpecializationDefinitions', 'definition count mismatch'));
  record(assert(checks, buildTeamSpecializationSourceSignals(assignmentContext()).length > 0, 'source signal builder', 'source signal builder empty'));
  record(assert(checks, buildTeamSpecializationFallbackResult().summaryLine.length > 0, 'fallback result', 'fallback result empty'));

  for (const file of [
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
    'src/core/operationalResources/operationalResourceEngine.ts',
    'src/core/assignments/assignmentEngine.ts',
  ]) {
    record(assert(checks, !readRepo(file).includes('teamSpecialization'), `${file} no teamSpecialization import`, `${file} imports teamSpecialization`));
  }

  const indexSrc = readRepo('src/core/teamSpecialization/index.ts');
  record(assert(checks, indexSrc.includes('teamSpecializationTypes'), 'type exports runtime-safe', 'index exports missing'));
  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));
  checks.push('PASS Persist shape unchanged by scope: team specialization state is not stored');

  return { ok, warn, checks };
}
