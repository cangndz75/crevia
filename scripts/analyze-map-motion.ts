/**
 * Diagnostic analyzer for map motion & marker animation.
 * Calistir: npm run analyze:map-motion
 */

import { buildActiveOperationMapBinding } from '../src/core/activeOperationMapBinding/activeOperationMapBindingModel';
import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '../src/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '../src/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '../src/core/districtNeglectRecovery';
import { buildFollowUpActions } from '../src/core/followUpActions';
import { buildMapGameplayBindings } from '../src/core/mapGameplayBinding/mapGameplayBindingModel';
import type { EventCard } from '../src/core/models/EventCard';
import { buildOneMoreDayRetention } from '../src/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '../src/core/portfolioDeferRisk';
import { buildPositiveComeback } from '../src/core/positiveComeback';
import {
  buildMapMotionPresentation,
  countAnimatedMapMotionMarkers,
  countMapMotionByIntensity,
  type MapMotionPresentationResult,
} from '../src/features/map/utils/mapMotionPresentation';

type Scenario = {
  label: string;
  build: () => MapMotionPresentationResult;
};

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

const activeEvent = event('op1', 'Canli Operasyon', 'Cumhuriyet', 'cumhuriyet');
const activeBinding = buildActiveOperationMapBinding({
  day: 8,
  activeEvent,
  unlockedPermissionIds: ['active_task_route'],
  eventDetailRoute: '/events/op1',
});
const pipeline = buildDay8Pipeline();

const scenarios: Scenario[] = [
  {
    label: 'no source idle',
    build: () => buildMapMotionPresentation({ day: 1 }),
  },
  {
    label: 'active operation',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        activeOperationBinding: activeBinding,
        mapGameplayBindings: buildMapGameplayBindings({
          day: 8,
          activeEventIds: [activeEvent.id],
          activeOperationContext: activeEvent,
        }),
      }),
  },
  {
    label: 'route pressure',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        mapGameplayBindings: buildMapGameplayBindings({ day: 8 }).filter(
          (binding) => binding.id === 'route_support_hint',
        ),
        districtNeglectRecovery: pipeline.districtNeglectRecovery,
      }),
  },
  {
    label: 'district neglect high',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        districtNeglectRecovery: {
          ...pipeline.districtNeglectRecovery,
          signals: pipeline.districtNeglectRecovery.signals.map((signal) => ({
            ...signal,
            neglectBand: 'high' as const,
            kind: 'neglect_warning' as const,
          })),
        },
      }),
  },
  {
    label: 'district recovery strong',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        districtNeglectRecovery: {
          ...pipeline.districtNeglectRecovery,
          signals: pipeline.districtNeglectRecovery.signals.map((signal) => ({
            ...signal,
            recoveryBand: 'strong' as const,
            kind: 'recovery_progress' as const,
          })),
        },
      }),
  },
  {
    label: 'city memory trace',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        cityMemoryVisibility: pipeline.cityMemoryVisibility,
      }),
  },
  {
    label: 'positive comeback',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        positiveComeback: pipeline.positiveComeback,
      }),
  },
  {
    label: 'mixed 7 source max animated guard',
    build: () =>
      buildMapMotionPresentation({
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
          id: 'route:analysis',
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
      }),
  },
  {
    label: 'reduced motion on',
    build: () =>
      buildMapMotionPresentation({
        day: 8,
        reducedMotion: true,
        activeOperationBinding: activeBinding,
        districtNeglectRecovery: pipeline.districtNeglectRecovery,
      }),
  },
  {
    label: 'duplicate same district source',
    build: () =>
      buildMapMotionPresentation({
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
      }),
  },
];

let failCount = 0;
let warnCount = 0;

for (const scenario of scenarios) {
  const result = scenario.build();
  const animated = countAnimatedMapMotionMarkers(result.markers);
  const strong = countMapMotionByIntensity(result.markers, 'strong');
  const medium = countMapMotionByIntensity(result.markers, 'medium');

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} ===`);
  // eslint-disable-next-line no-console
  console.log(`primary: ${result.primaryMarker?.kind ?? 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`animated: ${animated}, strong: ${strong}, medium: ${medium}`);
  // eslint-disable-next-line no-console
  console.log(`routeMotionEnabled: ${result.routeMotionEnabled}`);
  // eslint-disable-next-line no-console
  console.log(
    `accessibility: ${result.markers
      .slice(0, 3)
      .map((marker) => marker.accessibilityLabel)
      .join(' | ')}`,
  );

  if (animated > 5) {
    // eslint-disable-next-line no-console
    console.log('FAIL animated marker >5');
    failCount += 1;
  }
  if (strong > 1) {
    // eslint-disable-next-line no-console
    console.log('FAIL strong marker >1');
    failCount += 1;
  }
  if (medium > 2) {
    // eslint-disable-next-line no-console
    console.log('FAIL medium marker >2');
    failCount += 1;
  }
  if (scenario.label === 'reduced motion on' && result.markers.some((marker) => marker.pulse)) {
    // eslint-disable-next-line no-console
    console.log('FAIL reduced motion true but pulse true');
    failCount += 1;
  }
  if (
    scenario.label === 'active operation' &&
    result.primaryMarker?.kind !== 'active_operation'
  ) {
    // eslint-disable-next-line no-console
    console.log('FAIL active operation exists but not primary');
    failCount += 1;
  }
  if (result.markers.some((marker) => new Set(marker.sourceIds).size !== marker.sourceIds.length)) {
    // eslint-disable-next-line no-console
    console.log('FAIL duplicate sourceIds');
    failCount += 1;
  }
  if (result.markers.some((marker) => !marker.accessibilityLabel.trim())) {
    // eslint-disable-next-line no-console
    console.log('FAIL missing accessibilityLabel');
    failCount += 1;
  }

  const sanayiMarkers = result.markers.filter((marker) => marker.districtId === 'sanayi');
  if (scenario.label === 'duplicate same district source' && sanayiMarkers.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`source merge sanayi markers: ${sanayiMarkers.length}`);
  }
}

// eslint-disable-next-line no-console
console.log(`\nSummary: ${failCount} FAIL, ${warnCount} WARN`);

if (failCount > 0) {
  process.exit(1);
}
