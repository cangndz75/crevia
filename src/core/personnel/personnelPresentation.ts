import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';

import { ROLE_LABELS_TR, SUCCESS_THRESHOLDS } from './personnelConstants';
import {
  buildPersonnelTaskInput,
  calculateTaskFatigueGain,
  calculateTaskSuccessScore,
  clamp,
  countFieldAssignableTeams,
  getRecommendedPersonnelForTask,
  inferPreferredRole,
  inferTaskDifficulty,
  isHeavyTaskDifficulty,
} from './personnelEngine';
import {
  buildMistakeRiskDecisionLine,
  buildMistakeRiskPreviewText,
  calculatePersonnelMistakeRisk,
  resolveMistakeRiskLevel,
} from './personnelMistakeRisk';
import type {
  PersonnelMistakeRiskLevel,
  PersonnelState,
  PersonnelTaskInput,
} from './personnelTypes';

export type PersonnelImpactLevel = 'low' | 'medium' | 'high';

export type PersonnelImpactPreview = {
  estimatedFatigueGain: number;
  estimatedMoraleDelta: number;
  estimatedSuccessLevel: PersonnelImpactLevel;
  riskLevel: PersonnelImpactLevel;
  shortText: string;
  riskText: string | null;
  available: boolean;
  /** Karar kartında gösterim — düşük personel etkisi */
  isLowImpact?: boolean;
  /** Karar kartı tek satır: "Tahmini personel: ..." */
  decisionLine?: string | null;
  /** Karar kartı risk satırı: "Riskli: ..." */
  decisionRiskLine?: string | null;
  mistakeRiskLevel?: PersonnelMistakeRiskLevel;
  mistakeRiskText?: string | null;
  /** Karar kartı aksaklık riski satırı */
  decisionMistakeLine?: string | null;
};

export type PersonnelImpactPreviewExtras = {
  neighborhoods?: Neighborhood[];
  resources?: GameResources;
};

const DEFAULT_RESOURCES: GameResources = {
  availableStaff: 12,
  availableVehicles: 6,
  overtimeHours: 0,
};

const SUCCESS_LABEL_TR: Record<PersonnelImpactLevel, string> = {
  high: 'yüksek',
  medium: 'orta',
  low: 'düşük',
};

export type PersonnelTeamRecommendation = {
  teamId: string;
  teamName: string;
  roleLabel: string;
  reason: string;
  fatigueWarning: string | null;
};

function buildRecommendationReason(
  team: PersonnelState['teams'][number],
  preferredRole: PersonnelState['teams'][number]['role'],
  districtId: string,
  districtNames?: Record<string, string>,
): string {
  const parts: string[] = [];

  if (team.role === preferredRole) {
    parts.push('görev rolüne uygun');
  } else {
    parts.push('yedek ekip olarak uygun');
  }

  const familiarity = team.districtFamiliarity[districtId] ?? 0;
  if (familiarity >= 61) {
    const districtLabel = districtNames?.[districtId] ?? 'bu mahalle';
    parts.push(`${districtLabel} aşinalığı yüksek`);
  } else if (team.morale >= 70) {
    parts.push('moral iyi');
  }

  if (team.fatigue <= 50) {
    parts.push('yorgunluk düşük');
  }

  const sentence = parts.slice(0, 2).join(', ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

export function selectRecommendedTeamForEvent(
  personnelState: PersonnelState,
  event: EventCard,
  districtNames?: Record<string, string>,
): PersonnelTeamRecommendation | null {
  const preferredRole = inferPreferredRole(event);
  const districtId = event.neighborhoodId ?? event.district;
  const difficulty = inferTaskDifficulty(event.riskLevel);

  const team = getRecommendedPersonnelForTask(personnelState, {
    preferredRole,
    districtId,
    difficulty,
  });

  if (!team) {
    return null;
  }

  let fatigueWarning: string | null = null;
  if (team.fatigue >= 71) {
    fatigueWarning =
      'Ekip yorgun. Karar uygulanırsa yarın performans düşebilir.';
  } else if (team.fatigue >= 51) {
    fatigueWarning = 'Ekip orta yorgunlukta; ağır görevlerde risk artar.';
  }

  return {
    teamId: team.id,
    teamName: team.name,
    roleLabel: ROLE_LABELS_TR[team.role],
    reason: buildRecommendationReason(
      team,
      preferredRole,
      districtId,
      districtNames,
    ),
    fatigueWarning,
  };
}

function findNeighborhood(
  neighborhoods: Neighborhood[] | undefined,
  event: EventCard,
): Neighborhood | undefined {
  if (!neighborhoods?.length) return undefined;
  if (event.neighborhoodId) {
    return neighborhoods.find((n) => n.id === event.neighborhoodId);
  }
  return neighborhoods.find((n) => n.name === event.district);
}

function resolvePreviewDecision(
  event: EventCard,
  decision?: EventDecision,
): EventDecision {
  if (decision) return decision;
  const fallback = event.decisions[0];
  if (fallback) return fallback;
  return {
    id: 'preview',
    title: 'Önizleme',
    description: '',
    style: 'balanced',
    effects: {
      publicSatisfaction: 0,
      budget: 0,
      morale: 0,
      risk: 0,
      xp: 0,
    },
  };
}

function mapSuccessScoreToLevel(successScore: number): PersonnelImpactLevel {
  if (successScore >= SUCCESS_THRESHOLDS.success) return 'high';
  if (successScore >= SUCCESS_THRESHOLDS.partial) return 'medium';
  return 'low';
}

function estimateMoraleDeltaPreview(
  input: PersonnelTaskInput,
  successScore: number,
): number {
  let delta: number;
  if (successScore >= SUCCESS_THRESHOLDS.success) {
    delta = 3;
  } else if (successScore >= SUCCESS_THRESHOLDS.partial) {
    delta = 1;
  } else if (successScore >= SUCCESS_THRESHOLDS.weak) {
    delta = -2;
  } else {
    delta = -6;
  }

  if (input.overtimeHours >= 2) {
    delta -= 4;
  } else if (input.overtimeHours > 0) {
    delta -= 2;
  }

  if (input.team.fatigue >= 86) {
    delta -= 4;
  } else if (input.team.fatigue >= 71) {
    delta -= 2;
  }

  if (input.team.consecutiveHeavyDays >= 2) {
    delta -= 2;
  }

  if (input.roleMatchScore >= 0.9 && successScore >= SUCCESS_THRESHOLDS.success) {
    delta += 1;
  }

  return clamp(delta, -6, 4);
}

function resolveRiskLevel(
  input: PersonnelTaskInput,
  successScore: number,
  fatigueGain: number,
): PersonnelImpactLevel {
  if (
    input.team.fatigue >= 71 ||
    successScore < SUCCESS_THRESHOLDS.weak ||
    fatigueGain >= 24
  ) {
    return 'high';
  }
  if (
    input.team.fatigue >= 51 ||
    successScore < SUCCESS_THRESHOLDS.partial ||
    input.roleMatchScore < 0.55
  ) {
    return 'medium';
  }
  return 'low';
}

function buildImpactShortText(
  fatigueGain: number,
  moraleDelta: number,
  successLevel: PersonnelImpactLevel,
): string {
  const moralePart =
    moraleDelta >= 0 ? `Moral +${moraleDelta}` : `Moral ${moraleDelta}`;
  return `Tahmini etki: Yorgunluk +${fatigueGain} · ${moralePart} · Başarı ${SUCCESS_LABEL_TR[successLevel]}`;
}

function buildDecisionImpactLine(
  fatigueGain: number,
  moraleDelta: number,
  successLevel: PersonnelImpactLevel,
): string {
  const moralePart =
    moraleDelta >= 0 ? `Moral +${moraleDelta}` : `Moral ${moraleDelta}`;
  return `Tahmini personel: Yorgunluk +${fatigueGain} · ${moralePart} · Başarı ${SUCCESS_LABEL_TR[successLevel]}`;
}

function buildDecisionRiskLine(
  riskLevel: PersonnelImpactLevel,
  input: PersonnelTaskInput,
): string | null {
  if (
    input.team.restMode === 'light_duty' &&
    isHeavyTaskDifficulty(input.difficulty)
  ) {
    return 'Riskli: hafif görevdeki ekip zor/kriz görevine uygun değil.';
  }
  if (input.team.restMode === 'light_duty') {
    return 'Hafif görevde — yorgunluk artışı sınırlı kalır.';
  }
  if (input.team.fatigue >= 71 || riskLevel === 'high') {
    return 'Riskli: ekip yorgun, yarın performans düşebilir.';
  }
  return null;
}

const FIELD_PERSONNEL_KEYWORDS =
  /ekip|personel|saha|vardiya|mesai|operasyon|sefer|koordinasyon|şikayet|kriz|muhtar|saha sorumlusu/;

function decisionRequiresFieldPersonnel(decision: EventDecision): boolean {
  const staffHours = decision.costs?.staffHours ?? 0;
  if (staffHours > 0) return true;
  const haystack = `${decision.title} ${decision.description}`.toLowerCase();
  return FIELD_PERSONNEL_KEYWORDS.test(haystack);
}

function isLowPersonnelImpactDecision(
  decision: EventDecision,
  _fatigueGain: number,
  available: boolean,
): boolean {
  if (!available) return false;

  const staffHours = decision.costs?.staffHours ?? 0;
  const haystack = `${decision.title} ${decision.description}`.toLowerCase();
  const hasFieldIntent = FIELD_PERSONNEL_KEYWORDS.test(haystack);

  if (
    decision.decisionStyle === 'communication' &&
    staffHours === 0 &&
    !hasFieldIntent
  ) {
    return true;
  }

  return false;
}

function buildRiskText(
  riskLevel: PersonnelImpactLevel,
  input: PersonnelTaskInput,
): string | null {
  if (input.team.fatigue >= 71) {
    return 'Ekip yorgun, yarın performans düşebilir.';
  }
  if (riskLevel === 'low' && input.roleMatchScore >= 0.9) {
    return 'Bu görev ekip rolüne uygun, personel riski düşük.';
  }
  if (riskLevel === 'high') {
    return 'Personel riski yüksek; dinlendirme veya hafif görev düşün.';
  }
  if (riskLevel === 'medium') {
    return 'Orta düzey personel riski — tempo dengeli tutulmalı.';
  }
  return null;
}

function buildUnavailablePreview(
  decision: EventDecision,
  personnelState: PersonnelState,
  difficulty: ReturnType<typeof inferTaskDifficulty>,
): PersonnelImpactPreview {
  const requiresField = decisionRequiresFieldPersonnel(decision);
  const assignableCount = countFieldAssignableTeams(personnelState, difficulty);
  const allFullRest =
    personnelState.teams.length > 0 &&
    personnelState.teams.every((t) => t.restMode === 'full_rest');

  const decisionLine = requiresField
    ? allFullRest
      ? 'Personel atanamaz: tüm ekipler dinleniyor'
      : assignableCount === 0
        ? 'Bugün sahada uygun ekip yok'
        : 'Personel etkisi düşük'
    : 'Personel etkisi düşük';

  return {
    estimatedFatigueGain: 0,
    estimatedMoraleDelta: 0,
    estimatedSuccessLevel: 'low',
    riskLevel: requiresField ? 'high' : 'low',
    shortText: requiresField
      ? 'Bugün sahada uygun ekip yok'
      : 'Personel etkisi düşük',
    riskText: null,
    available: false,
    isLowImpact: !requiresField,
    decisionLine,
    decisionRiskLine: requiresField
      ? 'Bugün sahada uygun ekip yok'
      : null,
  };
}

function computePersonnelImpactPreview(params: {
  personnelState: PersonnelState;
  event: EventCard;
  decision: EventDecision;
  day: number;
  neighborhoods?: Neighborhood[];
  resources?: GameResources;
}): PersonnelImpactPreview {
  const {
    personnelState,
    event,
    decision,
    day,
    neighborhoods,
    resources = DEFAULT_RESOURCES,
  } = params;

  const preferredRole = inferPreferredRole(event);
  const districtId = event.neighborhoodId ?? event.district;
  const difficulty = inferTaskDifficulty(event.riskLevel);

  const team = getRecommendedPersonnelForTask(personnelState, {
    preferredRole,
    districtId,
    difficulty,
  });

  if (!team) {
    return buildUnavailablePreview(decision, personnelState, difficulty);
  }

  const equipmentSupportActive =
    personnelState.equipmentSupportUntilDay != null &&
    day <= personnelState.equipmentSupportUntilDay;

  const taskInput = buildPersonnelTaskInput({
    team,
    event,
    decision,
    neighborhood: findNeighborhood(neighborhoods, event),
    resources,
    equipmentSupportActive,
    day,
  });

  const estimatedFatigueGain = calculateTaskFatigueGain(taskInput);

  const successScore = calculateTaskSuccessScore(taskInput);
  const mistakeRisk = calculatePersonnelMistakeRisk(taskInput, successScore);
  const mistakeRiskLevel = resolveMistakeRiskLevel(mistakeRisk);
  const estimatedMoraleDelta = estimateMoraleDeltaPreview(taskInput, successScore);
  const estimatedSuccessLevel = mapSuccessScoreToLevel(successScore);
  const riskLevel = resolveRiskLevel(taskInput, successScore, estimatedFatigueGain);
  const available = true;
  const isLowImpact = isLowPersonnelImpactDecision(
    decision,
    estimatedFatigueGain,
    available,
  );

  const preview: PersonnelImpactPreview = {
    estimatedFatigueGain,
    estimatedMoraleDelta,
    estimatedSuccessLevel,
    riskLevel,
    shortText: buildImpactShortText(
      estimatedFatigueGain,
      estimatedMoraleDelta,
      estimatedSuccessLevel,
    ),
    riskText: buildRiskText(riskLevel, taskInput),
    available,
    isLowImpact,
    decisionLine: isLowImpact
      ? 'Personel etkisi düşük'
      : buildDecisionImpactLine(
          estimatedFatigueGain,
          estimatedMoraleDelta,
          estimatedSuccessLevel,
        ),
    decisionRiskLine: isLowImpact
      ? null
      : buildDecisionRiskLine(riskLevel, taskInput),
    mistakeRiskLevel,
    mistakeRiskText:
      mistakeRiskLevel === 'low'
        ? null
        : buildMistakeRiskPreviewText(mistakeRiskLevel, taskInput),
    decisionMistakeLine: buildMistakeRiskDecisionLine(mistakeRiskLevel),
  };

  return preview;
}

export type SelectPersonnelImpactPreviewParams = {
  personnelState: PersonnelState;
  event: EventCard;
  day: number;
  neighborhoods?: Neighborhood[];
  resources?: GameResources;
  decision?: EventDecision;
};

/** Karar öncesi tahmini personel etkisi (olay düzeyi) — state mutate etmez. */
export function selectPersonnelImpactPreviewForEvent(
  params: SelectPersonnelImpactPreviewParams,
): PersonnelImpactPreview {
  const {
    personnelState,
    event,
    day,
    neighborhoods,
    resources = DEFAULT_RESOURCES,
    decision,
  } = params;

  return computePersonnelImpactPreview({
    personnelState,
    event,
    decision: resolvePreviewDecision(event, decision),
    day,
    neighborhoods,
    resources,
  });
}

/** Karar seçeneği bazlı tahmini personel etkisi — state mutate etmez. */
export function selectPersonnelImpactPreviewForDecision(
  event: EventCard,
  decision: EventDecision,
  personnelState: PersonnelState,
  day: number,
  extras?: PersonnelImpactPreviewExtras,
): PersonnelImpactPreview {
  return computePersonnelImpactPreview({
    personnelState,
    event,
    decision,
    day,
    neighborhoods: extras?.neighborhoods,
    resources: extras?.resources,
  });
}
