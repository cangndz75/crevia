import {
  ACTIVE_TASK_ROUTE_DOMAIN_LABELS,
  ACTIVE_TASK_ROUTE_MAX_VISIBLE_CHIPS,
  ACTIVE_TASK_ROUTE_PLAYER_FORBIDDEN_COPY_TERMS,
  ACTIVE_TASK_ROUTE_PRESSURE_LABELS,
  ACTIVE_TASK_ROUTE_STAGE_LABELS,
  ACTIVE_TASK_ROUTE_STATUS_LABELS,
} from './activeTaskRouteConstants';
import type {
  ActiveTaskRouteChipModel,
  ActiveTaskRouteContext,
  ActiveTaskRouteModel,
  ActiveTaskRoutePresentationModel,
  ActiveTaskRoutePressure,
  ActiveTaskRouteStage,
  ActiveTaskRouteStatus,
} from './activeTaskRouteTypes';

export type ActiveTaskRoutePresentationOptions = {
  compact?: boolean;
  surface?: 'map' | 'dispatch' | 'field' | 'result' | 'hub';
  includeCtaHint?: boolean;
};

export function buildActiveTaskRouteStageLabel(stage: ActiveTaskRouteStage): string {
  return ACTIVE_TASK_ROUTE_STAGE_LABELS[stage];
}

export function buildActiveTaskRouteStatusLabel(status: ActiveTaskRouteStatus): string {
  return ACTIVE_TASK_ROUTE_STATUS_LABELS[status];
}

export function buildActiveTaskRoutePressureLabel(
  pressure: ActiveTaskRoutePressure,
): string {
  return ACTIVE_TASK_ROUTE_PRESSURE_LABELS[pressure];
}

export function buildActiveTaskRouteCompactLine(routeModel: ActiveTaskRouteModel): string {
  const first = routeModel.nodes[0]?.shortLabel ?? 'Merkez';
  const target = routeModel.nodes[routeModel.nodes.length - 1]?.shortLabel ?? 'hedef';
  if (routeModel.status === 'inactive') return 'Aktif görev rotası beklemede.';
  if (routeModel.status === 'blocked') return 'Rota baskısı yüksek; yönlendirme kontrollü izleniyor.';
  if (routeModel.stage === 'on_site' || routeModel.stage === 'en_route') {
    return `Ekip ${target} hattında sahaya çıkıyor.`;
  }
  if (routeModel.stage === 'dispatch_ready' || routeModel.status === 'ready') {
    return `${first} → ${target} rotası yönlendirmeye hazır.`;
  }
  return `${first} → ${target} saha yönü izleniyor.`;
}

export function buildActiveTaskRouteRouteNote(routeModel: ActiveTaskRouteModel): string {
  if (routeModel.status === 'inactive') {
    return 'Rota önizlemesi, ekip ve araç seçimi sonrasında hazırlanır.';
  }
  if (routeModel.isPreviewOnly) {
    return 'Aktif görev rotası, seçili operasyonun saha yönünü özetler.';
  }
  return 'Aktif görev rotası, seçili operasyonun hedef mahallesini gösterir.';
}

export function buildActiveTaskRouteRiskLine(routeModel: ActiveTaskRouteModel): string {
  if (routeModel.riskLine) return routeModel.riskLine;
  if (routeModel.pressure === 'low') return 'Rota baskısı düşük, saha yönü dengeli.';
  if (routeModel.pressure === 'medium') return 'Rota baskısı izleniyor.';
  if (routeModel.pressure === 'high') return 'Araç/rota baskısı nedeniyle gecikme riski izleniyor.';
  return 'Kritik kaynak baskısı nedeniyle yönlendirme kontrollü tutulmalı.';
}

export function buildActiveTaskRouteChips(
  routeModel: ActiveTaskRouteModel,
): ActiveTaskRouteChipModel[] {
  return [
    {
      id: 'stage',
      label: buildActiveTaskRouteStageLabel(routeModel.stage),
      tone: routeModel.tone,
      iconKey: 'git-branch-outline',
    },
    {
      id: 'pressure',
      label: buildActiveTaskRoutePressureLabel(routeModel.pressure),
      tone: routeModel.tone,
      iconKey: 'speedometer-outline',
    },
    {
      id: 'domain',
      label: ACTIVE_TASK_ROUTE_DOMAIN_LABELS[routeModel.domain],
      tone: routeModel.tone,
      iconKey: 'layers-outline',
    },
  ].slice(0, ACTIVE_TASK_ROUTE_MAX_VISIBLE_CHIPS);
}

export function buildActiveTaskRouteEmptyState(
  surface: ActiveTaskRoutePresentationOptions['surface'] = 'map',
): string {
  if (surface === 'dispatch') {
    return 'Ekip ve araç seçimi sonrasında rota önizlemesi hazırlanır.';
  }
  if (surface === 'field') {
    return 'Saha görevi başladığında canlı rota durumu izlenir.';
  }
  if (surface === 'result') {
    return 'Rota özeti, saha sonucu tamamlandığında rapora bağlanır.';
  }
  if (surface === 'hub') {
    return 'Aktif görev rotası, canlı operasyon başladığında öne çıkar.';
  }
  return 'Aktif görev rotası, saha yönlendirmesi başladığında görünür.';
}

export function buildActiveTaskRouteUnlockPreviewLine(
  context: ActiveTaskRouteContext = {},
): string {
  if (!context.hasActiveTaskRouteLayer) {
    return 'Saha Koordinatörü yetkisiyle aktif görev rotası haritada güçlenir.';
  }
  if (!context.mapLayerContext?.hasActiveTask) {
    return 'Kaynak katmanı açıldığında rota baskısı daha net görünür.';
  }
  return 'Aktif görev rotası, seçili operasyonla birlikte harita bağlamına hazırlanır.';
}

export function buildActiveTaskRoutePresentationModel(
  routeModel: ActiveTaskRouteModel,
  options: ActiveTaskRoutePresentationOptions = {},
): ActiveTaskRoutePresentationModel {
  const compactLine = buildActiveTaskRouteCompactLine(routeModel);
  const routeNote = buildActiveTaskRouteRouteNote(routeModel);
  const chips = buildActiveTaskRouteChips(routeModel);
  return {
    id: routeModel.id,
    title: routeModel.title,
    subtitle: routeModel.summaryLine,
    statusLabel: buildActiveTaskRouteStatusLabel(routeModel.status),
    stageLabel: buildActiveTaskRouteStageLabel(routeModel.stage),
    pressureLabel: buildActiveTaskRoutePressureLabel(routeModel.pressure),
    tone: routeModel.tone,
    compactLine,
    routeNote,
    nodeLabels: routeModel.nodes.map((node) => node.shortLabel),
    segmentLabels: routeModel.segments.map((segment) => segment.label),
    chips,
    ctaHint: options.includeCtaHint ? buildActiveTaskRouteUnlockPreviewLine() : undefined,
    emptyStateLine: routeModel.isVisibleToPlayer
      ? undefined
      : buildActiveTaskRouteEmptyState(options.surface),
  };
}

export function activeTaskRouteCopyContainsForbiddenTerms(text: string): string[] {
  const haystack = text.toLocaleLowerCase('tr-TR');
  return ACTIVE_TASK_ROUTE_PLAYER_FORBIDDEN_COPY_TERMS.filter((term) =>
    haystack.includes(term.toLocaleLowerCase('tr-TR')),
  );
}
