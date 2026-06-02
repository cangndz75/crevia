import { normalizeContentCopyText } from '@/core/contentProduction/contentDuplicateGuard';
import type { CreviaContentPackItem } from '@/core/contentProduction/contentProductionTypes';

import { EVENT_FRESHNESS_GENERIC_STOP_WORDS } from './eventFreshnessConstants';
import type { CreviaEventFreshnessSignature } from './eventFreshnessTypes';

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function normalizeFreshnessText(text?: string): string {
  if (!text) return '';
  return normalizeContentCopyText(text);
}

function meaningfulTokens(text?: string): string[] {
  if (!text) return [];
  const stop = new Set(EVENT_FRESHNESS_GENERIC_STOP_WORDS);
  return normalizeFreshnessText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !stop.has(token));
}

function hashSignature(parts: readonly (string | undefined)[]): string {
  const normalized = parts
    .map((part) => normalizeFreshnessText(part ?? ''))
    .filter(Boolean)
    .join('|');
  if (!normalized) return 'empty';
  return stableHash(normalized).toString(36);
}

export function buildEventFamilySignature(familyId?: string): string {
  return hashSignature(['family', familyId]);
}

export function buildDistrictSignature(districtIds?: readonly string[]): string {
  const sorted = [...(districtIds ?? [])].map((id) => normalizeFreshnessText(id)).sort();
  return hashSignature(['district', sorted.join(',')]);
}

export function buildDomainSignature(domains?: readonly string[]): string {
  const sorted = [...(domains ?? [])].map((d) => normalizeFreshnessText(d)).sort();
  return hashSignature(['domain', sorted.join(',')]);
}

export function buildVariantSignature(variantKind?: string): string {
  return hashSignature(['variant', variantKind]);
}

export function buildEchoSignature(input: {
  echoSurfaces?: readonly string[];
  copySummary?: string;
  title?: string;
}): string {
  const surfaces = [...(input.echoSurfaces ?? [])].sort().join(',');
  const tokens = meaningfulTokens(input.copySummary ?? input.title).slice(0, 8).join(',');
  return hashSignature(['echo', surfaces, tokens]);
}

export function buildTitleCopySignature(title?: string, copySummary?: string): string {
  const tokens = meaningfulTokens(`${title ?? ''} ${copySummary ?? ''}`).slice(0, 12).join(',');
  return hashSignature(['title_copy', tokens]);
}

export function buildCompositeFreshnessSignature(input: {
  familyId?: string;
  districtIds?: readonly string[];
  domains?: readonly string[];
  variantKind?: string;
  echoSurfaces?: readonly string[];
  title?: string;
  copySummary?: string;
  operationEraId?: string;
  eventKind?: string;
}): CreviaEventFreshnessSignature {
  const family = buildEventFamilySignature(input.familyId);
  const district = buildDistrictSignature(input.districtIds);
  const domain = buildDomainSignature(input.domains);
  const variant = buildVariantSignature(input.variantKind);
  const echo = buildEchoSignature({
    echoSurfaces: input.echoSurfaces,
    copySummary: input.copySummary,
    title: input.title,
  });
  const titleCopy = buildTitleCopySignature(input.title, input.copySummary);
  const composite = hashSignature([
    family,
    district,
    domain,
    variant,
    echo,
    titleCopy,
    input.operationEraId,
    input.eventKind,
  ]);

  return { family, district, domain, variant, echo, titleCopy, composite };
}

export function buildCompositeFreshnessSignatureFromItem(
  item: CreviaContentPackItem,
  variantKind?: string,
): CreviaEventFreshnessSignature {
  return buildCompositeFreshnessSignature({
    familyId: item.eventFamilyIds?.[0] ?? item.id,
    districtIds: item.districtIds,
    domains: item.domains,
    variantKind,
    echoSurfaces: item.echoSurfaces ?? item.copyBlocks.map((b) => b.surface),
    title: item.title,
    copySummary: item.copyBlocks.map((b) => b.text).join(' '),
    operationEraId: item.operationEraIds[0],
    eventKind: item.surface,
  });
}

export function compareTitleCopySignatures(a?: string, b?: string): number {
  const tokensA = meaningfulTokens(a);
  const tokensB = meaningfulTokens(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  const shared = tokensA.filter((t) => setB.has(t)).length;
  return shared / Math.max(tokensA.length, tokensB.length);
}

export function signaturesEqual(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return normalizeFreshnessText(a) === normalizeFreshnessText(b) || a === b;
}

export function turkishNormalizationIsCaseInsensitive(input: string): boolean {
  const lower = normalizeFreshnessText(input);
  const upper = normalizeFreshnessText(input.toLocaleUpperCase('tr-TR'));
  return lower === upper || lower.length === upper.length;
}
