import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

import type { MaintenanceBacklogRuntimePresentation } from './maintenanceBacklogRuntimePresentation';
import type { MaintenanceBacklogTone } from './maintenanceBacklogTypes';
import type {
  MaintenanceBacklogRuntimeState,
} from './maintenanceBacklogRuntimeTypes';
import { countActiveEconomyPlans } from './maintenanceEconomyModel';
import { buildMaintenanceEconomyDeferRiskPreview } from './maintenanceEconomyDeferRiskPresentation';
import type {
  MaintenanceEconomyChip,
  MaintenanceEconomyDensityBand,
  MaintenanceEconomyFeelPresentation,
} from './maintenanceEconomyFeelTypes';
import { buildMaintenanceEconomyOpportunityCostPreview } from './maintenanceEconomyOpportunityCostPresentation';
import { buildMaintenanceEconomyTradeoffStrip } from './maintenanceEconomyTradeoffPresentation';
import {
  buildMaintenanceEconomyPressureSnapshot,
  maintenanceEconomyToneCopy,
  resolveMaintenanceEconomyPosture,
  resolveMaintenanceEconomyToneId,
} from './maintenanceEconomyToneModel';
import type { MaintenanceEconomyCostBand } from './maintenanceEconomyTypes';

export type BuildMaintenanceEconomyFeelInput = {
  day: number;
  runtime?: MaintenanceBacklogRuntimeState | null;
  backlogPresentation?: MaintenanceBacklogRuntimePresentation | null;
  operationsToday?: number;
  resourcePressureHigh?: boolean;
  avoidLines?: string[];
};

function resolveDensityBand(day: number): MaintenanceEconomyDensityBand {
  return day <= 1 ? 'day1' : 'openEnded';
}

function toneFromPressure(level: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>['pressureLevel']): MaintenanceBacklogTone {
  if (level === 'critical') return 'critical';
  if (level === 'high') return 'warning';
  if (level === 'moderate') return 'mixed';
  return 'positive';
}

function estimateCostBand(snapshot: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>): MaintenanceEconomyCostBand {
  if (snapshot.inProgressCount >= 2 || snapshot.criticalCount > 0) return 'high';
  if (snapshot.inProgressCount > 0 || snapshot.activeCount >= 2) return 'medium';
  if (snapshot.activeCount > 0) return 'low';
  return 'none';
}

function buildPressureChips(input: {
  snapshot: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>;
  densityBand: MaintenanceEconomyDensityBand;
  resourcePressureHigh?: boolean;
}): MaintenanceEconomyChip[] {
  const chips: MaintenanceEconomyChip[] = [];
  if (input.snapshot.criticalCount > 0 || input.snapshot.pressureLevel === 'high') {
    chips.push({ id: 'readiness_risk', label: 'Readiness riski', tone: 'risk' });
  }
  if (input.snapshot.inProgressCount > 0 || input.resourcePressureHigh) {
    chips.push({ id: 'resource_cost', label: 'Kaynak bedeli', tone: 'cost' });
  }
  if (input.snapshot.queuedCount > 0 || input.snapshot.carriedCount > 0) {
    chips.push({ id: 'tomorrow_impact', label: 'Yarın etkisi', tone: 'risk' });
  }
  if (chips.length === 0 && input.snapshot.activeCount > 0) {
    chips.push({ id: 'maintenance_watch', label: 'Bakım izleniyor', tone: 'neutral' });
  }
  const cap = input.densityBand === 'day1' ? 1 : 3;
  return chips.slice(0, cap);
}

function buildOperationImpactLine(
  snapshot: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>,
  toneId: ReturnType<typeof resolveMaintenanceEconomyToneId>,
): string | null {
  if (snapshot.activeCount === 0) return null;
  if (toneId === 'neglect_shadowed_ops') {
    return 'Bakım eksiği sonucu gölgeledi.';
  }
  if (toneId === 'timely_maintenance_relief' || toneId === 'readiness_strengthened') {
    return 'Zamanında hazırlık müdahaleyi hızlandırdı.';
  }
  if (toneId === 'resource_kept_risk_remains') {
    return 'Kaynak korundu, ancak readiness yarına risk bıraktı.';
  }
  if (snapshot.criticalCount > 0) {
    return 'Kritik hazırlık sinyali operasyon temposunu yavaşlatabilir.';
  }
  return 'Bakım durumu operasyon güvenilirliğini etkiliyor.';
}

function buildPortfolioBridgeLine(
  snapshot: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>,
  operationsToday: number,
  densityBand: MaintenanceEconomyDensityBand,
): string | null {
  if (densityBand === 'day1') return null;
  if (operationsToday >= 3 && snapshot.inProgressCount > 0) {
    return `${operationsToday} operasyonlu günde bakım yapmak kapasiteyi sıkıştırır.`;
  }
  if (snapshot.activeCount > 0 && operationsToday >= 2) {
    return 'Bugün bakım yapılmazsa en kritik operasyonun readiness riski artar.';
  }
  if (snapshot.queuedCount > 0) {
    return 'Kaynak koruyucu plan bakım baskısını kısa vadede azaltır ama yarına risk bırakır.';
  }
  return null;
}

function buildMemoryHistoryLine(
  snapshot: ReturnType<typeof buildMaintenanceEconomyPressureSnapshot>,
  densityBand: MaintenanceEconomyDensityBand,
): string | null {
  if (densityBand === 'day1') return null;
  if (snapshot.deferStreakDays >= 2) {
    return 'Son iki gün bakım ertelendi; hızlı müdahale riski artıyor.';
  }
  if (snapshot.stabilizedCount > 0 && snapshot.activeCount === 0) {
    return 'Hazırlık toparlandığı için bugünkü saha riski azaldı.';
  }
  if (snapshot.carriedCount >= 1) {
    return 'Taşınan bakım sinyali geçmiş günlerden birikiyor.';
  }
  return null;
}

function pickUniqueLine(
  candidates: Array<string | null | undefined>,
  avoidLines: string[],
): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    if (lineDuplicatesAvoidLines(trimmed, avoidLines)) continue;
    return trimmed;
  }
  return null;
}

export function buildMaintenanceEconomyFeelPresentation(
  input: BuildMaintenanceEconomyFeelInput,
): MaintenanceEconomyFeelPresentation {
  const densityBand = resolveDensityBand(input.day);
  const avoidLines = [...(input.avoidLines ?? [])];
  const snapshot = buildMaintenanceEconomyPressureSnapshot(input.runtime);
  const toneId = resolveMaintenanceEconomyToneId(snapshot);
  const toneCopy = maintenanceEconomyToneCopy(toneId);
  const posture = resolveMaintenanceEconomyPosture(snapshot, toneId);
  const operationsToday = Math.max(1, input.operationsToday ?? 1);

  const tradeoffStrip = buildMaintenanceEconomyTradeoffStrip({
    snapshot,
    toneId,
    densityBand,
  });
  const deferRisk = buildMaintenanceEconomyDeferRiskPreview({ snapshot, densityBand });
  const opportunityCost = buildMaintenanceEconomyOpportunityCostPreview({
    snapshot,
    toneId,
    operationsToday,
    densityBand,
  });

  const chips = buildPressureChips({
    snapshot,
    densityBand,
    resourcePressureHigh: input.resourcePressureHigh,
  });

  const title =
    densityBand === 'day1' && snapshot.activeCount <= 1
      ? 'Hazırlık sinyali'
      : toneCopy.title;
  const summary =
    densityBand === 'day1'
      ? 'Hazırlık kararları sonraki operasyonları etkiler.'
      : toneCopy.summary;

  const ctaHint = posture.id === 'act_now' ? 'Bakımı Kontrol Et' : posture.label;

  const closureGain =
    tradeoffStrip.gains[0]?.label ??
    (snapshot.stabilizedCount > 0 ? 'Hazırlık güçlendi' : null);
  const closureCost =
    tradeoffStrip.costs[0]?.label ??
    (input.resourcePressureHigh ? 'Kaynak baskısı arttı' : null);

  const tomorrowFocusHint =
    snapshot.topDomain === 'vehicle'
      ? 'Araç hazırlığını kontrol et'
      : snapshot.carriedCount > 0
        ? 'Taşınan hazırlık sinyallerini dengele'
        : snapshot.activeCount > 0
          ? 'Bakım planını yarına taşımadan gözden geçir'
          : null;

  const activePlans = input.runtime ? countActiveEconomyPlans(input.runtime.items) : 0;
  if (activePlans >= 2 && densityBand === 'openEnded' && !chips.some((c) => c.id === 'resource_cost')) {
    chips.push({ id: 'active_plans', label: 'Aktif plan', tone: 'cost' });
  }

  const resultRevealLine = buildOperationImpactLine(snapshot, toneId);
  const portfolioBridgeLine = buildPortfolioBridgeLine(snapshot, operationsToday, densityBand);
  const memoryHistoryLine = buildMemoryHistoryLine(snapshot, densityBand);

  const collectStrings = (): string[] => {
    const raw = [
      title,
      summary,
      ctaHint,
      posture.label,
      ...chips.map((chip) => chip.label),
      ...tradeoffStrip.gains.map((chip) => chip.label),
      ...tradeoffStrip.costs.map((chip) => chip.label),
      tradeoffStrip.balanceLabel,
      deferRisk.line,
      deferRisk.riskChip?.label,
      deferRisk.tomorrowChip?.label,
      opportunityCost.line,
      resultRevealLine,
      portfolioBridgeLine,
      closureGain,
      closureCost,
      tomorrowFocusHint,
      memoryHistoryLine,
    ].filter((line): line is string => Boolean(line?.trim()));

    const seen = new Set<string>();
    return raw.filter((line) => {
      const key = line.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    densityBand,
    pressureLevel: snapshot.pressureLevel,
    pressureScore: snapshot.pressureScore,
    toneId,
    overallTone: toneFromPressure(snapshot.pressureLevel),
    title,
    summary,
    chips,
    ctaHint,
    tradeoffStrip,
    deferRisk,
    opportunityCost,
    recommendedPosture: posture.id,
    postureLabel: posture.label,
    operationImpactLine: pickUniqueLine([resultRevealLine], avoidLines),
    portfolioBridgeLine: pickUniqueLine([portfolioBridgeLine], avoidLines),
    resultRevealLine: pickUniqueLine([resultRevealLine], avoidLines),
    closureGainLabel: closureGain,
    closureCostLabel: closureCost,
    tomorrowFocusHint: pickUniqueLine([tomorrowFocusHint], avoidLines),
    memoryHistoryLine: pickUniqueLine([memoryHistoryLine], avoidLines),
    eceDay1Line: densityBand === 'day1' ? 'Hazırlık kararları sonraki operasyonları etkiler.' : null,
    estimatedCostBand: estimateCostBand(snapshot),
    collectStrings,
  };
}

export function maintenanceEconomyFeelHasDuplicateCopy(
  presentation: MaintenanceEconomyFeelPresentation,
): boolean {
  const strings = presentation.collectStrings();
  const normalized = strings.map((line) => line.trim().toLowerCase());
  return new Set(normalized).size !== normalized.length;
}

export function maintenanceEconomyFeelUsesBannedFallback(
  presentation: MaintenanceEconomyFeelPresentation,
): boolean {
  const banned = [
    /^tahmini maliyet:/i,
    /^bakım maliyeti:/i,
    /^maliyet:\s*\d/i,
    /^\+ güven$/i,
    /^\- kaynak$/i,
  ];
  return presentation.collectStrings().some((line) => banned.some((pattern) => pattern.test(line.trim())));
}
