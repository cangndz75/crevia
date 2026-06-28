import { buildMaintenanceBacklogFromReadiness } from '@/core/maintenanceBacklog/maintenanceBacklogPresentation';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import type { OperationReadinessContext } from '@/core/operationReadiness/operationReadinessTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

import {
  buildReadinessDispatchFitPresentation,
  buildReadinessPlanFitPresentation,
} from './readinessFitPresentation';
import {
  buildReadinessPriorityFromInput,
  buildReadinessPrioritySurface,
} from './readinessPriorityPresentation';
import { buildReadinessStrategicPriority } from './readinessStrategicPriorityModel';
import type {
  ReadinessFieldSignalPresentation,
  ReadinessHubCompactPresentation,
  ReadinessPortfolioWarningPresentation,
  ReadinessReportMemoryPresentation,
  ReadinessResultBridgePresentation,
  ReadinessStrategicPriorityInput,
} from './readinessStrategicPriorityTypes';

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildReadinessInputFromContext(
  ctx: OperationReadinessContext & {
    maintenanceBacklog?: ReadinessStrategicPriorityInput['maintenanceBacklog'];
    maintenanceRuntime?: ReadinessStrategicPriorityInput['maintenanceRuntime'];
    operationsToday?: number;
    operationTitle?: string | null;
    socialPressure?: boolean;
    memoryStreakDays?: number;
    portfolioConflict?: boolean;
    avoidLines?: string[];
  },
): ReadinessStrategicPriorityInput {
  const snapshot = buildOperationReadinessSnapshot(ctx);
  const maintenanceBacklog =
    ctx.maintenanceBacklog ?? buildMaintenanceBacklogFromReadiness(snapshot);

  return {
    day: ctx.day ?? 1,
    readinessSnapshot: snapshot,
    maintenanceBacklog,
    maintenanceRuntime: ctx.maintenanceRuntime,
    planStrategyId: ctx.planStrategyId,
    eventRiskLevel: ctx.eventRiskLevel,
    operationsToday: ctx.operationsToday,
    operationTitle: ctx.operationTitle,
    playerStyleId: ctx.playerStyleId,
    socialPressure: ctx.socialPressure,
    memoryStreakDays: ctx.memoryStreakDays,
    portfolioConflict: ctx.portfolioConflict,
    avoidLines: ctx.avoidLines,
  };
}

export function buildFieldReadinessSignal(
  input: ReadinessStrategicPriorityInput,
): ReadinessFieldSignalPresentation {
  const result = buildReadinessStrategicPriority(input);
  const { priority, densityBand } = result;

  if (densityBand === 'day1') {
    return {
      visibility: 'visible',
      signal: clamp(priority.description, 72),
      tone: 'teal',
    };
  }

  let signal = priority.description;
  if (priority.domain === 'vehicle') {
    signal =
      input.readinessSnapshot.signals.find((s) => s.domain === 'vehicle')?.status === 'ready'
        ? 'Araç hazırlığı iyi olduğu için saha süresi kısaldı.'
        : 'Araç hazırlığı saha süresini uzatabilir.';
  } else if (priority.domain === 'personnel') {
    signal = 'Ekip yorgunluğu müdahaleyi yavaşlatıyor.';
  } else if (priority.domain === 'facility' || priority.domain === 'equipment') {
    signal = 'Bakım eksiği sonucu gölgeleyebilir.';
  } else if (priority.domain === 'ready_positive') {
    signal = 'Hazırlık dengede; saha temposu planla uyumlu.';
  }

  return {
    visibility: 'visible',
    signal: clamp(signal, 88),
    tone: priority.tone === 'positive' ? 'teal' : priority.tone === 'critical' ? 'critical' : 'warning',
  };
}

export function buildResultReadinessBridge(
  input: ReadinessStrategicPriorityInput & {
    outcomePositive?: boolean;
  },
): ReadinessResultBridgePresentation {
  const result = buildReadinessStrategicPriority(input);
  const { priority, densityBand, recovery } = result;

  if (densityBand === 'day1') {
    return {
      visibility: 'visible',
      impactLine: 'Hazırlık seçimi operasyon güvenini destekledi.',
      tone: 'teal',
    };
  }

  let impactLine = priority.description;
  if (input.outcomePositive && recovery) {
    impactLine = 'Doğru ekip eşleşmesi güven kaybını hızla durdurdu.';
  } else if (priority.tone === 'critical' || priority.tone === 'warning') {
    impactLine =
      priority.domain === 'facility' || priority.domain === 'equipment'
        ? 'Bakım eksiği yarına risk bıraktı.'
        : 'Readiness düşüklüğü başarıyı maliyetli hale getirdi.';
  } else if (priority.domain === 'ready_positive') {
    impactLine = 'Hazırlık dengesi operasyon bedelini kontrol altında tuttu.';
  }

  return {
    visibility: 'visible',
    impactLine: clamp(impactLine, 96),
    tone: priority.tone === 'positive' ? 'teal' : priority.tone === 'critical' ? 'critical' : 'warning',
  };
}

export function buildHubReadinessCompact(
  input: ReadinessStrategicPriorityInput,
): ReadinessHubCompactPresentation {
  const { result, surface } = buildReadinessPriorityFromInput(input);

  if (result.densityBand === 'day1') {
    return {
      visibility: 'visible',
      pulseLine: surface.hero.title,
      reasonChip: surface.chips[0]?.label,
      tone: 'teal',
    };
  }

  if (result.priority.tone === 'positive' && result.priority.domain === 'ready_positive') {
    return { visibility: 'hidden', pulseLine: '', tone: 'teal' };
  }

  const pulseLine =
    result.priority.domain === 'vehicle'
      ? 'Bugün hızlı müdahale cazip ama araç hazırlığı kırılgan.'
      : clamp(result.priority.title, 88);

  return {
    visibility: 'visible',
    pulseLine,
    reasonChip: result.priority.riskChip.label,
    subtitle: result.recovery?.label ?? undefined,
    tone: result.priority.tone === 'critical' ? 'critical' : 'warning',
  };
}

export function buildPortfolioReadinessWarning(
  input: ReadinessStrategicPriorityInput,
): ReadinessPortfolioWarningPresentation {
  if (input.day <= 1) {
    return { visibility: 'hidden', warningLine: '', tone: 'neutral' };
  }

  const result = buildReadinessStrategicPriority(input);
  const opsToday = input.operationsToday ?? 1;

  if (
    (result.priority.domain === 'vehicle' || result.priority.domain === 'personnel') &&
    opsToday >= 2
  ) {
    return {
      visibility: 'visible',
      warningLine: 'Hazırlık düşükken iki hızlı müdahale riskli.',
      tone: 'warning',
    };
  }

  if (result.priority.tone === 'critical' || result.priority.tone === 'warning') {
    return {
      visibility: 'visible',
      warningLine: clamp(result.priority.title, 88),
      tone: result.priority.tone === 'critical' ? 'critical' : 'warning',
    };
  }

  return { visibility: 'hidden', warningLine: '', tone: 'neutral' };
}

export function buildReportReadinessMemory(
  input: ReadinessStrategicPriorityInput,
): ReadinessReportMemoryPresentation {
  const result = buildReadinessStrategicPriority(input);

  if (result.densityBand === 'day1') {
    return {
      visibility: 'visible',
      closureLine: 'İlk gün hazırlık seçimi operasyon güvenini destekledi.',
      tone: 'teal',
    };
  }

  const closureLine =
    result.memory?.label ??
    (result.recovery
      ? result.recovery.label
      : result.priority.tone === 'warning'
        ? clamp(result.priority.description, 88)
        : 'Hazırlık dengesi korundu; yarın kapasite izlenmeli.');

  const replayChip =
    result.memory?.label ??
    (result.priority.domain === 'personnel' && (input.memoryStreakDays ?? 0) >= 2
      ? 'Ekip yorgunluğu birikiyor'
      : undefined);

  return {
    visibility: 'visible',
    closureLine: clamp(closureLine, 96),
    replayChip: replayChip ? clamp(replayChip, 48) : undefined,
    tone: result.priority.tone === 'positive' ? 'teal' : 'warning',
  };
}

export {
  buildReadinessPlanFitPresentation,
  buildReadinessDispatchFitPresentation,
  buildReadinessPriorityFromInput,
  buildReadinessPrioritySurface,
  buildReadinessStrategicPriority,
};

export type { ReadinessStrategicPriorityInput };

export function enrichPlanPhaseWithReadiness(input: {
  readinessInput: ReadinessStrategicPriorityInput;
  selectedStrategyId: EventPlanStrategyId;
}) {
  const { result, surface } = buildReadinessPriorityFromInput(input.readinessInput);
  const planFit = buildReadinessPlanFitPresentation(input.readinessInput);
  const strategyFit = planFit.strategyFits[input.selectedStrategyId] ?? null;
  return { result, surface, planFit, strategyFit };
}
