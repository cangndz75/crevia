import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { NeighborhoodArchetype } from '@/core/neighborhoodIdentity/neighborhoodIdentityTypes';

export type EventContentCategory =
  | 'citizen_complaint'
  | 'waste_container'
  | 'social_pressure'
  | 'vehicle_route'
  | 'personnel_morale'
  | 'maintenance'
  | 'market_vendor'
  | 'noise'
  | 'sidewalk_occupation'
  | 'opportunity'
  | 'butterfly'
  | 'permanent_solution';

export type EventNarrativeTone =
  | 'calm'
  | 'urgent'
  | 'political'
  | 'operational'
  | 'community'
  | 'warning'
  | 'opportunity';

export type EventDecisionIntent =
  | 'communicate'
  | 'dispatch_team'
  | 'reroute'
  | 'inspect'
  | 'monitor'
  | 'invest'
  | 'save_resources'
  | 'permanent_fix'
  | 'delay'
  | 'coordinate';

export type EventContentDecisionBlueprint = {
  id: string;
  intent: EventDecisionIntent;
  title: string;
  description: string;
  shortTradeoff: string;
  riskHint: string;
  strategyLabel: string;
  recommendedForPriority?: DailyPriorityKey[];
  discouragedForPriority?: DailyPriorityKey[];
};

export type EventContentFutureHook = {
  triggerTag: string;
  possibleFollowUpTitle: string;
  delayDays: number;
  severityShift: 'up' | 'down' | 'stable';
};

export type EventContentVariationRules = {
  avoidRepeatWithinDays?: number;
  maxAppearancesInPilot?: number;
  requiresSubsystem?: 'container' | 'vehicle' | 'social' | 'personnel';
  excludeDay1Tutorial?: boolean;
};

export type EventContentProfile = {
  id: string;
  category: EventContentCategory;
  titleTemplates: string[];
  descriptionTemplates: string[];
  fieldNoteTemplates: string[];
  citizenVoiceTemplates?: string[];
  advisorLineTemplates?: string[];
  allowedNeighborhoods?: string[];
  preferredNeighborhoodArchetypes?: NeighborhoodArchetype[];
  preferredPriorityKeys?: DailyPriorityKey[];
  tags: string[];
  narrativeTone: EventNarrativeTone;
  baseSeverity: 'low' | 'medium' | 'high' | 'critical';
  decisionBlueprints: EventContentDecisionBlueprint[];
  variationRules?: EventContentVariationRules;
  futureHook?: EventContentFutureHook;
};

export type EventVariationHistory = {
  recentProfileIds: string[];
  recentTitles: string[];
  categoriesByDay: Record<number, EventContentCategory[]>;
};

export type EventContentVariationContext = {
  day: number;
  neighborhoodId: string;
  dailyPriorityKey?: DailyPriorityKey;
  history: EventVariationHistory;
  /** Aynı gün içinde zaten kullanılan profil/kategori */
  batchProfileIds: string[];
  batchCategories: EventContentCategory[];
  isAnchor: boolean;
  isTutorialDay: boolean;
  rng: () => number;
};

export type EventPriorityRelation =
  | 'supports'
  | 'risks'
  | 'indirect'
  | 'resource_pressure'
  | 'social_relief'
  | 'operational_gain';
