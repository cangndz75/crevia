import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { MISTAKE_RISK } from '@/core/personnel/personnelConstants';
import { inferPersonnelCompetencyForTask } from '@/core/personnel/personnelCompetency';
import { clamp } from '@/core/personnel/personnelEngine';
import type { PersonnelCompetencyKey } from '@/core/personnel/personnelTypes';

import {
  FIELD_DUTY_RISK_REDUCTION,
  FIELD_DUTY_SUCCESS_BONUS,
} from './hubQuickActionConstants';
import type { FieldDutyAssignment } from './hubQuickActionTypes';

export type FieldDutyPersonnelModifier = {
  applies: boolean;
  successBonus: number;
  riskReduction: number;
  line?: string;
};

function normalizeDistrictToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase();
}

function neighborhoodsMatch(
  eventNeighborhoodId: string | undefined,
  eventDistrict: string | undefined,
  fieldNeighborhoodId: string,
): boolean {
  const field = normalizeDistrictToken(fieldNeighborhoodId);
  if (!field) return false;
  const eventId = normalizeDistrictToken(eventNeighborhoodId);
  if (eventId && eventId === field) return true;
  const district = normalizeDistrictToken(eventDistrict);
  if (district && district === field) return true;
  return false;
}

export function resolveFieldDutyPersonnelModifier(params: {
  fieldDuty?: FieldDutyAssignment;
  currentDay: number;
  event: EventCard;
  decision: EventDecision;
  assignedTeamId?: string;
  assignedTeamName?: string;
}): FieldDutyPersonnelModifier {
  const none: FieldDutyPersonnelModifier = {
    applies: false,
    successBonus: 0,
    riskReduction: 0,
  };

  const { fieldDuty, currentDay, event, decision, assignedTeamId, assignedTeamName } =
    params;
  if (!fieldDuty || fieldDuty.day !== currentDay) {
    return none;
  }

  const decisionCompetency = inferPersonnelCompetencyForTask({ event, decision });
  const competencyMatch = fieldDuty.targetCompetency === decisionCompetency;
  const neighborhoodMatch = neighborhoodsMatch(
    event.neighborhoodId,
    event.district,
    fieldDuty.targetNeighborhoodId,
  );

  if (!competencyMatch && !neighborhoodMatch) {
    return none;
  }

  const teamName =
    assignedTeamName ??
    (assignedTeamId && assignedTeamId === fieldDuty.teamId ? fieldDuty.label.split(' — ')[0] : null) ??
    fieldDuty.label.split(' — ')[0] ??
    'Saha ekibi';

  const competencyLabel = competencyMatch
    ? formatCompetencyShort(fieldDuty.targetCompetency)
    : 'bu görev tipine';

  return {
    applies: true,
    successBonus: FIELD_DUTY_SUCCESS_BONUS,
    riskReduction: FIELD_DUTY_RISK_REDUCTION,
    line: `Saha nöbeti: ${teamName} ${competencyLabel} hazır.`,
  };
}

function formatCompetencyShort(key: PersonnelCompetencyKey): string {
  switch (key) {
    case 'waste_collection':
      return 'atık görevlerine';
    case 'market_cleanup':
      return 'temizlik görevlerine';
    case 'container_maintenance':
      return 'konteyner görevlerine';
    case 'complaint_response':
      return 'şikayet yanıtına';
    case 'crisis_coordination':
      return 'kriz koordinasyonuna';
    case 'route_operation':
      return 'rota görevlerine';
    default:
      return 'bu görev tipine';
  }
}

export function applyFieldDutyScoreModifiers(
  successScore: number,
  mistakeRisk: number,
  modifier: FieldDutyPersonnelModifier,
): { successScore: number; mistakeRisk: number } {
  if (!modifier.applies) {
    return { successScore, mistakeRisk };
  }
  return {
    successScore: clamp(successScore + modifier.successBonus, 0, 100),
    mistakeRisk: clamp(
      mistakeRisk - modifier.riskReduction,
      MISTAKE_RISK.min,
      MISTAKE_RISK.max,
    ),
  };
}
