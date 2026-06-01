import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';

import {
  auditContentPackEventsWithWritingStandard,
  countContentPackByDistrict,
  countContentPackByDomain,
} from './contentPackValidation';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';

export function buildContentSafetyPackStage1Summary(): string {
  const audit = auditContentPackEventsWithWritingStandard(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);
  const byDistrict = countContentPackByDistrict(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);
  const byDomain = countContentPackByDomain(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);

  return [
    '# Content Safety Pack — Aşama 1 Özet',
    '',
    `Toplam event: ${NEIGHBORHOOD_CONTAINER_CONTENT_PACK.length}`,
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

export function buildDistrictContentCoverageSummary(): string {
  const byDistrict = countContentPackByDistrict(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);
  return Object.entries(byDistrict)
    .map(([id, count]) => `${DISTRICT_IDENTITIES[id as MapDistrictId]?.name ?? id}: ${count} event`)
    .join('\n');
}

export function buildContainerContentCoverageSummary(): string {
  const container = NEIGHBORHOOD_CONTAINER_CONTENT_PACK.filter((e) => e.domain === 'container');
  return `Konteyner domain event sayısı: ${container.length}`;
}

export function buildContentPackAuditMarkdown(): string {
  const audit = auditContentPackEventsWithWritingStandard(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);
  const lines = [
    '## Pack Audit Detayı',
    '',
    `Ortalama: ${audit.averageScore}`,
    '',
  ];

  for (const result of audit.results) {
    lines.push(`- [${result.status.toUpperCase()}] ${result.eventId} (${result.score})`);
  }

  return lines.join('\n');
}

export function buildNextContentPackStep(): string {
  return 'Sonraki adım: Content Safety Pack Aşama 2: Araç/Rota + Personel/Moral + Sosyal/Kriz Events (tamamlandıysa Aşama 3)';
}
