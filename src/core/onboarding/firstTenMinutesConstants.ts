import type { FirstTenMinutesGuidanceModel, FirstTenMinutesStage } from './firstTenMinutesTypes';

export const FIRST_TEN_MINUTES_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export const FIRST_TEN_MINUTES_MAX_LINE_LENGTH = 120;

export const DAY1_GUIDANCE_COPY = {
  title: 'İlk operasyon günü',
  summary: 'Bugün temel akışı öğreniyorsun: planla, sahaya gönder, sonucu oku.',
  primaryInstruction: 'Önerilen planı onayla ve ilk operasyonu tamamla.',
  secondaryNote:
    'Detaylı kriz, sezon ve canlı karar sistemleri sonraki günlerde açılır.',
  guideCardLine: 'Önerilen planı onayla, ilk olayı çöz, raporu oku.',
} as const;

export const DAY2_GUIDANCE_COPY = {
  title: 'Operasyon akışı pekişiyor',
  summary: 'Bugün plan ve atama etkilerini biraz daha net göreceksin.',
  primaryInstruction: 'Günlük planı takip et, atama uyumunu izle.',
} as const;

export const DAY3_GUIDANCE_COPY = {
  title: 'Şehir sinyalleri genişliyor',
  summary: 'Canlı operasyon kararları ve daha fazla saha sinyali kademeli görünür.',
  primaryInstruction: "Sinyalleri ve Ece'nin uyarılarını birlikte değerlendir.",
} as const;

export const DAY1_ADVISOR_SHORT_COPY = {
  title: "Ece'nin kısa önerisi",
  body: 'Bugün sadece önerilen planı onayla ve ilk operasyonu tamamla.',
  cta: 'Kısa Öneri Al',
} as const;

export const DAY1_DAILY_PLAN_COPY = {
  title: 'Bugünün Önerilen Planı',
  confirmCta: 'Planı Onayla',
  editDisabledNote:
    'İlk gün düzenleme kapalı; önerilen planla temel akışı öğreniyorsun.',
} as const;

export const DAY1_ASSIGNMENT_COPY = {
  explanation: 'İlk gün önerilen ekip ve araçla saha akışını öğreniyorsun.',
  confirmCta: 'Önerilen Atamayı Onayla',
  dispatchCta: 'Sahaya Gönder',
} as const;

export const DAY1_EVENT_PLAN_COPY = {
  planSupport: 'Bugünkü plan bu kararı destekler.',
} as const;

export const DAY1_REPORT_EDUCATIONAL_LINES = [
  'Bugün temel akışı tamamladın: plan, atama ve saha sonucu.',
  'Sinyaller sonraki günlerde kararlarının etkisini daha net gösterecek.',
  'Yarın plan ve atama seçenekleri biraz daha açılır.',
] as const;

export const SURFACE_CTA_LABELS: Record<string, string> = {
  event_dispatch_confirm: 'Önerilen Atamayı Onayla',
  event_field_result: 'Sonucu Gör',
  report_return_hub: 'Operasyon Merkezine Dön',
  daily_plan_confirm: 'Planı Onayla',
};

export const GUIDANCE_BY_STAGE: Record<
  Exclude<FirstTenMinutesStage, 'normal'>,
  Omit<FirstTenMinutesGuidanceModel, 'stage' | 'surfaceRules' | 'shouldShowAdvancedSystems'>
> = {
  day1_entry: DAY1_GUIDANCE_COPY,
  day1_first_event: DAY1_GUIDANCE_COPY,
  day1_dispatch: DAY1_GUIDANCE_COPY,
  day1_result: DAY1_GUIDANCE_COPY,
  day1_report: DAY1_GUIDANCE_COPY,
  day2_reinforcement: DAY2_GUIDANCE_COPY,
  day3_unlock_hint: DAY3_GUIDANCE_COPY,
};
