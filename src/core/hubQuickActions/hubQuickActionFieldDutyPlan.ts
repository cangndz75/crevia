import type { ContainerState } from '@/core/containers/containerTypes';
import { selectWorstContainerNeighborhood } from '@/core/containers/containerSelectors';
import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import {
  COMPETENCY_LABELS_TR,
  inferPersonnelCompetencyForTask,
} from '@/core/personnel/personnelCompetency';
import { getTeamCompetencyScore } from '@/core/personnel/personnelCompetency';
import {
  canTeamTakeTaskDifficulty,
  getRecommendedPersonnelForTask,
} from '@/core/personnel/personnelEngine';
import type {
  PersonnelCompetencyKey,
  PersonnelRole,
  PersonnelState,
  PersonnelTeam,
} from '@/core/personnel/personnelTypes';
import { selectNeighborhoodSocialRisks } from '@/core/social/socialSelectors';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { eventSeverity } from '@/core/utils/eventPriority';

import type { FieldDutyAssignment } from './hubQuickActionTypes';

export type FieldDutyPlanContext = {
  personnelState: PersonnelState;
  activeEvents: EventCard[];
  neighborhoods: Neighborhood[];
  containerState?: ContainerState;
  socialPulseState?: SocialPulseState;
};

function competencyToPreferredRole(key: PersonnelCompetencyKey): PersonnelRole {
  switch (key) {
    case 'waste_collection':
    case 'market_cleanup':
      return 'cleaning';
    case 'route_operation':
      return 'driver';
    case 'container_maintenance':
      return 'maintenance';
    case 'complaint_response':
    case 'crisis_coordination':
    default:
      return 'field_supervisor';
  }
}

function defaultFieldDutyCompetency(day: number): PersonnelCompetencyKey {
  return day % 2 === 0 ? 'waste_collection' : 'complaint_response';
}

function resolveNeighborhoodId(
  rawId: string | undefined,
  districtName: string | undefined,
  neighborhoods: Neighborhood[],
): string | undefined {
  if (rawId) {
    const byId = neighborhoods.find((n) => n.id === rawId);
    if (byId) return byId.id;
  }
  if (districtName) {
    const byName = neighborhoods.find((n) => n.name === districtName);
    if (byName) return byName.id;
    if (neighborhoods.some((n) => n.id === districtName)) return districtName;
  }
  return rawId;
}

function pickPrimaryEvent(activeEvents: EventCard[]): EventCard | null {
  if (activeEvents.length === 0) return null;
  return [...activeEvents].sort(
    (a, b) => eventSeverity(b) - eventSeverity(a),
  )[0] ?? null;
}

function pickRiskiestNeighborhoodId(
  containerState: ContainerState | undefined,
  socialPulseState: SocialPulseState | undefined,
): string | null {
  const containerWorst = containerState
    ? selectWorstContainerNeighborhood(containerState)
    : null;
  const socialRisks = socialPulseState
    ? selectNeighborhoodSocialRisks(socialPulseState)
    : [];
  const socialWorst = socialRisks.at(-1) ?? null;

  if (
    containerWorst &&
    (containerWorst.criticalContainerCount > 0 ||
      containerWorst.worstOverflowRisk === 'critical')
  ) {
    return containerWorst.neighborhoodId;
  }
  if (
    socialWorst &&
    (socialWorst.riskLevel === 'critical' || socialWorst.riskLevel === 'high')
  ) {
    return socialWorst.neighborhoodId;
  }
  if (containerWorst) return containerWorst.neighborhoodId;
  if (socialWorst) return socialWorst.neighborhoodId;
  return null;
}

function fallbackNeighborhoodId(neighborhoods: Neighborhood[]): string {
  const merkez = neighborhoods.find((n) => n.id === 'merkez');
  return merkez?.id ?? neighborhoods[0]?.id ?? 'merkez';
}

export function resolveFieldDutyTarget(params: {
  currentDay: number;
  activeEvents: EventCard[];
  neighborhoods: Neighborhood[];
  containerState?: ContainerState;
  socialPulseState?: SocialPulseState;
}): {
  targetNeighborhoodId: string;
  targetCompetency: PersonnelCompetencyKey;
  neighborhoodLabel: string;
  competencyLabel: string;
} {
  const { currentDay, activeEvents, neighborhoods, containerState, socialPulseState } =
    params;
  const primaryEvent = pickPrimaryEvent(activeEvents);

  let targetNeighborhoodId: string | undefined;
  let targetCompetency: PersonnelCompetencyKey;

  if (primaryEvent) {
    targetNeighborhoodId = resolveNeighborhoodId(
      primaryEvent.neighborhoodId,
      primaryEvent.district,
      neighborhoods,
    );
    const previewDecision = primaryEvent.decisions[0];
    targetCompetency = inferPersonnelCompetencyForTask({
      event: primaryEvent,
      decision: previewDecision,
    });
  } else {
    targetNeighborhoodId =
      pickRiskiestNeighborhoodId(containerState, socialPulseState) ?? undefined;
    targetCompetency = defaultFieldDutyCompetency(currentDay);
  }

  if (!targetNeighborhoodId) {
    targetNeighborhoodId = fallbackNeighborhoodId(neighborhoods);
  }

  const neighborhood =
    neighborhoods.find((n) => n.id === targetNeighborhoodId) ??
    neighborhoods.find((n) => n.name === targetNeighborhoodId);

  return {
    targetNeighborhoodId,
    targetCompetency,
    neighborhoodLabel: neighborhood?.name ?? targetNeighborhoodId,
    competencyLabel: COMPETENCY_LABELS_TR[targetCompetency],
  };
}

export function selectFieldDutyTeam(
  personnelState: PersonnelState,
  target: {
    targetNeighborhoodId: string;
    targetCompetency: PersonnelCompetencyKey;
  },
): PersonnelTeam | null {
  const preferredRole = competencyToPreferredRole(target.targetCompetency);
  const recommended = getRecommendedPersonnelForTask(
    {
      ...personnelState,
      teams: personnelState.teams.filter((t) => t.restMode !== 'full_rest'),
    },
    {
      preferredRole,
      districtId: target.targetNeighborhoodId,
      difficulty: 'light',
    },
  );

  const candidates = personnelState.teams.filter((t) => t.restMode !== 'full_rest');
  if (candidates.length === 0) return null;

  const pool = candidates.filter((t) => t.restMode !== 'light_duty');
  const scoredPool = pool.length > 0 ? pool : candidates;

  const scored = scoredPool
    .map((team) => {
      const competency = getTeamCompetencyScore(team, target.targetCompetency);
      const familiarity = team.districtFamiliarity[target.targetNeighborhoodId] ?? 0;
      const roleScore = team.role === preferredRole ? 14 : 0;
      const fatiguePenalty = team.fatigue * 0.25;
      const lightPenalty = team.restMode === 'light_duty' ? 12 : 0;
      const canTake = canTeamTakeTaskDifficulty(team, 'normal') ? 4 : 0;
      const score =
        competency * 0.55 +
        familiarity * 0.2 +
        roleScore +
        canTake +
        team.morale * 0.08 -
        fatiguePenalty -
        lightPenalty;
      return { team, score };
    })
    .sort((a, b) => b.score - a.score);

  const bestScored = scored[0]?.team ?? null;
  if (recommended && bestScored) {
    const recommendedScore =
      getTeamCompetencyScore(recommended, target.targetCompetency) +
      (recommended.restMode === 'light_duty' ? -12 : 0);
    const bestScore =
      getTeamCompetencyScore(bestScored, target.targetCompetency) +
      (bestScored.restMode === 'light_duty' ? -12 : 0);
    return recommendedScore >= bestScore ? recommended : bestScored;
  }
  return recommended ?? bestScored;
}

export function buildFieldDutyAssignment(
  context: FieldDutyPlanContext,
  currentDay: number,
): FieldDutyAssignment | null {
  const target = resolveFieldDutyTarget({
    currentDay,
    activeEvents: context.activeEvents,
    neighborhoods: context.neighborhoods,
    containerState: context.containerState,
    socialPulseState: context.socialPulseState,
  });

  const team = selectFieldDutyTeam(context.personnelState, {
    targetNeighborhoodId: target.targetNeighborhoodId,
    targetCompetency: target.targetCompetency,
  });

  if (!team) return null;

  const competencyShort = target.competencyLabel.toLowerCase();
  const label = `${team.name} — ${target.neighborhoodLabel}`;
  const effectLabel = `${target.neighborhoodLabel} ${competencyShort} görevleri`;

  return {
    day: currentDay,
    teamId: team.id,
    targetNeighborhoodId: target.targetNeighborhoodId,
    targetCompetency: target.targetCompetency,
    label,
    effectLabel,
  };
}

export function buildFieldDutyResultLines(assignment: FieldDutyAssignment): {
  resultLine: string;
  detailLine: string;
} {
  const teamName = assignment.label.split(' — ')[0] ?? assignment.label;
  return {
    resultLine: `Saha Nöbeti kuruldu: ${teamName} bugün ${assignment.effectLabel} için hazır.`,
    detailLine:
      'Eşleşen saha kararlarında küçük başarı bonusu ve daha düşük aksaklık riski sağlar.',
  };
}
