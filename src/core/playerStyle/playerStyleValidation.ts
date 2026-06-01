import type { PlayerStyleObservation, PlayerStyleProfile } from './playerStyleTypes';
import { PLAYER_STYLE_IDS, PLAYER_STYLE_SIGNAL_KINDS } from './playerStyleTypes';
import {
  ADVISOR_LINE_LIMIT,
  RISK_LIMIT,
  SHORT_LABEL_LIMIT,
  STRENGTH_LIMIT,
  SUMMARY_LIMIT,
  TITLE_LIMIT,
} from './playerStylePresentation';

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

const JUDGEMENT_WORDS = ['yanlış oynuyorsun', 'başarısızsın', 'berbat', 'kötü yönetici'] as const;

export function validatePlayerStyleProfile(profile: PlayerStyleProfile | null | undefined): string[] {
  const errors: string[] = [];
  if (!profile) return errors;
  if (!profile.title.trim()) errors.push('title empty');
  if (!profile.advisorLine.trim()) errors.push('advisorLine empty');
  if (!PLAYER_STYLE_IDS.includes(profile.styleId)) errors.push('invalid styleId');
  return errors;
}

export function validatePlayerStyleTextLength(profile: PlayerStyleProfile): string[] {
  const errors: string[] = [];
  if (profile.title.length > TITLE_LIMIT) errors.push('title too long');
  if (profile.shortLabel.length > SHORT_LABEL_LIMIT) errors.push('shortLabel too long');
  if (profile.summary.length > SUMMARY_LIMIT) errors.push('summary too long');
  if (profile.advisorLine.length > ADVISOR_LINE_LIMIT + 60) errors.push('advisorLine too long');
  if (profile.strengthLine.length > STRENGTH_LIMIT) errors.push('strength too long');
  if (profile.riskLine && profile.riskLine.length > RISK_LIMIT) errors.push('risk too long');
  if (profile.tags.length > 2) errors.push('too many tags');
  return errors;
}

export function validatePlayerStyleForbiddenWords(profile: PlayerStyleProfile): string[] {
  const errors: string[] = [];
  const haystack =
    `${profile.title} ${profile.summary} ${profile.advisorLine} ${profile.strengthLine} ${profile.riskLine ?? ''}`.toLowerCase();
  for (const word of FORBIDDEN) {
    if (haystack.includes(word)) errors.push(`forbidden: ${word}`);
  }
  return errors;
}

export function validatePlayerStyleNoJudgementLanguage(profile: PlayerStyleProfile): string[] {
  const errors: string[] = [];
  const haystack = `${profile.advisorLine} ${profile.summary}`.toLowerCase();
  for (const word of JUDGEMENT_WORDS) {
    if (haystack.includes(word)) errors.push(`judgement: ${word}`);
  }
  return errors;
}

export function validatePlayerStyleDayVisibility(profile: PlayerStyleProfile, day: number): string[] {
  const errors: string[] = [];
  if (day === 1 && profile.visible) errors.push('day1 should be hidden');
  return errors;
}

export function validatePlayerStyleConfidence(profile: PlayerStyleProfile): string[] {
  const errors: string[] = [];
  if (profile.confidence === 'none' && profile.styleId !== 'unknown' && profile.score > 10) {
    errors.push('confidence mismatch');
  }
  return errors;
}

export function validatePlayerStyleObservationWeights(observations: PlayerStyleObservation[]): string[] {
  const errors: string[] = [];
  for (const obs of observations) {
    if (obs.weight <= 0 || obs.weight > 5) errors.push(`invalid weight ${obs.id}`);
    if (!PLAYER_STYLE_SIGNAL_KINDS.includes(obs.kind)) errors.push(`invalid kind ${obs.id}`);
  }
  return errors;
}

export function validatePlayerStyleIdCoverage(): string[] {
  const errors: string[] = [];
  if (PLAYER_STYLE_IDS.length < 8) errors.push('style id coverage incomplete');
  return errors;
}
