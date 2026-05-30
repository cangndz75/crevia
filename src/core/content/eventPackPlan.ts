import {
  POST_PILOT_LIGHT_CURRENT_INVENTORY,
  POST_PILOT_LIGHT_DAILY_EVENT_CAP,
  POST_PILOT_LIGHT_EXPANSION_TARGET,
} from './eventAuthoringConstants';
import type { EventPackDefinition, EventPackId } from './eventAuthoringTypes';

export const EVENT_PACK_PLAN: Record<EventPackId, EventPackDefinition> = {
  pilot_core: {
    id: 'pilot_core',
    title: 'Pilot Çekirdek (Gün 1–7)',
    goal: 'İlk 7 günün yarı lineer eğitim ve operasyon ritmini kurmak.',
    theme:
      'Temel karar akışı, sistem tanıtımı, mahalle güveni ve günlük hedef odağı.',
    phase: 'pilot',
    targetCounts: {
      anchor: 7,
      side: 14,
      quickOpportunity: 5,
      finalPressure: 2,
    },
    risks: [
      'Gün 1 tutorial için fazla sistem aynı anda açılmamalı.',
      'Anchor olaylar birbirinin tekrarı gibi hissedilmemeli.',
    ],
    implemented: true,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  district_cumhuriyet: {
    id: 'district_cumhuriyet',
    title: 'Cumhuriyet Mahalle Paketi',
    goal: 'Konut dokusu ve vatandaş memnuniyeti odaklı olay havuzu.',
    theme:
      'Konut, vatandaş memnuniyeti, sosyal güven ve şikayet yönetimi.',
    phase: 'pilot',
    districtId: 'cumhuriyet',
    targetCounts: {
      anchor: 4,
      side: 8,
      socialMentionLinked: 6,
    },
    risks: ['Çok fazla sosyal metinle ekranı boğmamak.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  district_merkez: {
    id: 'district_merkez',
    title: 'Merkez Mahalle Paketi',
    goal: 'Kamu görünürlüğü ve hızlı tepki beklentisini yansıtan olaylar.',
    theme: 'Kamu görünürlüğü, ana arterler, hızlı tepki, sosyal baskı.',
    phase: 'pilot',
    districtId: 'merkez',
    targetCounts: {
      anchor: 4,
      side: 8,
      crisisLightPressure: 4,
    },
    risks: ['Her olayın kriz gibi görünmemesi.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  district_sanayi: {
    id: 'district_sanayi',
    title: 'Sanayi Mahalle Paketi',
    goal: 'Operasyon verimi ve saha kapasitesi odaklı olaylar.',
    theme: 'Araç, rota, personel yükü ve operasyon verimi.',
    phase: 'pilot',
    districtId: 'sanayi',
    targetCounts: {
      anchor: 5,
      side: 8,
      vehicleContainerLinked: 4,
    },
    risks: ['Oyuncuya fazla teknik sistem dili yansıtmamak.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  district_istasyon: {
    id: 'district_istasyon',
    title: 'İstasyon Mahalle Paketi',
    goal: 'Post-pilot geçiş ve yoğunluk yönetimi temaları.',
    theme: 'Post-pilot geçiş, ulaşım, yoğunluk, saha koordinasyonu.',
    phase: 'post_pilot_light',
    districtId: 'istasyon',
    targetCounts: {
      anchor: 5,
      side: 8,
      postPilotLightSpecific: 4,
    },
    risks: ['Tam ana operasyon hissini pilot bitmeden vermemek.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  district_yesilvadi: {
    id: 'district_yesilvadi',
    title: 'Yeşilvadi Mahalle Paketi',
    goal: 'Çevre ve önleyici hizmet temalı olay planı.',
    theme: 'Çevre, parklar, sakin hizmet, önleyici operasyon.',
    phase: 'future_main_operation',
    districtId: 'yesilvadi',
    targetCounts: {
      anchor: 4,
      side: 8,
      socialEnvironment: 4,
    },
    risks: [
      'Sistem tam aktif değilse yalnızca planlanmalı; erken implementasyon yapılmamalı.',
    ],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  post_pilot_light: {
    id: 'post_pilot_light',
    title: 'Post-Pilot Hafif Operasyon',
    goal: 'Gün 8+ hafif operasyon gündemi; mevcut cap korunarak genişleme planı.',
    theme: 'Gün 8+ hafif operasyon gündemi ve düşük yoğunluklu karar döngüsü.',
    phase: 'post_pilot_light',
    targetCounts: {
      anchor: POST_PILOT_LIGHT_CURRENT_INVENTORY.anchor,
      side: POST_PILOT_LIGHT_CURRENT_INVENTORY.side,
    },
    risks: [
      `Günde en fazla ${POST_PILOT_LIGHT_DAILY_EVENT_CAP} aktif event cap'i aşılmamalı.`,
      'Pilot tamamlama raporu diliyle karıştırılmamalı.',
    ],
    dailyEventCapNote: `Mevcut motor: günde en fazla ${POST_PILOT_LIGHT_DAILY_EVENT_CAP} aktif event (1 anchor + 1 side ritmi).`,
    expansionPlanNote: `Gelecek envanter hedefi: ${POST_PILOT_LIGHT_EXPANSION_TARGET.anchor} anchor + ${POST_PILOT_LIGHT_EXPANSION_TARGET.side} side; cap değişmeden kademeli açılım.`,
    implemented: true,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  crisis_pack_future: {
    id: 'crisis_pack_future',
    title: 'Kriz Paketi (Gelecek)',
    goal: 'Yüksek riskli olaylar için ileri faz içerik planı.',
    theme: 'Yüksek riskli olaylar ve kontrollü baskı artışı.',
    phase: 'future_main_operation',
    targetCounts: {
      anchor: 6,
      side: 10,
      crisisLightPressure: 8,
    },
    risks: ['Çok erken açılırsa oyuncuyu boğar; yalnızca plan.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
  social_pack_future: {
    id: 'social_pack_future',
    title: 'Sosyal Nabız Paketi (Gelecek)',
    goal: 'Sosyal nabız ve mention odaklı olay planı.',
    theme: 'Sosyal nabız, mention yankısı ve halk algısı odaklı olaylar.',
    phase: 'future_main_operation',
    targetCounts: {
      anchor: 4,
      side: 12,
      socialMentionLinked: 10,
    },
    risks: ['Metin yoğunluğu ve tekrar riski; yalnızca plan.'],
    implemented: false,
    requiresNewRoute: false,
    requiresNewGameplay: false,
  },
};

export function getEventPackDefinition(packId: EventPackId): EventPackDefinition {
  return EVENT_PACK_PLAN[packId];
}

export function listEventPackDefinitions(): EventPackDefinition[] {
  return Object.values(EVENT_PACK_PLAN);
}
