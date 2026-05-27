import { mapDecisionResultToXpInput } from '@/core/xp/xpDecisionAdapter';

export type ScenarioVerificationResult = {
  passed: boolean;
  message: string;
};

export function verifyDistrictBonusFlagsMergeScenario(): ScenarioVerificationResult {
  const xpInput = mapDecisionResultToXpInput({
    day: 1,
    event: {
      id: 'district-merge-test',
      districtBonusHints: { trafficReduced: true },
    },
    decision: {
      districtBonusFlags: { resolvedQuickly: true },
    },
    decisionResult: {
      satisfactionDelta: 0,
      riskDelta: 0,
      districtBonusFlags: { publicTrustProtected: true },
    },
  });

  const flags = xpInput.districtBonusFlags;

  if (flags.trafficReduced !== true) {
    return { passed: false, message: 'event.districtBonusHints trafficReduced kayboldu' };
  }
  if (flags.resolvedQuickly !== true) {
    return { passed: false, message: 'decision.districtBonusFlags resolvedQuickly kayboldu' };
  }
  if (flags.publicTrustProtected !== true) {
    return {
      passed: false,
      message: 'decisionResult.districtBonusFlags publicTrustProtected kayboldu',
    };
  }

  const overlap = mapDecisionResultToXpInput({
    day: 1,
    event: {
      id: 'overlap-test',
      districtBonusHints: { trafficReduced: true },
    },
    decision: {
      districtBonusFlags: { trafficReduced: true, resolvedQuickly: true },
    },
    decisionResult: {
      satisfactionDelta: 0,
      riskDelta: 0,
    },
  });

  if (
    overlap.districtBonusFlags.trafficReduced !== true ||
    overlap.districtBonusFlags.resolvedQuickly !== true
  ) {
    return {
      passed: false,
      message: 'Örtüşen flag merge beklenen { trafficReduced, resolvedQuickly } üretmedi',
    };
  }

  const empty = mapDecisionResultToXpInput({
    day: 1,
    event: { id: 'empty-flags' },
    decisionResult: { satisfactionDelta: 0, riskDelta: 0 },
  });

  if (Object.keys(empty.districtBonusFlags).length !== 0) {
    return { passed: false, message: 'Flag yokken boş obje bekleniyordu' };
  }

  return { passed: true, message: 'districtBonusFlags merge senaryosu geçti' };
}

export function assertDistrictBonusFlagsMergeScenario(): void {
  const result = verifyDistrictBonusFlagsMergeScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
