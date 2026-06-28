import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';
import type { OperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessTypes';
import type { CenterHomeCoreSections } from '@/features/hub/utils/centerHomePresentation';
import type { CenterOperationSignalSeverity } from '@/features/hub/utils/centerOperationSignalsPresentation';

import { buildMaintenanceBacklogSnapshot } from './maintenanceBacklogModel';
import type {
  MaintenanceBacklogContext,
  MaintenanceBacklogSnapshot,
  MaintenanceHubSignal,
  MaintenanceSurfaceHint,
} from './maintenanceBacklogTypes';

function isDuplicateLine(line: string, avoidLines: string[]): boolean {
  return lineDuplicatesAvoidLines(line, avoidLines);
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function severityToMoraleDelta(severity: CenterOperationSignalSeverity): number {
  if (severity === 'urgent') return -4;
  if (severity === 'high') return -3;
  if (severity === 'medium') return -1;
  return 0;
}

function severityToBudgetDelta(severity: CenterOperationSignalSeverity): number | undefined {
  if (severity === 'urgent') return -4;
  if (severity === 'high') return -3;
  if (severity === 'medium') return -2;
  return undefined;
}

function resolvePresentationDay(presentation: CenterHomeCoreSections): number {
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  return Number(dayChip?.valueText.match(/\d+/)?.[0] ?? 1);
}

export function buildHubReadinessSnapshotFromPresentation(
  presentation: CenterHomeCoreSections,
): OperationReadinessSnapshot {
  const day = resolvePresentationDay(presentation);
  const signals = presentation.operationSignals.signals ?? [];

  let moraleDelta = 0;
  let budgetDelta: number | undefined;
  let hasVehicle = true;

  for (const signal of signals) {
    const morale = severityToMoraleDelta(signal.severity);
    if (morale < moraleDelta) moraleDelta = morale;

    if (signal.domain === 'energy' || signal.domain === 'logistics') {
      const budget = severityToBudgetDelta(signal.severity);
      if (budget !== undefined && (budgetDelta === undefined || budget < budgetDelta)) {
        budgetDelta = budget;
      }
    }

    if (signal.domain === 'transport' && signal.severity === 'urgent') {
      hasVehicle = false;
    }
  }

  const socialPressure = signals.some(
    (s) =>
      s.domain === 'social' && (s.severity === 'high' || s.severity === 'urgent'),
  );

  return buildOperationReadinessSnapshot({
    phase: 'report',
    day,
    moraleDelta,
    budgetDelta,
    publicSatisfactionPreview: socialPressure ? -3 : 0,
    eventRiskLevel: signals.some((s) => s.severity === 'urgent')
      ? 'high'
      : signals.some((s) => s.severity === 'high')
        ? 'medium'
        : 'low',
    hasVehicle,
  });
}

export function buildMaintenanceBacklogFromReadiness(
  readinessSnapshot: OperationReadinessSnapshot,
  options?: Omit<MaintenanceBacklogContext, 'readinessSnapshot'>,
): MaintenanceBacklogSnapshot {
  return buildMaintenanceBacklogSnapshot({
    readinessSnapshot,
    ...options,
  });
}

export function buildMaintenanceDispatchHint(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): MaintenanceSurfaceHint | null {
  if (snapshot.items.length === 0) return null;

  const top = snapshot.topItem ?? snapshot.items[0];
  let text = top.nextHint ?? top.description;
  if (top.domain === 'personnel') {
    text = 'Ekip temposu bakım adayı. Operasyonu kısa tutmak yarına kapasite bırakır.';
  }

  const clamped = clamp(text, 120);
  if (isDuplicateLine(clamped, avoidLines)) return null;

  return {
    text: clamped,
    tone: snapshot.overallTone,
    countLabel: snapshot.items.length > 1 ? snapshot.countLabel : undefined,
  };
}

export function buildMaintenanceFieldHint(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): MaintenanceSurfaceHint | null {
  if (snapshot.items.length === 0) return null;

  const top = snapshot.topItem ?? snapshot.items[0];
  let text = top.description;
  if (top.domain === 'personnel') {
    text = 'Ekip temposu bakım adayı gibi izleniyor.';
  } else if (top.domain === 'route') {
    text = 'Rota baskısı müdahale süresini artırabilir.';
  }

  const clamped = clamp(text, 110);
  if (isDuplicateLine(clamped, avoidLines)) return null;

  return { text: clamped, tone: top.tone };
}

export function buildMaintenanceResultHint(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): string | null {
  if (snapshot.items.length === 0) return null;

  const top = snapshot.topItem ?? snapshot.items[0];
  let text: string;
  if (top.domain === 'personnel') {
    text = 'Bu operasyon ekip temposunda takip sinyali bıraktı.';
  } else if (top.domain === 'budget') {
    text = 'Kaynak baskısı yarın hazırlık alanını daraltabilir.';
  } else {
    text = top.description;
  }

  const clamped = clamp(text, 120);
  if (isDuplicateLine(clamped, avoidLines)) return null;
  return clamped;
}

export function buildMaintenanceReportInsight(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): string | null {
  if (snapshot.items.length === 0) return null;
  if (snapshot.overallTone === 'positive') return null;

  const line = clamp(snapshot.summary, 160);
  if (isDuplicateLine(line, avoidLines)) return null;
  return line;
}

export function buildMaintenanceHubSignal(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): MaintenanceHubSignal | null {
  if (snapshot.items.length === 0) return null;

  const top = snapshot.topItem ?? snapshot.items[0];
  const title =
    top.severity === 'critical'
      ? 'Kritik hazırlık sinyali'
      : top.domain === 'personnel'
        ? 'Ekip temposu izlenmeli'
        : top.title;

  const subtitle = clamp(top.description, 90);
  if (isDuplicateLine(title, avoidLines) || isDuplicateLine(subtitle, avoidLines)) {
    return null;
  }

  return {
    title,
    subtitle,
    tone: top.tone,
    dedupeKey: top.dedupeKey,
  };
}

export function buildEceMaintenanceHint(
  snapshot: MaintenanceBacklogSnapshot,
  avoidLines: string[] = [],
): string | null {
  if (snapshot.items.length === 0) return null;

  const top = snapshot.topItem ?? snapshot.items[0];
  const hints: Record<string, string> = {
    watch: 'Hazırlık sinyali düşük. Yine de ekip temposunu izlemeyi sürdür.',
    attention: 'Ekip temposu takip istiyor. Bir sonraki operasyonda yükü dengele.',
    strained: 'Hazırlık baskısı büyüyor. Kısa ve net müdahale yarına kapasite bırakır.',
    critical: 'Kritik hazırlık sinyali var. Sahaya çıkmadan önce kaynak durumunu netleştir.',
  };

  const hint = clamp(hints[top.severity] ?? top.description, 120);
  if (isDuplicateLine(hint, avoidLines)) return null;
  if (isDuplicateLine(hint, [snapshot.summary])) return null;
  return hint;
}
