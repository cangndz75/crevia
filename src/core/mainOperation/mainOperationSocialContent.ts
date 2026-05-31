import type { SocialMention, SocialTopic } from '@/core/social/socialTypes';
import type { SocialNeighborhoodId } from '@/core/social/socialConstants';

export type MainOperationSocialMentionTemplate = {
  id: string;
  neighborhoodId: SocialNeighborhoodId;
  type: 'complaint' | 'gratitude' | 'crisis' | 'neutral' | 'question' | 'rumor';
  authorName: string;
  message: string;
  tone: 'neutral' | 'positive' | 'crisis' | 'complaint';
};

export const MAIN_OPERATION_SOCIAL_MENTIONS: MainOperationSocialMentionTemplate[] = [
  { id: 'mo-sm-merkez-1', neighborhoodId: 'merkez', type: 'complaint', authorName: 'Basın Temsilcisi', message: 'Merkez meydanında görünür hizmet gecikmesi konuşuluyor.', tone: 'complaint' },
  { id: 'mo-sm-merkez-2', neighborhoodId: 'merkez', type: 'neutral', authorName: 'Saha Ekibi', message: 'Yoğun saatte ek tur planlandı; merkez hattı toparlanıyor.', tone: 'positive' },
  { id: 'mo-sm-cumhuriyet-1', neighborhoodId: 'cumhuriyet', type: 'complaint', authorName: 'Mahalle Sakini', message: 'Gece toplama gürültüsü tekrar gündeme geldi.', tone: 'complaint' },
  { id: 'mo-sm-cumhuriyet-2', neighborhoodId: 'cumhuriyet', type: 'complaint', authorName: 'Temsilci', message: 'Aynı sokakta konteyner konumu yine tartışılıyor.', tone: 'complaint' },
  { id: 'mo-sm-sanayi-1', neighborhoodId: 'sanayi', type: 'complaint', authorName: 'İşletme Odası', message: 'Ağır araç hattında gecikme bildirildi.', tone: 'complaint' },
  { id: 'mo-sm-sanayi-2', neighborhoodId: 'sanayi', type: 'neutral', authorName: 'Operasyon', message: 'Yüksek hacim hattına ek kapasite yönlendirildi.', tone: 'neutral' },
  { id: 'mo-sm-istasyon-1', neighborhoodId: 'istasyon', type: 'complaint', authorName: 'Yolcu Platformu', message: 'Sabah aktarma hattında rota çakışması konuşuluyor.', tone: 'complaint' },
  { id: 'mo-sm-istasyon-2', neighborhoodId: 'istasyon', type: 'neutral', authorName: 'Koordinasyon', message: 'İstasyon çevresinde gecikme kısaldı.', tone: 'positive' },
  { id: 'mo-sm-yesilvadi-1', neighborhoodId: 'yesilvadi', type: 'complaint', authorName: 'Park Komitesi', message: 'Park hattında koku şikayeti artıyor.', tone: 'complaint' },
  { id: 'mo-sm-yesilvadi-2', neighborhoodId: 'yesilvadi', type: 'gratitude', authorName: 'Sakin', message: 'Sessiz operasyon düzeni olumlu karşılandı.', tone: 'positive' },
  { id: 'mo-sm-crisis-1', neighborhoodId: 'merkez', type: 'crisis', authorName: 'Şehir Nabzı', message: 'Birden fazla mahallede gecikme aynı güne denk geldi.', tone: 'crisis' },
  { id: 'mo-sm-crisis-2', neighborhoodId: 'sanayi', type: 'crisis', authorName: 'Operasyon İzleme', message: 'Konteyner ve rota sorunu aynı hatta birleşti.', tone: 'crisis' },
  { id: 'mo-sm-pos-1', neighborhoodId: 'cumhuriyet', type: 'gratitude', authorName: 'Mahalle Temsilcisi', message: 'Bugünkü saha ekibi hızlı toparladı.', tone: 'positive' },
  { id: 'mo-sm-pos-2', neighborhoodId: 'istasyon', type: 'gratitude', authorName: 'Vatandaş', message: 'Bilgilendirme mesajı sakinlik sağladı.', tone: 'positive' },
  { id: 'mo-sm-pos-3', neighborhoodId: 'yesilvadi', type: 'gratitude', authorName: 'Çevre Gönüllüsü', message: 'Geri dönüşüm hattı düzenli çalıştı.', tone: 'positive' },
  { id: 'mo-sm-pos-4', neighborhoodId: 'merkez', type: 'gratitude', authorName: 'Esnaf', message: 'Görünür temizlik turu takdir topladı.', tone: 'positive' },
  { id: 'mo-sm-pos-5', neighborhoodId: 'sanayi', type: 'gratitude', authorName: 'Fabrika Sorumlusu', message: 'Kapasite planı gecikmeyi önledi.', tone: 'positive' },
  { id: 'mo-sm-crisis-3', neighborhoodId: 'istasyon', type: 'crisis', authorName: 'Rota İzleme', message: 'İstasyon gecikme zinciri konuşuluyor.', tone: 'crisis' },
  { id: 'mo-sm-crisis-4', neighborhoodId: 'yesilvadi', type: 'crisis', authorName: 'Çevre Hattı', message: 'Hassasiyet uyarısı sosyal kanallarda yayıldı.', tone: 'crisis' },
  { id: 'mo-sm-crisis-5', neighborhoodId: 'cumhuriyet', type: 'crisis', authorName: 'Mahalle Nabzı', message: 'Gece şikayeti ve konteyner baskısı aynı günde.', tone: 'crisis' },
  { id: 'mo-sm-merkez-3', neighborhoodId: 'merkez', type: 'neutral', authorName: 'Operasyon', message: 'Merkez prestij hattı önceliklendirildi.', tone: 'neutral' },
  { id: 'mo-sm-sanayi-3', neighborhoodId: 'sanayi', type: 'complaint', authorName: 'Lojistik', message: 'Bakım penceresi rota yoğunluğunu artırdı.', tone: 'complaint' },
  { id: 'mo-sm-istasyon-3', neighborhoodId: 'istasyon', type: 'neutral', authorName: 'Planlama', message: 'Sabah yoğunluğu için ek koordinasyon turu.', tone: 'neutral' },
  { id: 'mo-sm-yesilvadi-3', neighborhoodId: 'yesilvadi', type: 'neutral', authorName: 'Saha', message: 'Çevre hassasiyeti için sessiz toplama penceresi.', tone: 'neutral' },
  { id: 'mo-sm-cumhuriyet-3', neighborhoodId: 'cumhuriyet', type: 'neutral', authorName: 'İletişim', message: 'Mahalle güveni için kısa bilgilendirme yapıldı.', tone: 'positive' },
];

export const MAIN_OPERATION_SOCIAL_TOPICS: Array<{
  id: string;
  neighborhoodId: SocialNeighborhoodId;
  title: string;
  type: SocialTopic['type'];
  severity: SocialTopic['severity'];
}> = [
  { id: 'mo-st-merkez', neighborhoodId: 'merkez', title: 'Merkez yoğunluk ve görünürlük', type: 'service_delay', severity: 'medium' },
  { id: 'mo-st-sanayi', neighborhoodId: 'sanayi', title: 'Sanayi hacim baskısı', type: 'complaint_wave', severity: 'high' },
  { id: 'mo-st-crisis', neighborhoodId: 'istasyon', title: 'Çoklu mahalle gecikme sinyali', type: 'crisis_pressure', severity: 'medium' },
];

export function buildMainOperationSocialMentionsForDay(
  day: number,
  maxCount = 2,
): SocialMention[] {
  const picks: SocialMention[] = [];
  for (let i = 0; i < maxCount; i += 1) {
    const t = MAIN_OPERATION_SOCIAL_MENTIONS[(day + i * 3) % MAIN_OPERATION_SOCIAL_MENTIONS.length]!;
    picks.push({
      id: `${t.id}-d${day}`,
      neighborhoodId: t.neighborhoodId,
      type: t.type,
      authorName: t.authorName,
      message: t.message,
      createdDay: day,
      minuteOffset: 10 + i * 15,
      likes: 12 + i * 4,
      replies: 2 + i,
    });
  }
  return picks;
}

export function countMainOperationSocialMentions(): number {
  return MAIN_OPERATION_SOCIAL_MENTIONS.length;
}

export function countPositiveMainOperationMentions(): number {
  return MAIN_OPERATION_SOCIAL_MENTIONS.filter((m) => m.tone === 'positive').length;
}

export function countCrisisMainOperationMentions(): number {
  return MAIN_OPERATION_SOCIAL_MENTIONS.filter((m) => m.tone === 'crisis').length;
}
