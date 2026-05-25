import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { OFFLINE_COPY } from '@/features/onboarding/content/onboardingContent';
import { OnboardingPrimaryButton } from '@/features/onboarding/components/OnboardingPrimaryButton';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type SplashGateScreenProps = {
  mode: 'loading' | 'offline';
  onRetry?: () => void;
  retrying?: boolean;
};

export function SplashGateScreen({
  mode,
  onRetry,
  retrying = false,
}: SplashGateScreenProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (mode === 'loading') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true,
      );
    }
  }, [mode, pulse]);

  const brandStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (mode === 'offline') {
    return (
      <View style={styles.root}>
        <View style={styles.offlineIcon}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.warning} />
        </View>
        <Text style={styles.offlineTitle}>{OFFLINE_COPY.title}</Text>
        <Text style={styles.offlineBody}>{OFFLINE_COPY.body}</Text>
        <OnboardingPrimaryButton
          title={OFFLINE_COPY.retryLabel}
          onPress={() => onRetry?.()}
          disabled={retrying}
          style={styles.retryBtn}
        />
        {retrying ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(500)} style={brandStyle}>
        <Text style={styles.brand}>CREVIA</Text>
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(200).duration(400)} style={styles.tagline}>
        Şehir operasyon merkezi
      </Animated.Text>
      <ActivityIndicator
        color={colors.primary}
        size="large"
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.primary,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  offlineIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  offlineBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  retryBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
