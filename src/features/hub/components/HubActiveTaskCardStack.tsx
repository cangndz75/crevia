import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  CreviaAnimatedPressable,
  useCenterCtaPulse,
} from '@/shared/motion';
import type {
  CenterActiveTarget,
  CenterActiveTargetDomain,
  CenterActiveTargetImpact,
} from '@/features/hub/utils/centerActiveTargetPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';
import { hubAssets } from '@/features/hub/utils/hubAssets';

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

type IconName = keyof typeof Ionicons.glyphMap;

const domainIcons: Record<CenterActiveTargetDomain, IconName> = {
  transport: 'bus-outline',
  environment: 'leaf-outline',
  energy: 'flash-outline',
  social: 'happy-outline',
  logistics: 'cube-outline',
  general: 'flag-outline',
};

const impactToneColors = {
  positive: palette.goldSoft,
  neutral: 'rgba(255,255,255,0.78)',
  warning: palette.gold,
} as const;

type HubActiveTaskCardStackProps = {
  activeTarget: CenterActiveTarget;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

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

function resolveDisplayCopy(activeTarget: CenterActiveTarget) {
  const isDay1Entry = activeTarget.id === 'day1-entry';
  const isCompleted =
    activeTarget.status === 'completed' || (activeTarget.progress?.progressRatio ?? 0) >= 1;

  if (isDay1Entry && !isCompleted) {
    return {
      badge: 'ANA GÖREV',
      title: 'İlk Operasyonu Planla',
      subtitle: 'Crevia Merkez',
      description: 'Şehrin ihtiyaçlarını analiz et, ilk operasyonunu seç ve uygulamaya koy.',
      rewardLabel: '',
      rewardIcon: 'flash-outline',
    };
  }

  return {
    badge: isDay1Entry ? 'ANA GÖREV' : (activeTarget.categoryLabel?.toUpperCase() ?? 'AKTİF HEDEF'),
    title: activeTarget.title,
    subtitle: activeTarget.subtitle,
    description: activeTarget.description,
    rewardLabel: activeTarget.reward?.valueText ?? activeTarget.reward?.label ?? '',
    rewardIcon: (activeTarget.reward?.iconKey ?? 'flash-outline') as string,
  };
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

  const statusCompleted =
    activeTarget.status === 'completed' || (activeTarget.progress?.progressRatio ?? 0) >= 1;
  const statusEmpty = activeTarget.status === 'empty';
  const display = resolveDisplayCopy(activeTarget);
  const focusDisplay =
    statusCompleted
      ? {
          ...display,
          badge: 'ANA GÖREV',
          title: 'İlk hedef tamamlandı',
          subtitle: 'Merkez akışı açıldı',
          description: 'Merkez akışı açıldı. Şimdi yeni hedefe geçebilirsin.',
          context: 'Bugünkü hedef tamamlandı.',
        }
      : activeTarget.id === 'day1-entry'
      ? {
          ...display,
          badge: 'ANA GÖREV',
          title: 'İlk Operasyonu Planla',
          subtitle: 'Crevia Merkez',
          description:
            'Şehrin ihtiyaçlarını analiz et, ilk operasyonunu seç ve uygulamaya koy.',
          context:
            'Görev zinciri ilerledikçe şehir nabzı ve bölge gelişimi güçlenir.',
        }
      : {
          ...display,
          badge: 'ANA GÖREV',
          title: display.title,
          subtitle: display.subtitle,
          description: display.description,
          context: activeTarget.helperText,
        };
  const ctaLabel = statusCompleted ? 'Sıradaki Hedefe Geç' : 'GÖREVLERİ GÖR';
  const visibleImpacts = activeTarget.impactPreview.slice(0, 3);
  const stageText =
    activeTarget.progress?.valueText?.trim() ||
    (statusCompleted ? '3/3' : activeTarget.status === 'in_progress' ? '2/3' : '1/3');

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[palette.tealDark, palette.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.taskCard,
          statusCompleted ? styles.taskCardCompleted : undefined,
          activeTarget.motionHint?.shouldPulseCta ? styles.taskCardPulseReady : undefined,
          activeTarget.motionHint?.revealLevel === 'strong'
            ? styles.taskCardRevealStrong
            : undefined,
        ]}
        accessibilityRole="summary"
        accessibilityLabel={activeTarget.accessibilityLabel}>
        <Image
          source={hubAssets.day1Plan.heroBuilding}
          style={styles.cardBgImage}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(4,58,54,0.88)', 'rgba(4,58,54,0.62)', 'rgba(4,58,54,0.94)']}
          locations={[0, 0.48, 1]}
          style={styles.cardOverlay}
        />

        <View style={styles.heroTopRow}>
          <View style={styles.taskLabel}>
            <Text style={styles.taskLabelText} numberOfLines={1}>
              {focusDisplay.badge}
            </Text>
          </View>
          <View style={styles.stageBadge}>
            <Text style={styles.stageValue} numberOfLines={1}>
              {stageText}
            </Text>
            <Text style={styles.stageLabel} numberOfLines={1}>
              AŞAMA
            </Text>
          </View>
        </View>

        <View style={[styles.taskCopy, statusCompleted && styles.taskCopyCompleted]}>
          <Text style={styles.taskSubtitle} numberOfLines={1}>
            {focusDisplay.subtitle}
          </Text>
          <Text style={styles.taskTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
            {focusDisplay.title}
          </Text>
          <Text style={styles.taskBody} numberOfLines={3}>
            {focusDisplay.description}
          </Text>
        </View>

        <View style={[styles.heroFooter, statusCompleted && styles.heroFooterCompleted]}>
          <View style={styles.rewardGroup}>
            <Text style={styles.rewardGroupLabel} numberOfLines={1}>
              AŞAMA ÖDÜLLERİ
            </Text>
            <View style={styles.impactRow}>
              {visibleImpacts.length > 0 ? (
                visibleImpacts.map((impact) => (
                  <ImpactChip key={`${impact.id}-${impact.label}`} impact={impact} />
                ))
              ) : (
                <>
                  <View style={styles.impactChip}>
                    <Ionicons name="cash-outline" size={12} color={palette.goldSoft} />
                    <Text style={styles.impactValue} numberOfLines={1}>
                      +3.000
                    </Text>
                  </View>
                  <View style={styles.impactChip}>
                    <Ionicons name="star" size={12} color={palette.goldSoft} />
                    <Text style={styles.impactValue} numberOfLines={1}>
                      +200
                    </Text>
                  </View>
                </>
              )}
              {activeTarget.reward || activeTarget.id === 'day1-entry' ? (
                <View style={styles.impactChip}>
                  <Ionicons
                    name={resolveIcon(focusDisplay.rewardIcon, 'general')}
                    size={12}
                    color={palette.goldSoft}
                  />
                  <Text style={styles.impactValue} numberOfLines={1}>
                    {focusDisplay.rewardLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

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
                {ctaLabel}
              </Text>
              {activeTarget.cta.enabled ? (
                <View style={styles.ctaArrow}>
                  <Ionicons name="chevron-forward" size={16} color={palette.tealDark} />
                </View>
              ) : null}
            </CreviaAnimatedPressable>
          </Animated.View>
        </View>

        {statusCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={palette.green} />
            <Text style={styles.completedBadgeText}>Tamamlandı</Text>
          </View>
        ) : null}

        {(statusCompleted || activeTarget.helperText) && activeTarget.id !== 'day1-entry' ? (
          <Text style={styles.helperText} numberOfLines={1}>
            {statusCompleted ? 'Bugünkü hedef tamamlandı.' : activeTarget.helperText}
          </Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 0,
  },
  taskCard: {
    borderRadius: 24,
    minHeight: 216,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 227, 175, 0.28)',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  taskCardCompleted: {
    minHeight: 168,
    padding: 13,
    gap: 10,
  },
  taskCardPulseReady: {
    borderColor: palette.gold,
  },
  taskCardRevealStrong: {
    borderColor: '#C78925',
  },
  cardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1,
  },
  stageBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 58, 54, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 227, 175, 0.6)',
  },
  stageValue: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  stageLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 1,
  },
  heroFooterCompleted: {
    alignItems: 'center',
  },
  rewardGroup: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  rewardGroupLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.76)',
  },
  briefBadge: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  taskLabel: {
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(7, 86, 79, 0.92)',
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
    right: 13,
    top: 52,
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
  taskCopy: {
    minWidth: 0,
    maxWidth: '72%',
    gap: 6,
    zIndex: 1,
  },
  taskCopyCompleted: {
    maxWidth: '82%',
    gap: 4,
  },
  taskTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  taskSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: palette.goldSoft,
    textTransform: 'uppercase',
  },
  taskBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
  },
  taskContext: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.goldSoft,
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
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: 'rgba(4, 58, 54, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.22)',
    maxWidth: '100%',
  },
  impactLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    flexShrink: 1,
  },
  impactValue: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldSoft,
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
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    zIndex: 1,
  },
  taskCta: {
    minHeight: 38,
    borderRadius: 999,
    paddingLeft: 13,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 227, 175, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 227, 175, 0.48)',
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
    fontSize: 11,
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
