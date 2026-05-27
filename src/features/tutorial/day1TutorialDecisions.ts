import type { EventDecision } from '@/core/models/EventCard';

/** Day 1 tutorial kararları — mevcut applyDecision / quick-action eşlemesiyle uyumlu */
export function buildDay1TutorialDecisions(prefix: string): EventDecision[] {
  return [
    {
      id: `${prefix}-follow`,
      title: 'Takip Et',
      description: 'Durumu izle; bütçe korunur, risk sürer.',
      style: 'cautious',
      decisionStyle: 'planned',
      setFlags: { day1ResponseStyle: 'planned' },
      resultText: 'Olay takip listesine alındı; güven artışı sınırlı kaldı.',
      effects: {
        publicSatisfaction: 1,
        budget: 0,
        morale: 0,
        risk: 2,
        xp: 8,
      },
      xpReward: 8,
    },
    {
      id: `${prefix}-assign`,
      title: 'Yönlendir',
      description: 'Ekibi sahaya yönlendir; hızlı çözüm, yüksek kaynak maliyeti.',
      style: 'bold',
      recommended: true,
      decisionStyle: 'fast',
      setFlags: { day1ResponseStyle: 'fast' },
      resultText: 'Ekip yönlendirildi; mahalle güveni belirgin şekilde toparlandı.',
      effects: {
        publicSatisfaction: 5,
        budget: -2500,
        morale: -1,
        risk: -4,
        xp: 14,
      },
      costs: { staffHours: 8, vehicleUsage: 1 },
      xpReward: 14,
    },
    {
      id: `${prefix}-communicate`,
      title: 'İletişim Kur',
      description: 'Mahalleyle iletişim kur; sosyal baskı azalır.',
      style: 'balanced',
      decisionStyle: 'communication',
      setFlags: { day1ResponseStyle: 'partial' },
      resultText: 'Mahalleyle iletişim kuruldu; sosyal geri bildirim yatıştı.',
      effects: {
        publicSatisfaction: 2,
        budget: -500,
        morale: 0,
        risk: -3,
        xp: 10,
      },
      costs: { staffHours: 1 },
      xpReward: 10,
    },
  ];
}

export const DAY1_TUTORIAL_EVENT_COPY = {
  title: 'Mahalle Güveni Düşüyor',
  neighborhood: 'Cumhuriyet Mahallesi',
  description:
    'Cumhuriyet Mahallesi’nde park aydınlatmaları birkaç gündür çalışmıyor. Akşam saatlerinde aileler ve çocuklar parkı kullanmak istemiyor.',
  fieldNote: 'Parkın ışıkları akşam çalışmıyor, çocuklar tedirgin.',
  contextTag: 'Mahalle güveni',
  riskLevel: 'medium' as const,
  urgencyHours: 1,
  previewEffects: {
    publicSatisfaction: -6,
    risk: 10,
    xp: 16,
    budget: -2500,
  },
};
