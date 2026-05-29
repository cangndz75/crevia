import { POST_PILOT_FORBIDDEN_WORDS } from './postPilotOperationConstants';

export const MAX_POST_PILOT_ACTIVE_EVENTS = 2;
export const POST_PILOT_ANCHOR_COUNT = 1;
export const POST_PILOT_SIDE_COUNT = 1;
export const POST_PILOT_FIRST_OPERATION_DAY = 8;

export const POST_PILOT_EVENT_FORBIDDEN_WORDS = [
  ...POST_PILOT_FORBIDDEN_WORDS,
  'level up',
  'rank up',
  'xp',
  'kilit',
  'satın al',
  'paywall',
  'premium',
  'yetkin yetersiz',
] as const;

/** 3 günlük simülasyonda authority toplam gain üst sınırı (WARN). */
export const POST_PILOT_AUDIT_AUTHORITY_GAIN_WARN_3D = 100;

/** 3 günlük simülasyonda kazanılan rozet üst sınırı (WARN). */
export const POST_PILOT_AUDIT_BADGE_COUNT_WARN_3D = 6;
