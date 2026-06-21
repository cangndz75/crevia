import { formatSourceAmount } from '@/core/economy/economyFormatter';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import type { CenterActiveTarget } from './centerActiveTargetPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterHeaderSummary } from './centerHeaderPresentation';
import type { TaskFlowStep } from './centerLowerDashboardPresentation';
import type { CenterOperationSignals } from './centerOperationSignalsPresentation';

export type OperationFocusState =
  | 'recommended'
  | 'ready'
  | 'active'
  | 'completed'
  | 'locked'
  | 'warning';

export type CenterOperationRecommendedMove = {
  eyebrow: string;
  title: string;
  description: string;
  rewardLine?: string;
  unlockLine?: string;
  ctaLabel: string;
  route?: string;
  state: OperationFocusState;
  enabled: boolean;
};

export type CenterOperationStatusCardId = 'flow' | 'team' | 'signal' | 'resource';

export type CenterOperationStatusCard = {
  id: CenterOperationStatusCardId;
  title: string;
  statusLine: string;
  state: OperationFocusState;
  iconKey: string;
};

export type OperationFocusSheetLine = {
  id: string;
  label: string;
  value?: string;
  tone?: 'positive' | 'neutral' | 'warning' | 'active' | 'completed' | 'locked';
};

export type OperationFocusSheetSection = {
  id: string;
  title: string;
  lines: OperationFocusSheetLine[];
};

export type OperationFocusSheetModel = {
  title: string;
  subtitle?: string;
  sections: OperationFocusSheetSection[];
  primaryCtaLabel?: string;
  primaryCtaRoute?: string;
  secondaryCtaLabel?: string;
  secondaryCtaRoute?: string;
};

export type CenterOperationCommandPanel = {
  recommendedMove: CenterOperationRecommendedMove;
  statusCards: CenterOperationStatusCard[];
  sheets: Record<CenterOperationStatusCardId, OperationFocusSheetModel>;
};

export type BuildCenterOperationCommandPanelInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  citySummary?: CenterCitySummary | null;
  headerSummary?: CenterHeaderSummary | null;
  operationSignals?: CenterOperationSignals | null;
  rawOperationSignals?: OperationSignalsState | null;
  taskFlowSteps: TaskFlowStep[];
};

function resolveFeaturedEventRoute(gameState: GameState): string {
  const featured =
    gameState.events.find((event) => event.id === gameState.featuredEventId) ??
    gameState.events[0];
  if (featured?.id) return `/events/${featured.id}`;
  return '/events';
}

function mapTargetStatusToFocusState(status: CenterActiveTarget['status']): OperationFocusState {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'active';
    case 'locked':
      return 'locked';
    case 'empty':
      return 'ready';
    default:
      return 'recommended';
  }
}

function buildRecommendedMove(
  input: BuildCenterOperationCommandPanelInput,
): CenterOperationRecommendedMove {
  const { activeTarget, gameState } = input;
  const state = mapTargetStatusToFocusState(activeTarget.status);
  const progressImpact = activeTarget.impactPreview.find((item) => item.id === 'authority');
  const unlockImpact = activeTarget.impactPreview.find(
    (item) => item.id === 'risk' || item.id === 'trust',
  );

  let title = activeTarget.title;
  let description = activeTarget.description;
  let ctaLabel = activeTarget.cta.label;
  let route = activeTarget.cta.route ?? resolveFeaturedEventRoute(gameState);

  if (input.day <= 1 && activeTarget.status === 'ready') {
    title = 'İlk olayı çöz';
    description = 'Başlangıç akışını açmak için ilk operasyonu incele.';
    ctaLabel = 'Operasyona Git';
  }

  const rewardLine =
    input.day <= 1 && activeTarget.status !== 'completed'
      ? '+30 ilerleme'
      : progressImpact?.valueText
        ? progressImpact.valueText.startsWith('+')
          ? progressImpact.valueText
          : `+${progressImpact.valueText}`
        : activeTarget.progress?.valueText
          ? `+${activeTarget.progress.valueText}`
          : '+30 ilerleme';

  if (activeTarget.status === 'completed') {
    ctaLabel = 'Sonucu Gör';
    route = activeTarget.cta.route ?? '/reports';
    title = 'Bugünlük hedef tamamlandı';
    description = 'Sonucu değerlendirerek akışı kapatabilirsin.';
  }

  if (activeTarget.status === 'in_progress') {
    ctaLabel = 'Operasyona Git';
  }

  return {
    eyebrow: 'Önerilen Hamle',
    title,
    description,
    rewardLine,
    unlockLine: unlockImpact?.valueText ?? 'Risk kartları açılır',
    ctaLabel,
    route,
    state: state === 'ready' ? 'recommended' : state,
    enabled: activeTarget.cta.enabled,
  };
}

function buildFlowCard(steps: TaskFlowStep[]): CenterOperationStatusCard {
  const completed = steps.filter((step) => step.state === 'completed').length;
  const active = steps.some((step) => step.state === 'active');
  return {
    id: 'flow',
    title: 'Akış',
    statusLine: `${steps.length} adım · ${completed} tamam`,
    state: active ? 'active' : completed === steps.length ? 'completed' : 'ready',
    iconKey: 'git-network-outline',
  };
}

function buildTeamCard(input: BuildCenterOperationCommandPanelInput): CenterOperationStatusCard {
  if (input.day <= 1) {
    return {
      id: 'team',
      title: 'Ekip',
      statusLine: '2 ekip hazır',
      state: 'ready',
      iconKey: 'people-outline',
    };
  }

  return {
    id: 'team',
    title: 'Ekip',
    statusLine: 'Ekip durumu izleniyor',
    state: 'ready',
    iconKey: 'people-outline',
  };
}

function buildSignalCard(
  operationSignals?: CenterOperationSignals | null,
): CenterOperationStatusCard {
  const topSignal = operationSignals?.signals?.[0];
  const opportunityCount =
    operationSignals?.signals?.filter((signal) => signal.severity !== 'urgent').length ?? 3;

  if (topSignal?.severity === 'urgent') {
    return {
      id: 'signal',
      title: 'Sinyal',
      statusLine: 'Dikkat · risk yükseldi',
      state: 'warning',
      iconKey: 'pulse-outline',
    };
  }

  const strengthLabel =
    topSignal?.severity === 'high' ? 'Orta' : 'Güçlü';

  return {
    id: 'signal',
    title: 'Sinyal',
    statusLine: `${strengthLabel} · ${Math.max(1, opportunityCount)} fırsat`,
    state: 'ready',
    iconKey: 'pulse-outline',
  };
}

function buildResourceCard(
  input: BuildCenterOperationCommandPanelInput,
): CenterOperationStatusCard {
  const budgetChip = input.headerSummary?.resourceChips.find((chip) => chip.id === 'budget');
  const budgetAmount = formatSourceAmount(input.gameState.city.budget);
  const budgetText = budgetChip?.valueText ?? budgetAmount;

  const riskMetric = input.citySummary?.metrics.find((metric) => metric.id === 'risk');
  const warning = riskMetric?.tone === 'warning' || riskMetric?.tone === 'urgent';

  let pressureLabel = 'dengeli';
  if (warning) pressureLabel = 'baskı artıyor';
  else if (input.day <= 1) pressureLabel = 'baskı düşük';

  return {
    id: 'resource',
    title: 'Kaynak',
    statusLine: `${budgetText} · ${pressureLabel}`,
    state: warning ? 'warning' : 'ready',
    iconKey: 'wallet-outline',
  };
}

function buildFlowSheet(steps: TaskFlowStep[], activeTarget: CenterActiveTarget): OperationFocusSheetModel {
  const activeStep = steps.find((step) => step.state === 'active');
  const nextLine =
    activeTarget.status === 'completed'
      ? 'Günlük akış tamamlandı.'
      : activeStep
        ? `${activeStep.title} adımına odaklan.`
        : 'İlk olay sonucunu değerlendir.';

  return {
    title: 'Görev Akışı',
    subtitle: nextLine,
    sections: [
      {
        id: 'steps',
        title: 'Adımlar',
        lines: steps.map((step) => ({
          id: step.id,
          label: step.title,
          value:
            step.state === 'completed'
              ? 'Tamamlandı'
              : step.state === 'active'
                ? 'Aktif'
                : 'Bekliyor',
          tone:
            step.state === 'completed'
              ? 'completed'
              : step.state === 'active'
                ? 'active'
                : 'locked',
        })),
      },
    ],
    primaryCtaLabel: 'Sıradaki adıma git',
    primaryCtaRoute: activeTarget.cta.route ?? '/events',
    secondaryCtaLabel: 'Tüm görevleri gör',
    secondaryCtaRoute: '/events',
  };
}

function buildTeamSheet(input: BuildCenterOperationCommandPanelInput): OperationFocusSheetModel {
  const district =
    input.headerSummary?.displayCityName ??
    input.gameState.pilot.selectedDistrictId ??
    'Cumhuriyet Mahallesi';

  return {
    title: 'Ekip Yönlendirme',
    subtitle: input.day <= 1 ? '2 ekip hazır' : 'Saha ekipleri izleniyor',
    sections: [
      {
        id: 'status',
        title: 'Durum',
        lines: [
          { id: 'ready', label: 'Hazır ekip', value: '2', tone: 'positive' },
          { id: 'maint', label: 'Bakımda', value: '1', tone: 'neutral' },
          { id: 'wait', label: 'Beklemede', value: '1', tone: 'neutral' },
        ],
      },
      {
        id: 'suggested',
        title: 'Önerilen',
        lines: [
          {
            id: 'team-a',
            label: 'Temizlik Ekibi A',
            value: `→ ${district}`,
            tone: 'active',
          },
          {
            id: 'team-b',
            label: 'Destek Ekibi B',
            value: 'İlk olay sonrası hazır beklesin',
            tone: 'neutral',
          },
        ],
      },
    ],
    primaryCtaLabel: 'Hızlı Ata',
    primaryCtaRoute: '/events',
    secondaryCtaLabel: 'Detaylı Planla',
    secondaryCtaRoute: '/events',
  };
}

function buildSignalSheet(
  operationSignals?: CenterOperationSignals | null,
  activeTarget?: CenterActiveTarget,
): OperationFocusSheetModel {
  const topSignal = operationSignals?.signals?.[0];
  const strength =
    topSignal?.severity === 'urgent'
      ? 'Dikkat'
      : topSignal?.severity === 'high'
        ? 'Orta'
        : 'Güçlü';

  return {
    title: 'Sinyal Durumu',
    subtitle: strength,
    sections: [
      {
        id: 'risk',
        title: 'Risk',
        lines: [
          {
            id: 'risk-line',
            label: topSignal?.severity === 'urgent' ? 'Kaynak baskısı yükseldi' : 'Kaynak baskısı düşük',
            tone: topSignal?.severity === 'urgent' ? 'warning' : 'positive',
          },
        ],
      },
      {
        id: 'opportunity',
        title: 'Fırsat',
        lines: [
          {
            id: 'opp-line',
            label: 'İlk olay çözülürse mahalle güveni artar.',
            tone: 'positive',
          },
        ],
      },
      {
        id: 'advice',
        title: 'Öneri',
        lines: [
          {
            id: 'advice-line',
            label:
              activeTarget?.status === 'completed'
                ? 'Sonucu değerlendirerek akışı tamamla.'
                : 'Önce düşük riskli başlangıç olayını çöz.',
            tone: 'active',
          },
        ],
      },
    ],
    primaryCtaLabel: 'Detayları İncele',
    primaryCtaRoute: operationSignals?.cta?.route ?? '/events',
  };
}

function buildResourceSheet(input: BuildCenterOperationCommandPanelInput): OperationFocusSheetModel {
  const budgetChip = input.headerSummary?.resourceChips.find((chip) => chip.id === 'budget');
  const budgetText = budgetChip?.valueText ?? formatSourceAmount(input.gameState.city.budget);
  const warning =
    input.citySummary?.metrics.find((metric) => metric.id === 'risk')?.tone === 'warning';

  return {
    title: 'Kaynak Dengesi',
    subtitle: `${budgetText} kaynak`,
    sections: [
      {
        id: 'spend',
        title: 'Bugünkü tahmini harcama',
        lines: [
          { id: 'event', label: 'İlk olay', value: 'düşük', tone: 'positive' },
          { id: 'team', label: 'Ekip yönlendirme', value: 'orta', tone: 'neutral' },
          { id: 'risk', label: 'Risk müdahalesi', value: 'değişken', tone: 'warning' },
        ],
      },
      {
        id: 'status',
        title: 'Durum',
        lines: [
          {
            id: 'balance',
            label: warning ? 'Baskı artıyor, harcamayı izle.' : 'Başlangıç için yeterli.',
            tone: warning ? 'warning' : 'positive',
          },
        ],
      },
    ],
    primaryCtaLabel: 'Kaynak Detayı',
    primaryCtaRoute: '/events',
  };
}

export function buildCenterOperationCommandPanel(
  input: BuildCenterOperationCommandPanelInput,
): CenterOperationCommandPanel {
  const statusCards = [
    buildFlowCard(input.taskFlowSteps),
    buildTeamCard(input),
    buildSignalCard(input.operationSignals),
    buildResourceCard(input),
  ];

  return {
    recommendedMove: buildRecommendedMove(input),
    statusCards,
    sheets: {
      flow: buildFlowSheet(input.taskFlowSteps, input.activeTarget),
      team: buildTeamSheet(input),
      signal: buildSignalSheet(input.operationSignals, input.activeTarget),
      resource: buildResourceSheet(input),
    },
  };
}
