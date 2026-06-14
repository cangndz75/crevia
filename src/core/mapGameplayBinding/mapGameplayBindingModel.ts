import type {
  MapGameplayBinding,
  MapGameplayBindingConfidence,
  MapGameplayBindingInput,
  MapGameplayDayRange,
  MapGameplayImplementationRisk,
  MapGameplayRole,
  MapGameplaySourceKind,
  MapGameplaySupportedDecision,
  MapGameplayVisibilityLevel,
} from './mapGameplayBindingTypes';

type BindingSeed = {
  id: string;
  role: MapGameplayRole;
  title: string;
  playerQuestion: string;
  supportedDecision: MapGameplaySupportedDecision;
  supportedDecisionLine: string;
  sourceKinds: MapGameplaySourceKind[];
  sourceIds: string[];
  requiredPermissionId?: string;
  requiredRankId?: string;
  visibilityLevel: MapGameplayVisibilityLevel;
  dayRange: MapGameplayDayRange;
  implementationRisk?: MapGameplayImplementationRisk;
  confidence: MapGameplayBindingConfidence;
  priority: number;
  isActionable: boolean;
  guardReason?: string;
};

type SourceBucket = {
  sourceKinds: MapGameplaySourceKind[];
  sourceIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function dayRangeFor(day: number): MapGameplayDayRange {
  if (day <= 1) return 'day_1';
  if (day < 8) return 'day_2_7';
  if (day < 10) return 'day_8_plus';
  return 'day_10_plus';
}

function clampPriority(priority: number): number {
  if (!Number.isFinite(priority)) return 0;
  return Math.max(0, Math.min(100, Math.round(priority)));
}

function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function hasSource(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (!isRecord(value)) return true;
  if (value.visible === false || value.enabled === false) return false;
  return Object.keys(value).length > 0;
}

function extractIds(prefix: string, value: unknown): string[] {
  if (!hasSource(value)) return [];
  if (typeof value === 'string' || typeof value === 'number') {
    return [`${prefix}:${String(value)}`];
  }
  if (Array.isArray(value)) {
    return dedupe(
      value.flatMap((item, index) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return `${prefix}:${String(item)}`;
        }
        if (isRecord(item) && typeof item.id === 'string') {
          return `${prefix}:${item.id}`;
        }
        if (isRecord(item) && typeof item.eventId === 'string') {
          return `${prefix}:${item.eventId}`;
        }
        return `${prefix}:${index}`;
      }),
    );
  }
  if (isRecord(value)) {
    for (const key of ['id', 'eventId', 'districtId', 'routeId', 'permissionId']) {
      if (typeof value[key] === 'string') {
        return [`${prefix}:${value[key]}`];
      }
    }
    return Object.keys(value).length > 0
      ? Object.keys(value).slice(0, 4).map((key) => `${prefix}:${key}`)
      : [`${prefix}:present`];
  }
  return [`${prefix}:present`];
}

function bucket(
  entries: Array<[MapGameplaySourceKind, string, unknown]>,
): SourceBucket {
  const sourceKinds: MapGameplaySourceKind[] = [];
  const sourceIds: string[] = [];
  for (const [kind, prefix, value] of entries) {
    if (!hasSource(value)) continue;
    sourceKinds.push(kind);
    sourceIds.push(...extractIds(prefix, value));
  }
  return {
    sourceKinds: dedupe(sourceKinds) as MapGameplaySourceKind[],
    sourceIds: dedupe(sourceIds),
  };
}

function hasPermission(input: MapGameplayBindingInput, permissionIds: readonly string[]): boolean {
  const permissions = new Set(input.unlockedPermissionIds ?? []);
  return permissionIds.some((permissionId) => permissions.has(permissionId));
}

function hasSpatialSignal(value: unknown): boolean {
  if (!hasSource(value)) return false;
  if (Array.isArray(value)) return value.some(hasSpatialSignal);
  if (!isRecord(value)) return false;
  return [
    'districtId',
    'neighborhoodId',
    'mapDistrictId',
    'location',
    'coordinates',
    'lat',
    'lng',
    'x',
    'y',
  ].some((key) => value[key] != null);
}

function createBinding(seed: BindingSeed): MapGameplayBinding {
  return {
    ...seed,
    sourceKinds: dedupe(seed.sourceKinds) as MapGameplaySourceKind[],
    sourceIds: dedupe(seed.sourceIds),
    supportedDecisionLine: seed.supportedDecisionLine.trim() || 'Karar destegi yok.',
    implementationRisk: seed.implementationRisk ?? 'low',
    priority: clampPriority(seed.priority),
  };
}

function resolvePermissionVisibility(input: {
  day: number;
  hasSource: boolean;
  hasPermission: boolean;
  allowTeaser: boolean;
  minSummaryDay: number;
  minDetailedDay: number;
}): MapGameplayVisibilityLevel {
  if (!input.hasSource) return input.allowTeaser ? 'teaser' : 'hidden';
  if (input.day < input.minSummaryDay) return input.allowTeaser ? 'teaser' : 'hidden';
  if (input.hasPermission && input.day >= input.minDetailedDay) return 'detailed';
  if (input.hasPermission) return 'summary';
  return input.allowTeaser ? 'teaser' : 'hidden';
}

export function buildMapGameplayBindings(
  input: MapGameplayBindingInput,
): MapGameplayBinding[] {
  const day = Number.isFinite(input.day) ? input.day : 1;
  const dayRange = dayRangeFor(day);
  const activeIds = dedupe(input.activeEventIds ?? []);
  const activeSource = bucket([
    ['active_event', 'active_event', activeIds.length > 0 ? activeIds : input.activeOperationContext],
    ['assignment', 'assignment', input.activeOperationContext],
    ['active_task_route', 'active_task_route', input.activeTaskRouteSignals],
  ]);
  const districtRiskSource = bucket([
    ['district_trust', 'district_trust', input.districtTrustSignals],
    ['social_pulse', 'social_pulse', input.socialSignals],
    ['operation_signal', 'operation_signal', input.operationSignals],
  ]);
  const resourceSource = bucket([
    ['resource_pressure', 'resource_pressure', input.resourceSignals],
    ['personnel_presence', 'personnel_presence', input.personnelPresence],
    ['vehicle_presence', 'vehicle_presence', input.vehiclePresence],
    ['container_presence', 'container_presence', input.containerPresence],
  ]);
  const memorySource = bucket([
    ['district_memory', 'district_memory', input.districtMemorySignals],
    ['city_archive', 'city_archive', input.cityArchiveSignals],
    ['decision_consequence', 'decision_consequence', input.decisionConsequenceSignals],
  ]);
  const routeSource = bucket([
    ['active_task_route', 'active_task_route', input.activeTaskRouteSignals],
    ['vehicle_maintenance', 'vehicle_maintenance', input.vehiclePresence],
    ['operation_signal', 'operation_signal', input.operationSignals],
  ]);
  const resultSource = bucket([
    ['decision_consequence', 'decision_consequence', input.decisionConsequenceSignals],
    ['city_archive', 'city_archive', input.cityArchiveSignals],
    ['before_after', 'before_after', input.decisionConsequenceSignals],
  ]);
  const authoritySource = bucket([
    ['map_layer_permission', 'map_layer_permission', input.mapLayerStatuses],
    ['authority_permission', 'authority_permission', input.unlockedPermissionIds],
  ]);
  const tomorrowRiskSpatial = hasSpatialSignal(input.tomorrowRiskSignals);
  const hasActive = activeSource.sourceIds.length > 0;
  const hasDistrictRisk = districtRiskSource.sourceIds.length > 0;
  const hasResource = resourceSource.sourceIds.length > 0;
  const hasMemory = memorySource.sourceIds.length > 0;
  const hasRoute = bucket([
    ['active_task_route', 'active_task_route', input.activeTaskRouteSignals],
  ]).sourceIds.length > 0;
  const hasResult = resultSource.sourceIds.length > 0;
  const hasAuthority = authoritySource.sourceIds.length > 0;
  const districtPermission = hasPermission(input, ['district_trust_preview', 'map_trust_layer']);
  const resourcePermission = hasPermission(input, ['resource_pressure_summary', 'map_resource_layer']);
  const routePermission = hasPermission(input, ['assignment_fit_preview', 'map_route_layer', 'active_task_route']);
  const memoryPermission = hasPermission(input, ['district_memory_trace_preview', 'map_memory_layer']);
  const authorityPermission = hasPermission(input, ['map_resource_layer', 'map_trust_layer', 'map_social_layer']);

  const overviewSources = hasActive
    ? activeSource
    : { sourceKinds: ['fallback' as const], sourceIds: ['fallback:map_overview_day1'] };

  const bindings: MapGameplayBinding[] = [
    createBinding({
      id: 'map_overview_day1',
      role: 'overview',
      title: 'Harita Ozeti',
      playerQuestion: 'Aktif olay nerede?',
      supportedDecision: hasActive ? 'open_active_operation' : 'none',
      supportedDecisionLine: hasActive
        ? 'Harita aktif operasyonu acma kararini destekler.'
        : 'Aktif olay kaynagi yok; sadece guvenli genel harita ozeti kalir.',
      sourceKinds: overviewSources.sourceKinds,
      sourceIds: overviewSources.sourceIds,
      visibilityLevel: day === 1 ? 'summary' : 'teaser',
      dayRange: 'day_1',
      confidence: hasActive ? 'medium' : 'low',
      priority: hasActive ? 92 : 20,
      isActionable: hasActive,
      guardReason: hasActive ? undefined : 'active_event_source_missing',
    }),
    createBinding({
      id: 'active_operation_tracker',
      role: 'operation_tracker',
      title: 'Aktif Operasyon Takibi',
      playerQuestion: 'Operasyon hangi fazda ve nerede?',
      supportedDecision: hasActive ? 'open_active_operation' : 'none',
      supportedDecisionLine: hasActive
        ? 'Aktif operasyon kaynagina giderek operasyonu acabilirsin.'
        : 'Aktif operasyon veya rota kaynagi olmadan takip iddiasi kurulmaz.',
      sourceKinds: activeSource.sourceKinds,
      sourceIds: activeSource.sourceIds,
      visibilityLevel: hasActive ? (day >= 2 ? 'summary' : 'teaser') : 'hidden',
      dayRange: day < 8 ? 'day_2_7' : dayRange,
      confidence: hasRoute ? 'high' : hasActive ? 'medium' : 'low',
      priority: hasActive ? 90 : 5,
      isActionable: hasActive,
      guardReason: hasActive ? undefined : 'active_operation_source_missing',
    }),
    createBinding({
      id: 'district_risk_reader',
      role: 'risk_reader',
      title: 'Mahalle Risk Okuma',
      playerQuestion: 'Hangi mahalle hassas?',
      supportedDecision: districtPermission ? 'monitor_district_trust' : 'choose_strategy_style',
      supportedDecisionLine: hasDistrictRisk
        ? 'Mahalle guven ve sosyal nabiz sinyali strateji stilini destekler.'
        : 'Mahalle riski icin guven, sosyal nabiz veya operasyon sinyali gerekir.',
      sourceKinds: districtRiskSource.sourceKinds,
      sourceIds: districtRiskSource.sourceIds,
      requiredPermissionId: 'district_trust_preview',
      requiredRankId: 'district_supervisor',
      visibilityLevel: resolvePermissionVisibility({
        day,
        hasSource: hasDistrictRisk,
        hasPermission: districtPermission,
        allowTeaser: day >= 2,
        minSummaryDay: 2,
        minDetailedDay: 4,
      }),
      dayRange,
      confidence: hasDistrictRisk && districtPermission ? 'high' : hasDistrictRisk ? 'medium' : 'low',
      priority: hasDistrictRisk ? 78 : 15,
      isActionable: hasDistrictRisk,
      guardReason: hasDistrictRisk ? undefined : 'district_risk_source_missing',
    }),
    createBinding({
      id: 'resource_pressure_board',
      role: 'resource_board',
      title: 'Kaynak Baskisi',
      playerQuestion: 'Kaynak baskisi nerede?',
      supportedDecision: hasResource ? 'monitor_resource_pressure' : 'none',
      supportedDecisionLine: hasResource
        ? 'Kaynak, personel, arac ve konteyner sinyalleri kaynak kararini destekler.'
        : 'Kaynak baskisi icin gercek kaynak veya varlik sinyali gerekir.',
      sourceKinds: resourceSource.sourceKinds,
      sourceIds: resourceSource.sourceIds,
      requiredPermissionId: 'resource_pressure_summary',
      requiredRankId: 'field_coordinator',
      visibilityLevel: resolvePermissionVisibility({
        day,
        hasSource: hasResource,
        hasPermission: resourcePermission,
        allowTeaser: day >= 8,
        minSummaryDay: 8,
        minDetailedDay: 8,
      }),
      dayRange: day >= 8 ? dayRange : 'day_8_plus',
      confidence: hasResource && resourcePermission ? 'high' : hasResource ? 'medium' : 'low',
      priority: hasResource && day >= 8 ? 86 : 12,
      isActionable: hasResource && day >= 8,
      guardReason: hasResource ? undefined : 'resource_source_missing',
    }),
    createBinding({
      id: 'district_memory_trace',
      role: 'district_memory',
      title: 'Mahalle Hafiza Izi',
      playerQuestion: 'Onceki kararim burada iz birakti mi?',
      supportedDecision: hasMemory ? 'return_to_district' : 'none',
      supportedDecisionLine: hasMemory
        ? 'Gercek hafiza veya arsiv izi mahalleye donme kararini destekler.'
        : 'Hafiza kaynagi yoksa sehir hafizasi iddiasi kurulmaz.',
      sourceKinds: memorySource.sourceKinds,
      sourceIds: memorySource.sourceIds,
      requiredPermissionId: 'district_memory_trace_preview',
      requiredRankId: 'district_supervisor',
      visibilityLevel: resolvePermissionVisibility({
        day,
        hasSource: hasMemory,
        hasPermission: memoryPermission,
        allowTeaser: false,
        minSummaryDay: 8,
        minDetailedDay: 10,
      }),
      dayRange: day >= 10 ? 'day_10_plus' : 'day_8_plus',
      confidence: hasMemory && memoryPermission ? 'high' : hasMemory ? 'medium' : 'low',
      priority: hasMemory ? 68 : 8,
      isActionable: hasMemory,
      guardReason: hasMemory ? undefined : 'district_memory_source_missing',
    }),
    createBinding({
      id: 'route_support_hint',
      role: 'route_support',
      title: 'Rota Destek Sinyali',
      playerQuestion: 'Bu hatta rota/arac baskisi var mi?',
      supportedDecision: hasRoute ? 'monitor_route_pressure' : 'none',
      supportedDecisionLine: hasRoute
        ? 'Aktif rota kaynagi rota baskisini izleme kararini destekler.'
        : 'Aktif rota kaynagi yoksa rota hatti iddiasi kurulmaz.',
      sourceKinds: hasRoute ? routeSource.sourceKinds : [],
      sourceIds: hasRoute ? routeSource.sourceIds : [],
      requiredPermissionId: 'assignment_fit_preview',
      requiredRankId: 'field_coordinator',
      visibilityLevel: resolvePermissionVisibility({
        day,
        hasSource: hasRoute,
        hasPermission: routePermission,
        allowTeaser: day >= 3,
        minSummaryDay: 3,
        minDetailedDay: 8,
      }),
      dayRange: day >= 8 ? dayRange : 'day_2_7',
      confidence: hasRoute && routePermission ? 'high' : hasRoute ? 'medium' : 'low',
      priority: hasRoute ? 76 : 6,
      isActionable: hasRoute,
      guardReason: hasRoute ? undefined : 'active_task_route_source_missing',
    }),
    createBinding({
      id: 'result_trace_stamp',
      role: 'result_trace',
      title: 'Sonuc Izi',
      playerQuestion: 'Sonuc sehirde nerede gorundu?',
      supportedDecision: hasResult ? 'inspect_result_trace' : 'none',
      supportedDecisionLine: hasResult
        ? 'Karar sonucu veya arsiv izi sonuc incelemesini destekler.'
        : 'Sonuc izi icin karar sonucu, once/sonra veya arsiv kaynagi gerekir.',
      sourceKinds: resultSource.sourceKinds,
      sourceIds: resultSource.sourceIds,
      visibilityLevel: hasResult && day >= 8 ? 'summary' : 'hidden',
      dayRange: day >= 8 ? dayRange : 'day_8_plus',
      confidence: hasResult ? 'medium' : 'low',
      priority: hasResult ? 58 : 5,
      isActionable: hasResult && day >= 8,
      guardReason: hasResult ? undefined : 'result_trace_source_missing',
    }),
    createBinding({
      id: 'authority_layer_surface',
      role: 'authority_unlock_surface',
      title: 'Yetki Katmani',
      playerQuestion: 'Yetkim bana hangi yeni bilgiyi acti?',
      supportedDecision: 'understand_unlocked_layer',
      supportedDecisionLine: hasAuthority
        ? 'Yetki ve harita katmani kaynaklari acilan bilgiyi aciklar.'
        : 'Yetki veya katman kaynagi olmadan detayli katman bilgisi gosterilmez.',
      sourceKinds: authoritySource.sourceKinds,
      sourceIds: authoritySource.sourceIds,
      requiredPermissionId: 'map_resource_layer',
      requiredRankId: 'city_operations_manager',
      visibilityLevel: resolvePermissionVisibility({
        day,
        hasSource: hasAuthority,
        hasPermission: authorityPermission,
        allowTeaser: day >= 10 || hasAuthority,
        minSummaryDay: 10,
        minDetailedDay: 10,
      }),
      dayRange: 'day_10_plus',
      confidence: hasAuthority && authorityPermission ? 'high' : hasAuthority ? 'medium' : 'low',
      priority: hasAuthority ? 64 : 10,
      isActionable: hasAuthority && day >= 10,
      guardReason: hasAuthority ? undefined : 'authority_or_map_layer_source_missing',
    }),
  ];

  if (tomorrowRiskSpatial) {
    bindings.push(
      createBinding({
        id: 'tomorrow_spatial_risk_hint',
        role: 'risk_reader',
        title: 'Yarin Mekansal Risk',
        playerQuestion: 'Yarin hangi bolge baski yaratabilir?',
        supportedDecision: 'choose_strategy_style',
        supportedDecisionLine: 'Mekansal yarin riski strateji stilini destekler.',
        sourceKinds: ['tomorrow_risk'],
        sourceIds: extractIds('tomorrow_risk', input.tomorrowRiskSignals),
        requiredPermissionId: 'advisor_specialist_notes_preview',
        requiredRankId: 'operations_assistant',
        visibilityLevel: day >= 8 && hasPermission(input, ['advisor_specialist_notes_preview']) ? 'summary' : 'teaser',
        dayRange,
        confidence: 'medium',
        priority: 55,
        isActionable: day >= 8,
      }),
    );
  }

  return bindings.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}
