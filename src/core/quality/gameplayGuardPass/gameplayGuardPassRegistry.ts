import type { GameplayGuardPassPriorityPass } from './gameplayGuardPassTypes';

/**
 * 10/10 gameplay polish öncelik sırası.
 * Her pass kendi verify script’i ile kapanır; guard pass yalnızca registry ve sınırları doğrular.
 */
export const GAMEPLAY_10_10_PRIORITY_PASSES: readonly GameplayGuardPassPriorityPass[] = [
  {
    order: 1,
    id: 'field_live_operation',
    title: 'Sahada fazı canlı operasyon hissi',
    verifyScripts: ['verify:operation-field-live', 'verify:operation-flow-qa'],
    targetDirs: ['src/features/events', 'src/features/events/utils'],
    primaryFiles: [
      'src/features/events/components/event-workflow/EventFieldPhase.tsx',
      'src/features/events/utils/eventFieldPhasePresentation.ts',
    ],
    status: 'ready',
  },
  {
    order: 2,
    id: 'hub_game_first_density',
    title: 'Hub game-first density',
    verifyScripts: ['verify:center-hub-density', 'verify:hub-portfolio-surface'],
    targetDirs: ['src/features/hub', 'src/features/hub/utils'],
    primaryFiles: [
      'src/features/hub/components/HubReferenceHome.tsx',
      'src/features/hub/utils/centerHomePresentation.ts',
    ],
    status: 'ready',
  },
  {
    order: 3,
    id: 'report_scanability_closure',
    title: 'Gün sonu raporu taranabilirlik ve duygusal kapanış',
    verifyScripts: ['verify:report-ui', 'verify:report-replay', 'verify:presentation-dedupe'],
    targetDirs: ['src/features/reports', 'src/core/reportReplay'],
    primaryFiles: [
      'src/features/reports/utils/endOfDayReportPresentation.ts',
      'src/core/reportReplay/reportReplayPresentation.ts',
    ],
    status: 'ready',
  },
  {
    order: 4,
    id: 'decision_depth_tradeoff',
    title: 'Karar derinliği ve tradeoff hissi',
    verifyScripts: [
      'verify:decision-impact-explanation',
      'verify:decision-tradeoff-ui',
      'verify:decision-consequence-depth',
    ],
    targetDirs: ['src/features/events', 'src/core/decisionConsequence'],
    primaryFiles: [
      'src/features/events/components/event-workflow/EventInspectPhase.tsx',
      'src/features/events/utils/eventWorkflowPlanPresentation.ts',
    ],
    status: 'ready',
  },
  {
    order: 5,
    id: 'maintenance_economy_cost',
    title: 'Maintenance economy bedel hissi',
    verifyScripts: ['verify:maintenance-economy', 'verify:maintenance-actions-lite'],
    targetDirs: ['src/core/maintenanceBacklog'],
    primaryFiles: ['src/core/maintenanceBacklog/maintenanceEconomyModel.ts'],
    status: 'ready',
  },
  {
    order: 6,
    id: 'ece_contextual_brevity',
    title: 'Ece kısa ve bağlamsal öneri dili',
    verifyScripts: ['verify:presentation-dedupe', 'verify:ece-strategy-lines'],
    targetDirs: ['src/core/eceTone', 'src/core/eceStrategyLines'],
    primaryFiles: ['src/core/eceTone/eceTonePresentation.ts'],
    status: 'ready',
  },
  {
    order: 7,
    id: 'city_liveliness_feed',
    title: 'Şehir canlılığı ve mini feed reaction',
    verifyScripts: ['verify:dynamic-social-echo', 'verify:map-reactions'],
    targetDirs: ['src/core/socialEcho', 'src/features/hub/utils'],
    primaryFiles: ['src/features/hub/utils/centerMiniCityFeedPresentation.ts'],
    status: 'ready',
  },
  {
    order: 8,
    id: 'growth_player_style_reward',
    title: 'Gelişim / player style ödül hissi',
    verifyScripts: ['verify:player-style', 'verify:growth-screen-ui'],
    targetDirs: ['src/core/playerStyle', 'src/features/progression'],
    primaryFiles: ['src/core/playerStyle/playerStylePresentation.ts'],
    status: 'ready',
  },
  {
    order: 9,
    id: 'map_marker_feedback_polish',
    title: 'Harita marker feedback polish',
    verifyScripts: ['verify:map-marker-feedback', 'verify:map-gameplay-runtime-feedback'],
    targetDirs: ['src/features/map', 'src/core/mapGameplayBinding'],
    primaryFiles: ['src/features/map/utils/mapMarkerFeedbackPresentation.ts'],
    status: 'ready',
  },
  {
    order: 10,
    id: 'full_gameplay_loop_qa',
    title: 'Full gameplay loop QA',
    verifyScripts: ['verify:gameplay-loop-qa'],
    targetDirs: ['src/core/quality'],
    primaryFiles: ['src/core/quality/gameplayLoopQaScenario.ts'],
    status: 'ready',
  },
] as const;

export function getNextRecommendedGameplayPass(): GameplayGuardPassPriorityPass {
  return GAMEPLAY_10_10_PRIORITY_PASSES[0];
}

export function listGameplayPassVerifyScripts(): string[] {
  const scripts = new Set<string>();
  for (const pass of GAMEPLAY_10_10_PRIORITY_PASSES) {
    for (const script of pass.verifyScripts) {
      scripts.add(script);
    }
  }
  return [...scripts].sort();
}
