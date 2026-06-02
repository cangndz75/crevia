import {
  CREVIA_MAP_LAYER_DEFINITIONS,
  CREVIA_MAP_LAYER_SAFE_DEFAULT_LAYER_ID,
} from './mapLayerConstants';
import {
  buildCompactMapLayerChips,
  buildMapLayerSummaryLine,
  buildMapLayerUnlockHintLine,
} from './mapLayerPresentation';
import type {
  CreviaMapLayerContext,
  CreviaMapLayerDefinition,
  CreviaMapLayerId,
  CreviaMapLayerState,
  CreviaMapLayerStatus,
  CreviaMapLayerViewModel,
  CreviaMapLayerVisibilityMode,
} from './mapLayerTypes';

const DEFINITIONS_BY_ID = new Map(CREVIA_MAP_LAYER_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getMapLayerDefinition(
  layerId: CreviaMapLayerId,
): CreviaMapLayerDefinition | undefined {
  return DEFINITIONS_BY_ID.get(layerId);
}

export function getAllMapLayerDefinitions(): readonly CreviaMapLayerDefinition[] {
  return CREVIA_MAP_LAYER_DEFINITIONS;
}

function hasPermission(context: CreviaMapLayerContext, permissionId?: string): boolean {
  if (!permissionId) return true;
  return (context.unlockedPermissionIds ?? []).includes(permissionId);
}

function meetsDay(definition: CreviaMapLayerDefinition, context: CreviaMapLayerContext): boolean {
  return (context.day ?? 1) >= (definition.minDay ?? 1);
}

function hasRequiredProgress(definition: CreviaMapLayerDefinition, context: CreviaMapLayerContext): boolean {
  if (definition.minAuthority != null && (context.authorityTrust ?? 0) < definition.minAuthority) return false;
  if (definition.minXp != null && (context.xp ?? 0) < definition.minXp) return false;
  return true;
}

export function resolveMapLayerStatus(
  definition: CreviaMapLayerDefinition,
  context: CreviaMapLayerContext = {},
): CreviaMapLayerStatus {
  const day = context.day ?? 1;
  if (definition.isFutureOnly) return 'future';
  if (definition.id === 'base_districts') return 'available';
  if (day <= 1 && definition.category !== 'base' && definition.id !== 'district_identity') {
    return definition.playerFacingPriority <= 40 ? 'preview' : 'hidden';
  }

  if (definition.id === 'crisis_watch' && context.hasCrisisState && day > 1) {
    return hasPermission(context, definition.requiredPermissionId) || context.isFullMode ? 'available' : 'preview';
  }
  if (definition.id === 'district_trust' && (context.hasDistrictTrustPreview || hasPermission(context, definition.requiredPermissionId))) {
    return meetsDay(definition, context) ? 'available' : 'preview';
  }
  if (definition.id === 'district_memory' && (context.hasDistrictMemoryPreview || hasPermission(context, definition.requiredPermissionId))) {
    return meetsDay(definition, context) ? 'available' : 'preview';
  }
  if (definition.id === 'active_task_route' && context.hasActiveTask) {
    return day >= 2 ? 'available' : 'preview';
  }
  if (definition.id === 'operation_era' && context.hasOperationEra) {
    return day >= (definition.minDay ?? 8) ? 'available' : 'preview';
  }

  if (!meetsDay(definition, context)) {
    return day + 1 >= (definition.minDay ?? 1) ? 'preview' : 'hidden';
  }
  if (!hasRequiredProgress(definition, context)) return 'locked_by_rank';
  if (!hasPermission(context, definition.requiredPermissionId)) {
    return context.isLimitedMode ? 'preview' : 'locked_by_rank';
  }
  return 'available';
}

export function resolveMapLayerVisibilityMode(
  layerState: Pick<CreviaMapLayerState, 'status'>,
): CreviaMapLayerVisibilityMode {
  if (layerState.status === 'hidden' || layerState.status === 'future') return 'hidden';
  if (layerState.status === 'preview' || layerState.status === 'locked_by_rank') return 'compact';
  return 'standard';
}

export function isMapLayerSelectable(state: Pick<CreviaMapLayerState, 'status'>): boolean {
  return state.status === 'active' || state.status === 'available';
}

export function getMapLayerUnlockReason(
  definition: CreviaMapLayerDefinition,
  context: CreviaMapLayerContext = {},
): string {
  if (definition.id === 'base_districts') return 'Temel mahalle görünümü her zaman açık.';
  if (definition.id === 'district_identity') return 'Mahalle kimliği erken operasyon görünümünde yer alır.';
  if (definition.id === 'resource_pressure') return 'Saha Koordinatörü yetkisiyle kaynak baskısı görünür.';
  if (definition.id === 'district_trust') return 'Bölge Sorumlusu olduğunda mahalle güveni haritada gündeme gelir.';
  if (definition.id === 'district_memory') return 'Mahalle hafıza izi ilerleyen güven yetkisiyle görünür.';
  if (definition.id === 'active_task_route') return 'Aktif görev rotası saha yönlendirmesiyle görünür.';
  if (definition.id === 'city_development') return 'Şehir gelişimi ilerleyen yetkilerle gündeme gelir.';
  if (!meetsDay(definition, context)) return `Gün ${definition.minDay ?? 1} sonrasında harita kapsamına girer.`;
  if (definition.requiredPermissionId) return `${definition.shortLabel} katmanı operasyon yetkisiyle açılır.`;
  return `${definition.shortLabel} katmanı harita kapsamına hazır.`;
}

export function buildMapLayerState(
  definition: CreviaMapLayerDefinition,
  context: CreviaMapLayerContext = {},
): CreviaMapLayerState {
  const status = resolveMapLayerStatus(definition, context);
  const state: CreviaMapLayerState = {
    definition,
    status,
    visibilityMode: 'hidden',
    reasonLine: getMapLayerUnlockReason(definition, context),
    unlockLine:
      status === 'preview' || status === 'locked_by_rank' || status === 'future'
        ? getMapLayerUnlockReason(definition, context)
        : undefined,
    isSelectable: false,
    isRecommended: false,
    priority: definition.playerFacingPriority,
  };
  state.visibilityMode = resolveMapLayerVisibilityMode(state);
  state.isSelectable = isMapLayerSelectable(state);
  state.isRecommended =
    state.isSelectable &&
    ((definition.id === 'crisis_watch' && Boolean(context.hasCrisisState)) ||
      (definition.id === 'active_task_route' && Boolean(context.hasActiveTask)) ||
      (definition.id === 'district_trust' && Boolean(context.hasDistrictTrustPreview)));
  return state;
}

export function buildMapLayerStates(context: CreviaMapLayerContext = {}): CreviaMapLayerState[] {
  return CREVIA_MAP_LAYER_DEFINITIONS.map((definition) => buildMapLayerState(definition, context));
}

export function getSelectableMapLayers(states: readonly CreviaMapLayerState[]): CreviaMapLayerState[] {
  return states.filter((state) => state.isSelectable);
}

export function getPreviewMapLayers(states: readonly CreviaMapLayerState[]): CreviaMapLayerState[] {
  return states.filter((state) => state.status === 'preview' || state.status === 'locked_by_rank');
}

export function getDefaultMapLayerId(
  states: readonly CreviaMapLayerState[],
  requestedLayerId?: CreviaMapLayerId,
): CreviaMapLayerId {
  if (requestedLayerId) {
    const requested = states.find((state) => state.definition.id === requestedLayerId);
    if (requested?.isSelectable) return requested.definition.id;
  }
  const recommended = states.find((state) => state.isRecommended);
  if (recommended) return recommended.definition.id;
  return (
    getSelectableMapLayers(states).sort((a, b) => a.priority - b.priority)[0]?.definition.id ??
    CREVIA_MAP_LAYER_SAFE_DEFAULT_LAYER_ID
  );
}

export function shouldShowMapLayerSelector(context: CreviaMapLayerContext = {}): boolean {
  return (context.day ?? 1) >= 3;
}

export function buildMapLayerViewModel(
  context: CreviaMapLayerContext = {},
  selectedLayerId?: CreviaMapLayerId,
): CreviaMapLayerViewModel {
  const states = buildMapLayerStates(context);
  const defaultLayerId = getDefaultMapLayerId(states, selectedLayerId);
  const selected = states.find((state) => state.definition.id === defaultLayerId);
  if (selected && selected.status === 'available') {
    selected.status = 'active';
    selected.visibilityMode = resolveMapLayerVisibilityMode(selected);
  }

  const availableLayers = states.filter((state) => state.status === 'active' || state.status === 'available');
  const previewLayers = getPreviewMapLayers(states);
  const hiddenLayerCount = states.filter((state) => state.status === 'hidden' || state.status === 'future').length;
  const viewModel: CreviaMapLayerViewModel = {
    availableLayers,
    previewLayers,
    hiddenLayerCount,
    selectedLayerId: defaultLayerId,
    defaultLayerId,
    compactChips: [],
    summaryLine: '',
  };
  viewModel.compactChips = buildCompactMapLayerChips(viewModel);
  viewModel.summaryLine = buildMapLayerSummaryLine(viewModel);
  viewModel.unlockHintLine = buildMapLayerUnlockHintLine(viewModel);
  return viewModel;
}
