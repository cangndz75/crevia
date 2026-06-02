import {
  CONTENT_PRODUCTION_DUPLICATE_FAIL_THRESHOLD,
  CONTENT_PRODUCTION_DUPLICATE_WARN_THRESHOLD,
} from './contentProductionConstants';
import type {
  ContentItemDuplicateSignature,
  CreviaContentDuplicateRiskResult,
  CreviaContentPackItem,
  CreviaContentQualityStatus,
} from './contentProductionTypes';

const TR_CHAR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  Ç: 'c',
  Ğ: 'g',
  Ö: 'o',
  Ş: 's',
  Ü: 'u',
};

export function normalizeContentCopyText(text: string): string {
  let normalized = text.trim().toLocaleLowerCase('tr-TR');
  for (const [from, to] of Object.entries(TR_CHAR_MAP)) {
    normalized = normalized.replaceAll(from, to);
  }
  return normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeContentCopyText(text)
    .split(' ')
    .filter((token) => token.length > 2);
}

function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((token) => setB.has(token)).length;
  return shared / Math.max(a.length, b.length);
}

function sharedValues(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}

export function buildContentItemDuplicateSignature(item: CreviaContentPackItem): ContentItemDuplicateSignature {
  const copyText = item.copyBlocks.map((block) => block.text).join(' ');
  return {
    titleWords: tokenize(item.title),
    districtIds: [...item.districtIds],
    domains: [...item.domains],
    surfaces: [item.surface, ...(item.echoSurfaces ?? [])],
    tags: [...item.tags],
    operationEraIds: [...item.operationEraIds],
    variantKinds: [...(item.variantKinds ?? [])],
    copyKeywords: tokenize(copyText),
  };
}

export function compareContentItemSimilarity(
  a: CreviaContentPackItem,
  b: CreviaContentPackItem,
): number {
  const sigA = buildContentItemDuplicateSignature(a);
  const sigB = buildContentItemDuplicateSignature(b);

  let score = 0;

  if (sharedValues(sigA.domains, sigB.domains).length > 0) score += 0.2;
  if (sharedValues(sigA.districtIds, sigB.districtIds).length > 0) score += 0.2;
  if (sharedValues(sigA.surfaces, sigB.surfaces).length > 0) score += 0.15;
  if (sharedValues(sigA.tags, sigB.tags).length > 0) score += 0.1;
  score += overlapRatio(sigA.titleWords, sigB.titleWords) * 0.2;
  score += overlapRatio(sigA.copyKeywords, sigB.copyKeywords) * 0.15;

  return Math.min(1, Math.round(score * 100) / 100);
}

function duplicateStatus(score: number): CreviaContentQualityStatus {
  if (score >= CONTENT_PRODUCTION_DUPLICATE_FAIL_THRESHOLD) return 'fail';
  if (score >= CONTENT_PRODUCTION_DUPLICATE_WARN_THRESHOLD) return 'warn';
  return 'pass';
}

export function buildDuplicateRiskReasonLine(risk: CreviaContentDuplicateRiskResult): string {
  return `${risk.itemAId} ↔ ${risk.itemBId}: benzerlik ${Math.round(risk.similarityScore * 100)}% · ${risk.reasonLine}`;
}

export function findContentDuplicateRisks(
  items: readonly CreviaContentPackItem[],
): CreviaContentDuplicateRiskResult[] {
  const risks: CreviaContentDuplicateRiskResult[] = [];

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const itemA = items[i]!;
      const itemB = items[j]!;
      const similarityScore = compareContentItemSimilarity(itemA, itemB);
      const status = duplicateStatus(similarityScore);
      if (status === 'pass') continue;

      const sigA = buildContentItemDuplicateSignature(itemA);
      const sigB = buildContentItemDuplicateSignature(itemB);

      risks.push({
        itemAId: itemA.id,
        itemBId: itemB.id,
        similarityScore,
        sharedTags: sharedValues(sigA.tags, sigB.tags),
        sharedDomains: sharedValues(sigA.domains, sigB.domains),
        sharedDistricts: sharedValues(sigA.districtIds, sigB.districtIds),
        sharedSurfaces: sharedValues(sigA.surfaces, sigB.surfaces),
        status,
        reasonLine:
          status === 'fail'
            ? 'Yüksek örtüşme; title/domain/district tekrarı riski.'
            : 'Orta örtüşme; echo veya trade-off farkı netleştirilmeli.',
      });
    }
  }

  return risks;
}

export function summarizeDuplicateRisks(risks: readonly CreviaContentDuplicateRiskResult[]): {
  pass: number;
  warn: number;
  fail: number;
} {
  return risks.reduce(
    (acc, risk) => {
      if (risk.status === 'fail') acc.fail += 1;
      else if (risk.status === 'warn') acc.warn += 1;
      else acc.pass += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
}
