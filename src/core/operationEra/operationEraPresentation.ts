import {
  OPERATION_ERA_CADENCE_LABELS,
  OPERATION_ERA_CONTENT_HOOK_LABELS,
  OPERATION_ERA_FOCUS_DOMAIN_LABELS,
  OPERATION_ERA_FORBIDDEN_COPY_TERMS,
  OPERATION_ERA_MAX_VISIBLE_CHIPS,
  OPERATION_ERA_STATUS_LABELS,
} from './operationEraConstants';
import type {
  OperationEraCandidate,
  OperationEraChipModel,
  OperationEraPresentationModel,
  OperationEraCadence,
  OperationEraStatus,
} from './operationEraTypes';

export type OperationEraPresentationOptions = {
  compact?: boolean;
  surface?: 'hub' | 'map' | 'report' | 'profile' | 'dev';
  includeCtaHint?: boolean;
};

export function buildOperationEraStatusLabel(status: OperationEraStatus): string {
  return OPERATION_ERA_STATUS_LABELS[status];
}

export function buildOperationEraCadenceLabel(cadence: OperationEraCadence): string {
  return OPERATION_ERA_CADENCE_LABELS[cadence];
}

export function buildOperationEraCompactLine(candidate: OperationEraCandidate): string {
  const title = candidate.definition.title;

  if (candidate.definition.id === 'route_maintenance_era') {
    return `${title}, araç baskısını daha görünür hale getirir.`;
  }
  if (candidate.definition.id === 'container_network_era') {
    return `${title}, mahalle temizlik baskısını odak yapar.`;
  }
  if (candidate.definition.id === 'district_trust_era') {
    return `${title} sosyal nabız ve güven izlerini öne çıkarır.`;
  }
  if (candidate.definition.id === 'crisis_recovery_era') {
    return `${title}, toparlanma odağını netleştirir; kariyer devam eder.`;
  }
  if (candidate.definition.id === 'city_growth_preview_era') {
    return `${title}, uzun vadeli şehir gelişimi hazırlığını gösterir.`;
  }
  if (candidate.definition.id === 'social_pulse_era') {
    return `${title}, sosyal sinyalleri operasyon gündemine taşır.`;
  }

  return `${title}: ${candidate.definition.shortLabel} odağı sırada.`;
}

export function buildOperationEraSummaryLine(candidate: OperationEraCandidate): string {
  const statusLabel = buildOperationEraStatusLabel(candidate.status).toLocaleLowerCase('tr-TR');
  return `${candidate.definition.title} ${statusLabel}; ${candidate.definition.description}`;
}

export function buildOperationEraUnlockLine(candidate: OperationEraCandidate): string {
  if (candidate.definition.requiredPermissionId === 'operation_era_preview') {
    return 'Strateji Koordinatörü yetkisiyle operasyon dönemleri görünür olur.';
  }
  if (candidate.definition.isFutureOnly) {
    return 'Şehir gelişimi hazırlığı ileride açılacak dönemsel odağı gösterir.';
  }
  return 'Operasyon dönemi kariyerini kapatmaz; sadece dönemsel odağı belirler.';
}

export function buildOperationEraRecommendationLine(
  candidate: OperationEraCandidate,
): string | undefined {
  if (candidate.status !== 'recommended' && candidate.relevanceScore < 55) return undefined;

  if (candidate.definition.id === 'route_maintenance_era') {
    return 'Sanayi rota baskısı nedeniyle Rota ve Bakım Dönemi öneriliyor.';
  }
  if (candidate.definition.id === 'container_network_era') {
    return 'Konteyner ağı sinyalleri bu dönemi öne çıkarıyor.';
  }
  if (candidate.definition.id === 'district_trust_era') {
    return 'Mahalle güveni trendleri bu dönemi öneriyor.';
  }
  if (candidate.definition.id === 'crisis_recovery_era') {
    return 'Kriz eşiği sinyalleri toparlanma dönemini öne çıkarıyor.';
  }
  return `${candidate.definition.shortLabel} dönemi güncel operasyon sinyalleriyle uyumlu.`;
}

export function buildOperationEraReviewLine(candidate: OperationEraCandidate): string {
  if (candidate.status === 'completed_review') {
    return 'Bu dönem tamamlandığında oyun bitmez; sadece performans özeti üretilir.';
  }
  return 'Dönemsel değerlendirme kariyer içi kontrol noktasıdır.';
}

export function buildOperationEraFocusChips(candidate: OperationEraCandidate): OperationEraChipModel[] {
  return candidate.focusDomains.slice(0, OPERATION_ERA_MAX_VISIBLE_CHIPS).map((domain) => ({
    id: `focus_${domain}`,
    label: OPERATION_ERA_FOCUS_DOMAIN_LABELS[domain],
    tone: candidate.tone,
    iconKey: 'ellipse-outline',
  }));
}

export function buildOperationEraHookChips(candidate: OperationEraCandidate): OperationEraChipModel[] {
  return candidate.contentHooks.slice(0, OPERATION_ERA_MAX_VISIBLE_CHIPS).map((hook) => ({
    id: `hook_${hook}`,
    label: OPERATION_ERA_CONTENT_HOOK_LABELS[hook],
    tone: candidate.tone === 'crisis_watch' ? 'watch' : candidate.tone,
    iconKey: 'link-outline',
  }));
}

export function buildOperationEraEmptyState(
  surface: OperationEraPresentationOptions['surface'] = 'hub',
): string {
  switch (surface) {
    case 'map':
      return 'Operasyon dönemleri harita katmanı netleşince görünür olur.';
    case 'report':
      return 'Bu dönemde belirgin operation era odağı oluşmadı.';
    case 'profile':
      return 'Operasyon dönemleri kariyer ilerledikçe yetki önizlemesinde görünür.';
    case 'dev':
      return 'Operation era foundation — henüz yüzeye bağlanmadı.';
    case 'hub':
    default:
      return 'Operasyon dönemleri, ana operasyon ilerledikçe görünür olur.';
  }
}

export function buildOperationEraNonTerminalDisclaimer(): string {
  return 'Operasyon dönemi kariyerini kapatmaz; sonraki açılımlara yön verir.';
}

export function buildOperationEraPresentationModel(
  candidate: OperationEraCandidate,
  options: OperationEraPresentationOptions = {},
): OperationEraPresentationModel {
  const compactLine = buildOperationEraCompactLine(candidate);
  const summaryLine = candidate.summaryLine || buildOperationEraSummaryLine(candidate);

  let ctaHint: string | undefined;
  if (options.includeCtaHint) {
    if (candidate.status === 'recommended') {
      ctaHint = 'Operasyon merkezinde dönem odağını inceleyin.';
    } else if (candidate.status === 'preview') {
      ctaHint = 'Operasyon dönemi sırada; sinyaller netleşince açılır.';
    }
  }

  return {
    id: candidate.definition.id,
    title: candidate.definition.title,
    subtitle: candidate.definition.shortLabel,
    statusLabel: buildOperationEraStatusLabel(candidate.status),
    cadenceLabel: buildOperationEraCadenceLabel(candidate.definition.cadence),
    tone: candidate.tone,
    compactLine: options.compact ? compactLine : summaryLine,
    summaryLine,
    focusChips: buildOperationEraFocusChips(candidate),
    hookChips: buildOperationEraHookChips(candidate),
    unlockLine: candidate.unlockLine ?? buildOperationEraUnlockLine(candidate),
    recommendationLine: candidate.recommendationLine ?? buildOperationEraRecommendationLine(candidate),
    reviewLine: candidate.reviewLine ?? buildOperationEraReviewLine(candidate),
    ctaHint,
    emptyStateLine: candidate.isVisibleToPlayer
      ? undefined
      : buildOperationEraEmptyState(options.surface),
  };
}

export function operationEraCopyContainsForbiddenTerms(copy: string): boolean {
  const normalized = copy.toLocaleLowerCase('tr-TR');
  return OPERATION_ERA_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function collectOperationEraPlayerFacingCopy(
  candidate: OperationEraCandidate,
): string[] {
  const presentation = buildOperationEraPresentationModel(candidate, {
    compact: true,
    surface: 'hub',
    includeCtaHint: true,
  });

  return [
    presentation.compactLine,
    presentation.summaryLine,
    presentation.unlockLine ?? '',
    presentation.recommendationLine ?? '',
    presentation.reviewLine ?? '',
    presentation.emptyStateLine ?? '',
    buildOperationEraNonTerminalDisclaimer(),
    candidate.definition.title,
    candidate.definition.description,
    candidate.definition.flavorLine,
    ...presentation.focusChips.map((chip) => chip.label),
    ...presentation.hookChips.map((chip) => chip.label),
    ...candidate.eligibilityReasons,
  ].filter(Boolean);
}
