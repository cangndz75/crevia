import { buildActiveTaskRouteUiModel } from '@/core/activeTaskRoutes';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { CarryOverMemoryModel } from '@/core/carryOver';
import { buildDistrictMemoryRuntimeSnapshot } from '@/core/districtMemoryRuntime';
import { buildDistrictOperationsRuntimeSnapshot } from '@/core/districtOperationsRuntime';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildHubOpenEndedIntegrationModel,
  containsForbiddenHubOpenEndedCopy,
  validateHubOpenEndedIntegrationModel,
} from './hubOpenEndedIntegrationPresentation';

type Check = { name: string; ok: boolean; detail: string };

export type VerifyHubOpenEndedIntegrationOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

function record(checks: Check[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

function hasForbidden(lines: string[]): boolean {
  return lines.some((line) => containsForbiddenHubOpenEndedCopy(line));
}

function visibleTexts(model: ReturnType<typeof buildHubOpenEndedIntegrationModel>): string[] {
  return [
    ...model.focusLines.map((line) => line.text),
    model.nextUnlockSummary.text ?? '',
  ].filter(Boolean);
}

function carryOver(day: number): CarryOverMemoryModel {
  return {
    id: `verify-carry-${day}`,
    surface: 'hub',
    direction: 'yesterday_to_today',
    domain: 'vehicle_route',
    tone: 'warning',
    title: 'Dünden Kalan Etki',
    summary: 'Dünkü rota bugün araç temposunda kısa bir takip izi bırakıyor.',
    primaryTag: 'Araç',
    secondaryTag: 'Rota',
    iconKey: 'car-outline',
    source: 'daily_report',
    visible: true,
    maxLines: 2,
  };
}

export function verifyHubOpenEndedIntegrationScenario(): VerifyHubOpenEndedIntegrationOutcome {
  const checks: Check[] = [];

  let missingStateSafe = false;
  try {
    missingStateSafe = !!buildHubOpenEndedIntegrationModel({});
  } catch {
    missingStateSafe = false;
  }
  record(checks, 'Eksik state crash üretmez', missingStateSafe, 'buildHubOpenEndedIntegrationModel({})');

  const day1 = buildHubOpenEndedIntegrationModel({ day: 1 });
  record(checks, 'Day 1 complex card gizli', !day1.visible && day1.focusLines.length === 0, day1.visibility.mode);

  const day2 = buildHubOpenEndedIntegrationModel({
    day: 2,
    operationSignals: createInitialOperationSignalsState(2),
  });
  record(checks, 'Day 2-3 max 2 focus line', day2.focusLines.length <= 2, String(day2.focusLines.length));

  const day5Trust = buildDistrictTrustRuntimeSnapshot({ day: 5, focusDistrictId: 'cumhuriyet' });
  const day5Memory = buildDistrictMemoryRuntimeSnapshot({
    day: 5,
    focusDistrictId: 'cumhuriyet',
    trustSnapshot: day5Trust,
  });
  const day5 = buildHubOpenEndedIntegrationModel({
    day: 5,
    operationSignals: createInitialOperationSignalsState(5),
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
  });
  record(
    checks,
    'Day 4-7 district runtime üretebilir',
    day5.focusLines.some((line) => line.kind === 'district_trust' || line.kind === 'district_memory') ||
      day5.visibility.showDistrictRuntime,
    day5.debugRows.join(' | '),
  );

  const day8Ops = buildDistrictOperationsRuntimeSnapshot({ day: 8, focusDistrictId: 'merkez' });
  const day8 = buildHubOpenEndedIntegrationModel({
    day: 8,
    operationSignals: createInitialOperationSignalsState(8),
    districtOperationsSnapshot: day8Ops,
  });
  record(
    checks,
    'Day 8+ open-ended operation focus üretir',
    day8.focusLines.some((line) => line.kind === 'daily_focus' || line.kind === 'district_operation'),
    day8.debugRows.join(' | '),
  );

  const highRankAuthority = { ...createInitialAuthorityState(8), authorityTrust: 460 };
  const highRank = buildHubOpenEndedIntegrationModel({
    day: 10,
    authorityState: highRankAuthority,
    xp: 2000,
    operationSignals: createInitialOperationSignalsState(10),
  });
  record(
    checks,
    'High rank next unlock detailed döner',
    highRank.nextUnlockSummary.visible && highRank.nextUnlockSummary.isDetailed,
    highRank.nextUnlockSummary.text ?? 'none',
  );

  const crisisSignals = createInitialOperationSignalsState(8);
  crisisSignals.overall = { ...crisisSignals.overall, status: 'critical' };
  const crisis = buildHubOpenEndedIntegrationModel({
    day: 8,
    operationSignals: crisisSignals,
    crisisState: { status: 'active' },
  });
  record(
    checks,
    'Crisis context panic wording üretmez',
    !hasForbidden(visibleTexts(crisis)),
    visibleTexts(crisis).join(' | '),
  );

  record(
    checks,
    'District operation CTA gibi görünmez',
    !day8.focusLines.some(
      (line) => line.kind === 'district_operation' && containsForbiddenHubOpenEndedCopy(line.text),
    ),
    visibleTexts(day8).join(' | '),
  );

  const carrySuppressed = buildHubOpenEndedIntegrationModel({
    day: 6,
    operationSignals: createInitialOperationSignalsState(6),
    carryOverMemory: carryOver(6),
    isCarryOverCardVisible: true,
  });
  record(
    checks,
    'Carry-over card görünürken duplicate line bastırılır',
    carrySuppressed.carryOverSuppressed &&
      !carrySuppressed.focusLines.some((line) => line.kind === 'carry_over'),
    carrySuppressed.debugRows.join(' | '),
  );

  const seed = createDay1Seed();
  const route = buildActiveTaskRouteUiModel({
    day: 5,
    activeEvent: seed.gameState.events[0],
    operationSignals: createInitialOperationSignalsState(5),
    eventPhase: 'dispatch',
  });
  const withRoute = buildHubOpenEndedIntegrationModel({
    day: 5,
    operationSignals: createInitialOperationSignalsState(5),
    activeTaskRouteUiModel: route,
  });
  record(
    checks,
    'Active route GPS/pathfinding iddiası üretmez',
    !visibleTexts(withRoute).join(' ').toLocaleLowerCase('tr-TR').includes('gps') &&
      !visibleTexts(withRoute).join(' ').toLocaleLowerCase('tr-TR').includes('pathfinding'),
    visibleTexts(withRoute).join(' | '),
  );

  record(
    checks,
    'Next unlock monetization/paywall dili üretmez',
    !hasForbidden([highRank.nextUnlockSummary.text ?? '']),
    highRank.nextUnlockSummary.text ?? 'none',
  );

  record(checks, 'Max 3 visible line korunur', day8.focusLines.length <= 3, String(day8.focusLines.length));
  record(
    checks,
    'Copy max length guard çalışır',
    [...day8.focusLines, ...highRank.focusLines].every((line) => line.text.length <= 97),
    [...day8.focusLines, ...highRank.focusLines].map((line) => String(line.text.length)).join(','),
  );
  record(
    checks,
    'Forbidden copy guard çalışır',
    containsForbiddenHubOpenEndedCopy(['pre', 'mium satın', ' al'].join('')) &&
      !validateHubOpenEndedIntegrationModel({
        ...crisis,
        focusLines: [
          {
            ...crisis.focusLines[0]!,
            text: ['pre', 'mium satın', ' al'].join(''),
          },
        ],
      }),
    'guard direct + invalid model',
  );
  record(
    checks,
    'Model validation normal senaryoda geçer',
    validateHubOpenEndedIntegrationModel(day8) && validateHubOpenEndedIntegrationModel(highRank),
    'day8 + highRank',
  );
  record(checks, 'SAVE_VERSION değişmedi', isCurrentSaveVersion(SAVE_VERSION), String(SAVE_VERSION));

  const rendered = checks.map((check) =>
    `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`,
  );
  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: rendered,
  };
}
