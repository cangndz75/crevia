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
import {
  isOnboardingStarterDecisionId,
  type OnboardingStarterDecisionId,
} from '@/core/onboarding/onboardingStarterDecision';
import { CreviaLogoHeader } from '@/features/onboarding/components/onboarding/CreviaLogoHeader';
import { OnboardingBackground } from '@/features/onboarding/components/onboarding/OnboardingBackground';
import { OnboardingBottomControls } from '@/features/onboarding/components/onboarding/OnboardingBottomControls';
import { EventsOnboardingPage } from '@/features/onboarding/components/onboarding/steps/EventsOnboardingPage';
import { RegionOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RegionOnboardingPage';
import { RoadmapOnboardingPage } from '@/features/onboarding/components/onboarding/steps/RoadmapOnboardingPage';
import { WelcomeOnboardingPage } from '@/features/onboarding/components/onboarding/steps/WelcomeOnboardingPage';
import { ONBOARDING_STEPS } from '@/features/onboarding/data/onboardingData';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { buildRoadmapStepSubtitle } from '@/features/onboarding/utils/onboardingRoadmapPresentation';

const TOTAL = ONBOARDING_STEPS.length;

export type OnboardingFinishPayload = {
  districtId: PilotDistrictId;
  starterDecision: OnboardingStarterDecisionId;
};

export type CreviaOnboardingScreenProps = {
  onFinish: (payload: OnboardingFinishPayload) => void | Promise<void>;
};

export function CreviaOnboardingScreen({ onFinish }: CreviaOnboardingScreenProps) {
  const pagerRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const isCompact = height < 900 || width <= 390;
  const isSmallPhone = width <= 370 || height < 740;
  const horizontalPadding = isSmallPhone ? 18 : 24;
  const titleFont = isCompact ? (stepIndex === 0 ? 22 : 20) : stepIndex === 0 ? 28 : 24;
  const subtitleFont = isCompact ? 12 : 14;
  const ctaHeight = isCompact ? 50 : 58;
  const [selectedRegionId, setSelectedRegionId] =
    useState<PilotDistrictId>(DEFAULT_PILOT_DISTRICT_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState('fast');

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === TOTAL - 1;
  const logoSize = isCompact
    ? stepIndex === 0
      ? 92
      : 64
    : stepIndex === 0
      ? 120
      : 80;

  const scrollToStep = useCallback(
    (index: number) => {
      pagerRef.current?.scrollTo({ x: index * width, animated: true });
      setStepIndex(index);
    },
    [width],
  );

  const handleFinish = () => {
    const starterDecision = isOnboardingStarterDecisionId(selectedDecisionId)
      ? selectedDecisionId
      : 'fast';

    void onFinish({ districtId: selectedRegionId, starterDecision });
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
  const stepBody =
    stepIndex === TOTAL - 1
      ? buildRoadmapStepSubtitle(
          selectedRegionId,
          isOnboardingStarterDecisionId(selectedDecisionId) ? selectedDecisionId : 'fast',
        )
      : step.body;

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      <View
        style={[
          styles.header,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(insets.top, isCompact ? 2 : 6),
          },
        ]}>
        <CreviaLogoHeader compact={stepIndex > 0 || isCompact} size={logoSize} />
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
            numberOfLines={
              isCompact
                ? stepIndex === 0 || stepIndex === TOTAL - 1
                  ? 2
                  : 1
                : 3
            }
            ellipsizeMode="tail">
            {stepBody}
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
            style={styles.pageInnerScroll}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <WelcomeOnboardingPage compact={isCompact} />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            style={styles.pageInnerScroll}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <RegionOnboardingPage
              compact={isCompact}
              selectedId={selectedRegionId}
              onSelect={setSelectedRegionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            style={styles.pageInnerScroll}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <EventsOnboardingPage
              compact={isCompact}
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={setSelectedDecisionId}
            />
          </ScrollView>
        </View>
        <View style={[styles.page, { width }]}>
          <ScrollView
            style={styles.pageInnerScroll}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={[styles.pageScroll, { paddingHorizontal: horizontalPadding }]}>
            <RoadmapOnboardingPage
              compact={isCompact}
              districtId={selectedRegionId}
              decisionId={selectedDecisionId}
            />
          </ScrollView>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, isCompact ? 6 : 10),
            paddingTop: isCompact ? 2 : 4,
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
          compact={isCompact}
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
    gap: 2,
    alignItems: 'center',
    flexShrink: 0,
  },
  headerText: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 0,
    minWidth: 0,
    flexShrink: 0,
  },
  title: {
    fontWeight: '900',
    color: onboardingTokens.textMain,
    textAlign: 'center',
    letterSpacing: 0,
  },
  body: {
    marginTop: 2,
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
  pageInnerScroll: {
    flex: 1,
  },
  pageScroll: {
    flexGrow: 1,
    paddingTop: 2,
    paddingBottom: 12,
  },
  footer: {
    flexShrink: 0,
  },
});
