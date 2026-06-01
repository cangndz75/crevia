import { auditEventWriting } from '@/core/contentQuality/eventContentAudit';
import type { EventWritingAuditInput, EventWritingAuditResult } from '@/core/contentQuality/contentQualityTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';

import type { ContentPackEventDomain, ContentPackEventTemplate } from './contentPackTypes';

const FORBIDDEN = ['premium', 'satın al', 'paywall', 'kilitli'] as const;

export type ContentPackValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function buildContentPackAuditInput(
  template: ContentPackEventTemplate,
): EventWritingAuditInput {
  const blob = [
    template.title,
    template.sceneText,
    template.pressureText,
    template.decisionContextText,
    template.shortTermEffectText,
    template.tradeOffText,
    template.carryOverText,
    template.socialEchoText,
    template.advisorEchoText,
    template.reportEchoText,
  ].join(' ');

  return {
    id: template.id,
    title: template.title,
    description: blob,
    districtId: template.districtId,
    day: template.preferredPilotDays?.[0],
    domain: template.domain === 'container' ? 'container' : undefined,
    tags: template.tags,
    source: 'pilot',
  };
}

export function validateContentPackEvent(
  template: ContentPackEventTemplate,
): ContentPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template.id.trim()) errors.push('id boş');
  if (!template.title.trim()) errors.push('title boş');
  if (!template.districtId) errors.push('districtId boş');
  if (!template.sceneText.trim()) errors.push('sceneText boş');
  if (!template.tradeOffText.trim()) errors.push('tradeOffText boş');
  if (!template.carryOverText.trim()) errors.push('carryOverText boş');
  if (!template.socialEchoText.trim()) errors.push('socialEchoText boş');
  if (!template.advisorEchoText.trim()) errors.push('advisorEchoText boş');
  if (!template.reportEchoText.trim()) errors.push('reportEchoText boş');
  if (template.tags.length === 0) warnings.push('tags boş');

  const lower = [
    template.title,
    template.sceneText,
    template.pressureText,
    template.tradeOffText,
    template.carryOverText,
    template.socialEchoText,
  ]
    .join(' ')
    .toLowerCase();

  for (const word of FORBIDDEN) {
    if (lower.includes(word)) {
      errors.push(`yasaklı kelime: ${word}`);
    }
  }

  if (template.avoidPilotDays?.includes(1) === false && template.preferredPilotDays?.includes(1)) {
    warnings.push('Day 1 preferred — kontrol et');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateContentPackEvents(
  templates: ContentPackEventTemplate[],
): ContentPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const template of templates) {
    const result = validateContentPackEvent(template);
    errors.push(...result.errors.map((e) => `${template.id}: ${e}`));
    warnings.push(...result.warnings.map((w) => `${template.id}: ${w}`));
  }

  const dupId = findDuplicateContentPackIds(templates);
  const dupTitle = findDuplicateContentPackTitles(templates);
  if (dupId.length > 0) errors.push(`duplicate id: ${dupId.join(', ')}`);
  if (dupTitle.length > 0) errors.push(`duplicate title: ${dupTitle.join(', ')}`);

  return { ok: errors.length === 0, errors, warnings };
}

export function countContentPackByDistrict(
  templates: ContentPackEventTemplate[],
): Record<MapDistrictId, number> {
  const counts = Object.fromEntries(
    MAP_DISTRICT_IDENTITY_IDS.map((id) => [id, 0]),
  ) as Record<MapDistrictId, number>;

  for (const template of templates) {
    counts[template.districtId] = (counts[template.districtId] ?? 0) + 1;
  }
  return counts;
}

export function countContentPackByDomain(
  templates: ContentPackEventTemplate[],
): Record<ContentPackEventDomain, number> {
  const counts: Partial<Record<ContentPackEventDomain, number>> = {};
  for (const template of templates) {
    counts[template.domain] = (counts[template.domain] ?? 0) + 1;
  }
  return counts as Record<ContentPackEventDomain, number>;
}

export function findDuplicateContentPackIds(
  templates: ContentPackEventTemplate[],
): string[] {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const t of templates) {
    if (seen.has(t.id)) dup.push(t.id);
    seen.add(t.id);
  }
  return dup;
}

export function findDuplicateContentPackTitles(
  templates: ContentPackEventTemplate[],
): string[] {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const t of templates) {
    const key = t.title.toLowerCase();
    if (seen.has(key)) dup.push(t.title);
    seen.add(key);
  }
  return dup;
}

export type ContentPackAuditSummary = {
  results: EventWritingAuditResult[];
  averageScore: number;
  minScore: number;
  maxScore: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  lowestEventId: string;
};

export function auditContentPackEventsWithWritingStandard(
  templates: ContentPackEventTemplate[],
): ContentPackAuditSummary {
  const results = templates.map((t) => auditEventWriting(buildContentPackAuditInput(t)));
  const scores = results.map((r) => r.score);
  const averageScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = results.reduce((a, b) => (a.score <= b.score ? a : b));

  return {
    results,
    averageScore,
    minScore,
    maxScore,
    passCount: results.filter((r) => r.status === 'pass').length,
    warnCount: results.filter((r) => r.status === 'warn').length,
    failCount: results.filter((r) => r.status === 'fail').length,
    lowestEventId: lowest.eventId,
  };
}
