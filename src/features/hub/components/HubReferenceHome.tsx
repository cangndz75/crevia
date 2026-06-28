// @refresh reset
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import {
  hubSurfaceCollapseMode,
  hubSurfaceIsRenderable,
} from '@/features/hub/utils/centerHomePresentation';
import {
  hubBandAllowsLiveDevelopments,
  hubSectionIsHidden,
  HUB_DENSITY_LIMITS,
  resolveHubFeedItemCap,
  resolveHubNextMovesCap,
  resolveHubQuickActionsCap,
} from '@/features/hub/utils/centerHubDensityPolicy';
import { CenterMotionEnter } from '@/features/hub/components/CenterMotionEnter';
import { CENTER_COMPACT_BREAKPOINT, CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { pushHubRoute } from '@/features/hub/components/centerLowerDashboardShared';
import { CenterHubImageFrame } from '@/features/hub/components/centerHubImageFrame';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { CreviaAnimatedPressable, useCreviaReducedMotion } from '@/shared/motion';

const profilePortraitImage = require('@/assets/pp1.png');
const routeActionImage = require('@/assets/events/scenes/ev_scene_route_01.png');
const marketActionImage = require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png');
const droneActionImage = require('@/assets/districts/route/district_route_network_01.png');

const g = gameUi.colors;

/** Sıcak krem + altın + canlı teal — gameUi ile hizalı oyun paleti */
const palette = {
  appBg: g.backgroundCream,
  appBgDeep: '#EDE0C8',
  panel: g.cardWhite,
  panelSoft: g.cardMintTint,
  panelWarm: g.cardWarmTint,
  panelLift: '#FFF0D6',
  stroke: g.borderSoft,
  strokeStrong: 'rgba(216, 167, 46, 0.40)',
  strokeGold: 'rgba(216, 167, 46, 0.24)',
  text: g.textPrimary,
  muted: g.textMuted,
  faint: 'rgba(104, 116, 110, 0.62)',
  gold: g.goldAccent,
  goldLight: g.goldLight,
  goldDark: '#A67C1A',
  green: g.mintPositive,
  mint: '#5FD492',
  teal: g.primaryTeal,
  tealMid: g.primaryTealMid,
  tealGlow: 'rgba(7, 86, 79, 0.12)',
  red: '#D4644A',
  blue: '#5B8FD4',
  heroText: '#FFF8E7',
  heroMuted: 'rgba(255, 248, 231, 0.82)',
} as const;

type HeaderChip = CenterHomePresentation['headerSummary']['resourceChips'][number];
type NextMove = CenterHomePresentation['gameFirst']['nextMoves']['moves'][number];
type EventCardModel = CenterHomePresentation['neighborhoodEvents']['events'][number];
type RecentImpactTone = CenterHomePresentation['recentImpactSummary']['tone'];
type MiniCityFeedItem = CenterHomePresentation['miniCityFeed']['items'][number];
type MiniCityFeedTone = MiniCityFeedItem['tone'];
type IconName = keyof typeof Ionicons.glyphMap;

type HubReferenceHomeProps = {
  presentation: CenterHomePresentation;
  scrollFooter?: ReactNode;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function resolveIconName(iconKey: string | undefined, fallback: IconName): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return fallback;
}

function routeLabel(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function isCompletedTarget(presentation: CenterHomePresentation): boolean {
  return (
    presentation.activeTarget.status === 'completed' ||
    presentation.activeTarget.visibility === 'completed' ||
    (presentation.activeTarget.progress?.progressRatio ?? 0) >= 1
  );
}

function looksLikePastOperationText(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return /tamamland|tamamlandı|çözüld|cozul|sonuç|sonuc|kuruldu|başarı|basari|son etki|resolved|completed/.test(
    normalized,
  );
}

function sameLooseText(left: string | undefined, right: string | undefined): boolean {
  const a = left?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
  const b = right?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function completedHeroFallback(presentation: CenterHomePresentation) {
  const nextAction =
    presentation.nextActions.actions.find((action) => action.routeKey && !action.disabled) ??
    presentation.nextActions.actions.find((action) => !action.disabled) ??
    presentation.nextActions.actions[0];
  const nextHero =
    presentation.nextTargetHero.visibility === 'visible' ? presentation.nextTargetHero : undefined;
  const titleCandidates = [
    nextHero?.title,
    nextAction?.title,
    presentation.recommendedPlan.title,
    'Sıradaki Operasyonu Seç',
  ];
  const title =
    titleCandidates.find(
      (candidate) =>
        routeLabel(candidate, '') &&
        !looksLikePastOperationText(candidate) &&
        !sameLooseText(candidate, presentation.activeTarget.title),
    ) ?? 'Sıradaki Operasyonu Seç';
  const body =
    routeLabel(
      nextHero?.subtitle ?? nextAction?.subtitle ?? presentation.recommendedPlan.body,
      'Son etki rapora işlendi. Şimdi sıradaki hamleyi seç.',
    );

  return {
    eyebrow: 'ANA GÖREV',
    title,
    body,
    route: nextHero?.routeKey ?? nextAction?.routeKey ?? presentation.recommendedPlan.cta?.route ?? '/events',
    ctaLabel: 'Hedefe Git',
    progress: 0.2,
    stageText: 'AŞAMA 1/5',
  };
}

function feedTonePalette(tone: MiniCityFeedTone): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
} {
  switch (tone) {
    case 'positive':
      return {
        borderColor: 'rgba(143,225,166,0.35)',
        backgroundColor: 'rgba(143,225,166,0.16)',
        textColor: palette.green,
        iconColor: palette.green,
      };
    case 'active':
      return {
        borderColor: 'rgba(134,169,255,0.34)',
        backgroundColor: 'rgba(134,169,255,0.12)',
        textColor: palette.blue,
        iconColor: palette.blue,
      };
    case 'mixed':
      return {
        borderColor: 'rgba(216,177,83,0.34)',
        backgroundColor: 'rgba(216,177,83,0.14)',
        textColor: palette.gold,
        iconColor: palette.gold,
      };
    case 'warning':
    case 'critical':
      return {
        borderColor: 'rgba(217,117,93,0.38)',
        backgroundColor: 'rgba(217,117,93,0.14)',
        textColor: palette.red,
        iconColor: palette.red,
      };
    default:
      return {
        borderColor: 'rgba(147,232,189,0.25)',
        backgroundColor: 'rgba(147,232,189,0.10)',
        textColor: palette.mint,
        iconColor: palette.mint,
      };
  }
}

function recentTonePalette(tone: RecentImpactTone): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
} {
  switch (tone) {
    case 'positive':
      return {
        borderColor: 'rgba(143,225,166,0.35)',
        backgroundColor: 'rgba(143,225,166,0.16)',
        textColor: palette.green,
        iconColor: palette.green,
      };
    case 'mixed':
      return {
        borderColor: 'rgba(216,177,83,0.34)',
        backgroundColor: 'rgba(216,177,83,0.14)',
        textColor: palette.gold,
        iconColor: palette.gold,
      };
    case 'warning':
    case 'critical':
      return {
        borderColor: 'rgba(217,117,93,0.38)',
        backgroundColor: 'rgba(217,117,93,0.14)',
        textColor: palette.red,
        iconColor: palette.red,
      };
    default:
      return {
        borderColor: 'rgba(147,232,189,0.25)',
        backgroundColor: 'rgba(147,232,189,0.10)',
        textColor: palette.mint,
        iconColor: palette.mint,
      };
  }
}

function recentChipIcon(tone: RecentImpactTone, label: string): IconName {
  const normalized = label.toLowerCase();
  if (/risk|baskı|baski/.test(normalized)) return tone === 'positive' ? 'shield-checkmark-outline' : 'warning-outline';
  if (/kaynak|bütçe|butce|ekip/.test(normalized)) return 'cash-outline';
  if (/güven|guven|halk|itibar/.test(normalized)) return 'people-outline';
  if (tone === 'warning' || tone === 'critical') return 'alert-circle-outline';
  return 'sparkles-outline';
}

function useLayoutMetrics() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const compact = width < CENTER_COMPACT_BREAKPOINT;

  return {
    compact,
    topPadding: Math.max(insets.top, 10) + 10,
    bottomPadding: tabBarHeight + Math.max(insets.bottom, 10) + 24,
    horizontalPadding: compact ? 12 : 16,
  };
}

function RoutePressable({
  route,
  disabled,
  preserveDisabledOpacity,
  reducedMotion,
  accessibilityLabel,
  style,
  children,
}: {
  route?: string;
  disabled?: boolean;
  preserveDisabledOpacity?: boolean;
  reducedMotion: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const router = useRouter();
  const isDisabled = disabled || !route;

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (route) pushHubRoute(router, route);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.975}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      style={[style, isDisabled && !preserveDisabledOpacity ? styles.disabledPressable : undefined]}>
      {children}
    </CreviaAnimatedPressable>
  );
}

function LiveDot({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.24,
    transform: [{ scale: 1 + pulse.value * 0.7 }],
  }));

  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDotHalo, haloStyle]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function resolveResourceIcon(chip: HeaderChip): { name: IconName; color: string } {
  switch (chip.id) {
    case 'budget':
      return { name: 'cash-outline', color: palette.green };
    case 'authority':
      return { name: 'star', color: palette.gold };
    case 'gem':
      return { name: 'diamond-outline', color: palette.blue };
    default:
      return { name: resolveIconName(chip.iconKey, 'cube-outline'), color: palette.gold };
  }
}

function StatusResourceChip({ chip }: { chip: HeaderChip }) {
  const icon = resolveResourceIcon(chip);
  return (
    <View style={styles.headerResourceChip}>
      <Ionicons name={icon.name} size={14} color={icon.color} />
      <Text style={styles.headerResourceValue} numberOfLines={1}>
        {chip.valueText}
      </Text>
    </View>
  );
}

function HeaderBar({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const { headerSummary } = presentation;
  const resourceChips = headerSummary.resourceChips
    .filter((chip) => chip.id !== 'day')
    .slice(0, 3);

  return (
    <View style={styles.headerBar}>
      <RoutePressable
        route="/profile"
        reducedMotion={reducedMotion}
        accessibilityLabel={`${headerSummary.playerName}. Profil`}
        style={styles.profilePressable}>
        <View style={styles.avatarFrame}>
          <Image source={profilePortraitImage} style={styles.avatarImage} contentFit="contain" />
          {headerSummary.levelLabel ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText} numberOfLines={1}>
                {headerSummary.levelLabel.replace('Sv. ', '')}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.playerName} numberOfLines={1}>
            {headerSummary.playerName}
          </Text>
          <Text style={styles.playerRole} numberOfLines={1}>
            {headerSummary.playerRoleLabel}
          </Text>
          <View style={styles.cityMiniRow}>
            <Ionicons name="location" size={10} color={palette.gold} />
            <Text style={styles.cityMiniText} numberOfLines={1}>
              {headerSummary.displayCityName}
            </Text>
          </View>
        </View>
      </RoutePressable>

      <View style={styles.headerRight}>
        <View style={styles.resourcePill}>
          {resourceChips.length > 0 ? (
            resourceChips.map((chip) => <StatusResourceChip key={chip.id} chip={chip} />)
          ) : (
            <Text style={styles.emptyTinyText} numberOfLines={1}>
              Kaynak yok
            </Text>
          )}
        </View>
        <RoutePressable
          route={headerSummary.notification.targetRoute ?? '/profile'}
          reducedMotion={reducedMotion}
          accessibilityLabel={headerSummary.notification.label}
          style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={18} color={palette.text} />
          {!headerSummary.notification.iconOnly ? <View style={styles.notificationDot} /> : null}
        </RoutePressable>
      </View>
    </View>
  );
}

function TopInfoChips({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  const dayLabel = dayChip?.valueText ?? 'Gün 1';
  const seasonLabel = presentation.headerSummary.subtitle ?? 'Başlangıç Dönemi';
  const reward = presentation.dailyReward;
  const streakCurrent = Math.max(1, reward.today.dayIndex);
  const streakTotal = Math.max(7, reward.days.length || 7);
  const streakProgress = clampPercent((streakCurrent / streakTotal) * 100);

  return (
    <View style={styles.topInfoRow}>
      <View style={styles.infoChip}>
        <View style={styles.infoIconBox}>
          <Ionicons name="calendar-outline" size={14} color={palette.gold} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle} numberOfLines={1}>
            {dayLabel}
          </Text>
          <Text style={styles.infoSubtitle} numberOfLines={1}>
            {seasonLabel}
          </Text>
        </View>
      </View>

      <RoutePressable
        route="/rewards"
        reducedMotion={reducedMotion}
        accessibilityLabel={`${reward.title}. ${streakCurrent} / ${streakTotal} gün`}
        style={[styles.infoChip, styles.infoChipWide]}>
        <View style={styles.infoIconBoxGold}>
          <Ionicons name="flame" size={14} color={palette.gold} />
        </View>
        <View style={styles.infoCopy}>
          <View style={styles.streakHeaderRow}>
            <Text style={styles.infoTitle} numberOfLines={1}>
              Günlük Seri
            </Text>
            <Text style={styles.streakCountBadge} numberOfLines={1}>
              {streakCurrent}/{streakTotal}
            </Text>
          </View>
          <View style={styles.rewardDots}>
            {reward.days.slice(0, 7).map((day) => (
              <View
                key={day.dayIndex}
                style={[
                  styles.rewardDot,
                  day.state === 'done' || day.state === 'today' ? styles.rewardDotActive : undefined,
                ]}
              />
            ))}
          </View>
          <View style={styles.streakMiniTrack}>
            <View style={[styles.streakMiniFill, { width: `${streakProgress}%` as `${number}%` }]} />
          </View>
        </View>
      </RoutePressable>
    </View>
  );
}

function resolveHeroCopy(presentation: CenterHomePresentation) {
  const focus = presentation.gameFirst.todayFocus;
  if (focus.visibility === 'visible') {
    return {
      eyebrow: focus.sectionTitle,
      title: focus.goalSentence,
      body: `${focus.whyImportant} ${focus.nextActionSentence}`.trim(),
      route: focus.cta.route,
      ctaLabel: focus.cta.label,
      progress: focus.progressRatio ?? 0.2,
      stageText: focus.stageLabel ? focus.stageLabel.toUpperCase() : 'AŞAMA 1/5',
    };
  }

  if (isCompletedTarget(presentation)) {
    return completedHeroFallback(presentation);
  }

  const target = presentation.activeTarget;
  const title =
    target.id === 'day1-entry' && /ilk olay|merkez masası/i.test(target.title)
      ? 'İlk Operasyonu Planla'
      : routeLabel(target.title, 'Operasyonu Planla');
  const body =
    target.id === 'day1-entry'
      ? 'Şehrin ihtiyaçlarını analiz et, önceliklerini belirle ve ilk operasyonunu başlat.'
      : routeLabel(target.description, target.helperText ?? 'Operasyon akışı veri bekliyor.');
  const progress = clampPercent((target.progress?.progressRatio ?? 0.2) * 100) / 100;
  const stageText = target.progress?.valueText ? `AŞAMA ${target.progress.valueText}` : 'AŞAMA 1/5';

  return {
    eyebrow: 'ANA GÖREV',
    title,
    body,
    route: target.cta.route,
    ctaLabel: target.cta.label || 'Hedefe Git',
    progress,
    stageText,
  };
}

function HeroNetworkOverlay() {
  const nodes = [
    { icon: 'bus-outline' as IconName, x: 68, y: 18 },
    { icon: 'airplane-outline' as IconName, x: 108, y: 8 },
    { icon: 'leaf-outline' as IconName, x: 148, y: 22 },
    { icon: 'train-outline' as IconName, x: 118, y: 48 },
  ];

  return (
    <View style={styles.heroNetworkWrap} pointerEvents="none">
      <Svg width={180} height={70} viewBox="0 0 180 70">
        <Polyline
          points="68,28 108,18 148,32 118,56 68,28"
          fill="none"
          stroke="rgba(147,232,189,0.35)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </Svg>
      {nodes.map((node) => (
        <View key={node.icon} style={[styles.heroNetworkNode, { left: node.x, top: node.y }]}>
          <Ionicons name={node.icon} size={11} color={palette.mint} />
        </View>
      ))}
    </View>
  );
}

function HeroProgressNodes({ progress }: { progress: number }) {
  const stageIndex = Math.min(4, Math.floor(clampPercent(progress * 100) / 25));

  return (
    <View style={styles.stageNodeRow}>
      {[0, 1, 2, 3].map((index) => {
        const active = index <= stageIndex;
        const isLast = index === 3;
        return (
          <View key={index} style={styles.stageNodeItem}>
            {index > 0 ? (
              <View style={[styles.stageNodeLine, active ? styles.stageNodeLineActive : undefined]} />
            ) : null}
            <View
              style={[
                styles.stageNodeDot,
                active ? styles.stageNodeDotActive : undefined,
                isLast ? styles.stageNodeFlag : undefined,
              ]}>
              {isLast ? (
                <Ionicons name="flag" size={9} color={active ? '#101812' : palette.faint} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MainHero({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const hero = resolveHeroCopy(presentation);
  const operationMeta = presentation.gameFirst.todayFocus.operationMeta;

  const metaRows = [
    operationMeta?.districtLabel ? { label: 'Mahalle', value: operationMeta.districtLabel } : null,
    operationMeta?.phaseLabel ? { label: 'Faz', value: operationMeta.phaseLabel } : null,
    operationMeta?.riskLabel ? { label: 'Risk', value: operationMeta.riskLabel } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <View style={styles.heroCard}>
      <CenterHubImageFrame
        source={hubAssets.centerSummaryHero}
        style={styles.heroImageFrame}
        gradientColors={['#0A4F48', '#127066', '#043A36']}
      />
      <LinearGradient
        colors={['rgba(10,79,72,0.14)', 'rgba(4,58,54,0.62)', 'rgba(4,58,54,0.97)']}
        locations={[0, 0.48, 1]}
        style={styles.heroOverlay}
      />
      <View style={styles.mapGridOne} />
      <View style={styles.mapGridTwo} />
      <HeroNetworkOverlay />

      <View style={styles.heroCopy}>
        <View style={styles.heroEyebrowPill}>
          <Text style={styles.heroEyebrow} numberOfLines={1}>
            {hero.eyebrow}
          </Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
          {hero.title}
        </Text>
        <Text style={styles.heroBody} numberOfLines={operationMeta ? 2 : 3}>
          {hero.body}
        </Text>
        {metaRows.length > 0 ? (
          <View style={styles.heroMetaRow}>
            {metaRows.map((row) => (
              <View key={row.label} style={styles.heroMetaChip}>
                <Text style={styles.heroMetaLabel} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={styles.heroMetaValue} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <RoutePressable
          route={hero.route}
          reducedMotion={reducedMotion}
          accessibilityLabel={hero.ctaLabel}
          style={styles.heroCta}>
          <Text style={styles.heroCtaText} numberOfLines={1}>
            {hero.ctaLabel}
          </Text>
          <View style={styles.heroCtaIcon}>
            <Ionicons name="chevron-forward" size={15} color="#1A2818" />
          </View>
        </RoutePressable>
      </View>
    </View>
  );
}

function ActiveOperationFocusCard({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const layout = presentation.gameFirst.densityLayout;
  if (layout.mergedPrimaryFocus || hubSectionIsHidden(layout.hiddenSections, 'activeOperationFocus')) {
    return null;
  }

  const focus = presentation.gameFirst.activeOperationFocus;
  if (focus.visibility !== 'visible' || !focus.operationName.trim()) return null;

  const metaRows = [
    focus.districtLabel ? { label: 'Mahalle', value: focus.districtLabel } : null,
    focus.phaseLabel ? { label: 'Faz', value: focus.phaseLabel } : null,
    focus.riskLabel ? { label: 'Risk', value: focus.riskLabel } : null,
    focus.expectedImpact ? { label: 'Etki', value: focus.expectedImpact } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <View style={styles.operationFocusCard}>
      <View style={styles.operationFocusHeader}>
        <Text style={styles.operationFocusEyebrow} numberOfLines={1}>
          {focus.mode === 'active' ? 'Aktif Operasyon' : 'Operasyon Odağı'}
        </Text>
        {focus.mode === 'signal' ? (
          <View style={styles.operationFocusModePill}>
            <Text style={styles.operationFocusModeText} numberOfLines={1}>
              Şehir Sinyali
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.operationFocusTitle} numberOfLines={2}>
        {focus.operationName}
      </Text>
      {focus.nextDecision ? (
        <Text style={styles.operationFocusBody} numberOfLines={2}>
          {focus.nextDecision}
        </Text>
      ) : null}
      {metaRows.length > 0 ? (
        <View style={styles.operationFocusMetaRow}>
          {metaRows.slice(0, 3).map((row) => (
            <View key={row.label} style={styles.operationFocusMetaChip}>
              <Text style={styles.operationFocusMetaLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.operationFocusMetaValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <RoutePressable
        route={focus.cta.route}
        disabled={!focus.cta.enabled}
        reducedMotion={reducedMotion}
        accessibilityLabel={focus.cta.label}
        style={styles.operationFocusCta}>
        <Text style={styles.operationFocusCtaText} numberOfLines={1}>
          {focus.cta.label}
        </Text>
        <Ionicons name="arrow-forward" size={14} color="#101812" />
      </RoutePressable>
    </View>
  );
}

function StageProgressCard({ presentation }: { presentation: CenterHomePresentation }) {
  const hero = resolveHeroCopy(presentation);
  const completed = isCompletedTarget(presentation);
  const missionName =
    completed
      ? routeLabel(hero.title, 'Yeni Operasyon')
      : presentation.activeTarget.id === 'day1-entry'
      ? 'İlk Operasyon'
      : routeLabel(presentation.activeTarget.title, 'Aktif Operasyon');

  return (
    <View style={styles.stageCard}>
      <Text style={styles.stageCardEyebrow} numberOfLines={1}>
        {hero.stageText}
      </Text>
      <Text style={styles.stageCardTitle} numberOfLines={1}>
        {missionName}
      </Text>
      <HeroProgressNodes progress={hero.progress} />
    </View>
  );
}

function RecentImpactCard({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const recent = presentation.recentImpactSummary;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'recentImpact')) return null;
  const visible = recent.visibility === 'visible' && recent.chips.length > 0;

  if (!visible) return null;

  const tone = recentTonePalette(recent.tone);
  const title = routeLabel(recent.targetTitle ?? recent.compactSummary, 'Son etki kayda geçti');
  const subtitle = routeLabel(
    recent.subtitle ?? recent.socialLine ?? recent.advisorLine ?? recent.footerLine,
    'Sonuç etkisi şehir nabzına işlendi.',
  );
  const footerLine = recent.socialLine ?? recent.advisorLine ?? recent.footerLine;
  const action = recent.secondaryAction ?? recent.primaryAction;

  return (
    <RoutePressable
      route={action?.route}
      disabled={action?.enabled === false}
      preserveDisabledOpacity={!action?.route}
      reducedMotion={reducedMotion}
      accessibilityLabel={title}
      style={styles.impactCard}>
      <CenterHubImageFrame
        source={routeActionImage}
        style={styles.impactCardBg}
        gradientColors={['#132A29', '#0B1919', '#050D0E']}
        vignette={false}
      />
      <LinearGradient
        colors={['rgba(5,13,14,0.55)', 'rgba(5,13,14,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.impactCardHeader}>
        <View style={styles.impactCardLabelRow}>
          <LiveDot reducedMotion={reducedMotion} />
          <Text style={styles.impactCardLabel} numberOfLines={1}>
            {recent.title || 'Son Etki'}
          </Text>
        </View>
        {recent.statusLabel ? (
          <View
            style={[
              styles.impactStatusPill,
              { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor },
            ]}>
            <Text style={[styles.impactStatusText, { color: tone.textColor }]} numberOfLines={1}>
              {recent.statusLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.impactCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.impactCardSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      <View style={styles.impactMetricRow}>
        {recent.chips.slice(0, 3).map((chip) => {
          const chipTone = recentTonePalette(chip.tone);
          return (
            <View
              key={chip.id}
              style={[
                styles.impactMetricPill,
                { borderColor: chipTone.borderColor, backgroundColor: chipTone.backgroundColor },
              ]}>
              <Ionicons
                name={recentChipIcon(chip.tone, chip.label)}
                size={10}
                color={chipTone.iconColor}
              />
              <Text style={[styles.impactMetricValue, { color: chipTone.textColor }]} numberOfLines={1}>
                {chip.valueText}
              </Text>
              <Text style={styles.impactMetricLabel} numberOfLines={1}>
                {chip.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.impactFooterRow}>
        <Text style={styles.impactFooterText} numberOfLines={1}>
          {footerLine ?? recent.districtName ?? 'Rapor hafızasına eklendi'}
        </Text>
        {action?.label ? (
          <View style={styles.impactFooterCta}>
            <Text style={styles.impactFooterCtaText} numberOfLines={1}>
              {action.label}
            </Text>
            <Ionicons name="chevron-forward" size={10} color={palette.gold} />
          </View>
        ) : null}
      </View>
    </RoutePressable>
  );
}

function ProgressImpactRow({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (hubSectionIsHidden(presentation.gameFirst.densityLayout.hiddenSections, 'progressImpact')) {
    return null;
  }

  return (
    <View style={styles.progressImpactRow}>
      <StageProgressCard presentation={presentation} />
      <RecentImpactCard presentation={presentation} reducedMotion={reducedMotion} />
    </View>
  );
}

function resolveActionImage(index: number): ImageSource {
  if (index === 0) return routeActionImage;
  if (index === 1) return marketActionImage;
  return droneActionImage;
}

function ImpactTagRow({ impactTag }: { impactTag?: string }) {
  if (!impactTag?.trim()) return null;
  return (
    <View style={styles.nextImpactTag}>
      <Ionicons name="flash-outline" size={10} color={palette.mint} />
      <Text style={styles.nextImpactTagText} numberOfLines={1}>
        {impactTag}
      </Text>
    </View>
  );
}

function NextMoveCard({
  move,
  index,
  reducedMotion,
}: {
  move: NextMove;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <RoutePressable
      route={move.cta.route}
      disabled={move.disabled}
      reducedMotion={reducedMotion}
      accessibilityLabel={move.title}
      style={styles.nextActionCard}>
      <CenterHubImageFrame
        source={resolveActionImage(index)}
        style={styles.nextActionImageFull}
        gradientColors={['#132A29', '#0B1919', '#050D0E']}
        vignette={false}
      />
      <LinearGradient
        colors={['rgba(5,13,14,0.05)', 'rgba(5,13,14,0.55)', 'rgba(5,13,14,0.96)']}
        locations={[0, 0.45, 1]}
        style={styles.nextActionOverlay}
      />
      <View style={styles.nextActionCategory}>
        <Ionicons name={resolveIconName(move.iconKey, 'ellipse-outline')} size={12} color={palette.text} />
      </View>
      <View style={styles.nextActionBottom}>
        <Text style={styles.nextActionTitle} numberOfLines={2}>
          {move.title}
        </Text>
        {move.description ? (
          <Text style={styles.nextMoveDescription} numberOfLines={2}>
            {move.description}
          </Text>
        ) : null}
        <ImpactTagRow impactTag={move.impactTag} />
        {move.lockReason ? (
          <Text style={styles.nextMoveLockReason} numberOfLines={1}>
            {move.lockReason}
          </Text>
        ) : null}
      </View>
    </RoutePressable>
  );
}

function NextActionsRail({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'quickActions')) return null;
  const nextMoves = presentation.gameFirst.nextMoves;
  if (nextMoves.visibility !== 'visible') return null;

  const moves = nextMoves.moves.slice(0, resolveHubNextMovesCap(presentation.hubDensity?.band ?? 'day1'));
  if (moves.length === 0) return null;

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeaderBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {nextMoves.title}
          </Text>
        </View>
        {nextMoves.subtitle ? (
          <Text style={styles.sectionSubtitle} numberOfLines={2}>
            {nextMoves.subtitle}
          </Text>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nextActionsScroller}>
        {moves.map((move, index) => (
          <NextMoveCard key={move.id} move={move} index={index} reducedMotion={reducedMotion} />
        ))}
      </ScrollView>
    </View>
  );
}

function MiniCityFeedRow({
  item,
  reducedMotion,
}: {
  item: MiniCityFeedItem;
  reducedMotion: boolean;
}) {
  const tone = feedTonePalette(item.tone);
  const iconName = resolveIconName(item.iconKey, 'ellipse-outline');
  const pressable = Boolean(item.routeKey);

  const content = (
    <>
      <View style={[styles.feedItemIconWrap, { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor }]}>
        <Ionicons name={iconName} size={14} color={tone.iconColor} />
      </View>
      <View style={styles.feedItemCopy}>
        <Text style={styles.feedItemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={styles.feedItemSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.feedItemSourcePill, { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor }]}>
        <Text style={[styles.feedItemSourceText, { color: tone.textColor }]} numberOfLines={1}>
          {item.sourceLabel}
        </Text>
        {pressable ? <Ionicons name="chevron-forward" size={10} color={tone.textColor} /> : null}
      </View>
    </>
  );

  if (!pressable) {
    return <View style={styles.feedItemRow}>{content}</View>;
  }

  return (
    <RoutePressable
      route={item.routeKey}
      reducedMotion={reducedMotion}
      accessibilityLabel={item.title}
      style={styles.feedItemRow}>
      {content}
    </RoutePressable>
  );
}

function MiniCityFeedSection({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (presentation.gameFirst.densityLayout.duplicateCityPulseSuppressed) return null;
  if (hubSectionIsHidden(presentation.gameFirst.densityLayout.hiddenSections, 'miniCityFeed')) return null;

  const pulse = presentation.gameFirst.cityPulse;
  if (pulse.visibility !== 'visible') return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'miniCityFeed')) return null;

  const maxItems = resolveHubFeedItemCap(presentation.hubDensity?.band ?? 'day1');
  const items = pulse.items.slice(0, maxItems);
  if (items.length === 0) return null;

  const compact = hubSurfaceCollapseMode(presentation.hubDensity, 'miniCityFeed') === 'compact';

  return (
    <View style={[styles.feedCard, compact ? styles.feedCardCompact : undefined]}>
      <LinearGradient
        colors={['rgba(16,40,38,0.92)', 'rgba(8,22,24,0.96)', 'rgba(5,13,14,1)']}
        style={styles.feedCardGradient}
      />
      <View style={styles.feedHeader}>
        <View style={styles.feedHeaderCopy}>
          <Text style={styles.largeSectionTitle} numberOfLines={1}>
            {pulse.title}
          </Text>
          {!compact ? (
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {pulse.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.feedStatusPill}>
          <LiveDot reducedMotion={reducedMotion} />
          <Text style={styles.feedStatusText} numberOfLines={1}>
            {pulse.statusPill}
          </Text>
        </View>
      </View>
      <View style={[styles.feedItemList, compact ? styles.feedItemListCompact : undefined]}>
        {items.map((item) => (
          <MiniCityFeedRow
            key={item.id}
            item={{
              id: item.id,
              type: item.type,
              title: item.message,
              subtitle: item.detail,
              sourceLabel: item.sourceLabel,
              tone: item.tone,
              iconKey: undefined,
              priority: 1,
              dedupeKey: item.id,
              routeKey: item.routeKey,
              actionKey: item.actionKey,
            }}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

function CityAgendaChip({ presentation }: { presentation: CenterHomePresentation }) {
  const agenda = presentation.cityAgenda;
  const progressToneColor =
    agenda.progressTone === 'critical'
      ? '#FF6B6B'
      : agenda.progressTone === 'warning'
        ? palette.gold
        : agenda.progressTone === 'positive'
          ? palette.green
          : palette.mint;

  return (
    <View style={styles.agendaChipCard}>
      <View style={styles.agendaChipHeader}>
        <Text style={styles.agendaChipTitle} numberOfLines={1}>
          {agenda.sectionTitle}
        </Text>
        <View style={[styles.agendaProgressPill, { borderColor: `${progressToneColor}55` }]}>
          <Text style={[styles.agendaProgressText, { color: progressToneColor }]} numberOfLines={1}>
            {agenda.progressLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.agendaChipGoal} numberOfLines={1}>
        {agenda.goalTitle}
      </Text>
    </View>
  );
}

function MaintenanceSignalStrip({ presentation }: { presentation: CenterHomePresentation }) {
  const signal = presentation.hubDensity?.maintenanceSignal;
  if (!signal) return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'maintenanceSignal')) return null;

  const compact = hubSurfaceCollapseMode(presentation.hubDensity, 'maintenanceSignal') === 'chip';
  const toneColor =
    signal.tone === 'critical' ? '#FF6B6B' : signal.tone === 'warning' ? palette.gold : palette.mint;

  return (
    <View style={styles.maintenanceStrip}>
      <View style={[styles.maintenanceStripIcon, { borderColor: `${toneColor}55` }]}>
        <Ionicons name="construct-outline" size={14} color={toneColor} />
      </View>
      <View style={styles.maintenanceStripCopy}>
        <Text style={styles.maintenanceStripTitle} numberOfLines={1}>
          {signal.title}
        </Text>
        {!compact && signal.subtitle ? (
          <Text style={styles.maintenanceStripSubtitle} numberOfLines={2}>
            {signal.subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CityAgendaSection({ presentation }: { presentation: CenterHomePresentation }) {
  const agenda = presentation.cityAgenda;
  if (agenda.visibility !== 'visible') return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'cityAgenda')) return null;

  if (hubSurfaceCollapseMode(presentation.hubDensity, 'cityAgenda') === 'chip') {
    return <CityAgendaChip presentation={presentation} />;
  }

  const compact = hubSurfaceCollapseMode(presentation.hubDensity, 'cityAgenda') === 'compact';

  const progressToneColor =
    agenda.progressTone === 'critical'
      ? '#FF6B6B'
      : agenda.progressTone === 'warning'
        ? palette.gold
        : agenda.progressTone === 'positive'
          ? palette.green
          : palette.mint;

  return (
    <View style={styles.agendaCard}>
      <LinearGradient
        colors={['rgba(16,40,38,0.9)', 'rgba(8,22,24,0.96)', 'rgba(5,13,14,1)']}
        style={styles.feedCardGradient}
      />
      <View style={styles.agendaHeader}>
        <View style={styles.agendaTitleBlock}>
          <Text style={styles.agendaSectionTitle} numberOfLines={1}>
            {agenda.sectionTitle}
          </Text>
          <Text style={styles.agendaGoalTitle} numberOfLines={2}>
            {agenda.goalTitle}
          </Text>
        </View>
        <View style={[styles.agendaProgressPill, { borderColor: `${progressToneColor}55` }]}>
          <Text style={[styles.agendaProgressText, { color: progressToneColor }]} numberOfLines={1}>
            {agenda.progressLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.agendaSummary} numberOfLines={compact ? 1 : 2}>
        {agenda.summary}
      </Text>
      {!compact ? (
        <View style={styles.agendaChipRow}>
          {agenda.chips.map((chip) => (
            <View key={`${chip.label}-${chip.value}`} style={styles.agendaChip}>
              <Text style={styles.agendaChipLabel} numberOfLines={1}>
                {chip.label}
              </Text>
              <Text style={styles.agendaChipValue} numberOfLines={1}>
                {chip.value}
              </Text>
            </View>
          ))}
          {agenda.secondaryChip ? (
            <View style={styles.agendaSecondaryChip}>
              <Text style={styles.agendaSecondaryChipText} numberOfLines={1}>
                {agenda.secondaryChip}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {!compact ? (
        <Text style={styles.agendaHint} numberOfLines={2}>
          {agenda.nextHint}
        </Text>
      ) : null}
    </View>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Ionicons name="time-outline" size={16} color={palette.faint} />
      <Text style={styles.emptyPanelText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function parseMetricPercent(valueText: string | undefined, fallback: number): number {
  const match = valueText?.match(/(\d+)/);
  if (match) return clampPercent(Number(match[1]));
  return fallback;
}

type PulseSparkMetric = {
  id: string;
  label: string;
  percent: number;
  icon: IconName;
  color: string;
  trackColor: string;
  sparkValues: number[];
};

type ChartPoint = {
  x: number;
  y: number;
};

function buildSparkValues(seed: number, percent: number): number[] {
  const base = clampPercent(percent);
  return Array.from({ length: 7 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.9) * 8;
    const drift = index * 1.4;
    return clampPercent(base * (0.78 + index * 0.035) + wave + drift - seed * 2);
  });
}

function mixTrendValues(baseValues: number[], targetPercent: number, seed: number): number[] {
  const source = baseValues.length >= 4 ? baseValues : buildSparkValues(seed, targetPercent);
  const anchor = clampPercent(targetPercent);
  return source.slice(0, 7).map((value, index) => {
    const signal = Math.sin((index + 1) * (0.72 + seed * 0.07)) * (5 + seed);
    const pullToMetric = anchor * 0.46 + value * 0.54;
    const eventNudge = index >= source.length - 2 ? seed * 1.5 : 0;
    return clampPercent(pullToMetric + signal + eventNudge - seed * 1.4);
  });
}

function buildPulseSparkMetrics(presentation: CenterHomePresentation): PulseSparkMetric[] {
  const { compact } = presentation.strategicPulse;
  const chartValues = presentation.strategicPulse.detail.chart.map((point) => point.value);
  const happiness = presentation.citySummary.metrics.find((metric) => metric.id === 'happiness');
  const satisfactionPercent = parseMetricPercent(happiness?.valueText, 81);

  return [
    {
      id: 'pressure',
      label: compact.pressure.label || 'Baskı',
      percent: clampPercent(compact.pressure.percent || 62),
      icon: 'shield-outline',
      color: '#FFB800',
      trackColor: 'rgba(255,184,0,0.18)',
      sparkValues: mixTrendValues(chartValues, compact.pressure.percent || 62, 1),
    },
    {
      id: 'risk',
      label: compact.risk.label || 'Risk',
      percent: clampPercent(compact.risk.percent || 74),
      icon: 'warning-outline',
      color: '#FF6B6B',
      trackColor: 'rgba(255,107,107,0.18)',
      sparkValues: mixTrendValues([...chartValues].reverse(), compact.risk.percent || 74, 2),
    },
    {
      id: 'opportunity',
      label: compact.opportunity.label || 'Fırsat',
      percent: clampPercent(compact.opportunity.percent || 58),
      icon: 'sparkles-outline',
      color: '#4ADE80',
      trackColor: 'rgba(74,222,128,0.18)',
      sparkValues: mixTrendValues(chartValues, compact.opportunity.percent || 58, 3),
    },
    {
      id: 'satisfaction',
      label: 'Memnuniyet',
      percent: satisfactionPercent,
      icon: 'happy-outline',
      color: '#38BDF8',
      trackColor: 'rgba(56,189,248,0.18)',
      sparkValues: mixTrendValues(
        chartValues.map((value) => 100 - Math.abs(value - satisfactionPercent)),
        satisfactionPercent,
        4,
      ),
    },
  ];
}

function buildChartPoints(values: number[], width: number, height: number): ChartPoint[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 7) - 3.5;
      return { x, y };
    });
}

function buildSmoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1]!;
    const controlDistance = (point.x - previous.x) * 0.46;
    return `${path} C ${previous.x + controlDistance} ${previous.y}, ${point.x - controlDistance} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function buildAreaPath(points: ChartPoint[], height: number): string {
  if (points.length === 0) return '';
  const linePath = buildSmoothPath(points);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

function PulseSparkline({ metric }: { metric: PulseSparkMetric }) {
  const width = 76;
  const height = 34;
  const values = metric.sparkValues.length >= 2 ? metric.sparkValues : buildSparkValues(1, metric.percent);
  const points = buildChartPoints(values, width, height);
  const linePath = buildSmoothPath(points);
  const areaPath = buildAreaPath(points, height);
  const lastPoint = points[points.length - 1];
  const avgY =
    points.length > 0
      ? points.reduce((sum, point) => sum + point.y, 0) / points.length
      : height / 2;
  const gradientId = `pulse-area-${metric.id}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={metric.color} stopOpacity="0.28" />
          <Stop offset="1" stopColor={metric.color} stopOpacity="0.02" />
        </SvgLinearGradient>
      </Defs>
      {[0.28, 0.58, 0.88].map((ratio) => (
        <Line
          key={ratio}
          x1={0}
          y1={height * ratio}
          x2={width}
          y2={height * ratio}
          stroke="rgba(246,240,218,0.08)"
          strokeWidth={0.7}
        />
      ))}
      <Line
        x1={0}
        y1={avgY}
        x2={width}
        y2={avgY}
        stroke="rgba(246,240,218,0.13)"
        strokeWidth={0.8}
        strokeDasharray="3 4"
      />
      <Path d={areaPath} fill={`url(#${gradientId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={metric.color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint ? (
        <>
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.8} fill="rgba(5,13,14,0.92)" />
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={2.4} fill={metric.color} />
        </>
      ) : null}
    </Svg>
  );
}

function PulseSparkCard({ metric }: { metric: PulseSparkMetric }) {
  const fillWidth = `${clampPercent(metric.percent)}%` as `${number}%`;

  return (
    <View style={styles.pulseSparkCard}>
      <View style={styles.pulseSparkTop}>
        <View style={[styles.pulseSparkIcon, { backgroundColor: metric.trackColor }]}>
          <Ionicons name={metric.icon} size={11} color={metric.color} />
        </View>
        <View style={styles.pulseSparkCopy}>
          <Text style={styles.pulseSparkLabel} numberOfLines={1}>
            {metric.label}
          </Text>
          <Text style={[styles.pulseSparkValue, { color: metric.color }]} numberOfLines={1}>
            %{clampPercent(metric.percent)}
          </Text>
        </View>
        <PulseSparkline metric={metric} />
      </View>
      <View style={[styles.pulseSparkTrack, { backgroundColor: metric.trackColor }]}>
        <View style={[styles.pulseSparkFill, { width: fillWidth, backgroundColor: metric.color }]} />
      </View>
    </View>
  );
}

function HubCompactPulseAdvisorStrip({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const bundle = presentation.gameFirst.firstViewportPulse;
  const pulse = bundle.pulse;
  const advisor = bundle.advisor;
  const pulseVisible = pulse.visibility === 'visible';
  const advisorVisible =
    advisor.visibility === 'visible' &&
    hubSurfaceIsRenderable(presentation.hubDensity, 'advisor');

  if (!pulseVisible && !advisorVisible) return null;

  const primarySignal = pulse.primarySignal;
  const signals = pulse.signals.length > 0 ? pulse.signals : primarySignal ? [primarySignal] : [];
  const signalRoute = primarySignal?.routeKey;

  return (
    <View style={styles.compactPulseZone}>
      {pulseVisible ? (
        <View style={styles.compactPulseCard}>
          <View style={styles.compactPulseHeader}>
            <View style={styles.compactPulseTitleRow}>
              <View style={styles.pulseTitleIcon}>
                <Ionicons name="pulse" size={14} color={palette.teal} />
              </View>
              <Text style={styles.compactPulseTitle} numberOfLines={1}>
                {pulse.title}
              </Text>
            </View>
            <View style={styles.feedStatusPill}>
              <LiveDot reducedMotion={reducedMotion} />
              <Text style={styles.feedStatusText} numberOfLines={1}>
                {pulse.statusPill}
              </Text>
            </View>
          </View>
          <View style={styles.compactPulseSignalList}>
            {signals.map((signal) => (
              <RoutePressable
                key={signal.id}
                route={signal.routeKey}
                reducedMotion={reducedMotion}
                accessibilityLabel={signal.message}
                style={styles.compactPulseSignalRow}>
                <Text style={styles.compactPulseSignalText} numberOfLines={2}>
                  • {signal.message}
                </Text>
                {signal.detail ? (
                  <Text style={styles.compactPulseSignalDetail} numberOfLines={1}>
                    {signal.detail}
                  </Text>
                ) : null}
              </RoutePressable>
            ))}
          </View>
          {pulse.impactChips.length > 0 ? (
            <View style={styles.compactImpactChipRow}>
              {pulse.impactChips.map((chip) => (
                <View key={chip.id} style={styles.compactImpactChip}>
                  <Text style={styles.compactImpactChipText} numberOfLines={1}>
                    {chip.valueText ? `${chip.label} ${chip.valueText}` : chip.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {advisorVisible ? (
        <RoutePressable
          route={advisor.suggestedAction?.route}
          reducedMotion={reducedMotion}
          accessibilityLabel={advisor.recommendation}
          style={styles.compactAdvisorStrip}>
          <View style={styles.pulseAdvisorAvatarWrap}>
            <Image source={hubAssets.advisorPortrait} style={styles.pulseAdvisorAvatar} contentFit="cover" />
            <View style={styles.pulseAdvisorSparkle}>
              <Ionicons name="sparkles" size={8} color={palette.green} />
            </View>
          </View>
          <View style={styles.pulseAdvisorCopy}>
            <Text style={styles.pulseAdvisorTitle} numberOfLines={1}>
              {advisor.advisorName}
            </Text>
            <Text style={styles.pulseAdvisorBody} numberOfLines={2}>
              {advisor.recommendation}
            </Text>
            {advisor.reasonChip ? (
              <View style={styles.compactAdvisorReasonChip}>
                <Text style={styles.compactAdvisorReasonText} numberOfLines={1}>
                  {advisor.reasonChip}
                </Text>
              </View>
            ) : null}
          </View>
          {advisor.suggestedAction?.label ? (
            <View style={styles.pulseAdvisorCta}>
              <Ionicons name="arrow-forward" size={14} color={palette.text} />
            </View>
          ) : null}
        </RoutePressable>
      ) : null}
    </View>
  );
}

function CityPulseAdvisorStrip({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const advisor = presentation.gameFirst.advisor;
  if (advisor.visibility !== 'visible' || !advisor.recommendation.trim()) return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'advisor')) return null;

  const route = advisor.suggestedAction?.route ?? presentation.strategicPulse.compact.cta.route;

  return (
    <RoutePressable
      route={route}
      reducedMotion={reducedMotion}
      accessibilityLabel={advisor.recommendation}
      style={styles.pulseAdvisorStrip}>
      <View style={styles.pulseAdvisorAvatarWrap}>
        <Image source={hubAssets.advisorPortrait} style={styles.pulseAdvisorAvatar} contentFit="cover" />
        <View style={styles.pulseAdvisorSparkle}>
          <Ionicons name="sparkles" size={8} color={palette.green} />
        </View>
      </View>
      <View style={styles.pulseAdvisorCopy}>
        <Text style={styles.pulseAdvisorTitle} numberOfLines={1}>
          {advisor.advisorName}
        </Text>
        <Text style={styles.pulseAdvisorBody} numberOfLines={2}>
          {advisor.recommendation}
        </Text>
        {advisor.riskWarning ? (
          <Text style={styles.pulseAdvisorRisk} numberOfLines={1}>
            {advisor.riskWarning}
          </Text>
        ) : null}
      </View>
      {advisor.suggestedAction?.label ? (
        <View style={styles.pulseAdvisorCta}>
          <Ionicons name="arrow-forward" size={14} color={palette.text} />
        </View>
      ) : null}
    </RoutePressable>
  );
}

function CityPulseCard({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (presentation.gameFirst.densityLayout.duplicateCityPulseSuppressed) return null;
  if (hubSectionIsHidden(presentation.gameFirst.densityLayout.hiddenSections, 'strategicPulse')) return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'strategicPulse')) return null;

  const metrics = buildPulseSparkMetrics(presentation);
  const compact = hubSurfaceCollapseMode(presentation.hubDensity, 'strategicPulse') !== 'full';

  return (
    <View style={styles.pulseCard}>
      <LinearGradient
        colors={['rgba(16,40,38,0.95)', 'rgba(8,22,24,0.98)', 'rgba(5,13,14,1)']}
        style={styles.pulseCardGradient}
      />
      <View style={styles.pulseHeader}>
        <View style={styles.pulseTitleRow}>
          <View style={styles.pulseTitleIcon}>
            <Ionicons name="pulse" size={16} color={palette.green} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.largeSectionTitle} numberOfLines={1}>
              Şehir Nabzı
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              Şehrinin genel durumu anlık olarak güncelleniyor.
            </Text>
          </View>
        </View>
        <View style={styles.livePill}>
          <LiveDot reducedMotion={reducedMotion} />
          <Text style={styles.livePillText}>Canlı</Text>
        </View>
      </View>
      <View style={styles.pulseSparkGrid}>
        {metrics.slice(0, compact ? 2 : 3).map((metric) => (
          <PulseSparkCard key={metric.id} metric={metric} />
        ))}
      </View>
      {!compact ? (
        <CityPulseAdvisorStrip presentation={presentation} reducedMotion={reducedMotion} />
      ) : null}
    </View>
  );
}

function DistrictFocusCard({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (hubSectionIsHidden(presentation.gameFirst.densityLayout.hiddenSections, 'districtSpotlight')) {
    return null;
  }

  const spotlight = presentation.gameFirst.districtSpotlight;
  const compact =
    presentation.gameFirst.activeOperationFocus.visibility === 'visible' ||
    presentation.gameFirst.densityLayout.mergedPrimaryFocus;
  if (spotlight.visibility !== 'visible') return null;

  const footerStats = [
    spotlight.trustBand ? { label: 'Güven', value: spotlight.trustBand, icon: 'shield-checkmark-outline' as IconName } : null,
    spotlight.dominantIssue ? { label: 'Sorun', value: spotlight.dominantIssue, icon: 'alert-circle-outline' as IconName } : null,
    spotlight.latestDevelopment ? { label: 'Son', value: spotlight.latestDevelopment, icon: 'pulse-outline' as IconName } : null,
  ].filter((stat): stat is { label: string; value: string; icon: IconName } => Boolean(stat));

  return (
    <View style={[styles.regionCard, compact ? styles.regionCardCompact : undefined]}>
      <View style={styles.regionHeader}>
        <Text style={styles.regionEyebrow} numberOfLines={1}>
          Mahalle Odağı
        </Text>
        <View style={styles.regionLevelBadge}>
          <Text style={styles.regionLevelText} numberOfLines={1}>
            {spotlight.trustBand}
          </Text>
        </View>
      </View>
      <Text style={styles.regionTitle} numberOfLines={compact ? 1 : 2}>
        {spotlight.districtName}
      </Text>
      {!compact ? (
        <>
          <Text style={styles.regionBody} numberOfLines={2}>
            {spotlight.suggestedAction || spotlight.latestDevelopment || 'Mahalle sinyalleri takip ediliyor.'}
          </Text>
          <View style={styles.regionImageWrap}>
            <CenterHubImageFrame
              source={hubAssets.centerSummaryHero}
              style={styles.regionImage}
              gradientColors={['#FFF6E6', '#EAF5EE', g.backgroundCream]}
            />
          </View>
        </>
      ) : (
        <Text style={styles.regionBody} numberOfLines={1}>
          {spotlight.dominantIssue || spotlight.suggestedAction || spotlight.latestDevelopment}
        </Text>
      )}
      <RoutePressable
        route={spotlight.cta.route}
        reducedMotion={reducedMotion}
        accessibilityLabel={spotlight.cta.label}
        style={[styles.regionCta, compact ? styles.regionCtaCompact : undefined]}>
        <Text style={styles.regionCtaText} numberOfLines={1}>
          {spotlight.cta.label}
        </Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </RoutePressable>
      {!compact && footerStats.length > 0 ? (
        <View style={styles.regionFooterStats}>
          {footerStats.map((stat) => (
            <View key={stat.label} style={styles.regionFooterStat}>
              <Ionicons name={stat.icon} size={11} color={palette.green} />
              <Text style={styles.regionFooterLabel} numberOfLines={1}>
                {stat.label}
              </Text>
              <Text style={styles.regionFooterValue} numberOfLines={1}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function resolveEventImage(imageKey: EventCardModel['imageKey']): ImageSource {
  switch (imageKey) {
    case 'park':
    case 'safe':
      return hubAssets.centerSummaryPark;
    case 'market':
      return marketActionImage;
    case 'hall':
      return hubAssets.day1Plan.heroBuilding;
    case 'city':
    default:
      return hubAssets.centerSummaryHero;
  }
}

function LiveDevelopmentCard({
  event,
  reducedMotion,
}: {
  event: EventCardModel;
  reducedMotion: boolean;
}) {
  return (
    <RoutePressable
      route={event.routeKey}
      reducedMotion={reducedMotion}
      accessibilityLabel={event.title}
      style={styles.developmentCard}>
      <CenterHubImageFrame
        source={resolveEventImage(event.imageKey)}
        style={styles.developmentCardImage}
        gradientColors={['#132A29', '#0B1919', '#050D0E']}
        vignette={false}
      />
      <LinearGradient
        colors={['rgba(5,13,14,0.08)', 'rgba(5,13,14,0.92)']}
        style={styles.developmentCardOverlay}
      />
      {event.statusLabel ? (
        <View style={styles.developmentTag}>
          <Text style={styles.developmentTagText} numberOfLines={1}>
            {event.statusLabel}
          </Text>
        </View>
      ) : null}
      <View style={styles.developmentCardCopy}>
        <Text style={styles.developmentCardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.developmentCardBody} numberOfLines={3}>
          {event.valueLabel ?? event.locationLabel}
        </Text>
        <View style={styles.developmentTimeRow}>
          <LiveDot reducedMotion={reducedMotion} />
          <Text style={styles.developmentTime} numberOfLines={1}>
            {event.timeLabel}
          </Text>
        </View>
      </View>
    </RoutePressable>
  );
}

function LiveDevelopments({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  if (presentation.neighborhoodEvents.visibility !== 'visible') return null;
  if (
    presentation.hubDensity &&
    !hubSurfaceIsRenderable(presentation.hubDensity, 'lowerDashboard') &&
    presentation.hubDensity.band !== 'early' &&
    presentation.hubDensity.band !== 'mid'
  ) {
    return null;
  }

  const events = presentation.neighborhoodEvents.events.slice(0, 4);
  if (events.length === 0) return null;

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.largeSectionTitle} numberOfLines={1}>
          Canlı Gelişmeler
        </Text>
        <RoutePressable
          route={presentation.recommendedPlan.cta?.route}
          reducedMotion={reducedMotion}
          accessibilityLabel="Tümünü Gör"
          style={styles.sectionLink}>
          <Text style={styles.sectionLinkText}>Tümünü Gör</Text>
          <Ionicons name="chevron-forward" size={12} color={palette.gold} />
        </RoutePressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.developmentsScroller}>
        {events.map((event) => (
          <LiveDevelopmentCard key={event.id} event={event} reducedMotion={reducedMotion} />
        ))}
      </ScrollView>
    </View>
  );
}

function ProgressionStrip({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const progression = presentation.gameFirst.progression;
  if (progression.visibility !== 'visible') return null;

  return (
    <RoutePressable
      route={progression.cta?.route}
      disabled={!progression.cta?.enabled}
      preserveDisabledOpacity={!progression.cta?.route}
      reducedMotion={reducedMotion}
      accessibilityLabel={progression.nextUnlockLabel}
      style={styles.progressionStrip}>
      <Ionicons name="lock-open-outline" size={14} color={palette.gold} />
      <View style={styles.progressionCopy}>
        <Text style={styles.progressionRank} numberOfLines={1}>
          {progression.sectionTitle}
        </Text>
        <Text style={styles.progressionUnlock} numberOfLines={1}>
          {progression.nextUnlockLabel}
        </Text>
      </View>
      {progression.streakLabel ? (
        <Text style={styles.progressionMeta} numberOfLines={1}>
          {progression.streakLabel}
        </Text>
      ) : null}
    </RoutePressable>
  );
}

function UnlockPreviewStrip({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const unlock = presentation.unlockPreviewMini;
  if (unlock.visibility !== 'visible') return null;

  return (
    <RoutePressable
      route={unlock.routeKey}
      reducedMotion={reducedMotion}
      accessibilityLabel={`${unlock.featureTitle}. ${unlock.unlockCondition}`}
      style={styles.unlockStrip}>
      <Ionicons name="lock-closed-outline" size={14} color={palette.gold} />
      <View style={styles.unlockCopy}>
        <Text style={styles.unlockTitle} numberOfLines={1}>
          {unlock.featureTitle}
        </Text>
        <Text style={styles.unlockBody} numberOfLines={1}>
          {unlock.unlockCondition}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={palette.gold} />
    </RoutePressable>
  );
}

function QuickCommandsGrid({
  presentation,
  reducedMotion,
}: {
  presentation: CenterHomePresentation;
  reducedMotion: boolean;
}) {
  const quickActions = presentation.gameFirst.quickActions;
  if (quickActions.visibility !== 'visible') return null;
  if (!hubSurfaceIsRenderable(presentation.hubDensity, 'quickActions')) return null;

  const cap = resolveHubQuickActionsCap(presentation.hubDensity?.band ?? 'day1');
  const commands = quickActions.actions.slice(0, cap);
  const overflowCount = quickActions.actions.length - commands.length;
  if (commands.length === 0) return null;

  return (
    <View style={styles.lightCard}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {quickActions.title}
      </Text>
      <View style={styles.quickActionChipRow}>
        {commands.map((command) => (
          <RoutePressable
            key={command.id}
            route={command.cta.route}
            disabled={command.disabled}
            reducedMotion={reducedMotion}
            accessibilityLabel={command.title}
            style={styles.quickActionChip}>
            <Ionicons
              name={resolveIconName(command.iconKey, command.disabled ? 'lock-closed-outline' : 'grid-outline')}
              size={14}
              color={command.accent === 'gold' ? palette.gold : palette.teal}
            />
            <Text style={styles.quickActionChipText} numberOfLines={1}>
              {command.title}
            </Text>
          </RoutePressable>
        ))}
        {overflowCount > 0 ? (
          <View style={styles.quickActionOverflowChip}>
            <Text style={styles.quickActionOverflowText} numberOfLines={1}>
              {HUB_DENSITY_LIMITS.quickActionsOverflowLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function HubReferenceHome({ presentation, scrollFooter }: HubReferenceHomeProps) {
  const { compact, topPadding, bottomPadding, horizontalPadding } = useLayoutMetrics();
  const reducedMotion = useCreviaReducedMotion();
  const dayText =
    presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day')?.valueText ?? '1';
  const hubDay = Number(dayText.match(/\d+/)?.[0] ?? '1');
  const hubMotionEnabled = hubDay >= 8;
  const densityBand = presentation.hubDensity?.band ?? 'day1';
  const sectionGap = densityBand === 'day1' ? 12 : compact ? 10 : gameUi.spacing.cardGap;
  const motionProps = {
    day: hubDay,
    reducedMotion,
    hubMotionEnabled,
    disabled: !hubMotionEnabled,
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.appBg, palette.appBgDeep, palette.panelSoft]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
            paddingHorizontal: horizontalPadding,
            gap: sectionGap,
          },
        ]}>
        <HeaderBar presentation={presentation} reducedMotion={reducedMotion} />
        <TopInfoChips presentation={presentation} reducedMotion={reducedMotion} />
        <CenterMotionEnter index={1} {...motionProps}>
          <MainHero presentation={presentation} reducedMotion={reducedMotion} />
        </CenterMotionEnter>
        <CenterMotionEnter index={2} {...motionProps}>
          <ActiveOperationFocusCard presentation={presentation} reducedMotion={reducedMotion} />
        </CenterMotionEnter>
        <CenterMotionEnter index={3} {...motionProps}>
          <HubCompactPulseAdvisorStrip presentation={presentation} reducedMotion={reducedMotion} />
        </CenterMotionEnter>

        <View style={styles.scrollDepthZone}>
          <View style={styles.scrollDepthDivider}>
            <View style={styles.scrollDepthLine} />
            <Text style={styles.scrollDepthLabel} numberOfLines={1}>
              Detaylar
            </Text>
            <View style={styles.scrollDepthLine} />
          </View>

          <CenterMotionEnter index={4} {...motionProps}>
            <NextActionsRail presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={5} {...motionProps}>
            <QuickCommandsGrid presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={6} {...motionProps}>
            <ProgressionStrip presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={7} {...motionProps}>
            <DistrictFocusCard presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={8} {...motionProps}>
            <ProgressImpactRow presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={9} {...motionProps}>
            <MiniCityFeedSection presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          <CenterMotionEnter index={10} {...motionProps}>
            <CityAgendaSection presentation={presentation} />
          </CenterMotionEnter>
          <MaintenanceSignalStrip presentation={presentation} />
          <CenterMotionEnter index={11} {...motionProps}>
            <CityPulseCard presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>
          {hubBandAllowsLiveDevelopments(densityBand) ? (
            <CenterMotionEnter index={12} {...motionProps}>
              <LiveDevelopments presentation={presentation} reducedMotion={reducedMotion} />
            </CenterMotionEnter>
          ) : null}
          <UnlockPreviewStrip presentation={presentation} reducedMotion={reducedMotion} />
        </View>
        {scrollFooter ? <View style={styles.scrollFooter}>{scrollFooter}</View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.appBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: palette.appBg,
  },
  scrollContent: {
    minWidth: 0,
  },
  disabledPressable: {
    opacity: 0.58,
  },
  headerBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profilePressable: {
    flex: 1,
    minWidth: 0,
    minHeight: CENTER_MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarFrame: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: palette.gold,
    backgroundColor: '#1A3D38',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  levelBadge: {
    position: 'absolute',
    left: -4,
    bottom: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.appBg,
    transform: [{ rotate: '45deg' }],
  },
  levelBadgeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    color: '#101812',
    fontVariant: ['tabular-nums'],
    transform: [{ rotate: '-45deg' }],
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  playerName: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  playerRole: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: palette.gold,
  },
  cityMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  cityMiniText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: palette.gold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    maxWidth: '58%',
  },
  resourcePill: {
    minHeight: 35,
    borderRadius: 17,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.panelWarm,
    borderWidth: 1,
    borderColor: palette.strokeGold,
  },
  headerResourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  headerResourceValue: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.panelWarm,
    borderWidth: 1,
    borderColor: palette.strokeGold,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E25E4E',
  },
  topInfoRow: {
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
  infoChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panelWarm,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  infoChipWide: {
    flex: 1.25,
  },
  liveBonusChip: {
    flex: 1.15,
    justifyContent: 'space-between',
  },
  infoIconBox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealGlow,
  },
  infoIconBoxGold: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216, 167, 46, 0.18)',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoTitle: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.text,
  },
  infoSubtitle: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.muted,
  },
  rewardDots: {
    flexDirection: 'row',
    gap: 3,
    minWidth: 0,
  },
  rewardDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(104, 116, 110, 0.22)',
  },
  rewardDotActive: {
    backgroundColor: palette.gold,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    minWidth: 0,
  },
  streakCountBadge: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    color: palette.gold,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  streakMiniTrack: {
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(216, 167, 46, 0.18)',
    overflow: 'hidden',
    marginTop: 1,
  },
  streakMiniFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  liveBonusText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.green,
  },
  heroCard: {
    height: 252,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(216, 167, 46, 0.38)',
    ...gameUi.shadow.hero,
  },
  heroImageFrame: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridOne: {
    position: 'absolute',
    left: -20,
    top: 24,
    width: 180,
    height: 1,
    backgroundColor: 'rgba(147,232,189,0.24)',
    transform: [{ rotate: '-18deg' }],
  },
  mapGridTwo: {
    position: 'absolute',
    right: 22,
    top: 102,
    width: 150,
    height: 1,
    backgroundColor: 'rgba(147,232,189,0.18)',
    transform: [{ rotate: '24deg' }],
  },
  heroNetworkWrap: {
    position: 'absolute',
    right: 8,
    top: 12,
    width: 180,
    height: 70,
  },
  heroNetworkNode: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,25,25,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(147,232,189,0.35)',
  },
  heroCopy: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    gap: 8,
  },
  heroEyebrowPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(216,177,83,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(216,177,83,0.32)',
  },
  heroEyebrow: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    color: palette.gold,
    letterSpacing: 0.4,
  },
  heroTitle: {
    maxWidth: '78%',
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '900',
    color: palette.heroText,
  },
  heroBody: {
    maxWidth: '88%',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.heroMuted,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroMetaChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 1,
    minWidth: 68,
  },
  heroMetaLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.heroMuted,
  },
  heroMetaValue: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.heroText,
  },
  heroCta: {
    alignSelf: 'stretch',
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.gold,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  heroCtaText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#1A2818',
  },
  heroCtaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  heroStage: {
    display: 'none',
  },
  progressImpactRow: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  stageCard: {
    flex: 0.82,
    minWidth: 0,
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
    padding: 12,
    gap: 6,
    justifyContent: 'center',
  },
  stageCardEyebrow: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: palette.faint,
    letterSpacing: 0.3,
  },
  stageCardTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: palette.text,
  },
  stageNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stageNodeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageNodeLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: 4,
  },
  stageNodeLineActive: {
    backgroundColor: palette.green,
  },
  stageNodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNodeDotActive: {
    borderColor: palette.green,
    backgroundColor: palette.green,
  },
  stageNodeFlag: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  impactCard: {
    flex: 1.18,
    minWidth: 0,
    minHeight: 118,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: 10,
    justifyContent: 'space-between',
    gap: 6,
  },
  impactCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  impactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minWidth: 0,
  },
  impactCardLabelRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  impactCardLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: palette.muted,
  },
  impactStatusPill: {
    maxWidth: 66,
    minHeight: 20,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  impactStatusText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
  },
  impactCardTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: palette.text,
  },
  impactCardSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.muted,
  },
  impactMetricRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  impactMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  impactMetricValue: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  impactMetricLabel: {
    maxWidth: 42,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.faint,
  },
  impactFooterRow: {
    minWidth: 0,
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  impactFooterText: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.faint,
  },
  impactFooterCta: {
    maxWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  impactFooterCtaText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    color: palette.gold,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderBlock: {
    gap: 3,
  },
  sectionSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: palette.muted,
  },
  sectionHeaderRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  largeSectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  sectionLink: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  sectionLinkText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: palette.gold,
  },
  nextActionsScroller: {
    gap: 9,
    paddingRight: 6,
  },
  nextActionCard: {
    width: 156,
    height: 198,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.panelSoft,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  nextActionImageFull: {
    ...StyleSheet.absoluteFillObject,
  },
  nextActionOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  nextActionCategory: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,13,14,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(216,177,83,0.28)',
    zIndex: 2,
  },
  nextActionBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 28,
    gap: 6,
  },
  nextActionTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: palette.text,
  },
  nextMoveDescription: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.muted,
  },
  nextImpactTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  nextImpactTagText: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.mint,
  },
  nextMoveLockReason: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.gold,
  },
  operationFocusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panelWarm,
    padding: 14,
    gap: 8,
  },
  operationFocusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  operationFocusEyebrow: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.gold,
    letterSpacing: 0.4,
  },
  operationFocusModePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(217,117,93,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(217,117,93,0.35)',
  },
  operationFocusModeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.red,
  },
  operationFocusTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  operationFocusBody: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.muted,
  },
  operationFocusMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  operationFocusMetaChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: palette.panelSoft,
    borderWidth: 1,
    borderColor: palette.stroke,
    gap: 1,
    minWidth: 72,
  },
  operationFocusMetaLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.faint,
  },
  operationFocusMetaValue: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.text,
  },
  operationFocusCta: {
    marginTop: 2,
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.tealMid,
  },
  operationFocusCtaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressionStrip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panelWarm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  progressionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  progressionRank: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.gold,
  },
  progressionUnlock: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.text,
  },
  progressionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  progressionMeta: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.muted,
  },
  progressionMeter: {
    width: 58,
    alignItems: 'flex-end',
    gap: 4,
  },
  progressionMeterText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.green,
  },
  progressionMeterTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressionMeterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.green,
  },
  pulseAdvisorRisk: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.red,
  },
  compactPulseZone: {
    gap: 8,
  },
  compactPulseCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.16)',
    backgroundColor: palette.panelSoft,
    padding: 12,
    gap: 8,
    overflow: 'hidden',
    ...gameUi.shadow.soft,
  },
  compactPulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactPulseTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactPulseTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.text,
  },
  compactPulseSignalRow: {
    gap: 2,
    minHeight: CENTER_MIN_TOUCH_TARGET - 8,
    justifyContent: 'center',
  },
  compactPulseSignalText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: palette.text,
  },
  compactPulseSignalDetail: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: palette.muted,
  },
  compactImpactChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactImpactChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.22)',
    backgroundColor: 'rgba(74,222,128,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  compactImpactChipText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.mint,
  },
  compactAdvisorStrip: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panelWarm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactAdvisorReasonChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  compactAdvisorReasonText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.gold,
  },
  scrollDepthZone: {
    gap: 12,
    paddingTop: 2,
  },
  scrollDepthDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  scrollDepthLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(216, 167, 46, 0.16)',
  },
  scrollDepthLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: palette.faint,
    textTransform: 'uppercase',
  },
  commandLockReason: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.gold,
  },
  nextRewardRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  nextRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(5,13,14,0.55)',
  },
  nextRewardText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    color: palette.text,
  },
  nextActionEmptyReward: {
    marginTop: 'auto',
    paddingHorizontal: 9,
    paddingBottom: 9,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: palette.faint,
  },
  darkCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panel,
    padding: 13,
    gap: 12,
  },
  lightCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panel,
    padding: 12,
    gap: 10,
    ...gameUi.shadow.soft,
  },
  quickActionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.strokeGold,
    backgroundColor: palette.panelWarm,
    minHeight: 36,
  },
  quickActionChipText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: palette.text,
  },
  quickActionOverflowChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: palette.panelLift,
  },
  quickActionOverflowText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
  },
  compactPulseSignalList: {
    gap: 4,
  },
  regionCardCompact: {
    padding: 12,
    gap: 6,
  },
  regionCtaCompact: {
    minHeight: 36,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 1,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.muted,
  },
  pulseGraphWrap: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  livePill: {
    minHeight: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(143,225,166,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(143,225,166,0.18)',
  },
  livePillText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: palette.green,
  },
  liveDotWrap: {
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotHalo: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: palette.green,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.green,
  },
  feedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panel,
    padding: 12,
    gap: 10,
  },
  feedCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  feedHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  feedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(143,225,166,0.28)',
    backgroundColor: 'rgba(143,225,166,0.10)',
  },
  feedStatusText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: palette.green,
    letterSpacing: 0.2,
  },
  feedItemList: {
    gap: 8,
  },
  feedItemRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(160,206,185,0.10)',
    backgroundColor: 'rgba(11,25,25,0.72)',
  },
  feedItemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  feedItemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  feedItemTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: palette.text,
  },
  feedItemSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  feedItemSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: 78,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  feedItemSourceText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
  pulseCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(143,225,166,0.14)',
    backgroundColor: palette.panel,
    padding: 13,
    gap: 12,
    overflow: 'hidden',
  },
  pulseCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  pulseTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pulseTitleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.18)',
    flexShrink: 0,
  },
  pulseSparkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
    zIndex: 1,
  },
  pulseSparkCard: {
    width: '48.5%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 8,
    gap: 6,
  },
  pulseSparkTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
  },
  pulseSparkIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pulseSparkCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pulseSparkLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.muted,
  },
  pulseSparkValue: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  pulseSparkTrack: {
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pulseSparkFill: {
    height: '100%',
    borderRadius: 999,
  },
  pulseAdvisorStrip: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.22)',
    backgroundColor: 'rgba(74,222,128,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseAdvisorAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.35)',
    overflow: 'visible',
    flexShrink: 0,
  },
  pulseAdvisorAvatar: {
    width: 37,
    height: 37,
    borderRadius: 19,
  },
  pulseAdvisorSparkle: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
  },
  pulseAdvisorCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  pulseAdvisorTitle: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.green,
  },
  pulseAdvisorBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: palette.text,
  },
  pulseAdvisorCta: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,222,128,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.28)',
    flexShrink: 0,
  },
  regionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panel,
    padding: 14,
    gap: 10,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  regionEyebrow: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: palette.gold,
  },
  regionLevelBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(143,225,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(143,225,166,0.22)',
  },
  regionLevelText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: palette.green,
  },
  regionTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    color: palette.text,
  },
  regionBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.muted,
  },
  regionImageWrap: {
    height: 148,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  regionImage: {
    width: '100%',
    height: '100%',
  },
  regionCta: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.tealMid,
  },
  regionCtaText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  regionFooterStats: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 12,
    padding: 8,
    backgroundColor: 'rgba(5,13,14,0.45)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  regionFooterStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
  },
  regionFooterLabel: {
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '800',
    color: palette.faint,
  },
  regionFooterValue: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    color: palette.text,
    textAlign: 'center',
  },
  developmentsScroller: {
    gap: 10,
    paddingRight: 4,
  },
  developmentCard: {
    width: 148,
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
  },
  developmentCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  developmentCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  developmentTag: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(216,177,83,0.88)',
    zIndex: 2,
  },
  developmentTagText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    color: '#101812',
  },
  developmentCardCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    gap: 4,
  },
  developmentCardTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.text,
  },
  developmentCardBody: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  developmentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  developmentTime: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    color: palette.faint,
  },
  commandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandTile: {
    width: '48%',
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  commandTitle: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: palette.text,
    textAlign: 'center',
  },
  commandSubtitle: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    color: palette.muted,
    textAlign: 'center',
  },
  unlockStrip: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(216,177,83,0.24)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  unlockTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.text,
  },
  unlockBody: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: palette.muted,
  },
  emptyPanel: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  emptyPanelText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: palette.faint,
    textAlign: 'center',
  },
  emptyTinyText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.faint,
  },
  scrollFooter: {
    paddingTop: 4,
  },
  agendaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panel,
    padding: 12,
    gap: 8,
  },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  agendaTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  agendaSectionTitle: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: palette.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  agendaGoalTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    color: palette.text,
  },
  agendaProgressPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16,40,38,0.55)',
  },
  agendaProgressText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
  },
  agendaSummary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: palette.muted,
  },
  agendaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  agendaChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 1,
    maxWidth: '48%',
  },
  agendaChipLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.faint,
    textTransform: 'uppercase',
  },
  agendaChipValue: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    color: palette.text,
  },
  agendaSecondaryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(216,177,83,0.24)',
    backgroundColor: 'rgba(216,177,83,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  agendaSecondaryChipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.gold,
  },
  agendaHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.faint,
  },
  feedCardCompact: {
    paddingVertical: 10,
  },
  feedItemListCompact: {
    gap: 6,
  },
  agendaChipCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  agendaChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  agendaChipTitle: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  agendaChipGoal: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: palette.text,
  },
  maintenanceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  maintenanceStripIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  maintenanceStripCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  maintenanceStripTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: palette.text,
  },
  maintenanceStripSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: palette.muted,
  },
});
