import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { cardEntranceEntering } from '@/core/animations/animationEntering';
import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { useShallow } from 'zustand/react/shallow';

import {
  buildPostPilotAgendaBannerModel,
  shouldShowPostPilotAgendaBanner,
} from '@/core/postPilot';
import {
  getIconToneStyle,
  resolveIoniconForRegistryKey,
} from '@/core/presentation/creviaIconPresentation';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { selectPostPilotOperation, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type PostPilotAgendaBannerProps = {
  compact?: boolean;
};

export function PostPilotAgendaBanner({ compact = false }: PostPilotAgendaBannerProps) {
  const router = useRouter();
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);

  const banner = useGameStore(
    useShallow((s) => {
      const pilot = s.gameState.pilot;
      const postPilotOperation = selectPostPilotOperation(s);
      const visible =
        !tutorialActive &&
        shouldShowPostPilotAgendaBanner(pilot.status, postPilotOperation);

      if (!visible) {
        return { visible: false as const };
      }

      const model = buildPostPilotAgendaBannerModel({
        gameState: s.gameState,
        postPilotOperation,
        activeEvents: s.gameState.events,
        featuredEventId: s.gameState.featuredEventId,
      });

      return { visible: true as const, model };
    }),
  );

  if (!banner.visible) {
    return null;
  }

  const { model } = banner;
  const agendaIconTone = getIconToneStyle('teal');

  return (
    <Animated.View
      entering={cardEntranceEntering(60)}
      style={[styles.card, compact && styles.cardCompact, shadows.soft]}>
      <View style={styles.headRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: agendaIconTone.backgroundColor },
          ]}>
          <Ionicons
            name={resolveIoniconForRegistryKey('post_pilot_agenda')}
            size={16}
            color={agendaIconTone.color}
          />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {model.subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {model.chips.map((chip) => (
          <View
            key={chip.id}
            style={[
              styles.chip,
              chip.tone === 'primary' && styles.chipPrimary,
              chip.tone === 'accent' && styles.chipAccent,
            ]}>
            <Text
              style={[
                styles.chipText,
                chip.tone === 'primary' && styles.chipTextPrimary,
                chip.tone === 'accent' && styles.chipTextAccent,
              ]}
              numberOfLines={1}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.ctaRow}>
        {model.primaryCta ? (
          <CreviaAnimatedPressable
            onPress={() => router.push(model.primaryCta!.href as '/')}
            style={styles.primaryCta}
            accessibilityRole="button"
            accessibilityLabel={model.primaryCta.accessibilityLabel}>
            <Text style={styles.primaryCtaText} numberOfLines={1}>
              {model.primaryCta.label}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </CreviaAnimatedPressable>
        ) : null}

        {model.showMapLink ? (
          <Pressable
            onPress={() => router.push(model.secondaryCta.href as '/')}
            style={styles.mapLink}
            accessibilityRole="button"
            accessibilityLabel={model.secondaryCta.accessibilityLabel}>
            <Text style={styles.mapLinkText} numberOfLines={1}>
              {model.secondaryCta.label}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.14)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: spacing.xs,
    borderRadius: radius.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '48%',
    flexShrink: 1,
    minWidth: 0,
  },
  chipPrimary: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(26, 143, 138, 0.2)',
  },
  chipAccent: {
    backgroundColor: 'rgba(26, 143, 138, 0.08)',
    borderColor: 'rgba(26, 143, 138, 0.18)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  chipTextPrimary: {
    color: colors.primary,
  },
  chipTextAccent: {
    color: colors.primary,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexShrink: 1,
    minWidth: 0,
  },
  primaryCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  pressed: {
    opacity: 0.92,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
