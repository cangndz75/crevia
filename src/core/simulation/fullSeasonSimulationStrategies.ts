import type { CrisisActionType } from '@/core/crisisActions/crisisActionTypes';
import { selectBestCrisisActionType } from '@/core/crisisActions/crisisActionEngine';
import type { CrisisActionEngineInput } from '@/core/crisisActions/crisisActionTypes';
import {
  calculateAssignmentCompatibility,
  getCompatibilityLabel,
} from '@/core/assignments/assignmentEngine';
import type { AssignmentEngineInput } from '@/core/assignments/assignmentTypes';
import type {
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from '@/core/assignments/assignmentTypes';
import { buildSuggestedDailyPlan } from '@/core/dailyPlanning/dailyPlanningEngine';
import type { DailyPlanningEngineInput } from '@/core/dailyPlanning/dailyPlanningTypes';
import type {
  DailyContainerFocus,
  DailyPersonnelFocus,
  DailyVehicleFocus,
} from '@/core/dailyPlanning/dailyPlanningTypes';
import { confirmDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { MicroDecision } from '@/core/microDecisions/microDecisionTypes';
import { createSeededRandom } from '@/core/game/createSeededRandom';

import type { FullSeasonPlayerProfile } from './fullSeasonSimulationTypes';

export type StrategyRng = () => number;

export function shouldOpenFullAccessForProfile(profile: FullSeasonPlayerProfile): boolean {
  return profile !== 'limited_player';
}

export function chooseDailyPlanForProfile(
  input: DailyPlanningEngineInput,
  profile: FullSeasonPlayerProfile,
  rng: StrategyRng,
): ReturnType<typeof confirmDailyOperationsPlan> {
  const suggested = buildSuggestedDailyPlan(input);
  const signals = input.operationSignals!;

  let personnelFocus: DailyPersonnelFocus = suggested.personnelFocus;
  let vehicleFocus: DailyVehicleFocus = suggested.vehicleFocus;
  let containerFocus: DailyContainerFocus = suggested.containerFocus;

  const highestDomain = ((): 'personnel' | 'vehicles' | 'containers' | 'districts' => {
    const scores = [
      { d: 'personnel' as const, s: signals.personnel.score },
      { d: 'vehicles' as const, s: signals.vehicles.score },
      { d: 'containers' as const, s: signals.containers.score },
      { d: 'districts' as const, s: signals.districts.score },
    ];
    return scores.sort((a, b) => b.s - a.s)[0]!.d;
  })();

  switch (profile) {
    case 'strong_player':
      if (rng() > 0.16) {
        if (highestDomain === 'personnel') personnelFocus = 'rest_rotation';
        else if (highestDomain === 'vehicles') vehicleFocus = 'preventive_maintenance';
        else if (highestDomain === 'containers') containerFocus = 'risk_inspection';
        else personnelFocus = 'field_inspection';
      } else {
        personnelFocus = 'balanced_shift';
        vehicleFocus = 'ready_fleet';
      }
      if (signals.vehicles.status !== 'strained' && signals.vehicles.status !== 'critical') {
        if (containerFocus === 'standard_collection' && rng() > 0.35) {
          containerFocus = 'intensive_collection';
        }
      } else {
        vehicleFocus = 'preventive_maintenance';
      }
      break;
    case 'weak_player': {
      const vehiclesStrained =
        signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical';
      const lowOverall =
        signals.overall.status === 'strained' || signals.overall.status === 'critical';
      personnelFocus = rng() > 0.3 ? 'rapid_response' : 'balanced_shift';
      vehicleFocus =
        vehiclesStrained && rng() > 0.2 ? 'high_capacity' : 'ready_fleet';
      containerFocus = rng() > 0.35 ? 'intensive_collection' : 'standard_collection';
      if (!lowOverall && rng() > 0.5) {
        containerFocus = 'standard_collection';
      }
      break;
    }
    case 'low_resource_player':
      personnelFocus = 'balanced_shift';
      vehicleFocus = 'ready_fleet';
      containerFocus = 'standard_collection';
      break;
    case 'crisis_heavy_player':
      if (
        signals.vehicles.status === 'strained' ||
        signals.vehicles.status === 'critical'
      ) {
        personnelFocus = rng() > 0.45 ? 'rest_rotation' : 'field_inspection';
        vehicleFocus = 'preventive_maintenance';
        containerFocus = rng() > 0.5 ? 'risk_inspection' : 'cleanliness_maintenance';
      } else if (rng() > 0.45) {
        personnelFocus = rng() > 0.4 ? 'field_inspection' : 'balanced_shift';
        vehicleFocus = rng() > 0.45 ? 'preventive_maintenance' : 'route_check';
        containerFocus = 'risk_inspection';
      } else {
        personnelFocus = 'balanced_shift';
        vehicleFocus = 'preventive_maintenance';
        containerFocus = 'risk_inspection';
      }
      break;
    case 'random_player': {
      const personnelOpts: DailyPersonnelFocus[] = [
        'balanced_shift',
        'rapid_response',
        'rest_rotation',
        'field_inspection',
      ];
      const vehicleOpts: DailyVehicleFocus[] = [
        'ready_fleet',
        'preventive_maintenance',
        'high_capacity',
        'route_check',
      ];
      const containerOpts: DailyContainerFocus[] = [
        'standard_collection',
        'intensive_collection',
        'cleanliness_maintenance',
        'risk_inspection',
      ];
      personnelFocus = personnelOpts[Math.floor(rng() * personnelOpts.length)]!;
      vehicleFocus = vehicleOpts[Math.floor(rng() * vehicleOpts.length)]!;
      containerFocus = containerOpts[Math.floor(rng() * containerOpts.length)]!;
      break;
    }
    case 'balanced_player':
      personnelFocus = 'balanced_shift';
      vehicleFocus = rng() > 0.7 ? 'ready_fleet' : 'route_check';
      containerFocus =
        rng() > 0.55 ? 'standard_collection' : 'cleanliness_maintenance';
      if (signals.vehicles.status === 'strained') {
        vehicleFocus = 'route_check';
      }
      if (rng() > 0.35) {
        personnelFocus = 'field_inspection';
      }
      break;
    case 'limited_player':
    default:
      personnelFocus = 'balanced_shift';
      vehicleFocus = 'ready_fleet';
      containerFocus = 'standard_collection';
      break;
  }

  return confirmDailyOperationsPlan(suggested, {
    personnelFocus,
    vehicleFocus,
    containerFocus,
  });
}

function pickAssignmentPatch(
  input: AssignmentEngineInput,
  event: EventCard,
  profile: FullSeasonPlayerProfile,
  rng: StrategyRng,
): {
  personnelType: PersonnelAssignmentType;
  vehicleType: VehicleAssignmentType;
  approachType: ResponseApproachType;
} {
  const category = event.category.toLowerCase();
  const isContainer = category.includes('container') || category.includes('konteyner');
  const isSocial = category.includes('social') || category.includes('sosyal');

  let personnelType: PersonnelAssignmentType = 'field_response_team';
  let vehicleType: VehicleAssignmentType = 'route_support_vehicle';
  let approachType: ResponseApproachType = 'balanced_response';

  if (profile === 'strong_player') {
    if (isContainer) {
      personnelType = 'technical_team';
      vehicleType = 'maintenance_vehicle';
      approachType = 'lasting_fix';
    } else if (isSocial) {
      personnelType = 'public_relations_team';
      vehicleType = 'route_support_vehicle';
      approachType = 'public_first';
    } else {
      approachType = 'rapid_response';
    }
  } else if (profile === 'weak_player') {
    approachType = rng() > 0.45 ? 'low_resource' : 'balanced_response';
    if (rng() > 0.55) {
      personnelType = 'public_relations_team';
      vehicleType = 'maintenance_vehicle';
    }
  } else if (profile === 'low_resource_player') {
    approachType = rng() > 0.25 ? 'low_resource' : 'balanced_response';
  } else if (profile === 'crisis_heavy_player') {
    approachType = rng() > 0.4 ? 'rapid_response' : 'low_resource';
    vehicleType = rng() > 0.45 ? 'high_capacity_vehicle' : 'maintenance_vehicle';
  } else if (profile === 'balanced_player') {
    approachType = 'balanced_response';
    personnelType = 'balanced_team';
    vehicleType = 'route_support_vehicle';
  } else if (profile === 'random_player') {
    const approaches: ResponseApproachType[] = [
      'balanced_response',
      'rapid_response',
      'lasting_fix',
      'low_resource',
      'public_first',
    ];
    approachType = approaches[Math.floor(rng() * approaches.length)]!;
  }

  const draft = { personnelType, vehicleType, approachType };
  const compat = calculateAssignmentCompatibility(input, event, draft);
  if (
    profile === 'strong_player' &&
    compat.label !== 'Güçlü uyum' &&
    isContainer &&
    rng() > 0.15
  ) {
    return {
      personnelType: 'technical_team',
      vehicleType: 'maintenance_vehicle',
      approachType: 'lasting_fix',
    };
  }
  if (profile === 'weak_player') {
    return {
      personnelType: isContainer ? 'public_relations_team' : 'public_relations_team',
      vehicleType: isContainer ? 'route_support_vehicle' : 'high_capacity_vehicle',
      approachType: 'low_resource',
    };
  }
  return draft;
}

export function chooseAssignmentForProfile(
  input: AssignmentEngineInput,
  event: EventCard,
  profile: FullSeasonPlayerProfile,
  rng: StrategyRng,
): {
  personnelType: PersonnelAssignmentType;
  vehicleType: VehicleAssignmentType;
  approachType: ResponseApproachType;
  compatibilityLabel: string;
} {
  const patch = pickAssignmentPatch(input, event, profile, rng);
  const compat = calculateAssignmentCompatibility(input, event, patch);
  return {
    ...patch,
    compatibilityLabel: getCompatibilityLabel(compat.score),
  };
}

function decisionBudgetCost(decision: EventDecision): number {
  return decision.costs?.budget ?? 0;
}

function scoreDecision(d: EventDecision): number {
  let score = 0;
  const e = d.effects;
  if (e.publicSatisfaction > 0) score += 2;
  if (e.morale > 0 || (e.staffMorale ?? 0) > 0) score += 1;
  if (e.risk < 0) score += 1;
  if (d.style === 'cautious') score += 1;
  if (d.style === 'risky') score -= 2;
  return score;
}

export function chooseEventDecisionOptionForProfile(
  event: EventCard,
  profile: FullSeasonPlayerProfile,
  budget: number,
  rng: StrategyRng,
): EventDecision | undefined {
  const affordable = event.decisions.filter((d) => decisionBudgetCost(d) <= budget);
  const pool = affordable.length > 0 ? affordable : event.decisions;
  if (pool.length === 0) return undefined;

  switch (profile) {
    case 'strong_player':
      if (rng() > 0.1) {
        return [...pool].sort((a, b) => scoreDecision(b) - scoreDecision(a))[0];
      }
      return pool.find((d) => d.style === 'cautious') ?? pool[0];
    case 'weak_player':
      return [...pool].sort((a, b) => scoreDecision(a) - scoreDecision(b))[0];
    case 'random_player':
      return pool[Math.floor(rng() * pool.length)];
    case 'low_resource_player': {
      const cheap = pool.filter((d) => decisionBudgetCost(d) <= budget * 0.15);
      return (cheap.length > 0 ? cheap : pool)[0];
    }
    default:
      return pool.find((d) => d.id.includes('balanced')) ?? pool[0];
  }
}

export function chooseMicroDecisionOptionForProfile(
  _gameState: GameState,
  decision: MicroDecision,
  profile: FullSeasonPlayerProfile,
  rng: StrategyRng,
): string | undefined {
  const options = decision.options;
  if (options.length === 0) return undefined;

  const positive = options.filter((o) => o.tone === 'positive');
  const neutral = options.filter((o) => o.tone === 'neutral');
  const warning = options.filter((o) => o.tone === 'warning');

  switch (profile) {
    case 'strong_player':
      return (positive[0] ?? neutral[0] ?? options[0])?.id;
    case 'weak_player': {
      const elevatedCrisis =
        _gameState.pilot.status === 'completed' &&
        (decision.type === 'crisis_threshold' || decision.type === 'advisor_warning');
      if (elevatedCrisis && rng() > 0.35) {
        return (
          warning.find((o) => o.id === 'monitor') ??
          warning.find((o) => o.id.includes('keep')) ??
          warning[0]
        )?.id;
      }
      return (warning.find((o) => o.id.includes('keep') || o.id.includes('monitor')) ??
        warning[0] ??
        neutral[0] ??
        options[0])?.id;
    }
    case 'low_resource_player':
      return (
        options.find((o) => o.id.includes('keep_plan') || o.id.includes('monitor')) ??
        neutral[0] ??
        options[0]
      )?.id;
    case 'crisis_heavy_player':
      return (rng() > 0.45 ? positive[0] : warning[0] ?? options[0])?.id;
    case 'random_player':
      return options[Math.floor(rng() * options.length)]?.id;
    default:
      return (neutral[0] ?? options[0])?.id;
  }
}

export function chooseCrisisActionForProfile(
  input: CrisisActionEngineInput,
  profile: FullSeasonPlayerProfile,
  rng: StrategyRng,
): CrisisActionType {
  const recommended = selectBestCrisisActionType(input);
  switch (profile) {
    case 'strong_player':
      return rng() > 0.25 ? recommended : 'preventive_maintenance';
    case 'weak_player':
      if (
        input.crisisState.activeIncident?.status === 'active' ||
        input.crisisState.activeIncident?.status === 'forming'
      ) {
        return rng() > 0.25 ? recommended : 'field_rebalance';
      }
      return rng() > 0.55 ? recommended : 'monitor_only';
    case 'crisis_heavy_player': {
      const incidentActive =
        input.crisisState.activeIncident?.status === 'active' ||
        input.crisisState.activeIncident?.status === 'forming';
      if (incidentActive) {
        const roll = rng();
        if (roll > 0.35) return recommended;
        if (roll > 0.18) return 'preventive_maintenance';
        if (roll > 0.06) return 'field_rebalance';
        return 'crisis_coordination';
      }
      if (input.crisisState.cityCrisisScore >= 50) {
        return rng() > 0.25 ? recommended : 'preventive_maintenance';
      }
      return rng() > 0.55 ? recommended : 'preventive_maintenance';
    }
    case 'random_player': {
      const types: CrisisActionType[] = [
        'preventive_maintenance',
        'public_briefing',
        'monitor_only',
        recommended,
      ];
      return types[Math.floor(rng() * types.length)]!;
    }
    case 'low_resource_player':
      if (input.crisisState.cityCrisisScore >= 48) {
        return rng() > 0.35 ? recommended : 'preventive_maintenance';
      }
      return rng() > 0.5 ? 'monitor_only' : 'preventive_maintenance';
    default:
      return recommended;
  }
}

export function createStrategyRng(seed: number): StrategyRng {
  return createSeededRandom(seed);
}
