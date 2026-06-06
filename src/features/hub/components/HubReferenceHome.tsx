import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CarryOverMemoryModel } from '@/core/carryOver';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';
import { creviaAssets } from '@/core/assets/creviaAssets';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { HubTomorrowRiskStrip } from './HubTomorrowRiskStrip';

const COMPACT_BREAKPOINT = 370;

const eceImage = hubAssets.advisorPortrait;
const buildingThumb = creviaAssets.buildings.statusSquare;
const municipalImage = creviaAssets.buildings.municipalHall3d;
const teamImage = hubAssets.quickActions.team;
const routeImage = hubAssets.quickActions.route;
const protocolImage = hubAssets.quickActions.announce;
const reportImage = creviaAssets.reports.icons.chartSuccess;
const personnelImage = creviaAssets.socialPulse.teamStatus;
const vehicleImage = creviaAssets.vehicles.fieldOperatorTruck;

const palette = {
  background: '#F7F1E6',
  teal: '#07534C',
  tealDark: '#063F3A',
  mint: '#E9F7F2',
  mintSoft: '#F2FBF7',
  gold: '#D8AE2F',
  goldSoft: '#F5E7B7',
  card: '#FFFDF8',
  text: '#173D3A',
  muted: '#63706D',
  border: 'rgba(7, 83, 76, 0.10)',
  white: '#FFFFFF',
} as const;

function useHubLayoutMetrics() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const isCompact = width <= COMPACT_BREAKPOINT;
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight ?? 24)
      : insets.top;

  return {
    width,
    isCompact,
    insets,
    topInset,
    scrollBottomPadding: tabBarHeight + (isCompact ? 148 : 136),
    headerTitleSize: isCompact ? 22 : 24,
  };
}

function shadowStyle() {
  return {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  } as const;
}

function CardAssetImage({
  source,
  style,
  containerStyle,
  backgroundColor = palette.card,
}: {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}) {
  return (
    <View
      style={[styles.assetClip, { backgroundColor }, containerStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image source={source} style={[styles.assetImage, style]} contentFit="contain" />
    </View>
  );
}

type HubReferenceHomeProps = {
  hubCarryOverMemory?: CarryOverMemoryModel | null;
  hubImpactExplanationLine?: string | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  showHubCarryOver?: boolean;
  scrollFooter?: ReactNode;
};

type IconName = keyof typeof Ionicons.glyphMap;

function metaDistrictName(name: string | null | undefined) {
  const short = name?.split(' ')[0];
  return short && short.length > 0 ? short : 'Merkez';
}

function IconButton({
  icon,
  label,
  onPress,
  active = false,
  notification = false,
  size = 44,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  notification?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.headerIconButton,
        { width: size, height: size, borderRadius: size / 2 - 4 },
        active ? styles.headerIconButtonActive : styles.headerIconButtonGhost,
        pressed && styles.pressed,
      ]}>
      <Ionicons
        name={icon}
        size={active ? 20 : 18}
        color={active ? palette.tealDark : palette.white}
      />
      {notification ? <View style={styles.notificationDot} /> : null}
    </Pressable>
  );
}

function PremiumHubHeader() {
  const router = useRouter();
  const { topInset, headerTitleSize } = useHubLayoutMetrics();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const title = `${greeting.title || 'İyi Akşamlar'}, ${status.playerName || 'Can'} ${
    greeting.emoji || '🌙'
  }`;
  const meta = `${status.currentDay}. Gün · ${metaDistrictName(
    status.selectedDistrictName,
  )} · Sv.${status.level}`;

  return (
    <LinearGradient
      colors={[palette.tealDark, palette.teal, '#0A6A61']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        {
          paddingTop: topInset + 12,
          minHeight: topInset + 198,
        },
      ]}>
      <View style={styles.headerBuildingMask}>
        <Image source={municipalImage} style={styles.headerBuilding} contentFit="cover" />
      </View>
      <View style={styles.headerCircleLarge} />
      <View style={styles.headerCircleSmall} />

      <View style={styles.headerContent}>
        <Pressable
          onPress={() => router.push('/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Profili aç"
          style={({ pressed }) => [styles.avatarPress, pressed && styles.pressed]}>
          <HeaderAvatar
            size={60}
            level={status.level}
            showLevelBadge
            borderColor={palette.goldSoft}
          />
        </Pressable>

        <View style={styles.headerTextCol}>
          <Text
            style={[styles.headerTitle, { fontSize: headerTitleSize, lineHeight: headerTitleSize + 4 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.82}>
            {title}
          </Text>
          <View style={styles.headerMetaRow}>
            <Ionicons name="location" size={13} color="rgba(255,255,255,0.82)" />
            <Text
              style={styles.headerMeta}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.88}>
              {meta}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            active
            icon="bar-chart"
            label="Raporları aç"
            onPress={() => router.push('/reports' as Href)}
          />
          <IconButton
            notification={status.notificationCount > 0}
            icon="notifications-outline"
            label="Bildirimleri aç"
            onPress={() => router.push('/social' as Href)}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

function Pill({
  label,
  tone = 'mint',
  compact = false,
}: {
  label: string;
  tone?: 'mint' | 'gold';
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        tone === 'gold' ? styles.pillGold : styles.pillMint,
      ]}>
      <Text style={[styles.pillText, compact && styles.pillTextCompact]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function PreviousDecisionEffectCard({
  memory,
  impactExplanationLine,
}: {
  memory?: CarryOverMemoryModel | null;
  impactExplanationLine?: string | null;
}) {
  const body =
    memory?.summary ??
    memory?.detail ??
    'Dünkü operasyon kararı bugün saha planında hala hissediliyor.';

  return (
    <View style={[styles.card, styles.previousCard]}>
      <View style={styles.roundIcon}>
        <Ionicons name="time-outline" size={22} color={palette.teal} />
      </View>
      <View style={styles.previousCopy}>
        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          Önceki Kararın Etkisi
        </Text>
        <Text style={styles.bodyText} numberOfLines={2} ellipsizeMode="tail">
          {body}
        </Text>
        {impactExplanationLine ? (
          <Text style={styles.previousImpactLine} numberOfLines={1} ellipsizeMode="tail">
            {impactExplanationLine}
          </Text>
        ) : null}
        <View style={styles.pillRow}>
          <Pill label="Operasyon" compact />
          <Pill label="İz" tone="gold" compact />
        </View>
      </View>
      <View style={styles.previousImageWrap}>
        <CardAssetImage source={buildingThumb} style={styles.previousImage} />
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={12} color={palette.tealDark} />
        </View>
      </View>
    </View>
  );
}

function EceWelcomeCard() {
  const router = useRouter();
  const status = useGameStatus();
  const { isCompact } = useHubLayoutMetrics();
  const eceWidth = isCompact ? 130 : 150;

  const handlePress = () => {
    playLightImpactHaptic();
    router.push('/events' as Href);
  };

  return (
    <View style={[styles.card, styles.eceCard]}>
      <View style={styles.eceDecor} />
      <View style={styles.eceCopy}>
        <Text style={styles.eceName} numberOfLines={1} ellipsizeMode="tail">
          Ece
        </Text>
        <View style={styles.advisorBadge}>
          <Text style={styles.advisorBadgeText} numberOfLines={1} ellipsizeMode="tail">
            Stajyer Operasyon Asistanı
          </Text>
        </View>
        <Text style={styles.eceLead} numberOfLines={1} ellipsizeMode="tail">
          Merkeze hoş geldin {status.playerName || 'Can'}!
        </Text>
        <Text style={styles.bodyText} numberOfLines={2} ellipsizeMode="tail">
          Bugün birlikte temel akışı öğrenip ilk kararlarını vermeye başlayalım.
        </Text>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Kısa Öneri AI"
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
          <Ionicons name="sparkles" size={16} color={palette.white} />
          <Text style={styles.primaryCtaText} numberOfLines={1} ellipsizeMode="tail">
            Kısa Öneri AI
          </Text>
          <Ionicons name="chevron-forward" size={16} color={palette.white} />
        </Pressable>
      </View>
      <CardAssetImage
        source={eceImage}
        backgroundColor={palette.goldSoft}
        containerStyle={[styles.eceImageWrap, { width: eceWidth, height: eceWidth + 12 }]}
        style={styles.eceImageAsset}
      />
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  badge,
}: {
  icon?: IconName;
  title: string;
  badge?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon ? <Ionicons name={icon} size={18} color={palette.gold} /> : null}
        <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
      {badge ? (
        <View style={styles.sectionBadgeWrap}>
          <Pill label={badge} tone="gold" compact />
        </View>
      ) : null}
    </View>
  );
}

function OperationFocusCard() {
  const { isCompact } = useHubLayoutMetrics();
  const focusItems: {
    title: string;
    body: string;
    icon: IconName;
    tone: 'gold' | 'mint';
  }[] = [
    {
      title: 'Kritik Takip',
      body: 'Kritik sinyal sakin takipte; kaynak temposu dengeli tutulmalı.',
      icon: 'pulse-outline',
      tone: 'gold',
    },
    {
      title: 'Aktif Rota',
      body: 'Rota aktif: İstasyon takipte, ekip sahaya hazırlanıyor.',
      icon: 'navigate-outline',
      tone: 'mint',
    },
    {
      title: 'Sınırlı Etki',
      body: 'İstasyon günlük hamle olabilir; küçük etki, ölçülü trade-off.',
      icon: 'refresh-outline',
      tone: 'mint',
    },
  ];

  const focusCards = focusItems.map((item) => (
    <View
      key={item.title}
      style={[styles.focusMini, isCompact ? styles.focusMiniScroll : null]}>
      <View
        style={[
          styles.focusIcon,
          item.tone === 'gold' ? styles.focusIconGold : styles.focusIconMint,
        ]}>
        <Ionicons
          name={item.icon}
          size={18}
          color={item.tone === 'gold' ? '#98731B' : palette.teal}
        />
      </View>
      <Text style={styles.focusTitle} numberOfLines={1} ellipsizeMode="tail">
        {item.title}
      </Text>
      <Text style={styles.focusBody} numberOfLines={3} ellipsizeMode="tail">
        {item.body}
      </Text>
    </View>
  ));

  return (
    <View style={[styles.card, styles.sectionCard]}>
      <SectionHeader title="Bugünün Operasyon Odağı" badge="Mahalle Güveni" />
      {isCompact ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.focusScroll}>
          {focusCards}
        </ScrollView>
      ) : (
        <View style={styles.focusRow}>{focusCards}</View>
      )}
    </View>
  );
}

function QuickPreparationsCard() {
  const router = useRouter();
  const items: {
    title: string;
    image: ImageSource;
    route: Href;
  }[] = [
    { title: 'Ekip Yönetimi', image: teamImage, route: '/events' as Href },
    { title: 'Rota Planlama', image: routeImage, route: '/map' as Href },
    { title: 'Saha Protokolleri', image: protocolImage, route: '/events' as Href },
    { title: 'Raporlama', image: reportImage, route: '/reports' as Href },
  ];

  return (
    <View style={[styles.card, styles.quickCard]}>
      <View style={styles.quickHeader}>
        <View style={styles.quickTitleBlock}>
          <Ionicons name="flash" size={18} color={palette.gold} />
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            Hızlı Hazırlıklar
          </Text>
          <View style={styles.quickDayBadge}>
            <Pill label="Gün 2" tone="gold" compact />
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/events' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Tüm hazırlıkları gör"
          style={styles.quickLinkPress}>
          <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
            Tümünü Gör ›
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickScroll}>
        {items.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => router.push(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}>
            <CardAssetImage
              source={item.image}
              backgroundColor="#F8F3E9"
              containerStyle={styles.quickImageWrap}
              style={styles.quickImage}
            />
            <Text style={styles.quickItemTitle} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.quickItemDay} numberOfLines={1} ellipsizeMode="tail">
              Gün 2
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function signalLabel(status: string | undefined) {
  return status === 'stable' ? 'Dengeli' : 'İzlemede';
}

function OperationSignalsCard() {
  const operationSignals = useGameStore((s) => s.operationSignals);
  const { isCompact } = useHubLayoutMetrics();

  return (
    <View style={[styles.card, styles.sectionCard]}>
      <SectionHeader title="Operasyon Sinyalleri" badge="İzlemede" />
      <View style={[styles.signalRow, isCompact && styles.signalRowStack]}>
        <SignalCard
          image={personnelImage}
          title="Personel"
          badge={signalLabel(operationSignals.personnel.status)}
          body="Bugün personel odağı seçmek yorgunluğu azaltır."
          stacked={isCompact}
        />
        <SignalCard
          image={vehicleImage}
          title="Araç"
          badge={signalLabel(operationSignals.vehicles.status)}
          body="Araç filosu günlük operasyon için hazır görünüyor."
          stacked={isCompact}
        />
      </View>
    </View>
  );
}

function SignalCard({
  image,
  title,
  badge,
  body,
  stacked = false,
}: {
  image: ImageSource;
  title: string;
  badge: string;
  body: string;
  stacked?: boolean;
}) {
  return (
    <View style={[styles.signalMini, stacked && styles.signalMiniStack]}>
      <CardAssetImage
        source={image}
        backgroundColor={palette.mintSoft}
        containerStyle={styles.signalImageWrap}
        style={styles.signalImage}
      />
      <View style={styles.signalText}>
        <Text style={styles.signalTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={styles.signalBadgeRow}>
          <Pill label={badge} compact />
        </View>
        <Text style={styles.signalBody} numberOfLines={2} ellipsizeMode="tail">
          {body}
        </Text>
      </View>
    </View>
  );
}

function DailyGoalCard() {
  return (
    <View style={[styles.card, styles.dailyGoalCard]}>
      <View style={styles.goalCopy}>
        <Text style={styles.goldEyebrow} numberOfLines={1} ellipsizeMode="tail">
          Günlük Hedef
        </Text>
        <Text style={styles.goalTitle} numberOfLines={1} ellipsizeMode="tail">
          Ekibi yormadan müdahale et
        </Text>
        <View style={styles.goalMetaRow}>
          <Text style={styles.goalReward} numberOfLines={1} ellipsizeMode="tail">
            +30 İlerleme
          </Text>
          <Text style={styles.goalPercent} numberOfLines={1} ellipsizeMode="tail">
            %100
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
      <View style={styles.circularProgress}>
        <Text style={styles.circularText} numberOfLines={1}>
          100%
        </Text>
      </View>
    </View>
  );
}

function SuggestedPlanCard() {
  const router = useRouter();
  const { isCompact } = useHubLayoutMetrics();
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const confirmDailyOperationsPlan = useGameStore((s) => s.confirmDailyOperationsPlan);
  const confirmed = dailyOperationsPlan.confirmedAtDay === currentDay;

  const handleConfirm = () => {
    playLightImpactHaptic();
    confirmDailyOperationsPlan();
  };

  return (
    <View style={[styles.card, styles.suggestedCard]}>
      <View style={styles.suggestedContent}>
        <View style={styles.suggestedText}>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
            Bugünün Önerilen Planı
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} numberOfLines={1}>
              Mahalle:
            </Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
              Cumhuriyet
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} numberOfLines={1}>
              Personel:
            </Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
              Dengeli
            </Text>
          </View>
          <Text style={styles.bodyText} numberOfLines={2} ellipsizeMode="tail">
            Seçilen plan bugün sinyallere yanıt verebilir; etki gün sonunda izlenir.
          </Text>
        </View>
        <CardAssetImage
          source={buildingThumb}
          containerStyle={styles.suggestedImageWrap}
          style={styles.suggestedImage}
        />
      </View>

      <View style={[styles.planButtons, isCompact && styles.planButtonsStack]}>
        <Pressable
          disabled={confirmed}
          onPress={handleConfirm}
          accessibilityRole="button"
          accessibilityLabel="Planı Onayla"
          style={({ pressed }) => [
            styles.planPrimary,
            confirmed && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.planPrimaryText} numberOfLines={1} ellipsizeMode="tail">
            {confirmed ? 'Plan Onaylandı' : 'Planı Onayla'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/events' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Planı Detaylı Gör"
          style={({ pressed }) => [styles.planSecondary, pressed && styles.pressed]}>
          <Text style={styles.planSecondaryText} numberOfLines={1} ellipsizeMode="tail">
            Planı Detaylı Gör
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function HubReferenceHome({
  hubCarryOverMemory,
  hubImpactExplanationLine,
  hubTomorrowRisk,
  scrollFooter,
}: HubReferenceHomeProps = {}) {
  const { scrollBottomPadding } = useHubLayoutMetrics();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        <PremiumHubHeader />
        <View style={styles.body}>
          <PreviousDecisionEffectCard
            memory={hubCarryOverMemory}
            impactExplanationLine={hubImpactExplanationLine}
          />
          <HubTomorrowRiskStrip model={hubTomorrowRisk} />
          <EceWelcomeCard />
          <OperationFocusCard />
          <QuickPreparationsCard />
          <OperationSignalsCard />
          <DailyGoalCard />
          <SuggestedPlanCard />
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
  assetClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerBuildingMask: {
    position: 'absolute',
    right: -16,
    bottom: -12,
    width: 210,
    height: 154,
    opacity: 0.14,
    overflow: 'hidden',
    backgroundColor: palette.tealDark,
  },
  headerBuilding: {
    width: '100%',
    height: '100%',
  },
  headerCircleLarge: {
    position: 'absolute',
    right: -44,
    top: 38,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(223,244,237,0.13)',
  },
  headerCircleSmall: {
    position: 'absolute',
    left: 28,
    bottom: 18,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(246,231,182,0.13)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatarPress: {
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  headerTitle: {
    fontWeight: '900',
    color: palette.white,
    flexShrink: 1,
    minWidth: 0,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: palette.goldSoft,
  },
  headerIconButtonGhost: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.23)',
  },
  notificationDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.gold,
  },
  body: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -28,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadowStyle(),
  },
  previousCard: {
    minHeight: 106,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  roundIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mintSoft,
    flexShrink: 0,
  },
  previousCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  previousImageWrap: {
    width: 80,
    height: 80,
    flexShrink: 0,
    position: 'relative',
  },
  previousImage: {
    width: 80,
    height: 80,
  },
  checkBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
    borderWidth: 1,
    borderColor: palette.card,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.muted,
  },
  previousImpactLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.teal,
    flexShrink: 1,
    minWidth: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 118,
    flexShrink: 0,
  },
  pillCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 92,
  },
  pillMint: {
    backgroundColor: palette.mint,
  },
  pillGold: {
    backgroundColor: palette.goldSoft,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  pillTextCompact: {
    fontSize: 9,
  },
  eceCard: {
    minHeight: 218,
    padding: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eceDecor: {
    position: 'absolute',
    right: 8,
    top: 18,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F8EED2',
  },
  eceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    zIndex: 2,
    paddingRight: 8,
  },
  eceName: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
    color: palette.text,
  },
  advisorBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: palette.mint,
  },
  advisorBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  eceLead: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  primaryCta: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.teal,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  primaryCtaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '900',
    color: palette.white,
  },
  eceImageWrap: {
    flexShrink: 0,
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  eceImageAsset: {
    width: '100%',
    height: '100%',
  },
  sectionCard: {
    padding: 15,
    gap: 12,
  },
  sectionBadgeWrap: {
    flexShrink: 0,
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 9,
    minWidth: 0,
  },
  focusScroll: {
    gap: 9,
    paddingRight: 4,
  },
  focusMini: {
    flex: 1,
    minWidth: 0,
    minHeight: 128,
    borderRadius: 18,
    padding: 12,
    gap: 8,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  focusMiniScroll: {
    flex: 0,
    width: 108,
    minWidth: 108,
  },
  focusIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusIconGold: {
    backgroundColor: palette.goldSoft,
  },
  focusIconMint: {
    backgroundColor: palette.mint,
  },
  focusTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: palette.text,
    flexShrink: 1,
    minWidth: 0,
  },
  focusBody: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  miniTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: palette.text,
  },
  miniBody: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  quickCard: {
    padding: 15,
    gap: 12,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  quickTitleBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  quickDayBadge: {
    flexShrink: 0,
  },
  quickLinkPress: {
    flexShrink: 0,
    paddingTop: 2,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
  },
  quickScroll: {
    gap: 10,
    paddingRight: 8,
  },
  quickItem: {
    width: 110,
    height: 122,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8F3E9',
    borderWidth: 1,
    borderColor: palette.border,
  },
  quickImageWrap: {
    width: 48,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quickImage: {
    width: 48,
    height: 44,
  },
  quickItemTitle: {
    alignSelf: 'stretch',
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: palette.text,
    textAlign: 'center',
  },
  quickItemDay: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.muted,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  signalRowStack: {
    flexDirection: 'column',
  },
  signalMiniStack: {
    flex: 0,
    width: '100%',
  },
  signalMini: {
    flex: 1,
    minWidth: 0,
    minHeight: 88,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  signalImageWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  signalImage: {
    width: 38,
    height: 38,
  },
  signalText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  signalTitle: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
  },
  signalBadgeRow: {
    alignSelf: 'flex-start',
  },
  signalBody: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  dailyGoalCard: {
    minHeight: 100,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  goldEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9C7418',
  },
  goalTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.text,
  },
  goalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  goalReward: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.gold,
  },
  goalPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.teal,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(216,174,47,0.22)',
    marginRight: 4,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.gold,
  },
  circularProgress: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    flexShrink: 0,
  },
  circularText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.text,
  },
  suggestedCard: {
    padding: 16,
    gap: 14,
  },
  suggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  suggestedText: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  suggestedImageWrap: {
    width: 88,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  suggestedImage: {
    width: 88,
    height: 80,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 5,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.muted,
  },
  infoValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.text,
  },
  planButtons: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  planButtonsStack: {
    flexDirection: 'column',
  },
  planPrimary: {
    flex: 1,
    minWidth: 0,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: palette.teal,
  },
  planPrimaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.white,
  },
  planSecondary: {
    flex: 1,
    minWidth: 0,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  planSecondaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.teal,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.7,
  },
});
