import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport, DailyReportStat } from '@/core/models/DailyReport';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';

const LOW_SATISFACTION = 50;
const LOW_MORALE = 50;
const LOW_BUDGET = 50_000;

export type BuildDailyReportParams = {
  day: number;
  metrics: GameMetrics;
  decisionHistory: DecisionRecord[];
  activeEvents: EventCard[];
  resolvedEventIds: string[];
  snapshots: DaySnapshot[];
};

function formatCurrency(amount: number): string {
  return formatSourceWithLabel(amount);
}

function buildStats(
  metrics: GameMetrics,
  decisionsToday: number,
  resolvedToday: number,
): DailyReportStat[] {
  const stats: DailyReportStat[] = [
    {
      label: 'Karar',
      value: `${decisionsToday} adet`,
      tone: decisionsToday > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Çözülen Olay',
      value: `${resolvedToday} adet`,
      tone: resolvedToday > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Halk Memnuniyeti',
      value: `%${metrics.publicSatisfaction}`,
      tone:
        metrics.publicSatisfaction >= LOW_SATISFACTION ? 'positive' : 'negative',
    },
    {
      label: 'Kaynak',
      value: formatCurrency(metrics.budget),
      tone: metrics.budget >= LOW_BUDGET ? 'neutral' : 'negative',
    },
    {
      label: 'Personel Morali',
      value: `%${metrics.staffMorale}`,
      tone: metrics.staffMorale >= LOW_MORALE ? 'positive' : 'negative',
    },
  ];

  return stats;
}

function buildRewardTitle(
  decisionsToday: number,
  metrics: GameMetrics,
): { rewardTitle: string; rewardDescription: string } {
  if (decisionsToday === 0) {
    return {
      rewardTitle: 'Sessiz Gün',
      rewardDescription: 'Yarın saha kararlarında daha net adımlar atabilirsin.',
    };
  }

  if (metrics.publicSatisfaction >= 60 && metrics.staffMorale >= 55) {
    return {
      rewardTitle: 'Dengeli Operasyon',
      rewardDescription: 'Kaynakları kontrollü kullandın, şehir nabzı stabil.',
    };
  }

  return {
    rewardTitle: 'Saha Deneyimi',
    rewardDescription: 'Zorlu bir günü kapattın; yarın öncelikler netleşecek.',
  };
}

export function buildDailyReport(params: BuildDailyReportParams): DailyReport {
  const { day, metrics, decisionHistory, activeEvents, resolvedEventIds } =
    params;

  const decisionsToday = decisionHistory.filter((r) => r.day === day);
  const decisionsCount = decisionsToday.length;
  const resolvedToday = decisionsToday.length;
  const totalDayEvents = resolvedToday + activeEvents.length;

  const summaryLines: string[] = [];
  const warnings: string[] = [];
  const highlights: string[] = [];

  if (decisionsCount === 0) {
    summaryLines.push('Bugün operasyon merkezinden resmi bir karar çıkmadı.');
    warnings.push('Bugün operasyon kararı alınmadı.');
  } else {
    summaryLines.push(
      `Bugün ${totalDayEvents} olaydan ${resolvedToday} tanesine müdahale ettin.`,
    );
  }

  summaryLines.push(
    `Halk memnuniyeti günü %${metrics.publicSatisfaction} seviyesinde kapattı.`,
  );

  if (metrics.staffMorale < LOW_MORALE) {
    summaryLines.push(
      `Personel morali %${metrics.staffMorale} seviyesine indi; yarın vardiya kararlarında dikkatli ol.`,
    );
    warnings.push(
      'Personel morali kritik seviyede. Yarın ekip yükünü dengelemek gerekiyor.',
    );
  } else {
    summaryLines.push(
      `Personel morali günü %${metrics.staffMorale} ile tamamlandı.`,
    );
  }

  if (metrics.publicSatisfaction < LOW_SATISFACTION) {
    warnings.push(
      'Halk memnuniyeti düşük. Önümüzdeki gün görünür olaylara öncelik ver.',
    );
  }

  if (metrics.budget < LOW_BUDGET) {
    warnings.push(
      `Kaynak ${formatCurrency(metrics.budget)} seviyesinde. Harcama kalemlerini sıkı takip et.`,
    );
  }

  if (activeEvents.length > 0) {
    warnings.push(
      'Çözülmemiş olaylar sonraki gün risk oluşturabilir. Öncelik listesini güncelle.',
    );
    summaryLines.push(
      `${activeEvents.length} olay yarına taşındı; görünürlük yüksek olanlara önce bak.`,
    );
  }

  if (resolvedToday >= 2) {
    highlights.push(`${resolvedToday} olayı başarıyla kapattın.`);
  }

  if (metrics.publicSatisfaction >= 65) {
    highlights.push('Vatandaş memnuniyeti kabul edilebilir bandda kaldı.');
  }

  if (params.snapshots.length > 0) {
    highlights.push(
      `${params.snapshots.length} operasyon anlık görüntüsü kayda geçti.`,
    );
  }

  while (summaryLines.length < 3) {
    summaryLines.push(
      `Gün ${day} özeti: ${resolvedEventIds.length} olay kayıt altında çözülmüş durumda.`,
    );
  }

  const { rewardTitle, rewardDescription } = buildRewardTitle(
    decisionsCount,
    metrics,
  );

  return {
    day,
    title: `Gün ${day} Tamamlandı`,
    stats: buildStats(metrics, decisionsCount, resolvedToday),
    rewardTitle,
    rewardDescription,
    summaryLines,
    warnings,
    highlights,
    createdAt: new Date().toISOString(),
  };
}
