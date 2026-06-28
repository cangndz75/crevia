import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ReportReplayItem, ReportReplayPresentation, ReportReplayTone } from '@/core/reportReplay';
import { CreviaAnimatedLine } from '@/shared/motion';
import { gameUi } from '@/ui/theme/gameUiTokens';

type IconName = keyof typeof Ionicons.glyphMap;

type ReportDayFlowTimelineProps = {
  model: ReportReplayPresentation;
  day: number;
  reducedMotion?: boolean;
};

const TONE_COLORS: Record<ReportReplayTone, { accent: string; bg: string; border: string }> = {
  positive: {
    accent: gameUi.colors.mintPositive,
    bg: '#E6F6EA',
    border: 'rgba(62,158,106,0.18)',
  },
  mixed: {
    accent: gameUi.colors.amberCaution,
    bg: gameUi.colors.cardWarmTint,
    border: 'rgba(199,137,37,0.22)',
  },
  warning: {
    accent: gameUi.colors.amberCaution,
    bg: gameUi.colors.cardWarmTint,
    border: 'rgba(199,137,37,0.22)',
  },
  critical: {
    accent: '#C45A4A',
    bg: '#FBECEA',
    border: 'rgba(196,90,74,0.2)',
  },
  neutral: {
    accent: gameUi.colors.primaryTealMid,
    bg: gameUi.colors.cardWhite,
    border: gameUi.colors.borderSoft,
  },
  strategic: {
    accent: gameUi.colors.primaryTealDark,
    bg: gameUi.colors.cardMintTint,
    border: 'rgba(13,113,104,0.16)',
  },
};

function resolveIcon(name?: string): IconName {
  const allowed: IconName[] = [
    'flash-outline',
    'git-branch-outline',
    'walk-outline',
    'pulse-outline',
    'chatbubbles-outline',
    'construct-outline',
    'flag-outline',
    'person-outline',
    'alert-circle-outline',
    'sunny-outline',
    'time-outline',
  ];
  if (name && allowed.includes(name as IconName)) return name as IconName;
  return 'ellipse-outline';
}

function TimelineItem({
  item,
  index,
  isLast,
  day,
  reducedMotion,
}: {
  item: ReportReplayItem;
  index: number;
  isLast: boolean;
  day: number;
  reducedMotion?: boolean;
}) {
  const colors = TONE_COLORS[item.tone];

  return (
    <View style={styles.itemRow}>
      <View style={styles.railCol}>
        <View style={[styles.dot, { borderColor: colors.accent, backgroundColor: colors.bg }]} />
        {!isLast ? <View style={styles.railLine} /> : null}
      </View>
      <CreviaAnimatedLine
        surface="report"
        index={index + 1}
        day={day}
        reducedMotion={reducedMotion}
        containerStyle={styles.itemContent}>
        <View style={[styles.itemCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <Ionicons name={resolveIcon(item.icon)} size={14} color={colors.accent} />
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            {item.timeLabel ? (
              <Text style={styles.timeLabel} numberOfLines={1}>
                {item.timeLabel}
              </Text>
            ) : null}
          </View>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.itemFooter}>
            <View style={[styles.sourcePill, { borderColor: colors.border }]}>
              <Text style={[styles.sourcePillText, { color: colors.accent }]} numberOfLines={1}>
                {item.sourceLabel}
              </Text>
            </View>
            {item.chips?.[0] ? (
              <Text style={styles.chipText} numberOfLines={1}>
                {item.chips[0].value ?? item.chips[0].label}
              </Text>
            ) : null}
          </View>
        </View>
      </CreviaAnimatedLine>
    </View>
  );
}

export function ReportDayFlowTimeline({
  model,
  day,
  reducedMotion = false,
}: ReportDayFlowTimelineProps) {
  if (model.items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {model.subtitle}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillText} numberOfLines={1}>
            {model.countLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.summary} numberOfLines={2}>
        {model.summary}
      </Text>
      <View style={styles.timeline}>
        {model.items.map((item, index) => (
          <TimelineItem
            key={item.id}
            item={item}
            index={index}
            isLast={index === model.items.length - 1}
            day={day}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: gameUi.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: gameUi.colors.textMuted,
  },
  countPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    backgroundColor: gameUi.colors.cardWhite,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countPillText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: gameUi.colors.primaryTealMid,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: gameUi.colors.textMuted,
  },
  timeline: {
    gap: 0,
    minWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  railCol: {
    width: 14,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 14,
  },
  railLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(13,113,104,0.14)',
    marginTop: 4,
    marginBottom: -4,
    minHeight: 24,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 10,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  timeLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: gameUi.colors.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  sourcePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '58%',
  },
  sourcePillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  chipText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
});
