import type { DistrictProfile, DistrictType } from '@/core/districts/types';

export const DISTRICT_PROFILES: Record<DistrictType, DistrictProfile> = {
  merkez: {
    id: 'merkez',
    name: 'Merkez',
    description:
      'Yoğun cadde, esnaf ve kamuoyu baskısının yüksek olduğu görünür hizmet bölgesi.',
    tags: ['yoğun', 'görünür', 'kamuoyu'],
    baseRisk: 55,
    complaintSensitivity: 80,
    trafficDensity: 70,
    socialMediaSensitivity: 85,
    wastePressure: 55,
    staffLoadPressure: 55,
    vehicleDependency: 45,
    publicTrustSensitivity: 80,
  },
  cumhuriyet: {
    id: 'cumhuriyet',
    name: 'Cumhuriyet',
    description:
      'Konut yoğunluğu yüksek; mahalle güveni ve küçük şikayetlerin yayılımı hassas.',
    tags: ['konut', 'aile', 'mahalle güveni'],
    baseRisk: 45,
    complaintSensitivity: 70,
    trafficDensity: 45,
    socialMediaSensitivity: 55,
    wastePressure: 50,
    staffLoadPressure: 45,
    vehicleDependency: 35,
    publicTrustSensitivity: 75,
  },
  sanayi: {
    id: 'sanayi',
    name: 'Sanayi',
    description:
      'Operasyon ve araç bağımlılığı yüksek; büyük hacimli atık ve rota baskısı belirgin.',
    tags: ['operasyon', 'araç', 'büyük hacimli atık'],
    baseRisk: 70,
    complaintSensitivity: 50,
    trafficDensity: 65,
    socialMediaSensitivity: 45,
    wastePressure: 85,
    staffLoadPressure: 75,
    vehicleDependency: 90,
    publicTrustSensitivity: 45,
  },
  pazar: {
    id: 'pazar',
    name: 'Pazar',
    description:
      'Esnaf ve yoğunluk baskısı; kaldırım ve pazar akışı kritik.',
    tags: ['yoğunluk', 'esnaf', 'kaldırım'],
    baseRisk: 65,
    complaintSensitivity: 75,
    trafficDensity: 85,
    socialMediaSensitivity: 65,
    wastePressure: 75,
    staffLoadPressure: 70,
    vehicleDependency: 55,
    publicTrustSensitivity: 70,
  },
  yesilpark: {
    id: 'yesilpark',
    name: 'Yeşilpark',
    description:
      'Park ve çevre odaklı; aile kullanımı ve temizlik algısı ön planda.',
    tags: ['park', 'aile', 'çevre'],
    baseRisk: 40,
    complaintSensitivity: 65,
    trafficDensity: 35,
    socialMediaSensitivity: 60,
    wastePressure: 45,
    staffLoadPressure: 40,
    vehicleDependency: 30,
    publicTrustSensitivity: 80,
  },
  istasyon: {
    id: 'istasyon',
    name: 'İstasyon',
    description:
      'Geçiş ve ulaşım yoğunluğu; gürültü ve rota gecikmeleri sık görülür.',
    tags: ['geçiş', 'ulaşım', 'gürültü'],
    baseRisk: 60,
    complaintSensitivity: 70,
    trafficDensity: 90,
    socialMediaSensitivity: 60,
    wastePressure: 55,
    staffLoadPressure: 60,
    vehicleDependency: 65,
    publicTrustSensitivity: 65,
  },
};

export const DEFAULT_DISTRICT_TYPE: DistrictType = 'merkez';

export function getDistrictProfile(
  districtType: DistrictType,
): DistrictProfile {
  return DISTRICT_PROFILES[districtType] ?? DISTRICT_PROFILES[DEFAULT_DISTRICT_TYPE];
}
