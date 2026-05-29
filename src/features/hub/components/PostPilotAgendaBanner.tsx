import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildPostPilotAgendaLines,
  buildPostPilotAgendaReadyLine,
  derivePostPilotScopeStatuses,
  normalizePostPilotOperationState,
  shouldShowPostPilotAgendaBanner,
} from '@/core/postPilot';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { selectPostPilotOperation, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function PostPilotAgendaBanner() {
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

      const normalized = normalizePostPilotOperationState(postPilotOperation, {
        pilotStatus: pilot.status,
        currentPilotDay: pilot.currentPilotDay,
      });

      const scopes = derivePostPilotScopeStatuses({
        postPilotOperation: normalized,
        pilotStatus: pilot.status,
        authorityState: pilot.authorityState,
      });

      const lines = buildPostPilotAgendaLines(
        normalized,
        { pilotStatus: pilot.status, currentPilotDay: pilot.currentPilotDay },
        pilot.authorityState,
      );

      const agendaReadyLine = buildPostPilotAgendaReadyLine(
        normalized,
        s.gameState.events.length,
      );

      return {
        visible: true as const,
        lines,
        istasyonScope: scopes.istasyon,
        agendaReadyLine,
      };
    }),
  );

  const scopeChipLabel = useMemo(() => {
    if (!banner.visible) return '';
    if (banner.istasyonScope === 'active') return 'Aktif';
    if (banner.istasyonScope === 'agenda') return 'Gündemde';
    return 'Önizleme';
  }, [banner]);

  if (!banner.visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(60).duration(280).springify().damping(22)}
      style={[styles.card, shadows.soft]}>
      <View style={styles.headRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="compass-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.lines.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {banner.lines.subtitle}
          </Text>
        </View>
      </View>

      {banner.agendaReadyLine ? (
        <Text style={styles.agendaReady} numberOfLines={1}>
          {banner.agendaReadyLine}
        </Text>
      ) : null}

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            Hafif operasyon
          </Text>
        </View>
        <View style={[styles.chip, styles.chipScope]}>
          <Text style={styles.chipScopeText} numberOfLines={1}>
            İstasyon · {scopeChipLabel}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/risks')}
        style={styles.mapLink}
        accessibilityRole="button"
        accessibilityLabel="Haritayı incele">
        <Text style={styles.mapLinkText} numberOfLines={1}>
          Haritayı İncele
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </Pressable>
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
  agendaReady: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.1,
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
  },
  chipScope: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(26, 143, 138, 0.2)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  chipScopeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 2,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
