import { buildAuthorityPermissionPreviewSummary } from '@/core/authority/authorityPermissionPreviewModel';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { buildBadgeShowcaseSummary } from '@/core/badges/badgeShowcaseModel';
import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import {
  selectDailyGoalsForHub,
  selectPrimaryDailyGoal,
} from '@/core/dailyGoals/dailyGoalSelectors';
import type { DailyGoal, DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import { buildDistrictOperationUnlockBindingSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { buildAuthorityPermissionsTabViewModel } from '@/features/progression/utils/authorityPermissionsTabPresentation';
import { buildCollectionHeroModel } from '@/features/progression/utils/authorityCollectionPresentation';
import { deriveAuthoritiesScreenModel } from '@/features/progression/utils/authoritiesScreenModel';
import type { ProgressionIconName } from '@/core/content/progressionRoadmap';
import type { PlayerStylePresentationCard } from '@/core/playerStyle/playerStyleTypes';
import type { GrowthPeriodFocusCardPresentation } from '@/core/periodGoals';
import {
  buildPlayerStyleInputFromStrategyContext,
  buildPlayerStylePresentationCard,
  buildPlayerStyleProfile,
} from '@/core/playerStyle';
import {
  buildGrowthPeriodFocusCard,
  buildPeriodGoalContextFromReport,
} from '@/core/periodGoals';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';

export type GrowthHeaderModel = {
  title: string;
  subtitle: string;
  playerName: string;
  role: string;
  level: number;
  metaLine: string;
  resourceLabel: string;
  xp: number;
  xpTarget: number;
  xpProgress: number;
  nextReward: GrowthNextRewardModel;
};

export type GrowthNextRewardModel = {
  label: string;
  title: string;
  xpCurrent: number;
  xpTarget: number;
  progress: number;
};

export type GrowthAuthorityProgressModel = {
  title: string;
  subtitle: string;
  unlockedCount: number;
  totalCount: number;
  progress: number;
  impactPercent: string;
  nextAuthorityTitle: string;
  ctaLabel: string;
};

export type GrowthRecentAuthorityCard = {
  id: string;
  title: string;
  description: string;
  unlockedLabel: string;
  icon: ProgressionIconName;
};

export type GrowthNextTargetModel = {
  title: string;
  rewardTitle: string;
  description: string;
  xpCurrent: number;
  xpTarget: number;
  progress: number;
  rewardXpLabel: string;
};

export type GrowthDailyTaskModel = {
  id: string;
  title: string;
  progressLabel: string;
  progress: number;
  rewardLabel: string;
  completed: boolean;
};

export type GrowthBadgeHeroModel = {
  title: string;
  countLabel: string;
  progress: number;
  subtitle: string;
};

export type GrowthUnlockHeroModel = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export type GrowthNextUnlockModel = {
  title: string;
  conditionLabel: string;
  currentLabel: string;
  targetLabel: string;
  progress: number;
};

export type GrowthAuthoritiesTabModel = {
  authorityProgress: GrowthAuthorityProgressModel;
  recentAuthorities: GrowthRecentAuthorityCard[];
  nextTarget: GrowthNextTargetModel;
  dailyTasks: GrowthDailyTaskModel[];
};

export type GrowthBadgesTabModel = {
  hero: GrowthBadgeHeroModel;
  badgeItems: BadgeShowcaseItem[];
};

export type GrowthExpansionsTabModel = {
  hero: GrowthUnlockHeroModel;
  countLabel: string;
  districtItems: DistrictUnlockBindingItem[];
  nextUnlock: GrowthNextUnlockModel;
};

export type GrowthScreenPresentation = {
  header: GrowthHeaderModel;
  managerStyle: PlayerStylePresentationCard;
  periodFocus: GrowthPeriodFocusCardPresentation;
  authoritiesTab: GrowthAuthoritiesTabModel;
  badgesTab: GrowthBadgesTabModel;
  expansionsTab: GrowthExpansionsTabModel;
};

function resolveProgressionIcon(iconKey?: string): ProgressionIconName {
  const allowed: ProgressionIconName[] = [
    'shield-checkmark-outline',
    'calendar-outline',
    'location-outline',
    'map-outline',
    'medkit-outline',
    'bar-chart-outline',
  ];
  if (iconKey && allowed.includes(iconKey as ProgressionIconName)) {
    return iconKey as ProgressionIconName;
  }
  return 'shield-checkmark-outline';
}

const FALLBACK_NEXT_REWARD_TITLE = 'Mahalle Güven Kartları';
const FALLBACK_DAILY_TASK_TITLE = '1 operasyonu başarıyla tamamla';

const FALLBACK_RECENT_AUTHORITIES: GrowthRecentAuthorityCard[] = [
  {
    id: 'basic-event-inspect',
    title: 'Temel Olay İnceleme',
    description: 'Olayları detaylı incele ve raporla.',
    unlockedLabel: 'Açıldı: Bugün',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'daily-plan-preview',
    title: 'Günlük Plan Önizlemesi',
    description: 'Günlük planı önceden gör ve hazırla.',
    unlockedLabel: 'Açıldı: Bugün',
    icon: 'calendar-outline',
  },
  {
    id: 'neighborhood-memory',
    title: 'Mahalle Hafıza İzi',
    description: 'Mahalle geçmişini gör ve analiz et.',
    unlockedLabel: 'Açıldı: 1 gün önce',
    icon: 'location-outline',
  },
];

const FALLBACK_BADGE_TITLES = [
  'İlk Müdahale',
  'Pilot Bölge',
  'Güven Toparlayıcı',
  'Planlayıcı',
  'Kaynak Koruyucu',
  'Operasyon Serisi',
] as const;

function formatUnlockedLabel(pilotDay: number, index: number): string {
  if (index === 0) return 'Açıldı: Bugün';
  if (index === 1) return 'Açıldı: Bugün';
  if (pilotDay > 1) return 'Açıldı: 1 gün önce';
  return 'Açıldı: Yakında';
}

function mapDailyGoalToTask(goal: DailyGoal): GrowthDailyTaskModel {
  const target = goal.targetValue ?? 1;
  const current = goal.currentValue ?? (goal.isCompleted ? target : 0);
  return {
    id: goal.id,
    title: goal.title || goal.shortLabel,
    progressLabel: `${Math.min(current, target)} / ${target}`,
    progress: goal.progressPercent / 100,
    rewardLabel: goal.rewardXp ? `+${goal.rewardXp} XP` : goal.rewardText ?? '+25 XP',
    completed: goal.isCompleted,
  };
}

function buildFallbackDailyTasks(): GrowthDailyTaskModel[] {
  return [
    {
      id: 'fallback-operation',
      title: FALLBACK_DAILY_TASK_TITLE,
      progressLabel: '1 / 1',
      progress: 1,
      rewardLabel: '+25 XP',
      completed: true,
    },
  ];
}

const FALLBACK_BADGE_IDS: BadgeShowcaseItem['id'][] = [
  'first_step',
  'steady_operator',
  'public_listener',
  'budget_guardian',
  'team_caretaker',
  'crisis_cooler',
];

function buildFallbackBadgeItems(_pilotDay: number): BadgeShowcaseItem[] {
  return FALLBACK_BADGE_TITLES.map((title, index) => ({
    id: FALLBACK_BADGE_IDS[index] ?? 'first_step',
    title,
    description:
      index === 1
        ? 'İlk saha kararlarının etkisi burada izlenir.'
        : 'Şehirde bıraktığın izi rozet vitrininde takip et.',
    state: (index === 0 ? 'in_progress' : 'locked') as BadgeShowcaseItem['state'],
    statePillLabel: index === 0 ? 'Aktif' : index === 1 ? 'Yakında' : 'Kilitli',
    rarity: 'common' as const,
    category: 'operations' as const,
    categoryLabel: 'Operasyon',
    iconKey: 'ribbon-outline',
    prestigeBandLabel: 'Pilot',
    progressLabel: index === 1 ? '2 / 3 tamamlandı' : undefined,
    progressRatio: index === 1 ? 2 / 3 : index === 0 ? 0.35 : 0,
    unlockHint: index === 1 ? 'Ödül: 250 XP' : undefined,
    systemTag: 'Saha',
    styleSignal: 'Saha etkisi',
    detailTitle: title,
    detailBody: 'Rozet ilerlemesi saha kararlarından beslenir.',
    ctaLabel: 'Detay',
  }));
}

function resolveNextRewardTitle(
  authoritySummary: ReturnType<typeof buildAuthorityPermissionPreviewSummary>,
  permissionsVm: ReturnType<typeof buildAuthorityPermissionsTabViewModel>,
): string {
  return (
    authoritySummary.nextUnlocks[0]?.title ??
    permissionsVm.managementCard.nextRewardLabel ??
    FALLBACK_NEXT_REWARD_TITLE
  );
}

export type BuildGrowthScreenPresentationInput = {
  totalXp: number;
  pilotDay: number;
  gameDay: number;
  playerName: string;
  role: string;
  level: number;
  metaLine: string;
  resourceLabel: string;
  xp: number;
  xpTarget: number;
  xpProgress: number;
  authorityState: unknown;
  badgeState: unknown;
  dailyGoalState: DailyGoalState | null;
  mainOperationSeason?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
  decisionHistory?: Array<{
    day?: number;
    decisionLabel?: string;
    eventTitle?: string;
  }>;
  strategyHistory?: StrategyHistoryStateV1 | null;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
  socialPulseState?: SocialPulseState | null;
};

export function buildGrowthScreenPresentation(
  input: BuildGrowthScreenPresentationInput,
): GrowthScreenPresentation {
  const pilotDay = Math.max(1, input.pilotDay);
  const authorityState = normalizeAuthorityState(
    input.authorityState ?? createInitialAuthorityState(pilotDay),
    pilotDay,
  );

  const authoritySummary = buildAuthorityPermissionPreviewSummary({
    authorityState,
    xp: input.totalXp,
    day: pilotDay,
  });
  const permissionsVm = buildAuthorityPermissionsTabViewModel({
    authorityState,
    pilotDay,
    totalXp: input.totalXp,
  });
  const screenModel = deriveAuthoritiesScreenModel(input.totalXp, pilotDay);
  const badgeSummary = buildBadgeShowcaseSummary(input.badgeState, pilotDay);
  const collectionHero = buildCollectionHeroModel(input.badgeState, pilotDay, {
    collected: screenModel.collectionCollected,
    total: screenModel.collectionTotal,
    progress: screenModel.collectionProgress,
  });
  const districtSummary = buildDistrictOperationUnlockBindingSummary({
    currentDay: input.gameDay,
    pilotDay,
    authorityState,
    mainOperationSeason: input.mainOperationSeason,
    operationSignals: input.operationSignals,
    socialPulse: input.socialPulse,
  });

  const nextRewardTitle = resolveNextRewardTitle(authoritySummary, permissionsVm);
  const totalAuthorities = permissionsVm.statusCounts.open +
    permissionsVm.statusCounts.ready +
    permissionsVm.statusCounts.next +
    permissionsVm.statusCounts.locked;
  const unlockedAuthorities = permissionsVm.statusCounts.open + permissionsVm.statusCounts.ready;

  const openItems = permissionsVm.gridItems.filter((item) => item.displayState === 'open');
  const recentFromData: GrowthRecentAuthorityCard[] = openItems.slice(0, 3).map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.playerBenefit ?? item.description ?? 'Yeni yetki açıldı.',
    unlockedLabel: formatUnlockedLabel(pilotDay, index),
    icon: resolveProgressionIcon(item.iconKey),
  }));
  const recentAuthorities =
    recentFromData.length >= 2 ? recentFromData : FALLBACK_RECENT_AUTHORITIES;

  const dailyGoals = selectDailyGoalsForHub(input.dailyGoalState);
  const dailyTasks =
    dailyGoals.length > 0
      ? dailyGoals.map(mapDailyGoalToTask)
      : buildFallbackDailyTasks();

  const primaryGoal = selectPrimaryDailyGoal(input.dailyGoalState);
  const rewardXp = primaryGoal?.rewardXp ?? 100;

  const impactMatch = permissionsVm.managementCard.impactValue.match(/\d+/);
  const impactPercent = impactMatch ? `%${impactMatch[0]}` : '%23';

  const nextDistrict =
    districtSummary.allDistrictItems.find((item) => item.state === 'next') ??
    districtSummary.allDistrictItems.find((item) => item.state === 'locked');
  const impactValue = parseInt(impactMatch?.[0] ?? '23', 10);
  const nextUnlockTarget = Math.min(100, impactValue + 7);

  const badgeItems =
    badgeSummary.allItems.length > 0
      ? badgeSummary.allItems.slice(0, 6)
      : buildFallbackBadgeItems(pilotDay);

  const visibleDistrictItems = [
    ...districtSummary.allDistrictItems.filter((item) => item.state !== 'locked').slice(0, 3),
    ...districtSummary.allDistrictItems.filter((item) => item.state === 'locked').slice(0, 2),
  ].slice(0, 5);

  const playerStyleProfile = buildPlayerStyleProfile(
    buildPlayerStyleInputFromStrategyContext({
      day: input.gameDay,
      surface: 'debug',
      decisionHistory: input.decisionHistory,
      strategyHistory: input.strategyHistory,
      dominantStrategy: input.dominantStrategy,
    }),
  );
  const managerStyle = buildPlayerStylePresentationCard(playerStyleProfile);

  const periodFocusContext = buildPeriodGoalContextFromReport({
    day: input.gameDay,
    maintenanceBacklogRuntime: input.maintenanceBacklogRuntime,
    socialPulseState: input.socialPulseState,
    playerStyleId: playerStyleProfile.styleId,
    decisionHistory: input.decisionHistory,
  });
  const periodFocus = buildGrowthPeriodFocusCard(
    periodFocusContext,
    managerStyle.shortLabel || managerStyle.label,
  );

  return {
    header: {
      title: 'Gelişim',
      subtitle: 'Yetkilerini aç, şehrini güçlendir.',
      playerName: input.playerName,
      role: input.role,
      level: input.level,
      metaLine: input.metaLine,
      resourceLabel: input.resourceLabel,
      xp: input.xp,
      xpTarget: input.xpTarget,
      xpProgress: input.xpProgress,
      nextReward: {
        label: 'Sıradaki Ödül',
        title: nextRewardTitle,
        xpCurrent: input.xp,
        xpTarget: input.xpTarget,
        progress: input.xpProgress,
      },
    },
    managerStyle,
    periodFocus,
    authoritiesTab: {
      authorityProgress: {
        title: 'Yetki İlerlemesi',
        subtitle: 'Şehrini yönetme gücün her gün artıyor.',
        unlockedCount: unlockedAuthorities,
        totalCount: totalAuthorities > 0 ? totalAuthorities : 22,
        progress: totalAuthorities > 0 ? unlockedAuthorities / totalAuthorities : 5 / 22,
        impactPercent,
        nextAuthorityTitle: nextRewardTitle,
        ctaLabel: 'Yetki Ağacını Gör',
      },
      recentAuthorities,
      nextTarget: {
        title: 'Hedefe Doğru',
        rewardTitle: nextRewardTitle,
        description:
          authoritySummary.nextUnlocks[0]?.description ??
          'Mahalle güven seviyelerini detaylı görüntüleme ve yönetme yetkisi.',
        xpCurrent: input.xp,
        xpTarget: input.xpTarget,
        progress: input.xpProgress,
        rewardXpLabel: `+${rewardXp} XP`,
      },
      dailyTasks,
    },
    badgesTab: {
      hero: {
        title: 'Koleksiyon İlerlemesi',
        countLabel: collectionHero.countLabel,
        progress: collectionHero.progress,
        subtitle:
          'Rozet vitrini, şehirde bıraktığın izi gösterir.',
      },
      badgeItems,
    },
    expansionsTab: {
      hero: {
        title: 'Şehir Gelişim Ağı',
        subtitle:
          'Şehrini güçlendir, operasyonlarını genişlet, etkinliğini artır.',
        ctaLabel: 'Açılım Haritasını Gör',
      },
      countLabel: `Aktif ${districtSummary.activeDistrictCount} / ${districtSummary.totalDistrictCount}`,
      districtItems:
        visibleDistrictItems.length > 0
          ? visibleDistrictItems
          : districtSummary.allDistrictItems.slice(0, 5),
      nextUnlock: {
        title: nextDistrict?.title ?? 'Mahalle Hafıza İzi',
        conditionLabel: `Gereken Koşul: Toplam Etki %${nextUnlockTarget}`,
        currentLabel: impactPercent,
        targetLabel: `%${nextUnlockTarget}`,
        progress: Math.min(1, impactValue / nextUnlockTarget),
      },
    },
  };
}
