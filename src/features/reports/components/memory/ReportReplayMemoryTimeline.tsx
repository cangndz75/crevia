import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ReportReplayMemoryTimelineItem } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { CreviaAnimatedLine } from '@/shared/motion';
import { gameUi } from '@/ui/theme/gameUiTokens';

type IconName = keyof typeof Ionicons.glyphMap;

const TREND_ICON: Record<ReportReplayMemoryTimelineItem['trendDirection'], IconName> = {
  up: 'trending-up',
  down: 'trending-down',
  flat: 'remove-outline',
  mixed: 'swap-vertical-outline',
};

type Props = {
  items: ReportReplayMemoryTimelineItem[];
  day: number;
  collapsedLabel?: string | null;
  reducedMotion?: boolean;
};

function resolveIcon(name: string): IconName {
  const allowed: IconName[] = [
    'git-branch-outline',
    'heart-outline',
    'wallet-outline',
    'trending-up-outline',
    'chatbubbles-outline',
    'shield-checkmark-outline',
    'flash-outline',
    'sparkles-outline',
    'link-outline',
    'construct-outline',
    'people-outline',
    'flag-outline',
    'ellipse-outline',
  ];
  if (allowed.includes(name as IconName)) return name as IconName;
  return 'ellipse-outline';
}

export function ReportReplayMemoryTimeline({
  items,
  day,
  collapsedLabel,
  reducedMotion,
}: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title} numberOfLines={1}>
        Şehir hafıza zaman çizgisi
      </Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <CreviaAnimatedLine
            key={item.id}
            surface="report"
            index={index + 1}
            day={day}
            reducedMotion={reducedMotion}
            containerStyle={styles.itemRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={resolveIcon(item.icon)} size={14} color={gameUi.colors.primaryTealMid} />
            </View>
            <View style={styles.itemBody}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.dayLabel} numberOfLines={1}>
                  {item.dayLabel}
                </Text>
              </View>
              <View style={styles.itemFooter}>
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {item.impactChip}
                  </Text>
                </View>
                <Ionicons
                  name={TREND_ICON[item.trendDirection]}
                  size={12}
                  color={gameUi.colors.textMuted}
                />
              </View>
            </View>
          </CreviaAnimatedLine>
        ))}
      </View>
      {collapsedLabel ? (
        <Text style={styles.collapsedLabel} numberOfLines={1}>
          {collapsedLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8, minWidth: 0 },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  list: { gap: 6 },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: gameUi.colors.cardMintTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemBody: { flex: 1, minWidth: 0, gap: 4 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: gameUi.colors.textPrimary,
  },
  dayLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardMintTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '75%',
  },
  chipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.primaryTealMid,
  },
  collapsedLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
