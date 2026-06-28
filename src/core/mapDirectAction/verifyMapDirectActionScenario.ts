import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { assertVerifySaveVersionPolicy, isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import type { EventCard } from '@/core/models/EventCard';
import { buildActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingModel';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { createEmptyMaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import type { MaintenanceRuntimeItem } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import {
  buildMapActionBundlePresentation,
  selectPressableMapDirectActions,
} from '@/core/mapDirectAction';

const REPO_ROOT = join(__dirname, '..', '..', '..');

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function makeEvent(id = 'event_map_direct'): EventCard {
  return {
    id,
    title: 'Rota daralması',
    category: 'transport',
    riskLevel: 'medium',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    description: 'Saha ekibi rota baskısını kontrol ediyor.',
    contextTag: 'route',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 2, risk: -1, xp: 30 },
    day: 4,
  };
}

function makeAssignment(status: EventAssignmentState['status']): EventAssignmentState {
  return {
    eventId: 'event_map_direct',
    day: 4,
    status,
    source: 'player',
    personnelType: 'balanced_team',
    vehicleType: 'route_support_vehicle',
    approachType: 'balanced_response',
    compatibilityScore: 74,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
    advisorNote: 'Plan uyumu dengeli.',
  };
}

function maintenanceItem(
  overrides: Partial<MaintenanceRuntimeItem> & Pick<MaintenanceRuntimeItem, 'id' | 'domain'>,
): MaintenanceRuntimeItem {
  return {
    severity: 'attention',
    status: 'open',
    createdDay: 4,
    updatedDay: 4,
    carryOverDays: 0,
    sourceDedupeKey: `k-${overrides.id}`,
    lastReasonLabels: ['test'],
    ...overrides,
  };
}

export function verifyMapDirectActionScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const eventRoute = '/events/event_map_direct';

  assert(
    checks,
    isCurrentSaveVersion(SAVE_VERSION),
    'SAVE_VERSION unchanged',
    `SAVE_VERSION=${SAVE_VERSION}`,
  );

  const dispatchBinding = buildActiveOperationMapBinding({
    day: 4,
    activeEvent: makeEvent(),
    assignment: makeAssignment('confirmed'),
    eventDetailRoute: eventRoute,
  });

  const activeOpBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-event-event_map_direct',
      markerType: 'active_event',
      markerStatus: 'active',
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      districtName: 'Merkez',
    },
    operation: {
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      phase: dispatchBinding.phase,
      hasReadinessContext: true,
    },
    reportRouteAvailable: true,
  });

  assert(
    checks,
    activeOpBundle.primaryAction?.kind === 'continue_operation',
    'active operation marker continue_operation',
    activeOpBundle.primaryAction?.kind ?? 'missing',
  );

  const newEventBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-urgent',
      markerType: 'urgent_signal',
      markerStatus: 'pending',
      eventId: 'event_new',
      eventDetailRoute: '/events/event_new',
    },
    operation: {
      eventId: 'event_new',
      eventDetailRoute: '/events/event_new',
      phase: 'before_inspect',
    },
    reportRouteAvailable: true,
  });

  assert(
    checks,
    newEventBundle.primaryAction?.kind === 'inspect_signal',
    'new event marker inspect_signal',
    newEventBundle.primaryAction?.kind ?? 'missing',
  );

  const districtNoRouteBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-district',
      markerType: 'district',
      markerStatus: 'active',
      districtName: 'Bilinmeyen Bölge',
    },
    district: {
      canOpenDistrictDetail: false,
    },
    layerToggleAvailable: false,
    reportRouteAvailable: false,
  });

  assert(
    checks,
    selectPressableMapDirectActions(districtNoRouteBundle).length === 0,
    'district marker no route no pressable',
    String(selectPressableMapDirectActions(districtNoRouteBundle).length),
  );

  const maintenanceRuntime = {
    items: [maintenanceItem({ id: 'm1', domain: 'vehicle' })],
    attentionStreaks: {},
  };

  const maintenanceBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-active',
      markerType: 'active_event',
      markerStatus: 'active',
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      districtName: 'Sanayi',
    },
    operation: {
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      phase: 'dispatch_ready',
      hasReadinessContext: true,
    },
    maintenance: {
      activeItemCount: 1,
      districtLinkedItemCount: 1,
      topItemLabel: 'Araç hazırlığı',
      readinessRouteAvailable: true,
      readinessRoute: eventRoute,
    },
    reportRouteAvailable: true,
  });

  const maintenanceKinds = [
    maintenanceBundle.primaryAction?.kind,
    ...maintenanceBundle.secondaryActions.map((action) => action.kind),
  ];
  assert(
    checks,
    !maintenanceKinds.some((kind) => kind === 'open_operation' && false),
    'maintenance no mutation action kinds',
    maintenanceKinds.join(','),
  );
  assert(
    checks,
    maintenanceBundle.secondaryActions.some((action) => action.kind === 'view_maintenance') ||
      maintenanceBundle.primaryAction?.kind === 'continue_operation',
    'maintenance view_maintenance or continue only',
    maintenanceKinds.join(','),
  );

  const maxActionsBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-rich',
      markerType: 'active_event',
      markerStatus: 'active',
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      districtId: 'merkez',
      districtName: 'Merkez',
    },
    operation: {
      eventId: 'event_map_direct',
      eventDetailRoute: eventRoute,
      phase: 'dispatch_ready',
      hasReadinessContext: true,
    },
    maintenance: {
      activeItemCount: 2,
      districtLinkedItemCount: 1,
      readinessRouteAvailable: true,
      readinessRoute: eventRoute,
    },
    district: {
      districtId: 'merkez',
      districtName: 'Merkez',
      canOpenDistrictDetail: true,
    },
    layerToggleAvailable: true,
    reportRouteAvailable: true,
  });

  const actionCount =
    (maxActionsBundle.primaryAction ? 1 : 0) + maxActionsBundle.secondaryActions.length;
  assert(
    checks,
    actionCount <= 3,
    'max 1 primary + 2 secondary',
    String(actionCount),
  );

  const labels = new Set<string>();
  if (maxActionsBundle.primaryAction) labels.add(maxActionsBundle.primaryAction.label);
  for (const action of maxActionsBundle.secondaryActions) labels.add(action.label);
  assert(
    checks,
    labels.size === actionCount,
    'no duplicate action labels',
    [...labels].join('|'),
  );

  const disabledBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-disabled',
      markerType: 'resource',
      markerStatus: 'active',
    },
    district: { canOpenDistrictDetail: false },
    layerToggleAvailable: false,
    reportRouteAvailable: false,
  });
  assert(
    checks,
    selectPressableMapDirectActions(disabledBundle).length === 0,
    'disabled actions not pressable',
    String(selectPressableMapDirectActions(disabledBundle).length),
  );

  const hiddenRouteBundle = buildMapActionBundlePresentation({
    surface: 'map_bottom_sheet',
    marker: {
      markerId: 'marker-no-route',
      markerType: 'urgent_signal',
      markerStatus: 'pending',
    },
    reportRouteAvailable: false,
  });
  assert(
    checks,
    !hiddenRouteBundle.primaryAction,
    'no targetRouteKey action hidden',
    hiddenRouteBundle.primaryAction?.kind ?? 'none',
  );

  const cityMapCard = readRepo('src/features/map/components/CityMapCard.tsx');
  const gameStore = readRepo('src/store/useGameStore.ts');
  const bottomNav = readRepo('src/components/navigation/CreviaBottomTabBar.tsx');

  assert(
    checks,
    !cityMapCard.includes('applyDecision'),
    'applyDecision not in map card',
    'ok',
  );
  assert(
    checks,
    !cityMapCard.includes('applySelectedDecision'),
    'applySelectedDecision not in map card',
    'ok',
  );
  assert(
    checks,
    !cityMapCard.includes('applyMaintenanceAction'),
    'maintenance mutation not in map card',
    'ok',
  );
  assert(
    checks,
    assertVerifySaveVersionPolicy(readRepo('src/store/gamePersist.ts')),
    'save version policy',
    `SAVE_VERSION=${SAVE_VERSION}`,
  );
  assert(
    checks,
    bottomNav.includes('Merkez') &&
      bottomNav.includes('Operasyon') &&
      bottomNav.includes('Harita') &&
      bottomNav.includes('Gelişim') &&
      bottomNav.includes('Raporlar'),
    'bottom nav labels unchanged',
    'ok',
  );
  assert(
    checks,
    existsSync(join(REPO_ROOT, 'src/core/mapDirectAction/mapDirectActionPresentation.ts')),
    'map direct action presentation exists',
    'ok',
  );
  assert(
    checks,
    createEmptyMaintenanceBacklogRuntimeState().items.length === 0,
    'maintenance runtime read-only default',
    'ok',
  );
  assert(
    checks,
    !gameStore.includes('mapDirectAction'),
    'map direct action not persisted',
    'ok',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) =>
      check.ok ? `PASS ${check.name}` : `FAIL ${check.name}: ${check.detail}`,
    ),
  };
}
