import {
  EVENT_VARIANT_FORBIDDEN_COPY_TERMS,
  EVENT_VARIANT_GENERIC_SPAM_TERMS,
  EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH,
  EVENT_VARIANT_PANIC_TERMS,
} from './eventVariantConstants';
import type {
  CreviaEventVariantCopySet,
  CreviaEventVariantKind,
  CreviaEventVariantSurface,
} from './eventVariantTypes';

const SURFACE_COPY: Record<CreviaEventVariantKind, Partial<Record<CreviaEventVariantSurface, string>>> = {
  normal: {
    event_card: 'Günlük operasyon akışı devam ediyor.',
    inspect: 'Saha koşulları standart operasyon bandında.',
    result: 'Karar günlük operasyon ritmine eklendi.',
    report: 'Operasyon günü planlandığı gibi ilerledi.',
  },
  improved: {
    event_card: 'Önceki adımlar bu olayı biraz daha yönetilebilir kılıyor.',
    inspect: 'Koşullar son günlerden daha dengeli görünüyor.',
    result: 'İyileşen koşullar sonucu destekledi.',
    advisor: 'Son kararlar operasyonu hafifletiyor.',
  },
  worsened: {
    event_card: 'Baskı arttı; karar daha dikkatli yönetilmeli.',
    inspect: 'Saha koşulları zorlaştı ama kontrol hâlâ mümkün.',
    result: 'Zorlaşan koşullar sonucu daha görünür kıldı.',
    advisor: 'Baskı yükseldi; öncelikleri net tutmak iyi olur.',
  },
  carry_over: {
    event_card: 'Dünkü tercih bugünkü saha baskısını şekillendirdi.',
    inspect: 'Önceki günün etkisi hâlâ sahadaki kararları etkiliyor.',
    result: 'Devam eden etki sonucu bugüne taşıdı.',
    tomorrow_preview: 'Bugünkü tercih yarınki operasyon tonunu belirleyecek.',
  },
  reward: {
    event_card: 'Önceki kararın bu mahallede görünür rahatlama yarattı.',
    inspect: 'Mahallede olumlu geri bildirim sinyalleri var.',
    result: 'Olumlu etki operasyon sonucuna yansıdı.',
    social: 'Mahallede son operasyon olumlu konuşuluyor.',
    advisor: 'Önceki adımlar güveni destekledi.',
  },
  comeback: {
    event_card: 'Bu olay toparlanma fırsatı sunuyor; kaynak baskısı yönetilmeli.',
    inspect: 'Toparlanma penceresi açık, ama maliyet hâlâ görünür.',
    result: 'Toparlanma yönünde adım atıldı.',
    advisor: 'Fırsat var; kaynakları dengeli kullanmak önemli.',
  },
  resource_fatigue: {
    event_card: 'Kaynak yorgunluğu bu kararda daha görünür olacak.',
    inspect: 'Ekip ve araç yükü karar maliyetini artırıyor.',
    result: 'Kaynak yorgunluğu sonucu daha belirgin kıldı.',
    report: 'Kaynak kullanımı bugün daha dikkat istiyor.',
  },
  district_trust: {
    event_card: 'Mahalle güveni bu operasyonun tonunu değiştiriyor.',
    inspect: 'Güven seviyesi sahadaki iletişim dilini etkiliyor.',
    result: 'Mahalle güveni sonucun algısını şekillendirdi.',
    social: 'Mahalle operasyonun tonunu tartışıyor.',
  },
  crisis_adjacent: {
    event_card: 'Risk büyümeden kontrol penceresi açıldı.',
    inspect: 'Erken müdahale penceresi açık; tempo korunmalı.',
    result: 'Kontrollü müdahale riskin büyümesini sınırladı.',
    advisor: 'Erken adım atmak riski yönetilebilir tutar.',
    map: 'Haritada dikkat alanı netleşti.',
  },
  operation_era: {
    event_card: 'Bu operasyon mevcut dönem temasına bağlanıyor.',
    inspect: 'Dönem odağı bu kararın çerçevesini belirliyor.',
    report: 'Operasyon dönem temasıyla hizalandı.',
    advisor: 'Mevcut dönem odağı bu adımı çerçeveliyor.',
    tomorrow_preview: 'Dönem teması yarınki öncelikleri de etkileyebilir.',
  },
};

function normalizeCopy(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function eventVariantCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return EVENT_VARIANT_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function eventVariantCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return EVENT_VARIANT_PANIC_TERMS.some((term) => normalized.includes(term));
}

export function eventVariantCopyIsGenericSpam(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return EVENT_VARIANT_GENERIC_SPAM_TERMS.some((term) => normalized.includes(term));
}

export function clampEventVariantCopy(text: string, maxLength = EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH): string {
  const normalized = normalizeCopy(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildEventVariantSurfaceCopy(
  kind: CreviaEventVariantKind,
  surface: CreviaEventVariantSurface,
  maxLength = EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH,
): string {
  const template =
    SURFACE_COPY[kind][surface] ??
    SURFACE_COPY[kind].event_card ??
    SURFACE_COPY.normal.event_card ??
    'Operasyon akışı devam ediyor.';
  const clamped = clampEventVariantCopy(template, maxLength);
  if (eventVariantCopyContainsForbiddenTerms(clamped) || eventVariantCopyContainsPanicTerms(clamped)) {
    return clampEventVariantCopy(SURFACE_COPY.normal.event_card ?? 'Operasyon akışı devam ediyor.', maxLength);
  }
  if (eventVariantCopyIsGenericSpam(clamped)) {
    return clampEventVariantCopy(SURFACE_COPY[kind].event_card ?? SURFACE_COPY.normal.event_card!, maxLength);
  }
  return clamped;
}

export function buildEventVariantCopySet(kind: CreviaEventVariantKind): CreviaEventVariantCopySet {
  const lines: Partial<Record<CreviaEventVariantSurface, string>> = {};
  for (const surface of Object.keys(SURFACE_COPY[kind]) as CreviaEventVariantSurface[]) {
    lines[surface] = buildEventVariantSurfaceCopy(kind, surface);
  }
  if (!lines.event_card) {
    lines.event_card = buildEventVariantSurfaceCopy(kind, 'event_card');
  }
  return { kind, lines };
}

export function validateEventVariantSurfaceCopy(text: string, maxLength = EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH): boolean {
  if (!text.trim()) return false;
  if (text.length > maxLength) return false;
  if (eventVariantCopyContainsForbiddenTerms(text)) return false;
  if (eventVariantCopyContainsPanicTerms(text)) return false;
  if (eventVariantCopyIsGenericSpam(text)) return false;
  return true;
}
