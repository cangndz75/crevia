import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport, DailyReportStat } from '@/core/models/DailyReport';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import { buildDailyContainerSummaryLines } from '@/core/containers/containerUiHelpers';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { PersonnelDayReport } from '@/core/personnel/personnelTypes';
import { buildDailyVehicleSummaryLines } from '@/core/vehicles/vehicleUiHelpers';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { buildDailySocialSummaryLines } from '@/features/social/utils/socialReportModel';
import { buildDailyGoalReportResults } from '@/core/dailyGoals/dailyGoalPresentation';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import {
  buildNeighborhoodIdentityReportLine,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { NeighborhoodReportStatus } from '@/core/neighborhoodIdentity/neighborhoodIdentityTypes';
import type { DailyPriorityReportResult } from '@/core/dailyPriority/dailyPriorityTypes';

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
  personnelReport?: PersonnelDayReport | null;
  /** Gün kapanışı sonrası konteyner durumu (varsa özet satırları üretilir). */
  containerState?: ContainerState;
  /** Gün kapanışı sonrası araç filosu (varsa özet satırları üretilir). */
  vehicleState?: VehicleState;
  /** Gün kapanışı sonrası sosyal nabız (snapshot — canlı store kullanılmaz). */
  socialPulseState?: SocialPulseState;
  /** Gün kapanışı öncesi sosyal nabız — skor delta satırı için. */
  socialPulseStateBefore?: SocialPulseState | null;
  /** Gün kapanışı günlük hedef durumu — snapshot. */
  dailyGoalState?: DailyGoalState | null;
  /** Gün sonu günlük öncelik sonucu — snapshot. */
  dailyPriorityResult?: DailyPriorityReportResult | null;
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

function reportStatusFromMetrics(metrics: GameMetrics): NeighborhoodReportStatus {
  const risk = 'riskScore' in metrics ? Number(metrics.riskScore) : 50;
  if (metrics.publicSatisfaction >= 60 && risk < 55) {
    return 'good';
  }
  if (metrics.publicSatisfaction >= 45) {
    return 'warning';
  }
  return 'critical';
}

function resolveFocalNeighborhoodId(
  decisionsToday: DecisionRecord[],
  activeEvents: EventCard[],
): string | null {
  const fromDecision = decisionsToday.find((d) => d.neighborhoodId)?.neighborhoodId;
  if (fromDecision) {
    return normalizeNeighborhoodId(fromDecision);
  }
  const fromEvent =
    activeEvents[0]?.neighborhoodId ?? activeEvents[0]?.district ?? null;
  return normalizeNeighborhoodId(fromEvent);
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

  const personnelSummaryMax = 4;
  const personnelSummaryLines: string[] = [];
  if (params.personnelReport) {
    const incidentCap = 2;
    const incidentLines = (params.personnelReport.incidentLines ?? []).slice(
      0,
      incidentCap,
    );
    const incidentLineSet = new Set(incidentLines);

    for (const line of incidentLines) {
      personnelSummaryLines.push(line);
    }

    const summarySlotCount = Math.min(
      2,
      personnelSummaryMax - incidentLines.length,
    );
    const nonDuplicateSummaryLines = (
      params.personnelReport.summaryLines ?? []
    ).filter((line) => !incidentLineSet.has(line));

    for (const line of nonDuplicateSummaryLines.slice(0, summarySlotCount)) {
      personnelSummaryLines.push(line);
    }
    const warningLine = params.personnelReport.warnings[0];
    if (warningLine) {
      personnelSummaryLines.push(warningLine);
    }
    const highlightLine = params.personnelReport.highlights[0];
    if (highlightLine) {
      personnelSummaryLines.push(highlightLine);
    }
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

  const containerSummaryLines = buildDailyContainerSummaryLines(
    params.containerState,
    day,
  );

  const vehicleSummaryLines = buildDailyVehicleSummaryLines(params.vehicleState);

  const socialSummaryLines =
    params.socialPulseState != null
      ? buildDailySocialSummaryLines(params.socialPulseState, {
          day,
          previousSocialPulseState: params.socialPulseStateBefore,
        })
      : [];

  const dailyGoalResults = buildDailyGoalReportResults(params.dailyGoalState);

  const focalNeighborhoodId = resolveFocalNeighborhoodId(
    decisionsToday,
    activeEvents,
  );
  const neighborhoodIdentityLine = buildNeighborhoodIdentityReportLine({
    neighborhoodId: focalNeighborhoodId,
    status: reportStatusFromMetrics(metrics),
  });

  return {
    day,
    title: `Gün ${day} Tamamlandı`,
    stats: buildStats(metrics, decisionsCount, resolvedToday),
    rewardTitle,
    rewardDescription,
    summaryLines,
    neighborhoodIdentityLine: neighborhoodIdentityLine ?? undefined,
    warnings,
    highlights,
    personnelSummaryLines: personnelSummaryLines.slice(0, personnelSummaryMax),
    containerSummaryLines:
      containerSummaryLines && containerSummaryLines.length > 0
        ? containerSummaryLines
        : undefined,
    vehicleSummaryLines:
      vehicleSummaryLines.length > 0 ? vehicleSummaryLines : undefined,
    socialSummaryLines:
      socialSummaryLines.length > 0 ? socialSummaryLines : undefined,
    dailyGoalResults:
      dailyGoalResults.length > 0 ? dailyGoalResults : undefined,
    dailyPriorityResult: params.dailyPriorityResult ?? undefined,
    createdAt: new Date().toISOString(),
  };
}
