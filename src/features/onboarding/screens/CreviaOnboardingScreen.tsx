import { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import { CreviaLogoHeader } from '@/features/onboarding/components/onboarding/CreviaLogoHeader';
import { OnboardingBackground } from '@/features/onboarding/components/onboarding/OnboardingBackground';
import { OnboardingBottomControls } from '@/features/onboarding/components/onboarding/OnboardingBottomControls';
import { EventsOnboardingPage } from '@/features/onboarding/components/onboarding/steps/EventsOnboardingPage';
import { RegionOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RegionOnboardingPage';
import { RoadmapOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RoadmapOnboardingPage';
import { WelcomeOnboardingPage } from '@/features/onboarding/components/onboarding/steps/WelcomeOnboardingPage';
import { ONBOARDING_STEPS } from '@/features/onboarding/data/onboardingData';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

const TOTAL = ONBOARDING_STEPS.length;

export type CreviaOnboardingScreenProps = {
  onFinish: (districtId: PilotDistrictId) => void | Promise<void>;
};

export function CreviaOnboardingScreen({ onFinish }: CreviaOnboardingScreenProps) {
  const pagerRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallPhone = width <= 370;
  const horizontalPadding = isSmallPhone ? 20 : 26;
  const titleFont = isSmallPhone ? 28 : 34;
  const subtitleFont = isSmallPhone ? 14 : 16;
  const ctaHeight = isSmallPhone ? 62 : 70;
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] =
    useState<PilotDistrictId>(DEFAULT_PILOT_DISTRICT_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState('fast');

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === TOTAL - 1;
  const logoSize = isSmallPhone
    ? stepIndex === 0
      ? 170
      : 132
    : stepIndex === 0
      ? 210
      : 154;

  const scrollToStep = useCallback(
    (index: number) => {
      pagerRef.current?.scrollTo({ x: index * width, animated: true });
      setStepIndex(index);
    },
    [width],
  );

  const handleFinish = () => {
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
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== stepIndex && index >= 0 && index < TOTAL) {
      setStepIndex(index);
    }
  };

  const titleLines = step.titleLines ?? [step.title];

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <CreviaLogoHeader compact={stepIndex > 0} size={logoSize} />
        <Animated.View
          key={`title-${stepIndex}`}
          entering={FadeInDown.duration(360)}
          style={styles.headerText}>
          {titleLines.map((line) => (
            <Text
              key={line}
              style={[styles.title, { fontSize: titleFont, lineHeight: titleFont + 6 }]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {line}
            </Text>
          ))}
          <Text
            style={[styles.body, { fontSize: subtitleFont, lineHeight: subtitleFont + 7 }]}
            numberOfLines={3}
            ellipsizeMode="tail">
            {step.body}
          </Text>
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
        <View style={[styles.page, { width }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <WelcomeOnboardingPage />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <RegionOnboardingPage
              selectedId={selectedRegionId}
              onSelect={setSelectedRegionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <EventsOnboardingPage
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={setSelectedDecisionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <RoadmapOnboardingPage />
          </ScrollView>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}>
        <OnboardingBottomControls
          activeIndex={stepIndex}
          total={TOTAL}
          primaryLabel={isLast ? 'Oyuna Devam Et' : 'Devam'}
          onPrimaryPress={handlePrimary}
          onBackPress={handleBack}
          showBack={stepIndex > 0}
          isFinal={isLast}
          ctaHeight={ctaHeight}
        />
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
    paddingTop: 4,
    gap: 7,
    alignItems: 'center',
  },
  headerText: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  title: {
    fontWeight: '900',
    color: onboardingTokens.textMain,
    textAlign: 'center',
    letterSpacing: 0,
  },
  body: {
    marginTop: 6,
    color: onboardingTokens.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    minWidth: 0,
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
    paddingTop: 10,
    paddingBottom: 18,
  },
  footer: {
    paddingTop: 6,
  },
});
