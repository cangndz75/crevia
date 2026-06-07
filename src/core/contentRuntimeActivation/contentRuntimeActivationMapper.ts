import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { pilotDistrictFromMapDistrict } from '@/features/map/data/mapDistrictMapping';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import {
  CONTENT_RUNTIME_ACTIVATION_PACK_LABELS,
} from './contentRuntimeActivationConstants';
import type {
  ContentRuntimeActivationEventMeta,
  ContentRuntimeActivationFamilyCandidate,
  ContentRuntimeActivationPackId,
} from './contentRuntimeActivationTypes';

function resolveCategory(domains: string[]): string {
  if (domains.some((d) => d.includes('container'))) return 'Konteyner / Temizlik';
  if (domains.some((d) => d.includes('vehicle') || d.includes('route'))) return 'Araç / Rota';
  if (domains.some((d) => d.includes('personnel'))) return 'Personel / Ekip';
  if (domains.some((d) => d.includes('social'))) return 'Sosyal Nabız';
  if (domains.some((d) => d.includes('crisis'))) return 'Kriz Öncesi Sinyal';
  return 'Mahalle Operasyonu';
}

function resolveEventType(domains: string[]): NonNullable<EventCard['eventType']> {
  if (domains.some((d) => d.includes('container'))) return 'waste';
  if (domains.some((d) => d.includes('vehicle') || d.includes('route'))) return 'vehicle';
  if (domains.some((d) => d.includes('personnel'))) return 'staff';
  if (domains.some((d) => d.includes('social'))) return 'social_media';
  if (domains.some((d) => d.includes('crisis'))) return 'butterfly';
  return 'citizen_complaint';
}

function resolveContentCategory(domains: string[]): string {
  if (domains.some((d) => d.includes('vehicle') || d.includes('route'))) return 'vehicle_route';
  if (domains.some((d) => d.includes('container'))) return 'waste_container';
  if (domains.some((d) => d.includes('personnel'))) return 'staff_morale';
  if (domains.some((d) => d.includes('social'))) return 'social_pulse';
  if (domains.some((d) => d.includes('crisis'))) return 'crisis_signal';
  return 'citizen_complaint';
}

function buildDecisions(
  candidate: ContentRuntimeActivationFamilyCandidate,
  day: number,
): EventDecision[] {
  const prefix = `cra_${candidate.packId}_${candidate.familyId}_d${day}`;
  const hints = [
    {
      title: 'Hızlı Müdahale',
      description: candidate.shortTermEffect,
      style: 'bold' as const,
      decisionStyle: 'fast' as const,
      tradeOff: candidate.tradeoff,
    },
    {
      title: 'Önleyici Plan',
      description: 'Bugün görünür etki daha düşük kalır.',
      style: 'balanced' as const,
      decisionStyle: 'planned' as const,
      tradeOff: candidate.tradeoff,
    },
    {
      title: 'Dengeli Dağıtım',
      description: candidate.selectedVariantText,
      style: 'cautious' as const,
      decisionStyle: 'partial' as const,
      tradeOff: candidate.carryOver,
    },
  ];

  return hints.map((hint, index) => ({
    id: `${prefix}-opt${index}`,
    title: hint.title,
    description: hint.description,
    style: hint.style,
    recommended: index === 0,
    decisionStyle: hint.decisionStyle,
    contentShortTradeoff: hint.tradeOff,
    contentRiskHint: candidate.problem.slice(0, 120),
    contentPriorityHint: candidate.domains[0] ?? 'Operasyon',
    effects: {
      publicSatisfaction: index === 0 ? 6 : index === 1 ? 3 : 2,
      budget: index === 0 ? -2800 : -1600,
      morale: index === 0 ? -2 : 1,
      risk: index === 0 ? -6 : -2,
      xp: 10 + index,
    },
  }));
}

export function buildContentRuntimeActivationEventMeta(
  candidate: ContentRuntimeActivationFamilyCandidate,
): ContentRuntimeActivationEventMeta {
  const domain = candidate.domains[0] ?? 'generic_operation';
  return {
    packId: candidate.packId,
    familyId: candidate.familyId,
    variantId: `${candidate.familyId}_${candidate.selectedVariantKind}`,
    variantKind: candidate.selectedVariantKind,
    domain,
    districtId: candidate.selectedDistrictId,
    advisorEcho: candidate.echoes.advisor,
    reportEcho: candidate.echoes.report,
    socialEcho: candidate.echoes.social,
    mapHint: candidate.echoes.map,
    tomorrowPreview: candidate.echoes.tomorrow_preview,
    resultEcho: candidate.echoes.result,
    vehicleMaintenanceIntent: candidate.intents.vehicleMaintenance,
    containerNetworkIntent: candidate.intents.containerNetwork,
    environmentCareIntent: candidate.intents.environmentCare,
    resourceFatigueIntent: candidate.intents.resource,
    districtTrustIntent: candidate.intents.trust,
    operationEraIntent: candidate.domains.includes('operation_era')
      ? candidate.intents.memory
      : undefined,
    activeRouteIntent:
      candidate.packId === 'vehicle_route_pack_one'
        ? candidate.intents.vehicleMaintenance
        : undefined,
    source: 'content_runtime_activation_lite',
  };
}

export function mapContentRuntimeActivationCandidateToEventCard(
  candidate: ContentRuntimeActivationFamilyCandidate,
  day: number,
): EventCard {
  const districtId = candidate.selectedDistrictId as MapDistrictId;
  const pilotDistrict = pilotDistrictFromMapDistrict(districtId);
  const districtIds = pilotDistrict ? [pilotDistrict] : undefined;
  const meta = buildContentRuntimeActivationEventMeta(candidate);

  const filterTags: EventCard['filterTags'] = candidate.domains.some((d) =>
    d.includes('crisis'),
  )
    ? ['crisis']
    : undefined;

  return {
    id: `cra_${candidate.packId}_${candidate.familyId}_d${day}`,
    title: candidate.title,
    category: resolveCategory(candidate.domains),
    riskLevel: candidate.domains.some((d) => d.includes('crisis')) ? 'high' : 'medium',
    district: getNeighborhoodDisplayName(districtId),
    neighborhoodId: districtId,
    description: [candidate.scene, candidate.problem, candidate.selectedVariantText]
      .filter(Boolean)
      .join(' '),
    contextTag: CONTENT_RUNTIME_ACTIVATION_PACK_LABELS[candidate.packId],
    urgencyHours: candidate.domains.some((d) => d.includes('crisis')) ? 3 : 5,
    decisions: buildDecisions(candidate, day),
    previewEffects: {
      publicSatisfaction: -3,
      risk: 5,
      xp: 12,
    },
    day,
    districtIds,
    eventType: resolveEventType(candidate.domains),
    priority: candidate.domains.some((d) => d.includes('crisis')) ? 7 : 6,
    fallback: false,
    filterTags,
    advisorNote: candidate.echoes.advisor,
    characterMessage: candidate.echoes.social,
    contentProfileId: candidate.familyId,
    contentCategory: resolveContentCategory(candidate.domains),
    contentFutureHookHint: `${candidate.echoes.report} | ${candidate.carryOver}`,
    contentPackMeta: meta,
  };
}

export function mapContentRuntimeActivationCandidatesToEventCards(
  candidates: ContentRuntimeActivationFamilyCandidate[],
  day: number,
): EventCard[] {
  return candidates.map((candidate) =>
    mapContentRuntimeActivationCandidateToEventCard(candidate, day),
  );
}

export function readContentRuntimeActivationMetaFromEvent(
  event?: EventCard | null,
): ContentRuntimeActivationEventMeta | undefined {
  return event?.contentPackMeta?.source === 'content_runtime_activation_lite'
    ? event.contentPackMeta
    : undefined;
}
