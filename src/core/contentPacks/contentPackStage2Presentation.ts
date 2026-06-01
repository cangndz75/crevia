import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';

import {
  auditCombinedContentPacks,
  auditStage2EventsWithWritingStandard,
  countStage2EventsByDistrict,
  countStage2EventsByDomain,
  countVehicleRouteEvents,
} from './contentPackStage2Validation';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';
import { OPERATION_DIVERSITY_CONTENT_PACK } from './operationDiversityContentPack';

export function buildContentSafetyPackStage2Summary(): string {
  const audit = auditStage2EventsWithWritingStandard(OPERATION_DIVERSITY_CONTENT_PACK);
  const byDomain = countStage2EventsByDomain(OPERATION_DIVERSITY_CONTENT_PACK);
  const byDistrict = countStage2EventsByDistrict(OPERATION_DIVERSITY_CONTENT_PACK);
  const vehicleRoute = countVehicleRouteEvents(OPERATION_DIVERSITY_CONTENT_PACK);

  return [
    '# Content Safety Pack — Aşama 2 Özet',
    '',
    `Toplam event: ${OPERATION_DIVERSITY_CONTENT_PACK.length}`,
    `Araç/Rota: ${vehicleRoute}`,
    `Ortalama audit skoru: ${audit.averageScore}`,
    `Min / max skor: ${audit.minScore} / ${audit.maxScore}`,
    `PASS / WARN / FAIL: ${audit.passCount} / ${audit.warnCount} / ${audit.failCount}`,
    `En düşük skor: ${audit.lowestEventId} (${audit.minScore})`,
    '',
    '## Domain',
    ...Object.entries(byDomain).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Mahalle',
    ...Object.entries(byDistrict).map(
      ([id, count]) => `- ${DISTRICT_IDENTITIES[id as MapDistrictId]?.name ?? id}: ${count}`,
    ),
  ].join('\n');
}

export function buildOperationDiversityCoverageSummary(): string {
  const byDomain = countStage2EventsByDomain(OPERATION_DIVERSITY_CONTENT_PACK);
  const vehicleRoute = countVehicleRouteEvents(OPERATION_DIVERSITY_CONTENT_PACK);
  return [
    `Araç/Rota: ${vehicleRoute}`,
    `Personel: ${byDomain.personnel ?? 0}`,
    `Sosyal: ${byDomain.social ?? 0}`,
    `Kriz-adjacent: ${byDomain.crisis_adjacent ?? 0}`,
  ].join(' | ');
}

export function buildStage2AuditMarkdown(): string {
  const audit = auditStage2EventsWithWritingStandard(OPERATION_DIVERSITY_CONTENT_PACK);
  const lines = ['## Stage 2 Audit', '', `Ortalama: ${audit.averageScore}`, ''];

  for (const result of audit.results) {
    lines.push(`- [${result.status.toUpperCase()}] ${result.eventId} (${result.score})`);
  }
  return lines.join('\n');
}

export function buildStage2ThemeFitSummary(): string {
  const day3 = OPERATION_DIVERSITY_CONTENT_PACK.filter(
    (e) =>
      (e.domain === 'vehicle' || e.domain === 'route' || e.domain === 'personnel') &&
      e.preferredPilotDays?.some((d) => d === 3),
  ).length;
  const day4 = OPERATION_DIVERSITY_CONTENT_PACK.filter(
    (e) => e.domain === 'social' && e.preferredPilotDays?.some((d) => d === 4),
  ).length;
  const day6 = OPERATION_DIVERSITY_CONTENT_PACK.filter(
    (e) => e.domain === 'crisis_adjacent' && e.preferredPilotDays?.includes(6),
  ).length;
  const avoid7 = OPERATION_DIVERSITY_CONTENT_PACK.filter((e) =>
    e.avoidPilotDays?.includes(7),
  ).length;

  return `Gün 3 kaynak aday: ${day3} | Gün 4 sosyal: ${day4} | Gün 6 kriz sinyal: ${day6} | Gün 7 avoid: ${avoid7}`;
}

export function buildCombinedPackSummary(): string {
  const combined = auditCombinedContentPacks(OPERATION_DIVERSITY_CONTENT_PACK);
  const total =
    NEIGHBORHOOD_CONTAINER_CONTENT_PACK.length + OPERATION_DIVERSITY_CONTENT_PACK.length;
  return `Birleşik pack: ${total} event | Stage1 ort: ${combined.stage1.averageScore} | Stage2 ort: ${combined.stage2.averageScore} | Combined ort: ${combined.combinedAverage}`;
}

export function buildNextContentPackStep(): string {
  return 'Sonraki adım: Content Safety Pack Aşama 3: Ece + Social Mentions + Report Echo Variations';
}
