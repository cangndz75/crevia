import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  text: string;
};

export function SocialTipBanner({ text }: Props) {
  return (
    <View style={styles.banner}>
      <Ionicons
        name="bulb-outline"
        size={15}
        color={colors.warning}
        style={styles.icon}
      />
      <Text style={styles.text} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
