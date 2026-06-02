import { getEventFamilyAvailabilitySummary } from './eventFamilySchema';
import type {
  EventFamilyDefinition,
  EventFamilyDomain,
  EventFamilyEchoSurface,
  EventFamilyOutcomeTone,
  EventFamilyPreviewModel,
  EventFamilyQualityResult,
  EventFamilyVariantDefinition,
  EventFamilyVariantKind,
} from './eventFamilyTypes';

export function buildEventFamilyDomainLabel(domain: EventFamilyDomain): string {
  const labels: Record<EventFamilyDomain, string> = {
    container: 'Konteyner',
    vehicle_route: 'Araç / Rota',
    personnel: 'Personel',
    social: 'Sosyal Nabız',
    crisis_adjacent: 'Kriz Eşiği',
    district_balance: 'Mahalle Dengesi',
    resource_recovery: 'Kaynak Toparlanması',
    authority_milestone: 'Yetki Milestone',
    operation_era: 'Operasyon Dönemi',
    generic_operation: 'Operasyon',
  };
  return labels[domain];
}

export function buildVariantKindLabel(kind: EventFamilyVariantKind): string {
  const labels: Record<EventFamilyVariantKind, string> = {
    normal: 'Standart',
    improved: 'İyileşmiş',
    worsened: 'Zorlaşmış',
    carry_over: 'Ertesi Güne Taşan',
    crisis_adjacent: 'Kriz Eşiği',
    player_adaptive: 'Oyuncu Tarzına Göre',
    resource_fatigue: 'Kaynak Yorgunluğu',
    district_trust: 'Mahalle Güveni',
    reward: 'Pozitif Sonuç',
    comeback: 'Toparlanma Fırsatı',
    recovery: 'İyileştirme',
    operation_era: 'Operasyon Dönemi',
  };
  return labels[kind];
}

export function buildEchoSurfaceLabel(surface: EventFamilyEchoSurface): string {
  const labels: Record<EventFamilyEchoSurface, string> = {
    advisor: 'Ece',
    report: 'Rapor',
    social: 'Sosyal Nabız',
    map: 'Harita',
    tomorrow_preview: 'Yarın Önizleme',
    operation_result: 'Operasyon Sonucu',
    hub: 'Hub',
    district_memory: 'Mahalle Hafızası',
  };
  return labels[surface];
}

export function buildOutcomeToneLabel(tone: EventFamilyOutcomeTone): string {
  const labels: Record<EventFamilyOutcomeTone, string> = {
    neutral: 'Nötr',
    positive: 'Pozitif',
    strained: 'Zorlanmış',
    recovering: 'Toparlanıyor',
    warning: 'Uyarı',
    crisis_watch: 'Kriz Eşiği',
    resolved: 'Çözüldü',
  };
  return labels[tone];
}

export function buildFamilyUnlockLine(family: EventFamilyDefinition): string {
  if (family.requiredRankKey) {
    return `${family.requiredRankKey} aşamasında ${buildEventFamilyDomainLabel(family.domain)} içeriklerinde kullanılır.`;
  }
  if (family.unlockRankPermissionId) {
    return `${family.unlockRankPermissionId} preview izniyle içerik üretim hattına bağlanır.`;
  }
  return getEventFamilyAvailabilitySummary(family);
}

export function buildFamilyQualityBadge(result: EventFamilyQualityResult): string {
  if (result.status === 'PASS') return `PASS ${result.score}/100`;
  if (result.status === 'WARN') return `WARN ${result.score}/100`;
  return `FAIL ${result.score}/100`;
}

export function buildEventFamilyPreviewModel(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[],
): EventFamilyPreviewModel {
  const familyVariants = variants.filter((variant) => variant.familyId === family.id);
  return {
    id: family.id,
    title: family.title,
    domainLabel: buildEventFamilyDomainLabel(family.domain),
    districtLabel:
      family.primaryDistrictIds.length > 0 ? family.primaryDistrictIds.join(', ') : 'Şehir geneli',
    variantSummary: familyVariants.map((variant) => buildVariantKindLabel(variant.kind)).join(' / '),
    unlockLine: buildFamilyUnlockLine(family),
    echoSurfaceLabels: family.echoSurfaces.map(buildEchoSurfaceLabel),
    statusLine: family.isPreviewOnly ? 'Foundation preview' : 'Runtime içerik',
  };
}
