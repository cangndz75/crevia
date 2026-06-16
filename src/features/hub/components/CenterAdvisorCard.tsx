import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  CreviaAnimatedPressable,
  useCenterAvatarAttention,
  useCenterSpeechReveal,
} from '@/shared/motion';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { sanitizeCenterDisplayText } from '@/features/hub/utils/centerStatePolicy';
import type {
  CenterAdvisorSuggestion,
  CenterAdvisorTone,
} from '@/features/hub/utils/centerAdvisorPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  teal: '#07564F',
  tealDeep: '#043A36',
  tealPanel: '#0A514B',
  tealInk: '#EAF7F2',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#62C487',
  amber: '#E2A83A',
  red: '#D77764',
  mutedOnDark: 'rgba(234,247,242,0.72)',
  border: 'rgba(245,227,175,0.22)',
  white: '#FFFFFF',
} as const;

const toneStyles: Record<
  CenterAdvisorTone,
  { border: string; accent: string; icon: IconName; label: string }
> = {
  calm: { border: palette.border, accent: palette.goldSoft, icon: 'leaf-outline', label: 'Sinyal' },
  positive: {
    border: 'rgba(98,196,135,0.34)',
    accent: palette.green,
    icon: 'checkmark-circle-outline',
    label: 'Tamamlanan hedef',
  },
  warning: {
    border: 'rgba(226,168,58,0.42)',
    accent: palette.amber,
    icon: 'alert-circle-outline',
    label: 'Dikkat',
  },
  urgent: {
    border: 'rgba(215,119,100,0.42)',
    accent: palette.red,
    icon: 'warning-outline',
    label: 'Risk',
  },
  teaching: {
    border: 'rgba(245,227,175,0.34)',
    accent: palette.goldSoft,
    icon: 'school-outline',
    label: 'Fırsat',
  },
  celebration: {
    border: 'rgba(98,196,135,0.34)',
    accent: palette.green,
    icon: 'sparkles-outline',
    label: 'Sonuç',
  },
};

type CenterAdvisorCardProps = {
  advisor: CenterAdvisorSuggestion;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.92 : 1,
    transform: [{ scale: pressed ? 0.99 : 1 }],
  };
}

export function CenterAdvisorCard({
  advisor,
  visibility,
  reducedMotion = false,
}: CenterAdvisorCardProps) {
  const router = useRouter();
  const isVisible = (visibility ?? advisor.visibility) !== 'hidden';
  const compact = advisor.compactMode;
  const speechStyle = useCenterSpeechReveal(
    advisor.motionHint?.shouldRevealSpeech ?? false,
    reducedMotion,
  );
  const avatarStyle = useCenterAvatarAttention(
    advisor.motionHint?.attentionLevel ?? 'none',
    reducedMotion,
    compact,
  );

  if (!isVisible) return null;

  const tone = toneStyles[advisor.tone];
  const primaryAction = advisor.action;
  const secondaryAction = advisor.secondaryAction;

  const handleAction = (route?: string, enabled = true) => {
    if (!enabled || !route) return;
    playLightImpactHaptic();
    router.push(route as Href);
  };

  return (
    <View
      style={[
        styles.card,
        { borderColor: tone.border },
        advisor.motionHint?.attentionLevel === 'strong' ? styles.cardAttention : undefined,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={advisor.accessibilityLabel}>
      <LinearGradient
        colors={[palette.tealPanel, palette.tealDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}>
        <View style={styles.innerGlow} />

        {advisor.shouldShowAvatar ? (
          <Animated.View
            style={[styles.avatarWrap, compact ? styles.avatarWrapCompact : undefined, avatarStyle]}>
            <Image source={hubAssets.advisorPortrait} style={styles.avatar} contentFit="cover" />
          </Animated.View>
        ) : (
          <View style={styles.iconWrap}>
            <Ionicons name={tone.icon} size={16} color={tone.accent} />
          </View>
        )}

        <View style={styles.copyBlock}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.sectionLabel} numberOfLines={1}>
                {"ECE'NİN ÖNERİSİ"}
              </Text>
              <Text style={styles.advisorName} numberOfLines={1}>
                {advisor.title}
              </Text>
            </View>
            <View style={[styles.tonePill, { backgroundColor: `${tone.accent}24` }]}>
              <Text style={[styles.tonePillText, { color: tone.accent }]} numberOfLines={1}>
                {tone.label}
              </Text>
            </View>
          </View>

          <Text style={styles.contextLine} numberOfLines={compact ? 1 : 2}>
            {sanitizeCenterDisplayText(advisor.contextLine, 'Bugünkü akışa odaklan.')}
          </Text>

          {!compact ? (
            <Animated.Text style={[styles.recommendation, speechStyle]} numberOfLines={2}>
              {sanitizeCenterDisplayText(advisor.recommendation, 'Önce aktif hedefi incele.')}
            </Animated.Text>
          ) : (
            <Text style={styles.recommendationCompact} numberOfLines={1}>
              {sanitizeCenterDisplayText(advisor.recommendation, 'Önce aktif hedefi incele.')}
            </Text>
          )}

          {advisor.caution ? (
            <Text style={[styles.caution, { color: tone.accent }]} numberOfLines={2}>
              {advisor.caution}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            {primaryAction ? (
              <CreviaAnimatedPressable
                onPress={() => handleAction(primaryAction.route, primaryAction.enabled)}
                reducedMotion={reducedMotion}
                pressScale={0.975}
                accessibilityRole="button"
                accessibilityLabel={primaryAction.label}
                accessibilityState={{ disabled: !primaryAction.enabled }}
                disabled={!primaryAction.enabled}
                style={[
                  styles.primaryAction,
                  !primaryAction.enabled ? styles.primaryActionDisabled : undefined,
                ]}>
                <Text
                  style={[
                    styles.primaryActionText,
                    !primaryAction.enabled ? styles.primaryActionTextDisabled : undefined,
                  ]}
                  numberOfLines={1}>
                  {primaryAction.label}
                </Text>
                {primaryAction.enabled ? (
                  <Ionicons name="chevron-forward" size={12} color={palette.teal} />
                ) : null}
              </CreviaAnimatedPressable>
            ) : null}

            {secondaryAction ? (
              <Pressable
                onPress={() => handleAction(secondaryAction.route, secondaryAction.enabled)}
                accessibilityRole="button"
                accessibilityLabel={secondaryAction.label}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed ? pressedScale(pressed) : undefined,
                ]}>
                <Text style={styles.secondaryActionText} numberOfLines={1}>
                  {secondaryAction.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: palette.tealDeep,
  },
  cardAttention: {
    borderWidth: 1.5,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minWidth: 0,
  },
  innerGlow: {
    position: 'absolute',
    top: -24,
    right: 8,
    width: 132,
    height: 88,
    borderRadius: 999,
    backgroundColor: 'rgba(245,227,175,0.12)',
  },
  avatarWrap: {
    width: 52,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.38)',
    flexShrink: 0,
  },
  avatarWrapCompact: {
    width: 42,
    height: 48,
    borderRadius: 14,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
    marginTop: 2,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minWidth: 0,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    color: 'rgba(245,227,175,0.88)',
  },
  advisorName: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.tealInk,
  },
  tonePill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 112,
    flexShrink: 0,
  },
  tonePillText: {
    fontSize: 8,
    fontWeight: '900',
  },
  contextLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.tealInk,
  },
  recommendation: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: palette.mutedOnDark,
  },
  recommendationCompact: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.mutedOnDark,
  },
  caution: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  primaryAction: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: palette.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.5)',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.teal,
  },
  primaryActionTextDisabled: {
    color: 'rgba(7,86,79,0.62)',
  },
  secondaryAction: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    maxWidth: '100%',
  },
  secondaryActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.goldSoft,
    textDecorationLine: 'underline',
  },
});
