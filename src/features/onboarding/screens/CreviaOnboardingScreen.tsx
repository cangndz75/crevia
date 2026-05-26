import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import { ONBOARDING_STEPS } from '@/features/onboarding/data/onboardingData';
import { CreviaLogoHeader } from '@/features/onboarding/components/onboarding/CreviaLogoHeader';
import { OnboardingBackground } from '@/features/onboarding/components/onboarding/OnboardingBackground';
import { PrimaryGameButton } from '@/features/onboarding/components/onboarding/PrimaryGameButton';
import { ProgressDots } from '@/features/onboarding/components/onboarding/ProgressDots';
import { EventsOnboardingPage } from '@/features/onboarding/components/onboarding/steps/EventsOnboardingPage';
import { RegionOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RegionOnboardingPage';
import { RoadmapOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RoadmapOnboardingPage';
import { WelcomeOnboardingPage } from '@/features/onboarding/components/onboarding/steps/WelcomeOnboardingPage';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL = ONBOARDING_STEPS.length;

export type CreviaOnboardingScreenProps = {
  onFinish: (districtId: PilotDistrictId) => void | Promise<void>;
};

export function CreviaOnboardingScreen({ onFinish }: CreviaOnboardingScreenProps) {
  const pagerRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] =
    useState<PilotDistrictId>(DEFAULT_PILOT_DISTRICT_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === TOTAL - 1;

  const scrollToStep = useCallback((index: number) => {
    pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setStepIndex(index);
  }, []);

  const handleFinish = () => {
    // TODO: Navigate to main game dashboard (hub) after onboarding storage + store init.
    void onFinish(selectedRegionId);
  };

  const handlePrimary = () => {
    if (isLast) {
      handleFinish();
      return;
    }
    scrollToStep(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) scrollToStep(stepIndex - 1);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== stepIndex && index >= 0 && index < TOTAL) {
      setStepIndex(index);
    }
  };

  const primaryDisabled = step.id === 'events' && selectedDecisionId == null;
  const primaryLabel = isLast ? 'Oyuna Devam Et' : 'Devam';
  const primaryVariant = isLast ? 'continueGame' : 'default';

  const titleLines = step.titleLines ?? [step.title];

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      <View style={styles.header}>
        <CreviaLogoHeader />
        <Animated.View key={`title-${stepIndex}`} entering={FadeInDown.duration(360)} style={styles.headerText}>
          {titleLines.map((line) => (
            <Text key={line} style={styles.title}>
              {line}
            </Text>
          ))}
          <Text style={styles.body}>{step.body}</Text>
        </Animated.View>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}>
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageScroll}>
            <WelcomeOnboardingPage />
          </ScrollView>
        </View>
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageScroll}>
            <RegionOnboardingPage
              selectedId={selectedRegionId}
              onSelect={setSelectedRegionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageScroll}>
            <EventsOnboardingPage
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={setSelectedDecisionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageScroll}>
            <RoadmapOnboardingPage />
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryGameButton
          title={primaryLabel}
          variant={primaryVariant}
          onPress={handlePrimary}
          disabled={primaryDisabled}
        />
        {stepIndex > 0 ? (
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <ProgressDots current={stepIndex + 1} total={TOTAL} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: onboardingTokens.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
    alignItems: 'center',
  },
  headerText: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: onboardingTokens.textMain,
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  body: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 21,
    color: onboardingTokens.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: spacing.sm,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: 'flex-start',
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  backSpacer: {
    height: 36,
  },
});
