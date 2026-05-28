import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import type { PilotDayRole, PilotRhythmPlan } from './pilotRhythmTypes';

const DAY_ROLES: PilotDayRole[] = [
  'tutorial',
  'first_pressure',
  'resource_split',
  'social_visibility',
  'opportunity',
  'butterfly_seed',
  'final_stress',
];

/** Simülasyon / mahalle çeşitliliği için gün bazlı pilot bölge rotasyonu. */
export const RHYTHM_PILOT_DISTRICT_BY_DAY: Record<number, PilotDistrictId> = {
  1: 'central',
  2: 'cumhuriyet',
  3: 'industrial_market',
  4: 'central',
  5: 'cumhuriyet',
  6: 'industrial_market',
  7: 'central',
};

export const PILOT_RHYTHM_PLANS: PilotRhythmPlan[] = [
  {
    day: 1,
    role: 'tutorial',
    title: 'Öğretme',
    description: 'Temel karar döngüsü; Day 1 anchor korunur.',
    intensity: 'low',
    preferredCategories: [],
    eventSlots: [
      {
        slot: 'main',
        required: true,
        preferredCategories: [],
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 1,
    maxOpportunityEvents: 0,
    maxSignalEvents: 0,
    notes: ['Tutorial anchor dokunulmaz', 'Mahalle zorlaması yok'],
  },
  {
    day: 2,
    role: 'first_pressure',
    title: 'İlk Baskı',
    description: 'İlk gerçek mahalle baskısı; günlük öncelik hissi başlar.',
    intensity: 'medium',
    preferredCategories: [
      'citizen_complaint',
      'waste_container',
      'social_pressure',
    ],
    preferredNeighborhoods: ['cumhuriyet', 'merkez'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'main',
        required: true,
        preferredCategories: ['citizen_complaint', 'waste_container'],
        preferredNeighborhoods: ['cumhuriyet', 'merkez'],
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['social_pressure', 'waste_container'],
        maxCount: 1,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 1,
    maxOpportunityEvents: 0,
    maxSignalEvents: 0,
    notes: ['En az 2 mahalle hedefi', 'Tek mahalleye kilitlenme'],
  },
  {
    day: 3,
    role: 'resource_split',
    title: 'Kaynak Bölme',
    description: 'Personel, araç, konteyner ve bütçe tradeoff günü.',
    intensity: 'high',
    preferredCategories: [
      'waste_container',
      'vehicle_route',
      'personnel_morale',
      'maintenance',
    ],
    preferredNeighborhoods: ['sanayi', 'istasyon', 'cumhuriyet'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'main',
        required: true,
        preferredCategories: ['waste_container', 'vehicle_route'],
        preferredNeighborhoods: ['sanayi', 'istasyon'],
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['personnel_morale', 'maintenance'],
        maxCount: 2,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 2,
    maxOpportunityEvents: 0,
    maxSignalEvents: 1,
    notes: ['Sanayi veya İstasyon operasyon baskısı görünmeli'],
  },
  {
    day: 4,
    role: 'social_visibility',
    title: 'Sosyal Görünürlük',
    description: 'Sosyal baskı ve görünürlük öne çıkar.',
    intensity: 'high',
    preferredCategories: [
      'social_pressure',
      'citizen_complaint',
      'noise',
      'sidewalk_occupation',
      'community_support',
    ],
    discouragedCategories: ['vehicle_route'],
    preferredNeighborhoods: ['merkez', 'yesilvadi', 'cumhuriyet'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'social',
        required: true,
        preferredCategories: ['social_pressure', 'citizen_complaint'],
        preferredPriorityKeys: ['public_relief'],
        preferredNeighborhoods: ['merkez', 'yesilvadi'],
        maxCount: 2,
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['noise', 'community_support'],
        maxCount: 2,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 2,
    maxOpportunityEvents: 0,
    maxSignalEvents: 0,
    notes: ['En az 1 sosyal baskı eventi', 'Öncelik ne olursa olsun sosyal his'],
  },
  {
    day: 5,
    role: 'opportunity',
    title: 'Fırsat Günü',
    description: 'Avantaj, nefes ve stratejik fırsat.',
    intensity: 'medium',
    preferredCategories: [
      'opportunity',
      'community_support',
      'permanent_solution',
      'maintenance',
    ],
    preferredNeighborhoods: ['cumhuriyet', 'yesilvadi', 'merkez'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'opportunity',
        required: true,
        preferredCategories: ['opportunity', 'community_support'],
        maxCount: 1,
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['permanent_solution', 'maintenance'],
        maxCount: 2,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 2,
    maxOpportunityEvents: 1,
    maxSignalEvents: 0,
    notes: ['En az 1 opportunity slot'],
  },
  {
    day: 6,
    role: 'butterfly_seed',
    title: 'Kelebek Tohumu',
    description: 'Önceki baskıların yankısı; aktif hook zinciri yok.',
    intensity: 'high',
    preferredCategories: [
      'butterfly',
      'permanent_solution',
      'inspection_gap',
      'vehicle_route',
      'social_pressure',
      'waste_container',
    ],
    preferredNeighborhoods: ['merkez', 'sanayi', 'istasyon'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'follow_up',
        required: true,
        preferredCategories: [
          'butterfly',
          'permanent_solution',
          'inspection_gap',
          'social_pressure',
        ],
        maxCount: 1,
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['waste_container', 'vehicle_route'],
        maxCount: 2,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 2,
    maxOpportunityEvents: 0,
    maxSignalEvents: 0,
    notes: ['Butterfly profile yoksa permanent/inspection fallback'],
  },
  {
    day: 7,
    role: 'final_stress',
    title: 'Final Stres Testi',
    description: 'Pilot finali öncesi dengeli stres; performans ölçümü.',
    intensity: 'peak',
    preferredCategories: [
      'waste_container',
      'social_pressure',
      'vehicle_route',
      'personnel_morale',
      'permanent_solution',
    ],
    preferredNeighborhoods: ['merkez', 'sanayi', 'cumhuriyet', 'istasyon'],
    requiredNeighborhoodSpread: 2,
    eventSlots: [
      {
        slot: 'final',
        required: true,
        preferredCategories: ['waste_container', 'social_pressure'],
        minSeverity: 'high',
        preferredNeighborhoods: ['merkez', 'sanayi'],
      },
      {
        slot: 'side',
        required: true,
        preferredCategories: ['vehicle_route', 'personnel_morale'],
        maxCount: 1,
      },
      {
        slot: 'signal',
        required: false,
        preferredCategories: ['waste_container', 'vehicle_route'],
        allowSignals: true,
        maxCount: 1,
      },
    ],
    maxMainEvents: 1,
    maxSideEvents: 1,
    maxOpportunityEvents: 0,
    maxSignalEvents: 1,
    notes: ['Unfair spike yok', 'Category spam yok'],
  },
];

export const BUTTERFLY_SEED_FALLBACK_CATEGORIES = [
  'permanent_solution',
  'inspection_gap',
  'social_pressure',
  'waste_container',
] as const;

export function getRhythmPilotDistrictForDay(day: number): PilotDistrictId {
  const clamped = Math.min(7, Math.max(1, day));
  return RHYTHM_PILOT_DISTRICT_BY_DAY[clamped] ?? 'central';
}

export function getPilotDayRole(day: number): PilotDayRole {
  const plan = PILOT_RHYTHM_PLANS.find((p) => p.day === day);
  if (plan) {
    return plan.role;
  }
  const index = Math.min(6, Math.max(0, day - 1));
  return DAY_ROLES[index] ?? 'tutorial';
}

export function getPilotRhythmPlan(day: number): PilotRhythmPlan {
  const clamped = Math.min(7, Math.max(1, day));
  const found = PILOT_RHYTHM_PLANS.find((p) => p.day === clamped);
  if (found) {
    return found;
  }
  return PILOT_RHYTHM_PLANS[0]!;
}
