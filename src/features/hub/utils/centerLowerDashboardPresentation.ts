import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';

import type { CenterPortfolioItemModel } from './centerDailyCapacityPortfolioPresentation';

export type TaskFlowStepState = 'completed' | 'active' | 'locked';

export type TaskFlowStep = {
  id: string;
  title: string;
  subtitle: string;
  state: TaskFlowStepState;
};

export type StreakNodeState = 'claimed' | 'active' | 'locked';

export type StreakNode = {
  id: string;
  value: number;
  state: StreakNodeState;
};

export type ContinueOperationVariant = 'easy' | 'hard' | 'locked' | 'recommended';

export type ContinueOperationModel = {
  id: string;
  title: string;
  badge: string;
  location: string;
  progress: number;
  variant: ContinueOperationVariant;
  isLocked: boolean;
  ctaLabel?: string;
  route?: string;
};

export type CenterLowerSignalModel = {
  title: string;
  statusTitle: string;
  statusSubtitle: string;
  ctaLabel: string;
  signalStrength: number;
  authorityLine?: string;
  route: string;
};

export type CenterLowerTaskFlowModel = {
  steps: TaskFlowStep[];
  ctaLabel: string;
  route: string;
};

export type CenterLowerDailyBonusModel = {
  title: string;
  subtitle: string;
  nodes: StreakNode[];
  rewardAmount: number;
  currentDay: number;
};

export type CenterLowerContinueModel = {
  title: string;
  actionLabel: string;
  actionRoute: string;
  operations: ContinueOperationModel[];
};

export type CenterLowerDashboardModel = {
  signal: CenterLowerSignalModel;
  taskFlow: CenterLowerTaskFlowModel;
  dailyBonus: CenterLowerDailyBonusModel;
  continueSection: CenterLowerContinueModel;
};

const FALLBACK_OPERATIONS: ContinueOperationModel[] = [
  {
    id: 'roger-operation',
    title: 'Roger Operasyonu',
    badge: 'Kolay',
    location: 'Konum: Çamlıca Bölgesi',
    progress: 65,
    variant: 'easy',
    isLocked: false,
    route: '/events',
  },
  {
    id: 'next-operation',
    title: 'Yaklaşan Operasyon',
    badge: 'Zor',
    location: 'Konum: Boğaziçi Hattı',
    progress: 30,
    variant: 'hard',
    isLocked: true,
    route: '/events',
  },
];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function parseRewardAmount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDeferredPortfolioItem(item: CenterPortfolioItemModel): boolean {
  const status = item.statusLabel.toLowerCase();
  return (
    status.includes('ertel') ||
    status.includes('kapasite') ||
    status.includes('izle') ||
    !item.isActionable
  );
}

function badgeForActiveTarget(presentation: CenterHomePresentation): string {
  const priority = presentation.activeTarget.priority;
  if (priority === 'urgent') return 'Acil';
  if (priority === 'high') return 'Orta';
  return 'Kolay';
}

function locationForActiveTarget(presentation: CenterHomePresentation): string {
  const target = presentation.activeTarget;
  if (target.subtitle?.trim()) return `Konum: ${target.subtitle.trim()}`;
  if (target.categoryLabel?.trim()) return `Konum: ${target.categoryLabel.trim()}`;
  return 'Konum: Şehir merkezi';
}

function progressForActiveTarget(presentation: CenterHomePresentation): number {
  const ratio = presentation.activeTarget.progress?.progressRatio;
  if (typeof ratio === 'number' && Number.isFinite(ratio)) {
    return clampPercent(Math.round(ratio * 100));
  }
  if (presentation.activeTarget.status === 'completed') return 100;
  if (presentation.activeTarget.status === 'in_progress') return 65;
  return 30;
}

function buildSignalModel(presentation: CenterHomePresentation): CenterLowerSignalModel {
  const portfolio = presentation.portfolioSurface;
  const topSignal = presentation.operationSignals.signals[0];

  let statusTitle = 'Sinyalin güçlü';
  let statusSubtitle = 'Akış seninle.';
  let signalStrength = 88;
  let route = presentation.operationSignals.cta?.route ?? '/events';
  let authorityLine: string | undefined;

  if (portfolio.isVisible) {
    const capacityLabel = portfolio.capacityLabel ?? '';
    const capacityFull =
      /2\s*\/\s*2/.test(capacityLabel) ||
      /dolu/i.test(capacityLabel) ||
      portfolio.tone === 'warning';

    if (capacityFull) {
      statusTitle = 'Kapasite tam';
      statusSubtitle =
        portfolio.primaryTradeoffLine?.trim() ||
        portfolio.summaryLine?.trim() ||
        'Bugün seçimini netleştir.';
      signalStrength = 62;
    }

    const tradeoff = portfolio.primaryTradeoffLine?.trim();
    if (tradeoff && tradeoff.length > 0 && tradeoff.length <= 48) {
      authorityLine = tradeoff;
    }
  }

  if (topSignal) {
    if (topSignal.severity === 'urgent') {
      statusTitle = 'Sinyal yükseldi';
      statusSubtitle = topSignal.title;
      signalStrength = 58;
    } else if (topSignal.severity === 'high') {
      statusTitle = 'Sinyal dikkat çekiyor';
      statusSubtitle = topSignal.description?.trim() || topSignal.title;
      signalStrength = 72;
    } else if (statusTitle === 'Sinyalin güçlü') {
      const helper = topSignal.description?.trim() || topSignal.helperText?.trim();
      if (helper) statusSubtitle = helper;
      signalStrength = 82;
    }
    if (topSignal.route) route = topSignal.route;
  }

  return {
    title: 'SİNYAL DURUMU',
    statusTitle,
    statusSubtitle,
    ctaLabel: 'Detayları İncele',
    signalStrength,
    authorityLine,
    route,
  };
}

function buildTaskSteps(presentation: CenterHomePresentation): TaskFlowStep[] {
  const target = presentation.activeTarget;
  const activeDone = target.status === 'completed' || target.visibility === 'completed';
  const reputationUnlocked =
    activeDone || presentation.recommendedPlan.visibility !== 'empty';

  return [
    {
      id: 'discover-city',
      title: 'Şehri Tanı',
      subtitle: 'Bölge bilgilerini keşfet.',
      state: 'completed',
    },
    {
      id: 'first-target',
      title: 'İlk Hedef',
      subtitle: 'Bir operasyona başla.',
      state: activeDone ? 'completed' : 'active',
    },
    {
      id: 'grow-reputation',
      title: 'İtibarını Büyüt',
      subtitle: 'Başarıda iz bırak.',
      state: reputationUnlocked ? (activeDone ? 'active' : 'locked') : 'locked',
    },
  ];
}

function buildStreakNodes(presentation: CenterHomePresentation): StreakNode[] {
  const rewardDays = presentation.dailyReward.days.slice(0, 3);
  if (rewardDays.length >= 3) {
    const fallbackValues = [20, 40, 60];
    return rewardDays.map((day, index) => {
      const parsed = parseRewardAmount(day.rewardText);
      const state: StreakNodeState =
        day.state === 'done'
          ? 'claimed'
          : day.state === 'today'
            ? 'active'
            : 'locked';
      return {
        id: `bonus-${day.dayIndex}`,
        value: parsed ?? fallbackValues[index] ?? 20,
        state,
      };
    });
  }

  const claimed = presentation.dailyReward.claimedToday;
  return [
    { id: 'bonus-20', value: 20, state: 'claimed' },
    { id: 'bonus-40', value: 40, state: claimed ? 'claimed' : 'active' },
    { id: 'bonus-60', value: 60, state: 'locked' },
  ];
}

function portfolioItemToOperation(
  item: CenterPortfolioItemModel,
  variant: ContinueOperationVariant,
): ContinueOperationModel {
  const deferred = isDeferredPortfolioItem(item);
  const location =
    item.mapLine?.trim() ||
    (item.decisionLine?.trim() ? item.decisionLine.trim() : undefined) ||
    'Konum: Şehir hattı';

  return {
    id: item.id,
    title: item.title,
    badge: item.badgeLabel || (deferred ? 'Ertelendi' : 'Öneri'),
    location: location.startsWith('Konum:') ? location : `Konum: ${location}`,
    progress: deferred ? 30 : 55,
    variant: deferred ? 'locked' : variant,
    isLocked: deferred || !item.isActionable,
    route: item.ctaRoute ?? '/events',
  };
}

function buildContinueOperations(presentation: CenterHomePresentation): ContinueOperationModel[] {
  const operations: ContinueOperationModel[] = [];
  const target = presentation.activeTarget;

  if (target.visibility !== 'empty' && target.title.trim().length > 0) {
    const startable =
      target.cta.enabled &&
      target.cta.actionKey !== 'locked' &&
      target.cta.actionKey !== 'none';
    operations.push({
      id: target.id,
      title: target.title,
      badge: badgeForActiveTarget(presentation),
      location: locationForActiveTarget(presentation),
      progress: progressForActiveTarget(presentation),
      variant: 'easy',
      isLocked: !startable,
      ctaLabel: target.cta.label,
      route: target.cta.route ?? '/events',
    });
  }

  const portfolioItems = presentation.portfolioSurface.items;
  const deferredItem = portfolioItems.find(isDeferredPortfolioItem);
  const secondaryItem =
    deferredItem ??
    portfolioItems.find(
      (item) => item.isActionable && !operations.some((op) => op.id === item.id),
    ) ??
    portfolioItems.find((item) => !operations.some((op) => op.id === item.id));

  if (secondaryItem) {
    operations.push(
      portfolioItemToOperation(
        secondaryItem,
        deferredItem ? 'hard' : 'recommended',
      ),
    );
  }

  if (operations.length === 0) {
    return [...FALLBACK_OPERATIONS];
  }

  if (operations.length === 1) {
    const fallbackSecondary = FALLBACK_OPERATIONS[1];
    if (fallbackSecondary) operations.push({ ...fallbackSecondary });
  }

  return operations.slice(0, 2);
}

/** presentation.activeTarget ve portfolioSurface üzerinden alt dashboard modeli üretir. */
export function buildCenterLowerDashboardPresentation(
  presentation: CenterHomePresentation,
): CenterLowerDashboardModel {
  const rewardAmount =
    parseRewardAmount(presentation.dailyReward.primaryReward?.valueText) ??
    parseRewardAmount(presentation.dailyReward.nextBigReward?.valueText) ??
    100;

  return {
    signal: buildSignalModel(presentation),
    taskFlow: {
      steps: buildTaskSteps(presentation),
      ctaLabel: 'Tüm görevleri gör',
      route: presentation.recommendedPlan.cta?.route ?? '/events',
    },
    dailyBonus: {
      title: presentation.dailyReward.title || 'GÜNLÜK BONUS',
      subtitle:
        presentation.dailyReward.subtitle?.trim() || 'Serini koru, ödülleri topla!',
      nodes: buildStreakNodes(presentation),
      rewardAmount,
      currentDay: presentation.dailyReward.today.dayIndex,
    },
    continueSection: {
      title: 'DEVAM ET',
      actionLabel: 'Hepsini Gör',
      actionRoute: presentation.portfolioSurface.ctaRoute ?? '/events',
      operations: buildContinueOperations(presentation),
    },
  };
}
