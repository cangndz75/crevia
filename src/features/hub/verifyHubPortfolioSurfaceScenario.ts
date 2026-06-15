import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { verifyDailyCapacityPortfolioScenario } from '@/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { SAVE_VERSION } from '@/store/gamePersist';

import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import {
  centerPortfolioSurfaceCoreFieldsValid,
  centerPortfolioSurfaceCtaRouteSafe,
  centerPortfolioSurfaceDay1LowNoise,
  centerPortfolioSurfaceDay8Visible,
  centerPortfolioSurfaceEceLineMaxOne,
  centerPortfolioSurfaceMaxItems,
  centerPortfolioSurfaceNoDuplicateExactLines,
  centerPortfolioSurfaceNoDuplicateWithFocusSignals,
  centerPortfolioSurfaceNoTechnicalEnums,
  centerPortfolioSurfaceSmallScreenGuardsSource,
} from './utils/centerDailyCapacityPortfolioPresentation';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function makeStateForDay(day: number) {
  const base = createDay1Seed().gameState as any;
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
    events: [
      {
        id: `hub_portfolio_event_route_${day}`,
        title: 'Rota daralması',
        district: 'Sanayi',
        neighborhoodId: 'sanayi',
        status: 'active',
      },
      {
        id: `hub_portfolio_event_container_${day}`,
        title: 'Konteyner gecikmesi',
        district: 'Cumhuriyet',
        neighborhoodId: 'cumhuriyet',
        status: 'active',
      },
    ],
  };
}

function makeOperationSignals(day: number) {
  return {
    day,
    priorityDistrictId: 'sanayi',
    vehicles: {
      domain: 'vehicles',
      status: 'strained',
      score: 72,
      title: 'Araç rotası geriliyor',
      summary: 'Rota desteği sınırlı.',
      sourceTags: ['vehicle_route'],
    },
    containers: {
      domain: 'containers',
      status: 'watch',
      score: 58,
      title: 'Konteyner hattı izleniyor',
      summary: 'Hat yoğunluğu takipte.',
      sourceTags: ['container_network'],
    },
    districts: {
      domain: 'districts',
      status: 'strained',
      score: 63,
      title: 'Bölge dengesi',
      summary: 'Güven baskısı görünür.',
      sourceTags: ['district_trust'],
    },
    personnel: {
      domain: 'personnel',
      status: 'stable',
      score: 40,
      title: 'Ekip',
      summary: 'Dengeli.',
      sourceTags: [],
    },
    overall: {
      domain: 'overall',
      status: 'watch',
      score: 55,
      title: 'Genel sinyal',
      summary: 'Şehir sinyalleri izleniyor.',
      sourceTags: [],
    },
  } as any;
}

function buildPresentation(day: number) {
  return buildCenterHomePresentation({
    gameState: makeStateForDay(day),
    operationSignals: makeOperationSignals(day),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubTomorrowRisk:
      day >= 8
        ? {
            id: 'hub_portfolio_route_risk',
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
    hubVehicleMaintenanceLine: day >= 8 ? 'Bakım planı rota kararını etkileyebilir.' : null,
  });
}

function lineSetHasDuplicate(values: string[]): boolean {
  const normalized = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

export function verifyHubPortfolioSurfaceScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1 = buildPresentation(1);
  const day8 = buildPresentation(8);
  const day10 = buildPresentation(10);

  assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`);
  assert(checks, centerPortfolioSurfaceDay1LowNoise(day1.portfolioSurface), 'Day 1 low-noise');
  assert(checks, centerPortfolioSurfaceDay8Visible(day8.portfolioSurface), 'Day 8 visible');
  assert(checks, centerPortfolioSurfaceCoreFieldsValid(day8.portfolioSurface), 'Day 8 core fields');
  assert(checks, centerPortfolioSurfaceMaxItems(day8.portfolioSurface, 8), 'Day 8 max 3 items');
  assert(checks, centerPortfolioSurfaceMaxItems(day10.portfolioSurface, 10), 'Day 10 max 3 items');
  assert(checks, day8.portfolioSurface.capacityLabel.trim().length > 0, 'capacity label non-empty');
  assert(checks, centerPortfolioSurfaceCtaRouteSafe(day8.portfolioSurface), 'CTA route safety');
  assert(checks, centerPortfolioSurfaceEceLineMaxOne(day8.portfolioSurface), 'Ece max one');
  assert(checks, centerPortfolioSurfaceNoDuplicateExactLines(day8.portfolioSurface), 'no duplicate exact lines');
  assert(checks, centerPortfolioSurfaceNoTechnicalEnums(day8.portfolioSurface), 'no technical enum leak');
  assert(
    checks,
    centerPortfolioSurfaceNoDuplicateWithFocusSignals(
      day8.portfolioSurface,
      day8.operationFocus,
      day8.operationSignals,
    ),
    'no duplicate exact title with focus/signals',
  );
  assert(
    checks,
    day8.portfolioSurface.items.every((item) => item.accessibilityLabel.trim().length > 0),
    'accessibility labels non-empty',
  );
  assert(
    checks,
    !lineSetHasDuplicate(day8.portfolioSurface.items.map((item) => item.title)),
    'item titles unique',
  );
  assert(
    checks,
    !day8.portfolioSurface.items.some(
      (item) => item.tone === 'warning' && !item.deferRiskLine && !item.mapLine && !item.decisionLine,
    ),
    'no fake warning without copy source',
  );

  const store = readRepo('src/store/useGameStore.ts');
  const persist = readRepo('src/store/gamePersist.ts');
  const portfolioHelper = readRepo('src/features/hub/utils/centerDailyCapacityPortfolioPresentation.ts');
  const component = readRepo('src/features/hub/components/CenterPortfolioSurface.tsx');
  assert(checks, !store.includes('dailyCapacityPortfolio'), 'useGameStore not wired to portfolio');
  assert(checks, !persist.includes('dailyCapacityPortfolio'), 'gamePersist not wired to portfolio');
  assert(checks, !portfolioHelper.includes('applyDecision'), 'applyDecision untouched by helper');
  assert(checks, !portfolioHelper.includes('ensureDailyEventsForDay'), 'day pipeline untouched by helper');
  assert(checks, centerPortfolioSurfaceSmallScreenGuardsSource(component), 'small screen text guards');

  const dailyCapacity = verifyDailyCapacityPortfolioScenario();
  assert(checks, dailyCapacity.ok, 'verify:daily-capacity-portfolio remains ok');

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
