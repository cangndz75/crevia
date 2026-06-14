import type {
  MapGameplayBinding,
  MapGameplayBindingCardModel,
} from './mapGameplayBindingTypes';
import { enrichMapGameplayBindingDecisionLine } from '@/core/mapSignalCopy/mapSignalCopyPresentation';

type BuildMapGameplayBindingCardModelsOptions = {
  day?: number;
  permissionAvailable?: boolean;
  pressureKind?: string;
  recentTemplateIds?: string[];
};

function badgeFor(binding: MapGameplayBinding): string {
  if (binding.visibilityLevel === 'teaser') return 'Yetki onizleme';
  if (binding.visibilityLevel === 'detailed') return 'Detayli';
  if (binding.isActionable) return 'Karar destegi';
  return 'Ozet';
}

function toneFor(binding: MapGameplayBinding): MapGameplayBindingCardModel['tone'] {
  if (binding.visibilityLevel === 'teaser') return 'locked';
  if (!binding.isActionable) return 'neutral';
  if (binding.role === 'risk_reader' || binding.role === 'resource_board') return 'warning';
  if (binding.confidence === 'high') return 'positive';
  return 'neutral';
}

function score(binding: MapGameplayBinding): number {
  let value = binding.priority;
  if (binding.isActionable) value += 60;
  if (binding.confidence === 'high') value += 30;
  if (binding.confidence === 'medium') value += 12;
  if (binding.dayRange === 'day_8_plus' || binding.dayRange === 'day_10_plus') value += 16;
  if (binding.visibilityLevel === 'teaser' && binding.role === 'authority_unlock_surface') value += 10;
  if (binding.sourceKinds.includes('fallback')) value -= 20;
  return value;
}

export function buildMapGameplayBindingCardModels(
  bindings: readonly MapGameplayBinding[],
  options: BuildMapGameplayBindingCardModelsOptions = {},
): MapGameplayBindingCardModel[] {
  const recentTemplateIds = [...(options.recentTemplateIds ?? [])];
  return bindings
    .filter((binding) => binding.visibilityLevel !== 'hidden')
    .slice()
    .sort((a, b) => score(b) - score(a) || b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((binding) => {
      const decisionLine = enrichMapGameplayBindingDecisionLine(binding, {
        day: options.day ?? 1,
        permissionAvailable: options.permissionAvailable,
        pressureKind: options.pressureKind,
        recentTemplateIds,
      });
      recentTemplateIds.push(binding.id);
      return {
        id: binding.id,
        title: binding.title,
        question: binding.playerQuestion,
        decisionLine,
        badgeLabel: badgeFor(binding),
        tone: toneFor(binding),
        visibilityLevel: binding.visibilityLevel,
        isActionable: binding.isActionable,
        priority: binding.priority,
        accessibilityLabel: `${binding.title}: ${binding.playerQuestion} ${decisionLine}`.trim(),
      };
    });
}
