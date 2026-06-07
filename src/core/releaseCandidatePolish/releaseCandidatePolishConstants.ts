export const RELEASE_CANDIDATE_POLISH_DOCS_PATH = 'docs/crevia-release-candidate-polish-pack.md';

export const RELEASE_CANDIDATE_POLISH_NON_GOALS = [
  'No new gameplay systems',
  'No persist shape or SAVE_VERSION bump',
  'No applyDecision/dayPipeline/event generation changes',
  'No new routes',
  'No fake PASS or evidence status changes',
  'No public launch blocker closure',
] as const;

export const RELEASE_CANDIDATE_POLISH_HUB_WIRING = {
  seasonCardMinDay: 9,
  seasonCardDay8OnlyWhenFeelHidden: true,
  seasonCompactFromDay: 8,
  districtHubSupportingLine: true,
  advisorCardWired: true,
} as const;
