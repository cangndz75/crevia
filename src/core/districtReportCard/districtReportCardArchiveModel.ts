import type { CityArchiveEntry, CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import {
  selectArchiveEceRelationshipSummary,
  selectArchiveRewardComebackSummary,
  selectDistrictArchiveEntries,
} from '@/core/cityArchive/cityArchiveSelectors';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

import {
  DISTRICT_REPORT_CARD_FULL_MAX_RECENT_EVENTS,
  DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS,
  DISTRICT_REPORT_CARD_PLAYER_STYLE_LINES,
  DISTRICT_REPORT_CARD_PUBLIC_TONE_LINES,
  DISTRICT_REPORT_CARD_RECOVERY_LINES,
} from './districtReportCardConstants';
import {
  districtReportCardContainsForbiddenWords,
  isDistrictReportCardDuplicate,
  normalizeDistrictReportCardText,
} from './districtReportCardModel';
import type {
  DistrictReportCardDominantIssueKind,
  DistrictReportCardFullInput,
  DistrictReportCardLiteModel,
  DistrictReportPlayerStyleKind,
  DistrictReportPublicTone,
  DistrictReportRecentEvent,
  DistrictReportRecentEventTone,
  DistrictReportRecoveryState,
} from './districtReportCardTypes';

function safeDistrictArchiveEntries(
  archive: CityArchiveV1State | null | undefined,
  districtId: MapDistrictId,
  limit: number,
): CityArchiveEntry[] {
  if (!archive || !Array.isArray(archive.entries) || archive.entries.length === 0) {
    return [];
  }
  return selectDistrictArchiveEntries(archive, districtId, limit);
}

function cleanText(value: string, limit = 96): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function sanitize(text: string, fallback: string): string {
  const cleaned = cleanText(text);
  if (!cleaned || districtReportCardContainsForbiddenWords(cleaned)) {
    return cleanText(fallback);
  }
  return cleaned;
}

export function maxRecentEventsForDay(day: number): number {
  if (day <= 1) return 0;
  if (day <= 3) return 1;
  if (day <= 7) return 2;
  return DISTRICT_REPORT_CARD_FULL_MAX_RECENT_EVENTS;
}

function recentEventTone(entry: CityArchiveEntry): DistrictReportRecentEventTone {
  if (
    entry.kind === 'trust_recovery' ||
    entry.kind === 'comeback_completed' ||
    entry.kind === 'resource_recovery' ||
    entry.kind === 'container_relief'
  ) {
    return 'recovery';
  }
  if (
    entry.kind === 'resource_pressure' ||
    entry.kind === 'crisis_prevented' ||
    entry.kind === 'district_shift'
  ) {
    return 'warning';
  }
  if (entry.kind === 'social_response' || entry.kind === 'comeback_available') {
    return 'positive';
  }
  return 'neutral';
}

function archiveKindToIssueKind(kind: CityArchiveEntry['kind']): DistrictReportCardDominantIssueKind {
  switch (kind) {
    case 'route_balanced':
      return 'route_pressure';
    case 'container_relief':
      return 'container_pressure';
    case 'resource_pressure':
    case 'resource_recovery':
      return 'resource_balance';
    case 'social_response':
      return 'social_trust';
    case 'trust_recovery':
    case 'district_shift':
      return 'district_trust';
    case 'crisis_prevented':
      return 'crisis_prevention';
    case 'comeback_available':
    case 'comeback_completed':
      return 'recovery_momentum';
    case 'main_operation_started':
      return 'operation_scope';
    default:
      return 'stable_identity';
  }
}

export function mapArchiveEntryToRecentEvent(entry: CityArchiveEntry): DistrictReportRecentEvent {
  const title =
    entry.title ||
    DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS[archiveKindToIssueKind(entry.kind)] ||
    'Mahalle izi';
  return {
    id: entry.id,
    day: entry.day,
    kind: entry.kind,
    title: cleanText(title, 48),
    shortLine: cleanText(entry.shortLine),
    tone: recentEventTone(entry),
    sourceKind: entry.sourceKind,
    priority: entry.priority === 'milestone' || entry.priority === 'high' ? 'high' : entry.priority === 'medium' ? 'medium' : 'low',
  };
}

export function buildRecentEventsFromArchive(
  archive: CityArchiveV1State | null | undefined,
  districtId: MapDistrictId,
  maxEvents: number,
): DistrictReportRecentEvent[] {
  if (!archive || maxEvents <= 0 || !Array.isArray(archive.entries) || archive.entries.length === 0) {
    return [];
  }
  const entries = safeDistrictArchiveEntries(archive, districtId, maxEvents + 2);
  const seen = new Set<string>();
  const result: DistrictReportRecentEvent[] = [];
  for (const entry of entries) {
    const key = `${entry.kind}:${entry.sourceKind}:${normalizeDistrictReportCardText(entry.shortLine).slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(mapArchiveEntryToRecentEvent(entry));
    if (result.length >= maxEvents) break;
  }
  return result;
}

export function inferPublicTone(input: {
  archive?: CityArchiveV1State | null;
  districtId: MapDistrictId;
  trustBand?: CreviaDistrictTrustBand;
  socialPulseTrend?: string;
  carryOverResolved?: boolean;
  hasCrisisWatch?: boolean;
  resourcePressure?: 'none' | 'low' | 'medium' | 'high' | 'unknown';
}): DistrictReportPublicTone {
  const districtSummary = input.archive?.districtSummaries?.[input.districtId];
  if (districtSummary?.socialTone === 'positive') return 'thankful';
  if (districtSummary?.socialTone === 'watch' || districtSummary?.socialTone === 'strained') {
    return input.trustBand === 'recovering' || input.trustBand === 'improving' ? 'recovering' : 'strained';
  }

  const entries = safeDistrictArchiveEntries(input.archive, input.districtId, 4);
  if (entries.some((e) => e.kind === 'social_response')) return 'thankful';
  if (entries.some((e) => e.kind === 'comeback_completed' || e.kind === 'trust_recovery')) {
    return 'recovering';
  }
  if (entries.some((e) => e.kind === 'resource_pressure')) return 'watchful';

  if (input.socialPulseTrend === 'recovering' || input.socialPulseTrend === 'positive') return 'recovering';
  if (input.carryOverResolved) return 'calm';
  if (input.hasCrisisWatch) return 'watchful';
  if (input.trustBand === 'trusted' || input.trustBand === 'stable') return 'confident';
  if (input.trustBand === 'watch' || input.trustBand === 'strained') return 'watchful';
  if (input.trustBand === 'fragile') return 'frustrated_soft';
  if (input.resourcePressure === 'high' || input.resourcePressure === 'medium') return 'strained';
  return 'unknown';
}

export function inferPlayerStyleInDistrict(input: {
  archive?: CityArchiveV1State | null;
  districtId: MapDistrictId;
  advisorStyle?: string | null;
}): DistrictReportPlayerStyleKind {
  if (input.advisorStyle && input.advisorStyle in DISTRICT_REPORT_CARD_PLAYER_STYLE_LINES) {
    return input.advisorStyle as DistrictReportPlayerStyleKind;
  }

  const entries = safeDistrictArchiveEntries(input.archive, input.districtId, 6);
  const kinds = entries.map((e) => e.kind);
  if (kinds.filter((k) => k === 'decision_record' || k === 'trust_recovery').length >= 2) {
    return 'fast_responder';
  }
  if (kinds.includes('route_balanced')) return 'route_balancer';
  if (kinds.includes('social_response')) return 'social_trust_focused';
  if (kinds.includes('resource_pressure') || kinds.includes('resource_recovery')) {
    return 'resource_guardian';
  }
  if (kinds.includes('comeback_completed') || kinds.includes('trust_recovery')) {
    return 'recovery_builder';
  }
  if (entries.length >= 2) return 'balanced_operator';
  return 'unknown';
}

export function inferRecoveryState(input: {
  archive?: CityArchiveV1State | null;
  districtId: MapDistrictId;
  trustBand?: CreviaDistrictTrustBand;
  tomorrowRiskSoftened?: boolean;
  carryOverResolved?: boolean;
  rewardComebackLine?: string | null;
}): DistrictReportRecoveryState {
  const entries = safeDistrictArchiveEntries(input.archive, input.districtId, 5);
  if (entries.some((e) => e.kind === 'comeback_completed')) return 'comeback_completed';
  if (entries.some((e) => e.kind === 'comeback_available')) return 'comeback_available';
  if (entries.some((e) => e.kind === 'trust_recovery' || e.kind === 'resource_recovery')) {
    return 'recovering';
  }

  const reward = selectArchiveRewardComebackSummary(input.archive ?? null);
  if (reward?.recentComebackEntryIds.length) {
    const districtComeback = entries.some((e) => e.kind === 'comeback_available' || e.kind === 'comeback_completed');
    if (districtComeback) return 'comeback_available';
  }

  if (input.rewardComebackLine?.includes('toparlan')) return 'recovering';
  if (input.tomorrowRiskSoftened || input.carryOverResolved) return 'improving';
  if (input.trustBand === 'recovering' || input.trustBand === 'improving') return 'improving';
  if (input.trustBand === 'watch' || input.trustBand === 'strained') return 'still_under_watch';
  if (input.trustBand === 'stable' || input.trustBand === 'trusted') return 'stable';
  return 'unknown';
}

export function inferTrustTrend(
  archive: CityArchiveV1State | null | undefined,
  districtId: MapDistrictId,
): 'down' | 'flat' | 'up' | 'recovered' | 'unknown' {
  const summary = archive?.districtSummaries?.[districtId];
  if (summary?.trustTrend) return summary.trustTrend;
  const entries = safeDistrictArchiveEntries(archive, districtId, 3);
  if (entries.some((e) => e.trustDeltaBand === 'recovered')) return 'recovered';
  if (entries.some((e) => e.trustDeltaBand === 'up')) return 'up';
  if (entries.some((e) => e.trustDeltaBand === 'down')) return 'down';
  return 'unknown';
}

export function inferResourcePressureState(
  archive: CityArchiveV1State | null | undefined,
  districtId: MapDistrictId,
  lite: DistrictReportCardLiteModel,
): 'none' | 'low' | 'medium' | 'high' | 'unknown' {
  const entries = safeDistrictArchiveEntries(archive, districtId, 4);
  const bands = entries.map((e) => e.resourceImpactBand).filter(Boolean);
  if (bands.includes('high')) return 'high';
  if (bands.includes('medium')) return 'medium';
  if (bands.includes('low')) return 'low';
  if (lite.dominantIssueKind === 'vehicle_fatigue' || lite.dominantIssueKind === 'personnel_fatigue') {
    return 'medium';
  }
  if (lite.dominantIssueKind === 'resource_balance') return 'low';
  return 'none';
}

export function buildEceDistrictLineFromArchive(input: {
  archive?: CityArchiveV1State | null;
  districtId: MapDistrictId;
  districtName: string;
  dominantIssueKind: DistrictReportCardDominantIssueKind;
  publicTone: DistrictReportPublicTone;
  playerStyle: DistrictReportPlayerStyleKind;
  liteEceLine?: string;
  existingLines: string[];
}): string | undefined {
  const eceSummary = selectArchiveEceRelationshipSummary(input.archive ?? null);
  const districtSummary = input.archive?.districtSummaries?.[input.districtId];
  const entries = safeDistrictArchiveEntries(input.archive, input.districtId, 3);

  const candidates: string[] = [];

  if (districtSummary?.eceDistrictNote) {
    candidates.push(`Ece, ${input.districtName}'de ${districtSummary.eceDistrictNote}`);
  }

  const archiveEce = entries.find((e) => e.eceLine)?.eceLine;
  if (archiveEce) {
    candidates.push(archiveEce.startsWith('Ece') ? archiveEce : `Ece, ${archiveEce}`);
  }

  if (input.dominantIssueKind === 'container_pressure' || input.dominantIssueKind === 'environmental_care') {
    candidates.push(
      `Ece, ${input.districtName}'te çevre baskısının sakin ama kalıcı takip istediğini söylüyor.`,
    );
  } else if (input.dominantIssueKind === 'route_pressure' || input.dominantIssueKind === 'vehicle_fatigue') {
    candidates.push(
      `Ece, ${input.districtName}'de rota kararlarının işe yaradığını ama araç temposunu fazla zorlamaman gerektiğini not ediyor.`,
    );
  } else if (input.dominantIssueKind === 'social_trust' || input.dominantIssueKind === 'district_trust') {
    candidates.push(
      `Ece, ${input.districtName}'te sosyal güven toparlanırken görünür hizmeti korumayı öneriyor.`,
    );
  } else if (input.publicTone === 'recovering' || input.playerStyle === 'recovery_builder') {
    candidates.push(
      `Ece, ${input.districtName}'te toparlanma çizgisini koruyan adımları öneriyor.`,
    );
  }

  if (eceSummary?.trustedPatterns.length) {
    candidates.push(
      `Ece, ${input.districtName}'te ${eceSummary.trustedPatterns[0]} çizgisini tanıdığını söylüyor.`,
    );
  }

  if (input.liteEceLine) {
    candidates.push(input.liteEceLine);
  }

  for (const candidate of candidates) {
    const line = sanitize(candidate, `Ece, ${input.districtName} için dengeli adımları öneriyor.`);
    if (!isDistrictReportCardDuplicate(line, input.existingLines)) {
      return line;
    }
  }

  return undefined;
}

export function mapLiteVisibilityToFull(
  visibility: DistrictReportCardLiteModel['visibility'],
): import('./districtReportCardTypes').DistrictReportCardFullVisibility {
  if (visibility === 'detailed_preview') return 'full_preview';
  return visibility;
}

export function collectArchiveGuardLines(input: DistrictReportCardFullInput): string[] {
  return [
    ...(input.existingLines ?? []),
    ...(input.mapIntelligenceLines ?? []),
    input.mainOperationScopeHintLine ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    input.cityEcho?.socialLine ?? '',
    input.cityEcho?.reportLine ?? '',
    input.cityEcho?.eceLine ?? '',
    input.cityEcho?.hubLine ?? '',
    input.advisorRelationshipLine ?? '',
    input.rewardComebackLine ?? '',
    input.mapReactionLine ?? '',
    input.operationalResourceLine ?? '',
  ].filter(Boolean);
}
