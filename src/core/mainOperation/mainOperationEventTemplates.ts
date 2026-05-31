import type { EventCard } from '@/core/models/EventCard';
import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';

import {
  buildContentPackEventByKey,
  isContentPackTemplateKey,
} from './mainOperationContentPack';

export {
  GLOBAL_ANCHOR_KEYS,
  GLOBAL_SIDE_KEYS,
  DISTRICT_EVENT_KEYS,
  CRISIS_ADJACENT_KEYS,
} from './mainOperationContentPack';

export function buildMainFullAnchorEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  if (isContentPackTemplateKey(templateKey, 'anchor')) {
    return buildContentPackEventByKey(templateKey, day, scope);
  }
  return buildContentPackEventByKey('district_pressure', day, scope);
}

export function buildMainFullSideEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  if (isContentPackTemplateKey(templateKey, 'side')) {
    return buildContentPackEventByKey(templateKey, day, scope);
  }
  return buildContentPackEventByKey('social_coordination', day, scope);
}

export function buildMainDistrictEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  return buildContentPackEventByKey(templateKey, day, scope);
}

export function buildMainCrisisAdjacentEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  return buildContentPackEventByKey(templateKey, day, scope);
}
