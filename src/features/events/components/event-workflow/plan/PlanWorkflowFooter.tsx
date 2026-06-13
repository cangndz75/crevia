import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WORKFLOW_CTA_LABELS } from '@/core/ux/uxFlowPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanWorkflowFooterProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  ctaLabel?: string;
};

export function PlanWorkflowFooter({
  onPress,
  disabled = false,
  loading = false,
  ctaLabel,
}: PlanWorkflowFooterProps) {
  const insets = useSafeAreaInsets();
  const inactive = disabled && !loading;
  const label = ctaLabel ?? WORKFLOW_CTA_LABELS.plan;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.cta,
          shadows.card,
          inactive && styles.disabled,
          pressed && !disabled && !loading && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={loading ? 'Yükleniyor' : label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}>
        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        <Text style={styles.label} numberOfLines={1}>
          {loading ? 'Hazırlanıyor...' : label}
        </Text>
        <View style={styles.ctaSpacer} />
      </Pressable>

      <View style={styles.helperRow}>
        <Ionicons name="shield-checkmark-outline" size={13} color={eventDetail.textMuted} />
        <Text style={styles.helperText} numberOfLines={1}>
          Onayladığın plan hemen uygulamaya geçirilecek.
        </Text>
      </View>
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
    backgroundColor: 'rgba(247, 241, 230, 0.94)',
  },
  cta: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: eventDetail.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
  },
  ctaSpacer: {
    width: 24,
  },
  disabled: {
    opacity: 0.72,
    backgroundColor: '#8AA8A4',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  helperRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
});
