import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import type {
  MainOperationDistrictStatus,
  MainOperationGoalDomain,
  MainOperationSeasonGoal,
  MainOperationSeasonId,
} from './mainOperationTypes';

export const MAIN_OPERATION_SEASON_ID: MainOperationSeasonId =
  'main_operation_season_1';
export const MAIN_OPERATION_SEASON_LENGTH_DAYS = 14;
export const MAIN_OPERATION_FIRST_CITY_DAY = POST_PILOT_FIRST_OPERATION_DAY;

export const MAIN_OPERATION_DISTRICT_IDS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const MAX_LIGHT_MAIN_OPERATION_EVENTS = 2;
export const MAX_FULL_MAIN_OPERATION_EVENTS = 3;
export const MAX_FULL_MAIN_OPERATION_EVENTS_DAY8 = 2;

export const FULL_MAIN_ANCHOR_COUNT = 1;
export const FULL_MAIN_SIDE_COUNT = 2;

export const MAIN_OPERATION_UI_COPY = {
  hubTitle: 'Ana Operasyon',
  seasonSubtitle: 'Sezon 1: Şehir Yönetimi',
  accessFull: 'Ana Operasyon aktif',
  accessLimited: 'Sınırlı gündem',
  scopeExpanded: 'Şehir kapsamı genişledi',
  scopeDetailFull:
    'Sınırlı gündemden farklı olarak daha fazla mahalle sinyali izlenir',
  goalsTracked: 'Tam erişimde sezon hedefleri takip edilir',
  limitedFooter:
    'Sınırlı gündem aktif. Ana operasyon hedefleri tam kapsamda izlenmez.',
  fullFooter:
    'Ana Operasyon aktif. Sezon hedefleri ve mahalle kapsamı izleniyor.',
  reportTitle: 'Ana Operasyon Sezonu',
  reportFooter:
    'Yarınki plan sezon hedeflerine göre yeniden şekillenir.',
  hubCtaFull: 'Sezon Hedeflerini İncele',
  hubCtaLimited: 'Ana Operasyon Kapsamını Gör',
  previewActive: 'Ana Operasyon aktif',
  previewGoalsLine: 'Sezon hedefleri ve mahalle kapsamı izleniyor.',
} as const;

export const MAIN_OPERATION_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
  'paywall',
] as const;

const DISTRICT_SUMMARIES: Record<MapDistrictId, string> = {
  merkez: 'Merkez hatları ve yoğun cadde akışı',
  cumhuriyet: 'Konut blokları ve günlük toplama ritmi',
  sanayi: 'Sanayi bölgesi ve lojistik baskısı',
  istasyon: 'İstasyon çevresi ve geçiş yoğunluğu',
  yesilvadi: 'Yeşilvadi park hattı ve sakin sokaklar',
};

export function getMainOperationDistrictSummary(districtId: MapDistrictId): string {
  return DISTRICT_SUMMARIES[districtId];
}

type DistrictScheduleEntry = {
  fromSeasonDay: number;
  status: MainOperationDistrictStatus;
};

const FULL_ACCESS_DISTRICT_SCHEDULE: Record<MapDistrictId, DistrictScheduleEntry[]> =
  {
    merkez: [{ fromSeasonDay: 1, status: 'active' }],
    cumhuriyet: [{ fromSeasonDay: 1, status: 'active' }],
    istasyon: [{ fromSeasonDay: 1, status: 'active' }],
    sanayi: [
      { fromSeasonDay: 1, status: 'agenda' },
      { fromSeasonDay: 3, status: 'active' },
    ],
    yesilvadi: [
      { fromSeasonDay: 1, status: 'preview' },
      { fromSeasonDay: 5, status: 'agenda' },
      { fromSeasonDay: 7, status: 'active' },
    ],
  };

const LIMITED_ACCESS_DISTRICT_SCHEDULE: Record<
  MapDistrictId,
  DistrictScheduleEntry[]
> = {
  merkez: [{ fromSeasonDay: 1, status: 'active' }],
  cumhuriyet: [
    { fromSeasonDay: 1, status: 'agenda' },
    { fromSeasonDay: 2, status: 'active' },
  ],
  istasyon: [{ fromSeasonDay: 1, status: 'preview' }],
  sanayi: [{ fromSeasonDay: 1, status: 'preview' }],
  yesilvadi: [{ fromSeasonDay: 1, status: 'preview' }],
};

export function resolveDistrictStatusForSeasonDay(
  districtId: MapDistrictId,
  seasonDay: number,
  accessMode: 'limited' | 'full',
): MainOperationDistrictStatus {
  const schedule =
    accessMode === 'full'
      ? FULL_ACCESS_DISTRICT_SCHEDULE[districtId]
      : LIMITED_ACCESS_DISTRICT_SCHEDULE[districtId];
  let status: MainOperationDistrictStatus = 'inactive';
  for (const entry of schedule) {
    if (seasonDay >= entry.fromSeasonDay) {
      status = entry.status;
    }
  }
  return status;
}

export function createInitialSeasonGoals(): MainOperationSeasonGoal[] {
  const defs: Array<{
    id: string;
    domain: MainOperationGoalDomain;
    title: string;
    description: string;
  }> = [
    {
      id: 'goal_city_balance',
      domain: 'city_balance',
      title: 'Şehir Dengesini Koru',
      description:
        'Genel operasyon baskısını sezon boyunca kritik eşiğin altında tut.',
    },
    {
      id: 'goal_districts',
      domain: 'districts',
      title: 'Mahalle Kapsamını Güçlendir',
      description:
        'Aktif mahallelerde baskıyı düşür ve gündeme gelen bölgeleri hazırla.',
    },
    {
      id: 'goal_vehicles',
      domain: 'vehicles',
      title: 'Filo Baskısını Kontrol Et',
      description: 'Araç riskini yükseltmeden saha akışını sürdür.',
    },
    {
      id: 'goal_assignments',
      domain: 'assignments',
      title: 'Güçlü Saha Atamaları Yap',
      description: 'Olaylarda ekip, araç ve yaklaşım uyumunu yüksek tut.',
    },
  ];

  return defs.map((d) => ({
    ...d,
    progress: 0,
    target: 100,
    status: 'active' as const,
    sourceTags: ['main_operation_season_1'],
  }));
}

export const MAIN_OPERATION_GOAL_DOMAINS_TRACKED: MainOperationGoalDomain[] = [
  'city_balance',
  'districts',
  'vehicles',
  'assignments',
];
