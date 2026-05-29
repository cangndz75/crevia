import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  notes: string[];
  compact?: boolean;
};

export function EndOfDayReportTomorrowNotes({ notes, compact = false }: Props) {
  if (notes.length === 0) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          Yarına Etki Eden Notlar
        </Text>
      </View>
      <View style={styles.list}>
        {notes.map((note, index) => (
          <View key={`${index}-${note.slice(0, 12)}`} style={styles.row}>
            <View style={styles.bullet} />
            <Text style={styles.line} numberOfLines={compact ? 2 : 3}>
              {note}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  line: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
