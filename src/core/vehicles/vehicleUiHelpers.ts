import { colors } from '@/ui/theme/colors';

import { isVehicleUnitCritical } from './vehicleSeed';
import type { VehicleState, VehicleUnit } from './vehicleTypes';

const MAX_VEHICLE_REPORT_LINES = 3;

export type VehicleFleetStatusTone = 'good' | 'warning' | 'danger' | 'neutral';

export type VehicleFleetStatusViewModel = {
  title: string;
  statusLabel: string;
  statusTone: VehicleFleetStatusTone;
  summaryText: string;
  availableText: string;
  workloadText: string;
  routeText: string;
  maintenanceText: string;
  criticalCount: number;
  brokenCount: number;
  availableCount: number;
  totalCount: number;
  averageWorkload: number;
  averageRouteEfficiency: number;
  averageBreakdownRisk: number;
};

export type VehicleFleetToneColors = {
  background: string;
  border: string;
  text: string;
  muted: string;
  chipBackground: string;
  chipText: string;
  iconBackground: string;
  iconColor: string;
};

const FLEET_STATUS_TONES: Record<VehicleFleetStatusTone, VehicleFleetToneColors> = {
  good: {
    background: '#E8F7F0',
    border: 'rgba(59, 175, 122, 0.28)',
    text: '#1F5E45',
    muted: '#4A7D66',
    chipBackground: 'rgba(59, 175, 122, 0.18)',
    chipText: '#2F9B6A',
    iconBackground: 'rgba(59, 175, 122, 0.18)',
    iconColor: '#2F9B6A',
  },
  warning: {
    background: '#FDF4E6',
    border: 'rgba(232, 155, 46, 0.35)',
    text: '#6B4A12',
    muted: '#8A6A2E',
    chipBackground: 'rgba(232, 155, 46, 0.2)',
    chipText: '#C8841A',
    iconBackground: 'rgba(232, 155, 46, 0.2)',
    iconColor: '#C8841A',
  },
  danger: {
    background: colors.dangerMuted,
    border: 'rgba(224, 90, 82, 0.35)',
    text: '#7A2E28',
    muted: '#9A4A44',
    chipBackground: 'rgba(224, 90, 82, 0.18)',
    chipText: colors.danger,
    iconBackground: 'rgba(224, 90, 82, 0.18)',
    iconColor: colors.danger,
  },
  neutral: {
    background: colors.backgroundAlt,
    border: colors.border,
    text: colors.textPrimary,
    muted: colors.textSecondary,
    chipBackground: colors.primaryMuted,
    chipText: colors.primary,
    iconBackground: colors.primaryMuted,
    iconColor: colors.primary,
  },
};

const VEHICLE_FLEET_THRESHOLDS = {
  averageWorkload: 65,
  availableLow: 2,
  strongRouteEfficiency: 78,
  calmBreakdownRisk: 35,
  criticalDangerCount: 2,
} as const;

const VEHICLE_REPORT_THRESHOLDS = {
  averageBreakdownRisk: 50,
  averageWorkload: 65,
  availableLow: 2,
  averageCondition: 55,
  strongRouteEfficiency: 78,
  calmBreakdownRisk: 35,
  sensitiveVehicleBreakdownRisk: 45,
} as const;

function tryPushLine(lines: string[], line: string): void {
  if (lines.length >= MAX_VEHICLE_REPORT_LINES) {
    return;
  }
  if (!lines.includes(line)) {
    lines.push(line);
  }
}

function findMostSensitiveVehicle(units: VehicleUnit[]): VehicleUnit | null {
  if (units.length === 0) {
    return null;
  }

  const ranked = [...units].sort((a, b) => {
    const aScore = a.breakdownRisk + a.maintenanceNeed + (100 - a.condition);
    const bScore = b.breakdownRisk + b.maintenanceNeed + (100 - b.condition);
    return bScore - aScore;
  });

  return ranked[0] ?? null;
}

function shouldShowSensitiveVehicleLine(
  vehicleState: VehicleState,
  aggregates: VehicleState['aggregates'],
): boolean {
  if (
    aggregates.broken > 0 ||
    aggregates.criticalCount > 0 ||
    aggregates.averageBreakdownRisk >= VEHICLE_REPORT_THRESHOLDS.averageBreakdownRisk
  ) {
    return true;
  }

  return vehicleState.units.some(
    (unit) =>
      isVehicleUnitCritical(unit) ||
      unit.breakdownRisk >= VEHICLE_REPORT_THRESHOLDS.sensitiveVehicleBreakdownRisk,
  );
}

/** Gün sonu raporu için en fazla 3 operasyonel satır (snapshot vehicle state). */
export function buildDailyVehicleSummaryLines(
  vehicleState: VehicleState | null | undefined,
): string[] {
  if (!vehicleState || vehicleState.units.length === 0) {
    return [];
  }

  const { aggregates, units } = vehicleState;
  const lines: string[] = [];

  if (aggregates.broken > 0) {
    tryPushLine(
      lines,
      `${aggregates.broken} araç arızalı durumda; saha kapasitesi düşebilir.`,
    );
  }

  if (aggregates.criticalCount > 0) {
    tryPushLine(
      lines,
      `${aggregates.criticalCount} araç kritik bakım eşiğinde; bakım planı geciktirilmemeli.`,
    );
  }

  if (aggregates.averageBreakdownRisk >= VEHICLE_REPORT_THRESHOLDS.averageBreakdownRisk) {
    tryPushLine(
      lines,
      'Filo arıza riski yükseliyor; yoğun görevlendirmeler dikkat istiyor.',
    );
  }

  if (aggregates.averageWorkload >= VEHICLE_REPORT_THRESHOLDS.averageWorkload) {
    tryPushLine(
      lines,
      'Araç yükü yüksek; yarın rota ve görev dağılımı daha dikkatli yapılmalı.',
    );
  }

  if (aggregates.available <= VEHICLE_REPORT_THRESHOLDS.availableLow) {
    tryPushLine(
      lines,
      'Müsait araç sayısı düşük; yeni saha kararlarında kapasite riski var.',
    );
  }

  if (aggregates.averageCondition <= VEHICLE_REPORT_THRESHOLDS.averageCondition) {
    tryPushLine(
      lines,
      'Filo kondisyonu zayıflıyor; bakım kararları daha değerli hale geldi.',
    );
  }

  if (
    lines.length < MAX_VEHICLE_REPORT_LINES &&
    aggregates.averageRouteEfficiency >=
      VEHICLE_REPORT_THRESHOLDS.strongRouteEfficiency &&
    aggregates.averageBreakdownRisk < VEHICLE_REPORT_THRESHOLDS.calmBreakdownRisk
  ) {
    tryPushLine(lines, 'Rota verimi güçlü; filo günü dengeli kapattı.');
  }

  if (shouldShowSensitiveVehicleLine(vehicleState, aggregates)) {
    const sensitive = findMostSensitiveVehicle(units);
    if (
      sensitive &&
      sensitive.breakdownRisk >= VEHICLE_REPORT_THRESHOLDS.sensitiveVehicleBreakdownRisk
    ) {
      tryPushLine(
        lines,
        `En hassas araç: ${sensitive.name} · risk ${sensitive.breakdownRisk}/100`,
      );
    }
  }

  if (lines.length === 0) {
    lines.push('Araç filosu dengeli seyrini korudu.');
  }

  return lines.slice(0, MAX_VEHICLE_REPORT_LINES);
}

export function getVehicleFleetToneColors(
  tone: VehicleFleetStatusTone,
): VehicleFleetToneColors {
  return FLEET_STATUS_TONES[tone];
}

/** Hub araç filosu kartı için canlı durum özeti — state mutate etmez. */
export function buildVehicleFleetStatus(
  vehicleState: VehicleState | null | undefined,
): VehicleFleetStatusViewModel {
  const title = 'Araç Filosu';

  if (!vehicleState || vehicleState.units.length === 0) {
    return {
      title,
      statusLabel: 'Dengeli',
      statusTone: 'neutral',
      summaryText: 'Araç filosu dengeli durumda.',
      availableText: '0/0 müsait',
      workloadText: 'Yük %0',
      routeText: 'Rota %0',
      maintenanceText: 'Risk %0',
      criticalCount: 0,
      brokenCount: 0,
      availableCount: 0,
      totalCount: 0,
      averageWorkload: 0,
      averageRouteEfficiency: 0,
      averageBreakdownRisk: 0,
    };
  }

  const { aggregates } = vehicleState;
  const availableCount = aggregates.available;
  const totalCount = aggregates.total;
  const brokenCount = aggregates.broken;
  const criticalCount = aggregates.criticalCount;
  const averageWorkload = aggregates.averageWorkload;
  const averageRouteEfficiency = aggregates.averageRouteEfficiency;
  const averageBreakdownRisk = aggregates.averageBreakdownRisk;

  const availableText = `${availableCount}/${totalCount} müsait`;
  const workloadText = `Yük %${averageWorkload}`;
  const routeText = `Rota %${averageRouteEfficiency}`;
  const maintenanceText = `Risk %${averageBreakdownRisk}`;

  if (brokenCount > 0) {
    return {
      title,
      statusLabel: 'Arıza Var',
      statusTone: 'danger',
      summaryText: `${brokenCount} araç arızalı; saha kapasitesi düşebilir.`,
      availableText,
      workloadText,
      routeText,
      maintenanceText,
      criticalCount,
      brokenCount,
      availableCount,
      totalCount,
      averageWorkload,
      averageRouteEfficiency,
      averageBreakdownRisk,
    };
  }

  if (criticalCount > 0) {
    const criticalTone: VehicleFleetStatusTone =
      criticalCount >= VEHICLE_FLEET_THRESHOLDS.criticalDangerCount ||
      averageBreakdownRisk >= VEHICLE_REPORT_THRESHOLDS.averageBreakdownRisk
        ? 'danger'
        : 'warning';

    return {
      title,
      statusLabel: 'Bakım Riski',
      statusTone: criticalTone,
      summaryText: `${criticalCount} araç kritik bakım eşiğinde.`,
      availableText,
      workloadText,
      routeText,
      maintenanceText,
      criticalCount,
      brokenCount,
      availableCount,
      totalCount,
      averageWorkload,
      averageRouteEfficiency,
      averageBreakdownRisk,
    };
  }

  if (availableCount <= VEHICLE_FLEET_THRESHOLDS.availableLow) {
    return {
      title,
      statusLabel: 'Kapasite Düşük',
      statusTone: 'warning',
      summaryText: 'Müsait araç sayısı düşük.',
      availableText,
      workloadText,
      routeText,
      maintenanceText,
      criticalCount,
      brokenCount,
      availableCount,
      totalCount,
      averageWorkload,
      averageRouteEfficiency,
      averageBreakdownRisk,
    };
  }

  if (averageWorkload >= VEHICLE_FLEET_THRESHOLDS.averageWorkload) {
    return {
      title,
      statusLabel: 'Yoğun Filo',
      statusTone: 'warning',
      summaryText: 'Araç yükü yüksek; rota kararları önemli.',
      availableText,
      workloadText,
      routeText,
      maintenanceText,
      criticalCount,
      brokenCount,
      availableCount,
      totalCount,
      averageWorkload,
      averageRouteEfficiency,
      averageBreakdownRisk,
    };
  }

  if (
    averageRouteEfficiency >= VEHICLE_FLEET_THRESHOLDS.strongRouteEfficiency &&
    averageBreakdownRisk < VEHICLE_FLEET_THRESHOLDS.calmBreakdownRisk
  ) {
    return {
      title,
      statusLabel: 'Rota Güçlü',
      statusTone: 'good',
      summaryText: 'Filo günü dengeli sürdürüyor.',
      availableText,
      workloadText,
      routeText,
      maintenanceText,
      criticalCount,
      brokenCount,
      availableCount,
      totalCount,
      averageWorkload,
      averageRouteEfficiency,
      averageBreakdownRisk,
    };
  }

  return {
    title,
    statusLabel: 'Dengeli',
    statusTone: 'neutral',
    summaryText: 'Araç filosu dengeli durumda.',
    availableText,
    workloadText,
    routeText,
    maintenanceText,
    criticalCount,
    brokenCount,
    availableCount,
    totalCount,
    averageWorkload,
    averageRouteEfficiency,
    averageBreakdownRisk,
  };
}
