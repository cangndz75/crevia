import type { CityArchiveEntry } from '@/core/cityArchive/cityArchiveTypes';
import type { ReportReplayTone } from '@/core/reportReplay';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

import type { ReportReplayMemoryTimelineItem } from './reportReplayMemoryTypes';

const MAX_TIMELINE = 5;
const MIN_TIMELINE = 3;

const KIND_ICON: Record<string, string> = {
  decision_record: 'git-branch-outline',
  trust_recovery: 'heart-outline',
  resource_pressure: 'wallet-outline',
  resource_recovery: 'trending-up-outline',
  social_response: 'chatbubbles-outline',
  crisis_prevented: 'shield-checkmark-outline',
  main_operation_started: 'flash-outline',
  comeback_completed: 'sparkles-outline',
  story_chain_step: 'link-outline',
  vehicle_maintenance_suggested: 'construct-outline',
  team_fatigue_warning: 'people-outline',
  report_milestone: 'flag-outline',
};

const KIND_TONE: Record<string, ReportReplayTone> = {
  trust_recovery: 'positive',
  resource_recovery: 'positive',
  comeback_completed: 'positive',
  crisis_prevented: 'positive',
  resource_pressure: 'warning',
  vehicle_maintenance_suggested: 'warning',
  team_fatigue_warning: 'warning',
  social_response: 'mixed',
  decision_record: 'strategic',
};

function clamp(text: string, max = 56): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function priorityForEntry(entry: CityArchiveEntry): number {
  const base: Record<string, number> = {
    crisis_prevented: 95,
    trust_recovery: 90,
    main_operation_started: 88,
    story_chain_step: 85,
    decision_record: 82,
    resource_pressure: 78,
    comeback_completed: 75,
    social_response: 72,
    vehicle_maintenance_suggested: 70,
    team_fatigue_warning: 68,
    report_milestone: 65,
  };
  const priorityBoost = entry.priority === 'milestone' ? 12 : entry.priority === 'high' ? 6 : 0;
  return (base[entry.kind] ?? 50) + priorityBoost;
}

function trendForEntry(entry: CityArchiveEntry): ReportReplayMemoryTimelineItem['trendDirection'] {
  if (entry.trustDeltaBand === 'up' || entry.trustDeltaBand === 'recovered') return 'up';
  if (entry.trustDeltaBand === 'down') return 'down';
  if (entry.resourceImpactBand === 'high') return 'down';
  if (entry.kind === 'trust_recovery' || entry.kind === 'crisis_prevented') return 'up';
  if (entry.kind === 'resource_pressure' || entry.kind === 'vehicle_maintenance_suggested') return 'down';
  return 'flat';
}

function impactChipForEntry(entry: CityArchiveEntry, avoidLines: string[]): string {
  const candidates = [
    entry.trustDeltaBand === 'up' || entry.trustDeltaBand === 'recovered' ? 'Güven +' : null,
    entry.resourceImpactBand === 'high' ? 'Bütçe baskısı' : null,
    entry.kind === 'vehicle_maintenance_suggested' ? 'Bakım uyarısı' : null,
    entry.kind === 'social_response' ? 'Mahalle tepkisi' : null,
    entry.kind === 'crisis_prevented' ? 'Kriz kontrolü' : null,
    'Şehir izi',
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (!lineDuplicatesAvoidLines(candidate, avoidLines)) return candidate;
  }
  return 'Şehir izi';
}

function mapEntryToTimelineItem(
  entry: CityArchiveEntry,
  avoidLines: string[],
): ReportReplayMemoryTimelineItem {
  const impactChip = impactChipForEntry(entry, avoidLines);
  avoidLines.push(impactChip);
  return {
    id: `memory-timeline-${entry.id}`,
    icon: KIND_ICON[entry.kind] ?? 'ellipse-outline',
    title: clamp(entry.title || entry.shortLine),
    dayLabel: `Gün ${entry.day}`,
    impactChip,
    trendDirection: trendForEntry(entry),
    tone: KIND_TONE[entry.kind] ?? 'neutral',
    priority: priorityForEntry(entry),
    dedupeKey: `timeline:${entry.duplicateKey}`,
  };
}

export function buildReportReplayMemoryTimeline(
  archiveEntries: CityArchiveEntry[],
  currentDay: number,
  maxItems = MAX_TIMELINE,
  avoidLines: string[] = [],
): {
  items: ReportReplayMemoryTimelineItem[];
  collapsedLabel: string | null;
} {
  const pastEntries = archiveEntries
    .filter((e) => e.isPlayerVisible && e.day < currentDay)
    .sort((a, b) => priorityForEntry(b) - priorityForEntry(a) || b.day - a.day);

  const selected: ReportReplayMemoryTimelineItem[] = [];
  const usedKeys = new Set<string>();

  for (const entry of pastEntries) {
    if (selected.length >= maxItems) break;
    const item = mapEntryToTimelineItem(entry, avoidLines);
    if (usedKeys.has(item.dedupeKey)) continue;
    if (lineDuplicatesAvoidLines(item.title, avoidLines)) continue;
    usedKeys.add(item.dedupeKey);
    avoidLines.push(item.title);
    selected.push(item);
  }

  if (selected.length < MIN_TIMELINE && pastEntries.length > selected.length) {
    for (const entry of pastEntries) {
      if (selected.length >= MIN_TIMELINE) break;
      const item = mapEntryToTimelineItem(entry, avoidLines);
      if (usedKeys.has(item.dedupeKey)) continue;
      usedKeys.add(item.dedupeKey);
      selected.push(item);
    }
  }

  const overflow = pastEntries.length - selected.length;
  return {
    items: selected.slice(0, maxItems),
    collapsedLabel: overflow > 0 ? `+${overflow} geçmiş an gizli` : null,
  };
}
