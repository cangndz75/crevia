import type { DistrictIdentity, MapDistrictId } from './districtIdentityTypes';

export const MAP_DISTRICT_IDENTITY_IDS: MapDistrictId[] = [
  'cumhuriyet',
  'merkez',
  'sanayi',
  'istasyon',
  'yesilvadi',
];

export const DISTRICT_IDENTITY_FALLBACK: DistrictIdentity = {
  id: 'merkez',
  name: 'Operasyon Bölgesi',
  shortLabel: 'Bölge',
  personality: 'Saha etkisi izlenen genel operasyon alanı.',
  summary: 'Bu bölgede saha etkisi izleniyor.',
  riskProfile: {
    social: 'medium',
    traffic: 'medium',
    waste: 'medium',
    personnel: 'medium',
    budget: 'medium',
  },
  strengths: ['Operasyon merkeziyle bağlantı korunur'],
  pressurePoints: ['Veri eksikliğinde etki belirsiz kalır'],
  visualTone: { accent: 'teal', iconKey: 'district_fallback' },
  operationFlavorLines: ['Saha ekibi bölgeyi izlemeye aldı.'],
  eventContextLine: 'Bu bölgede saha etkisi izleniyor.',
};

export const DISTRICT_IDENTITIES: Record<MapDistrictId, DistrictIdentity> = {
  merkez: {
    id: 'merkez',
    name: 'Merkez',
    shortLabel: 'Merkez',
    personality:
      'Şehir görünürlüğünün en yüksek olduğu, kamu alanları ve yoğun günlük akışla baskı oluşturan merkez bölge.',
    summary:
      'Kamu alanları, ana yollar ve görünür hizmet noktaları nedeniyle kararların etkisi hızlı fark edilir.',
    riskProfile: {
      social: 'high',
      traffic: 'high',
      waste: 'medium',
      personnel: 'medium',
      budget: 'medium',
    },
    strengths: [
      'Hızlı görünür sonuç',
      'Kamu iletişimi güçlü',
      'Operasyon merkezi erişimi yüksek',
    ],
    pressurePoints: [
      'Sosyal tepki hızlı büyür',
      'Trafik ve rota baskısı yüksektir',
      'Hatalar daha görünür olur',
    ],
    visualTone: { accent: 'teal', iconKey: 'district_center' },
    operationFlavorLines: [
      'Merkezde kararlar kısa sürede görünür olur.',
      'Kamu alanları ve ana yollar baskıyı artırır.',
    ],
    eventContextLine:
      'Merkez bölgesinde görünürlük yüksek; küçük aksaklıklar hızlı yankı bulur.',
  },
  cumhuriyet: {
    id: 'cumhuriyet',
    name: 'Cumhuriyet',
    shortLabel: 'Cumhuriyet',
    personality:
      'Konut dokusu güçlü, vatandaş memnuniyetinin ve mahalle güveninin ön planda olduğu bölge.',
    summary:
      'Günlük yaşam kalitesi, şikayet yönetimi ve sosyal nabız bu bölgede daha belirleyicidir.',
    riskProfile: {
      social: 'high',
      traffic: 'medium',
      waste: 'low',
      personnel: 'low',
      budget: 'low',
    },
    strengths: [
      'Vatandaş geri bildirimi güçlü',
      'Sosyal güven hızlı toparlanabilir',
      'Düzenli hizmet etkisi görünür',
    ],
    pressurePoints: [
      'Küçük aksaklıklar şikayete döner',
      'Sosyal nabız hassastır',
      'Hizmet gecikmesi güveni düşürür',
    ],
    visualTone: { accent: 'mint', iconKey: 'district_cumhuriyet' },
    operationFlavorLines: [
      'Cumhuriyet’te sosyal nabız kararları şekillendirir.',
      'Mahalle güveni hızlı toparlanabilir.',
    ],
    eventContextLine:
      'Cumhuriyet bölgesinde sosyal nabız ve vatandaş memnuniyeti daha belirleyici.',
  },
  sanayi: {
    id: 'sanayi',
    name: 'Sanayi',
    shortLabel: 'Sanayi',
    personality:
      'Filo, rota, iş gücü ve operasyon yükünün yoğun olduğu üretim çevresi.',
    summary:
      'Araç verimliliği, personel planı ve atık akışı bu bölgede kararların merkezindedir.',
    riskProfile: {
      social: 'low',
      traffic: 'medium',
      waste: 'high',
      personnel: 'high',
      budget: 'medium',
    },
    strengths: [
      'Operasyon verimi ölçülebilir',
      'Rota optimizasyonu güçlü etki yaratır',
      'Kaynak kararları net sonuç verir',
    ],
    pressurePoints: [
      'Araç yorgunluğu artabilir',
      'Personel yükü hızlı yükselir',
      'Gecikmeler zincirleme etki yapar',
    ],
    visualTone: { accent: 'amber', iconKey: 'district_sanayi' },
    operationFlavorLines: [
      'Sanayi bölgesinde rota ve ekip yükü öne çıkar.',
      'Filo verimliliği kararların sonucunu belirler.',
    ],
    eventContextLine:
      'Sanayi bölgesinde rota ve ekip yükü daha belirleyici.',
  },
  istasyon: {
    id: 'istasyon',
    name: 'İstasyon',
    shortLabel: 'İstasyon',
    personality:
      'Geçiş, ulaşım, yoğunluk ve zaman baskısı yüksek olan post-pilot genişleme bölgesi.',
    summary:
      'İstasyon çevresinde rota önceliği, saha koordinasyonu ve anlık yoğunluk yönetimi öne çıkar.',
    riskProfile: {
      social: 'medium',
      traffic: 'high',
      waste: 'medium',
      personnel: 'high',
      budget: 'medium',
    },
    strengths: [
      'Doğru yönlendirme hızlı rahatlama sağlar',
      'Rota kararları görünür sonuç üretir',
      'Post-pilot gündem için güçlü geçiş bölgesi',
    ],
    pressurePoints: [
      'Yoğunluk kısa sürede artar',
      'Gecikme sosyal tepkiye dönüşebilir',
      'Ekip planı aksarsa saha tıkanır',
    ],
    visualTone: { accent: 'blue', iconKey: 'district_istasyon' },
    operationFlavorLines: [
      'İstasyon çevresinde geçiş ve yoğunluk baskısı yüksektir.',
      'Post-pilot gündeminde rota önceliği kritik kalır.',
    ],
    eventContextLine:
      'İstasyon bölgesinde geçiş ve yoğunluk yönetimi öne çıkar.',
  },
  yesilvadi: {
    id: 'yesilvadi',
    name: 'Yeşilvadi',
    shortLabel: 'Yeşilvadi',
    personality:
      'Parklar, çevresel hassasiyet ve sakin yaşam beklentisiyle öne çıkan yeşil bölge.',
    summary:
      'Çevre algısı, sakin hizmet temposu ve önleyici operasyonlar bu bölgede daha değerlidir.',
    riskProfile: {
      social: 'medium',
      traffic: 'low',
      waste: 'medium',
      personnel: 'low',
      budget: 'low',
    },
    strengths: [
      'Önleyici hizmet güçlü algı yaratır',
      'Sosyal güven sakin ilerler',
      'Çevresel kararlar prestij getirir',
    ],
    pressurePoints: [
      'Çevre şikayetleri görünür hale gelir',
      'Yavaş müdahale güven düşürür',
      'Yanlış kaynak kullanımı tepki doğurur',
    ],
    visualTone: { accent: 'green', iconKey: 'district_yesilvadi' },
    operationFlavorLines: [
      'Yeşilvadi’de önleyici tempo ve çevre algısı önemlidir.',
      'Sakin hizmet beklentisi kararları yumuşatır.',
    ],
    eventContextLine:
      'Yeşilvadi bölgesinde çevre algısı ve önleyici tempo daha belirleyici.',
  },
};
