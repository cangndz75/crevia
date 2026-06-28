import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import type { CityArchiveEntry, CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

import {
  buildReportReplayMemoryPresentation,
  memoryPresentationHasDuplicateCopy,
} from '@/features/reports/presentation/memory/reportReplayMemoryPresentation';

export type VerifyReportReplayMemoryOutcome = {
  ok: boolean;
  checks: string[];
  failCount: number;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function baseMetrics() {
  return { publicSatisfaction: 58, staffMorale: 56, budget: 72_000 };
}

function endDaySnapshot(day: number, overrides?: Partial<DaySnapshot['metrics']>): DaySnapshot {
  return {
    id: `snap-end-${day}`,
    day,
    createdAt: `2026-01-${String(day).padStart(2, '0')}T20:00:00.000Z`,
    reason: 'end_day',
    metrics: {
      publicSatisfaction: 58,
      staffMorale: 56,
      budget: 72_000,
      ...overrides,
    },
    activeEventIds: [],
    resolvedEventIds: [],
    xp: day * 10,
    level: 1,
  };
}

function decision(
  day: number,
  label: string,
  effects: DecisionRecord['appliedEffects'] = {},
): DecisionRecord {
  return {
    id: `dec-${day}`,
    day,
    eventId: `evt-${day}`,
    eventTitle: 'Saha operasyonu',
    decisionId: `opt-${day}`,
    decisionLabel: label,
    neighborhoodId: 'merkez',
    neighborhoodName: 'Merkez',
    appliedEffects: effects,
    createdAt: `2026-01-${String(day).padStart(2, '0')}T12:00:00.000Z`,
  };
}

function archiveEntry(day: number, kind: CityArchiveEntry['kind'], title: string): CityArchiveEntry {
  return {
    id: `arch-${day}-${kind}`,
    day,
    kind,
    districtId: 'merkez',
    sourceKind: 'decisionImpact',
    title,
    shortLine: title,
    reportLine: title,
    isPlayerVisible: true,
    priority: 'high',
    duplicateKey: `${kind}:${day}`,
    createdFrom: 'decisionImpact',
    createdAtDay: day,
    trustDeltaBand: kind === 'trust_recovery' ? 'up' : kind === 'resource_pressure' ? 'flat' : 'flat',
    resourceImpactBand: kind === 'resource_pressure' ? 'high' : 'low',
  };
}

function baseArchive(entries: CityArchiveEntry[]): CityArchiveV1State {
  return {
    version: 1,
    createdAtDay: 1,
    updatedAtDay: 8,
    entries,
    districtSummaries: {
      merkez: {
        districtId: 'merkez',
        lastUpdatedDay: 7,
        recentEntryIds: entries.map((e) => e.id),
        trustTrend: 'down',
        socialTone: 'strained',
        resourceTone: 'stable',
        lastWarningMoment: 'gecikme baskısı',
      },
    },
    playerStyleSummary: {
      styleConfidence: 'medium',
      lastUpdatedDay: 7,
      supportingEntryIds: [],
      dominantStyle: 'fast_responder',
    },
    eceRelationshipSummary: {
      familiarityBand: 'warming',
      trustedPatterns: [],
      lastUpdatedDay: 7,
    },
    rewardComebackSummary: {
      recentPositiveEntryIds: [],
      recentComebackEntryIds: [],
      lastUpdatedDay: 7,
    },
    storyChainSummary: {
      activeChainIds: [],
      unresolvedChainKinds: [],
      lastUpdatedDay: 7,
    },
    pruningState: {
      maxEntries: 100,
      maxEntriesPerDistrict: 20,
      keepLastNDaysDetailed: 14,
      compactedEntryCount: 0,
    },
  };
}

function strategyHistory(records: StrategyHistoryStateV1['decisionHistory']): StrategyHistoryStateV1 {
  return {
    decisionHistory: records,
    operationChoiceHistory: [],
    portfolioChoiceHistory: [],
    followUpExecutionHistory: [],
    dominantStrategySurfacedHistory: [],
    lastPrunedDay: null,
  };
}

export function verifyReportReplayMemoryScenario(): VerifyReportReplayMemoryOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION korunur', `SAVE_VERSION=${SAVE_VERSION}`) &&
    ok;

  const day1 = buildReportReplayMemoryPresentation({
    currentDay: 1,
    metrics: baseMetrics(),
    snapshots: [],
    cityArchive: null,
    decisionHistory: [],
  });

  ok =
    assert(checks, day1.isDay1 === true, 'Day 1 modeli üretilir', 'Day 1 flag hatalı') && ok;
  ok =
    assert(
      checks,
      day1.emptyState?.visible === true && day1.emptyState.title.includes('İlk şehir hafızan'),
      'Day 1 boş geçmiş öğretici',
      day1.emptyState?.title ?? 'empty yok',
    ) && ok;
  ok =
    assert(checks, day1.capsules.length === 0, 'Day 1 capsule yok', `${day1.capsules.length} capsule`) &&
    ok;
  ok =
    assert(checks, !day1.timeline.visible, 'Day 1 timeline gizli', 'timeline görünür') && ok;

  const day2 = buildReportReplayMemoryPresentation({
    currentDay: 2,
    metrics: baseMetrics(),
    snapshots: [endDaySnapshot(1)],
    cityArchive: baseArchive([archiveEntry(1, 'decision_record', 'İlk karar izi')]),
    decisionHistory: [decision(1, 'Dengeli Plan', { publicSatisfaction: 2 })],
  });

  ok =
    assert(checks, day2.isEmergingMemory === true, 'Day 2-3 emerging memory', 'emerging flag hatalı') && ok;
  ok =
    assert(
      checks,
      day2.capsules.length >= 1 && day2.capsules.length <= 2,
      'Day 2-3 max 1-2 capsule',
      `${day2.capsules.length} capsule`,
    ) && ok;
  ok =
    assert(
      checks,
      day2.capsules.every((c) => c.headline.length > 0 && c.impactChips.length >= 1),
      'Memory capsule modeli dolu',
      'capsule eksik',
    ) && ok;

  const day8 = buildReportReplayMemoryPresentation({
    currentDay: 8,
    metrics: { publicSatisfaction: 62, staffMorale: 54, budget: 44_000 },
    snapshots: [
      endDaySnapshot(5, { budget: 52_000 }),
      endDaySnapshot(6, { publicSatisfaction: 60 }),
      endDaySnapshot(7, { budget: 46_000 }),
    ],
    cityArchive: baseArchive([
      archiveEntry(5, 'trust_recovery', 'Güven toparlandı'),
      archiveEntry(6, 'social_response', 'Mahalle tepkisi yumuşadı'),
      archiveEntry(7, 'resource_pressure', 'Kaynak baskısı arttı'),
      archiveEntry(7, 'vehicle_maintenance_suggested', 'Bakım uyarısı'),
    ]),
    decisionHistory: [
      decision(5, 'Hızlı Müdahale', { publicSatisfaction: 4 }),
      decision(6, 'Hızlı Müdahale', { publicSatisfaction: 3 }),
      decision(7, 'Kaynak Koru', { budget: -800 }),
    ],
    strategyHistory: strategyHistory([
      {
        id: 'sh-5',
        day: 5,
        eventId: 'e5',
        decisionId: 'd5',
        decisionLabel: 'Hızlı Müdahale',
        selectedDecisionKind: 'fast_response',
        domainTags: [],
        tone: 'positive',
        sourceIds: [],
        createdAt: '',
      },
      {
        id: 'sh-6',
        day: 6,
        eventId: 'e6',
        decisionId: 'd6',
        decisionLabel: 'Hızlı Müdahale',
        selectedDecisionKind: 'fast_response',
        domainTags: [],
        tone: 'positive',
        sourceIds: [],
        createdAt: '',
      },
      {
        id: 'sh-7',
        day: 7,
        eventId: 'e7',
        decisionId: 'd7',
        decisionLabel: 'Kaynak Koru',
        selectedDecisionKind: 'resource_heavy',
        domainTags: [],
        tone: 'cautious',
        sourceIds: [],
        createdAt: '',
      },
    ]),
    maintenanceRiskHigh: true,
    resourcePressureHigh: true,
  });

  ok = assert(checks, day8.isRichMemory === true, 'Day 8+ rich memory', 'rich flag hatalı') && ok;
  ok =
    assert(
      checks,
      day8.timeline.items.length >= 3 && day8.timeline.items.length <= 5,
      'Timeline 3-5 önemli an',
      `${day8.timeline.items.length} item`,
    ) && ok;
  ok =
    assert(checks, day8.districtMemory.visible === true, 'Mahalle hafızası görünür', 'district memory gizli') &&
    ok;
  ok =
    assert(
      checks,
      day8.stylePattern.visible === true && day8.stylePattern.styleChips.length <= 2,
      'Player style pattern bounded',
      `style visible=${day8.stylePattern.visible}`,
    ) && ok;
  ok =
    assert(checks, day8.tradeoffHistory.visible === true, 'Kayıp/kazanç geçmişi var', 'tradeoff gizli') && ok;
  ok =
    assert(checks, day8.todayBridge.visible === true, 'Bugüne bağlanan sinyal var', 'bridge gizli') && ok;
  ok =
    assert(
      checks,
      !memoryPresentationHasDuplicateCopy(day8),
      'Duplicate copy guard',
      'duplicate copy bulundu',
    ) && ok;
  ok =
    assert(
      checks,
      day8.hero.title === 'Şehir Hafızası' && day8.hero.memoryBadge.length > 0,
      'Hero şehir hafızası dili',
      day8.hero.title,
    ) && ok;

  const bannedListCheck = day8.collectStrings().every(
    (s) => !s.includes('Tamamlanan görev') && !s.includes('Dashboard'),
  );
  ok =
    assert(checks, bannedListCheck, 'Basic liste / dashboard copy yok', 'banned copy bulundu') && ok;

  const failCount = checks.filter((c) => c.startsWith('✗')).length;
  return { ok: failCount === 0, checks, failCount };
}
