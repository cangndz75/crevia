import { calculateDistrictBonus, resolveXpDistrictType } from '@/core/xp/districtBonus';

export type ScenarioVerificationResult = {
  passed: boolean;
  message: string;
};

const EXPECTED_FULL_BONUS_TOTAL = 20;

export function verifyCumhuriyetDistrictBonusScenario(): ScenarioVerificationResult {
  const resolved = resolveXpDistrictType('cumhuriyet');
  if (resolved !== 'cumhuriyet') {
    return {
      passed: false,
      message: `resolveXpDistrictType('cumhuriyet') beklenen 'cumhuriyet', alınan '${resolved ?? 'undefined'}'`,
    };
  }

  const fullBonus = calculateDistrictBonus({
    districtId: 'cumhuriyet',
    flags: {
      publicTrustProtected: true,
      resolvedQuickly: true,
      socialRiskPrevented: true,
    },
  });

  if (fullBonus.total !== EXPECTED_FULL_BONUS_TOTAL) {
    return {
      passed: false,
      message: `Cumhuriyet tam bonus beklenen ${EXPECTED_FULL_BONUS_TOTAL}, alınan ${fullBonus.total}`,
    };
  }

  const trustOnly = calculateDistrictBonus({
    districtType: 'cumhuriyet',
    flags: { publicTrustProtected: true },
  });

  if (trustOnly.total !== 10) {
    return {
      passed: false,
      message: `publicTrustProtected tek başına beklenen 10, alınan ${trustOnly.total}`,
    };
  }

  const yesilparkFromCumhuriyetId = resolveXpDistrictType('yesilpark');
  if (yesilparkFromCumhuriyetId !== 'yesilpark') {
    return {
      passed: false,
      message: `yesilpark eşlemesi bozuldu: '${yesilparkFromCumhuriyetId ?? 'undefined'}'`,
    };
  }

  return {
    passed: true,
    message: 'Cumhuriyet district bonus senaryosu geçti',
  };
}

export function assertCumhuriyetDistrictBonusScenario(): void {
  const result = verifyCumhuriyetDistrictBonusScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
