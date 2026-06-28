import type { ReportReplayItem, ReportReplayPresentation } from '@/core/reportReplay';
import { buildReportReplayPresentation } from '@/core/reportReplay';
import type { ReportReplayContextInput } from '@/core/reportReplay';

export type ClosureReplayTimelineItem = {
  id: string;
  title: string;
  impactChip: string;
  impactTone: 'positive' | 'neutral' | 'warning' | 'mixed';
  icon: string;
  timeLabel?: string;
};

export type EndOfDayReplayTimelinePresentation = {
  visible: boolean;
  title: string;
  items: ClosureReplayTimelineItem[];
  overflowCount: number;
  collapsedLabel?: string;
};

const MAX_PRIMARY = 5;
const MIN_ITEMS = 3;

function mapReplayTone(
  tone: ReportReplayItem['tone'],
): ClosureReplayTimelineItem['impactTone'] {
  if (tone === 'positive') return 'positive';
  if (tone === 'warning' || tone === 'critical') return 'warning';
  if (tone === 'mixed') return 'mixed';
  return 'neutral';
}

function mapReplayItem(item: ReportReplayItem): ClosureReplayTimelineItem {
  const chip =
    item.chips?.[0]?.value ??
    item.chips?.[0]?.label ??
    item.sourceLabel;

  return {
    id: item.id,
    title: item.title,
    impactChip: chip,
    impactTone: mapReplayTone(item.tone),
    icon: item.icon ?? 'ellipse-outline',
    timeLabel: item.timeLabel,
  };
}

export function buildEndOfDayReplayTimelinePresentation(
  input: ReportReplayContextInput & { day: number; isDay1?: boolean },
): EndOfDayReplayTimelinePresentation {
  const replay = buildReportReplayPresentation(input);
  const maxItems = input.isDay1 ? 3 : MAX_PRIMARY;
  const primary = replay.items.slice(0, maxItems).map(mapReplayItem);

  const items =
    primary.length >= MIN_ITEMS
      ? primary
      : replay.items.slice(0, MIN_ITEMS).map(mapReplayItem);

  const overflowCount = Math.max(0, replay.items.length - items.length);

  return {
    visible: items.length > 0,
    title: replay.title,
    items,
    overflowCount,
    collapsedLabel:
      overflowCount > 0 ? `+${overflowCount} an daha` : undefined,
  };
}

export type { ReportReplayContextInput };
