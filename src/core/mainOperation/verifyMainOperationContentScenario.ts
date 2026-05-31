import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
} from '@/core/monetization/monetizationState';
import { MAIN_OPERATION_DISTRICT_IDS } from '@/core/mainOperation/mainOperationConstants';
import { buildFullMainOperationDailySet } from '@/core/mainOperation/mainOperationEventGeneration';
import { buildMainOperationEngineInput } from '@/core/mainOperation/mainOperationEngine';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import {
  countDefsByKind,
  CRISIS_ADJACENT_KEYS,
  DISTRICT_EVENT_KEYS,
  getAllTemplateKeys,
  getAllTitles,
  GLOBAL_ANCHOR_KEYS,
  GLOBAL_SIDE_KEYS,
} from '@/core/mainOperation/mainOperationContentPack';
import { countMainOperationAdvisorCopy } from '@/core/mainOperation/mainOperationAdvisorCopy';
import {
  countMainOperationReportLines,
  MAIN_OPERATION_REPORT_LINE_POOL,
} from '@/core/mainOperation/mainOperationReportCopy';
import {
  countCrisisMainOperationMentions,
  countMainOperationSocialMentions,
  countPositiveMainOperationMentions,
} from '@/core/mainOperation/mainOperationSocialContent';
import { MAIN_OPERATION_FORBIDDEN_WORDS } from '@/core/mainOperation/mainOperationConstants';
import { ensurePostPilotDailyEventsForDay } from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { createInitialCrisisState } from '@/core/crisis/crisisState';

export type VerifyMainOperationContentOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function engineInput(day: number) {
  const gs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  return buildMainOperationEngineInput({
    gameState: { ...gs, city: { ...gs.city, day } },
    monetization: mockPurchaseMainOperationPack(createInitialMonetizationState(), day),
    mainOperationSeason: createFullMainOperationSeasonState(day),
  });
}

export function verifyMainOperationContentScenario(): VerifyMainOperationContentOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  ok =
    assert(
      checks,
      countDefsByKind('anchor') >= 11,
      'Full anchor event count minimum eşiği karşılıyor',
      `anchors=${countDefsByKind('anchor')}`,
    ) && ok;

  ok =
    assert(
      checks,
      countDefsByKind('side') >= 17,
      'Full side event count minimum eşiği karşılıyor',
      `sides=${countDefsByKind('side')}`,
    ) && ok;

  ok =
    assert(
      checks,
      countDefsByKind('district') >= 15,
      'District event count minimum 15',
      `district=${countDefsByKind('district')}`,
    ) && ok;

  ok =
    assert(
      checks,
      CRISIS_ADJACENT_KEYS.length >= 6,
      'Crisis-adjacent event count minimum 6',
      `crisis=${CRISIS_ADJACENT_KEYS.length}`,
    ) && ok;

  const keys = getAllTemplateKeys();
  ok =
    assert(
      checks,
      new Set(keys).size === keys.length,
      'Event id duplicate yok',
      'duplicate template keys',
    ) && ok;

  const titles = getAllTitles();
  const titleSet = new Set(titles);
  ok =
    assert(
      checks,
      titleSet.size / titles.length >= 0.95,
      'Event title duplicate oranı düşük',
      `unique=${titleSet.size}/${titles.length}`,
    ) && ok;

  for (const districtId of MAIN_OPERATION_DISTRICT_IDS) {
    ok =
      assert(
        checks,
        (DISTRICT_EVENT_KEYS[districtId]?.length ?? 0) >= 3,
        `Her mahalle minimum 3 event (${districtId})`,
        districtId,
      ) && ok;
  }

  ok =
    assert(
      checks,
      countMainOperationAdvisorCopy() >= 25,
      'Advisor full copy count minimum 25',
      `advisor=${countMainOperationAdvisorCopy()}`,
    ) && ok;

  ok =
    assert(
      checks,
      countMainOperationReportLines() >= 30,
      'Report copy count minimum 30',
      `report=${countMainOperationReportLines()}`,
    ) && ok;

  ok =
    assert(
      checks,
      countMainOperationSocialMentions() >= 25,
      'Social mention count minimum 25',
      `mentions=${countMainOperationSocialMentions()}`,
    ) && ok;

  ok =
    assert(
      checks,
      countPositiveMainOperationMentions() >= 5,
      'Positive social mention en az 5',
      `pos=${countPositiveMainOperationMentions()}`,
    ) && ok;

  ok =
    assert(
      checks,
      countCrisisMainOperationMentions() >= 5,
      'Crisis-adjacent mention en az 5',
      `crisisM=${countCrisisMainOperationMentions()}`,
    ) && ok;

  const input8 = engineInput(8);
  const set8 = buildFullMainOperationDailySet(8, input8);
  ok =
    assert(
      checks,
      set8.allEventIds.length <= 2,
      'Full event generation cap Day 8 max 2',
      `count=${set8.allEventIds.length}`,
    ) && ok;

  const set10 = buildFullMainOperationDailySet(10, engineInput(10));
  ok =
    assert(
      checks,
      set10.allEventIds.length <= 3,
      'Full event generation cap Day 9+ max 3',
      `count=${set10.allEventIds.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      new Set(set10.allEventIds).size === set10.allEventIds.length,
      'Same day duplicate event id yok',
      'duplicate daily ids',
    ) && ok;

  const limitedGs = applyLimitedContinueToGameState(
    applyFullAccessToGameState(
      buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
    ),
  );
  const limitedMon = createInitialMonetizationState();
  const limitedGen = ensurePostPilotDailyEventsForDay({
    gameState: { ...limitedGs, city: { ...limitedGs.city, day: 8 } },
    postPilotOperation: normalizePostPilotOperationState(
      limitedGs.pilot.postPilotOperation,
      { pilotStatus: 'completed', currentPilotDay: 8 },
    ),
    day: 8,
    mainOperationContext: {
      monetization: limitedMon,
      mainOperationSeason: createFullMainOperationSeasonState(8),
    },
  });
  const limitedCount =
    limitedGen.postPilotOperation.postPilotDailyEventSet?.allEventIds.length ?? 0;
  ok =
    assert(
      checks,
      limitedCount <= 2,
      'Limited event generation max 2 kalıyor',
      `limited=${limitedCount}`,
    ) && ok;

  const uiText = [
    ...titles,
    ...MAIN_OPERATION_REPORT_LINE_POOL.map((l) => l.line),
  ]
    .join(' ')
    .toLowerCase();
  ok =
    assert(
      checks,
      !MAIN_OPERATION_FORBIDDEN_WORDS.some((w) =>
        w === 'xp' ? /\bxp\b/.test(uiText) : uiText.includes(w),
      ),
      'Forbidden words yok',
      'forbidden',
    ) && ok;

  ok =
    assert(
      checks,
      !/TODO|test copy|dev only/i.test(uiText),
      'No raw TODO/test/dev copy in player-facing text',
      'dev copy',
    ) && ok;

  hasWarn =
    warn(checks, true, 'Content pack still below long-season target', 'long season') ||
    hasWarn;
  hasWarn =
    warn(
      checks,
      true,
      'More district-specific events recommended later',
      'more district',
    ) || hasWarn;

  return { ok, warn: hasWarn, checks };
}
