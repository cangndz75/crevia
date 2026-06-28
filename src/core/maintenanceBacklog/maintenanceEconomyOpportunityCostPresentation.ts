import type {
  MaintenanceEconomyDensityBand,
  MaintenanceEconomyOpportunityCostPreview,
} from './maintenanceEconomyFeelTypes';
import type { MaintenanceEconomyPressureSnapshot } from './maintenanceEconomyToneModel';
import type { MaintenanceEconomyToneId } from './maintenanceEconomyFeelTypes';

export function buildMaintenanceEconomyOpportunityCostPreview(input: {
  snapshot: MaintenanceEconomyPressureSnapshot;
  toneId: MaintenanceEconomyToneId;
  operationsToday: number;
  densityBand: MaintenanceEconomyDensityBand;
}): MaintenanceEconomyOpportunityCostPreview {
  if (input.densityBand === 'day1') {
    return { visible: false, line: '' };
  }

  const { snapshot, toneId, operationsToday } = input;

  if (snapshot.activeCount === 0 && snapshot.inProgressCount === 0) {
    return { visible: false, line: '' };
  }

  let line: string;
  if (operationsToday >= 3 && snapshot.inProgressCount > 0) {
    line = 'Bugün bakım seçersen ikinci operasyon için ekip gücü azalabilir.';
  } else if (toneId === 'short_term_cost' || toneId === 'plan_strains_capacity') {
    line = 'Hazırlık artar, ama kısa vadeli kaynak esnekliği düşer.';
  } else if (toneId === 'pressure_growing') {
    line = 'Yarın daha güvenli kapanır, bugün müdahale temposu yavaşlayabilir.';
  } else if (snapshot.inProgressCount > 0) {
    line = 'Bakım yaparsan bugünkü operasyon temposu bir kademe yavaşlayabilir.';
  } else {
    line = 'Hazırlık toparlanır; bugün kapasite paylaşımı gerekebilir.';
  }

  return { visible: true, line };
}
