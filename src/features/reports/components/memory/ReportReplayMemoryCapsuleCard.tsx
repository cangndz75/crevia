import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayMemoryCapsule } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { CreviaAnimatedLine } from '@/shared/motion';
import { gameUi } from '@/ui/theme/gameUiTokens';

const CHIP_COLORS = {
  positive: { bg: '#E6F6EA', text: gameUi.colors.mintPositive, border: 'rgba(62,158,106,0.2)' },
  neutral: { bg: gameUi.colors.cardWhite, text: gameUi.colors.textMuted, border: gameUi.colors.borderSoft },
  warning: { bg: gameUi.colors.cardWarmTint, text: gameUi.colors.amberCaution, border: 'rgba(199,137,37,0.22)' },
  teal: { bg: gameUi.colors.cardMintTint, text: gameUi.colors.primaryTealMid, border: 'rgba(13,113,104,0.16)' },
  mixed: { bg: '#E8F2FA', text: '#327EA8', border: 'rgba(50,126,168,0.2)' },
};

type Props = {
  capsule: ReportReplayMemoryCapsule;
  index: number;
  day: number;
  reducedMotion?: boolean;
};

export function ReportReplayMemoryCapsuleCard({ capsule, index, day, reducedMotion }: Props) {
  const [expanded, setExpanded] = useState(false);
  const entering = reducedMotion ? undefined : FadeInUp.delay(40 + index * 30).duration(240).springify().damping(24);

  return (
    <Animated.View entering={entering} style={styles.wrap}>
      <Pressable
        onPress={() => capsule.expandable && setExpanded((v) => !v)}
        style={({ pressed }) => [styles.card, pressed && capsule.expandable ? styles.cardPressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`${capsule.dayLabel}: ${capsule.headline}`}
        accessibilityState={{ expanded }}>
        <View style={styles.header}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{capsule.dayLabel}</Text>
          </View>
          <Text style={styles.tone} numberOfLines={1}>
            {capsule.closingTone}
          </Text>
        </View>

        <Text style={styles.headline} numberOfLines={2}>
          {capsule.headline}
        </Text>

        <View style={styles.chipRow}>
          {capsule.impactChips.map((chip) => {
            const colors = CHIP_COLORS[chip.tone] ?? CHIP_COLORS.neutral;
            return (
              <View key={chip.key} style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                  {chip.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          {capsule.decisionBadge ? (
            <View style={styles.decisionBadge}>
              <Ionicons name="git-branch-outline" size={11} color={gameUi.colors.primaryTealMid} />
              <Text style={styles.decisionBadgeText} numberOfLines={1}>
                {capsule.decisionBadge}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {capsule.expandable ? (
            <View style={styles.affordance}>
              <Text style={styles.affordanceText}>{expanded ? 'Kapat' : capsule.detailAffordance}</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={gameUi.colors.primaryTealMid}
              />
            </View>
          ) : null}
        </View>

        {expanded && capsule.detail ? (
          <CreviaAnimatedLine surface="report" index={index} day={day} reducedMotion={reducedMotion} containerStyle={styles.detail}>
            <Text style={styles.detailLine} numberOfLines={2}>
              {capsule.detail.decisionStoryLine}
            </Text>
            {capsule.detail.neighborhoodLine ? (
              <Text style={styles.detailMuted} numberOfLines={2}>
                {capsule.detail.neighborhoodLine}
              </Text>
            ) : null}
            <View style={styles.detailTradeoff}>
              {capsule.detail.tradeoffGain ? (
                <Text style={styles.detailGain} numberOfLines={1}>
                  + {capsule.detail.tradeoffGain}
                </Text>
              ) : null}
              {capsule.detail.tradeoffCost ? (
                <Text style={styles.detailCost} numberOfLines={1}>
                  − {capsule.detail.tradeoffCost}
                </Text>
              ) : null}
            </View>
            {capsule.detail.tomorrowEcho ? (
              <Text style={styles.detailMuted} numberOfLines={2}>
                {capsule.detail.tomorrowEcho}
              </Text>
            ) : null}
          </CreviaAnimatedLine>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 0 },
  card: {
    backgroundColor: gameUi.colors.cardWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: 0,
  },
  cardPressed: { opacity: 0.94 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayPill: {
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardMintTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayPillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: gameUi.colors.primaryTealMid,
  },
  tone: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  headline: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '48%',
  },
  chipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  decisionBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.primaryTealMid,
    flex: 1,
  },
  affordance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  affordanceText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.primaryTealMid,
  },
  detail: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: gameUi.colors.borderSoft,
  },
  detailLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: gameUi.colors.textPrimary,
  },
  detailMuted: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: gameUi.colors.textMuted,
  },
  detailTradeoff: { gap: 2 },
  detailGain: {
    fontSize: 11,
    fontWeight: '700',
    color: gameUi.colors.mintPositive,
  },
  detailCost: {
    fontSize: 11,
    fontWeight: '700',
    color: gameUi.colors.amberCaution,
  },
});
