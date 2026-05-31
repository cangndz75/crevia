import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { buildReportTomorrowNoteFallback } from '@/features/reports/presentation/reportScreenPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  notes: string[];
  compact?: boolean;
};

export function EndOfDayReportTomorrowNotes({ notes, compact: _compact = false }: Props) {
  const primaryNote = notes[0]?.trim() || buildReportTomorrowNoteFallback();

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.iconWrap}>
        <Ionicons name="clipboard-outline" size={18} color={colors.success} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Yarına Etki Eden Notlar
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {primaryNote}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 0,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
