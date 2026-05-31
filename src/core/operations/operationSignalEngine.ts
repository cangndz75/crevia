import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import {
  NEIGHBORHOOD_IDENTITIES,
  DEFAULT_NEIGHBORHOOD_ID,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';
import type { NeighborhoodIdentityId } from '@/core/neighborhoodIdentity/neighborhoodIdentityTypes';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';

import {
  DEFAULT_OPERATION_SIGNAL_SCORES,
  END_OF_DAY_SIGNAL_DELTAS,
  KNOWN_DISTRICT_IDS,
} from './operationSignalConstants';
import {
  buildOperationSignal,
  clampSignalScore,
  createInitialOperationSignalsState,
  getSignalStatus,
} from './operationSignalState';
import type {
  OperationDailyFocus,
  OperationImpactPreview,
  OperationSignalsEngineInput,
  OperationSignalsState,
} from './operationSignalTypes';

function districtShortName(id: string): string {
  const key = normalizeNeighborhoodId(id) ?? DEFAULT_NEIGHBORHOOD_ID;
  return NEIGHBORHOOD_IDENTITIES[key]?.shortName ?? id;
}

function isSocialCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('social') ||
    c.includes('sosyal') ||
    c.includes('citizen') ||
    c.includes('halk')
  );
}

function isVehicleCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('vehicle') ||
    c.includes('araç') ||
    c.includes('route') ||
    c.includes('rota')
  );
}

function isContainerCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('container') ||
    c.includes('konteyner') ||
    c.includes('waste') ||
    c.includes('atık')
  );
}

function eventSeverityWeight(event: EventCard): number {
  switch (event.riskLevel) {
    case 'critical':
      return 1.4;
    case 'high':
      return 1.15;
    case 'medium':
      return 1;
    default:
      return 0.75;
  }
}

function resolveDistrictIdFromEvent(event: EventCard): NeighborhoodIdentityId {
  if (event.neighborhoodId) {
    return normalizeNeighborhoodId(event.neighborhoodId) ?? DEFAULT_NEIGHBORHOOD_ID;
  }
  const district = event.district?.toLowerCase() ?? '';
  for (const id of KNOWN_DISTRICT_IDS) {
    if (district.includes(id) || district.includes(districtShortName(id).toLowerCase())) {
      return id;
    }
  }
  return DEFAULT_NEIGHBORHOOD_ID;
}

function computePersonnelScore(input: OperationSignalsEngineInput): {
  score: number;
  summary: string;
  tags: string[];
} {
  const teams = input.personnelState?.teams;
  const events = input.gameState.events;
  const day1Cap = input.isDay1Tutorial ? 48 : 100;

  if (teams?.length) {
    const avgFatigue =
      teams.reduce((s, t) => s + t.fatigue, 0) / Math.max(1, teams.length);
    const avgMorale =
      teams.reduce((s, t) => s + t.morale, 0) / Math.max(1, teams.length);
    const tiredCount = teams.filter(
      (t) => t.fatigue >= 70 || t.status === 'tired' || t.status === 'exhausted',
    ).length;
    let score = 22 + avgFatigue * 0.45 + (100 - avgMorale) * 0.2 + tiredCount * 8;
    score = Math.min(day1Cap, score);
    let summary = 'Ekip dengesi bugün kontrollü.';
    const tags = ['personnel_state'];
    if (tiredCount >= 2) {
      summary = 'Saha ekibi üst üste görev baskısı altında.';
      tags.push('fatigue_high');
    } else if (tiredCount === 1 || avgFatigue >= 65) {
      summary = 'Personel yorgunluğu sınırda; görev dağılımını sade tut.';
      tags.push('fatigue_watch');
    } else if (avgMorale < 50) {
      summary = 'Ekip morali düşük; iletişimli görevler öncelik kazanabilir.';
      tags.push('morale_low');
    }
    if (input.isDay1Tutorial) {
      summary = 'Bugün personel odağı seçmek yarınki yorgunluğu azaltabilir.';
    }
    return { score, summary, tags };
  }

  const highPressure = events.filter(
    (e) => e.riskLevel === 'high' || e.riskLevel === 'critical',
  ).length;
  const score = Math.min(
    day1Cap,
    30 + events.length * 6 + highPressure * 10,
  );
  return {
    score,
    summary:
      highPressure > 0
        ? 'Aktif görevler personel baskısını artırıyor.'
        : 'Personel kapasitesi günlük akış için yeterli görünüyor.',
    tags: ['personnel_fallback', `events_${events.length}`],
  };
}

function computeVehicleScore(input: OperationSignalsEngineInput): {
  score: number;
  summary: string;
  tags: string[];
} {
  const units = input.vehicleState?.units;
  const events = input.gameState.events;
  const day1Cap = input.isDay1Tutorial ? 45 : 100;

  if (units?.length) {
    const maintenance = units.filter(
      (u) =>
        u.operationalStatus === 'maintenance' || u.operationalStatus === 'broken',
    ).length;
    const avgWear =
      units.reduce((s, u) => s + u.maintenanceNeed, 0) / Math.max(1, units.length);
    const avgWorkload =
      units.reduce((s, u) => s + u.workload, 0) / Math.max(1, units.length);
    let score = 20 + maintenance * 12 + avgWear * 0.35 + avgWorkload * 0.25;
    score = Math.min(day1Cap, score);
    let summary = 'Araç filosu günlük operasyon için hazır görünüyor.';
    const tags = ['vehicle_state'];
    if (maintenance > 0 || avgWear >= 60) {
      summary = 'Araç bakım riski izlemeye alınmalı.';
      tags.push('maintenance_watch');
    } else if (avgWorkload >= 70) {
      summary = 'Yüksek kapasiteli müdahaleler araç baskısını artırabilir.';
      tags.push('workload_high');
    }
    return { score, summary, tags };
  }

  const vehicleEvents = events.filter((e) => isVehicleCategory(e.category));
  const weighted = vehicleEvents.reduce((s, e) => s + 12 * eventSeverityWeight(e), 0);
  const score = Math.min(day1Cap, 28 + weighted);
  return {
    score,
    summary:
      vehicleEvents.length > 0
        ? 'Rota ve araç görevleri filo baskısını yükseltiyor.'
        : 'Araç rotası bugün dengeli görünüyor.',
    tags: ['vehicle_fallback'],
  };
}

function computeContainerScore(input: OperationSignalsEngineInput): {
  score: number;
  summary: string;
  tags: string[];
} {
  const units = input.containerState?.units;
  const events = input.gameState.events;
  const day1Cap = input.isDay1Tutorial ? 46 : 100;

  if (units?.length) {
    const stressed = units.filter(
      (u) =>
        u.fillRate >= 0.85 ||
        u.overflowRisk === 'high' ||
        u.overflowRisk === 'critical' ||
        u.status === 'overflowing',
    );
    const maintenanceHeavy = units.filter((u) => u.maintenanceNeed >= 55).length;
    let score =
      24 +
      stressed.length * 9 +
      maintenanceHeavy * 5 +
      units.filter((u) => u.fillRate >= 0.7).length * 3;
    score = Math.min(day1Cap, score);
    let summary = 'Konteyner ağı bugün dengeli.';
    const tags = ['container_state'];
    if (stressed.length > 0) {
      const top = stressed[0]!;
      const hood = districtShortName(top.neighborhoodId);
      summary =
        stressed.length >= 2
          ? `${hood} çevresinde temizlik sinyali öne çıkıyor.`
          : `${hood} çevresinde konteyner temizlik riski arttı.`;
      tags.push('fill_pressure');
    } else if (maintenanceHeavy > 0) {
      summary = 'Doluluk değil, bakım/temizlik etkisi takip edilmeli.';
      tags.push('maintenance_focus');
    }
    return { score, summary, tags };
  }

  const containerEvents = events.filter((e) => isContainerCategory(e.category));
  const weighted = containerEvents.reduce(
    (s, e) => s + 14 * eventSeverityWeight(e),
    0,
  );
  const score = Math.min(day1Cap, 30 + weighted);
  return {
    score,
    summary:
      containerEvents.length > 0
        ? 'Atık ve konteyner olayları saha baskısını artırıyor.'
        : 'Konteyner ağı bugün dengeli.',
    tags: ['container_fallback'],
  };
}

function computeDistrictScore(
  input: OperationSignalsEngineInput,
  priorityDistrictId: string,
): { score: number; summary: string; tags: string[] } {
  const events = input.gameState.events;
  const postPilot = normalizePostPilotOperationState(
    input.gameState.pilot.postPilotOperation,
    {
      pilotStatus: input.gameState.pilot.status,
      currentPilotDay: input.gameState.pilot.currentPilotDay,
    },
  );
  const day1Cap = input.isDay1Tutorial ? 44 : 100;
  const districtEvents = events.filter(
    (e) => resolveDistrictIdFromEvent(e) === priorityDistrictId,
  );
  const socialInDistrict = districtEvents.filter((e) =>
    isSocialCategory(e.category),
  ).length;
  let score =
    26 +
    districtEvents.length * 8 +
    districtEvents.reduce((s, e) => s + 6 * (eventSeverityWeight(e) - 0.75), 0) +
    socialInDistrict * 5;
  score = Math.min(day1Cap, score);

  let summary = `Bugünün mahalle odağı ${districtShortName(priorityDistrictId)}.`;
  const tags = ['district_events', priorityDistrictId];

  if (postPilot.phase === 'main_operation_light') {
    summary = 'Pilot sonrası gündem sinyali sınırlı; mahalle takibi yumuşak.';
    score = Math.min(score, 52);
    tags.push('post_pilot_light');
  } else if (socialInDistrict > 0) {
    summary = `${districtShortName(priorityDistrictId)} sosyal tepki açısından izlenmeli.`;
    tags.push('social_pressure');
  } else if (priorityDistrictId === 'merkez') {
    summary = 'Merkez görünür hizmet beklentisi taşıyor.';
  } else if (priorityDistrictId === 'sanayi') {
    summary = 'Sanayi hattında operasyonel tempo yüksek.';
  }

  return { score, summary, tags };
}

export function choosePriorityDistrict(
  input: OperationSignalsEngineInput,
  _currentSignals?: OperationSignalsState,
): NeighborhoodIdentityId {
  const events = input.gameState.events;
  if (events.length === 0) {
    const pilotDistrict = input.gameState.pilot.selectedDistrictId;
    if (pilotDistrict && KNOWN_DISTRICT_IDS.includes(pilotDistrict as NeighborhoodIdentityId)) {
      return pilotDistrict as NeighborhoodIdentityId;
    }
    return DEFAULT_NEIGHBORHOOD_ID;
  }
  const scored = new Map<NeighborhoodIdentityId, number>();
  for (const event of events) {
    const id = resolveDistrictIdFromEvent(event);
    const prev = scored.get(id) ?? 0;
    scored.set(id, prev + 10 * eventSeverityWeight(event));
  }
  let best = DEFAULT_NEIGHBORHOOD_ID;
  let bestScore = -1;
  for (const [id, value] of scored) {
    if (value > bestScore) {
      bestScore = value;
      best = id;
    }
  }
  return best;
}

export function calculateOverallOperationScore(signals: {
  personnel: number;
  vehicles: number;
  containers: number;
  districts: number;
}): number {
  const raw =
    signals.personnel * 0.28 +
    signals.vehicles * 0.24 +
    signals.containers * 0.24 +
    signals.districts * 0.24;
  return clampSignalScore(raw);
}

function resolveDailyFocus(scores: {
  personnel: number;
  vehicles: number;
  containers: number;
  districts: number;
}): OperationDailyFocus {
  const entries: Array<[OperationDailyFocus, number]> = [
    ['personnel', scores.personnel],
    ['vehicles', scores.vehicles],
    ['containers', scores.containers],
    ['districts', scores.districts],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0]![1];
  const second = entries[1]![1];
  if (top - second < 8) return 'balanced';
  return entries[0]![0];
}

export function deriveOperationSignalsFromGameState(
  input: OperationSignalsEngineInput,
): OperationSignalsState {
  const day = input.gameState.city.day;
  const previous =
    input.operationSignals ?? createInitialOperationSignalsState(day);
  const priorityDistrictId = choosePriorityDistrict(input, previous);

  const personnel = computePersonnelScore(input);
  const vehicles = computeVehicleScore(input);
  const containers = computeContainerScore(input);
  const districts = computeDistrictScore(input, priorityDistrictId);

  let overallScore = calculateOverallOperationScore({
    personnel: personnel.score,
    vehicles: vehicles.score,
    containers: containers.score,
    districts: districts.score,
  });

  const hasCritical = input.gameState.events.some(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  );
  if (hasCritical && !input.isDay1Tutorial) {
    overallScore = Math.max(overallScore, 62);
  }
  if (input.isDay1Tutorial) {
    overallScore = Math.min(overallScore, 52);
  }

  const dailyFocus = resolveDailyFocus({
    personnel: personnel.score,
    vehicles: vehicles.score,
    containers: containers.score,
    districts: districts.score,
  });

  return {
    personnel: buildOperationSignal(
      'personnel',
      personnel.score,
      previous.personnel.score,
      day,
      'Personel',
      personnel.summary,
      personnel.tags,
    ),
    vehicles: buildOperationSignal(
      'vehicles',
      vehicles.score,
      previous.vehicles.score,
      day,
      'Araç',
      vehicles.summary,
      vehicles.tags,
    ),
    containers: buildOperationSignal(
      'containers',
      containers.score,
      previous.containers.score,
      day,
      'Konteyner',
      containers.summary,
      containers.tags,
    ),
    districts: buildOperationSignal(
      'districts',
      districts.score,
      previous.districts.score,
      day,
      'Mahalle',
      districts.summary,
      districts.tags,
    ),
    overall: buildOperationSignal(
      'overall',
      overallScore,
      previous.overall.score,
      day,
      'Genel operasyon',
      overallScore >= 62
        ? 'Günlük operasyon baskısı yükseldi; öncelikleri netleştir.'
        : overallScore >= 38
          ? 'Operasyon dengesi izlemede; küçük sapmalar büyüyebilir.'
          : 'Günlük operasyon sağlığı dengeli görünüyor.',
      ['overall', hasCritical ? 'critical_event' : 'steady'],
    ),
    priorityDistrictId,
    dailyFocus,
    lastProcessedDay: previous.lastProcessedDay,
    lastRefreshedDay: day,
  };
}

export function processOperationSignalsEndOfDay(
  input: OperationSignalsEngineInput,
): OperationSignalsState {
  const day = input.gameState.city.day;
  const base = deriveOperationSignalsFromGameState(input);
  if (base.lastProcessedDay === day) {
    return base;
  }

  const mult = input.isDay1Tutorial
    ? END_OF_DAY_SIGNAL_DELTAS.day1Multiplier
    : 1;
  const solvedIds = new Set(input.gameState.solvedEvents.map((e) => e.id));
  const dayHistory =
    input.decisionHistory?.filter((r) => r.day === day) ?? [];

  let personnel = base.personnel.score;
  let vehicles = base.vehicles.score;
  let containers = base.containers.score;
  let districts = base.districts.score;

  for (const record of dayHistory) {
    const event = input.gameState.events.find((e) => e.id === record.eventId);
    if (!event) continue;
    const resolved = solvedIds.has(event.id);
    const w = eventSeverityWeight(event);
    if (isContainerCategory(event.category)) {
      personnel += resolved ? -2 * mult : 3 * mult;
      containers += resolved
        ? END_OF_DAY_SIGNAL_DELTAS.resolvedContainer * mult
        : END_OF_DAY_SIGNAL_DELTAS.unresolvedContainerPressure * mult * w;
      vehicles += resolved ? -1 * mult : 2 * mult;
    } else if (isVehicleCategory(event.category)) {
      vehicles += resolved ? -4 * mult : END_OF_DAY_SIGNAL_DELTAS.unresolvedHighSeverity * mult * 0.5;
      personnel += resolved ? -1 * mult : 3 * mult;
    } else if (isSocialCategory(event.category)) {
      districts += resolved ? -3 * mult : 5 * mult * w;
      personnel += resolved ? -2 * mult : 4 * mult;
    } else if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      const delta = resolved
        ? END_OF_DAY_SIGNAL_DELTAS.resolvedHighSeverity * mult
        : END_OF_DAY_SIGNAL_DELTAS.unresolvedHighSeverity * mult;
      personnel += delta * 0.3;
      vehicles += delta * 0.25;
      containers += delta * 0.2;
      districts += delta * 0.35;
    }
  }

  personnel = clampSignalScore(personnel);
  vehicles = clampSignalScore(vehicles);
  containers = clampSignalScore(containers);
  districts = clampSignalScore(districts);
  let overall = calculateOverallOperationScore({
    personnel,
    vehicles,
    containers,
    districts,
  });
  if (input.isDay1Tutorial) {
    overall = Math.min(overall, 50);
  }

  const prev = base;
  return {
    ...base,
    personnel: buildOperationSignal(
      'personnel',
      personnel,
      prev.personnel.score,
      day,
      'Personel',
      prev.personnel.summary,
      [...prev.personnel.sourceTags, 'eod'],
    ),
    vehicles: buildOperationSignal(
      'vehicles',
      vehicles,
      prev.vehicles.score,
      day,
      'Araç',
      prev.vehicles.summary,
      [...prev.vehicles.sourceTags, 'eod'],
    ),
    containers: buildOperationSignal(
      'containers',
      containers,
      prev.containers.score,
      day,
      'Konteyner',
      prev.containers.summary,
      [...prev.containers.sourceTags, 'eod'],
    ),
    districts: buildOperationSignal(
      'districts',
      districts,
      prev.districts.score,
      day,
      'Mahalle',
      prev.districts.summary,
      [...prev.districts.sourceTags, 'eod'],
    ),
    overall: buildOperationSignal(
      'overall',
      overall,
      prev.overall.score,
      day,
      'Genel operasyon',
      prev.overall.summary,
      [...prev.overall.sourceTags, 'eod'],
    ),
    lastProcessedDay: day,
    lastRefreshedDay: day,
  };
}

function decisionStyleMultiplier(decision: EventDecision): number {
  switch (decision.style) {
    case 'bold':
    case 'risky':
      return 1.2;
    case 'cautious':
      return 0.75;
    default:
      return 1;
  }
}

export function buildOperationImpactPreviewForEvent(
  input: OperationSignalsEngineInput,
  event: EventCard,
): OperationImpactPreview {
  const w = eventSeverityWeight(event);
  let personnelDelta = 0;
  let vehicleDelta = 0;
  let containerDelta = 0;
  let districtDelta = 0;

  if (isSocialCategory(event.category)) {
    districtDelta = Math.round(4 * w);
    personnelDelta = Math.round(3 * w);
  } else if (isVehicleCategory(event.category)) {
    vehicleDelta = Math.round(5 * w);
    personnelDelta = Math.round(2 * w);
  } else if (isContainerCategory(event.category)) {
    containerDelta = Math.round(-5 * w);
    vehicleDelta = Math.round(3 * w);
  } else {
    personnelDelta = Math.round(2 * w);
    districtDelta = Math.round(2 * w);
  }

  let summary = 'Bu müdahale günlük operasyon dengesini hafifçe etkiler.';
  if (containerDelta < 0 && vehicleDelta > 0) {
    summary =
      'Bu müdahale konteyner baskısını azaltabilir ama araç riskini artırabilir.';
  } else if (districtDelta > 3) {
    summary = 'Hızlı çözüm sosyal tepkiyi düşürür, personel yorgunluğunu artırabilir.';
  } else if (w < 1) {
    summary = 'Dengeli çözüm kısa vadede yavaş ama yarına daha az risk taşır.';
  }

  const maxDelta = Math.max(
    Math.abs(personnelDelta),
    Math.abs(vehicleDelta),
    Math.abs(containerDelta),
    Math.abs(districtDelta),
  );
  const severityLabel =
    maxDelta >= 6 ? 'Belirgin etki' : maxDelta >= 3 ? 'Orta etki' : 'Hafif etki';

  return {
    personnelDelta,
    vehicleDelta,
    containerDelta,
    districtDelta,
    summary,
    severityLabel,
  };
}

export function buildOperationImpactPreviewForDecision(
  input: OperationSignalsEngineInput,
  event: EventCard,
  decision: EventDecision,
): OperationImpactPreview {
  const base = buildOperationImpactPreviewForEvent(input, event);
  const mult = decisionStyleMultiplier(decision);
  const personnelDelta = Math.round(base.personnelDelta * mult);
  const vehicleDelta = Math.round(base.vehicleDelta * mult);
  const containerDelta = Math.round(base.containerDelta * mult);
  const districtDelta = Math.round(base.districtDelta * mult);

  let summary = base.summary;
  if (decision.style === 'bold' || decision.style === 'risky') {
    summary =
      'Hızlı müdahale kısa vadede iyi; personel ve araç baskısı artabilir.';
  } else if (decision.style === 'cautious') {
    summary = 'Temkinli seçim yarına daha az operasyon riski bırakır.';
  } else if (decision.delayHint) {
    summary = 'Erteleme mahalle baskısını yarın büyütebilir.';
  }

  const maxDelta = Math.max(
    Math.abs(personnelDelta),
    Math.abs(vehicleDelta),
    Math.abs(containerDelta),
    Math.abs(districtDelta),
  );
  const severityLabel =
    maxDelta >= 6 ? 'Belirgin etki' : maxDelta >= 3 ? 'Orta etki' : 'Hafif etki';

  return {
    personnelDelta,
    vehicleDelta,
    containerDelta,
    districtDelta,
    summary,
    severityLabel,
  };
}

export function buildOperationSignalsEngineInputFromStore(state: {
  gameState: OperationSignalsEngineInput['gameState'];
  personnelState?: OperationSignalsEngineInput['personnelState'];
  vehicleState?: OperationSignalsEngineInput['vehicleState'];
  containerState?: OperationSignalsEngineInput['containerState'];
  decisionHistory?: OperationSignalsEngineInput['decisionHistory'];
  operationSignals?: OperationSignalsState;
  isDay1Tutorial?: boolean;
}): OperationSignalsEngineInput {
  return { ...state };
}

export function snapshotFromSignals(
  state: OperationSignalsState,
  day: number,
): import('./operationSignalTypes').OperationSignalsSnapshot {
  return {
    day,
    personnelScore: state.personnel.score,
    vehicleScore: state.vehicles.score,
    containerScore: state.containers.score,
    districtScore: state.districts.score,
    overallScore: state.overall.score,
    priorityDistrictId: state.priorityDistrictId,
  };
}

export { getSignalStatus };
