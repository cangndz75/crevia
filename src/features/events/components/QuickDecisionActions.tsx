import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import { shadows } from '@/ui/theme/shadows';

type QuickDecisionActionsProps = {
  actions: ResolvedQuickAction[];
  selectedDecisionId: string | null;
  onSelect: (decisionId: string) => void;
};

function ActionCard({
  action,
  selected,
  onPress,
}: {
  action: ResolvedQuickAction;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(selected ? 1 : 0.98);

  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0.98, { duration: 180 });
  }, [scale, selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrap, animStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          selected && styles.cardSelected,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${action.title}, ${action.subtext}`}
        accessibilityState={{ selected }}>
        <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
          <Ionicons
            name={action.icon}
            size={20}
            color={selected ? eventDetail.tealDark : eventDetail.teal}
          />
        </View>
        <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>
          {action.title}
        </Text>
        <Text style={styles.subtext} numberOfLines={2}>
          {action.subtext}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuickDecisionActions({
  actions,
  selectedDecisionId,
  onSelect,
}: QuickDecisionActionsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>HIZLI İŞLEMLER</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {actions.map((action) => (
          <ActionCard
            key={action.decision.id}
            action={action}
            selected={selectedDecisionId === action.decision.id}
            onPress={() => onSelect(action.decision.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    gap: 10,
  },
  sectionTitle: {
    paddingHorizontal: eventDetail.screenPadding,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: eventDetail.textMuted,
  },
  row: {
    paddingHorizontal: eventDetail.screenPadding,
    gap: 10,
    paddingBottom: 2,
  },
  cardWrap: {
    width: 108,
  },
  card: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    minHeight: 118,
    ...shadows.soft,
  },
  cardSelected: {
    borderColor: eventDetail.teal,
    backgroundColor: eventDetail.mintSoft,
    shadowColor: eventDetail.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: {
    opacity: 0.92,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: eventDetail.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  titleSelected: {
    color: eventDetail.tealDark,
  },
  subtext: {
    fontSize: 11,
    lineHeight: 15,
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
});
