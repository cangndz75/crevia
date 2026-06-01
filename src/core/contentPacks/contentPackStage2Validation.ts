import { auditEventWriting } from '@/core/contentQuality/eventContentAudit';
import type { EventWritingAuditInput } from '@/core/contentQuality/contentQualityTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';

import {
  auditContentPackEventsWithWritingStandard,
  findDuplicateContentPackIds,
  findDuplicateContentPackTitles,
  validateContentPackEvents,
  type ContentPackAuditSummary,
  type ContentPackValidationResult,
} from './contentPackValidation';
import type { ContentPackEventDomain, ContentPackEventTemplate } from './contentPackTypes';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';

const FORBIDDEN = ['premium', 'satın al', 'paywall', 'kilitli'] as const;
const PANIC_WORDS = ['felaket', 'panik', 'kıyamet', 'kaos', 'çöküş'] as const;

export function buildStage2ContentPackAuditInput(
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

  const domainHint =
    template.domain === 'vehicle' || template.domain === 'route'
      ? 'vehicle'
      : template.domain === 'personnel'
        ? 'personnel'
        : template.domain === 'social'
          ? 'social'
          : template.domain === 'crisis_adjacent'
            ? 'crisis'
            : undefined;

  return {
    id: template.id,
    title: template.title,
    description: blob,
    districtId: template.districtId,
    day: template.preferredPilotDays?.[0],
    domain: domainHint,
    tags: template.tags,
    source: 'pilot',
  };
}

export function auditStage2EventsWithWritingStandard(
  templates: ContentPackEventTemplate[],
): ContentPackAuditSummary {
  const results = templates.map((t) => auditEventWriting(buildStage2ContentPackAuditInput(t)));
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

export function validateContentSafetyPackStage2Events(
  templates: ContentPackEventTemplate[],
): ContentPackValidationResult {
  return validateContentPackEvents(templates);
}

export function countStage2EventsByDomain(
  templates: ContentPackEventTemplate[],
): Partial<Record<ContentPackEventDomain, number>> {
  const counts: Partial<Record<ContentPackEventDomain, number>> = {};
  for (const t of templates) {
    counts[t.domain] = (counts[t.domain] ?? 0) + 1;
  }
  return counts;
}

export function countStage2EventsByDistrict(
  templates: ContentPackEventTemplate[],
): Record<MapDistrictId, number> {
  const counts = Object.fromEntries(
    MAP_DISTRICT_IDENTITY_IDS.map((id) => [id, 0]),
  ) as Record<MapDistrictId, number>;

  for (const t of templates) {
    counts[t.districtId] = (counts[t.districtId] ?? 0) + 1;
  }
  return counts;
}

export function countVehicleRouteEvents(templates: ContentPackEventTemplate[]): number {
  return templates.filter((t) => t.domain === 'vehicle' || t.domain === 'route').length;
}

export function findStage2DuplicateIdsAgainstStage1(
  stage1: ContentPackEventTemplate[],
  stage2: ContentPackEventTemplate[],
): string[] {
  const stage1Ids = new Set(stage1.map((t) => t.id));
  return stage2.filter((t) => stage1Ids.has(t.id)).map((t) => t.id);
}

export function findStage2DuplicateTitlesAgainstStage1(
  stage1: ContentPackEventTemplate[],
  stage2: ContentPackEventTemplate[],
): string[] {
  const stage1Titles = new Set(stage1.map((t) => t.title.toLowerCase()));
  return stage2.filter((t) => stage1Titles.has(t.title.toLowerCase())).map((t) => t.title);
}

export function validateCombinedPackIds(
  stage1: ContentPackEventTemplate[],
  stage2: ContentPackEventTemplate[],
): ContentPackValidationResult {
  const combined = [...stage1, ...stage2];
  const errors: string[] = [];
  const dupId = findDuplicateContentPackIds(combined);
  const dupTitle = findDuplicateContentPackTitles(combined);
  if (dupId.length > 0) errors.push(`combined duplicate id: ${dupId.join(', ')}`);
  if (dupTitle.length > 0) errors.push(`combined duplicate title: ${dupTitle.join(', ')}`);
  const against1 = findStage2DuplicateIdsAgainstStage1(stage1, stage2);
  const againstTitle = findStage2DuplicateTitlesAgainstStage1(stage1, stage2);
  if (against1.length > 0) errors.push(`stage1 id clash: ${against1.join(', ')}`);
  if (againstTitle.length > 0) errors.push(`stage1 title clash: ${againstTitle.join(', ')}`);
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateStage2PilotDaySafety(
  templates: ContentPackEventTemplate[],
): ContentPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const t of templates) {
    if (!t.avoidPilotDays?.includes(1)) {
      warnings.push(`${t.id}: Day 1 avoid eksik`);
    }
    if (!t.avoidPilotDays?.includes(7)) {
      warnings.push(`${t.id}: Day 7 avoid eksik`);
    }
    if (t.preferredPilotDays?.includes(1)) {
      errors.push(`${t.id}: Day 1 preferred — riskli`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateStage2ThemeFit(
  templates: ContentPackEventTemplate[],
): ContentPackValidationResult {
  const errors: string[] = [];
  const resourceCount = templates.filter(
    (t) =>
      (t.domain === 'vehicle' || t.domain === 'route' || t.domain === 'personnel') &&
      t.preferredPilotDays?.some((d) => d === 3 || d === 5),
  ).length;
  const socialCount = templates.filter(
    (t) => t.domain === 'social' && t.preferredPilotDays?.some((d) => d === 4 || d === 5),
  ).length;
  const crisisCount = templates.filter(
    (t) => t.domain === 'crisis_adjacent' && t.preferredPilotDays?.includes(6),
  ).length;

  if (resourceCount < 6) {
    errors.push(`Gün 3 kaynak adayı yetersiz (${resourceCount})`);
  }
  if (socialCount < 6) {
    errors.push(`Gün 4 sosyal adayı yetersiz (${socialCount})`);
  }
  if (crisisCount < 5) {
    errors.push(`Gün 6 kriz sinyal adayı yetersiz (${crisisCount})`);
  }

  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateStage2ForbiddenAndPanic(
  templates: ContentPackEventTemplate[],
): ContentPackValidationResult {
  const errors: string[] = [];

  for (const t of templates) {
    const blob = [
      t.title,
      t.sceneText,
      t.pressureText,
      t.tradeOffText,
      t.carryOverText,
      t.socialEchoText,
    ]
      .join(' ')
      .toLowerCase();

    for (const word of FORBIDDEN) {
      if (blob.includes(word)) errors.push(`${t.id}: yasaklı ${word}`);
    }

    if (t.domain === 'crisis_adjacent') {
      for (const word of PANIC_WORDS) {
        if (blob.includes(word)) errors.push(`${t.id}: panik dili ${word}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings: [] };
}

export function auditCombinedContentPacks(
  stage2: ContentPackEventTemplate[],
): {
  stage1: ContentPackAuditSummary;
  stage2: ContentPackAuditSummary;
  combinedAverage: number;
} {
  const stage1 = auditContentPackEventsWithWritingStandard(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);
  const stage2Audit = auditStage2EventsWithWritingStandard(stage2);
  const combinedScores = [...stage1.results, ...stage2Audit.results].map((r) => r.score);
  const combinedAverage =
    combinedScores.length > 0
      ? Math.round(combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length)
      : 0;

  return { stage1, stage2: stage2Audit, combinedAverage };
}
