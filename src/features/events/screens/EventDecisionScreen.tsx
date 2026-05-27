import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { DecisionOptionCard } from '@/features/events/components/DecisionOptionCard';
import { EventDecisionEventCard } from '@/features/events/components/EventDecisionEventCard';
import { EventDecisionResultPhase } from '@/features/events/components/EventDecisionResultPhase';
import { getDistrictProfileForEvent } from '@/features/events/utils/eventDecisionDistrict';
import { AdvisorHintCard } from '@/ui/components/advisor/AdvisorHintCard';
import { DistrictProfileMiniCard } from '@/ui/components/districts/DistrictProfileMiniCard';
import { EventsStatusHeader } from '@/features/events/components/EventsStatusHeader';
import {
  canCompletePilot,
  PILOT_FINAL_EVENT_ID,
} from '@/core/game/calculatePilotFinalResult';
import {
  checkDecisionAffordability,
  type DecisionAffordabilityCheck,
} from '@/core/economy/economyAffordability';
import type { ApplyDecisionXpResult } from '@/core/xp/applyDecisionXp';
import type { EventDecision } from '@/core/models/EventCard';
import { useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventDecisionScreenProps = {
  eventId: string;
};

type ScreenPhase = 'choose' | 'result';

export function EventDecisionScreen({ eventId }: EventDecisionScreenProps) {
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.xl;

  const event = useGameStore((s) =>
    s.gameState.events.find((e) => e.id === eventId),
  );
  const applyDecisionAction = useGameStore((s) => s.applyDecision);
  const economyState = useGameStore((s) => s.economyState);
  const showPilotReportCta = useGameStore((s) => {
    if (eventId !== PILOT_FINAL_EVENT_ID) {
      return false;
    }
    return (
      canCompletePilot(s.gameState) || s.gameState.pilot.status === 'completed'
    );
  });

  const eventAdvisor = useGameStore((s) => s.gameState.eventAdvisor);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const selectedPilotDistrictId = useGameStore(
    (s) => s.gameState.pilot.selectedDistrictId,
  );

  const [phase, setPhase] = useState<ScreenPhase>('choose');
  const [appliedDecision, setAppliedDecision] = useState<EventDecision | null>(
    null,
  );
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [xpFeedback, setXpFeedback] = useState<ApplyDecisionXpResult | null>(
    null,
  );

  const decisionAffordability = useMemo(() => {
    if (!event) {
      return {};
    }
    return Object.fromEntries(
      event.decisions.map((d) => [
        d.id,
        checkDecisionAffordability({ economyState, decision: d }),
      ]),
    );
  }, [economyState, event]);

  const goToHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const showInsufficientSourceAlert = useCallback(
    (affordability: DecisionAffordabilityCheck) => {
      Alert.alert(
        'Kaynak yetersiz',
        `Bu karar için ${affordability.formattedMissingSource} Kaynak daha gerekiyor.`,
        [{ text: 'Tamam' }],
      );
    },
    [],
  );

  const goToPilotReport = useCallback(() => {
    router.push('/events/pilot-final-report');
  }, [router]);

  const handleDecision = useCallback(
    (decisionId: string) => {
      if (phase !== 'choose' || applyingId || !event) return;

      const decision = event.decisions.find((d) => d.id === decisionId);
      if (!decision) return;

      const affordability = decisionAffordability[decisionId];
      if (affordability && !affordability.canAfford) {
        showInsufficientSourceAlert(affordability);
        return;
      }

      setApplyingId(decisionId);
      try {
        const xpResult = applyDecisionAction(eventId, decisionId);
        if (
          xpResult.success === false &&
          xpResult.reason === 'insufficient_source'
        ) {
          const guardAffordability = checkDecisionAffordability({
            economyState,
            decision,
          });
          showInsufficientSourceAlert(guardAffordability);
          return;
        }
        setXpFeedback(xpResult);
        setAppliedDecision(decision);
        setPhase('result');
      } catch {
        Alert.alert(
          'Karar uygulanamadı',
          'Bu olay artık aktif değil. Operasyon merkezine dönüp güncel listeyi kontrol et.',
          [{ text: 'Tamam', onPress: goToHub }],
        );
      } finally {
        setApplyingId(null);
      }
    },
    [
      applyDecisionAction,
      applyingId,
      decisionAffordability,
      event,
      eventId,
      goToHub,
      phase,
      economyState,
      showInsufficientSourceAlert,
    ],
  );

  if (!event) {
    return (
      <View style={styles.notFound}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="archive-outline" size={40} color={colors.textSecondary} />
        </View>
        <Text style={styles.notFoundTitle}>Bu olay artık aktif değil</Text>
        <Text style={styles.notFoundBody}>
          Bu olay çözümlenmiş veya gün değişmiş olabilir.
        </Text>
        <GameButton
          title="Operasyon Merkezine Dön"
          onPress={goToHub}
          style={styles.notFoundBtn}
        />
      </View>
    );
  }

  const districtProfile = getDistrictProfileForEvent(
    event,
    selectedPilotDistrictId,
  );

  if (phase === 'result' && appliedDecision) {
    return (
      <EventDecisionResultPhase
        decision={appliedDecision}
        event={event}
        eventAdvisor={eventAdvisor}
        xpFeedback={xpFeedback}
        showPilotReportCta={showPilotReportCta}
        bottomPadding={bottomPadding}
        onGoToHub={goToHub}
        onGoToPilotReport={goToPilotReport}
      />
    );
  }

  return (
    <View style={styles.root}>
      <EventsStatusHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
            accessibilityLabel="Geri"
            hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Olay Kararı</Text>
            <Text style={styles.screenSub}>Bir seçenek seç; etkiler hemen uygulanır.</Text>
          </View>
        </View>

        <Animated.View entering={FadeInUp.duration(320).springify().damping(22)}>
          <EventDecisionEventCard event={event} day={currentDay} />
        </Animated.View>

        {districtProfile ? (
          <Animated.View entering={FadeInUp.delay(80).duration(300).springify().damping(22)}>
            <DistrictProfileMiniCard profile={districtProfile} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(140).duration(260)}>
          <AdvisorHintCard />
        </Animated.View>

        <View style={styles.decisionsBlock}>
          <Animated.View
            entering={FadeIn.delay(120).duration(260)}
            style={styles.sectionHead}>
            <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Bir Karar Ver</Text>
          </Animated.View>

          <View style={styles.decisionsList}>
            {event.decisions.map((decision, index) => (
              <Animated.View
                key={decision.id}
                entering={FadeInUp.delay(180 + index * 70).duration(300).springify().damping(20)}>
                <DecisionOptionCard
                  decision={decision}
                  selected={applyingId === decision.id}
                  affordability={decisionAffordability[decision.id]}
                  onSelect={() => handleDecision(decision.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.askBtn, pressed && styles.askPressed]}
            onPress={() =>
              Alert.alert('Danışmana Sor', eventAdvisor.body, [{ text: 'Tamam' }])
            }
            hitSlop={4}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.askText}>Danışmana Sor</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notFoundTitle: {
    ...typography.title,
    textAlign: 'center',
  },
  notFoundBody: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  notFoundBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.85,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    ...typography.title,
    fontSize: 22,
  },
  screenSub: {
    ...typography.caption,
    fontSize: 13,
  },
  decisionsBlock: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  decisionsList: {
    gap: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  askPressed: {
    opacity: 0.9,
  },
  askText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
  },
});
