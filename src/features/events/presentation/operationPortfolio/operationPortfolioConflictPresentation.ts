import type { DailyCapacityPortfolioResult, OperationPortfolioItem } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { buildPortfolioReadinessWarning } from '@/core/readinessStrategicPriority/readinessSurfaceBridge';

import type {
  OperationPortfolioConflictPresentation,
  OperationPortfolioConflictSignal,
} from './operationPortfolioTypes';

const MAX_CONFLICTS_DAY1 = 1;
const MAX_CONFLICTS_RICH = 3;

function clampLine(value: string, max = 88): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function teamConflict(
  items: OperationPortfolioItem[],
  operationSignals?: OperationSignalsState | null,
): OperationPortfolioConflictSignal | null {
  const highRiskDistricts = items.filter((item) => item.pressureLevel === 'high' && item.districtId);
  const districtSet = new Set(highRiskDistricts.map((item) => item.districtId));
  if (highRiskDistricts.length >= 2 && districtSet.size >= 2) {
    return {
      id: 'conflict_team_split',
      line: 'Aynı ekip iki yüksek riskli bölgede bekleniyor.',
      tone: 'warning',
    };
  }
  if (operationSignals?.personnel?.status === 'strained' && highRiskDistricts.length >= 1) {
    return {
      id: 'conflict_team_strain',
      line: 'Ekip gerilirken hızlı müdahale zinciri riskli.',
      tone: 'warning',
    };
  }
  return null;
}

function vehicleConflict(
  items: OperationPortfolioItem[],
  operationSignals?: OperationSignalsState | null,
  maintenanceLine?: string | null,
): OperationPortfolioConflictSignal | null {
  const routeHeavy = items.filter(
    (item) => item.kind === 'route_pressure' || item.capacityCost.vehicle >= 2,
  );
  if (
    (operationSignals?.vehicles?.status === 'strained' || maintenanceLine) &&
    routeHeavy.length >= 1
  ) {
    return {
      id: 'conflict_vehicle_readiness',
      line: 'Araç hazırlığı düşükken hızlı müdahale zinciri riskli.',
      tone: 'warning',
    };
  }
  return null;
}

function socialConflict(items: OperationPortfolioItem[]): OperationPortfolioConflictSignal | null {
  const socialDistricts = items.filter(
    (item) =>
      item.kind === 'social_pressure' ||
      item.capacityCost.social >= 2 ||
      item.deferRisk === 'social_reaction_may_grow',
  );
  const districts = new Set(socialDistricts.map((item) => item.districtId).filter(Boolean));
  if (socialDistricts.length >= 2 && districts.size >= 2) {
    return {
      id: 'conflict_social_stack',
      line: 'Sosyal baskısı yüksek iki mahalle aynı güne yığılmış.',
      tone: 'critical',
    };
  }
  return null;
}

function maintenanceConflict(
  items: OperationPortfolioItem[],
  maintenanceLine?: string | null,
): OperationPortfolioConflictSignal | null {
  const maintenanceItems = items.filter((item) => item.kind === 'maintenance_warning');
  if (maintenanceLine && (maintenanceItems.length >= 1 || items.some((item) => item.deferRisk === 'route_may_strain'))) {
    return {
      id: 'conflict_maintenance_defer',
      line: 'Bakım planı ertelenirse yarın saha verimi düşebilir.',
      tone: 'warning',
    };
  }
  return null;
}

function readinessPortfolioConflict(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  operationSignals?: OperationSignalsState | null;
}): OperationPortfolioConflictSignal | null {
  if (input.day <= 1) return null;

  const visibleCount = input.portfolio.items.filter((i) => i.visibilityLevel !== 'hidden').length;
  const snapshot = buildOperationReadinessSnapshot({
    phase: 'hub',
    day: input.day,
    eventRiskLevel: visibleCount >= 2 ? 'high' : 'medium',
    hasVehicle: input.operationSignals?.vehicles?.status !== 'strained',
  });

  const warning = buildPortfolioReadinessWarning({
    day: input.day,
    readinessSnapshot: snapshot,
    operationsToday: visibleCount,
    portfolioConflict: visibleCount >= 2,
  });

  if (warning.visibility !== 'visible' || !warning.warningLine) return null;

  return {
    id: 'conflict_readiness_priority',
    line: warning.warningLine,
    tone: warning.tone === 'critical' ? 'critical' : 'warning',
  };
}

export function buildOperationPortfolioConflictPresentation(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  operationSignals?: OperationSignalsState | null;
  maintenanceLine?: string | null;
}): OperationPortfolioConflictPresentation {
  const maxSignals = input.day <= 1 ? MAX_CONFLICTS_DAY1 : MAX_CONFLICTS_RICH;
  const visibleItems = input.portfolio.items.filter((item) => item.visibilityLevel !== 'hidden');

  if (input.day <= 1) {
    return { visible: false, badgeCount: 0, signals: [] };
  }

  const candidates = [
    readinessPortfolioConflict(input),
    teamConflict(visibleItems, input.operationSignals),
    vehicleConflict(visibleItems, input.operationSignals, input.maintenanceLine),
    socialConflict(visibleItems),
    maintenanceConflict(visibleItems, input.maintenanceLine),
  ].filter((signal): signal is OperationPortfolioConflictSignal => Boolean(signal));

  const bounded = candidates.slice(0, maxSignals).map((signal) => ({
    ...signal,
    line: clampLine(signal.line),
  }));

  return {
    visible: bounded.length > 0,
    badgeCount: bounded.length,
    signals: bounded,
  };
}
