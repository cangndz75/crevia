import type {
  MaintenanceEconomyChip,
  MaintenanceEconomyTradeoffStrip,
} from './maintenanceEconomyFeelTypes';
import type { MaintenanceEconomyPressureSnapshot } from './maintenanceEconomyToneModel';
import type { MaintenanceEconomyToneId } from './maintenanceEconomyFeelTypes';

function clampRatio(value: number): number {
  return Math.max(0.12, Math.min(0.88, value));
}

export function buildMaintenanceEconomyTradeoffStrip(input: {
  snapshot: MaintenanceEconomyPressureSnapshot;
  toneId: MaintenanceEconomyToneId;
  densityBand: 'day1' | 'openEnded';
}): MaintenanceEconomyTradeoffStrip {
  const { snapshot, toneId, densityBand } = input;
  const gains: MaintenanceEconomyChip[] = [];
  const costs: MaintenanceEconomyChip[] = [];

  if (toneId === 'readiness_strengthened' || toneId === 'timely_maintenance_relief' || toneId === 'tomorrow_risk_reduced') {
    gains.push({ id: 'readiness_gain', label: 'Hazırlık +', tone: 'gain' });
    gains.push({ id: 'tomorrow_gain', label: 'Yarın riski azalır', tone: 'teal' });
  } else if (snapshot.stabilizedCount > 0) {
    gains.push({ id: 'readiness_gain', label: 'Hazırlık +', tone: 'gain' });
  } else if (snapshot.activeCount === 0) {
    gains.push({ id: 'steady', label: 'Operasyon temposu korunur', tone: 'neutral' });
  } else {
    gains.push({ id: 'readiness_future', label: 'Hazırlık toparlanır', tone: 'gain' });
  }

  if (toneId === 'short_term_cost' || toneId === 'plan_strains_capacity') {
    costs.push({ id: 'resource_cost', label: 'Kaynak -', tone: 'cost' });
    costs.push({ id: 'capacity_cost', label: 'Bugün kapasite daralır', tone: 'cost' });
  } else if (toneId === 'pressure_growing' || toneId === 'neglect_shadowed_ops') {
    costs.push({ id: 'readiness_risk', label: 'Readiness riski', tone: 'risk' });
    costs.push({ id: 'tomorrow_cost', label: 'Yarın etkisi', tone: 'risk' });
  } else if (snapshot.queuedCount > 0) {
    costs.push({ id: 'defer_cost', label: 'Erteleme riski', tone: 'risk' });
  } else if (snapshot.inProgressCount > 0) {
    costs.push({ id: 'resource_cost', label: 'Kaynak bedeli', tone: 'cost' });
  } else if (snapshot.activeCount > 0) {
    costs.push({ id: 'capacity_watch', label: 'Kapasite baskısı', tone: 'cost' });
  }

  const boundedGains = densityBand === 'day1' ? gains.slice(0, 1) : gains.slice(0, 2);
  const boundedCosts = densityBand === 'day1' ? costs.slice(0, 1) : costs.slice(0, 2);

  const gainWeight = boundedGains.length;
  const costWeight = boundedCosts.length;
  const balanceRatio =
    gainWeight + costWeight === 0
      ? 0.5
      : clampRatio(gainWeight / (gainWeight + costWeight));

  let balanceLabel = 'Dengeli';
  if (balanceRatio >= 0.62) balanceLabel = 'Kazanım ağırlıklı';
  else if (balanceRatio <= 0.38) balanceLabel = 'Bedel ağırlıklı';

  return {
    visible: boundedGains.length > 0 || boundedCosts.length > 0,
    gains: boundedGains,
    costs: boundedCosts,
    balanceRatio,
    balanceLabel,
  };
}
