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
  DAY1_QUICK_PREP_TITLE,
  HUB_QUICK_ACTION_PREVIEW,
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

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={16} color={colors.hubGoldDark} />
          <Text style={styles.sectionTitle}>{DAY1_QUICK_PREP_TITLE}</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {cards.map((card) => {
          const preview = HUB_QUICK_ACTION_PREVIEW[card.id];
          const imageSource = hubAssets.quickActions[preview.imageKey];
          const disabled = !isLockedRail && (card.status === 'disabled' || card.status === 'used');

          return (
            <Pressable
              key={card.id}
              onPress={() => onPress(card.id)}
              disabled={disabled}
              style={({ pressed }) => [pressed && styles.tilePressed]}
              accessibilityRole="button"
              accessibilityLabel={preview.title}>
              <LinearGradient
                colors={[...preview.gradient]}
                style={[styles.tile, shadows.soft]}>
                <HubAssetImage
                  source={imageSource}
                  containerStyle={styles.tileImage}
                  contentFit="contain"
                />
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {preview.title}
                </Text>
                <Text style={[styles.tileTeaser, { color: preview.accent }]} numberOfLines={1}>
                  {preview.teaser}
                </Text>
                {isLockedRail ? (
                  <View style={styles.unlockRow}>
                    <Ionicons name="time-outline" size={10} color={colors.textSecondary} />
                    <Text style={styles.unlockText}>Gün 2</Text>
                  </View>
                ) : (
                  <Text style={styles.statusText} numberOfLines={1}>
                    {card.statusLabel}
                  </Text>
                )}
                <View style={styles.tileArrow}>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
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
    width: 132,
    minHeight: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  tilePressed: {
    opacity: 0.92,
  },
  tileImage: {
    width: 72,
    height: 56,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tileTeaser: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
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
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
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
