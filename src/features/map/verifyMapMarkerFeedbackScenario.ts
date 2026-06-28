import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingModel';
import { buildActiveOperationMapCardModel } from '@/core/activeOperationMapBinding/activeOperationMapBindingPresentation';
import { createEmptyMaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { buildDistrictMapPersonalityLabel } from '@/core/districtPersonality';
import { selectPressableMapDirectActions, buildMarkerMapActionBundle } from '@/core/mapDirectAction';
import type { EventCard } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';

import {
  buildMapGameplayPresentation,
  type MapGameplayMarker,
} from './utils/mapGameplayPresentation';
import { composeMapBottomPanelPresentation } from './utils/mapBottomPanelPresentation';
import {
  buildMapMarkerFeedbackBatch,
  buildMapMarkerFeedbackPresentation,
  buildMarkerActionBundleInputForFeedback,
  resolveMapPanelMarkerTitle,
  resolveMapPanelSourcePill,
} from './utils/mapMarkerFeedbackPresentation';
import { buildMapTacticalMotionPresentation } from './utils/mapTacticalMotionPresentation';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';

const REPO_ROOT = join(__dirname, '..', '..', '..');

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function makeEvent(id = 'event_marker_fb'): EventCard {
  return {
    id,
    title: 'Güven sinyali',
    category: 'social',
    riskLevel: 'critical',
    district: 'Cumhuriyet',
    neighborhoodId: 'cumhuriyet',
    description: 'Mahallede görünür hizmet baskısı artıyor.',
    contextTag: 'trust',
    urgencyHours: 3,
    decisions: [],
    previewEffects: { publicSatisfaction: -2, risk: 2, xp: 20 },
    day: 8,
  };
}

function makeAssignment(): EventAssignmentState {
  return {
    eventId: 'event_marker_fb',
    day: 8,
    status: 'confirmed',
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

function lockedMarker(): MapGameplayMarker {
  return {
    id: 'marker-locked',
    type: 'resource',
    title: 'Kapalı Kaynak',
    subtitle: 'Rota yok',
    severity: 'low',
    status: 'locked',
    coordinate: { x: 52, y: 44 },
  };
}

export function verifyMapMarkerFeedbackScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const eventRoute = '/events/event_marker_fb';

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);

  try {
    assertVerifySaveVersionPolicy();
    assert(checks, true, 'save version policy', 'policy ok');
  } catch (error) {
    assert(checks, false, 'save version policy', String(error));
  }

  const binding = buildActiveOperationMapBinding({
    day: 8,
    activeEvent: makeEvent(),
    assignment: makeAssignment(),
    eventDetailRoute: eventRoute,
  });

  const activeOperationCard = buildActiveOperationMapCardModel(binding, { day: 8 });

  const presentation = buildMapGameplayPresentation({
    activeEvents: [makeEvent()],
    activeOperationCard,
    activeOperationBinding: binding,
    gameDay: 8,
    operationalResources: createInitialOperationalResourcesState(8),
    decisionHistory: [],
  });

  const activeMarker = presentation.markers.find((m) => m.type === 'active_event');
  assert(checks, Boolean(activeMarker), 'active event marker exists', `count=${presentation.markers.length}`);

  const tactical = buildMapTacticalMotionPresentation({
    day: 8,
    markers: presentation.markers,
    selectedMarkerId: activeMarker?.id,
    activeOperationBinding: binding,
  });

  const feedbackBatch = buildMapMarkerFeedbackBatch({
    markers: presentation.markers,
    selectedMarkerId: activeMarker?.id ?? null,
    activeOperationBinding: binding,
    tacticalMotions: tactical.markerMotions,
    actionBundleInputForMarker: (marker) =>
      buildMarkerActionBundleInputForFeedback(marker, {
        binding,
        card: null,
        maintenanceRuntime: createEmptyMaintenanceBacklogRuntimeState(),
      }),
  });

  const selectedFeedback = activeMarker ? feedbackBatch.get(activeMarker.id) : undefined;
  assert(
    checks,
    selectedFeedback?.showRing === true && selectedFeedback.scale === 'emphasized',
    'selected marker ring/scale',
    `showRing=${selectedFeedback?.showRing} scale=${selectedFeedback?.scale}`,
  );

  const activeFeedback = activeMarker
    ? buildMapMarkerFeedbackPresentation({
        marker: activeMarker,
        activeOperationBinding: binding,
        allowCriticalAccent: true,
      })
    : undefined;
  assert(
    checks,
    activeFeedback?.state === 'active' || activeFeedback?.tone === 'active',
    'active operation marker active state',
    `state=${activeFeedback?.state} tone=${activeFeedback?.tone}`,
  );

  const criticalMarkers = presentation.markers.filter((m) => m.severity === 'critical');
  const criticalAccents = [...feedbackBatch.values()].filter((f) => f.state === 'critical');
  assert(
    checks,
    criticalAccents.length <= 1,
    'critical accent limited',
    `criticalMarkers=${criticalMarkers.length} accented=${criticalAccents.length}`,
  );

  const lockedFeedback = buildMapMarkerFeedbackPresentation({
    marker: lockedMarker(),
    actionBundleInput: null,
  });
  assert(
    checks,
    lockedFeedback.pressable === false && lockedFeedback.state === 'disabled',
    'disabled marker not pressable',
    `pressable=${lockedFeedback.pressable}`,
  );

  const lockedBundle = buildMarkerActionBundleInputForFeedback(lockedMarker(), {
    binding: null,
    card: null,
  });
  const lockedActions = selectPressableMapDirectActions(
    buildMarkerMapActionBundle(lockedBundle),
  );
  assert(
    checks,
    lockedFeedback.pressable === false,
    'disabled/no-route marker actions',
    `pressable=${lockedFeedback.pressable} actions=${lockedActions.length}`,
  );

  if (activeMarker) {
    const panel = composeMapBottomPanelPresentation({
      marker: activeMarker,
      navIndex: 0,
      navTotal: presentation.markers.length,
      activeOperationCard: null,
      activeOperationBinding: binding,
      activeEventCount: 1,
      operationalResources: createInitialOperationalResourcesState(8),
      gameDay: 8,
    });
    assert(
      checks,
      panel.markerId === activeMarker.id,
      'bottom panel marker id binding',
      `panel=${panel.markerId}`,
    );

    const sourcePill = resolveMapPanelSourcePill(activeMarker, binding);
    assert(
      checks,
      sourcePill === 'Aktif Operasyon',
      'panel source pill matches marker type',
      sourcePill,
    );

    const title = resolveMapPanelMarkerTitle(activeMarker);
    assert(
      checks,
      title.includes('Cumhuriyet'),
      'panel title marker-bound',
      title,
    );
  }

  const traitLabel = buildDistrictMapPersonalityLabel({
    districtId: 'cumhuriyet',
    districtName: 'Cumhuriyet',
    day: 8,
  });
  assert(
    checks,
    Boolean(traitLabel && traitLabel.length > 0),
    'district trait label fallback',
    traitLabel ?? '(empty)',
  );

  const maintenanceSource = readRepo('src/core/mapDirectAction/mapDirectActionPresentation.ts');
  assert(
    checks,
    !maintenanceSource.includes('applyMaintenance') && !maintenanceSource.includes('runMaintenance'),
    'maintenance marker mutation absent',
    'read-only maintenance actions',
  );

  const reducedFeedback = buildMapMarkerFeedbackPresentation({
    marker: activeMarker ?? presentation.markers[0]!,
    selectedMarkerId: activeMarker?.id,
    reducedMotion: true,
  });
  assert(
    checks,
    reducedFeedback.showPulse === false,
    'reduce motion disables pulse',
    `showPulse=${reducedFeedback.showPulse}`,
  );

  const mapScreenSource = readRepo('src/features/map/screens/MapScreen.tsx');
  assert(
    checks,
    !mapScreenSource.includes('applyDecision'),
    'applyDecision unchanged on map screen',
    'no applyDecision',
  );

  const persistSource = readRepo('src/store/gamePersist.ts');
  assert(
    checks,
    persistSource.includes('export const SAVE_VERSION: number = 29'),
    'SAVE_VERSION bumped in gamePersist',
    'SAVE_VERSION migration',
  );

  const cityMapCard = readRepo('src/features/map/components/CityMapCard.tsx');
  assert(
    checks,
    cityMapCard.includes('excludeDedupeKeys') || cityMapCard.includes('dedupeKey'),
    'active operation CTA dedupe wired',
    'dedupe present',
  );

  const gameplayMarker = readRepo('src/features/map/components/MapGameplayMarker.tsx');
  assert(
    checks,
    gameplayMarker.includes('mapMarkerFeedbackPresentation'),
    'MapGameplayMarker uses feedback presentation',
    'presentation import',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  const lines = checks.map((check) =>
    `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`,
  );

  return {
    ok: failCount === 0,
    failCount,
    checks: lines,
  };
}
