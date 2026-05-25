export type EventRiskLevel = 'low' | 'medium' | 'high' | 'critical';

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
};
