import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import {
  onboardingRadii,
  onboardingTokens,
} from '@/features/onboarding/theme/onboardingTokens';
import type {
  OnboardingContinuationTone,
  OnboardingContinuationViewModel,
  OnboardingImpactTone,
} from '@/features/onboarding/utils/onboardingContinuationTypes';

type CardProps = {
  model: OnboardingContinuationViewModel;
  compact?: boolean;
};

const TONE_STYLE: Record<OnboardingContinuationTone, { bg: string; text: string }> = {
  low: { bg: onboardingTokens.successMuted, text: onboardingTokens.success },
  medium: { bg: onboardingTokens.warningMuted, text: onboardingTokens.orange },
  high: { bg: '#FFE8E4', text: onboardingTokens.red },
  balanced: { bg: onboardingTokens.lavender, text: onboardingTokens.primaryDark },
  watch: { bg: onboardingTokens.warningMuted, text: onboardingTokens.orange },
};

const IMPACT_STYLE: Record<OnboardingImpactTone, { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  positive: { bg: onboardingTokens.successMuted, text: onboardingTokens.success, icon: 'trending-up-outline' },
  balanced: { bg: onboardingTokens.lavender, text: onboardingTokens.primaryDark, icon: 'scale-outline' },
  watch: { bg: onboardingTokens.warningMuted, text: onboardingTokens.orange, icon: 'eye-outline' },
  pressure: { bg: '#FFECE7', text: '#B45C32', icon: 'pulse-outline' },
};

function Shell({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      style={[styles.card, compact && styles.cardCompact]}>
      {children}
    </Animated.View>
  );
}

function MiniInfo({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.miniInfo}>
      <View style={styles.miniIcon}>
        <Ionicons name={icon} size={14} color={onboardingTokens.primary} />
      </View>
      <View style={styles.miniCopy}>
        <Text style={styles.miniLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.miniValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function OnboardingEceBriefingCard({ model, compact = false }: CardProps) {
  return (
    <Shell compact={compact}>
      <View style={styles.advisorRow}>
        <Animated.View entering={ZoomIn.duration(220)} style={styles.avatar}>
          <Ionicons name="person" size={24} color={onboardingTokens.primary} />
        </Animated.View>
        <View style={styles.advisorCopy}>
          <Text style={styles.advisorName} numberOfLines={1}>
            Ece
          </Text>
          <Text style={styles.advisorRole} numberOfLines={1}>
            {model.eceIntro.advisorLabel}
          </Text>
        </View>
        <View style={styles.softChip}>
          <Text style={styles.softChipText} numberOfLines={1}>
            {model.eceIntro.toneChip}
          </Text>
        </View>
      </View>
      <Animated.Text
        entering={FadeInUp.delay(60).duration(240)}
        style={[styles.cardTitle, compact && styles.cardTitleCompact]}
        numberOfLines={2}>
        {model.eceIntro.title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(100).duration(240)}
        style={[styles.body, compact && styles.bodyCompact]}
        numberOfLines={compact ? 3 : 4}>
        {model.eceIntro.body}
      </Animated.Text>
      <View style={styles.miniGrid}>
        <MiniInfo label="İlk saha odağı" value={model.eceIntro.fieldFocus} icon="flag-outline" />
        <MiniInfo label="Karar yaklaşımı" value={model.eceIntro.decisionApproach} icon="git-branch-outline" />
      </View>
    </Shell>
  );
}

export function OnboardingFieldBriefingCard({ model, compact = false }: CardProps) {
  return (
    <Shell compact={compact}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="map-outline" size={18} color={onboardingTokens.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {model.fieldBriefing.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {model.fieldBriefing.districtName}
          </Text>
        </View>
        <View style={styles.softChip}>
          <Text style={styles.softChipText} numberOfLines={1}>
            Pilot başlangıç
          </Text>
        </View>
      </View>
      <Text style={[styles.body, compact && styles.bodyCompact]} numberOfLines={2}>
        {model.fieldBriefing.body}
      </Text>
      <View style={styles.chipRow}>
        {model.fieldBriefing.chips.map((chip, index) => {
          const tone = TONE_STYLE[chip.tone];
          return (
            <Animated.View
              key={chip.label}
              entering={FadeInUp.delay(index * 60).duration(220)}
              style={[styles.metricChip, { backgroundColor: tone.bg }]}>
              <Text style={styles.metricChipLabel} numberOfLines={1}>
                {chip.label}
              </Text>
              <Text style={[styles.metricChipValue, { color: tone.text }]} numberOfLines={1}>
                {chip.value}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.briefingBlocks}>
        <MiniInfo label="Bugün odak" value={model.fieldBriefing.focus} icon="flag-outline" />
        <MiniInfo label="Dikkat" value={model.fieldBriefing.caution} icon="shield-outline" />
      </View>
    </Shell>
  );
}

export function OnboardingFirstImpactCard({ model, compact = false }: CardProps) {
  return (
    <Shell compact={compact}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles-outline" size={18} color={onboardingTokens.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {model.firstImpact.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {model.firstImpact.body}
          </Text>
        </View>
      </View>
      <View style={styles.impactStack}>
        {model.firstImpact.effects.map((effect, index) => {
          const tone = IMPACT_STYLE[effect.tone];
          return (
            <Animated.View
              key={effect.label}
              entering={FadeInUp.delay(index * 70).duration(230)}
              style={styles.impactRow}>
              <View style={[styles.impactIcon, { backgroundColor: tone.bg }]}>
                <Ionicons name={tone.icon} size={16} color={tone.text} />
              </View>
              <View style={styles.impactCopy}>
                <Text style={styles.impactLabel} numberOfLines={1}>
                  {effect.label}
                </Text>
                <Text style={styles.impactBody} numberOfLines={1}>
                  {effect.body}
                </Text>
              </View>
              <View style={[styles.valuePill, { backgroundColor: tone.bg }]}>
                <Text style={[styles.valueText, { color: tone.text }]} numberOfLines={1}>
                  {effect.value}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Shell>
  );
}

export function OnboardingCityReactionCard({ model, compact = false }: CardProps) {
  const pulseColor =
    model.cityReaction.reactionTone === 'watch'
      ? onboardingTokens.orange
      : onboardingTokens.success;

  return (
    <Shell compact={compact}>
      <View style={styles.mapPanel}>
        <LinearGradient
          colors={['#F2FFF9', '#F5F0FF']}
          style={styles.mapSurface}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.pulse, { borderColor: pulseColor }]}>
            <View style={[styles.pulseCore, { backgroundColor: pulseColor }]} />
          </Animated.View>
          <Text style={styles.mapDistrict} numberOfLines={1}>
            {model.cityReaction.districtName}
          </Text>
          <Text style={styles.mapHint} numberOfLines={2}>
            {model.cityReaction.mapHint}
          </Text>
        </LinearGradient>
      </View>
      <Animated.View entering={ZoomIn.delay(80).duration(220)} style={styles.socialBubble}>
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={onboardingTokens.primary} />
        <Text style={styles.socialText} numberOfLines={2}>
          {model.cityReaction.socialBubble}
        </Text>
      </Animated.View>
      <View style={styles.eceLine}>
        <View style={styles.eceMini}>
          <Ionicons name="person" size={12} color={onboardingTokens.primary} />
        </View>
        <Text style={styles.eceLineText} numberOfLines={2}>
          {model.cityReaction.eceLine}
        </Text>
      </View>
    </Shell>
  );
}

export function OnboardingCenterUnlockedCard({ model, compact = false }: CardProps) {
  return (
    <Shell compact={compact}>
      <Animated.View entering={ZoomIn.duration(220)} style={styles.finalIcon}>
        <Ionicons name="checkmark" size={30} color="#FFFFFF" />
      </Animated.View>
      <Text style={[styles.finalTitle, compact && styles.cardTitleCompact]} numberOfLines={1}>
        {model.centerUnlocked.title}
      </Text>
      <Text style={[styles.body, compact && styles.bodyCompact]} numberOfLines={2}>
        {model.centerUnlocked.body}
      </Text>
      <View style={styles.finalLines}>
        {model.centerUnlocked.lines.map((line) => (
          <View key={line} style={styles.finalLine}>
            <Ionicons name="checkmark-circle-outline" size={16} color={onboardingTokens.success} />
            <Text style={styles.finalLineText} numberOfLines={1}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 28,
    padding: 20,
    gap: 14,
    backgroundColor: onboardingTokens.card,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    minWidth: 0,
  },
  cardCompact: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: onboardingTokens.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  advisorCopy: {
    flex: 1,
    minWidth: 0,
  },
  advisorName: {
    fontSize: 17,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  advisorRole: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
  },
  softChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: onboardingTokens.mint,
    flexShrink: 0,
  },
  softChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: onboardingTokens.primaryDark,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: onboardingTokens.textMain,
    flexShrink: 1,
  },
  cardTitleCompact: {
    fontSize: 18,
    lineHeight: 23,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
    flexShrink: 1,
  },
  bodyCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  miniGrid: {
    gap: 8,
  },
  miniInfo: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: onboardingRadii.md,
    backgroundColor: onboardingTokens.cardSoft,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: 10,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.lavender,
    flexShrink: 0,
  },
  miniCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: onboardingTokens.primaryDark,
  },
  miniValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
    flexShrink: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.lavender,
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
    flexShrink: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
  metricChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: onboardingRadii.md,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metricChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  metricChipValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '900',
  },
  briefingBlocks: {
    gap: 8,
  },
  impactStack: {
    gap: 9,
  },
  impactRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: onboardingRadii.lg,
    backgroundColor: onboardingTokens.cardSoft,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: 10,
    minWidth: 0,
  },
  impactIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  impactCopy: {
    flex: 1,
    minWidth: 0,
  },
  impactLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  impactBody: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
  },
  valuePill: {
    maxWidth: 90,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '900',
  },
  mapPanel: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  mapSurface: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pulse: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pulseCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    opacity: 0.72,
  },
  mapDistrict: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  mapHint: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
  },
  socialBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 20,
    backgroundColor: onboardingTokens.lavender,
    padding: 12,
    minWidth: 0,
  },
  socialText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  eceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  eceMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: onboardingTokens.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eceLineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  finalIcon: {
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: onboardingTokens.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalTitle: {
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  finalLines: {
    gap: 8,
  },
  finalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  finalLineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
});
