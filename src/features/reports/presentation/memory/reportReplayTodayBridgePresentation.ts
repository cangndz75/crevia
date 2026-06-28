import type { CityArchiveEntry } from '@/core/cityArchive/cityArchiveTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

import type { MemoryImpactChip, ReportReplayTradeoffHistory } from './reportReplayMemoryTypes';

function sumTrustDelta(decisions: DecisionRecord[]): number {
  return decisions.reduce((sum, r) => {
    const v = r.appliedEffects.publicSatisfaction ?? r.appliedEffects.trust ?? 0;
    return sum + v;
  }, 0);
}

function sumBudgetDelta(decisions: DecisionRecord[]): number {
  return decisions.reduce((sum, r) => sum + (r.appliedEffects.budget ?? 0), 0);
}

export function buildReportReplayTradeoffHistory(
  pastDays: Array<{
    day: number;
    snapshot: DaySnapshot;
    decisions: DecisionRecord[];
    archiveEntries: CityArchiveEntry[];
  }>,
  currentDay: number,
  avoidLines: string[] = [],
): ReportReplayTradeoffHistory {
  if (currentDay < 2 || pastDays.length === 0) {
    return {
      visible: false,
      balanceLabel: '',
      balanceRatio: 0.5,
      gains: [],
      costs: [],
    };
  }

  const gains: MemoryImpactChip[] = [];
  const costs: MemoryImpactChip[] = [];
  const avoidDupes = new Set<string>();

  const pushGain = (key: string, label: string) => {
    if (avoidDupes.has(label) || lineDuplicatesAvoidLines(label, avoidLines)) return;
    avoidDupes.add(label);
    avoidLines.push(label);
    gains.push({ key, label, tone: 'positive' });
  };
  const pushCost = (key: string, label: string) => {
    if (avoidDupes.has(label) || lineDuplicatesAvoidLines(label, avoidLines)) return;
    avoidDupes.add(label);
    avoidLines.push(label);
    costs.push({ key, label, tone: 'warning' });
  };

  let trustUpDays = 0;
  let trustDownDays = 0;
  let resourcePressureDays = 0;
  let maintenanceWarnings = 0;

  for (const entry of pastDays) {
    const trustDelta = sumTrustDelta(entry.decisions);
    if (trustDelta >= 2) trustUpDays += 1;
    if (trustDelta <= -2) trustDownDays += 1;
    if (entry.snapshot.metrics.budget < 50_000) resourcePressureDays += 1;
    if (
      entry.archiveEntries.some(
        (e) =>
          e.kind === 'vehicle_maintenance_suggested' || e.kind === 'vehicle_fatigue_warning',
      )
    ) {
      maintenanceWarnings += 1;
    }
  }

  if (trustUpDays >= 1) pushGain('trust', 'Mahalle güveni arttı');
  if (trustDownDays >= 1) pushCost('trust', 'Güven baskısı birikti');
  if (resourcePressureDays >= 1) pushCost('resource', 'Kaynak eridi');
  if (maintenanceWarnings >= 1) pushCost('readiness', 'Hazırlık zayıfladı');

  const recentBudget = pastDays
    .slice(-3)
    .reduce((sum, d) => sum + sumBudgetDelta(d.decisions), 0);
  if (recentBudget >= 500) pushGain('budget', 'Kaynak kazanımı');
  if (recentBudget <= -500) pushCost('budget', 'Kaynak harcandı');

  if (gains.length === 0 && costs.length === 0) {
    pushGain('steady', 'Denge korundu');
    pushCost('carry', 'Küçük baskı taşındı');
  }

  const gainWeight = gains.length;
  const costWeight = costs.length;
  const balanceRatio =
    gainWeight + costWeight > 0 ? gainWeight / (gainWeight + costWeight) : 0.5;

  let balanceLabel = 'Dengeli birikim';
  if (balanceRatio >= 0.65) balanceLabel = 'Kazanım ağır bastı';
  else if (balanceRatio <= 0.35) balanceLabel = 'Bedel birikti';

  return {
    visible: currentDay >= 3,
    balanceLabel,
    balanceRatio,
    gains: gains.slice(0, 2),
    costs: costs.slice(0, 2),
  };
}

export function buildReportReplayTodayBridge(
  pastDays: Array<{
    day: number;
    snapshot: DaySnapshot;
    decisions: DecisionRecord[];
    archiveEntries: CityArchiveEntry[];
  }>,
  currentDay: number,
  hubRecentImpactLine?: string | null,
  avoidLines: string[] = [],
): import('./reportReplayMemoryTypes').ReportReplayTodayBridge {
  if (currentDay <= 1 || pastDays.length === 0) {
    return { visible: false, signalLine: '', tone: 'neutral' };
  }

  const latest = [...pastDays].sort((a, b) => b.day - a.day)[0];
  if (!latest) return { visible: false, signalLine: '', tone: 'neutral' };

  const maintenanceLate = latest.archiveEntries.some(
    (e) => e.kind === 'vehicle_maintenance_suggested' || e.kind === 'vehicle_fatigue_warning',
  );
  const trustUp = pastDays.filter((d) => sumTrustDelta(d.decisions) >= 2).length >= 2;
  const sameDistrictRepeats = latest.decisions.length >= 1;

  let signalLine = '';
  let tone: import('./reportReplayMemoryTypes').MemoryChipTone = 'teal';

  if (maintenanceLate) {
    signalLine = 'Dünkü bakım gecikmesi bugün hızlı müdahaleyi zorlaştırabilir.';
    tone = 'warning';
  } else if (trustUp) {
    signalLine = 'Son iki günkü güven artışı sosyal baskıyı düşürdü.';
    tone = 'positive';
  } else if (sameDistrictRepeats && latest.decisions[0]?.neighborhoodName) {
    signalLine = 'Aynı mahallede tekrar eden olaylar sabır eşiğini aşağı çekti.';
    tone = 'warning';
  } else if (latest.snapshot.metrics.budget < 48_000) {
    signalLine = 'Geçen günün kaynak baskısı bugünkü seçimleri daraltabilir.';
    tone = 'warning';
  } else {
    signalLine = 'Geçmiş gün izleri bugünkü operasyon temposunu şekillendiriyor.';
    tone = 'teal';
  }

  if (hubRecentImpactLine && lineDuplicatesAvoidLines(signalLine, [hubRecentImpactLine])) {
    signalLine = 'Dünkü karar izi bugün operasyon önceliğini etkileyebilir.';
  }
  if (lineDuplicatesAvoidLines(signalLine, avoidLines)) {
    return { visible: false, signalLine: '', tone: 'neutral' };
  }

  return { visible: true, signalLine, tone };
}
