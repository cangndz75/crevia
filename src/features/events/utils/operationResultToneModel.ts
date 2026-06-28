import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import type { EventResultOutcomeBand } from './eventResultRevealPresentation';

export type OperationResultRevealToneId =
  | 'clear_success'
  | 'controlled_success'
  | 'partial_success'
  | 'costly_success'
  | 'delayed_response'
  | 'social_sensitive'
  | 'resource_pressure'
  | 'maintenance_shadow'
  | 'trust_recovery'
  | 'tomorrow_risk';

export type OperationResultRevealTone = {
  id: OperationResultRevealToneId;
  scoreLabel: string;
  heroBadge: string;
  accent: 'positive' | 'mixed' | 'warning' | 'gold' | 'neutral';
  iconKey: string;
};

function findMetricDelta(
  snapshot: DecisionResultSnapshot,
  key: 'publicSatisfaction' | 'budget' | 'personnelMorale' | 'operationRisk',
): number {
  return snapshot.metricChanges.find((metric) => metric.key === key)?.delta ?? 0;
}

export function resolveOperationResultRevealTone(input: {
  snapshot: DecisionResultSnapshot;
  outcomeBand: EventResultOutcomeBand;
  strategyId?: EventPlanStrategyId | null;
  maintenanceHint?: string | null;
  hasTomorrowRisk?: boolean;
}): OperationResultRevealTone {
  const { snapshot, outcomeBand, strategyId, maintenanceHint, hasTomorrowRisk } = input;
  const publicDelta = findMetricDelta(snapshot, 'publicSatisfaction');
  const budgetDelta = findMetricDelta(snapshot, 'budget');
  const moraleDelta = findMetricDelta(snapshot, 'personnelMorale');
  const social = snapshot.subsystemOutcomes.find((item) => item.key === 'social');
  const socialWarning =
    social?.status === 'warning' || social?.status === 'critical';
  const maintenanceShadow = Boolean(maintenanceHint?.trim());

  if (hasTomorrowRisk && outcomeBand !== 'success') {
    return {
      id: 'tomorrow_risk',
      scoreLabel: 'Yarına Risk Taşındı',
      heroBadge: 'İz sürüyor',
      accent: 'warning',
      iconKey: 'calendar-outline',
    };
  }

  if (maintenanceShadow && (outcomeBand === 'partial' || outcomeBand === 'mixed')) {
    return {
      id: 'maintenance_shadow',
      scoreLabel: 'Bakım Gölgesi Var',
      heroBadge: 'Hazırlık izlenmeli',
      accent: 'mixed',
      iconKey: 'construct-outline',
    };
  }

  if (publicDelta >= 4 && outcomeBand === 'success') {
    return {
      id: 'trust_recovery',
      scoreLabel: 'Güven Toparlanıyor',
      heroBadge: 'Mahalle fark etti',
      accent: 'positive',
      iconKey: 'shield-checkmark-outline',
    };
  }

  if (budgetDelta < -1200 || moraleDelta < -4) {
    if (outcomeBand === 'success' || outcomeBand === 'partial') {
      return {
        id: 'costly_success',
        scoreLabel: 'Maliyetli Başarı',
        heroBadge: 'Kaynak baskısı arttı',
        accent: 'gold',
        iconKey: 'wallet-outline',
      };
    }
    return {
      id: 'resource_pressure',
      scoreLabel: 'Kaynak Baskısı Arttı',
      heroBadge: 'Ekip yükü izlenmeli',
      accent: 'warning',
      iconKey: 'cube-outline',
    };
  }

  if (socialWarning) {
    return {
      id: 'social_sensitive',
      scoreLabel: 'Sosyal Tepki Hassas',
      heroBadge: 'Mahalle izliyor',
      accent: 'warning',
      iconKey: 'chatbubbles-outline',
    };
  }

  if (strategyId === 'rapid_response' && (moraleDelta < 0 || budgetDelta < -600)) {
    return {
      id: 'delayed_response',
      scoreLabel: 'Hızlı Müdahale Etkisi',
      heroBadge: 'Tempo korundu',
      accent: 'mixed',
      iconKey: 'flash-outline',
    };
  }

  if (outcomeBand === 'partial' || outcomeBand === 'mixed') {
    return {
      id: 'partial_success',
      scoreLabel: 'Kısmi Başarı',
      heroBadge: 'Baskı azaldı',
      accent: 'mixed',
      iconKey: 'pulse-outline',
    };
  }

  if (outcomeBand === 'risk') {
    return {
      id: 'resource_pressure',
      scoreLabel: 'Risk Kontrol Altında Değil',
      heroBadge: 'İzleme gerekli',
      accent: 'warning',
      iconKey: 'alert-circle-outline',
    };
  }

  if (outcomeBand === 'success') {
    return {
      id: 'clear_success',
      scoreLabel: 'Kontrol Altına Alındı',
      heroBadge: 'Operasyon tamam',
      accent: 'positive',
      iconKey: 'checkmark-circle-outline',
    };
  }

  return {
    id: 'controlled_success',
    scoreLabel: 'Kontrollü Başarı',
    heroBadge: 'Sonuç kayda geçti',
    accent: 'neutral',
    iconKey: 'flag-outline',
  };
}
