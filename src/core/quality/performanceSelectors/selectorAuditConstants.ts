import type { SelectorAuditTarget } from './selectorAuditTypes';

export const SELECTOR_AUDIT_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export const SELECTOR_AUDIT_TARGETS: SelectorAuditTarget[] = [
  {
    surface: 'hub',
    componentName: 'HubScreen',
    paths: ['src/features/hub/screens/HubScreen.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubAdvisorCard',
    paths: ['src/features/hub/components/HubAdvisorCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubDailyOperationsPlanCard',
    paths: ['src/features/hub/components/HubDailyOperationsPlanCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubOperationalResourcesCard',
    paths: ['src/features/hub/components/HubOperationalResourcesCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'OperationalResourcesDetailSheet',
    paths: ['src/features/hub/components/OperationalResourcesDetailSheet.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubCrisisDeskCard',
    paths: ['src/features/hub/components/HubCrisisDeskCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubCrisisActionCard',
    paths: ['src/features/hub/components/HubCrisisActionCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubMainOperationSeasonCard',
    paths: ['src/features/hub/components/HubMainOperationSeasonCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubLiveOperationsCard',
    paths: ['src/features/hub/components/HubLiveOperationsCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubFirstTenMinutesGuideCard',
    paths: ['src/features/hub/components/HubFirstTenMinutesGuideCard.tsx'],
  },
  {
    surface: 'hub',
    componentName: 'HubDevTools',
    paths: ['src/features/hub/components/HubDevTools.tsx'],
  },
  {
    surface: 'report',
    componentName: 'EndOfDayReportView',
    paths: ['src/features/reports/components/end-of-day/EndOfDayReportView.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportSeasonEndEvaluationCard',
    paths: ['src/features/reports/components/ReportSeasonEndEvaluationCard.tsx'],
  },
  {
    surface: 'report',
    componentName: 'SeasonEndEvaluationDetailSheet',
    paths: ['src/features/reports/components/SeasonEndEvaluationDetailSheet.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportOperationalResourcesCard',
    paths: ['src/features/reports/components/ReportOperationalResourcesCard.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportCrisisActionCard',
    paths: ['src/features/reports/components/ReportCrisisActionCard.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportMainOperationSeasonCard',
    paths: ['src/features/reports/components/ReportMainOperationSeasonCard.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportAdvisorCommentCard',
    paths: ['src/features/reports/components/ReportAdvisorCommentCard.tsx'],
  },
  {
    surface: 'report',
    componentName: 'ReportMicroDecisionsCard',
    paths: ['src/features/reports/components/ReportMicroDecisionsCard.tsx'],
  },
  {
    surface: 'map',
    componentName: 'MapScreen',
    paths: ['src/features/map/screens/MapScreen.tsx'],
  },
  {
    surface: 'map',
    componentName: 'MapOperationBottomPanel',
    paths: ['src/features/map/components/MapOperationBottomPanel.tsx'],
  },
  {
    surface: 'map',
    componentName: 'MapNeighborhoodStrip',
    paths: ['src/features/map/components/MapNeighborhoodStrip.tsx'],
  },
  {
    surface: 'map',
    componentName: 'CityOverviewMap',
    paths: ['src/features/map/components/CityOverviewMap.tsx'],
  },
  {
    surface: 'map',
    componentName: 'MapPin',
    paths: ['src/features/map/components/MapPin.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'EventDetailDecisionScreen',
    paths: ['src/features/events/screens/EventDetailDecisionScreen.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'EventPlanPhase',
    paths: ['src/features/events/components/event-workflow/EventPlanPhase.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'EventDispatchPhase',
    paths: [
      'src/features/events/components/event-workflow/dispatch/EventDispatchPhase.tsx',
    ],
  },
  {
    surface: 'event_flow',
    componentName: 'EventFieldPhase',
    paths: [
      'src/features/events/components/event-workflow/field/EventFieldPhase.tsx',
    ],
  },
  {
    surface: 'event_flow',
    componentName: 'EventAssignmentPanel',
    paths: ['src/features/events/components/assignment/EventAssignmentPanel.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'AssignmentEditorModal',
    paths: ['src/features/events/components/assignment/AssignmentEditorModal.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'OperationImpactPreviewStrip',
    paths: ['src/features/events/components/OperationImpactPreviewStrip.tsx'],
  },
  {
    surface: 'event_flow',
    componentName: 'EventFieldMicroDecisionCard',
    paths: [
      'src/features/events/components/event-workflow/field/EventFieldMicroDecisionCard.tsx',
    ],
  },
];

export const SELECTOR_AUDIT_CORE_BOUNDARY_FILES = [
  'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  'src/core/playtest/playerFlowAuditEngine.ts',
  'src/core/simulation/fullSeasonSimulationEngine.ts',
  'src/core/onboarding/firstTenMinutesPresentation.ts',
] as const;
