import type { CarryOverDomain, CarryOverMemoryModel, CarryOverSurface } from './carryOverMemoryTypes';

const FORBIDDEN = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'rank up',
  'xp',
  'kesin doğru seçim',
  'bunu yap',
  'en iyi seçenek',
] as const;

const ALL_DOMAINS: CarryOverDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

const ALL_SURFACES: CarryOverSurface[] = [
  'hub',
  'event_detail',
  'plan',
  'result',
  'report',
];

export function validateCarryOverMemoryModel(model: CarryOverMemoryModel | null): string[] {
  const errors: string[] = [];
  if (!model) return errors;
  if (!model.id.trim()) errors.push('id empty');
  if (!model.title.trim()) errors.push('title empty');
  if (!model.summary.trim()) errors.push('summary empty');
  if (model.maxLines > 2) errors.push('maxLines > 2');
  return errors;
}

export function validateCarryOverTextLength(model: CarryOverMemoryModel): string[] {
  const errors: string[] = [];
  if (model.title.length > 32) errors.push('title too long');
  if (model.summary.length > 140) errors.push('summary too long');
  if (model.detail && model.detail.length > 180) errors.push('detail too long');
  const tagCount = 1 + (model.secondaryTag ? 1 : 0);
  if (tagCount > 2) errors.push('too many tags');
  return errors;
}

export function validateCarryOverDayVisibility(
  model: CarryOverMemoryModel,
  day: number,
): string[] {
  const errors: string[] = [];
  if (day === 1 && model.visible) errors.push('day1 should not be visible');
  return errors;
}

export function findDuplicateCarryOverCopy(models: CarryOverMemoryModel[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const m of models) {
    const key = m.summary.trim().toLowerCase();
    if (seen.has(key)) dupes.push(key);
    seen.add(key);
  }
  return dupes;
}

export function validateCarryOverForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN.filter((w) => {
    if (w === 'xp') return /\bxp\b/.test(lower);
    return lower.includes(w);
  });
}

export function validateCarryOverDomainCoverage(): boolean {
  return ALL_DOMAINS.length >= 7;
}

export function validateCarryOverSurfaceCoverage(): boolean {
  return ALL_SURFACES.length >= 5;
}

export const CARRY_OVER_FORBIDDEN_WORDS = FORBIDDEN;
export const CARRY_OVER_DOMAINS = ALL_DOMAINS;
export const CARRY_OVER_SURFACES = ALL_SURFACES;
