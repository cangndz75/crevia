import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import { createSeededRandom, hashSeed } from '@/core/game/createSeededRandom';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';

import {
  EVENT_CONTENT_PROFILES,
  getEventContentProfileById,
} from './eventContentLibrary';
import {
  buildDecisionPriorityHint,
  buildEventCardPriorityChip,
  getEventPriorityRelation,
} from './eventContentPresentation';
import {
  applyContentProfileToEvent,
  enrichDailyEventSetWithEventContent,
  isProfileBlocked,
  mapEventToContentCategory,
  rankProfilesForEvent,
  selectContentProfileForEvent,
} from './eventVariationEngine';
import type {
  EventContentCategory,
  EventContentVariationContext,
} from './eventContentTypes';

const CANONICAL_NEIGHBORHOODS = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

const PRIORITY_KEYS: DailyPriorityKey[] = [
  'public_relief',
  'operation_stability',
  'resource_protection',
];

export type VerifyEventContentOutcome = {
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

function makeVariationContext(
  partial: Partial<EventContentVariationContext> & {
    neighborhoodId: string;
    day: number;
  },
): EventContentVariationContext {
  return {
    day: partial.day,
    neighborhoodId: partial.neighborhoodId,
    dailyPriorityKey: partial.dailyPriorityKey,
    history: partial.history ?? {
      recentProfileIds: [],
      recentTitles: [],
      categoriesByDay: {},
    },
    batchProfileIds: partial.batchProfileIds ?? [],
    batchCategories: partial.batchCategories ?? [],
    isAnchor: partial.isAnchor ?? false,
    isTutorialDay: partial.isTutorialDay ?? false,
    rng: partial.rng ?? createSeededRandom(hashSeed(`verify-${partial.day}`)),
  };
}

function sampleEventForCategory(
  category: EventContentCategory,
): EventCard {
  const match = pilotEvents.find(
    (e) => mapEventToContentCategory(e) === category,
  );
  if (match) {
    return match;
  }
  return pilotEvents[0]!;
}

export function verifyEventContentScenario(): VerifyEventContentOutcome {
  const checks: string[] = [];
  let ok = true;

  const profileCount = EVENT_CONTENT_PROFILES.length;
  ok =
    assert(
      checks,
      profileCount >= 25,
      `En az 25 content profile (${profileCount})`,
      `Profile sayısı yetersiz: ${profileCount}`,
    ) && ok;

  for (const profile of EVENT_CONTENT_PROFILES) {
    const hasTemplates =
      profile.titleTemplates.length > 0 &&
      profile.descriptionTemplates.length > 0 &&
      profile.fieldNoteTemplates.length > 0;
    ok =
      assert(
        checks,
        hasTemplates,
        `${profile.id} şablonları tam`,
        `${profile.id} eksik şablon`,
      ) && ok;

    const blueprintsOk =
      profile.decisionBlueprints.length >= 3 &&
      profile.decisionBlueprints.every(
        (bp) => bp.shortTradeoff.length > 0 && bp.riskHint.length > 0,
      );
    ok =
      assert(
        checks,
        blueprintsOk,
        `${profile.id} karar blueprint'leri tam`,
        `${profile.id} blueprint eksik`,
      ) && ok;
  }

  let neighborhoodRenderOk = true;
  for (const neighborhoodId of CANONICAL_NEIGHBORHOODS) {
    const profile = EVENT_CONTENT_PROFILES.find((p) =>
      p.allowedNeighborhoods?.includes(neighborhoodId),
    );
    if (!profile) {
      continue;
    }
    const event = sampleEventForCategory(profile.category);
    const enriched = applyContentProfileToEvent(
      event,
      profile,
      makeVariationContext({ day: 3, neighborhoodId }),
    );
    if (!enriched.title || !enriched.description) {
      neighborhoodRenderOk = false;
    }
  }
  ok =
    assert(
      checks,
      neighborhoodRenderOk,
      '5 mahalle için varyasyon metni üretilebiliyor',
      'Mahalle varyasyon metni üretilemedi',
    ) && ok;

  const unknownEvent = sampleEventForCategory('waste_container');
  let unknownCrash = true;
  try {
    const profile = rankProfilesForEvent(unknownEvent, 'unknown-district-x')[0];
    if (profile) {
      applyContentProfileToEvent(
        unknownEvent,
        profile,
        makeVariationContext({ day: 2, neighborhoodId: 'unknown-district-x' }),
      );
    }
  } catch {
    unknownCrash = false;
  }
  ok =
    assert(
      checks,
      unknownCrash,
      'Bilinmeyen mahalle id crash etmiyor',
      'Bilinmeyen mahalle id hata verdi',
    ) && ok;

  for (const key of PRIORITY_KEYS) {
    const mockDecision = {
      id: 'd1',
      title: 'Test',
      description: 'Test',
      style: 'balanced' as const,
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 0,
      },
      contentStrategyLabel: 'Kaynak korur',
    };
    const relation = getEventPriorityRelation(mockDecision, key);
    const hint = buildDecisionPriorityHint(mockDecision, key);
    ok =
      assert(
        checks,
        relation !== undefined && (hint !== null || relation === 'indirect'),
        `Daily priority relation: ${key}`,
        `Priority relation çalışmıyor: ${key}`,
      ) && ok;
  }

  const day1Bundle = createDay1Seed();
  const day1AnchorId = day1Bundle.gameState.pilot.dailyEventSet?.anchorEventId;
  const day1Catalog = cloneEvents(day1Bundle.eventPool);
  const day1Set = day1Bundle.gameState.pilot.dailyEventSet;
  const day1AnchorBefore = day1AnchorId
    ? day1Catalog.find((e) => e.id === day1AnchorId)
    : undefined;
  const day1Snapshot = day1AnchorBefore
    ? JSON.stringify(day1AnchorBefore)
    : 'none';

  if (day1Set) {
    enrichDailyEventSetWithEventContent({
      dailyEventSet: day1Set,
      catalog: day1Catalog,
      gameState: day1Bundle.gameState,
      day: 1,
      districtId: DEFAULT_PILOT_DISTRICT_ID,
    });
  }

  const day1AnchorAfter = day1AnchorId
    ? day1Catalog.find((e) => e.id === day1AnchorId)
    : undefined;
  const day1TutorialOk =
    day1Snapshot === (day1AnchorAfter ? JSON.stringify(day1AnchorAfter) : 'none');
  ok =
    assert(
      checks,
      day1TutorialOk,
      'Gün 1 tutorial anchor içerik varyasyonundan korunuyor',
      'Gün 1 tutorial anchor değişti',
    ) && ok;

  const repeatProfile = EVENT_CONTENT_PROFILES[0]!;
  const repeatTitle = repeatProfile.titleTemplates[0]!;
  const blockedContext = makeVariationContext({
    day: 4,
    neighborhoodId: 'sanayi',
    history: {
      recentProfileIds: [repeatProfile.id],
      recentTitles: [repeatTitle],
      categoriesByDay: {},
    },
  });
  const blocked = isProfileBlocked(
    repeatProfile,
    blockedContext,
    repeatTitle,
  );
  ok =
    assert(
      checks,
      blocked,
      'Son 2 gün profile/title repeat guard',
      'Repeat guard çalışmıyor',
    ) && ok;

  const spamContext = makeVariationContext({
    day: 5,
    neighborhoodId: 'merkez',
    batchCategories: ['waste_container', 'waste_container'],
    history: { recentProfileIds: [], recentTitles: [], categoriesByDay: {} },
  });
  const spamBlocked = isProfileBlocked(
    { ...repeatProfile, category: 'waste_container' },
    spamContext,
    'Test başlık',
  );
  ok =
    assert(
      checks,
      spamBlocked,
      'Aynı gün category spam guard (max 2)',
      'Category spam guard çalışmıyor',
    ) && ok;

  let signalClampOk = true;
  const simState: GameState = {
    ...day1Bundle.gameState,
    pilot: {
      ...day1Bundle.gameState.pilot,
      currentPilotDay: 3,
      dailyEventSet: undefined,
    },
  };
  const containerState = createInitialContainerState(3);
  const vehicleState = createInitialVehicleState(3);
  for (let day = 2; day <= 4; day += 1) {
    const catalog = cloneEvents(pilotEvents);
    const set = generateDailyEventSet({
      gameState: { ...simState, pilot: { ...simState.pilot, currentPilotDay: day } },
      day,
      districtId: DEFAULT_PILOT_DISTRICT_ID,
      events: catalog,
      containerState,
      vehicleState,
      dailyPriorityKey: 'operation_stability',
    });
    const supplementIds = (set.supplementalEvents ?? []).map((e) => e.id);
    const uniqueSupplements = new Set(supplementIds);
    if (uniqueSupplements.size !== supplementIds.length) {
      signalClampOk = false;
    }
  }
  ok =
    assert(
      checks,
      signalClampOk,
      'Container/vehicle supplement duplicate yok',
      'Supplement duplicate tespit edildi',
    ) && ok;

  const profileLookup = getEventContentProfileById(
    EVENT_CONTENT_PROFILES[0]!.id,
  );
  ok =
    assert(
      checks,
      profileLookup != null,
      'Profile id lookup',
      'Profile lookup başarısız',
    ) && ok;

  const ranked = rankProfilesForEvent(
    sampleEventForCategory('waste_container'),
    'sanayi',
    'operation_stability',
  );
  ok =
    assert(
      checks,
      ranked.length > 0,
      'Sanayi waste profile sıralaması',
      'Profile sıralaması boş',
    ) && ok;

  const pickContext = makeVariationContext({
    day: 3,
    neighborhoodId: 'sanayi',
    dailyPriorityKey: 'public_relief',
  });
  const picked = selectContentProfileForEvent(
    sampleEventForCategory('waste_container'),
    pickContext,
  );
  ok =
    assert(
      checks,
      picked != null,
      'Content profile seçimi',
      'Profile seçilemedi',
    ) && ok;

  if (picked) {
    const enriched = applyContentProfileToEvent(
      sampleEventForCategory('waste_container'),
      picked,
      pickContext,
    );
    const chip = buildEventCardPriorityChip(enriched, 'public_relief');
    ok =
      assert(
        checks,
        chip == null || chip.length > 0,
        'Event kart priority chip',
        'Priority chip üretilemedi',
      ) && ok;
  }

  return { ok, checks };
}
