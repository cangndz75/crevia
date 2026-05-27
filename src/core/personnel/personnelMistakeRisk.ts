import {
  applyCompetencyRiskToScore,
  getCompetencyRiskModifier,
  getTeamCompetencyScore,
} from './personnelCompetency';
import {
  MISTAKE_RISK,
  MISTAKE_RISK_LEVEL_LABELS_TR,
  SUCCESS_THRESHOLDS,
} from './personnelConstants';
import { PERSONNEL_MAX, PERSONNEL_MIN } from './personnelConstants';
import type {
  PersonnelIncidentCause,
  PersonnelIncidentType,
  PersonnelMistakeRiskLevel,
  PersonnelOperationalIncident,
  PersonnelRole,
  PersonnelTaskInput,
} from './personnelTypes';

export type PersonnelMistakeDayContext = {
  day: number;
  existingIncidents: PersonnelOperationalIncident[];
};

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

function seededUnit(seedParts: (string | number)[]): number {
  return (hashSeed(seedParts) % 10_000) / 10_000;
}

function clampScore(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function resolveMistakeRiskLevel(
  riskScore: number,
): PersonnelMistakeRiskLevel {
  if (riskScore <= MISTAKE_RISK.levelLowMax) return 'low';
  if (riskScore <= MISTAKE_RISK.levelMediumMax) return 'medium';
  return 'high';
}

export function calculatePersonnelMistakeRisk(
  input: PersonnelTaskInput,
  taskSuccessScore: number,
): number {
  const { team } = input;
  let risk: number = MISTAKE_RISK.base;

  const { fatigue: fCfg } = MISTAKE_RISK;
  if (team.fatigue >= fCfg.highThreshold) {
    risk += fCfg.penaltyHigh;
  } else if (team.fatigue >= fCfg.riskyThreshold) {
    risk += fCfg.penaltyRisky;
  } else if (team.fatigue >= 36) {
    risk += fCfg.penaltyModerate;
  }

  const { morale: mCfg } = MISTAKE_RISK;
  if (team.morale < mCfg.criticalThreshold) {
    risk += mCfg.penaltyCritical;
  } else if (team.morale < mCfg.lowThreshold) {
    risk += mCfg.penaltyLow;
  }

  const { experience: eCfg } = MISTAKE_RISK;
  if (team.experience < eCfg.veryLowThreshold) {
    risk += eCfg.penaltyVeryLow;
  } else if (team.experience < eCfg.lowThreshold) {
    risk += eCfg.penaltyLow;
  }

  const { roleMatch: rCfg } = MISTAKE_RISK;
  if (input.roleMatchScore >= rCfg.good) {
    risk += rCfg.penaltyGood;
  } else if (input.roleMatchScore >= rCfg.partial) {
    risk += rCfg.penaltyPartial;
  } else {
    risk += rCfg.penaltyBad;
  }

  if (team.consecutiveHeavyDays >= MISTAKE_RISK.consecutiveHeavy.daysThreshold) {
    risk += MISTAKE_RISK.consecutiveHeavy.penalty;
  }

  const familiarity = team.districtFamiliarity[input.districtId] ?? 0;
  const { familiarity: famCfg } = MISTAKE_RISK;
  if (familiarity >= famCfg.highMin) {
    risk -= famCfg.highReduction;
  } else if (familiarity >= famCfg.midMin) {
    risk -= famCfg.midReduction;
  } else if (familiarity >= 10) {
    risk -= famCfg.lowReduction;
  }

  const { successScore: sCfg } = MISTAKE_RISK;
  if (taskSuccessScore >= sCfg.highThreshold) {
    risk += sCfg.bonusHigh;
  } else if (taskSuccessScore >= sCfg.partialThreshold) {
    risk += sCfg.penaltyPartial;
  } else if (taskSuccessScore >= sCfg.weakThreshold) {
    risk += sCfg.penaltyWeak;
  } else {
    risk += sCfg.penaltyFailed;
  }

  const competencyValue =
    input.competencyScore ??
    (input.requiredCompetency
      ? getTeamCompetencyScore(team, input.requiredCompetency)
      : 50);
  const competencyRiskMod = getCompetencyRiskModifier(competencyValue);
  risk = applyCompetencyRiskToScore(
    risk,
    competencyRiskMod,
    input,
    taskSuccessScore,
    sCfg.partialThreshold,
  );

  return clampScore(
    Math.round(risk),
    MISTAKE_RISK.min,
    MISTAKE_RISK.max,
  );
}

function resolvePrimaryCause(input: PersonnelTaskInput): PersonnelIncidentCause {
  const { team } = input;
  const fatigueHigh = team.fatigue >= MISTAKE_RISK.fatigue.highThreshold;
  const moraleLow = team.morale < MISTAKE_RISK.morale.lowThreshold;
  const expLow = team.experience < MISTAKE_RISK.experience.lowThreshold;
  const roleBad = input.roleMatchScore < MISTAKE_RISK.roleMatch.partial;

  const stressCount = [fatigueHigh, moraleLow, expLow, roleBad].filter(Boolean).length;
  if (stressCount >= 2) return 'combined';
  if (fatigueHigh) return 'fatigue';
  if (moraleLow) return 'morale';
  if (expLow) return 'experience';
  if (roleBad) return 'role_mismatch';
  return 'combined';
}

const ROLE_INCIDENT_TYPES: Record<PersonnelRole, PersonnelIncidentType[]> = {
  cleaning: ['task_delay', 'incomplete_resolution', 'coordination_gap'],
  driver: ['route_inefficiency', 'task_delay', 'coordination_gap'],
  maintenance: [
    'maintenance_recheck',
    'incomplete_resolution',
    'task_delay',
  ],
  field_supervisor: [
    'weak_communication',
    'coordination_gap',
    'incomplete_resolution',
  ],
};

const INCIDENT_REPORT_TEMPLATES: Record<
  PersonnelIncidentType,
  Record<PersonnelIncidentCause, string>
> = {
  task_delay: {
    fatigue: '{team} yorgunluk nedeniyle görevi gecikmeli tamamladı.',
    morale: '{team} düşük moral nedeniyle görevde gecikme yaşadı.',
    experience: '{team} deneyim eksikliği nedeniyle görevi gecikmeli tamamladı.',
    role_mismatch: '{team} görev uyumsuzluğu nedeniyle gecikme yaşadı.',
    combined: '{team} zorlu koşullarda görevi gecikmeli tamamladı.',
  },
  incomplete_resolution: {
    fatigue: '{team} yorgunluk nedeniyle görevi eksik kapattı.',
    morale: '{team} düşük moral nedeniyle görevi tam kapatamadı.',
    experience: '{team} deneyim eksikliği nedeniyle görevi eksik kapattı.',
    role_mismatch: '{team} uyumsuz görevde eksik kapanış bıraktı.',
    combined: '{team} zorlu koşullarda görevi eksik kapattı.',
  },
  weak_communication: {
    fatigue: '{team} yorgunluk nedeniyle şikayet iletişiminde beklenen etkiyi sağlayamadı.',
    morale: '{team} düşük moral nedeniyle şikayet iletişiminde beklenen etkiyi sağlayamadı.',
    experience: '{team} deneyim eksikliği nedeniyle iletişimde zayıf kaldı.',
    role_mismatch: '{team} görev uyumsuzluğu nedeniyle iletişimde zayıf kaldı.',
    combined: '{team} zorlu koşullarda şikayet iletişiminde beklenen etkiyi sağlayamadı.',
  },
  route_inefficiency: {
    fatigue: '{team} yorgunluk nedeniyle rota verimliliği düştü.',
    morale: '{team} düşük moral nedeniyle rota verimliliği düştü.',
    experience: '{team} deneyim eksikliği nedeniyle rota verimsiz kaldı.',
    role_mismatch: '{team} uyumsuz görevde rota verimsizliği yaşandı.',
    combined: '{team} zorlu koşullarda rota verimsizliği yaşandı.',
  },
  maintenance_recheck: {
    fatigue: '{team} bakım müdahalesinde tekrar kontrol gerektiren bir eksik bıraktı.',
    morale: '{team} düşük moral nedeniyle bakımda tekrar kontrol gerekti.',
    experience: '{team} deneyim eksikliği nedeniyle bakımda tekrar kontrol gerekti.',
    role_mismatch: '{team} uyumsuz görevde bakımda tekrar kontrol gerekti.',
    combined: '{team} zorlu koşullarda bakımda tekrar kontrol gerektiren eksik bıraktı.',
  },
  coordination_gap: {
    fatigue: '{team} yorgunluk nedeniyle saha koordinasyonunda küçük bir boşluk oluştu.',
    morale: '{team} düşük moral nedeniyle koordinasyonda küçük bir boşluk oluştu.',
    experience: '{team} deneyim eksikliği nedeniyle koordinasyonda boşluk oluştu.',
    role_mismatch: '{team} görev uyumsuzluğu nedeniyle koordinasyonda boşluk oluştu.',
    combined: '{team} zorlu koşullarda saha koordinasyonunda küçük bir boşluk oluştu.',
  },
};

function buildReportLine(
  teamName: string,
  type: PersonnelIncidentType,
  cause: PersonnelIncidentCause,
): string {
  const template =
    INCIDENT_REPORT_TEMPLATES[type][cause] ??
    INCIDENT_REPORT_TEMPLATES[type].combined;
  return template.replace('{team}', teamName);
}

function pickIncidentType(
  role: PersonnelRole,
  seedParts: (string | number)[],
  blockedTypes: Set<PersonnelIncidentType>,
): PersonnelIncidentType {
  const candidates = ROLE_INCIDENT_TYPES[role].filter((t) => !blockedTypes.has(t));
  const pool = candidates.length > 0 ? candidates : ROLE_INCIDENT_TYPES[role];
  const index = hashSeed([...seedParts, 'incident-type']) % pool.length;
  return pool[index]!;
}

function resolveTriggerChance(
  riskLevel: PersonnelMistakeRiskLevel,
  riskScore: number,
): number {
  const { trigger } = MISTAKE_RISK;
  if (riskLevel === 'low') {
    if (riskScore < trigger.lowRiskMinScore) return 0;
    return trigger.lowRiskMaxChance * (riskScore / MISTAKE_RISK.levelLowMax);
  }
  if (riskLevel === 'medium') {
    const t =
      (riskScore - MISTAKE_RISK.levelLowMax) /
      (MISTAKE_RISK.levelMediumMax - MISTAKE_RISK.levelLowMax);
    return trigger.mediumChanceMin + t * (trigger.mediumChanceMax - trigger.mediumChanceMin);
  }
  const t =
    (riskScore - MISTAKE_RISK.levelMediumMax) /
    (MISTAKE_RISK.max - MISTAKE_RISK.levelMediumMax);
  return trigger.highChanceMin + t * (trigger.highChanceMax - trigger.highChanceMin);
}

function teamHadIncidentToday(
  teamId: string,
  incidents: PersonnelOperationalIncident[],
): boolean {
  return incidents.some((i) => i.teamId === teamId);
}

function dayHasSeriousIncident(
  incidents: PersonnelOperationalIncident[],
): boolean {
  return incidents.some((i) => i.severity === 'moderate');
}

// TODO: Günler arası tip tekrarını önlemek için PersonnelState.lastIncidentTypes
// (max 2) eklenebilir; dayIncidents gece sıfırlandığı için şu an sadece gün içi.
function blockedIncidentTypes(
  incidents: PersonnelOperationalIncident[],
): Set<PersonnelIncidentType> {
  const lookback = MISTAKE_RISK.trigger.typeRepeatLookback;
  const recent = incidents.slice(-lookback);
  return new Set(recent.map((i) => i.type));
}

export function buildMistakeRiskPreviewText(
  riskLevel: PersonnelMistakeRiskLevel,
  input: PersonnelTaskInput,
): string | null {
  if (riskLevel === 'low') return null;

  const { team } = input;
  const parts: string[] = [];

  if (team.fatigue >= MISTAKE_RISK.fatigue.highThreshold) {
    parts.push('ekip yorgun');
  }
  if (team.morale < MISTAKE_RISK.morale.lowThreshold) {
    parts.push('morali düşük');
  }
  if (team.experience < MISTAKE_RISK.experience.lowThreshold) {
    parts.push('deneyimi sınırlı');
  }
  if (input.roleMatchScore < MISTAKE_RISK.roleMatch.partial) {
    parts.push('görev uyumu zayıf');
  }

  if (parts.length === 0) {
    return riskLevel === 'high'
      ? 'Yoğun tempo altında küçük operasyonel aksaklık yaşanabilir.'
      : 'Küçük gecikme veya eksik kapanış yaşanabilir.';
  }

  const joined = parts.slice(0, 2).join(' ve ');
  return `${joined.charAt(0).toUpperCase() + joined.slice(1)}; küçük gecikme yaşanabilir.`;
}

export function buildMistakeRiskDecisionLine(
  riskLevel: PersonnelMistakeRiskLevel,
): string | null {
  if (riskLevel === 'low') return null;
  return `Aksaklık riski: ${MISTAKE_RISK_LEVEL_LABELS_TR[riskLevel]}`;
}

export function tryGenerateOperationalIncident(params: {
  input: PersonnelTaskInput;
  taskSuccessScore: number;
  mistakeRisk: number;
  mistakeRiskLevel: PersonnelMistakeRiskLevel;
  context: PersonnelMistakeDayContext;
  taskMeta: { eventId: string; decisionId: string };
}): PersonnelOperationalIncident | null {
  const {
    input,
    taskSuccessScore,
    mistakeRisk,
    mistakeRiskLevel,
    context,
    taskMeta,
  } = params;

  if (mistakeRiskLevel === 'low' && taskSuccessScore >= SUCCESS_THRESHOLDS.partial) {
    return null;
  }

  if (teamHadIncidentToday(input.team.id, context.existingIncidents)) {
    return null;
  }

  const chance = resolveTriggerChance(mistakeRiskLevel, mistakeRisk);
  const roll = seededUnit([
    input.team.id,
    context.day,
    taskMeta.eventId,
    taskMeta.decisionId,
    'mistake-roll',
  ]);

  if (roll >= chance) {
    return null;
  }

  const seriousAllowed =
    mistakeRiskLevel === 'high' &&
    !dayHasSeriousIncident(context.existingIncidents);

  let severity: 'minor' | 'moderate' = 'minor';
  if (seriousAllowed) {
    const seriousRoll = seededUnit([
      input.team.id,
      context.day,
      'mistake-serious',
    ]);
    if (seriousRoll < MISTAKE_RISK.trigger.seriousChanceAtHigh) {
      severity = 'moderate';
    }
  }

  const cause = resolvePrimaryCause(input);
  const blocked = blockedIncidentTypes(context.existingIncidents);
  const type = pickIncidentType(
    input.team.role,
    [input.team.id, context.day, cause, taskMeta.eventId],
    blocked,
  );

  return {
    day: context.day,
    teamId: input.team.id,
    teamName: input.team.name,
    type,
    severity,
    cause,
    reportLine: buildReportLine(input.team.name, type, cause),
    riskScore: mistakeRisk,
  };
}

export function applyIncidentToTaskOutcome(params: {
  successScore: number;
  moraleDelta: number;
  incident: PersonnelOperationalIncident;
}): { successScore: number; moraleDelta: number; outcomeAdjusted: boolean } {
  const { incident } = params;
  const { outcome: oCfg } = MISTAKE_RISK;
  const scorePenalty =
    incident.severity === 'moderate'
      ? oCfg.successPenaltyModerate
      : oCfg.successPenaltyMinor;
  const moralePenalty =
    incident.severity === 'moderate'
      ? oCfg.moraleModerate
      : oCfg.moraleMinor;

  return {
    successScore: clampScore(params.successScore - scorePenalty, PERSONNEL_MIN, PERSONNEL_MAX),
    moraleDelta: params.moraleDelta + moralePenalty,
    outcomeAdjusted: true,
  };
}
