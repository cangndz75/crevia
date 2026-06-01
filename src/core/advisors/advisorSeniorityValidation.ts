import type { AdvisorSeniorityModel } from './advisorSeniorityTypes';
import { ADVISOR_SENIORITY_CAPABILITIES, ADVISOR_SENIORITY_TIERS } from './advisorSeniorityTypes';
import {
  INSIGHT_LINE_LIMIT,
  SHORT_TITLE_LIMIT,
  SUMMARY_LINE_LIMIT,
  TITLE_LIMIT,
} from './advisorSeniorityPresentation';

const FORBIDDEN = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'en iyi seçenek',
  'bunu yap',
  'kesin doğru',
  'yanlış oynuyorsun',
  'başarısızsın',
  'xp',
  'rank up',
] as const;

const JUDGEMENT = ['yanlış oynuyorsun', 'başarısızsın', 'berbat yönetici'] as const;

export function validateAdvisorSeniorityModel(
  model: AdvisorSeniorityModel | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!model) return errors;
  if (!model.title.trim()) errors.push('title empty');
  if (!ADVISOR_SENIORITY_TIERS.includes(model.tier)) errors.push('invalid tier');
  return errors;
}

export function validateAdvisorSeniorityTextLength(model: AdvisorSeniorityModel): string[] {
  const errors: string[] = [];
  if (model.title.length > TITLE_LIMIT) errors.push('title too long');
  if (model.shortTitle.length > SHORT_TITLE_LIMIT) errors.push('shortTitle too long');
  if (model.summaryLine.length > SUMMARY_LINE_LIMIT) errors.push('summary too long');
  if (model.insightLine.length > INSIGHT_LINE_LIMIT + 40) errors.push('insight too long');
  if (model.capabilityLabels.length > 3) errors.push('too many capability labels');
  if (model.maxLines > 2) errors.push('maxLines > 2');
  return errors;
}

export function validateAdvisorSeniorityForbiddenWords(model: AdvisorSeniorityModel): string[] {
  const errors: string[] = [];
  const haystack =
    `${model.title} ${model.summaryLine} ${model.insightLine} ${model.capabilityLabels.join(' ')}`.toLowerCase();
  for (const word of FORBIDDEN) {
    if (haystack.includes(word)) errors.push(`forbidden: ${word}`);
  }
  return errors;
}

export function validateAdvisorSeniorityNoJudgementLanguage(model: AdvisorSeniorityModel): string[] {
  const errors: string[] = [];
  const haystack = `${model.insightLine} ${model.summaryLine}`.toLowerCase();
  for (const word of JUDGEMENT) {
    if (haystack.includes(word)) errors.push(`judgement: ${word}`);
  }
  return errors;
}

export function validateAdvisorSeniorityCapabilities(model: AdvisorSeniorityModel): string[] {
  const errors: string[] = [];
  for (const cap of model.unlockedCapabilities) {
    if (!ADVISOR_SENIORITY_CAPABILITIES.includes(cap)) errors.push(`invalid cap ${cap}`);
  }
  return errors;
}

export function validateAdvisorSeniorityDayVisibility(
  model: AdvisorSeniorityModel,
  day: number,
): string[] {
  const errors: string[] = [];
  if (day === 1 && model.tier !== 'trainee' && model.tier !== 'chief_advisor_preview') {
    if (day === 1 && model.tier === 'operations_specialist') errors.push('day1 too senior');
  }
  return errors;
}
