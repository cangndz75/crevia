// @refresh reset
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import type { CenterHomePresentation, CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';
import { resolveCenterSectionGap } from '@/features/hub/utils/centerLayoutTokens';
import { isCenterModuleRenderable } from '@/features/hub/utils/centerStatePolicy';
import { CenterCitySummaryCard } from '@/features/hub/components/CenterCitySummaryCard';
import { CenterAdvisorCard } from '@/features/hub/components/CenterAdvisorCard';
import { CenterDailyRewardRoute } from '@/features/hub/components/CenterDailyRewardRoute';
import { CenterHomeHeader } from '@/features/hub/components/CenterHomeHeader';
import {
  HubActiveTaskCardStack,
} from '@/features/hub/components/HubActiveTaskCardStack';
import { HubAuthorityPermissionPreviewChip } from '@/features/hub/components/HubAuthorityPermissionPreviewChip';
import { HubBadgeShowcaseChip } from '@/features/hub/components/HubBadgeShowcaseChip';
import { HubDistrictExpansionChip } from '@/features/hub/components/HubDistrictExpansionChip';
import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import { buildDistrictOperationUnlockBindingCompactSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import { buildHubBadgeShowcaseSummary } from '@/features/hub/utils/hubBadgeShowcaseModel';
import { resolveMotionDensity } from '@/core/motion';
import { CenterMotionEnter } from '@/features/hub/components/CenterMotionEnter';
import { CenterOperationFocusSection } from '@/features/hub/components/CenterOperationFocusSection';
import { CenterOperationSignalsSection } from '@/features/hub/components/CenterOperationSignalsSection';
import { CenterQuickActionsSection } from '@/features/hub/components/CenterQuickActionsSection';
import { CenterRecommendedPlanCard } from '@/features/hub/components/CenterRecommendedPlanCard';
import { CenterContinuationCardsSection } from '@/features/hub/components/CenterContinuationCardsSection';
import { useCreviaReducedMotion } from '@/shared/motion';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { useGameStore } from '@/store/useGameStore';

const compactBreakpoint = 370;

const palette = {
  background: '#F8F1E4',
  card: '#FFFCF5',
  cardWarm: '#FDF5E6',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldDark: '#9B741D',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#C85A4B',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.08)',
  white: '#FFFFFF',
} as const;

const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const greenHeroImage = require('@/assets/districts/status/district_safe_zone_01.png');

type IconName = keyof typeof Ionicons.glyphMap;

type HubReferenceHomeProps = {
  presentation: CenterHomePresentation;
  scrollFooter?: ReactNode;
};

function useHubLayoutMetrics() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const isCompact = width <= compactBreakpoint;
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight ?? 24)
      : insets.top;

  return {
    width,
    isCompact,
    topInset,
    scrollBottomPadding: tabBarHeight + 32,
  };
}

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  };
}

function AssetImage({
  source,
  contentFit = 'cover',
}: {
  source: ImageSource;
  contentFit?: 'cover' | 'contain';
}) {
  return <Image source={source} style={styles.assetImage} contentFit={contentFit} transition={180} />;
}

function MiniIcon({ icon, tone = 'teal' }: { icon: IconName; tone?: 'teal' | 'gold' | 'green' }) {
  const color = tone === 'gold' ? palette.goldDark : tone === 'green' ? palette.green : palette.teal;
  const backgroundColor =
    tone === 'gold' ? palette.goldSoft : tone === 'green' ? '#E8F5EA' : palette.tealSoft;

  return (
    <View style={[styles.miniIcon, { backgroundColor }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );
}

function GameStatusBar({ progress = 0.62 }: { progress?: number; variant?: 'primary' | 'secondary' }) {
  const ratio = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.gameStatusBar}>
      <View style={[styles.gameStatusBarFill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

function EceInsightCard({
  advisor,
  reducedMotion = false,
}: {
  advisor: CenterHomePresentation['advisorSuggestion'];
  reducedMotion?: boolean;
}) {
  return <CenterAdvisorCard advisor={advisor} reducedMotion={reducedMotion} />;
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.sectionDivider} />
      {action ? (
        <Text style={styles.sectionAction} numberOfLines={1}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

function ModernSectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.modernSectionHeader}>
      <View style={styles.modernSectionTitleMark} />
      <Text style={styles.modernSectionTitle} numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        <Pressable
          onPress={onActionPress}
          disabled={!onActionPress}
          accessibilityRole="button"
          accessibilityLabel={action}
          style={({ pressed }) => [
            styles.modernSectionAction,
            pressed && onActionPress ? styles.modernSectionActionPressed : undefined,
          ]}>
          <Text style={styles.modernSectionActionText} numberOfLines={1}>
            {action}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={palette.tealMid} />
        </Pressable>
      ) : null}
    </View>
  );
}

function shouldRenderActiveTarget(
  target: CenterHomePresentation['activeTarget'],
): boolean {
  return target.visibility !== 'hidden';
}

export function HubReferenceHome({
  presentation,
  scrollFooter,
}: HubReferenceHomeProps) {
  const { scrollBottomPadding, isCompact } = useHubLayoutMetrics();
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const badgeState = useGameStore((s) => s.gameState.pilot.badgeState);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const hubBadgeShowcase = useMemo(
    () => buildHubBadgeShowcaseSummary(badgeState, pilotDay),
    [badgeState, pilotDay],
  );
  const gameDay = useGameStore((s) => s.gameState.city.day);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const hubAuthorityPermissionPreview = useMemo(
    () =>
      buildAuthorityPermissionPreviewCompactSummary({
        authorityState,
        day: pilotDay,
      }),
    [authorityState, pilotDay],
  );
  const hubDistrictExpansion = useMemo(
    () =>
      buildDistrictOperationUnlockBindingCompactSummary({
        currentDay: gameDay,
        pilotDay,
        authorityState,
        mainOperationSeason,
      }),
    [authorityState, gameDay, mainOperationSeason, pilotDay],
  );
  const showHubDistrictExpansion = hubDistrictExpansion.visible;
  const showHubAuthorityPreview =
    !showHubDistrictExpansion &&
    hubAuthorityPermissionPreview.visible &&
    Boolean(hubAuthorityPermissionPreview.nextPermissionLine);
  const showHubBadgeShowcase =
    hubBadgeShowcase.visible &&
    Number(showHubDistrictExpansion) + Number(showHubAuthorityPreview) < 2;

  const activeTarget = presentation.activeTarget;
  const reducedMotion = useCreviaReducedMotion();
  const hubMotionEnabled = useMemo(() => {
    if (reducedMotion) return false;
    return resolveMotionDensity({ day: pilotDay }) !== 'day1_minimal';
  }, [pilotDay, reducedMotion]);
  const sectionGap = resolveCenterSectionGap(isCompact);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
        <CenterMotionEnter
          index={0}
          reducedMotion={reducedMotion}
          day={pilotDay}
          hubMotionEnabled={hubMotionEnabled}>
          <CenterHomeHeader header={presentation.headerSummary} />
        </CenterMotionEnter>
        <View style={[styles.body, { gap: sectionGap }]}>
          <CenterMotionEnter
            index={1}
            reducedMotion={reducedMotion}
            day={pilotDay}
            hubMotionEnabled={hubMotionEnabled}>
            <CenterCitySummaryCard summary={presentation.citySummary} />
          </CenterMotionEnter>
          <CenterMotionEnter
            index={2}
            reducedMotion={reducedMotion}
            day={pilotDay}
            hubMotionEnabled={hubMotionEnabled}>
            <CenterDailyRewardRoute reward={presentation.dailyReward} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          {shouldRenderActiveTarget(activeTarget) ? (
            <CenterMotionEnter
              index={3}
              reducedMotion={reducedMotion}
              day={pilotDay}
              disabled={!hubMotionEnabled}
              hubMotionEnabled={hubMotionEnabled}>
              <HubActiveTaskCardStack activeTarget={activeTarget} reducedMotion={reducedMotion} />
            </CenterMotionEnter>
          ) : null}
          {isCenterModuleRenderable(presentation.advisorSuggestion.visibility) ? (
            <CenterMotionEnter
              index={4}
              reducedMotion={reducedMotion}
              day={pilotDay}
              disabled={!hubMotionEnabled}
              hubMotionEnabled={hubMotionEnabled}>
              <EceInsightCard
                advisor={presentation.advisorSuggestion}
                reducedMotion={reducedMotion}
              />
            </CenterMotionEnter>
          ) : null}
          <CenterOperationFocusSection
            focus={presentation.operationFocus}
            reducedMotion={reducedMotion}
          />
          <CenterOperationSignalsSection
            signalsSection={presentation.operationSignals}
            reducedMotion={reducedMotion}
          />
          <CenterQuickActionsSection
            quickActions={presentation.quickActions}
            reducedMotion={reducedMotion}
          />
          <CenterRecommendedPlanCard
            plan={presentation.recommendedPlan}
            reducedMotion={reducedMotion}
          />
          <CenterContinuationCardsSection
            continuation={presentation.continuationCards}
            reducedMotion={reducedMotion}
          />
          {showHubAuthorityPreview ? (
            <HubAuthorityPermissionPreviewChip summary={hubAuthorityPermissionPreview} />
          ) : null}
          {showHubDistrictExpansion ? (
            <HubDistrictExpansionChip summary={hubDistrictExpansion} />
          ) : null}
          {showHubBadgeShowcase ? <HubBadgeShowcaseChip summary={hubBadgeShowcase} /> : null}
        </View>
        {scrollFooter ? <View style={styles.scrollFooter}>{scrollFooter}</View> : null}
      </ScrollView>
    </View>
  );
}

const cardShadow = {
  shadowColor: palette.tealDark,
  shadowOpacity: 0.06,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  scrollFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  skylineOne: {
    position: 'absolute',
    right: 32,
    top: 78,
    width: 54,
    height: 86,
    backgroundColor: 'rgba(7,86,79,0.07)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  skylineTwo: {
    position: 'absolute',
    right: 88,
    top: 108,
    width: 42,
    height: 56,
    backgroundColor: 'rgba(216,167,46,0.10)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  skylineThree: {
    position: 'absolute',
    right: 142,
    top: 120,
    width: 70,
    height: 42,
    backgroundColor: 'rgba(7,86,79,0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTop: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarButton: {
    flexShrink: 0,
    position: 'relative',
    alignItems: 'center',
  },
  profilePortrait: {
    flexShrink: 0,
  },
  profileLevelBadge: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -11,
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: palette.goldDark,
    borderWidth: 1.5,
    borderColor: palette.goldSoft,
  },
  profileLevelText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.white,
  },
  headerIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 10,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: palette.text,
  },
  locationRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: palette.tealMid,
  },
  headerAlertLine: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: palette.amber,
  },
  reputationBadge: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    flexShrink: 0,
    marginTop: -2,
  },
  reputationBadgeImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  reputationLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.goldSoft,
    textAlign: 'center',
  },
  reputationValue: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '900',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
    minWidth: 0,
  },
  resourceChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  resourceValue: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '900',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  resourcePlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealMid,
    flexShrink: 0,
    marginLeft: 1,
  },
  gameStatusBar: {
    height: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C9A227',
    backgroundColor: '#DDE8E4',
    paddingHorizontal: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gameStatusBarFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  body: {
    paddingHorizontal: 16,
  },
  eceCard: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  eceAvatarWrap: {
    width: 58,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.goldSoft,
    flexShrink: 0,
  },
  eceAvatar: {
    width: '100%',
    height: '100%',
  },
  eceTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eceName: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.teal,
  },
  eceText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: palette.text,
  },
  eceActionLine: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: palette.tealMid,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  section: {
    gap: 10,
    minWidth: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(155,116,29,0.22)',
  },
  sectionAction: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldDark,
  },
  focusScroll: {
    gap: 10,
    paddingRight: 12,
  },
  focusCard: {
    width: 124,
    borderRadius: 20,
    padding: 9,
    gap: 5,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  focusImage: {
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
  },
  focusIconFloat: {
    position: 'absolute',
    left: 6,
    top: 6,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
  },
  focusLevel: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
  },
  focusProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E6DDC7',
  },
  focusProgressFill: {
    width: '62%',
    height: '100%',
    backgroundColor: palette.tealMid,
  },
  focusValue: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldDark,
    fontVariant: ['tabular-nums'],
  },
  cityDevCard: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'column',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.gold,
    minHeight: 86,
    overflow: 'hidden',
  },
  citySummaryMetrics: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  citySummaryMetric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cityDevBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.35)',
    flexShrink: 0,
  },
  cityDevCenter: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cityDevLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
  },
  cityDevValue: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
    color: palette.gold,
    fontVariant: ['tabular-nums'],
  },
  cityDevNext: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  cityDevProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.28)',
    marginTop: 2,
  },
  cityDevProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  cityDevProgressText: {
    fontSize: 8,
    fontWeight: '800',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  cityCrestWrap: {
    flexShrink: 0,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityCrestDiamond: {
    width: 46,
    height: 46,
    borderRadius: 12,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
    backgroundColor: palette.tealDark,
    borderWidth: 1.5,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityCrestSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(13,113,104,0.55)',
  },
  cityCrestBuildingLeft: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    width: 8,
    height: 14,
    backgroundColor: 'rgba(245,227,175,0.55)',
    transform: [{ rotate: '-45deg' }],
  },
  cityCrestBuildingCenter: {
    position: 'absolute',
    bottom: 6,
    width: 10,
    height: 18,
    backgroundColor: palette.goldSoft,
    transform: [{ rotate: '-45deg' }],
  },
  cityCrestBuildingRight: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 7,
    height: 12,
    backgroundColor: 'rgba(245,227,175,0.45)',
    transform: [{ rotate: '-45deg' }],
  },
  cityCrestSpire: {
    position: 'absolute',
    top: 10,
    width: 4,
    height: 8,
    backgroundColor: palette.gold,
    transform: [{ rotate: '-45deg' }],
  },
  cityCrestGoldAccent: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 2,
    backgroundColor: palette.gold,
    transform: [{ rotate: '-45deg' }],
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    marginBottom: 2,
  },
  modernSectionTitleMark: {
    width: 3,
    height: 14,
    borderRadius: 999,
    backgroundColor: palette.gold,
    flexShrink: 0,
  },
  modernSectionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: 0.6,
  },
  modernSectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(7,86,79,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.08)',
  },
  modernSectionActionPressed: {
    opacity: 0.82,
  },
  modernSectionActionText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.tealMid,
    letterSpacing: 0.2,
  },
  signalList: {
    gap: 10,
  },
  signalEmptyCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  signalEmptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  signalRow: {
    borderRadius: 20,
    paddingRight: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.07)',
    minWidth: 0,
    overflow: 'hidden',
    ...cardShadow,
  },
  signalAccentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    flexShrink: 0,
  },
  signalIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  signalIconCore: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  signalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingRight: 2,
  },
  signalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  signalLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  signalTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.1,
  },
  signalBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  signalTrailing: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    minWidth: 52,
  },
  signalImpactLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.muted,
    letterSpacing: 0.4,
  },
  signalImpactPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  signalImpactValue: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  signalChevronBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,86,79,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.08)',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    minWidth: 0,
  },
  quickGridCell: {
    minWidth: 0,
  },
  quickGridCellWide: {
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '33%',
  },
  quickGridCellCompact: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '48.5%',
  },
  quickActionTileOuter: {
    minWidth: 0,
    borderRadius: 18,
    ...cardShadow,
  },
  quickActionTileLocked: {
    opacity: 0.55,
  },
  quickLockedBanner: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.tealSoft,
    marginBottom: 4,
  },
  quickLockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.tealMid,
  },
  quickActionTile: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 11,
    gap: 5,
    minWidth: 0,
    minHeight: 96,
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.07)',
    justifyContent: 'space-between',
  },
  quickActionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  quickActionIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickActionIconCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  quickActionArrowChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.08)',
    flexShrink: 0,
  },
  quickTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.1,
  },
  quickCaption: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  planCard: {
    borderRadius: 22,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  planLockedCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  planLockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  continuationList: {
    gap: 8,
  },
  continuationCard: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  continuationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.teal,
  },
  continuationBody: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  planIllustration: {
    width: 138,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: palette.tealSoft,
    position: 'relative',
  },
  planIllustrationSky: {
    ...StyleSheet.absoluteFillObject,
  },
  planIllustrationWater: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    backgroundColor: '#5BA4C9',
  },
  planIllustrationPark: {
    position: 'absolute',
    left: 12,
    bottom: 18,
    width: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5CB85C',
  },
  planIllustrationPath: {
    position: 'absolute',
    left: 20,
    bottom: 30,
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4C4A8',
    transform: [{ rotate: '-8deg' }],
  },
  planIllustrationBuildingLeft: {
    position: 'absolute',
    right: 28,
    bottom: 32,
    width: 14,
    height: 28,
    backgroundColor: 'rgba(23,61,58,0.65)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  planIllustrationBuildingRight: {
    position: 'absolute',
    right: 10,
    bottom: 32,
    width: 12,
    height: 22,
    backgroundColor: 'rgba(23,61,58,0.50)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  planIllustrationMosque: {
    position: 'absolute',
    right: 18,
    bottom: 38,
    width: 10,
    height: 16,
    backgroundColor: palette.tealDark,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  planIllustrationTreeOne: {
    position: 'absolute',
    left: 22,
    bottom: 42,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3E9E6A',
  },
  planIllustrationTreeTwo: {
    position: 'absolute',
    left: 48,
    bottom: 44,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF6E',
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
    paddingRight: 2,
  },
  planTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: palette.text,
  },
  planBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.muted,
  },
  planMetaRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  planMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: palette.cardWarm,
    minWidth: 0,
    flexShrink: 1,
  },
  planMetaLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.muted,
  },
  planMetaValue: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  bookmark: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 26,
    height: 32,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealDark,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  approveButtonWrap: {
    marginTop: 2,
    ...cardShadow,
  },
  approveButton: {
    minHeight: 56,
    borderRadius: 999,
    paddingHorizontal: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.gold,
    position: 'relative',
  },
  approveText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '900',
    color: palette.goldSoft,
    textAlign: 'center',
  },
  ctaArrow: {
    position: 'absolute',
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
    flexShrink: 0,
  },
});
