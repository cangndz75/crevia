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
import { CreviaAnimatedCard, useCreviaReducedMotion } from '@/shared/motion';

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
  border: 'rgba(7, 86, 79, 0.14)',
  white: '#FFFFFF',
} as const;

const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const greenHeroImage = require('@/assets/districts/status/district_safe_zone_01.png');
const profilePortraitImage = require('@/assets/pp1.png');
const prestigeBadgeImage = require('@/assets/badge1.png');
const peopleResourceImage = require('@/assets/person1.png');
const statusBarPrimaryImage = require('@/assets/status_bar_2.png');
const statusBarSecondaryImage = require('@/assets/status_bar_1.png');

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
        <PeopleHeaderChip value="2,35M" />
        <HeaderChip icon="diamond" value="1.250" tone="purple" />
      </View>
    </View>
  );
}

function HeaderChip({ icon, value, tone = 'gold' }: { icon: IconName; value: string; tone?: 'gold' | 'purple' }) {
  const color = tone === 'purple' ? '#8747C8' : palette.goldDark;
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

function GameStatusBar({ progress = 0.62, variant = 'primary' }: { progress?: number; variant?: 'primary' | 'secondary' }) {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%` as `${number}%`;
  return (
    <View style={styles.gameStatusBar}>
      <Image
        source={variant === 'primary' ? statusBarPrimaryImage : statusBarSecondaryImage}
        style={styles.gameStatusBarImage}
        contentFit="fill"
      />
      <View style={[styles.gameStatusBarFill, { width }]} />
    </View>
  );
}

function PeopleHeaderChip({ value }: { value: string }) {
  return (
    <View style={styles.resourceChipImageWrap}>
      <Image source={peopleResourceImage} style={styles.resourceChipImage} contentFit="fill" />
      <Text style={styles.resourceChipImageValue} numberOfLines={1}>
        {value}
      </Text>
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

function DailyStreakStrip() {
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <LinearGradient
      colors={[palette.tealDark, palette.teal, '#0B665E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.streakStrip}>
      <View style={styles.streakHeader}>
        <Text style={styles.darkSectionTitle}>GÜNLÜK SERİ</Text>
        <Text style={styles.streakSub} numberOfLines={1}>
          Bugünün kararını tamamla, şehir hafızası güçlensin.
        </Text>
      </View>
      <View style={styles.streakDays}>
        {days.map((day) => {
          const active = day === 3;
          const done = day < 3;
          return (
            <View key={day} style={styles.streakDay}>
              <View style={[styles.streakCoin, active && styles.streakCoinActive]}>
                <Ionicons
                  name={done ? 'checkmark' : active ? 'gift-outline' : 'ellipse-outline'}
                  size={active ? 18 : 15}
                  color={done || active ? palette.tealDark : 'rgba(255,255,255,0.58)'}
                />
              </View>
              <Text style={[styles.streakDayText, active && styles.streakDayTextActive]}>{day}. Gün</Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

function OperationSignalsList({
  hubTomorrowRisk,
  hubImpactExplanationLine,
}: {
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
}) {
  const operationSignals = useGameStore((s) => s.operationSignals);
  const signals = [
    {
      icon: 'shield-half-outline' as IconName,
      title: 'Cumhuriyet’te güven hassas',
      body: hubTomorrowRisk?.mainLine ?? 'Bugünün saha planı hazırlanıyor.',
      impact: 'ETKİ YÜKSEK',
      tone: 'teal' as const,
    },
    {
      icon: 'car-sport-outline' as IconName,
      title: 'Araç yorgunluğu yükseliyor',
      body: hubImpactExplanationLine ?? 'Ece ilk sinyalleri izliyor.',
      impact: operationSignals.overall.status === 'stable' ? 'İZLE' : 'ETKİ ORTA',
      tone: 'gold' as const,
    },
    {
      icon: 'cube-outline' as IconName,
      title: 'Konteyner doluluk baskısı',
      body: 'Operasyon odağı gün sonunda netleşecek.',
      impact: 'YARINA SARKAR',
      tone: 'green' as const,
    },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="OPERASYON SİNYALLERİ" action="TÜMÜ" />
      <View style={styles.signalList}>
        {signals.map((signal) => (
          <View key={signal.title} style={styles.signalItem}>
            <MiniIcon icon={signal.icon} tone={signal.tone} />
            <View style={styles.signalCopy}>
              <Text style={styles.signalTitle} numberOfLines={1}>
                {signal.title}
              </Text>
              <Text style={styles.signalBody} numberOfLines={2}>
                {signal.body}
              </Text>
            </View>
            <View style={styles.impactBadge}>
              <Text style={styles.impactLabel}>DURUM</Text>
              <Text style={styles.impactValue}>{signal.impact}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.goldDark} />
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickActionsGrid() {
  const router = useRouter();
  const actions = [
    { title: 'Planı İncele', caption: 'Günün akışını aç.', icon: 'clipboard-outline' as IconName, route: '/events' as Href },
    { title: 'Ekip Ata', caption: 'Personel dengesini kur.', icon: 'people-outline' as IconName, route: '/events' as Href },
    { title: 'Haritayı Aç', caption: 'Saha baskısını gör.', icon: 'map-outline' as IconName, route: '/risks' as Href },
    { title: 'Raporu Gör', caption: 'Gün sonunu incele.', icon: 'bar-chart-outline' as IconName, route: '/reports' as Href },
    { title: 'Kaynakları Kontrol Et', caption: 'Araç ve konteyner.', icon: 'construct-outline' as IconName, route: '/events' as Href },
    { title: 'Sinyalleri İncele', caption: 'Ece notlarını oku.', icon: 'radio-outline' as IconName, route: '/events' as Href },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="HIZLI İŞLEMLER" />
      <View style={styles.quickGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.title}
            onPress={() => router.push(action.route)}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            style={({ pressed }) => [styles.quickAction, pressedScale(pressed)]}>
            <MiniIcon icon={action.icon} tone={action.icon === 'construct-outline' ? 'gold' : action.icon === 'map-outline' ? 'green' : 'teal'} />
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle} numberOfLines={1}>
                {action.title}
              </Text>
              <Text style={styles.quickCaption} numberOfLines={1}>
                {action.caption}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RecommendedPlanCard({
  hubCityJournal,
  hubDistrictReportLine,
  hubStoryChainLine,
  hubVehicleMaintenanceLine,
}: {
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
}) {
  const contextLine =
    hubCityJournal?.primaryLine ||
    hubDistrictReportLine ||
    hubStoryChainLine ||
    hubVehicleMaintenanceLine ||
    'Güven kaybı büyümeden ekip ve araç planını netleştir.';

  return (
    <View style={styles.section}>
      <SectionTitle title="ÖNERİLEN PLAN" />
      <View style={styles.planCard}>
        <View style={styles.planImage}>
          <View style={styles.planPatternOne} />
          <View style={styles.planPatternTwo} />
          <Ionicons name="git-merge-outline" size={34} color={palette.teal} />
        </View>
        <View style={styles.planCopy}>
          <Text style={styles.planTitle} numberOfLines={2}>
            Cumhuriyet saha dengesi
          </Text>
          <Text style={styles.planBody} numberOfLines={3}>
            {contextLine}
          </Text>
          <View style={styles.planStats}>
            <PlanStat icon="bulb-outline" label="Ece önerisi" />
            <PlanStat icon="time-outline" label="Yarın etkisi var" />
          </View>
        </View>
        <View style={styles.bookmark}>
          <Ionicons name="star" size={16} color={palette.goldSoft} />
        </View>
      </View>
    </View>
  );
}

function PlanStat({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.planStat}>
      <Ionicons name={icon} size={13} color={palette.goldDark} />
      <Text style={styles.planStatText} numberOfLines={1}>
        {label}
      </Text>
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
      accessibilityLabel="Planı incele"
      style={({ pressed }) => [styles.approveButtonWrap, pressedScale(pressed)]}>
      <LinearGradient
        colors={[palette.tealDark, palette.teal, '#0D7168']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.approveButton}>
        <Text style={styles.approveText}>PLANI İNCELE</Text>
        <View style={styles.ctaArrow}>
          <Ionicons name="chevron-forward" size={18} color={palette.tealDark} />
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
  scrollFooter,
}: HubReferenceHomeProps = {}) {
  const { scrollBottomPadding } = useHubLayoutMetrics();
  const status = useGameStatus();
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const badgeState = useGameStore((s) => s.gameState.pilot.badgeState);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const reducedMotion = useCreviaReducedMotion();
  const motionDay = status.currentDay;
  const hubMotionEnabled = motionDay > 1;
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        <HeaderSummary />
        <View style={styles.body}>
          <CreviaAnimatedCard
            surface="hub"
            index={0}
            day={motionDay}
            reducedMotion={reducedMotion}
            disabled={!hubMotionEnabled}
            motionKind="card_enter"
            intensity="highlighted">
            <HubActiveTaskCardStack />
          </CreviaAnimatedCard>
          <EceInsightCard contextLine={hubEceContextLine ?? premiumContextLine} />
          <FocusCarousel />
          <DailyStreakStrip />
          <HubBadgeShowcaseChip summary={hubBadgeShowcase} />
          {hubDistrictExpansion.visible ? (
            <HubDistrictExpansionChip summary={hubDistrictExpansion} />
          ) : (
            <HubAuthorityPermissionPreviewChip summary={hubAuthorityPermissionPreview} />
          )}
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
          />
          <ApprovePlanCTA />
        </View>
        {scrollFooter ? <View style={styles.scrollFooter}>{scrollFooter}</View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    alignItems: 'center',
    gap: 10,
  },
  avatarButton: {
    flexShrink: 0,
    position: 'relative',
  },
  profilePortrait: {
    flexShrink: 0,
  },
  profileLevelBadge: {
    position: 'absolute',
    left: 0,
    bottom: 1,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: palette.goldDark,
    borderWidth: 1,
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
    gap: 5,
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
    gap: 4,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: palette.tealMid,
  },
  reputationBadge: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    flexShrink: 0,
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
    gap: 8,
    marginTop: 11,
    minWidth: 0,
  },
  resourceChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealMid,
    flexShrink: 0,
  },
  resourceChipImageWrap: {
    flex: 1,
    minWidth: 0,
    height: 34,
    justifyContent: 'center',
  },
  resourceChipImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  resourceChipImageValue: {
    marginLeft: 37,
    marginRight: 27,
    fontSize: 11,
    fontWeight: '900',
    color: palette.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  gameStatusBar: {
    height: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gameStatusBarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gameStatusBarFill: {
    height: 5,
    marginHorizontal: 13,
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  body: {
    paddingHorizontal: 16,
    gap: 16,
  },
  eceCard: {
    minHeight: 86,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
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
    minHeight: 176,
    borderRadius: 18,
    padding: 9,
    gap: 5,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
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
  streakStrip: {
    borderRadius: 22,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  streakHeader: {
    gap: 3,
  },
  darkSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  streakSub: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  streakDay: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  streakCoin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  streakCoinActive: {
    backgroundColor: palette.gold,
    borderColor: palette.goldSoft,
  },
  streakDayText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.62)',
  },
  streakDayTextActive: {
    color: palette.goldSoft,
  },
  signalList: {
    gap: 8,
  },
  signalItem: {
    minHeight: 74,
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  signalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  signalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
  },
  signalBody: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  impactBadge: {
    minWidth: 68,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: palette.cardWarm,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.18)',
  },
  impactLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: palette.muted,
  },
  impactValue: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldDark,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
  },
  quickAction: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48.5%',
    minHeight: 74,
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  quickCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.text,
  },
  quickCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
  },
  planCard: {
    minHeight: 124,
    maxHeight: 144,
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  planImage: {
    width: 106,
    height: 104,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planPatternOne: {
    position: 'absolute',
    left: -12,
    top: 18,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(13,113,104,0.10)',
  },
  planPatternTwo: {
    position: 'absolute',
    right: -16,
    bottom: -8,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(216,167,46,0.16)',
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
  planStats: {
    marginTop: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: palette.cardWarm,
  },
  planStatText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.text,
  },
  bookmark: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 36,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.teal,
  },
  approveButtonWrap: {
    marginTop: 2,
  },
  approveButton: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: palette.gold,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
    flexShrink: 0,
  },
});
