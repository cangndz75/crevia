import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { EndOfDaySystemSummarySection } from '@/features/reports/utils/endOfDayReportPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  sections: EndOfDaySystemSummarySection[];
  compact?: boolean;
};

function SystemSectionRow({
  section,
  compact,
}: {
  section: EndOfDaySystemSummarySection;
  compact?: boolean;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionIconWrap}>
        <Ionicons
          name={section.icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={colors.primary}
        />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {section.title}
        </Text>
        {section.lines.map((line, index) => (
          <Text
            key={`${section.key}-${index}`}
            style={styles.sectionLine}
            numberOfLines={compact ? 1 : 2}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function EndOfDayReportSystemSummaries({ sections, compact }: Props) {
  if (sections.length === 0) return null;

  return (
    <View style={[styles.card, shadows.soft]}>
      <Text style={styles.heading} numberOfLines={1}>
        Sistem Özetleri
      </Text>
      <View style={styles.list}>
        {sections.map((section) => (
          <SystemSectionRow
            key={section.key}
            section={section}
            compact={compact}
          />
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
  heading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  list: {
    gap: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
