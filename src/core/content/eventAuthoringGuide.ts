import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';

import {
  EVENT_AUTHORING_FORBIDDEN_WORDS,
  EVENT_PACK_IDS,
} from './eventAuthoringConstants';
import { EVENT_PACK_PLAN } from './eventPackPlan';
import type {
  EventAuthoringProfile,
  EventAuthoringStandardField,
  EventQualityChecklistItem,
  EventTextStyleGuide,
} from './eventAuthoringTypes';

/** Her event taslağında doldurulması gereken 13 alan. */
export const EVENT_AUTHORING_STANDARD_FIELDS: EventAuthoringStandardField[] = [
  {
    order: 1,
    key: 'player_problem',
    label: 'Oyuncu problemi',
    description: 'Event’in oyuncuya verdiği net saha problemi (1–2 cümle).',
  },
  {
    order: 2,
    key: 'district',
    label: 'Mahalle',
    description: 'Hangi mahallede geçtiği (MapDistrictId).',
  },
  {
    order: 3,
    key: 'district_fit',
    label: 'Mahalle uyumu',
    description: 'Mahalle kimliğiyle neden uyumlu olduğu (risk/strength referansı).',
  },
  {
    order: 4,
    key: 'primary_system',
    label: 'Ana sistem odağı',
    description: 'Birincil EventSystemFocus.',
  },
  {
    order: 5,
    key: 'secondary_systems',
    label: 'İkincil sistemler',
    description: 'En az bir ikincil etki alanı.',
  },
  {
    order: 6,
    key: 'decision_options',
    label: 'Karar seçenekleri',
    description: 'En az 3 karar; her biri farklı strateji.',
  },
  {
    order: 7,
    key: 'decision_impacts',
    label: 'Karar etkileri',
    description: 'Halk / ekip / kaynak etkisi; net trade-off.',
  },
  {
    order: 8,
    key: 'authority_preview',
    label: 'Yetki preview',
    description: 'AuthorityPermissionId ile uyumlu ipuçları.',
  },
  {
    order: 9,
    key: 'badge_progress',
    label: 'Rozet progress',
    description: 'Yanlış tetiklenmeyecek BadgeId ipuçları.',
  },
  {
    order: 10,
    key: 'result_copy',
    label: 'Sonuç ekranı',
    description: 'EventResultHero / saha etkisi için kısa copy notları.',
  },
  {
    order: 11,
    key: 'report_copy',
    label: 'Gün sonu rapor',
    description: 'ReportAuthoritySummary / ReportBadgeSummary için 1 cümle not.',
  },
  {
    order: 12,
    key: 'post_pilot_fit',
    label: 'Post-pilot uyumu',
    description: 'post_pilot_light fazında kullanılabilir mi, cap notu.',
  },
  {
    order: 13,
    key: 'replay_fatigue',
    label: 'Tekrar riski',
    description: 'Tekrarlı oynanışta sıkıcı veya aynı hissi verir mi.',
  },
];

export const EVENT_QUALITY_CHECKLIST: EventQualityChecklistItem[] = [
  { id: 'title_clear', question: 'Event başlığı kısa ve anlaşılır mı?' },
  { id: 'district_fit', question: 'Mahalle kimliğiyle uyumlu mu?' },
  { id: 'tradeoff', question: 'Karar seçenekleri gerçekten trade-off içeriyor mu?' },
  {
    id: 'advantage_cost',
    question: 'En az bir karar net avantaj + net bedel taşıyor mu?',
  },
  {
    id: 'strategy_not_moral',
    question: 'Her karar “iyi/kötü” değil, farklı strateji mi?',
  },
  {
    id: 'result_copy',
    question: 'Result screen için kısa saha etkisi üretilebilir mi?',
  },
  {
    id: 'report_copy',
    question: 'Report için 1 cümlelik sonuç üretilebilir mi?',
  },
  { id: 'authority_preview', question: 'Authority preview mantıklı mı?' },
  { id: 'badge_progress', question: 'Badge progress yanlış tetiklenir mi?' },
  { id: 'forbidden_words', question: 'Yasaklı kelime var mı?' },
  { id: 'mobile_length', question: 'Mobilde uzun metin riski var mı?' },
  { id: 'day1_complexity', question: 'Day 1 tutorial için fazla karmaşık mı?' },
  { id: 'post_pilot_weight', question: 'Post-pilot için fazla ağır mı?' },
];

export const EVENT_TEXT_STYLE_GUIDE: EventTextStyleGuide = {
  recommendedTone: [
    'belediye operasyon dili',
    'kısa, net, sahaya bağlı',
    'mahalle karakteri olan',
    'dramatik ama abartısız',
    'karar bedeli görünen',
  ],
  avoidedTone: [
    'teknik sistem dili',
    'uzun paragraf',
    '“oyuncu şunu yapmalı” gibi direktif',
    'erişim / ödeme / yetki duvarı dili',
    'aşırı resmi kamu metni',
    'aşırı çocukça oyun dili',
  ],
};

/**
 * Authoring rehberi örnekleri — event generation’a bağlanmaz.
 */
export const EVENT_AUTHORING_EXAMPLE_PROFILES: EventAuthoringProfile[] = [
  {
    id: 'example_cumhuriyet_social_complaint',
    title: 'Cumhuriyet: Gece Gürültü Şikayeti Dalgası',
    districtId: 'cumhuriyet',
    packId: 'district_cumhuriyet',
    phase: 'pilot',
    dayRange: { min: 2, max: 5 },
    primarySystem: 'social',
    secondarySystems: ['operations', 'personnel'],
    severity: 'medium',
    decisionIntent: ['inspect', 'communicate', 'dispatch', 'stabilize_social'],
    districtFitReason:
      'Cumhuriyet’te sosyal nabız hassas; küçük aksaklıklar hızlı şikayete döner.',
    authorityPreviewHints: ['field_priority_note', 'basic_operations'],
    badgeProgressHints: ['public_listener', 'steady_operator'],
    expectedResultTone: 'balanced',
    resultCopyNotes: [
      'Saha notu: gece devriyesi sıklaştı, şikayet hattı sakinleşti.',
      'Halk algısı: komşular çözüm hızını fark etti.',
    ],
    reportCopyNotes: [
      'Cumhuriyet’te gece şikayetleri kontrol altına alındı; güven toparlanıyor.',
    ],
  },
  {
    id: 'example_sanayi_route_vehicle',
    title: 'Sanayi: Sabah Vardiyası Rota Sıkışması',
    districtId: 'sanayi',
    packId: 'district_sanayi',
    phase: 'pilot',
    dayRange: { min: 3, max: 6 },
    primarySystem: 'route',
    secondarySystems: ['vehicle', 'personnel', 'container'],
    severity: 'high',
    decisionIntent: [
      'inspect',
      'plan',
      'optimize_route',
      'allocate_resource',
      'dispatch',
    ],
    districtFitReason:
      'Sanayi’de rota ve ekip yükü baskın; gecikmeler zincirleme etki yapar.',
    authorityPreviewHints: ['operations_responsible_scope', 'daily_preparation_authority'],
    badgeProgressHints: ['route_mind', 'container_watch', 'team_caretaker'],
    expectedResultTone: 'risky',
    resultCopyNotes: [
      'Rota yeniden dengelendi; iki hat gecikmesi kısaldı.',
      'Araç yorgunluğu artmış olabilir — sonraki gün izlenmeli.',
    ],
    reportCopyNotes: [
      'Sanayi hattında rota müdahalesi verimi korudu; personel yükü izleniyor.',
    ],
  },
  {
    id: 'example_istasyon_post_pilot_light',
    title: 'İstasyon: Sabah Yoğunluğu Koordinasyonu',
    districtId: 'istasyon',
    packId: 'post_pilot_light',
    phase: 'post_pilot_light',
    dayRange: { min: 8, max: 12 },
    primarySystem: 'post_pilot',
    secondarySystems: ['route', 'operations', 'district_identity'],
    severity: 'medium',
    decisionIntent: ['inspect', 'plan', 'dispatch', 'field', 'reduce_risk'],
    districtFitReason:
      'İstasyon post-pilot geçiş bölgesi; yoğunluk ve saha koordinasyonu öne çıkar.',
    authorityPreviewHints: ['field_priority_note', 'district_expansion_preview'],
    badgeProgressHints: ['steady_operator', 'crisis_cooler'],
    expectedResultTone: 'positive',
    resultCopyNotes: [
      'Geçiş noktasında bekleme süreleri kısaldı.',
      'Hafif operasyon modunda tek odaklı sonuç — abartılı kriz dili yok.',
    ],
    reportCopyNotes: [
      'İstasyon çevresinde hafif operasyon gündemiyle yoğunluk dengelendi.',
    ],
  },
];

export function assertNoEventAuthoringForbiddenWords(text: string): number {
  const lower = text.toLowerCase();
  return EVENT_AUTHORING_FORBIDDEN_WORDS.filter((word) => lower.includes(word)).length;
}

export function collectEventAuthoringStrings(): string[] {
  const strings: string[] = [
    ...EVENT_AUTHORING_STANDARD_FIELDS.flatMap((f) => [f.label, f.description]),
    ...EVENT_QUALITY_CHECKLIST.map((c) => c.question),
    ...EVENT_TEXT_STYLE_GUIDE.recommendedTone,
    ...EVENT_TEXT_STYLE_GUIDE.avoidedTone,
    ...EVENT_PACK_IDS,
  ];

  for (const pack of Object.values(EVENT_PACK_PLAN)) {
    strings.push(
      pack.title,
      pack.goal,
      pack.theme,
      ...pack.risks,
      pack.dailyEventCapNote ?? '',
      pack.expansionPlanNote ?? '',
    );
  }

  for (const profile of EVENT_AUTHORING_EXAMPLE_PROFILES) {
    strings.push(
      profile.title,
      profile.districtFitReason,
      ...profile.resultCopyNotes,
      ...profile.reportCopyNotes,
    );
  }

  return strings.filter((s) => s.length > 0);
}

export function isExampleProfileDistrictConsistent(profile: EventAuthoringProfile): boolean {
  const identity = DISTRICT_IDENTITIES[profile.districtId];
  if (!identity) return false;
  const blob = `${profile.districtFitReason} ${profile.title}`.toLocaleLowerCase('tr-TR');
  const nameHit = blob.includes(identity.shortLabel.toLocaleLowerCase('tr-TR'));
  const themeHit =
    identity.pressurePoints.some((p) =>
      blob.includes(p.split(' ')[0]?.toLocaleLowerCase('tr-TR') ?? ''),
    ) || identity.strengths.some((s) => blob.length > 20);
  return nameHit || themeHit;
}

export function validateEventAuthoringProfileShape(
  profile: EventAuthoringProfile,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!profile.id.trim()) errors.push('id boş');
  if (!profile.title.trim()) errors.push('title boş');
  if (profile.decisionIntent.length < 3) errors.push('decisionIntent < 3');
  if (profile.resultCopyNotes.length < 1) errors.push('resultCopyNotes boş');
  if (profile.reportCopyNotes.length < 1) errors.push('reportCopyNotes boş');
  if (profile.secondarySystems.length < 1) errors.push('secondarySystems boş');
  const textBlob = [
    profile.title,
    profile.districtFitReason,
    ...profile.resultCopyNotes,
    ...profile.reportCopyNotes,
  ].join(' ');
  if (assertNoEventAuthoringForbiddenWords(textBlob) > 0) {
    errors.push('yasaklı kelime');
  }
  return { ok: errors.length === 0, errors };
}
