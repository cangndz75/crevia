import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

import type {
  ReadinessPrioritySurfacePresentation,
  ReadinessStrategicPriorityInput,
  ReadinessStrategicPriorityResult,
} from './readinessStrategicPriorityTypes';
import { buildReadinessStrategicPriority } from './readinessStrategicPriorityModel';

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildReadinessPrioritySurface(
  result: ReadinessStrategicPriorityResult,
  avoidLines: string[] = [],
): ReadinessPrioritySurfacePresentation {
  const { priority, densityBand } = result;

  if (densityBand === 'day1') {
    const chips = [priority.riskChip];
    return {
      visibility: 'visible',
      hero: {
        title: priority.title,
        description: priority.description,
        accessibilityLabel: `${priority.title}. ${priority.description}`,
      },
      chips,
      ctaHint: priority.ctaHint,
      ctaActionKey: priority.ctaActionKey,
      tone: priority.tone,
    };
  }

  const chips = [
    priority.riskChip,
    ...(priority.affectedOperationChip ? [priority.affectedOperationChip] : []),
    priority.recommendedActionChip,
  ].slice(0, 3);

  const dedupedChips = chips.filter(
    (chip) => !lineDuplicatesAvoidLines(chip.label, avoidLines),
  );

  return {
    visibility: 'visible',
    hero: {
      title: priority.title,
      description: clamp(priority.description, 88),
      accessibilityLabel: `Bugünün hazırlık önceliği: ${priority.title}. ${priority.description}`,
    },
    chips: dedupedChips.length > 0 ? dedupedChips : chips,
    ctaHint: priority.ctaHint,
    ctaActionKey: priority.ctaActionKey,
    tone: priority.tone,
  };
}

export function buildReadinessPriorityFromInput(
  input: ReadinessStrategicPriorityInput,
): {
  result: ReadinessStrategicPriorityResult;
  surface: ReadinessPrioritySurfacePresentation;
} {
  const result = buildReadinessStrategicPriority(input);
  const surface = buildReadinessPrioritySurface(result, input.avoidLines ?? []);
  return { result, surface };
}

export function readinessPriorityHasDuplicateCopy(
  surface: ReadinessPrioritySurfacePresentation,
): boolean {
  const lines = [
    surface.hero.title,
    surface.hero.description,
    ...surface.chips.map((c) => c.label),
  ];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function readinessPriorityAvoidsBasicFallback(text: string): boolean {
  const forbidden = [
    /^hazırlık:\s*%?\d+/i,
    /^bakım listesi/i,
    /^durum$/i,
    /^özet$/i,
    /^bilgi$/i,
  ];
  return !forbidden.some((p) => p.test(text.trim()));
}
