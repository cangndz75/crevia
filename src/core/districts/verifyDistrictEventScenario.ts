import {
  calculateDistrictEventSeverity,
  createDistrictEvent,
  pickWeightedEventType,
} from '@/core/districts/districtEventEngine';
import { getDistrictEventWeights } from '@/core/districts/districtEventRules';
import {
  DEFAULT_DISTRICT_TYPE,
  getDistrictProfile,
} from '@/core/districts/districtProfiles';

export function verifyDistrictEventScenario(): {
  passed: boolean;
  message: string;
} {
  const scenario1 = verifyPazarEventScenario();
  if (!scenario1.passed) {
    return scenario1;
  }

  const scenario2 = verifySanayiScenario();
  if (!scenario2.passed) {
    return scenario2;
  }

  const scenario3 = verifyCumhuriyetProfileScenario();
  if (!scenario3.passed) {
    return scenario3;
  }

  return { passed: true, message: 'District event senaryoları geçti' };
}

function verifyPazarEventScenario(): { passed: boolean; message: string } {
  const weights = getDistrictEventWeights('pazar');
  if (!weights.market_crowding || !weights.sidewalk_blocked) {
    return {
      passed: false,
      message: 'Pazar: market_crowding veya sidewalk_blocked ağırlığı eksik',
    };
  }

  const pickedType = pickWeightedEventType('pazar', () => 0);
  if (pickedType !== 'market_crowding') {
    return {
      passed: false,
      message: `Pazar: randomFn 0 ile market_crowding bekleniyor, alınan ${pickedType}`,
    };
  }

  const event = createDistrictEvent({
    districtType: 'pazar',
    day: 2,
    currentRisk: 55,
    activeEventCount: 2,
    randomFn: () => 0,
  });

  if (event.districtType !== 'pazar') {
    return {
      passed: false,
      message: `Pazar event districtType beklenen pazar, alınan ${event.districtType}`,
    };
  }

  if (
    event.type !== 'market_crowding' &&
    event.type !== 'sidewalk_blocked'
  ) {
    return {
      passed: false,
      message: `Pazar event type beklenen market_crowding/sidewalk_blocked, alınan ${event.type}`,
    };
  }

  const hints = event.districtBonusHints;
  if (!hints.trafficReduced && !hints.crowdControlled) {
    return {
      passed: false,
      message: 'Pazar: districtBonusHints trafficReduced veya crowdControlled olmalı',
    };
  }

  if (!event.title.toLowerCase().includes('pazar') && event.type !== 'market_crowding') {
    return {
      passed: false,
      message: 'Pazar: title mahalle karakterine uygun değil',
    };
  }

  return { passed: true, message: 'Pazar senaryosu geçti' };
}

function verifySanayiScenario(): { passed: boolean; message: string } {
  const profile = getDistrictProfile('sanayi');
  const weights = getDistrictEventWeights('sanayi');

  if (!weights.vehicle_breakdown_risk || !weights.waste_overflow) {
    return {
      passed: false,
      message: 'Sanayi: vehicle_breakdown_risk veya waste_overflow ağırlığı eksik',
    };
  }

  if (profile.vehicleDependency < 80) {
    return {
      passed: false,
      message: `Sanayi: vehicleDependency yüksek olmalı, alınan ${profile.vehicleDependency}`,
    };
  }

  const severity = calculateDistrictEventSeverity({
    districtProfile: profile,
    eventType: 'vehicle_breakdown_risk',
    currentRisk: 75,
    day: 4,
    activeEventCount: 3,
  });

  if (severity !== 'high' && severity !== 'critical') {
    return {
      passed: false,
      message: `Sanayi: yüksek riskte severity high/critical bekleniyor, alınan ${severity}`,
    };
  }

  const event = createDistrictEvent({
    districtType: 'sanayi',
    day: 4,
    currentRisk: 75,
    activeEventCount: 3,
    eventType: 'waste_overflow',
  });

  if (event.districtType !== 'sanayi') {
    return {
      passed: false,
      message: 'Sanayi event districtType sanayi olmalı',
    };
  }

  return { passed: true, message: 'Sanayi senaryosu geçti' };
}

function verifyCumhuriyetProfileScenario(): {
  passed: boolean;
  message: string;
} {
  const cumhuriyet = getDistrictProfile('cumhuriyet');
  const yesilpark = getDistrictProfile('yesilpark');

  if (cumhuriyet.id !== 'cumhuriyet') {
    return { passed: false, message: 'Cumhuriyet profil id hatalı' };
  }

  if (cumhuriyet.id === yesilpark.id) {
    return { passed: false, message: 'Cumhuriyet yesilpark ile aynı olmamalı' };
  }

  if (cumhuriyet.name !== 'Cumhuriyet') {
    return {
      passed: false,
      message: `Cumhuriyet name beklenen Cumhuriyet, alınan ${cumhuriyet.name}`,
    };
  }

  const resolved = getDistrictProfile('cumhuriyet');
  if (resolved.id === 'yesilpark') {
    return {
      passed: false,
      message: 'cumhuriyet çözümlemesi yesilpark’a düşmemeli',
    };
  }

  if (DEFAULT_DISTRICT_TYPE !== 'merkez') {
    return { passed: false, message: 'DEFAULT_DISTRICT_TYPE merkez olmalı' };
  }

  return { passed: true, message: 'Cumhuriyet profil senaryosu geçti' };
}

export function assertDistrictEventScenario(): void {
  const result = verifyDistrictEventScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
