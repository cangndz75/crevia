import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import {
  CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS,
} from './contentRuntimeActivationConstants';
import type {
  ContentRuntimeActivationEventMeta,
  ContentRuntimeActivationFamilyCandidate,
  ContentRuntimeActivationModel,
  ContentRuntimeActivationPresentationHint,
} from './contentRuntimeActivationTypes';

export function buildContentRuntimeActivationPresentationHint(
  model: ContentRuntimeActivationModel,
  candidates: ContentRuntimeActivationFamilyCandidate[],
): string | undefined {
  if (!model.isEligible || candidates.length === 0) return undefined;

  const packHints: string[] = [];
  for (const candidate of candidates) {
    if (candidate.packId === 'vehicle_route_pack_one') {
      packHints.push('rota');
    }
    if (candidate.packId === 'container_environment_pack_one') {
      packHints.push('konteyner');
    }
    if (candidate.packId === 'district_pack_one') {
      packHints.push('mahalle');
    }
  }

  const districts = candidates.map((c) =>
    getNeighborhoodDisplayName(c.selectedDistrictId),
  );
  const uniqueDistricts = [...new Set(districts)];

  if (packHints.includes('rota') && packHints.includes('konteyner')) {
    return `Bugün ana operasyon ${uniqueDistricts.slice(0, 2).join(' ve ')} rota hattı ile konteyner çevresini birlikte izliyor.`;
  }
  if (packHints.includes('rota')) {
    return `Ana operasyon kapsamı bugün rota baskısı sinyallerini öne çıkarıyor.`;
  }
  if (packHints.includes('konteyner')) {
    return `Ana operasyon kapsamı bugün konteyner ve çevre bakım sinyallerini öne çıkarıyor.`;
  }
  if (uniqueDistricts.length >= 2) {
    return `Bugün ana operasyon ${uniqueDistricts.slice(0, 2).join(' ve ')} mahalle hatlarını birlikte izliyor.`;
  }
  return `Ana operasyon kapsamı bugün ${uniqueDistricts[0] ?? 'şehir'} mahalle odağını güçlendiriyor.`;
}

export function buildContentRuntimeActivationPresentationHints(
  candidates: ContentRuntimeActivationFamilyCandidate[],
): ContentRuntimeActivationPresentationHint[] {
  return candidates.map((candidate) => {
    let label: string = CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.main_operation_scope;
    if (candidate.packId === 'vehicle_route_pack_one') {
      label = CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.route_pressure;
    } else if (candidate.packId === 'container_environment_pack_one') {
      label = CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.container_area;
    } else if (candidate.selectedVariantKind === 'recovery') {
      label = CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.recovery_opportunity;
    } else if (candidate.packId === 'district_pack_one') {
      label = CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.district_focus;
    }

    return {
      label,
      line: candidate.echoes.advisor,
      domains: candidate.domains.slice(0, 2),
      districtIds: [candidate.selectedDistrictId],
    };
  });
}

export {
  buildCityEchoLineFromPackMeta,
  buildDecisionImpactLineFromPackMeta,
  buildTomorrowRiskLineFromPackMeta,
} from './contentRuntimeActivationWiring';

export function buildMainOperationFeelPackHintLine(
  presentationHint?: string,
): string | undefined {
  return presentationHint?.trim() || undefined;
}
