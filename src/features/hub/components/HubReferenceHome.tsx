import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';

const eceImage = require('../../../../assets/b1.png');
const municipalImage = require('../../../../assets/b2.png');
const teamImage = require('../../../../assets/b3.png');
const planImage = require('../../../../assets/b4.png');
const routeImage = require('../../../../assets/b5.png');
const protocolImage = require('../../../../assets/b6.png');
const personnelImage = require('../../../../assets/b7.png');
const reportImage = require('../../../../assets/b8.png');
const vehicleImage = require('../../../../assets/b9.png');
const learningImage = require('../../../../assets/c1.png');

const palette = {
  background: '#F7F1E6',
  card: '#FFFDF7',
  tealDark: '#0E5F5B',
  teal: '#0F8F86',
  tealSoft: '#BDEFE7',
  gold: '#D9AA2B',
  goldSoft: '#F2D479',
  textDark: '#183B3A',
  textMuted: '#6C7A78',
  border: 'rgba(20, 70, 66, 0.10)',
  white: '#FFFFFF',
} as const;

type AnimatedCardProps = {
  delay: number;
  style?: object;
  children: ReactNode;
};

type PressScaleProps = {
  onPress?: () => void;
  style?: object;
  children: ReactNode;
  accessibilityLabel: string;
  disabled?: boolean;
};

function useEntrance(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

function AnimatedCard({ delay, style, children }: AnimatedCardProps) {
  const animatedStyle = useEntrance(delay);
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

function PressScale({
  onPress,
  style,
  children,
  accessibilityLabel,
  disabled = false,
}: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 22,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && styles.disabled]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function ProgressRing({ value, size = 56 }: { value: number; size?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View
        style={[
          styles.ringArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate }],
          },
        ]}
      />
      <View style={styles.ringInner}>
        <Text style={styles.ringText} numberOfLines={1}>
          {clamped}%
        </Text>
      </View>
    </View>
  );
}

function Chip({
  icon,
  label,
  tone = 'mint',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'mint' | 'gold' | 'ghost';
}) {
  const toneStyle =
    tone === 'gold'
      ? styles.chip_gold
      : tone === 'ghost'
        ? styles.chip_ghost
        : styles.chip_mint;

  return (
    <View style={[styles.chip, toneStyle]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={12}
          color={tone === 'gold' ? palette.gold : palette.tealDark}
        />
      ) : null}
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function HeaderBlock() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const metaLine = `${status.currentDay}. Gün · ${status.selectedDistrictName.split(' ')[0] ?? 'Merkez'} · Sv.${status.level}`;

  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <Image source={municipalImage} style={styles.headerBgImage} contentFit="cover" />
      <View style={styles.headerTint} />
      <View style={styles.headerTop}>
        <PressScale
          accessibilityLabel="Profili aç"
          onPress={() => router.push('/profile' as Href)}
          style={styles.avatarButton}>
          <HeaderAvatar size={52} level={status.level} showLevelBadge />
        </PressScale>

        <View style={styles.headerCopy}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting.title}, {status.playerName} {greeting.emoji}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.84)" />
            <Text style={styles.headerMeta} numberOfLines={1}>
              {metaLine}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.resourceChips}>
            <Chip icon="ellipse" label={status.sourceShort} tone="gold" />
            <Chip icon="star" label={`${status.xp}/${status.xpTarget}`} tone="ghost" />
          </View>
          <View style={styles.headerButtons}>
            <PressScale
              accessibilityLabel="Raporları aç"
              onPress={() => router.push('/reports' as Href)}
              style={[styles.roundButton, styles.roundButtonActive]}>
              <Ionicons name="bar-chart" size={17} color={palette.tealDark} />
            </PressScale>
            <PressScale
              accessibilityLabel="Bildirimleri aç"
              onPress={() => router.push('/social' as Href)}
              style={[styles.roundButton, styles.roundButtonGhost]}>
              <Ionicons name="notifications-outline" size={17} color={palette.white} />
            </PressScale>
          </View>
        </View>
      </View>
    </View>
  );
}

function EceWelcomeCard() {
  const router = useRouter();
  const status = useGameStatus();
  const width = useWindowDimensions().width;
  const eceWidth = width <= 370 ? 150 : 176;

  const handleAdvice = async () => {
    playLightImpactHaptic();
    router.push('/events' as Href);
  };

  return (
    <AnimatedCard delay={80} style={styles.overlapCardWrap}>
      <View style={[styles.card, styles.eceCard]}>
        <Image source={municipalImage} style={styles.eceBuilding} contentFit="contain" />
        <View style={styles.sparkleA} />
        <Text style={styles.sparkleText}>✦</Text>
        <View style={styles.eceCopy}>
          <Text style={styles.eceTitle} numberOfLines={1}>
            Ece
          </Text>
          <View style={styles.assistantBadge}>
            <Text style={styles.assistantBadgeText} numberOfLines={1}>
              Stajyer Operasyon Asistanı
            </Text>
          </View>
          <Text style={styles.eceLead} numberOfLines={1}>
            Merkeze hoş geldin {status.playerName}!
          </Text>
          <Text style={styles.eceDescription} numberOfLines={2}>
            Bugün birlikte temel akışı öğrenip ilk kararlarını vermeye başlayalım.
          </Text>
          <PressScale
            accessibilityLabel="Kısa öneri al"
            onPress={handleAdvice}
            style={styles.primaryButton}>
            <Ionicons name="sparkles" size={14} color={palette.white} />
            <Text style={styles.primaryButtonText} numberOfLines={1}>
              Kısa Öneri Al
            </Text>
          </PressScale>
        </View>
        <Image
          source={eceImage}
          style={[styles.eceImage, { width: eceWidth }]}
          contentFit="contain"
        />
      </View>
    </AnimatedCard>
  );
}

function LearningProgressCard() {
  const steps = [
    { label: 'Olayı İncele', done: true },
    { label: 'Karar Ver', done: true },
    { label: 'Akışı Takip Et', done: true },
    { label: 'Raporu Oku', done: false },
  ];

  return (
    <AnimatedCard delay={140}>
      <View style={[styles.card, styles.learningCard]}>
        <View style={styles.learningHeader}>
          <Image source={learningImage} style={styles.learningIcon} contentFit="contain" />
          <View style={styles.learningCopy}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Bugünkü Öğrenme Günü
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              İlk gün hedefin: temel müdahaleyi öğrenmek.
            </Text>
          </View>
          <View style={styles.trophyRing}>
            <ProgressRing value={100} size={58} />
            <Ionicons name="trophy" size={16} color={palette.gold} />
          </View>
        </View>
        <View style={styles.timeline}>
          {steps.map((step, index) => (
            <View key={step.label} style={styles.timelineItem}>
              {index > 0 ? <View style={styles.timelineLine} /> : null}
              <View style={[styles.timelineDot, step.done ? styles.timelineDotDone : styles.timelineDotLocked]}>
                <Ionicons
                  name={step.done ? 'checkmark' : 'lock-closed'}
                  size={14}
                  color={step.done ? palette.white : palette.textMuted}
                />
              </View>
              <Text style={styles.timelineLabel} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </AnimatedCard>
  );
}

function DailyGoalPlanGrid() {
  const confirmDailyOperationsPlan = useGameStore((s) => s.confirmDailyOperationsPlan);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const handleConfirm = () => {
    playLightImpactHaptic();
    confirmDailyOperationsPlan();
  };

  return (
    <AnimatedCard delay={260}>
      <View style={styles.focusPanel}>
        <View style={[styles.card, styles.focusCard, styles.goalFocusCard]}>
          <View style={styles.smallCardHeader}>
            <Ionicons name="locate" size={18} color={palette.gold} />
            <Text style={styles.goldTitle} numberOfLines={1}>
              Günlük Hedef
            </Text>
          </View>
          <View style={styles.goalBody}>
            <View style={styles.goalCopy}>
              <Text style={styles.goalTitle} numberOfLines={1}>
                Ekibi yormadan müdahale et
              </Text>
              <Text style={styles.rewardLine} numberOfLines={1}>
                +30 ilerleme  %100
              </Text>
              <View style={styles.goldProgressTrack}>
                <Animated.View style={styles.goldProgressFill} />
              </View>
            </View>
            <ProgressRing value={100} size={52} />
          </View>
        </View>

        <View style={[styles.card, styles.focusCard, styles.planFocusCard]}>
          <View style={styles.smallCardHeader}>
            <Ionicons name="calendar" size={16} color={palette.teal} />
            <Text style={styles.tealTitle} numberOfLines={1}>
              Bugünün Önerilen Planı
            </Text>
          </View>
          <View style={styles.planBody}>
            <View style={styles.planTextCol}>
              <InfoRow label="Mahalle" value="Cumhuriyet" />
              <InfoRow label="Personel" value="Dengeli" />
              <Text style={styles.planDescription} numberOfLines={2}>
                Seçilen plan bugün sinyallere yanıt verebilir; etki gün sonunda izlenir.
              </Text>
            </View>
            <Image source={planImage} style={styles.planArt} contentFit="contain" />
          </View>
          <PressScale
            accessibilityLabel="Planı onayla"
            onPress={handleConfirm}
            disabled={dailyOperationsPlan.confirmedAtDay === currentDay}
            style={styles.planButton}>
            <Text style={styles.planButtonText} numberOfLines={1}>
              Planı Onayla
            </Text>
          </PressScale>
        </View>
      </View>
    </AnimatedCard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function OperationSignalsCompactCard() {
  const operationSignals = useGameStore((s) => s.operationSignals);
  const personnelLabel =
    operationSignals.personnel.status === 'stable' ? 'Dengeli' : 'İzlemede';
  const vehicleLabel =
    operationSignals.vehicles.status === 'stable' ? 'Dengeli' : 'İzlemede';

  return (
    <AnimatedCard delay={260}>
      <View style={[styles.card, styles.signalsCard]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="radio-outline" size={18} color={palette.tealDark} />
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Operasyon Sinyalleri
            </Text>
          </View>
          <Chip label="İzlemede" tone="mint" />
        </View>
        <View style={styles.signalMiniRow}>
          <SignalMiniCard
            image={personnelImage}
            title="Personel"
            chip={personnelLabel}
            body="Bugün personel odağı seçmek yorgunluğu azaltabilir."
          />
          <SignalMiniCard
            image={vehicleImage}
            title="Araç"
            chip={vehicleLabel}
            body="Araç filosu günlük operasyon için hazır görünüyor."
          />
        </View>
      </View>
    </AnimatedCard>
  );
}

function SignalMiniCard({
  image,
  title,
  chip,
  body,
}: {
  image: ImageSource;
  title: string;
  chip: string;
  body: string;
}) {
  return (
    <View style={styles.signalMini}>
      <Image source={image} style={styles.signalIcon} contentFit="contain" />
      <View style={styles.signalTextCol}>
        <View style={styles.signalTitleRow}>
          <Text style={styles.signalTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.signalChip}>
            <Text style={styles.signalChipText} numberOfLines={1}>
              {chip}
            </Text>
          </View>
        </View>
        <Text style={styles.signalBody} numberOfLines={2}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function QuickPreparationStrip() {
  const router = useRouter();
  const items = [
    { title: 'Ekip Yönetimi', day: 'Gün 2', image: teamImage, route: '/events' as Href },
    { title: 'Rota Planlama', day: 'Gün 2', image: routeImage, route: '/map' as Href },
    { title: 'Saha Protokolleri', day: 'Gün 2', image: protocolImage, route: '/events' as Href },
    { title: 'Raporlama', day: 'Gün 2', image: reportImage, route: '/reports' as Href },
  ];

  return (
    <AnimatedCard delay={200}>
      <View style={styles.quickWrap}>
        <View style={styles.quickHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flash" size={18} color={palette.gold} />
            <Text style={styles.quickTitle} numberOfLines={1}>
              Hızlı Hazırlıklar
            </Text>
            <View style={styles.dayChip}>
              <Text style={styles.dayChipText} numberOfLines={1}>
                Gün 2
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/events' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Tüm hazırlıkları gör">
            <Text style={styles.viewAll} numberOfLines={1}>
              Tümünü Gör ›
            </Text>
          </Pressable>
        </View>
        <View style={styles.quickGrid}>
          {items.map((item) => (
            <PressScale
              key={item.title}
              accessibilityLabel={item.title}
              onPress={() => router.push(item.route)}
              style={styles.quickCard}>
              <Image source={item.image} style={styles.quickImage} contentFit="contain" />
              <Text style={styles.quickCardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.quickCardDay} numberOfLines={1}>
                {item.day}
              </Text>
            </PressScale>
          ))}
        </View>
      </View>
    </AnimatedCard>
  );
}

export function HubReferenceHome() {
  return (
    <View style={styles.root}>
      <HeaderBlock />
      <View style={styles.body}>
        <EceWelcomeCard />
        <LearningProgressCard />
        <QuickPreparationStrip />
        <OperationSignalsCompactCard />
        <DailyGoalPlanGrid />
      </View>
    </View>
  );
}

const softShadow = {
  shadowColor: '#2C3D3A',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.09,
  shadowRadius: 12,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.background,
  },
  header: {
    minHeight: 132,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: palette.tealDark,
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.13,
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 57, 54, 0.28)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  avatarButton: {
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 8,
    gap: 5,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 7,
    flexShrink: 0,
    maxWidth: 156,
  },
  resourceChips: {
    flexDirection: 'row',
    gap: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roundButton: {
    width: 39,
    height: 39,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonActive: {
    backgroundColor: '#FFF1B8',
  },
  roundButtonGhost: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 74,
    minWidth: 0,
  },
  chip_mint: {
    backgroundColor: 'rgba(189, 239, 231, 0.55)',
  },
  chip_gold: {
    backgroundColor: 'rgba(242, 212, 121, 0.92)',
  },
  chip_ghost: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '800',
    color: palette.tealDark,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  overlapCardWrap: {
    marginTop: -18,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...softShadow,
  },
  eceCard: {
    minHeight: 204,
    padding: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  eceCopy: {
    width: '58%',
    minWidth: 0,
    zIndex: 2,
    justifyContent: 'center',
    gap: 8,
  },
  eceTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.textDark,
  },
  assistantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(189, 239, 231, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  assistantBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.tealDark,
  },
  eceLead: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.textDark,
  },
  eceDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: palette.textMuted,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: palette.tealDark,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.white,
  },
  eceImage: {
    position: 'absolute',
    right: 0,
    bottom: -4,
    top: 4,
    zIndex: 3,
  },
  eceBuilding: {
    position: 'absolute',
    right: 48,
    bottom: 12,
    width: 142,
    height: 110,
    opacity: 0.62,
  },
  sparkleA: {
    position: 'absolute',
    right: 32,
    top: 32,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(242, 212, 121, 0.72)',
  },
  sparkleText: {
    position: 'absolute',
    right: 104,
    top: 30,
    color: palette.gold,
    opacity: 0.72,
    fontSize: 16,
  },
  learningCard: {
    padding: 14,
    gap: 12,
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  learningIcon: {
    width: 36,
    height: 36,
  },
  learningCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.tealDark,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textMuted,
  },
  trophyRing: {
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  ring: {
    borderWidth: 5,
    borderColor: 'rgba(217,170,43,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringArc: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: palette.gold,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringInner: {
    width: '74%',
    height: '74%',
    borderRadius: 999,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textDark,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: '-50%',
    right: '50%',
    top: 13,
    height: 2,
    backgroundColor: 'rgba(14, 95, 91, 0.28)',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 1,
  },
  timelineDotDone: {
    backgroundColor: palette.tealDark,
    borderColor: palette.tealDark,
  },
  timelineDotLocked: {
    backgroundColor: '#EEF0EA',
    borderColor: 'rgba(20, 70, 66, 0.12)',
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: palette.textMuted,
    textAlign: 'center',
    maxWidth: 76,
  },
  focusPanel: {
    gap: 10,
    minWidth: 0,
  },
  focusCard: {
    padding: 14,
    minWidth: 0,
    gap: 9,
  },
  goalFocusCard: {
    minHeight: 116,
  },
  planFocusCard: {
    minHeight: 154,
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  goldTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.gold,
  },
  tealTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: palette.tealDark,
  },
  goalBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  goalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  goalTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: palette.textDark,
  },
  rewardLine: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.gold,
  },
  goldProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 170, 43, 0.20)',
    overflow: 'hidden',
  },
  goldProgressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.gold,
  },
  planBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  planTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 5,
    minWidth: 0,
  },
  infoLabel: {
    width: 58,
    fontSize: 11,
    fontWeight: '900',
    color: palette.textMuted,
  },
  infoValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: palette.textDark,
  },
  planDescription: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.textMuted,
  },
  planArt: {
    width: 104,
    height: 92,
    marginRight: -4,
    marginTop: -6,
    flexShrink: 0,
  },
  planButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: palette.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    minWidth: 138,
  },
  planButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
  },
  signalsCard: {
    padding: 13,
    gap: 10,
    backgroundColor: '#F5FCF8',
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
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.tealDark,
  },
  signalMiniRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  signalMini: {
    flex: 1,
    minWidth: 0,
    minHeight: 66,
    backgroundColor: palette.white,
    borderRadius: 17,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(20, 70, 66, 0.06)',
  },
  signalIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  signalTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  signalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  signalTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: palette.textDark,
  },
  signalChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(189, 239, 231, 0.62)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 58,
  },
  signalChipText: {
    fontSize: 7,
    fontWeight: '900',
    color: palette.tealDark,
  },
  signalBody: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  quickWrap: {
    borderRadius: 24,
    padding: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    ...softShadow,
    gap: 10,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.textDark,
  },
  dayChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(242, 212, 121, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dayChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9C7A12',
  },
  viewAll: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#F7F3EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    gap: 2,
  },
  quickImage: {
    width: 42,
    height: 38,
  },
  quickCardTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.textDark,
    textAlign: 'center',
  },
  quickCardDay: {
    fontSize: 8,
    fontWeight: '800',
    color: palette.textMuted,
  },
  disabled: {
    opacity: 0.75,
  },
});
