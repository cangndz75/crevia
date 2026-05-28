import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { createNotSelectedPriorityState } from '@/core/dailyPriority/dailyPriorityEngine';
import type {
  DailyPriorityFinalStatus,
  DailyPriorityKey,
  DailyPriorityState,
} from '@/core/dailyPriority/dailyPriorityTypes';
import { createDefaultButterflyHookState } from '@/core/events/butterflyHookEngine';
import type { ButterflyHook } from '@/core/events/butterflyHookTypes';
import type { EventCard } from '@/core/models/EventCard';
import {
  CARRY_OVER_MAX_NEGATIVE_FRACTION,
  CARRY_OVER_MAX_POSITIVE_FRACTION,
  CARRY_OVER_MAX_SIGNALS_PER_DAY,
  CARRY_OVER_TOTAL_BIAS_CLAMP,
} from './carryOverConstants';
import {
  buildCarryOverFromDailyPriority,
  buildCarryOverSignalsForDay,
  clampCarryOverFraction,
  convertCarryOverToButterflyOverlap,
  findOverlappingButterflyHook,
  getCarryOverWeightDeltaForEvent,
  limitCarryOverSignals,
  overlapsButterflyTarget,
} from './carryOverEngine';
import {
  buildCarryOverHubLines,
  buildCarryOverReportLines,
} from './carryOverPresentation';
import type { CarryOverEvaluationInput } from './carryOverTypes';
import { buildCarryOverEvaluationInput } from './carryOverSelectors';

type Severity = 'PASS' | 'WARN' | 'FAIL';

type Check = { name: string; severity: Severity; detail: string };

function record(checks: Check[], severity: Severity, name: string, detail: string): void {
  checks.push({ name, severity, detail });
}

function priorityState(
  day: number,
  key: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
  score: number,
): DailyPriorityState {
  const base = createNotSelectedPriorityState(day);
  return {
    ...base,
    selectedKey: key,
    status,
    score,
    progressPercent: score,
    selectedAt: Date.now(),
    finalResult: {
      status,
      title: status,
      text: `${key} ${status}`,
      xpBonus: status === 'fulfilled' ? 15 : status === 'partial' ? 8 : 0,
    },
  };
}

function mockEvent(id: string, category = 'social_pressure'): EventCard {
  return {
    id,
    title: 'Test',
    category: 'operasyon',
    riskLevel: 'medium',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    description: 'd',
    contextTag: 't',
    urgencyHours: 8,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    eventType: 'social_media',
    contentCategory: category,
  };
}

function inputFor(
  day: number,
  priorityByDay: Record<number, DailyPriorityState>,
  hooks?: ButterflyHook[],
  focalNeighborhoodId?: string,
): CarryOverEvaluationInput {
  return {
    day,
    previousDay: day - 1,
    dailyPriorityByDay: priorityByDay,
    dailyGoalsByDay: {},
    butterflyHookState: hooks
      ? { hooks, lastProcessedDay: day }
      : createDefaultButterflyHookState(),
    focalNeighborhoodId,
  };
}

export function verifyCarryOverScenario(): {
  ok: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
} {
  const checks: Check[] = [];

  if (buildCarryOverSignalsForDay({ day: 1, previousDay: 0 }).length === 0) {
    record(checks, 'PASS', 'day1_none', 'Day 1 carry-over üretmiyor');
  } else {
    record(checks, 'FAIL', 'day1_none', 'Day 1 signal üretildi');
  }

  const day2Tutorial = buildCarryOverSignalsForDay(
    inputFor(2, { 1: priorityState(1, 'public_relief', 'fulfilled', 80) }),
  );
  if (day2Tutorial.length <= 1) {
    record(checks, 'PASS', 'day2_soft', 'Day 2 tutorial sonrası agresif değil');
  } else {
    record(checks, 'WARN', 'day2_soft', `Day 2 signal count ${day2Tutorial.length}`);
  }

  const fulfilledPublic = buildCarryOverFromDailyPriority(
    inputFor(3, { 2: priorityState(2, 'public_relief', 'fulfilled', 85) }),
  );
  if (fulfilledPublic?.tone === 'positive') {
    record(checks, 'PASS', 'public_fulfilled', 'fulfilled public_relief positive');
  } else {
    record(checks, 'FAIL', 'public_fulfilled', 'positive bekleniyordu');
  }

  const failedPublic = buildCarryOverFromDailyPriority(
    inputFor(4, { 3: priorityState(3, 'public_relief', 'failed', 25) }),
  );
  if (failedPublic?.tone === 'warning') {
    record(checks, 'PASS', 'public_failed', 'failed public_relief warning');
  } else {
    record(checks, 'FAIL', 'public_failed', 'warning bekleniyordu');
  }

  const fulfilledOp = buildCarryOverFromDailyPriority(
    inputFor(3, { 2: priorityState(2, 'operation_stability', 'fulfilled', 82) }),
  );
  if (fulfilledOp?.target === 'operation_risk' && fulfilledOp.tone === 'positive') {
    record(checks, 'PASS', 'op_fulfilled', 'operation fulfilled positive');
  } else {
    record(checks, 'FAIL', 'op_fulfilled', 'operation fulfilled bekleniyordu');
  }

  const failedOp = buildCarryOverFromDailyPriority(
    inputFor(4, { 3: priorityState(3, 'operation_stability', 'failed', 20) }),
  );
  if (failedOp?.tone === 'warning') {
    record(checks, 'PASS', 'op_failed', 'operation failed warning');
  } else {
    record(checks, 'FAIL', 'op_failed', 'operation failed bekleniyordu');
  }

  const fulfilledRes = buildCarryOverFromDailyPriority(
    inputFor(3, { 2: priorityState(2, 'resource_protection', 'fulfilled', 78) }),
  );
  if (fulfilledRes?.tone === 'positive') {
    record(checks, 'PASS', 'res_fulfilled', 'resource fulfilled positive');
  } else {
    record(checks, 'FAIL', 'res_fulfilled', 'resource fulfilled bekleniyordu');
  }

  const failedRes = buildCarryOverFromDailyPriority(
    inputFor(4, { 3: priorityState(3, 'resource_protection', 'failed', 22) }),
  );
  if (failedRes?.tone === 'warning') {
    record(checks, 'PASS', 'res_failed', 'resource failed warning');
  } else {
    record(checks, 'FAIL', 'res_failed', 'resource failed bekleniyordu');
  }

  const manySignals = buildCarryOverSignalsForDay(
    inputFor(5, {
      4: priorityState(4, 'public_relief', 'partial', 55),
      3: priorityState(3, 'operation_stability', 'failed', 30),
    }),
  );
  const limited = limitCarryOverSignals(manySignals);
  if (limited.length <= CARRY_OVER_MAX_SIGNALS_PER_DAY) {
    record(checks, 'PASS', 'max_signals', `max signal <= ${CARRY_OVER_MAX_SIGNALS_PER_DAY}`);
  } else {
    record(checks, 'FAIL', 'max_signals', `fazla signal ${limited.length}`);
  }

  const biasCount = limited.filter((s) => s.eventWeightHint).length;
  if (biasCount <= 1) {
    record(checks, 'PASS', 'max_bias', 'bias signal <= 1');
  } else {
    record(checks, 'FAIL', 'max_bias', `bias signal ${biasCount}`);
  }

  const posHint = fulfilledPublic?.eventWeightHint?.delta ?? 0;
  if (posHint >= CARRY_OVER_MAX_NEGATIVE_FRACTION) {
    record(checks, 'PASS', 'neg_bound', 'negative bias sınırı');
  } else {
    record(checks, 'FAIL', 'neg_bound', `neg delta ${posHint}`);
  }

  const failHint = failedPublic?.eventWeightHint?.delta ?? 0;
  if (failHint <= CARRY_OVER_MAX_POSITIVE_FRACTION) {
    record(checks, 'PASS', 'pos_bound', 'positive bias sınırı');
  } else {
    record(checks, 'FAIL', 'pos_bound', `pos delta ${failHint}`);
  }

  const clamped = clampCarryOverFraction(0.05);
  if (Math.abs(clamped) <= CARRY_OVER_TOTAL_BIAS_CLAMP) {
    record(checks, 'PASS', 'clamp', 'total clamp çalışıyor');
  } else {
    record(checks, 'FAIL', 'clamp', 'clamp başarısız');
  }

  const hook: ButterflyHook = {
    id: 'bh-1',
    source: 'decision',
    kind: 'follow_up_event',
    status: 'active',
    createdDay: 3,
    dueDay: 4,
    expiresDay: 6,
    severity: 'medium',
    title: 'Takip',
    description: 'd',
    triggerTag: 't',
    neighborhoodId: 'merkez',
    category: 'social_pressure',
    createdAt: 1,
  };
  const withHook = buildCarryOverFromDailyPriority(
    inputFor(4, { 3: priorityState(3, 'public_relief', 'failed', 20) }, [hook]),
  );
  if (!withHook?.eventWeightHint) {
    record(checks, 'PASS', 'butterfly_no_dup_bias', 'hook varken duplicate bias yok');
  } else {
    record(checks, 'FAIL', 'butterfly_no_dup_bias', 'bias uygulandı');
  }

  if (withHook?.kind === 'butterfly_overlap') {
    record(checks, 'PASS', 'butterfly_overlap_kind', 'overlap signal türü');
  } else {
    record(checks, 'FAIL', 'butterfly_overlap_kind', `kind=${withHook?.kind}`);
  }

  const expiredHook: ButterflyHook = {
    ...hook,
    id: 'bh-expired',
    status: 'expired',
    expiresDay: 3,
  };
  const withExpired = buildCarryOverFromDailyPriority(
    inputFor(4, { 3: priorityState(3, 'public_relief', 'failed', 20) }, [expiredHook]),
  );
  if (withExpired?.eventWeightHint) {
    record(checks, 'PASS', 'expired_no_overlap', 'expired hook overlap sayılmaz');
  } else {
    record(checks, 'FAIL', 'expired_no_overlap', 'expired ile bias bastırıldı');
  }

  const resolvedHook: ButterflyHook = {
    ...hook,
    id: 'bh-resolved',
    status: 'resolved',
  };
  if (
    !overlapsButterflyTarget(
      {
        neighborhoodId: 'merkez',
        categoryHint: 'social_pressure',
        target: 'social',
        dailyPriorityKey: 'public_relief',
      },
      resolvedHook,
    )
  ) {
    record(checks, 'PASS', 'resolved_no_overlap', 'resolved hook overlap değil');
  } else {
    record(checks, 'FAIL', 'resolved_no_overlap', 'resolved overlap sayıldı');
  }

  const socialFollowHook: ButterflyHook = {
    ...hook,
    id: 'bh-social-follow',
    triggerTag: 'social_follow',
    neighborhoodId: 'sanayi',
    category: 'waste_container',
    preferredPriorityKeys: ['public_relief'],
  };
  const prSocialOverlap = buildCarryOverFromDailyPriority(
    inputFor(
      4,
      { 3: priorityState(3, 'public_relief', 'failed', 20) },
      [socialFollowHook],
      'merkez',
    ),
  );
  if (prSocialOverlap?.kind === 'butterfly_overlap' && !prSocialOverlap.eventWeightHint) {
    record(
      checks,
      'PASS',
      'public_relief_social_overlap',
      'public_relief + social_follow eşleşmesi',
    );
  } else {
    record(checks, 'FAIL', 'public_relief_social_overlap', 'eşleşme başarısız');
  }

  const converted = convertCarryOverToButterflyOverlap(
    failedPublic ?? withHook!,
    hook,
  );
  if (!converted.eventWeightHint && converted.kind === 'butterfly_overlap') {
    record(checks, 'PASS', 'convert_no_hint', 'convert eventWeightHint silir');
  } else {
    record(checks, 'FAIL', 'convert_no_hint', 'hint kaldı');
  }

  const missingHookState = buildCarryOverSignalsForDay({
    day: 3,
    previousDay: 2,
    dailyPriorityByDay: { 2: priorityState(2, 'public_relief', 'fulfilled', 80) },
  });
  if (Array.isArray(missingHookState)) {
    record(checks, 'PASS', 'missing_hook_state', 'eksik hook state crash yok');
  } else {
    record(checks, 'FAIL', 'missing_hook_state', 'crash');
  }

  const hubOverlapDedup = buildCarryOverHubLines([
    {
      id: 'h1',
      sourceDay: 1,
      activeDay: 2,
      kind: 'priority_echo',
      tone: 'warning',
      strength: 'soft',
      title: 'Sosyal',
      text: 'Uzun metin',
      shortLabel: 'Sosyal baskı kaldı',
      target: 'social',
      createdAt: 1,
    },
    {
      id: 'h2',
      sourceDay: 1,
      activeDay: 2,
      kind: 'butterfly_overlap',
      tone: 'mixed',
      strength: 'soft',
      title: 'Yankı',
      text: 'Dünkü karar zaten takip sinyali olarak izleniyor.',
      shortLabel: 'Karar yankısı takipte',
      target: 'social',
      createdAt: 1,
    },
    {
      id: 'h3',
      sourceDay: 1,
      activeDay: 2,
      kind: 'butterfly_overlap',
      tone: 'mixed',
      strength: 'soft',
      title: 'Yankı 2',
      text: 'Tekrar',
      shortLabel: 'Karar yankısı takipte',
      target: 'general',
      createdAt: 1,
    },
  ]);
  const overlapLabelCount = hubOverlapDedup.filter(
    (l) => l.label === 'Karar yankısı takipte',
  ).length;
  if (hubOverlapDedup.length <= 2 && overlapLabelCount <= 1) {
    record(checks, 'PASS', 'hub_overlap_dedup', 'hub overlap tek satır');
  } else {
    record(checks, 'FAIL', 'hub_overlap_dedup', `lines=${hubOverlapDedup.length}`);
  }

  const reportHidden = buildCarryOverReportLines(
    withHook ? [withHook] : [],
    { hideOverlapWhenButterflyReport: true },
  );
  if (reportHidden.length === 0) {
    record(checks, 'PASS', 'report_hide_overlap', 'butterfly raporda overlap gizli');
  } else {
    record(checks, 'FAIL', 'report_hide_overlap', `lines=${reportHidden.length}`);
  }

  if (
    withHook &&
    findOverlappingButterflyHook(withHook, { hooks: [hook], lastProcessedDay: 4 }, 4)?.id ===
      hook.id
  ) {
    record(checks, 'PASS', 'find_overlap_hook', 'findOverlappingButterflyHook');
  } else {
    record(checks, 'FAIL', 'find_overlap_hook', 'hook bulunamadı');
  }

  const missingPriority = buildCarryOverSignalsForDay({
    day: 3,
    previousDay: 2,
  });
  if (Array.isArray(missingPriority)) {
    record(checks, 'PASS', 'missing_priority', 'missing dailyPriority crash yok');
  }

  const hubLines = buildCarryOverHubLines(
    Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      sourceDay: 1,
      activeDay: 2,
      kind: 'goal_echo' as const,
      tone: 'neutral' as const,
      strength: 'soft' as const,
      title: 't',
      text: `line ${i}`,
      shortLabel: `L${i}`,
      target: 'general' as const,
      createdAt: 1,
    })),
  );
  if (hubLines.length <= 2) {
    record(checks, 'PASS', 'hub_cap', 'hub max 2');
  } else {
    record(checks, 'FAIL', 'hub_cap', `hub ${hubLines.length}`);
  }

  const reportLines = buildCarryOverReportLines(
    fulfilledPublic ? [fulfilledPublic] : [],
  );
  if (reportLines.length <= 2) {
    record(checks, 'PASS', 'report_cap', 'report max 2');
  } else {
    record(checks, 'FAIL', 'report_cap', `report ${reportLines.length}`);
  }

  const delta = getCarryOverWeightDeltaForEvent(
    mockEvent('e1', 'social_pressure'),
    fulfilledPublic ? [fulfilledPublic] : [],
  );
  if (Math.abs(delta) <= 3) {
    record(checks, 'PASS', 'weight_scale', `weight delta ${delta}`);
  } else {
    record(checks, 'FAIL', 'weight_scale', `delta çok büyük ${delta}`);
  }

  const seed = createDay1Seed();
  const sliceInput = buildCarryOverEvaluationInput({
    gameState: { ...seed.gameState, city: { ...seed.gameState.city, day: 4 } },
    dailyPriorityByDay: { 3: priorityState(3, 'operation_stability', 'fulfilled', 80) },
    dailyGoalsByDay: {},
    lastDailyReport: null,
  });
  if (sliceInput.day === 4) {
    record(checks, 'PASS', 'selector', 'selector input güvenli');
  }

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;

  return {
    ok: failCount === 0,
    failCount,
    warnCount,
    checks: checks.map((c) => `[${c.severity}] ${c.name}: ${c.detail}`),
  };
}
