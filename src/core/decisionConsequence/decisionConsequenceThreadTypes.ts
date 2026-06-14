export type DecisionConsequenceType =
  | 'resource_pressure'
  | 'district_memory'
  | 'social_echo'
  | 'tomorrow_risk'
  | 'carry_over'
  | 'butterfly'
  | 'city_archive'
  | 'story_chain'
  | 'authority_progress'
  | 'neutral_record';

export type DecisionConsequenceStrength = 'low' | 'medium' | 'high';

export type DecisionConsequenceTimeScope = 'immediate' | 'next_day' | 'multi_day';

export type DecisionConsequenceTone = 'positive' | 'neutral' | 'warning';

export type DecisionConsequenceSurface = 'result' | 'report' | 'hub' | 'ece' | 'archive';

export type DecisionConsequenceThread = {
  id: string;
  sourceDecisionId?: string;
  sourceEventId?: string;
  sourceDay?: number;
  title: string;
  summary: string;
  consequenceType: DecisionConsequenceType;
  strength: DecisionConsequenceStrength;
  timeScope: DecisionConsequenceTimeScope;
  tone: DecisionConsequenceTone;
  visibleIn: DecisionConsequenceSurface[];
  causalLine: string;
  nextActionHint?: string;
  sourceLabel: string;
  sourceIds: string[];
};

export type DecisionConsequenceSourceInput = {
  id: string;
  type: DecisionConsequenceType;
  line: string;
  sourceLabel: string;
  sourceIds: string[];
  title?: string;
  summary?: string;
  nextActionHint?: string;
  strength?: DecisionConsequenceStrength;
  timeScope?: DecisionConsequenceTimeScope;
  tone?: DecisionConsequenceTone;
  visibleIn?: DecisionConsequenceSurface[];
  sourceDecisionId?: string;
  sourceEventId?: string;
  sourceDay?: number;
};

export type DecisionConsequenceThreadInput = {
  day?: number;
  sourceDecisionId?: string;
  sourceEventId?: string;
  sourceDay?: number;
  decisionLabel?: string | null;
  eventTitle?: string | null;
  districtName?: string | null;
  sources?: DecisionConsequenceSourceInput[];
  allowNeutralFallback?: boolean;
};
