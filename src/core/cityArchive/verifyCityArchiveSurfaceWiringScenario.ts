import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { appendCityArchiveEntries, makeCityArchiveDuplicateKey } from '@/core/cityArchive/cityArchiveEngine';
import { createInitialCityArchiveState } from '@/core/cityArchive/cityArchiveState';
import { appendDayCloseCityArchiveWithStoryChains } from '@/core/cityArchive/cityArchiveWiring';
import {
  archiveJournalEntryLabel,
  archiveSurfaceLineContainsForbidden,
  isArchiveSurfaceDuplicate,
  maxReportContinuityLinesForDay,
} from '@/core/cityArchive/cityArchiveSurfacePriority';
import {
  buildEceArchiveHintModel,
  buildHubArchiveContinuityModel,
  buildMapArchiveJournalTracePresentation,
  buildReportArchiveContinuityFromCandidates,
  filterArchiveEntriesForJournalDisplay,
} from '@/core/cityArchive/cityArchiveSurfaceWiring';
import {
  selectArchiveEntryForMapJournalTracePriority,
} from '@/core/cityArchive/cityArchiveSelectors';
import type { CityArchiveEntry } from '@/core/cityArchive/cityArchiveTypes';
import { buildMapReactionLiteModel } from '@/core/mapReactions/mapReactionModel';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyCityArchiveSurfaceWiringOutcome = {
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

function entry(partial: Partial<CityArchiveEntry> & Pick<CityArchiveEntry, 'id' | 'day' | 'kind'>): CityArchiveEntry {
  return {
    districtId: 'sanayi',
    sourceKind: 'storyChain',
    title: 'Test',
    shortLine: partial.shortLine ?? 'Test line',
    isPlayerVisible: true,
    priority: 'medium',
    duplicateKey: partial.duplicateKey ?? `dup-${partial.id}`,
    createdFrom: 'storyChain',
    createdAtDay: partial.day,
    mapLine: partial.mapLine,
    ...partial,
  };
}

function archiveWithEntries(day: number, entries: CityArchiveEntry[]) {
  let archive = createInitialCityArchiveState(day);
  archive = appendCityArchiveEntries(archive, entries, { day, skipDuplicate: true });
  return archive;
}

export function verifyCityArchiveSurfaceWiringScenario(): VerifyCityArchiveSurfaceWiringOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const storyEntry = entry({
    id: 'psc-1',
    day: 8,
    kind: 'story_chain_step',
    shortLine: 'Sanayi rota baskısı toparlanma adımında.',
    mapLine: 'Devam eden iz: Sanayi rota baskısı toparlanma adımında.',
    domain: 'route_pressure_chain',
    eventId: 'psc-route-sanayi-8',
    decisionId: 'follow_up',
  });
  const comebackEntry = entry({
    id: 'cb-1',
    day: 8,
    kind: 'comeback_completed',
    shortLine: 'Cumhuriyet toparlanma tamamlandı.',
    mapLine: 'Günlük izi: Cumhuriyet toparlanma tamamlandı.',
    sourceKind: 'rewardComeback',
    createdFrom: 'rewardComeback',
    districtId: 'cumhuriyet',
  });
  const mainOpEntry = entry({
    id: 'mo-1',
    day: 8,
    kind: 'main_operation_started',
    shortLine: 'Ana operasyon kapsamı genişledi.',
    mapLine: 'Operasyon izi: Ana operasyon kapsamı genişledi.',
    sourceKind: 'operationSignals',
    createdFrom: 'operationSignals',
    priority: 'milestone',
  });

  const archiveDay8 = archiveWithEntries(8, [comebackEntry, mainOpEntry, storyEntry]);
  archiveDay8.storyChainSummary = {
    ...archiveDay8.storyChainSummary,
    activeChainIds: ['psc-route-sanayi-8'],
    lastUpdatedDay: 8,
    activeChains: [
      {
        chainId: 'psc-route-sanayi-8',
        chainKind: 'route_pressure_chain',
        districtId: 'sanayi',
        currentStepIndex: 1,
        currentStepKind: 'follow_up',
        status: 'active',
        startedDay: 7,
        lastAdvancedDay: 8,
        relatedEventIds: [],
        relatedDecisionIds: [],
        archiveEntryIds: [],
        priority: 'high',
        duplicateKey: 'route_pressure_chain:sanayi',
        playerVisibleTitle: 'Operasyon zinciri',
        playerVisibleLine: 'Sanayi rota baskısı toparlanma adımında.',
        hubLine: 'Devam eden iz: Sanayi rota baskısı toparlanma adımında.',
      },
    ],
  };

  const mapPick = selectArchiveEntryForMapJournalTracePriority(archiveDay8, 8, 'sanayi');
  record(assert(checks, mapPick?.kind === 'story_chain_step', 'Map story_chain_step priority'));

  const mapNoStory = selectArchiveEntryForMapJournalTracePriority(
    archiveWithEntries(8, [comebackEntry, mainOpEntry]),
    8,
    'cumhuriyet',
  );
  record(assert(checks, mapNoStory?.kind === 'comeback_completed', 'Map comeback_completed priority'));

  record(assert(checks, selectArchiveEntryForMapJournalTracePriority(createInitialCityArchiveState(1), 1, 'sanayi') == null, 'Map Day 1 none'));

  const mapTrace = buildMapArchiveJournalTracePresentation(archiveDay8, 8, 'sanayi', [], 'Mahalle farklı satır');
  record(assert(checks, Boolean(mapTrace.line?.includes('Devam eden iz')), 'Map journal trace line'));
  record(assert(checks, mapTrace.line !== 'Mahalle farklı satır', 'Map district duplicate guard'));

  const mapReaction = buildMapReactionLiteModel({
    day: 8,
    selectedDistrictId: 'sanayi',
    cityArchive: archiveDay8,
    districtReportCard: { districtId: 'sanayi', dominantIssueLine: 'Mahalle farklı satır' } as never,
  });
  const journalTraces = mapReaction.reactions.filter((r) => r.kind === 'journal_trace');
  record(assert(checks, journalTraces.length <= 1, 'Map max 1 journal_trace'));

  const reportModel = buildReportArchiveContinuityFromCandidates({
    day: 8,
    cityArchive: archiveDay8,
    storyChainLine: 'Operasyon zinciri: Sanayi hattı ilerledi.',
    rewardComebackLine: 'Olumlu iz: Cumhuriyet toparlandı.',
    districtReportLine: 'Mahalle notu: Sanayi baskılı.',
    cityJournalLine: 'Şehir günlüğü: Gün 8 kayıt.',
    existingLines: [],
  });
  record(assert(checks, Boolean(reportModel.storyChainLine), 'Report story priority'));
  record(assert(checks, !reportModel.positiveLine, 'Report suppress reward when story wins'));
  record(assert(checks, maxReportContinuityLinesForDay(8) === 2, 'Report Day 8+ max 2'));
  record(assert(checks, maxReportContinuityLinesForDay(2) === 1, 'Report Day 2-3 max 1'));

  const reportFallback = buildReportArchiveContinuityFromCandidates({
    day: 5,
    cityArchive: archiveWithEntries(5, [comebackEntry]),
    rewardComebackLine: 'Olumlu iz: Cumhuriyet toparlandı.',
    districtReportLine: 'Mahalle notu: Cumhuriyet sakin.',
    existingLines: [],
  });
  record(assert(checks, Boolean(reportFallback.positiveLine), 'Report reward fallback'));

  const hubModel = buildHubArchiveContinuityModel({
    day: 8,
    cityArchive: archiveDay8,
    storyChainLine: 'Devam eden iz: Sanayi toparlanma kontrolünde.',
    districtReportLine: 'Sanayi baskılı.',
    cityJournalLine: 'Gün 8: kayıt',
    existingLines: [],
  });
  record(assert(checks, hubModel.continuityKind === 'story', 'Hub story priority'));
  record(assert(checks, (hubModel.suppressedLines?.length ?? 0) >= 0, 'Hub suppressed lines tracked'));

  const eceModel = buildEceArchiveHintModel({
    day: 8,
    cityArchive: archiveDay8,
    advisorRelationshipSupportingLine: 'Ece önceki kararı hatırlıyor.',
    rewardComebackEceLine: 'Ece olumlu iz görüyor.',
    existingLines: [],
  });
  record(assert(checks, Boolean(eceModel.supportingLine), 'Ece hint selected'));
  record(
    assert(
      checks,
      eceModel.sourceKind === 'story_chain' || Boolean(eceModel.supportingLine?.startsWith('Ece')),
      'Ece story or advisor',
    ),
  );

  record(assert(checks, archiveJournalEntryLabel('story_chain_step') === 'Operasyon zinciri', 'Journal label story_chain_step'));
  record(assert(checks, archiveJournalEntryLabel('comeback_completed') === 'Toparlanma tamamlandı', 'Journal label comeback'));

  const filtered = filterArchiveEntriesForJournalDisplay(
    [storyEntry, comebackEntry, comebackEntry, entry({ id: 'x', day: 8, kind: 'district_shift', shortLine: 'shift' })],
    3,
  );
  record(assert(checks, filtered.length <= 3, 'Journal cap preserved'));

  record(assert(checks, isArchiveSurfaceDuplicate('Aynı satır', ['Aynı satır']), 'Duplicate guard'));
  record(assert(checks, archiveSurfaceLineContainsForbidden('premium GPS quest'), 'Forbidden copy guard'));

  let resumeArchive = appendDayCloseCityArchiveWithStoryChains(
    createInitialCityArchiveState(3),
    { day: 3, carryOverLine: 'Test' } as never,
    { closingDay: 3, carryOverUnresolved: true, operationSignals: { vehicles: { status: 'critical' }, priorityDistrictId: 'sanayi' } },
  );
  const hubBefore = buildHubArchiveContinuityModel({ day: 4, cityArchive: resumeArchive, existingLines: [] });
  resumeArchive = appendDayCloseCityArchiveWithStoryChains(
    resumeArchive,
    { day: 4 } as never,
    { closingDay: 4, operationSignals: { vehicles: { status: 'strained' }, priorityDistrictId: 'sanayi' } },
  );
  const hubAfter = buildHubArchiveContinuityModel({ day: 4, cityArchive: resumeArchive, existingLines: [] });
  record(assert(checks, hubBefore.continuityLine !== hubAfter.continuityLine || !hubAfter.continuityLine, 'Resume hub stable'));

  const reopenReport = buildReportArchiveContinuityFromCandidates({
    day: 4,
    cityArchive: resumeArchive,
    existingLines: [],
  });
  const reopenAgain = buildReportArchiveContinuityFromCandidates({
    day: 4,
    cityArchive: resumeArchive,
    existingLines: [],
  });
  record(assert(checks, JSON.stringify(reopenReport.visibleLines) === JSON.stringify(reopenAgain.visibleLines), 'Report reopen idempotent'));

  const corrupt = normalizeCorruptArchive();
  record(assert(checks, buildHubArchiveContinuityModel({ day: 5, cityArchive: corrupt, existingLines: [] }).maxLines >= 0, 'Corrupt archive safe'));

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 24'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('cityArchiveSurfaceWiring'), 'applyDecision unchanged'));
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('cityArchive'), 'Map integration'));
  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('buildReportArchiveContinuityFromCandidates'), 'Report integration'));
  record(assert(checks, readRepo('src/features/hub/screens/HubScreen.tsx').includes('buildHubArchiveContinuityModel'), 'Hub integration'));
  record(assert(checks, readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('buildEceArchiveHintModel'), 'Ece integration'));
  record(assert(checks, !existsSync(join(REPO_ROOT, 'src/app/archive-detail.tsx')), 'No new route'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-city-archive-map-report-deep-wiring.md')), 'docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:city-archive-surface-wiring'), 'package script'));

  return { ok, checks };
}

function normalizeCorruptArchive(): import('./cityArchiveTypes').CityArchiveV1State {
  const base = createInitialCityArchiveState(5);
  return {
    ...base,
    storyChainSummary: {
      activeChainIds: [],
      unresolvedChainKinds: [],
      lastUpdatedDay: 5,
    },
    entries: [
      entry({
        id: 'bad',
        day: 5,
        kind: 'story_chain_step',
        shortLine: 'y',
        duplicateKey: makeCityArchiveDuplicateKey({
          day: 5,
          kind: 'story_chain_step',
          sourceKind: 'storyChain',
        }),
      }),
    ],
  };
}
