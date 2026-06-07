import {
  REWARD_COMEBACK_BLAME_TERMS,
  REWARD_COMEBACK_COPY_LIMITS,
  REWARD_COMEBACK_FORBIDDEN_TERMS,
} from './rewardComebackConstants';
import type { RewardComebackVisibilityModel } from './rewardComebackTypes';

export function normalizeRewardComebackText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function rewardComebackCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = normalizeRewardComebackText(text);
  return REWARD_COMEBACK_FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function rewardComebackCopyIsBlaming(text: string): boolean {
  const normalized = normalizeRewardComebackText(text);
  return REWARD_COMEBACK_BLAME_TERMS.some((term) => normalized.includes(term));
}

export function clampRewardComebackCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function sanitizeRewardComebackCopy(
  text: string | undefined,
  surface: keyof typeof REWARD_COMEBACK_COPY_LIMITS,
): string | undefined {
  if (!text?.trim()) return undefined;
  const clamped = clampRewardComebackCopy(text, REWARD_COMEBACK_COPY_LIMITS[surface]);
  if (rewardComebackCopyContainsForbiddenTerms(clamped)) return undefined;
  if (rewardComebackCopyIsBlaming(clamped)) return undefined;
  return clamped;
}

export function makeRewardComebackDuplicateKey(input: {
  momentKind: string;
  districtId?: string;
  domain?: string;
  sourceKind?: string;
  eventId?: string;
  familyId?: string;
}): string {
  return [
    input.momentKind,
    input.districtId ?? 'city',
    input.domain ?? 'operation',
    input.sourceKind ?? 'fallback',
    input.eventId ?? 'none',
    input.familyId ?? 'none',
  ].join(':');
}

export function isDuplicateRewardComebackLine(
  line: string | undefined,
  existing: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeRewardComebackText(line);
  return existing.some((existingLine) => {
    const other = normalizeRewardComebackText(existingLine);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}

export function buildRewardComebackHubLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.hubLine || isDuplicateRewardComebackLine(model.hubLine, existingLines)) {
    return undefined;
  }
  return model.hubLine;
}

export function buildRewardComebackReportLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.reportLine || isDuplicateRewardComebackLine(model.reportLine, existingLines)) {
    return undefined;
  }
  return model.reportLine;
}

export function buildRewardComebackResultLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.resultLine || isDuplicateRewardComebackLine(model.resultLine, existingLines)) {
    return undefined;
  }
  return model.resultLine;
}

export function buildRewardComebackSocialLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.socialLine || isDuplicateRewardComebackLine(model.socialLine, existingLines)) {
    return undefined;
  }
  return model.socialLine;
}

export function buildRewardComebackMapLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.mapLine || isDuplicateRewardComebackLine(model.mapLine, existingLines)) {
    return undefined;
  }
  return model.mapLine;
}

export function buildRewardComebackEceLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.eceLine || isDuplicateRewardComebackLine(model.eceLine, existingLines)) {
    return undefined;
  }
  return model.eceLine;
}

export function buildRewardComebackJournalLine(
  model: RewardComebackVisibilityModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model?.journalLine || isDuplicateRewardComebackLine(model.journalLine, existingLines)) {
    return undefined;
  }
  return model.journalLine;
}
