import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.14)',
  white: '#FFFFFF',
} as const;

const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const greenHeroImage = require('@/assets/districts/status/district_safe_zone_01.png');
const marketHeroImage = require('@/assets/districts/market/district_marketplace_overview_01.png');
const statusBarPrimaryImage = require('@/assets/status_bar_2.png');

type IconName = keyof typeof Ionicons.glyphMap;

type HubActiveTask = {
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
    title: 'Ulaşımı Güçlendirelim!',
    body: 'Toplu taşıma ağını geliştirerek şehirdeki ulaşım memnuniyetini artır.',
    image: routeHeroImage,
    reward: '+%18 Mutluluk',
    progress: '3 / 5',
    progressRatio: 0.6,
    icon: 'bus-outline',
  },
  {
    title: 'Boğaz Parkı Projesi',
    body: 'Sahil hattında yeşil alanı büyüt ve kent yaşam kalitesini yükselt.',
    image: greenHeroImage,
    reward: '+650K Bütçe',
    progress: '2 / 4',
    progressRatio: 0.5,
    icon: 'leaf-outline',
  },
  {
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

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.92 : 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
  };
}

function TaskStatusBar({ progress }: { progress: number }) {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%` as `${number}%`;
  return (
    <View style={styles.statusBar}>
      <Image source={statusBarPrimaryImage} style={styles.statusBarImage} contentFit="fill" />
      <View style={[styles.statusBarFill, { width }]} />
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

function TaskCardFace({ task }: { task: HubActiveTask }) {
  return (
    <>
      <View style={styles.taskLabel}>
        <Ionicons name="star" size={11} color={palette.gold} />
        <Text style={styles.taskLabelText}>AKTİF GÖREV</Text>
      </View>
      <View style={styles.taskHero}>
        <Image source={task.image} style={styles.taskHeroImage} contentFit="cover" transition={200} />
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
          <Ionicons name="happy-outline" size={22} color={palette.green} />
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
}

function StackBackCard({ task, depth }: { task: HubActiveTask; depth: 1 | 2 }) {
  const isNear = depth === 1;
  return (
    <View
      style={[
        styles.stackBackCard,
        isNear ? styles.stackBackNear : styles.stackBackFar,
        { backgroundColor: isNear ? '#F3EBD8' : '#E7EFE9' },
      ]}>
      <View style={[styles.stackBackHero, isNear && styles.stackBackHeroNear]}>
        <Image source={task.image} style={styles.taskHeroImage} contentFit="cover" />
      </View>
    </View>
  );
}

export function HubActiveTaskCardStack() {
  const router = useRouter();
  const reducedMotion = useCreviaReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useSharedValue(0);
  const isTransitioning = useSharedValue(false);

  const tasks = HUB_ACTIVE_TASKS;
  const taskCount = tasks.length;

  const activeTask = tasks[activeIndex]!;
  const backOneTask = tasks[(activeIndex + 1) % taskCount]!;
  const backTwoTask = tasks[(activeIndex + 2) % taskCount]!;

  const completeSwipe = useCallback(() => {
    playLightImpactHaptic();
    setActiveIndex((current) => (current + 1) % taskCount);
    translateX.value = reducedMotion ? 0 : 26;
    if (!reducedMotion) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 240, mass: 0.8 });
    }
    isTransitioning.value = false;
  }, [isTransitioning, reducedMotion, taskCount, translateX]);

  const dismissCard = useCallback(() => {
    if (reducedMotion) {
      completeSwipe();
      return;
    }
    isTransitioning.value = true;
    translateX.value = withTiming(-CARD_EXIT_DISTANCE, { duration: 220 }, (finished) => {
      if (finished) {
        translateX.value = 0;
        runOnJS(completeSwipe)();
      }
    });
  }, [completeSwipe, isTransitioning, reducedMotion, translateX]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-22, 22])
        .onUpdate((event) => {
          if (isTransitioning.value) return;
          const drag = Math.min(0, event.translationX);
          translateX.value = drag;
        })
        .onEnd((event) => {
          if (isTransitioning.value) return;
          if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -700) {
            runOnJS(dismissCard)();
            return;
          }
          translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
        }),
    [dismissCard, isTransitioning, translateX],
  );

  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(translateX.value, [-180, 0], [-7, 0], Extrapolation.CLAMP)}deg`,
      },
    ],
    opacity: interpolate(translateX.value, [-220, -40, 0], [0.35, 0.92, 1], Extrapolation.CLAMP),
  }));

  const backNearStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-160, 0], [0, 12], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(translateX.value, [-160, 0], [1, 0.975], Extrapolation.CLAMP),
      },
    ],
  }));

  const backFarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-160, 0], [4, 24], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(translateX.value, [-160, 0], [0.99, 0.95], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.stackBackLayer, backFarStyle]}>
        <StackBackCard task={backTwoTask} depth={2} />
      </Animated.View>
      <Animated.View style={[styles.stackBackLayer, backNearStyle]}>
        <StackBackCard task={backOneTask} depth={1} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.frontCardLayer, frontCardStyle]}>
          <LinearGradient
            colors={[palette.card, '#FFF8EC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.taskCard}>
            <TaskCardFace task={activeTask} />
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
        </Animated.View>
      </GestureDetector>

      <View style={styles.stackHintRow}>
        <Ionicons name="hand-left-outline" size={13} color={palette.muted} />
        <Text style={styles.stackHint} numberOfLines={1}>
          Kartları kaydırarak diğer görevleri gör
        </Text>
        <Ionicons name="chevron-forward" size={12} color={palette.muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingRight: 18,
    minHeight: 430,
  },
  stackBackLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
  },
  stackBackCard: {
    minHeight: 388,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    shadowColor: '#0B302C',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stackBackNear: {
    marginLeft: 10,
    marginRight: 2,
    marginTop: 8,
  },
  stackBackFar: {
    marginLeft: 18,
    marginRight: 0,
    marginTop: 18,
  },
  stackBackHero: {
    flex: 1,
    minHeight: 388,
    opacity: 0.35,
  },
  stackBackHeroNear: {
    opacity: 0.5,
  },
  frontCardLayer: {
    zIndex: 3,
  },
  taskCard: {
    minHeight: 404,
    borderRadius: 24,
    padding: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(7, 86, 79, 0.22)',
    shadowColor: '#0B302C',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
    backgroundColor: 'rgba(7, 86, 79, 0.9)',
  },
  taskLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: 0.3,
  },
  taskHero: {
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.tealSoft,
  },
  taskHeroImage: {
    width: '100%',
    height: '100%',
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
  miniIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealSoft,
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
    width: 84,
    minHeight: 80,
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
    letterSpacing: 0.4,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
    fontVariant: ['tabular-nums'],
  },
  chestIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4D8',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.35)',
  },
  statusBar: {
    height: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusBarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  statusBarFill: {
    height: 5,
    marginHorizontal: 13,
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
  stackHintRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  stackHint: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
  },
});
