import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  auditOperationPortfolioPresentation,
  buildOperationPortfolioPresentation,
  operationPortfolioCtaWorkflowSafe,
  operationPortfolioDeferRiskDeterministic,
  operationPortfolioHasPrimarySlot,
  operationPortfolioHubAligned,
} from '@/features/events/presentation/operationPortfolio';
import { buildEventsOperationPortfolioPresentation } from '@/features/events/utils/eventsOperationPortfolioPresentation';
import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function lineSetHasDuplicate(values: string[]): boolean {
  const normalized = values.map(normalizeLine).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function makeStateForDay(day: number): GameState {
  const base = createDay1Seed().gameState;
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
    events: [
      {
        id: `portfolio_board_event_primary_${day}`,
        title: day <= 1 ? 'Merkez temizlik çağrısı' : 'Rota daralması',
        district: day <= 1 ? 'Merkez Mahallesi' : 'Sanayi',
        neighborhoodId: day <= 1 ? 'merkez' : 'sanayi',
        riskLevel: (day <= 1 ? 'medium' : 'high') as EventCard['riskLevel'],
        urgencyHours: day <= 1 ? 8 : 4,
        category: 'waste',
        description: 'Portfolio board verify fixture.',
        contextTag: 'portfolio_verify',
        decisions: [],
        previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
      },
      ...(day >= 8
        ? [
            {
              id: `portfolio_board_event_secondary_${day}`,
              title: 'Konteyner gecikmesi',
              district: 'Cumhuriyet',
              neighborhoodId: 'cumhuriyet',
              riskLevel: 'medium' as EventCard['riskLevel'],
              urgencyHours: 6,
              category: 'logistics',
              description: 'Portfolio board verify fixture.',
              contextTag: 'portfolio_verify',
              decisions: [],
              previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
            },
            {
              id: `portfolio_board_event_tertiary_${day}`,
              title: 'Pazar alanı şikayeti',
              district: 'Yunus Emre',
              neighborhoodId: 'yunus_emre',
              riskLevel: 'high' as EventCard['riskLevel'],
              urgencyHours: 5,
              category: 'social',
              description: 'Portfolio board verify fixture.',
              contextTag: 'portfolio_verify',
              decisions: [],
              previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
            },
          ]
        : []),
    ] as unknown as EventCard[],
  };
}

function makeOperationSignals(day: number) {
  return {
    day,
    priorityDistrictId: day <= 1 ? 'merkez' : 'sanayi',
    vehicles: {
      domain: 'vehicles',
      status: day >= 8 ? 'strained' : 'stable',
      score: day >= 8 ? 72 : 40,
      title: 'Araç rotası',
      summary: 'Rota desteği.',
      sourceTags: ['vehicle_route'],
    },
    containers: {
      domain: 'containers',
      status: 'watch',
      score: 58,
      title: 'Konteyner hattı',
      summary: 'Hat yoğunluğu.',
      sourceTags: ['container_network'],
    },
    districts: {
      domain: 'districts',
      status: day >= 8 ? 'strained' : 'stable',
      score: day >= 8 ? 63 : 42,
      title: 'Bölge dengesi',
      summary: 'Güven baskısı.',
      sourceTags: ['district_trust'],
    },
    personnel: {
      domain: 'personnel',
      status: day >= 8 ? 'watch' : 'stable',
      score: day >= 8 ? 52 : 38,
      title: 'Ekip',
      summary: 'Dengeli.',
      sourceTags: [],
    },
    overall: {
      domain: 'overall',
      status: day >= 8 ? 'watch' : 'stable',
      score: day >= 8 ? 55 : 36,
      title: 'Genel sinyal',
      summary: 'Şehir sinyalleri.',
      sourceTags: [],
    },
  };
}

function buildBoard(day: number) {
  const gameState = makeStateForDay(day);
  const activeEvents = gameState.events;
  const operationSignals = makeOperationSignals(day) as never;
  const hub = buildCenterHomePresentation({
    gameState,
    operationSignals,
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubTomorrowRisk:
      day >= 8
        ? {
            id: 'portfolio_board_route_risk',
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

  return buildOperationPortfolioPresentation({
    day,
    gameState,
    activeEvents,
    featuredEventId: activeEvents[0]?.id ?? null,
    operationSignals,
    socialPulseState: createInitialSocialPulseState(),
    hubTomorrowRisk:
      day >= 8
        ? {
            id: 'portfolio_board_route_risk',
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
    hubTodayFocus: hub.gameFirst.todayFocus.goalSentence,
    hubPrimaryOperationTitle: hub.activeTarget.title,
    hubPrimaryCtaLabel: hub.gameFirst.primaryCta.label,
  });
}

function buildEventsBoard(day: number) {
  const gameState = makeStateForDay(day);
  const activeEvents = gameState.events;
  return buildEventsOperationPortfolioPresentation({
    gameState,
    activeEvents,
    featuredEventId: activeEvents[0]?.id ?? null,
    operationSignals: makeOperationSignals(day) as never,
    socialPulseState: createInitialSocialPulseState(),
    hubVehicleMaintenanceLine: day >= 8 ? 'Bakım planı rota kararını etkileyebilir.' : null,
  });
}

export function verifyOperationPortfolioScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const persist = readRepo('src/store/gamePersist.ts');

  assert(checks, assertVerifySaveVersionPolicy(persist, SAVE_VERSION), 'SAVE_VERSION policy', `version=${SAVE_VERSION}`);
  assert(checks, !persist.includes('SAVE_VERSION = 29'), 'SAVE_VERSION not bumped');
  assert(checks, persist.includes('SAVE_VERSION: number = 28'), 'SAVE_VERSION remains 28');

  const day1 = buildBoard(1);
  const day8 = buildBoard(8);
  const day10 = buildBoard(10);
  const eventsDay8 = buildEventsBoard(8);

  assert(checks, day1.isDay1, 'day1 flag');
  assert(checks, day8.isRichDay, 'day8 rich flag');
  assert(checks, day1.isVisible, 'day1 board visible');
  assert(checks, day1.secondarySlots.length === 0, 'day1 single slot surface', String(day1.secondarySlots.length));
  assert(
    checks,
    (day1.primarySlot ? 1 : 0) + day1.pendingSignals.length <= 2,
    'day1 bounded surface',
  );
  assert(checks, day1.suggestedPlan.visible, 'day1 suggested plan');
  assert(checks, !day1.conflicts.visible || day1.conflicts.badgeCount <= 1, 'day1 conflict bounded');
  assert(checks, !day1.outcomePreview.visible, 'day1 outcome preview hidden');

  assert(
    checks,
    day8.secondarySlots.length <= 2,
    'day8 slot bounded',
    String(day8.secondarySlots.length),
  );
  assert(checks, operationPortfolioHasPrimarySlot(day8), 'day8 primary slot');
  assert(checks, day8.capacity.visible, 'day8 capacity visible');
  assert(checks, day8.conflicts.badgeCount <= 3, 'day8 conflict bounded', String(day8.conflicts.badgeCount));
  assert(checks, day8.outcomePreview.visible, 'day8 outcome preview');
  assert(checks, day8.outcomePreview.chips.length <= 3, 'outcome preview chip bounded');

  for (const board of [day1, day8, day10, eventsDay8]) {
    const auditIssues = auditOperationPortfolioPresentation(board);
    assert(checks, auditIssues.length === 0, `audit day${board.isDay1 ? 1 : board.isRichDay ? 8 : 10}`, auditIssues.join(', '));
  }

  assert(checks, operationPortfolioDeferRiskDeterministic(day8), 'defer risk deterministic day8');
  assert(checks, operationPortfolioCtaWorkflowSafe(day8), 'CTA workflow safe day8');
  assert(checks, operationPortfolioHubAligned(eventsDay8), 'hub alignment events adapter');

  const slots = [day8.primarySlot, ...day8.secondarySlots].filter(
    (slot): slot is NonNullable<typeof slot> => Boolean(slot),
  );
  assert(
    checks,
    slots.every(
      (slot) =>
        Boolean(slot.riskLabel) &&
        Boolean(slot.priorityBadge) &&
        slot.resourceChips.length > 0 &&
        Boolean(slot.cta.label),
    ),
    'slot required fields day8',
  );

  assert(
    checks,
    !lineSetHasDuplicate(day8.collectStrings()),
    'duplicate copy guard day8',
  );

  const boardComponent = readRepo('src/features/events/components/operation-portfolio/OperationPortfolioBoard.tsx');
  assert(checks, boardComponent.includes('numberOfLines'), 'board small-screen numberOfLines');
  assert(checks, boardComponent.includes('ellipsizeMode'), 'board ellipsizeMode');
  assert(checks, boardComponent.includes('minWidth: 0'), 'board minWidth guard');
  assert(checks, !boardComponent.includes('FlatList'), 'no basic list fallback');
  assert(checks, boardComponent.includes('OperationPortfolioBoard'), 'board component exists');

  const eventsScreen = readRepo('src/features/events/screens/EventsDecisionCenterScreen.tsx');
  assert(checks, eventsScreen.includes('OperationPortfolioBoard'), 'events screen wired');

  const gameStore = readRepo('src/store/useGameStore.ts');
  assert(checks, !gameStore.includes('operationPortfolioBoardState'), 'no persist shape change');

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
