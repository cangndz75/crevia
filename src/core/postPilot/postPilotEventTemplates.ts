import type { EventCard, EventDecision, EventDecisionEffect } from '@/core/models/EventCard';

import type { PostPilotEventScopeContext } from './postPilotEventTypes';

const POST_PILOT_CONTEXT_TAG = 'Hafif operasyon gündemi';

function lightEffects(partial: Partial<EventDecisionEffect>): EventDecisionEffect {
  return {
    publicSatisfaction: 0,
    budget: 0,
    morale: 0,
    risk: 0,
    xp: 0,
    ...partial,
  };
}

function threeDecisions(
  prefix: string,
  opts: {
    a: { title: string; description: string; effects: EventDecisionEffect };
    b: { title: string; description: string; effects: EventDecisionEffect };
    c: { title: string; description: string; effects: EventDecisionEffect };
  },
): EventDecision[] {
  return [
    {
      id: `${prefix}-a`,
      title: opts.a.title,
      description: opts.a.description,
      style: 'bold',
      recommended: true,
      decisionStyle: 'fast',
      effects: opts.a.effects,
    },
    {
      id: `${prefix}-b`,
      title: opts.b.title,
      description: opts.b.description,
      style: 'balanced',
      decisionStyle: 'planned',
      effects: opts.b.effects,
    },
    {
      id: `${prefix}-c`,
      title: opts.c.title,
      description: opts.c.description,
      style: 'cautious',
      decisionStyle: 'partial',
      effects: opts.c.effects,
    },
  ];
}

function baseCard(
  id: string,
  day: number,
  scope: PostPilotEventScopeContext,
  partial: Pick<EventCard, 'title' | 'description' | 'category' | 'decisions'> &
    Partial<Pick<EventCard, 'contextTag' | 'riskLevel' | 'urgencyHours'>>,
): EventCard {
  return {
    id,
    title: partial.title,
    category: partial.category,
    riskLevel: partial.riskLevel ?? 'medium',
    district: scope.districtLabel,
    neighborhoodId: scope.neighborhoodId,
    description: partial.description,
    contextTag: partial.contextTag ?? POST_PILOT_CONTEXT_TAG,
    urgencyHours: partial.urgencyHours ?? 6,
    decisions: partial.decisions,
    previewEffects: {
      publicSatisfaction: -2,
      risk: 5,
      xp: 8,
    },
    day,
  };
}

export function buildPostPilotAnchorEvent(
  templateIndex: number,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = `pp_d${day}_anchor_${templateIndex}`;
  const prefix = `pp-${day}-anchor-${templateIndex}`;

  switch (templateIndex % 3) {
    case 0:
      return baseCard(id, day, scope, {
        title: 'İstasyon Sabah Yoğunluğu',
        category: 'Operasyon / Rota',
        description:
          'Pilot sonrası genişleyen saha hazırlığı: yeni gündeme alınan bölgede rota ve ekip önceliği netleştirilmeli.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Rota önceliği ver',
            description: 'Sabah hattını güçlendir; gecikme riskini düşür.',
            effects: lightEffects({ publicSatisfaction: 2, risk: -4, staffMorale: -1 }),
          },
          b: {
            title: 'Ekip dağıtımını dengele',
            description: 'İki ekip arasında yük paylaşımı yap.',
            effects: lightEffects({ staffMorale: 3, risk: -2 }),
          },
          c: {
            title: 'Vatandaş bilgilendirmesi',
            description: 'Kısa saha duyurusu ile beklentiyi yönet.',
            effects: lightEffects({ publicSatisfaction: 4, risk: -1 }),
          },
        }),
      });
    case 1:
      return baseCard(id, day, scope, {
        title: 'İstasyon Konteyner Denge Noktası',
        category: 'Konteyner / Operasyon',
        description:
          'Operasyon yükü kademeli artıyor: genişleyen sahadaki konteyner doluluk sinyali izlenmeli.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Boşaltma penceresi aç',
            description: 'Yoğun noktada kısa boşaltma turu planla.',
            effects: lightEffects({ publicSatisfaction: 3, budget: -2, risk: -3 }),
          },
          b: {
            title: 'Geçici yönlendirme',
            description: 'Alternatif toplama noktasına yönlendir.',
            effects: lightEffects({ publicSatisfaction: 1, risk: -2 }),
          },
          c: {
            title: 'İzleme modunda tut',
            description: 'Veri topla; yarın için plan hazırla.',
            effects: lightEffects({ risk: 1, staffMorale: 1 }),
          },
        }),
      });
    default:
      return baseCard(id, day, scope, {
        title: 'Merkezden İstasyona Kaynak Aktarımı',
        category: 'Kaynak / Personel',
        description:
          'İstasyon kapsamı gündemde: pilot bölgesi rutinini bozmadan yeni kapsamı destekleyecek hafif kaynak aktarımı.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Personel takviyesi',
            description: 'Merkezden kısa süreli ekip desteği ayır.',
            effects: lightEffects({ staffMorale: 2, budget: -3, risk: -3 }),
          },
          b: {
            title: 'Araç paylaşımı',
            description: 'Boşta kalan aracı istasyon hattına kaydır.',
            effects: lightEffects({ risk: -2, publicSatisfaction: 1 }),
          },
          c: {
            title: 'Rutini koru',
            description: 'Pilot bölgesi önceliğini koruyarak küçük destek ver.',
            effects: lightEffects({ staffMorale: 1, publicSatisfaction: -1 }),
          },
        }),
      });
  }
}

export function buildPostPilotSideEvent(
  templateIndex: number,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = `pp_d${day}_side_${templateIndex}`;
  const prefix = `pp-${day}-side-${templateIndex}`;

  switch (templateIndex % 4) {
    case 0:
      return baseCard(id, day, scope, {
        title: 'Vatandaş Geri Bildirim Sinyali',
        category: 'Vatandaş / İletişim',
        description: 'Saha ekibinden kısa geri bildirim paketi geldi; gündem etkisi sınırlı tutulmalı.',
        riskLevel: 'low',
        urgencyHours: 8,
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Hızlı yanıt',
            description: 'Aynı gün içinde kısa geri dönüş planla.',
            effects: lightEffects({ publicSatisfaction: 3 }),
          },
          b: {
            title: 'Kayda al',
            description: 'Öncelik listesine ekle; haftalık değerlendir.',
            effects: lightEffects({ publicSatisfaction: 1, staffMorale: 1 }),
          },
          c: {
            title: 'Saha notu bırak',
            description: 'Ekibe izleme talimatı ver.',
            effects: lightEffects({ risk: -1 }),
          },
        }),
      });
    case 1:
      return baseCard(id, day, scope, {
        title: 'Ekip Yorgunluk Notu',
        category: 'Personel',
        description: 'Hafif operasyon gündeminde ekip yorgunluğu sinyali; yük dağılımı gözden geçirilmeli.',
        riskLevel: 'low',
        urgencyHours: 10,
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Vardiya kaydır',
            description: 'Yoğun saati dengele.',
            effects: lightEffects({ staffMorale: 4, budget: -1 }),
          },
          b: {
            title: 'Kısa mola',
            description: 'Operasyonu durdurmadan nefes arası ver.',
            effects: lightEffects({ staffMorale: 2, risk: -1 }),
          },
          c: {
            title: 'Devam et',
            description: 'Gündemi koru; yarın gözden geçir.',
            effects: lightEffects({ staffMorale: -2, risk: 2 }),
          },
        }),
      });
    case 2:
      return baseCard(id, day, scope, {
        title: 'Rota Gecikme Uyarısı',
        category: 'Rota',
        description: 'İstasyon hattında hafif gecikme uyarısı; operasyon yükü kademeli artıyor.',
        riskLevel: 'medium',
        urgencyHours: 5,
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Alternatif rota',
            description: 'Yedek güzergahı devreye al.',
            effects: lightEffects({ publicSatisfaction: 2, budget: -2, risk: -2 }),
          },
          b: {
            title: 'Öncelik sırası',
            description: 'Kritik durakları öne al.',
            effects: lightEffects({ publicSatisfaction: 1, risk: -1 }),
          },
          c: {
            title: 'Bilgilendir',
            description: 'Vatandaş beklentisini yönet.',
            effects: lightEffects({ publicSatisfaction: 2 }),
          },
        }),
      });
    default:
      return baseCard(id, day, scope, {
        title: 'Sosyal Nabız Takibi',
        category: 'Sosyal nabız',
        description: 'Pilot sonrası saha hazırlığı kapsamında düşük yoğunluklu nabız takibi.',
        riskLevel: 'low',
        urgencyHours: 12,
        decisions: threeDecisions(prefix, {
          a: {
            title: 'İzlemeyi sıklaştır',
            description: 'Gün içi iki kısa kontrol.',
            effects: lightEffects({ publicSatisfaction: 1, risk: -2 }),
          },
          b: {
            title: 'Rutin tarama',
            description: 'Mevcut tarama sıklığını koru.',
            effects: lightEffects({ risk: 0 }),
          },
          c: {
            title: 'Ertesi güne bırak',
            description: 'Öncelikli olaylara odaklan.',
            effects: lightEffects({ risk: 1 }),
          },
        }),
      });
  }
}
