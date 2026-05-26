import type { PilotDayPlan } from '@/core/models/PilotDayPlan';

export const PILOT_SCENARIO_DAYS = 7 as const;

export const pilotDayPlan: PilotDayPlan[] = [
  {
    day: 1,
    theme: 'learning',
    title: 'İlk Saha Günü',
    shortTitle: 'Öğrenme',
    goal: 'Bölgeyi tanı, temel operasyon ritmini kur ve ilk kararlarını ver.',
    description:
      'Pilot Bölge Hizmet Koordinatörü olarak ilk saha turun. Öncelik görünür hizmet ve güven inşası; büyük risk almadan öğren.',
    primaryEventTypes: ['waste', 'sidewalk', 'market'],
    unlockHint: 'Mahalle haritası ve günlük görev listesi açılır.',
    visualKey: 'day_learning',
  },
  {
    day: 2,
    theme: 'complaint',
    title: 'İlk Şikayet',
    shortTitle: 'Şikayet',
    goal: 'İlk vatandaş şikayetini yönet; hız ve iletişim dengesini kur.',
    description:
      'Şikayet hattı ısınır. Yanıt süresi ve çözüm kalitesi halk memnuniyetini doğrudan etkiler.',
    primaryEventTypes: ['citizen_complaint', 'noise', 'waste'],
    unlockHint: 'Şikayet önceliklendirme notları görünür olur.',
    visualKey: 'day_complaint',
  },
  {
    day: 3,
    theme: 'resource',
    title: 'Kaynak Baskısı',
    shortTitle: 'Kaynak',
    goal: 'Personel ve araç kısıtında öncelikleri netleştir.',
    description:
      'Bütçe ve vardiya baskısı artar. Hangi hattı güçlendireceğin yarının kapasitesini belirler.',
    primaryEventTypes: ['staff', 'vehicle', 'waste'],
    unlockHint: 'Kaynak özeti ve vardiya uyarıları aktifleşir.',
    visualKey: 'day_resource',
  },
  {
    day: 4,
    theme: 'social_pressure',
    title: 'Algı ve Sosyal Baskı',
    shortTitle: 'Sosyal baskı',
    goal: 'Muhtar, esnaf ve sosyal medya algısını yönet.',
    description:
      'Görünürlük baskısı yükselir. Küçük olaylar hızla büyüyebilir; iletişim tonu kritik.',
    primaryEventTypes: ['social_media', 'noise', 'citizen_complaint'],
    unlockHint: 'Algı nabzı ve sosyal uyarılar takip edilebilir.',
    visualKey: 'day_social_pressure',
  },
  {
    day: 5,
    theme: 'opportunity',
    title: 'Fırsat Günü',
    shortTitle: 'Fırsat',
    goal: 'Kısıtlı kaynakla kalıcı iyileştirme fırsatını değerlendir.',
    description:
      'Beklenmedik iyileştirme penceresi açılır. Kısa vadeli rahatlama mı, uzun vadeli kazanım mı?',
    primaryEventTypes: ['opportunity', 'market', 'permanent_solution'],
    unlockHint: 'Stratejik fırsat kartları havuza eklenir.',
    visualKey: 'day_opportunity',
  },
  {
    day: 6,
    theme: 'butterfly_effect',
    title: 'Kelebek Etkisi',
    shortTitle: 'Kelebek etkisi',
    goal: 'Önceki kararların zincir etkisini yönet.',
    description:
      'Erken hafta seçimlerin bugün ortaya çıkar. Gecikmiş sonuçlar ve beklenmedik bağlantılar gündeme gelir.',
    primaryEventTypes: ['butterfly', 'citizen_complaint', 'waste'],
    unlockHint: 'Önceki karar bağlantıları raporda işaretlenir.',
    visualKey: 'day_butterfly_effect',
  },
  {
    day: 7,
    theme: 'final_report',
    title: 'Pilot Bölge Raporu',
    shortTitle: 'Final raporu',
    goal: '7 günlük pilotu değerlendir; bölge raporunu tamamla.',
    description:
      'Pilot haftanın kapanışı. Metrikler, çözülen olaylar ve kalıcı izler özetlenir; sonraki faz için öneri üretilir.',
    primaryEventTypes: ['final', 'permanent_solution'],
    unlockHint: 'Pilot bölge değerlendirme raporu hazırlanır.',
    visualKey: 'day_final_report',
  },
];

export function getPilotDayPlan(day: number): PilotDayPlan | undefined {
  return pilotDayPlan.find((plan) => plan.day === day);
}

/** Gün planındaki primaryEventTypes için tip güvenli erişim (içerik string[] tutulur). */
export function getPrimaryEventTypesForDay(day: number) {
  return getPilotDayPlan(day)?.primaryEventTypes ?? [];
}
