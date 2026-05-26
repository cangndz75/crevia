import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { createSnapshot } from '@/core/game/createSnapshot';
import type { GameState } from '@/core/models/GameState';
import type { EventCard } from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { CityPulseMetric } from '@/core/models/CityPulseMetric';
import type { CityState } from '@/core/models/CityState';
import { colors } from '@/ui/theme/colors';

import {
  DAY1_ACTIVE_EVENT_IDS,
  DAY1_EVENT_POOL,
  DAY1_NEIGHBORHOODS,
} from './day1SeedPool';

export { DAY1_NEIGHBORHOODS } from './day1SeedPool';

export const PILOT_COORDINATOR_ROLE = 'Pilot Bölge Hizmet Koordinatörü';

/** Oyuncu rolü — bootstrap hydrate kontrolü ve seed ile uyumlu. */
export const DAY1_ROLE = PILOT_COORDINATOR_ROLE;

export const DAY1_METRICS = {
  publicSatisfaction: 55,
  budget: 75_000,
  staffMorale: 65,
} as const;

export const DAY1_RESOURCES: GameResources = {
  availableStaff: 12,
  availableVehicles: 6,
  overtimeHours: 0,
};

function buildCityPulse(city: CityState): CityPulseMetric[] {
  return [
    {
      id: 'satisfaction',
      label: 'Halk Memnuniyeti',
      value: `${city.publicSatisfaction}%`,
      progress: city.publicSatisfaction / 100,
      color: colors.success,
      mutedColor: colors.successMuted,
      icon: 'happy',
      trendLabel: 'Memnuniyet',
      trendValue: 'Gün 1',
      trendTone: 'info',
      variant: 'ring',
    },
    {
      id: 'budget',
      label: 'Bütçe Durumu',
      value: `₺${city.budget.toLocaleString('tr-TR')}`,
      progress: Math.min(1, city.budget / 100_000),
      color: colors.secondary,
      mutedColor: colors.secondaryMuted,
      icon: 'cash',
      trendLabel: 'Bütçe',
      trendValue: 'Gün 1',
      trendTone: 'info',
      variant: 'icon',
    },
    {
      id: 'morale',
      label: 'Personel Morali',
      value: `${city.morale}%`,
      progress: city.morale / 100,
      color: colors.purple,
      mutedColor: colors.purpleMuted,
      icon: 'people',
      trendLabel: 'Moral',
      trendValue: 'Gün 1',
      trendTone: 'info',
      variant: 'icon',
    },
    {
      id: 'risk',
      label: 'Risk Skoru',
      value: `${city.riskScore}/100`,
      progress: city.riskScore / city.maxRiskScore,
      color: colors.warning,
      mutedColor: colors.warningMuted,
      icon: 'alert',
      trendLabel: 'Risk',
      trendValue: 'İzleniyor',
      trendTone: 'warning',
      variant: 'icon',
    },
  ];
}

function buildDay1GameState(activeEvents: EventCard[]): GameState {
  const city: CityState = {
    name: 'Crevia',
    day: 1,
    department: 'Temizlik ve Çevre',
    publicSatisfaction: DAY1_METRICS.publicSatisfaction,
    budget: DAY1_METRICS.budget,
    morale: DAY1_METRICS.staffMorale,
    riskScore: 40,
    maxRiskScore: 100,
  };

  return {
    city,
    player: {
      xp: 0,
      xpToNextLevel: 100,
      authorityPoints: 0,
      level: 1,
      title: 'Temizlik ve Çevre',
      role: DAY1_ROLE,
      notificationCount: 0,
      streakDays: 0,
    },
    cityPulse: buildCityPulse(city),
    dailyMissions: [],
    events: activeEvents,
    featuredEventId: activeEvents[0]?.id ?? '',
    eventOpportunity: {
      id: 'volunteer-support',
      title: 'Mahalle Gönüllüleri',
      description: 'Gönüllü destek fırsatı — karar sonrası açılabilir.',
      xpReward: 15,
    },
    solvedEvents: [],
    eventAdvisor: {
      body: 'Merkez hattında konteyner taşması öncelikli. Görünür olaylarda dengeli karar ver.',
      attribution: '— Deniz Erdem, Kentsel Operasyon Danışmanı',
      tokenCost: 0,
    },
    risks: [],
    abilities: [],
    dailyReport: {
      day: 1,
      title: 'Gün 1 — Operasyon Başlıyor',
      stats: [],
      rewardTitle: '—',
      rewardDescription: 'Gün sonu raporu henüz oluşmadı.',
    },
    riskSummary: { total: 0, activeThreats: 0, critical: 0 },
    operationsBrief: {
      motto: 'İlk operasyon gününde öncelik, görünür sorunları büyümeden yönetmek.',
      livePulse: [],
      advisor: {
        eyebrow: 'Danışman',
        body: 'Günaydın. İlk gün yoğun başlıyor; görünürlüğü yüksek olaylara öncelik ver.',
        attribution: '— Deniz Erdem',
      },
    },
    pilot: createDefaultPilotState(),
  };
}

export type Day1SeedBundle = {
  gameState: GameState;
  neighborhoods: Neighborhood[];
  resources: GameResources;
  eventPool: EventCard[];
  decisionHistory: DecisionRecord[];
  snapshots: DaySnapshot[];
};

export function createDay1Seed(): Day1SeedBundle {
  const activeEvents = DAY1_ACTIVE_EVENT_IDS.map(
    (id) => DAY1_EVENT_POOL.find((e) => e.id === id)!,
  );
  const gameState = buildDay1GameState(activeEvents);

  const initialSnapshot = createSnapshot({
    day: 1,
    reason: 'initial',
    metrics: {
      publicSatisfaction: gameState.city.publicSatisfaction,
      budget: gameState.city.budget,
      staffMorale: gameState.city.morale,
    },
    resources: { ...DAY1_RESOURCES },
    activeEventIds: activeEvents.map((e) => e.id),
    resolvedEventIds: [],
    xp: 0,
    level: 1,
  });

  return {
    gameState,
    neighborhoods: DAY1_NEIGHBORHOODS.map((n) => ({ ...n })),
    resources: { ...DAY1_RESOURCES },
    eventPool: DAY1_EVENT_POOL.map((e) => ({
      ...e,
      decisions: e.decisions.map((d) => ({ ...d })),
    })),
    decisionHistory: [],
    snapshots: [initialSnapshot],
  };
}
