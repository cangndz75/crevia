import {
  VEHICLE_MAINTENANCE_FORBIDDEN_COPY_TERMS,
  VEHICLE_MAINTENANCE_KIND_LABELS,
  VEHICLE_MAINTENANCE_MAX_VISIBLE_CHIPS,
  VEHICLE_MAINTENANCE_RISK_LABELS,
  VEHICLE_MAINTENANCE_STATUS_LABELS,
  VEHICLE_MAINTENANCE_TRADEOFF_LABELS,
} from './vehicleMaintenanceConstants';
import type {
  VehicleMaintenanceContext,
  VehicleMaintenancePresentationModel,
  VehicleMaintenanceRiskLevel,
  VehicleMaintenanceTone,
  VehicleMaintenanceWindowKind,
  VehicleMaintenanceWindowModel,
  VehicleMaintenanceWindowStatus,
} from './vehicleMaintenanceTypes';

export type VehicleMaintenancePresentationOptions = {
  compact?: boolean;
  surface?:
    | 'assignment'
    | 'dispatch'
    | 'field'
    | 'map'
    | 'report'
    | 'hub'
    | 'district_operation'
    | 'dev';
  includeCtaHint?: boolean;
  includeRecommendation?: boolean;
};

export function vehicleMaintenanceCopyContainsForbiddenTerms(text: string): string[] {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return VEHICLE_MAINTENANCE_FORBIDDEN_COPY_TERMS.filter((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function buildVehicleMaintenanceStatusLabel(
  status: VehicleMaintenanceWindowStatus,
): string {
  return VEHICLE_MAINTENANCE_STATUS_LABELS[status];
}

export function buildVehicleMaintenanceKindLabel(kind: VehicleMaintenanceWindowKind): string {
  return VEHICLE_MAINTENANCE_KIND_LABELS[kind];
}

export function buildVehicleMaintenanceRiskLabel(
  riskLevel: VehicleMaintenanceRiskLevel,
): string {
  return VEHICLE_MAINTENANCE_RISK_LABELS[riskLevel];
}

function resolvePresentationTone(model: VehicleMaintenanceWindowModel): VehicleMaintenanceTone {
  if (model.status === 'urgent' || model.riskLevel === 'critical') return 'urgent';
  if (model.riskLevel === 'high' || model.status === 'recommended') return 'strained';
  if (model.status === 'open') return 'positive';
  if (model.status === 'preview') return 'watch';
  return 'neutral';
}

export function buildVehicleMaintenanceSummaryLine(
  model: VehicleMaintenanceWindowModel,
  _context: VehicleMaintenanceContext = {},
): string {
  if (model.kind === 'fatigue_recovery') {
    return 'Araç yorgunluğu toparlanması için bakım penceresi açılabilir.';
  }
  if (model.kind === 'route_load_rebalance') {
    return 'Rota baskısı yükseliyor; bakım penceresi öneriliyor.';
  }
  if (model.kind === 'technical_inspection') {
    return 'Teknik ekip desteği yarınki araç yorgunluğunu azaltabilir.';
  }
  if (model.status === 'urgent') {
    return 'Araç bakımı bugün ertelenirse baskı yarına taşınabilir.';
  }
  return 'Araç bakımı bugün zorlanmadan planlanabilir.';
}

export function buildVehicleMaintenanceRiskLine(
  model: VehicleMaintenanceWindowModel,
  context: VehicleMaintenanceContext = {},
): string {
  if (model.riskLevel === 'critical' || model.riskLevel === 'high') {
    return 'Araç yorgunluğu yarına taşabilir.';
  }
  if (context.districtOperationCandidate?.definition.districtId === 'sanayi') {
    return 'Sanayi hattındaki rota baskısı bakım ihtiyacını artırıyor.';
  }
  if (model.tradeoffTypes.includes('push_today')) {
    return 'Bugünü zorlamak kısa vadede hız kazandırır ama yarını baskılayabilir.';
  }
  return 'Araç/rota baskısı izleniyor; bakım penceresi dengeli tutulabilir.';
}

export function buildVehicleMaintenanceTradeoffLine(
  model: VehicleMaintenanceWindowModel,
): string {
  if (model.tradeoffTypes.includes('protect_tomorrow')) {
    return 'Bugün bakım açmak hızı düşürür, yarını korur.';
  }
  if (model.tradeoffTypes.includes('rebalance_route')) {
    return 'Rota dengelemesi sahayı yavaşlatmadan baskıyı azaltabilir.';
  }
  if (model.tradeoffTypes.includes('push_today')) {
    return 'Hızlı devam etmek bugünü toparlar ama araç yorgunluğunu artırabilir.';
  }
  return 'İzlemeye almak kısa vadede hız korur, bakım kararını erteleyebilir.';
}

export function buildVehicleMaintenanceRecommendationLine(
  model: VehicleMaintenanceWindowModel,
  _context: VehicleMaintenanceContext = {},
): string | undefined {
  const teamId = model.suggestedTeamSpecializationId ?? '';
  if (teamId.includes('technical')) {
    return 'Teknik Ekip bu bakım penceresi için uygun.';
  }
  if (teamId.includes('route')) {
    return 'Rota Destek Ekibi araç yükünü dengelemek için öneriliyor.';
  }
  if (model.status === 'recommended' || model.status === 'urgent') {
    return 'Bakım penceresi bugün planlanması öneriliyor.';
  }
  return undefined;
}

export function buildVehicleMaintenanceCompactLine(
  model: VehicleMaintenanceWindowModel,
): string {
  return buildVehicleMaintenanceSummaryLine(model);
}

export function buildVehicleMaintenanceChips(
  model: VehicleMaintenanceWindowModel,
): VehicleMaintenancePresentationModel['chips'] {
  const tone = resolvePresentationTone(model);
  const chips = [
    {
      id: 'risk',
      label: buildVehicleMaintenanceRiskLabel(model.riskLevel),
      tone,
      iconKey: 'speedometer-outline',
    },
    {
      id: 'kind',
      label: buildVehicleMaintenanceKindLabel(model.kind),
      tone,
      iconKey: 'construct-outline',
    },
  ];

  const tradeoff = model.tradeoffTypes[0];
  if (tradeoff) {
    chips.push({
      id: tradeoff,
      label: VEHICLE_MAINTENANCE_TRADEOFF_LABELS[tradeoff],
      tone,
      iconKey: 'swap-horizontal-outline',
    });
  }

  return chips.slice(0, VEHICLE_MAINTENANCE_MAX_VISIBLE_CHIPS);
}

export function buildVehicleMaintenanceUnlockLine(
  context: VehicleMaintenanceContext = {},
): string {
  const permissions = context.unlockedPermissionIds ?? [];
  if (permissions.includes('vehicle_maintenance_window_preview')) {
    return 'Operasyon Sorumlusu yetkisiyle araç bakım pencereleri daha net görünür.';
  }
  if (permissions.includes('map_resource_layer')) {
    return 'Kaynak katmanı açıldığında araç bakım baskısı haritada izlenir.';
  }
  return 'Saha Koordinatörü yetkisiyle bakım penceresi daha görünür olur.';
}

export function buildVehicleMaintenanceEmptyState(
  surface: VehicleMaintenancePresentationOptions['surface'] = 'assignment',
): string {
  if (surface === 'dispatch') {
    return 'Araç bakım penceresi, rota ve kaynak baskısı netleşince görünür.';
  }
  if (surface === 'field') {
    return 'Saha fazında araç baskısı bakım kararını etkiler.';
  }
  if (surface === 'report') {
    return 'Bugün belirgin araç bakım penceresi oluşmadı.';
  }
  if (surface === 'map') {
    return 'Harita kaynak katmanı araç bakım baskısını gösterir.';
  }
  if (surface === 'hub') {
    return 'Araç bakım penceresi operasyon yetkisi ilerledikçe görünür.';
  }
  if (surface === 'dev') {
    return 'Vehicle maintenance foundation preview — runtime activation yok.';
  }
  return 'Araç bakım penceresi, rota ve kaynak baskısı netleşince görünür.';
}

export function buildVehicleMaintenancePresentationModel(
  model: VehicleMaintenanceWindowModel,
  options: VehicleMaintenancePresentationOptions = {},
): VehicleMaintenancePresentationModel {
  const compact = options.compact === true;
  const tone = resolvePresentationTone(model);

  return {
    id: model.id,
    title: model.title,
    subtitle: compact
      ? buildVehicleMaintenanceKindLabel(model.kind)
      : buildVehicleMaintenanceStatusLabel(model.status),
    statusLabel: buildVehicleMaintenanceStatusLabel(model.status),
    kindLabel: buildVehicleMaintenanceKindLabel(model.kind),
    riskLabel: buildVehicleMaintenanceRiskLabel(model.riskLevel),
    tone,
    compactLine: model.summaryLine || buildVehicleMaintenanceCompactLine(model),
    riskLine: model.riskLine || buildVehicleMaintenanceRiskLine(model),
    tradeoffLine: model.tradeoffLine || buildVehicleMaintenanceTradeoffLine(model),
    recommendationLine:
      options.includeRecommendation === false ? undefined : model.recommendationLine,
    chips: buildVehicleMaintenanceChips(model),
    ctaHint:
      options.includeCtaHint === false
        ? undefined
        : model.status === 'recommended' || model.status === 'urgent'
          ? 'Bakım penceresini incele'
          : model.status === 'preview'
            ? 'Yetki ilerledikçe görünür'
            : undefined,
    emptyStateLine: model.isVisibleToPlayer
      ? undefined
      : buildVehicleMaintenanceEmptyState(options.surface),
  };
}
