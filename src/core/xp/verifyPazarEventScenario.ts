/**
 * MVP senaryo doğrulaması — Day 2, Pazar Yüklemesi, pazar mahallesi.
 *
 * Beklenen: 65 event + 15 kalite + 8 risk + 10 efficiency + 10 district = 108 XP
 *
 * Kalite bonusu ayrı kategori değil; şeffaflık için `event` altında "Kalite bonusu" satırı.
 */
import { calculateEventXpBreakdown } from '@/core/xp/xpEngine';

export type ScenarioVerificationResult = {
  breakdown: ReturnType<typeof calculateEventXpBreakdown>;
  passed: boolean;
  message: string;
};

const EXPECTED_TOTAL = 108;
const EXPECTED_PARTS = {
  eventBase: 65,
  quality: 15,
  risk: 8,
  efficiency: 10,
  district: 10,
} as const;

export function verifyPazarEventScenario(): ScenarioVerificationResult {
  const breakdown = calculateEventXpBreakdown({
    day: 2,
    eventId: 'event_market_blocked_sidewalk',
    eventTitle: 'Pazar Yüklemesi Kaldırımı Kapattı',
    severity: 'high',
    districtType: 'pazar',
    satisfactionDelta: 0.3,
    riskDelta: -2,
    budgetSpent: 4000,
    expectedBudget: 5000,
    staffFatigueDelta: 8,
    districtBonusFlags: {
      trafficReduced: true,
      crowdControlled: false,
      publicTrustProtected: false,
    },
    dailyGoalCompleted: false,
    butterflyPositive: false,
    tutorialBonus: false,
  });

  const eventBase = breakdown.items.find(
    (item) => item.category === 'event' && item.title.includes('olay çözüldü'),
  )?.amount;
  const quality = breakdown.items.find((item) => item.title === 'Kalite bonusu')?.amount;
  const risk = breakdown.items.find((item) => item.category === 'risk')?.amount;
  const efficiency = breakdown.items.find((item) => item.category === 'efficiency')?.amount;
  const district = breakdown.items
    .filter((item) => item.category === 'district')
    .reduce((sum, item) => sum + item.amount, 0);

  const partsMatch =
    eventBase === EXPECTED_PARTS.eventBase &&
    quality === EXPECTED_PARTS.quality &&
    risk === EXPECTED_PARTS.risk &&
    efficiency === EXPECTED_PARTS.efficiency &&
    district === EXPECTED_PARTS.district;

  const passed = breakdown.total === EXPECTED_TOTAL && partsMatch;

  const message = passed
    ? `Senaryo geçti: toplam ${breakdown.total} XP`
    : `Senaryo başarısız: toplam ${breakdown.total} (beklenen ${EXPECTED_TOTAL}), ` +
      `parçalar event=${eventBase}, quality=${quality}, risk=${risk}, ` +
      `efficiency=${efficiency}, district=${district}`;

  return { breakdown, passed, message };
}

/** Geliştirme sırasında manuel çalıştırma: import edip çağırın veya test runner eklenince bağlayın. */
export function assertPazarEventScenario(): void {
  const result = verifyPazarEventScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
