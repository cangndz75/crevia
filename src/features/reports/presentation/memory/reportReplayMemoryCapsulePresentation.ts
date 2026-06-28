import type { CityArchiveEntry } from '@/core/cityArchive/cityArchiveTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { buildReportReadinessMemory } from '@/core/readinessStrategicPriority/readinessSurfaceBridge';
import {
  buildEndOfDayClosingTonePresentation,
  type ClosingToneSignalInput,
} from '@/features/reports/presentation/closure/endOfDayReportClosingTonePresentation';

import type {
  MemoryCapsuleDetail,
  MemoryImpactChip,
  ReportReplayMemoryCapsule,
} from './reportReplayMemoryTypes';

const MAX_CHIPS = 3;

function clamp(text: string, max = 72): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function deriveSuccessScore(metrics: { publicSatisfaction: number; staffMorale: number; budget: number }): number {
  const raw =
    metrics.publicSatisfaction * 0.45 +
    metrics.staffMorale * 0.25 +
    (metrics.budget >= 50_000 ? 72 : 48) * 0.3;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

function trustDeltaForDay(decisions: DecisionRecord[]): number {
  return decisions.reduce((sum, r) => {
    const v = r.appliedEffects.publicSatisfaction ?? r.appliedEffects.trust ?? 0;
    return sum + v;
  }, 0);
}

function buildImpactChips(
  metrics: DaySnapshot['metrics'],
  decisions: DecisionRecord[],
  archiveEntries: CityArchiveEntry[],
  day: number,
  avoidLines: string[],
): MemoryImpactChip[] {
  const chips: MemoryImpactChip[] = [];
  const trustDelta = trustDeltaForDay(decisions);

  const candidates: MemoryImpactChip[] = [];
  if (trustDelta >= 2) {
    candidates.push({ key: 'trust', label: 'Mahalle sabrı +', tone: 'positive' });
  } else if (trustDelta <= -2) {
    candidates.push({ key: 'trust', label: 'Güven baskısı', tone: 'warning' });
  }

  if (metrics.budget < 50_000) {
    candidates.push({ key: 'resource', label: 'Kaynak baskısı', tone: 'warning' });
  } else if (metrics.publicSatisfaction >= 58) {
    candidates.push({ key: 'resource', label: 'Kaynak dengede', tone: 'teal' });
  }

  const maintenanceEntry = archiveEntries.find(
    (e) => e.kind === 'vehicle_maintenance_suggested' || e.kind === 'vehicle_fatigue_warning',
  );
  const readinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'report',
    day,
    moraleDelta: metrics.staffMorale < 48 ? -3 : 0,
    eventRiskLevel: maintenanceEntry ? 'high' : 'medium',
  });
  const readinessMemory = buildReportReadinessMemory({
    day,
    readinessSnapshot,
    memoryStreakDays: metrics.staffMorale < 48 ? 2 : 0,
  });

  if (maintenanceEntry) {
    candidates.push({ key: 'readiness', label: 'Bakım uyarısı', tone: 'warning' });
  } else if (readinessMemory.replayChip && !lineDuplicatesAvoidLines(readinessMemory.replayChip, avoidLines)) {
    candidates.push({ key: 'readiness', label: readinessMemory.replayChip, tone: 'warning' });
  } else if (metrics.staffMorale < 48) {
    candidates.push({ key: 'morale', label: 'Ekip yorgunluğu', tone: 'mixed' });
  }

  candidates.push({ key: 'day', label: `Gün ${day} izi`, tone: 'neutral' });

  for (const candidate of candidates) {
    if (lineDuplicatesAvoidLines(candidate.label, avoidLines)) continue;
    chips.push(candidate);
    avoidLines.push(candidate.label);
    if (chips.length >= MAX_CHIPS) break;
  }

  if (chips.length === 0) {
    chips.push({ key: 'steady', label: 'Şehir ritmi korundu', tone: 'neutral' });
  }

  return chips.slice(0, MAX_CHIPS);
}

function resolveDecisionBadge(decisions: DecisionRecord[], avoidLines: string[]): string | null {
  const primary = decisions[0];
  if (!primary?.decisionLabel) return null;
  const label = primary.decisionLabel.trim();
  const lower = label.toLowerCase();
  let badge: string | null = null;
  if (lower.includes('hızlı') || lower.includes('acil')) badge = 'Hızlı müdahale';
  else if (lower.includes('önley') || lower.includes('plan')) badge = 'Önleyici plan';
  else if (lower.includes('görünür') || lower.includes('sosyal')) badge = 'Görünür hizmet';
  else if (lower.includes('denge')) badge = 'Dengeli karar';
  else badge = clamp(label, 24);

  if (badge && lineDuplicatesAvoidLines(badge, avoidLines)) {
    badge = `Gün ${decisions[0]?.day ?? 0} kararı`;
  }
  if (badge && lineDuplicatesAvoidLines(badge, avoidLines)) {
    return null;
  }
  if (badge) avoidLines.push(badge);
  return badge;
}

function buildCapsuleDetail(
  day: number,
  decisions: DecisionRecord[],
  archiveEntries: CityArchiveEntry[],
  closingSummary: string,
  avoidLines: string[],
): MemoryCapsuleDetail {
  const primary = decisions[0];
  const archiveLine = archiveEntries.find((e) => e.reportLine || e.shortLine);
  const decisionStoryLine = primary
    ? clamp(`Gün ${day}: ${primary.decisionLabel} seçildi; ${closingSummary.toLowerCase()}`)
    : clamp(archiveLine?.shortLine ?? `Gün ${day}: ${closingSummary}`);

  const neighborhoodLine = primary?.neighborhoodName
    ? clamp(`Gün ${day}'te ${primary.neighborhoodName} bu kararı hafızaya ekledi.`)
    : archiveEntries.find((e) => e.districtId)?.shortLine ?? null;

  const trustDelta = trustDeltaForDay(decisions);
  const tradeoffGain =
    trustDelta >= 2 && !lineDuplicatesAvoidLines('Saha etkisi güçlendi', avoidLines)
      ? 'Saha etkisi güçlendi'
      : trustDelta >= 0 && !lineDuplicatesAvoidLines('Denge korundu', avoidLines)
        ? 'Denge korundu'
        : null;
  const tradeoffCost =
    trustDelta <= -2 && !lineDuplicatesAvoidLines('Güven baskısı birikti', avoidLines)
      ? 'Güven baskısı birikti'
      : decisions.some((d) => (d.appliedEffects.budget ?? 0) < -300) &&
          !lineDuplicatesAvoidLines('Kaynak eridi', avoidLines)
        ? 'Kaynak eridi'
        : null;

  const tomorrowEntry = archiveEntries.find((e) => e.kind === 'resource_pressure');
  const tomorrowEcho = tomorrowEntry
    ? clamp(`Gün ${day} → ${tomorrowEntry.shortLine}`)
    : trustDelta <= -2
      ? `Gün ${day} sonrası mahalle sabrı daha kırılgan kaldı.`
      : null;

  if (tradeoffGain) avoidLines.push(tradeoffGain);
  if (tradeoffCost) avoidLines.push(tradeoffCost);
  if (neighborhoodLine) avoidLines.push(neighborhoodLine);
  avoidLines.push(decisionStoryLine);

  return {
    decisionStoryLine,
    neighborhoodLine,
    tradeoffGain,
    tradeoffCost,
    tomorrowEcho,
  };
}

export type BuildMemoryCapsuleInput = {
  day: number;
  snapshot: DaySnapshot;
  decisions: DecisionRecord[];
  archiveEntries: CityArchiveEntry[];
  avoidLines: string[];
};

export function buildReportReplayMemoryCapsule(
  input: BuildMemoryCapsuleInput,
): ReportReplayMemoryCapsule | null {
  const { day, snapshot, decisions, archiveEntries, avoidLines } = input;
  const trustDelta = trustDeltaForDay(decisions);
  const toneInput: ClosingToneSignalInput = {
    day,
    successScore: deriveSuccessScore(snapshot.metrics),
    metrics: snapshot.metrics,
    trustDelta,
    resourcePressureHigh: snapshot.metrics.budget < 45_000,
    maintenanceRiskHigh: archiveEntries.some(
      (e) => e.kind === 'vehicle_fatigue_warning' || e.kind === 'vehicle_maintenance_suggested',
    ),
    socialPulseScore: snapshot.metrics.publicSatisfaction,
  };
  const closingTone = buildEndOfDayClosingTonePresentation(toneInput);
  const headline = closingTone.heroTitle;
  const impactChips = buildImpactChips(snapshot.metrics, decisions, archiveEntries, day, avoidLines);
  const decisionBadge = resolveDecisionBadge(decisions, avoidLines);
  const detail = buildCapsuleDetail(day, decisions, archiveEntries, closingTone.heroSummary, avoidLines);

  if (lineDuplicatesAvoidLines(headline, avoidLines)) return null;
  avoidLines.push(headline, closingTone.heroSummary);

  return {
    id: `memory-capsule-${day}`,
    day,
    dayLabel: `Gün ${day}`,
    closingTone: closingTone.statusBadge,
    headline,
    impactChips,
    decisionBadge,
    detailAffordance: 'Detayı gör',
    expandable: true,
    detail,
    dedupeKey: `capsule:${day}:${closingTone.id}`,
  };
}

export function buildReportReplayMemoryCapsules(
  pastDays: Array<{
    day: number;
    snapshot: DaySnapshot;
    decisions: DecisionRecord[];
    archiveEntries: CityArchiveEntry[];
  }>,
  maxVisible: number,
  avoidLines: string[] = [],
): { capsules: ReportReplayMemoryCapsule[]; hiddenCount: number } {
  const capsules: ReportReplayMemoryCapsule[] = [];
  const sorted = [...pastDays].sort((a, b) => b.day - a.day);

  for (const entry of sorted) {
    const capsule = buildReportReplayMemoryCapsule({ ...entry, avoidLines });
    if (capsule) capsules.push(capsule);
    if (capsules.length >= maxVisible) break;
  }

  const hiddenCount = Math.max(0, sorted.length - capsules.length);
  return { capsules, hiddenCount };
}
