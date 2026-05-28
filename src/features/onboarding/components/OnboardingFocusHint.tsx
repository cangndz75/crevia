import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OnboardingHint, OnboardingTone } from '@/core/onboarding/onboardingTypes';
import { mobileSafeLine } from '@/core/onboarding/onboardingPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { OnboardingStepPill } from './OnboardingStepPill';

type OnboardingFocusHintProps = {
  hint: OnboardingHint;
  onDismiss?: () => void;
};

const TONE_ICON: Record<OnboardingTone, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  neutral: 'bulb-outline',
};

export function OnboardingFocusHint({ hint, onDismiss }: OnboardingFocusHintProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.row}>
        <Ionicons
          name={TONE_ICON[hint.tone]}
          size={16}
          color={colors.headerTealDark}
          style={styles.icon}
        />
        <View style={styles.body}>
          {hint.stepPill ? (
            <OnboardingStepPill
              label={hint.stepPill}
              tone={hint.stepPill === 'Yeni' ? 'new' : 'info'}
            />
          ) : null}
          {hint.title ? (
            <Text style={styles.title}>{hint.title}</Text>
          ) : null}
          <Text style={styles.text}>{mobileSafeLine(hint.text, 160)}</Text>
        </View>
        {hint.dismissible && onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="İpucunu kapat">
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F7F3E8',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D4E8E4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.headerTealDark,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
