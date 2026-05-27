import type { DistrictBonusFlags } from '@/core/xp/types';
import type { PilotDayTheme, PilotEventType } from './PilotDayPlan';

export type { PilotDayTheme, PilotEventType } from './PilotDayPlan';

export type EventRiskLevel = 'low' | 'medium' | 'high' | 'critical';

type EventConditionMetricKey =
  | 'publicSatisfaction'
  | 'budget'
  | 'staffMorale'
  | 'riskScore';

export type EventCondition =
  | { type: 'metric_gte'; metric: EventConditionMetricKey; value: number }
  | { type: 'metric_lte'; metric: EventConditionMetricKey; value: number }
  | { type: 'flag_equals'; flag: string; value: string | number | boolean }
  | { type: 'district_equals'; districtId: string }
  | { type: 'previous_decision'; eventId: string; decisionId: string }
  | { type: 'relationship_gte'; targetId: string; value: number };

export type EventDecisionEffect = {
  publicSatisfaction: number;
  budget: number;
  morale: number;
  risk: number;
  xp: number;
  staffMorale?: number;
  cleanliness?: number;
  trust?: number;
};

export type EventDecisionCost = {
  budget?: number;
  morale?: number;
  staffHours?: number;
  vehicleUsage?: number;
};

export type DecisionStyle = 'bold' | 'balanced' | 'cautious' | 'risky';

/** Pilot senaryo karar tonu — engine’e bağlı değil, selector/metadata için. */
export type PilotDecisionStyle =
  | 'fast'
  | 'planned'
  | 'partial'
  | 'communication'
  | 'permanent'
  | 'resource_saving'
  | 'risk';

export type EventDecision = {
  id: string;
  title: string;
  description: string;
  style: DecisionStyle;
  recommended?: boolean;
  delayHint?: boolean;
  effects: EventDecisionEffect;
  costs?: EventDecisionCost;
  /** Karar sonrası kısa sonuç metni; yoksa karar tipinden türetilir. */
  resultText?: string;
  /** Pilot metadata — applyDecision tarafından işlenmez. */
  decisionStyle?: PilotDecisionStyle;
  setFlags?: Record<string, string | number | boolean>;
  xpReward?: number;
  /** District engine — XP adapter districtBonusFlags için. */
  districtBonusFlags?: DistrictBonusFlags;
};

export type EventPreviewEffects = {
  publicSatisfaction: number;
  risk: number;
  xp: number;
  budget?: number;
};

export type EventFilterTag = 'urgent' | 'crisis' | 'opportunity';

export type EventOpportunity = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
};

export type SolvedEvent = {
  id: string;
  title: string;
  xpEarned: number;
};

export type EventAdvisorNote = {
  body: string;
  attribution: string;
  tokenCost: number;
};

export type EventCard = {
  id: string;
  title: string;
  category: string;
  riskLevel: EventRiskLevel;
  district: string;
  neighborhoodId?: string;
  description: string;
  contextTag: string;
  urgencyHours: number;
  decisions: EventDecision[];
  previewEffects: EventPreviewEffects;
  /** Karar ekranında “yarın etkisi” uyarısı */
  delayHint?: boolean;
  filterTags?: EventFilterTag[];
  /** Pilot senaryo günü (1–7); yoksa genel havuz. */
  day?: number;
  theme?: PilotDayTheme;
  districtIds?: string[];
  eventType?: PilotEventType;
  conditions?: EventCondition[];
  priority?: number;
  fallback?: boolean;
  setsFlags?: Record<string, string | number | boolean>;
  resultFlags?: Record<string, string | number | boolean>;
  /** District engine metadata — UI yok sayar. */
  districtBonusHints?: DistrictBonusFlags;
  xpDistrictType?: string;
  districtEventType?: string;
};
