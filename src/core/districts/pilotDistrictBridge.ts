import { resolveDistrictType } from '@/core/districts/districtEventEngine';
import type { DistrictType } from '@/core/districts/types';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

/**
 * Pilot store district id → mahalle karakter tipi.
 * generateDailyEventSet / selectPilotEventsForDay entegrasyonu için hazır;
 * mevcut pilotEvents havuzu bu adımda değiştirilmedi.
 */
export function mapPilotDistrictToDistrictType(
  districtId: PilotDistrictId | null | undefined,
): DistrictType {
  return resolveDistrictType(districtId ?? undefined);
}
