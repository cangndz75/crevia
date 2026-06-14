// @refresh reset
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
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

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { CenterPortfolioSurface } from './CenterPortfolioSurface';

const avatarImage = require('@/assets/characters/char_chief_operations_01.png');
const cityHeroImage = require('@/assets/districts/central/district_central_overview_01.png');
const routeImage = require('@/assets/districts/route/district_route_network_01.png');
const parkImage = require('@/assets/events/opportunity/ev_park_renewal_01.png');
const rewardChestImage = require('@/assets/crevia/icons/premium/premium_diamond_gold.png');
const dailyBadgeImage = require('@/assets/badges/badge_daily_goal_02.png');

const palette = {
  background: '#F8F1E4',
  surface: '#FFFCF5',
  surfaceWarm: '#FFF6E6',
  surfaceMint: '#EAF5EE',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#DFF1EB',
  gold: '#D8A72E',
  goldLight: '#FFE5A2',
  goldDark: '#9B741D',
  green: '#3E9E6A',
  red: '#C85A4B',
  text: '#173D3A',
  muted: '#68746E',
  border: 'rgba(7, 86, 79, 0.10)',
  white: '#FFFFFF',
} as const;

type IconName = keyof typeof Ionicons.glyphMap;

type Resource = {
  id: string;
  icon: IconName;
  value: string;
  tone: 'gold' | 'gem';
  badge?: string;
};

type Shortcut = {
  id: string;
  label: string;
  icon: IconName;
  route: Href;
  badge?: string;
};

type FlowStep = {
  id: string;
  label: string;
  icon: IconName;
  state: 'done' | 'active' | 'locked';
};

type HubReferenceHomeProps = {
  presentation: CenterHomePresentation;
  scrollFooter?: ReactNode;
};

const resources: Resource[] = [
  { id: 'coin', icon: 'cash', value: '1.250', tone: 'gold', badge: '2' },
  { id: 'gem', icon: 'diamond', value: '48', tone: 'gem' },
];

const shortcuts: Shortcut[] = [
  { id: 'start', label: 'Başlangıç', icon: 'flag', route: '/events' },
  { id: 'daily', label: 'Günlük', icon: 'calendar', route: '/events' },
  { id: 'goals', label: 'Hedefler', icon: 'navigate-circle', route: '/events' },
  { id: 'rewards', label: 'Ödüller', icon: 'file-tray-full', route: '/progression', badge: '3' },
  { id: 'strategy', label: 'Strateji', icon: 'bulb', route: '/reports' },
];

const flowSteps: FlowStep[] = [
  { id: 'flag', label: '1', icon: 'flag', state: 'done' },
  { id: 'center', label: '2', icon: 'business', state: 'done' },
  { id: 'active', label: '3', icon: 'star', state: 'active' },
  { id: 'shield', label: '4', icon: 'shield-checkmark', state: 'locked' },
  { id: 'gift', label: '5', icon: 'gift', state: 'locked' },
];

function useLayoutMetrics() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight ?? 24)
      : insets.top;

  return {
    compact: width < 370,
    topInset,
    bottomPadding: tabBarHeight + 28,
  };
}

function pressStyle(pressed: boolean) {
  return {
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  };
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function AssetImage({ source, style }: { source: ImageSource; style?: object }) {
  return <Image source={source} style={[styles.assetImage, style]} contentFit="cover" transition={160} />;
}

function HeaderSection({
  presentation,
  topInset,
  compact,
}: {
  presentation: CenterHomePresentation;
  topInset: number;
  compact: boolean;
}) {
  const router = useRouter();
  const level = presentation.headerSummary.levelLabel?.replace('Sv. ', '') || '12';

  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <Image
        source={cityHeroImage}
        style={styles.headerBackdrop}
        contentFit="cover"
        transition={160}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <LinearGradient
        colors={['rgba(248,241,228,0.15)', 'rgba(248,241,228,0.94)']}
        style={styles.headerBackdropFade}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profil"
        onPress={() => {
          playLightImpactHaptic();
          router.push('/profile' as Href);
        }}
        style={({ pressed }) => [styles.identityArea, pressStyle(pressed)]}>
        <View style={styles.avatarFrame}>
          <Image source={avatarImage} style={styles.avatar} contentFit="cover" />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText} numberOfLines={1}>
              {level}
            </Text>
          </View>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            Crevia
          </Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText} numberOfLines={1}>
              Merkez
            </Text>
            <Ionicons name="location" size={12} color={palette.tealMid} />
          </View>
          <Text style={styles.roleText} numberOfLines={1}>
            <Ionicons name="ribbon" size={10} color={palette.goldDark} /> Merkez Yöneticisi
          </Text>
        </View>
      </Pressable>

      <View style={[styles.resourceRow, compact ? styles.resourceRowCompact : undefined]}>
        {resources.map((resource) => (
          <View
            key={resource.id}
            style={[
              styles.resourcePill,
              resource.tone === 'gem' ? styles.resourcePillGem : undefined,
            ]}>
            <View
              style={[
                styles.resourceIcon,
                resource.tone === 'gem' ? styles.resourceIconGem : undefined,
              ]}>
              <Ionicons
                name={resource.icon}
                size={14}
                color={resource.tone === 'gem' ? '#00A97F' : palette.goldDark}
              />
            </View>
            <Text style={styles.resourceValue} numberOfLines={1}>
              {resource.value}
            </Text>
            <View style={styles.resourcePlus}>
              <Ionicons name="add" size={10} color={palette.white} />
            </View>
            {resource.badge ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceBadgeText}>{resource.badge}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function ShortcutRow() {
  const router = useRouter();

  return (
    <View style={styles.shortcutRow}>
      {shortcuts.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() => {
            playLightImpactHaptic();
            router.push(item.route);
          }}
          style={({ pressed }) => [styles.shortcutCard, pressStyle(pressed)]}>
          <View style={styles.shortcutIconWrap}>
            <Ionicons name={item.icon} size={25} color={palette.tealMid} />
          </View>
          <Text style={styles.shortcutLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {item.label}
          </Text>
          {item.badge ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function MainQuestCard() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[palette.tealDark, palette.teal, '#096D62']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mainQuestCard}>
      <View style={styles.questSparkOne} />
      <View style={styles.questSparkTwo} />
      <View style={styles.questContent}>
        <View style={styles.questIllustration}>
          <AssetImage source={routeImage} />
          <View style={styles.flagPole} />
          <View style={styles.flagShape} />
        </View>
        <View style={styles.questCopy}>
          <View style={styles.questTag}>
            <Ionicons name="star" size={10} color={palette.goldLight} />
            <Text style={styles.questTagText}>ANA GÖREV</Text>
          </View>
          <Text style={styles.questTitle} numberOfLines={2}>
            İlk hedefe başla!
          </Text>
          <Text style={styles.questDescription} numberOfLines={2}>
            Merkez akışını aç ve ilk adımını at.
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={24} color={palette.goldDark} />
          <Text style={styles.xpBadgeText}>+50 XP</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Göreve Başla"
        onPress={() => {
          playLightImpactHaptic();
          router.push('/events' as Href);
        }}
        style={({ pressed }) => [styles.questCtaShadow, pressStyle(pressed)]}>
        <LinearGradient
          colors={['#FFE38D', '#E9AF34']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.questCta}>
          <Text style={styles.questCtaText}>Göreve Başla</Text>
          <Ionicons name="chevron-forward" size={22} color={palette.teal} />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  const ratio = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      {label ? (
        <Text style={styles.progressLabel} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

function TodayStatusCard() {
  return (
    <View style={styles.statusCard}>
      <SectionHeader title="BUGÜNKÜ DURUM" />
      <View style={styles.statusRow}>
        <View style={styles.statusCrest}>
          <Image source={dailyBadgeImage} style={styles.statusCrestImage} contentFit="contain" />
          <Ionicons name="happy" size={24} color={palette.goldLight} />
        </View>
        <View style={styles.statusCopy}>
          <View style={styles.statusTitleRow}>
            <Ionicons name="ribbon" size={15} color={palette.goldDark} />
            <Text style={styles.statusTitle} numberOfLines={1}>
              Merkez Seviye 12
            </Text>
          </View>
          <ProgressBar value={0.69} label="1.250 / 1.800 XP" />
          <Text style={styles.statusHelper} numberOfLines={2}>
            Bir sonraki seviye için 550 XP kaldı.
          </Text>
        </View>
        <View style={styles.statusChest}>
          <Image source={rewardChestImage} style={styles.chestImage} contentFit="contain" />
        </View>
      </View>
    </View>
  );
}

function ProgressFlowCard() {
  return (
    <View style={styles.flowCard}>
      <View style={styles.flowHeader}>
        <View>
          <SectionHeader title="MERKEZ AKIŞI" />
          <Text style={styles.flowSubText}>2 / 5 adım tamamlandı</Text>
        </View>
        <View style={styles.nextRewardBox}>
          <Text style={styles.nextRewardLabel}>Sonraki Ödül</Text>
          <Image source={rewardChestImage} style={styles.nextRewardImage} contentFit="contain" />
          <Text style={styles.nextRewardValue}>+100 XP</Text>
        </View>
      </View>
      <View style={styles.flowSteps}>
        {flowSteps.map((step, index) => (
          <View key={step.id} style={styles.flowStepWrap}>
            {index > 0 ? (
              <View
                style={[
                  styles.flowConnector,
                  flowSteps[index - 1]?.state === 'done' ? styles.flowConnectorDone : undefined,
                ]}
              />
            ) : null}
            <View
              style={[
                styles.flowStep,
                step.state === 'done' ? styles.flowStepDone : undefined,
                step.state === 'active' ? styles.flowStepActive : undefined,
              ]}>
              {step.state === 'active' ? (
                <Text style={styles.flowStepActiveText}>{step.label}</Text>
              ) : (
                <Ionicons
                  name={step.state === 'locked' ? 'lock-closed' : step.icon}
                  size={17}
                  color={step.state === 'done' ? palette.white : palette.muted}
                />
              )}
            </View>
            {step.state === 'done' ? (
              <View style={styles.flowCheck}>
                <Ionicons name="checkmark" size={9} color={palette.white} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function RewardsSection() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <SectionHeader title="KAZANIMLAR" subtitle="Başarıların ve ödüllerin" />
      <View style={styles.rewardGrid}>
        <LinearGradient
          colors={[palette.tealDark, palette.tealMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rewardCard, styles.dailyRewardCard]}>
          <View style={styles.rewardMedal}>
            <Ionicons name="shield-checkmark" size={28} color={palette.goldLight} />
          </View>
          <Text style={styles.rewardDarkTitle}>GÜNLÜK ÖDÜL</Text>
          <Text style={styles.rewardDarkBody}>Bugün giriş yaptın!</Text>
          <View style={styles.rewardStatsRow}>
            <Text style={styles.rewardDarkStat}>+25.000</Text>
            <Text style={styles.rewardDarkStat}>+100 XP</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ödül Al"
            onPress={() => playLightImpactHaptic()}
            style={({ pressed }) => [styles.rewardDarkCta, pressStyle(pressed)]}>
            <Text style={styles.rewardDarkCtaText}>ÖDÜL AL</Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.rewardCard, styles.stageRewardCard]}>
          <View style={styles.stageRewardCopy}>
            <Text style={styles.rewardLightTitle}>AŞAMA ÖDÜLÜ</Text>
            <Text style={styles.rewardLightBody} numberOfLines={2}>
              Büyüyen Kasaba 4. kilometre taşı
            </Text>
            <ProgressBar value={0.6} />
            <Text style={styles.stageProgressText}>3/5</Text>
          </View>
          <Image source={rewardChestImage} style={styles.stageChestImage} contentFit="contain" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İlerlemeni Gör"
            onPress={() => {
              playLightImpactHaptic();
              router.push('/progression' as Href);
            }}
            style={({ pressed }) => [styles.rewardLightCta, pressStyle(pressed)]}>
            <Text style={styles.rewardLightCtaText}>İLERLEMENİ GÖR</Text>
            <Ionicons name="chevron-forward" size={15} color={palette.tealMid} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function NextMissionCard() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <SectionHeader title="SONRAKİ GÖREV" subtitle="Şehrini bir adım daha ileri taşı" />
      <View style={styles.nextMissionCard}>
        <View style={styles.missionImageWrap}>
          <AssetImage source={parkImage} />
        </View>
        <View style={styles.missionCopy}>
          <Text style={styles.missionTitle} numberOfLines={1}>
            Şehir Parkı İnşa Et
          </Text>
          <Text style={styles.missionBody} numberOfLines={2}>
            Vatandaşların mutluluğunu artırmak için 3. seviyeli bir park aç.
          </Text>
          <View style={styles.missionMetaRow}>
            <View style={styles.missionMetaPill}>
              <Ionicons name="cash" size={12} color={palette.goldDark} />
              <Text style={styles.missionMetaText}>25.000</Text>
            </View>
            <View style={styles.missionMetaPill}>
              <Ionicons name="cube" size={12} color={palette.tealMid} />
              <Text style={styles.missionMetaText}>150</Text>
            </View>
            <View style={styles.missionMetaPill}>
              <Ionicons name="flash" size={12} color={palette.green} />
              <Text style={styles.missionMetaText}>10</Text>
            </View>
          </View>
        </View>
        <View style={styles.missionSide}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>2/3</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Devam Et"
            onPress={() => {
              playLightImpactHaptic();
              router.push('/events' as Href);
            }}
            style={({ pressed }) => [styles.missionCta, pressStyle(pressed)]}>
            <Text style={styles.missionCtaText}>DEVAM ET</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function HubReferenceHome({ presentation, scrollFooter }: HubReferenceHomeProps) {
  const { compact, topInset, bottomPadding } = useLayoutMetrics();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <HeaderSection presentation={presentation} topInset={topInset} compact={compact} />
        <View style={styles.body}>
          <ShortcutRow />
          <MainQuestCard />
          <TodayStatusCard />
          <ProgressFlowCard />
          <CenterPortfolioSurface portfolio={presentation.portfolioSurface} />
          <RewardsSection />
          <NextMissionCard />
          {scrollFooter ? <View style={styles.scrollFooter}>{scrollFooter}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const cardShadow = {
  shadowColor: palette.tealDark,
  shadowOpacity: 0.08,
  shadowRadius: 18,
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
  scrollContent: {
    gap: 12,
  },
  body: {
    paddingHorizontal: 16,
    gap: 14,
  },
  scrollFooter: {
    paddingTop: 4,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    minHeight: 132,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    overflow: 'hidden',
  },
  headerBackdrop: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '74%',
    height: 164,
    opacity: 0.22,
  },
  headerBackdropFade: {
    ...StyleSheet.absoluteFillObject,
  },
  identityArea: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatarFrame: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    backgroundColor: palette.goldLight,
    borderWidth: 1,
    borderColor: 'rgba(155,116,29,0.24)',
    ...cardShadow,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: palette.surface,
  },
  levelBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.surface,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
    fontVariant: ['tabular-nums'],
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  brandTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: palette.teal,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.tealMid,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
  },
  resourceRow: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 7,
    paddingTop: 4,
  },
  resourceRowCompact: {
    flexDirection: 'column',
  },
  resourcePill: {
    minWidth: 84,
    height: 36,
    borderRadius: 18,
    paddingLeft: 6,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.22)',
    position: 'relative',
    ...cardShadow,
  },
  resourcePillGem: {
    borderColor: 'rgba(13,113,104,0.14)',
  },
  resourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldLight,
  },
  resourceIconGem: {
    backgroundColor: '#DDF7EE',
  },
  resourceValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  resourcePlus: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealMid,
  },
  resourceBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
  resourceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.white,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 94,
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    position: 'relative',
    ...cardShadow,
  },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.16)',
  },
  shortcutLabel: {
    width: '100%',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: palette.teal,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.white,
  },
  mainQuestCard: {
    borderRadius: 24,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,229,162,0.36)',
    overflow: 'hidden',
    ...cardShadow,
  },
  questSparkOne: {
    position: 'absolute',
    left: 26,
    top: 22,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,229,162,0.10)',
  },
  questSparkTwo: {
    position: 'absolute',
    right: 28,
    top: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,229,162,0.12)',
  },
  questContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  questIllustration: {
    width: 104,
    height: 96,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
    flexShrink: 0,
  },
  flagPole: {
    position: 'absolute',
    left: 38,
    top: 16,
    width: 4,
    height: 45,
    borderRadius: 2,
    backgroundColor: palette.goldLight,
  },
  flagShape: {
    position: 'absolute',
    left: 42,
    top: 17,
    width: 34,
    height: 22,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: palette.gold,
  },
  questCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  questTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(216,167,46,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,229,162,0.20)',
  },
  questTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldLight,
  },
  questTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
    color: palette.surfaceWarm,
  },
  questDescription: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: 'rgba(255,252,245,0.76)',
  },
  xpBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldLight,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    flexShrink: 0,
  },
  xpBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldDark,
  },
  questCtaShadow: {
    alignSelf: 'flex-end',
    minWidth: 204,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  questCta: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  questCtaText: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.teal,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: palette.teal,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
  },
  statusCard: {
    borderRadius: 22,
    padding: 14,
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  statusCrest: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusCrestImage: {
    position: 'absolute',
    width: 72,
    height: 72,
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
  },
  progressTrack: {
    height: 18,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#E6E1D4',
    borderWidth: 1,
    borderColor: 'rgba(155,116,29,0.20)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  progressLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '900',
    color: palette.surface,
    fontVariant: ['tabular-nums'],
  },
  statusHelper: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.muted,
  },
  statusChest: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.24)',
    flexShrink: 0,
  },
  chestImage: {
    width: 48,
    height: 48,
  },
  flowCard: {
    borderRadius: 22,
    padding: 14,
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  flowSubText: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
    color: palette.teal,
  },
  nextRewardBox: {
    width: 88,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    gap: 2,
    backgroundColor: palette.surfaceWarm,
    flexShrink: 0,
  },
  nextRewardLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.muted,
  },
  nextRewardImage: {
    width: 38,
    height: 38,
  },
  nextRewardValue: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.teal,
  },
  flowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  flowStepWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  flowConnector: {
    position: 'absolute',
    left: '-50%',
    right: '50%',
    top: 23,
    height: 4,
    backgroundColor: '#DED9CC',
  },
  flowConnectorDone: {
    backgroundColor: '#7CCFA2',
  },
  flowStep: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECE1',
    borderWidth: 2,
    borderColor: '#DED8C9',
    zIndex: 2,
  },
  flowStepDone: {
    backgroundColor: palette.green,
    borderColor: '#9DE0BA',
  },
  flowStepActive: {
    backgroundColor: palette.goldLight,
    borderColor: palette.gold,
    shadowColor: palette.gold,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  flowStepActiveText: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.goldDark,
  },
  flowCheck: {
    position: 'absolute',
    bottom: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.green,
    borderWidth: 1.5,
    borderColor: palette.surface,
    zIndex: 3,
  },
  section: {
    gap: 10,
  },
  rewardGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  rewardCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 162,
    borderRadius: 20,
    padding: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  dailyRewardCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,229,162,0.30)',
  },
  rewardMedal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,229,162,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,229,162,0.28)',
  },
  rewardDarkTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.goldLight,
  },
  rewardDarkBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: 'rgba(255,252,245,0.78)',
  },
  rewardStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardDarkStat: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldLight,
  },
  rewardDarkCta: {
    marginTop: 'auto',
    minHeight: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,229,162,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,229,162,0.34)',
  },
  rewardDarkCtaText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.goldLight,
  },
  stageRewardCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.22)',
  },
  stageRewardCopy: {
    maxWidth: '72%',
    gap: 6,
  },
  rewardLightTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
  },
  rewardLightBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.muted,
  },
  stageProgressText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldDark,
  },
  stageChestImage: {
    position: 'absolute',
    right: 8,
    top: 28,
    width: 62,
    height: 62,
  },
  rewardLightCta: {
    marginTop: 'auto',
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.20)',
  },
  rewardLightCtaText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '900',
    color: palette.teal,
  },
  nextMissionCard: {
    minHeight: 126,
    borderRadius: 22,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  missionImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
    flexShrink: 0,
  },
  missionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
  },
  missionBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.muted,
  },
  missionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  missionMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: palette.surfaceWarm,
  },
  missionMetaText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.text,
  },
  missionSide: {
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: palette.tealSoft,
    borderTopColor: palette.tealMid,
    borderRightColor: palette.tealMid,
    backgroundColor: palette.surface,
  },
  progressCircleText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
  },
  missionCta: {
    minHeight: 34,
    borderRadius: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.teal,
  },
  missionCtaText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldLight,
  },
});
