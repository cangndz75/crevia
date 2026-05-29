import type { HubQuickActionCardModel, HubQuickActionId } from '@/core/hubQuickActions';
import type { LiveFlowEntry } from '@/core/liveFlow';

export type HubQuickActionPreviewStyle = {
  title: string;
  teaser: string;
  accent: string;
  gradient: readonly [string, string];
  imageKey: 'team' | 'route' | 'maint' | 'announce';
};

export const HUB_QUICK_ACTION_PREVIEW: Record<
  HubQuickActionId,
  HubQuickActionPreviewStyle
> = {
  field_duty: {
    title: 'Saha Nöbeti',
    teaser: 'Ekip hazırlığı',
    accent: '#157A76',
    gradient: ['#E8F8F5', '#D4F0EB'],
    imageKey: 'team',
  },
  route_preparation: {
    title: 'Rota Hazırlığı',
    teaser: 'Araç & rota',
    accent: '#1D4E89',
    gradient: ['#EEF4FC', '#DCE8F8'],
    imageKey: 'route',
  },
  neighborhood_patrol: {
    title: 'Mahalle Turu',
    teaser: 'Saha kontrolü',
    accent: '#2D7A4F',
    gradient: ['#EDF8F1', '#D8EFE3'],
    imageKey: 'maint',
  },
  social_response: {
    title: 'Sosyal Yanıt',
    teaser: 'Gündem yanıtı',
    accent: '#6B4C9A',
    gradient: ['#F3EEF9', '#E8DFF5'],
    imageKey: 'announce',
  },
};

export const DAY1_PLAN_STEPS = [
  { label: 'Olayı incele', icon: 'search-outline' as const },
  { label: 'Karar ver', icon: 'git-branch-outline' as const },
  { label: 'Akışı takip et', icon: 'pulse-outline' as const },
] as const;

export const HUB_TODAY_FLOW_MAX_LINES = 3;
export const HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT = 84;
export const HUB_QUICK_ACTION_PREVIEW_TILE_WIDTH = 100;
export const HUB_QUICK_ACTION_PREVIEW_TILE_HEIGHT = 88;

export const DAY1_PLAN_TITLE = 'Bugünkü Plan';
export const DAY1_PLAN_BODY = 'İlk gün hedefin: temel müdahaleyi öğrenmek.';
export const DAY1_PLAN_CHIP = 'Öğrenme Günü';

export const DAY1_QUICK_PREP_TITLE = 'Hızlı Hazırlıklar';
export const HUB_QUICK_ACTIONS_TITLE = 'Hızlı aksiyonlar';
export const DAY1_QUICK_PREP_SUBTITLE =
  "Gün 2'den itibaren günlük hazırlık hamleleri açılır.";

export const DAY1_FLOW_TIMELINE_PREVIEW_LINES = [
  'Karar uygulandı, olay gün sonu raporuna aktarılacak.',
  'İlk olay hazır: Merkez’de temel müdahale bekliyor.',
] as const;

export const DAY1_FLOW_PLACEHOLDER_LINE =
  'İlk olayını inceledikten sonra gelişmeler burada görünecek.';

export type HubQuickActionsLayoutMode = 'locked-rail' | 'compact-rail';

export function areAllHubQuickActionsLocked(
  cards: HubQuickActionCardModel[],
): boolean {
  return cards.length > 0 && cards.every((c) => c.status === 'disabled');
}

export function resolveHubQuickActionsLayoutMode(
  cards: HubQuickActionCardModel[],
  day1Disabled: boolean,
): HubQuickActionsLayoutMode {
  if (day1Disabled || areAllHubQuickActionsLocked(cards)) {
    return 'locked-rail';
  }
  return 'compact-rail';
}

export function clampHubTodayFlowLines(
  lines: LiveFlowEntry[],
  max = HUB_TODAY_FLOW_MAX_LINES,
): LiveFlowEntry[] {
  return lines.slice(0, max);
}
