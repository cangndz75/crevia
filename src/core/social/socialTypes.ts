export type SocialRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type SocialMentionType =
  | 'complaint'
  | 'gratitude'
  | 'rumor'
  | 'crisis'
  | 'question'
  | 'neutral';

export type SocialTopicType =
  | 'complaint_wave'
  | 'misinformation'
  | 'gratitude_wave'
  | 'crisis_pressure'
  | 'service_delay'
  | 'environmental_concern'
  | 'public_question';

export type NeighborhoodSocialProfile = {
  neighborhoodId: string;
  trust: number;
  complaintHeat: number;
  misinformation: number;
  gratitude: number;
  crisisSpread: number;
  mediaAttention: number;
  fatigue: number;
  activeTopicIds: string[];
  lastUpdatedDay: number;
};

export type SocialTopic = {
  id: string;
  neighborhoodId: string;
  type: SocialTopicType;
  title: string;
  severity: SocialRiskLevel;
  intensity: number;
  createdDay: number;
  expiresDay?: number;
};

export type SocialMention = {
  id: string;
  neighborhoodId: string;
  type: SocialMentionType;
  authorName: string;
  message: string;
  createdDay: number;
  minuteOffset: number;
  likes: number;
  replies: number;
};

export type SocialOutcomeHistory = {
  id: string;
  title: string;
  description: string;
  pulseDelta: number;
  createdDay: number;
  neighborhoodId?: string;
};

export type SocialPulseState = {
  neighborhoods: Record<string, NeighborhoodSocialProfile>;
  activeTopics: SocialTopic[];
  mentionFeed: SocialMention[];
  outcomeHistory: SocialOutcomeHistory[];
  globalPulseScore: number;
  globalRiskLevel: SocialRiskLevel;
  lastProcessedDay: number;
};

/** Store / selector root — vehicle/container pattern. */
export type SocialPulseRootState = {
  socialPulseState?: SocialPulseState | null;
};

export type NeighborhoodSocialRiskView = {
  neighborhoodId: string;
  score: number;
  riskLevel: SocialRiskLevel;
  profile: NeighborhoodSocialProfile;
};

export type GlobalSocialPulseSummary = {
  globalPulseScore: number;
  globalRiskLevel: SocialRiskLevel;
};

export type SocialDailyDriftResult = {
  state: SocialPulseState;
  summaryLines: string[];
};

export type SocialDecisionAction =
  | 'communicate'
  | 'dispatch_team'
  | 'stay_silent'
  | 'permanent_solution'
  | 'monitor'
  | 'none';

export type SocialProfileMetricDeltas = {
  trust?: number;
  complaintHeat?: number;
  misinformation?: number;
  gratitude?: number;
  crisisSpread?: number;
  mediaAttention?: number;
  fatigue?: number;
};

export type SocialDecisionEventInput = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  neighborhoodId?: string;
  district?: string;
  districtIds?: string[];
  eventType?: string;
  tags?: string[];
};

export type SocialDecisionChoiceInput = {
  id?: string;
  title?: string;
  label?: string;
  description?: string;
  shortText?: string;
  effectText?: string;
  neighborhoodId?: string;
  targetNeighborhoodId?: string;
  tags?: string[];
};

export type SocialDecisionEffectInput = {
  event?: SocialDecisionEventInput;
  decision: SocialDecisionChoiceInput;
  day: number;
  /** Keyword sınıflandırmasını atla (quick action). */
  forcedAction?: SocialDecisionAction;
  /** outcomeHistory kayıt kimliği (spam guard). */
  outcomeId?: string;
};

export type SocialQuickActionType = Exclude<SocialDecisionAction, 'none'>;

export type ApplySocialQuickActionInput = {
  topicId?: string;
  action: SocialQuickActionType;
  day?: number;
};

export type ApplySocialQuickActionResult = {
  success: boolean;
  blocked: boolean;
  message: string;
  state: SocialPulseState;
  action?: SocialDecisionAction;
};

export type SocialDecisionEffectResult = {
  state: SocialPulseState;
  action: SocialDecisionAction;
  targetNeighborhoodId?: string;
  pulseDelta: number;
  summaryLine?: string;
};
