import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { useCreviaReducedMotion } from '@/shared/motion';

const palette = {
  card: '#FFFCF5',
  cardWarm: '#FFF8EC',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.12)',
  cardBorder: 'rgba(7, 86, 79, 0.32)',
  white: '#FFFFFF',
} as const;

const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const greenHeroImage = require('@/assets/districts/status/district_safe_zone_01.png');
const marketHeroImage = require('@/assets/districts/market/district_marketplace_overview_01.png');
/** Sabit slot: kart içeriği değişse de sayfa yüksekliği oynamaz. */
const STACK_SLOT_HEIGHT = 372;

type IconName = keyof typeof Ionicons.glyphMap;

type HubActiveTask = {
  id: string;
  title: string;
  body: string;
  image: ImageSource;
  reward: string;
  progress: string;
  progressRatio: number;
  icon: IconName;
};

const HUB_ACTIVE_TASKS: HubActiveTask[] = [
  {
    id: 'transport',
    title: 'Ulaşımı Güçlendirelim!',
    body: 'Toplu taşıma ağını geliştirerek şehirdeki ulaşım memnuniyetini artır.',
    image: routeHeroImage,
    reward: '+%18 Mutluluk',
    progress: '3 / 5',
    progressRatio: 0.6,
    icon: 'bus-outline',
  },
  {
    id: 'park',
    title: 'Boğaz Parkı Projesi',
    body: 'Sahil hattında yeşil alanı büyüt ve kent yaşam kalitesini yükselt.',
    image: greenHeroImage,
    reward: '+650K Bütçe',
    progress: '2 / 4',
    progressRatio: 0.5,
    icon: 'leaf-outline',
  },
  {
    id: 'energy',
    title: 'Enerji Verimliliği',
    body: 'Kritik bölgelerde enerji üretimini dengele ve kaynak baskısını azalt.',
    image: marketHeroImage,
    reward: '+12 Enerji',
    progress: '1 / 3',
    progressRatio: 0.34,
    icon: 'flash-outline',
  },
];

const SWIPE_THRESHOLD = 72;
const CARD_EXIT_DISTANCE = 360;

const frontCardShadow = {
  shadowColor: palette.tealDark,
  shadowOpacity: 0.08,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
} as const;

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.92 : 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
  };
}

function TaskStatusBar({ progress }: { progress: number }) {
  const ratio = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.statusBar}>
      <View style={[styles.statusBarFill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

function MiniIcon({ icon }: { icon: IconName }) {
  return (
    <View style={styles.miniIcon}>
      <Ionicons name={icon} size={18} color={palette.teal} />
    </View>
  );
}

const TaskCardFace = memo(function TaskCardFace({ task }: { task: HubActiveTask }) {
  return (
    <>
      <View style={styles.taskHero}>
        <Image
          source={task.image}
          style={styles.taskHeroImage}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
        <View style={styles.taskLabel}>
          <Ionicons name="star" size={11} color={palette.gold} />
          <Text style={styles.taskLabelText}>AKTİF GÖREV</Text>
        </View>
      </View>
      <View style={styles.taskMainRow}>
        <View style={styles.taskCopy}>
          <View style={styles.taskTitleRow}>
            <MiniIcon icon={task.icon} />
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
          <View style={styles.progressMeta}>
            <Text style={styles.progressValue}>{task.progress}</Text>
            <View style={styles.chestIcon}>
              <Ionicons name="gift-outline" size={16} color={palette.gold} />
            </View>
          </View>
        </View>
        <TaskStatusBar progress={task.progressRatio} />
      </View>
    </>
  );
});

function TaskCtaButton({ onPress }: { onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Göreve devam et"
        style={({ pressed }) => [styles.taskCta, pressedScale(pressed)]}>
        <Text style={styles.taskCtaText}>GÖREVE DEVAM ET</Text>
        <View style={styles.ctaArrow}>
          <Ionicons name="chevron-forward" size={18} color={palette.tealDark} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.taskCta} pointerEvents="none">
      <Text style={styles.taskCtaText}>GÖREVE DEVAM ET</Text>
      <View style={styles.ctaArrow}>
        <Ionicons name="chevron-forward" size={18} color={palette.tealDark} />
      </View>
    </View>
  );
}

const FrontTaskCard = memo(function FrontTaskCard({
  task,
  onCtaPress,
}: {
  task: HubActiveTask;
  onCtaPress: () => void;
}) {
  return (
    <LinearGradient
      colors={[palette.card, palette.cardWarm]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.taskCard, styles.taskCardFront]}>
      <TaskCardFace task={task} />
      <TaskCtaButton onPress={onCtaPress} />
    </LinearGradient>
  );
});

/** Arka kartlar: sadece çerçeve + hero; LinearGradient/gölge yok → daha akıcı. */
const StackBackPeek = memo(function StackBackPeek({ task }: { task: HubActiveTask }) {
  return (
    <View style={styles.backPeekCard}>
      <View style={styles.taskHero}>
        <Image source={task.image} style={styles.taskHeroImage} contentFit="cover" transition={0} />
        <View style={styles.taskLabel}>
          <Ionicons name="star" size={11} color={palette.gold} />
          <Text style={styles.taskLabelText}>AKTİF GÖREV</Text>
        </View>
      </View>
      <View style={styles.backPeekBody} />
      <View style={styles.backPeekCta} />
    </View>
  );
});

export function HubActiveTaskCardStack() {
  const router = useRouter();
  const reducedMotion = useCreviaReducedMotion();
  const [deckIndex, setDeckIndex] = useState(0);
  const translateX = useSharedValue(0);
  const isTransitioning = useSharedValue(false);

  const tasks = HUB_ACTIVE_TASKS;
  const taskCount = tasks.length;

  const frontTask = tasks[deckIndex % taskCount]!;
  const nearTask = tasks[(deckIndex + 1) % taskCount]!;
  const farTask = tasks[(deckIndex + 2) % taskCount]!;

  const openTask = useCallback(() => {
    playLightImpactHaptic();
    router.push('/events' as Href);
  }, [router]);

  const advanceDeck = useCallback(() => {
    setDeckIndex((current) => (current + 1) % taskCount);
    isTransitioning.value = false;
  }, [isTransitioning, taskCount]);

  const dismissCard = useCallback(() => {
    playLightImpactHaptic();

    if (reducedMotion) {
      advanceDeck();
      return;
    }

    isTransitioning.value = true;
    translateX.value = withTiming(-CARD_EXIT_DISTANCE, { duration: 180 }, (finished) => {
      if (finished) {
        translateX.value = 0;
        runOnJS(advanceDeck)();
      }
    });
  }, [advanceDeck, isTransitioning, reducedMotion, translateX]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-22, 22])
        .onUpdate((event) => {
          if (isTransitioning.value) return;
          translateX.value = Math.min(0, event.translationX);
        })
        .onEnd((event) => {
          if (isTransitioning.value) return;
          if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -700) {
            runOnJS(dismissCard)();
            return;
          }
          translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        }),
    [dismissCard, isTransitioning, translateX],
  );

  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(translateX.value, [-180, 0], [-3, 0], Extrapolation.CLAMP)}deg`,
      },
    ],
    opacity: interpolate(translateX.value, [-300, -60, 0], [0, 1, 1], Extrapolation.CLAMP),
  }));

  const backNearStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-160, 0], [0, 14], Extrapolation.CLAMP),
      },
      {
        rotate: `${interpolate(translateX.value, [-160, 0], [0, 2.4], Extrapolation.CLAMP)}deg`,
      },
      {
        scale: interpolate(translateX.value, [-160, 0], [1, 0.976], Extrapolation.CLAMP),
      },
    ],
  }));

  const backFarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-160, 0], [10, 26], Extrapolation.CLAMP),
      },
      {
        rotate: `${interpolate(translateX.value, [-160, 0], [1.2, 4], Extrapolation.CLAMP)}deg`,
      },
      {
        scale: interpolate(translateX.value, [-160, 0], [0.99, 0.952], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.stackSlot}>
        <Animated.View
          style={[styles.stackLayer, styles.stackFarLayer, backFarStyle]}
          pointerEvents="none">
          <StackBackPeek task={farTask} />
        </Animated.View>
        <Animated.View
          style={[styles.stackLayer, styles.stackNearLayer, backNearStyle]}
          pointerEvents="none">
          <StackBackPeek task={nearTask} />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.stackLayer, styles.stackFrontLayer, frontCardStyle]}>
            <FrontTaskCard task={frontTask} onCtaPress={openTask} />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.stackHintRow}>
        <Ionicons name="hand-left-outline" size={13} color={palette.muted} />
        <Text style={styles.stackHint} numberOfLines={1}>
          Kartları kaydırarak diğer görevleri gör
        </Text>
        <Ionicons name="chevron-forward" size={12} color={palette.muted} />
        <Ionicons name="chevron-forward" size={12} color={palette.muted} style={styles.stackHintChevron} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingRight: 22,
    paddingBottom: 2,
  },
  stackSlot: {
    height: STACK_SLOT_HEIGHT,
    position: 'relative',
  },
  stackLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: STACK_SLOT_HEIGHT,
  },
  stackFarLayer: {
    zIndex: 1,
  },
  stackNearLayer: {
    zIndex: 2,
  },
  stackFrontLayer: {
    zIndex: 3,
  },
  taskCard: {
    height: STACK_SLOT_HEIGHT,
    borderRadius: 24,
    padding: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
  },
  taskCardFront: {
    ...frontCardShadow,
  },
  backPeekCard: {
    height: STACK_SLOT_HEIGHT,
    borderRadius: 24,
    padding: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    overflow: 'hidden',
  },
  backPeekBody: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: palette.cardWarm,
  },
  backPeekCta: {
    height: 50,
    borderRadius: 16,
    backgroundColor: palette.teal,
    opacity: 0.22,
  },
  taskHero: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
    position: 'relative',
    flexShrink: 0,
  },
  taskHeroImage: {
    width: '100%',
    height: '100%',
  },
  taskLabel: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(7, 86, 79, 0.9)',
  },
  taskLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: 0.3,
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
    minHeight: 76,
  },
  taskCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 6,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealSoft,
    flexShrink: 0,
    marginTop: 1,
  },
  taskTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
    color: palette.text,
  },
  taskBody: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: palette.muted,
  },
  rewardCapsule: {
    width: 78,
    alignSelf: 'flex-start',
    flexShrink: 0,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 3,
    backgroundColor: palette.tealSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rewardText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: palette.teal,
    textAlign: 'center',
  },
  progressBlock: {
    gap: 5,
    minWidth: 0,
    minHeight: 34,
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
    letterSpacing: 0.4,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
    fontVariant: ['tabular-nums'],
  },
  chestIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4D8',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.28)',
  },
  statusBar: {
    height: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C9A227',
    backgroundColor: '#DDE8E4',
    paddingHorizontal: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusBarFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  taskCta: {
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.teal,
    borderWidth: 1,
    borderColor: palette.gold,
    flexShrink: 0,
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
  stackHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  stackHint: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: palette.muted,
  },
  stackHintChevron: {
    marginLeft: -3,
  },
});
