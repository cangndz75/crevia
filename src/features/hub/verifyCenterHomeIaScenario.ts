import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import type { DecisionRecord } from '@/core/models/DecisionRecord';

import {
  CENTER_HOME_MODULE_ORDER,
  buildCenterHomePresentation,
  centerHomeAdvisorAndPlanShareText,
  centerHomeHasDuplicateModuleKeys,
} from './utils/centerHomePresentation';
import { centerHomeHasDuplicateVisibleActions } from './utils/centerActionDedupe';
import { centerUnlockConditionIsClear } from './utils/centerHubDepthPresentation';
import { buildCenterHubGameplayPresentation } from './utils/centerHubGameplayPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterHomeIaScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1State = createDay1Seed().gameState;
  const day1 = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    day1.moduleOrder.join('|') === CENTER_HOME_MODULE_ORDER.join('|'),
    'module order matches final IA',
  );
  assert(
    checks,
    !centerHomeHasDuplicateModuleKeys(day1),
    'no duplicate module keys',
  );
  assert(
    checks,
    day1.visibilityFlags.operationFocus === 'visible',
    'Day 1 operation focus visible',
  );
  assert(
    checks,
    day1.visibilityFlags.quickActions === 'locked',
    'Day 1 quick actions locked',
  );
  assert(
    checks,
    day1.activeTarget.visibility === 'visible',
    'Day 1 active target visible',
  );
  assert(
    checks,
    day1.quickActions.items.length <= 4,
    'quick actions capped at safe count',
    `count=${day1.quickActions.items.length}`,
  );
  assert(
    checks,
    !centerHomeAdvisorAndPlanShareText(day1),
    'Day 1 Ece and plan do not duplicate text',
  );

  const day1NoSignals = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
    hubTomorrowRisk: undefined,
    hubImpactExplanationLine: undefined,
  });

  assert(
    checks,
    day1NoSignals.operationSignals.visibility === 'empty' ||
      day1NoSignals.operationSignals.signals.length <= 2,
    'empty or compact operation signals on Day 1 without risk lines',
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3 = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'generic_city_preparation',
      title: 'Yükselen Talep',
      mainLine: 'Mahallede hizmet talebi artıyor.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
    hubCityJournal: {
      title: 'Bugünkü Plan',
      primaryLine: 'Gün planı operasyon merkezinde.',
      secondaryLine: null,
      visible: true,
    },
  });

  assert(
    checks,
    day3.visibilityFlags.operationFocus === 'visible',
    'Day 3 operation focus visible',
  );
  assert(
    checks,
    day3.operationSignals.signals.length <= 3,
    'operation signals max 3',
    `count=${day3.operationSignals.signals.length}`,
  );
  assert(
    checks,
    !centerHomeAdvisorAndPlanShareText(day3),
    'Day 3 Ece and recommended plan differ',
  );

  const topSignalTitle = day3.operationSignals.signals[0]?.title;
  assert(
    checks,
    !topSignalTitle || day3.strategicPulse.compact.liveSignalLabel === topSignalTitle,
    'strategic pulse compact binds live signal',
    day3.strategicPulse.compact.liveSignalLabel,
  );
  assert(
    checks,
    day3.continuationCards.cards.length === 0 ||
      (day3.neighborhoodEvents.events.some((event) => event.id.startsWith('continuation-')) &&
        day3.neighborhoodEvents.events.every((event) => !event.isFallback)),
    'neighborhood events avoid static fallback when continuation data exists',
    `events=${day3.neighborhoodEvents.events.map((event) => event.id).join(',')}`,
  );
  assert(
    checks,
    day3.quickActions.items.filter((item) => item.enabled && item.route).length === 0 ||
      day3.quickCommands.commands.every(
        (tile) =>
          tile.title !== 'Asker Çağır' &&
          tile.title !== 'Bina İnşa Et' &&
          tile.title !== 'Diplomasi',
      ),
    'quick commands avoid old static command titles',
    `tiles=${day3.quickCommands.commands.map((tile) => tile.title).join(',')}`,
  );
  assert(
    checks,
    !JSON.stringify(day3).includes('Dönem Yolu'),
    'center home does not render Donem Yolu copy',
  );
  assert(
    checks,
    day3.nextActions.visibility === 'visible',
    'next actions visible on Day 3',
  );
  assert(
    checks,
    !centerHomeHasDuplicateVisibleActions({
      nextActions: day3.nextActions.actions,
      quickCommands: day3.quickCommands.commands,
    }),
    'next actions and quick commands dedupe visible actions',
  );
  assert(
    checks,
    day3.quickCommands.layout !== 'hidden' || day3.quickCommands.commands.length === 0,
    'quick commands hidden when empty',
  );
  assert(
    checks,
    day3.quickCommands.commands.filter((item) => item.disabled).length <= 1,
    'at most one locked teaser in quick commands',
  );
  const lockedIndex = day3.quickCommands.commands.findIndex((item) => item.disabled);
  assert(
    checks,
    lockedIndex === -1 || lockedIndex === day3.quickCommands.commands.length - 1,
    'locked teaser only in last slot',
  );
  assert(
    checks,
    day3.districtFocus.visibility === 'visible' && day3.districtFocus.districtName.length > 0,
    'district focus visible on Day 3',
    day3.districtFocus.districtName,
  );
  const completedDay3Base = {
    ...day3,
    activeTarget: {
      ...day3.activeTarget,
      status: 'completed' as const,
      visibility: 'completed' as const,
      cta: {
        ...day3.activeTarget.cta,
        label: 'Sonucu Gör',
        actionKey: 'view_result' as const,
        route: '/reports',
        enabled: true,
      },
    },
  };
  const recentDecision: DecisionRecord = {
    id: 'decision-recent-impact-smoke',
    day: 3,
    eventId: 'event-solar-plant',
    eventTitle: 'Güneş Enerjisi Santrali Devrede',
    decisionId: 'activate_solar_support',
    decisionLabel: 'Enerji ekibini sahaya yönlendir',
    neighborhoodId: 'yenisehir',
    neighborhoodName: 'Yenişehir',
    appliedEffects: {
      publicSatisfaction: 7,
      budget: -1200,
      staffMorale: 2,
      risk: -3,
    },
    appliedCosts: {
      budget: 1200,
      staffHours: 4,
    },
    createdAt: new Date().toISOString(),
  };
  const completedHubGameplay = buildCenterHubGameplayPresentation(
    completedDay3Base,
    recentDecision,
  );
  const completedNextTitles = completedHubGameplay.nextActions.actions.map((action) => action.title);
  assert(
    checks,
    completedHubGameplay.recentImpactSummary.visibility === 'visible' &&
      completedHubGameplay.recentImpactSummary.eventId === recentDecision.eventId &&
      completedHubGameplay.recentImpactSummary.districtName === recentDecision.neighborhoodName &&
      completedHubGameplay.recentImpactSummary.chips.length > 0 &&
      completedHubGameplay.recentImpactSummary.chips.length <= 3,
    'recent impact binds latest decision reaction',
    `title=${completedHubGameplay.recentImpactSummary.targetTitle}; chips=${completedHubGameplay.recentImpactSummary.chips.length}`,
  );
  assert(
    checks,
    completedHubGameplay.recentImpactSummary.statusLabel !== undefined &&
      completedHubGameplay.recentImpactSummary.statusLabel.length > 0 &&
      completedHubGameplay.recentImpactSummary.targetTitle !== completedDay3Base.activeTarget.title,
    'recent impact is compact result memory, not active hero copy',
    completedHubGameplay.recentImpactSummary.statusLabel,
  );
  const recentImpactAction = completedHubGameplay.recentImpactSummary.secondaryAction;
  assert(
    checks,
    !recentImpactAction ||
      completedHubGameplay.nextActions.actions.every(
        (action) =>
          action.routeKey !== recentImpactAction.route &&
          action.actionKey !== recentImpactAction.actionKey,
      ),
    'recent impact secondary CTA avoids next-action duplication',
    recentImpactAction?.route ?? 'no-action',
  );
  assert(
    checks,
    completedHubGameplay.nextTargetHero.visibility === 'visible' &&
      completedHubGameplay.nextTargetHero.title === completedNextTitles[0] &&
      completedHubGameplay.nextTargetHero.title !== completedDay3Base.activeTarget.title,
    'completed target promotes next-target hero',
    completedHubGameplay.nextTargetHero.title,
  );
  assert(
    checks,
    completedNextTitles[0] === 'Sıradaki Hedefe Geç',
    'completed next actions prioritize next target',
    completedNextTitles.join(','),
  );
  assert(
    checks,
    completedNextTitles.every(
      (title) => title !== 'Raporu Tamamla' && title !== 'İlk olayı çöz',
    ),
    'completed next actions suppress conflicting actions',
    completedNextTitles.join(','),
  );
  assert(
    checks,
    !day3.unlockPreviewMini.visibility ||
      centerUnlockConditionIsClear(day3.unlockPreviewMini.unlockCondition),
    'unlock preview has clear condition',
    day3.unlockPreviewMini.unlockCondition,
  );

  const claimedReward = buildCenterHomePresentation({
    gameState: {
      ...day3State,
      player: { ...day3State.player, streakDays: 3 },
    },
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  assert(
    checks,
    claimedReward.dailyReward.claimState === 'claimed' ||
      claimedReward.dailyReward.days.some((day) => day.state === 'done'),
    'daily reward distinguishes claimed/done states',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
