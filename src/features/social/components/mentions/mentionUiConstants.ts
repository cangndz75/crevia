import type { LiveMentionCategory } from '../../utils/socialUiModel';

export type MentionFilterKey = 'all' | 'complaint' | 'praise' | 'crisis';

export const MENTION_FILTER_OPTIONS: {
  key: MentionFilterKey;
  label: string;
  icon: 'grid' | 'warning' | 'heart' | 'flash';
}[] = [
  { key: 'all', label: 'Tümü', icon: 'grid' },
  { key: 'complaint', label: 'Şikayet', icon: 'warning' },
  { key: 'praise', label: 'Teşekkür', icon: 'heart' },
  { key: 'crisis', label: 'Kriz', icon: 'flash' },
];

export const MENTION_ACCENT = {
  purple: '#8B5CF6',
  purpleMuted: '#F3EEFF',
  purpleRing: 'rgba(139, 92, 246, 0.35)',
  title: '#4C1D95',
  subtitle: '#6B7280',
} as const;

export const MENTION_CATEGORY_THEME: Record<
  LiveMentionCategory,
  {
    border: string;
    avatarBg: string;
    avatarFg: string;
    chipBg: string;
    chipFg: string;
    statusDot: string;
  }
> = {
  complaint: {
    border: '#F87171',
    avatarBg: '#FEE2E2',
    avatarFg: '#EF4444',
    chipBg: '#FEE2E2',
    chipFg: '#DC2626',
    statusDot: '#34D399',
  },
  praise: {
    border: '#34D399',
    avatarBg: '#D1FAE5',
    avatarFg: '#059669',
    chipBg: '#D1FAE5',
    chipFg: '#047857',
    statusDot: '#34D399',
  },
  crisis: {
    border: '#FB923C',
    avatarBg: '#FFEDD5',
    avatarFg: '#EA580C',
    chipBg: '#FFEDD5',
    chipFg: '#C2410C',
    statusDot: '#FB923C',
  },
  opportunity: {
    border: '#8B5CF6',
    avatarBg: '#EDE9FE',
    avatarFg: '#7C3AED',
    chipBg: '#EDE9FE',
    chipFg: '#6D28D9',
    statusDot: '#8B5CF6',
  },
  rumor: {
    border: '#FBBF24',
    avatarBg: '#FEF3C7',
    avatarFg: '#D97706',
    chipBg: '#FEF3C7',
    chipFg: '#B45309',
    statusDot: '#FBBF24',
  },
  question: {
    border: '#60A5FA',
    avatarBg: '#DBEAFE',
    avatarFg: '#2563EB',
    chipBg: '#DBEAFE',
    chipFg: '#1D4ED8',
    statusDot: '#60A5FA',
  },
  neutral: {
    border: '#9CA3AF',
    avatarBg: '#F3F4F6',
    avatarFg: '#6B7280',
    chipBg: '#F3F4F6',
    chipFg: '#4B5563',
    statusDot: '#9CA3AF',
  },
};

export const FILTER_CIRCLE_THEME: Record<
  MentionFilterKey,
  { bg: string; fg: string; ring?: string }
> = {
  all: { bg: '#EDE9FE', fg: MENTION_ACCENT.purple, ring: MENTION_ACCENT.purple },
  complaint: { bg: '#FEE2E2', fg: '#EF4444' },
  praise: { bg: '#D1FAE5', fg: '#059669' },
  crisis: { bg: '#FFEDD5', fg: '#EA580C' },
};

export function matchesMentionFilter(
  category: LiveMentionCategory,
  filter: MentionFilterKey,
): boolean {
  if (filter === 'all') return true;
  return category === filter;
}
