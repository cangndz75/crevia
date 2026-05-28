import { CONTAINER_NEIGHBORHOOD_IDS } from './containerConstants';
import type { ContainerNeighborhoodId } from './containerTypes';

const CONTAINER_NEIGHBORHOOD_SET = new Set<string>(CONTAINER_NEIGHBORHOOD_IDS);

const ALIAS_TO_CONTAINER_NEIGHBORHOOD: Record<string, ContainerNeighborhoodId> =
  {
    merkez: 'merkez',
    central: 'merkez',
    cumhuriyet: 'cumhuriyet',
    sanayi: 'sanayi',
    industrial_market: 'sanayi',
    industrialmarket: 'sanayi',
    sanayipazar: 'sanayi',
    pazar: 'sanayi',
    istasyon: 'istasyon',
    yesilvadi: 'yesilvadi',
    yesilpark: 'yesilvadi',
    'yeni-konut': 'cumhuriyet',
    yenikonut: 'cumhuriyet',
  };

const DISPLAY_NAMES: Record<ContainerNeighborhoodId, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function isContainerNeighborhoodId(
  value: unknown,
): value is ContainerNeighborhoodId {
  return (
    typeof value === 'string' &&
    CONTAINER_NEIGHBORHOOD_SET.has(value as ContainerNeighborhoodId)
  );
}

export function normalizeContainerNeighborhoodId(
  value: string | undefined | null,
): ContainerNeighborhoodId | null {
  if (value == null || value === '') {
    return null;
  }
  if (isContainerNeighborhoodId(value)) {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed in ALIAS_TO_CONTAINER_NEIGHBORHOOD) {
    return ALIAS_TO_CONTAINER_NEIGHBORHOOD[trimmed] ?? null;
  }
  const key = normalizeKey(value);
  return ALIAS_TO_CONTAINER_NEIGHBORHOOD[key] ?? null;
}

export function requireContainerNeighborhoodId(
  value: string | undefined | null,
  fallback: ContainerNeighborhoodId = 'merkez',
): ContainerNeighborhoodId {
  return normalizeContainerNeighborhoodId(value) ?? fallback;
}

export function toContainerNeighborhoodIdFromDistrict(
  districtId: string | undefined | null,
): ContainerNeighborhoodId | null {
  return normalizeContainerNeighborhoodId(districtId);
}

export function toContainerNeighborhoodIdFromEventNeighborhood(
  neighborhoodId: string | undefined | null,
): ContainerNeighborhoodId | null {
  return normalizeContainerNeighborhoodId(neighborhoodId);
}

export function toDisplayContainerNeighborhoodName(
  id: ContainerNeighborhoodId,
): string {
  return DISPLAY_NAMES[id];
}
