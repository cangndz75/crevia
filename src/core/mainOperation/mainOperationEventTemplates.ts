import type { EventCard, EventDecision, EventDecisionEffect } from '@/core/models/EventCard';

import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';

const MAIN_OPERATION_CONTEXT_TAG = 'Ana operasyon gündemi';

function mainEffects(partial: Partial<EventDecisionEffect>): EventDecisionEffect {
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
    contextTag: partial.contextTag ?? MAIN_OPERATION_CONTEXT_TAG,
    urgencyHours: partial.urgencyHours ?? 6,
    decisions: partial.decisions,
    previewEffects: {
      publicSatisfaction: -1,
      risk: 4,
      xp: 6,
    },
    day,
  };
}

export function buildMainFullAnchorEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = `mf_d${day}_anchor_${templateKey}`;
  const prefix = `mf-${day}-anchor-${templateKey}`;

  switch (templateKey) {
    case 'district_pressure':
      return baseCard(id, day, scope, {
        title: 'Çoklu Mahalle Operasyon Baskısı',
        category: 'Operasyon / Mahalle',
        description:
          'Aktif mahalle hatlarında eşzamanlı baskı sinyali var; sezon dengesini korumak için öncelik sırası netleştirilmeli.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Mahalle önceliği belirle',
            description: 'En yoğun hattı sabah turuna al.',
            effects: mainEffects({ risk: -4, publicSatisfaction: 2 }),
          },
          b: {
            title: 'Ekip dağılımını güçlendir',
            description: 'İki mahalle arasında denge kur.',
            effects: mainEffects({ staffMorale: 2, risk: -2 }),
          },
          c: {
            title: 'İzleme modunda tut',
            description: 'Veri topla; akşam değerlendir.',
            effects: mainEffects({ risk: 1, staffMorale: 1 }),
          },
        }),
      });
    case 'route_capacity':
      return baseCard(id, day, scope, {
        title: 'Şehir Rotasında Kapasite Dengesi',
        category: 'Operasyon / Rota',
        description:
          'Genişleyen şehir kapsamında rota kapasitesi sıkışıyor; filo ve saha hızını birlikte ayarla.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Rota sıkıştır',
            description: 'Boş araçları kritik hatta topla.',
            effects: mainEffects({ risk: -3, budget: -2 }),
          },
          b: {
            title: 'Geç toplama penceresi',
            description: 'Yoğun saatleri kaydır.',
            effects: mainEffects({ publicSatisfaction: -1, risk: -2 }),
          },
          c: {
            title: 'Saha koordinasyonu',
            description: 'Ekipler arası kısa brifing yap.',
            effects: mainEffects({ staffMorale: 3 }),
          },
        }),
      });
    default:
      return baseCard(id, day, scope, {
        title: 'Konteyner Ağı Sezon Baskısı',
        category: 'Konteyner / Operasyon',
        description:
          'Sezon kapsamındaki konteyner hatlarında doluluk yükseliyor; şehir genelinde denge kurulmalı.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Boşaltma turu aç',
            description: 'Kritik noktalarda ek tur planla.',
            effects: mainEffects({ risk: -4, budget: -3 }),
          },
          b: {
            title: 'Yönlendirme uygula',
            description: 'Alternatif toplama noktasına kaydır.',
            effects: mainEffects({ publicSatisfaction: 2, risk: -1 }),
          },
          c: {
            title: 'Haftalık plana yaz',
            description: 'Bugün hafif müdahale ile izle.',
            effects: mainEffects({ risk: 2 }),
          },
        }),
      });
  }
}

export function buildMainFullSideEvent(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = `mf_d${day}_side_${templateKey}`;
  const prefix = `mf-${day}-side-${templateKey}`;

  switch (templateKey) {
    case 'social_coordination':
      return baseCard(id, day, scope, {
        title: 'Mahalle Temsilcilerinden Günlük Geri Bildirim',
        category: 'Vatandaş / İletişim',
        description:
          'Aktif mahallelerden kısa geri bildirim paketi geldi; sezon iletişim hattını güncelle.',
        riskLevel: 'low',
        urgencyHours: 8,
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Aynı gün yanıt',
            description: 'Temsilcilere kısa saha notu gönder.',
            effects: mainEffects({ publicSatisfaction: 4 }),
          },
          b: {
            title: 'Kayda al',
            description: 'Haftalık değerlendirmeye ekle.',
            effects: mainEffects({ publicSatisfaction: 1 }),
          },
          c: {
            title: 'Ekip notu',
            description: 'Saha ekibine izleme talimatı ver.',
            effects: mainEffects({ risk: -1 }),
          },
        }),
      });
    case 'assignment_review':
      return baseCard(id, day, scope, {
        title: 'Saha Ataması Uyum Kontrolü',
        category: 'Operasyon / Atama',
        description:
          'Gün içi atamalarda uyum skorları değişti; sezon hedefi için ekip-araç eşleşmesini gözden geçir.',
        riskLevel: 'low',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Uyumu güçlendir',
            description: 'Zayıf eşleşmeleri yeniden dağıt.',
            effects: mainEffects({ staffMorale: 2, risk: -2 }),
          },
          b: {
            title: 'Planı koru',
            description: 'Mevcut atamayla devam et.',
            effects: mainEffects({ risk: 1 }),
          },
          c: {
            title: 'Danışman notu',
            description: 'Ece ile kısa değerlendirme yap.',
            effects: mainEffects({ publicSatisfaction: 1 }),
          },
        }),
      });
    default:
      return baseCard(id, day, scope, {
        title: 'Filo Kullanım Dengesi',
        category: 'Araç / Operasyon',
        description:
          'Şehir kapsamındaki araç kullanımı dengesiz; filo baskısını artırmadan akışı düzelt.',
        riskLevel: 'low',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Araç rotasyonu',
            description: 'Yoğun hattan boş aracı çek.',
            effects: mainEffects({ risk: -2 }),
          },
          b: {
            title: 'Bakım penceresi',
            description: 'Kritik olmayan aracı kısa bakıma al.',
            effects: mainEffects({ budget: -2, risk: -1 }),
          },
          c: {
            title: 'İzle',
            description: 'Veri topla; yarın karar ver.',
            effects: mainEffects({ staffMorale: 1 }),
          },
        }),
      });
  }
}
