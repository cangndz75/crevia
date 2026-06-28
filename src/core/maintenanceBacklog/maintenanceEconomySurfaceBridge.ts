import type { DecisionArchetypeId } from '@/features/events/utils/decisionTradeoffTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

import type { MaintenanceHubSignal } from './maintenanceBacklogTypes';
import type { MaintenanceBacklogRuntimePresentation } from './maintenanceBacklogRuntimePresentation';
import type { MaintenanceBacklogRuntimeState } from './maintenanceBacklogRuntimeTypes';
import {
  buildMaintenanceEconomyFeelPresentation,
  type BuildMaintenanceEconomyFeelInput,
} from './maintenanceEconomyFeelPresentation';
import type { MaintenanceEconomyFeelPresentation } from './maintenanceEconomyFeelTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildMaintenanceEconomyHubBridge(
  input: BuildMaintenanceEconomyFeelInput & {
    backlogPresentation?: MaintenanceBacklogRuntimePresentation | null;
  },
): MaintenanceHubSignal | null {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  const backlog = input.backlogPresentation;
  if (!backlog?.hasRuntimeItems && feel.pressureLevel === 'low' && feel.densityBand !== 'day1') {
    return null;
  }
  if (feel.densityBand === 'day1' && !backlog?.hasRuntimeItems) {
    return null;
  }

  const chipHint =
    feel.chips.length > 0 ? feel.chips.map((chip) => chip.label).join(' · ') : feel.ctaHint;
  const subtitle = clamp(
    feel.densityBand === 'day1'
      ? feel.summary
      : `${feel.summary} · ${chipHint}`,
    96,
  );

  const dedupeKey = `maintenance:feel:${feel.toneId}:${backlog?.topItem?.dedupeKey ?? 'none'}`;

  return {
    title: feel.title,
    subtitle,
    tone: feel.overallTone,
    dedupeKey,
  };
}

export function buildMaintenanceEconomyPortfolioLine(
  input: BuildMaintenanceEconomyFeelInput,
): string | null {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  return feel.portfolioBridgeLine;
}

export function buildMaintenanceEconomyPlanHint(input: {
  strategyId: EventPlanStrategyId;
  day: number;
  runtime?: MaintenanceBacklogRuntimeState | null;
  operationsToday?: number;
}): string | null {
  if (input.day <= 1) return null;

  const feel = buildMaintenanceEconomyFeelPresentation({
    day: input.day,
    runtime: input.runtime,
    operationsToday: input.operationsToday,
  });

  if (feel.pressureLevel === 'low' && feel.deferRisk.visible === false) {
    return null;
  }

  const hints: Record<EventPlanStrategyId, string> = {
    rapid_response:
      feel.pressureLevel === 'high' || feel.pressureLevel === 'critical'
        ? 'Hızlı müdahale bakım/readiness bedelini büyütebilir.'
        : 'Hızlı tempo kısa vadede hazırlık payını daraltabilir.',
    balanced_plan: 'Dengeli plan bakım risklerini orta seviyede tutar.',
    long_term_fix:
      feel.deferRisk.visible
        ? 'Önleyici plan yarın riskini azaltır.'
        : 'Önleyici plan hazırlığı güçlendirir.',
  };

  return hints[input.strategyId] ?? null;
}

export function buildMaintenanceEconomyDecisionHint(input: {
  archetypeId: DecisionArchetypeId;
  day: number;
  runtime?: MaintenanceBacklogRuntimeState | null;
}): string | null {
  if (input.day <= 1) return null;
  const feel = buildMaintenanceEconomyFeelPresentation({
    day: input.day,
    runtime: input.runtime,
  });
  if (feel.pressureLevel === 'low') return null;

  const hints: Partial<Record<DecisionArchetypeId, string>> = {
    rapid_response: 'Hızlı müdahale bakım baskısını artırabilir.',
    preventive: 'Önleyici seçim yarın readiness riskini azaltır.',
    resource_saving: 'Kaynak koruma bugün düşük maliyet, ihmal riski yüksek olabilir.',
    social_trust: 'Sosyal güven mahalle tepkisini yumuşatır; kaynak baskısı artabilir.',
    balanced: 'Dengeli seçim bakım risklerini orta seviyede tutar.',
  };
  return hints[input.archetypeId] ?? null;
}

export function buildMaintenanceEconomyResultRevealLine(
  input: BuildMaintenanceEconomyFeelInput,
  avoidLines: string[] = [],
): string | null {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  const line = feel.resultRevealLine;
  if (!line || lineDuplicatesAvoidLines(line, avoidLines)) return null;
  return line;
}

export function buildMaintenanceEconomyClosureBridge(input: BuildMaintenanceEconomyFeelInput): {
  gainLabel: string | null;
  costLabel: string | null;
  tomorrowHint: string | null;
} {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  return {
    gainLabel: feel.closureGainLabel,
    costLabel: feel.closureCostLabel,
    tomorrowHint: feel.tomorrowFocusHint,
  };
}

export function buildMaintenanceEconomyMemoryLine(
  input: BuildMaintenanceEconomyFeelInput,
  avoidLines: string[] = [],
): string | null {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  const line = feel.memoryHistoryLine;
  if (!line || lineDuplicatesAvoidLines(line, avoidLines)) return null;
  return line;
}

export function enrichMaintenanceRuntimeHubSignal(
  signal: MaintenanceHubSignal | null,
  feel: MaintenanceEconomyFeelPresentation,
): MaintenanceHubSignal | null {
  if (!signal && feel.densityBand === 'day1' && feel.pressureLevel === 'low') {
    return null;
  }
  if (!signal) {
    return {
      title: feel.title,
      subtitle: clamp(feel.summary, 96),
      tone: feel.overallTone,
      dedupeKey: `maintenance:feel:${feel.toneId}`,
    };
  }
  return {
    ...signal,
    title: feel.title.length > 0 ? feel.title : signal.title,
    subtitle: clamp(feel.summary, 96),
    tone: feel.overallTone,
  };
}

export function buildMaintenanceEconomyDispatchHint(
  input: BuildMaintenanceEconomyFeelInput,
  avoidLines: string[] = [],
): string | null {
  const feel = buildMaintenanceEconomyFeelPresentation(input);
  const candidates = [
    feel.deferRisk.visible ? feel.deferRisk.line : null,
    feel.opportunityCost.visible ? feel.opportunityCost.line : null,
    feel.ctaHint,
  ];
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    if (lineDuplicatesAvoidLines(candidate, avoidLines)) continue;
    return clamp(candidate, 110);
  }
  return null;
}
