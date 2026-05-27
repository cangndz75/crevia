import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { getDayEvent, getPilotPreset } from '../data/mapSelectors';
import type { PilotAreaId } from '../types/map';

type Props = {
  gameDay: number;
  pilotAreaId: PilotAreaId;
};

export function GameDayBanner({ gameDay, pilotAreaId }: Props) {
  const dayEvent = getDayEvent(pilotAreaId, gameDay);
  const preset = getPilotPreset(pilotAreaId);

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="compass" size={16} color={preset.themeColor} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.theme}>{dayEvent.theme}</Text>
        <Text style={styles.title}>{dayEvent.mainEventTitle}</Text>
        <Text style={styles.desc}>{dayEvent.mainEventDescription}</Text>
        {dayEvent.warningText ? (
          <Text style={styles.warning}>{dayEvent.warningText}</Text>
        ) : null}
      </View>
      <View style={[styles.dayPill, { borderColor: `${preset.themeColor}55` }]}>
        <Text style={[styles.dayText, { color: preset.themeColor }]}>
          Gün {gameDay}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  theme: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  warning: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
    marginTop: 4,
  },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
