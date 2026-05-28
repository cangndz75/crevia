import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlanOptionVisualBlock } from '@/features/events/components/event-workflow/plan/PlanOptionVisual';
import { PLAN_OPTION_VISUALS } from '@/features/events/components/event-workflow/plan/planOptionVisuals';
import type {
  PlanOption,
  PlanOptionId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanOptionPickerProps = {
  options: PlanOption[];
  selectedId: PlanOptionId;
  onSelect: (id: PlanOptionId) => void;
};

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={styles.statChipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PlanOptionCard({
  option,
  selected,
  onPress,
}: {
  option: PlanOption;
  selected: boolean;
  onPress: () => void;
}) {
  const visual = PLAN_OPTION_VISUALS[option.id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        selected ? styles.cardSelected : styles.cardDefault,
        selected && { borderColor: visual.iconColor },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.cardInner}>
        <PlanOptionVisualBlock planId={option.id} selected={selected} visual={visual} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {option.title}
            </Text>
            {selected ? (
              <View style={[styles.checkBadge, { backgroundColor: visual.iconColor }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.radio} />
            )}
          </View>

          <Text style={styles.tagline} numberOfLines={1}>
            {visual.tagline}
          </Text>

          <View style={styles.chipRow}>
            <StatChip label="Süre" value={option.durationLabel} />
            <StatChip label="Başarı" value={option.successLabel} />
          </View>

          <View style={styles.footerRow}>
            <View style={styles.costPill}>
              <Text style={styles.costPillText} numberOfLines={1}>
                {option.costNote}
              </Text>
            </View>
            {option.extraNote ? (
              <Text style={styles.extraNote} numberOfLines={1}>
                {option.extraNote}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PlanOptionPicker({
  options,
  selectedId,
  onSelect,
}: PlanOptionPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plan Seçenekleri</Text>
        <Text style={styles.sectionHint}>Birini seç, detaylar güncellenir</Text>
      </View>
      <View style={styles.list}>
        {options.map((option) => (
          <PlanOptionCard
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 10,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.1,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '500',
    color: eventDetail.textMuted,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: eventDetail.card,
    borderColor: 'rgba(6, 63, 59, 0.07)',
  },
  cardSelected: {
    backgroundColor: eventDetail.mintSoft,
    borderColor: eventDetail.teal,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    paddingRight: 14,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    color: eventDetail.textMuted,
    marginTop: -2,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(107, 125, 120, 0.4)',
    backgroundColor: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.05)',
    minWidth: 72,
  },
  statChipLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: eventDetail.textMuted,
    marginBottom: 1,
  },
  statChipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  costPill: {
    backgroundColor: eventDetail.mint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '55%',
  },
  costPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  extraNote: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
});
