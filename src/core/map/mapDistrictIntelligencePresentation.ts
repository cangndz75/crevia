import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { buildDistrictTrustMapLine } from '@/core/districtTrustRuntime/districtTrustRuntimePresentation';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import { buildDistrictMemoryMapLine } from '@/core/districtMemoryRuntime/districtMemoryRuntimePresentation';
import type { CreviaDistrictMemoryKind } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import {
  buildDistrictOperationMapLine,
  districtOperationsRuntimeCopyContainsForbiddenTerms,
  districtOperationsRuntimeCopyContainsPanicTerms,
} from '@/core/districtOperationsRuntime/districtOperationsRuntimePresentation';
import {
  DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  DISTRICT_TRUST_RUNTIME_PANIC_TERMS,
} from '@/core/districtTrustRuntime/districtTrustRuntimeConstants';
import {
  DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  DISTRICT_MEMORY_RUNTIME_PANIC_TERMS,
} from '@/core/districtMemoryRuntime/districtMemoryRuntimeConstants';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { CreviaDistrictOperationActionState } from '@/core/districtOperationActions/districtOperationActionTypes';
import type { CreviaDistrictMemorySnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import { buildStoryChainHintForMap } from '@/core/storyChains/storyChainRuntimeHintPresentation';

export const MAP_DISTRICT_INTELLIGENCE_MAX_COPY_LENGTH = 88;
export const MAP_DISTRICT_INTELLIGENCE_MOBILE_COPY_LENGTH = 72;
export const MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES = 3;
export const MAP_DISTRICT_INTELLIGENCE_MAX_STRIP_CHIPS = 2;

export type CreviaMapDistrictIntelligenceLayerFocus =
  | 'base'
  | 'trust'
  | 'memory'
  | 'operation';

export type CreviaMapDistrictIntelligenceVisibilityMode =
  | 'hidden'
  | 'identity_only'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaMapDistrictIntelligenceVisibility = {
  mode: CreviaMapDistrictIntelligenceVisibilityMode;
  showTrust: boolean;
  showMemory: boolean;
  showOperation: boolean;
  maxVisibleLines: number;
};

export type CreviaMapDistrictIntelligenceLineTone = 'teal' | 'mint' | 'gold' | 'neutral';

export type CreviaMapDistrictTrustLine = {
  id: string;
  kind: 'trust';
  text: string;
  band?: CreviaDistrictTrustBand;
  tone: CreviaMapDistrictIntelligenceLineTone;
  iconKey: string;
  priority: number;
};

export type CreviaMapDistrictMemoryLine = {
  id: string;
  kind: 'memory';
  text: string;
  memoryKind?: CreviaDistrictMemoryKind;
  tone: CreviaMapDistrictIntelligenceLineTone;
  iconKey: string;
  priority: number;
};

export type CreviaMapDistrictOperationLine = {
  id: string;
  kind: 'operation';
  text: string;
  operationKind?: string;
  tone: CreviaMapDistrictIntelligenceLineTone;
  iconKey: string;
  priority: number;
  isHintOnly: true;
};

export type CreviaMapDistrictChainLine = {
  id: string;
  kind: 'chain';
  text: string;
  chainKind?: string;
  tone: CreviaMapDistrictIntelligenceLineTone;
  iconKey: string;
  priority: number;
  isHintOnly: true;
};

export type CreviaMapDistrictIntelligenceChip = {
  id: string;
  label: string;
  kind: 'trust' | 'memory';
  tone: CreviaMapDistrictIntelligenceLineTone;
  iconKey: string;
};

export type CreviaMapDistrictIntelligenceModel = {
  districtId: MapDistrictId;
  districtName: string;
  visible: boolean;
  visibility: CreviaMapDistrictIntelligenceVisibility;
  layerFocus: CreviaMapDistrictIntelligenceLayerFocus;
  crisisPriorityActive: boolean;
  trustLine?: CreviaMapDistrictTrustLine;
  memoryLine?: CreviaMapDistrictMemoryLine;
  operationLine?: CreviaMapDistrictOperationLine;
  chainLine?: CreviaMapDistrictChainLine;
  visibleLines: Array<
    | CreviaMapDistrictTrustLine
    | CreviaMapDistrictMemoryLine
    | CreviaMapDistrictOperationLine
    | CreviaMapDistrictChainLine
  >;
  stripChips: CreviaMapDistrictIntelligenceChip[];
  isHintOnly: true;
};

export type CreviaMapDistrictIntelligenceInput = {
  selectedDistrictId?: MapDistrictId | string;
  day?: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  crisisState?: unknown;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  socialPulse?: unknown;
  recentEvents?: unknown;
  carryOverMemory?: unknown;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  activeMapLayerId?: CreviaMapLayerId | string;
  crisisOverlayVisible?: boolean;
  activeEvent?: { id?: string; title?: string; neighborhoodId?: string };
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot | null;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot | null;
  districtOperationActionState?: CreviaDistrictOperationActionState | null;
};

function clampCopy(text: string, max = MAP_DISTRICT_INTELLIGENCE_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function copyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  const terms = [
    ...DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
    ...DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
    'premium al',
    'satın al',
    'kilitli',
  ];
  return (
    terms.some((term) => normalized.includes(term)) ||
    districtOperationsRuntimeCopyContainsForbiddenTerms(text) ||
    [...DISTRICT_TRUST_RUNTIME_PANIC_TERMS, ...DISTRICT_MEMORY_RUNTIME_PANIC_TERMS].some((term) =>
      normalized.includes(term),
    ) ||
    districtOperationsRuntimeCopyContainsPanicTerms(text)
  );
}

function safeMapCopy(text: string, fallback: string): string {
  const clamped = clampCopy(text);
  if (copyContainsForbiddenTerms(clamped)) return clampCopy(fallback);
  return clamped;
}

function districtName(id: MapDistrictId): string {
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function buildSignalContext(input: CreviaMapDistrictIntelligenceInput, districtId: MapDistrictId) {
  return {
    day: input.day,
    focusDistrictId: districtId,
    operationSignals: input.operationSignals,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    socialPulse: input.socialPulse,
    recentEvents: input.recentEvents,
    carryOverMemory: input.carryOverMemory,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
  };
}

export function resolveMapDistrictIntelligenceLayerFocus(
  activeMapLayerId?: CreviaMapLayerId | string,
): CreviaMapDistrictIntelligenceLayerFocus {
  if (activeMapLayerId === 'district_trust') return 'trust';
  if (activeMapLayerId === 'district_memory') return 'memory';
  if (
    activeMapLayerId === 'district_identity' ||
    activeMapLayerId === 'event_family_signal' ||
    activeMapLayerId === 'operation_era'
  ) {
    return 'operation';
  }
  return 'base';
}

export function buildMapDistrictIntelligenceVisibility(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictIntelligenceVisibility {
  const day = input.day ?? 1;
  const isPostPilot =
    input.isPostPilot === true ||
    day >= POST_PILOT_FIRST_OPERATION_DAY ||
    input.isPilotCompleted === true;

  if (day <= 1) {
    return {
      mode: 'identity_only',
      showTrust: true,
      showMemory: false,
      showOperation: false,
      maxVisibleLines: 1,
    };
  }

  if (day <= 3) {
    return {
      mode: 'compact',
      showTrust: true,
      showMemory: true,
      showOperation: false,
      maxVisibleLines: 2,
    };
  }

  if (input.crisisOverlayVisible) {
    return {
      mode: 'compact',
      showTrust: true,
      showMemory: false,
      showOperation: false,
      maxVisibleLines: 1,
    };
  }

  if (isPostPilot) {
    const rankKey = input.rankKey ?? '';
    const permissions = input.unlockedPermissionIds ?? [];
    if (
      rankKey.includes('director') ||
      rankKey.includes('chief') ||
      permissions.includes('district_specific_operations_preview')
    ) {
      return {
        mode: 'detailed',
        showTrust: true,
        showMemory: true,
        showOperation: true,
        maxVisibleLines: MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
      };
    }
    return {
      mode: 'standard',
      showTrust: true,
      showMemory: true,
      showOperation: true,
      maxVisibleLines: MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
    };
  }

  return {
    mode: 'compact',
    showTrust: true,
    showMemory: true,
    showOperation: true,
    maxVisibleLines: MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
  };
}

export function buildSelectedDistrictTrustMapLine(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictTrustLine | undefined {
  const districtId = normalizeMapDistrictId(input.selectedDistrictId ?? 'merkez') ?? 'merkez';
  const visibility = buildMapDistrictIntelligenceVisibility(input);
  if (!visibility.showTrust) return undefined;

  const ctx = buildSignalContext(input, districtId);
  const text =
    (input.day ?? 1) <= 1
      ? safeMapCopy(
          `${districtName(districtId)}: mahalle kimliği ve temel güven izleniyor.`,
          `${districtName(districtId)}: temel güven izleniyor.`,
        )
      : safeMapCopy(
          buildDistrictTrustMapLine(districtId, ctx),
          `${districtName(districtId)}: güven sinyali izleniyor.`,
        );

  return {
    id: `map_trust_${districtId}`,
    kind: 'trust',
    text,
    tone: 'teal',
    iconKey: 'shield-checkmark-outline',
    priority: 1,
  };
}

export function buildSelectedDistrictMemoryMapLine(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictMemoryLine | undefined {
  const districtId = normalizeMapDistrictId(input.selectedDistrictId ?? 'merkez') ?? 'merkez';
  const visibility = buildMapDistrictIntelligenceVisibility(input);
  if (!visibility.showMemory || (input.day ?? 1) <= 1) return undefined;

  const ctx = buildSignalContext(input, districtId);
  const text = safeMapCopy(
    buildDistrictMemoryMapLine(districtId, ctx),
    `${districtName(districtId)}: mahalle izi sakin.`,
  );

  return {
    id: `map_memory_${districtId}`,
    kind: 'memory',
    text,
    tone: 'mint',
    iconKey: 'bookmark-outline',
    priority: 2,
  };
}

export function buildSelectedDistrictChainMapLine(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictChainLine | undefined {
  const districtId = normalizeMapDistrictId(input.selectedDistrictId ?? 'merkez') ?? 'merkez';
  const day = input.day ?? 1;
  if (day <= 1) return undefined;

  const trustLine = buildSelectedDistrictTrustMapLine(input);
  const memoryLine = buildSelectedDistrictMemoryMapLine(input);
  const operationLine = buildSelectedDistrictOperationMapLine(input);
  const existing = [trustLine?.text, memoryLine?.text, operationLine?.text].filter(Boolean) as string[];

  const hint = buildStoryChainHintForMap(
    {
      gameDay: day,
      selectedDistrictId: districtId,
      activeEvent: input.activeEvent,
      carryOverMemory: input.carryOverMemory as CarryOverMemoryModel | undefined,
      districtTrustSnapshot: input.districtTrustSnapshot ?? undefined,
      districtMemorySnapshot: input.districtMemorySnapshot ?? undefined,
      districtOperationActionState: input.districtOperationActionState ?? undefined,
      operationSignals: input.operationSignals,
      resourceFatigue: input.resourceFatigue,
      crisisState: input.crisisState,
      crisisOverlayVisible: input.crisisOverlayVisible,
      isPostPilot: input.isPostPilot,
      isPilotCompleted: input.isPilotCompleted,
      rankKey: input.rankKey,
      unlockedPermissionIds: input.unlockedPermissionIds,
      districtMemoryUnresolvedLine: memoryLine?.text,
      districtOperationActionSummary: operationLine?.text,
    },
    existing,
  );
  if (!hint?.text) return undefined;

  return {
    id: `map_chain_${districtId}`,
    kind: 'chain',
    text: safeMapCopy(hint.text, `${districtName(districtId)}: kısa saha izi yarına taşınabilir.`),
    chainKind: hint.chainKind,
    tone: hint.tone === 'warn' ? 'gold' : hint.tone === 'mint' ? 'mint' : 'teal',
    iconKey: hint.iconKey,
    priority: 4,
    isHintOnly: true,
  };
}

export function buildSelectedDistrictOperationMapLine(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictOperationLine | undefined {
  const districtId = normalizeMapDistrictId(input.selectedDistrictId ?? 'merkez') ?? 'merkez';
  const visibility = buildMapDistrictIntelligenceVisibility(input);
  if (!visibility.showOperation || (input.day ?? 1) <= 3) return undefined;

  const ctx = buildSignalContext(input, districtId);
  const text = safeMapCopy(
    buildDistrictOperationMapLine(districtId, ctx),
    `${districtName(districtId)}: operasyon önerisi izleniyor.`,
  );

  return {
    id: `map_operation_${districtId}`,
    kind: 'operation',
    text,
    tone: 'gold',
    iconKey: 'compass-outline',
    priority: 3,
    isHintOnly: true,
  };
}

type MapDistrictIntelligenceLine =
  | CreviaMapDistrictTrustLine
  | CreviaMapDistrictMemoryLine
  | CreviaMapDistrictOperationLine
  | CreviaMapDistrictChainLine;

function orderLinesByLayerFocus(
  lines: MapDistrictIntelligenceLine[],
  focus: CreviaMapDistrictIntelligenceLayerFocus,
): MapDistrictIntelligenceLine[] {
  const weight = (kind: string) => {
    if (focus === 'trust') {
      if (kind === 'trust') return 0;
      if (kind === 'memory') return 1;
      if (kind === 'chain') return 2;
      return 3;
    }
    if (focus === 'memory') {
      if (kind === 'memory') return 0;
      if (kind === 'trust') return 1;
      if (kind === 'chain') return 2;
      return 3;
    }
    if (focus === 'operation') {
      if (kind === 'operation') return 0;
      if (kind === 'chain') return 1;
      if (kind === 'trust') return 2;
      return 3;
    }
    if (kind === 'trust') return 0;
    if (kind === 'memory') return 1;
    if (kind === 'chain') return 2;
    return 3;
  };

  return [...lines].sort((a, b) => weight(a.kind) - weight(b.kind) || a.priority - b.priority);
}

export function buildMapDistrictIntelligenceChips(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictIntelligenceChip[] {
  const day = input.day ?? 1;
  if (day <= 1 || input.crisisOverlayVisible) return [];

  const trustLine = buildSelectedDistrictTrustMapLine(input);
  const memoryLine = buildSelectedDistrictMemoryMapLine(input);
  const chips: CreviaMapDistrictIntelligenceChip[] = [];

  if (trustLine) {
    chips.push({
      id: `${trustLine.id}_chip`,
      label: day <= 3 ? 'Güven' : trustLine.text.split(':')[1]?.trim().split(' ')[0] ?? 'Güven',
      kind: 'trust',
      tone: trustLine.tone,
      iconKey: trustLine.iconKey,
    });
  }

  if (memoryLine && day >= 4) {
    const memoryLabel =
      memoryLine.text.includes('toparlan') || memoryLine.text.includes('Toparlan')
        ? 'Toparlanıyor'
        : memoryLine.text.includes('izi')
          ? 'İz var'
          : 'İz';
    chips.push({
      id: `${memoryLine.id}_chip`,
      label: memoryLabel.slice(0, 14),
      kind: 'memory',
      tone: memoryLine.tone,
      iconKey: memoryLine.iconKey,
    });
  }

  return chips.slice(0, MAP_DISTRICT_INTELLIGENCE_MAX_STRIP_CHIPS);
}

export function buildMapDistrictIntelligenceModel(
  input: CreviaMapDistrictIntelligenceInput = {},
): CreviaMapDistrictIntelligenceModel {
  const districtId = normalizeMapDistrictId(input.selectedDistrictId ?? 'merkez') ?? 'merkez';
  const visibility = buildMapDistrictIntelligenceVisibility(input);
  const layerFocus = resolveMapDistrictIntelligenceLayerFocus(input.activeMapLayerId);
  const crisisPriorityActive = input.crisisOverlayVisible === true;

  const trustLine = buildSelectedDistrictTrustMapLine(input);
  const memoryLine = buildSelectedDistrictMemoryMapLine(input);
  const operationLine = buildSelectedDistrictOperationMapLine(input);
  const chainLine = buildSelectedDistrictChainMapLine(input);

  const candidateLines = [trustLine, memoryLine, operationLine, chainLine].filter(Boolean) as MapDistrictIntelligenceLine[];

  let maxLines = visibility.maxVisibleLines;
  if (
    input.activeMapLayerId === 'base_districts' &&
    layerFocus === 'base' &&
    !crisisPriorityActive
  ) {
    maxLines = Math.min(maxLines, 1);
  }

  const visibleLines = orderLinesByLayerFocus(candidateLines, layerFocus).slice(0, maxLines);
  const uniqueTexts = new Set<string>();
  const dedupedLines = visibleLines.filter((line) => {
    const key = line.text.toLocaleLowerCase('tr-TR');
    if (uniqueTexts.has(key)) return false;
    uniqueTexts.add(key);
    return true;
  });

  return {
    districtId,
    districtName: districtName(districtId),
    visible: dedupedLines.length > 0 && visibility.mode !== 'hidden',
    visibility,
    layerFocus,
    crisisPriorityActive,
    trustLine,
    memoryLine,
    operationLine,
    chainLine,
    visibleLines: dedupedLines,
    stripChips: buildMapDistrictIntelligenceChips(input),
    isHintOnly: true,
  };
}

export function buildMapDistrictIntelligenceDebugRows(
  input: CreviaMapDistrictIntelligenceInput = {},
): string[] {
  const model = buildMapDistrictIntelligenceModel(input);
  return [
    `district: ${model.districtId}`,
    `visible: ${model.visible}`,
    `mode: ${model.visibility.mode}`,
    `layerFocus: ${model.layerFocus}`,
    `crisisPriority: ${model.crisisPriorityActive}`,
    `lines: ${model.visibleLines.length}`,
    ...model.visibleLines.map((line) => `${line.kind}: ${line.text.slice(0, 48)}`),
  ];
}

export function validateMapDistrictIntelligenceCopy(model: CreviaMapDistrictIntelligenceModel): boolean {
  for (const line of model.visibleLines) {
    if (line.text.length > MAP_DISTRICT_INTELLIGENCE_MAX_COPY_LENGTH + 1) return false;
    if (copyContainsForbiddenTerms(line.text)) return false;
    if (line.kind === 'operation' && line.text.toLocaleLowerCase('tr-TR').includes('başlat')) {
      return false;
    }
  }
  return model.visibleLines.length <= MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES;
}

export function mapDistrictIntelligenceCopyContainsForbiddenTerms(text: string): boolean {
  return copyContainsForbiddenTerms(text);
}

export function mapDistrictIntelligenceCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return (
    districtOperationsRuntimeCopyContainsPanicTerms(text) ||
    [...DISTRICT_TRUST_RUNTIME_PANIC_TERMS, ...DISTRICT_MEMORY_RUNTIME_PANIC_TERMS].some((term) =>
      normalized.includes(term),
    )
  );
}
