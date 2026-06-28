import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DecisionRecord } from '@/core/models/DecisionRecord';

export type TradeoffItem = {
  key: string;
  label: string;
  tone: 'gain' | 'cost';
};

export type EndOfDayTradeoffBalancePresentation = {
  visible: boolean;
  gains: TradeoffItem[];
  costs: TradeoffItem[];
  balanceRatio: number;
  balanceLabel: string;
};

export type BuildTradeoffBalanceInput = {
  day: number;
  metrics: GameMetrics;
  decisionsToday: DecisionRecord[];
  maintenanceRiskHigh?: boolean;
  resourcePressureHigh?: boolean;
  trustDelta?: number;
  moraleDelta?: number;
};

function sumDeltas(
  decisions: DecisionRecord[],
  key: 'publicSatisfaction' | 'staffMorale' | 'budget' | 'trust',
): number {
  return decisions.reduce((sum, r) => {
    const v = r.appliedEffects[key];
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
}

export function buildEndOfDayTradeoffBalancePresentation(
  input: BuildTradeoffBalanceInput,
): EndOfDayTradeoffBalancePresentation {
  const trust =
    input.trustDelta ??
    sumDeltas(input.decisionsToday, 'publicSatisfaction') +
      sumDeltas(input.decisionsToday, 'trust');
  const morale =
    input.moraleDelta ?? sumDeltas(input.decisionsToday, 'staffMorale');
  const budget = sumDeltas(input.decisionsToday, 'budget');

  const gains: TradeoffItem[] = [];
  const costs: TradeoffItem[] = [];

  if (trust >= 2) {
    gains.push({ key: 'trust', label: 'Güven +', tone: 'gain' });
  } else if (trust <= -2) {
    costs.push({ key: 'trust', label: 'Güven baskısı', tone: 'cost' });
  }

  if (morale >= 2) {
    gains.push({ key: 'morale', label: 'Ekip morali +', tone: 'gain' });
  } else if (morale <= -2) {
    costs.push({ key: 'morale', label: 'Ekip yorgunluğu', tone: 'cost' });
  }

  if (budget >= 500) {
    gains.push({ key: 'budget', label: 'Kaynak kazanımı', tone: 'gain' });
  } else if (budget <= -500 || input.resourcePressureHigh) {
    costs.push({ key: 'budget', label: 'Kaynak -', tone: 'cost' });
  }

  if (input.maintenanceRiskHigh) {
    costs.push({ key: 'readiness', label: 'Hazırlık düştü', tone: 'cost' });
  } else if (input.day >= 8) {
    gains.push({ key: 'readiness', label: 'Bakım kontrol altında', tone: 'gain' });
  }

  if (input.metrics.publicSatisfaction >= 58 && gains.length === 0) {
    gains.push({ key: 'city', label: 'Şikayet baskısı azaldı', tone: 'gain' });
  }

  if (gains.length === 0 && costs.length === 0) {
    if (input.day === 1) {
      return {
        visible: true,
        gains: [{ key: 'learn', label: 'İlk etki görüldü', tone: 'gain' }],
        costs: [{ key: 'learn-cost', label: 'Öğrenme bedeli', tone: 'cost' }],
        balanceRatio: 0.5,
        balanceLabel: 'Dengeli tradeoff',
      };
    }
    gains.push({ key: 'steady', label: 'Denge korundu', tone: 'gain' });
    costs.push({ key: 'carry', label: 'Küçük baskı taşındı', tone: 'cost' });
  }

  const gainWeight = gains.length;
  const costWeight = costs.length;
  const balanceRatio =
    gainWeight + costWeight > 0 ? gainWeight / (gainWeight + costWeight) : 0.5;

  let balanceLabel = 'Dengeli tradeoff';
  if (balanceRatio >= 0.65) balanceLabel = 'Kazanım ağır bastı';
  else if (balanceRatio <= 0.35) balanceLabel = 'Bedel ağır bastı';

  return {
    visible: true,
    gains: gains.slice(0, 3),
    costs: costs.slice(0, 3),
    balanceRatio,
    balanceLabel,
  };
}
