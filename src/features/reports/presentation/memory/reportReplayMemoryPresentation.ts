import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';
import { normalizePresentationText } from '@/core/presentationDedupe';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { buildMaintenanceEconomyMemoryLine } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';

import { buildReportReplayMemoryCapsules } from './reportReplayMemoryCapsulePresentation';
import { buildReportReplayDistrictMemory } from './reportReplayDistrictMemoryPresentation';
import { buildReportReplayStylePattern } from './reportReplayPatternPresentation';
import { buildReportReplayMemoryTimeline } from './reportReplayTimelinePresentation';
import {
  buildReportReplayTodayBridge,
  buildReportReplayTradeoffHistory,
} from './reportReplayTodayBridgePresentation';
import type {
  MemoryChipTone,
  ReportReplayMemoryHero,
  ReportReplayMemoryPresentation,
} from './reportReplayMemoryTypes';

export type BuildReportReplayMemoryInput = {
  currentDay: number;
  metrics: GameMetrics;
  snapshots: DaySnapshot[];
  cityArchive: CityArchiveV1State | null;
  decisionHistory: DecisionRecord[];
  strategyHistory?: StrategyHistoryStateV1 | null;
  socialPulseScore?: number;
  maintenanceRiskHigh?: boolean;
  resourcePressureHigh?: boolean;
  playerStyleLabel?: string | null;
  hubRecentImpactLine?: string | null;
  avoidLines?: string[];
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

function clamp(text: string, max = 100): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function endDaySnapshots(snapshots: DaySnapshot[], beforeDay: number): DaySnapshot[] {
  const byDay = new Map<number, DaySnapshot>();
  for (const snap of snapshots) {
    if (snap.reason !== 'end_day') continue;
    if (snap.day >= beforeDay) continue;
    const existing = byDay.get(snap.day);
    if (!existing || snap.createdAt > existing.createdAt) {
      byDay.set(snap.day, snap);
    }
  }
  return [...byDay.values()].sort((a, b) => a.day - b.day);
}

function groupDecisionsByDay(
  history: DecisionRecord[],
  beforeDay: number,
): Map<number, DecisionRecord[]> {
  const map = new Map<number, DecisionRecord[]>();
  for (const record of history) {
    if (record.day >= beforeDay) continue;
    const list = map.get(record.day) ?? [];
    list.push(record);
    map.set(record.day, list);
  }
  return map;
}

function groupArchiveByDay(
  archive: CityArchiveV1State | null,
  beforeDay: number,
): Map<number, import('@/core/cityArchive/cityArchiveTypes').CityArchiveEntry[]> {
  const map = new Map<number, import('@/core/cityArchive/cityArchiveTypes').CityArchiveEntry[]>();
  for (const entry of archive?.entries ?? []) {
    if (entry.day >= beforeDay) continue;
    const list = map.get(entry.day) ?? [];
    list.push(entry);
    map.set(entry.day, list);
  }
  return map;
}

function deriveHeroBadge(
  pastDays: ReturnType<typeof buildPastDayContexts>,
  currentDay: number,
  metrics: GameMetrics,
  maintenanceRiskHigh: boolean,
  resourcePressureHigh: boolean,
): { badge: string; tone: MemoryChipTone; summary: string } {
  if (pastDays.length === 0) {
    return {
      badge: 'Hafıza oluşuyor',
      tone: 'teal',
      summary: 'İlk şehir hafızan bugün oluşacak.',
    };
  }

  const trustTrend = pastDays.filter((d) => {
    const delta = d.decisions.reduce(
      (s, r) => s + (r.appliedEffects.publicSatisfaction ?? r.appliedEffects.trust ?? 0),
      0,
    );
    return delta >= 2;
  }).length;

  const fastDecisions = pastDays.flatMap((d) => d.decisions).filter((d) => {
    const lower = d.decisionLabel.toLowerCase();
    return lower.includes('hızlı') || lower.includes('acil');
  }).length;

  if (maintenanceRiskHigh || pastDays.some((d) =>
    d.archiveEntries.some((e) => e.kind === 'vehicle_maintenance_suggested'),
  )) {
    return {
      badge: 'Bakım riski büyüyor',
      tone: 'warning',
      summary: 'Hazırlık sinyalleri geçmiş günlerden bugüne taşındı.',
    };
  }
  if (resourcePressureHigh || metrics.budget < 48_000) {
    return {
      badge: 'Kaynak baskısı birikiyor',
      tone: 'warning',
      summary: 'Son günlerde kaynak seçimleri şehir hafızasında iz bıraktı.',
    };
  }
  if (trustTrend >= 2) {
    return {
      badge: 'Güven toparlanıyor',
      tone: 'positive',
      summary: 'Mahalle güveni son günlerde yukarı eğilim gösterdi.',
    };
  }
  if (fastDecisions >= 2 && currentDay >= 4) {
    return {
      badge: 'Hızlı müdahale çizgisi güçlendi',
      tone: 'teal',
      summary: 'Operasyon tempon geçmiş günlerde hızlı müdahaleye kaydı.',
    };
  }
  return {
    badge: 'Mahalleler dengede',
    tone: 'neutral',
    summary: 'Son günlerde şehir ritmi dengeli kaldı; izler takip ediliyor.',
  };
}

function buildPastDayContexts(
  input: BuildReportReplayMemoryInput,
): Array<{
  day: number;
  snapshot: DaySnapshot;
  decisions: DecisionRecord[];
  archiveEntries: import('@/core/cityArchive/cityArchiveTypes').CityArchiveEntry[];
}> {
  const endDays = endDaySnapshots(input.snapshots, input.currentDay);
  const decisionsByDay = groupDecisionsByDay(input.decisionHistory, input.currentDay);
  const archiveByDay = groupArchiveByDay(input.cityArchive, input.currentDay);

  return endDays.map((snapshot) => ({
    day: snapshot.day,
    snapshot,
    decisions: decisionsByDay.get(snapshot.day) ?? [],
    archiveEntries: archiveByDay.get(snapshot.day) ?? [],
  }));
}

function buildHero(
  input: BuildReportReplayMemoryInput,
  pastDays: ReturnType<typeof buildPastDayContexts>,
): ReportReplayMemoryHero {
  const derived = deriveHeroBadge(
    pastDays,
    input.currentDay,
    input.metrics,
    input.maintenanceRiskHigh ?? false,
    input.resourcePressureHigh ?? false,
  );
  return {
    title: 'Şehir Hafızası',
    subtitle: 'Son günlerde şehir nasıl değişti?',
    summaryLine: clamp(derived.summary),
    memoryBadge: derived.badge,
    badgeTone: derived.tone,
  };
}

function maxCapsulesForDay(currentDay: number): number {
  if (currentDay <= 1) return 0;
  if (currentDay <= 3) return 2;
  if (currentDay <= 7) return 3;
  return 4;
}

export function memoryPresentationHasDuplicateCopy(presentation: ReportReplayMemoryPresentation): boolean {
  const strings = presentation.collectStrings().map(normalizePresentationText).filter(Boolean);
  const seen = new Set<string>();
  for (const s of strings) {
    if (seen.has(s)) return true;
    seen.add(s);
  }
  return false;
}

export function buildReportReplayMemoryPresentation(
  input: BuildReportReplayMemoryInput,
): ReportReplayMemoryPresentation {
  const avoidLines = [...(input.avoidLines ?? [])];
  const currentDay = input.currentDay;
  const isDay1 = currentDay <= 1;
  const isEmergingMemory = currentDay >= 2 && currentDay <= 3;
  const isRichMemory = currentDay >= 8;

  const pastDays = buildPastDayContexts(input);
  const hero = buildHero(input, pastDays);

  const bridgeAvoidLines = [
    hero.summaryLine,
    hero.memoryBadge,
    input.hubRecentImpactLine ?? '',
  ].filter(Boolean);

  const todayBridge = isDay1
    ? { visible: false, signalLine: '', tone: 'neutral' as const }
    : buildReportReplayTodayBridge(
        pastDays,
        currentDay,
        input.hubRecentImpactLine,
        bridgeAvoidLines,
      );

  const stylePatternRaw = buildReportReplayStylePattern(
    input.strategyHistory,
    currentDay,
    input.playerStyleLabel,
    avoidLines,
  );

  const emptyState = isDay1
    ? {
        visible: true,
        title: 'İlk şehir hafızan bugün oluşacak',
        body: 'Günü kapattığında kararların burada kısa anılar olarak birikecek.',
        ctaLabel: 'Bugünkü kapanışa bak',
      }
    : null;

  const maxCapsules = maxCapsulesForDay(currentDay);
  const { capsules, hiddenCount } = buildReportReplayMemoryCapsules(
    pastDays,
    maxCapsules,
    avoidLines,
  );

  const timelineMax = isDay1 ? 0 : isEmergingMemory ? 3 : isRichMemory ? 5 : 4;
  const timeline = buildReportReplayMemoryTimeline(
    input.cityArchive?.entries ?? [],
    currentDay,
    timelineMax,
    avoidLines,
  );

  const stylePattern =
    isRichMemory || (isEmergingMemory && stylePatternRaw.visible)
      ? stylePatternRaw
      : { ...stylePatternRaw, visible: stylePatternRaw.visible && currentDay >= 4 };

  const districtMemory = buildReportReplayDistrictMemory(
    input.cityArchive,
    currentDay,
    avoidLines,
  );

  const tradeoffHistory = buildReportReplayTradeoffHistory(pastDays, currentDay, avoidLines);
  const maintenanceMemoryLine =
    !isDay1 && isRichMemory
      ? buildMaintenanceEconomyMemoryLine(
          { day: currentDay, runtime: input.maintenanceBacklogRuntime },
          avoidLines,
        )
      : null;
  if (maintenanceMemoryLine) {
    tradeoffHistory.visible = true;
    tradeoffHistory.costs.push({
      key: 'maintenance_memory',
      label: maintenanceMemoryLine,
      tone: 'warning',
    });
    if (!tradeoffHistory.balanceLabel) {
      tradeoffHistory.balanceLabel = 'Geçmiş bakım bedeli';
    }
  }

  const expandAllLabel =
    hiddenCount > 0 ? `Tüm geçmişi gör (+${hiddenCount})` : timeline.collapsedLabel;

  const collectStrings = (): string[] => {
    const parts = [
      hero.title,
      hero.subtitle,
      hero.summaryLine,
      hero.memoryBadge,
      emptyState?.title,
      emptyState?.body,
      ...capsules.flatMap((c) => [
        c.headline,
        c.closingTone,
        c.decisionBadge ?? '',
        ...c.impactChips.map((ch) => ch.label),
        c.detail?.decisionStoryLine ?? '',
        c.detail?.neighborhoodLine ?? '',
        c.detail?.tradeoffGain ?? '',
        c.detail?.tradeoffCost ?? '',
        c.detail?.tomorrowEcho ?? '',
      ]),
      ...timeline.items.map((t) => `${t.title} ${t.impactChip}`),
      stylePattern.mainLine,
      ...stylePattern.styleChips.map((c) => c.label),
      districtMemory.signalLine,
      ...districtMemory.chips.map((c) => c.label),
      tradeoffHistory.balanceLabel,
      ...tradeoffHistory.gains.map((g) => g.label),
      ...tradeoffHistory.costs.map((c) => c.label),
      todayBridge.signalLine,
    ];
    return parts.filter((p): p is string => Boolean(p?.trim()));
  };

  return {
    isDay1,
    isEmergingMemory,
    isRichMemory,
    hero,
    emptyState,
    capsules,
    hiddenCapsuleCount: hiddenCount,
    expandAllLabel,
    timeline: {
      visible: !isDay1 && timeline.items.length > 0,
      items: timeline.items,
      collapsedLabel: timeline.collapsedLabel,
    },
    stylePattern,
    districtMemory: isRichMemory
      ? districtMemory
      : { ...districtMemory, visible: districtMemory.visible && currentDay >= 6 },
    tradeoffHistory: isDay1
      ? { ...tradeoffHistory, visible: false }
      : tradeoffHistory,
    todayBridge: isDay1 ? { ...todayBridge, visible: false } : todayBridge,
    collectStrings,
  };
}

export type { ReportReplayMemoryPresentation };
