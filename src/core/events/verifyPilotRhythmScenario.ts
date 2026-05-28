import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';

import {
  BUTTERFLY_SEED_FALLBACK_CATEGORIES,
  getPilotDayRole,
  getPilotRhythmPlan,
  PILOT_RHYTHM_PLANS,
} from './pilotRhythmConstants';
import {
  applyPilotRhythmToEventCandidates,
  buildRhythmDebugSummary,
  ensureRhythmNeighborhoodSpread,
  resolveRhythmEventNeighborhood,
  scoreEventForRhythm,
  selectEventsForRhythm,
} from './pilotRhythmEngine';
import { getPilotRhythmChipLabel } from './pilotRhythmPresentation';
import { mapEventToContentCategory } from './eventVariationEngine';

export type VerifyPilotRhythmOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function cloneEvents(events: EventCard[]): EventCard[] {
  return events.map((e) => ({
    ...e,
    decisions: e.decisions.map((d) => ({ ...d })),
  }));
}

function sampleEvent(): EventCard {
  return pilotEvents.find((e) => e.day === 3) ?? pilotEvents[0]!;
}

export function verifyPilotRhythmScenario(): VerifyPilotRhythmOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      PILOT_RHYTHM_PLANS.length === 7,
      '7 günlük rhythm planı tanımlı',
      `Plan sayısı: ${PILOT_RHYTHM_PLANS.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      getPilotDayRole(1) === 'tutorial' && getPilotDayRole(7) === 'final_stress',
      'Gün 1 tutorial, Gün 7 final_stress',
      'Gün rolü eşleşmedi',
    ) && ok;

  for (const plan of PILOT_RHYTHM_PLANS) {
    const hasBasics =
      plan.title.length > 0 &&
      plan.description.length > 0 &&
      plan.preferredCategories.length >= 0 &&
      plan.eventSlots.some((s) => s.required);
    ok =
      assert(
        checks,
        hasBasics,
        `Gün ${plan.day} plan alanları tam`,
        `Gün ${plan.day} plan eksik`,
      ) && ok;
  }

  const day1Bundle = createDay1Seed();
  const day1AnchorId = day1Bundle.gameState.pilot.dailyEventSet?.anchorEventId;
  const day1Catalog = cloneEvents(day1Bundle.eventPool);
  const day1Set = day1Bundle.gameState.pilot.dailyEventSet;
  const day1Before = day1AnchorId
    ? JSON.stringify(day1Catalog.find((e) => e.id === day1AnchorId))
    : 'none';

  if (day1Set) {
    const catalog = cloneEvents(day1Catalog);
    generateDailyEventSet({
      gameState: day1Bundle.gameState,
      day: 1,
      districtId: DEFAULT_PILOT_DISTRICT_ID,
      events: catalog,
    });
    const after = day1AnchorId
      ? catalog.find((e) => e.id === day1AnchorId)
      : undefined;
    ok =
      assert(
        checks,
        day1Before === (after ? JSON.stringify(after) : 'none') &&
          !after?.contentProfileId,
        'Day 1 tutorial anchor korunuyor',
        'Day 1 anchor değişti',
      ) && ok;
  }

  const day2Plan = getPilotRhythmPlan(2);
  ok =
    assert(
      checks,
      day2Plan.preferredCategories.includes('citizen_complaint'),
      'Gün 2 citizen/waste/social tercih',
      'Gün 2 kategori tercihi eksik',
    ) && ok;

  const day3Plan = getPilotRhythmPlan(3);
  ok =
    assert(
      checks,
      day3Plan.preferredCategories.includes('vehicle_route'),
      'Gün 3 operasyon kategorileri',
      'Gün 3 resource_split kategorileri eksik',
    ) && ok;

  const day4Plan = getPilotRhythmPlan(4);
  ok =
    assert(
      checks,
      day4Plan.preferredCategories.includes('social_pressure'),
      'Gün 4 sosyal görünürlük kategorileri',
      'Gün 4 social_visibility eksik',
    ) && ok;

  const day5Plan = getPilotRhythmPlan(5);
  ok =
    assert(
      checks,
      day5Plan.eventSlots.some((s) => s.slot === 'opportunity' && s.required),
      'Gün 5 opportunity slot zorunlu',
      'Gün 5 opportunity slot yok',
    ) && ok;

  const day6Plan = getPilotRhythmPlan(6);
  const day6Cats = effectiveDay6Categories(day6Plan.preferredCategories);
  ok =
    assert(
      checks,
      day6Cats.includes('permanent_solution') || day6Cats.includes('inspection_gap'),
      'Gün 6 butterfly fallback kategorileri',
      'Gün 6 fallback eksik',
    ) && ok;

  const day7Plan = getPilotRhythmPlan(7);
  ok =
    assert(
      checks,
      day7Plan.intensity === 'peak',
      'Gün 7 peak intensity',
      'Gün 7 intensity hatalı',
    ) && ok;

  const wasteEvent = pilotEvents.find((e) => mapEventToContentCategory(e) === 'waste_container');
  const socialEvent = pilotEvents.find((e) => mapEventToContentCategory(e) === 'social_pressure');
  if (wasteEvent && socialEvent) {
    const wasteScore = scoreEventForRhythm(wasteEvent, day3Plan, {
      day: 3,
      gameState: day1Bundle.gameState,
    });
    const socialScore = scoreEventForRhythm(socialEvent, day3Plan, {
      day: 3,
      gameState: day1Bundle.gameState,
    });
    ok =
      assert(
        checks,
        wasteScore > socialScore,
        'Rhythm score preferred category pozitif',
        'Preferred category skoru düşük',
      ) && ok;

    const discouraged = scoreEventForRhythm(socialEvent, day4Plan, {
      day: 4,
      gameState: day1Bundle.gameState,
    });
    const encouraged = scoreEventForRhythm(socialEvent, day4Plan, {
      day: 4,
      gameState: day1Bundle.gameState,
      dailyPriorityKey: 'operation_stability',
    });
    ok =
      assert(
        checks,
        encouraged >= discouraged,
        'Gün 4 sosyal baskı öncelikten bağımsız güçlü',
        'Gün 4 sosyal rhythm zayıf',
      ) && ok;
  }

  const emptySelect = selectEventsForRhythm([], {
    day: 2,
    gameState: day1Bundle.gameState,
  });
  ok =
    assert(
      checks,
      emptySelect.warnings.length > 0 && emptySelect.selectedEvents.length === 0,
      'selectEventsForRhythm boş candidate crash etmiyor',
      'Boş candidate hata',
    ) && ok;

  let signalOk = true;
  for (let day = 2; day <= 4; day += 1) {
    const catalog = cloneEvents(pilotEvents);
    const set = generateDailyEventSet({
      gameState: {
        ...day1Bundle.gameState,
        pilot: { ...day1Bundle.gameState.pilot, currentPilotDay: day },
      },
      day,
      districtId: DEFAULT_PILOT_DISTRICT_ID,
      events: catalog,
      containerState: createInitialContainerState(day),
      vehicleState: createInitialVehicleState(day),
      dailyPriorityKey: 'operation_stability',
    });
    const supplementIds = (set.supplementalEvents ?? []).map((e) => e.id);
    if (new Set(supplementIds).size !== supplementIds.length) {
      signalOk = false;
    }
  }
  ok =
    assert(checks, signalOk, 'Container/vehicle signal duplicate yok', 'Signal dup') &&
    ok;

  const bareCard: EventCard = {
    ...sampleEvent(),
    rhythmMeta: undefined,
    contentMeta: undefined,
  };
  ok =
    assert(
      checks,
      getPilotRhythmChipLabel(bareCard, 3) != null || getPilotRhythmChipLabel(bareCard, 3) === null,
      'rhythmMeta missing UI helper crash etmiyor',
      'UI helper crash',
    ) && ok;

  ok =
    assert(
      checks,
      resolveRhythmEventNeighborhood({
        ...sampleEvent(),
        neighborhoodId: 'yesilpark',
      }) === 'yesilvadi',
      'Bridge mahalle normalize',
      'Bridge normalize hatalı',
    ) && ok;

  const sorted = applyPilotRhythmToEventCandidates(
    pilotEvents.filter((e) => e.day === 5).slice(0, 5),
    { day: 5, gameState: day1Bundle.gameState },
  );
  ok =
    assert(checks, sorted.length > 0, 'applyPilotRhythmToEventCandidates', 'Sort boş') && ok;

  const summary = buildRhythmDebugSummary(sorted, day5Plan);
  ok =
    assert(
      checks,
      summary.role === 'opportunity',
      'buildRhythmDebugSummary',
      'Debug summary hatalı',
    ) && ok;

  return { ok, checks };
}

function effectiveDay6Categories(preferred: string[]): string[] {
  if (preferred.includes('butterfly')) {
    return preferred;
  }
  return [...preferred, ...BUTTERFLY_SEED_FALLBACK_CATEGORIES];
}
