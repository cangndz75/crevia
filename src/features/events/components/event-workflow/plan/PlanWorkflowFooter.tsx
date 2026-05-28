import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanWorkflowFooterProps = {
  summaryLine: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PlanWorkflowFooter({
  summaryLine,
  onPress,
  disabled = false,
  loading = false,
}: PlanWorkflowFooterProps) {
  const insets = useSafeAreaInsets();
  const inactive = disabled && !loading;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.summaryBar}>
        <Ionicons name="analytics-outline" size={14} color={eventDetail.teal} />
        <Text style={styles.summaryText} numberOfLines={1}>
          {summaryLine}
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.pressable,
          inactive && styles.disabled,
          pressed && !disabled && !loading && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={loading ? 'Yükleniyor' : 'Planı Onayla'}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}>
        <LinearGradient
          colors={
            inactive
              ? ['#8AA8A4', '#7A9894']
              : [eventDetail.tealDark, eventDetail.teal]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}>
          <Ionicons name="checkmark-done-outline" size={22} color="#FFFFFF" />
          <Text style={styles.label}>{loading ? 'Onaylanıyor…' : 'Planı Onayla'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 8,
    backgroundColor: 'rgba(245, 243, 234, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.06)',
    gap: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
    letterSpacing: 0.1,
  },
  pressable: {
    borderRadius: 999,
    overflow: 'hidden',
    ...shadows.card,
  },
  gradient: {
    minHeight: eventDetail.ctaHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});
