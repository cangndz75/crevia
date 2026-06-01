import type { MapBeforeAfterImpactModel } from './mapBeforeAfterTypes';
import { MAP_BEFORE_AFTER_DOMAINS } from './mapBeforeAfterTypes';
import {
  AFTER_LABEL_LIMIT,
  BEFORE_LABEL_LIMIT,
  isMapBeforeAfterDuplicateOf,
  SUMMARY_LIMIT,
  TITLE_LIMIT,
} from './mapBeforeAfterPresentation';

const FORBIDDEN = [
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
  'gps',
  'gerçek zamanlı',
] as const;

const PANIC_WORDS = ['felaket', 'kriz başladı', 'skandal', 'panik'] as const;

export function validateMapBeforeAfterImpact(
  model: MapBeforeAfterImpactModel | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!model) return errors;
  if (!model.id.trim()) errors.push('id empty');
  if (!model.title.trim()) errors.push('title empty');
  if (!model.summary.trim()) errors.push('summary empty');
  if (!MAP_BEFORE_AFTER_DOMAINS.includes(model.domain)) errors.push('invalid domain');
  return errors;
}

export function validateMapBeforeAfterTextLength(model: MapBeforeAfterImpactModel): string[] {
  const errors: string[] = [];
  if (model.title.length > TITLE_LIMIT) errors.push('title too long');
  if (model.beforeLabel.length > BEFORE_LABEL_LIMIT) errors.push('beforeLabel too long');
  if (model.afterLabel.length > AFTER_LABEL_LIMIT) errors.push('afterLabel too long');
  if (model.summary.length > SUMMARY_LIMIT) errors.push('summary too long');
  if (model.maxLines > 2) errors.push('maxLines > 2');
  const tagCount = 1 + (model.secondaryTag ? 1 : 0);
  if (tagCount > 2) errors.push('too many tags');
  return errors;
}

export function validateMapBeforeAfterForbiddenWords(model: MapBeforeAfterImpactModel): string[] {
  const errors: string[] = [];
  const haystack =
    `${model.title} ${model.beforeLabel} ${model.afterLabel} ${model.summary} ${model.primaryTag} ${model.secondaryTag ?? ''}`.toLowerCase();
  for (const word of FORBIDDEN) {
    if (haystack.includes(word)) errors.push(`forbidden: ${word}`);
  }
  return errors;
}

export function validateMapBeforeAfterDayVisibility(
  model: MapBeforeAfterImpactModel,
  day: number,
): string[] {
  const errors: string[] = [];
  if (day === 1 && model.visible) {
    errors.push('day1 should be hidden');
  }
  return errors;
}

export function validateMapBeforeAfterNoPanicLanguage(model: MapBeforeAfterImpactModel): string[] {
  const errors: string[] = [];
  const haystack = `${model.title} ${model.summary} ${model.afterLabel}`.toLowerCase();
  for (const word of PANIC_WORDS) {
    if (haystack.includes(word)) errors.push(`panic: ${word}`);
  }
  return errors;
}

export function validateMapBeforeAfterDuplicateSuppression(
  model: MapBeforeAfterImpactModel,
  lines: string[],
): string[] {
  const errors: string[] = [];
  if (model.visible && isMapBeforeAfterDuplicateOf(model, lines)) {
    errors.push('duplicate not suppressed');
  }
  return errors;
}

export function validateMapBeforeAfterDomainCoverage(): string[] {
  const errors: string[] = [];
  if (MAP_BEFORE_AFTER_DOMAINS.length < 7) errors.push('domain coverage incomplete');
  return errors;
}
