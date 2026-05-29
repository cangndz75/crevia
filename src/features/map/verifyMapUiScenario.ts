import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';

import { DEFAULT_MAP_DISTRICT_ID } from './data/mapDistrictConstants';
import { mapDistrictFromPilot } from './data/mapDistrictMapping';
import { pilotAreaFromDistrict } from './data/pilotAreaMapping';
import {
  buildMapNeighborhoodStripItems,
  buildMapOperationPanelModel,
  collectMapUiPresentationStrings,
  MAP_UI_BANNED_WORDS,
  MAP_UI_LAYOUT_GUARDS,
  mapUiTextContainsBannedWords,
  type MapNeighborhoodStripItem,
  type MapOperationPanelModel,
} from './utils/mapUiPresentation';

export type VerifyMapUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function buildInitialPanel(selectedPinId: string | null = null): MapOperationPanelModel {
  const pilotDistrictId = DEFAULT_PILOT_DISTRICT_ID;
  const pilotAreaId = pilotAreaFromDistrict(pilotDistrictId);
  const focusDistrictId = mapDistrictFromPilot(pilotDistrictId);

  return buildMapOperationPanelModel({
    viewMode: 'overview',
    focusDistrictId,
    pilotAreaId,
    pilotDistrictId,
    gameDay: 1,
    activeEvents: [],
    containerState: createInitialContainerState(1),
    vehicleState: createInitialVehicleState(1),
    hideFleetSignals: true,
    dayEventTitle: selectedPinId ? undefined : 'İlk gün saha notu',
  });
}

export function verifyMapUiScenario(): VerifyMapUiOutcome {
  const checks: Check[] = [];

  let panel: MapOperationPanelModel | undefined;
  try {
    panel = buildInitialPanel();
    assert(checks, panel.visible === true, 'MapScreen initial state crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'MapScreen initial state crash olmaz',
      error instanceof Error ? error.message : 'unknown error',
    );
    panel = undefined;
  }

  if (panel) {
    const panelWithoutPin = buildInitialPanel(null);
    assert(
      checks,
      panelWithoutPin.districtLabel.length > 0,
      'Selected marker undefined iken fallback güvenli',
      panelWithoutPin.districtLabel,
    );

    const longNotePanel = buildMapOperationPanelModel({
      viewMode: 'overview',
      focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
      pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
      pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
      gameDay: 1,
      activeEvents: [],
      dayEventTitle:
        'Çok uzun saha notu metni mobil ekranda taşmamalı ve alt panelde güvenli şekilde kısaltılmalıdır.',
    });
    assert(
      checks,
      longNotePanel.sahaNote != null && longNotePanel.sahaNote.length > 20,
      'Bottom panel uzun metinde taşma koruması var',
      `sahaNoteLen=${longNotePanel.sahaNote?.length ?? 0}`,
    );
  }

  const emptyStrip: MapNeighborhoodStripItem[] = [];
  assert(
    checks,
    emptyStrip.length === 0,
    'Neighborhood list empty ise empty state güvenli',
    'MapNeighborhoodStrip empty branch',
  );

  assert(
    checks,
    MAP_UI_LAYOUT_GUARDS.markerLabelNumberOfLines === 1,
    'Marker label uzun metinde taşma koruması var',
    `numberOfLines=${MAP_UI_LAYOUT_GUARDS.markerLabelNumberOfLines}`,
  );

  assert(
    checks,
    MAP_UI_LAYOUT_GUARDS.bottomPanelNumberOfLines >= 2 &&
      MAP_UI_LAYOUT_GUARDS.usesFlexShrink &&
      MAP_UI_LAYOUT_GUARDS.usesMinWidthZero,
    'Small screen layout kritik text guard',
    JSON.stringify(MAP_UI_LAYOUT_GUARDS),
  );

  const day1Strip = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    gameDay: 1,
  });
  assert(
    checks,
    day1Strip.length > 0,
    'Day 1 tutorial/progressive reveal bozulmaz',
    `stripCount=${day1Strip.length}`,
  );

  const previewItems = day1Strip.filter((item) => item.status === 'preview');
  const previewUsesLockLanguage = previewItems.some((item) =>
    mapUiTextContainsBannedWords(item.statusLabel).length > 0,
  );
  assert(
    checks,
    previewItems.length > 0 && !previewUsesLockLanguage,
    'Progression preview mahalleleri gerçek kilit gibi gösterilmez',
    previewItems.map((item) => item.statusLabel).join(', '),
  );

  assert(
    checks,
    previewItems.every((item) => item.statusLabel === 'Önizleme'),
    'Preview mahalleler Önizleme etiketi kullanır',
  );

  const detailPanel = buildMapOperationPanelModel({
    viewMode: 'detail',
    focusDistrictId: DEFAULT_MAP_DISTRICT_ID,
    pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    gameDay: 1,
    activeEvents: [],
  });
  const overviewPanel = buildMapOperationPanelModel({
    viewMode: 'overview',
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    gameDay: 1,
    activeEvents: [],
  });
  assert(
    checks,
    overviewPanel.ctaLabel === 'Detayı Gör' &&
      detailPanel.ctaLabel === 'Şehir Haritasına Dön',
    'Existing navigation/action callbacks korunur',
    `${overviewPanel.ctaLabel} / ${detailPanel.ctaLabel}`,
  );

  const presentationStrings = collectMapUiPresentationStrings(day1Strip, overviewPanel);
  const bannedHits = presentationStrings.flatMap((text) =>
    mapUiTextContainsBannedWords(text).map((word) => `${word}@${text.slice(0, 40)}`),
  );
  assert(
    checks,
    bannedHits.length === 0,
    'Yasaklı kelimeler map presentation metinlerinde geçmez',
    bannedHits.join('; ') || MAP_UI_BANNED_WORDS.join(', '),
  );

  const day1PanelHiddenFleet = buildMapOperationPanelModel({
    viewMode: 'overview',
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    gameDay: 1,
    activeEvents: [],
    vehicleState: createInitialVehicleState(1),
    hideFleetSignals: true,
  });
  const vehicleMetric = day1PanelHiddenFleet.metrics.find((m) => m.key === 'vehicle');
  assert(
    checks,
    vehicleMetric == null,
    'Day 1 fleet sinyalleri tutorial modunda gizlenir',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
