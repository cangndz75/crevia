import type { DailyCapacityPortfolioResult } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { ResourcePressureDifferentiationResult } from '@/core/resourcePressureDifferentiation';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import type { OperationPortfolioCapacityPresentation } from './operationPortfolioTypes';

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0.08, Math.min(0.95, value));
}

function capacitySummaryLine(input: {
  day: number;
  safeCount: number;
  riskyCount: number;
  slotLimit: number;
}): string {
  if (input.day <= 1) {
    return 'Bugün tek operasyonla başla; kapasite sakin.';
  }
  if (input.riskyCount <= 0) {
    return `Bugün ${input.safeCount} operasyon güvenli görünüyor.`;
  }
  return `Bugün ${input.safeCount} operasyon güvenli, ${input.riskyCount} operasyon riskli.`;
}

function signalBandScore(status: string | undefined): number {
  if (status === 'critical' || status === 'strained') return 0.78;
  if (status === 'watch') return 0.55;
  return 0.35;
}

export function buildOperationPortfolioCapacityPresentation(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  operationSignals?: OperationSignalsState | null;
  resourcePressure?: ResourcePressureDifferentiationResult | null;
  maintenanceLine?: string | null;
}): OperationPortfolioCapacityPresentation {
  const { summary, selectedItems, items } = input.portfolio;
  const slotLimit = Math.max(1, summary.operationSlotLimit);
  const usedSlots = Math.min(slotLimit, summary.selectedItemCount || selectedItems.length);
  const meterRatio = clampRatio(usedSlots / slotLimit);

  const visibleItems = items.filter((item) => item.visibilityLevel !== 'hidden');
  const riskyCount = visibleItems.filter(
    (item) => item.pressureLevel === 'high' || item.deferRisk === 'trust_may_drop',
  ).length;
  const safeCount = Math.max(0, Math.min(visibleItems.length, slotLimit) - Math.min(riskyCount, slotLimit));

  const chips = [];
  const personnelStatus = input.operationSignals?.personnel?.status;
  const vehicleStatus = input.operationSignals?.vehicles?.status;
  const overallStatus = input.operationSignals?.overall?.status;

  chips.push({
    id: 'capacity_team',
    label:
      personnelStatus === 'strained'
        ? 'Ekip geriliyor'
        : personnelStatus === 'watch'
          ? 'Ekip izleniyor'
          : 'Ekip',
    tone: personnelStatus === 'strained' ? ('amber' as const) : ('teal' as const),
  });

  chips.push({
    id: 'capacity_vehicle',
    label:
      vehicleStatus === 'strained'
        ? 'Araç sınırlı'
        : vehicleStatus === 'watch'
          ? 'Araç izleniyor'
          : 'Araç',
    tone: vehicleStatus === 'strained' ? ('amber' as const) : ('teal' as const),
  });

  const maintenanceProfile = input.resourcePressure?.profiles.find(
    (profile) =>
      profile.domain === 'vehicle_strain_pressure' || profile.domain === 'team_capacity_pressure',
  );
  const readinessStrained =
    Boolean(input.maintenanceLine?.trim()) ||
    maintenanceProfile?.intensity === 'high' ||
    overallStatus === 'strained';
  chips.push({
    id: 'capacity_readiness',
    label: readinessStrained ? 'Bakım baskısı' : 'Hazırlık',
    tone: readinessStrained ? ('warning' as const) : ('sage' as const),
  });

  const signalLoad =
    signalBandScore(input.operationSignals?.personnel?.status) * 0.34 +
    signalBandScore(input.operationSignals?.vehicles?.status) * 0.33 +
    signalBandScore(input.operationSignals?.overall?.status) * 0.33;
  const adjustedRatio = clampRatio((meterRatio + signalLoad) / 2);

  return {
    visible: input.day >= 1,
    meterRatio: input.day <= 1 ? 0.35 : adjustedRatio,
    meterLabel:
      input.day <= 1
        ? '1 operasyon'
        : `${usedSlots}/${slotLimit} slot`,
    chips: chips.slice(0, 3),
    summaryLine: capacitySummaryLine({
      day: input.day,
      safeCount: Math.max(safeCount, input.day <= 1 ? 1 : 0),
      riskyCount: input.day <= 1 ? 0 : riskyCount,
      slotLimit,
    }),
  };
}
