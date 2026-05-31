import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { buildMainOperationMapScopeBadges } from '@/core/mainOperation/mainOperationPresentation';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
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
  shouldShowMapCrisisChrome,
  type MapNeighborhoodStripItem,
  type MapOperationPanelModel,
} from './utils/mapUiPresentation';
import { buildMapCrisisPresentationBundle } from './utils/mapCrisisPresentation';
import {
  buildMapResourcePresentationBundle,
  shouldShowMapResourceOverlay,
} from './utils/mapResourcePresentation';
import { buildOperationalResourceEngineInputFromStore } from '@/core/operationalResources/operationalResourceEngine';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { applyOperationalResourceEffects } from '@/core/operationalResources/operationalResourceEngine';

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

  const fullGs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  const fullGsDay8 = { ...fullGs, city: { ...fullGs.city, day: 8 } };
  const fullMon = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8);
  const elevatedCrisis = {
    ...createInitialCrisisState(),
    accessMode: 'active' as const,
    riskLevel: 'elevated' as const,
    cityCrisisScore: 78,
    recentSignals: [
      {
        id: 'sig-map',
        domain: 'vehicles' as const,
        riskLevel: 'elevated' as const,
        score: 78,
        trend: 'worsening' as const,
        title: 'Araç ve konteyner sinyalleri aynı anda zorlanıyor.',
        summary: 'Araç ve konteyner baskısı aynı hatta yükseliyor.',
        sourceTags: ['crisis'],
      },
    ],
  };
  const mapCrisis = buildMapCrisisPresentationBundle({
    gameState: fullGsDay8,
    monetization: fullMon,
    crisisState: elevatedCrisis,
    mainOperationSeason: createFullMainOperationSeasonState(8),
  });
  const crisisPanel = buildMapOperationPanelModel({
    viewMode: 'overview',
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    gameDay: 8,
    activeEvents: [],
    crisisLines: mapCrisis.panelLines,
  });
  assert(
    checks,
    (crisisPanel.crisisLines?.length ?? 0) <= 2,
    'Map model crisisLines alanını güvenli taşır',
    `crisisLines=${crisisPanel.crisisLines?.length ?? 0}`,
  );
  assert(
    checks,
    buildMapOperationPanelModel({
      viewMode: 'overview',
      focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
      pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
      pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
      gameDay: 1,
      activeEvents: [],
    }).crisisLines == null,
    'MapOperationBottomPanel crisis line render modelini boşken gizler',
  );
  assert(
    checks,
    (crisisPanel.crisisLines?.length ?? 0) <= 2,
    'Full active crisis bottom panelde max 2 satır gösterir',
  );

  const mainOpBadges = buildMainOperationMapScopeBadges(
    fullGsDay8,
    fullMon,
    createFullMainOperationSeasonState(8),
  );
  const crisisStrip = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: 'istasyon',
    gameDay: 8,
    mainOperationScopeBadges: mainOpBadges,
    crisisDistrictBadges: mapCrisis.districtBadges,
    crisisAccessMode: 'active',
  });
  assert(
    checks,
    crisisStrip.some((item) => item.crisisStripTone != null),
    'District strip crisis badge/tone üretir',
  );
  const conflictDistrict = crisisStrip.find((item) => item.id === 'istasyon');
  assert(
    checks,
    conflictDistrict != null &&
      (conflictDistrict.statusLabel.includes('Kriz') ||
        conflictDistrict.statusLabel.includes('Kritik') ||
        conflictDistrict.statusLabel.includes('İzlemede') ||
        conflictDistrict.crisisStripTone != null),
    'MainOperation scope badge ile crisis badge çakışma guard’ı çalışır',
    conflictDistrict?.statusLabel ?? 'missing',
  );

  const pilotCrisis = buildMapCrisisPresentationBundle({
    gameState: { ...fullGs, city: { ...fullGs.city, day: 3 } },
    monetization: fullMon,
    crisisState: elevatedCrisis,
  });
  assert(
    checks,
    !shouldShowMapCrisisChrome(3, true) && pilotCrisis.panelLines.length === 0,
    'Pilot map UI crisis göstermiyor',
  );

  const limitedGs = applyLimitedContinueToGameState(fullGsDay8);
  const limitedCrisis = buildMapCrisisPresentationBundle({
    gameState: limitedGs,
    monetization: selectLimitedContinue(createInitialMonetizationState(), 8),
    crisisState: {
      ...elevatedCrisis,
      accessMode: 'limited_preview',
    },
  });
  assert(
    checks,
    limitedCrisis.panelLines.length <= 1,
    'Limited map UI compact crisis preview gösteriyor veya güvenli gizliyor',
    `limitedLines=${limitedCrisis.panelLines.length}`,
  );

  assert(
    checks,
    MAP_UI_LAYOUT_GUARDS.bottomPanelNumberOfLines >= 2 &&
      MAP_UI_LAYOUT_GUARDS.usesFlexShrink &&
      MAP_UI_LAYOUT_GUARDS.usesMinWidthZero,
    'numberOfLines/flexShrink/minWidth guard’ları mevcut',
  );

  assert(
    checks,
    buildMapOperationPanelModel({
      viewMode: 'overview',
      focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
      pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
      pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
      gameDay: 8,
      activeEvents: [],
      resourceLines: undefined,
    }).visible === true,
    'Type model optional crisis fields ile crash etmiyor',
  );

  const resourceInput = buildOperationalResourceEngineInputFromStore({
    gameState: { ...fullGsDay8, city: { ...fullGsDay8.city, day: 1 } },
    monetization: fullMon,
    operationSignals: createInitialOperationSignalsState(1),
    dailyOperationsPlan: createInitialDailyOperationsPlan(1),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: { actionsById: {} },
    operationalResources: createInitialOperationalResourcesState(1),
  });
  assert(
    checks,
    !shouldShowMapResourceOverlay(resourceInput),
    'Map resource overlay Day 1 hidden',
  );

  const strainedResources = applyOperationalResourceEffects(
    createInitialOperationalResourcesState(10),
    [
      {
        domain: 'containers',
        targetId: 'sanayi',
        delta: 40,
        metric: 'fill_pressure',
        reason: 'test',
        sourceTags: [],
      },
    ],
    10,
  );
  const resourceDay10 = buildMapResourcePresentationBundle(
    buildOperationalResourceEngineInputFromStore({
      gameState: fullGsDay8,
      monetization: fullMon,
      operationSignals: createInitialOperationSignalsState(8),
      dailyOperationsPlan: createInitialDailyOperationsPlan(8),
      assignments: createInitialAssignmentsState(),
      microDecisionState: createInitialMicroDecisionState(),
      crisisActionState: { actionsById: {} },
      operationalResources: strainedResources,
    }),
  );
  assert(
    checks,
    resourceDay10.panelLines.length <= 2,
    'Map resource panel max 2 lines',
    `lines=${resourceDay10.panelLines.length}`,
  );

  const resourceStrip = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    gameDay: 10,
    crisisDistrictBadges: [{ districtId: 'sanayi', label: 'Kriz', tone: 'critical' }],
    crisisAccessMode: 'active',
    resourceDistrictBadges: {
      sanayi: { districtId: 'sanayi', label: 'Konteyner baskısı', tone: 'warning', iconKey: 'factory' },
    },
  });
  assert(
    checks,
    resourceStrip.find((i) => i.id === 'sanayi')?.statusLabel === 'Kriz',
    'Crisis priority over resource strip badge',
    resourceStrip.find((i) => i.id === 'sanayi')?.statusLabel ?? '',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
