import type { EventCard } from '@/core/models/EventCard';
import {
  buildInspectHeroChips,
  formatEventRemainingLabel,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPresentation';

export type PlanOptionId = 'balanced' | 'fast' | 'economy';

export type PlanOption = {
  id: PlanOptionId;
  title: string;
  durationLabel: string;
  successLabel: string;
  costNote: string;
  extraNote?: string;
};

export type PlanDetail = {
  title: string;
  team: string;
  vehicle: string;
  durationLabel: string;
  successLabel: string;
  costLabel: string;
  note: string;
  summaryLine: string;
  isRecommended?: boolean;
};

export type PlanScreenModel = {
  priorityLabel: string;
  remainingLabel: string;
  recommendedOptionId: PlanOptionId;
  options: PlanOption[];
  planByOption: Record<PlanOptionId, PlanDetail>;
};

/** Özet satırı + CTA — scroll padding (hint yok) */
export const PLAN_WORKFLOW_FOOTER_EXTRA = 44;

function formatTry(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR')}`;
}

function buildSummaryLine(duration: string, cost: number, successPct: number): string {
  return `${duration} · ${formatTry(cost)} · Başarı %${successPct}`;
}

function isMarketCleanupEvent(event: EventCard): boolean {
  const t = event.title.toLowerCase();
  return (
    t.includes('temizlik') ||
    t.includes('pazar') ||
    event.category.toLowerCase().includes('temizlik') ||
    event.eventType === 'waste' ||
    event.eventType === 'market'
  );
}

function buildMarketCleanupPlan(event: EventCard): PlanScreenModel {
  const chips = buildInspectHeroChips(event);

  const planByOption: Record<PlanOptionId, PlanDetail> = {
    balanced: {
      title: 'Dengeli Temizlik Planı',
      team: 'Temizlik Ekibi A',
      vehicle: 'Hizmet Aracı 2',
      durationLabel: '2s 30dk',
      successLabel: '%94',
      costLabel: formatTry(16800),
      note: 'Pazar yoğunluğu dağılmadan saha ekibini yönlendirmek en güvenli seçenek.',
      summaryLine: buildSummaryLine('2s 30dk', 16800, 94),
      isRecommended: true,
    },
    fast: {
      title: 'Hızlı Müdahale Planı',
      team: 'Temizlik Ekibi A + B',
      vehicle: 'Hizmet Aracı 1',
      durationLabel: '1s 40dk',
      successLabel: '%86',
      costLabel: formatTry(22400),
      note: 'Ekstra vardiya ile süre kısalır; personel yorgunluğu artar.',
      summaryLine: buildSummaryLine('1s 40dk', 22400, 86),
    },
    economy: {
      title: 'Düşük Maliyet Planı',
      team: 'Temizlik Ekibi A',
      vehicle: 'Yaya ekip',
      durationLabel: '3s 20dk',
      successLabel: '%78',
      costLabel: formatTry(9800),
      note: 'Minimum kaynakla tamamlanır; saha riski biraz yükselir.',
      summaryLine: buildSummaryLine('3s 20dk', 9800, 78),
    },
  };

  return {
    priorityLabel: chips.priority,
    remainingLabel: chips.remaining,
    recommendedOptionId: 'balanced',
    options: [
      {
        id: 'balanced',
        title: 'Dengeli Plan',
        durationLabel: '2s 30dk',
        successLabel: '%94',
        costNote: 'maliyet orta',
      },
      {
        id: 'fast',
        title: 'Hızlı Müdahale',
        durationLabel: '1s 40dk',
        successLabel: '%86',
        costNote: 'maliyet yüksek',
        extraNote: 'personel yorgunluğu yüksek',
      },
      {
        id: 'economy',
        title: 'Düşük Maliyet',
        durationLabel: '3s 20dk',
        successLabel: '%78',
        costNote: 'maliyet düşük',
      },
    ],
    planByOption,
  };
}

function buildGenericPlan(event: EventCard): PlanScreenModel {
  const chips = buildInspectHeroChips(event);
  const hours = Math.max(1, Math.round(event.urgencyHours));
  const duration = formatEventRemainingLabel(hours).replace(' kaldı', '');
  const success = event.riskLevel === 'critical' ? 82 : event.riskLevel === 'high' ? 88 : 92;
  const cost = event.riskLevel === 'low' ? 12000 : 16800;

  const planByOption: Record<PlanOptionId, PlanDetail> = {
    balanced: {
      title: 'Dengeli Operasyon Planı',
      team: 'Saha Ekibi 1',
      vehicle: 'Hizmet Aracı',
      durationLabel: duration,
      successLabel: `%${success}`,
      costLabel: formatTry(cost),
      note: 'Kaynak ve süre dengesi korunarak müdahale planlanır.',
      summaryLine: buildSummaryLine(duration, cost, success),
      isRecommended: true,
    },
    fast: {
      title: 'Hızlı Müdahale Planı',
      team: 'Saha Ekibi 1 + 2',
      vehicle: 'Hizmet Aracı',
      durationLabel: duration,
      successLabel: `%${Math.max(70, success - 8)}`,
      costLabel: formatTry(Math.round(cost * 1.3)),
      note: 'Öncelikli kaynak tahsisi ile süre kısaltılır.',
      summaryLine: buildSummaryLine(duration, Math.round(cost * 1.3), Math.max(70, success - 8)),
    },
    economy: {
      title: 'Düşük Maliyet Planı',
      team: 'Saha Ekibi 1',
      vehicle: 'Yaya ekip',
      durationLabel: duration,
      successLabel: `%${Math.max(65, success - 14)}`,
      costLabel: formatTry(Math.round(cost * 0.65)),
      note: 'Minimum kaynakla tamamlanır; risk biraz artabilir.',
      summaryLine: buildSummaryLine(
        duration,
        Math.round(cost * 0.65),
        Math.max(65, success - 14),
      ),
    },
  };

  return {
    priorityLabel: chips.priority,
    remainingLabel: chips.remaining,
    recommendedOptionId: 'balanced',
    options: [
      {
        id: 'balanced',
        title: 'Dengeli Plan',
        durationLabel: planByOption.balanced.durationLabel,
        successLabel: planByOption.balanced.successLabel,
        costNote: 'maliyet orta',
      },
      {
        id: 'fast',
        title: 'Hızlı Müdahale',
        durationLabel: planByOption.fast.durationLabel,
        successLabel: planByOption.fast.successLabel,
        costNote: 'maliyet yüksek',
        extraNote: 'personel yorgunluğu yüksek',
      },
      {
        id: 'economy',
        title: 'Düşük Maliyet',
        durationLabel: planByOption.economy.durationLabel,
        successLabel: planByOption.economy.successLabel,
        costNote: 'maliyet düşük',
      },
    ],
    planByOption,
  };
}

export function buildPlanScreenModel(event: EventCard): PlanScreenModel {
  if (isMarketCleanupEvent(event)) {
    return buildMarketCleanupPlan(event);
  }
  return buildGenericPlan(event);
}

export { resolveInspectDistrictId };
