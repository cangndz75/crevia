import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DecisionOptionCard } from '@/features/events/components/DecisionOptionCard';
import { EventDecisionConsultant } from '@/features/events/components/EventDecisionConsultant';
import { EventDecisionEventCard } from '@/features/events/components/EventDecisionEventCard';
import { EventsStatusHeader } from '@/features/events/components/EventsStatusHeader';
import { getDecisionResultMessage } from '@/features/events/utils/decisionPresentation';
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
  const eventAdvisor = useGameStore((s) => s.gameState.eventAdvisor);
  const applyDecisionAction = useGameStore((s) => s.applyDecision);

  const [phase, setPhase] = useState<ScreenPhase>('choose');
  const [resultMessage, setResultMessage] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const goToHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const handleDecision = useCallback(
    (decisionId: string) => {
      if (phase !== 'choose' || applyingId || !event) return;

      const decision = event.decisions.find((d) => d.id === decisionId);
      if (!decision) return;

      setApplyingId(decisionId);
      try {
        applyDecisionAction(eventId, decisionId);
        setResultMessage(getDecisionResultMessage(decision));
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
    [applyDecisionAction, applyingId, event, eventId, goToHub, phase],
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

  if (phase === 'result') {
    return (
      <View style={styles.root}>
        <View style={styles.resultWrap}>
          <View style={styles.resultIcon}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.resultTitle}>Karar Kaydedildi</Text>
          <Text style={styles.resultBody}>{resultMessage}</Text>
          <GameButton
            title="Operasyon Merkezine Dön"
            onPress={goToHub}
            style={styles.resultBtn}
          />
        </View>
      </View>
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

        <EventDecisionEventCard event={event} />

        <View style={styles.decisionsBlock}>
          <View style={styles.sectionHead}>
            <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Bir Karar Ver</Text>
          </View>

          <View style={styles.decisionsList}>
            {event.decisions.map((decision) => (
              <DecisionOptionCard
                key={decision.id}
                decision={decision}
                selected={applyingId === decision.id}
                onSelect={() => handleDecision(decision.id)}
              />
            ))}
          </View>
        </View>

        <EventDecisionConsultant />

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
  resultWrap: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  resultIcon: {
    marginBottom: spacing.sm,
  },
  resultTitle: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
  resultBody: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    color: colors.textPrimary,
  },
  resultBtn: {
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
