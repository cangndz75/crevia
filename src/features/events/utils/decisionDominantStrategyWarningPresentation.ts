import { buildDominantStrategyDetector } from '@/core/dominantStrategyDetector/dominantStrategyDetectorModel';
import {
  DOMINANT_STRATEGY_FULL_VISIBLE_DAY,
  DOMINANT_STRATEGY_MIN_VISIBLE_DAY,
} from '@/core/dominantStrategyDetector/dominantStrategyDetectorConstants';
import type { DominantStrategyDetectorInput } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import type { DecisionArchetypeId } from '@/features/events/utils/decisionTradeoffTypes';

const STRATEGY_PATTERN_WARNINGS: Partial<
  Record<
    import('@/core/dominantStrategyDetector/dominantStrategyDetectorTypes').DominantStrategyPattern,
    Partial<Record<EventPlanStrategyId | DecisionArchetypeId, string>>
  >
> = {
  rapid_response_overuse: {
    rapid_response: 'Son günlerde hızlı müdahale çizgin güçlendi; ekip yorgunluğu bu tercihi riskli yapabilir.',
  },
  preventive_overuse: {
    long_term_fix: 'Önleyici plan ağırlığın arttı; acil baskı birikebilir.',
    preventive: 'Önleyici çizgi güçlü; kısa vadeli baskı birikebilir.',
  },
  balanced_default_overuse: {
    balanced_plan: 'Sürekli dengeli oynuyorsun; kritik durumlarda etki sınırlı kalabilir.',
    balanced: 'Dengeli çizgi baskın; kritik anlarda yetersiz kalabilir.',
  },
  resource_saving_overuse: {
    resource_saving: 'Kaynak koruma alışkanlığın arttı; sosyal sabır düşebilir.',
  },
  public_trust_overfocus: {
    social_trust: 'Sosyal güven odağın güçlü; kaynak baskısı büyüyebilir.',
  },
};

function clampLine(text: string, max = 110): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export type BuildDominantStrategyWarningInput = {
  day?: number;
  dominantStrategyInput?: DominantStrategyDetectorInput | null;
  strategyId?: EventPlanStrategyId;
  archetypeId?: DecisionArchetypeId;
  avoidLines?: string[];
};

export function buildDominantStrategyWarningForPlan(
  input: BuildDominantStrategyWarningInput,
): string | null {
  const day = input.day ?? 1;
  if (day < DOMINANT_STRATEGY_MIN_VISIBLE_DAY) return null;
  if (!input.dominantStrategyInput) return null;

  const result = buildDominantStrategyDetector(input.dominantStrategyInput);
  if (!result.isVisible || result.pattern === 'none') return null;
  if (day < DOMINANT_STRATEGY_FULL_VISIBLE_DAY && result.confidence !== 'high') {
    return null;
  }

  const warnings = STRATEGY_PATTERN_WARNINGS[result.pattern];
  if (!warnings) return null;

  const key = input.strategyId ?? input.archetypeId;
  if (!key) return null;

  const line = warnings[key];
  if (!line) return null;

  const normalized = line.trim().toLowerCase();
  if (
    input.avoidLines?.some((avoid) => avoid.trim().toLowerCase() === normalized)
  ) {
    return null;
  }

  return clampLine(line);
}

export function buildDecisionMemoryChip(
  input: BuildDominantStrategyWarningInput,
): string | null {
  const day = input.day ?? 1;
  if (day < DOMINANT_STRATEGY_FULL_VISIBLE_DAY) return null;
  if (!input.dominantStrategyInput) return null;

  const result = buildDominantStrategyDetector(input.dominantStrategyInput);
  if (!result.isVisible || result.pattern === 'none') return null;

  const chipByPattern: Partial<
    Record<
      import('@/core/dominantStrategyDetector/dominantStrategyDetectorTypes').DominantStrategyPattern,
      string
    >
  > = {
    rapid_response_overuse: 'Hızlı müdahale çizgisi',
    preventive_overuse: 'Önleyici plan çizgisi',
    balanced_default_overuse: 'Dengeli oyun çizgisi',
    resource_saving_overuse: 'Kaynak koruma çizgisi',
    public_trust_overfocus: 'Sosyal güven çizgisi',
  };

  return chipByPattern[result.pattern] ?? null;
}
