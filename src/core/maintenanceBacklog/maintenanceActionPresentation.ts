import {
  applyMaintenanceActionToRuntimeState,
  hasMaintenanceActionToday,
  isMaintenanceActionEligible,
  selectPrimaryMaintenanceActionKind,
} from './maintenanceActionModel';
import {
  buildMaintenanceEconomyCompactPreview,
  buildMaintenanceEconomyPreview,
  canStartMaintenanceEconomyPlan,
  estimateMaintenanceEconomyPlan,
} from './maintenanceEconomyModel';
import type {
  MaintenanceActionKind,
  MaintenanceActionPresentation,
  MaintenanceActionResultPresentation,
  MaintenanceActionSurface,
  MaintenanceActionTone,
  MaintenanceActionUiBundle,
} from './maintenanceActionTypes';
import { MAINTENANCE_ACTION_DOMAIN_KINDS } from './maintenanceActionTypes';
import { selectActiveMaintenanceRuntimeItems } from './maintenanceBacklogRuntimeModel';
import {
  buildMaintenanceBacklogRuntimePresentation,
  buildMaintenanceRuntimeDispatchHint,
  buildMaintenanceRuntimeFieldHint,
  buildMaintenanceRuntimeResultHint,
} from './maintenanceBacklogRuntimePresentation';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
} from './maintenanceBacklogRuntimeTypes';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import type { OperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessTypes';

const ACTION_COPY: Record<
  MaintenanceActionKind,
  { label: string; description: string; resultPreview: string; feedback: string }
> = {
  monitor: {
    label: 'İzlemeye Al',
    description: 'Bu sinyal yeni operasyonlarda takipte kalır.',
    resultPreview: 'Takip modunda izlenecek.',
    feedback: 'Takibe alındı.',
  },
  rebalance: {
    label: 'Yükü Dengele',
    description: 'Operasyon temposunu yumuşatır, baskıyı bir kademe azaltabilir.',
    resultPreview: 'Baskı yumuşatılacak.',
    feedback: 'Hazırlık baskısı azaltıldı.',
  },
  inspect: {
    label: 'Kontrol Et',
    description: 'Hazırlık sinyalini netleştirir ve gereksiz baskıyı azaltabilir.',
    resultPreview: 'Kontrol sinyali güncellenecek.',
    feedback: 'Kontrol sinyali güncellendi.',
  },
  stabilize: {
    label: 'Akışı Sabitle',
    description: 'Rota veya ekip temposundaki dalgalanmayı azaltır.',
    resultPreview: 'Akış sabitlenecek.',
    feedback: 'Hazırlık baskısı azaltıldı.',
  },
  defer: {
    label: 'Ertele',
    description: 'Bu sinyal yarına taşınır. Baskı artabilir.',
    resultPreview: 'Yarın için takipte kalacak.',
    feedback: 'Yarın için takipte.',
  },
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  watching: 'İzleniyor',
  carried: 'Taşındı',
  resolved: 'Dengede',
};

function severityToTone(severity: MaintenanceRuntimeItem['severity']): MaintenanceActionTone {
  if (severity === 'critical') return 'critical';
  if (severity === 'strained') return 'warning';
  return 'mixed';
}

function surfacePreferredKinds(surface: MaintenanceActionSurface): MaintenanceActionKind[] | undefined {
  if (surface === 'field') return ['monitor', 'stabilize'];
  if (surface === 'result') return ['monitor', 'inspect'];
  return undefined;
}

export function buildMaintenanceActionPresentation(
  item: MaintenanceRuntimeItem,
  actionKind: MaintenanceActionKind,
  currentDay: number,
  runtime?: MaintenanceBacklogRuntimeState,
): MaintenanceActionPresentation {
  const copy = ACTION_COPY[actionKind];
  const enabled = runtime
    ? isMaintenanceActionEligible(item, actionKind, currentDay, runtime)
    : isMaintenanceActionEligible(item, actionKind, currentDay);
  const economyPlan = estimateMaintenanceEconomyPlan({
    domain: item.domain,
    severity: item.severity,
    actionKind,
    currentDay,
  });
  const economyPreview = buildMaintenanceEconomyPreview(economyPlan);
  const compactPreview = buildMaintenanceEconomyCompactPreview(economyPlan);

  const disabledReason = !enabled
    ? hasMaintenanceActionToday(item, currentDay)
      ? 'Bugün bu sinyal için müdahale yapıldı.'
      : item.status === 'resolved'
        ? 'Sinyal zaten dengede.'
        : item.severity === 'critical' && actionKind === 'defer'
          ? 'Kritik sinyal ertelenemez.'
          : item.severity === 'critical' && actionKind === 'monitor'
            ? 'Bu sinyal yalnızca izlenebilir.'
            : runtime && !canStartMaintenanceEconomyPlan(
                  runtime,
                  item,
                  estimateMaintenanceEconomyPlan({
                    domain: item.domain,
                    severity: item.severity,
                    actionKind,
                    currentDay,
                  }),
                )
              ? 'Aynı anda en fazla 3 hazırlık planı izlenebilir.'
            : 'Bu müdahale şu an uygun değil.'
    : undefined;

  return {
    itemId: item.id,
    actionKind,
    label: copy.label,
    description: copy.description,
    tone: severityToTone(item.severity),
    enabled,
    disabledReason,
    resultPreview: copy.resultPreview,
    costPreview: economyPreview.costLabel,
    effortPreview: economyPreview.effortLabel,
    durationPreview: economyPreview.durationLabel,
    effectPreview: economyPreview.effectLabel,
    compactPreview,
  };
}

export function buildMaintenanceActionResultPresentation(
  item: MaintenanceRuntimeItem,
  actionKind: MaintenanceActionKind,
): MaintenanceActionResultPresentation {
  const copy = ACTION_COPY[actionKind];
  const tone: MaintenanceActionTone =
    item.status === 'resolved' ? 'positive' : severityToTone(item.severity);

  return {
    title: copy.feedback,
    description:
      item.status === 'resolved'
        ? 'Hazırlık sinyali bugün için dengede.'
        : copy.feedback,
    tone,
    updatedStatusLabel: STATUS_LABELS[item.status] ?? 'İzleniyor',
  };
}

export function buildMaintenanceActionsForItem(
  item: MaintenanceRuntimeItem,
  currentDay: number,
  surface: MaintenanceActionSurface,
  runtime?: MaintenanceBacklogRuntimeState,
): MaintenanceActionPresentation[] {
  const preferred = surfacePreferredKinds(surface);
  const kinds = preferred ?? MAINTENANCE_ACTION_DOMAIN_KINDS[item.domain];
  return kinds
    .map((kind) => buildMaintenanceActionPresentation(item, kind, currentDay, runtime))
    .filter((action) => action.enabled || action.disabledReason);
}

export function selectPrimaryMaintenanceAction(
  runtime: MaintenanceBacklogRuntimeState,
  currentDay: number,
  surface: MaintenanceActionSurface,
): MaintenanceActionPresentation | null {
  const top = selectActiveMaintenanceRuntimeItems(runtime, 1)[0];
  if (!top) return null;

  const kind = selectPrimaryMaintenanceActionKind(
    top,
    currentDay,
    surfacePreferredKinds(surface),
  );
  if (!kind) return null;

  return buildMaintenanceActionPresentation(top, kind, currentDay, runtime);
}

export function buildMaintenanceActionUiBundle(params: {
  runtime: MaintenanceBacklogRuntimeState;
  currentDay: number;
  surface: MaintenanceActionSurface;
  readinessSnapshot?: OperationReadinessSnapshot;
  avoidLines?: string[];
  lastFeedback?: MaintenanceActionResultPresentation | null;
}): MaintenanceActionUiBundle {
  const presentation = buildMaintenanceBacklogRuntimePresentation(params.runtime, {
    readinessSnapshot:
      params.readinessSnapshot ??
      buildOperationReadinessSnapshot({
        phase:
          params.surface === 'dispatch'
            ? 'dispatch'
            : params.surface === 'field'
              ? 'field'
              : 'result',
      }),
    avoidLines: params.avoidLines,
  });

  const avoid = params.avoidLines ?? [];
  let hintText: string | undefined;
  let hintTone: MaintenanceActionTone | undefined;
  let countLabel: string | undefined;

  if (params.surface === 'dispatch') {
    const hint = buildMaintenanceRuntimeDispatchHint(presentation, avoid);
    hintText = hint?.text;
    hintTone = hint?.tone;
    countLabel = hint?.countLabel;
  } else if (params.surface === 'field') {
    const hint = buildMaintenanceRuntimeFieldHint(presentation, avoid);
    hintText = hint?.text;
    hintTone = hint?.tone;
  } else {
    const hint = buildMaintenanceRuntimeResultHint(presentation, avoid);
    hintText = hint ?? undefined;
    hintTone = presentation.overallTone;
  }

  const action =
    presentation.hasRuntimeItems
      ? selectPrimaryMaintenanceAction(params.runtime, params.currentDay, params.surface)
      : null;

  return {
    hintText,
    hintTone,
    countLabel,
    action,
    feedback: params.lastFeedback ?? null,
  };
}

export function buildEceMaintenanceActionHint(
  item: MaintenanceRuntimeItem | null,
  actionKind: MaintenanceActionKind | null,
  avoidLines: string[] = [],
): string | null {
  if (!item || !actionKind) return null;

  const hints: Partial<Record<MaintenanceActionKind, string>> = {
    monitor: 'Hazırlık sinyalini takibe alman doğru. Şimdi operasyonu kısa tut.',
    rebalance: 'Baskıyı azalttın, ama kritik sinyal tamamen kapanmış sayılmaz.',
    inspect: 'Kontrol sinyali netleşti. Yeni hamlede kaynakları zorlamamaya çalış.',
    stabilize: 'Ekip temposu izleniyor. Yeni hamlede kaynakları zorlamamaya çalış.',
    defer: 'Sinyal yarına taşındı. İlk hamlede hazırlığı göz ardı etme.',
  };

  const hint = hints[actionKind];
  if (!hint) return null;

  const normalized = hint.toLocaleLowerCase('tr-TR');
  if (avoidLines.some((line) => line.toLocaleLowerCase('tr-TR').includes(normalized.slice(0, 18)))) {
    return null;
  }

  return hint;
}

export {
  applyMaintenanceActionToRuntimeState,
  hasMaintenanceActionToday,
  isMaintenanceActionEligible,
};
