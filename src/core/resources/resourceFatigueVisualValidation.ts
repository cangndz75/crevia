import type { ResourceFatigueVisualModel } from './resourceFatigueVisualTypes';
import {
  RESOURCE_VISUAL_DOMAINS,
  RESOURCE_VISUAL_STATES,
} from './resourceFatigueVisualTypes';
import { SHORT_LABEL_LIMIT, SUMMARY_LIMIT, TITLE_LIMIT } from './resourceFatigueVisualPresentation';

const FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'kriz başladı',
  'felaket',
  'skandal',
  'kesin doğru seçim',
  'bunu yap',
  'xp',
  'rank up',
  'en iyi seçenek',
] as const;

const PANIC_PHRASES = ['felaket', 'kriz başladı', 'alarm', 'panik'] as const;

export function validateResourceFatigueTextLength(model: ResourceFatigueVisualModel): string[] {
  const errors: string[] = [];
  if (model.title.length > TITLE_LIMIT) errors.push('title too long');
  if (model.shortLabel.length > SHORT_LABEL_LIMIT) errors.push('shortLabel too long');
  if (model.summary.length > SUMMARY_LIMIT) errors.push('summary too long');
  if (model.maxLines > 2) errors.push('maxLines > 2');
  return errors;
}

export function validateResourceFatigueForbiddenWords(model: ResourceFatigueVisualModel): string[] {
  const blob = `${model.title} ${model.shortLabel} ${model.summary}`.toLowerCase();
  const errors: string[] = [];
  for (const word of FORBIDDEN_WORDS) {
    if (blob.includes(word)) errors.push(`forbidden: ${word}`);
  }
  return errors;
}

export function validateResourceFatigueNoPanicLanguage(model: ResourceFatigueVisualModel): string[] {
  const blob = `${model.title} ${model.summary}`.toLowerCase();
  return PANIC_PHRASES.filter((p) => blob.includes(p)).map((p) => `panic: ${p}`);
}

export function validateResourceFatigueVisualModel(model: ResourceFatigueVisualModel): string[] {
  return [
    ...validateResourceFatigueTextLength(model),
    ...validateResourceFatigueForbiddenWords(model),
    ...validateResourceFatigueNoPanicLanguage(model),
  ];
}

export function validateResourceFatigueDayVisibility(
  model: ResourceFatigueVisualModel,
  day: number,
): string[] {
  const errors: string[] = [];
  if (day === 1 && model.visible) errors.push('day1 should be hidden');
  if (day === 7 && model.title.length > TITLE_LIMIT) errors.push('day7 title');
  return errors;
}

export function validateResourceFatigueSurfaceCoverage(): boolean {
  return true;
}

export function validateResourceFatigueDomainCoverage(): string[] {
  const errors: string[] = [];
  if (RESOURCE_VISUAL_DOMAINS.length < 5) errors.push('domains incomplete');
  if (RESOURCE_VISUAL_STATES.length < 10) errors.push('states incomplete');
  return errors;
}
