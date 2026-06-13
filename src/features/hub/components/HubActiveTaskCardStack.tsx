import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  CreviaAnimatedPressable,
  useCenterCtaPulse,
  useCenterProgressHighlight,
} from '@/shared/motion';
import type {
  CenterActiveTarget,
  CenterActiveTargetDomain,
  CenterActiveTargetImpact,
  CenterActiveTargetReward,
} from '@/features/hub/utils/centerActiveTargetPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

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
  amber: '#C78925',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.12)',
  cardBorder: 'rgba(7, 86, 79, 0.32)',
  white: '#FFFFFF',
} as const;

const routeHeroImage = require('@/assets/districts/route/district_route_network_01.png');
const HERO_SLOT_HEIGHT = 132;

type IconName = keyof typeof Ionicons.glyphMap;

const domainIcons: Record<CenterActiveTargetDomain, IconName> = {
  transport: 'bus-outline',
  environment: 'leaf-outline',
  energy: 'flash-outline',
  social: 'happy-outline',
  logistics: 'cube-outline',
  general: 'flag-outline',
};

const rewardToneColors = {
  gold: palette.gold,
  green: palette.green,
  teal: palette.teal,
  purple: '#8747C8',
  neutral: palette.muted,
} as const;

const impactToneColors = {
  positive: palette.green,
  neutral: palette.muted,
  warning: palette.amber,
} as const;

type HubActiveTaskCardStackProps = {
  activeTarget: CenterActiveTarget;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.92 : 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
  };
}

function resolveIcon(iconKey: string, domain: CenterActiveTargetDomain): IconName {
  const known: Record<string, IconName> = {
    'flash-outline': 'flash-outline',
    'gift-outline': 'gift-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'happy-outline': 'happy-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'cube-outline': 'cube-outline',
    'ribbon-outline': 'ribbon-outline',
    'home-outline': 'home-outline',
    'chatbubble-ellipses-outline': 'chatbubble-ellipses-outline',
    'flame-outline': 'flame-outline',
    'pulse-outline': 'pulse-outline',
    'trending-down-outline': 'trending-down-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
  };
  return known[iconKey] ?? domainIcons[domain];
}

function TaskStatusBar({
  progress,
  highlight,
  reducedMotion = false,
}: {
  progress: number;
  highlight?: boolean;
  reducedMotion?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, progress));
  const highlightStyle = useCenterProgressHighlight(Boolean(highlight), reducedMotion);
  return (
    <View style={[styles.statusBar, highlight ? styles.statusBarHighlight : undefined]}>
      <Animated.View
        style={[
          styles.statusBarFill,
          { width: `${ratio * 100}%` },
          highlight ? highlightStyle : undefined,
        ]}
      />
    </View>
  );
}

function RewardCapsule({ reward }: { reward: CenterActiveTargetReward }) {
  const color = rewardToneColors[reward.tone];
  return (
    <View style={styles.rewardCapsule}>
      <Ionicons name={resolveIcon(reward.iconKey, 'general')} size={18} color={color} />
      <Text style={[styles.rewardText, { color }]} numberOfLines={2}>
        {reward.label}
      </Text>
    </View>
  );
}

function ImpactChip({ impact }: { impact: CenterActiveTargetImpact }) {
  const color = impactToneColors[impact.tone];
  return (
    <View style={styles.impactChip}>
      <Ionicons name={resolveIcon(impact.iconKey, 'general')} size={11} color={color} />
      <Text style={styles.impactLabel} numberOfLines={1}>
        {impact.label}
      </Text>
      <Text style={[styles.impactValue, { color }]} numberOfLines={1}>
        {impact.valueText}
      </Text>
    </View>
  );
}

export function HubActiveTaskCardStack({
  activeTarget,
  visibility,
  reducedMotion = false,
}: HubActiveTaskCardStackProps) {
  const router = useRouter();
  const isVisible = (visibility ?? activeTarget.visibility) !== 'hidden';
  const shouldPulseCta =
    Boolean(activeTarget.motionHint?.shouldPulseCta) && activeTarget.cta.enabled;
  const ctaPulseStyle = useCenterCtaPulse(shouldPulseCta, reducedMotion);

  if (!isVisible) {
    return null;
  }

  const handleCtaPress = () => {
    if (!activeTarget.cta.enabled) return;
    playLightImpactHaptic();
    if (activeTarget.cta.route) {
      router.push(activeTarget.cta.route as Href);
    }
  };

  const showProgress = Boolean(activeTarget.progress);
  const statusCompleted = activeTarget.status === 'completed';
  const statusEmpty = activeTarget.status === 'empty';

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[palette.card, palette.cardWarm]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.taskCard,
          activeTarget.motionHint?.shouldPulseCta ? styles.taskCardPulseReady : undefined,
          activeTarget.motionHint?.revealLevel === 'strong'
            ? styles.taskCardRevealStrong
            : undefined,
        ]}
        accessibilityRole="summary"
        accessibilityLabel={activeTarget.accessibilityLabel}>
        <View style={styles.taskHero}>
          <Image
            source={routeHeroImage}
            style={styles.taskHeroImage}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
          />
          <View style={styles.taskLabel}>
            <Ionicons name="star" size={11} color={palette.gold} />
            <Text style={styles.taskLabelText} numberOfLines={1}>
              {activeTarget.categoryLabel?.toUpperCase() ?? 'AKTİF HEDEF'}
            </Text>
          </View>
          {statusCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={palette.green} />
              <Text style={styles.completedBadgeText}>Tamamlandı</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.taskMainRow}>
          <View style={styles.taskCopy}>
            <View style={styles.taskTitleRow}>
              <View style={styles.miniIcon}>
                <Ionicons
                  name={domainIcons[activeTarget.domain]}
                  size={18}
                  color={palette.teal}
                />
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                  {activeTarget.title}
                </Text>
                {activeTarget.subtitle ? (
                  <Text style={styles.taskSubtitle} numberOfLines={1}>
                    {activeTarget.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.taskBody} numberOfLines={2}>
              {activeTarget.description}
            </Text>
          </View>
          {activeTarget.reward ? <RewardCapsule reward={activeTarget.reward} /> : null}
        </View>

        {activeTarget.impactPreview.length > 0 ? (
          <View style={styles.impactRow}>
            {activeTarget.impactPreview.map((impact) => (
              <ImpactChip key={`${impact.id}-${impact.label}`} impact={impact} />
            ))}
          </View>
        ) : null}

        {showProgress && activeTarget.progress ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{activeTarget.progress.label}</Text>
              <Text style={styles.progressValue}>{activeTarget.progress.valueText}</Text>
            </View>
            <TaskStatusBar
              progress={activeTarget.progress.progressRatio}
              highlight={activeTarget.motionHint?.shouldHighlightProgress}
              reducedMotion={reducedMotion}
            />
          </View>
        ) : activeTarget.helperText ? (
          <Text style={styles.helperText} numberOfLines={2}>
            {activeTarget.helperText}
          </Text>
        ) : null}

        <Animated.View style={ctaPulseStyle}>
          <CreviaAnimatedPressable
            onPress={handleCtaPress}
            reducedMotion={reducedMotion}
            pressScale={0.975}
            accessibilityRole="button"
            accessibilityLabel={activeTarget.cta.label}
            accessibilityState={{ disabled: !activeTarget.cta.enabled }}
            disabled={!activeTarget.cta.enabled}
            style={[
              styles.taskCta,
              !activeTarget.cta.enabled ? styles.taskCtaDisabled : undefined,
              statusEmpty ? styles.taskCtaSecondary : undefined,
            ]}>
            <Text
              style={[
                styles.taskCtaText,
                !activeTarget.cta.enabled ? styles.taskCtaTextDisabled : undefined,
              ]}
              numberOfLines={1}>
              {activeTarget.cta.label.toUpperCase()}
            </Text>
            {activeTarget.cta.enabled ? (
              <View style={styles.ctaArrow}>
                <Ionicons name="chevron-forward" size={18} color={palette.tealDark} />
              </View>
            ) : null}
          </CreviaAnimatedPressable>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 2,
  },
  taskCard: {
    borderRadius: 24,
    padding: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
    minHeight: HERO_SLOT_HEIGHT,
  },
  taskCardPulseReady: {
    borderColor: palette.gold,
  },
  taskCardRevealStrong: {
    borderColor: '#C78925',
  },
  taskHero: {
    height: 108,
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
    maxWidth: '72%',
  },
  taskLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  completedBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.green,
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
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
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: palette.text,
  },
  taskSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.teal,
  },
  taskBody: {
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
    textAlign: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(7, 86, 79, 0.06)',
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: '100%',
  },
  impactLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: palette.muted,
    flexShrink: 1,
  },
  impactValue: {
    fontSize: 9,
    fontWeight: '900',
    flexShrink: 1,
  },
  progressBlock: {
    gap: 5,
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
  progressValue: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
    fontVariant: ['tabular-nums'],
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
  statusBarHighlight: {
    borderColor: palette.teal,
  },
  statusBarFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.tealMid,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  taskCta: {
    minHeight: 50,
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
  taskCtaSecondary: {
    backgroundColor: palette.tealSoft,
    borderColor: palette.border,
  },
  taskCtaDisabled: {
    backgroundColor: '#E8EDEB',
    borderColor: palette.border,
  },
  taskCtaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '900',
    color: palette.goldSoft,
    textAlign: 'center',
  },
  taskCtaTextDisabled: {
    color: palette.muted,
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
