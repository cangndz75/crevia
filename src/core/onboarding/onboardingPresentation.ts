import type { OnboardingHint } from './onboardingTypes';

export const ONBOARDING_MAX_HINT_TEXT_LENGTH = 160;

/** Mobil satır kırılımı için güvenli kısaltma */
export function mobileSafeLine(text: string, maxLen = 96): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }
  return `${slice.trim()}…`;
}

export const ONBOARDING_HINTS: readonly OnboardingHint[] = [
  {
    id: 'onb_hub_intro_d1',
    moment: 'hub_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Pilot göreve hoş geldin',
    text: 'Bu hafta bir pilot bölgeyi yöneteceksin. Önceliğin, olayları doğru sırayla çözmek ve gün sonunda dengeli rapor almak.',
    ctaText: 'İlk olayı incele',
    tone: 'info',
    targetKey: 'critical_event_card',
    priority: 10,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: '1/3 İlk Gün',
  },
  {
    id: 'onb_critical_event_d1',
    moment: 'critical_event_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Günün ana olayı',
    text: 'Günün ana olayı burada. Önce olayı incele, sonra kararını seç.',
    tone: 'info',
    targetKey: 'critical_event_card',
    priority: 20,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_event_detail_d1',
    moment: 'event_detail_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'event_detail',
    title: 'Olay detayı',
    text: 'Bu ekranda mahalle notunu, saha bilgisini ve karar seçeneklerini görürsün.',
    tone: 'neutral',
    priority: 30,
    dismissible: true,
    presentationMode: 'focus',
    stepPill: 'İpucu',
  },
  {
    id: 'onb_decision_card_d1',
    moment: 'decision_card_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'event_detail',
    title: 'Karar kartları',
    text: 'Karar kartlarında strateji, risk ve kısa tradeoff yazar. Tek doğru cevap yok; ilk görevine göre karar ver.',
    tone: 'info',
    targetKey: 'quick_decisions',
    priority: 40,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_decision_result_d1',
    moment: 'decision_result_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'decision_result',
    title: 'Karar sonucu',
    text: 'Sonuç ekranı kararının etkisini gösterir. Metrik değişimleri ve sistem etkileri gün sonu raporuna yansır.',
    tone: 'success',
    priority: 50,
    dismissible: true,
    presentationMode: 'coach',
  },
  {
    id: 'onb_live_flow_d1',
    moment: 'live_flow_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Bugünün Akışı',
    text: 'Kararlarından sonra gelişmeler burada kısa satırlar halinde görünür.',
    tone: 'info',
    priority: 60,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_daily_report_d1',
    moment: 'daily_report_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'daily_report',
    title: 'Gün sonu raporu',
    text: 'Rapor, günün kararlarını ve hedef sonuçlarını özetler. Yarın bazı kararların yankısı geri dönebilir.',
    tone: 'neutral',
    priority: 70,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: '3/3 İlk Gün',
  },
  {
    id: 'onb_day2_priority',
    moment: 'day2_priority_choice',
    dayMin: 2,
    dayMax: 2,
    screen: 'hub',
    title: 'Günlük öncelik',
    text: 'Artık güne bir öncelik seçerek başlıyorsun. Halkı rahatlatabilir, operasyonu toparlayabilir veya kaynakları koruyabilirsin.',
    tone: 'info',
    priority: 80,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: 'Yeni',
  },
  {
    id: 'onb_day2_goals',
    moment: 'day2_goals_intro',
    dayMin: 2,
    dayMax: 2,
    screen: 'hub',
    title: 'Bugünün hedefleri',
    text: 'Bugünün hedefleri seçtiğin önceliğe göre şekillenir. Gün içinde kararların bu hedefleri ilerletir veya riske atar.',
    tone: 'info',
    priority: 90,
    dismissible: true,
    presentationMode: 'focus',
  },
] as const;

export const ONBOARDING_HINT_BY_ID: Record<string, OnboardingHint> =
  Object.fromEntries(ONBOARDING_HINTS.map((h) => [h.id, h]));

export const DAY1_PRIORITY_FALLBACK =
  'İlk gün önceliğin: temel müdahaleyi öğrenmek.';

export const DAY1_FLOW_PLACEHOLDER = 'Bugün ilk olayını bekliyorsun.';

export const DAY1_GOALS_PLACEHOLDER =
  'İlk hedefler olaydan sonra netleşecek.';

export const DAY2_PRIORITY_PROMPT =
  'Güne başlamadan önce bir öncelik seç.';

export const DAY1_STATUS_MUTED_NOTE = 'Yakında önem kazanacak';

/** Eski tutorial adımı ile aynı anda gösterilmemesi gereken onboarding momentleri */
export const LEGACY_TUTORIAL_STEP_BY_MOMENT: Partial<
  Record<OnboardingHint['moment'], string>
> = {
  hub_intro: 'day1_intro',
  critical_event_intro: 'hub_critical_event',
  event_detail_intro: 'event_timeline',
  decision_card_intro: 'event_decisions',
  decision_result_intro: 'decision_result',
  daily_report_intro: 'daily_report',
};
