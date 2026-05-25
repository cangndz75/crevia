import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AdvisorMessageBubble } from '@/features/onboarding/components/AdvisorMessageBubble';
import { BriefingSkyline } from '@/features/onboarding/components/BriefingSkyline';
import { BriefingTopBar } from '@/features/onboarding/components/BriefingTopBar';
import { OnboardingPrimaryButton } from '@/features/onboarding/components/OnboardingPrimaryButton';
import { TutorialDecisionCard } from '@/features/onboarding/components/TutorialDecisionCard';
import {
  TUTORIAL_DECISIONS,
  TUTORIAL_EVENT,
} from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type TutorialScenarioScreenProps = {
  onComplete: () => void;
  onBack?: () => void;
};

export function TutorialScenarioScreen({
  onComplete,
  onBack,
}: TutorialScenarioScreenProps) {
  const [showDecisions, setShowDecisions] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const selected = TUTORIAL_DECISIONS.find((d) => d.id === selectedId);

  const handleApply = () => {
    if (!selected) return;
    setOutcome(selected.outcome);
  };

  return (
    <View style={styles.root}>
      <BriefingSkyline />
      <BriefingTopBar
        onBack={onBack}
        currentStep={4}
        totalSteps={4}
        phaseLabel="Günün Başlangıcı"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="newspaper-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>İlk Sabah Brifingi</Text>
          <Text style={styles.heroSub}>
            İlk operasyon kararını vereceksin. Sonuçlar şehir metriklerini etkiler.
          </Text>
        </Animated.View>

        <AdvisorMessageBubble message={TUTORIAL_EVENT.advisorGreeting} />

        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.eventCard, shadows.card]}>
          <View style={styles.eventHeaderRow}>
            <View style={styles.urgentTag}>
              <Ionicons name="warning" size={14} color={colors.danger} />
              <Text style={styles.urgentText}>ACİL OLAY</Text>
            </View>
            <View style={styles.urgencyBadge}>
              <Ionicons name="time-outline" size={12} color={colors.danger} />
              <Text style={styles.urgencyText}>2 saat</Text>
            </View>
          </View>

          <View style={styles.eventBody}>
            <View style={styles.eventMain}>
              <Text style={styles.eventTitle}>{TUTORIAL_EVENT.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.eventLocation}>{TUTORIAL_EVENT.district}</Text>
              </View>
              <Text style={styles.eventDesc}>{TUTORIAL_EVENT.description}</Text>
            </View>
            <View style={styles.eventThumb}>
              <Ionicons name="trash" size={32} color={colors.success} />
            </View>
          </View>

          <View style={styles.metaGrid}>
            <MetaItem icon="alert-circle" label="Risk" value={TUTORIAL_EVENT.risk} color={colors.warning} />
            <MetaItem icon="eye" label="Görünürlük" value={TUTORIAL_EVENT.visibility} color={colors.danger} />
            <MetaItem icon="repeat" label="Tekrar" value={TUTORIAL_EVENT.repeatRisk} color={colors.purple} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={styles.tipCard}>
          <View style={styles.tipStripe} />
          <View style={styles.tipBody}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={18} color={colors.authority} />
              <Text style={styles.tipLabel}>Danışman İpucu</Text>
            </View>
            <Text style={styles.tipText}>{TUTORIAL_EVENT.advisorNote}</Text>
          </View>
        </Animated.View>

        {!outcome ? (
          <>
            {!showDecisions ? (
              <Animated.View entering={FadeInUp.delay(160).springify()}>
                <OnboardingPrimaryButton
                  title="Karar Seçeneklerini Gör"
                  icon="locate-outline"
                  onPress={() => setShowDecisions(true)}
                />
              </Animated.View>
            ) : (
              <>
                <View style={styles.decisionHeader}>
                  <Text style={styles.decisionTitle}>Kararını ver</Text>
                  <Text style={styles.decisionHint}>bir seçenek seç</Text>
                </View>

                <View style={styles.decisions}>
                  {TUTORIAL_DECISIONS.map((decision, i) => (
                    <Animated.View
                      key={decision.id}
                      entering={FadeInDown.delay(i * 70).springify()}>
                      <TutorialDecisionCard
                        decision={decision}
                        selected={selectedId === decision.id}
                        onPress={() => setSelectedId(decision.id)}
                      />
                    </Animated.View>
                  ))}
                </View>

                <OnboardingPrimaryButton
                  title="Kararı Uygula"
                  onPress={handleApply}
                  disabled={!selected}
                />
              </>
            )}
          </>
        ) : (
          <Animated.View entering={FadeInUp.springify()} style={styles.outcomeSection}>
            <View style={[styles.outcomeCard, shadows.soft]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={styles.outcomeTitle}>Karar Uygulandı</Text>
              <Text style={styles.outcomeBody}>{outcome}</Text>
            </View>

            <AdvisorMessageBubble message={TUTORIAL_EVENT.closingMessage} compact />

            <OnboardingPrimaryButton
              title="Kapat ve Operasyona Başla"
              onPress={onComplete}
            />
          </Animated.View>
        )}

        {onBack && !outcome ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backLink, pressed && styles.backPressed]}>
            <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MetaItem({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.metaItem, { backgroundColor: `${color}12` }]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.metaValue, { color }]}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.secondary}33`,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A2B3C',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.danger,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  eventBody: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  eventMain: {
    flex: 1,
    gap: spacing.xs,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  eventDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  eventThumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.success}40`,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F0FC',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.authority}15`,
  },
  tipStripe: {
    width: 4,
    backgroundColor: colors.authority,
  },
  tipBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.authority,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  decisionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  decisionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  decisions: {
    gap: spacing.md,
  },
  outcomeSection: {
    gap: spacing.xl,
  },
  outcomeCard: {
    alignItems: 'center',
    backgroundColor: colors.successMuted,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
  },
  outcomeBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  backPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
