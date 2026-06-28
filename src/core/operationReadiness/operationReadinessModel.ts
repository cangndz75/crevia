import type {
  OperationReadinessAssignmentStatus,
  OperationReadinessCompatibilityBand,
  OperationReadinessContext,
  ReadinessDomain,
  ReadinessSignalPresentation,
  ReadinessStatus,
  ReadinessTone,
} from './operationReadinessTypes';
import {
  OVERALL_STATUS_LABELS,
  OVERALL_STATUS_SUMMARIES,
  READINESS_DESCRIPTIONS,
  READINESS_DOMAIN_ICONS,
  READINESS_DOMAIN_LABELS,
  READINESS_STATUS_LABELS,
  readinessDescriptionForPhase,
} from './operationReadinessConstants';

export function mapReadinessStatusToTone(status: ReadinessStatus): ReadinessTone {
  if (status === 'ready') return 'positive';
  if (status === 'limited') return 'mixed';
  if (status === 'strained') return 'warning';
  if (status === 'blocked') return 'critical';
  return 'neutral';
}

export function mapReadinessToneToUiTone(
  tone: ReadinessTone,
): 'positive' | 'neutral' | 'warning' {
  if (tone === 'positive') return 'positive';
  if (tone === 'warning' || tone === 'critical') return 'warning';
  return 'neutral';
}

function resolvePersonnelStatus(ctx: OperationReadinessContext): ReadinessStatus {
  if (ctx.assignmentStatus === 'missing' || ctx.assignmentStatus === 'locked') {
    return 'blocked';
  }
  if (ctx.phase === 'result') {
    if ((ctx.moraleDelta ?? 0) < -3 || ctx.planStrategyId === 'rapid_response') {
      return 'strained';
    }
    if ((ctx.moraleDelta ?? 0) < -1) return 'limited';
    return 'ready';
  }
  if (ctx.phase === 'field') {
    if (ctx.assignmentEffectBand === 'low') return 'strained';
    if (ctx.assignmentEffectBand === 'high') return 'ready';
    return 'limited';
  }
  if (ctx.assignmentStatus === 'partial') return 'limited';
  if (ctx.compatibilityTone === 'warning' || ctx.compatibilityBand === 'low') {
    return 'strained';
  }
  if (ctx.compatibilityTone === 'neutral') return 'limited';
  return 'ready';
}

function resolveVehicleStatus(ctx: OperationReadinessContext): ReadinessStatus {
  if (!ctx.hasVehicle) return 'blocked';
  if (ctx.compatibilityBand === 'low') return 'limited';
  if (ctx.phase === 'field' && !ctx.hasVehicle) return 'limited';
  return 'ready';
}

function resolveBudgetStatus(ctx: OperationReadinessContext): ReadinessStatus {
  if (ctx.phase === 'result') {
    if ((ctx.budgetDelta ?? 0) < -4) return 'strained';
    if ((ctx.budgetDelta ?? 0) < -2) return 'limited';
    if (ctx.planStrategyId === 'long_term_fix') return 'limited';
    return 'ready';
  }
  if (
    ctx.planStrategyId === 'rapid_response' ||
    ctx.planStrategyId === 'long_term_fix'
  ) {
    return 'limited';
  }
  if (ctx.compatibilityBand === 'low') return 'strained';
  return 'ready';
}

function resolveSocialStatus(ctx: OperationReadinessContext): ReadinessStatus {
  const preview = ctx.publicSatisfactionPreview ?? 0;
  if (preview < -4) return 'blocked';
  if (preview < -2) return 'strained';
  if (preview < 0 || ctx.compatibilityTone === 'warning') return 'limited';
  return 'ready';
}

function resolveRouteStatus(ctx: OperationReadinessContext): ReadinessStatus {
  if (ctx.eventRiskLevel === 'critical' || ctx.eventRiskLevel === 'high') {
    return ctx.phase === 'field' || ctx.phase === 'result' ? 'strained' : 'limited';
  }
  if (!ctx.hasVehicle) return 'limited';
  return 'ready';
}

function resolveOperationStatus(ctx: OperationReadinessContext): ReadinessStatus {
  if (ctx.eventRiskLevel === 'critical') return 'strained';
  if (ctx.eventRiskLevel === 'high') return 'limited';
  if (ctx.phase === 'field') return 'limited';
  return 'ready';
}

function buildSignal(
  domain: ReadinessDomain,
  status: ReadinessStatus,
  ctx: OperationReadinessContext,
  priority: number,
): ReadinessSignalPresentation {
  const phase = ctx.phase ?? 'dispatch';
  const tone = mapReadinessStatusToTone(status);
  let description = readinessDescriptionForPhase(domain, status, phase);

  if (domain === 'social' && ctx.districtSocialFlavor?.trim()) {
    if (status === 'strained' || status === 'blocked') {
      description = ctx.districtSocialFlavor.trim();
    }
  }
  if (domain === 'route' && ctx.districtRouteFlavor?.trim() && status !== 'ready') {
    description = ctx.districtRouteFlavor.trim();
  }

  if (ctx.playerStyleId === 'resource_guardian' && domain === 'budget' && status !== 'ready') {
    description = `${description} Kapasiteyi korumak yarın için önemli.`.slice(0, 120);
  }
  if (ctx.playerStyleId === 'fast_responder' && domain === 'personnel' && status === 'strained') {
    description = 'Hızlı müdahale ekip temposunu zorluyor. Yarın kapasiteyi izle.';
  }

  return {
    id: `readiness-${domain}`,
    domain,
    label: READINESS_DOMAIN_LABELS[domain],
    status,
    statusLabel: READINESS_STATUS_LABELS[domain][status],
    tone,
    description,
    reason: description,
    icon: READINESS_DOMAIN_ICONS[domain],
    priority,
  };
}

export function buildReadinessSignals(ctx: OperationReadinessContext): ReadinessSignalPresentation[] {
  const signals: ReadinessSignalPresentation[] = [];
  const phase = ctx.phase ?? 'dispatch';

  signals.push(buildSignal('personnel', resolvePersonnelStatus(ctx), ctx, 10));
  signals.push(buildSignal('vehicle', resolveVehicleStatus(ctx), ctx, 9));
  signals.push(buildSignal('budget', resolveBudgetStatus(ctx), ctx, 8));
  signals.push(buildSignal('social', resolveSocialStatus(ctx), ctx, 7));

  if (phase === 'field' || phase === 'result' || phase === 'report') {
    signals.push(buildSignal('route', resolveRouteStatus(ctx), ctx, 6));
    signals.push(buildSignal('operation', resolveOperationStatus(ctx), ctx, 5));
  }

  if (ctx.hasEquipmentData) {
    signals.push(
      buildSignal(
        'equipment',
        ctx.hasEquipmentData ? 'limited' : 'unknown',
        ctx,
        4,
      ),
    );
  }

  if (ctx.hasFacilityData) {
    signals.push(
      buildSignal(
        'facility',
        ctx.hasFacilityData ? 'limited' : 'unknown',
        ctx,
        3,
      ),
    );
  }

  return signals
    .filter((signal) => signal.status !== 'unknown' || phase === 'report')
    .sort((a, b) => b.priority - a.priority);
}

export function deriveReadinessOverallStatus(
  signals: ReadinessSignalPresentation[],
  assignmentStatus?: OperationReadinessAssignmentStatus,
): ReadinessStatus {
  if (assignmentStatus === 'missing' || assignmentStatus === 'locked') {
    return 'blocked';
  }
  if (signals.length === 0) return 'unknown';

  const blockedCount = signals.filter((s) => s.status === 'blocked').length;
  const strainedCount = signals.filter((s) => s.status === 'strained').length;
  const limitedCount = signals.filter((s) => s.status === 'limited').length;

  if (blockedCount > 0) return 'blocked';
  if (strainedCount >= 2) return 'strained';
  if (strainedCount === 1 && limitedCount >= 1) return 'strained';
  if (strainedCount === 1) return 'limited';
  if (limitedCount >= 2) return 'limited';
  if (limitedCount === 1) return 'limited';

  const readyCount = signals.filter((s) => s.status === 'ready').length;
  if (readyCount >= Math.max(2, signals.length - 1)) return 'ready';
  return 'unknown';
}

export function buildOperationReadinessSnapshot(
  ctx: OperationReadinessContext,
): import('./operationReadinessTypes').OperationReadinessSnapshot {
  const signals = buildReadinessSignals(ctx);
  const overallStatus = deriveReadinessOverallStatus(signals, ctx.assignmentStatus);
  const overallTone = mapReadinessStatusToTone(overallStatus);

  const blockers = signals.filter((s) => s.status === 'blocked');
  const warnings = signals.filter((s) => s.status === 'strained' || s.status === 'blocked');

  let summary = OVERALL_STATUS_SUMMARIES[overallStatus];
  if (ctx.playerStyleId === 'balanced_operator' && overallStatus === 'limited') {
    summary = 'Operasyon başlatılabilir; risk ve kaynak dengesini birlikte izle.';
  }

  return {
    overallStatus,
    overallLabel: OVERALL_STATUS_LABELS[overallStatus],
    overallTone,
    summary,
    signals,
    blockers,
    warnings,
  };
}

export function pickDispatchSignals(
  snapshot: import('./operationReadinessTypes').OperationReadinessSnapshot,
): ReadinessSignalPresentation[] {
  const order: ReadinessDomain[] = ['personnel', 'vehicle', 'budget', 'social'];
  return order
    .map((domain) => snapshot.signals.find((s) => s.domain === domain))
    .filter((s): s is ReadinessSignalPresentation => Boolean(s))
    .slice(0, 4);
}

export function pickFieldPulseSignals(
  snapshot: import('./operationReadinessTypes').OperationReadinessSnapshot,
): ReadinessSignalPresentation[] {
  const order: ReadinessDomain[] = ['personnel', 'route', 'budget', 'social'];
  return order
    .map((domain) => snapshot.signals.find((s) => s.domain === domain))
    .filter((s): s is ReadinessSignalPresentation => Boolean(s))
    .slice(0, 4);
}

export function pickResultCostSignals(
  snapshot: import('./operationReadinessTypes').OperationReadinessSnapshot,
): ReadinessSignalPresentation[] {
  const order: ReadinessDomain[] = ['personnel', 'budget', 'route'];
  return order
    .map((domain) => snapshot.signals.find((s) => s.domain === domain))
    .filter((s): s is ReadinessSignalPresentation => Boolean(s))
    .slice(0, 3);
}
