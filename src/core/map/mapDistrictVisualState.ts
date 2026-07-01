import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { buildMapDistrictNeglectRecoveryHint } from '@/core/districtNeglectRecovery';
import type { DistrictNeglectRecoveryResult } from '@/core/districtNeglectRecovery/districtNeglectRecoveryTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { MAP_REACTION_KIND_LABELS } from '@/core/mapReactions/mapReactionConstants';
import type { MapDistrictReactionKind, MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import { shouldShowMapReactionLite } from '@/core/mapReactions/mapReactionModel';

import type { CreviaMapDistrictId } from '@/features/map/types/creviaMapTypes';

export type DistrictMapVisualState =
  | 'stable'
  | 'risk_rising'
  | 'neglect_building'
  | 'recovery_started'
  | 'intervention_active'
  | 'social_pressure'
  | 'route_pressure'
  | 'trust_recovering';

export type DistrictMapVisualTone = 'stable' | 'risk' | 'recovery' | 'active' | 'social' | 'neutral';

export type DistrictMapVisualStateItem = {
  districtId: CreviaMapDistrictId;
  state: DistrictMapVisualState;
  tone: DistrictMapVisualTone;
  chipLabel: string;
  shortLine: string;
  priority: number;
  pulse: boolean;
  glow: boolean;
  routeHint: boolean;
};

export type DistrictMapVisualStateMap = {
  byDistrict: Partial<Record<CreviaMapDistrictId, DistrictMapVisualStateItem>>;
  primaryDistrictId?: CreviaMapDistrictId;
  mapHintLine?: string;
  highlightDistrictIds: CreviaMapDistrictId[];
  statusChips: Array<{
    id: string;
    districtId: CreviaMapDistrictId;
    label: string;
    tone: DistrictMapVisualTone;
  }>;
};

const MAP_DISTRICT_IDS: readonly CreviaMapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
];

const STATE_META: Record<
  DistrictMapVisualState,
  {
    chipLabel: string;
    tone: DistrictMapVisualTone;
    pulse: boolean;
    glow: boolean;
    routeHint: boolean;
    priority: number;
  }
> = {
  stable: {
    chipLabel: 'Dengeli',
    tone: 'stable',
    pulse: false,
    glow: false,
    routeHint: false,
    priority: 0,
  },
  risk_rising: {
    chipLabel: 'Risk artıyor',
    tone: 'risk',
    pulse: true,
    glow: false,
    routeHint: false,
    priority: 88,
  },
  neglect_building: {
    chipLabel: 'İhmal birikiyor',
    tone: 'risk',
    pulse: true,
    glow: false,
    routeHint: false,
    priority: 84,
  },
  recovery_started: {
    chipLabel: 'Toparlanıyor',
    tone: 'recovery',
    pulse: false,
    glow: true,
    routeHint: false,
    priority: 78,
  },
  intervention_active: {
    chipLabel: 'Müdahale sürüyor',
    tone: 'active',
    pulse: true,
    glow: true,
    routeHint: false,
    priority: 96,
  },
  social_pressure: {
    chipLabel: 'Sosyal baskı',
    tone: 'social',
    pulse: true,
    glow: false,
    routeHint: false,
    priority: 72,
  },
  route_pressure: {
    chipLabel: 'Rota baskısı',
    tone: 'neutral',
    pulse: false,
    glow: false,
    routeHint: true,
    priority: 76,
  },
  trust_recovering: {
    chipLabel: 'Güven toparlanıyor',
    tone: 'recovery',
    pulse: true,
    glow: false,
    routeHint: false,
    priority: 70,
  },
};

function clampLine(text: string, max = 88): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function toDistrictId(raw?: string | null): CreviaMapDistrictId | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();
  const direct = MAP_DISTRICT_IDS.find((id) => id === normalized);
  if (direct) return direct;
  return MAP_DISTRICT_IDS.find((id) => normalized.includes(id));
}

function reactionKindToVisualState(kind: MapDistrictReactionKind): DistrictMapVisualState | null {
  switch (kind) {
    case 'risk_ring':
    case 'crisis_watch_ring':
      return 'risk_rising';
    case 'recovery_glow':
      return 'recovery_started';
    case 'trust_pulse':
      return 'trust_recovering';
    case 'social_bubble':
      return 'social_pressure';
    case 'route_pressure_marker':
    case 'active_route_hint':
      return 'route_pressure';
    case 'operation_scope_marker':
    case 'content_pack_marker':
      return 'intervention_active';
    default:
      return null;
  }
}

function upsertDraft(
  drafts: Map<CreviaMapDistrictId, DistrictMapVisualStateItem>,
  districtId: CreviaMapDistrictId,
  state: DistrictMapVisualState,
  shortLine: string,
  priorityBoost = 0,
): void {
  const meta = STATE_META[state];
  const next: DistrictMapVisualStateItem = {
    districtId,
    state,
    tone: meta.tone,
    chipLabel: meta.chipLabel,
    shortLine: clampLine(shortLine),
    priority: meta.priority + priorityBoost,
    pulse: meta.pulse,
    glow: meta.glow,
    routeHint: meta.routeHint,
  };
  const existing = drafts.get(districtId);
  if (!existing || next.priority > existing.priority) {
    drafts.set(districtId, next);
  }
}

function collectFromNeglectRecovery(
  drafts: Map<CreviaMapDistrictId, DistrictMapVisualStateItem>,
  result: DistrictNeglectRecoveryResult | null | undefined,
): void {
  if (!result?.signals?.length) return;

  for (const signal of result.signals) {
    if (signal.isFallback) continue;
    const districtId = toDistrictId(signal.districtId ?? signal.districtName);
    if (!districtId) continue;

    if (
      signal.neglectBand === 'high' ||
      signal.neglectBand === 'rising' ||
      signal.kind === 'neglect_warning'
    ) {
      const state: DistrictMapVisualState =
        signal.neglectBand === 'high' ? 'risk_rising' : 'neglect_building';
      upsertDraft(
        drafts,
        districtId,
        state,
        signal.shortLine ?? signal.line ?? STATE_META[state].chipLabel,
        signal.neglectBand === 'high' ? 4 : 0,
      );
      continue;
    }

    if (
      signal.recoveryBand === 'active' ||
      signal.recoveryBand === 'strong' ||
      signal.kind === 'recovery_window' ||
      signal.kind === 'recovery_progress' ||
      signal.kind === 'positive_momentum'
    ) {
      upsertDraft(
        drafts,
        districtId,
        'recovery_started',
        signal.shortLine ?? signal.line ?? 'Mahalle toparlanma penceresinde.',
        signal.recoveryBand === 'strong' ? 3 : 0,
      );
      continue;
    }

    if (signal.kind === 'route_backlog') {
      upsertDraft(
        drafts,
        districtId,
        'route_pressure',
        signal.shortLine ?? signal.line ?? 'Rota baskısı birikiyor.',
      );
      continue;
    }

    if (signal.kind === 'trust_fragility' || signal.kind === 'social_cooling') {
      upsertDraft(
        drafts,
        districtId,
        'social_pressure',
        signal.shortLine ?? signal.line ?? 'Sosyal baskı artıyor.',
      );
    }
  }
}

function collectFromReactions(
  drafts: Map<CreviaMapDistrictId, DistrictMapVisualStateItem>,
  model: MapReactionLiteModel | null | undefined,
): void {
  if (!shouldShowMapReactionLite(model)) return;

  for (const reaction of model!.reactions) {
    const districtId = toDistrictId(reaction.districtId);
    if (!districtId) continue;
    const state = reactionKindToVisualState(reaction.kind);
    if (!state) continue;
    upsertDraft(
      drafts,
      districtId,
      state,
      reaction.shortLine ?? MAP_REACTION_KIND_LABELS[reaction.kind] ?? reaction.label,
    );
  }
}

function collectFromActiveOperation(
  drafts: Map<CreviaMapDistrictId, DistrictMapVisualStateItem>,
  binding: ActiveOperationMapBinding | null | undefined,
): void {
  if (!binding?.districtId && !binding?.districtName) return;
  const districtId = toDistrictId(binding.districtId ?? binding.districtName);
  if (!districtId) return;
  const activePhases = new Set([
    'dispatch_ready',
    'dispatching',
    'field_active',
    'field_paused',
    'inspecting',
    'planning',
  ]);
  if (!activePhases.has(binding.phase)) return;
  upsertDraft(
    drafts,
    districtId,
    'intervention_active',
    binding.mapLine ?? binding.pressureLine ?? 'Aktif müdahale bu bölgede sürüyor.',
    2,
  );
}

export type BuildDistrictMapVisualStateInput = {
  day: number;
  focusDistrictId?: CreviaMapDistrictId | MapDistrictId | string | null;
  districtNeglectRecovery?: DistrictNeglectRecoveryResult | null;
  mapReactionLiteModel?: MapReactionLiteModel | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  existingLines?: string[];
};

export function buildDistrictMapVisualStateMap(
  input: BuildDistrictMapVisualStateInput,
): DistrictMapVisualStateMap {
  const drafts = new Map<CreviaMapDistrictId, DistrictMapVisualStateItem>();

  if (input.day >= 2) {
    collectFromNeglectRecovery(drafts, input.districtNeglectRecovery);
    collectFromReactions(drafts, input.mapReactionLiteModel);
    collectFromActiveOperation(drafts, input.activeOperationBinding);
  }

  const byDistrict: DistrictMapVisualStateMap['byDistrict'] = {};
  for (const id of MAP_DISTRICT_IDS) {
    const item = drafts.get(id);
    if (item && item.state !== 'stable') {
      byDistrict[id] = item;
    }
  }

  const ranked = Object.values(byDistrict).sort((a, b) => b.priority - a.priority);
  const focusId = toDistrictId(input.focusDistrictId);
  const primaryDistrictId =
    (focusId && byDistrict[focusId] ? focusId : ranked[0]?.districtId) ?? undefined;

  const highlightDistrictIds = ranked.slice(0, 3).map((item) => item.districtId);

  const mapHintLine =
    buildMapDistrictNeglectRecoveryHint(input.districtNeglectRecovery, input.existingLines ?? []) ??
    (primaryDistrictId ? byDistrict[primaryDistrictId]?.shortLine : undefined) ??
    undefined;

  const statusChips = ranked.slice(0, 3).map((item) => ({
    id: `map_visual_${item.districtId}`,
    districtId: item.districtId,
    label: `${item.chipLabel}`,
    tone: item.tone,
  }));

  return {
    byDistrict,
    primaryDistrictId,
    mapHintLine: mapHintLine ? clampLine(mapHintLine) : undefined,
    highlightDistrictIds,
    statusChips,
  };
}

export function pickDistrictMapVisualState(
  map: DistrictMapVisualStateMap | null | undefined,
  districtId: CreviaMapDistrictId | string,
): DistrictMapVisualStateItem | null {
  if (!map?.byDistrict) return null;
  return map.byDistrict[districtId as CreviaMapDistrictId] ?? null;
}
