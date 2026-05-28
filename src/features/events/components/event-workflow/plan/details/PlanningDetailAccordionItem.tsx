import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlanningDetailExpandedBody } from '@/features/events/components/event-workflow/plan/details/PlanningDetailExpandedBody';
import {
  PLANNING_DETAIL_ACCENT,
  type PlanningDetailSectionModel,
} from '@/features/events/utils/eventWorkflowPlanDetails';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanningDetailAccordionItemProps = {
  section: PlanningDetailSectionModel;
  expanded: boolean;
  onPress: () => void;
};

export function PlanningDetailAccordionItem({
  section,
  expanded,
  onPress,
}: PlanningDetailAccordionItemProps) {
  const accent = PLANNING_DETAIL_ACCENT[section.accentTone];

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        expanded ? styles.cardOpen : styles.cardClosed,
        expanded && {
          borderColor: accent.openBorder,
          backgroundColor: accent.openGlow,
        },
      ]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.headerPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={section.title}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: accent.iconBg }]}>
            <Ionicons name={section.icon} size={18} color={accent.iconColor} />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {section.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={expanded ? 2 : 1}>
              {section.subtitle}
            </Text>
            {!expanded && section.summaryChips?.length ? (
              <View style={styles.chipRow}>
                {section.summaryChips.slice(0, 2).map((chip) => (
                  <View key={chip} style={styles.miniChip}>
                    <Text style={styles.miniChipText} numberOfLines={1}>
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={eventDetail.teal}
            style={styles.chevron}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <PlanningDetailExpandedBody content={section.expanded} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
  },
  cardClosed: {
    backgroundColor: eventDetail.card,
    borderColor: 'rgba(6, 63, 59, 0.07)',
  },
  cardOpen: {
    shadowColor: eventDetail.tealDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  pressed: {
    opacity: 0.94,
  },
  headerPressable: {
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  miniChip: {
    backgroundColor: eventDetail.mintSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '48%',
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  chevron: {
    marginTop: 10,
  },
  body: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.08)',
  },
});
