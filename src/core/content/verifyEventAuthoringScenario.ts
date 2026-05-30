import { verifyDistrictIdentityScenario } from '@/core/districts/verifyDistrictIdentityScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';

import {
  DISTRICT_EVENT_PACK_IDS,
  EVENT_PACK_IDS,
  FUTURE_ONLY_EVENT_PACK_IDS,
  POST_PILOT_LIGHT_DAILY_EVENT_CAP,
} from './eventAuthoringConstants';
import {
  collectEventAuthoringStrings,
  assertNoEventAuthoringForbiddenWords,
  EVENT_AUTHORING_EXAMPLE_PROFILES,
  EVENT_QUALITY_CHECKLIST,
  isExampleProfileDistrictConsistent,
  validateEventAuthoringProfileShape,
} from './eventAuthoringGuide';
import { EVENT_PACK_PLAN, listEventPackDefinitions } from './eventPackPlan';
import type { EventPackId } from './eventAuthoringTypes';

export type VerifyEventAuthoringOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function packHasTargetCounts(
  pack: (typeof EVENT_PACK_PLAN)[EventPackId],
): boolean {
  const t = pack.targetCounts;
  return t.anchor > 0 && t.side > 0;
}

export function verifyEventAuthoringScenario(): VerifyEventAuthoringOutcome {
  const checks: Check[] = [];

  const definedIds = new Set(Object.keys(EVENT_PACK_PLAN) as EventPackId[]);
  assert(
    checks,
    EVENT_PACK_IDS.every((id) => definedIds.has(id)) &&
      EVENT_PACK_IDS.length === definedIds.size,
    'Tüm EventPackId değerleri tanımlı',
    EVENT_PACK_IDS.join(', '),
  );

  const packs = listEventPackDefinitions();
  assert(
    checks,
    packs.every((p) => p.title.length > 0 && p.goal.length > 0 && p.theme.length > 0),
    'Her pack title/goal/theme içerir',
    String(packs.length),
  );

  assert(
    checks,
    packs.every(packHasTargetCounts),
    'Her pack target event count içerir',
    packs.map((p) => `${p.id}:a${p.targetCounts.anchor}/s${p.targetCounts.side}`).join('; '),
  );

  assert(
    checks,
    DISTRICT_EVENT_PACK_IDS.length === 5 &&
      DISTRICT_EVENT_PACK_IDS.every((id) => EVENT_PACK_PLAN[id].districtId != null),
    '5 mahalle için en az bir pack vardır',
    DISTRICT_EVENT_PACK_IDS.join(', '),
  );

  const postPilotPack = EVENT_PACK_PLAN.post_pilot_light;
  assert(
    checks,
    (postPilotPack.dailyEventCapNote ?? '').includes(String(POST_PILOT_LIGHT_DAILY_EVENT_CAP)),
    'post_pilot_light pack günde 2 event cap’i ile uyumlu not içerir',
    postPilotPack.dailyEventCapNote ?? 'missing',
  );

  assert(
    checks,
    FUTURE_ONLY_EVENT_PACK_IDS.every((id) => EVENT_PACK_PLAN[id].implemented === false),
    'crisis/social future pack implement edilmemiş olarak işaretlidir',
    FUTURE_ONLY_EVENT_PACK_IDS.map((id) => `${id}:${EVENT_PACK_PLAN[id].implemented}`).join(', '),
  );

  assert(
    checks,
    EVENT_QUALITY_CHECKLIST.length >= 10,
    'Event authoring checklist boş değildir',
    String(EVENT_QUALITY_CHECKLIST.length),
  );

  const forbiddenTotal = collectEventAuthoringStrings().reduce(
    (sum, text) => sum + assertNoEventAuthoringForbiddenWords(text),
    0,
  );
  assert(checks, forbiddenTotal === 0, 'Yasaklı kelime taraması 0 döner', String(forbiddenTotal));

  const examplesOk = EVENT_AUTHORING_EXAMPLE_PROFILES.length === 3;
  assert(
    checks,
    examplesOk &&
      EVENT_AUTHORING_EXAMPLE_PROFILES.every((p) => validateEventAuthoringProfileShape(p).ok),
    'Örnek 3 authoring profile schema’ya uyar',
    EVENT_AUTHORING_EXAMPLE_PROFILES.map((p) => p.id).join(', '),
  );

  assert(
    checks,
    EVENT_AUTHORING_EXAMPLE_PROFILES.every(isExampleProfileDistrictConsistent),
    'Örnek profiller district identity ile uyumludur',
    'ok',
  );

  assert(
    checks,
    EVENT_AUTHORING_EXAMPLE_PROFILES.every((p) => p.decisionIntent.length >= 3),
    'Örnek profiller en az 3 decision intent içerir',
    EVENT_AUTHORING_EXAMPLE_PROFILES.map((p) => String(p.decisionIntent.length)).join(', '),
  );

  assert(
    checks,
    EVENT_AUTHORING_EXAMPLE_PROFILES.every((p) => p.resultCopyNotes.length >= 1),
    'Örnek profiller resultCopyNotes içerir',
    'ok',
  );

  assert(
    checks,
    EVENT_AUTHORING_EXAMPLE_PROFILES.every((p) => p.reportCopyNotes.length >= 1),
    'Örnek profiller reportCopyNotes içerir',
    'ok',
  );

  assert(
    checks,
    packs.every((p) => !p.requiresNewRoute && !p.requiresNewGameplay),
    'Pack planı yeni route/gameplay gerektirmez',
    'requiresNewRoute=false',
  );

  const districtIdentity = verifyDistrictIdentityScenario();
  assert(
    checks,
    districtIdentity.failCount === 0,
    'verify:district-identity bozulmaz',
    `fail=${districtIdentity.failCount}`,
  );

  const fullUx = verifyFullUxFlowScenario();
  assert(
    checks,
    fullUx.audit.flowHealth === 'PASS',
    'verify:full-ux-flow bozulmaz',
    fullUx.audit.flowHealth,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
