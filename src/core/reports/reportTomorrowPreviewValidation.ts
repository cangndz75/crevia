import type {
  ReportTomorrowPreviewDomain,
  ReportTomorrowPreviewModel,
} from './reportTomorrowPreviewTypes';
import { REPORT_TOMORROW_PREVIEW_DOMAINS } from './reportTomorrowPreviewTypes';

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
  'en iyi seçenek',
] as const;

const PANIC_WORDS = ['felaket', 'kriz başladı', 'skandal', 'panik'] as const;

export function validateReportTomorrowPreviewModel(
  model: ReportTomorrowPreviewModel | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!model) return errors;
  if (!model.id.trim()) errors.push('id empty');
  if (!model.title.trim()) errors.push('title empty');
  if (!model.summary.trim()) errors.push('summary empty');
  if (model.maxLines > 2) errors.push('maxLines > 2');
  if (!REPORT_TOMORROW_PREVIEW_DOMAINS.includes(model.domain)) {
    errors.push('invalid domain');
  }
  return errors;
}

export function validateReportTomorrowPreviewTextLength(
  model: ReportTomorrowPreviewModel,
): string[] {
  const errors: string[] = [];
  if (model.title.length > 32) errors.push('title too long');
  if (model.summary.length > 150) errors.push('summary too long');
  if (model.detail && model.detail.length > 200) errors.push('detail too long');
  const tagCount = 1 + (model.secondaryTag ? 1 : 0);
  if (tagCount > 2) errors.push('too many tags');
  return errors;
}

export function validateReportTomorrowPreviewForbiddenWords(
  model: ReportTomorrowPreviewModel,
): string[] {
  const errors: string[] = [];
  const haystack = `${model.title} ${model.summary} ${model.detail ?? ''}`.toLowerCase();
  for (const word of FORBIDDEN) {
    if (haystack.includes(word)) errors.push(`forbidden: ${word}`);
  }
  return errors;
}

export function validateReportTomorrowPreviewDayVisibility(
  model: ReportTomorrowPreviewModel,
  day: number,
): string[] {
  const errors: string[] = [];
  if (day === 1 && model.visibility !== 'hidden' && model.visibility !== 'compact') {
    errors.push('day1 should be hidden or compact');
  }
  if (day === 7 && model.visibility !== 'final_safe' && model.visibility !== 'compact') {
    errors.push('day7 should be final_safe or compact');
  }
  return errors;
}

export function validateReportTomorrowPreviewNoPanicLanguage(
  model: ReportTomorrowPreviewModel,
): string[] {
  const errors: string[] = [];
  const haystack = `${model.title} ${model.summary}`.toLowerCase();
  for (const word of PANIC_WORDS) {
    if (haystack.includes(word)) errors.push(`panic: ${word}`);
  }
  return errors;
}

export function normalizeReportTomorrowPreviewText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    .replace(/\s+/g, ' ');
}

export function validateReportTomorrowPreviewNoDuplicate(
  model: ReportTomorrowPreviewModel,
  lines: string[],
): string[] {
  const errors: string[] = [];
  const normalized = normalizeReportTomorrowPreviewText(model.summary);
  for (const line of lines) {
    const other = normalizeReportTomorrowPreviewText(line);
    if (!other) continue;
    if (normalized === other) {
      errors.push('duplicate summary');
      break;
    }
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) {
      errors.push('near duplicate summary');
      break;
    }
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) {
      errors.push('near duplicate summary');
      break;
    }
  }
  return errors;
}

export function validateReportTomorrowPreviewDomainCoverage(): boolean {
  const required: ReportTomorrowPreviewDomain[] = [
    'container',
    'vehicle_route',
    'personnel',
    'social',
    'crisis_adjacent',
    'district_balance',
    'generic_operation',
  ];
  return required.every((d) => REPORT_TOMORROW_PREVIEW_DOMAINS.includes(d));
}
