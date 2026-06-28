import type { ReportReplayTone } from '@/core/reportReplay';

export type MemoryChipTone = 'positive' | 'neutral' | 'warning' | 'teal' | 'mixed';

export type MemoryImpactChip = {
  key: string;
  label: string;
  tone: MemoryChipTone;
};

export type MemoryCapsuleDetail = {
  decisionStoryLine: string;
  neighborhoodLine?: string | null;
  tradeoffGain?: string | null;
  tradeoffCost?: string | null;
  tomorrowEcho?: string | null;
};

export type ReportReplayMemoryCapsule = {
  id: string;
  day: number;
  dayLabel: string;
  closingTone: string;
  headline: string;
  impactChips: MemoryImpactChip[];
  decisionBadge: string | null;
  detailAffordance: string;
  expandable: boolean;
  detail: MemoryCapsuleDetail | null;
  dedupeKey: string;
};

export type ReportReplayMemoryTimelineItem = {
  id: string;
  icon: string;
  title: string;
  dayLabel: string;
  impactChip: string;
  trendDirection: 'up' | 'down' | 'flat' | 'mixed';
  tone: ReportReplayTone;
  priority: number;
  dedupeKey: string;
};

export type ReportReplayStylePattern = {
  visible: boolean;
  mainLine: string;
  styleChips: MemoryImpactChip[];
};

export type ReportReplayDistrictMemory = {
  visible: boolean;
  districtName: string;
  signalLine: string;
  chips: MemoryImpactChip[];
  trendDirection: 'up' | 'down' | 'flat';
};

export type ReportReplayTradeoffHistory = {
  visible: boolean;
  balanceLabel: string;
  balanceRatio: number;
  gains: MemoryImpactChip[];
  costs: MemoryImpactChip[];
};

export type ReportReplayTodayBridge = {
  visible: boolean;
  signalLine: string;
  tone: MemoryChipTone;
};

export type ReportReplayMemoryHero = {
  title: string;
  subtitle: string;
  summaryLine: string;
  memoryBadge: string;
  badgeTone: MemoryChipTone;
};

export type ReportReplayMemoryEmptyState = {
  visible: boolean;
  title: string;
  body: string;
  ctaLabel: string;
};

export type ReportReplayMemoryPresentation = {
  isDay1: boolean;
  isEmergingMemory: boolean;
  isRichMemory: boolean;
  hero: ReportReplayMemoryHero;
  emptyState: ReportReplayMemoryEmptyState | null;
  capsules: ReportReplayMemoryCapsule[];
  hiddenCapsuleCount: number;
  expandAllLabel: string | null;
  timeline: {
    visible: boolean;
    items: ReportReplayMemoryTimelineItem[];
    collapsedLabel: string | null;
  };
  stylePattern: ReportReplayStylePattern;
  districtMemory: ReportReplayDistrictMemory;
  tradeoffHistory: ReportReplayTradeoffHistory;
  todayBridge: ReportReplayTodayBridge;
  collectStrings: () => string[];
};
