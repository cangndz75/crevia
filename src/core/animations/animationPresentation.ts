import { ANIMATION_PRESET_DEFINITIONS as presets } from './animationPresetDefinitions';
import { ANIMATION_DURATION, MAX_ANIMATION_DURATION_MS } from './animationTokens';

/** Aşama 1 — animasyon uygulanan bileşenler (kapsam dışına çıkılmamalı). */
export const STAGE1_ANIMATED_COMPONENTS = [
  'HubCriticalEventCard',
  'HubDailyGoalCard',
  'PostPilotAgendaBanner',
  'DispatchWorkflowFooter',
  'FieldWorkflowFooter',
  'ReportScreen',
  'ReportBadgeSummary',
  'ReportAuthoritySummary',
  'EventResultHeroCard',
  'MapPin',
  'LeaderboardPodiumStrip',
  'ProfileBadgeShowcaseCard',
] as const;

export type Stage1AnimatedComponent = (typeof STAGE1_ANIMATED_COMPONENTS)[number];

const FORBIDDEN_ANIMATION_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

const POSITIVE_AUTHORITY_MARKERS = [
  'arttı',
  'artti',
  'yüksel',
  'yuksel',
  'güçlendi',
  'guclendi',
  'açıldı',
  'acildi',
  'ilerleme',
  'olumlu',
] as const;

export function allAnimationDurationsUnderCap(): boolean {
  return Object.values(ANIMATION_DURATION).every((ms) => ms < MAX_ANIMATION_DURATION_MS);
}

export function pressScalePresetMinScaleSafe(): boolean {
  const min = presets.pressScale.minScale ?? 1;
  return min >= 0.95;
}

export function selectedPulsePresetHasLoopGuard(): boolean {
  return presets.selectedPulse.endlessLoop === false;
}

export function assertNoAnimationPresentationForbiddenWords(text: string): number {
  const lower = text.toLowerCase();
  return FORBIDDEN_ANIMATION_WORDS.filter((word) => lower.includes(word)).length;
}

export function collectAnimationPresentationStrings(): string[] {
  return [
    ...STAGE1_ANIMATED_COMPONENTS,
    ...Object.keys(presets),
    'Ekibi Sahaya Çıkar',
    'Sonucu Gör',
    'Operasyon Merkezine Dön',
    'Gündemi İncele',
    'Ana Operasyona Göz At',
    'Operasyon Gündemini Başlat',
  ];
}

export function isPositiveAuthorityGainSummary(lines: string[]): boolean {
  if (lines.length === 0) return false;
  const blob = lines.join(' ').toLocaleLowerCase('tr-TR');
  return POSITIVE_AUTHORITY_MARKERS.some((marker) => blob.includes(marker));
}

export function isStage1ComponentAllowed(name: string): boolean {
  return (STAGE1_ANIMATED_COMPONENTS as readonly string[]).includes(name);
}

export function resolvePressScaleNoOp(
  disabled = false,
  reduceMotion = false,
): boolean {
  return disabled || reduceMotion;
}
