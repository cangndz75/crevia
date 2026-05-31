import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useShallow } from 'zustand/react/shallow';

import {
  formatHubQuickActionBanner,
  getHubQuickActionResultToneStyle,
  selectHubQuickActionCards,
  type HubQuickActionId,
  type HubQuickActionResult,
} from '@/core/hubQuickActions';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import {
  DAY1_LOCKED_QUICK_ACTION_DISPLAY,
  DAY1_LOCKED_QUICK_ACTION_ORDER,
  DAY1_QUICK_PREP_TITLE,
  HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
  HUB_QUICK_ACTION_PREVIEW,
  HUB_QUICK_ACTIONS_TITLE,
  resolveHubQuickActionsLayoutMode,
} from '@/features/hub/hubUiPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_LAYOUT,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { selectDay1TutorialEventId } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export function HubQuickActionsPanel() {
  const router = useRouter();
  const day1EventId = useGameStore(selectDay1TutorialEventId);
  const { hubQuickActionState, currentDay, day1Disabled, performHubQuickAction, lastResult } =
    useGameStore(
      useShallow((s) => ({
        hubQuickActionState: s.hubQuickActionState,
        currentDay: s.gameState.city.day,
        day1Disabled: s.gameState.city.day <= 1,
        performHubQuickAction: s.performHubQuickAction,
        lastResult: s.hubQuickActionState.lastResult,
      })),
    );

  const cards = useMemo(
    () =>
      selectHubQuickActionCards({
        hubQuickActionState,
        currentDay,
        day1Disabled,
      }),
    [currentDay, day1Disabled, hubQuickActionState],
  );

  const isLockedRail = resolveHubQuickActionsLayoutMode(cards, day1Disabled) === 'locked-rail';

  const visibleCards = useMemo(() => {
    if (!isLockedRail) {
      return cards;
    }
    const byId = new Map(cards.map((c) => [c.id, c]));
    return DAY1_LOCKED_QUICK_ACTION_ORDER.map((id) => byId.get(id)).filter(
      (c): c is (typeof cards)[number] => c != null,
    );
  }, [cards, isLockedRail]);

  const onPress = useCallback(
    (actionId: HubQuickActionId) => {
      if (isLockedRail) {
        playLightImpactHaptic();
        if (day1EventId) {
          router.push(`/events/${day1EventId}`);
        } else {
          Alert.alert(
            'Hızlı Hazırlıklar',
            "Gün 2'den itibaren açılır. Önce ilk olayı incele.",
          );
        }
        return;
      }
      performHubQuickAction(actionId);
    },
    [day1EventId, isLockedRail, performHubQuickAction, router],
  );

  const renderQuickActionTile = (
    card: (typeof cards)[number],
    lockedRail: boolean,
  ) => {
    const preview = HUB_QUICK_ACTION_PREVIEW[card.id];
    const lockedDisplay = DAY1_LOCKED_QUICK_ACTION_DISPLAY[card.id];
    const title = lockedRail && lockedDisplay ? lockedDisplay.title : preview.title;
    const teaser =
      lockedRail && lockedDisplay
        ? lockedDisplay.teaser
        : card.statusLabel || preview.teaser;
    const imageSource = hubAssets.quickActions[preview.imageKey];
    const disabled =
      !lockedRail && (card.status === 'disabled' || card.status === 'used');

    return (
      <Pressable
        key={card.id}
        onPress={() => onPress(card.id)}
        disabled={disabled}
        style={({ pressed }) => [
          lockedRail ? styles.tileRailWrap : styles.tileGridWrap,
          pressed && styles.tilePressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <LinearGradient
          colors={[...preview.gradient]}
          style={[
            styles.tile,
            lockedRail ? styles.tileRail : styles.tileGrid,
            hubPremiumShadowCard(),
          ]}>
          <View style={styles.tileRow}>
            <View style={styles.tileTextCol}>
              <Text
                style={styles.tileTitle}
                numberOfLines={1}
                ellipsizeMode="tail">
                {title}
              </Text>
              <Text
                style={[styles.tileTeaser, { color: preview.accent }]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {teaser}
              </Text>
            </View>
            <HubAssetImage
              source={imageSource}
              containerStyle={
                lockedRail ? styles.tileImageRail : styles.tileImageGrid
              }
              contentFit="contain"
            />
          </View>
          {lockedRail ? (
            <View style={styles.unlockRow}>
              <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.unlockText} numberOfLines={1}>
                Gün 2
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={16} color={HUB_PREMIUM_COLORS.gold} />
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {isLockedRail ? DAY1_QUICK_PREP_TITLE : HUB_QUICK_ACTIONS_TITLE}
          </Text>
          {isLockedRail ? (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Gün 2</Text>
            </View>
          ) : null}
        </View>
      </View>

      {lastResult ? <ResultBanner result={lastResult} /> : null}

      {isLockedRail ? (
        <View style={styles.row}>
          {visibleCards.map((card) => renderQuickActionTile(card, true))}
        </View>
      ) : (
        <View style={styles.grid}>
          {visibleCards.map((card) => renderQuickActionTile(card, false))}
        </View>
      )}
    </View>
  );
}

function ResultBanner({ result }: { result: HubQuickActionResult }) {
  const tone = getHubQuickActionResultToneStyle(result.tone);
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}>
      <Text style={[styles.bannerText, { color: tone.text }]} numberOfLines={2}>
        {formatHubQuickActionBanner(result)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingHorizontal: spacing.lg,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HUB_PREMIUM_LAYOUT.quickActionGridGap,
  },
  tileGridWrap: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '48%',
  },
  tileRailWrap: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    gap: HUB_PREMIUM_LAYOUT.quickActionGridGap,
  },
  dayBadge: {
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
    borderRadius: HUB_PREMIUM_RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.borderGold,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A7B28',
  },
  tile: {
    borderRadius: HUB_PREMIUM_RADIUS.quick,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 0,
  },
  tileRail: {
    minHeight: 120,
    justifyContent: 'space-between',
  },
  tileGrid: {
    minHeight: HUB_PREMIUM_LAYOUT.quickActionMinHeight,
    maxHeight: HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
    justifyContent: 'center',
  },
  tilePressed: {
    opacity: 0.92,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  tileTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  tileTeaser: {
    fontSize: 11,
    fontWeight: '600',
  },
  tileImageGrid: {
    width: 48,
    height: 48,
    flexShrink: 0,
  },
  tileImageRail: {
    width: 52,
    height: 48,
    flexShrink: 0,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  unlockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    flex: 1,
  },
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
