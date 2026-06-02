import { getDistrictIdentity, resolveDistrictIconKey } from '@/core/districts/districtIdentityPresentation';

import {
  DISTRICT_TRUST_FORBIDDEN_COPY_TERMS,
  DISTRICT_TRUST_LEVEL_LABELS,
  DISTRICT_TRUST_MAX_VISIBLE_PRESSURE_CHIPS,
  DISTRICT_TRUST_PRESSURE_DOMAIN_LABELS,
  DISTRICT_TRUST_RANK_PERMISSION_IDS,
  DISTRICT_TRUST_TREND_LABELS,
} from './districtTrustConstants';
import { buildDistrictMemoryLine } from './districtTrustMemory';
import { getPrimaryDistrictTrustPressure } from './districtTrustModel';
import type {
  DistrictTrustLevel,
  DistrictTrustPresentationModel,
  DistrictTrustPressureDomain,
  DistrictTrustScoreResult,
  DistrictTrustTrend,
  DistrictTrustVisibilityMode,
} from './districtTrustTypes';

export function buildDistrictTrustLevelLabel(level: DistrictTrustLevel): string {
  return DISTRICT_TRUST_LEVEL_LABELS[level];
}

export function buildDistrictTrustTrendLabel(trend: DistrictTrustTrend): string {
  return DISTRICT_TRUST_TREND_LABELS[trend];
}

export function buildDistrictTrustPressureDomainLabel(
  domain: DistrictTrustPressureDomain,
): string {
  return DISTRICT_TRUST_PRESSURE_DOMAIN_LABELS[domain];
}

function toneForResult(result: DistrictTrustScoreResult): DistrictTrustPresentationModel['tone'] {
  if (result.level === 'trusted' || result.level === 'supportive' || result.trend === 'improving' || result.trend === 'recovering') {
    return 'positive';
  }
  if (result.level === 'fragile' || result.level === 'watch' || result.trend === 'falling' || result.trend === 'strained') {
    return 'warning';
  }
  return 'neutral';
}

export function buildDistrictTrustPressureChips(result: DistrictTrustScoreResult): string[] {
  return result.pressureDomains
    .slice(0, DISTRICT_TRUST_MAX_VISIBLE_PRESSURE_CHIPS)
    .map(buildDistrictTrustPressureDomainLabel);
}

export function buildDistrictTrustChipText(result: DistrictTrustScoreResult): string {
  const level = buildDistrictTrustLevelLabel(result.level);
  const trend = buildDistrictTrustTrendLabel(result.trend);
  const pressure = getPrimaryDistrictTrustPressure(result);
  if (pressure !== 'generic' && (result.trend === 'strained' || result.trend === 'falling')) {
    return `${level} · ${buildDistrictTrustPressureDomainLabel(pressure)}`;
  }
  return `${level} · ${trend}`;
}

export function buildDistrictTrustSummaryLine(result: DistrictTrustScoreResult): string {
  if (result.trend === 'improving' || result.trend === 'recovering') {
    return 'Son müdahaleler mahalle güvenini toparlıyor.';
  }
  const pressure = getPrimaryDistrictTrustPressure(result);
  if (pressure === 'vehicle_route') return 'Araç/rota baskısı güveni aşağı çekebilir.';
  if (pressure === 'social') return 'Mahalle güveni dengede, sosyal nabız izleniyor.';
  if (pressure === 'crisis') return 'Risk eşiği güven trendini baskıda tutuyor.';
  if (pressure === 'container') return 'Konteyner ağı güven algısını etkiliyor.';
  return 'Mahalle güveni mevcut operasyon sinyalleriyle dengede izleniyor.';
}

export function buildDistrictTrustVisibilityLine(mode: DistrictTrustVisibilityMode): string {
  if (mode === 'hidden') return 'Mahalle güveni ilerleyen yetkilerle gündeme gelir.';
  if (mode === 'compact') return 'Mahalle güveni izleniyor.';
  if (mode === 'standard') return 'Mahalle güveni ve hafıza izi görünür.';
  return 'Gelişmiş mahalle güven analizi.';
}

export function buildDistrictTrustUnlockPreviewLine(input: {
  permissionId?: string;
  targetRankLabel?: string;
}): string {
  if (input.permissionId === DISTRICT_TRUST_RANK_PERMISSION_IDS.memoryTracePreview) {
    return `${input.targetRankLabel ?? 'Bölge Sorumlusu'} olduğunda mahalle hafıza izi görünür hale gelir.`;
  }
  if (input.permissionId === DISTRICT_TRUST_RANK_PERMISSION_IDS.districtOperationsPreview) {
    return 'Mahalle özel operasyonlar güven sinyalleriyle gündeme gelir.';
  }
  return `${input.targetRankLabel ?? 'Bölge Sorumlusu'} olduğunda mahalle güveni görünür hale gelir.`;
}

export function buildDistrictTrustPresentationModel(
  result: DistrictTrustScoreResult,
  options?: {
    compact?: boolean;
    includeMemory?: boolean;
    visibilityMode?: DistrictTrustVisibilityMode;
  },
): DistrictTrustPresentationModel {
  const identity = getDistrictIdentity(result.districtId);
  const mode = options?.visibilityMode ?? (options?.compact ? 'compact' : 'standard');
  const memoryLine =
    options?.includeMemory && mode !== 'hidden'
      ? buildDistrictMemoryLine(result.memoryItems)
      : undefined;

  return {
    districtId: result.districtId,
    title: `${identity.shortLabel} Mahalle Güveni`,
    shortLabel: identity.shortLabel,
    scoreLabel: `${result.score}/100`,
    levelLabel: buildDistrictTrustLevelLabel(result.level),
    trendLabel: buildDistrictTrustTrendLabel(result.trend),
    tone: toneForResult(result),
    iconKey: resolveDistrictIconKey(result.districtId),
    chipText: buildDistrictTrustChipText(result),
    summaryLine: buildDistrictTrustSummaryLine(result),
    memoryLine,
    pressureChips: buildDistrictTrustPressureChips(result),
    visibilityLine: buildDistrictTrustVisibilityLine(mode),
  };
}

export function districtTrustCopyContainsForbiddenTerms(text: string): string[] {
  const haystack = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_TRUST_FORBIDDEN_COPY_TERMS.filter((term) =>
    haystack.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function collectDistrictTrustPresentationStrings(
  model: DistrictTrustPresentationModel,
): string[] {
  return [
    model.title,
    model.shortLabel,
    model.scoreLabel,
    model.levelLabel,
    model.trendLabel,
    model.chipText,
    model.summaryLine,
    model.memoryLine ?? '',
    ...(model.pressureChips ?? []),
    model.visibilityLine ?? '',
  ].filter(Boolean);
}
