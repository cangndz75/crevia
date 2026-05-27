import {
  DISTRICT_EVENT_INTEGRATION_CONFIG,
  enrichDailyEventSetWithDistrictEvents,
  mapDistrictEventToPilotEvent,
} from '@/core/districts/districtEventIntegration';
import { createDistrictEvent } from '@/core/districts/districtEventEngine';
import { mapPilotDistrictToDistrictType } from '@/core/districts/pilotDistrictBridge';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { GameState } from '@/core/models/GameState';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

function mockGameState(day: number, districtId: PilotDistrictId): GameState {
  return {
    city: {
      day,
      publicSatisfaction: 55,
      budget: 75_000,
      morale: 65,
      riskScore: 55,
    },
    player: {
      name: 'Can',
      xp: 0,
      xpToNextLevel: 100,
      authorityPoints: 0,
      level: 1,
      title: 'Koordinatör',
      role: 'Pilot',
      notificationCount: 0,
      streakDays: 1,
    },
    cityPulse: [],
    dailyMissions: [],
    events: [],
    featuredEventId: '',
    eventOpportunity: { id: 'o', title: '', description: '', xpReward: 0 },
    solvedEvents: [],
    eventAdvisor: { body: '', attribution: '', tokenCost: 0 },
    risks: { total: 0, activeThreats: 0, critical: 0 },
    abilities: [],
    dailyReport: { day, title: '', stats: [], rewardTitle: '' },
    riskSummary: { total: 0, activeThreats: 0, critical: 0 },
    operationsBrief: { title: '', summary: '' },
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: districtId,
      currentPilotDay: day,
    },
  } as unknown as GameState;
}

function mockBaseDailySet(
  day: number,
  districtId: PilotDistrictId,
  mockIds: string[],
): DailyEventSet {
  const eventRoles: DailyEventSet['eventRoles'] = {};
  const eventStatuses: DailyEventSet['eventStatuses'] = {};
  for (const id of mockIds) {
    eventRoles[id] = 'side';
    eventStatuses[id] = 'awaiting_decision';
  }

  return {
    id: `daily-${districtId}-d${day}-test`,
    day,
    districtId,
    generatedAt: new Date().toISOString(),
    seed: 42,
    anchorEventId: mockIds[0] ?? '',
    sideEventIds: [...mockIds],
    quickActionIds: [],
    opportunityEventIds: [],
    butterflyEventIds: [],
    signalEventIds: [],
    allEventIds: [...mockIds],
    eventRoles,
    eventStatuses,
  };
}

export function verifyDistrictEventIntegration(): {
  passed: boolean;
  message: string;
} {
  const enabled = verifyEnabledScenario();
  if (!enabled.passed) {
    return enabled;
  }

  const disabled = verifyDisabledScenario();
  if (!disabled.passed) {
    return disabled;
  }

  const mapping = verifyMappingScenario();
  if (!mapping.passed) {
    return mapping;
  }

  return { passed: true, message: 'District event integration senaryoları geçti' };
}

function verifyEnabledScenario(): { passed: boolean; message: string } {
  const districtId: PilotDistrictId = 'industrial_market';
  const day = 2;
  const baseIds = ['mock_event_a', 'mock_event_b'];
  const baseSet = mockBaseDailySet(day, districtId, baseIds);
  const gameState = mockGameState(day, districtId);

  const enriched = enrichDailyEventSetWithDistrictEvents({
    gameState,
    day,
    districtId,
    dailyEventSet: baseSet,
    randomFn: () => 0,
  });

  if (enriched.allEventIds.length !== baseIds.length + 1) {
    return {
      passed: false,
      message: `Beklenen ${baseIds.length + 1} event id, alınan ${enriched.allEventIds.length}`,
    };
  }

  const generated = enriched.supplementalEvents?.[0];
  if (!generated) {
    return { passed: false, message: 'supplementalEvents boş' };
  }

  const expectedType = mapPilotDistrictToDistrictType(districtId);
  if (generated.xpDistrictType !== expectedType) {
    return {
      passed: false,
      message: `xpDistrictType beklenen ${expectedType}, alınan ${generated.xpDistrictType}`,
    };
  }

  if (!generated.districtBonusHints) {
    return { passed: false, message: 'districtBonusHints eksik' };
  }

  const uniqueIds = new Set(enriched.allEventIds);
  if (uniqueIds.size !== enriched.allEventIds.length) {
    return { passed: false, message: 'Duplicate event id oluştu' };
  }

  if (generated.decisions.length < 2) {
    return { passed: false, message: 'Generated event decisions eksik' };
  }

  const hasBonusFlags = generated.decisions.some(
    (d) => d.districtBonusFlags != null,
  );
  if (!hasBonusFlags) {
    return {
      passed: false,
      message: 'Karar districtBonusFlags taşımıyor',
    };
  }

  return { passed: true, message: 'Enabled senaryo geçti' };
}

function verifyDisabledScenario(): { passed: boolean; message: string } {
  const original = DISTRICT_EVENT_INTEGRATION_CONFIG.enabled;
  (DISTRICT_EVENT_INTEGRATION_CONFIG as { enabled: boolean }).enabled = false;

  try {
    const baseSet = mockBaseDailySet(2, 'central', ['only_mock']);
    const enriched = enrichDailyEventSetWithDistrictEvents({
      gameState: mockGameState(2, 'central'),
      day: 2,
      districtId: 'central',
      dailyEventSet: baseSet,
    });

    if (enriched.allEventIds.length !== 1) {
      return {
        passed: false,
        message: 'Config disabled iken yalnızca baseEvents dönmeli',
      };
    }
    return { passed: true, message: 'Disabled senaryo geçti' };
  } finally {
    (DISTRICT_EVENT_INTEGRATION_CONFIG as { enabled: boolean }).enabled = original;
  }
}

function verifyMappingScenario(): { passed: boolean; message: string } {
  const districtEvent = createDistrictEvent({
    districtType: 'pazar',
    day: 2,
    currentRisk: 60,
    activeEventCount: 2,
    randomFn: () => 0,
  });

  const card = mapDistrictEventToPilotEvent(districtEvent, 'industrial_market');

  if (!card.title || !card.description) {
    return { passed: false, message: 'Mapped card title/description eksik' };
  }

  if (card.riskLevel !== districtEvent.severity) {
    return {
      passed: false,
      message: 'severity mapping uyuşmuyor',
    };
  }

  return { passed: true, message: 'Mapping senaryo geçti' };
}

export function assertDistrictEventIntegration(): void {
  const result = verifyDistrictEventIntegration();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
