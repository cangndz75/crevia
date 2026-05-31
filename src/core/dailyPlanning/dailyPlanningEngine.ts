import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import { NEIGHBORHOOD_IDENTITIES } from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';
import type { NeighborhoodIdentityId } from '@/core/neighborhoodIdentity/neighborhoodIdentityTypes';
import {
  buildOperationSignal,
  clampSignalScore,
} from '@/core/operations/operationSignalState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import { BALANCE_COPY } from '@/core/balance/gameplayImpactConstants';
import { scaleGameplayDelta } from '@/core/balance/gameplayImpactTuning';
import type { GameplayImpactScaleContext } from '@/core/balance/gameplayImpactTypes';

import {
  DAILY_CONTAINER_FOCUS_OPTIONS,
  DAILY_PERSONNEL_FOCUS_OPTIONS,
  DAILY_PLANNING_COPY,
  DAILY_VEHICLE_FOCUS_OPTIONS,
} from './dailyPlanningConstants';
import {
  createDefaultSuggestedPlan,
  getDailyPlanTotalCost,
  isDailyPlanConfirmedForDay,
  markDailyPlanProcessed,
} from './dailyPlanningState';
import type {
  DailyOperationsPlanState,
  DailyPlanEffect,
  DailyPlanImpactPreview,
  DailyPlanningEngineInput,
} from './dailyPlanningTypes';

function buildPlanScaleContext(input: DailyPlanningEngineInput): GameplayImpactScaleContext {
  return {
    gameState: input.gameState,
    isDay1Tutorial: input.isDay1Tutorial,
    postPilotLightPhase: input.postPilotLightPhase,
  };
}

function pushEffect(
  effects: DailyPlanEffect[],
  domain: DailyPlanEffect['domain'],
  delta: number,
  reason: string,
  input: DailyPlanningEngineInput,
): void {
  const scaled = scaleGameplayDelta(delta, buildPlanScaleContext(input));
  if (scaled === 0) return;
  effects.push({ domain, delta: scaled, reason });
}

export function buildSuggestedDailyPlan(
  input: DailyPlanningEngineInput,
): DailyOperationsPlanState {
  const day = input.gameState.city.day;
  return createDefaultSuggestedPlan(day, input.operationSignals);
}

export function calculateDailyPlanEffects(
  input: DailyPlanningEngineInput,
  plan: DailyOperationsPlanState,
): DailyPlanEffect[] {
  const effects: DailyPlanEffect[] = [];
  const signals = input.operationSignals;
  const vehiclesStrained =
    signals?.vehicles.status === 'strained' ||
    signals?.vehicles.status === 'critical';
  const containersHigh =
    (signals?.containers.score ?? 0) >= 50 ||
    signals?.containers.status === 'strained' ||
    signals?.containers.status === 'critical';

  switch (plan.personnelFocus) {
    case 'balanced_shift':
      pushEffect(effects, 'personnel', -3, 'Dengeli vardiya personel baskısını hafifletir', input);
      pushEffect(effects, 'overall', -1, 'Operasyon dengesi korunur', input);
      break;
    case 'rapid_response':
      pushEffect(effects, 'districts', -5, BALANCE_COPY.rapidResponseReport, input);
      pushEffect(effects, 'personnel', 6, 'Hızlı müdahale personel baskısını artırır', input);
      pushEffect(effects, 'vehicles', 2, 'Saha hızı için araç yükü artar', input);
      break;
    case 'rest_rotation':
      pushEffect(effects, 'personnel', -8, 'Dinlendirme rotasyonu personel baskısını düşürür', input);
      pushEffect(effects, 'overall', -2, BALANCE_COPY.restRotationReport, input);
      pushEffect(effects, 'districts', 2, 'Bugünkü müdahale hızı sınırlı kalır', input);
      break;
    case 'field_inspection':
      pushEffect(effects, 'districts', -6, 'Saha denetimi mahalle riskini erken görünür kılar', input);
      pushEffect(effects, 'personnel', 3, 'Denetim ekibi ek yük taşır', input);
      if (
        signals?.overall.status === 'watch' ||
        signals?.overall.status === 'strained' ||
        signals?.overall.status === 'critical'
      ) {
        pushEffect(effects, 'overall', -2, 'Kriz eşiği izlemesi desteklendi', input);
      }
      break;
    default:
      break;
  }

  switch (plan.vehicleFocus) {
    case 'ready_fleet':
      pushEffect(effects, 'vehicles', -3, 'Filo hazır odağı araç baskısını dengeler', input);
      break;
    case 'preventive_maintenance':
      pushEffect(effects, 'vehicles', -9, BALANCE_COPY.preventiveMaintenanceReport, input);
      if (vehiclesStrained) {
        pushEffect(effects, 'overall', -3, 'Önleyici bakım filo baskısını belirgin düşürür', input);
      }
      if (containersHigh) {
        pushEffect(effects, 'containers', 2, 'Önleyici bakım konteyner gecikmesi riski', input);
      }
      break;
    case 'high_capacity':
      pushEffect(effects, 'containers', -7, 'Yüksek kapasite konteyner baskısını düşürür', input);
      pushEffect(effects, 'vehicles', 7, 'Filo kapasitesi zorlanır', input);
      pushEffect(effects, 'personnel', 2, 'Yoğun saha personel yükü artar', input);
      if (vehiclesStrained) {
        pushEffect(effects, 'overall', 2, 'Araç baskısı zaten yüksek; kriz riski izlenir', input);
      }
      break;
    case 'route_check':
      pushEffect(effects, 'vehicles', -5, 'Rota kontrolü gecikme riskini azaltır', input);
      pushEffect(effects, 'districts', -5, 'Mahalle rotaları dengelenir', input);
      if (vehiclesStrained) {
        pushEffect(effects, 'overall', -2, 'Rota kontrolü araç baskısını yumuşatır', input);
      }
      break;
    default:
      break;
  }

  switch (plan.containerFocus) {
    case 'standard_collection':
      pushEffect(effects, 'containers', -3, 'Standart toplama konteyner dengesini korur', input);
      break;
    case 'intensive_collection':
      pushEffect(effects, 'containers', -9, 'Yoğun toplama doluluk baskısını düşürür', input);
      pushEffect(effects, 'vehicles', 5, 'Yoğun toplama filo baskısını artırır', input);
      pushEffect(effects, 'personnel', 3, 'Yoğun toplama personel yükünü artırır', input);
      break;
    case 'cleanliness_maintenance':
      pushEffect(effects, 'containers', -7, 'Temizlik bakımı konteyner riskini düşürür', input);
      pushEffect(effects, 'districts', -6, 'Mahalle ve sosyal baskı yumuşar', input);
      pushEffect(effects, 'vehicles', 1, 'Temizlik rotası araç yükünü hafif artırır', input);
      if (containersHigh) {
        pushEffect(effects, 'overall', -2, 'Temizlik bakımı konteyner baskısını net düşürür', input);
      }
      break;
    case 'risk_inspection':
      pushEffect(effects, 'containers', -4, 'Risk incelemesi gizli sorunları erken gösterir', input);
      pushEffect(effects, 'districts', -5, 'Mahalle risk görünürlüğü artar', input);
      pushEffect(effects, 'overall', -2, 'Önleyici inceleme operasyon dengesini destekler', input);
      break;
    default:
      break;
  }

  if (plan.districtFocusId) {
    pushEffect(
      effects,
      'districts',
      -6,
      'Seçili mahalle odağı bölgesel baskıyı hafifletir',
      input,
    );
  }

  return effects;
}

export function applyDailyPlanEffectsToOperationSignals(
  signals: OperationSignalsState,
  effects: DailyPlanEffect[],
): OperationSignalsState {
  if (effects.length === 0) return signals;

  let personnelScore = signals.personnel.score;
  let vehiclesScore = signals.vehicles.score;
  let containersScore = signals.containers.score;
  let districtsScore = signals.districts.score;
  let overallScore = signals.overall.score;
  const day = signals.personnel.lastUpdatedDay;

  for (const effect of effects) {
    switch (effect.domain) {
      case 'personnel':
        personnelScore += effect.delta;
        break;
      case 'vehicles':
        vehiclesScore += effect.delta;
        break;
      case 'containers':
        containersScore += effect.delta;
        break;
      case 'districts':
        districtsScore += effect.delta;
        break;
      case 'overall':
        overallScore += effect.delta;
        break;
      default:
        break;
    }
  }

  const tags = ['daily_plan'];
  const mk = (
    domain: 'personnel' | 'vehicles' | 'containers' | 'districts' | 'overall',
    score: number,
    prev: OperationSignalsState['personnel'],
  ) =>
    buildOperationSignal(
      domain,
      clampSignalScore(score),
      prev.score,
      day,
      prev.title,
      prev.summary,
      [...new Set([...prev.sourceTags, ...tags])],
    );

  return {
    ...signals,
    personnel: mk('personnel', personnelScore, signals.personnel),
    vehicles: mk('vehicles', vehiclesScore, signals.vehicles),
    containers: mk('containers', containersScore, signals.containers),
    districts: mk('districts', districtsScore, signals.districts),
    overall: mk('overall', overallScore, signals.overall),
    priorityDistrictId: signals.priorityDistrictId,
    lastProcessedDay: day,
  };
}

export function processDailyPlanEndOfDay(input: {
  plan: DailyOperationsPlanState;
  closingDay: number;
  engineInput: DailyPlanningEngineInput;
}): { plan: DailyOperationsPlanState; effects: DailyPlanEffect[] } {
  const { plan, closingDay, engineInput } = input;
  if (plan.lastProcessedDay === closingDay) {
    return { plan, effects: plan.appliedEffects };
  }

  const effectivePlan =
    plan.status === 'confirmed' || plan.status === 'suggested'
      ? plan
      : { ...plan, ...createDefaultSuggestedPlan(closingDay, engineInput.operationSignals), day: closingDay };

  const effects = calculateDailyPlanEffects(engineInput, {
    ...effectivePlan,
    day: closingDay,
  });

  const processed = markDailyPlanProcessed(
    { ...effectivePlan, day: closingDay },
    closingDay,
    effects,
  );

  return { plan: processed, effects };
}

function isSocialCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes('social') || c.includes('sosyal') || c.includes('halk');
}

function isVehicleCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes('vehicle') || c.includes('araç') || c.includes('route');
}

function isContainerCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes('container') || c.includes('konteyner') || c.includes('waste');
}

export function buildDailyPlanImpactPreview(
  input: DailyPlanningEngineInput,
  event?: EventCard,
  _decision?: EventDecision,
): DailyPlanImpactPreview | undefined {
  const plan = input.dailyOperationsPlan;
  if (!plan || plan.day !== input.gameState.city.day) {
    return undefined;
  }
  if (input.isDay1Tutorial) {
    return undefined;
  }

  const lines: string[] = [];
  let tone: DailyPlanImpactPreview['tone'] = 'neutral';

  const vehicleOpt = DAILY_VEHICLE_FOCUS_OPTIONS[plan.vehicleFocus];
  const personnelOpt = DAILY_PERSONNEL_FOCUS_OPTIONS[plan.personnelFocus];
  const containerOpt = DAILY_CONTAINER_FOCUS_OPTIONS[plan.containerFocus];

  if (plan.vehicleFocus === 'preventive_maintenance') {
    lines.push(BALANCE_COPY.preventiveMaintenanceReport);
    tone = 'positive';
  }
  if (plan.personnelFocus === 'rapid_response') {
    lines.push(BALANCE_COPY.rapidResponseReport);
    tone = 'warning';
  }
  if (plan.personnelFocus === 'rest_rotation') {
    lines.push(BALANCE_COPY.restRotationReport);
    tone = 'warning';
  }
  if (plan.containerFocus === 'cleanliness_maintenance') {
    lines.push('Konteyner temizlik odağı sosyal tepkiyi azaltabilir.');
    tone = 'positive';
  }

  if (event) {
    const districtMatch =
      event.district != null &&
      plan.districtFocusId.length > 0 &&
      event.district.toLowerCase().includes(plan.districtFocusId);
    if (districtMatch) {
      lines.push('Seçili mahalle odağı bu olayla uyumlu.');
      tone = 'positive';
    }
    if (isVehicleCategory(event.category) && plan.vehicleFocus === 'high_capacity') {
      lines.push('Yüksek kapasite odağı bu görevde filoyu güçlendirir.');
    }
    if (isSocialCategory(event.category) && plan.personnelFocus === 'field_inspection') {
      lines.push('Saha denetimi odağı mahalle sinyallerini destekler.');
    }
    if (isContainerCategory(event.category) && plan.containerFocus === 'intensive_collection') {
      lines.push('Yoğun toplama odağı konteyner baskısına karşı etkili.');
    }
    if (
      (event.riskLevel === 'high' || event.riskLevel === 'critical') &&
      plan.personnelFocus === 'rapid_response'
    ) {
      lines.push('Hızlı müdahale odağı yüksek öncelikli olayda avantaj sağlar.');
    }
    if (
      plan.vehicleFocus === 'preventive_maintenance' &&
      (isVehicleCategory(event.category) || event.riskLevel === 'high')
    ) {
      lines.push('Önleyici bakım odağında kapasite esnekliği sınırlı kalabilir.');
      tone = 'warning';
    }
    if (plan.personnelFocus === 'rest_rotation' && event.riskLevel !== 'low') {
      lines.push('Dinlendirme odağında müdahale kapasitesi sınırlı.');
      tone = 'warning';
    }
  }

  if (lines.length === 0) {
    lines.push(
      `${personnelOpt.shortLabel} / ${vehicleOpt.shortLabel} / ${containerOpt.shortLabel} planı bugünkü operasyona yön veriyor.`,
    );
  }

  const effects = calculateDailyPlanEffects(input, plan);
  return {
    title: DAILY_PLANNING_COPY.impactPreviewTitle,
    summary: lines[0]!.slice(0, 140),
    effects,
    tone,
  };
}

export function getDailyPlanAdvisorComment(
  input: DailyPlanningEngineInput,
  plan?: DailyOperationsPlanState,
): string {
  const active = plan ?? input.dailyOperationsPlan;
  if (!active || active.day !== input.gameState.city.day) {
    return 'Bugün için operasyon planını onaylamak sinyalleri netleştirir.';
  }

  const level = input.advisorState?.level ?? 1;
  const band = input.advisorState?.reliabilityBand ?? 'early_observation';
  const vehicleLabel = DAILY_VEHICLE_FOCUS_OPTIONS[active.vehicleFocus].label;
  const personnelLabel = DAILY_PERSONNEL_FOCUS_OPTIONS[active.personnelFocus].label;
  const containerLabel = DAILY_CONTAINER_FOCUS_OPTIONS[active.containerFocus].label;

  if (level === 1 || band === 'early_observation') {
    if (active.vehicleFocus === 'preventive_maintenance') {
      return `Bu plan araç tarafında işe yarayabilir, ama etkisi gün sonunda daha net görünür.`;
    }
    return `Seçilen plan (${vehicleLabel}) bugünkü sinyallere yanıt verebilir; etkiyi gün sonunda izle.`;
  }

  if (active.vehicleFocus === 'preventive_maintenance') {
    return level >= 3
      ? 'Önleyici bakım bugün puanı çok yükseltmez ama yarın araç kaynaklı aksama riskini azaltır.'
      : 'Önleyici bakım araç riskini düşürür. Yüksek kapasiteli olaylarda esneklik azalabilir.';
  }
  if (active.personnelFocus === 'rapid_response') {
    return 'Hızlı müdahale odağı personel baskısını artırabilir. Gün sonu yorgunluğu izle.';
  }
  if (active.containerFocus === 'cleanliness_maintenance') {
    const districtName =
      NEIGHBORHOOD_IDENTITIES[active.districtFocusId as NeighborhoodIdentityId]
        ?.shortName ?? active.districtFocusId;
    return `Konteyner temizlik odağı ${districtName} yönünde sosyal tepkiyi azaltabilir.`;
  }

  if (!isDailyPlanConfirmedForDay(active, active.day)) {
    return `Önerilen plan: ${personnelLabel}, ${vehicleLabel}, ${containerLabel}. Onaylamak günlük odağı netleştirir.`;
  }

  return `Bugün ${vehicleLabel.toLowerCase()} seçildi. Araç sinyalini düşürmek için doğru bir denge.`;
}

export function getFocusDomainPressureMatch(
  input: DailyPlanningEngineInput,
  plan: DailyOperationsPlanState,
): { matched: boolean; message: string } {
  const signals = input.operationSignals;
  if (!signals) {
    return { matched: false, message: 'Sinyal verisi henüz oluşmadı.' };
  }

  if (
    plan.vehicleFocus === 'preventive_maintenance' &&
    (signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical')
  ) {
    return {
      matched: true,
      message: 'Önleyici bakım odağı araç baskısıyla uyumlu.',
    };
  }
  if (
    plan.containerFocus === 'intensive_collection' &&
    (signals.containers.status === 'watch' ||
      signals.containers.status === 'strained')
  ) {
    return {
      matched: true,
      message: 'Yoğun toplama konteyner sinyaliyle uyumlu.',
    };
  }
  return {
    matched: false,
    message: 'Plan bugünkü sinyallerle dengeli görünüyor.',
  };
}

export function getDistrictDisplayName(districtId: string): string {
  const entry = NEIGHBORHOOD_IDENTITIES[districtId as NeighborhoodIdentityId];
  return entry?.shortName ?? districtId;
}

export function isPlanOverBudget(plan: DailyOperationsPlanState): boolean {
  return getDailyPlanTotalCost(plan) > plan.operationFocusPoints.total;
}
