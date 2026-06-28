import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';

import {
  DISPATCH_OVERALL_LABELS,
  READINESS_FIELD_ITEM_LABELS,
  READINESS_FIELD_VALUE_LABELS,
} from './operationReadinessConstants';
import {
  buildOperationReadinessSnapshot,
  mapReadinessToneToUiTone,
  pickDispatchSignals,
  pickFieldPulseSignals,
  pickResultCostSignals,
} from './operationReadinessModel';
import type {
  OperationReadinessContext,
  OperationReadinessSnapshot,
  ReadinessPhase,
  ReadinessSignalPresentation,
  ReadinessStatus,
} from './operationReadinessTypes';

export type DispatchReadinessRowPresentation = {
  id: 'team' | 'vehicle' | 'budget' | 'social';
  label: string;
  statusLabel: string;
  reason: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type DispatchReadinessPanelPresentation = {
  title: string;
  overallStatus: ReadinessStatus;
  overallLabel: string;
  items: DispatchReadinessRowPresentation[];
};

export type FieldResourcePulseItemPresentation = {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type FieldResourcePulsePresentation = {
  title: string;
  items: FieldResourcePulseItemPresentation[];
};

export type ResultResourceCostItemPresentation = {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type ResultResourceCostPresentation = {
  title: string;
  summary: string;
  tone: 'positive' | 'neutral' | 'warning' | 'mixed';
  items: ResultResourceCostItemPresentation[];
};

const DISPATCH_DOMAIN_TO_ROW_ID: Record<string, DispatchReadinessRowPresentation['id']> = {
  personnel: 'team',
  vehicle: 'vehicle',
  budget: 'budget',
  social: 'social',
};

function normalizeLine(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function isDuplicateLine(line: string, avoidLines: string[]): boolean {
  const normalized = normalizeLine(line);
  return avoidLines.some((avoid) => {
    const other = normalizeLine(avoid);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 18 && other.includes(normalized.slice(0, 18))) return true;
    if (other.length >= 18 && normalized.includes(other.slice(0, 18))) return true;
    return false;
  });
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildDispatchReadinessFromSnapshot(
  snapshot: OperationReadinessSnapshot,
): DispatchReadinessPanelPresentation {
  const items = pickDispatchSignals(snapshot).map((signal) => ({
    id: DISPATCH_DOMAIN_TO_ROW_ID[signal.domain] ?? 'team',
    label: signal.label,
    statusLabel: signal.statusLabel,
    reason: signal.description,
    tone: mapReadinessToneToUiTone(signal.tone),
    iconKey: signal.icon ?? 'information-circle-outline',
  }));

  return {
    title: 'Operasyon Hazırlığı',
    overallStatus: snapshot.overallStatus,
    overallLabel: DISPATCH_OVERALL_LABELS[snapshot.overallStatus] ?? snapshot.overallLabel,
    items,
  };
}

export function buildDispatchReadinessFromContext(
  ctx: OperationReadinessContext,
): DispatchReadinessPanelPresentation {
  return buildDispatchReadinessFromSnapshot(
    buildOperationReadinessSnapshot({ ...ctx, phase: 'dispatch' }),
  );
}

export function buildFieldResourcePulseFromReadiness(
  snapshot: OperationReadinessSnapshot,
): FieldResourcePulsePresentation {
  const items = pickFieldPulseSignals(snapshot).map((signal) => {
    const fieldLabel = READINESS_FIELD_ITEM_LABELS[signal.domain] ?? signal.label;
    const value =
      READINESS_FIELD_VALUE_LABELS[signal.domain]?.[signal.status] ?? signal.statusLabel;
    return {
      id: signal.domain,
      label: fieldLabel,
      value,
      description: signal.description,
      tone: mapReadinessToneToUiTone(signal.tone),
      iconKey: signal.icon ?? 'pulse-outline',
    };
  });

  return {
    title: 'Ekip Nabzı',
    items,
  };
}

export function buildFieldResourcePulseFromContext(
  ctx: OperationReadinessContext,
): FieldResourcePulsePresentation {
  return buildFieldResourcePulseFromReadiness(
    buildOperationReadinessSnapshot({ ...ctx, phase: 'field' }),
  );
}

export function buildResultResourceCostFromReadiness(
  snapshot: OperationReadinessSnapshot,
  options?: {
    outcomeTone?: OperationReadinessContext['outcomeTone'];
    personnelDescription?: string;
    vehicleDescription?: string;
  },
): ResultResourceCostPresentation {
  const signals = pickResultCostSignals(snapshot);
  const personnel = signals.find((s) => s.domain === 'personnel');
  const budget = signals.find((s) => s.domain === 'budget');
  const route = signals.find((s) => s.domain === 'route');

  const teamTone = personnel ? mapReadinessToneToUiTone(personnel.tone) : 'neutral';
  const resourceTone = budget ? mapReadinessToneToUiTone(budget.tone) : 'neutral';
  const tomorrowTone = teamTone === 'warning' || resourceTone === 'warning' ? 'warning' : 'neutral';

  let summary = snapshot.summary;
  if (options?.outcomeTone === 'positive' && teamTone === 'warning') {
    summary = 'Operasyon güveni toparladı, ancak ekip temposu yarına baskı taşıyabilir.';
  } else if (options?.outcomeTone === 'mixed') {
    summary = 'Sonuç iyi, ama bedelsiz değil. Kaynak baskısı yarına taşınabilir.';
  } else if (teamTone === 'warning') {
    summary = 'Kaynak bedeli yarınki kapasiteyi etkileyebilir.';
  } else {
    summary = 'Kaynak kullanımı kontrollü kaldı.';
  }

  const sectionTone: ResultResourceCostPresentation['tone'] =
    teamTone === 'warning' && resourceTone === 'warning'
      ? 'mixed'
      : teamTone === 'warning' || resourceTone === 'warning'
        ? 'warning'
        : 'neutral';

  return {
    title: 'Kararın Bedeli',
    summary,
    tone: sectionTone,
    items: [
      {
        id: 'team_tempo',
        label: 'Ekip temposu',
        value:
          READINESS_FIELD_VALUE_LABELS.personnel?.[personnel?.status ?? 'limited'] ??
          personnel?.statusLabel ??
          'Tempo korunuyor',
        description: options?.personnelDescription ?? personnel?.description,
        tone: teamTone,
      },
      {
        id: 'resource_use',
        label: 'Kaynak kullanımı',
        value:
          READINESS_FIELD_VALUE_LABELS.budget?.[budget?.status ?? 'ready'] ??
          budget?.statusLabel ??
          'Dengede',
        description: options?.vehicleDescription ?? budget?.description,
        tone: resourceTone,
      },
      {
        id: 'tomorrow_capacity',
        label: 'Yarın kapasitesi',
        value: tomorrowTone === 'warning' ? 'İzlenmeli' : 'Yeterli',
        tone: tomorrowTone,
      },
    ],
  };
}

export function buildResultResourceCostFromContext(
  ctx: OperationReadinessContext,
  options?: {
    personnelDescription?: string;
    vehicleDescription?: string;
  },
): ResultResourceCostPresentation {
  return buildResultResourceCostFromReadiness(
    buildOperationReadinessSnapshot({ ...ctx, phase: 'result' }),
    {
      outcomeTone: ctx.outcomeTone,
      personnelDescription: options?.personnelDescription,
      vehicleDescription: options?.vehicleDescription,
    },
  );
}

export function buildReportReadinessInsight(
  snapshot: OperationReadinessSnapshot,
  avoidLines: string[] = [],
): string | null {
  if (snapshot.overallStatus === 'unknown') return null;

  const strained = snapshot.signals.filter((s) => s.status === 'strained' || s.status === 'blocked');
  let line = snapshot.summary;

  if (strained.some((s) => s.domain === 'personnel')) {
    line = 'Bugün ekip temposu yüksek seyretti. Yarın kaynak baskısını dengelemek önemli.';
  } else if (strained.some((s) => s.domain === 'budget')) {
    line = 'Kaynak kullanımı plan sınırına yaklaştı; yarın kapasiteyi korumak önemli.';
  } else if (snapshot.overallStatus === 'ready') {
    line = 'Kaynak kullanımı dengede kaldı; sosyal nabız izlenmeye devam ediyor.';
  }

  const clamped = clamp(line, 160);
  if (isDuplicateLine(clamped, avoidLines)) return null;
  return clamped;
}

export function buildHubReadinessFeedItem(
  snapshot: OperationReadinessSnapshot,
): { title: string; body: string; tone: 'positive' | 'neutral' | 'warning' } | null {
  if (snapshot.overallStatus === 'ready' || snapshot.overallStatus === 'unknown') {
    return null;
  }
  if (snapshot.overallStatus === 'blocked') {
    return {
      title: 'Hazırlık eksik',
      body: 'Kritik hazırlık sinyalleri operasyon temposunu etkileyebilir.',
      tone: 'warning',
    };
  }
  if (snapshot.overallStatus === 'strained') {
    return {
      title: 'Kaynak Nabzı: Orta Baskı',
      body: 'Bugünkü operasyonlar kaynak baskısını artırabilir.',
      tone: 'warning',
    };
  }
  return {
    title: 'Ekip temposu izleniyor',
    body: snapshot.summary,
    tone: 'neutral',
  };
}

export function buildEceReadinessHint(
  snapshot: OperationReadinessSnapshot,
  avoidLines: string[] = [],
): string | null {
  const hints: Record<ReadinessStatus, string> = {
    ready: 'Hazırlık güçlü. Operasyonu başlatırken sosyal tepkiyi izlemeyi sürdür.',
    limited:
      'Kaynaklar yeterli ama sınırlı. Ekip temposunu yarına taşımamaya dikkat et.',
    strained: 'Hazırlık baskı altında. Daha kısa ve görünür bir müdahale güvenli olabilir.',
    blocked: 'Kritik hazırlık eksikleri var. Sahaya çıkmadan önce kaynakları netleştir.',
    unknown: 'Hazırlık sinyalleri sınırlı. İlk adımlarda kaynak temposunu izle.',
  };

  const hint = clamp(hints[snapshot.overallStatus], 120);
  if (isDuplicateLine(hint, avoidLines)) return null;
  if (isDuplicateLine(hint, [snapshot.summary])) return null;
  return hint;
}

export function buildOperationReadinessContextFromDispatchInput(input: {
  assignmentStatus?: OperationReadinessContext['assignmentStatus'];
  hasVehicle?: boolean;
  compatibilityBand?: OperationReadinessContext['compatibilityBand'];
  compatibilityTone?: OperationReadinessContext['compatibilityTone'];
  planStrategyId?: OperationReadinessContext['planStrategyId'];
  publicSatisfactionPreview?: number;
  playerStyleId?: PlayerStyleId | null;
}): OperationReadinessContext {
  return {
    phase: 'dispatch',
    assignmentStatus: input.assignmentStatus,
    hasVehicle: input.hasVehicle,
    compatibilityBand: input.compatibilityBand,
    compatibilityTone: input.compatibilityTone,
    planStrategyId: input.planStrategyId,
    publicSatisfactionPreview: input.publicSatisfactionPreview,
    playerStyleId: input.playerStyleId,
  };
}

export {
  buildOperationReadinessSnapshot,
  buildReadinessSignals,
  deriveReadinessOverallStatus,
} from './operationReadinessModel';

export type { OperationReadinessContext, OperationReadinessSnapshot, ReadinessPhase };
