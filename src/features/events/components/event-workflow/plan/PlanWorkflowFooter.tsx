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
};

export function PlanWorkflowFooter({
  onPress,
  disabled = false,
  loading = false,
}: PlanWorkflowFooterProps) {
  const insets = useSafeAreaInsets();
  const inactive = disabled && !loading;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
        accessibilityLabel={loading ? 'Yükleniyor' : WORKFLOW_CTA_LABELS.plan}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}>
        <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
        <Text style={styles.label} numberOfLines={1}>
          {loading ? 'Hazırlanıyor…' : WORKFLOW_CTA_LABELS.plan}
        </Text>
        <View style={styles.ctaSpacer} />
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
    paddingTop: 10,
    backgroundColor: 'rgba(247, 241, 230, 0.92)',
  },
  cta: {
    minHeight: 64,
    borderRadius: 30,
    backgroundColor: eventDetail.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.15,
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
});
