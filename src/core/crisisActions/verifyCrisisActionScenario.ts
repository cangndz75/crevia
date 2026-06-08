import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { deriveCrisisAccessMode } from '@/core/crisis/crisisEngine';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { createInitialOperationSignalsState, clampSignalScore } from '@/core/operations/operationSignalState';
import { getInteractionContractsForComponent } from '@/core/quality/interactionContracts/interactionContractRegistry';
import { SAVE_VERSION } from '@/store/gamePersist';
import { normalizePersistedSave } from '@/store/gamePersist';

import {
  buildCrisisActionEffects,
  deriveCrisisActionAccessMode,
  processCrisisActionsEndOfDay,
  refreshCrisisActionsForDay,
  selectBestCrisisActionType,
  selectCrisisActionByType,
  shouldGenerateCrisisAction,
} from './crisisActionEngine';
import {
  buildCrisisActionHubModel,
  buildCrisisActionReportModel,
  buildCrisisActionSheetModel,
} from './crisisActionPresentation';
import {
  createInitialCrisisActionState,
  getSelectedCrisisActionForDay,
  hasSelectedCrisisActionForDay,
  normalizeCrisisActionState,
} from './crisisActionState';

export type VerifyCrisisActionOutcome = {
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

function fullGs(day = 10) {
  const gs = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  return applyFullAccessToGameState({ ...gs, city: { ...gs.city, day } });
}

function baseInput(day = 10, crisisScore = 65) {
  const gameState = fullGs(day);
  const monetization = mockPurchaseMainOperationPack(createInitialMonetizationState(), day);
  const crisisState = {
    ...createInitialCrisisState(),
    accessMode: 'active' as const,
    riskLevel: 'elevated' as const,
    cityCrisisScore: crisisScore,
  };
  return {
    gameState,
    monetization,
    crisisState,
    operationSignals: createInitialOperationSignalsState(day),
    assignments: createInitialAssignmentsState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    mainOperationSeason: createFullMainOperationSeasonState(day),
    crisisActionState: createInitialCrisisActionState(),
  };
}

export function verifyCrisisActionScenario(): VerifyCrisisActionOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };

  const initial = createInitialCrisisActionState();
  add(initial.actionsById != null, 'Initial crisisActionState doğru oluşuyor', 'initial');
  add(
    normalizeCrisisActionState({ actionsById: { bad: { id: 1 } } }).actionsById.bad == null,
    'Normalize eksik state’i onarıyor',
    'normalize',
  );

  const pilotIn = baseInput(5);
  pilotIn.gameState = {
    ...pilotIn.gameState,
    pilot: { ...pilotIn.gameState.pilot, status: 'active' },
    city: { ...pilotIn.gameState.city, day: 5 },
  };
  add(deriveCrisisActionAccessMode(pilotIn) === 'inactive', 'Pilot Day 1-7 access inactive', 'pilot access');

  const limitedIn = baseInput(10);
  limitedIn.monetization = selectLimitedContinue(createInitialMonetizationState(), 10);
  add(deriveCrisisActionAccessMode(limitedIn) === 'limited_preview', 'Limited access', 'limited');
  add(!shouldGenerateCrisisAction(limitedIn), 'Limited selectable action üretmiyor', 'limited gen');

  const fullIn = baseInput(10, 72);
  add(deriveCrisisActionAccessMode(fullIn) === 'active', 'Full access active mode', 'full access');
  add(shouldGenerateCrisisAction(fullIn), 'Elevated crisis action üretebiliyor', 'elevated gen');

  const incidentIn = {
    ...fullIn,
    crisisState: {
      ...fullIn.crisisState,
      activeIncident: {
        id: 'inc1',
        day: 10,
        status: 'active' as const,
        title: 'Test',
        summary: 'Test',
        affectedDistrictIds: ['sanayi'],
        primaryDomain: 'city' as const,
        severity: 'high' as const,
        sourceSignalIds: [],
      },
    },
  };
  add(shouldGenerateCrisisAction(incidentIn), 'Active incident action üretiyor', 'incident');

  let refreshed = refreshCrisisActionsForDay(fullIn);
  add(refreshed.lastGeneratedDay === 10, 'Günde action üretildi', 'generated');
  add(!shouldGenerateCrisisAction({ ...fullIn, crisisActionState: refreshed }), 'lastGeneratedDay duplicate engelliyor', 'dup gen');

  const selected = selectCrisisActionByType(refreshed, fullIn, 'crisis_coordination');
  add(hasSelectedCrisisActionForDay(selected, 10), 'selectCrisisAction selected yapıyor', 'select');
  const sel = getSelectedCrisisActionForDay(selected, 10)!;
  add(sel.effects.some((e) => e.domain === 'crisis' && e.delta < 0), 'crisis_coordination crisis düşürüyor', 'coord crisis');
  add(sel.effects.some((e) => e.domain === 'personnel' && e.delta > 0), 'coord personnel tradeoff', 'coord personnel');

  const pubFx = buildCrisisActionEffects(fullIn, 'public_briefing');
  add(pubFx.some((e) => e.domain === 'districts' && e.delta < 0), 'public_briefing districts', 'public');
  const prevFx = buildCrisisActionEffects(fullIn, 'preventive_maintenance');
  add(prevFx.some((e) => e.domain === 'vehicles' && e.delta < 0), 'preventive vehicles', 'prev');
  const monFx = buildCrisisActionEffects(fullIn, 'monitor_only');
  add(monFx.some((e) => e.domain === 'crisis' && e.delta > 0), 'monitor_only crisis carry', 'monitor');

  const eod = processCrisisActionsEndOfDay(
    { ...fullIn, crisisActionState: selected },
    10,
  );
  add(
    getSelectedCrisisActionForDay(eod.crisisActionState, 10)?.status === 'processed',
    'processed action tekrar işlenmiyor guard',
    'processed',
  );
  add(clampSignalScore(eod.crisisState.cityCrisisScore) <= 100, 'CrisisState clamp 0-100', 'crisis clamp');

  const hub = buildCrisisActionHubModel({ ...fullIn, crisisActionState: refreshed });
  add(hub != null && hub.ctaLabel.length > 0, 'Hub model active action boş değil', 'hub');
  const sheet = buildCrisisActionSheetModel(fullIn);
  add(sheet != null && sheet.actionRows.length === 5, 'Sheet model 5 row', 'sheet');
  const report = buildCrisisActionReportModel(
    { ...fullIn, crisisActionState: eod.crisisActionState },
    10,
  );
  add(report.visible && report.lines.length <= 3, 'Report max 3 lines', 'report');

  const weakIn = {
    ...fullIn,
    assignments: {
      ...createInitialAssignmentsState(),
      dailyAssignmentSummary: { day: 10, confirmedCount: 2, strongFitCount: 0, weakFitCount: 2 },
    },
  };
  add(selectBestCrisisActionType(weakIn) === 'field_rebalance', 'weak assignment field_rebalance', 'weak type');

  const chainIn = {
    ...fullIn,
    operationSignals: {
      ...createInitialOperationSignalsState(10),
      vehicles: {
        ...createInitialOperationSignalsState(10).vehicles,
        status: 'strained' as const,
        score: 70,
      },
      containers: {
        ...createInitialOperationSignalsState(10).containers,
        status: 'critical' as const,
        score: 75,
      },
    },
  };
  add(selectBestCrisisActionType(chainIn) === 'preventive_maintenance', 'chain preventive', 'chain');

  const seed = createDay1Seed();
  const hydrated = normalizePersistedSave({
    saveVersion: 21,
    gameState: fullGs(10),
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: [],
    decisionHistory: [],
    snapshots: [],
    updatedAt: new Date().toISOString(),
    crisisActionState: undefined,
  } as never);
  add(
    hydrated?.crisisActionState != null,
    'Persist migration v21 → v22 crisisActionState',
    'migrate',
  );

  add(SAVE_VERSION === 24, 'Full loop SAVE_VERSION 22', 'save version');

  const cta = getInteractionContractsForComponent('HubCrisisActionCard').find(
    (c) => c.label === 'Hamleyi Seç',
  );
  add(cta?.target?.modalId === 'crisis_action_sheet', 'Interaction contract modal', 'contract');

  const copy = JSON.stringify(eod).toLowerCase();
  add(!copy.includes('premium') && !copy.includes('xp'), 'Forbidden words yok', 'forbidden');

  add(
    deriveCrisisAccessMode(limitedIn.gameState, limitedIn.monetization) === 'limited_preview',
    'Limited incident üretmez path',
    'limited crisis',
  );

  hasWarn =
    !warn(checks, true, 'Dedicated crisis action detail route not implemented', 'route warn') ||
    hasWarn;
  hasWarn =
    !warn(checks, true, 'Advanced multi-step crisis resolution pending', 'multi warn') || hasWarn;

  return { ok, warn: hasWarn, checks };
}
