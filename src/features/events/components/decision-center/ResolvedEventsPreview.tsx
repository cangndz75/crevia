import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DecisionRecord } from '@/core/models/DecisionRecord';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const MAX_VISIBLE = 3;

type ResolvedEventsPreviewProps = {
  records: DecisionRecord[];
};

export function ResolvedEventsPreview({ records }: ResolvedEventsPreviewProps) {
  if (records.length === 0) {
    return null;
  }

  const visible = [...records].reverse().slice(0, MAX_VISIBLE);
  const hasMore = records.length > MAX_VISIBLE;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={typography.subtitle}>Çözülenler</Text>
        <Text style={styles.subtitle}>Bugün tamamlanan kararlar</Text>
      </View>
      <View style={styles.list}>
        {visible.map((record) => (
          <View key={record.id} style={styles.row}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {record.eventTitle}
              </Text>
              <Text style={styles.decision} numberOfLines={1}>
                {record.decisionLabel}
              </Text>
            </View>
            <View style={styles.doneBadge}>
              <Text style={styles.doneText}>Tamam</Text>
            </View>
          </View>
        ))}
      </View>
      {hasMore ? (
        <Pressable
          onPress={() => {
            // TODO: tüm çözülenler geçmişi
          }}
          style={styles.moreBtn}>
          <Text style={styles.moreText}>Tümünü Gör</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    opacity: 0.92,
  },
  header: {
    gap: 2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.success}33`,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  decision: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  doneBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  doneText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  moreBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
