import type { AuthorityState } from '@/core/authority/authorityTypes';
import type { BadgeState } from '@/core/badges/badgeTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import type { PostPilotOperationState } from './postPilotOperationTypes';

export type PostPilotDailyEventSet = {
  day: number;
  anchorEventId: string;
  sideEventIds: string[];
  allEventIds: string[];
  catalog: EventCard[];
};

export type PostPilotEventScopeContext = {
  mapDistrictId: MapDistrictId;
  neighborhoodId: string;
  districtLabel: string;
};

export type EnsurePostPilotDailyEventsInput = {
  gameState: GameState;
  postPilotOperation: PostPilotOperationState;
  authorityState?: AuthorityState | unknown;
  badgeState?: BadgeState | unknown;
  day?: number;
};

export type PostPilotEventGenerationResult = {
  events: EventCard[];
  eventPool: EventCard[];
  featuredEventId?: string;
  generated: boolean;
  reason: string;
  postPilotOperation: PostPilotOperationState;
};
