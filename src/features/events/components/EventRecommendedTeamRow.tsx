import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { selectRecommendedTeamForEvent } from '@/core/personnel/personnelPresentation';
import type { EventCard } from '@/core/models/EventCard';
import { useGameStore, selectPersonnelState } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventRecommendedTeamRowProps = {
  event: EventCard;
};

export function EventRecommendedTeamRow({ event }: EventRecommendedTeamRowProps) {
  const personnelState = useGameStore(selectPersonnelState);
  const neighborhoods = useGameStore(useShallow((s) => s.neighborhoods));

  const recommendation = useMemo(() => {
    const districtNames = Object.fromEntries(
      neighborhoods.map((n) => [n.id, n.name]),
    );
    return selectRecommendedTeamForEvent(personnelState, event, districtNames);
  }, [event, neighborhoods, personnelState]);

  if (!recommendation) {
    return (
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Bu olay için önerilen ekip</Text>
          <Text style={styles.body}>Bugün sahada uygun ekip yok</Text>
          <Text style={styles.warning}>
            Uyarı: tüm ekipler dinleniyor, saha görevi atanamaz.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="people-outline" size={18} color={colors.secondary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>Bu olay için önerilen ekip</Text>
        <Text style={styles.teamName}>{recommendation.teamName}</Text>
        <Text style={styles.body}>Neden: {recommendation.reason}</Text>
        {recommendation.fatigueWarning ? (
          <Text style={styles.warning}>
            Uyarı: {recommendation.fatigueWarning}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  teamName: {
    ...typography.subtitle,
    fontSize: 15,
  },
  body: {
    ...typography.caption,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  warning: {
    ...typography.caption,
    lineHeight: 18,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 2,
  },
});
