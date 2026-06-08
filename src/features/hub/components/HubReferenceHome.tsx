import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useMemo, useState } from 'react';
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
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
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

const cityHeroImage = require('@/assets/districts/central/district_central_overview_01.png');
const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const greenHeroImage = require('@/assets/districts/status/district_safe_zone_01.png');
const marketHeroImage = require('@/assets/districts/market/district_marketplace_overview_01.png');

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
    scrollBottomPadding: tabBarHeight + (isCompact ? 24 : 30),
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
          <HeaderAvatar size={isCompact ? 56 : 62} level={status.level} showLevelBadge borderColor={palette.gold} />
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
          <Ionicons name="star" size={13} color={palette.goldSoft} />
          <Text style={styles.reputationLabel} numberOfLines={1}>
            ŞEHİR İTİBARI
          </Text>
          <Text style={styles.reputationValue} numberOfLines={1}>
            4.650
          </Text>
        </View>
      </View>
      <View style={styles.resourceRow}>
        <ResourceChip icon="cash-outline" value="12,4M" />
        <ResourceChip icon="people-outline" value="2,35M" />
        <ResourceChip icon="diamond-outline" value="1.250" accent />
      </View>
    </View>
  );
}

function ResourceChip({ icon, value, accent = false }: { icon: IconName; value: string; accent?: boolean }) {
  return (
    <View style={styles.resourceChip}>
      <Ionicons name={icon} size={15} color={accent ? '#8747C8' : palette.goldDark} />
      <Text style={styles.resourceValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={styles.resourcePlus}>
        <Ionicons name="add" size={12} color={palette.white} />
      </View>
    </View>
  );
}

function ActiveTaskStack() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const tasks = [
    {
      title: 'Ulaşımı Güçlendirelim!',
      body: 'Toplu taşıma hattını geliştirerek şehirdeki ulaşım memnuniyetini artır.',
      image: routeHeroImage,
      reward: '+%18 Mutluluk',
      progress: '3 / 5',
      progressWidth: '62%',
    },
    {
      title: 'Boğaz Parkı Projesi',
      body: 'Sahil hattında yeşil alanı büyüt ve kent yaşam kalitesini yükselt.',
      image: greenHeroImage,
      reward: '+650K Bütçe',
      progress: '2 / 4',
      progressWidth: '48%',
    },
    {
      title: 'Enerji Verimliliği',
      body: 'Kritik bölgelerde enerji üretimini dengele ve kaynak baskısını azalt.',
      image: marketHeroImage,
      reward: '+12 Enerji',
      progress: '1 / 3',
      progressWidth: '34%',
    },
  ] as const;
  const task = tasks[activeIndex];

  const handleNext = () => {
    playLightImpactHaptic();
    setActiveIndex((current) => (current + 1) % tasks.length);
  };

  return (
    <View style={styles.taskStackWrap}>
      <Pressable
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel="Diğer görevi göster"
        style={({ pressed }) => [styles.stackBackTwo, pressedScale(pressed)]}
      />
      <Pressable
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel="Diğer görevi göster"
        style={({ pressed }) => [styles.stackBackOne, pressedScale(pressed)]}
      />
      <LinearGradient
        colors={[palette.card, '#FFF8EC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.taskCard}>
        <View style={styles.taskLabel}>
          <Ionicons name="star" size={12} color={palette.gold} />
          <Text style={styles.taskLabelText}>AKTİF GÖREV</Text>
        </View>
        <View style={styles.taskHero}>
          <AssetImage source={task.image} />
        </View>
        <View style={styles.taskMainRow}>
          <View style={styles.taskCopy}>
            <View style={styles.taskTitleRow}>
              <MiniIcon icon="train-outline" />
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
              </Text>
            </View>
            <Text style={styles.taskBody} numberOfLines={2}>
              {task.body}
            </Text>
          </View>
          <View style={styles.rewardCapsule}>
            <Ionicons name="happy-outline" size={20} color={palette.green} />
            <Text style={styles.rewardText} numberOfLines={2}>
              {task.reward}
            </Text>
          </View>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>İLERLEME</Text>
            <Text style={styles.progressValue}>{task.progress}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: task.progressWidth }]} />
          </View>
        </View>
        <Pressable
          onPress={() => {
            playLightImpactHaptic();
            router.push('/events' as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel="Göreve devam et"
          style={({ pressed }) => [styles.taskCta, pressedScale(pressed)]}>
          <Text style={styles.taskCtaText}>GÖREVE DEVAM ET</Text>
          <View style={styles.ctaArrow}>
            <Ionicons name="chevron-forward" size={18} color={palette.tealDark} />
          </View>
        </Pressable>
      </LinearGradient>
      <Text style={styles.stackHint} numberOfLines={1}>
        Kartları değiştirerek diğer görevleri gör
      </Text>
    </View>
  );
}

function EceInsightCard({ contextLine }: { contextLine?: string | null }) {
  const router = useRouter();
  const text =
    contextLine?.trim() ||
    'Ulaşım yatırımlarına odaklanmaya devam edin. İstasyon geliştirmeleri mutluluğu hızla artırıyor!';

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
    },
    {
      title: 'Enerji',
      level: 'Seviye 13',
      value: '560 / 1.000',
      image: creviaAssets.districts.industrialBlock,
      icon: 'flash-outline' as IconName,
      tone: 'gold' as const,
    },
    {
      title: 'Çevre',
      level: 'Seviye 12',
      value: '430 / 1.000',
      image: greenHeroImage,
      icon: 'leaf-outline' as IconName,
      tone: 'green' as const,
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
            <View style={styles.focusProgressTrack}>
              <View style={styles.focusProgressFill} />
            </View>
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
          Serini sürdür ve ödülleri katla.
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
      icon: 'bus-outline' as IconName,
      title: 'Ulaşım Talebi Artıyor',
      body: hubTomorrowRisk?.mainLine ?? 'T1 hattında yolcu talebi %18 arttı.',
      impact: 'YÜKSEK',
      tone: 'teal' as const,
    },
    {
      icon: 'flash-outline' as IconName,
      title: 'Enerji Fırsatı',
      body: hubImpactExplanationLine ?? 'Rüzgar enerjisi verimliliği %12 arttı.',
      impact: operationSignals.overall.status === 'stable' ? 'ORTA' : 'YÜKSEK',
      tone: 'gold' as const,
    },
    {
      icon: 'leaf-outline' as IconName,
      title: 'Çevre Uyarısı',
      body: 'Yeşil alan yatırımı sosyal güveni destekleyebilir.',
      impact: 'ORTA',
      tone: 'green' as const,
    },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="OPERASYON SİNYALLERİ" action="TÜMÜNÜ GÖR" />
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
              <Text style={styles.impactLabel}>ETKİ</Text>
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
    { title: 'Hat Planla', caption: 'Kapasiteyi artır.', icon: 'bus-outline' as IconName, route: '/events' as Href },
    { title: 'Enerji Dağıt', caption: 'Üretimi dengele.', icon: 'flash-outline' as IconName, route: '/events' as Href },
    { title: 'Yeşil Yatırım', caption: 'Alanları aç.', icon: 'leaf-outline' as IconName, route: '/risks' as Href },
    { title: 'Bütçe Ayarla', caption: 'Kaynak satın al.', icon: 'cart-outline' as IconName, route: '/events' as Href },
    { title: 'Ekip Ata', caption: 'Ekipleri yönet.', icon: 'people-outline' as IconName, route: '/events' as Href },
    { title: 'Rapor Oluştur', caption: 'Günü incele.', icon: 'bar-chart-outline' as IconName, route: '/reports' as Href },
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
            <MiniIcon icon={action.icon} tone={action.icon === 'flash-outline' ? 'gold' : action.icon === 'leaf-outline' ? 'green' : 'teal'} />
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
    'Şehir gelişimini hızlandıracak plan sahil hattında yeni bir yeşil alan oluşturur.';

  return (
    <View style={styles.section}>
      <SectionTitle title="ÖNERİLEN PLAN" />
      <View style={styles.planCard}>
        <View style={styles.planImage}>
          <AssetImage source={cityHeroImage} />
        </View>
        <View style={styles.planCopy}>
          <Text style={styles.planTitle} numberOfLines={2}>
            Boğaz Parkı Projesi
          </Text>
          <Text style={styles.planBody} numberOfLines={3}>
            {contextLine}
          </Text>
          <View style={styles.planStats}>
            <PlanStat icon="happy-outline" label="+18" />
            <PlanStat icon="time-outline" label="2sa 30dk" />
            <PlanStat icon="cash-outline" label="650K" />
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
      accessibilityLabel="Planı onayla"
      style={({ pressed }) => [styles.approveButtonWrap, pressedScale(pressed)]}>
      <LinearGradient
        colors={[palette.tealDark, palette.teal, '#0D7168']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.approveButton}>
        <Text style={styles.approveText}>PLANI ONAYLA</Text>
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
  const reducedMotion = useCreviaReducedMotion();
  const motionDay = status.currentDay;
  const hubMotionEnabled = motionDay > 1;

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
            <ActiveTaskStack />
          </CreviaAnimatedCard>
          <EceInsightCard contextLine={hubEceContextLine ?? premiumContextLine} />
          <FocusCarousel />
          <DailyStreakStrip />
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
    paddingHorizontal: 18,
    paddingBottom: 18,
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
    width: 104,
    minHeight: 86,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 2,
    backgroundColor: palette.tealDark,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  reputationLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldSoft,
    textAlign: 'center',
  },
  reputationValue: {
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '900',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    minWidth: 0,
  },
  resourceChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
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
    fontSize: 12,
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
  body: {
    paddingHorizontal: 16,
    gap: 14,
  },
  taskStackWrap: {
    paddingTop: 4,
    paddingRight: 14,
    minHeight: 434,
  },
  stackBackTwo: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: '86%',
    height: 352,
    borderRadius: 22,
    backgroundColor: '#E5D4A7',
    borderWidth: 1,
    borderColor: 'rgba(155,116,29,0.28)',
    transform: [{ rotate: '4deg' }],
  },
  stackBackOne: {
    position: 'absolute',
    top: 20,
    right: 8,
    width: '90%',
    height: 368,
    borderRadius: 22,
    backgroundColor: '#D7E5DE',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.18)',
    transform: [{ rotate: '2deg' }],
  },
  taskCard: {
    minHeight: 398,
    borderRadius: 24,
    padding: 12,
    gap: 11,
    borderWidth: 2,
    borderColor: palette.tealMid,
    shadowColor: '#0B302C',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },
  taskLabel: {
    position: 'absolute',
    left: 16,
    top: 12,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(7,86,79,0.88)',
  },
  taskLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.white,
  },
  taskHero: {
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
  },
  taskMainRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  taskTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: palette.text,
  },
  taskBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: palette.muted,
  },
  rewardCapsule: {
    width: 82,
    minHeight: 78,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: palette.tealSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rewardText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.teal,
    textAlign: 'center',
  },
  progressBlock: {
    gap: 6,
    minWidth: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 11,
    borderRadius: 999,
    backgroundColor: '#E2D8BE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  taskCta: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.teal,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  taskCtaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
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
  stackHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
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
    gap: 8,
  },
  quickAction: {
    width: '48.8%',
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
    minHeight: 178,
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
    width: 126,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
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
});
