import {
  PILOT_DISTRICT_IDS,
  type DistrictProfile,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';

export type { PilotDistrictId } from '@/core/models/DistrictProfile';
export { PILOT_DISTRICT_IDS } from '@/core/models/DistrictProfile';

export const districtProfiles: Record<PilotDistrictId, DistrictProfile> = {
  central: {
    id: 'central',
    name: 'Merkez Pilot Bölge',
    shortName: 'Merkez',
    description:
      'Ana cadde, esnaf ve pazar hattının kesiştiği dengeli pilot bölge. Görünür hizmet beklentisi yüksek; ilk hafta öğrenme eğrisi daha yumuşak.',
    difficulty: 'balanced',
    tags: ['dengeli', 'görünür-hizmet', 'esnaf-pazar', 'ana-cadde'],
    startingMetrics: {
      publicSatisfaction: 55,
      budget: 75_000,
      staffMorale: 65,
      riskScore: 35,
    },
    eventBias: {
      complaintThreshold: 0.45,
      socialPressureMultiplier: 1.0,
      operationalPressureMultiplier: 1.0,
      eventTypeWeights: {
        market: 1.2,
        sidewalk: 1.1,
        waste: 1.0,
        citizen_complaint: 0.9,
        social_media: 0.85,
      },
    },
    briefingTitle: 'Merkez hattında görünür hizmet',
    briefingText:
      'Esnaf ve pazar yoğunluğu yüksek. İlk günlerde cadde temizliği ve görünür müdahale algıyı güçlendirir; şikayetler genelde ölçülü gelir.',
    visualKey: 'district_central',
  },
  cumhuriyet: {
    id: 'cumhuriyet',
    name: 'Cumhuriyet Mahallesi',
    shortName: 'Cumhuriyet',
    description:
      'Muhtarlık ve sosyal medya etkisi güçlü mahalle. Şikayet eşiği düşük; algı ve sosyal baskı günleri daha erken belirginleşir.',
    difficulty: 'challenging',
    tags: ['sosyal-baskı', 'düşük-şikayet-eşiği', 'muhtar', 'sosyal-medya'],
    startingMetrics: {
      publicSatisfaction: 48,
      budget: 72_000,
      staffMorale: 62,
      riskScore: 42,
    },
    eventBias: {
      complaintThreshold: 0.32,
      socialPressureMultiplier: 1.35,
      operationalPressureMultiplier: 1.05,
      eventTypeWeights: {
        citizen_complaint: 1.3,
        social_media: 1.4,
        noise: 1.15,
        sidewalk: 1.0,
        waste: 0.95,
      },
    },
    briefingTitle: 'Sosyal baskı ve hızlı şikayet döngüsü',
    briefingText:
      'Muhtar ve mahalle grupları hızlı tepki verir. Küçük gecikmeler bile sosyal medyada büyüyebilir; iletişim ve zamanlama kritik.',
    visualKey: 'district_cumhuriyet',
  },
  industrial_market: {
    id: 'industrial_market',
    name: 'Sanayi & Pazar Bölgesi',
    shortName: 'Sanayi & Pazar',
    description:
      'Rota yoğunluğu, araç ve personel yorgunluğu yüksek operasyon bölgesi. Kaynak günü ve lojistik baskı daha sert hissedilir.',
    difficulty: 'hard',
    tags: ['operasyon-baskısı', 'rota', 'araç', 'personel-yorgunluğu', 'pazar'],
    startingMetrics: {
      publicSatisfaction: 52,
      budget: 70_000,
      staffMorale: 58,
      riskScore: 45,
    },
    eventBias: {
      complaintThreshold: 0.4,
      socialPressureMultiplier: 0.95,
      operationalPressureMultiplier: 1.4,
      eventTypeWeights: {
        vehicle: 1.35,
        staff: 1.3,
        waste: 1.2,
        market: 1.15,
        citizen_complaint: 1.05,
        opportunity: 0.9,
      },
    },
    briefingTitle: 'Operasyon baskısı ve kaynak yorgunluğu',
    briefingText:
      'Geniş rota ve pazar çıkışları personeli zorlar. Araç arızası ve vardiya dağılımı hataları zincirleme gecikme üretir.',
    visualKey: 'district_industrial_market',
  },
};

export const pilotDistrictList: DistrictProfile[] =
  PILOT_DISTRICT_IDS.map((id) => districtProfiles[id]);

export function getDistrictProfile(
  id: string,
): DistrictProfile | undefined {
  if (!(id in districtProfiles)) return undefined;
  return districtProfiles[id as PilotDistrictId];
}
