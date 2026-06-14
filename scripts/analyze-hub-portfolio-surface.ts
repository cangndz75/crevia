/**
 * Hub Portfolio Surface Lite analyzer.
 * Calistir: npm run analyze:hub-portfolio-surface
 */

import { createDay1Seed } from '../src/core/content/day1Seed';
import { createInitialHubQuickActionState } from '../src/core/hubQuickActions/hubQuickActionSeed';
import { createInitialSocialPulseState } from '../src/core/social/socialSeed';
import { buildCenterHomePresentation } from '../src/features/hub/utils/centerHomePresentation';

const scenarios = [
  { name: 'Day 1', day: 1, pressure: 'low' },
  { name: 'Day 3', day: 3, pressure: 'medium' },
  { name: 'Day 7', day: 7, pressure: 'medium' },
  { name: 'Day 8', day: 8, pressure: 'high' },
  { name: 'Day 10', day: 10, pressure: 'high' },
  { name: 'Low data', day: 8, pressure: 'low-data' },
] as const;

function makeState(day: number) {
  const base = createDay1Seed().gameState as any;
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
    events:
      day >= 8
        ? [
            {
              id: `analyze_route_${day}`,
              title: 'Rota baskısı',
              district: 'Sanayi',
              neighborhoodId: 'sanayi',
              status: 'active',
            },
            {
              id: `analyze_container_${day}`,
              title: 'Konteyner hattı',
              district: 'Merkez',
              neighborhoodId: 'merkez',
              status: 'active',
            },
          ]
        : [],
  };
}

function makeSignals(day: number, pressure: string) {
  if (pressure === 'low-data') return null;
  const high = pressure === 'high';
  return {
    day,
    priorityDistrictId: 'sanayi',
    vehicles: {
      domain: 'vehicles',
      status: high ? 'strained' : 'watch',
      score: high ? 72 : 52,
      title: 'Araç rotası geriliyor',
      summary: 'Rota desteği sınırlı.',
      sourceTags: ['vehicle_route'],
    },
    containers: {
      domain: 'containers',
      status: high ? 'watch' : 'stable',
      score: high ? 58 : 38,
      title: 'Konteyner hattı',
      summary: 'Hat yoğunluğu takipte.',
      sourceTags: ['container_network'],
    },
    districts: {
      domain: 'districts',
      status: high ? 'strained' : 'watch',
      score: high ? 63 : 45,
      title: 'Bölge dengesi',
      summary: 'Güven baskısı görünür.',
      sourceTags: ['district_trust'],
    },
    personnel: { domain: 'personnel', status: 'stable', score: 40, title: 'Ekip', summary: 'Dengeli', sourceTags: [] },
    overall: { domain: 'overall', status: 'watch', score: 55, title: 'Genel', summary: 'İzleniyor', sourceTags: [] },
  } as any;
}

for (const scenario of scenarios) {
  const presentation = buildCenterHomePresentation({
    gameState: makeState(scenario.day),
    operationSignals: makeSignals(scenario.day, scenario.pressure),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(scenario.day),
    hubTomorrowRisk:
      scenario.day >= 8 && scenario.pressure !== 'low-data'
        ? {
            id: `analyze_risk_${scenario.day}`,
            kind: 'generic_city_preparation',
            title: 'Yarın rota riski',
            mainLine: 'Rota baskısı yarına taşınabilir.',
            tone: 'watch',
            priority: 'medium',
            relatedDomain: 'route',
            sourceSignals: ['operation_signals'],
            shouldShowInReport: true,
            shouldShowInHub: true,
            shouldShowAsCompact: false,
            maxVisibleLines: 2,
          }
        : null,
  });
  const surface = presentation.portfolioSurface;

  // eslint-disable-next-line no-console
  console.log(
    [
      scenario.name,
      `visible=${surface.isVisible}`,
      `items=${surface.items.length}`,
      `summary="${surface.summaryLine}"`,
      `capacity="${surface.capacityLabel}"`,
      `ece=${surface.eceLine ? 'yes' : 'no'}`,
      `cta=${surface.ctaRoute ?? 'none'}`,
      `titles=${surface.items.map((item) => item.title).join(' | ') || 'none'}`,
    ].join(' | '),
  );
}
