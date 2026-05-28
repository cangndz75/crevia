import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventWorkflowHintBalloon } from '@/features/events/components/event-workflow/EventWorkflowHintBalloon';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

/** Hint balonu ile CTA arasında en az 10px net boşluk */
const HINT_TO_CTA_GAP = 10;

type EventWorkflowFooterProps = {
  hint: string;
  ctaLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function EventWorkflowFooter({
  hint,
  ctaLabel,
  onPress,
  disabled = false,
  loading = false,
}: EventWorkflowFooterProps) {
  const insets = useSafeAreaInsets();
  const inactive = disabled && !loading;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.hintWrap}>
        <EventWorkflowHintBalloon text={hint} />
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
        accessibilityLabel={loading ? 'Yükleniyor' : ctaLabel}
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
          <Ionicons name="book-outline" size={22} color="#FFFFFF" />
          <Text style={styles.label}>{loading ? 'Açılıyor…' : ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  },
  hintWrap: {
    marginBottom: HINT_TO_CTA_GAP,
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
