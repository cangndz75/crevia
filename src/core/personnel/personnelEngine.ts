import type {
  EventCard,
  EventDecision,
  EventRiskLevel,
} from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';

import {
  CONSECUTIVE_HEAVY_DAY_FATIGUE_THRESHOLD,
  CONSECUTIVE_HEAVY_DAY_PENALTY,
  CONTROLLED_RANDOM,
  EVENT_TYPE_ROLE_HINTS,
  FAMILIARITY_TIERS,
  MAX_FATIGUE_GAIN_PER_TASK,
  MAX_MORALE_DROP_PER_DAY,
  MAX_MORALE_GAIN_PER_DAY,
  MORALE_EFFICIENCY,
  MORALE_MORNING_DELTA,
  NIGHT_RECOVERY_BY_FATIGUE,
  OVERTIME_CARRY_PENALTY,
  PERSONNEL_MAX,
  PERSONNEL_MIN,
  FULL_REST_NIGHT_RECOVERY_BONUS,
  LIGHT_DUTY_FATIGUE_MULTIPLIER,
  LIGHT_DUTY_HEAVY_SUCCESS_PENALTY,
  MISTAKE_RISK,
  REST_EFFECTS,
  RISK_TO_TASK_DIFFICULTY,
  ROLE_TASK_TAGS,
  ROUTINE_BURNOUT,
  SUCCESS_THRESHOLDS,
  TASK_FATIGUE_BASE,
} from './personnelConstants';
import {
  getCompetencyScoreModifier,
  getTeamCompetencyScore,
  inferPersonnelCompetencyForTask,
} from './personnelCompetency';
import {
  applyIncidentToTaskOutcome,
  calculatePersonnelMistakeRisk,
  resolveMistakeRiskLevel,
  tryGenerateOperationalIncident,
} from './personnelMistakeRisk';
import type { PersonnelMistakeDayContext } from './personnelMistakeRisk';
import type {
  PersonnelDayAssignment,
  PersonnelDayReport,
  PersonnelRole,
  PersonnelState,
  PersonnelTaskInput,
  PersonnelTaskResult,
  PersonnelTeam,
  PersonnelTeamStatus,
  PersonnelWarningTag,
  PersonnelRestMode,
  RestActionType,
  TaskDifficulty,
  TaskOutcome,
} from './personnelTypes';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function clamp(
  value: number,
  min = PERSONNEL_MIN,
  max = PERSONNEL_MAX,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function hashSeed(parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return Math.abs(h);
}

function seededRange(
  seed: number,
  min: number,
  max: number,
): number {
  const normalized = (seed % 10_000) / 10_000;
  return min + normalized * (max - min);
}

function pickRange(
  min: number,
  max: number,
  seedParts: (string | number)[],
): number {
  return Math.round(seededRange(hashSeed(seedParts), min, max));
}

function getMoraleTier(morale: number) {
  if (morale >= MORALE_EFFICIENCY.high.min) return MORALE_EFFICIENCY.high;
  if (morale >= MORALE_EFFICIENCY.normal.min) return MORALE_EFFICIENCY.normal;
  if (morale >= MORALE_EFFICIENCY.low.min) return MORALE_EFFICIENCY.low;
  if (morale >= MORALE_EFFICIENCY.critical.min) return MORALE_EFFICIENCY.critical;
  return MORALE_EFFICIENCY.broken;
}

function getFamiliarityTier(familiarity: number) {
  return (
    FAMILIARITY_TIERS.find(
      (t) => familiarity >= t.min && familiarity <= t.max,
    ) ?? FAMILIARITY_TIERS[0]
  );
}

export function isHeavyTaskDifficulty(difficulty: TaskDifficulty): boolean {
  return difficulty === 'hard' || difficulty === 'crisis';
}

export function isTeamOnFullRest(team: PersonnelTeam): boolean {
  return team.restMode === 'full_rest';
}

export function isTeamOnLightDuty(team: PersonnelTeam): boolean {
  return team.restMode === 'light_duty';
}

export function canTeamTakeTaskDifficulty(
  team: PersonnelTeam,
  difficulty: TaskDifficulty,
): boolean {
  if (team.restMode === 'full_rest') return false;
  if (team.restMode === 'light_duty' && isHeavyTaskDifficulty(difficulty)) {
    return false;
  }
  return true;
}

export function countFieldAssignableTeams(
  state: PersonnelState,
  difficulty: TaskDifficulty,
): number {
  return state.teams.filter((t) => canTeamTakeTaskDifficulty(t, difficulty)).length;
}

function effectiveVehiclePenalty(
  penalty: number,
  equipmentSupportActive: boolean,
): number {
  if (!equipmentSupportActive) return penalty;
  return Math.max(
    0,
    penalty - REST_EFFECTS.equipment_support.vehiclePenaltyReduction,
  );
}

function isHeavyDay(fatigueGain: number, difficulty: TaskDifficulty): boolean {
  return (
    fatigueGain >= 20 ||
    difficulty === 'hard' ||
    difficulty === 'crisis'
  );
}

// ---------------------------------------------------------------------------
// Status & warnings
// ---------------------------------------------------------------------------

export function getPersonnelStatus(
  fatigue: number,
  assigned: boolean,
  resting: boolean,
): PersonnelTeamStatus {
  if (resting) return 'resting';
  if (assigned) {
    if (fatigue >= 86) return 'exhausted';
    if (fatigue >= 71) return 'risky';
    if (fatigue >= 51) return 'tired';
    return 'assigned';
  }
  if (fatigue >= 86) return 'exhausted';
  if (fatigue >= 71) return 'risky';
  if (fatigue >= 51) return 'tired';
  if (fatigue >= 26) return 'idle';
  return 'idle';
}

export function getPersonnelWarnings(
  team: PersonnelTeam,
  districtName?: string,
): PersonnelWarningTag[] {
  const tags: PersonnelWarningTag[] = [...team.warningTags];

  if (team.overtimeHours >= 8) tags.push('overtime_yesterday');
  if (team.fatigue >= 71) tags.push('risky_fatigue');
  if (team.morale < 40) tags.push('low_morale');
  if (team.fatigue >= 86) tags.push('exhausted_warning');
  if (team.fatigue >= 51 && team.fatigue < 71) tags.push('light_task_recommended');
  if (team.fatigue >= 71 || team.morale < 40) tags.push('rest_recommended');
  if (team.consecutiveHeavyDays >= 2) tags.push('consecutive_heavy');
  if (team.consecutiveDistrictDays >= ROUTINE_BURNOUT.consecutiveDistrictDays) {
    tags.push('routine_burnout');
  }

  const topFamiliarity = Object.entries(team.districtFamiliarity).sort(
    (a, b) => b[1] - a[1],
  )[0];
  if (topFamiliarity && topFamiliarity[1] >= 61 && districtName) {
    tags.push('district_expert');
  }

  return [...new Set(tags)];
}

// ---------------------------------------------------------------------------
// Task inference from events
// ---------------------------------------------------------------------------

export function inferTaskDifficulty(riskLevel: EventRiskLevel): TaskDifficulty {
  return RISK_TO_TASK_DIFFICULTY[riskLevel] ?? 'normal';
}

export function buildPersonnelRoleHaystack(
  event: EventCard,
  decision?: EventDecision,
): string {
  const parts = [
    event.category,
    event.title,
    event.description,
    event.contextTag ?? '',
    event.eventType ?? '',
  ];
  if (decision) {
    parts.push(decision.title, decision.description);
  }
  return parts.join(' ').toLowerCase();
}

export function inferRoleFromHaystack(haystack: string): PersonnelRole {
  const isOverflowCollection =
    /konteyner taşması|taşan konteyner|konteyner taştı/.test(haystack) &&
    !/arıza|tamir|konteyner bakım|kapak arız/.test(haystack);

  if (isOverflowCollection) {
    return 'cleaning';
  }

  if (
    /konteyner bakım|konteyner arıza|kapak arız|filo bakım|araç bakım|teker kırık|teker arız/.test(
      haystack,
    ) ||
    (/arıza|tamir|kırık/.test(haystack) &&
      !/şikayet|muhtar|sosyal medya|kriz/.test(haystack))
  ) {
    return 'maintenance';
  }

  if (
    /araçlı toplama|güzergah|dar sokak/.test(haystack) ||
    (/rota|sürücü|trafik/.test(haystack) &&
      !/şikayet|muhtar|personel görüşmesi/.test(haystack))
  ) {
    return 'driver';
  }

  if (
    /şikayet|muhtar|vatandaş|mahalle sakini|sosyal medya|toplu tepki|kriz/.test(
      haystack,
    ) ||
    /rapor|sunum|üst yönetim|değerlendirme raporu/.test(haystack) ||
    (/iletişim|bilgilendirme|koordinasyon/.test(haystack) &&
      /muhtar|vatandaş|şikayet|kriz|sosyal/.test(haystack))
  ) {
    return 'field_supervisor';
  }

  if (
    /çöp|atık|toplam|temizlik|temizle|pazar|park|kirlilik|doluluk|mıntıka|saha müdahale/.test(
      haystack,
    )
  ) {
    return 'cleaning';
  }

  return 'cleaning';
}

function inferRoleFromContextualEventType(
  eventType: string,
  haystack: string,
): PersonnelRole | null {
  switch (eventType) {
    case 'citizen_complaint':
      if (
        /temizlik|çöp|toplam|pazar|saha müdahale|müdahale ekibi/.test(haystack) &&
        !/muhtar.*koordinasyon|şikayet koordinasyonu/.test(haystack)
      ) {
        return 'cleaning';
      }
      return 'field_supervisor';
    case 'social_media':
      if (/temizlik|çöp|toplam|saha müdahale|müdahale ekibi|pazar temiz/.test(haystack)) {
        return 'cleaning';
      }
      return 'field_supervisor';
    case 'staff':
      if (
        /fazla mesai|yorgunluk|vardiya|rota baskı|ekip temposu|saha yükü|personelde|dinlendirme/.test(
          haystack,
        ) &&
        !/personel görüşmesi|iletişim planı/.test(haystack)
      ) {
        return 'cleaning';
      }
      if (/iletişim|koordinasyon|görüşme|personel görüşmesi|muhtar/.test(haystack)) {
        return 'field_supervisor';
      }
      return inferRoleFromHaystack(haystack);
    case 'butterfly':
      if (/şikayet|kriz|sosyal|muhtar|gergin|toplu tepki/.test(haystack)) {
        return 'field_supervisor';
      }
      return inferRoleFromHaystack(haystack);
    case 'opportunity':
      if (
        /iletişim|eğitim|motivasyon|briefing|personel görüşmesi/.test(haystack) &&
        !/temizlik|toplam|çöp|rota|araç/.test(haystack)
      ) {
        return 'field_supervisor';
      }
      return 'cleaning';
    case 'permanent_solution':
      return inferRoleFromHaystack(haystack);
    case 'final':
      if (/rapor|sunum|iletişim|üst yönetim|değerlendirme/.test(haystack)) {
        return 'field_supervisor';
      }
      return inferRoleFromHaystack(haystack);
    default:
      return null;
  }
}

export function inferPreferredRole(
  event: EventCard,
  decision?: EventDecision,
): PersonnelRole {
  const haystack = buildPersonnelRoleHaystack(event, decision);

  if (event.eventType) {
    const contextual = inferRoleFromContextualEventType(event.eventType, haystack);
    if (contextual != null) {
      return contextual;
    }
    const direct = EVENT_TYPE_ROLE_HINTS[event.eventType];
    if (direct) {
      return direct;
    }
  }

  return inferRoleFromHaystack(haystack);
}

export function scoreRoleMatch(
  teamRole: PersonnelRole,
  preferredRole: PersonnelRole,
  event: EventCard,
): number {
  if (teamRole === preferredRole) return 1;
  const haystack = `${event.category} ${event.title}`.toLowerCase();
  const teamTags = ROLE_TASK_TAGS[teamRole];
  const matchCount = teamTags.filter((t) => haystack.includes(t)).length;
  return matchCount > 0 ? 0.55 : 0.25;
}

export function resolveDistrictDifficulty(
  neighborhood: Neighborhood | undefined,
): number {
  if (!neighborhood) return 1;
  const neglect = neighborhood.longTermNeglect / 100;
  const trustPenalty = (100 - neighborhood.trust) / 200;
  return clamp(0.85 + neglect * 0.35 + trustPenalty, 0.85, 1.45);
}

export function resolveVehiclePenalty(resources: GameResources): number {
  if (resources.availableVehicles <= 2) return 8;
  if (resources.availableVehicles <= 4) return 4;
  return 0;
}

export function buildPersonnelTaskInput(params: {
  team: PersonnelTeam;
  event: EventCard;
  decision: EventDecision;
  neighborhood?: Neighborhood;
  resources: GameResources;
  equipmentSupportActive: boolean;
  day: number;
}): PersonnelTaskInput {
  const { team, event, decision, neighborhood, resources, equipmentSupportActive, day } =
    params;
  const preferredRole = inferPreferredRole(event, decision);
  const staffHours = decision.costs?.staffHours ?? 0;
  const workedHours = clamp(
    Math.max(6, Math.min(12, event.urgencyHours || 8)) + staffHours * 0.25,
    4,
    14,
  );
  const overtimeHours = Math.max(0, workedHours - 8);

  const requiredCompetency = inferPersonnelCompetencyForTask({
    team,
    event,
    decision,
  });
  const competencyScore = getTeamCompetencyScore(team, requiredCompetency);

  return {
    team,
    difficulty: inferTaskDifficulty(event.riskLevel),
    districtId: event.neighborhoodId ?? event.district,
    districtDifficulty: resolveDistrictDifficulty(neighborhood),
    workedHours,
    overtimeHours,
    vehicleConditionPenalty: resolveVehiclePenalty(resources),
    weatherPenalty: 0,
    roleMatchScore: scoreRoleMatch(team.role, preferredRole, event),
    equipmentSupportActive,
    day,
    requiredCompetency,
    competencyScore,
  };
}

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

export function calculateTaskFatigueGain(input: PersonnelTaskInput): number {
  const { team, difficulty, districtDifficulty } = input;
  const baseRange = TASK_FATIGUE_BASE[difficulty];
  const baseTaskFatigue = pickRange(baseRange.min, baseRange.max, [
    team.id,
    input.day,
    difficulty,
    'fatigue-base',
  ]);

  const moraleTier = getMoraleTier(team.morale);
  const familiarity = team.districtFamiliarity[input.districtId] ?? 0;
  const familiarityTier = getFamiliarityTier(familiarity);

  const districtMultiplier = districtDifficulty;
  const moraleMultiplier = moraleTier.fatigueMultiplier;
  const familiarityMultiplier = familiarityTier.fatigueMultiplier;

  const rolePenalty =
    input.roleMatchScore >= 0.9 ? 0 : input.roleMatchScore >= 0.5 ? 4 : 10;

  const overtimePenalty =
    input.overtimeHours >= 2 ? 6 + input.overtimeHours : input.overtimeHours > 0 ? 3 : 0;

  const vehiclePenalty = effectiveVehiclePenalty(
    input.vehicleConditionPenalty,
    input.equipmentSupportActive,
  );
  const consecutiveHeavyPenalty =
    team.consecutiveHeavyDays >= 2 ? CONSECUTIVE_HEAVY_DAY_PENALTY : 0;

  const workloadPenalty =
    team.todayWorkedHours > 0 ? Math.min(6, team.todayWorkedHours * 0.5) : 0;

  let equipmentReduction = 0;
  if (input.equipmentSupportActive) {
    equipmentReduction = REST_EFFECTS.equipment_support.nextTaskFatigueReduction;
  }

  const sentExhaustedPenalty = team.fatigue >= 86 ? 6 : team.fatigue >= 71 ? 3 : 0;

  let raw =
    baseTaskFatigue * districtMultiplier * moraleMultiplier * familiarityMultiplier +
    overtimePenalty +
    vehiclePenalty +
    consecutiveHeavyPenalty +
    rolePenalty +
    workloadPenalty +
    sentExhaustedPenalty -
    equipmentReduction;

  if (team.restMode === 'light_duty') {
    raw *= LIGHT_DUTY_FATIGUE_MULTIPLIER;
  }

  return clamp(Math.round(raw), 0, MAX_FATIGUE_GAIN_PER_TASK);
}

export function calculateTaskSuccessScore(input: PersonnelTaskInput): number {
  const { team } = input;
  const moraleTier = getMoraleTier(team.morale);
  const familiarity = team.districtFamiliarity[input.districtId] ?? 0;
  const familiarityTier = getFamiliarityTier(familiarity);

  const baseTaskScore = 62 + team.experience * 0.12;
  const roleMatchBonus = (input.roleMatchScore - 0.5) * 24;
  const moraleBonus = (team.morale - 50) * 0.35 + moraleTier.efficiencyBonus * 100;
  const familiarityBonus = familiarityTier.durationBonus * 100 + familiarity * 0.08;

  const fatiguePenalty =
    team.fatigue >= 86
      ? 28
      : team.fatigue >= 71
        ? 18
        : team.fatigue >= 51
          ? 8
          : 0;

  const vehiclePenalty =
    effectiveVehiclePenalty(
      input.vehicleConditionPenalty,
      input.equipmentSupportActive,
    ) * 0.6;
  const districtDifficultyPenalty = (input.districtDifficulty - 1) * 40;
  const lightDutyHeavyPenalty =
    team.restMode === 'light_duty' && isHeavyTaskDifficulty(input.difficulty)
      ? LIGHT_DUTY_HEAVY_SUCCESS_PENALTY
      : 0;

  const highMoraleLuck =
    team.morale >= 75 &&
    hashSeed([team.id, input.day, 'morale-bonus']) % 100 <
      CONTROLLED_RANDOM.highMoraleBonusChance * 100
      ? pickRange(4, 10, [team.id, input.day, 'luck'])
      : 0;

  const glitchChance =
    team.fatigue >= 71
      ? CONTROLLED_RANDOM.highFatigueGlitchChance
      : CONTROLLED_RANDOM.operationalGlitchChance;

  const glitchPenalty =
    hashSeed([team.id, input.day, 'glitch']) % 100 < glitchChance * 100
      ? pickRange(5, 12, [team.id, input.day, 'glitch-penalty'])
      : 0;

  const competencyValue =
    input.competencyScore ??
    (input.requiredCompetency
      ? getTeamCompetencyScore(team, input.requiredCompetency)
      : 50);
  const competencyBonus = getCompetencyScoreModifier(competencyValue);

  const score =
    baseTaskScore +
    roleMatchBonus +
    moraleBonus +
    familiarityBonus +
    competencyBonus -
    fatiguePenalty -
    vehiclePenalty -
    districtDifficultyPenalty -
    glitchPenalty -
    lightDutyHeavyPenalty +
    highMoraleLuck;

  return clamp(Math.round(score), 0, 100);
}

function resolveOutcome(successScore: number): TaskOutcome {
  if (successScore >= SUCCESS_THRESHOLDS.success) return 'success';
  if (successScore >= SUCCESS_THRESHOLDS.partial) return 'partial';
  if (successScore >= SUCCESS_THRESHOLDS.weak) return 'weak';
  return 'failed';
}

function moraleDeltaForOutcome(
  outcome: TaskOutcome,
  input: PersonnelTaskInput,
): number {
  const exhaustedPenalty =
    input.team.fatigue >= 86 && input.team.sentExhaustedLastTask === false ? -6 : 0;

  switch (outcome) {
    case 'success':
      return pickRange(2, 4, [input.team.id, input.day, 'morale-ok']) + exhaustedPenalty;
    case 'partial':
      return 1 + exhaustedPenalty;
    case 'weak':
      return pickRange(-3, -1, [input.team.id, input.day, 'morale-weak']);
    case 'failed':
      return pickRange(-8, -4, [input.team.id, input.day, 'morale-fail']);
    default:
      return 0;
  }
}

export function applyMoraleDeltaWithDailyCap(
  team: PersonnelTeam,
  delta: number,
): number {
  const remainingUp = MAX_MORALE_GAIN_PER_DAY - Math.max(0, team.moraleDeltaToday);
  const remainingDown =
    MAX_MORALE_DROP_PER_DAY - Math.max(0, -team.moraleDeltaToday);

  let applied = delta;
  if (delta > 0) applied = Math.min(delta, remainingUp);
  if (delta < 0) applied = -Math.min(Math.abs(delta), remainingDown);
  return applied;
}

export function updateDistrictFamiliarity(
  team: PersonnelTeam,
  districtId: string,
  outcome: TaskOutcome,
): Record<string, number> {
  const current = team.districtFamiliarity[districtId] ?? 0;
  const gain =
    outcome === 'success' ? 6 : outcome === 'partial' ? 4 : outcome === 'weak' ? 2 : 0;
  return {
    ...team.districtFamiliarity,
    [districtId]: clamp(current + gain, PERSONNEL_MIN, PERSONNEL_MAX),
  };
}

export function calculateTaskSuccessScoreFromInput(
  input: PersonnelTaskInput,
): number {
  return calculateTaskSuccessScore(input);
}

export type PersonnelTaskScoreModifiers = {
  successBonus: number;
  riskReduction: number;
};

export function applyPersonnelTaskResult(
  team: PersonnelTeam,
  input: PersonnelTaskInput,
  taskMeta: { eventId: string; decisionId: string },
  mistakeContext?: PersonnelMistakeDayContext,
  scoreModifiers?: PersonnelTaskScoreModifiers,
): { team: PersonnelTeam; result: PersonnelTaskResult } {
  const fatigueGain = calculateTaskFatigueGain(input);
  let successScore = calculateTaskSuccessScore(input);
  if (scoreModifiers?.successBonus) {
    successScore = clamp(successScore + scoreModifiers.successBonus, 0, 100);
  }
  let mistakeRisk = calculatePersonnelMistakeRisk(input, successScore);
  if (scoreModifiers?.riskReduction) {
    mistakeRisk = clamp(
      mistakeRisk - scoreModifiers.riskReduction,
      MISTAKE_RISK.min,
      MISTAKE_RISK.max,
    );
  }
  const mistakeRiskLevel = resolveMistakeRiskLevel(mistakeRisk);

  let operationalIncident =
    mistakeContext != null
      ? tryGenerateOperationalIncident({
          input,
          taskSuccessScore: successScore,
          mistakeRisk,
          mistakeRiskLevel,
          context: mistakeContext,
          taskMeta,
        })
      : null;

  let outcome = resolveOutcome(successScore);
  let moraleDelta = moraleDeltaForOutcome(outcome, input);

  if (operationalIncident) {
    const adjusted = applyIncidentToTaskOutcome({
      successScore,
      moraleDelta,
      incident: operationalIncident,
    });
    successScore = adjusted.successScore;
    moraleDelta = adjusted.moraleDelta;
    outcome = resolveOutcome(successScore);
  }

  if (input.overtimeHours >= 2) {
    moraleDelta -= pickRange(4, 6, [team.id, input.day, 'overtime-morale']);
  }
  if (team.consecutiveHeavyDays >= 2) {
    moraleDelta -= 2;
  }
  if (
    team.consecutiveDistrictDays >= ROUTINE_BURNOUT.consecutiveDistrictDays - 1 &&
    team.lastDistrictId === input.districtId
  ) {
    moraleDelta -= ROUTINE_BURNOUT.moralePenalty;
  }

  const dailySwing = pickRange(
    CONTROLLED_RANDOM.dailyMoraleSwing.min,
    CONTROLLED_RANDOM.dailyMoraleSwing.max,
    [team.id, input.day, 'swing'],
  );
  moraleDelta += dailySwing;

  const appliedMoraleDelta = applyMoraleDeltaWithDailyCap(team, moraleDelta);

  const newFatigue = clamp(team.fatigue + fatigueGain);
  const newMorale = clamp(team.morale + appliedMoraleDelta);
  const experienceGain =
    outcome === 'success' ? 3 : outcome === 'partial' ? 2 : outcome === 'weak' ? 1 : 0;

  const consecutiveDistrictDays =
    team.lastDistrictId === input.districtId
      ? team.consecutiveDistrictDays + 1
      : 1;

  let routineFatigue = 0;
  if (consecutiveDistrictDays >= ROUTINE_BURNOUT.consecutiveDistrictDays && isHeavyDay(fatigueGain, input.difficulty)) {
    routineFatigue = ROUTINE_BURNOUT.fatiguePenalty;
  }

  const heavyDay = isHeavyDay(fatigueGain + routineFatigue, input.difficulty);
  const consecutiveHeavyDays = heavyDay ? team.consecutiveHeavyDays + 1 : 0;
  const consecutiveOvertimeDays =
    input.overtimeHours >= 2 ? team.consecutiveOvertimeDays + 1 : 0;

  const updatedTeam: PersonnelTeam = {
    ...team,
    fatigue: clamp(newFatigue + routineFatigue),
    morale: newMorale,
    moraleDeltaToday: team.moraleDeltaToday + appliedMoraleDelta,
    experience: clamp(team.experience + experienceGain),
    efficiency: clamp(
      team.efficiency +
        (outcome === 'success' ? 1 : outcome === 'failed' ? -2 : 0) +
        getMoraleTier(newMorale).efficiencyBonus * 10,
    ),
    currentDistrictId: input.districtId,
    assignedTaskId: taskMeta.eventId,
    todayWorkedHours: team.todayWorkedHours + input.workedHours,
    overtimeHours: team.overtimeHours + input.overtimeHours,
    consecutiveHeavyDays,
    consecutiveOvertimeDays,
    consecutiveDistrictDays,
    lastDistrictId: input.districtId,
    districtFamiliarity: updateDistrictFamiliarity(team, input.districtId, outcome),
    completedTasks:
      outcome === 'success' || outcome === 'partial'
        ? team.completedTasks + 1
        : team.completedTasks,
    failedTasks: outcome === 'failed' ? team.failedTasks + 1 : team.failedTasks,
    sentExhaustedLastTask: team.fatigue >= 86,
    status: getPersonnelStatus(
      clamp(newFatigue + routineFatigue),
      true,
      false,
    ),
    warningTags: [],
  };

  updatedTeam.warningTags = getPersonnelWarnings(updatedTeam);

  const result: PersonnelTaskResult = {
    fatigueGain: fatigueGain + routineFatigue,
    moraleDelta: appliedMoraleDelta,
    successScore,
    outcome,
    familiarityGain:
      (updatedTeam.districtFamiliarity[input.districtId] ?? 0) -
      (team.districtFamiliarity[input.districtId] ?? 0),
    experienceGain,
    failedTask: outcome === 'failed',
    operationalIncidentRisk:
      operationalIncident != null ||
      outcome === 'failed' ||
      (team.fatigue >= 86 && outcome === 'weak'),
    mistakeRisk,
    mistakeRiskLevel,
    operationalIncident,
  };

  return { team: updatedTeam, result };
}

// ---------------------------------------------------------------------------
// Night recovery & end of day
// ---------------------------------------------------------------------------

export function calculateNightRecovery(
  endDayFatigue: number,
  overtimeHours: number,
  consecutiveOvertimeDays: number,
  consecutiveHeavyDays: number,
  seedParts: (string | number)[],
): { recovery: number; carryPenalty: number } {
  const band =
    NIGHT_RECOVERY_BY_FATIGUE.find(
      (b) => endDayFatigue >= b.min && endDayFatigue <= b.max,
    ) ?? NIGHT_RECOVERY_BY_FATIGUE[NIGHT_RECOVERY_BY_FATIGUE.length - 1];

  const recovery = pickRange(
    band.recoveryMin,
    band.recoveryMax,
    [...seedParts, 'recovery'],
  );

  let carryPenalty = 0;
  if (overtimeHours >= 10) carryPenalty += OVERTIME_CARRY_PENALTY.hours10plus;
  else if (overtimeHours >= 8) carryPenalty += OVERTIME_CARRY_PENALTY.hours8to10;

  if (consecutiveOvertimeDays >= 2) {
    carryPenalty += OVERTIME_CARRY_PENALTY.consecutiveOvertimeDays;
  }

  if (consecutiveHeavyDays >= 2) {
    carryPenalty += CONSECUTIVE_HEAVY_DAY_PENALTY;
  }

  return { recovery, carryPenalty };
}

function morningMoraleDeltaForTeam(
  team: PersonnelTeam,
  dayAssignments: PersonnelDayAssignment[],
  restedToday: boolean,
): number {
  const today = dayAssignments.filter((a) => a.teamId === team.id);
  const hadSuccess = today.some((a) => a.outcome === 'success' || a.outcome === 'partial');
  const hadFail = today.some((a) => a.outcome === 'failed');

  let delta = pickRange(
    MORALE_MORNING_DELTA.normal.min,
    MORALE_MORNING_DELTA.normal.max,
    [team.id, 'morning-normal'],
  );

  if (restedToday) {
    delta += pickRange(
      MORALE_MORNING_DELTA.rest.min,
      MORALE_MORNING_DELTA.rest.max,
      [team.id, 'morning-rest'],
    );
  } else if (hadSuccess) {
    delta += pickRange(
      MORALE_MORNING_DELTA.success.min,
      MORALE_MORNING_DELTA.success.max,
      [team.id, 'morning-success'],
    );
  }

  if (team.overtimeHours >= 10) {
    delta += pickRange(
      MORALE_MORNING_DELTA.overtime.min,
      MORALE_MORNING_DELTA.overtime.max,
      [team.id, 'morning-ot'],
    );
  } else if (team.consecutiveOvertimeDays >= 2) {
    delta += pickRange(
      MORALE_MORNING_DELTA.consecutiveOvertime.min,
      MORALE_MORNING_DELTA.consecutiveOvertime.max,
      [team.id, 'morning-ot-streak'],
    );
  }

  if (hadFail) {
    delta += pickRange(
      MORALE_MORNING_DELTA.failed.min,
      MORALE_MORNING_DELTA.failed.max,
      [team.id, 'morning-fail'],
    );
  }

  if (team.sentExhaustedLastTask) {
    delta += pickRange(
      MORALE_MORNING_DELTA.sentExhausted.min,
      MORALE_MORNING_DELTA.sentExhausted.max,
      [team.id, 'morning-exhausted-send'],
    );
  }

  return delta;
}

export function applyEndOfDayPersonnelUpdate(
  state: PersonnelState,
  closingDay: number,
): PersonnelState {
  const dayAssignments = state.dayAssignments.filter((a) => a.day === closingDay);

  const teams = state.teams.map((team) => {
    const hadFullRestToday =
      team.restMode === 'full_rest' && team.lastRestDay === closingDay;
    const hadLightDutyToday =
      team.restMode === 'light_duty' && team.lastRestDay === closingDay;
    const restedToday = hadFullRestToday || hadLightDutyToday;

    const { recovery, carryPenalty } = calculateNightRecovery(
      team.fatigue,
      team.overtimeHours,
      team.consecutiveOvertimeDays,
      team.consecutiveHeavyDays,
      [team.id, closingDay],
    );

    const fullRestBonus = hadFullRestToday ? FULL_REST_NIGHT_RECOVERY_BONUS : 0;

    const morningFatigue = clamp(
      team.fatigue - recovery - fullRestBonus + carryPenalty,
    );

    const moraleMorning = morningMoraleDeltaForTeam(team, dayAssignments, restedToday);
    const morningMorale = clamp(team.morale + moraleMorning);

    const heavyStreak =
      team.fatigue >= CONSECUTIVE_HEAVY_DAY_FATIGUE_THRESHOLD
        ? team.consecutiveHeavyDays
        : 0;

    const next: PersonnelTeam = {
      ...team,
      fatigue: morningFatigue,
      morale: morningMorale,
      moraleDeltaToday: 0,
      todayWorkedHours: 0,
      overtimeHours: 0,
      assignedTaskId: null,
      consecutiveHeavyDays: heavyStreak,
      consecutiveOvertimeDays: 0,
      sentExhaustedLastTask: false,
      restMode: null,
      status: getPersonnelStatus(morningFatigue, false, false),
      warningTags: [],
      lastRestDay: restedToday ? closingDay : team.lastRestDay,
    };
    next.warningTags = getPersonnelWarnings(next);
    return next;
  });

  return {
    ...state,
    teams,
    dayAssignments: state.dayAssignments.filter((a) => a.day !== closingDay),
    dayIncidents: [],
    lastProcessedDay: closingDay,
  };
}

// ---------------------------------------------------------------------------
// Recommendations & rest
// ---------------------------------------------------------------------------

export function getRecommendedPersonnelForTask(
  state: PersonnelState,
  params: {
    preferredRole: PersonnelRole;
    districtId: string;
    difficulty: TaskDifficulty;
  },
): PersonnelTeam | null {
  const candidates = state.teams.filter((t) =>
    canTeamTakeTaskDifficulty(t, params.difficulty),
  );
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((team) => {
      const roleScore = team.role === params.preferredRole ? 30 : 0;
      const familiarity = team.districtFamiliarity[params.districtId] ?? 0;
      const fatiguePenalty = team.fatigue * 0.35;
      const moraleBonus = team.morale * 0.15;
      const lightDutyPenalty = team.restMode === 'light_duty' ? 8 : 0;
      const difficultyPenalty =
        params.difficulty === 'crisis' && team.fatigue >= 71 ? 20 : 0;
      const score =
        roleScore +
        familiarity * 0.2 +
        moraleBonus -
        fatiguePenalty -
        lightDutyPenalty -
        difficultyPenalty;
      return { team, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.team ?? null;
}

export function applyRestAction(
  state: PersonnelState,
  teamId: string,
  restType: RestActionType,
  day: number,
): PersonnelState {
  const teams = state.teams.map((team) => {
    if (team.id !== teamId) return team;

    if (restType === 'equipment_support') {
      return {
        ...team,
        warningTags: getPersonnelWarnings(team),
      };
    }

    const effect =
      restType === 'light_duty'
        ? REST_EFFECTS.light_duty
        : restType === 'full_rest'
          ? REST_EFFECTS.full_rest
          : REST_EFFECTS.motivation;

    const moraleDelta = applyMoraleDeltaWithDailyCap(team, effect.morale);
    const restMode: PersonnelRestMode | null =
      restType === 'full_rest'
        ? 'full_rest'
        : restType === 'light_duty'
          ? 'light_duty'
          : team.restMode;
    const next: PersonnelTeam = {
      ...team,
      fatigue: clamp(team.fatigue + effect.fatigue),
      morale: clamp(team.morale + moraleDelta),
      moraleDeltaToday: team.moraleDeltaToday + moraleDelta,
      restMode,
      status:
        restType === 'full_rest'
          ? 'resting'
          : getPersonnelStatus(
              clamp(team.fatigue + effect.fatigue),
              false,
              false,
            ),
      assignedTaskId: null,
      lastRestDay: day,
      warningTags: [],
    };
    next.warningTags = getPersonnelWarnings(next);
    return next;
  });

  return {
    ...state,
    teams,
    equipmentSupportUntilDay:
      restType === 'equipment_support'
        ? day + REST_EFFECTS.equipment_support.durationDays
        : state.equipmentSupportUntilDay,
  };
}

export function syncCityMoraleFromTeams(
  teams: PersonnelTeam[],
  currentCityMorale: number,
): number {
  if (teams.length === 0) return currentCityMorale;
  const avg = teams.reduce((sum, t) => sum + t.morale, 0) / teams.length;
  return clamp(Math.round(currentCityMorale * 0.55 + avg * 0.45));
}

export function getMaxTeamFatigue(state: PersonnelState): number {
  if (state.teams.length === 0) return 0;
  return Math.max(...state.teams.map((t) => t.fatigue));
}

export function updatePersonnelStateTeam(
  state: PersonnelState,
  teamId: string,
  updater: (team: PersonnelTeam) => PersonnelTeam,
): PersonnelState {
  return {
    ...state,
    teams: state.teams.map((t) => (t.id === teamId ? updater(t) : t)),
  };
}

export function buildPersonnelDayReport(
  state: PersonnelState,
  day: number,
  districtNames: Record<string, string>,
): PersonnelDayReport {
  const assignments = state.dayAssignments.filter((a) => a.day === day);
  const teams = state.teams;

  const mostFatigued = [...teams].sort((a, b) => b.fatigue - a.fatigue)[0] ?? null;
  const riskyTeamIds = teams.filter((t) => t.fatigue >= 71).map((t) => t.id);

  const moraleRisingTeamIds: string[] = [];
  const moraleFallingTeamIds: string[] = [];
  for (const team of teams) {
    const today = assignments.filter((a) => a.teamId === team.id);
    const netMorale = today.reduce((s, a) => s + a.moraleDelta, 0);
    if (netMorale >= 2) moraleRisingTeamIds.push(team.id);
    if (netMorale <= -2) moraleFallingTeamIds.push(team.id);
  }

  const summaryLines: string[] = [];
  const warnings: string[] = [];
  const highlights: string[] = [];

  if (mostFatigued) {
    if (mostFatigued.fatigue >= 71) {
      summaryLines.push(
        `${mostFatigued.name} günü yüksek tempoda tamamladı. Yarın hafif görev önerilir.`,
      );
      warnings.push(`${mostFatigued.name} riskli yorgunluk seviyesinde.`);
    } else {
      summaryLines.push(
        `${mostFatigued.name} bugün en yoğun ekip oldu (${mostFatigued.fatigue}% yorgunluk).`,
      );
    }
  }

  const rested = teams.filter((t) => t.lastRestDay === day);
  for (const team of rested) {
    if (team.restMode === 'full_rest') {
      summaryLines.push(
        `${team.name} tam dinlenme sayesinde toparlandı.`,
      );
      highlights.push(`${team.name} tam dinlenme günü kullandı.`);
    } else if (team.restMode === 'light_duty') {
      summaryLines.push(
        `${team.name} hafif görevde tutulduğu için yorgunluk artışı sınırlı kaldı.`,
      );
      highlights.push(`${team.name} hafif görev planında kaldı.`);
    } else {
      summaryLines.push(`${team.name} dinlendiği için moral kazandı.`);
      highlights.push(`${team.name} dinlenme günü kullandı.`);
    }
  }

  const overtimeTeams = teams.filter((t) => t.consecutiveOvertimeDays >= 1 || t.overtimeHours > 0);
  for (const team of overtimeTeams) {
    if (team.consecutiveOvertimeDays >= 2 || team.overtimeHours >= 8) {
      summaryLines.push(
        `${team.name} üst üste fazla mesai yaptı. Arıza ve hata riski artıyor.`,
      );
      warnings.push(`${team.name} için fazla mesai zinciri oluştu.`);
    }
  }

  for (const team of teams) {
    const topDistrict = Object.entries(team.districtFamiliarity).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topDistrict && topDistrict[1] >= 61) {
      const name = districtNames[topDistrict[0]] ?? topDistrict[0];
      highlights.push(`${team.name} ${name} bölgesinde güven kazandı.`);
    }
  }

  if (riskyTeamIds.length > 0) {
    warnings.push(
      `${riskyTeamIds.length} ekip yarın riskli seviyede başlayabilir. Dinlendirme veya hafif görev düşün.`,
    );
  }

  while (summaryLines.length < 2) {
    summaryLines.push('Ekip durumu dengeli seyretti; yarın dağılımı koruyabilirsin.');
  }

  const incidentLines = (state.dayIncidents ?? [])
    .filter((i) => i.day === day)
    .map((i) => i.reportLine);

  for (const line of incidentLines) {
    summaryLines.unshift(line);
  }

  return {
    day,
    summaryLines,
    warnings,
    highlights,
    incidentLines,
    mostFatiguedTeamId: mostFatigued?.id ?? null,
    moraleRisingTeamIds,
    moraleFallingTeamIds,
    riskyTeamIds,
  };
}
