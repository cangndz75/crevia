import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';

import {
  SOCIAL_ECHO_DOMAINS,
  SOCIAL_ECHO_MAX_LINES,
  SOCIAL_ECHO_MAX_TAGS,
  SOCIAL_ECHO_MENTION_LIMIT,
  SOCIAL_ECHO_TITLE_LIMIT,
  type SocialDecisionEchoModel,
  type SocialEchoDomain,
  type SocialEchoVisibility,
} from './socialEchoTypes';

export const SOCIAL_ECHO_FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'kriz başladı',
  'felaket',
  'skandal',
  'kesin doğru seçim',
  'bunu yap',
  'en iyi seçenek',
  'rank up',
] as const;

const PANIC_PHRASES = [
  'felaket',
  'panik',
  'kriz başladı',
  'kaos',
  'skandal',
  'alarm ver',
  'felakete',
] as const;

export function validateSocialEchoTextLength(model: SocialDecisionEchoModel): string[] {
  const issues: string[] = [];
  if (model.title.length > SOCIAL_ECHO_TITLE_LIMIT) {
    issues.push(`title>${SOCIAL_ECHO_TITLE_LIMIT}`);
  }
  if (model.mention.length > SOCIAL_ECHO_MENTION_LIMIT) {
    issues.push(`mention>${SOCIAL_ECHO_MENTION_LIMIT}`);
  }
  if (model.tags.length > SOCIAL_ECHO_MAX_TAGS) {
    issues.push(`tags>${SOCIAL_ECHO_MAX_TAGS}`);
  }
  if (model.maxLines > SOCIAL_ECHO_MAX_LINES) {
    issues.push(`maxLines>${SOCIAL_ECHO_MAX_LINES}`);
  }
  return issues;
}

export function validateSocialEchoForbiddenWords(model: SocialDecisionEchoModel): string[] {
  const haystack = `${model.title} ${model.mention} ${model.tags.join(' ')}`.toLowerCase();
  const hits: string[] = [];
  if (/\bxp\b/.test(haystack)) hits.push('xp');
  for (const word of SOCIAL_ECHO_FORBIDDEN_WORDS) {
    if (haystack.includes(word)) hits.push(word);
  }
  return hits;
}

export function validateSocialEchoNoPanicLanguage(model: SocialDecisionEchoModel): string[] {
  const haystack = `${model.title} ${model.mention}`.toLowerCase();
  return PANIC_PHRASES.filter((p) => haystack.includes(p));
}

export function validateSocialEchoDayVisibility(
  model: SocialDecisionEchoModel,
  day: number,
): string[] {
  const issues: string[] = [];
  if (day === 1 && model.visibility === 'highlighted') {
    issues.push('day1-no-highlight');
  }
  if (day === 7 && model.visibility === 'highlighted') {
    issues.push('day7-no-highlight');
  }
  if (day > 7 && model.source !== 'fallback') {
    issues.push('post-pilot-fallback-only');
  }
  return issues;
}

function normalizeForCompare(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isNearDuplicate(a: string, b: string): boolean {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const minLen = Math.min(na.length, nb.length);
  if (minLen >= 20) {
    const slice = na.slice(0, 20);
    if (nb.includes(slice) || na.includes(nb.slice(0, 20))) return true;
  }
  return false;
}

export function validateSocialEchoNoDuplicateWithCarryOver(
  model: SocialDecisionEchoModel,
  carryOver?: { summary?: string; title?: string } | null,
): boolean {
  if (!carryOver?.summary?.trim()) return true;
  return !isNearDuplicate(model.mention, carryOver.summary);
}

export function validateSocialEchoNoDuplicateWithResultEcho(
  model: SocialDecisionEchoModel,
  resultEcho?: string | null,
): boolean {
  if (!resultEcho?.trim()) return true;
  return !isNearDuplicate(model.mention, resultEcho);
}

export function validateSocialEchoDomainCoverage(): boolean {
  const required: SocialEchoDomain[] = [
    'container',
    'vehicle_route',
    'personnel',
    'social',
    'crisis_adjacent',
    'district_balance',
    'generic_operation',
  ];
  return required.every((d) => SOCIAL_ECHO_DOMAINS.includes(d));
}

export function validateSocialEchoModel(model: SocialDecisionEchoModel): {
  ok: boolean;
  issues: string[];
} {
  const issues = [
    ...validateSocialEchoTextLength(model),
    ...validateSocialEchoForbiddenWords(model),
    ...validateSocialEchoNoPanicLanguage(model),
  ];
  if (!model.id?.trim()) issues.push('missing-id');
  if (!model.title?.trim()) issues.push('missing-title');
  if (!model.mention?.trim()) issues.push('missing-mention');
  return { ok: issues.length === 0, issues };
}

export function validateSocialEchoAgainstCarryOverModel(
  model: SocialDecisionEchoModel,
  carryOver?: CarryOverMemoryModel | null,
): boolean {
  if (!carryOver) return true;
  return validateSocialEchoNoDuplicateWithCarryOver(model, carryOver);
}
