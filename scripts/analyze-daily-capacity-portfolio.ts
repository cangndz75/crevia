/**
 * Diagnostic analyzer for daily capacity / operation portfolio model.
 * Calistir: npm run analyze:daily-capacity-portfolio
 */

import {
  buildDailyCapacityPortfolio,
  buildEcePortfolioLine,
} from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel';
import {
  buildDailyCapacityPortfolioSummaryCard,
  buildOperationPortfolioCardModels,
} from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioPresentation';
import type { DailyCapacityPortfolioInput } from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';

type Scenario = {
  label: string;
  input: DailyCapacityPortfolioInput;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId };
}

function personality(districtId: string, districtName: string, highs: string[]) {
  return {
    districtId,
    districtName,
    sourceIds: [`personality_${districtId}`],
    criteria: highs.map((id) => ({ id, band: 'high', score: 75, label: id, gameplayMeaning: id, sourceKinds: ['district_identity'], sourceIds: [`c_${districtId}_${id}`] })),
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1 tutorial', input: { day: 1, activeEvents: [event('e1', 'Ilk operasyon', 'Merkez', 'merkez')] } },
  { label: 'Day 3 pilot', input: { day: 3, activeEvents: [event('e3', 'Saha mudahalesi', 'Merkez', 'merkez')] } },
  { label: 'Day 7 pilot milestone', input: { day: 7, activeEvents: [event('e7', 'Pilot kapanisi', 'Sanayi', 'sanayi')] } },
  {
    label: 'Day 8 post_pilot_light',
    input: {
      day: 8,
      activeEvents: [
        event('e8a', 'Rota daralmasi', 'Sanayi', 'sanayi'),
        event('e8b', 'Konteyner gecikmesi', 'Cumhuriyet', 'cumhuriyet'),
      ],
      operationSignals: {
        priorityDistrictId: 'sanayi',
        vehicles: { status: 'strained', score: 70, title: 'Rota gerilimi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
        containers: { status: 'watch', score: 50, title: 'Konteyner', summary: 'Hat izleniyor.', sourceTags: [] },
        districts: { status: 'strained', score: 62, title: 'Bolge', summary: 'Guven baskisi.', sourceTags: ['trust'] },
        personnel: { status: 'stable', score: 40, title: 'Ekip', summary: 'Dengeli', sourceTags: [] },
        overall: { status: 'watch', score: 55, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
      districtPersonalityProfiles: [
        personality('sanayi', 'Sanayi', ['route_difficulty', 'social_sensitivity']),
        personality('cumhuriyet', 'Cumhuriyet', ['container_density']),
      ],
      tomorrowRiskSignals: [{ id: 'tr1', title: 'Yarin rota riski', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
      authorityPermissionIds: ['tomorrow_risk_preview'],
    },
  },
  {
    label: 'Day 10 post_pilot_strategic',
    input: {
      day: 10,
      activeEvents: [event('e10', 'Stratejik operasyon', 'Istasyon', 'istasyon')],
      operationSignals: {
        priorityDistrictId: 'istasyon',
        vehicles: { status: 'critical', score: 78, title: 'Rota kritik', summary: 'Acil rota destegi.', sourceTags: ['route'] },
        containers: { status: 'strained', score: 66, title: 'Konteyner', summary: 'Hat yogun.', sourceTags: ['container'] },
        districts: { status: 'strained', score: 60, title: 'Bolge', summary: 'Guven izleniyor.', sourceTags: [] },
        personnel: { status: 'watch', score: 48, title: 'Ekip', summary: 'Yorgunluk.', sourceTags: [] },
        overall: { status: 'strained', score: 65, title: 'Genel', summary: 'Baski var.', sourceTags: [] },
      },
      districtPersonalityProfiles: [personality('istasyon', 'Istasyon', ['trust_fragility', 'recovery_potential'])],
      resourceSignals: { id: 'res10', title: 'Kaynak baskisi', summary: 'Malzeme daraliyor.', score: 72 },
      rewardComebackSignals: { id: 'rc10', title: 'Toparlanma', summary: 'Iyilesme penceresi acik.', tone: 'recovery', sourceIds: ['rc10'] },
      authorityPermissionIds: ['resource_pressure_summary', 'tomorrow_risk_preview', 'district_trust_preview'],
    },
  },
  { label: 'Low data', input: { day: 8 } },
  {
    label: 'High resource pressure',
    input: {
      day: 9,
      resourceSignals: { id: 'res_hi', title: 'Kaynak kritik', summary: 'Stok daraliyor.', score: 82 },
      operationSignals: {
        priorityDistrictId: 'merkez',
        personnel: { status: 'strained', score: 68, title: 'Ekip kaynak', summary: 'Kaynak baskisi.', sourceTags: ['resource'] },
        vehicles: { status: 'stable', score: 35, title: 'Arac', summary: 'Stabil', sourceTags: [] },
        containers: { status: 'stable', score: 35, title: 'Konteyner', summary: 'Stabil', sourceTags: [] },
        districts: { status: 'stable', score: 35, title: 'Bolge', summary: 'Stabil', sourceTags: [] },
        overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
    },
  },
  {
    label: 'Social sensitivity',
    input: {
      day: 9,
      districtPersonalityProfiles: [personality('cumhuriyet', 'Cumhuriyet', ['social_sensitivity'])],
      socialPulseSignals: { id: 'sp1', title: 'Sosyal tepki', summary: 'Mahalle hassas.', score: 74 },
    },
  },
  {
    label: 'Route pressure',
    input: {
      day: 9,
      operationSignals: {
        priorityDistrictId: 'sanayi',
        vehicles: { status: 'critical', score: 80, title: 'Rota kritik', summary: 'Rota destegi sinirli.', sourceTags: ['route'] },
        personnel: { status: 'stable', score: 30, title: 'Ekip', summary: 'OK', sourceTags: [] },
        containers: { status: 'stable', score: 30, title: 'Konteyner', summary: 'OK', sourceTags: [] },
        districts: { status: 'stable', score: 30, title: 'Bolge', summary: 'OK', sourceTags: [] },
        overall: { status: 'watch', score: 55, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
      eventGameplayVarietyProfiles: [{ eventId: 'ev_r', primaryPressure: 'route_pressure', secondaryPressures: [], playerFacingLine: 'Rota baskisi.', sourceIds: ['ev_r'], sourceLabel: 'variety' }],
    },
  },
  {
    label: 'Recovery opportunity',
    input: {
      day: 9,
      rewardComebackSignals: { id: 'rc', title: 'Toparlanma firsati', summary: 'Mahalle toparlaniyor.', tone: 'recovery', sourceIds: ['rc'] },
      districtPersonalityProfiles: [personality('merkez', 'Merkez', ['recovery_potential'])],
    },
  },
  {
    label: 'Mixed district personality',
    input: {
      day: 10,
      districtPersonalityProfiles: [
        personality('sanayi', 'Sanayi', ['route_difficulty', 'maintenance_exposure']),
        personality('cumhuriyet', 'Cumhuriyet', ['social_sensitivity', 'neglect_risk']),
        personality('istasyon', 'Istasyon', ['operation_history_weight', 'trust_fragility']),
      ],
      decisionConsequenceThreads: [{ id: 'dc1', title: 'Karar izi', summary: 'Takip gerekir.', causalLine: 'Iz suruyor.', consequenceType: 'district_memory', sourceIds: ['dc1'] }],
    },
  },
];

let hasWarn = false;
let hasFail = false;

for (const scenario of scenarios) {
  const result = buildDailyCapacityPortfolio(scenario.input);
  const visible = result.items.filter((item) => item.visibilityLevel !== 'hidden');
  const cards = buildOperationPortfolioCardModels(result);
  const summaryCard = buildDailyCapacityPortfolioSummaryCard(result);
  const ece = buildEcePortfolioLine(result);

  const kinds = new Set(visible.map((item) => item.kind));
  const districts = new Set(visible.map((item) => item.districtId).filter(Boolean));
  const opportunityCount = visible.filter((item) => item.kind.includes('opportunity')).length;
  const fallbackRatio = visible.filter((item) => item.sourceKinds.includes('fallback')).length / Math.max(visible.length, 1);

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} (Day ${scenario.input.day}) ===`);
  // eslint-disable-next-line no-console
  console.log(`Mode: ${result.summary.mode} | visible: ${visible.length} | selected: ${result.selectedItems.length} | deferred: ${result.deferredItems.length}`);
  // eslint-disable-next-line no-console
  console.log(`Summary: ${summaryCard.summaryLine}`);
  if (ece) console.log(`Ece: ${ece}`);
  for (const item of visible.slice(0, 4)) {
    console.log(`- [${item.status}] ${item.kind} p${item.priority}: ${item.title}`);
  }

  if (scenario.input.day >= 8 && visible.length < 3) {
    console.log('WARN Day 8+ has fewer than 3 visible items');
    hasWarn = true;
  }
  if (scenario.input.day >= 8 && result.selectedItems.length > 2) {
    console.log('FAIL Day 8+ selected exceeds 2');
    hasFail = true;
  }
  if (visible.length > 0 && kinds.size === 1) {
    console.log('WARN all items same kind');
    hasWarn = true;
  }
  if (visible.length > 2 && districts.size === 1 && visible[0]?.districtId) {
    console.log('WARN all items same district');
    hasWarn = true;
  }
  if (visible.length > 0 && opportunityCount === 0 && visible.every((item) => item.pressureLevel !== 'low')) {
    console.log('WARN all risk/no opportunity balance');
    hasWarn = true;
  }
  if (fallbackRatio > 0.5 && scenario.label !== 'Low data' && scenario.label !== 'Day 1 tutorial') {
    console.log('WARN high fallback ratio');
    hasWarn = true;
  }
  if (cards.length > 4) {
    console.log('FAIL too many card models');
    hasFail = true;
  }
  for (const item of visible) {
    if (item.isMapRecommended && !item.sourceKinds.some((k) => k.includes('map'))) {
      console.log(`FAIL map recommended without map source: ${item.id}`);
      hasFail = true;
    }
    if (item.deferRisk !== 'none' && item.deferRisk !== 'safe_to_watch' && !item.deferRiskLine && item.sourceKinds.includes('tomorrow_risk') === false) {
      const guarded = item.sourceKinds.some((k) =>
        ['tomorrow_risk', 'operation_signals', 'district_trust', 'resource_pressure', 'district_memory', 'decision_consequence', 'reward_comeback'].includes(k),
      );
      if (!guarded) {
        console.log(`FAIL defer risk without source: ${item.id} ${item.deferRisk}`);
        hasFail = true;
      }
    }
  }
}

// eslint-disable-next-line no-console
console.log('\n--- Analyzer result ---');
if (hasFail) {
  console.log('FAIL');
  process.exit(1);
}
if (hasWarn) {
  console.log('WARN');
  process.exit(0);
}
console.log('PASS');
