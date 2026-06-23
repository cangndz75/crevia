import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { teamDispatch } from '@/features/hub/theme/teamDispatchTokens';

type TeamDispatchListToolbarProps = {
  onFilter?: () => void;
  onSort?: () => void;
};

export function TeamDispatchListToolbar({ onFilter, onSort }: TeamDispatchListToolbarProps) {
  return (
    <Animated.View entering={FadeIn.delay(140).duration(300)} style={styles.row}>
      <Text style={styles.title}>EKİP LİSTESİ</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onFilter}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Filtrele">
          <Ionicons name="funnel-outline" size={13} color={teamDispatch.textMuted} />
          <Text style={styles.chipText}>Filtrele</Text>
        </Pressable>
        <Pressable
          onPress={onSort}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Sırala">
          <Ionicons name="swap-vertical-outline" size={13} color={teamDispatch.textMuted} />
          <Text style={styles.chipText}>Sırala</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: teamDispatch.teal,
    letterSpacing: 1.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: teamDispatch.card,
    borderWidth: 1,
    borderColor: teamDispatch.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: teamDispatch.textMuted,
  },
  pressed: {
    opacity: 0.86,
  },
});
