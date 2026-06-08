import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import { convertArchiveEntryToJournalEntry } from '@/core/cityArchive/cityArchivePresentation';
import { selectPlayerVisibleArchiveEntriesForJournal } from '@/core/cityArchive/cityArchiveSelectors';
import { filterArchiveEntriesForJournalDisplay } from '@/core/cityArchive/cityArchiveSurfaceWiring';

import {
  CITY_JOURNAL_EARLY_MAX_DAY,
  CITY_JOURNAL_ENTRY_FRAGMENTS,
  CITY_JOURNAL_KIND_DEFAULT_PRIORITY,
  CITY_JOURNAL_KIND_DEFAULT_TONE,
  CITY_JOURNAL_KIND_PRIORITY,
  CITY_JOURNAL_LITE_DISTRICT_IDS,
  CITY_JOURNAL_LITE_EMPTY_DAY1,
  CITY_JOURNAL_LITE_EMPTY_EARLY,
  CITY_JOURNAL_LITE_EMPTY_FALLBACK,
  CITY_JOURNAL_LITE_FORBIDDEN_WORDS,
  CITY_JOURNAL_LITE_HUB_MAX_ENTRIES,
  CITY_JOURNAL_LITE_MAX_COPY_LENGTH,
  CITY_JOURNAL_LITE_PROFILE_MAX_ENTRIES,
  CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES,
  CITY_JOURNAL_LITE_SUMMARY_RECENT,
  CITY_JOURNAL_MAIN_OPERATION_FRAGMENT,
  CITY_JOURNAL_OPENING_DAY,
  CITY_JOURNAL_PACK_FRAGMENTS,
  CITY_JOURNAL_PILOT_MAX_DAY,
  CITY_JOURNAL_SOURCE_PRIORITY,
} from './cityJournalConstants';
import type {
  CityJournalLiteEntry,
  CityJournalLiteEntryKind,
  CityJournalLiteInput,
  CityJournalLiteModel,
  CityJournalLitePriority,
  CityJournalLiteSourceKind,
  CityJournalLiteSourceSignals,
  CityJournalLiteVisibility,
} from './cityJournalTypes';

type DraftEntry = Omit<CityJournalLiteEntry, 'id' | 'line' | 'title'> & {
  fragment: string;
  score: number;
};

function cleanText(value: string, limit = CITY_JOURNAL_LITE_MAX_COPY_LENGTH): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function normalizeCityJournalText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cityJournalContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeCityJournalText(text);
  return CITY_JOURNAL_LITE_FORBIDDEN_WORDS.some((word) =>
    normalized.includes(normalizeCityJournalText(word)),
  );
}

export function isCityJournalDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeCityJournalText(line);
  return existingLines.some((existing) => {
    const other = normalizeCityJournalText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 20 && other.includes(normalized.slice(0, 20))) return true;
    if (other.length >= 20 && normalized.includes(other.slice(0, 20))) return true;
    return false;
  });
}

export function buildCityJournalLiteDuplicateKey(entry: Pick<
  CityJournalLiteEntry,
  'day' | 'districtId' | 'kind' | 'sourceKind' | 'contentPackFamilyId'
>): string {
  return [
    entry.day,
    entry.districtId ?? 'city',
    entry.kind,
    entry.sourceKind,
    entry.contentPackFamilyId ?? '',
  ].join('|');
}

function resolveDistrictId(
  input: CityJournalLiteInput,
  fallback: MapDistrictId = 'merkez',
): MapDistrictId {
  const raw =
    input.focusDistrictId ??
    input.operationSignals?.priorityDistrictId ??
    input.districtReportCard?.districtId ??
    input.contentPackMeta?.districtId ??
    input.decisionImpact?.relatedDistrictId ??
    input.tomorrowRisk?.relatedDistrictId ??
    fallback;
  if (CITY_JOURNAL_LITE_DISTRICT_IDS.includes(raw as MapDistrictId)) {
    return raw as MapDistrictId;
  }
  return fallback;
}

function districtName(id: MapDistrictId): string {
  return DISTRICT_IDENTITIES[id]?.name ?? getNeighborhoodDisplayName(id);
}

function formatJournalLine(day: number, fragment: string): string {
  return cleanText(`Gün ${day}: ${fragment}`);
}

function entryTitle(kind: CityJournalLiteEntryKind): string {
  switch (kind) {
    case 'main_operation_started':
      return 'Ana operasyon';
    case 'route_balanced':
      return 'Rota dengesi';
    case 'container_followup':
      return 'Konteyner izi';
    case 'social_trust_recovered':
      return 'Sosyal güven';
    case 'carry_over_created':
    case 'carry_over_resolved':
      return 'Taşınan iz';
    default:
      return 'Şehir izi';
  }
}

function scoreDraft(
  kind: CityJournalLiteEntryKind,
  sourceKind: CityJournalLiteSourceKind,
  priority: CityJournalLitePriority,
): number {
  const kindScore = CITY_JOURNAL_KIND_PRIORITY[kind] ?? 50;
  const sourceScore = CITY_JOURNAL_SOURCE_PRIORITY[sourceKind] ?? 50;
  const priorityScore = priority === 'high' ? 0 : priority === 'medium' ? 5 : 10;
  return kindScore + sourceScore + priorityScore;
}

function pushDraft(
  drafts: DraftEntry[],
  draft: Omit<DraftEntry, 'score'>,
): void {
  if (cityJournalContainsForbiddenWords(draft.fragment)) return;
  drafts.push({
    ...draft,
    score: scoreDraft(draft.kind, draft.sourceKind, draft.priority),
  });
}

function inferPackFragment(
  packId: string | undefined,
  domain: string | undefined,
): keyof typeof CITY_JOURNAL_PACK_FRAGMENTS {
  const normalized = `${packId ?? ''} ${domain ?? ''}`.toLocaleLowerCase('tr-TR');
  if (normalized.includes('vehicle') || normalized.includes('route')) return 'route';
  if (normalized.includes('container')) return 'container';
  if (normalized.includes('social')) return 'social';
  if (normalized.includes('environment') || normalized.includes('yesil')) return 'environment';
  return 'district';
}

function collectDraftEntries(input: CityJournalLiteInput, day: number): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  const districtId = resolveDistrictId(input);
  const name = districtName(districtId);

  if (day === CITY_JOURNAL_OPENING_DAY || (input.isPostPilot && day >= POST_PILOT_FIRST_OPERATION_DAY)) {
    pushDraft(drafts, {
      day,
      fragment: CITY_JOURNAL_MAIN_OPERATION_FRAGMENT,
      districtId,
      districtName: name,
      domain: 'operation',
      kind: 'main_operation_started',
      tone: 'operation',
      sourceKind: 'main_operation_feel',
      priority: 'high',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  const carry = input.carryOverMemory;
  if (carry?.visible && carry.summary) {
    const resolved =
      carry.direction === 'positive_memory' ||
      carry.tone === 'positive' ||
      carry.primaryTag.toLocaleLowerCase('tr-TR').includes('cozul');
    const carryDistrict = carry.districtLabel
      ? carry.districtLabel.replace(/ mahalle.*/i, '').trim()
      : name;
    pushDraft(drafts, {
      day,
      fragment: resolved
        ? CITY_JOURNAL_ENTRY_FRAGMENTS.carry_over_resolved(carryDistrict)
        : CITY_JOURNAL_ENTRY_FRAGMENTS.carry_over_created(carryDistrict),
      districtId,
      districtName: carryDistrict,
      domain: carry.domain,
      kind: resolved ? 'carry_over_resolved' : 'carry_over_created',
      tone: resolved ? 'positive' : 'watch',
      sourceKind: 'carry_over',
      priority: resolved ? 'high' : 'medium',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  const tomorrow = input.tomorrowRisk;
  if (tomorrow?.mainLine) {
    const domain = tomorrow.relatedDomain ?? 'city';
    let kind: CityJournalLiteEntryKind = 'resource_pressure_noted';
    if (domain === 'route') kind = 'route_balanced';
    if (domain === 'container') kind = 'container_followup';
    if (domain === 'social') kind = 'social_trust_recovered';
    if (domain === 'crisis') kind = 'crisis_prevented';
    if (domain === 'operation') kind = 'operation_scope_expanded';
    const tomorrowDistrict = tomorrow.relatedDistrictId
      ? districtName(tomorrow.relatedDistrictId as MapDistrictId)
      : name;
    const fragment =
      kind === 'route_balanced'
        ? `${tomorrowDistrict} rotası izleme notuna alındı.`
        : kind === 'container_followup'
          ? `${tomorrowDistrict} konteyner çevresi takipte kaldı.`
          : kind === 'social_trust_recovered'
            ? `${tomorrowDistrict}'te sosyal güven çizgisi günlüğe işlendi.`
            : `${tomorrowDistrict} hattı yarına taşınan izleme notuna alındı.`;
    pushDraft(drafts, {
      day,
      fragment,
      districtId: (tomorrow.relatedDistrictId as MapDistrictId | undefined) ?? districtId,
      districtName: tomorrowDistrict,
      domain,
      kind,
      tone: 'watch',
      sourceKind: 'tomorrow_risk',
      priority: tomorrow.priority,
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  const impact = input.decisionImpact;
  if (impact?.mainLine) {
    let kind: CityJournalLiteEntryKind = 'fallback';
    switch (impact.kind) {
      case 'route_balance':
        kind = 'route_balanced';
        break;
      case 'container_pressure':
        kind = 'container_followup';
        break;
      case 'district_trust_shift':
        kind = 'district_trust_shift';
        break;
      case 'social_response':
      case 'recovery_signal':
        kind = 'social_trust_recovered';
        break;
      case 'crisis_prevention':
        kind = 'crisis_prevented';
        break;
      case 'resource_pressure':
        kind = 'resource_pressure_noted';
        break;
      case 'positive_tradeoff':
        kind = 'recovery_momentum';
        break;
      default:
        kind = 'visible_service_improved';
    }
    const impactDistrict = impact.relatedDistrictId
      ? districtName(impact.relatedDistrictId as MapDistrictId)
      : name;
    const fragment =
      kind in CITY_JOURNAL_ENTRY_FRAGMENTS
        ? CITY_JOURNAL_ENTRY_FRAGMENTS[kind as keyof typeof CITY_JOURNAL_ENTRY_FRAGMENTS](impactDistrict)
        : `${impactDistrict} kararı günlüğe işlendi.`;
    pushDraft(drafts, {
      day,
      fragment,
      districtId: (impact.relatedDistrictId as MapDistrictId | undefined) ?? districtId,
      districtName: impactDistrict,
      domain: impact.relatedDomain,
      kind,
      tone: CITY_JOURNAL_KIND_DEFAULT_TONE[kind],
      sourceKind: 'decision_impact',
      priority: 'medium',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  const card = input.districtReportCard;
  if (card?.recentEffectLine || card?.dominantIssueLine) {
    const cardDistrict = card.districtName ?? name;
    let kind: CityJournalLiteEntryKind = 'district_trust_shift';
    switch (card.dominantIssueKind) {
      case 'route_pressure':
        kind = 'route_balanced';
        break;
      case 'container_pressure':
        kind = 'container_followup';
        break;
      case 'social_trust':
        kind = 'social_trust_recovered';
        break;
      case 'visible_service':
        kind = 'visible_service_improved';
        break;
      case 'recovery_momentum':
        kind = 'recovery_momentum';
        break;
      case 'environmental_care':
        kind = 'resource_pressure_noted';
        break;
      default:
        kind = 'district_trust_shift';
    }
    const fragment =
      kind in CITY_JOURNAL_ENTRY_FRAGMENTS
        ? CITY_JOURNAL_ENTRY_FRAGMENTS[kind as keyof typeof CITY_JOURNAL_ENTRY_FRAGMENTS](cardDistrict)
        : `${cardDistrict} mahalle dengesi kayda geçti.`;
    pushDraft(drafts, {
      day,
      fragment,
      districtId: card.districtId,
      districtName: cardDistrict,
      domain: card.dominantIssueKind,
      kind,
      tone: CITY_JOURNAL_KIND_DEFAULT_TONE[kind],
      sourceKind: 'district_memory',
      priority: card.priority,
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  const pack = input.contentPackMeta;
  if (pack) {
    const packDistrict = districtName(pack.districtId as MapDistrictId);
    const packKey = inferPackFragment(pack.packId, pack.domain);
    pushDraft(drafts, {
      day,
      fragment: CITY_JOURNAL_PACK_FRAGMENTS[packKey](packDistrict),
      districtId: pack.districtId as MapDistrictId,
      districtName: packDistrict,
      domain: pack.domain,
      kind:
        packKey === 'route'
          ? 'route_balanced'
          : packKey === 'container'
            ? 'container_followup'
            : packKey === 'social'
              ? 'social_trust_recovered'
              : 'district_trust_shift',
      tone: 'watch',
      sourceKind: 'content_pack',
      priority: 'medium',
      createdFromDay: day,
      maxVisibleLines: 1,
      contentPackFamilyId: pack.familyId,
    });
  }

  const signals = input.operationSignals;
  if (signals) {
    const signalDistrict = signals.priorityDistrictId
      ? districtName(signals.priorityDistrictId as MapDistrictId)
      : name;
    if (signals.vehicles?.status === 'critical' || signals.vehicles?.status === 'strained') {
      pushDraft(drafts, {
        day,
        fragment: `${signalDistrict} rotası izleme notuna alındı.`,
        districtId: (signals.priorityDistrictId as MapDistrictId | undefined) ?? districtId,
        districtName: signalDistrict,
        domain: 'route',
        kind: 'route_balanced',
        tone: 'watch',
        sourceKind: 'fallback',
        priority: 'low',
        createdFromDay: day,
        maxVisibleLines: 1,
      });
    } else if (
      signals.containers?.status === 'critical' ||
      signals.containers?.status === 'watch'
    ) {
      pushDraft(drafts, {
        day,
        fragment: `${signalDistrict} konteyner çevresi takipte kaldı.`,
        districtId: (signals.priorityDistrictId as MapDistrictId | undefined) ?? districtId,
        districtName: signalDistrict,
        domain: 'container',
        kind: 'container_followup',
        tone: 'watch',
        sourceKind: 'fallback',
        priority: 'low',
        createdFromDay: day,
        maxVisibleLines: 1,
      });
    } else if (signals.overall?.status === 'stable' || signals.overall?.status === 'steady') {
      pushDraft(drafts, {
        day,
        fragment: `${signalDistrict} rotası dengelendi.`,
        districtId: (signals.priorityDistrictId as MapDistrictId | undefined) ?? districtId,
        districtName: signalDistrict,
        domain: 'route',
        kind: 'route_balanced',
        tone: 'recovery',
        sourceKind: 'fallback',
        priority: 'low',
        createdFromDay: day,
        maxVisibleLines: 1,
      });
    }
  }

  if (input.socialPulse?.trend === 'up' || (input.socialPulse?.globalPulseScore ?? 0) >= 65) {
    pushDraft(drafts, {
      day,
      fragment: CITY_JOURNAL_ENTRY_FRAGMENTS.social_trust_recovered(name),
      districtId,
      districtName: name,
      domain: 'social',
      kind: 'social_trust_recovered',
      tone: 'positive',
      sourceKind: 'city_echo',
      priority: 'medium',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  if (input.lastDailyReport || input.currentDailyReport) {
    pushDraft(drafts, {
      day,
      fragment: `${name} gün sonu raporu günlüğe işlendi.`,
      districtId,
      districtName: name,
      domain: 'city',
      kind: 'visible_service_improved',
      tone: 'neutral',
      sourceKind: 'daily_report',
      priority: 'low',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  if (drafts.length === 0) {
    pushDraft(drafts, {
      day,
      fragment: `${name} operasyon izi günlüğe işlendi.`,
      districtId,
      districtName: name,
      domain: 'city',
      kind: 'fallback',
      tone: 'neutral',
      sourceKind: 'fallback',
      priority: 'low',
      createdFromDay: day,
      maxVisibleLines: 1,
    });
  }

  return drafts;
}

export function buildCityJournalLiteVisibility(input: CityJournalLiteInput): {
  visibility: CityJournalLiteVisibility;
  maxEntries: number;
  shouldShowInHub: boolean;
  shouldShowInReport: boolean;
  shouldShowInProfile: boolean;
  shouldShowInMap: boolean;
} {
  const day = input.currentDay ?? 1;
  const fullMain =
    input.accessMode === 'full' || input.postPilotPhase === 'main_operation_full';

  if (day <= 1) {
    return {
      visibility: 'hidden',
      maxEntries: 0,
      shouldShowInHub: false,
      shouldShowInReport: false,
      shouldShowInProfile: false,
      shouldShowInMap: false,
    };
  }

  if (day <= CITY_JOURNAL_EARLY_MAX_DAY) {
    return {
      visibility: 'compact',
      maxEntries: 1,
      shouldShowInHub: true,
      shouldShowInReport: day >= 2,
      shouldShowInProfile: false,
      shouldShowInMap: false,
    };
  }

  if (day <= CITY_JOURNAL_PILOT_MAX_DAY) {
    return {
      visibility: day >= 5 ? 'standard' : 'compact',
      maxEntries: 3,
      shouldShowInHub: true,
      shouldShowInReport: true,
      shouldShowInProfile: false,
      shouldShowInMap: false,
    };
  }

  if (fullMain && day >= CITY_JOURNAL_OPENING_DAY) {
    return {
      visibility: 'timeline_preview',
      maxEntries: CITY_JOURNAL_LITE_PROFILE_MAX_ENTRIES,
      shouldShowInHub: true,
      shouldShowInReport: true,
      shouldShowInProfile: true,
      shouldShowInMap: true,
    };
  }

  return {
    visibility: 'standard',
    maxEntries: day >= 9 ? CITY_JOURNAL_LITE_PROFILE_MAX_ENTRIES : 3,
    shouldShowInHub: true,
    shouldShowInReport: true,
    shouldShowInProfile: day >= 9,
    shouldShowInMap: day >= 9,
  };
}

function finalizeEntries(
  drafts: DraftEntry[],
  input: CityJournalLiteInput,
  maxEntries: number,
): CityJournalLiteEntry[] {
  const existing = input.existingLines ?? [];
  const usedDistrictDomain = new Set<string>();
  const entries: CityJournalLiteEntry[] = [];

  const sorted = [...drafts].sort((a, b) => a.score - b.score);

  for (const draft of sorted) {
    if (entries.length >= maxEntries) break;

    const districtDomainKey = `${draft.districtId ?? 'city'}|${draft.domain ?? draft.kind}`;
    if (usedDistrictDomain.has(districtDomainKey) && draft.kind !== 'main_operation_started') {
      continue;
    }

    const line = formatJournalLine(draft.day, draft.fragment);
    if (isCityJournalDuplicate(line, [...existing, ...entries.map((e) => e.line)])) {
      continue;
    }

    const entry: CityJournalLiteEntry = {
      id: `city_journal_${draft.day}_${draft.kind}_${entries.length}`,
      day: draft.day,
      title: entryTitle(draft.kind),
      line,
      districtId: draft.districtId,
      districtName: draft.districtName,
      domain: draft.domain,
      kind: draft.kind,
      tone: draft.tone,
      sourceKind: draft.sourceKind,
      priority: draft.priority,
      createdFromDay: draft.createdFromDay,
      maxVisibleLines: draft.maxVisibleLines,
      contentPackFamilyId: draft.contentPackFamilyId,
    };

    entries.push(entry);
    usedDistrictDomain.add(districtDomainKey);
  }

  return entries;
}

function buildSourceSignals(input: CityJournalLiteInput): CityJournalLiteSourceSignals {
  return {
    hasDailyReport: Boolean(input.lastDailyReport || input.currentDailyReport),
    hasCarryOver: Boolean(input.carryOverMemory?.visible),
    hasDecisionImpact: Boolean(input.decisionImpact?.mainLine),
    hasTomorrowRisk: Boolean(input.tomorrowRisk?.mainLine),
    hasCityEcho: Boolean(input.cityEcho?.hubLine || input.cityEcho?.reportLine),
    hasDistrictMemory: Boolean(input.districtMemoryRuntime),
    hasDistrictTrust: Boolean(input.districtTrustRuntime),
    hasContentPack: Boolean(input.contentPackMeta),
    hasMainOperationFeel: Boolean(input.mainOperationFeel),
    hasOperationSignals: Boolean(input.operationSignals),
    hasDistrictReportCard: Boolean(input.districtReportCard),
  };
}

export function buildCityJournalLiteModel(input: CityJournalLiteInput = {}): CityJournalLiteModel {
  const day = input.currentDay ?? 1;
  const visibilityConfig = buildCityJournalLiteVisibility(input);
  const sourceSignals = buildSourceSignals(input);

  if (visibilityConfig.visibility === 'hidden') {
    return {
      currentDay: day,
      visibility: 'hidden',
      entries: [],
      summaryLine: CITY_JOURNAL_LITE_EMPTY_DAY1,
      emptyLine: CITY_JOURNAL_LITE_EMPTY_DAY1,
      sourceSignals,
      maxEntries: 0,
      duplicateKey: `hidden|${day}`,
      shouldShowInHub: false,
      shouldShowInReport: false,
      shouldShowInProfile: false,
      shouldShowInMap: false,
    };
  }

  const archiveEntries = input.cityArchive
    ? filterArchiveEntriesForJournalDisplay(
        selectPlayerVisibleArchiveEntriesForJournal(
          input.cityArchive,
          visibilityConfig.maxEntries + 2,
          day,
        ),
        visibilityConfig.maxEntries,
      ).map((entry, index) => convertArchiveEntryToJournalEntry(entry, index))
    : [];

  const drafts = collectDraftEntries(input, day);
  const derivedEntries = finalizeEntries(drafts, input, visibilityConfig.maxEntries);

  const entries =
    archiveEntries.length > 0
      ? archiveEntries.slice(0, visibilityConfig.maxEntries)
      : derivedEntries;

  const summaryLine =
    entries.length > 0 ? entries[0]!.line : CITY_JOURNAL_LITE_SUMMARY_RECENT;
  const emptyLine =
    day <= CITY_JOURNAL_EARLY_MAX_DAY
      ? CITY_JOURNAL_LITE_EMPTY_EARLY
      : CITY_JOURNAL_LITE_EMPTY_FALLBACK;

  const duplicateKey =
    entries.length > 0
      ? buildCityJournalLiteDuplicateKey(entries[0]!)
      : `empty|${day}`;

  return {
    currentDay: day,
    visibility: visibilityConfig.visibility,
    entries,
    summaryLine: entries.length > 0 ? summaryLine : emptyLine,
    emptyLine,
    sourceSignals,
    maxEntries: visibilityConfig.maxEntries,
    duplicateKey,
    shouldShowInHub: visibilityConfig.shouldShowInHub && entries.length > 0,
    shouldShowInReport: visibilityConfig.shouldShowInReport && entries.length > 0,
    shouldShowInProfile: visibilityConfig.shouldShowInProfile && entries.length > 0,
    shouldShowInMap: visibilityConfig.shouldShowInMap && entries.length > 0,
  };
}

export function shouldShowCityJournalLite(model: CityJournalLiteModel | null | undefined): boolean {
  return Boolean(model && model.visibility !== 'hidden' && model.entries.length > 0);
}

export function collectCityJournalVisibleLines(model: CityJournalLiteModel | null | undefined): string[] {
  if (!model) return [];
  return model.entries.map((entry) => entry.line);
}
