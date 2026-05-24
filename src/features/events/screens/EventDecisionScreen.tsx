import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DecisionOptionCard } from '@/features/events/components/DecisionOptionCard';
import { EventDecisionConsultant } from '@/features/events/components/EventDecisionConsultant';
import { EventDecisionEventCard } from '@/features/events/components/EventDecisionEventCard';
import { EventsStatusHeader } from '@/features/events/components/EventsStatusHeader';
import {
  formatDecisionEffects,
  getEventById,
  mockGameData,
} from '@/core/content/mockGameData';
import { EventDecision } from '@/core/models/EventCard';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventDecisionScreenProps = {
  eventId: string;
};

function applyDecision(eventTitle: string, decision: EventDecision) {
  const message = `${eventTitle}\n\n“${decision.title}”\n\n${formatDecisionEffects(decision.effects)}`;
  Alert.alert('Karar Uygulandı', message, [{ text: 'Tamam' }]);
}

export function EventDecisionScreen({ eventId }: EventDecisionScreenProps) {
  const router = useRouter();
  const event = getEventById(eventId);
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.xl;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!event) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.title}>Olay Bulunamadı</Text>
        <Text style={typography.caption}>
          Bu olay artık aktif değil veya geçersiz bir bağlantı kullanıldı.
        </Text>
      </View>
    );
  }

  const selected = event.decisions.find((d) => d.id === selectedId);

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
            accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Olay Kararı</Text>
            <Text style={styles.screenSub}>Karar ver ve sonucu yönet.</Text>
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
                selected={selectedId === decision.id}
                onSelect={() => setSelectedId(decision.id)}
              />
            ))}
          </View>
        </View>

        <EventDecisionConsultant />

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.askBtn,
              pressed && styles.askPressed,
            ]}
            onPress={() =>
              Alert.alert(
                'Danışmana Sor',
                mockGameData.eventAdvisor.body,
                [{ text: 'Tamam' }],
              )
            }>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.askText}>Danışmana Sor</Text>
          </Pressable>

          <GameButton
            title="Seçeneği Uygula"
            onPress={() => {
              if (selected) applyDecision(event.title, selected);
            }}
            disabled={!selected}
            style={styles.applyBtn}
          />
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
    gap: spacing.md,
    backgroundColor: colors.background,
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
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
  applyBtn: {
    opacity: 1,
  },
});
