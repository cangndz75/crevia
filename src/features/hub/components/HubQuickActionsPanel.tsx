import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { selectDay1TutorialEventId } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
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
    const teaser = lockedRail && lockedDisplay ? lockedDisplay.teaser : preview.teaser;
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
            shadows.soft,
          ]}>
          <HubAssetImage
            source={imageSource}
            containerStyle={lockedRail ? styles.tileImage : styles.tileImageCompact}
            contentFit="contain"
          />
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[styles.tileTeaser, { color: preview.accent }]}
            numberOfLines={1}>
            {teaser}
          </Text>
          {lockedRail ? (
            <View style={styles.unlockRow}>
              <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.unlockText} numberOfLines={1}>
                Gün 2
              </Text>
              <View style={styles.tileArrow}>
                <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
              </View>
            </View>
          ) : (
            <Text style={styles.statusText} numberOfLines={1}>
              {card.statusLabel}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={16} color={colors.hubGoldDark} />
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {isLockedRail ? DAY1_QUICK_PREP_TITLE : HUB_QUICK_ACTIONS_TITLE}
          </Text>
          {isLockedRail ? (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Gün 2</Text>
            </View>
          ) : null}
        </View>
        {isLockedRail ? (
          <Pressable hitSlop={8} accessibilityRole="button">
            <Text style={styles.seeAll}>Tümünü gör</Text>
          </Pressable>
        ) : null}
      </View>

      {lastResult ? <ResultBanner result={lastResult} /> : null}

      {isLockedRail ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          {visibleCards.map((card) => renderQuickActionTile(card, true))}
        </ScrollView>
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
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  tileGridWrap: {
    width: '48%',
    minWidth: 0,
  },
  tileRailWrap: {
    flexShrink: 0,
  },
  dayBadge: {
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 183, 49, 0.35)',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: spacing.sm,
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  tileRail: {
    width: 118,
    minHeight: 156,
    borderRadius: 20,
  },
  tileGrid: {
    width: '100%',
    maxHeight: HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
    minHeight: 76,
  },
  tilePressed: {
    opacity: 0.92,
  },
  tileImage: {
    width: 72,
    height: 56,
  },
  tileImageCompact: {
    width: 48,
    height: 36,
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
    width: '100%',
  },
  tileTeaser: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
    width: '100%',
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    width: '100%',
    justifyContent: 'center',
  },
  unlockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  tileArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
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
