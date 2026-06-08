import type {
  CityJournalLiteEntry,
  CityJournalLiteEntryKind,
  CityJournalLiteEntryTone,
  CityJournalLitePriority,
  CityJournalLiteSourceKind,
} from '@/core/cityJournal/cityJournalTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';

import {
  archiveJournalEntryLabel,
  CITY_ARCHIVE_JOURNAL_ENTRY_LABELS,
} from './cityArchiveSurfacePriority';

import type { CityArchiveEntry, CityArchiveEntryKind } from './cityArchiveTypes';

const ARCHIVE_KIND_TO_JOURNAL_KIND: Partial<
  Record<CityArchiveEntryKind, CityJournalLiteEntryKind>
> = {
  decision_record: 'district_trust_shift',
  district_shift: 'district_trust_shift',
  trust_recovery: 'recovery_momentum',
  route_balanced: 'route_balanced',
  container_relief: 'container_followup',
  resource_pressure: 'resource_pressure_noted',
  resource_recovery: 'recovery_momentum',
  social_response: 'visible_service_improved',
  crisis_prevented: 'crisis_prevented',
  main_operation_started: 'main_operation_started',
  comeback_available: 'recovery_momentum',
  comeback_completed: 'recovery_momentum',
  ece_prediction_confirmed: 'district_trust_shift',
  story_chain_step: 'carry_over_created',
  report_milestone: 'fallback',
  vehicle_maintenance_suggested: 'resource_pressure_noted',
  vehicle_maintenance_completed: 'recovery_momentum',
  vehicle_fatigue_warning: 'resource_pressure_noted',
  fleet_recovered: 'recovery_momentum',
};

function journalToneForArchive(entry: CityArchiveEntry): CityJournalLiteEntryTone {
  if (
    entry.kind === 'trust_recovery' ||
    entry.kind === 'comeback_completed' ||
    entry.kind === 'resource_recovery'
  ) {
    return 'recovery';
  }
  if (entry.kind === 'resource_pressure' || entry.kind === 'crisis_prevented') {
    return 'watch';
  }
  if (entry.kind === 'main_operation_started') return 'operation';
  if (entry.kind === 'social_response') return 'positive';
  if (entry.kind === 'story_chain_step') return 'watch';
  return 'neutral';
}

function journalPriority(entry: CityArchiveEntry): CityJournalLitePriority {
  if (entry.priority === 'milestone' || entry.priority === 'high') return 'high';
  if (entry.priority === 'medium') return 'medium';
  return 'low';
}

function journalSourceKind(entry: CityArchiveEntry): CityJournalLiteSourceKind {
  switch (entry.createdFrom) {
    case 'rewardComeback':
      return 'daily_report';
    case 'districtReportCard':
      return 'district_memory';
    case 'advisorRelationship':
      return 'city_echo';
    case 'storyChain':
      return 'carry_over';
    case 'operationSignals':
      return 'carry_over';
    default:
      return 'daily_report';
  }
}

export function convertArchiveEntryToJournalEntry(
  entry: CityArchiveEntry,
  index: number,
): CityJournalLiteEntry {
  const kind = ARCHIVE_KIND_TO_JOURNAL_KIND[entry.kind] ?? 'fallback';
  const districtName = entry.districtId
    ? DISTRICT_IDENTITIES[entry.districtId as MapDistrictId]?.name
    : undefined;
  const line = entry.shortLine.startsWith(`Gün ${entry.day}`)
    ? entry.shortLine
    : `Gün ${entry.day}: ${entry.shortLine}`;

  const title = CITY_ARCHIVE_JOURNAL_ENTRY_LABELS[entry.kind]
    ? archiveJournalEntryLabel(entry.kind)
    : entry.title;

  return {
    id: `archive_journal_${entry.id}`,
    day: entry.day,
    title,
    line,
    districtId: entry.districtId as MapDistrictId | undefined,
    districtName,
    domain: entry.domain,
    kind,
    tone: journalToneForArchive(entry),
    sourceKind: journalSourceKind(entry),
    priority: journalPriority(entry),
    createdFromDay: entry.createdAtDay,
    maxVisibleLines: 1,
  };
}
