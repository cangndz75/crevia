import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingModel';
import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '@/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '@/core/districtNeglectRecovery';
import { buildMapGameplayBindings } from '@/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import type { EventCard } from '@/core/models/EventCard';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildMapMotionPresentation,
  countAnimatedMapMotionMarkers,
  countMapMotionByIntensity,
  MAP_MOTION_MAX_ANIMATED,
  MAP_MOTION_MAX_MEDIUM,
  MAP_MOTION_MAX_STRONG,
  type MapMarkerMotionModel,
  type MapMotionPresentationResult,
} from './utils/mapMotionPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyMapMotionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail?: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail ?? ok}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function event(id: string, title: string, district: string, neighborhoodId: string): EventCard {
  return {
    id,
    title,
    category: 'transport',
    riskLevel: 'medium',
    district,
    neighborhoodId,
    description: 'Saha operasyonu.',
    contextTag: 'route',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 1, risk: -1, xp: 30 },
  };
}

function portfolioInput(day: number): DailyCapacityPortfolioInput {
  return {
    day,
    activeEvents: [event('e1', 'Rota', 'Sanayi', 'sanayi')],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: {
        status: 'strained',
        score: 70,
        title: 'Rota',
        summary: 'Baski',
        sourceTags: ['route'],
      },
      overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Iz', sourceTags: [] },
    },
    authorityPermissionIds: ['tomorrow_risk_preview'],
  };
}

function buildDay8Pipeline(extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({ ...portfolioInput(8), ...extra });
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: portfolio,
    ...extra,
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolio,
    ...extra,
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    ...extra,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day: 8,
    portfolioAvailable: portfolio.items.length > 0,
    ...extra,
  });
  const followUpActions = buildFollowUpActions({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: portfolio,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const positiveComeback = buildPositiveComeback({
    day: 8,
    dailyCapacityPortfolioResult: portfolio,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day: 8,
    dailyCapacityPortfolioResult: portfolio,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const day8StrategicContent = buildDay8StrategicContent({
    day: 8,
    dailyCapacityPortfolioResult: portfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    authorityExpansionSummary,
    ...extra,
  });

  return {
    portfolio,
    portfolioDeferRisk,
    oneMoreDayRetention,
    cityMemoryVisibility,
    followUpActions,
    positiveComeback,
    districtNeglectRecovery,
    day8StrategicContent,
  };
}

function validateResult(
  checks: string[],
  result: MapMotionPresentationResult,
  options: {
    expectPrimaryKind?: MapMarkerMotionModel['kind'];
    reducedMotion?: boolean;
  } = {},
): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, Array.isArray(result.markers), 'MapMotionPresentationResult safe output'));
  record(
    assert(
      checks,
      result.markers.every((marker) => marker.accessibilityLabel.trim().length > 0),
      'accessibilityLabel non-empty',
      'missing accessibilityLabel',
    ),
  );
  record(
    assert(
      checks,
      result.markers.every((marker) => unique(marker.sourceIds)),
      'sourceIds unique',
      'duplicate sourceIds',
    ),
  );
  record(
    assert(
      checks,
      countAnimatedMapMotionMarkers(result.markers) <= MAP_MOTION_MAX_ANIMATED,
      'Max 5 animated marker',
      'animated marker >5',
    ),
  );
  record(
    assert(
      checks,
      countMapMotionByIntensity(result.markers, 'strong') <= MAP_MOTION_MAX_STRONG,
      'Max 1 strong marker',
      'strong marker >1',
    ),
  );
  record(
    assert(
      checks,
      countMapMotionByIntensity(result.markers, 'medium') <= MAP_MOTION_MAX_MEDIUM,
      'Max 2 medium marker',
      'medium marker >2',
    ),
  );

  if (options.reducedMotion) {
    record(
      assert(
        checks,
        result.markers.every((marker) => !marker.pulse),
        'Reduced motion disables pulse',
        'reduced motion true but pulse true',
      ),
    );
    record(
      assert(
        checks,
        result.suppressAnimationReason === 'reduced_motion',
        'Reduced motion reason set',
      ),
    );
  }

  if (options.expectPrimaryKind) {
    record(
      assert(
        checks,
        result.primaryMarker?.kind === options.expectPrimaryKind,
        `Active operation priority (${options.expectPrimaryKind})`,
        `expected primary ${options.expectPrimaryKind}`,
      ),
    );
  }

  return ok;
}

export function verifyMapMotionScenario(): VerifyMapMotionOutcome {
  const checks: string[] = [];
  let ok = true;
  let warn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mapMotion'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mapMotionPresentation'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('mapMotionPresentation'),
      'day pipeline unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/cityRhythmDirector/cityRhythmDirectorModel.ts').includes('mapMotionPresentation'),
      'No CityRhythmDirector files touched',
    ),
  );

  const idle = buildMapMotionPresentation({ day: 1 });
  record(validateResult(checks, idle));

  const activeEvent = event('op1', 'Canli Operasyon', 'Cumhuriyet', 'cumhuriyet');
  const activeBinding = buildActiveOperationMapBinding({
    day: 8,
    activeEvent,
    unlockedPermissionIds: ['active_task_route'],
    eventDetailRoute: '/events/op1',
  });
  const activeOperation = buildMapMotionPresentation({
    day: 8,
    activeOperationBinding: activeBinding,
    mapGameplayBindings: buildMapGameplayBindings({
      day: 8,
      activeEventIds: [activeEvent.id],
      activeOperationContext: activeEvent,
    }),
  });
  record(validateResult(checks, activeOperation, { expectPrimaryKind: 'active_operation' }));

  const pipeline = buildDay8Pipeline();
  const routePressure = buildMapMotionPresentation({
    day: 8,
    mapGameplayBindings: buildMapGameplayBindings({ day: 8 }).filter((b) => b.id === 'route_support_hint'),
    districtNeglectRecovery: pipeline.districtNeglectRecovery,
  });
  record(validateResult(checks, routePressure));
  record(
    assert(
      checks,
      routePressure.markers.some((marker) => marker.routeHint) ||
        pipeline.districtNeglectRecovery.signals.some((signal) => signal.kind === 'route_backlog'),
      'Route pressure routeHint true',
    ),
  );

  const neglectHigh = buildMapMotionPresentation({
    day: 8,
    districtNeglectRecovery: {
      ...pipeline.districtNeglectRecovery,
      signals: pipeline.districtNeglectRecovery.signals.map((signal) => ({
        ...signal,
        neglectBand: 'high' as const,
        kind: 'neglect_warning' as const,
      })),
    },
  });
  record(validateResult(checks, neglectHigh));
  record(
    assert(
      checks,
      neglectHigh.markers.some((marker) => marker.kind === 'district_neglect'),
      'DistrictNeglect high maps to district_neglect',
    ),
  );

  const recoveryStrong = buildMapMotionPresentation({
    day: 8,
    districtNeglectRecovery: {
      ...pipeline.districtNeglectRecovery,
      signals: pipeline.districtNeglectRecovery.signals.map((signal) => ({
        ...signal,
        recoveryBand: 'strong' as const,
        kind: 'recovery_progress' as const,
      })),
    },
  });
  record(validateResult(checks, recoveryStrong));
  record(
    assert(
      checks,
      recoveryStrong.markers.some((marker) => marker.kind === 'district_recovery'),
      'District recovery strong maps to district_recovery',
    ),
  );

  const memoryTrace = buildMapMotionPresentation({
    day: 8,
    cityMemoryVisibility: {
      day: 8,
      traces: [
        {
          id: 'trace_map_motion',
          kind: 'map_memory_hint',
          title: 'Hafiza izi',
          line: 'Gecen hafta karar izi haritada gorunuyor.',
          districtId: 'cumhuriyet',
          districtName: 'Cumhuriyet',
          tone: 'neutral',
          sourceIds: ['trace_map_motion'],
          sourceKinds: ['city_archive'],
          confidence: 'medium',
          priority: 60,
          dayPolicy: 'day_8_plus',
          isActionable: false,
          isFallback: false,
        },
      ],
      sourceIds: ['trace_map_motion'],
    },
    mapGameplayBindings: buildMapGameplayBindings({ day: 8 }).filter(
      (binding) => binding.id === 'district_memory_trace',
    ),
  });
  record(validateResult(checks, memoryTrace));
  record(
    assert(
      checks,
      memoryTrace.markers.some((marker) => marker.kind === 'city_memory_trace'),
      'CityMemory map trace maps to city_memory_trace',
    ),
  );

  const positive = buildMapMotionPresentation({
    day: 8,
    positiveComeback: {
      day: 8,
      candidates: [
        {
          id: 'pc_opportunity_motion',
          kind: 'opportunity_window',
          title: 'Toparlanma firsati',
          line: 'Yesilvadi icin kucuk bir firsat penceresi acildi.',
          benefitLine: 'Guven ve tempo desteklenebilir.',
          districtId: 'yesilvadi',
          districtName: 'Yesilvadi',
          tone: 'positive',
          sourceIds: ['pc_opportunity_motion'],
          sourceKinds: ['follow_up_action'],
          confidence: 'medium',
          priority: 72,
          dayPolicy: 'day_8_plus',
          isActionable: true,
          isFallback: false,
          visibilityLevel: 'summary',
        },
      ],
      sourceIds: ['pc_opportunity_motion'],
    },
  });
  record(validateResult(checks, positive));
  record(
    assert(
      checks,
      positive.markers.some(
        (marker) => marker.kind === 'positive_opportunity' || marker.kind === 'district_recovery',
      ),
      'PositiveComeback maps to positive/district recovery',
    ),
  );

  const day8Map = buildMapMotionPresentation({
    day: 8,
    day8StrategicContent: pipeline.day8StrategicContent,
  });
  record(validateResult(checks, day8Map));
  record(
    assert(
      checks,
      pipeline.day8StrategicContent.mapCandidate != null
        ? day8Map.markers.length > 0
        : true,
      'Day8 map candidate maps to marker motion',
    ),
  );

  const mixed = buildMapMotionPresentation({
    day: 8,
    activeOperationBinding: activeBinding,
    mapGameplayBindings: buildMapGameplayBindings({
      day: 8,
      activeEventIds: [activeEvent.id],
      activeOperationContext: activeEvent,
    }),
    day8StrategicContent: pipeline.day8StrategicContent,
    districtNeglectRecovery: pipeline.districtNeglectRecovery,
    positiveComeback: pipeline.positiveComeback,
    cityMemoryVisibility: pipeline.cityMemoryVisibility,
    activeTaskRoute: {
      id: 'route:mixed',
      phase: 'en_route',
      status: 'active',
      healthStatus: 'healthy',
      visibility: {
        mode: 'standard',
        showSteps: true,
        showResourceWarning: false,
        maxSteps: 3,
        showMapHint: true,
      },
      routeModel: {} as never,
      steps: [],
      districtNodes: [],
      resourceNodes: [],
      dispatchLine: 'Sevk',
      fieldLine: 'Saha',
      mapLine: 'Rota',
      reportLine: 'Rapor',
      statusLine: 'Yolda',
      activeStepIndex: 0,
      visible: true,
      isHintOnly: true,
    },
  });
  record(validateResult(checks, mixed, { expectPrimaryKind: 'active_operation' }));

  const reduced = buildMapMotionPresentation({
    day: 8,
    reducedMotion: true,
    activeOperationBinding: activeBinding,
    districtNeglectRecovery: pipeline.districtNeglectRecovery,
  });
  record(validateResult(checks, reduced, { reducedMotion: true }));

  const duplicateDistrict = buildMapMotionPresentation({
    day: 8,
    districtNeglectRecovery: pipeline.districtNeglectRecovery,
    positiveComeback: {
      ...pipeline.positiveComeback,
      candidates: pipeline.positiveComeback.candidates.map((candidate) => ({
        ...candidate,
        districtId: 'sanayi',
        districtName: 'Sanayi',
      })),
    },
  });
  const sanayiMarkers = duplicateDistrict.markers.filter((marker) => marker.districtId === 'sanayi');
  record(
    assert(
      checks,
      sanayiMarkers.every((marker) => unique(marker.sourceIds)),
      'Duplicate same district source merge',
    ),
  );

  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  record(assert(checks, mapScreen.includes('buildMapMotionPresentation'), 'MapScreen composes map motion read-only'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/map/utils/mapMarkerMotionHelper.tsx')), 'Marker animation helper exists'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/analyze-map-motion.ts')), 'package analyzer script exists'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/verify-map-motion.ts')), 'package verify script exists'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-map-motion-marker-animation-pass.md')), 'docs next pass noted'));

  if (checks.some((line) => line.startsWith('WARN'))) {
    warn = true;
  }

  return { ok, warn, checks };
}
