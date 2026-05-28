import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  text: string;
};

export function SocialTipBanner({ text }: Props) {
  return (
    <LinearGradient
      colors={['#FFF9EE', '#FFF4E0', '#FFEFD6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}>
      <Ionicons
        name="bulb"
        size={16}
        color={colors.warning}
        style={styles.icon}
      />
      <Text style={styles.text}>{text}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(232,155,46,0.18)',
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5A3E',
    lineHeight: 17,
  },
});
