export type TutorialScreen =
  | 'hub'
  | 'event_detail'
  | 'decision_result'
  | 'daily_report';

export type TutorialTargetKey =
  | 'hub_metrics'
  | 'critical_event_card'
  | 'social_signal_card'
  | 'event_status_timeline'
  | 'event_insight_card'
  | 'field_resources_card'
  | 'quick_decisions';

export type TutorialStep = {
  id: string;
  screen: TutorialScreen;
  targetKey?: TutorialTargetKey;
  title: string;
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  /** true ise arka plan etkileşimi kısıtlanır */
  blocking?: boolean;
  /** hub_critical_event: birincil aksiyon olay detayına gider */
  navigateToDay1Event?: boolean;
};

export type TutorialState = {
  day1Completed: boolean;
  activeStepId: string | null;
  completedStepIds: string[];
  skipped: boolean;
};

export const INITIAL_TUTORIAL_STATE: TutorialState = {
  day1Completed: false,
  activeStepId: null,
  completedStepIds: [],
  skipped: false,
};

/** Gün 1 öğrenme olayları — bölgeye göre farklı id, aynı tutorial akışı */
export const DAY1_LEARNING_EVENT_IDS = [
  'central_day1_learning_main_street',
  'cumhuriyet_day1_learning_complaint',
  'industrial_market_day1_learning_market_waste',
] as const;

export type Day1LearningEventId = (typeof DAY1_LEARNING_EVENT_IDS)[number];

export function isDay1LearningEventId(eventId: string): boolean {
  return (DAY1_LEARNING_EVENT_IDS as readonly string[]).includes(eventId);
}
