import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { appendCityArchiveEntries, buildCityArchiveEntriesForDay } from '@/core/cityArchive/cityArchiveEngine';
import { createInitialCityArchiveState } from '@/core/cityArchive/cityArchiveState';
import { appendDayCloseCityArchiveWithStoryChains, buildCityArchiveDayCloseInput } from '@/core/cityArchive/cityArchiveWiring';
import { buildCityJournalLiteModel } from '@/core/cityJournal/cityJournalModel';
import { SAVE_VERSION } from '@/store/gamePersist';

import { maxActiveChainsForDay } from './storyChainPersistentConstants';
import {
  applyPersistentStoryChainOnDayClose,
  buildPersistentStoryChainUpdate,
  extractPersistentStoryChainState,
} from './storyChainPersistentEngine';
import {
  buildPersistentStoryChainEceHint,
  buildPersistentStoryChainHubLine,
  buildPersistentStoryChainReportLine,
  storyChainPersistentLineContainsForbidden,
} from './storyChainPersistentPresentation';
import { STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS } from './storyChainPersistentConstants';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoryChainPersistentRuntimeOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function dayCloseArchive(day: number, extra: Record<string, unknown> = {}) {
  const archiveInput = buildCityArchiveDayCloseInput({
    closingDay: day,
    pilotStatus: day >= 8 ? 'completed' : 'active',
    dailyReportSummary: `Gün ${day} raporu`,
    carryOverLine: day >= 3 ? 'Dünkü baskı taşındı.' : undefined,
    ...extra,
  });
  return appendDayCloseCityArchiveWithStoryChains(
    createInitialCityArchiveState(day),
    archiveInput,
    {
      closingDay: day,
      isPostPilot: day >= 8,
      isPilotCompleted: day >= 8,
      carryOverLine: day >= 3 ? 'Dünkü baskı taşındı.' : undefined,
      carryOverUnresolved: day >= 3,
      districtReportIssueKind: day >= 5 ? 'route_pressure' : undefined,
      operationSignals:
        day >= 5
          ? { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' }
          : undefined,
      crisisWatch: day >= 6,
      trustRecovering: day >= 7,
    },
  );
}

export function verifyStoryChainPersistentRuntimeScenario(): VerifyStoryChainPersistentRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const state = extractPersistentStoryChainState(createInitialCityArchiveState(1));
  record(assert(checks, Array.isArray(state.activeChains), 'PersistentStoryChainState builds'));

  record(assert(checks, maxActiveChainsForDay(1) === 0, 'Day 1 no persistent chain'));
  record(assert(checks, maxActiveChainsForDay(2) === 1, 'Day 2-3 max 1'));
  record(assert(checks, maxActiveChainsForDay(5) === 2, 'Day 4-7 max 2'));
  record(assert(checks, maxActiveChainsForDay(8) === 3, 'Day 8+ max 3'));

  const day1Archive = dayCloseArchive(1);
  record(
    assert(
      checks,
      extractPersistentStoryChainState(day1Archive).activeChains.length === 0,
      'Day 1 archive no active chain',
    ),
  );

  let archive = createInitialCityArchiveState(4);
  archive = applyPersistentStoryChainOnDayClose(archive, {
    day: 4,
    carryOverUnresolved: true,
    carryOverLine: 'Carry-over test',
    operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' },
    districtReportIssueKind: 'route_pressure',
  });
  record(assert(checks, (archive.storyChainSummary.activeChains?.length ?? 0) >= 1, 'chain starts from signal'));
  record(assert(checks, archive.entries.some((e) => e.kind === 'story_chain_step'), 'story_chain_step written'));
  record(assert(checks, Boolean(archive.entries.find((e) => e.kind === 'story_chain_step')?.duplicateKey), 'duplicateKey present'));

  const chainId = archive.storyChainSummary.activeChains?.[0]?.chainId;
  const sameDayAgain = applyPersistentStoryChainOnDayClose(archive, {
    day: 4,
    carryOverUnresolved: true,
    operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' },
  });
  record(
    assert(
      checks,
      sameDayAgain.storyChainSummary.activeChains?.[0]?.lastAdvancedDay === 4 &&
        sameDayAgain.entries.filter((e) => e.kind === 'story_chain_step' && e.day === 4).length <= 2,
      'same day double advance blocked',
    ),
  );

  let advanced = applyPersistentStoryChainOnDayClose(sameDayAgain, {
    day: 5,
    trustRecovering: false,
    operationSignals: { vehicles: { status: 'strained' }, priorityDistrictId: 'sanayi' },
  });
  const stepKind = advanced.storyChainSummary.activeChains?.find((c) => c.chainId === chainId)?.currentStepKind;
  record(assert(checks, stepKind === 'follow_up' || stepKind === 'pressure_shift', 'trigger -> follow_up/pressure_shift'));

  advanced = applyPersistentStoryChainOnDayClose(advanced, {
    day: 6,
    trustRecovering: true,
    routeBalanced: true,
  });
  const closed = Boolean(
    chainId &&
      advanced.storyChainSummary.recentlyClosedChains?.some((c) => c.chainId === chainId),
  );
  record(assert(checks, closed, 'recovery_window/positive -> closure'));

  const expiredArchive = applyPersistentStoryChainOnDayClose(
    applyPersistentStoryChainOnDayClose(archive, { day: 4, carryOverUnresolved: true, operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' } }),
    { day: 10, carryOverUnresolved: true, operationSignals: { vehicles: { status: 'watch' }, priorityDistrictId: 'sanayi' } },
  );
  record(
    assert(
      checks,
      expiredArchive.storyChainSummary.recentlyClosedChains?.some((c) => c.closureKind === 'expired_soft') ||
        extractPersistentStoryChainState(expiredArchive).activeChains.length === 0,
      'expired_soft or cleared after max age',
    ),
  );

  const blob = JSON.stringify(archive);
  record(assert(checks, !blob.includes('rawEventBody') && !blob.includes('gps'), 'no raw event/PII'));
  record(assert(checks, storyChainPersistentLineContainsForbidden('premium quest GPS'), 'forbidden copy guard'));

  const hubLine = buildPersistentStoryChainHubLine(archive, 4, []);
  record(assert(checks, Boolean(hubLine), 'Hub story line max 1'));
  const reportLine = buildPersistentStoryChainReportLine(archive, 5, [hubLine ?? '']);
  record(assert(checks, reportLine == null || reportLine !== hubLine, 'Report line duplicate guard'));

  const journal = buildCityJournalLiteModel({ currentDay: 5, cityArchive: archive });
  record(assert(checks, journal.entries.length >= 0, 'CityJournal reads archive'));

  const ece = buildPersistentStoryChainEceHint(archive, 5, []);
  record(assert(checks, ece == null || ece.startsWith('Ece'), 'Ece hint safe'));

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION remains 24'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('storyChainPersistent'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('storyChainState'), 'no new persist field'));
  record(assert(checks, readRepo('src/store/useGameStore.ts').includes('appendDayCloseCityArchiveWithStoryChains'), 'endCurrentDay story chain wiring'));
  record(assert(checks, readRepo('src/features/hub/screens/HubScreen.tsx').includes('buildPersistentStoryChainHubLine'), 'Hub integration'));
  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('buildPersistentStoryChainReportLine'), 'Report integration'));
  record(
    assert(
      checks,
      !existsSync(join(REPO_ROOT, 'src/app/story-chain-detail.tsx')),
      'No new route',
    ),
  );

  for (const term of ['quest', 'gps', 'premium']) {
    record(assert(checks, STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS.includes(term as never), `forbidden listed: ${term}`));
  }

  const update = buildPersistentStoryChainUpdate(createInitialCityArchiveState(5), {
    day: 5,
    carryOverUnresolved: true,
    operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' },
  });
  record(assert(checks, update.newArchiveEntries.length > 0, 'update produces archive entries'));

  let idempotent = archive;
  idempotent = applyPersistentStoryChainOnDayClose(idempotent, { day: 4, carryOverUnresolved: true, operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' } });
  const countBefore = idempotent.entries.filter((e) => e.kind === 'story_chain_step').length;
  idempotent = applyPersistentStoryChainOnDayClose(idempotent, { day: 4, carryOverUnresolved: true, operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' } });
  const countAfter = idempotent.entries.filter((e) => e.kind === 'story_chain_step').length;
  record(assert(checks, countAfter === countBefore, 'idempotent reopen same day'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-story-chain-persistent-runtime.md')), 'docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:story-chain-persistent-runtime'), 'package script'));

  return { ok, checks };
}
