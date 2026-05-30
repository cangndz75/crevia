import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type {
  PlanDetail,
  PlanOption,
  PlanOptionId,
  PlanScreenModel,
} from '@/features/events/utils/eventWorkflowPlanPresentation';
import { derivePlanMetrics } from '@/features/events/utils/eventWorkflowPlanDetails';

export type PlanDisplayTone = 'mint' | 'teal' | 'gold';

export type PlanDisplayOption = {
  id: PlanOptionId;
  title: string;
  description: string;
  iconName: ComponentProps<typeof Ionicons>['name'];
  tone: PlanDisplayTone;
  durationLabel: string;
  successLabel: string;
  effectLabel: string;
};

export type PlanSummaryUi = {
  duration: string;
  cost: string;
  success: string;
};

export type PlanDetailTabId = 'resource' | 'personnel' | 'citizen';

export type PlanDetailMetric = {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

/** Kart listesi sırası — referans: Hızlı → Dengeli → Stratejik */
export const PLAN_OPTION_DISPLAY_ORDER: PlanOptionId[] = [
  'fast',
  'balanced',
  'economy',
];

const PLAN_UI_BY_ID: Record<
  PlanOptionId,
  Omit<PlanDisplayOption, 'id'> & {
    fallbackSummary: PlanSummaryUi;
  }
> = {
  fast: {
    title: 'Hızlı Plan',
    description: 'Hızlı sonuçlar için kısa vadeli hamleler.',
    iconName: 'leaf-outline',
    tone: 'mint',
    durationLabel: '1–2 Gün',
    successLabel: '%78 Başarı',
    effectLabel: 'Hızlı Etki',
    fallbackSummary: {
      duration: '1–2 Gün',
      cost: '₺17.900',
      success: '%78',
    },
  },
  balanced: {
    title: 'Dengeli Plan',
    description: 'Kaynak ve zamanı dengeli kullanan plan.',
    iconName: 'scale-outline',
    tone: 'teal',
    durationLabel: '2–4 Gün',
    successLabel: '%92 Başarı',
    effectLabel: 'Dengeli Etki',
    fallbackSummary: {
      duration: '2–4 Gün',
      cost: '₺16.800',
      success: '%92',
    },
  },
  economy: {
    title: 'Stratejik Plan',
    description: 'Uzun vadeli sürdürülebilir dönüşüm.',
    iconName: 'locate-outline',
    tone: 'gold',
    durationLabel: '5–7 Gün',
    successLabel: '%86 Başarı',
    effectLabel: 'Uzun Vadeli',
    fallbackSummary: {
      duration: '5–7 Gün',
      cost: '₺14.200',
      success: '%86',
    },
  },
};

const TONE_STYLES: Record<
  PlanDisplayTone,
  {
    iconCircle: string;
    iconColor: string;
    pillBg: string;
    pillText: string;
  }
> = {
  mint: {
    iconCircle: '#E8F6F1',
    iconColor: '#0F8F86',
    pillBg: '#DDF5EE',
    pillText: '#0F8F86',
  },
  teal: {
    iconCircle: '#DDF5EE',
    iconColor: '#006B63',
    pillBg: '#DDF5EE',
    pillText: '#006B63',
  },
  gold: {
    iconCircle: '#FFF6E0',
    iconColor: '#D59A14',
    pillBg: '#FFF1C9',
    pillText: '#B8860B',
  },
};

export function getPlanDisplayToneStyle(tone: PlanDisplayTone) {
  return TONE_STYLES[tone];
}

function parseSuccessForCard(successLabel: string): string {
  const trimmed = successLabel.trim();
  if (trimmed.includes('Başarı')) return trimmed;
  return trimmed.startsWith('%') ? `${trimmed} Başarı` : `%${trimmed} Başarı`;
}

export function buildPlanDisplayOption(
  option: PlanOption,
  plan: PlanDetail,
): PlanDisplayOption {
  const ui = PLAN_UI_BY_ID[option.id];
  return {
    id: option.id,
    title: ui.title,
    description: ui.description,
    iconName: ui.iconName,
    tone: ui.tone,
    durationLabel: ui.durationLabel,
    successLabel: parseSuccessForCard(plan.successLabel),
    effectLabel: ui.effectLabel,
  };
}

export function buildPlanDisplayOptions(
  model: PlanScreenModel,
): PlanDisplayOption[] {
  return PLAN_OPTION_DISPLAY_ORDER.map((id) => {
    const option = model.options.find((o) => o.id === id);
    if (!option) {
      const { fallbackSummary: _omit, ...ui } = PLAN_UI_BY_ID[id];
      return { id, ...ui };
    }
    return buildPlanDisplayOption(option, model.planByOption[id]);
  });
}

function normalizeSuccessLabel(successLabel: string): string {
  const trimmed = successLabel.trim();
  return trimmed.startsWith('%') ? trimmed : `%${trimmed}`;
}

function resolveDurationLabel(planId: PlanOptionId, plan: PlanDetail): string {
  const fallback = PLAN_UI_BY_ID[planId].fallbackSummary.duration;
  const raw = plan.durationLabel.trim();
  if (!raw) return fallback;
  if (raw.includes('Gün') || raw.includes('–') || raw.includes('-')) {
    return raw.replace(/\s*kaldı$/i, '');
  }
  return fallback;
}

export function buildPlanSummaryUi(
  planId: PlanOptionId,
  plan: PlanDetail,
): PlanSummaryUi {
  const fallback = PLAN_UI_BY_ID[planId].fallbackSummary;
  const cost = plan.costLabel?.trim() || fallback.cost;
  const success = normalizeSuccessLabel(plan.successLabel || fallback.success);
  const duration = resolveDurationLabel(planId, plan);
  return { duration, cost, success };
}

function materialLevel(planId: PlanOptionId): string {
  if (planId === 'fast') return 'Yüksek';
  if (planId === 'economy') return 'Düşük';
  return 'Orta';
}

function fuelLevel(planId: PlanOptionId): string {
  if (planId === 'fast') return 'Yüksek';
  if (planId === 'economy') return 'Düşük';
  return 'Orta';
}

function readinessLabel(planId: PlanOptionId, teamFit: string): string {
  if (planId === 'fast') return 'Hızlı';
  if (teamFit.toLowerCase().includes('yüksek')) return 'Yüksek';
  if (teamFit.toLowerCase().includes('orta')) return 'Orta';
  return 'Hazır';
}

function shortTeamLabel(team: string): string {
  const first = team.split(/[+·]/)[0]?.trim() ?? team;
  if (first.length <= 14) return first;
  return `${first.slice(0, 12)}…`;
}

export function buildPlanDetailTabMetrics(
  tabId: PlanDetailTabId,
  planId: PlanOptionId,
  plan: PlanDetail,
): PlanDetailMetric[] {
  const m = derivePlanMetrics(plan, planId);
  const summary = buildPlanSummaryUi(planId, plan);

  if (tabId === 'resource') {
    return [
      { label: 'Bütçe', value: plan.costLabel, icon: 'wallet-outline' },
      { label: 'Malzeme', value: materialLevel(planId), icon: 'construct-outline' },
      { label: 'Yakıt', value: fuelLevel(planId), icon: 'speedometer-outline' },
      { label: 'Süre', value: summary.duration, icon: 'time-outline' },
    ];
  }

  if (tabId === 'personnel') {
    return [
      { label: 'Ekip', value: shortTeamLabel(plan.team), icon: 'people-outline' },
      {
        label: 'Yorgunluk',
        value: `%${m.fatiguePct}`,
        icon: 'fitness-outline',
      },
      { label: 'Moral', value: capitalizeMetric(m.moraleImpact), icon: 'happy-outline' },
      {
        label: 'Hazırlık',
        value: readinessLabel(planId, m.teamFit),
        icon: 'shield-checkmark-outline',
      },
    ];
  }

  return [
    {
      label: 'Memnuniyet',
      value: capitalizeMetric(m.satisfaction),
      icon: 'heart-outline',
    },
    {
      label: 'Şikayet',
      value: capitalizeMetric(m.complaintPressure),
      icon: 'chatbubble-ellipses-outline',
    },
    { label: 'Algı', value: capitalizeMetric(m.perception), icon: 'eye-outline' },
    {
      label: 'Kapsam',
      value: shortCoverage(m.coverage),
      icon: 'map-outline',
    },
  ];
}

function capitalizeMetric(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shortCoverage(coverage: string): string {
  const parts = coverage.split('/');
  const head = parts[0]?.trim() ?? coverage;
  if (head.length <= 12) return head;
  return `${head.slice(0, 10)}…`;
}
