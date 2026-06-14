export type CityRhythmSourceKind =
  | 'day8_strategic_content'
  | 'district_neglect_recovery'
  | 'positive_comeback'
  | 'follow_up_action'
  | 'city_memory_visibility'
  | 'one_more_day_retention'
  | 'portfolio_defer_risk'
  | 'daily_capacity_portfolio'
  | 'ece_strategy_line'
  | 'authority_gameplay_expansion'
  | 'event_gameplay_variety'
  | 'decision_consequence'
  | 'carry_over'
  | 'butterfly_effect'
  | 'district_personality'
  | 'fallback';

export type CityRhythmKind =
  | 'calm_watch_day'
  | 'strategic_pressure_day'
  | 'recovery_window_day'
  | 'neglect_attention_day'
  | 'resource_strain_day'
  | 'social_trust_day'
  | 'memory_echo_day'
  | 'follow_up_day'
  | 'mixed_city_day'
  | 'fallback';

export type CityRhythmIntensity = 'low' | 'medium' | 'high';

export type CityRhythmTone = 'calm' | 'strategic' | 'cautious' | 'positive' | 'balanced';

export type CityRhythmSlotKind =
  | 'primary_focus'
  | 'secondary_focus'
  | 'recovery_balance'
  | 'memory_echo'
  | 'follow_up_hint'
  | 'safe_watch';

export type CityRhythmVisibilityLevel = 'hidden' | 'teaser' | 'summary' | 'detailed';

export type CityRhythmSlot = {
  id: string;
  kind: CityRhythmSlotKind;
  title: string;
  line: string;
  sourceCandidateId?: string;
  sourceIds: string[];
  sourceKinds: CityRhythmSourceKind[];
  priority: number;
  tone: CityRhythmTone;
  visibilityLevel: CityRhythmVisibilityLevel;
  isFallback: boolean;
};

export type CityRhythmDirectorResult = {
  day: number;
  isVisible: boolean;
  rhythmKind: CityRhythmKind;
  intensity: CityRhythmIntensity;
  tone: CityRhythmTone;
  title: string;
  summaryLine: string;
  slots: CityRhythmSlot[];
  primarySlot?: CityRhythmSlot;
  reportSlot?: CityRhythmSlot;
  hubSlot?: CityRhythmSlot;
  eceSlot?: CityRhythmSlot;
  portfolioSlot?: CityRhythmSlot;
  sourceIds: string[];
  suppressCandidateIds: string[];
  suppressSourceIds: string[];
};

export type CityRhythmDirectorInput = {
  day: number;
  authorityPermissionIds?: string[];
  day8StrategicContentResult?: unknown;
  districtNeglectRecoveryResult?: unknown;
  positiveComebackResult?: unknown;
  followUpActionResult?: unknown;
  cityMemoryVisibilityResult?: unknown;
  oneMoreDayRetentionResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  dailyCapacityPortfolioResult?: unknown;
  eceStrategyLineResult?: unknown;
  authorityExpansionSummary?: unknown;
  eventGameplayVarietyProfiles?: unknown[];
  decisionConsequenceThreads?: unknown[];
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  recentRhythmKinds?: CityRhythmKind[];
  recentPrimarySourceKinds?: CityRhythmSourceKind[];
  recentDistrictIds?: string[];
  suppressLines?: string[];
  suppressSourceIds?: string[];
};

export type CityRhythmSlotDraft = {
  slotKind: CityRhythmSlotKind;
  rhythmKind: CityRhythmKind;
  title?: string;
  lineHint?: string;
  sourceCandidateId?: string;
  sourceIds: string[];
  sourceKinds: CityRhythmSourceKind[];
  priority: number;
  tone?: CityRhythmTone;
  isRisk?: boolean;
  isPositive?: boolean;
  districtId?: string;
  visibilityLevel?: CityRhythmVisibilityLevel;
  seed?: number;
};

export type CityRhythmCardModel = {
  id: string;
  title: string;
  line: string;
  badgeLabel: string;
  intensityLabel: string;
  tone: CityRhythmTone;
  visibilityLevel: CityRhythmVisibilityLevel;
  accessibilityLabel: string;
};
