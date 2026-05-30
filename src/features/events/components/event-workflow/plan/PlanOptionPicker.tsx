import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  getPlanDisplayToneStyle,
  type PlanDisplayOption,
} from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

const SELECTED_BORDER = '#006B63';

type PlanOptionPickerProps = {
  options: PlanDisplayOption[];
  selectedId: PlanOptionId;
  onSelect: (id: PlanOptionId) => void;
};

function PlanOptionCard({
  option,
  selected,
  onPress,
}: {
  option: PlanDisplayOption;
  selected: boolean;
  onPress: () => void;
}) {
  const tone = getPlanDisplayToneStyle(option.tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        selected ? styles.cardSelected : styles.cardDefault,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      {selected ? (
        <View style={styles.selectedCheck}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: tone.iconCircle }]}>
          <Ionicons name={option.iconName} size={24} color={tone.iconColor} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {option.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {option.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>
              {option.durationLabel}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {option.successLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.effectPill, { backgroundColor: tone.pillBg }]}>
          <Text style={[styles.effectPillText, { color: tone.pillText }]} numberOfLines={2}>
            {option.effectLabel}
          </Text>
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
        <Ionicons name="sparkles" size={18} color={eventDetail.teal} />
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Plan Seçenekleri
          </Text>
          <Text style={styles.sectionHint} numberOfLines={1}>
            İhtiyacına en uygun planı seç.
          </Text>
        </View>
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
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
  },
  list: {
    gap: 10,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 108,
    justifyContent: 'center',
  },
  cardDefault: {
    backgroundColor: eventDetail.card,
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  cardSelected: {
    backgroundColor: eventDetail.mintSoft,
    borderColor: SELECTED_BORDER,
    minHeight: 128,
  },
  pressed: {
    opacity: 0.94,
  },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SELECTED_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
    paddingRight: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
    paddingRight: 28,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  effectPill: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 78,
    minWidth: 64,
    flexShrink: 0,
  },
  effectPillText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 13,
  },
});
