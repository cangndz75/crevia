import { MAINTENANCE_RUNTIME_DOMAIN_TITLES } from './maintenanceBacklogRuntimeConstants';
import type {
  MaintenanceEconomyDeferRiskPreview,
  MaintenanceEconomyDensityBand,
} from './maintenanceEconomyFeelTypes';
import type { MaintenanceEconomyPressureSnapshot } from './maintenanceEconomyToneModel';
import type { MaintenanceRuntimeDomain } from './maintenanceBacklogRuntimeTypes';

const DOMAIN_DEFER_LINES: Record<MaintenanceRuntimeDomain, string> = {
  personnel: 'Ertelenirse ekip temposu yarın hızlı müdahale zincirini zayıflatır.',
  vehicle: 'Araç hazırlığı düşerse saha süresi uzayabilir.',
  equipment: 'Ekipman bakımı gecikirse müdahale güvenilirliği düşebilir.',
  facility: 'Tesis bakımı ertelenirse operasyon hazırlığı gecikebilir.',
  route: 'Rota bakımı gecikirse saha rotasyonu yavaşlayabilir.',
  budget: 'Bütçe baskısı taşınırsa kaynak esnekliği daralır.',
  operation: 'Operasyon hazırlığı gecikirse ikinci müdahale zorlaşır.',
};

function domainLine(domain: MaintenanceRuntimeDomain | null): string {
  if (!domain) {
    return 'Ertelenirse yarın hızlı müdahale zinciri zayıflar.';
  }
  return DOMAIN_DEFER_LINES[domain];
}

export function buildMaintenanceEconomyDeferRiskPreview(input: {
  snapshot: MaintenanceEconomyPressureSnapshot;
  densityBand: MaintenanceEconomyDensityBand;
}): MaintenanceEconomyDeferRiskPreview {
  if (input.densityBand === 'day1') {
    return { visible: false, line: '', riskChip: null, tomorrowChip: null };
  }

  const { snapshot } = input;
  const hasDeferSignal =
    snapshot.queuedCount > 0 ||
    snapshot.carriedCount > 0 ||
    snapshot.deferStreakDays >= 1 ||
    snapshot.pressureLevel === 'high' ||
    snapshot.pressureLevel === 'critical';

  if (!hasDeferSignal) {
    return { visible: false, line: '', riskChip: null, tomorrowChip: null };
  }

  const line = domainLine(snapshot.topDomain);
  const domainLabel = snapshot.topDomain
    ? MAINTENANCE_RUNTIME_DOMAIN_TITLES[snapshot.topDomain].replace(/ Yoruluyor| İzlenmeli| Birikiyor| Artıyor| Yüksek/g, '')
    : 'Hazırlık';

  return {
    visible: true,
    line,
    riskChip: {
      id: 'defer_risk',
      label: `${domainLabel} riski`,
      tone: snapshot.criticalCount > 0 ? 'risk' : 'cost',
    },
    tomorrowChip: {
      id: 'tomorrow_impact',
      label: 'Yarın etkisi',
      tone: 'risk',
    },
  };
}
