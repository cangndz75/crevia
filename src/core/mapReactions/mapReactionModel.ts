import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildCityJournalMapHint } from '@/core/cityJournal/cityJournalPresentation';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  MAP_REACTION_KIND_ICON,
  MAP_REACTION_KIND_LABELS,
  MAP_REACTION_KIND_PRIORITY_SCORE,
  MAP_REACTION_KIND_PULSE,
  MAP_REACTION_KIND_TONE,
  MAP_REACTION_LITE_DISTRICT_FALLBACK_LINES,
  MAP_REACTION_LITE_DISTRICT_IDS,
  MAP_REACTION_LITE_DISTRICT_LABELS,
  MAP_REACTION_LITE_FALLBACK_GLOBAL,
  MAP_REACTION_LITE_FORBIDDEN_WORDS,
  MAP_REACTION_LITE_MAX_COPY_LENGTH,
  MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_COMPACT,
  MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_EARLY,
  MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_LATE,
  MAP_REACTION_SIGNAL_STATUS_WEIGHT,
} from './mapReactionConstants';
import type {
  MapDistrictReaction,
  MapDistrictReactionKind,
  MapDistrictReactionPriority,
  MapDistrictReactionSourceKind,
  MapReactionLiteInput,
  MapReactionLiteModel,
  MapReactionLiteSourceSignals,
  MapReactionLiteVisibility,
} from './mapReactionTypes';

type ReactionDraft = Omit<MapDistrictReaction, 'id' | 'maxVisibleLines'> & {
  score: number;
};

function cleanText(value: string | null | undefined, limit = MAP_REACTION_LITE_MAX_COPY_LENGTH): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function normalizeMapReactionText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapReactionContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeMapReactionText(text);
  return MAP_REACTION_LITE_FORBIDDEN_WORDS.some((word) =>
    normalized.includes(normalizeMapReactionText(word)),
  );
}

export function isMapReactionDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeMapReactionText(line);
  return existingLines.some((existing) => {
    const other = normalizeMapReactionText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 20 && other.includes(normalized.slice(0, 20))) return true;
    if (other.length >= 20 && normalized.includes(other.slice(0, 20))) return true;
    return false;
  });
}

function sanitizeCopy(text: string, fallback: string): string {
  const cleaned = cleanText(text);
  if (!cleaned || mapReactionContainsForbiddenWords(cleaned)) {
    return cleanText(fallback);
  }
  return cleaned;
}

function resolveDistrictId(input: MapReactionLiteInput): MapDistrictId {
  const raw =
    input.selectedDistrictId ??
    input.operationSignals?.priorityDistrictId ??
    input.districtReportCard?.districtId ??
    input.contentPackMeta?.districtId ??
    'merkez';
  return normalizeMapDistrictId(raw) ?? 'merkez';
}

function districtName(id: MapDistrictId): string {
  return MAP_REACTION_LITE_DISTRICT_LABELS[id] ?? id;
}

function signalWeight(status?: string): number {
  return MAP_REACTION_SIGNAL_STATUS_WEIGHT[status ?? 'stable'] ?? 0;
}

function priorityFromScore(score: number): MapDistrictReactionPriority {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

function buildReactionDraft(params: {
  districtId: MapDistrictId;
  kind: MapDistrictReactionKind;
  sourceKind: MapDistrictReactionSourceKind;
  shortLine: string;
  label?: string;
  scoreBoost?: number;
  intensity?: MapDistrictReaction['intensity'];
  selectedBoost?: boolean;
}): ReactionDraft {
  const name = districtName(params.districtId);
  const kind = params.kind;
  const score =
    MAP_REACTION_KIND_PRIORITY_SCORE[kind] +
    (params.scoreBoost ?? 0) +
    (params.selectedBoost ? 12 : 0);
  const shortLine = sanitizeCopy(
    params.shortLine,
    MAP_REACTION_LITE_DISTRICT_FALLBACK_LINES[params.districtId],
  );

  return {
    districtId: params.districtId,
    districtName: name,
    kind,
    tone: MAP_REACTION_KIND_TONE[kind],
    intensity: params.intensity ?? (score >= 95 ? 'high' : score >= 75 ? 'medium' : 'low'),
    label: params.label ?? MAP_REACTION_KIND_LABELS[kind],
    shortLine,
    iconKey: MAP_REACTION_KIND_ICON[kind],
    pulseStyle: MAP_REACTION_KIND_PULSE[kind],
    shouldAnimate: MAP_REACTION_KIND_PULSE[kind] !== 'none',
    animationHint: MAP_REACTION_KIND_PULSE[kind] === 'none' ? undefined : 'soft_pulse',
    sourceKind: params.sourceKind,
    priority: priorityFromScore(score),
    duplicateKey: [params.districtId, kind, params.sourceKind].join(':'),
    score,
  };
}

function pushIfUnique(
  drafts: ReactionDraft[],
  draft: ReactionDraft | null,
  existingLines: string[],
): void {
  if (!draft) return;
  if (isMapReactionDuplicate(draft.shortLine, existingLines)) return;
  if (drafts.some((d) => d.duplicateKey === draft.duplicateKey)) return;
  if (drafts.some((d) => d.districtId === draft.districtId && d.kind === draft.kind)) return;
  drafts.push(draft);
}

function collectGuardLines(input: MapReactionLiteInput): string[] {
  return [
    ...(input.existingLines ?? []),
    ...(input.mapIntelligenceLines ?? []),
    ...(input.districtReportCardLines ?? []),
    ...(input.resourceOverlayLines ?? []),
    input.districtReportCard?.dominantIssueLine ?? '',
    input.districtReportCard?.recentEffectLine ?? '',
    input.districtReportCard?.eceLine ?? '',
    input.resourcePresenceMapLine ?? '',
    input.mainOperationFeelMapHint ?? '',
    input.mainOperationScopeHintLine ?? '',
    input.tomorrowRiskLine ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    ...(input.cityEchoLines ?? []),
    input.cityEcho?.socialLine ?? '',
    input.cityEcho?.reportLine ?? '',
    input.cityEcho?.eceLine ?? '',
  ].filter(Boolean);
}

export function buildMapReactionLiteVisibility(input: MapReactionLiteInput = {}): MapReactionLiteVisibility {
  const day = input.day ?? 1;
  if (day <= 1) return 'hidden';
  if (day <= 3) return 'compact';
  return 'standard';
}

function maxVisibleReactions(visibility: MapReactionLiteVisibility, day: number): number {
  if (visibility === 'hidden') return 0;
  if (visibility === 'compact') return MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_COMPACT;
  if (day >= POST_PILOT_FIRST_OPERATION_DAY) {
    return MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_LATE;
  }
  return MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_EARLY;
}

function buildDrafts(input: MapReactionLiteInput, selectedId: MapDistrictId): ReactionDraft[] {
  const guard = collectGuardLines(input);
  const drafts: ReactionDraft[] = [];
  const selectedBoost = (districtId: MapDistrictId) => districtId === selectedId;

  const carry = input.carryOverMemory;
  if (carry?.visible !== false && carry?.summary) {
    const carryDistrict = normalizeMapDistrictId(carry.districtLabel ?? selectedId) ?? selectedId;
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: carryDistrict,
        kind: 'risk_ring',
        sourceKind: 'carry_over',
        shortLine: `${districtName(carryDistrict)} çevresinde taşınan iz izleniyor.`,
        scoreBoost: 8,
        selectedBoost: selectedBoost(carryDistrict),
      }),
      [...guard, carry.summary],
    );
  }

  const tomorrow = input.tomorrowRisk;
  if (tomorrow?.mainLine) {
    const riskDistrict =
      normalizeMapDistrictId(tomorrow.relatedDistrictId ?? selectedId) ?? selectedId;
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: riskDistrict,
        kind: 'risk_ring',
        sourceKind: 'tomorrow_risk',
        shortLine: `${districtName(riskDistrict)} hattı yarına izleme notunda.`,
        scoreBoost: 10,
        selectedBoost: selectedBoost(riskDistrict),
      }),
      [...guard, tomorrow.mainLine],
    );
  }

  const reportCard = input.districtReportCard;
  if (reportCard?.dominantIssueKind && reportCard.districtId) {
    const kindMap: Partial<Record<string, MapDistrictReactionKind>> = {
      route_pressure: 'route_pressure_marker',
      container_pressure: 'container_pressure_marker',
      personnel_fatigue: 'team_capacity_marker',
      vehicle_fatigue: 'vehicle_capacity_marker',
      social_trust: 'social_bubble',
      district_trust: 'trust_pulse',
      recovery_momentum: 'recovery_glow',
      crisis_prevention: 'crisis_watch_ring',
      operation_scope: 'operation_scope_marker',
    };
    const kind = kindMap[reportCard.dominantIssueKind] ?? 'content_pack_marker';
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: reportCard.districtId,
        kind,
        sourceKind: 'district_report_card',
        shortLine: `${reportCard.districtName} çevresinde ${MAP_REACTION_KIND_LABELS[kind].toLocaleLowerCase('tr-TR')} sinyali var.`,
        scoreBoost: 6,
        selectedBoost: selectedBoost(reportCard.districtId),
      }),
      [...guard, reportCard.dominantIssueLine, reportCard.recentEffectLine ?? ''],
    );
  }

  const presence = input.operationalResourcePresence;
  if (presence && presence.visibility !== 'hidden') {
    for (const team of presence.teamGroups.slice(0, 2)) {
      const district =
        normalizeMapDistrictId(team.districtFocus ?? selectedId) ?? selectedId;
      if (team.priority === 'high' || team.workloadBand !== 'low') {
        pushIfUnique(
          drafts,
          buildReactionDraft({
            districtId: district,
            kind: 'team_capacity_marker',
            sourceKind: 'resource_presence',
            shortLine: `Ekip temposu ${districtName(district)} çevresinde yükseldi.`,
            scoreBoost: team.priority === 'high' ? 8 : 4,
            selectedBoost: selectedBoost(district),
          }),
          [...guard, presence.mapPresenceLine ?? '', team.line],
        );
      }
    }
    for (const vehicle of presence.vehicleGroups.slice(0, 2)) {
      const district =
        normalizeMapDistrictId(vehicle.districtFocus ?? selectedId) ?? selectedId;
      const kind =
        vehicle.status === 'route_pressure'
          ? 'route_pressure_marker'
          : vehicle.status === 'fatigue_watch'
            ? 'resource_fatigue_marker'
            : 'vehicle_capacity_marker';
      if (vehicle.priority === 'high' || vehicle.capacityBand !== 'low') {
        pushIfUnique(
          drafts,
          buildReactionDraft({
            districtId: district,
            kind,
            sourceKind: 'resource_presence',
            shortLine:
              kind === 'route_pressure_marker'
                ? `${districtName(district)} hattında rota baskısı var.`
                : kind === 'resource_fatigue_marker'
                  ? `Araç yorgunluğu ${districtName(district)} rotasını etkileyebilir.`
                  : `Rota destek araçları ${districtName(district)} hattında yoğun.`,
            scoreBoost: vehicle.priority === 'high' ? 8 : 4,
            selectedBoost: selectedBoost(district),
          }),
          [...guard, presence.mapPresenceLine ?? '', vehicle.line],
        );
      }
    }
    if (presence.mapPresenceLine) {
      pushIfUnique(
        drafts,
        buildReactionDraft({
          districtId: selectedId,
          kind: 'resource_presence_marker',
          sourceKind: 'resource_presence',
          shortLine: `Saha kapasitesi ${districtName(selectedId)} hattında izleniyor.`,
          scoreBoost: 5,
          selectedBoost: true,
        }),
        [...guard, presence.mapPresenceLine],
      );
    }
  }

  const packMeta =
    input.contentPackMeta ??
    resolveContentPackMetaForWiring({
      contentPackMeta: input.contentPackMeta,
      districtId: selectedId,
      day: input.day,
    });

  if (packMeta) {
    const packDistrict = normalizeMapDistrictId(packMeta.districtId ?? selectedId) ?? selectedId;
    let kind: MapDistrictReactionKind = 'content_pack_marker';
    if (packMeta.packId === 'vehicle_route_pack_one') {
      kind =
        packMeta.variantKind === 'resource_fatigue'
          ? 'resource_fatigue_marker'
          : 'route_pressure_marker';
    } else if (packMeta.packId === 'container_environment_pack_one') {
      kind =
        packMeta.variantKind === 'recovery' ? 'recovery_glow' : 'container_pressure_marker';
    } else if (packMeta.packId === 'district_pack_one') {
      kind = packMeta.variantKind === 'crisis_adjacent' ? 'crisis_watch_ring' : 'trust_pulse';
    }
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: packDistrict,
        kind,
        sourceKind: 'content_pack',
        shortLine:
          kind === 'route_pressure_marker'
            ? `${districtName(packDistrict)} hattında rota baskısı var.`
            : kind === 'container_pressure_marker'
              ? `${districtName(packDistrict)} konteyner çevresi izleniyor.`
              : kind === 'recovery_glow'
                ? `${districtName(packDistrict)} çevre baskısı sakinleşiyor.`
                : kind === 'crisis_watch_ring'
                  ? `${districtName(packDistrict)} kriz eşiği değil, izleme notunda.`
                  : `${districtName(packDistrict)} operasyon odağında.`,
        scoreBoost: 7,
        selectedBoost: selectedBoost(packDistrict),
      }),
      guard,
    );
  }

  const echo = input.cityEcho;
  if (echo?.socialLine) {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: selectedId,
        kind: 'social_bubble',
        sourceKind: 'city_echo',
        shortLine: 'Mahallede görünür hizmet fark edildi.',
        scoreBoost: 4,
        selectedBoost: true,
      }),
      [...guard, echo.socialLine],
    );
  }

  if (reportCard?.trustBand === 'recovering' || reportCard?.trustBand === 'improving') {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: reportCard.districtId,
        kind: 'trust_pulse',
        sourceKind: 'district_trust',
        shortLine: `${reportCard.districtName}'te güven toparlanıyor.`,
        scoreBoost: 5,
        selectedBoost: selectedBoost(reportCard.districtId),
      }),
      guard,
    );
  } else if (
    reportCard?.trustBand === 'fragile' ||
    reportCard?.trustBand === 'strained' ||
    reportCard?.trustBand === 'watch'
  ) {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: reportCard.districtId,
        kind: 'risk_ring',
        sourceKind: 'district_trust',
        shortLine: `${reportCard.districtName} güveni izleme notunda.`,
        scoreBoost: 5,
        selectedBoost: selectedBoost(reportCard.districtId),
      }),
      guard,
    );
  }

  const signals = input.operationSignals;
  if (signals) {
    const ranked: Array<{ districtId: MapDistrictId; kind: MapDistrictReactionKind; line: string; weight: number }> = [];
    if (signalWeight(signals.vehicles?.status) >= 2) {
      ranked.push({
        districtId: normalizeMapDistrictId(signals.priorityDistrictId ?? 'sanayi') ?? 'sanayi',
        kind: 'route_pressure_marker',
        line: `${districtName(normalizeMapDistrictId(signals.priorityDistrictId ?? 'sanayi') ?? 'sanayi')} hattında rota baskısı var.`,
        weight: signalWeight(signals.vehicles?.status),
      });
    }
    if (signalWeight(signals.containers?.status) >= 2) {
      ranked.push({
        districtId: normalizeMapDistrictId(signals.priorityDistrictId ?? 'cumhuriyet') ?? 'cumhuriyet',
        kind: 'container_pressure_marker',
        line: `${districtName(normalizeMapDistrictId(signals.priorityDistrictId ?? 'cumhuriyet') ?? 'cumhuriyet')} konteyner çevresi izleniyor.`,
        weight: signalWeight(signals.containers?.status),
      });
    }
    if (signalWeight(signals.personnel?.status) >= 2) {
      ranked.push({
        districtId: selectedId,
        kind: 'team_capacity_marker',
        line: `Ekip temposu ${districtName(selectedId)} çevresinde yükseldi.`,
        weight: signalWeight(signals.personnel?.status),
      });
    }
    ranked.sort((a, b) => b.weight - a.weight);
    for (const item of ranked.slice(0, 2)) {
      pushIfUnique(
        drafts,
        buildReactionDraft({
          districtId: item.districtId,
          kind: item.kind,
          sourceKind: 'operation_signals',
          shortLine: item.line,
          scoreBoost: item.weight * 3,
          selectedBoost: selectedBoost(item.districtId),
        }),
        guard,
      );
    }
  }

  const fatigueBlob = JSON.stringify(input.resourceFatigue ?? '').toLocaleLowerCase('tr-TR');
  if (
    fatigueBlob.includes('tired') ||
    fatigueBlob.includes('fatigue') ||
    fatigueBlob.includes('yorgun')
  ) {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: selectedId,
        kind: 'resource_fatigue_marker',
        sourceKind: 'resource_fatigue',
        shortLine: `Araç yorgunluğu ${districtName(selectedId)} rotasını etkileyebilir.`,
        scoreBoost: 3,
        selectedBoost: true,
      }),
      guard,
    );
  }

  const journalHint = buildCityJournalMapHint(
    input.cityJournal ?? null,
    selectedId,
    guard,
  );
  if (journalHint.visible && journalHint.line) {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: selectedId,
        kind: 'journal_trace',
        sourceKind: 'city_journal',
        shortLine: sanitizeCopy(
          journalHint.line.replace(/^Son şehir izi:\s*/i, 'Günlük izi: '),
          `Günlük izi: ${districtName(selectedId)} operasyonu kayda geçti.`,
        ),
        scoreBoost: 4,
        selectedBoost: true,
      }),
      [...guard, journalHint.line],
    );
  }

  if (input.mainOperationScopeHintLine && (input.day ?? 1) >= POST_PILOT_FIRST_OPERATION_DAY) {
    const scopeGuard = guard.filter((line) => line !== input.mainOperationScopeHintLine);
    const scopeDistricts =
      input.mainOperationScopeDistrictIds?.length
        ? input.mainOperationScopeDistrictIds
        : [selectedId];
    for (const scopeId of scopeDistricts.slice(0, 2)) {
      pushIfUnique(
        drafts,
        buildReactionDraft({
          districtId: scopeId,
          kind: 'operation_scope_marker',
          sourceKind: 'main_operation_feel',
          shortLine: `${districtName(scopeId)} operasyon odağında.`,
          scoreBoost: 5,
          selectedBoost: selectedBoost(scopeId),
        }),
        scopeGuard,
      );
    }
  }

  if (input.activeRouteVisible && input.activeRouteDistrictId) {
    const routeDistrict =
      normalizeMapDistrictId(input.activeRouteDistrictId) ?? selectedId;
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId: routeDistrict,
        kind: 'active_route_hint',
        sourceKind: 'active_route',
        shortLine: `${districtName(routeDistrict)} hattında aktif rota izi var.`,
        scoreBoost: 6,
        selectedBoost: selectedBoost(routeDistrict),
      }),
      guard,
    );
  }

  for (const districtId of MAP_REACTION_LITE_DISTRICT_IDS) {
    pushIfUnique(
      drafts,
      buildReactionDraft({
        districtId,
        kind: 'fallback',
        sourceKind: 'district_identity',
        shortLine: MAP_REACTION_LITE_DISTRICT_FALLBACK_LINES[districtId],
        scoreBoost: 0,
        selectedBoost: selectedBoost(districtId),
      }),
      guard,
    );
  }

  return drafts.sort((a, b) => b.score - a.score);
}

function mergeSameDistrictReactions(reactions: MapDistrictReaction[]): MapDistrictReaction[] {
  const byDistrict = new Map<MapDistrictId, MapDistrictReaction>();
  for (const reaction of reactions) {
    const existing = byDistrict.get(reaction.districtId);
    if (!existing) {
      byDistrict.set(reaction.districtId, reaction);
      continue;
    }
    const mergeRisk =
      (existing.kind === 'risk_ring' && reaction.kind === 'crisis_watch_ring') ||
      (existing.kind === 'crisis_watch_ring' && reaction.kind === 'risk_ring');
    const mergeResource =
      (existing.kind === 'resource_presence_marker' &&
        reaction.kind === 'resource_fatigue_marker') ||
      (existing.kind === 'resource_fatigue_marker' &&
        reaction.kind === 'resource_presence_marker');
    const mergeSocialJournal =
      (existing.kind === 'social_bubble' && reaction.kind === 'journal_trace') ||
      (existing.kind === 'journal_trace' && reaction.kind === 'social_bubble');
    if (mergeRisk || mergeResource || mergeSocialJournal) {
      if (reaction.priority === 'high' || existing.priority === 'low') {
        byDistrict.set(reaction.districtId, {
          ...reaction,
          kind: mergeRisk ? 'crisis_watch_ring' : existing.kind,
          label: existing.label,
        });
      }
      continue;
    }
    const rank = (p: MapDistrictReactionPriority) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
    if (rank(reaction.priority) > rank(existing.priority)) {
      byDistrict.set(reaction.districtId, reaction);
    }
  }
  return [...byDistrict.values()].sort(
    (a, b) =>
      (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) -
      (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1),
  );
}

export function buildMapReactionLiteModel(input: MapReactionLiteInput = {}): MapReactionLiteModel {
  const day = input.day ?? 1;
  const visibility = buildMapReactionLiteVisibility(input);
  const selectedId = resolveDistrictId(input);
  const maxVisible = maxVisibleReactions(visibility, day);

  if (visibility === 'hidden' || maxVisible <= 0) {
    return {
      day,
      visibility,
      reactions: [],
      sourceSignals: buildSourceSignals(input),
      maxVisibleReactions: maxVisible,
      duplicateKey: 'hidden',
    };
  }

  const drafts = buildDrafts(input, selectedId);
  let reactions: MapDistrictReaction[] = drafts.map((draft, index) => ({
    id: `${draft.districtId}-${draft.kind}-${index}`,
    districtId: draft.districtId,
    districtName: draft.districtName,
    kind: draft.kind,
    tone: draft.tone,
    intensity: draft.intensity,
    label: draft.label,
    shortLine: draft.shortLine,
    iconKey: draft.iconKey,
    pulseStyle: draft.pulseStyle,
    shouldAnimate: draft.shouldAnimate,
    animationHint: draft.animationHint,
    sourceKind: draft.sourceKind,
    priority: draft.priority,
    duplicateKey: draft.duplicateKey,
    maxVisibleLines: 1,
  }));

  reactions = mergeSameDistrictReactions(reactions);

  if (visibility === 'compact') {
    reactions = reactions.filter((r) => r.districtId === selectedId).slice(0, maxVisible);
  } else {
    reactions = reactions.filter((r) => r.kind !== 'fallback').slice(0, maxVisible);
    if (reactions.length === 0) {
      reactions = drafts
        .filter((d) => d.districtId === selectedId && d.kind === 'fallback')
        .map((draft, index) => ({
          id: `fallback-${index}`,
          districtId: draft.districtId,
          districtName: draft.districtName,
          kind: draft.kind,
          tone: draft.tone,
          intensity: draft.intensity,
          label: draft.label,
          shortLine: draft.shortLine,
          iconKey: draft.iconKey,
          pulseStyle: draft.pulseStyle,
          shouldAnimate: draft.shouldAnimate,
          animationHint: draft.animationHint,
          sourceKind: draft.sourceKind,
          priority: draft.priority,
          duplicateKey: draft.duplicateKey,
          maxVisibleLines: 1,
        }));
    }
  }

  const selectedDistrictReaction =
    reactions.find((r) => r.districtId === selectedId) ??
    reactions.find((r) => r.priority === 'high');

  const globalMapHint =
    visibility === 'compact' && !selectedDistrictReaction
      ? undefined
      : sanitizeCopy(
          reactions[0]?.shortLine ?? MAP_REACTION_LITE_FALLBACK_GLOBAL,
          MAP_REACTION_LITE_FALLBACK_GLOBAL,
        );

  return {
    day,
    visibility,
    reactions,
    selectedDistrictReaction,
    globalMapHint,
    sourceSignals: buildSourceSignals(input),
    maxVisibleReactions: maxVisible,
    duplicateKey: [
      selectedId,
      selectedDistrictReaction?.kind ?? 'none',
      selectedDistrictReaction?.sourceKind ?? 'none',
    ].join(':'),
  };
}

function buildSourceSignals(input: MapReactionLiteInput): MapReactionLiteSourceSignals {
  return {
    hasTomorrowRisk: Boolean(input.tomorrowRisk?.mainLine),
    hasCarryOver: Boolean(input.carryOverMemory?.summary),
    hasDistrictReportCard: Boolean(input.districtReportCard?.dominantIssueLine),
    hasResourcePresence: Boolean(input.operationalResourcePresence?.mapPresenceLine),
    hasContentPack: Boolean(input.contentPackMeta),
    hasCityEcho: Boolean(input.cityEcho),
    hasCityJournal: Boolean(input.cityJournal?.entries.length),
    hasOperationSignals: Boolean(input.operationSignals),
    hasResourceFatigue: Boolean(input.resourceFatigue),
    hasMainOperationFeel: Boolean(input.mainOperationScopeHintLine),
    hasActiveRoute: Boolean(input.activeRouteVisible),
  };
}

export function shouldShowMapReactionLite(
  model: MapReactionLiteModel | null | undefined,
): boolean {
  return Boolean(model && model.visibility !== 'hidden' && model.reactions.length > 0);
}

export function collectMapReactionVisibleLines(
  model: MapReactionLiteModel | null | undefined,
): string[] {
  if (!model) return [];
  return [
    model.globalMapHint ?? '',
    model.selectedDistrictReaction?.shortLine ?? '',
    ...model.reactions.map((r) => r.shortLine),
  ].filter(Boolean);
}

export const MAP_REACTION_KIND_COUNT = 16;
