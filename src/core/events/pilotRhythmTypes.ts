import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

export type PilotDayRole =
  | 'tutorial'
  | 'first_pressure'
  | 'resource_split'
  | 'social_visibility'
  | 'opportunity'
  | 'butterfly_seed'
  | 'final_stress';

export type PilotEventSlot =
  | 'main'
  | 'side'
  | 'support'
  | 'opportunity'
  | 'signal'
  | 'social'
  | 'follow_up'
  | 'final';

export type PilotRhythmIntensity = 'low' | 'medium' | 'high' | 'peak';

export type PilotRhythmSlotPlan = {
  slot: PilotEventSlot;
  required: boolean;
  preferredCategories: string[];
  preferredPriorityKeys?: DailyPriorityKey[];
  preferredNeighborhoods?: string[];
  maxCount?: number;
  minSeverity?: EventCard['riskLevel'];
  allowSignals?: boolean;
};

export type PilotRhythmPlan = {
  day: number;
  role: PilotDayRole;
  title: string;
  description: string;
  intensity: PilotRhythmIntensity;
  preferredCategories: string[];
  discouragedCategories?: string[];
  preferredNeighborhoods?: string[];
  requiredNeighborhoodSpread?: number;
  eventSlots: PilotRhythmSlotPlan[];
  maxMainEvents: number;
  maxSideEvents: number;
  maxOpportunityEvents: number;
  maxSignalEvents: number;
  notes: string[];
};

export type PilotRhythmContext = {
  day: number;
  gameState: GameState;
  dailyPriorityKey?: DailyPriorityKey;
  existingEvents?: EventCard[];
  neighborhoods?: string[];
  recentEventTitles?: string[];
  recentProfileIds?: string[];
  batchCategories?: string[];
  pilotDistrictId?: PilotDistrictId;
};

export type PilotRhythmDebugSummary = {
  role: PilotDayRole;
  categories: Record<string, number>;
  neighborhoods: Record<string, number>;
  slots: Record<string, number>;
};

export type PilotRhythmSelectionResult = {
  plan: PilotRhythmPlan;
  selectedEvents: EventCard[];
  warnings: string[];
  debugSummary?: PilotRhythmDebugSummary;
};

export type PilotRhythmMeta = {
  dayRole: PilotDayRole;
  slot: PilotEventSlot;
  intensity: PilotRhythmIntensity;
  relationText?: string;
};
