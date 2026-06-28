import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import { isMapReactionDuplicate, shouldShowMapReactionLite } from './mapReactionModel';
import type {
  MapReactionLiteInput,
  MapReactionLiteModel,
  MapReactionPanelPresentation,
  MapReactionStripOverlay,
} from './mapReactionTypes';

export function buildMapReactionPanelPresentation(
  model: MapReactionLiteModel | null | undefined,
  existingLines: string[] = [],
): MapReactionPanelPresentation {
  if (!shouldShowMapReactionLite(model)) {
    return { visible: false };
  }

  const selected = model!.selectedDistrictReaction;
  const hintLine = selected
    ? `Harita tepkisi: ${selected.shortLine}`
    : model!.globalMapHint
      ? `Harita tepkisi: ${model!.globalMapHint}`
      : undefined;

  if (!hintLine || isMapReactionDuplicate(hintLine, existingLines)) {
    return { visible: false };
  }

  return {
    visible: true,
    hintLine,
    hintTone: selected?.tone ?? model!.reactions[0]?.tone,
    selectedShortLine: selected?.shortLine,
  };
}

export function buildMapReactionStripOverlays(
  model: MapReactionLiteModel | null | undefined,
): MapReactionStripOverlay[] {
  if (!shouldShowMapReactionLite(model)) return [];

  return model!.reactions.map((reaction) => ({
    districtId: reaction.districtId,
    indicatorLabel: reaction.label,
    tone: reaction.tone,
    pulseStyle: reaction.pulseStyle,
    shouldAnimate: reaction.shouldAnimate,
  }));
}

export function buildMapReactionHighlightDistrictIds(
  model: MapReactionLiteModel | null | undefined,
): MapDistrictId[] {
  if (!shouldShowMapReactionLite(model)) return [];
  return [...new Set(model!.reactions.map((reaction) => reaction.districtId))];
}

export function buildMapReactionLiteInputFromMapContext(params: {
  day: number;
  selectedDistrictId?: MapDistrictId | string | null;
  isPostPilot?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
  operationSignals?: MapReactionLiteInput['operationSignals'];
  resourceFatigue?: unknown;
  operationalResources?: unknown;
  tomorrowRisk?: MapReactionLiteInput['tomorrowRisk'];
  cityEcho?: MapReactionLiteInput['cityEcho'];
  recentDecisionRecord?: MapReactionLiteInput['recentDecisionRecord'];
  districtReportCard?: MapReactionLiteInput['districtReportCard'];
  operationalResourcePresence?: MapReactionLiteInput['operationalResourcePresence'];
  contentPackMeta?: MapReactionLiteInput['contentPackMeta'];
  cityJournal?: MapReactionLiteInput['cityJournal'];
  cityArchive?: MapReactionLiteInput['cityArchive'];
  carryOverMemory?: MapReactionLiteInput['carryOverMemory'];
  mainOperationScopeHintLine?: string | null;
  activeRouteDistrictId?: string | null;
  activeRouteVisible?: boolean;
  existingLines?: string[];
  mapIntelligenceLines?: string[];
  districtReportCardLines?: string[];
  resourceOverlayLines?: string[];
  resourcePresenceMapLine?: string | null;
  mainOperationFeelMapHint?: string | null;
  cityEchoLines?: string[];
  tomorrowRiskLine?: string | null;
}): MapReactionLiteInput {
  return { ...params };
}

export function buildMapReactionSelectedShortLine(
  model: MapReactionLiteModel | null | undefined,
): string | null {
  if (!shouldShowMapReactionLite(model)) return null;
  return model!.selectedDistrictReaction?.shortLine ?? model!.reactions[0]?.shortLine ?? null;
}
