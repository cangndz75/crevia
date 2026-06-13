import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
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
import type {
  CenterAdvisorSuggestion,
  CenterAdvisorTone,
} from '@/features/hub/utils/centerAdvisorPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#FFFCF5',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#B85A4B',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.12)',
  white: '#FFFFFF',
} as const;

const toneStyles: Record<
  CenterAdvisorTone,
  { border: string; accent: string; icon: IconName }
> = {
  calm: { border: palette.border, accent: palette.tealMid, icon: 'leaf-outline' },
  positive: { border: 'rgba(62,158,106,0.28)', accent: palette.green, icon: 'checkmark-circle-outline' },
  warning: { border: 'rgba(199,137,37,0.35)', accent: palette.amber, icon: 'alert-circle-outline' },
  urgent: { border: 'rgba(184,90,75,0.35)', accent: palette.red, icon: 'warning-outline' },
  teaching: { border: 'rgba(216,167,46,0.35)', accent: palette.gold, icon: 'school-outline' },
  celebration: { border: 'rgba(62,158,106,0.35)', accent: palette.green, icon: 'sparkles-outline' },
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

  if (!isVisible) {
    return null;
  }

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
        compact ? styles.cardCompact : undefined,
        { borderColor: tone.border },
        advisor.motionHint?.attentionLevel === 'strong' ? styles.cardAttention : undefined,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={advisor.accessibilityLabel}>
      {advisor.shouldShowAvatar ? (
        <Animated.View
          style={[styles.avatarWrap, compact ? styles.avatarWrapCompact : undefined, avatarStyle]}>
          <Image
            source={hubAssets.advisorPortrait}
            style={styles.avatar}
            contentFit="cover"
          />
        </Animated.View>
      ) : (
        <View style={styles.iconWrap}>
          <Ionicons name={tone.icon} size={16} color={tone.accent} />
        </View>
      )}

      <View style={styles.copyBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.advisorName} numberOfLines={1}>
            {advisor.title}
          </Text>
          {!compact ? (
            <View style={[styles.tonePill, { backgroundColor: `${tone.accent}18` }]}>
              <Text style={[styles.tonePillText, { color: tone.accent }]} numberOfLines={1}>
                {advisor.sourceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.contextLine} numberOfLines={compact ? 1 : 2}>
          {advisor.contextLine}
        </Text>

        {!compact ? (
          <Animated.Text style={[styles.recommendation, speechStyle]} numberOfLines={2}>
            {advisor.recommendation}
          </Animated.Text>
        ) : (
          <Text style={styles.recommendationCompact} numberOfLines={1}>
            {advisor.recommendation}
          </Text>
        )}

        {advisor.reason && !compact ? (
          <Text style={styles.reason} numberOfLines={2}>
            {advisor.reason}
          </Text>
        ) : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: palette.card,
    borderWidth: 1,
  },
  cardCompact: {
    paddingVertical: 8,
  },
  cardAttention: {
    borderWidth: 1.5,
  },
  avatarWrap: {
    width: 52,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: palette.goldSoft,
    flexShrink: 0,
  },
  avatarWrapCompact: {
    width: 40,
    height: 46,
    borderRadius: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tealSoft,
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
  advisorName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: palette.teal,
  },
  tonePill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  tonePillText: {
    fontSize: 8,
    fontWeight: '800',
  },
  contextLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.text,
  },
  recommendation: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: palette.text,
  },
  recommendationCompact: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  reason: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: palette.muted,
  },
  caution: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
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
    backgroundColor: palette.tealSoft,
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: '100%',
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.teal,
  },
  primaryActionTextDisabled: {
    color: palette.muted,
  },
  secondaryAction: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    maxWidth: '100%',
  },
  secondaryActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.tealMid,
    textDecorationLine: 'underline',
  },
});
