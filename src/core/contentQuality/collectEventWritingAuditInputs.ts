/**
 * Script-only collector — app bundle index.ts üzerinden export edilmez.
 */

import { pilotEvents } from '@/core/content/pilotEvents';
import { buildCrisisSideEvent } from '@/core/crisis/crisisEventTemplates';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildPostPilotAnchorEvent,
  buildPostPilotSideEvent,
} from '@/core/postPilot/postPilotEventTemplates';
import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';

import type { EventWritingAuditInput, EventWritingAuditSource } from './contentQualityTypes';

const SAMPLE_POST_PILOT_SCOPE: PostPilotEventScopeContext = {
  mapDistrictId: 'cumhuriyet',
  neighborhoodId: 'cumhuriyet_core',
  districtLabel: 'Cumhuriyet Mahallesi',
};

function eventToAuditInput(
  event: EventCard,
  source: EventWritingAuditSource,
): EventWritingAuditInput {
  const optionText = event.decisions.map(
    (d) => `${d.title} ${d.description} ${d.contentShortTradeoff ?? ''} ${d.contentRiskHint ?? ''}`,
  );

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    districtId: event.neighborhoodId ?? event.district,
    day: event.day,
    options: optionText,
    tags: event.filterTags,
    source,
  };
}

function collectPilotCatalogInputs(): EventWritingAuditInput[] {
  return pilotEvents.map((event) => {
    const source: EventWritingAuditSource =
      event.day != null && event.day >= 8 ? 'post_pilot' : 'pilot';
    return eventToAuditInput(event, source);
  });
}

function collectPostPilotSampleInputs(): EventWritingAuditInput[] {
  const day = 8;
  const anchor = buildPostPilotAnchorEvent(0, day, SAMPLE_POST_PILOT_SCOPE);
  const side = buildPostPilotSideEvent(0, day, SAMPLE_POST_PILOT_SCOPE);
  return [anchor, side].map((e) => eventToAuditInput(e, 'post_pilot'));
}

function collectCrisisSampleInputs(): EventWritingAuditInput[] {
  const event = buildCrisisSideEvent('multi_district_warning', 6, SAMPLE_POST_PILOT_SCOPE);
  return [eventToAuditInput(event, 'crisis')];
}

/** Mevcut katalog ve şablonlardan audit girdileri toplar (pilot tam liste + örnek post-pilot/kriz). */
export function collectKnownEventWritingAuditInputs(): EventWritingAuditInput[] {
  return [
    ...collectPilotCatalogInputs(),
    ...collectPostPilotSampleInputs(),
    ...collectCrisisSampleInputs(),
  ];
}
