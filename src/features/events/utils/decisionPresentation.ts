import type {
  EventDecision,
  EventDecisionCost,
  EventDecisionEffect,
} from '@/core/models/EventCard';
import type { EffectChipData } from '@/features/events/utils/eventPresentation';

export type ImpactLevel = 'low' | 'medium' | 'high';

const LEVEL_LABEL: Record<ImpactLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

function magnitudeLevel(absValue: number, low: number, high: number): ImpactLevel {
  if (absValue >= high) return 'high';
  if (absValue >= low) return 'medium';
  return 'low';
}

function budgetSpendLevel(
  effects: EventDecisionEffect,
  costs?: EventDecisionCost,
): ImpactLevel {
  const spend =
    Math.abs(Math.min(0, effects.budget)) + (costs?.budget ?? 0);
  return magnitudeLevel(spend, 2500, 6000);
}

function moraleImpactLevel(effects: EventDecisionEffect): ImpactLevel {
  const delta = Math.abs(effects.morale ?? effects.staffMorale ?? 0);
  return magnitudeLevel(delta, 3, 8);
}

function satisfactionImpactLevel(effects: EventDecisionEffect): ImpactLevel {
  return magnitudeLevel(Math.abs(effects.publicSatisfaction), 4, 10);
}

function riskImpactLevel(effects: EventDecisionEffect): ImpactLevel {
  return magnitudeLevel(Math.abs(effects.risk), 5, 12);
}

export function buildQualitativeEffectChips(
  effects: EventDecisionEffect,
  costs?: EventDecisionCost,
): EffectChipData[] {
  const budgetLevel = budgetSpendLevel(effects, costs);
  const moraleLevel = moraleImpactLevel(effects);
  const satLevel = satisfactionImpactLevel(effects);
  const riskLevel = riskImpactLevel(effects);

  return [
    {
      key: 'public',
      icon: 'happy-outline',
      label: 'Halk etkisi',
      value: LEVEL_LABEL[satLevel],
      tone:
        effects.publicSatisfaction > 0
          ? 'positive'
          : effects.publicSatisfaction < 0
            ? 'negative'
            : 'neutral',
    },
    {
      key: 'budget',
      icon: 'wallet-outline',
      label: 'Maliyet',
      value: LEVEL_LABEL[budgetLevel],
      tone: budgetLevel === 'high' ? 'negative' : 'neutral',
    },
    {
      key: 'morale',
      icon: 'people-outline',
      label: 'Ekip yükü',
      value: LEVEL_LABEL[moraleLevel],
      tone:
        (effects.morale ?? 0) < 0 || (effects.staffMorale ?? 0) < 0
          ? 'negative'
          : 'neutral',
    },
    {
      key: 'risk',
      icon: 'alert-circle-outline',
      label: 'Risk etkisi',
      value: LEVEL_LABEL[riskLevel],
      tone: effects.risk < 0 ? 'positive' : effects.risk > 0 ? 'negative' : 'neutral',
    },
  ];
}

export function getDecisionResultMessage(decision: EventDecision): string {
  if (decision.resultText) {
    return decision.resultText;
  }

  const spend =
    Math.abs(Math.min(0, decision.effects.budget)) +
    (decision.costs?.budget ?? 0);
  const trust = decision.effects.trust ?? 0;
  const cleanliness = decision.effects.cleanliness ?? 0;

  if (trust > 0 || cleanliness > 0 || spend >= 5000 || decision.style === 'cautious') {
    return 'Daha maliyetli bir karar verdin, ancak uzun vadeli güven etkisi oluştu.';
  }

  if (
    spend <= 2500 &&
    (decision.style === 'balanced' || decision.style === 'risky')
  ) {
    return 'Bütçe korundu, fakat tekrar riski tamamen kapanmadı.';
  }

  return 'Soruna hızlı müdahale edildi, ancak kaynak yükü arttı.';
}
