import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

import {
  buildReadinessStrategicPriority,
  scorePlanStrategyReadinessFit,
} from './readinessStrategicPriorityModel';
import type {
  ReadinessDispatchFitPresentation,
  ReadinessFitBadge,
  ReadinessPlanFitPresentation,
  ReadinessStrategicPriorityInput,
} from './readinessStrategicPriorityTypes';

const PLAN_STRATEGIES: EventPlanStrategyId[] = [
  'rapid_response',
  'balanced_plan',
  'long_term_fix',
];

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function mapFitBadge(
  strategyId: EventPlanStrategyId,
  input: ReadinessStrategicPriorityInput,
): ReadinessFitBadge | null {
  const { score, risky } = scorePlanStrategyReadinessFit(strategyId, input);
  const result = buildReadinessStrategicPriority(input);
  const domain = result.priority.domain;

  if (input.day <= 1) return null;

  if (risky && score < 42) {
    const warning =
      strategyId === 'rapid_response' && (domain === 'vehicle' || domain === 'personnel')
        ? clamp(
            domain === 'vehicle'
              ? 'Araç hazırlığı düşük; hızlı müdahale riskli görünüyor.'
              : 'Ekip morali düşük; hızlı müdahale yorgunluk riski doğurur.',
            88,
          )
        : domain === 'budget' && strategyId === 'long_term_fix'
          ? 'Kaynak baskısı önleyici planı maliyetli kılar.'
          : undefined;

    return {
      id: `readiness_fit_${strategyId}_risky`,
      label: 'Hazırlık riski',
      tone: 'risky',
      outcomePreview: clamp(result.priority.description, 72),
      warning,
    };
  }

  if (score >= 68) {
    const label =
      strategyId === 'long_term_fix' && (domain === 'facility' || domain === 'equipment')
        ? 'Önleyici eşleşme'
        : strategyId === 'balanced_plan'
          ? 'Dengeli eşleşme'
          : 'Güçlü eşleşme';

    const preview =
      strategyId === 'long_term_fix' && domain === 'facility'
        ? 'Konteyner bakımı önleyici planla toparlanabilir.'
        : strategyId === 'rapid_response' && domain === 'ready_positive'
          ? 'Hazırlık hızlı müdahaleyi destekliyor.'
          : clamp(result.recovery?.label ?? result.priority.description, 72);

    return {
      id: `readiness_fit_${strategyId}_strong`,
      label,
      tone: 'strong_match',
      outcomePreview: preview,
    };
  }

  if (score >= 48) {
    return {
      id: `readiness_fit_${strategyId}_neutral`,
      label: 'Orta uyum',
      tone: 'neutral',
      outcomePreview: clamp(result.priority.description, 72),
    };
  }

  return {
    id: `readiness_fit_${strategyId}_weak`,
    label: 'Zayıf eşleşme',
    tone: 'weak_match',
    outcomePreview: clamp(result.priority.description, 72),
  };
}

export function buildReadinessPlanFitPresentation(
  input: ReadinessStrategicPriorityInput,
): ReadinessPlanFitPresentation {
  if (input.day <= 1) {
    return { visibility: 'hidden', strategyFits: {} };
  }

  const strategyFits: Partial<Record<EventPlanStrategyId, ReadinessFitBadge>> = {};
  for (const strategyId of PLAN_STRATEGIES) {
    const badge = mapFitBadge(strategyId, input);
    if (badge) strategyFits[strategyId] = badge;
  }

  return {
    visibility: Object.keys(strategyFits).length > 0 ? 'visible' : 'hidden',
    strategyFits,
  };
}

export function buildReadinessDispatchFitPresentation(
  input: ReadinessStrategicPriorityInput & {
    compatibilityBand?: 'low' | 'medium' | 'high' | 'unknown';
  },
): ReadinessDispatchFitPresentation {
  if (input.day <= 1) {
    return { visibility: 'hidden', fitBadge: null, riskChip: null };
  }

  const result = buildReadinessStrategicPriority(input);
  const { priority } = result;

  let fitBadge: ReadinessFitBadge | null = null;
  const band = input.compatibilityBand ?? 'medium';

  if (band === 'high' && priority.tone !== 'critical') {
    fitBadge = {
      id: 'dispatch_fit_strong',
      label: 'Güçlü eşleşme',
      tone: 'strong_match',
      outcomePreview:
        priority.domain === 'personnel'
          ? 'Bu ekip hızlı müdahaleye hazır, ancak ikinci operasyon için yorgunluk riski doğurur.'
          : 'Ekip ve kaynak planla uyumlu görünüyor.',
    };
  } else if (band === 'low' || priority.tone === 'critical') {
    fitBadge = {
      id: 'dispatch_fit_weak',
      label: 'Zayıf eşleşme',
      tone: 'weak_match',
      outcomePreview: clamp(priority.description, 88),
      warning: clamp(priority.title, 88),
    };
  } else {
    fitBadge = {
      id: 'dispatch_fit_mixed',
      label: 'Orta uyum',
      tone: 'neutral',
      outcomePreview: clamp(priority.description, 72),
    };
  }

  const riskChip =
    priority.tone === 'warning' || priority.tone === 'critical'
      ? priority.riskChip
      : null;

  return {
    visibility: 'visible',
    fitBadge,
    riskChip,
  };
}

export function resolveReadinessFitChipLabel(
  strategyId: EventPlanStrategyId,
  input: ReadinessStrategicPriorityInput,
): string | null {
  const fit = buildReadinessPlanFitPresentation(input);
  return fit.strategyFits[strategyId]?.label ?? null;
}
