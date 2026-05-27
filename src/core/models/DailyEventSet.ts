import type { PilotDistrictId } from './DistrictProfile';

export type GameEventRole =
  | 'anchor'
  | 'side'
  | 'quick'
  | 'opportunity'
  | 'butterfly'
  | 'signal';

export type GameEventStatus =
  | 'pending'
  | 'awaiting_decision'
  | 'resolved'
  | 'deferred'
  | 'escalated'
  | 'dismissed';

export type DailyEventSet = {
  id: string;
  day: number;
  districtId: PilotDistrictId;
  generatedAt: string;
  seed: number;
  anchorEventId: string;
  sideEventIds: string[];
  quickActionIds: string[];
  opportunityEventIds: string[];
  butterflyEventIds: string[];
  signalEventIds: string[];
  allEventIds: string[];
  eventRoles: Record<string, GameEventRole>;
  eventStatuses: Record<string, GameEventStatus>;
};
