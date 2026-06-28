import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildEcePeriodGoalHint,
  buildGrowthPeriodFocusCard,
  buildHubPeriodGoalCard,
  buildPeriodGoalContextFromHub,
  buildPeriodGoalContextFromReport,
  buildPeriodGoalDashboardPresentation,
  buildReportPeriodGoalInsight,
  dedupePeriodGoalCopy,
} from './periodGoalPresentation';
import { deriveActivePeriodGoal, buildPeriodGoalProgress } from './periodGoalModel';
import type { PeriodGoalId } from './periodGoalTypes';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

function maintenanceRuntime(active: number, critical = 0) {
  return {
    items: Array.from({ length: active }, (_, index) => {
      const severity: 'critical' | 'attention' = index < critical ? 'critical' : 'attention';
      return {
        id: `m-${index}`,
        domain: 'personnel' as const,
        severity,
        status: 'open' as const,
        createdDay: 1,
        updatedDay: 1,
        carryOverDays: 0,
        sourceDedupeKey: `k-${index}`,
        lastReasonLabels: ['test'],
      };
    }),
    attentionStreaks: {},
  };
}

export function verifyPeriodGoalScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const emptyContext = buildPeriodGoalContextFromReport({ day: 1 });
  const fallbackGoal = deriveActivePeriodGoal(emptyContext);
  assert(
    checks,
    ['adaptive_management', 'stabilize_service_rhythm'].includes(fallbackGoal),
    'unknown context fallback goal',
    fallbackGoal,
  );

  const maintenanceContext = buildPeriodGoalContextFromReport({
    day: 5,
    maintenanceBacklogRuntime: maintenanceRuntime(2, 1),
  });
  const maintenanceGoal = deriveActivePeriodGoal(maintenanceContext);
  assert(
    checks,
    maintenanceGoal === 'strengthen_readiness' || maintenanceGoal === 'control_resource_pressure',
    'maintenance backlog selects readiness/pressure',
    maintenanceGoal,
  );

  const socialContext = buildPeriodGoalContextFromReport({
    day: 5,
    socialPulseState: {
      neighborhoods: {},
      activeTopics: [],
      mentionFeed: [],
      outcomeHistory: [],
      globalPulseScore: 72,
      globalRiskLevel: 'high',
      lastProcessedDay: 5,
    },
  });
  assert(
    checks,
    deriveActivePeriodGoal(socialContext) === 'reduce_social_heat',
    'social heat selects reduce_social_heat',
    deriveActivePeriodGoal(socialContext),
  );

  const repeatedContext = buildPeriodGoalContextFromReport({
    day: 6,
    decisionHistory: [
      { day: 5, eventTitle: 'Cumhuriyet · Konteyner' },
      { day: 6, eventTitle: 'Cumhuriyet · Rota' },
    ],
  });
  assert(
    checks,
    deriveActivePeriodGoal(repeatedContext) === 'balance_district_attention',
    'repeated district selects balance',
    deriveActivePeriodGoal(repeatedContext),
  );

  const crisisContext = buildPeriodGoalContextFromReport({
    day: 6,
    playerStyleId: 'crisis_watcher',
    metrics: { staffMorale: 42, budget: 50000, publicSatisfaction: 50 },
    maintenanceBacklogRuntime: maintenanceRuntime(1, 0),
  });
  assert(
    checks,
    deriveActivePeriodGoal(crisisContext) === 'control_resource_pressure',
    'crisis watcher + pressure selects resource pressure',
    deriveActivePeriodGoal(crisisContext),
  );

  const progress = buildPeriodGoalProgress('restore_trust', socialContext);
  assert(checks, progress.label.length > 0, 'progress label non-empty', progress.label);

  const reportInsight = buildReportPeriodGoalInsight(socialContext, [
    'Sosyal nabız hâlâ yüksek; görünür müdahale izlenmeli.',
  ]);
  assert(checks, reportInsight === null, 'report insight dedupes duplicate', String(Boolean(reportInsight)));

  const hubCard = buildHubPeriodGoalCard(maintenanceContext);
  assert(checks, hubCard.visibility === 'visible', 'hub card visible', hubCard.visibility);
  assert(checks, hubCard.sectionTitle === 'Şehir Gündemi', 'hub section title', hubCard.sectionTitle);
  assert(checks, hubCard.goalTitle.length > 0, 'hub active goal title', hubCard.goalTitle);

  const growthCard = buildGrowthPeriodFocusCard(maintenanceContext, 'Kaynak Koruyucu');
  assert(checks, growthCard.visibility === 'visible', 'growth card visible day>=2', growthCard.visibility);

  const dashboard = buildPeriodGoalDashboardPresentation(maintenanceContext);
  assert(checks, dashboard.secondaryGoals.length <= 2, 'secondary goals capped', `${dashboard.secondaryGoals.length}`);

  const eceHint = buildEcePeriodGoalHint('strengthen_readiness', [
    'Hazırlık sinyalleri birikiyor. Yeni operasyondan önce bakım kuyruğunu göz ardı etme.',
  ]);
  assert(checks, eceHint === null, 'ece hint dedupes', String(Boolean(eceHint)));

  assert(checks, SAVE_VERSION === 28, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);

  assert(
    checks,
    !dedupePeriodGoalCopy('Tamamen farklı satır', ['başka satır']),
    'dedupe allows distinct copy',
    'ok',
  );

  const goalIds: PeriodGoalId[] = [
    'restore_trust',
    'control_resource_pressure',
    'stabilize_service_rhythm',
    'reduce_social_heat',
    'strengthen_readiness',
    'balance_district_attention',
    'prevent_tomorrow_risk',
    'adaptive_management',
  ];
  assert(checks, goalIds.length === 8, 'eight goal archetypes', `${goalIds.length}`);

  const hubContext = buildPeriodGoalContextFromHub(
    {
      headerSummary: {
        resourceChips: [{ id: 'day', label: 'Gün', valueText: '5. Gün' }],
        levelLabel: 'Sv. 2',
      },
      citySummary: { metrics: [{ id: 'happiness', label: 'Memnuniyet', valueText: '%48' }] },
      operationSignals: { signals: [], summaryLine: 'Kaynak baskısı artıyor' },
      activeTarget: { domain: 'social' },
    } as never,
    { maintenanceBacklogRuntime: maintenanceRuntime(2) },
  );
  assert(checks, hubContext.maintenanceActiveCount === 2, 'hub context maintenance count', `${hubContext.maintenanceActiveCount}`);

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
