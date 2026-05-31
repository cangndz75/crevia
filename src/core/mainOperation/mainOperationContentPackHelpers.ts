import type {
  EventCard,
  EventDecision,
  EventDecisionEffect,
  EventFilterTag,
} from '@/core/models/EventCard';
import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

export const MAIN_OPERATION_CONTEXT_TAG = 'Ana operasyon gündemi';
export const CRISIS_ADJACENT_CONTEXT_TAG = 'Kriz Masası uyarısı';

export type ContentPackEventKind =
  | 'anchor'
  | 'side'
  | 'district'
  | 'crisis_adjacent';

export type ContentPackEventDef = {
  templateKey: string;
  kind: ContentPackEventKind;
  districtId?: MapDistrictId;
  title: string;
  category: string;
  description: string;
  tags: string[];
  riskLevel?: EventCard['riskLevel'];
  urgencyHours?: number;
  contextTag?: string;
  filterTags?: EventFilterTag[];
  decisions: Array<{
    suffix: 'a' | 'b' | 'c';
    title: string;
    description: string;
    style: EventDecision['style'];
    decisionStyle?: EventDecision['decisionStyle'];
    recommended?: boolean;
    effects: Partial<EventDecisionEffect>;
  }>;
};

export function mainEffects(
  partial: Partial<EventDecisionEffect>,
): EventDecisionEffect {
  return {
    publicSatisfaction: 0,
    budget: 0,
    morale: 0,
    risk: 0,
    xp: 0,
    ...partial,
  };
}

export function buildDecisions(
  prefix: string,
  defs: ContentPackEventDef['decisions'],
): EventDecision[] {
  return defs.map((d) => ({
    id: `${prefix}-${d.suffix}`,
    title: d.title,
    description: d.description,
    style: d.style,
    recommended: d.recommended ?? d.suffix === 'a',
    decisionStyle: d.decisionStyle,
    effects: mainEffects(d.effects),
    contentShortTradeoff: d.description,
  }));
}

export function buildContentPackEventId(
  kind: ContentPackEventKind,
  templateKey: string,
  day: number,
): string {
  if (kind === 'district') {
    return `mf_d${day}_district_${templateKey}`;
  }
  if (kind === 'crisis_adjacent') {
    return `mf_d${day}_crisis_${templateKey}`;
  }
  if (kind === 'anchor') {
    return `mf_d${day}_anchor_${templateKey}`;
  }
  return `mf_d${day}_side_${templateKey}`;
}

export function buildEventFromDef(
  def: ContentPackEventDef,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const id = buildContentPackEventId(def.kind, def.templateKey, day);
  const prefix = `mf-${day}-${def.kind}-${def.templateKey}`;
  return {
    id,
    title: def.title,
    category: def.category,
    riskLevel: def.riskLevel ?? 'medium',
    district: scope.districtLabel,
    neighborhoodId: scope.neighborhoodId,
    description: def.description,
    contextTag: def.contextTag ?? MAIN_OPERATION_CONTEXT_TAG,
    urgencyHours: def.urgencyHours ?? 6,
    decisions: buildDecisions(prefix, def.decisions),
    previewEffects: {
      publicSatisfaction: def.kind === 'crisis_adjacent' ? -2 : -1,
      risk: def.kind === 'crisis_adjacent' ? 6 : 4,
      xp: 6,
    },
    day,
    filterTags: def.filterTags,
    districtIds: def.districtId ? [def.districtId] : [scope.neighborhoodId],
    contentCategory: def.tags[0],
  };
}

export function categoryFromDef(def: ContentPackEventDef): string {
  return def.category.split('/')[0]?.trim().toLowerCase() ?? def.tags[0] ?? '';
}
