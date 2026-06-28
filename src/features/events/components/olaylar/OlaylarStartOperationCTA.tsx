import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';

type OlaylarStartOperationCTAProps = {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
};

export function OlaylarStartOperationCTA({
  onPress,
  disabled = false,
  label = 'Operasyonu Başlat',
}: OlaylarStartOperationCTAProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <LinearGradient
        colors={disabled ? ['#6B5A32', '#4A3F24'] : ['#F0C14B', '#D8A72E', '#B8860B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <Ionicons name="flash" size={18} color="#1A1205" />
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color="#1A1205" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    ...olaylar.shadow,
  },
  gradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1205',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
