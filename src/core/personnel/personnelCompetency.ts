import type { EventCard, EventDecision } from '@/core/models/EventCard';

import { inferRoleFromHaystack } from './personnelEngine';
import type {
  PersonnelCompetencyKey,
  PersonnelRole,
  PersonnelTaskInput,
  PersonnelTeam,
} from './personnelTypes';

export const PERSONNEL_COMPETENCY_KEYS: PersonnelCompetencyKey[] = [
  'waste_collection',
  'market_cleanup',
  'container_maintenance',
  'complaint_response',
  'crisis_coordination',
  'route_operation',
];

export const COMPETENCY_LABELS_TR: Record<PersonnelCompetencyKey, string> = {
  waste_collection: 'Çöp Toplama',
  market_cleanup: 'Pazar / Sokak Temizliği',
  container_maintenance: 'Konteyner Bakım',
  complaint_response: 'Şikayet Yanıtı',
  crisis_coordination: 'Kriz Koordinasyonu',
  route_operation: 'Rota Operasyonu',
};

const COMPETENCY_KEYWORD_RULES: Array<{
  key: PersonnelCompetencyKey;
  keywords: string[];
}> = [
  {
    key: 'waste_collection',
    keywords: [
      'çöp',
      'atık',
      'konteyner taşması',
      'toplam',
      'doluluk',
      'acil müdahale',
      'acil temizlik',
      'acil toplama',
      'acil kapat',
    ],
  },
  {
    key: 'market_cleanup',
    keywords: [
      'pazar',
      'park',
      'sokak temizliği',
      'temizlik',
      'kirlilik',
      'mıntıka',
    ],
  },
  {
    key: 'container_maintenance',
    keywords: [
      'konteyner bakım',
      'konteyner arıza',
      'kapak arız',
      'filo bakım',
      'araç bakım',
      'teker kırık',
      'arıza',
      'tamir',
      'kırık',
    ],
  },
  {
    key: 'complaint_response',
    keywords: [
      'şikayet',
      'vatandaş',
      'muhtar',
      'mahalle sakini',
      'muhtar koordinasyonu',
      'vatandaş koordinasyonu',
      'şikayet koordinasyonu',
      'bilgilendirme',
    ],
  },
  {
    key: 'crisis_coordination',
    keywords: [
      'kriz',
      'sosyal medya',
      'toplu tepki',
      'kriz koordinasyonu',
      'acil koordinasyon',
      'sosyal medya koordinasyonu',
      'basınç',
      'gerginlik',
    ],
  },
  {
    key: 'route_operation',
    keywords: [
      'rota',
      'araç',
      'sürücü',
      'trafik',
      'dar sokak',
      'güzergah',
      'araçlı toplama',
    ],
  },
];

const ROLE_DEFAULT_COMPETENCY: Record<PersonnelRole, PersonnelCompetencyKey> = {
  cleaning: 'waste_collection',
  driver: 'route_operation',
  maintenance: 'container_maintenance',
  field_supervisor: 'complaint_response',
};

export function createDefaultCompetenciesForRole(
  role: PersonnelRole,
): Record<PersonnelCompetencyKey, number> {
  const base = 42;
  const competencies = Object.fromEntries(
    PERSONNEL_COMPETENCY_KEYS.map((k) => [k, base]),
  ) as Record<PersonnelCompetencyKey, number>;

  switch (role) {
    case 'cleaning':
      competencies.waste_collection = 72;
      competencies.market_cleanup = 68;
      competencies.container_maintenance = 38;
      competencies.route_operation = 48;
      break;
    case 'driver':
      competencies.route_operation = 78;
      competencies.waste_collection = 52;
      competencies.market_cleanup = 38;
      competencies.crisis_coordination = 34;
      break;
    case 'maintenance':
      competencies.container_maintenance = 78;
      competencies.waste_collection = 40;
      competencies.market_cleanup = 36;
      break;
    case 'field_supervisor':
      competencies.complaint_response = 76;
      competencies.crisis_coordination = 74;
      competencies.waste_collection = 38;
      competencies.market_cleanup = 36;
      break;
    default:
      break;
  }

  return competencies;
}

export function ensureTeamCompetencies(team: PersonnelTeam): PersonnelTeam {
  if (team.competencies && typeof team.competencies === 'object') {
    const merged = { ...createDefaultCompetenciesForRole(team.role) };
    for (const key of PERSONNEL_COMPETENCY_KEYS) {
      const val = team.competencies[key];
      if (typeof val === 'number' && Number.isFinite(val)) {
        merged[key] = Math.min(100, Math.max(0, Math.round(val)));
      }
    }
    return { ...team, competencies: merged };
  }
  return {
    ...team,
    competencies: createDefaultCompetenciesForRole(team.role),
  };
}

function buildTaskHaystack(
  taskInput: Pick<PersonnelTaskInput, 'team'> & {
    event?: EventCard;
    decision?: EventDecision;
  },
): string {
  const parts: string[] = [];
  if (taskInput.event) {
    parts.push(
      taskInput.event.title,
      taskInput.event.description,
      taskInput.event.category,
      taskInput.event.contextTag ?? '',
      taskInput.event.eventType ?? '',
    );
  }
  if (taskInput.decision) {
    parts.push(taskInput.decision.title, taskInput.decision.description);
  }
  return parts.join(' ').toLowerCase();
}

export function inferPersonnelCompetencyForTask(params: {
  team?: PersonnelTeam;
  event?: EventCard;
  decision?: EventDecision;
  haystack?: string;
}): PersonnelCompetencyKey {
  const haystack =
    params.haystack ?? buildTaskHaystack({ team: params.team!, ...params });

  for (const rule of COMPETENCY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.key;
    }
  }

  const role = params.team?.role ?? inferRoleFromHaystack(haystack);
  return ROLE_DEFAULT_COMPETENCY[role];
}

export function getTeamCompetencyScore(
  team: PersonnelTeam,
  key: PersonnelCompetencyKey,
): number {
  const competencies = ensureTeamCompetencies(team).competencies;
  return competencies[key];
}

export function getCompetencyScoreModifier(competency: number): number {
  if (competency >= 80) return 10;
  if (competency >= 60) return 5;
  if (competency >= 40) return 0;
  if (competency >= 20) return -8;
  return -15;
}

export function getCompetencyRiskModifier(competency: number): number {
  if (competency >= 80) return -3;
  if (competency >= 60) return -1;
  if (competency >= 40) return 0;
  if (competency >= 20) return 4;
  return 7;
}

/** Düşük yetkinlik cezası yalnızca stres faktörleriyle birleşince tam uygulanır. */
export function applyCompetencyRiskToScore(
  riskScore: number,
  competencyModifier: number,
  input: PersonnelTaskInput,
  taskSuccessScore: number,
  partialThreshold: number,
): number {
  if (competencyModifier <= 0) {
    return riskScore + competencyModifier;
  }

  const stressSignals = [
    input.team.fatigue >= 51,
    input.team.morale < 50,
    taskSuccessScore < partialThreshold,
    input.roleMatchScore < 0.55,
    input.team.consecutiveHeavyDays >= 2,
  ].filter(Boolean).length;

  if (stressSignals >= 2) {
    return riskScore + competencyModifier;
  }
  if (stressSignals === 1) {
    return riskScore + Math.round(competencyModifier * 0.5);
  }
  return riskScore + Math.round(competencyModifier * 0.2);
}

export function buildCompetencyPreviewText(competencyScore: number): string | null {
  if (competencyScore >= 80) {
    return 'Bu görev ekibin güçlü olduğu alana uygun.';
  }
  if (competencyScore < 40) {
    return 'Bu görev ekibin zayıf olduğu alana denk geliyor.';
  }
  return null;
}

export function getStrongestWeakestCompetencyLabels(
  team: PersonnelTeam,
): { strongest: string; weakest: string } | null {
  const competencies = ensureTeamCompetencies(team).competencies;
  const entries = PERSONNEL_COMPETENCY_KEYS.map((key) => ({
    key,
    score: competencies[key],
    label: COMPETENCY_LABELS_TR[key],
  }));

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  if (!strongest || !weakest || strongest.key === weakest.key) {
    return null;
  }
  if (strongest.score - weakest.score < 12) {
    return null;
  }

  return {
    strongest: strongest.label,
    weakest: weakest.label,
  };
}
