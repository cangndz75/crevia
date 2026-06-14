import {
  DAY8_OPERATION_FEED_BINDING_ACCESSIBILITY_MAX,
  DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS,
  DAY8_OPERATION_FEED_BINDING_REASON_MAX,
} from './day8OperationFeedBindingConstants';
import type {
  Day8OperationFeedBindingCardModel,
  Day8OperationFeedBindingResult,
  Day8OperationFeedBiasKind,
} from './day8OperationFeedBindingTypes';

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function buildAccessibilityLabel(title: string, reasonLine: string, badgeLabel: string): string {
  return clampLine(`${title}. ${reasonLine}. Rozet: ${badgeLabel}.`, DAY8_OPERATION_FEED_BINDING_ACCESSIBILITY_MAX);
}

export function buildOperationFeedBindingCardModels(
  result: Day8OperationFeedBindingResult,
): Day8OperationFeedBindingCardModel[] {
  if (!result.isActive) return [];
  return result.feedBindings.slice(0, DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS).map((binding) => {
    const bias = result.biases.find((entry) => binding.appliedBiasIds.includes(entry.id));
    return {
      id: binding.id,
      title: binding.title,
      reasonLine: clampLine(binding.reasonLine, DAY8_OPERATION_FEED_BINDING_REASON_MAX),
      badgeLabel: binding.badgeLabel,
      districtName: binding.districtName,
      tone: bias?.tone ?? 'neutral',
      visibilityLevel: binding.visibilityLevel,
      accessibilityLabel: buildAccessibilityLabel(binding.title, binding.reasonLine, binding.badgeLabel),
    };
  });
}

export function buildPrimaryOperationFeedBindingCard(
  result: Day8OperationFeedBindingResult,
): Day8OperationFeedBindingCardModel | undefined {
  return buildOperationFeedBindingCardModels(result)[0];
}

export function buildOperationFeedReasonLine(result: Day8OperationFeedBindingResult): string | undefined {
  const primary = result.primaryFeedBinding ?? result.feedBindings[0];
  if (!primary || primary.visibilityLevel === 'hidden') return undefined;
  return clampLine(primary.reasonLine, DAY8_OPERATION_FEED_BINDING_REASON_MAX);
}

export function buildOperationFeedBadgeLabel(result: Day8OperationFeedBindingResult): string | undefined {
  const primary = result.primaryFeedBinding ?? result.feedBindings[0];
  return primary?.badgeLabel;
}

export function buildEceOperationFeedBindingLine(result: Day8OperationFeedBindingResult): string | undefined {
  if (!result.isActive) return undefined;
  const detailedBias = result.biases.find((bias) => bias.visibilityLevel === 'detailed');
  const line = detailedBias?.reasonLine ?? result.primaryFeedBinding?.reasonLine ?? result.biases[0]?.reasonLine;
  if (!line) return undefined;
  return clampLine(`Operasyon listesi: ${line}`, DAY8_OPERATION_FEED_BINDING_REASON_MAX);
}

export function buildHubOperationFeedBindingHint(result: Day8OperationFeedBindingResult): string | undefined {
  return buildOperationFeedReasonLine(result);
}

export function buildOperationFocusBindingSubtitle(result: Day8OperationFeedBindingResult): string | undefined {
  const primary = result.primaryFeedBinding;
  if (!primary || primary.visibilityLevel === 'teaser') return undefined;
  return buildOperationFeedReasonLine(result);
}

export type CenterOperationFeedBindingSignalDraft = {
  id: string;
  title: string;
  description: string;
  sourceLabel: string;
  sourceIds: string[];
  sortScore: number;
};

const OPERATION_FEED_SIGNAL_LABELS: Partial<Record<Day8OperationFeedBiasKind, string>> = {
  city_rhythm_bias: 'Ritim sinyali',
  safe_watch_bias: 'Ritim sinyali',
  district_neglect_bias: 'Operasyon odağı',
  district_recovery_bias: 'Operasyon odağı',
  positive_comeback_bias: 'Operasyon odağı',
};

export function buildCenterOperationFeedBindingSignal(
  result: Day8OperationFeedBindingResult | null | undefined,
): CenterOperationFeedBindingSignalDraft | undefined {
  if (!result?.isActive || result.day < 8) return undefined;
  const binding = result.primaryFeedBinding ?? result.feedBindings[0];
  if (!binding || binding.visibilityLevel === 'hidden') return undefined;
  const biasKind = result.biases.find((bias) => binding.appliedBiasIds.includes(bias.id))?.kind;
  const sourceLabel =
    OPERATION_FEED_SIGNAL_LABELS[biasKind ?? 'city_rhythm_bias'] ?? 'Stratejik eşleşme';
  const title = binding.isPresentationOnly ? 'Stratejik öneri' : 'Operasyon odağı';
  return {
    id: `signal-operation-feed-${binding.id}`,
    title,
    description: clampLine(binding.reasonLine, DAY8_OPERATION_FEED_BINDING_REASON_MAX),
    sourceLabel,
    sourceIds: binding.sourceIds,
    sortScore: binding.isPresentationOnly ? 420 : 560,
  };
}
