import type { EventCard, EventDecision, EventDecisionEffect } from '@/core/models/EventCard';
import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';

const CRISIS_CONTEXT_TAG = 'Kriz Masası uyarısı';

function crisisEffects(
  partial: Partial<EventDecisionEffect>,
): EventDecisionEffect {
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
    contextTag: partial.contextTag ?? CRISIS_CONTEXT_TAG,
    urgencyHours: partial.urgencyHours ?? 5,
    decisions: partial.decisions,
    previewEffects: { publicSatisfaction: -2, risk: 6, xp: 5 },
    day,
  };
}

export type CrisisEventTemplateKey =
  | 'multi_district_warning'
  | 'vehicle_container_chain'
  | 'social_response_gap'
  | 'assignment_coordination';

export function buildCrisisSideEvent(
  templateKey: CrisisEventTemplateKey,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = `crisis_d${day}_${templateKey}`;
  const prefix = `crisis-${day}-${templateKey}`;

  switch (templateKey) {
    case 'multi_district_warning':
      return baseCard(id, day, scope, {
        title: 'Kriz Masası: Çoklu Mahalle Uyarısı',
        category: 'Kriz / Mahalle',
        description:
          'Kriz Masası birden fazla mahallede eşzamanlı baskı sinyali bildiriyor; koordinasyon önceliği netleştirilmeli.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Mahalle önceliği belirle',
            description: 'Kriz Masası önerisiyle iki hattı sabitle.',
            effects: crisisEffects({ risk: -4, publicSatisfaction: 1 }),
          },
          b: {
            title: 'Ekip dağılımını güçlendir',
            description: 'Çoklu mahalle için kısa koordinasyon turu.',
            effects: crisisEffects({ staffMorale: 2, risk: -2 }),
          },
          c: {
            title: 'İzleme modunda tut',
            description: 'Veri topla; akşam değerlendir.',
            effects: crisisEffects({ risk: 1 }),
          },
        }),
      });
    case 'vehicle_container_chain':
      return baseCard(id, day, scope, {
        title: 'Kriz Masası: Filo ve Konteyner Zinciri',
        category: 'Kriz / Operasyon',
        description:
          'Araç ve konteyner baskısı aynı rotada birleşiyor; Kriz Masası önleyici hamle öneriyor.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Rotayı yeniden dağıt',
            description: 'Filo yükünü dengele.',
            effects: crisisEffects({ risk: -3, budget: -2 }),
          },
          b: {
            title: 'Kısa boşaltma turu',
            description: 'Konteyner hattını rahatlat.',
            effects: crisisEffects({ risk: -2, publicSatisfaction: 1 }),
          },
          c: {
            title: 'Yarına planla',
            description: 'Bugün hafif müdahale.',
            effects: crisisEffects({ risk: 2 }),
          },
        }),
      });
    case 'social_response_gap':
      return baseCard(id, day, scope, {
        title: 'Kriz Masası: Sosyal Tepki Açığı',
        category: 'Kriz / İletişim',
        riskLevel: 'medium',
        description:
          'Mahalle tepkisi saha hızının önüne geçebilir; iletişim hattı açık tutulmalı.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Halk bilgilendirmesi',
            description: 'Kısa saha duyurusu planla.',
            effects: crisisEffects({ publicSatisfaction: 4, risk: -1 }),
          },
          b: {
            title: 'Temsilci görüşmesi',
            description: 'Mahalle temsilcisiyle ön görüşme.',
            effects: crisisEffects({ publicSatisfaction: 2 }),
          },
          c: {
            title: 'Saha notu',
            description: 'Ekibe izleme talimatı ver.',
            effects: crisisEffects({ risk: -1 }),
          },
        }),
      });
    default:
      return baseCard(id, day, scope, {
        title: 'Kriz Masası: Saha Koordinasyon Riski',
        category: 'Kriz / Atama',
        description:
          'Atama uyumu zayıfsa çoklu mahalle baskısı büyüyebilir; Kriz Masası koordinasyon uyarısı veriyor.',
        decisions: threeDecisions(prefix, {
          a: {
            title: 'Atamayı güçlendir',
            description: 'Ekip-araç eşleşmesini gözden geçir.',
            effects: crisisEffects({ risk: -3, staffMorale: 1 }),
          },
          b: {
            title: 'Planı hizala',
            description: 'Günlük plan odağını olayla eşle.',
            effects: crisisEffects({ risk: -2 }),
          },
          c: {
            title: 'Mevcut akış',
            description: 'Bugün mevcut atamayla devam.',
            effects: crisisEffects({ risk: 2 }),
          },
        }),
      });
  }
}

export function pickCrisisEventTemplateKey(
  signals: Array<{ domain: string; id: string }>,
  day: number,
): CrisisEventTemplateKey {
  const domains = signals.map((s) => s.domain);
  if (domains.includes('vehicles') || domains.includes('containers')) {
    return 'vehicle_container_chain';
  }
  if (domains.includes('assignments')) {
    return 'assignment_coordination';
  }
  if (domains.includes('social')) {
    return 'social_response_gap';
  }
  const keys: CrisisEventTemplateKey[] = [
    'multi_district_warning',
    'vehicle_container_chain',
    'social_response_gap',
    'assignment_coordination',
  ];
  return keys[day % keys.length]!;
}
