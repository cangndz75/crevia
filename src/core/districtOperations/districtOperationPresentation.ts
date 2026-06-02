import { getDistrictIdentity } from '@/core/districts/districtIdentityPresentation';

import {
  DISTRICT_OPERATION_FORBIDDEN_COPY_TERMS,
  DISTRICT_OPERATION_IMPACT_DOMAIN_LABELS,
  DISTRICT_OPERATION_KIND_LABELS,
  DISTRICT_OPERATION_MAX_IMPACT_CHIPS,
  DISTRICT_OPERATION_STATUS_LABELS,
} from './districtOperationConstants';
import type {
  DistrictOperationCandidate,
  DistrictOperationChipModel,
  DistrictOperationKind,
  DistrictOperationPresentationModel,
  DistrictOperationStatus,
  DistrictOperationTone,
} from './districtOperationTypes';

export type DistrictOperationPresentationOptions = {
  compact?: boolean;
  surface?: 'hub' | 'map' | 'report' | 'profile' | 'dev';
  includeCtaHint?: boolean;
};

export function buildDistrictOperationKindLabel(kind: DistrictOperationKind): string {
  return DISTRICT_OPERATION_KIND_LABELS[kind];
}

export function buildDistrictOperationStatusLabel(status: DistrictOperationStatus): string {
  return DISTRICT_OPERATION_STATUS_LABELS[status];
}

export function districtOperationCopyContainsForbiddenTerms(text: string): string[] {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_OPERATION_FORBIDDEN_COPY_TERMS.filter((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function buildDistrictOperationImpactChips(
  candidate: DistrictOperationCandidate,
): DistrictOperationChipModel[] {
  return candidate.definition.impactDomains
    .slice(0, DISTRICT_OPERATION_MAX_IMPACT_CHIPS)
    .map((domain) => ({
      id: domain,
      label: DISTRICT_OPERATION_IMPACT_DOMAIN_LABELS[domain],
      tone: candidate.tone,
      iconKey: candidate.definition.iconKey,
    }));
}

export function buildDistrictOperationSummaryLine(
  candidate: DistrictOperationCandidate,
): string {
  const districtLabel = getDistrictIdentity(candidate.definition.districtId).shortLabel;
  const kindLabel = buildDistrictOperationKindLabel(candidate.definition.kind);

  if (candidate.definition.kind === 'route_discipline') {
    return `${districtLabel}’de ${kindLabel.toLocaleLowerCase('tr-TR')} araç baskısını azaltabilir.`;
  }
  if (candidate.definition.kind === 'recovery_focus') {
    return `${districtLabel}’te güven toparlama operasyonu sosyal şikayetleri yumuşatır.`;
  }
  if (candidate.definition.kind === 'environmental_care') {
    return `${districtLabel}’de çevre bakım odağı mahalle güvenini güçlendirir.`;
  }
  if (candidate.definition.kind === 'crisis_prevention') {
    return `${districtLabel}’de kriz önleme odağı yoğunluk riskini erken izler.`;
  }
  if (candidate.definition.kind === 'public_trust') {
    return `${districtLabel}’te ${kindLabel.toLocaleLowerCase('tr-TR')} sosyal algıyı dengeler.`;
  }
  if (candidate.definition.kind === 'visible_service') {
    return `${districtLabel}’de görünür hizmet odağı prestij baskısını yönetir.`;
  }
  return `${districtLabel}’de ${kindLabel.toLocaleLowerCase('tr-TR')} operasyonu gündeme gelir.`;
}

export function buildDistrictOperationUnlockLine(
  candidate: DistrictOperationCandidate,
): string {
  if (candidate.status === 'future' || candidate.definition.isFutureOnly) {
    return 'İlerleyen kariyer aşamasında açılır.';
  }
  if (candidate.eligibilityReasons.includes('trust_needs_recovery')) {
    return 'Mahalle güveni görünür oldukça bu operasyon daha net önerilir.';
  }
  if (candidate.eligibilityReasons.includes('route_context_available')) {
    return 'Aktif görev rotası bu mahalledeyken operasyon önceliği artar.';
  }
  return 'Bölge Sorumlusu yetkisiyle mahalle özel operasyonları gündeme gelir.';
}

export function buildDistrictOperationMemoryLine(
  candidate: DistrictOperationCandidate,
): string | undefined {
  if (candidate.definition.kind === 'recovery_focus') {
    return 'Bu mahallede son günlerde sosyal güven toparlanıyor.';
  }
  if (
    candidate.definition.kind === 'route_discipline' ||
    candidate.definition.kind === 'resource_balance'
  ) {
    return 'Rota baskısı tekrar ettiği için özel operasyon öneriliyor.';
  }
  if (candidate.definition.kind === 'district_memory_response') {
    return 'Mahalle hafıza izi bu operasyonu gündeme taşıyor.';
  }
  return undefined;
}

export function buildDistrictOperationCtaHint(
  candidate: DistrictOperationCandidate,
): string | undefined {
  if (candidate.status === 'ready' || candidate.status === 'recommended') {
    return 'Operasyon önerisini incele';
  }
  if (candidate.status === 'preview') {
    return 'Yetki ilerledikçe gündeme gelir';
  }
  if (candidate.status === 'future') {
    return 'İlerleyen kariyer aşamasında açılır';
  }
  return undefined;
}

export function buildDistrictOperationEmptyState(
  surface: DistrictOperationPresentationOptions['surface'] = 'map',
): string {
  if (surface === 'hub') {
    return 'Mahalle özel operasyonları, bölge sorumluluğu ve güven sinyalleriyle açılır.';
  }
  if (surface === 'report') {
    return 'Rapor gündeminde mahalle özel operasyonları güven sinyalleriyle önerilir.';
  }
  if (surface === 'profile') {
    return 'Kariyer ilerledikçe mahalle özel operasyon önerileri görünür hale gelir.';
  }
  if (surface === 'dev') {
    return 'District operation foundation preview — runtime activation yok.';
  }
  return 'Mahalle özel operasyonları, bölge sorumluluğu ve güven sinyalleriyle açılır.';
}

export function buildDistrictOperationPresentationModel(
  candidate: DistrictOperationCandidate,
  options: DistrictOperationPresentationOptions = {},
): DistrictOperationPresentationModel {
  const districtLabel = getDistrictIdentity(candidate.definition.districtId).shortLabel;
  const compact = options.compact === true;

  return {
    id: candidate.definition.id,
    title: candidate.definition.title,
    subtitle: compact
      ? candidate.definition.shortLabel
      : candidate.definition.districtFlavorLine,
    districtLabel,
    statusLabel: buildDistrictOperationStatusLabel(candidate.status),
    kindLabel: buildDistrictOperationKindLabel(candidate.definition.kind),
    tone: candidate.tone,
    summaryLine: candidate.summaryLine || buildDistrictOperationSummaryLine(candidate),
    trustLine: compact ? undefined : candidate.definition.districtFlavorLine,
    memoryLine: buildDistrictOperationMemoryLine(candidate),
    routeLine: candidate.eligibilityReasons.includes('route_context_available')
      ? 'Aktif rota bu mahallede; operasyon önceliği yükseldi.'
      : undefined,
    impactChips: buildDistrictOperationImpactChips(candidate),
    unlockLine: candidate.unlockLine ?? buildDistrictOperationUnlockLine(candidate),
    ctaHint:
      options.includeCtaHint === false
        ? undefined
        : buildDistrictOperationCtaHint(candidate),
  };
}

export function buildDistrictOperationCompactPreviewLine(
  candidate: DistrictOperationCandidate,
): string {
  const districtLabel = getDistrictIdentity(candidate.definition.districtId).shortLabel;
  return `Öneri: ${districtLabel} ${candidate.definition.shortLabel}`;
}
