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

import type { CarryOverMemoryModel } from '@/core/carryOver';
import type { CityJournalHubPresentation } from '@/core/cityJournal';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';
import { creviaAssets } from '@/core/assets/creviaAssets';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { HubActiveTaskCardStack } from '@/features/hub/components/HubActiveTaskCardStack';
import { HubAuthorityPermissionPreviewChip } from '@/features/hub/components/HubAuthorityPermissionPreviewChip';
import { HubBadgeShowcaseChip } from '@/features/hub/components/HubBadgeShowcaseChip';
import { HubDistrictExpansionChip } from '@/features/hub/components/HubDistrictExpansionChip';
import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import { buildDistrictOperationUnlockBindingCompactSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import { buildHubBadgeShowcaseSummary } from '@/features/hub/utils/hubBadgeShowcaseModel';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';

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
const profilePortraitImage = require('@/assets/pp1.png');
const prestigeBadgeImage = require('@/assets/badge1.png');

type IconName = keyof typeof Ionicons.glyphMap;

type HubReferenceHomeProps = {
  hubCarryOverMemory?: CarryOverMemoryModel | null;
  hubImpactExplanationLine?: string | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubEceContextLine?: string | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  hubMainOperationFeelExistingLines?: string[];
  showHubCarryOver?: boolean;
  showOperationalResources?: boolean;
  showMainOperationSeason?: boolean;
  mainOperationSeasonCompact?: boolean;
  showAdvisor?: HubCardVisibilityModel['showAdvisor'];
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

function HeaderSummary() {
  const router = useRouter();
  const status = useGameStatus();
  const { topInset, isCompact } = useHubLayoutMetrics();

  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <View style={styles.skylineOne} />
      <View style={styles.skylineTwo} />
      <View style={styles.skylineThree} />
      <View style={styles.headerTop}>
        <Pressable
          onPress={() => router.push('/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Profili aç"
          style={({ pressed }) => [styles.avatarButton, pressedScale(pressed)]}>
          <Image
            source={profilePortraitImage}
            style={[styles.profilePortrait, { width: isCompact ? 62 : 68, height: isCompact ? 62 : 68 }]}
            contentFit="contain"
          />
          <View style={styles.profileLevelBadge}>
            <Text style={styles.profileLevelText}>{status.level}</Text>
          </View>
        </Pressable>
        <View style={styles.headerIdentity}>
          <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            Başkan
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={palette.tealMid} />
            <Text style={styles.locationText} numberOfLines={1}>
              İstanbul
            </Text>
          </View>
        </View>
        <View style={styles.reputationBadge}>
          <Image source={prestigeBadgeImage} style={styles.reputationBadgeImage} contentFit="contain" />
          <Text style={styles.reputationLabel} numberOfLines={1}>ŞEHİR İTİBARI</Text>
          <Text style={styles.reputationValue} numberOfLines={1}>4.650</Text>
        </View>
      </View>
      <View style={styles.resourceRow}>
        <HeaderChip icon="cash-outline" value="12,4M" tone="gold" />
        <HeaderChip icon="people-outline" value="2,35M" tone="teal" />
        <HeaderChip icon="diamond" value="1.250" tone="purple" />
      </View>
    </View>
  );
}

function HeaderChip({
  icon,
  value,
  tone = 'gold',
}: {
  icon: IconName;
  value: string;
  tone?: 'gold' | 'purple' | 'teal';
}) {
  const color =
    tone === 'purple' ? '#8747C8' : tone === 'teal' ? palette.tealMid : palette.goldDark;
  return (
    <View style={styles.resourceChip}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={styles.resourceValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={styles.resourcePlus}>
        <Ionicons name="add" size={12} color={palette.white} />
      </View>
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

function EceInsightCard({ contextLine }: { contextLine?: string | null }) {
  const router = useRouter();
  const text =
    contextLine?.trim() ||
    'Toplu taşıma hatlarını aktifleştirmek, vatandaşların mutluluğunu en hızlı artıracak adım.';

  return (
    <Pressable
      onPress={() => router.push('/events' as Href)}
      accessibilityRole="button"
      accessibilityLabel="Ece önerisini aç"
      style={({ pressed }) => [styles.eceCard, pressedScale(pressed)]}>
      <View style={styles.eceAvatarWrap}>
        <Image source={hubAssets.advisorPortrait} style={styles.eceAvatar} contentFit="cover" />
      </View>
      <View style={styles.eceTextBlock}>
        <Text style={styles.eceName}>ECE</Text>
        <Text style={styles.eceText} numberOfLines={2}>
          {text}
        </Text>
      </View>
      <MiniIcon icon="bulb-outline" tone="gold" />
    </Pressable>
  );
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

function FocusCarousel() {
  const domains = [
    {
      title: 'Ulaşım',
      level: 'Seviye 14',
      value: '720 / 1.000',
      image: routeHeroImage,
      icon: 'bus-outline' as IconName,
      tone: 'teal' as const,
      progress: 0.72,
    },
    {
      title: 'Enerji',
      level: 'Seviye 13',
      value: '560 / 1.000',
      image: creviaAssets.districts.industrialBlock,
      icon: 'flash-outline' as IconName,
      tone: 'gold' as const,
      progress: 0.56,
    },
    {
      title: 'Çevre',
      level: 'Seviye 12',
      value: '430 / 1.000',
      image: greenHeroImage,
      icon: 'leaf-outline' as IconName,
      tone: 'green' as const,
      progress: 0.43,
    },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="OPERASYON ODAĞI" action="TÜMÜNÜ GÖR" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusScroll}>
        {domains.map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} odağı`}
            style={({ pressed }) => [styles.focusCard, pressedScale(pressed)]}>
            <View style={styles.focusImage}>
              <AssetImage source={item.image} />
              <View style={styles.focusIconFloat}>
                <MiniIcon icon={item.icon} tone={item.tone} />
              </View>
            </View>
            <Text style={styles.focusTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.focusLevel} numberOfLines={1}>
              {item.level}
            </Text>
            <GameStatusBar progress={item.progress} variant="secondary" />
            <Text style={styles.focusValue} numberOfLines={1}>
              {item.value}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type RewardStepStatus = 'done' | 'active' | 'locked';

function RewardStepNode({
  day,
  status,
}: {
  day: number;
  status: RewardStepStatus;
}) {
  const isActive = status === 'active';
  const isDone = status === 'done';

  return (
    <View style={[styles.rewardStepWrap, isActive ? styles.rewardStepWrapActive : undefined]}>
      {isActive ? (
        <View style={styles.rewardStepGlow}>
          <View style={styles.rewardStepActiveRing}>
            <View style={styles.rewardStepActiveInner}>
              <Ionicons name="gift" size={22} color={palette.tealDark} />
            </View>
          </View>
          <View style={styles.rewardStepActivePill}>
            <Text style={styles.rewardStepActivePillText} numberOfLines={1}>
              {day}. Gün
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.rewardStepColumn}>
          <View style={[styles.rewardStepCoin, isDone ? styles.rewardStepCoinDone : undefined]}>
            {isDone ? (
              <>
                <Ionicons name="logo-bitcoin" size={14} color={palette.goldDark} />
                <View style={styles.rewardStepCheckBadge}>
                  <Ionicons name="checkmark" size={7} color={palette.white} />
                </View>
              </>
            ) : (
              <Ionicons name="gift-outline" size={13} color="rgba(255,255,255,0.38)" />
            )}
          </View>
          <Text style={[styles.rewardStepLabel, isDone ? styles.rewardStepLabelDone : undefined]} numberOfLines={1}>
            {day}. Gün
          </Text>
        </View>
      )}
    </View>
  );
}

function GrandRewardChest() {
  return (
    <View style={styles.grandRewardArea}>
      <View style={styles.grandRewardDivider} />
      <View style={styles.grandRewardContent}>
        <Text style={styles.grandRewardLabel} numberOfLines={1}>
          BÜYÜK ÖDÜL
        </Text>
        <View style={styles.grandRewardChestWrap}>
          <View style={styles.grandRewardChestLid} />
          <View style={styles.grandRewardChestBody}>
            <View style={styles.grandRewardChestBand} />
            <Ionicons name="lock-closed" size={10} color={palette.goldSoft} />
          </View>
          <View style={styles.grandRewardChestGlow} />
        </View>
        <View style={styles.grandRewardValueRow}>
          <Text style={styles.grandRewardValue}>250</Text>
          <Ionicons name="diamond" size={14} color="#8747C8" />
        </View>
      </View>
    </View>
  );
}

function DailyRewardRoadCard() {
  const steps: { day: number; status: RewardStepStatus }[] = [
    { day: 1, status: 'done' },
    { day: 2, status: 'done' },
    { day: 3, status: 'active' },
    { day: 4, status: 'locked' },
    { day: 5, status: 'locked' },
  ];

  return (
    <LinearGradient
      colors={[palette.tealDark, palette.teal, '#0B665E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.rewardRoadCard}>
      <View style={styles.rewardRoadHeader}>
        <Text style={styles.rewardRoadTitle} numberOfLines={1}>
          ✦ GÜNLÜK ÖDÜL ROTASI
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Günlük ödül bilgisi"
          hitSlop={8}
          style={({ pressed }) => [styles.rewardRoadInfoBtn, pressedScale(pressed)]}>
          <Ionicons name="information-circle-outline" size={18} color={palette.goldSoft} />
        </Pressable>
      </View>
      <View style={styles.rewardRoadBody}>
        <View style={styles.rewardRoadPath}>
          <View style={styles.rewardRoadLine} />
          <View style={styles.rewardRoadSteps}>
            {steps.map((step) => (
              <RewardStepNode key={step.day} day={step.day} status={step.status} />
            ))}
          </View>
        </View>
        <GrandRewardChest />
      </View>
    </LinearGradient>
  );
}

function CityCrestMiniIllustration() {
  return (
    <View style={styles.cityCrestWrap}>
      <View style={styles.cityCrestDiamond}>
        <View style={styles.cityCrestSky} />
        <View style={styles.cityCrestBuildingLeft} />
        <View style={styles.cityCrestBuildingCenter} />
        <View style={styles.cityCrestBuildingRight} />
        <View style={styles.cityCrestSpire} />
        <View style={styles.cityCrestGoldAccent} />
      </View>
    </View>
  );
}

function CityDevelopmentCard() {
  const reputation = '4.650';
  const nextLevel = '5.000';
  const progressCurrent = 350;
  const progressTotal = 1000;
  const progressRatio = progressCurrent / progressTotal;

  return (
    <View style={styles.section}>
      <SectionTitle title="ŞEHİR GELİŞİMİ" />
      <LinearGradient
        colors={[palette.tealDark, palette.teal, '#0B665E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cityDevCard}>
        <View style={styles.cityDevBadge}>
          <Ionicons name="star" size={18} color={palette.gold} />
        </View>
        <View style={styles.cityDevCenter}>
          <Text style={styles.cityDevLabel} numberOfLines={1}>
            Şehir İtibarı
          </Text>
          <Text style={styles.cityDevValue} numberOfLines={1}>
            {reputation}
          </Text>
          <Text style={styles.cityDevNext} numberOfLines={1}>
            Sonraki Seviye: {nextLevel}
          </Text>
          <View style={styles.cityDevProgressTrack}>
            <View style={[styles.cityDevProgressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.cityDevProgressText} numberOfLines={1}>
            {progressCurrent} / {progressTotal.toLocaleString('tr-TR')}
          </Text>
        </View>
        <CityCrestMiniIllustration />
      </LinearGradient>
    </View>
  );
}

function OperationSignalRow({
  icon,
  accentColor,
  iconGradient,
  title,
  body,
  impactLevel,
  impactTone,
}: {
  icon: IconName;
  accentColor: string;
  iconGradient: [string, string];
  title: string;
  body: string;
  impactLevel: string;
  impactTone: 'high' | 'medium';
}) {
  const impactColor = impactTone === 'high' ? palette.green : palette.amber;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.signalRow, pressedScale(pressed)]}>
      <View style={[styles.signalAccentBar, { backgroundColor: accentColor }]} />
      <LinearGradient
        colors={iconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.signalIconRing}>
        <View style={styles.signalIconCore}>
          <Ionicons name={icon} size={19} color={accentColor} />
        </View>
      </LinearGradient>
      <View style={styles.signalCopy}>
        <View style={styles.signalTitleRow}>
          <View style={[styles.signalLiveDot, { backgroundColor: accentColor }]} />
          <Text style={styles.signalTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.signalBody} numberOfLines={2}>
          {body}
        </Text>
      </View>
      <View style={styles.signalTrailing}>
        <Text style={styles.signalImpactLabel}>ETKİ</Text>
        <View style={[styles.signalImpactPill, { backgroundColor: `${impactColor}14`, borderColor: `${impactColor}55` }]}>
          <Text style={[styles.signalImpactValue, { color: impactColor }]} numberOfLines={1}>
            {impactLevel}
          </Text>
        </View>
        <View style={styles.signalChevronBtn}>
          <Ionicons name="chevron-forward" size={14} color={palette.tealMid} />
        </View>
      </View>
    </Pressable>
  );
}

function OperationSignalsList({
  hubTomorrowRisk,
  hubImpactExplanationLine,
}: {
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
}) {
  const transportBody =
    hubTomorrowRisk?.mainLine ?? "T1 Hattı'nda yolcu talebi %18 arttı.";
  const energyBody =
    hubImpactExplanationLine ?? 'Rüzgar enerjisi verimliliği %12 arttı.';

  const signals = [
    {
      icon: 'trending-up' as IconName,
      accentColor: palette.green,
      iconGradient: ['#E8F8EE', '#D0EFDB'] as [string, string],
      title: 'Ulaşım Talebi Yükseliyor',
      body: transportBody,
      impactLevel: 'YÜKSEK',
      impactTone: 'high' as const,
    },
    {
      icon: 'flash' as IconName,
      accentColor: palette.amber,
      iconGradient: [palette.goldSoft, '#F8EAC4'] as [string, string],
      title: 'Enerji Üretimi Artıyor',
      body: energyBody,
      impactLevel: 'ORTA',
      impactTone: 'medium' as const,
    },
  ];

  return (
    <View style={styles.section}>
      <ModernSectionHeader title="OPERASYON SİNYALLERİ" action="TÜMÜNÜ GÖR" />
      <View style={styles.signalList}>
        {signals.map((signal) => (
          <OperationSignalRow key={signal.title} {...signal} />
        ))}
      </View>
    </View>
  );
}

function QuickActionTile({
  title,
  caption,
  icon,
  iconTone,
  onPress,
}: {
  title: string;
  caption: string;
  icon: IconName;
  iconTone: 'teal' | 'gold' | 'green';
  onPress: () => void;
}) {
  const toneConfig = {
    teal: {
      color: palette.teal,
      gradient: ['#F4FAF8', '#E4F2EE'] as [string, string],
      ring: palette.tealSoft,
    },
    gold: {
      color: palette.goldDark,
      gradient: ['#FFFAF0', '#F8EFD4'] as [string, string],
      ring: palette.goldSoft,
    },
    green: {
      color: palette.green,
      gradient: ['#F2FAF4', '#E2F3E8'] as [string, string],
      ring: '#E8F5EA',
    },
  }[iconTone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.quickActionTileOuter, pressedScale(pressed)]}>
      <LinearGradient
        colors={toneConfig.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionTile}>
        <View style={styles.quickActionTopRow}>
          <View style={[styles.quickActionIconRing, { backgroundColor: toneConfig.ring }]}>
            <View style={styles.quickActionIconCore}>
              <Ionicons name={icon} size={17} color={toneConfig.color} />
            </View>
          </View>
          <View style={styles.quickActionArrowChip}>
            <Ionicons name="arrow-forward" size={11} color={palette.tealMid} />
          </View>
        </View>
        <Text style={styles.quickTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.quickCaption} numberOfLines={1}>
          {caption}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

function QuickActionsGrid() {
  const router = useRouter();
  const { isCompact } = useHubLayoutMetrics();
  const actions = [
    { title: 'Hat Yükselt', caption: 'Kapasiteyi artır.', icon: 'bus-outline' as IconName, iconTone: 'teal' as const, route: '/events' as Href },
    { title: 'Çevre Yatırımı', caption: 'Yeşil alanı da artır.', icon: 'leaf-outline' as IconName, iconTone: 'green' as const, route: '/events' as Href },
    { title: 'Enerji Desteği', caption: 'Üretimi hızlandır.', icon: 'flash-outline' as IconName, iconTone: 'gold' as const, route: '/events' as Href },
    { title: 'Personel Atama', caption: 'Ekipleri yönet.', icon: 'people-outline' as IconName, iconTone: 'teal' as const, route: '/events' as Href },
    { title: 'Malzeme Al', caption: 'Kaynak satın al.', icon: 'cart-outline' as IconName, iconTone: 'gold' as const, route: '/events' as Href },
    { title: 'Bina Onar', caption: 'Yapıları iyileştir.', icon: 'hammer-outline' as IconName, iconTone: 'teal' as const, route: '/events' as Href },
  ];

  return (
    <View style={styles.section}>
      <ModernSectionHeader title="HIZLI İŞLEMLER" />
      <View style={styles.quickGrid}>
        {actions.map((action) => (
          <View
            key={action.title}
            style={[styles.quickGridCell, isCompact ? styles.quickGridCellCompact : styles.quickGridCellWide]}>
            <QuickActionTile
              title={action.title}
              caption={action.caption}
              icon={action.icon}
              iconTone={action.iconTone}
              onPress={() => router.push(action.route)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function PlanMiniIllustration() {
  return (
    <View style={styles.planIllustration}>
      <LinearGradient
        colors={['#8ECAE6', '#B8DFF0', '#D4EAF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.planIllustrationSky}
      />
      <View style={styles.planIllustrationWater} />
      <View style={styles.planIllustrationPark} />
      <View style={styles.planIllustrationPath} />
      <View style={styles.planIllustrationBuildingLeft} />
      <View style={styles.planIllustrationBuildingRight} />
      <View style={styles.planIllustrationMosque} />
      <View style={styles.planIllustrationTreeOne} />
      <View style={styles.planIllustrationTreeTwo} />
    </View>
  );
}

function PlanMetaItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.planMetaItem}>
      <Ionicons name={icon} size={12} color={palette.goldDark} />
      <Text style={styles.planMetaLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.planMetaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function RecommendedPlanCard({
  hubCityJournal,
  hubDistrictReportLine,
  hubStoryChainLine,
  hubVehicleMaintenanceLine,
  hubTeamSpecializationLine,
}: {
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
}) {
  const contextLine =
    hubCityJournal?.primaryLine ||
    hubDistrictReportLine ||
    hubStoryChainLine ||
    hubVehicleMaintenanceLine ||
    hubTeamSpecializationLine ||
    'Sahil şeridinde yeni bir yeşil alan oluşturarak yaşam kalitesini artır.';

  const planTitle = hubCityJournal?.title?.trim() || 'Boğaz Park Projesi';

  return (
    <View style={styles.section}>
      <SectionTitle title="ÖNERİLEN PLAN" />
      <View style={styles.planCard}>
        <PlanMiniIllustration />
        <View style={styles.planCopy}>
          <Text style={styles.planTitle} numberOfLines={2}>
            {planTitle}
          </Text>
          <Text style={styles.planBody} numberOfLines={3}>
            {contextLine}
          </Text>
          <View style={styles.planMetaRow}>
            <PlanMetaItem icon="happy-outline" label="ETKİ" value="+18" />
            <PlanMetaItem icon="time-outline" label="SÜRE" value="2sa 30dk" />
            <PlanMetaItem icon="cash-outline" label="ÖDÜL" value="650K" />
          </View>
        </View>
        <View style={styles.bookmark}>
          <Ionicons name="star" size={14} color={palette.goldSoft} />
        </View>
      </View>
    </View>
  );
}

function ApprovePlanCTA() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        playLightImpactHaptic();
        router.push('/events' as Href);
      }}
      accessibilityRole="button"
      accessibilityLabel="Planı onayla"
      style={({ pressed }) => [styles.approveButtonWrap, pressedScale(pressed)]}>
      <LinearGradient
        colors={[palette.tealDark, palette.teal, '#0D7168']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.approveButton}>
        <Text style={styles.approveText}>PLANI ONAYLA</Text>
        <View style={styles.ctaArrow}>
          <Ionicons name="arrow-forward" size={18} color={palette.tealDark} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function HubReferenceHome({
  hubImpactExplanationLine,
  hubTomorrowRisk,
  hubCityJournal,
  hubEceContextLine,
  hubDistrictReportLine,
  hubStoryChainLine,
  hubVehicleMaintenanceLine,
  hubTeamSpecializationLine,
  scrollFooter,
}: HubReferenceHomeProps = {}) {
  const { scrollBottomPadding } = useHubLayoutMetrics();
  const status = useGameStatus();
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

  const premiumContextLine = useMemo(
    () =>
      [
        hubImpactExplanationLine,
        hubTomorrowRisk?.mainLine,
        hubCityJournal?.primaryLine,
      ].find((line) => Boolean(line?.trim())) ?? null,
    [hubCityJournal?.primaryLine, hubImpactExplanationLine, hubTomorrowRisk?.mainLine],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
        <HeaderSummary />
        <View style={styles.body}>
          <HubActiveTaskCardStack />
          <EceInsightCard contextLine={hubEceContextLine ?? premiumContextLine} />
          <FocusCarousel />
          <DailyRewardRoadCard />
          <CityDevelopmentCard />
          <OperationSignalsList
            hubTomorrowRisk={hubTomorrowRisk}
            hubImpactExplanationLine={premiumContextLine}
          />
          <QuickActionsGrid />
          <RecommendedPlanCard
            hubCityJournal={hubCityJournal}
            hubDistrictReportLine={hubDistrictReportLine}
            hubStoryChainLine={hubStoryChainLine}
            hubVehicleMaintenanceLine={hubVehicleMaintenanceLine}
            hubTeamSpecializationLine={hubTeamSpecializationLine}
          />
          <ApprovePlanCTA />
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
    gap: 16,
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
  rewardRoadCard: {
    borderRadius: 23,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.gold,
    minHeight: 108,
    overflow: 'hidden',
  },
  rewardRoadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  rewardRoadTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: palette.goldSoft,
    letterSpacing: 0.3,
  },
  rewardRoadInfoBtn: {
    flexShrink: 0,
    marginLeft: 6,
  },
  rewardRoadBody: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 4,
  },
  rewardRoadPath: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingTop: 2,
  },
  rewardRoadLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 14,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(216,167,46,0.35)',
  },
  rewardRoadSteps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  rewardStepWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    zIndex: 1,
  },
  rewardStepWrapActive: {
    flex: 1.35,
    marginTop: -4,
  },
  rewardStepColumn: {
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  rewardStepCoin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  rewardStepCoinDone: {
    backgroundColor: palette.gold,
    borderColor: palette.goldSoft,
  },
  rewardStepCheckBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.green,
    borderWidth: 1,
    borderColor: palette.white,
  },
  rewardStepLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.50)',
  },
  rewardStepLabelDone: {
    color: palette.goldSoft,
  },
  rewardStepGlow: {
    alignItems: 'center',
    gap: 3,
  },
  rewardStepActiveRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216,167,46,0.22)',
    borderWidth: 2,
    borderColor: palette.gold,
    shadowColor: palette.gold,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  rewardStepActiveInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
    borderWidth: 1.5,
    borderColor: palette.goldSoft,
  },
  rewardStepActivePill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(216,167,46,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.45)',
  },
  rewardStepActivePillText: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  grandRewardArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 58,
  },
  grandRewardDivider: {
    width: 1,
    height: 62,
    backgroundColor: 'rgba(245,227,175,0.22)',
    marginRight: 6,
  },
  grandRewardContent: {
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  grandRewardLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.goldSoft,
    letterSpacing: 0.2,
  },
  grandRewardChestWrap: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  grandRewardChestLid: {
    position: 'absolute',
    top: 2,
    width: 34,
    height: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#0A5C55',
    borderWidth: 1,
    borderColor: palette.gold,
  },
  grandRewardChestBody: {
    width: 34,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealDark,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  grandRewardChestBand: {
    position: 'absolute',
    top: 8,
    width: '100%',
    height: 4,
    backgroundColor: palette.gold,
  },
  grandRewardChestGlow: {
    position: 'absolute',
    bottom: -2,
    width: 30,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(216,167,46,0.30)',
  },
  grandRewardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  grandRewardValue: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  cityDevCard: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.gold,
    minHeight: 86,
    overflow: 'hidden',
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
